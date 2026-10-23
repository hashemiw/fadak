package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"net/http"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

const (
	cookieName = "fadak_session"
	sessionTTL = 30 * 24 * time.Hour
)

type server struct {
	cfg                    config
	db                     *sql.DB
	login, register, enqry *limiter
}

type user struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Phone string `json:"phone"`
	Role  string `json:"role"`
}

type ctxKey struct{}

func newServer(cfg config) (*server, error) {
	db, err := openDB(cfg.dataDir)
	if err != nil {
		return nil, err
	}
	s := &server{cfg: cfg, db: db, login: newLimiter(), register: newLimiter(), enqry: newLimiter()}
	if p := normalizePhone(cfg.adminPhone); p != "" && len(cfg.adminPass) >= 8 {
		if err := s.seedAdmin(p, cfg.adminPass); err != nil {
			return nil, err
		}
	}
	return s, nil
}

// seedAdmin creates the staff account, or resets its password to the configured one.
func (s *server) seedAdmin(phone, pass string) error {
	h, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(`INSERT INTO users(phone,name,password_hash,role,created_at) VALUES(?,?,?,'admin',?)
		ON CONFLICT(phone) DO UPDATE SET password_hash=excluded.password_hash, role='admin'`, phone, "Fadak", string(h), time.Now().Unix())
	return err
}

func (s *server) routes() http.Handler {
	m := http.NewServeMux()
	m.HandleFunc("GET /api/health", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, 200, map[string]string{"ok": "1"}) })
	m.HandleFunc("POST /api/auth/register", s.handleRegister)
	m.HandleFunc("POST /api/auth/login", s.handleLogin)
	m.HandleFunc("POST /api/auth/logout", s.handleLogout)
	m.HandleFunc("GET /api/me", s.auth(s.handleMe))
	m.HandleFunc("DELETE /api/me", s.auth(s.handleDeleteMe))
	m.HandleFunc("POST /api/inquiries", s.handleInquiry)
	m.HandleFunc("GET /api/cases", s.auth(s.handleListCases))
	m.HandleFunc("POST /api/cases", s.auth(s.handleCreateCase))
	m.HandleFunc("GET /api/cases/{id}", s.auth(s.handleGetCase))
	m.HandleFunc("POST /api/cases/{id}/messages", s.auth(s.handleAddMessage))
	m.HandleFunc("POST /api/cases/{id}/files", s.auth(s.handleUpload))
	m.HandleFunc("GET /api/files/{id}", s.auth(s.handleDownload))
	m.HandleFunc("DELETE /api/files/{id}", s.auth(s.handleDeleteFile))
	m.HandleFunc("PATCH /api/admin/cases/{id}", s.auth(s.admin(s.handleSetStatus)))
	m.HandleFunc("GET /api/admin/inquiries", s.auth(s.admin(s.handleListInquiries)))
	m.HandleFunc("PATCH /api/admin/inquiries/{id}", s.auth(s.admin(s.handleInquiryHandled)))
	m.HandleFunc("GET /api/admin/stats", s.auth(s.admin(s.handleStats)))
	m.HandleFunc("GET /api/admin/customers", s.auth(s.admin(s.handleCustomers)))
	m.HandleFunc("POST /api/admin/users/{id}/password", s.auth(s.admin(s.handleResetPassword)))
	m.HandleFunc("GET /api/admin/staff", s.auth(s.admin(s.handleListStaff)))
	m.HandleFunc("POST /api/admin/staff", s.auth(s.admin(s.handleCreateStaff)))
	m.HandleFunc("POST /api/admin/cases/{id}/notes", s.auth(s.admin(s.handleAddNote)))
	m.HandleFunc("DELETE /api/admin/notes/{id}", s.auth(s.admin(s.handleDeleteNote)))
	return s.secure(m)
}

// secure adds headers and rejects cross-site state changes: mutating requests need an allowed Origin.
func (s *server) secure(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "same-origin")
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			if !slices.Contains(s.cfg.origins, r.Header.Get("Origin")) {
				fail(w, http.StatusForbidden, "forbidden_origin")
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func (s *server) auth(next func(http.ResponseWriter, *http.Request, user)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, ok := s.currentUser(r)
		if !ok {
			fail(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, u)), u)
	}
}

