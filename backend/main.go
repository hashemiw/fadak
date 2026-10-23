// Fadak backend: accounts, customer cases (messages + private files) and public enquiries.
// Everything stays on this server; nothing is sent to third parties.
package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type config struct {
	addr, dataDir         string
	adminPhone, adminPass string
	origins               []string
	secureCookie          bool
	trustProxy            bool
	seedFile              string
}

func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func loadConfig() config {
	return config{
		addr:         env("ADDR", "127.0.0.1:8080"),
		dataDir:      env("DATA_DIR", "./data"),
		adminPhone:   env("ADMIN_PHONE", ""),
		adminPass:    env("ADMIN_PASSWORD", ""),
		origins:      strings.Split(env("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3100"), ","),
		secureCookie: env("COOKIE_SECURE", "false") == "true",
		trustProxy:   env("TRUST_PROXY", "true") == "true",
		seedFile:     env("SEED_FILE", "./seed/content.json"),
	}
}

func main() {
	cfg := loadConfig()
	s, err := newServer(cfg)
	if err != nil {
		log.Fatal(err)
	}
	srv := &http.Server{Addr: cfg.addr, Handler: s.routes(), ReadHeaderTimeout: 10 * time.Second, ReadTimeout: 60 * time.Second, WriteTimeout: 60 * time.Second}
	log.Printf("fadak backend on %s (data: %s)", cfg.addr, filepath.Clean(cfg.dataDir))
	log.Fatal(srv.ListenAndServe())
}
