"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { adminContent } from "@/data/admin-content-i18n";
import type { Locale } from "@/lib/i18n";

export type Loc = { title: string; description: string; alt: string; subcategory: string; workTypes: string[]; tags: string[] };
export type AdminItem = {
  id: string; slug: string; batch: number; originalPath: string; imagePath: string; width: number; height: number; category: string; featured: boolean;
  contentStatus: "unverified" | "verified"; projectId: string | null; watermark?: boolean; kind?: string; relatedIds?: string[]; alsoOriginalPaths?: string[];
  hidden: boolean; fa: Loc; en: Loc;
};
const emptyLoc = (): Loc => ({ title: "", description: "", alt: "", subcategory: "", workTypes: [], tags: [] });
const csv = (v: string) => v.split(/[,،]/).map(x => x.trim()).filter(Boolean);

// Tell the website to drop its cached content so the change is visible at once.
export const publish = () => fetch("/revalidate", { method: "POST" }).catch(() => undefined);

export default function GalleryManager({ locale }: { locale: Locale }) {
  const t = adminContent(locale).gallery;
  const [items, setItems] = useState<AdminItem[]>([]);
  const [editing, setEditing] = useState<AdminItem | "new" | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await api<AdminItem[]>("GET", "/admin/gallery");
    if (r.ok) setItems(r.data as unknown as AdminItem[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const title = (i: AdminItem) => (locale === "fa" ? i.fa.title : i.en.title);
  async function remove(i: AdminItem) {
    if (!window.confirm(t.confirmDelete)) return;
    await api("DELETE", `/admin/gallery/${i.id}`); await publish(); load();
  }
  async function toggleHidden(i: AdminItem) {
    await api("PUT", `/admin/gallery/${i.id}`, { ...i, hidden: !i.hidden }); await publish(); load();
  }
  async function move(index: number, dir: -1 | 1) {
    const ids = items.map(i => i.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    setItems(prev => { const c = [...prev]; [c[index], c[j]] = [c[j], c[index]]; return c; });
    await api("POST", "/admin/gallery-order", { ids }); await publish();
  }

  if (editing) {
    return <ItemForm locale={locale} item={editing === "new" ? null : editing} existing={items}
      onDone={async (saved) => { setEditing(null); if (saved) { setMsg(t.saved); await publish(); load(); } }} />;
  }
  return (
    <section>
      <div className="acct-bar">
        <p className="muted-note">{items.length.toLocaleString(locale)} {t.count}</p>
        <button className="btn" onClick={() => { setMsg(""); setEditing("new"); }}>{t.add}</button>
      </div>
      {msg && <p className="notice ok" role="status">{msg}</p>}
      {items.length === 0 ? <p className="lead">{t.empty}</p> : (
        <ul className="case-list gm-list">
          {items.map((i, n) => (
            <li key={i.id}>
              <div className="gm-row">
                <img src={i.imagePath} alt="" width={64} height={64} loading="lazy" />
                <div className="gm-main">
                  <b>{title(i)}</b>
                  <span className="row-top">
                    <small>{t.categories[i.category as keyof typeof t.categories]}</small>
                    {i.hidden && <span className="status-pill">{t.hidden}</span>}
                    {i.featured && <span className="status-pill">{t.featured}</span>}
                    {i.watermark && <span className="status-pill">{t.watermark}</span>}
                    {i.contentStatus === "unverified" && <span className="status-pill">{t.unverified}</span>}
                  </span>
                </div>
                <div className="gm-actions">
                  <button type="button" className="link-btn" onClick={() => move(n, -1)} disabled={n === 0}>{t.up}</button>
                  <button type="button" className="link-btn" onClick={() => move(n, 1)} disabled={n === items.length - 1}>{t.down}</button>
                  <button type="button" className="link-btn" onClick={() => toggleHidden(i)}>{i.hidden ? t.show : t.hide}</button>
                  <button type="button" className="link-btn" onClick={() => { setMsg(""); setEditing(i); }}>{t.edit}</button>
                  <button type="button" className="link-btn danger" onClick={() => remove(i)}>{t.remove}</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ItemForm({ locale, item, existing, onDone }: { locale: Locale; item: AdminItem | null; existing: AdminItem[]; onDone: (saved: boolean) => void }) {
  const t = adminContent(locale).gallery;
  const creating = item === null;
  const [d, setD] = useState<AdminItem>(item ?? {
    id: "", slug: "", batch: 3, originalPath: "", imagePath: "", width: 0, height: 0, category: "office", featured: false, contentStatus: "unverified",
    projectId: null, hidden: false, fa: emptyLoc(), en: emptyLoc(),
  });
  const [wt, setWt] = useState({ fa: d.fa.workTypes.join("، "), en: d.en.workTypes.join(", ") });
  const [tg, setTg] = useState({ fa: d.fa.tags.join("، "), en: d.en.tags.join(", ") });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof AdminItem>(k: K, v: AdminItem[K]) => setD(prev => ({ ...prev, [k]: v }));
  const setLoc = (l: "fa" | "en", k: keyof Loc, v: string) => setD(prev => ({ ...prev, [l]: { ...prev[l], [k]: v } }));

  async function chooseImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    setBusy(true); setError("");
    const r = await api<{ path: string; width: number; height: number }>("POST", "/admin/media", fd);
    setBusy(false);
    if (!r.ok) { setError((t.errors as Record<string, string>)[r.status === 413 ? "too_large" : r.data.error ?? ""] ?? t.errors.default); return; }
    setD(prev => ({ ...prev, imagePath: r.data.path, width: r.data.width, height: r.data.height }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.imagePath) { setError(t.needImage); return; }
    if (creating && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) { setError(t.needSlug); return; }
    if (!d.fa.title.trim() || !d.en.title.trim() || !d.fa.alt.trim() || !d.en.alt.trim()) { setError(t.needTitles); return; }
    const body: AdminItem = {
      ...d,
      id: creating ? `c-${d.slug}`.slice(0, 41) : d.id,
      fa: { ...d.fa, workTypes: csv(wt.fa), tags: csv(tg.fa) },
      en: { ...d.en, workTypes: csv(wt.en), tags: csv(tg.en) },
      projectId: d.contentStatus === "verified" && d.projectId ? d.projectId : null,
      kind: d.kind || undefined,
    };
    if (creating && existing.some(x => x.id === body.id || x.slug === body.slug)) { setError(t.errors.duplicate); return; }
    setBusy(true); setError("");
    const r = creating ? await api("POST", "/admin/gallery", body) : await api("PUT", `/admin/gallery/${d.id}`, body);
    setBusy(false);
    if (!r.ok) { setError((t.errors as Record<string, string>)[r.data.error ?? ""] ?? t.errors.default); return; }
    onDone(true);
  }

  const locBlock = (l: "fa" | "en") => (
    <fieldset className="loc-block" dir={l === "fa" ? "rtl" : "ltr"}>
      <legend>{l === "fa" ? t.fa : t.en}</legend>
      <label><span>{t.title}</span><input value={d[l].title} maxLength={200} onChange={e => setLoc(l, "title", e.target.value)} /></label>
      <label><span>{t.description}</span><textarea value={d[l].description} maxLength={2000} onChange={e => setLoc(l, "description", e.target.value)} /></label>
      <label><span>{t.alt}</span><input value={d[l].alt} maxLength={300} onChange={e => setLoc(l, "alt", e.target.value)} /></label>
      <label><span>{t.subcategory}</span><input value={d[l].subcategory} maxLength={100} onChange={e => setLoc(l, "subcategory", e.target.value)} /></label>
      <label><span>{t.workTypes}</span><input value={wt[l]} onChange={e => setWt(p => ({ ...p, [l]: e.target.value }))} /></label>
      <label><span>{t.tags}</span><input value={tg[l]} onChange={e => setTg(p => ({ ...p, [l]: e.target.value }))} /></label>
    </fieldset>
  );

  return (
    <form onSubmit={submit} className="acct-form gm-form" noValidate>
      <h3>{creating ? t.add : `${t.edit}: ${locale === "fa" ? item!.fa.title : item!.en.title}`}</h3>
      <div className="gm-image">
        {d.imagePath && <img src={d.imagePath} alt="" width={d.width} height={d.height} style={{ maxWidth: 220, height: "auto" }} />}
        <label className="upload"><span>{d.imagePath ? t.replaceImage : t.chooseImage}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={busy} /></label>
        <p className="muted-note">{t.imageHint}</p>
      </div>
      {creating && (
        <label><span>{t.slug}</span><input value={d.slug} dir="ltr" onChange={e => set("slug", e.target.value.toLowerCase())} placeholder="white-reception-desk" />
          <small className="muted-note">{t.slugHint}</small></label>
      )}
      <label><span>{t.category}</span>
        <select value={d.category} onChange={e => set("category", e.target.value)}>
          {Object.entries(t.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></label>
      <label className="check"><input type="checkbox" checked={d.featured} onChange={e => set("featured", e.target.checked)} /> <span>{t.featuredLabel}</span></label>
      <label className="check"><input type="checkbox" checked={d.hidden} onChange={e => set("hidden", e.target.checked)} /> <span>{t.hiddenLabel}</span></label>
      <label className="check"><input type="checkbox" checked={!!d.watermark} onChange={e => set("watermark", e.target.checked)} /> <span>{t.watermarkLabel}</span></label>
      <label><span>{t.status}</span>
        <select value={d.contentStatus} onChange={e => set("contentStatus", e.target.value as AdminItem["contentStatus"])}>
          <option value="unverified">{t.unverified}</option><option value="verified">{t.verified}</option>
        </select></label>
      {d.contentStatus === "verified" && <label><span>{t.projectId}</span><input value={d.projectId ?? ""} dir="ltr" maxLength={80} onChange={e => set("projectId", e.target.value)} /></label>}
      <label><span>{t.kind}</span>
        <select value={d.kind ?? ""} onChange={e => set("kind", e.target.value)}>
          <option value="">{t.kindNone}</option><option value="reference-3d">{t.kind3d}</option>
        </select></label>
      {locBlock("fa")}
      {locBlock("en")}
      {error && <p className="notice" role="alert">{error}</p>}
      <div className="gm-actions">
        <button className="btn" type="submit" disabled={busy}>{busy ? t.saving : t.save}</button>
        <button className="btn ghost" type="button" onClick={() => onDone(false)}>{t.cancel}</button>
      </div>
    </form>
  );
}
