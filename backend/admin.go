package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

func (s *server) handleStats(w http.ResponseWriter, _ *http.Request, _ user) {
	out := map[string]any{}
	by := map[string]int{}
	rows, err := s.db.Query(`SELECT status,COUNT(*) FROM cases GROUP BY status`)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	for rows.Next() {
		var st string
		var n int
		if rows.Scan(&st, &n) == nil {
			by[st] = n
		}
	}
	rows.Close()
	var awaiting, unread, inquiries, customers int
	_ = s.db.QueryRow(`SELECT COUNT(*) FROM cases WHERE last_actor_role='customer' AND status NOT IN ('done','closed')`).Scan(&awaiting)
	_ = s.db.QueryRow(`SELECT COUNT(*) FROM cases WHERE last_actor_role='customer' AND updated_at>staff_seen_at`).Scan(&unread)
	_ = s.db.QueryRow(`SELECT COUNT(*) FROM inquiries WHERE handled=0`).Scan(&inquiries)
	_ = s.db.QueryRow(`SELECT COUNT(*) FROM users WHERE role='customer'`).Scan(&customers)
	out["byStatus"], out["awaitingReply"], out["unread"], out["newInquiries"], out["customers"] = by, awaiting, unread, inquiries, customers
	writeJSON(w, 200, out)
}

func (s *server) handleCustomers(w http.ResponseWriter, _ *http.Request, _ user) {
	rows, err := s.db.Query(`SELECT u.id,u.name,u.phone,u.created_at,COUNT(c.id),COALESCE(MAX(c.updated_at),0)
		FROM users u LEFT JOIN cases c ON c.user_id=u.id WHERE u.role='customer' GROUP BY u.id ORDER BY u.id DESC`)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	defer rows.Close()
	type cust struct {
		ID           int64  `json:"id"`
		Name         string `json:"name"`
		Phone        string `json:"phone"`
		CreatedAt    int64  `json:"createdAt"`
		Cases        int    `json:"cases"`
		LastActivity int64  `json:"lastActivity"`
	}
	out := []cust{}
	for rows.Next() {
		var c cust
		if rows.Scan(&c.ID, &c.Name, &c.Phone, &c.CreatedAt, &c.Cases, &c.LastActivity) == nil {
			out = append(out, c)
		}
	}
	writeJSON(w, 200, out)
}

func (s *server) handleAddNote(w http.ResponseWriter, r *http.Request, u user) {
	c, ok := s.loadCase(w, r, u)
	if !ok {
		return
	}
	var in struct{ Body string }
	if !decode(w, r, &in) {
		return
	}
	in.Body = strings.TrimSpace(in.Body)
	if in.Body == "" || tooLong(in.Body, 5000) {
		fail(w, 400, "invalid")
		return
	}
	if _, err := s.db.Exec(`INSERT INTO case_notes(case_id,author_id,body,created_at) VALUES(?,?,?,?)`, c.ID, u.ID, in.Body, time.Now().Unix()); err != nil {
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 201, map[string]bool{"ok": true})
}

func (s *server) handleDeleteNote(w http.ResponseWriter, r *http.Request, _ user) {
	id, _ := strconv.ParseInt(r.PathValue("id"), 10, 64)
	_, _ = s.db.Exec(`DELETE FROM case_notes WHERE id=?`, id)
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func (s *server) handleInquiryHandled(w http.ResponseWriter, r *http.Request, _ user) {
	var in struct{ Handled bool }
	if !decode(w, r, &in) {
		return
	}
	v := 0
	if in.Handled {
		v = 1
	}
	res, err := s.db.Exec(`UPDATE inquiries SET handled=? WHERE id=?`, v, r.PathValue("id"))
	if n, _ := res.RowsAffected(); err != nil || n == 0 {
		fail(w, 404, "not_found")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

// handleResetPassword lets staff set a new password for a customer (there is no email/SMS reset yet) and signs them out everywhere.
func (s *server) handleResetPassword(w http.ResponseWriter, r *http.Request, _ user) {
	var in struct{ Password string }
	if !decode(w, r, &in) {
		return
	}
	if utf8.RuneCountInString(in.Password) < 8 || len(in.Password) > 72 {
		fail(w, 400, "invalid_password")
		return
	}
	h, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	id := r.PathValue("id")
	res, err := s.db.Exec(`UPDATE users SET password_hash=? WHERE id=? AND role='customer'`, string(h), id)
	if n, _ := res.RowsAffected(); err != nil || n == 0 {
		fail(w, 404, "not_found")
		return
	}
	_, _ = s.db.Exec(`DELETE FROM sessions WHERE user_id=?`, id)
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func (s *server) handleCreateStaff(w http.ResponseWriter, r *http.Request, _ user) {
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
		fail(w, 400, "invalid_password")
		return
	}
	h, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	if _, err := s.db.Exec(`INSERT INTO users(phone,name,password_hash,role,created_at) VALUES(?,?,?,'admin',?)`, phone, in.Name, string(h), time.Now().Unix()); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			fail(w, http.StatusConflict, "phone_taken")
			return
		}
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 201, map[string]bool{"ok": true})
}

func (s *server) handleListStaff(w http.ResponseWriter, _ *http.Request, _ user) {
	rows, err := s.db.Query(`SELECT id,name,phone FROM users WHERE role='admin' ORDER BY id`)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	defer rows.Close()
	out := []user{}
	for rows.Next() {
		u := user{Role: "admin"}
		if rows.Scan(&u.ID, &u.Name, &u.Phone) == nil {
			out = append(out, u)
		}
	}
	writeJSON(w, 200, out)
}
