package main

import (
	"bytes"
	"encoding/json"
	"image"
	"image/color"
	"image/png"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func pngBytes(w, h int) []byte {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	img.Set(0, 0, color.White)
	var b bytes.Buffer
	_ = png.Encode(&b, img)
	return b.Bytes()
}

func seededServer(t *testing.T) http.Handler {
	t.Helper()
	dir := t.TempDir()
	seed := filepath.Join(dir, "seed.json")
	item := `{"id":"b1-01","slug":"first-item","batch":1,"originalPath":"/Users/x/secret.jpg","imagePath":"/assets/gallery/img-01.jpg","width":100,"height":200,
	 "category":"office","featured":true,"contentStatus":"unverified","projectId":null,"relatedIds":["b1-02"],"hidden":false,
	 "fa":{"title":"عنوان","description":"d","alt":"alt","subcategory":"s","workTypes":["a"],"tags":["t"]},
	 "en":{"title":"Title","description":"d","alt":"alt","subcategory":"s","workTypes":["a"],"tags":["t"]}}`
	hidden := strings.Replace(strings.Replace(item, `"b1-01"`, `"b1-02"`, 1), `first-item`, `second-item`, 1)
	hidden = strings.Replace(hidden, `"hidden":false`, `"hidden":true`, 1)
	body := `{"gallery":[` + item + `,` + hidden + `],"site":{"fa":{"tagline":"x"},"en":{"tagline":"y"}},"contact":{"phone":"+989199294498","address":{"fa":"a","en":"b"}}}`
	if err := os.WriteFile(seed, []byte(body), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg := config{dataDir: dir, origins: []string{origin}, adminPhone: "09120000000", adminPass: "adminpass1", trustProxy: true, seedFile: seed}
	s, err := newServer(cfg)
	if err != nil {
		t.Fatal(err)
	}
	return s.routes()
}

func TestContentAPI(t *testing.T) {
	h := seededServer(t)
	anon, cust, admin := &client{t: t, h: h}, &client{t: t, h: h}, &client{t: t, h: h}
	cust.mustStatus(cust.do("POST", "/api/auth/register", map[string]string{"name": "C", "phone": "09121111111", "password": "password1"}), 201)
	admin.mustStatus(admin.do("POST", "/api/auth/login", map[string]string{"phone": "09120000000", "password": "adminpass1"}), 200)

	// public reads: hidden items and internal fields are not exposed
	rec := anon.do("GET", "/api/public/gallery", nil)
	anon.mustStatus(rec, 200)
	if strings.Contains(rec.Body.String(), "secret.jpg") || strings.Contains(rec.Body.String(), "second-item") || strings.Contains(rec.Body.String(), "relatedIds") {
		t.Fatalf("public gallery leaks internal data: %s", rec.Body.String())
	}
	anon.mustStatus(anon.do("GET", "/api/public/site", nil), 200)
	// admin sees everything; others cannot write
	rec = admin.do("GET", "/api/admin/gallery", nil)
	if !strings.Contains(rec.Body.String(), "second-item") || !strings.Contains(rec.Body.String(), "secret.jpg") {
		t.Fatal("admin list incomplete")
	}
	var item galleryItem
	_ = json.Unmarshal([]byte(`{"id":"b9-01","slug":"new-item","batch":3,"imagePath":"/assets/gallery/x.jpg","width":10,"height":10,"category":"office","contentStatus":"unverified",
	 "fa":{"title":"t","alt":"a","description":"","subcategory":"","workTypes":[],"tags":[]},"en":{"title":"t","alt":"a","description":"","subcategory":"","workTypes":[],"tags":[]}}`), &item)
	cust.mustStatus(cust.do("POST", "/api/admin/gallery", item), 403)
	anon.mustStatus(anon.do("POST", "/api/admin/gallery", item), 401)
	admin.mustStatus(admin.do("POST", "/api/admin/gallery", item), 201)
	admin.mustStatus(admin.do("POST", "/api/admin/gallery", item), 409) // duplicate id/slug

	// validation
	bad := item
	bad.ID, bad.Slug, bad.ImagePath = "b9-02", "other", "https://evil.example/x.jpg"
	admin.mustStatus(admin.do("POST", "/api/admin/gallery", bad), 400)
	bad.ImagePath, bad.Category = "/assets/gallery/../../etc/passwd", "office"
	admin.mustStatus(admin.do("POST", "/api/admin/gallery", bad), 400)
	bad.ImagePath, bad.Category = "/assets/gallery/x.jpg", "nope"
	admin.mustStatus(admin.do("POST", "/api/admin/gallery", bad), 400)

	// update keeps the slug stable; hide removes it from the public list
	item.Slug, item.Hidden, item.FA.Title = "changed-slug", true, "عنوان جدید"
	admin.mustStatus(admin.do("PUT", "/api/admin/gallery/b9-01", item), 200)
	rec = admin.do("GET", "/api/admin/gallery", nil)
	if !strings.Contains(rec.Body.String(), "new-item") || strings.Contains(rec.Body.String(), "changed-slug") || !strings.Contains(rec.Body.String(), "عنوان جدید") {
		t.Fatalf("update result: %s", rec.Body.String())
	}
	if strings.Contains(anon.do("GET", "/api/public/gallery", nil).Body.String(), "new-item") {
		t.Fatal("hidden item is public")
	}
	admin.mustStatus(admin.do("PUT", "/api/admin/gallery/nope", item), 404)

	// reorder and delete
	admin.mustStatus(admin.do("POST", "/api/admin/gallery-order", map[string][]string{"ids": {"b9-01", "b1-02", "b1-01"}}), 200)
	var list []galleryItem
	_ = json.Unmarshal(admin.do("GET", "/api/admin/gallery", nil).Body.Bytes(), &list)
	if list[0].ID != "b9-01" || list[2].ID != "b1-01" {
		t.Fatalf("order: %v", []string{list[0].ID, list[1].ID, list[2].ID})
	}
	admin.mustStatus(admin.do("DELETE", "/api/admin/gallery/b9-01", nil), 200)
	admin.mustStatus(admin.do("DELETE", "/api/admin/gallery/b9-01", nil), 404)

	// site texts and contact details
	admin.mustStatus(admin.do("PUT", "/api/admin/content/site", map[string]any{"fa": map[string]string{"tagline": "جدید"}}), 200)
	admin.mustStatus(admin.do("PUT", "/api/admin/content/site", []string{"x"}), 400)
	admin.mustStatus(admin.do("PUT", "/api/admin/content/other", map[string]string{}), 404)
	cust.mustStatus(cust.do("PUT", "/api/admin/content/site", map[string]string{}), 403)
	admin.mustStatus(admin.do("PUT", "/api/admin/content/contact", map[string]any{"phone": "not a phone", "address": map[string]string{}}), 400)
	admin.mustStatus(admin.do("PUT", "/api/admin/content/contact", map[string]any{"phone": "+989199294498", "instagram": "fadak.atelier", "address": map[string]string{"fa": "x", "en": "y"}}), 200)
	if !strings.Contains(anon.do("GET", "/api/public/site", nil).Body.String(), "جدید") {
		t.Fatal("site text not published")
	}

	// media upload: only real images; served publicly with a long cache
	cust.mustStatus(uploadTo(t, cust, "/api/admin/media", "a.png", pngBytes(4, 3)), 403)
	admin.mustStatus(uploadTo(t, admin, "/api/admin/media", "a.png", []byte("<html>")), 415)
	rec = uploadTo(t, admin, "/api/admin/media", "a.png", pngBytes(4, 3))
	admin.mustStatus(rec, 201)
	var up struct {
		Path          string
		Width, Height int
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &struct{}{})
	var lower struct {
		Path   string `json:"path"`
		Width  int    `json:"width"`
		Height int    `json:"height"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &lower)
	up.Path, up.Width, up.Height = lower.Path, lower.Width, lower.Height
	if up.Width != 4 || up.Height != 3 || !strings.HasPrefix(up.Path, "/api/public/media/") {
		t.Fatalf("upload result %+v", up)
	}
	got := anon.do("GET", up.Path, nil)
	anon.mustStatus(got, 200)
	if got.Header().Get("Content-Type") != "image/png" || !strings.Contains(got.Header().Get("Cache-Control"), "immutable") {
		t.Fatalf("media headers: %v", got.Header())
	}
	anon.mustStatus(anon.do("GET", "/api/public/media/..%2f..%2fdata.db", nil), 404)
}

func uploadTo(t *testing.T, c *client, path, name string, data []byte) *httptest.ResponseRecorder {
	t.Helper()
	return upload(t, c, path, name, data)
}