func (s *server) admin(next func(http.ResponseWriter, *http.Request, user)) func(http.ResponseWriter, *http.Request, user) {
	return func(w http.ResponseWriter, r *http.Request, u user) {
		if u.Role != "admin" {
			fail(w, http.StatusForbidden, "forbidden")
			return
		}
		next(w, r, u)
	}
}

func hashToken(t string) string { h := sha256.Sum256([]byte(t)); return hex.EncodeToString(h[:]) }

func (s *server) currentUser(r *http.Request) (user, bool) {
	c, err := r.Cookie(cookieName)
	if err != nil {
		return user{}, false
	}
	var u user
	err = s.db.QueryRow(`SELECT u.id,u.name,u.phone,u.role FROM sessions s JOIN users u ON u.id=s.user_id
		WHERE s.token_hash=? AND s.expires_at>?`, hashToken(c.Value), time.Now().Unix()).Scan(&u.ID, &u.Name, &u.Phone, &u.Role)
	return u, err == nil
}

func (s *server) startSession(w http.ResponseWriter, userID int64) error {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	exp := time.Now().Add(sessionTTL)
	if _, err := s.db.Exec(`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)`, hashToken(token), userID, exp.Unix()); err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{Name: cookieName, Value: token, Path: "/", Expires: exp, HttpOnly: true, Secure: s.cfg.secureCookie, SameSite: http.SameSiteLaxMode})
	return nil
}

type credentials struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

func (s *server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if !s.register.allow(s.clientIP(r), 5, time.Hour) {
		fail(w, http.StatusTooManyRequests, "rate_limited")
		return
	}
	var in credentials
	if !decode(w, r, &in) {
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	phone := normalizePhone(in.Phone)
	switch {
	case in.Name == "" || utf8.RuneCountInString(in.Name) > 100:
		fail(w, 400, "invalid_name")
		return
	case phone == "":
		fail(w, 400, "invalid_phone")
		return
	case utf8.RuneCountInString(in.Password) < 8 || len(in.Password) > 72:
		// bcrypt ignores bytes past 72, so longer passwords are rejected rather than silently truncated.
		fail(w, 400, "invalid_password")
		return
	}
	h, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	res, err := s.db.Exec(`INSERT INTO users(phone,name,password_hash,created_at) VALUES(?,?,?,?)`, phone, in.Name, string(h), time.Now().Unix())
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			fail(w, http.StatusConflict, "phone_taken")
			return
		}
		fail(w, 500, "server")
		return
	}
	id, _ := res.LastInsertId()
	if s.startSession(w, id) != nil {
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 201, user{ID: id, Name: in.Name, Phone: phone, Role: "customer"})
}

func (s *server) handleLogin(w http.ResponseWriter, r *http.Request) {
	ip := s.clientIP(r)
	if !s.login.allow(ip, 10, 15*time.Minute) {
		fail(w, http.StatusTooManyRequests, "rate_limited")
		return
	}
	var in credentials
	if !decode(w, r, &in) {
		return
	}
	var u user
	var hash string
	err := s.db.QueryRow(`SELECT id,name,phone,role,password_hash FROM users WHERE phone=?`, normalizePhone(in.Phone)).Scan(&u.ID, &u.Name, &u.Phone, &u.Role, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		_ = bcrypt.CompareHashAndPassword([]byte("$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5BWNmnUq1j1FEjt0gU5Z2rH1ZQ6Wy"), []byte(in.Password)) // equalise timing
		fail(w, 401, "invalid_credentials")
		return
	}
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		fail(w, 401, "invalid_credentials")
		return
	}
	if s.startSession(w, u.ID) != nil {
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 200, u)
}

func (s *server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(cookieName); err == nil {
		_, _ = s.db.Exec(`DELETE FROM sessions WHERE token_hash=?`, hashToken(c.Value))
	}
	http.SetCookie(w, &http.Cookie{Name: cookieName, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: s.cfg.secureCookie, SameSite: http.SameSiteLaxMode})
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func (s *server) handleMe(w http.ResponseWriter, _ *http.Request, u user) { writeJSON(w, 200, u) }
