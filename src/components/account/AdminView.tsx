"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type CaseItem, type Customer, type Inquiry, type Stats, type User } from "@/lib/api";
import { account, errorText, fmtDate } from "@/data/account-i18n";
import { adminContent } from "@/data/admin-content-i18n";
import GalleryManager from "./admin/GalleryManager";
import ContentEditor from "./admin/ContentEditor";
import type { Locale } from "@/lib/i18n";

type Tab = "projects" | "enquiries" | "customers" | "team" | "gallery" | "content";
const POLL_MS = 8000;

export default function AdminView({ locale }: { locale: Locale }) {
  const t = account(locale);
  const a = t.admin;
  const [me, setMe] = useState<User | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("projects");
  const [stats, setStats] = useState<Stats | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<User[]>([]);

  const load = useCallback(async () => {
    const m = await api<User>("GET", "/me");
    if (!m.ok) { setMe(null); return; }
    setMe(m.data);
    if (m.data.role !== "admin") return;
    const [s, c, q, cu, st] = await Promise.all([
      api<Stats>("GET", "/admin/stats"), api<CaseItem[]>("GET", "/cases"), api<Inquiry[]>("GET", "/admin/inquiries"),
      api<Customer[]>("GET", "/admin/customers"), api<User[]>("GET", "/admin/staff"),
    ]);
    if (s.ok) setStats(s.data as unknown as Stats);
    if (c.ok) setCases(c.data as unknown as CaseItem[]);
    if (q.ok) setInquiries(q.data as unknown as Inquiry[]);
    if (cu.ok) setCustomers(cu.data as unknown as Customer[]);
    if (st.ok) setStaff(st.data as unknown as User[]);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === "visible") load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);
  // Tab title shows how many projects wait for a reply, so it is visible from another tab.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = stats && stats.awaitingReply > 0 ? `(${stats.awaitingReply}) ${base}` : base;
    return () => { document.title = base; };
  }, [stats]);

  if (me === undefined) return <p className="lead">{t.loading}</p>;
  if (!me) return <p className="lead"><Link className="link" href={`/${locale}/account?next=${encodeURIComponent(`/${locale}/admin`)}`}>{t.loginNeeded}</Link></p>;
  if (me.role !== "admin") return <p className="lead">{a.notStaff}</p>;

  const tabs: [Tab, string, number | undefined][] = [
    ["projects", a.tabs.projects, stats?.awaitingReply], ["enquiries", a.tabs.enquiries, stats?.newInquiries],
    ["customers", a.tabs.customers, undefined], ["team", a.tabs.team, undefined],
    ["gallery", adminContent(locale).tabs.gallery, undefined], ["content", adminContent(locale).tabs.content, undefined],
  ];
  const by = stats?.byStatus ?? {};
  const active = ["new", "reviewing", "design", "production", "installation"].reduce((n, s) => n + (by[s] ?? 0), 0);
  const tiles: [string, number][] = [[a.stats.awaiting, stats?.awaitingReply ?? 0], [a.stats.unread, stats?.unread ?? 0], [a.stats.active, active], [a.stats.done, by.done ?? 0], [a.stats.enquiries, stats?.newInquiries ?? 0]];

  return (
    <div className="admin">
      <ul className="stat-tiles">{tiles.map(([label, n]) => <li key={label}><b>{n.toLocaleString(locale)}</b><span>{label}</span></li>)}</ul>
      <div className="tabs" role="tablist">
        {tabs.map(([k, label, badge]) => (
          <button key={k} role="tab" aria-selected={tab === k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>
            {label}{badge ? <span className="badge">{badge.toLocaleString(locale)}</span> : null}
          </button>
        ))}
      </div>
      {tab === "projects" && <Projects locale={locale} cases={cases} />}
      {tab === "enquiries" && <Enquiries locale={locale} items={inquiries} onChange={load} />}
      {tab === "customers" && <Customers locale={locale} items={customers} />}
      {tab === "team" && <Team locale={locale} staff={staff} onChange={load} />}
      {tab === "gallery" && <GalleryManager locale={locale} />}
      {tab === "content" && <ContentEditor locale={locale} />}
      <p className="muted-note">{t.liveNote}</p>
    </div>
  );
}

