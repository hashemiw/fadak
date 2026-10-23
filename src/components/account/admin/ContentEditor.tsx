"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { adminContent } from "@/data/admin-content-i18n";
import { publish, type AdminItem } from "./GalleryManager";
import type { Locale } from "@/lib/i18n";

type Contact = { phone: string; whatsapp: string; instagram: string; telegram: string; address: { fa: string; en: string } };
type Item = { title: string; text: string };
type Area = Item & { image: string | null };
type Service = Item & { id: string; images: string[] };
type SiteLocale = {
  hero: { eyebrow: string; headline: string[]; caption: string; imageId?: string };
  tagline: string; intro: string; galleryIntro: string;
  areas: Area[]; services: Service[]; process: Item[];
  about: { lead: string; body: string[]; approach: Item[]; photos?: unknown[] };
  [k: string]: unknown;
};
type Site = Record<"fa" | "en", SiteLocale>;

const blankLocale = (): SiteLocale => ({ hero: { eyebrow: "", headline: ["", ""], caption: "" }, tagline: "", intro: "", galleryIntro: "", areas: [], services: [], process: [], about: { lead: "", body: [], approach: [] } });
const move = <T,>(list: T[], i: number, d: -1 | 1) => { const c = [...list]; const j = i + d; if (j < 0 || j >= c.length) return c; [c[i], c[j]] = [c[j], c[i]]; return c; };

