import type { Metadata } from "next";
import { brand } from "@/data/site";
export const locales = ["en", "fa"] as const;
export type Locale = typeof locales[number];
export const isLocale = (value: string): value is Locale => value === "en" || value === "fa";
export function localizedMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return { title: { absolute: `${title} | ${locale === "fa" ? brand.name : brand.nameEn}` }, description, alternates: {
    canonical: `/${locale}${path}`,
    languages: { en: `/en${path}`, fa: `/fa${path}`, "x-default": `/en${path}` },
  } };
}
