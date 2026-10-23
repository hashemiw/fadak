// Builds backend/seed/content.json from the static data modules (used once, to fill an empty database).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { createRequire } from "node:module";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "fadak-seed-"));
for (const name of ["gallery", "gallery-batch2", "gallery-en", "site", "site-en", "contact"]) {
  fs.writeFileSync(path.join(temp, `${name}.js`), ts.transpileModule(fs.readFileSync(`src/data/${name}.ts`, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText);
}
fs.copyFileSync("src/data/gallery-en.json", path.join(temp, "gallery-en.json"));
const require = createRequire(import.meta.url);
const fa = require(path.join(temp, "gallery.js")).gallery;
const en = require(path.join(temp, "gallery-en.js")).gallery;
const siteFa = require(path.join(temp, "site.js"));
const siteEn = require(path.join(temp, "site-en.js"));
const contact = require(path.join(temp, "contact.js"));

const text = (i) => ({ title: i.title, description: i.description, alt: i.alt, subcategory: i.subcategory, workTypes: i.workTypes, tags: i.tags });
const gallery = fa.map((g, n) => ({
  id: g.id, slug: g.slug, batch: g.batch, originalPath: g.originalPath, imagePath: g.imagePath, width: g.width, height: g.height,
  category: g.category, featured: g.featured, contentStatus: g.contentStatus, projectId: g.projectId,
  ...(g.watermark ? { watermark: true } : {}), ...(g.kind ? { kind: g.kind } : {}),
  ...(g.relatedIds ? { relatedIds: g.relatedIds } : {}), ...(g.alsoOriginalPaths ? { alsoOriginalPaths: g.alsoOriginalPaths } : {}),
  hidden: false, fa: text(g), en: text(en[n]),
}));
const locale = (s, hero) => ({
  hero, tagline: s.brand.tagline, intro: s.brand.intro, galleryIntro: s.galleryIntro,
  areas: s.areas, services: s.services, process: s.process, about: s.about, projectTypes: s.projectTypes,
});
const site = {
  fa: locale(siteFa, { eyebrow: "طراحی داخلی / نجاری سفارشی / جزئیات", headline: ["فضاهای سنجیده،", "ساخته‌شده برای شما"], caption: "نمونه مرجع — آشپزخانه و کابینت" }),
  en: locale(siteEn, { eyebrow: "INTERIORS / WOODWORK / DETAIL", headline: ["Considered spaces.", "Made personal."], caption: "REFERENCE STUDY — KITCHEN & CABINETRY" }),
};
const c = contact.contact;
const out = { gallery, site, contact: { phone: c.phone, whatsapp: c.whatsapp, instagram: c.instagram, telegram: c.telegram, address: contact.address } };
fs.writeFileSync("backend/seed/content.json", JSON.stringify(out, null, 1));
console.log(`seed: ${gallery.length} gallery records`);
