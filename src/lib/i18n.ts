import type { Metadata } from "next";
import { brand } from "@/data/site";
export const locales = ["en", "fa"] as const;
export type Locale = typeof locales[number];
export const isLocale = (value: string): value is Locale => value === "en" || value === "fa";
export function localizedMetadata(locale: Locale, path: string, title: string, description: string, image = "/assets/gallery/img-13.jpg"): Metadata {
  return { title: { absolute: `${title} | ${locale === "fa" ? brand.name : brand.nameEn}` }, description, openGraph: { title, description, locale: locale === "fa" ? "fa_IR" : "en_US", type: "website", images: [{ url: image }] }, twitter: { card: "summary_large_image" }, alternates: {
    canonical: `/${locale}${path}`,
    languages: { en: `/en${path}`, fa: `/fa${path}`, "x-default": `/en${path}` },
  } };
}
