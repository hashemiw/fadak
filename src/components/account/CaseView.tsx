"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type CaseEvent, type CaseItem, type FileItem, type Message, type Note, type User } from "@/lib/api";
import { account, errorText, eventText, fmtDate } from "@/data/account-i18n";
import type { Locale } from "@/lib/i18n";

type Detail = { case: CaseItem; messages: Message[]; files: FileItem[]; events: CaseEvent[]; notes?: Note[] };
const order = ["new", "reviewing", "design", "production", "installation", "done", "closed"];
const POLL_MS = 8000;

// mode "admin" is the staff workspace for a project; "account" is the customer's own view.
export default function CaseView({ locale, id, mode = "account" }: { locale: Locale; id: string; mode?: "account" | "admin" }) {
  const t = account(locale);
  const a = t.admin;
  const area = mode === "admin" ? "admin" : "account";
  const [me, setMe] = useState<User | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [gallery, setGallery] = useState<{ id: string; slug: string; imagePath: string }[]>([]);
  useEffect(() => { fetch("/api/public/gallery").then(r => r.json()).then(setGallery).catch(() => {}); }, []);
  const busyRef = useRef(false);
  busyRef.current = busy;

  const load = useCallback(async () => {
    const [m, d] = await Promise.all([api<User>("GET", "/me"), api<Detail>("GET", `/cases/${id}`)]);
    if (m.status === 401) { window.location.assign(`/${locale}/account?next=${encodeURIComponent(`/${locale}/${area}/cases/${id}`)}`); return; }
    setMe(m.ok ? m.data : null);
    if (d.ok) { setDetail(d.data as unknown as Detail); setState("ok"); } else setState("missing");
  }, [id, locale, area]);
  useEffect(() => { load(); }, [load]);
  // Near-live updates: refresh while the tab is visible and nothing is being sent.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible" && !busyRef.current) load(); };
    const timer = setInterval(tick, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function post(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    setBusy(true); setError("");
    const r = await api("POST", `/cases/${id}/messages`, { body });
    setBusy(false);
    if (!r.ok) { setError(errorText(t, r.data.error)); return; }
    form.reset(); load();
  }
  async function addNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("note") ?? "");
    const r = await api("POST", `/admin/cases/${id}/notes`, { body });
    if (!r.ok) { setError(errorText(t, r.data.error)); return; }
    form.reset(); load();
  }
  async function removeNote(nid: number) { await api("DELETE", `/admin/notes/${nid}`); load(); }
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    setBusy(true); setError("");
    const r = await api("POST", `/cases/${id}/files`, fd);
    setBusy(false);
    if (!r.ok) { setError(errorText(t, r.status === 413 ? "too_large" : r.data.error)); return; }
    load();
  }
  async function removeFile(fid: number) { await api("DELETE", `/files/${fid}`); load(); }
  async function setStatus(status: string) {
    const r = await api("PATCH", `/admin/cases/${id}`, { status });
    if (!r.ok) setError(errorText(t, r.data.error)); else load();
  }

  const back = <p><Link className="link" href={`/${locale}/${area}`}>{mode === "admin" ? a.title : t.back}</Link></p>;
  if (state === "loading") return <p className="lead">{t.loading}</p>;
  if (state === "missing" || !detail || !me) return <div>{back}<p className="lead">{t.notFound}</p></div>;
  if (mode === "admin" && me.role !== "admin") return <div>{back}<p className="lead">{a.notStaff}</p></div>;
  const { case: c, messages, files, events, notes } = detail;
  const isAdmin = me.role === "admin";
  const sizeLabel = (n: number) => (n > 1 << 20 ? `${(n / (1 << 20)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  const statusName = (s: string) => (t.statuses as Record<string, string>)[s];

  return (
    <div className="acct">
      {back}
      <h2 className="h2">{c.title}</h2>
      <p className="muted-note">{[c.projectType, c.city, `${t.updated}: ${fmtDate(locale, c.updatedAt)}`].filter(Boolean).join(" · ")}</p>
      {isAdmin && c.owner && (
        <p className="contact-line">
          <span>{a.customer}: <b>{c.owner.name}</b></span>
          <a className="ltr link" href={`tel:${c.owner.phone}`}>{a.call} {c.owner.phone}</a>
          <a className="link" href={`https://wa.me/98${c.owner.phone.slice(1)}`} rel="noopener">{a.whatsapp}</a>
        </p>
      )}
      {c.description && <p className="acct-msg">{c.description}</p>}

      <h3>{t.status}</h3>
      <ol className="steps compact" aria-label={t.status}>
        {order.slice(0, 6).map((s, i) => (
          <li key={s} aria-current={c.status === s ? "step" : undefined} className={order.indexOf(c.status) >= i ? "reached" : ""}>{statusName(s)}</li>
        ))}
      </ol>
      {c.status === "closed" && <p className="muted-note">{t.statuses.closed}</p>}
      {isAdmin && (
        <label htmlFor="st" className="inline"><span>{a.changeStatus}</span>
          <select id="st" value={c.status} onChange={e => setStatus(e.target.value)}>
            {order.map(s => <option key={s} value={s}>{statusName(s)}</option>)}
          </select></label>
      )}

      {c.refs.length > 0 && (
        <section><h3>{t.refs}</h3>
          <div className="ref-row">
            {c.refs.map(r => { const g = gallery.find(x => x.id === r); return g ? <Link key={r} href={`/${locale}/gallery/${g.slug}`}><img src={g.imagePath} alt="" width={72} height={72} loading="lazy" /></Link> : null; })}
          </div>
        </section>
      )}

      <h3>{t.messages}</h3>
      <ul className="thread">
        {messages.length === 0 && <li className="muted-note">{t.noMessages}</li>}
        {messages.map(m => (
          <li key={m.id} className={m.authorRole === "admin" ? "staff" : ""}>
            <small>{m.authorRole === "admin" ? (isAdmin ? m.authorName : t.staff) : (m.authorName === me.name && !isAdmin ? t.you : m.authorName)} · {fmtDate(locale, m.createdAt)}</small>
            <p className="acct-msg">{m.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={post} className="acct-form" noValidate>
        <label htmlFor="body"><span>{isAdmin ? a.replyTo : t.write}</span><textarea id="body" name="body" maxLength={5000} required /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? t.sending : t.send}</button>
      </form>

      <h3>{t.files}</h3>
      <ul className="case-list">
        {files.length === 0 && <li className="muted-note">{t.noFiles}</li>}
        {files.map(f => (
          <li key={f.id}><div className="file-row">
            <span>{f.name} <small>{sizeLabel(f.size)}</small></span>
            <a className="link" href={`/api/files/${f.id}`} download>{t.download}</a>
            {(isAdmin || f.uploaderId === me.id) && <button type="button" className="link-btn danger" onClick={() => removeFile(f.id)}>{t.remove}</button>}
          </div></li>
        ))}
      </ul>
      <label htmlFor="file" className="upload"><span>{t.upload}</span><input id="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={upload} disabled={busy} /></label>
      <p className="muted-note">{t.fileHint}</p>

      <h3>{t.timeline}</h3>
      <ol className="timeline">
        {events.map(ev => (
          <li key={ev.id}><span>{eventText(t, ev.kind, ev.detail)}</span> <small>{fmtDate(locale, ev.createdAt)}{isAdmin ? ` · ${ev.actorRole === "admin" ? t.staff : a.customer}` : ""}</small></li>
        ))}
      </ol>

      {isAdmin && notes && (
        <section className="notes-box">
          <h3>{a.notes}</h3>
          <p className="muted-note">{a.notesHint}</p>
          <ul className="thread">
            {notes.length === 0 && <li className="muted-note">{a.noNotes}</li>}
            {notes.map(n => (
              <li key={n.id}><small>{n.authorName} · {fmtDate(locale, n.createdAt)}</small><p className="acct-msg">{n.body}</p>
                <button type="button" className="link-btn danger" onClick={() => removeNote(n.id)}>{a.deleteNote}</button></li>
            ))}
          </ul>
          <form onSubmit={addNote} className="acct-form" noValidate>
            <label htmlFor="note"><span>{a.notes}</span><textarea id="note" name="note" maxLength={5000} required /></label>
            <button className="btn ghost" type="submit">{a.addNote}</button>
          </form>
        </section>
      )}
      {error && <p className="notice" role="alert">{error}</p>}
      <p className="muted-note">{t.liveNote} {t.privacy}</p>
    </div>
  );
}
