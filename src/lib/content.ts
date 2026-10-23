import { cache } from "react";
import { gallery as faSeed, publicGalleryItem, type PublicGalleryItem } from "@/data/gallery";
import { gallery as enSeed } from "@/data/gallery-en";
import * as siteFa from "@/data/site";
import * as siteEn from "@/data/site-en";
import { address as addressSeed, contact as contactSeed } from "@/data/contact";
import type { Locale } from "@/lib/i18n";

// Site content is edited in the admin panel and stored in the Go backend. Pages read it here on the server
// (cached ~15 s, and refreshed immediately by /revalidate after an admin saves). If the backend is down or empty,
// the static modules in src/data are used, so the public site never depends on it being up.
const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8080";

async function backend<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND}${path}`, { next: { revalidate: 15, tags: ["content"] } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch { return null; }
}

type Localized = { title: string; description: string; alt: string; subcategory: string; workTypes: string[]; tags: string[] };
type RemoteItem = Omit<PublicGalleryItem, keyof Localized> & { hidden?: boolean; fa: Localized; en: Localized };

const seedFor = (locale: Locale) => (locale === "fa" ? faSeed : enSeed).map(publicGalleryItem);

export const getGallery = cache(async (locale: Locale): Promise<PublicGalleryItem[]> => {
  const remote = await backend<RemoteItem[]>("/api/public/gallery");
  if (!remote || remote.length === 0) return seedFor(locale);
  return remote.map(({ fa, en, hidden: _hidden, ...rest }) => ({ ...rest, ...(locale === "fa" ? fa : en) }) as PublicGalleryItem);
});

export async function getItem(locale: Locale, slug: string) {
  return (await getGallery(locale)).find((g) => g.slug === slug);
}

export type SiteText = {
  hero: { eyebrow: string; headline: string[]; caption: string; imageId?: string };
  tagline: string; intro: string; galleryIntro: string;
  areas: { title: string; text: string; image: string | null }[];
  services: { id: string; title: string; text: string; images: string[] }[];
  process: { title: string; text: string }[];
  about: { lead: string; body: string[]; approach: { title: string; text: string }[]; photos: { src: string; alt: string; caption: string; width: number; height: number }[] };
};

const heroSeed = {
  fa: { imageId: "b1-13", eyebrow: "طراحی داخلی / نجاری سفارشی / جزئیات", headline: ["فضاهای سنجیده،", "ساخته‌شده برای شما"], caption: "نمونه مرجع — آشپزخانه و کابینت" },
  en: { imageId: "b1-13", eyebrow: "INTERIORS / WOODWORK / DETAIL", headline: ["Considered spaces.", "Made personal."], caption: "REFERENCE STUDY — KITCHEN & CABINETRY" },
};

function seedText(locale: Locale): SiteText {
  const s = locale === "fa" ? siteFa : siteEn;
  return { hero: heroSeed[locale], tagline: s.brand.tagline, intro: s.brand.intro, galleryIntro: s.galleryIntro, areas: s.areas, services: s.services, process: s.process, about: s.about };
}

// A stored value is used only when it has the same shape as the default, so a bad edit cannot break a page.
const sameShape = (a: unknown, b: unknown) => Array.isArray(a) ? Array.isArray(b) : typeof a === typeof b && (a === null) === (b === null);

export const getSite = cache(async (locale: Locale): Promise<SiteText> => {
  const base = seedText(locale);
  const remote = await backend<{ site?: Partial<Record<Locale, Partial<SiteText>>> }>("/api/public/site");
  const over = remote?.site?.[locale];
  if (!over) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(over)) {
    const def = (base as Record<string, unknown>)[k];
    if (!(k in base) || !sameShape(v, def)) continue;
    // Objects (hero, about) are merged so a missing field keeps its default.
    out[k] = def && typeof def === "object" && !Array.isArray(def) ? { ...(def as object), ...(v as object) } : v;
  }
  return out as SiteText;
});

export type ContactData = { phone: string; whatsapp: string; instagram: string; telegram: string; address: { fa: string; en: string } };
export const getContact = cache(async (): Promise<ContactData> => {
  const remote = await backend<{ contact?: Partial<ContactData> }>("/api/public/site");
  const c = remote?.contact;
  const base: ContactData = { phone: contactSeed.phone, whatsapp: contactSeed.whatsapp, instagram: contactSeed.instagram, telegram: contactSeed.telegram, address: addressSeed };
  if (!c) return base;
  return { ...base, ...c, address: { ...base.address, ...(c.address ?? {}) } } as ContactData;
});

export const phoneDisplay = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("98") && d.length === 12 ? `+98 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}` : phone;
};
