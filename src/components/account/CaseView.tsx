"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type CaseItem, type FileItem, type Message, type User } from "@/lib/api";
import { account, errorText, fmtDate } from "@/data/account-i18n";
import { gallery } from "@/data/gallery-refs";
import type { Locale } from "@/lib/i18n";

type Detail = { case: CaseItem; messages: Message[]; files: FileItem[] };
const order = ["new", "reviewing", "design", "production", "installation", "done", "closed"];

export default function CaseView({ locale, id }: { locale: Locale; id: string }) {
  const t = account(locale);
  const [me, setMe] = useState<User | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, d] = await Promise.all([api<User>("GET", "/me"), api<Detail>("GET", `/cases/${id}`)]);
    if (m.status === 401) { window.location.assign(`/${locale}/account?next=${encodeURIComponent(`/${locale}/account/cases/${id}`)}`); return; }
    setMe(m.ok ? m.data : null);
    if (d.ok) { setDetail(d.data as unknown as Detail); setState("ok"); } else setState("missing");
  }, [id, locale]);
  useEffect(() => { load(); }, [load]);

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

  const back = <p><Link className="link" href={`/${locale}/account`}>{t.back}</Link></p>;
  if (state === "loading") return <p className="lead">{t.loading}</p>;
  if (state === "missing" || !detail || !me) return <div>{back}<p className="lead">{t.notFound}</p></div>;
  const { case: c, messages, files } = detail;
  const isAdmin = me.role === "admin";
  const sizeLabel = (n: number) => (n > 1 << 20 ? `${(n / (1 << 20)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  return (
    <div className="acct">
      {back}
      <h2 className="h2">{c.title}</h2>
      <p className="muted-note">{[c.projectType, c.city, `${t.updated}: ${fmtDate(locale, c.updatedAt)}`].filter(Boolean).join(" · ")}</p>
      {isAdmin && c.owner && <p className="muted-note">{t.owner}: {c.owner.name} · <a className="ltr" href={`tel:${c.owner.phone}`}>{c.owner.phone}</a></p>}
      {c.description && <p className="acct-msg">{c.description}</p>}

      <h3>{t.status}</h3>
      <ol className="steps compact" aria-label={t.status}>
        {order.slice(0, 6).map((s, i) => (
          <li key={s} aria-current={c.status === s ? "step" : undefined} className={order.indexOf(c.status) >= i ? "reached" : ""}>{(t.statuses as Record<string, string>)[s]}</li>
        ))}
      </ol>
      {c.status === "closed" && <p className="muted-note">{t.statuses.closed}</p>}
      {isAdmin && (
        <label htmlFor="st" className="inline"><span>{t.status}</span>
          <select id="st" value={c.status} onChange={e => setStatus(e.target.value)}>
            {order.map(s => <option key={s} value={s}>{(t.statuses as Record<string, string>)[s]}</option>)}
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
            <small>{m.authorRole === "admin" ? t.staff : (m.authorName === me.name ? t.you : m.authorName)} · {fmtDate(locale, m.createdAt)}</small>
            <p className="acct-msg">{m.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={post} className="acct-form" noValidate>
        <label htmlFor="body"><span>{t.write}</span><textarea id="body" name="body" maxLength={5000} required /></label>
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
      {error && <p className="notice" role="alert">{error}</p>}
      <p className="muted-note">{t.privacy}</p>
    </div>
  );
}
