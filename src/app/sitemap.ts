import type { MetadataRoute } from "next";
import { getGallery } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const gallery = await getGallery("fa");
  const paths = ["", "/gallery", "/services", "/about", "/contact", ...gallery.map(g => `/gallery/${g.slug}`)];
  return paths.map(p => ({
    url: `${siteUrl}/en${p}`,
    alternates: { languages: { en: `${siteUrl}/en${p}`, fa: `${siteUrl}/fa${p}` } },
  })).concat(paths.map(p => ({
    url: `${siteUrl}/fa${p}`,
    alternates: { languages: { en: `${siteUrl}/en${p}`, fa: `${siteUrl}/fa${p}` } },
  })));
}
