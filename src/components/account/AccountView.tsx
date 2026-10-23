"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type CaseItem, type Inquiry, type User } from "@/lib/api";
import { account, errorText, fmtDate } from "@/data/account-i18n";
import { projectTypes } from "@/data/site";
import { projectTypes as englishTypes } from "@/data/site-en";
import { useFavorites } from "@/lib/favorites";
import type { Locale } from "@/lib/i18n";

// Only same-language, same-site destinations are followed after sign-in.
const safeNext = (next: string | null, locale: Locale) => (next && next.startsWith(`/${locale}/`) && !next.startsWith("//") ? next : null);

export default function AccountView({ locale }: { locale: Locale }) {
  const t = account(locale);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const load = useCallback(async () => { const r = await api<User>("GET", "/me"); setUser(r.ok ? r.data : null); }, []);
  useEffect(() => { load(); }, [load]);

  if (user === undefined) return <p className="lead">{t.loading}</p>;
  if (!user) return <AuthForms locale={locale} onDone={load} />;
  return <Dashboard locale={locale} user={user} onLogout={() => setUser(null)} />;
}

function AuthForms({ locale, onDone }: { locale: Locale; onDone: () => void }) {
  const t = account(locale);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError("");
    const body = { name: String(f.get("name") ?? ""), phone: String(f.get("phone") ?? ""), password: String(f.get("password") ?? "") };
    const r = await api("POST", mode === "login" ? "/auth/login" : "/auth/register", body);
    setBusy(false);
    if (!r.ok) { setError(errorText(t, r.data.error)); return; }
    const next = safeNext(new URLSearchParams(window.location.search).get("next"), locale);
    if (next) window.location.assign(next); else onDone();
  }

  return (
    <form onSubmit={submit} className="acct-form" noValidate>
      <h2 className="h2">{mode === "login" ? t.login : t.register}</h2>
      {mode === "register" && <label htmlFor="name"><span>{t.name}</span><input id="name" name="name" autoComplete="name" required /></label>}
      <label htmlFor="phone"><span>{t.phone}</span><input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" style={{ textAlign: locale === "fa" ? "right" : "left" }} required /></label>
      <label htmlFor="password"><span>{t.password} {mode === "register" && <small>{t.passwordHint}</small>}</span>
        <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
      {error && <p className="notice" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={busy}>{mode === "login" ? t.login : t.register}</button>
      <button type="button" className="link-btn" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? t.noAccount : t.haveAccount}</button>
      <p className="muted-note">{t.privacy}</p>
    </form>
  );
}

function Dashboard({ locale, user, onLogout }: { locale: Locale; user: User; onLogout: () => void }) {
  const t = account(locale);
  const [cases, setCases] = useState<CaseItem[] | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const isAdmin = user.role === "admin";

  const refresh = useCallback(async () => {
    const r = await api<CaseItem[]>("GET", "/cases");
    setCases(r.ok ? (r.data as unknown as CaseItem[]) : []);
    if (isAdmin) { const q = await api<Inquiry[]>("GET", "/admin/inquiries"); if (q.ok) setInquiries(q.data as unknown as Inquiry[]); }
  }, [isAdmin]);
  useEffect(() => { refresh(); }, [refresh]);

  async function logout() { await api("POST", "/auth/logout"); onLogout(); }
  async function remove() {
    if (!window.confirm(t.deleteConfirm)) return;
    const r = await api("DELETE", "/me");
    if (r.ok) onLogout();
  }

  return (
    <div className="acct">
      <div className="acct-bar">
        <p>{t.hello}، <b>{user.name}</b></p>
        <button className="btn ghost" onClick={logout}>{t.logout}</button>
      </div>
      <h2 className="h2">{isAdmin ? t.allCases : t.myCases}</h2>
      {cases === null ? <p className="lead">{t.loading}</p> : cases.length === 0 ? <p className="lead">{t.noCases}</p> : (
        <ul className="case-list">
          {cases.map(c => (
            <li key={c.id}>
              <Link href={`/${locale}/account/cases/${c.id}`}>
                <b>{c.title}</b>
                <span className="status-pill">{(t.statuses as Record<string, string>)[c.status]}</span>
                <small>{isAdmin && c.owner ? `${t.owner}: ${c.owner.name} · ` : ""}{t.updated}: {fmtDate(locale, c.updatedAt)}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!isAdmin && <NewCase locale={locale} onCreated={refresh} />}
      {isAdmin && (
        <section>
          <h2 className="h2">{t.inquiries}</h2>
          {inquiries.length === 0 ? <p className="lead">—</p> : (
            <ul className="case-list">
              {inquiries.map(q => (
                <li key={q.id}><div>
                  <b>{q.Name}</b> <a className="ltr" href={`tel:${q.Phone}`}>{q.Phone}</a>
                  <small>{[q.ProjectType, q.City, fmtDate(locale, q.createdAt)].filter(Boolean).join(" · ")}{q.refs.length ? ` · ${q.refs.join(", ")}` : ""}</small>
                  {q.Message && <p className="acct-msg">{q.Message}</p>}
                </div></li>
              ))}
            </ul>
          )}
        </section>
      )}
      <p className="muted-note">{t.privacy}</p>
      {!isAdmin && <button type="button" className="link-btn danger" onClick={remove}>{t.deleteAccount}</button>}
    </div>
  );
}

function NewCase({ locale, onCreated }: { locale: Locale; onCreated: () => void }) {
  const t = account(locale);
  const favs = useFavorites();
  const [attach, setAttach] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setError("");
    const r = await api<{ id: number }>("POST", "/cases", {
      title: f.get("title"), projectType: f.get("projectType"), city: f.get("city"), description: f.get("description"), refs: attach ? favs : [],
    });
    setBusy(false);
    if (!r.ok) { setError(errorText(t, r.data.error)); return; }
    form.reset();
    window.location.assign(`/${locale}/account/cases/${r.data.id}`);
    onCreated();
  }

  return (
    <form onSubmit={submit} className="acct-form" noValidate>
      <h2 className="h2">{t.newCase}</h2>
      <label htmlFor="title"><span>{t.caseTitle}</span><input id="title" name="title" maxLength={120} required /></label>
      <label htmlFor="ptype"><span>{t.projectType} <small>{t.optional}</small></span>
        <select id="ptype" name="projectType" defaultValue="">
          <option value="">{t.select}</option>
          {projectTypes.map((v, i) => <option key={v} value={v}>{locale === "fa" ? v : englishTypes[i]}</option>)}
        </select></label>
      <label htmlFor="city"><span>{t.city} <small>{t.optional}</small></span><input id="city" name="city" maxLength={60} /></label>
      <label htmlFor="desc"><span>{t.description} <small>{t.optional}</small></span><textarea id="desc" name="description" maxLength={5000} /></label>
      {favs.length > 0 && <label className="check"><input type="checkbox" checked={attach} onChange={e => setAttach(e.target.checked)} /> <span>{t.attachSaved} ({favs.length.toLocaleString(locale)})</span></label>}
      {error && <p className="notice" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={busy}>{busy ? t.creating : t.create}</button>
    </form>
  );
}
