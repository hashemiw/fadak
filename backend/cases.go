package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"
)

var statuses = []string{"new", "reviewing", "design", "production", "installation", "done", "closed"}

type caseOut struct {
	ID          int64    `json:"id"`
	Title       string   `json:"title"`
	ProjectType string   `json:"projectType"`
	City        string   `json:"city"`
	Description string   `json:"description"`
	Refs        []string `json:"refs"`
	Status      string   `json:"status"`
	CreatedAt   int64    `json:"createdAt"`
	UpdatedAt   int64    `json:"updatedAt"`
	Owner       *user    `json:"owner,omitempty"` // only for staff
}

type messageOut struct {
	ID         int64  `json:"id"`
	AuthorName string `json:"authorName"`
	AuthorRole string `json:"authorRole"`
	Body       string `json:"body"`
	CreatedAt  int64  `json:"createdAt"`
}

type fileOut struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	Mime       string `json:"mime"`
	Size       int64  `json:"size"`
	CreatedAt  int64  `json:"createdAt"`
	UploaderID int64  `json:"uploaderId"`
}

func scanCase(sc interface{ Scan(...any) error }, withOwner bool) (caseOut, error) {
	var c caseOut
	var refs string
	var o user
	dest := []any{&c.ID, &c.Title, &c.ProjectType, &c.City, &c.Description, &refs, &c.Status, &c.CreatedAt, &c.UpdatedAt}
	if withOwner {
		dest = append(dest, &o.ID, &o.Name, &o.Phone)
	}
	if err := sc.Scan(dest...); err != nil {
		return c, err
	}
	_ = json.Unmarshal([]byte(refs), &c.Refs)
	if c.Refs == nil {
		c.Refs = []string{}
	}
	if withOwner {
		o.Role = "customer"
		c.Owner = &o
	}
	return c, nil
}

const caseCols = `c.id,c.title,c.project_type,c.city,c.description,c.refs,c.status,c.created_at,c.updated_at`

func (s *server) handleListCases(w http.ResponseWriter, _ *http.Request, u user) {
	q, args, owner := `SELECT `+caseCols+` FROM cases c WHERE c.user_id=? ORDER BY c.updated_at DESC`, []any{u.ID}, false
	if u.Role == "admin" {
		q, args, owner = `SELECT `+caseCols+`,u.id,u.name,u.phone FROM cases c JOIN users u ON u.id=c.user_id ORDER BY c.updated_at DESC`, nil, true
	}
	rows, err := s.db.Query(q, args...)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	defer rows.Close()
	out := []caseOut{}
	for rows.Next() {
		c, err := scanCase(rows, owner)
		if err != nil {
			fail(w, 500, "server")
			return
		}
		out = append(out, c)
	}
	writeJSON(w, 200, out)
}

func (s *server) handleCreateCase(w http.ResponseWriter, r *http.Request, u user) {
	var in struct {
		Title, ProjectType, City, Description string
		Refs                                  []string
	}
	if !decode(w, r, &in) {
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	if in.Title == "" || tooLong(in.Title, 120, in.ProjectType, 60, in.City, 60, in.Description, 5000) {
		fail(w, 400, "invalid")
		return
	}
	refs, _ := json.Marshal(cleanRefs(in.Refs))
	now := time.Now().Unix()
	res, err := s.db.Exec(`INSERT INTO cases(user_id,title,project_type,city,description,refs,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)`,
		u.ID, in.Title, in.ProjectType, in.City, in.Description, string(refs), now, now)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	id, _ := res.LastInsertId()
	writeJSON(w, 201, map[string]int64{"id": id})
}

// loadCase returns the case if the user owns it or is staff; 404 otherwise so ids can't be probed.
func (s *server) loadCase(w http.ResponseWriter, r *http.Request, u user) (caseOut, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 404, "not_found")
		return caseOut{}, false
	}
	c, err := scanCase(s.db.QueryRow(`SELECT `+caseCols+`,u.id,u.name,u.phone FROM cases c JOIN users u ON u.id=c.user_id WHERE c.id=?`, id), true)
	if err != nil || (u.Role != "admin" && c.Owner.ID != u.ID) {
		fail(w, 404, "not_found")
		return caseOut{}, false
	}
	if u.Role != "admin" {
		c.Owner = nil
	}
	return c, true
}

