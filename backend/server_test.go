package main

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const origin = "http://localhost:3000"

func testServer(t *testing.T) (*server, http.Handler) {
	t.Helper()
	cfg := config{dataDir: t.TempDir(), origins: []string{origin}, adminPhone: "09120000000", adminPass: "adminpass1", trustProxy: true}
	s, err := newServer(cfg)
	if err != nil {
		t.Fatal(err)
	}
	return s, s.routes()
}

type client struct {
	t      *testing.T
	h      http.Handler
	cookie *http.Cookie
}

func (c *client) do(method, path string, body any) *httptest.ResponseRecorder {
	var rd io.Reader
	if b, ok := body.([]byte); ok {
		rd = bytes.NewReader(b)
	} else if body != nil {
		b, _ := json.Marshal(body)
		rd = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, rd)
	req.Header.Set("Origin", origin)
	req.Header.Set("X-Forwarded-For", "1.2.3.4")
	if c.cookie != nil {
		req.AddCookie(c.cookie)
	}
	rec := httptest.NewRecorder()
	c.h.ServeHTTP(rec, req)
	for _, ck := range rec.Result().Cookies() {
		if ck.Name == cookieName {
			c.cookie = ck
		}
	}
	return rec
}

func (c *client) mustStatus(rec *httptest.ResponseRecorder, want int) {
	c.t.Helper()
	if rec.Code != want {
		c.t.Fatalf("status %d, want %d: %s", rec.Code, want, rec.Body.String())
	}
}

func TestNormalizePhone(t *testing.T) {
	for in, want := range map[string]string{"۰۹۱۲۱۲۳۴۵۶۷": "09121234567", "+98 912 123 4567": "09121234567", "٠٩١٢١٢٣٤٥٦٧": "09121234567", "021-88888888": "02188888888", "0912": "", "abc": ""} {
		if got := normalizePhone(in); got != want {
			t.Errorf("%q: got %q want %q", in, got, want)
		}
	}
}

func TestAuthAndIsolation(t *testing.T) {
	_, h := testServer(t)
	a, b, admin := &client{t: t, h: h}, &client{t: t, h: h}, &client{t: t, h: h}

	a.mustStatus(a.do("POST", "/api/auth/register", map[string]string{"name": "A", "phone": "۰۹۱۲۱۱۱۱۱۱۱", "password": "password1"}), 201)
	a.mustStatus(a.do("POST", "/api/auth/register", map[string]string{"name": "A2", "phone": "09121111111", "password": "password1"}), 409) // same phone, other digits
	a.mustStatus(a.do("POST", "/api/auth/register", map[string]string{"name": "x", "phone": "09122222222", "password": "short"}), 400)
	b.mustStatus(b.do("POST", "/api/auth/register", map[string]string{"name": "B", "phone": "09122222222", "password": "password2"}), 201)
	admin.mustStatus(admin.do("POST", "/api/auth/login", map[string]string{"phone": "09120000000", "password": "adminpass1"}), 200)
	(&client{t: t, h: h}).mustStatus((&client{t: t, h: h}).do("GET", "/api/me", nil), 401)

	rec := a.do("POST", "/api/cases", map[string]any{"title": "Kitchen", "refs": []string{"b1-13", "../../etc"}})
	a.mustStatus(rec, 201)
	var created map[string]int64
	_ = json.Unmarshal(rec.Body.Bytes(), &created)
	path := "/api/cases/" + itoa(created["id"])

	a.mustStatus(a.do("GET", path, nil), 200)
	b.mustStatus(b.do("GET", path, nil), 404) // other customer cannot see it
	b.mustStatus(b.do("POST", path+"/messages", map[string]string{"body": "hi"}), 404)
	admin.mustStatus(admin.do("GET", path, nil), 200)
	a.mustStatus(a.do("PATCH", "/api/admin/cases/"+itoa(created["id"]), map[string]string{"status": "design"}), 403)
	admin.mustStatus(admin.do("PATCH", "/api/admin/cases/"+itoa(created["id"]), map[string]string{"status": "design"}), 200)
	admin.mustStatus(admin.do("PATCH", "/api/admin/cases/"+itoa(created["id"]), map[string]string{"status": "bogus"}), 400)
	a.mustStatus(a.do("GET", "/api/admin/inquiries", nil), 403)

	var detail struct{ Case caseOut }
	_ = json.Unmarshal(a.do("GET", path, nil).Body.Bytes(), &detail)
	if len(detail.Case.Refs) != 1 || detail.Case.Status != "design" || detail.Case.Owner != nil {
		t.Fatalf("unexpected case: %+v", detail.Case)
	}
	a.mustStatus(a.do("POST", "/api/auth/logout", nil), 200)
	a.cookie = &http.Cookie{Name: cookieName, Value: a.cookie.Value}
	a.mustStatus(a.do("GET", "/api/me", nil), 401) // session revoked server-side
}

