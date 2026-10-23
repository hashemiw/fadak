package main

import (
	"bytes"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	_ "golang.org/x/image/webp"
)

// Site content (gallery records and page texts) is edited from the admin panel and read publicly by the website.

type localized struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Alt         string   `json:"alt"`
	Subcategory string   `json:"subcategory"`
	WorkTypes   []string `json:"workTypes"`
	Tags        []string `json:"tags"`
}

type galleryItem struct {
	ID                string    `json:"id"`
	Slug              string    `json:"slug"`
	Batch             int       `json:"batch"`
	OriginalPath      string    `json:"originalPath"`
	ImagePath         string    `json:"imagePath"`
	Width             int       `json:"width"`
	Height            int       `json:"height"`
	Category          string    `json:"category"`
	Featured          bool      `json:"featured"`
	ContentStatus     string    `json:"contentStatus"`
	ProjectID         *string   `json:"projectId"`
	Watermark         bool      `json:"watermark,omitempty"`
	Kind              string    `json:"kind,omitempty"`
	RelatedIDs        []string  `json:"relatedIds,omitempty"`
	AlsoOriginalPaths []string  `json:"alsoOriginalPaths,omitempty"`
	Hidden            bool      `json:"hidden"`
	FA                localized `json:"fa"`
	EN                localized `json:"en"`
}

