package main

import (
	"encoding/json"
	"net"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

var phoneRe = regexp.MustCompile(`^0\d{10}$`)

// normalizePhone accepts Persian/Arabic digits, +98/0098 and separators; returns "" when invalid.
func normalizePhone(raw string) string {
	var b strings.Builder
	for _, r := range raw {
		switch {
		case r >= '۰' && r <= '۹':
			b.WriteRune('0' + (r - '۰'))
		case r >= '٠' && r <= '٩':
			b.WriteRune('0' + (r - '٠'))
		case r == ' ' || r == '-' || r == '(' || r == ')':
		default:
			b.WriteRune(r)
		}
	}
	s := b.String()
	for _, p := range []string{"+98", "0098"} {
		if strings.HasPrefix(s, p) {
			s = "0" + s[len(p):]
			break
		}
	}
	if phoneRe.MatchString(s) {
		return s
	}
	return ""
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func fail(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, map[string]string{"error": code})
}

func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(v); err != nil {
		fail(w, http.StatusBadRequest, "bad_request")
		return false
	}
	return true
}

// tooLong reports whether any value exceeds its limit, counted in runes.
func tooLong(pairs ...any) bool {
	for i := 0; i+1 < len(pairs); i += 2 {
		if utf8.RuneCountInString(pairs[i].(string)) > pairs[i+1].(int) {
			return true
		}
	}
	return false
}

// limiter is a sliding-window counter per key, kept in memory.
type limiter struct {
	mu   sync.Mutex
	hits map[string][]time.Time
}

func newLimiter() *limiter { return &limiter{hits: map[string][]time.Time{}} }

func (l *limiter) allow(key string, n int, window time.Duration) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	kept := l.hits[key][:0]
	for _, t := range l.hits[key] {
		if now.Sub(t) < window {
			kept = append(kept, t)
		}
	}
	if len(kept) >= n {
		l.hits[key] = kept
		return false
	}
	l.hits[key] = append(kept, now)
	return true
}

func (s *server) clientIP(r *http.Request) string {
	if s.cfg.trustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			return strings.TrimSpace(strings.Split(xff, ",")[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// cleanRefs keeps only plausible gallery ids (e.g. "b1-04") and caps the list.
var refRe = regexp.MustCompile(`^b\d{1,2}-\d{2}$`)

func cleanRefs(in []string) []string {
	out := []string{}
	for _, id := range in {
		if refRe.MatchString(id) && len(out) < 20 {
			out = append(out, id)
		}
	}
	return out
}
