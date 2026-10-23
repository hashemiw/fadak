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
	ID            int64    `json:"id"`
	Title         string   `json:"title"`
	ProjectType   string   `json:"projectType"`
	City          string   `json:"city"`
	Description   string   `json:"description"`
	Refs          []string `json:"refs"`
	Status        string   `json:"status"`
	CreatedAt     int64    `json:"createdAt"`
	UpdatedAt     int64    `json:"updatedAt"`
	Owner         *user    `json:"owner,omitempty"` // only for staff
	LastActorRole string   `json:"lastActorRole"`
	Unread        bool     `json:"unread"`                  // something new for the viewer since they last opened it
	AwaitingReply bool     `json:"awaitingReply,omitempty"` // staff only: customer spoke last and the project is open
	MessageCount  int      `json:"messageCount"`
	FileCount     int      `json:"fileCount"`
}

type eventOut struct {
	ID        int64  `json:"id"`
	Kind      string `json:"kind"`
	Detail    string `json:"detail"`
	ActorRole string `json:"actorRole"`
	CreatedAt int64  `json:"createdAt"`
}

type noteOut struct {
	ID         int64  `json:"id"`
	AuthorName string `json:"authorName"`
	Body       string `json:"body"`
	CreatedAt  int64  `json:"createdAt"`
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

func scanCase(sc interface{ Scan(...any) error }, withOwner bool, viewerRole string) (caseOut, error) {
	var c caseOut
	var refs string
	var o user
	var staffSeen, custSeen int64
	dest := []any{&c.ID, &c.Title, &c.ProjectType, &c.City, &c.Description, &refs, &c.Status, &c.CreatedAt, &c.UpdatedAt,
		&c.LastActorRole, &staffSeen, &custSeen, &c.MessageCount, &c.FileCount}
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
	if viewerRole == "admin" {
		c.Unread = c.LastActorRole == "customer" && c.UpdatedAt > staffSeen
		c.AwaitingReply = c.LastActorRole == "customer" && c.Status != "done" && c.Status != "closed"
	} else {
		c.Unread = c.LastActorRole == "admin" && c.UpdatedAt > custSeen
	}
	if withOwner {
		o.Role = "customer"
		c.Owner = &o
	}
	return c, nil
}

const caseCols = `c.id,c.title,c.project_type,c.city,c.description,c.refs,c.status,c.created_at,c.updated_at,
	c.last_actor_role,c.staff_seen_at,c.customer_seen_at,
	(SELECT COUNT(*) FROM messages WHERE case_id=c.id),(SELECT COUNT(*) FROM files WHERE case_id=c.id)`

// touch records activity on a case: it bumps updated_at and marks who acted last, which drives the unread/awaiting flags.
func (s *server) touch(caseID int64, role string) {
	_, _ = s.db.Exec(`UPDATE cases SET updated_at=?, last_actor_role=? WHERE id=?`, time.Now().Unix(), role, caseID)
}

func (s *server) logEvent(caseID, actorID int64, kind, detail string) {
	_, _ = s.db.Exec(`INSERT INTO case_events(case_id,actor_id,kind,detail,created_at) VALUES(?,?,?,?,?)`, caseID, actorID, kind, detail, time.Now().Unix())
}

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
		c, err := scanCase(rows, owner, u.Role)
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
	s.logEvent(id, u.ID, "created", "")
	writeJSON(w, 201, map[string]int64{"id": id})
}

// loadCase returns the case if the user owns it or is staff; 404 otherwise so ids can't be probed.
func (s *server) loadCase(w http.ResponseWriter, r *http.Request, u user) (caseOut, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		fail(w, 404, "not_found")
		return caseOut{}, false
	}
	c, err := scanCase(s.db.QueryRow(`SELECT `+caseCols+`,u.id,u.name,u.phone FROM cases c JOIN users u ON u.id=c.user_id WHERE c.id=?`, id), true, u.Role)
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
	events := []eventOut{}
	rows, err = s.db.Query(`SELECT e.id,e.kind,e.detail,u.role,e.created_at FROM case_events e JOIN users u ON u.id=e.actor_id WHERE e.case_id=? ORDER BY e.id`, c.ID)
	if err == nil {
		for rows.Next() {
			var e eventOut
			if rows.Scan(&e.ID, &e.Kind, &e.Detail, &e.ActorRole, &e.CreatedAt) == nil {
				events = append(events, e)
			}
		}
		rows.Close()
	}
	out := map[string]any{"case": c, "messages": msgs, "files": files, "events": events}
	if u.Role == "admin" {
		notes := []noteOut{}
		rows, err = s.db.Query(`SELECT n.id,u.name,n.body,n.created_at FROM case_notes n JOIN users u ON u.id=n.author_id WHERE n.case_id=? ORDER BY n.id`, c.ID)
		if err == nil {
			for rows.Next() {
				var n noteOut
				if rows.Scan(&n.ID, &n.AuthorName, &n.Body, &n.CreatedAt) == nil {
					notes = append(notes, n)
				}
			}
			rows.Close()
		}
		out["notes"] = notes
		_, _ = s.db.Exec(`UPDATE cases SET staff_seen_at=? WHERE id=?`, time.Now().Unix(), c.ID)
	} else {
		_, _ = s.db.Exec(`UPDATE cases SET customer_seen_at=? WHERE id=?`, time.Now().Unix(), c.ID)
	}
	writeJSON(w, 200, out)
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
	if _, err := s.db.Exec(`INSERT INTO messages(case_id,author_id,body,created_at) VALUES(?,?,?,?)`, c.ID, u.ID, in.Body, time.Now().Unix()); err != nil {
		fail(w, 500, "server")
		return
	}
	s.touch(c.ID, u.Role)
	writeJSON(w, 201, map[string]bool{"ok": true})
}

func (s *server) handleSetStatus(w http.ResponseWriter, r *http.Request, u user) {
	var in struct{ Status string }
	if !decode(w, r, &in) {
		return
	}
	if !slices.Contains(statuses, in.Status) {
		fail(w, 400, "invalid_status")
		return
	}
	id, _ := strconv.ParseInt(r.PathValue("id"), 10, 64)
	var old string
	if s.db.QueryRow(`SELECT status FROM cases WHERE id=?`, id).Scan(&old) != nil {
		fail(w, 404, "not_found")
		return
	}
	if old != in.Status {
		_, _ = s.db.Exec(`UPDATE cases SET status=? WHERE id=?`, in.Status, id)
		s.logEvent(id, u.ID, "status", old+">"+in.Status)
		s.touch(id, "admin")
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
	rows, err := s.db.Query(`SELECT id,name,phone,project_type,city,message,refs,locale,created_at,handled FROM inquiries ORDER BY id DESC LIMIT 500`)
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
		Handled                                         bool     `json:"handled"`
	}
	out := []inq{}
	for rows.Next() {
		var q inq
		var refs string
		if err := rows.Scan(&q.ID, &q.Name, &q.Phone, &q.ProjectType, &q.City, &q.Message, &refs, &q.Locale, &q.CreatedAt, &q.Handled); err != nil && !errors.Is(err, sql.ErrNoRows) {
			continue
		}
		_ = json.Unmarshal([]byte(refs), &q.Refs)
		out = append(out, q)
	}
	writeJSON(w, 200, out)
}