func TestOriginRequired(t *testing.T) {
	_, h := testServer(t)
	req := httptest.NewRequest("POST", "/api/auth/login", strings.NewReader(`{}`))
	req.Header.Set("Origin", "https://evil.example")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 403 {
		t.Fatalf("got %d", rec.Code)
	}
}

func TestInquiryAndLimit(t *testing.T) {
	_, h := testServer(t)
	c := &client{t: t, h: h}
	c.mustStatus(c.do("POST", "/api/inquiries", map[string]string{"name": "N", "phone": "bad"}), 400)
	for i := 0; i < 4; i++ { // the invalid request above also counts
		c.mustStatus(c.do("POST", "/api/inquiries", map[string]string{"name": "N", "phone": "09123334455"}), 201)
	}
	c.mustStatus(c.do("POST", "/api/inquiries", map[string]string{"name": "N", "phone": "09123334455"}), 429)
}

func upload(t *testing.T, c *client, path, name string, data []byte) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, _ := mw.CreateFormFile("file", name)
	fw.Write(data)
	mw.Close()
	req := httptest.NewRequest("POST", path, &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("Origin", origin)
	req.AddCookie(c.cookie)
	rec := httptest.NewRecorder()
	c.h.ServeHTTP(rec, req)
	return rec
}

func TestFiles(t *testing.T) {
	_, h := testServer(t)
	a, b := &client{t: t, h: h}, &client{t: t, h: h}
	a.mustStatus(a.do("POST", "/api/auth/register", map[string]string{"name": "A", "phone": "09121111111", "password": "password1"}), 201)
	b.mustStatus(b.do("POST", "/api/auth/register", map[string]string{"name": "B", "phone": "09122222222", "password": "password2"}), 201)
	rec := a.do("POST", "/api/cases", map[string]any{"title": "T"})
	var created map[string]int64
	_ = json.Unmarshal(rec.Body.Bytes(), &created)
	path := "/api/cases/" + itoa(created["id"]) + "/files"

	png := append([]byte("\x89PNG\r\n\x1a\n"), make([]byte, 64)...)
	if r := upload(t, a, path, "../../plan.png", png); r.Code != 201 {
		t.Fatalf("png upload: %d %s", r.Code, r.Body.String())
	}
	if r := upload(t, a, path, "evil.png", []byte("<html><script>alert(1)</script></html>")); r.Code != 415 {
		t.Fatalf("html disguised as png: %d", r.Code)
	}
	if r := upload(t, b, path, "x.png", png); r.Code != 404 {
		t.Fatalf("other customer upload: %d", r.Code)
	}
	dl := a.do("GET", "/api/files/1", nil)
	a.mustStatus(dl, 200)
	if dl.Header().Get("Content-Disposition") != `attachment; filename=plan.png` || dl.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatalf("headers: %v", dl.Header())
	}
	b.mustStatus(b.do("GET", "/api/files/1", nil), 404)

	// deleting the account removes its data
	a.mustStatus(a.do("DELETE", "/api/me", nil), 200)
	a.cookie = &http.Cookie{Name: cookieName, Value: "x"}
}

func itoa(n int64) string { b, _ := json.Marshal(n); return string(b) }