export default function ContentEditor({ locale }: { locale: Locale }) {
  const t = adminContent(locale).content;
  const [contact, setContact] = useState<Contact>({ phone: "", whatsapp: "", instagram: "", telegram: "", address: { fa: "", en: "" } });
  const [site, setSite] = useState<Site>({ fa: blankLocale(), en: blankLocale() });
  const [lang, setLang] = useState<"fa" | "en">(locale);
  const [gallery, setGallery] = useState<AdminItem[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, g] = await Promise.all([api<{ site?: Site; contact?: Contact }>("GET", "/public/site"), api<AdminItem[]>("GET", "/admin/gallery")]);
      if (s.ok) {
        if (s.data.contact) setContact({ ...contact, ...s.data.contact, address: { ...contact.address, ...(s.data.contact.address ?? {}) } });
        if (s.data.site) setSite({ fa: { ...blankLocale(), ...s.data.site.fa }, en: { ...blankLocale(), ...s.data.site.en } });
      }
      if (g.ok) setGallery(g.data as unknown as AdminItem[]);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const L = site[lang];
  const upd = (fn: (l: SiteLocale) => SiteLocale) => setSite(prev => ({ ...prev, [lang]: fn(prev[lang]) }));
  const galleryLabel = (i: AdminItem) => `${i.id} — ${i[lang].title}`.slice(0, 80);

  async function save() {
    setMsg(null);
    const [a, b] = await Promise.all([api("PUT", "/admin/content/contact", contact), api("PUT", "/admin/content/site", site)]);
    if (a.ok && b.ok) { await publish(); setMsg({ ok: true, text: t.saved }); } else setMsg({ ok: false, text: t.failed });
  }

  const text = (label: string, value: string, on: (v: string) => void, opts: { area?: boolean; dir?: "ltr" } = {}) => (
    <label><span>{label}</span>
      {opts.area ? <textarea value={value} maxLength={5000} onChange={e => on(e.target.value)} /> : <input value={value} dir={opts.dir} maxLength={5000} onChange={e => on(e.target.value)} />}
    </label>
  );
  const imageSelect = (value: string | null | undefined, on: (v: string | null) => void) => (
    <select value={value ?? ""} onChange={e => on(e.target.value || null)}>
      <option value="">{t.none}</option>
      {gallery.map(i => <option key={i.id} value={i.id}>{galleryLabel(i)}</option>)}
    </select>
  );
  const itemControls = (list: unknown[], i: number, set: (l: never[]) => void) => (
    <div className="gm-actions">
      <button type="button" className="link-btn" onClick={() => set(move(list, i, -1) as never[])} disabled={i === 0}>{t.up}</button>
      <button type="button" className="link-btn" onClick={() => set(move(list, i, 1) as never[])} disabled={i === list.length - 1}>{t.down}</button>
      <button type="button" className="link-btn danger" onClick={() => set(list.filter((_, k) => k !== i) as never[])}>{t.remove}</button>
    </div>
  );
  const setAt = <T,>(list: T[], i: number, patch: Partial<T>) => list.map((x, k) => (k === i ? { ...x, ...patch } : x));

  if (!ready) return <p className="lead">…</p>;
  return (
    <div className="acct-form gm-form">
      <section className="ed-item">
        <h3>{t.contactTitle}</h3>
        {text(t.phone, contact.phone, v => setContact({ ...contact, phone: v }), { dir: "ltr" })}
        {text(t.whatsapp, contact.whatsapp, v => setContact({ ...contact, whatsapp: v }), { dir: "ltr" })}
        {text(t.instagram, contact.instagram, v => setContact({ ...contact, instagram: v }), { dir: "ltr" })}
        {text(t.telegram, contact.telegram, v => setContact({ ...contact, telegram: v }), { dir: "ltr" })}
        {text(t.addressFa, contact.address.fa, v => setContact({ ...contact, address: { ...contact.address, fa: v } }))}
        {text(t.addressEn, contact.address.en, v => setContact({ ...contact, address: { ...contact.address, en: v } }), { dir: "ltr" })}
      </section>

      <h3>{t.textTitle}</h3>
      <div className="tabs" role="group" aria-label={t.language}>
        {(["fa", "en"] as const).map(l => <button key={l} type="button" className="chip" aria-pressed={lang === l} onClick={() => setLang(l)}>{l === "fa" ? "فارسی" : "English"}</button>)}
      </div>

      <div className="ed-list" dir={lang === "fa" ? "rtl" : "ltr"}>
        <section className="ed-item">
          <h3>{t.hero}</h3>
          {text(t.eyebrow, L.hero.eyebrow, v => upd(l => ({ ...l, hero: { ...l.hero, eyebrow: v } })))}
          {text(t.line1, L.hero.headline[0] ?? "", v => upd(l => ({ ...l, hero: { ...l.hero, headline: [v, l.hero.headline[1] ?? ""] } })))}
          {text(t.line2, L.hero.headline[1] ?? "", v => upd(l => ({ ...l, hero: { ...l.hero, headline: [l.hero.headline[0] ?? "", v] } })))}
          {text(t.caption, L.hero.caption, v => upd(l => ({ ...l, hero: { ...l.hero, caption: v } })))}
          <label><span>{t.heroImage}</span>{imageSelect(L.hero.imageId, v => upd(l => ({ ...l, hero: { ...l.hero, imageId: v ?? undefined } })))}</label>
          {text(t.tagline, L.tagline, v => upd(l => ({ ...l, tagline: v })))}
          {text(t.intro, L.intro, v => upd(l => ({ ...l, intro: v })), { area: true })}
          {text(t.galleryIntro, L.galleryIntro, v => upd(l => ({ ...l, galleryIntro: v })), { area: true })}
        </section>

        <section className="ed-item">
          <h3>{t.areas}</h3>
          {L.areas.map((a, i) => (
            <div className="ed-item" key={i}>
              {text(t.itemTitle, a.title, v => upd(l => ({ ...l, areas: setAt(l.areas, i, { title: v }) })))}
              {text(t.itemText, a.text, v => upd(l => ({ ...l, areas: setAt(l.areas, i, { text: v }) })), { area: true })}
              <label><span>{t.itemImage}</span>{imageSelect(a.image, v => upd(l => ({ ...l, areas: setAt(l.areas, i, { image: v }) })))}</label>
              {itemControls(L.areas, i, list => upd(l => ({ ...l, areas: list as Area[] })))}
            </div>
          ))}
          <button type="button" className="btn ghost" onClick={() => upd(l => ({ ...l, areas: [...l.areas, { title: "", text: "", image: null }] }))}>{t.add}</button>
        </section>

        <section className="ed-item">
          <h3>{t.services}</h3>
          {L.services.map((s, i) => (
            <div className="ed-item" key={i}>
              {text(t.itemTitle, s.title, v => upd(l => ({ ...l, services: setAt(l.services, i, { title: v }) })))}
              {text(t.itemText, s.text, v => upd(l => ({ ...l, services: setAt(l.services, i, { text: v }) })), { area: true })}
              {text(t.serviceId, s.id, v => upd(l => ({ ...l, services: setAt(l.services, i, { id: v.toLowerCase().replace(/[^a-z0-9-]/g, "") }) })), { dir: "ltr" })}
              <label><span>{t.itemImages}</span>
                <select multiple value={s.images} onChange={e => { const v = [...e.target.selectedOptions].map(o => o.value); upd(l => ({ ...l, services: setAt(l.services, i, { images: v }) })); }}>
                  {gallery.map(g => <option key={g.id} value={g.id}>{galleryLabel(g)}</option>)}
                </select></label>
              {itemControls(L.services, i, list => upd(l => ({ ...l, services: list as Service[] })))}
            </div>
          ))}
          <button type="button" className="btn ghost" onClick={() => upd(l => ({ ...l, services: [...l.services, { id: `service-${l.services.length + 1}`, title: "", text: "", images: [] }] }))}>{t.add}</button>
        </section>

        <section className="ed-item">
          <h3>{t.process}</h3>
          {L.process.map((p, i) => (
            <div className="ed-item" key={i}>
              {text(t.itemTitle, p.title, v => upd(l => ({ ...l, process: setAt(l.process, i, { title: v }) })))}
              {text(t.itemText, p.text, v => upd(l => ({ ...l, process: setAt(l.process, i, { text: v }) })), { area: true })}
              {itemControls(L.process, i, list => upd(l => ({ ...l, process: list as Item[] })))}
            </div>
          ))}
          <button type="button" className="btn ghost" onClick={() => upd(l => ({ ...l, process: [...l.process, { title: "", text: "" }] }))}>{t.add}</button>
        </section>

        <section className="ed-item">
          <h3>{t.about}</h3>
          {text(t.aboutLead, L.about.lead, v => upd(l => ({ ...l, about: { ...l.about, lead: v } })), { area: true })}
          {text(t.aboutBody, L.about.body.join("\n\n"), v => upd(l => ({ ...l, about: { ...l.about, body: v.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean) } })), { area: true })}
          <h3>{t.approach}</h3>
          {L.about.approach.map((a, i) => (
            <div className="ed-item" key={i}>
              {text(t.itemTitle, a.title, v => upd(l => ({ ...l, about: { ...l.about, approach: setAt(l.about.approach, i, { title: v }) } })))}
              {text(t.itemText, a.text, v => upd(l => ({ ...l, about: { ...l.about, approach: setAt(l.about.approach, i, { text: v }) } })), { area: true })}
              {itemControls(L.about.approach, i, list => upd(l => ({ ...l, about: { ...l.about, approach: list as Item[] } })))}
            </div>
          ))}
          <button type="button" className="btn ghost" onClick={() => upd(l => ({ ...l, about: { ...l.about, approach: [...l.about.approach, { title: "", text: "" }] } }))}>{t.add}</button>
        </section>
      </div>

      {msg && <p className={`notice${msg.ok ? " ok" : ""}`} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
      <button className="btn" type="button" onClick={save}>{t.save}</button>
    </div>
  );
}