var (
	idRe     = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,40}$`)
	slugRe   = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
	mediaRe  = regexp.MustCompile(`^[0-9a-f]{32}\.(jpg|png|webp)$`)
	handleRe = regexp.MustCompile(`^[A-Za-z0-9._]{1,64}$`)
)

var categoriesSet = []string{"office", "reception", "residential", "decor"}

func (l localized) valid() bool {
	if strings.TrimSpace(l.Title) == "" || strings.TrimSpace(l.Alt) == "" || tooLong(l.Title, 200, l.Description, 2000, l.Alt, 300, l.Subcategory, 100) {
		return false
	}
	if len(l.WorkTypes) > 10 || len(l.Tags) > 20 {
		return false
	}
	for _, v := range append(slices.Clone(l.WorkTypes), l.Tags...) {
		if tooLong(v, 60) {
			return false
		}
	}
	return true
}

func (g galleryItem) validate() bool {
	okPath := strings.HasPrefix(g.ImagePath, "/assets/gallery/") || strings.HasPrefix(g.ImagePath, "/api/public/media/")
	return idRe.MatchString(g.ID) && slugRe.MatchString(g.Slug) && len(g.Slug) <= 80 && okPath && !strings.Contains(g.ImagePath, "..") &&
		g.Width > 0 && g.Height > 0 && g.Width < 20000 && g.Height < 20000 &&
		slices.Contains(categoriesSet, g.Category) && (g.ContentStatus == "unverified" || g.ContentStatus == "verified") &&
		(g.Kind == "" || g.Kind == "reference-3d") && g.FA.valid() && g.EN.valid() && !tooLong(g.OriginalPath, 500) &&
		(g.ProjectID == nil || !tooLong(*g.ProjectID, 80))
}

func nilToEmpty(l *localized) {
	if l.WorkTypes == nil {
		l.WorkTypes = []string{}
	}
	if l.Tags == nil {
		l.Tags = []string{}
	}
}

// loadGallery returns every record in display order; hidden ones only when includeHidden.
func (s *server) loadGallery(includeHidden bool) ([]galleryItem, error) {
	rows, err := s.db.Query(`SELECT data FROM gallery_items ORDER BY sort_order, rowid`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []galleryItem{}
	for rows.Next() {
		var raw string
		var g galleryItem
		if rows.Scan(&raw) != nil || json.Unmarshal([]byte(raw), &g) != nil {
			continue
		}
		nilToEmpty(&g.FA)
		nilToEmpty(&g.EN)
		if g.Hidden && !includeHidden {
			continue
		}
		out = append(out, g)
	}
	return out, nil
}

// publicItem drops internal-only fields before a record leaves the server unauthenticated.
func publicItem(g galleryItem) galleryItem {
	g.OriginalPath, g.AlsoOriginalPaths, g.RelatedIDs = "", nil, nil
	return g
}

func (s *server) handlePublicGallery(w http.ResponseWriter, _ *http.Request) {
	items, err := s.loadGallery(false)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	for i := range items {
		items[i] = publicItem(items[i])
	}
	writeJSON(w, 200, items)
}

func (s *server) handleAdminGallery(w http.ResponseWriter, _ *http.Request, _ user) {
	items, err := s.loadGallery(true)
	if err != nil {
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 200, items)
}

func (s *server) saveGallery(g galleryItem, create bool) error {
	raw, _ := json.Marshal(g)
	if create {
		var max sql.NullInt64
		_ = s.db.QueryRow(`SELECT MAX(sort_order) FROM gallery_items`).Scan(&max)
		_, err := s.db.Exec(`INSERT INTO gallery_items(id,slug,sort_order,data,updated_at) VALUES(?,?,?,?,?)`, g.ID, g.Slug, max.Int64+1, string(raw), time.Now().Unix())
		return err
	}
	_, err := s.db.Exec(`UPDATE gallery_items SET data=?, updated_at=? WHERE id=?`, string(raw), time.Now().Unix(), g.ID)
	return err
}

func (s *server) handleCreateGallery(w http.ResponseWriter, r *http.Request, _ user) {
	var g galleryItem
	if !decodeBig(w, r, &g) {
		return
	}
	nilToEmpty(&g.FA)
	nilToEmpty(&g.EN)
	if g.Batch == 0 {
		g.Batch = 3
	}
	if !g.validate() {
		fail(w, 400, "invalid")
		return
	}
	if err := s.saveGallery(g, true); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			fail(w, 409, "duplicate")
			return
		}
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 201, g)
}

func (s *server) handleUpdateGallery(w http.ResponseWriter, r *http.Request, _ user) {
	var g galleryItem
	if !decodeBig(w, r, &g) {
		return
	}
	g.ID = r.PathValue("id") // id is fixed by the URL
	nilToEmpty(&g.FA)
	nilToEmpty(&g.EN)
	var oldRaw string
	if err := s.db.QueryRow(`SELECT data FROM gallery_items WHERE id=?`, g.ID).Scan(&oldRaw); err != nil {
		fail(w, 404, "not_found")
		return
	}
	var old galleryItem
	_ = json.Unmarshal([]byte(oldRaw), &old)
	g.Slug = old.Slug // links must stay stable
	if !g.validate() {
		fail(w, 400, "invalid")
		return
	}
	if err := s.saveGallery(g, false); err != nil {
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 200, g)
}

func (s *server) handleDeleteGallery(w http.ResponseWriter, r *http.Request, _ user) {
	res, err := s.db.Exec(`DELETE FROM gallery_items WHERE id=?`, r.PathValue("id"))
	if n, _ := res.RowsAffected(); err != nil || n == 0 {
		fail(w, 404, "not_found")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func (s *server) handleReorderGallery(w http.ResponseWriter, r *http.Request, _ user) {
	var in struct{ IDs []string }
	if !decode(w, r, &in) {
		return
	}
	tx, err := s.db.Begin()
	if err != nil {
		fail(w, 500, "server")
		return
	}
	defer tx.Rollback()
	for i, id := range in.IDs {
		if _, err := tx.Exec(`UPDATE gallery_items SET sort_order=? WHERE id=?`, i, id); err != nil {
			fail(w, 500, "server")
			return
		}
	}
	if tx.Commit() != nil {
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

// decodeBig is decode with room for a full bilingual record.
func decodeBig(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 256<<10)
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		fail(w, http.StatusBadRequest, "bad_request")
		return false
	}
	return true
}

// ---- site texts and contact details ----

type contactInfo struct {
	Phone     string            `json:"phone"`
	WhatsApp  string            `json:"whatsapp"`
	Instagram string            `json:"instagram"`
	Telegram  string            `json:"telegram"`
	Address   map[string]string `json:"address"`
}

func (c contactInfo) valid() bool {
	phoneOK := c.Phone == "" || regexp.MustCompile(`^\+?[0-9]{8,15}$`).MatchString(c.Phone)
	waOK := c.WhatsApp == "" || regexp.MustCompile(`^[0-9]{8,15}$`).MatchString(c.WhatsApp)
	return phoneOK && waOK && (c.Instagram == "" || handleRe.MatchString(c.Instagram)) && (c.Telegram == "" || handleRe.MatchString(c.Telegram)) &&
		!tooLong(c.Address["fa"], 300, c.Address["en"], 300)
}

// walkLimits checks arbitrary JSON for depth and string length so edited page texts cannot be abused.
func walkLimits(v any, depth int) bool {
	if depth > 6 {
		return false
	}
	switch t := v.(type) {
	case string:
		return utf8.RuneCountInString(t) <= 5000
	case []any:
		if len(t) > 100 {
			return false
		}
		for _, e := range t {
			if !walkLimits(e, depth+1) {
				return false
			}
		}
	case map[string]any:
		if len(t) > 100 {
			return false
		}
		for _, e := range t {
			if !walkLimits(e, depth+1) {
				return false
			}
		}
	}
	return true
}

func (s *server) getContent(key string) (json.RawMessage, bool) {
	var raw string
	if s.db.QueryRow(`SELECT value FROM site_content WHERE key=?`, key).Scan(&raw) != nil {
		return nil, false
	}
	return json.RawMessage(raw), true
}

func (s *server) handlePublicSite(w http.ResponseWriter, _ *http.Request) {
	out := map[string]json.RawMessage{}
	for _, k := range []string{"site", "contact"} {
		if v, ok := s.getContent(k); ok {
			out[k] = v
		}
	}
	writeJSON(w, 200, out)
}

func (s *server) handlePutContent(w http.ResponseWriter, r *http.Request, _ user) {
	key := r.PathValue("key")
	if key != "site" && key != "contact" {
		fail(w, 404, "not_found")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 256<<10)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		fail(w, 400, "bad_request")
		return
	}
	var generic any
	if json.Unmarshal(body, &generic) != nil {
		fail(w, 400, "bad_request")
		return
	}
	if _, isObj := generic.(map[string]any); !isObj || !walkLimits(generic, 0) {
		fail(w, 400, "invalid")
		return
	}
	if key == "contact" {
		var c contactInfo
		if json.Unmarshal(body, &c) != nil || !c.valid() {
			fail(w, 400, "invalid")
			return
		}
	}
	if _, err := s.db.Exec(`INSERT INTO site_content(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`, key, string(body), time.Now().Unix()); err != nil {
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

// ---- media ----

func (s *server) handleUploadMedia(w http.ResponseWriter, r *http.Request, _ user) {
	r.Body = http.MaxBytesReader(w, r.Body, maxFileSize+(1<<20))
	f, _, err := r.FormFile("file")
	if err != nil {
		fail(w, 400, "bad_request")
		return
	}
	defer f.Close()
	data, err := io.ReadAll(io.LimitReader(f, maxFileSize+1))
	if err != nil || len(data) > maxFileSize {
		fail(w, http.StatusRequestEntityTooLarge, "too_large")
		return
	}
	cfg, format, err := image.DecodeConfig(bytes.NewReader(data))
	ext := map[string]string{"jpeg": "jpg", "png": "png", "webp": "webp"}[format]
	if err != nil || ext == "" || cfg.Width < 1 || cfg.Height < 1 || cfg.Width > 20000 || cfg.Height > 20000 {
		fail(w, 415, "unsupported_type")
		return
	}
	raw := make([]byte, 16)
	_, _ = rand.Read(raw)
	name := hex.EncodeToString(raw) + "." + ext
	if err := os.MkdirAll(filepath.Join(s.cfg.dataDir, "media"), 0o755); err != nil {
		fail(w, 500, "server")
		return
	}
	if err := os.WriteFile(filepath.Join(s.cfg.dataDir, "media", name), data, 0o644); err != nil {
		fail(w, 500, "server")
		return
	}
	writeJSON(w, 201, map[string]any{"path": "/api/public/media/" + name, "width": cfg.Width, "height": cfg.Height})
}

func (s *server) handleMedia(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if !mediaRe.MatchString(name) {
		fail(w, 404, "not_found")
		return
	}
	fh, err := os.Open(filepath.Join(s.cfg.dataDir, "media", name))
	if err != nil {
		fail(w, 404, "not_found")
		return
	}
	defer fh.Close()
	types := map[string]string{"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
	w.Header().Set("Content-Type", types[name[strings.LastIndex(name, ".")+1:]])
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	_, _ = io.Copy(w, fh)
}

// ---- first-start seed ----

// seedContent loads backend/seed/content.json into an empty database so the existing gallery and texts appear without manual entry.
func (s *server) seedContent(path string) error {
	var n int
	_ = s.db.QueryRow(`SELECT COUNT(*) FROM gallery_items`).Scan(&n)
	raw, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	var seed struct {
		Gallery []galleryItem   `json:"gallery"`
		Site    json.RawMessage `json:"site"`
		Contact json.RawMessage `json:"contact"`
	}
	if err := json.Unmarshal(raw, &seed); err != nil {
		return err
	}
	if n == 0 {
		for _, g := range seed.Gallery {
			nilToEmpty(&g.FA)
			nilToEmpty(&g.EN)
			if err := s.saveGallery(g, true); err != nil {
				return err
			}
		}
	}
	for k, v := range map[string]json.RawMessage{"site": seed.Site, "contact": seed.Contact} {
		if _, ok := s.getContent(k); !ok && len(v) > 0 {
			if _, err := s.db.Exec(`INSERT INTO site_content(key,value,updated_at) VALUES(?,?,?)`, k, string(v), time.Now().Unix()); err != nil {
				return err
			}
		}
	}
	return nil
}