function Projects({ locale, cases }: { locale: Locale; cases: CaseItem[] }) {
  const t = account(locale);
  const a = t.admin;
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [needsReply, setNeedsReply] = useState(false);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cases
      .filter(c => (!status || c.status === status) && (!needsReply || c.awaitingReply)
        && (!needle || [c.title, c.owner?.name, c.owner?.phone, c.city].some(v => v?.toLowerCase().includes(needle))))
      .sort((x, y) => Number(!!y.awaitingReply) - Number(!!x.awaitingReply) || y.updatedAt - x.updatedAt);
  }, [cases, status, q, needsReply]);
  const name = (s: string) => (t.statuses as Record<string, string>)[s];

  return (
    <section>
      <div className="admin-filters">
        <label htmlFor="q" className="sr-only">{a.search}</label>
        <input id="q" type="search" placeholder={a.search} value={q} onChange={e => setQ(e.target.value)} />
        <label htmlFor="sf" className="sr-only">{t.status}</label>
        <select id="sf" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">{a.allStatuses}</option>
          {Object.keys(t.statuses).map(s => <option key={s} value={s}>{name(s)}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={needsReply} onChange={e => setNeedsReply(e.target.checked)} /> <span>{a.needsReply}</span></label>
      </div>
      {shown.length === 0 ? <p className="lead">{a.noMatch}</p> : (
        <ul className="case-list">
          {shown.map(c => (
            <li key={c.id}>
              <Link href={`/${locale}/admin/cases/${c.id}`}>
                <span className="row-top">
                  <b>{c.title}</b>
                  {c.unread && <span className="badge new">{a.fresh}</span>}
                  {c.awaitingReply && <span className="badge">{a.awaiting}</span>}
                  <span className="status-pill">{name(c.status)}</span>
                </span>
                <small>{c.owner?.name} · <span className="ltr">{c.owner?.phone}</span>{c.city ? ` · ${c.city}` : ""}</small>
                <small>{c.messageCount.toLocaleString(locale)} {a.messagesCount} · {c.fileCount.toLocaleString(locale)} {a.filesCount} · {t.updated}: {fmtDate(locale, c.updatedAt)}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Enquiries({ locale, items, onChange }: { locale: Locale; items: Inquiry[]; onChange: () => void }) {
  const a = account(locale).admin;
  const mark = async (id: number, handled: boolean) => { await api("PATCH", `/admin/inquiries/${id}`, { handled }); onChange(); };
  if (items.length === 0) return <p className="lead">{a.noEnquiries}</p>;
  return (
    <ul className="case-list">
      {items.map(q => (
        <li key={q.id}><div>
          <span className="row-top"><b>{q.Name}</b>{!q.handled && <span className="badge new">{a.fresh}</span>}</span>
          <span className="contact-line">
            <a className="ltr link" href={`tel:${q.Phone}`}>{a.call} {q.Phone}</a>
            <a className="link" href={`https://wa.me/98${q.Phone.slice(1)}`} rel="noopener">{a.whatsapp}</a>
          </span>
          <small>{[q.ProjectType, q.City, fmtDate(locale, q.createdAt)].filter(Boolean).join(" · ")}{q.refs.length ? ` · ${q.refs.join(", ")}` : ""}</small>
          {q.Message && <p className="acct-msg">{q.Message}</p>}
          <button type="button" className="link-btn" onClick={() => mark(q.id, !q.handled)}>{q.handled ? a.markNew : a.markHandled}</button>
        </div></li>
      ))}
    </ul>
  );
}

function Customers({ locale, items }: { locale: Locale; items: Customer[] }) {
  const t = account(locale);
  const a = t.admin;
  const [open, setOpen] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  async function reset(e: React.FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    const r = await api("POST", `/admin/users/${id}/password`, { password });
    setMsg(r.ok ? a.passwordDone : errorText(t, r.data.error));
    if (r.ok) form.reset();
  }
  if (items.length === 0) return <p className="lead">{a.noCustomers}</p>;
  return (
    <ul className="case-list">
      {items.map(c => (
        <li key={c.id}><div>
          <span className="row-top"><b>{c.name}</b> <a className="ltr link" href={`tel:${c.phone}`}>{c.phone}</a></span>
          <small>{c.cases.toLocaleString(locale)} {a.cases} · {a.joined}: {fmtDate(locale, c.createdAt)}{c.lastActivity ? ` · ${a.lastActivity}: ${fmtDate(locale, c.lastActivity)}` : ""}</small>
          <button type="button" className="link-btn" onClick={() => { setOpen(open === c.id ? null : c.id); setMsg(""); }}>{a.resetPassword}</button>
          {open === c.id && (
            <form onSubmit={e => reset(e, c.id)} className="acct-form" noValidate>
              <label htmlFor={`pw${c.id}`}><span>{a.newPassword}</span><input id={`pw${c.id}`} name="password" type="text" autoComplete="off" required /></label>
              <button className="btn ghost" type="submit">{a.save}</button>
              {msg && <p className="notice" role="status">{msg}</p>}
            </form>
          )}
        </div></li>
      ))}
    </ul>
  );
}

function Team({ locale, staff, onChange }: { locale: Locale; staff: User[]; onChange: () => void }) {
  const t = account(locale);
  const a = t.admin;
  const [msg, setMsg] = useState("");
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await api("POST", "/admin/staff", { name: f.get("name"), phone: f.get("phone"), password: f.get("password") });
    setMsg(r.ok ? a.staffDone : errorText(t, r.data.error));
    if (r.ok) { form.reset(); onChange(); }
  }
  return (
    <section>
      <p className="lead">{a.teamIntro}</p>
      <ul className="case-list">{staff.map(s => <li key={s.id}><div><b>{s.name}</b> <span className="ltr">{s.phone}</span></div></li>)}</ul>
      <form onSubmit={add} className="acct-form" noValidate>
        <h3>{a.addStaff}</h3>
        <label htmlFor="sn"><span>{t.name}</span><input id="sn" name="name" required /></label>
        <label htmlFor="sp"><span>{t.phone}</span><input id="sp" name="phone" type="tel" dir="ltr" required /></label>
        <label htmlFor="spw"><span>{t.password} <small>{t.passwordHint}</small></span><input id="spw" name="password" type="password" autoComplete="new-password" required /></label>
        <button className="btn" type="submit">{a.addStaff}</button>
        {msg && <p className="notice" role="status">{msg}</p>}
      </form>
    </section>
  );
}
