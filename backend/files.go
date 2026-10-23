package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const (
	maxFileSize     = 10 << 20
	maxFilesPerCase = 20
)

var allowedTypes = map[string]bool{"image/jpeg": true, "image/png": true, "image/webp": true, "application/pdf": true}

func (s *server) handleUpload(w http.ResponseWriter, r *http.Request, u user) {
	c, ok := s.loadCase(w, r, u)
	if !ok {
		return
	}
	var n int
	_ = s.db.QueryRow(`SELECT COUNT(*) FROM files WHERE case_id=?`, c.ID).Scan(&n)
	if n >= maxFilesPerCase {
		fail(w, 400, "too_many_files")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxFileSize+(1<<20))
	f, hdr, err := r.FormFile("file")
	if err != nil {
		fail(w, 400, "bad_request")
		return
	}
	defer f.Close()
	head := make([]byte, 512)
	hn, _ := io.ReadFull(f, head)
	// The type comes from the bytes, not from the client-supplied header or extension.
	mt, _, _ := mime.ParseMediaType(http.DetectContentType(head[:hn]))
	if !allowedTypes[mt] {
		fail(w, 415, "unsupported_type")
		return
	}
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		fail(w, 500, "server")
		return
	}
	raw := make([]byte, 16)
	_, _ = rand.Read(raw)
	stored := hex.EncodeToString(raw)
	path := filepath.Join(s.cfg.dataDir, "uploads", stored)
	out, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	size, err := io.Copy(out, io.LimitReader(f, maxFileSize+1))
	out.Close()
	if err != nil || size > maxFileSize {
		os.Remove(path)
		fail(w, http.StatusRequestEntityTooLarge, "too_large")
		return
	}
	name := filepath.Base(strings.ReplaceAll(hdr.Filename, "\\", "/"))
	if name == "" || name == "." || len(name) > 150 {
		name = "file"
	}
	now := time.Now().Unix()
	if _, err := s.db.Exec(`INSERT INTO files(case_id,uploader_id,name,mime,size,stored,created_at) VALUES(?,?,?,?,?,?,?)`, c.ID, u.ID, name, mt, size, stored, now); err != nil {
		os.Remove(path)
		fail(w, 500, "server")
		return
	}
	_, _ = s.db.Exec(`UPDATE cases SET updated_at=? WHERE id=?`, now, c.ID)
	writeJSON(w, 201, map[string]bool{"ok": true})
}

type fileRow struct {
	id, caseID, uploader int64
	name, mime, stored   string
}

func (s *server) loadFile(w http.ResponseWriter, r *http.Request, u user) (fileRow, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	var f fileRow
	var owner int64
	if err == nil {
		err = s.db.QueryRow(`SELECT f.id,f.case_id,f.uploader_id,f.name,f.mime,f.stored,c.user_id FROM files f JOIN cases c ON c.id=f.case_id WHERE f.id=?`, id).
			Scan(&f.id, &f.caseID, &f.uploader, &f.name, &f.mime, &f.stored, &owner)
	}
	if err != nil || (u.Role != "admin" && owner != u.ID) {
		if err != nil && !errors.Is(err, sql.ErrNoRows) && !errors.Is(err, strconv.ErrSyntax) {
			fail(w, 500, "server")
		} else {
			fail(w, 404, "not_found")
		}
		return f, false
	}
	return f, true
}

func (s *server) handleDownload(w http.ResponseWriter, r *http.Request, u user) {
	f, ok := s.loadFile(w, r, u)
	if !ok {
		return
	}
	fh, err := os.Open(filepath.Join(s.cfg.dataDir, "uploads", filepath.Base(f.stored)))
	if err != nil {
		fail(w, 404, "not_found")
		return
	}
	defer fh.Close()
	w.Header().Set("Content-Type", f.mime)
	w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": f.name}))
	w.Header().Set("Cache-Control", "private, no-store")
	_, _ = io.Copy(w, fh)
}

func (s *server) handleDeleteFile(w http.ResponseWriter, r *http.Request, u user) {
	f, ok := s.loadFile(w, r, u)
	if !ok {
		return
	}
	if u.Role != "admin" && f.uploader != u.ID {
		fail(w, 403, "forbidden")
		return
	}
	if _, err := s.db.Exec(`DELETE FROM files WHERE id=?`, f.id); err != nil {
		fail(w, 500, "server")
		return
	}
	_ = os.Remove(filepath.Join(s.cfg.dataDir, "uploads", filepath.Base(f.stored)))
	writeJSON(w, 200, map[string]bool{"ok": true})
}
