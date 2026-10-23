import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fadak-data-'));
for (const name of ['gallery', 'gallery-batch2', 'gallery-en']) {
  fs.writeFileSync(path.join(temp, `${name}.js`), ts.transpileModule(fs.readFileSync(`src/data/${name}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText);
}
fs.copyFileSync('src/data/gallery-en.json', path.join(temp, 'gallery-en.json'));
const require = createRequire(import.meta.url);
const { gallery, publicGalleryItem } = require(path.join(temp, 'gallery.js'));
const english = require(path.join(temp, 'gallery-en.js')).gallery;
const translations = JSON.parse(fs.readFileSync('src/data/gallery-en.json', 'utf8'));
assert.equal(gallery.length, 33);
assert.equal(Object.keys(translations).length, gallery.length);
assert(!gallery.some(item => item.id === 'b1-09'));
for (const [index, item] of gallery.entries()) {
  const en = english[index];
  assert.equal(item.contentStatus, 'unverified');
  assert.equal(item.projectId, null);
  assert(!(item.watermark && item.featured));
  for (const key of ['id','slug','imagePath','originalPath','width','height','contentStatus','projectId','watermark','kind']) assert.equal(en[key], item[key], `${item.id}: ${key}`);
  assert(en.description.length > 60);
  assert(!/[\u0600-\u06ff]/.test([en.title,en.description,en.alt,en.subcategory,...en.tags,...en.workTypes].join(' ')));
  assert(fs.existsSync(`public${item.imagePath}`));
  assert(!('originalPath' in publicGalleryItem(item)));
}
const base = process.env.TEST_BASE_URL;
if (base) {
  const checkRedirect = async (route, destination, status = 308) => {
    const response = await fetch(base + route, { redirect: 'manual', headers: { 'accept-language': 'fa-IR,fa;q=0.9' } });
    assert.equal(response.status, status, route);
    const actual = new URL(response.headers.get('location'), base);
    assert.equal(actual.pathname + actual.search, destination, route);
  };
  await checkRedirect('/', '/en', 307);
  for (const page of ['gallery','services','about','contact']) await checkRedirect(`/${page}?source=legacy`, `/fa/${page}?source=legacy`);
  await checkRedirect('/gallery/' + gallery[0].slug, '/fa/gallery/' + gallery[0].slug);
  for (const prefix of ['', '/en', '/fa']) await checkRedirect(`${prefix}/gallery/bright-office-group-desks-dividers`, `${prefix || '/fa'}/gallery`);
  for (const locale of ['en', 'fa']) {
    const routes = ['', '/about', '/services', '/contact', '/gallery', ...gallery.map(item => `/gallery/${item.slug}`)];
    for (const route of routes) {
      const response = await fetch(base + '/' + locale + route);
      assert.equal(response.status, 200, locale + route);
      const html = (await response.text()).replaceAll('http://localhost:3000', ''); // metadataBase makes alternates absolute
      assert(html.includes(`lang="${locale}" dir="${locale === 'fa' ? 'rtl' : 'ltr'}"`), locale + route);
      assert(html.includes(`hrefLang="${locale === 'fa' ? 'en' : 'fa'}"`) || html.includes(`hrefLang="${locale === 'fa' ? 'en' : 'fa'}"`.toLowerCase()));
      for (const lang of ['en', 'fa']) assert(html.includes(`hrefLang="${lang}" href="/${lang}${route}"`) || html.includes(`hreflang="${lang}" href="/${lang}${route}"`), 'alternate '+locale+route);
      assert(!/href="\/(gallery|services|contact|about)(?:["/])/.test(html), 'unlocalized link '+route);
      assert(!html.includes('/Users/hashemi/Downloads'), 'source path exposed '+route);
      if (locale === 'en') assert(/<title>[^<]+Fadak Atelier<\/title>/.test(html), 'title '+route);
    }
    for (const route of ['/missing-page', '/gallery/missing-image']) {
      const response = await fetch(base + '/' + locale + route);
      const html = await response.text();
      assert.equal(response.status, 404, locale+route);
      // Next serves the 404 shell and renders the localized page on the client, so only the status is checked here.
    }
  }
  for (const item of gallery) assert.equal((await fetch(base + item.imagePath, {method:'HEAD'})).status, 200, item.imagePath);
}
fs.rmSync(temp, {recursive:true});
console.log(`PASS: 33 gallery records, translation coverage, provenance, flags and assets${base ? '; 76 localized pages, metadata, legacy redirects, 404s and asset responses' : ''}.`);
