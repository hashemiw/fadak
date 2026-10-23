import type { MetadataRoute } from "next";
import { gallery } from "@/data/gallery";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/gallery", "/services", "/about", "/contact", ...gallery.map(g => `/gallery/${g.slug}`)];
  return paths.map(p => ({
    url: `${siteUrl}/en${p}`,
    alternates: { languages: { en: `${siteUrl}/en${p}`, fa: `${siteUrl}/fa${p}` } },
  })).concat(paths.map(p => ({
    url: `${siteUrl}/fa${p}`,
    alternates: { languages: { en: `${siteUrl}/en${p}`, fa: `${siteUrl}/fa${p}` } },
  })));
}
