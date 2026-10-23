package main

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, phone TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer', created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, project_type TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '', refs TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'new',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL,
  mime TEXT NOT NULL, size INTEGER NOT NULL, stored TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, project_type TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '', refs TEXT NOT NULL DEFAULT '[]',
  locale TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS case_events (
  id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS case_notes (
  id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, sort_order INTEGER NOT NULL, data TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_events_case ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_notes_case ON case_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_case ON messages(case_id);
CREATE INDEX IF NOT EXISTS idx_files_case ON files(case_id);
`

func openDB(dataDir string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Join(dataDir, "uploads"), 0o700); err != nil {
		return nil, err
	}
	dsn := "file:" + filepath.Join(dataDir, "fadak.db") + "?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(schema); err != nil {
		return nil, err
	}
	// Columns added after the first release; CREATE TABLE IF NOT EXISTS cannot add them to an existing database.
	for _, c := range [][3]string{
		{"cases", "last_actor_role", "TEXT NOT NULL DEFAULT 'customer'"},
		{"cases", "staff_seen_at", "INTEGER NOT NULL DEFAULT 0"},
		{"cases", "customer_seen_at", "INTEGER NOT NULL DEFAULT 0"},
		{"inquiries", "handled", "INTEGER NOT NULL DEFAULT 0"},
	} {
		if err := addColumn(db, c[0], c[1], c[2]); err != nil {
			return nil, err
		}
	}
	return db, nil
}

func addColumn(db *sql.DB, table, col, def string) error {
	rows, err := db.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		return err
	}
	has := false
	for rows.Next() {
		var cid int
		var name, typ string
		var notnull, pk int
		var dflt sql.NullString
		if rows.Scan(&cid, &name, &typ, &notnull, &dflt, &pk) == nil && name == col {
			has = true
		}
	}
	rows.Close()
	if has {
		return nil
	}
	_, err = db.Exec("ALTER TABLE " + table + " ADD COLUMN " + col + " " + def)
	return err
}