func (s *server) handleGetCase(w http.ResponseWriter, r *http.Request, u user) {
	c, ok := s.loadCase(w, r, u)
	if !ok {
		return
	}
	msgs := []messageOut{}
	rows, err := s.db.Query(`SELECT m.id,u.name,u.role,m.body,m.created_at FROM messages m JOIN users u ON u.id=m.author_id WHERE m.case_id=? ORDER BY m.id`, c.ID)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	for rows.Next() {
		var m messageOut
		if rows.Scan(&m.ID, &m.AuthorName, &m.AuthorRole, &m.Body, &m.CreatedAt) == nil {
			msgs = append(msgs, m)
		}
	}
	rows.Close()
	files := []fileOut{}
	rows, err = s.db.Query(`SELECT id,name,mime,size,created_at,uploader_id FROM files WHERE case_id=? ORDER BY id`, c.ID)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	for rows.Next() {
		var f fileOut
		if rows.Scan(&f.ID, &f.Name, &f.Mime, &f.Size, &f.CreatedAt, &f.UploaderID) == nil {
			files = append(files, f)
		}
	}
	rows.Close()
	writeJSON(w, 200, map[string]any{"case": c, "messages": msgs, "files": files})
}

func (s *server) handleAddMessage(w http.ResponseWriter, r *http.Request, u user) {
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
	now := time.Now().Unix()
	if _, err := s.db.Exec(`INSERT INTO messages(case_id,author_id,body,created_at) VALUES(?,?,?,?)`, c.ID, u.ID, in.Body, now); err != nil {
		fail(w, 500, "server")
		return
	}
	_, _ = s.db.Exec(`UPDATE cases SET updated_at=? WHERE id=?`, now, c.ID)
	writeJSON(w, 201, map[string]bool{"ok": true})
}

func (s *server) handleSetStatus(w http.ResponseWriter, r *http.Request, _ user) {
	var in struct{ Status string }
	if !decode(w, r, &in) {
		return
	}
	if !slices.Contains(statuses, in.Status) {
		fail(w, 400, "invalid_status")
		return
	}
	res, err := s.db.Exec(`UPDATE cases SET status=?, updated_at=? WHERE id=?`, in.Status, time.Now().Unix(), r.PathValue("id"))
	if n, _ := res.RowsAffected(); err != nil || n == 0 {
		fail(w, 404, "not_found")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

// handleDeleteMe erases the account, its cases and the stored files.
func (s *server) handleDeleteMe(w http.ResponseWriter, r *http.Request, u user) {
	if u.Role == "admin" {
		fail(w, 403, "forbidden")
		return
	}
	rows, err := s.db.Query(`SELECT f.stored FROM files f JOIN cases c ON c.id=f.case_id WHERE c.user_id=?`, u.ID)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	var stored []string
	for rows.Next() {
		var p string
		if rows.Scan(&p) == nil {
			stored = append(stored, p)
		}
	}
	rows.Close()
	if _, err := s.db.Exec(`DELETE FROM users WHERE id=?`, u.ID); err != nil {
		fail(w, 500, "server")
		return
	}
	for _, p := range stored {
		_ = os.Remove(filepath.Join(s.cfg.dataDir, "uploads", filepath.Base(p)))
	}
	s.handleLogout(w, r)
}

func (s *server) handleInquiry(w http.ResponseWriter, r *http.Request) {
	if !s.enqry.allow(s.clientIP(r), 5, time.Hour) {
		fail(w, http.StatusTooManyRequests, "rate_limited")
		return
	}
	var in struct {
		Name, Phone, ProjectType, City, Message, Locale string
		Refs                                            []string
	}
	if !decode(w, r, &in) {
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	phone := normalizePhone(in.Phone)
	if in.Name == "" || phone == "" || tooLong(in.Name, 100, in.ProjectType, 60, in.City, 60, in.Message, 5000, in.Locale, 5) {
		fail(w, 400, "invalid")
		return
	}
	refs, _ := json.Marshal(cleanRefs(in.Refs))
	if _, err := s.db.Exec(`INSERT INTO inquiries(name,phone,project_type,city,message,refs,locale,created_at) VALUES(?,?,?,?,?,?,?,?)`,
		in.Name, phone, in.ProjectType, in.City, in.Message, string(refs), in.Locale, time.Now().Unix()); err != nil {
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 201, map[string]bool{"ok": true})
}

func (s *server) handleListInquiries(w http.ResponseWriter, _ *http.Request, _ user) {
	rows, err := s.db.Query(`SELECT id,name,phone,project_type,city,message,refs,locale,created_at FROM inquiries ORDER BY id DESC LIMIT 500`)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	defer rows.Close()
	type inq struct {
		ID                                              int64 `json:"id"`
		Name, Phone, ProjectType, City, Message, Locale string
		Refs                                            []string `json:"refs"`
		CreatedAt                                       int64    `json:"createdAt"`
	}
	out := []inq{}
	for rows.Next() {
		var q inq
		var refs string
		if err := rows.Scan(&q.ID, &q.Name, &q.Phone, &q.ProjectType, &q.City, &q.Message, &refs, &q.Locale, &q.CreatedAt); err != nil && !errors.Is(err, sql.ErrNoRows) {
			continue
		}
		_ = json.Unmarshal([]byte(refs), &q.Refs)
		out = append(out, q)
	}
	writeJSON(w, 200, out)
}
