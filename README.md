# آتلیه فدک | Fadak Atelier

Next.js (App Router, TypeScript) content site. No database, no backend, no CMS.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Where content lives

| File | What |
|---|---|
| `src/data/gallery.ts` | One record per image (id, slug, batch, originalPath, imagePath, title, description, alt, category, tags, featured, contentStatus, projectId) |
| `src/data/site.ts` | Brand text, nav, services, activity areas, collaboration steps, About text |
| `src/data/contact.ts` | Phone, WhatsApp, Instagram, service area, form endpoint |
| `public/assets/gallery/` | Site copies of the images (`img-02.jpg` … `img-17.jpg`) |
| `public/fonts/` | Vazirmatn static woff2 files (loaded locally, no Google Fonts) |

Originals in `~/Downloads/ -N.jpg` (note the leading space) were copied, never moved; `originalPath` keeps the link.

## Common edits

- **Add an image:** copy it to `public/assets/gallery/img-NN.jpg`, add a seed in `gallery.ts` (set `n`, `slug`, real `width`/`height` — `sips -g pixelWidth -g pixelHeight file`, `category`, `subcategory`, `workTypes`, `tags`). Use `batch` > 1 for later series if you adapt the mapping.
- **Change category:** edit `category` / `subcategory` / `workTypes` on the seed. New category: add it to `Category` and `categories`. Filter chips appear only for categories/work types that have items.
- **Featured on home:** add or remove `featured: true` on a seed.
- **Promote to a confirmed project:** set `projectId` to the project id and `contentStatus` to `"verified"` in the generated record (add overrides in the seed type), then edit title/description. The "not attributed to a project" note on the detail page disappears when `contentStatus` is `"verified"`. Add project fields (client, year, …) to `GalleryItem` and render them in `src/app/gallery/[slug]/page.tsx` only when present.
- **Gallery → Projects:** rename the route/labels once items are verified.
- **Team/workshop photos:** push entries into `about.photos` in `site.ts`; the section stays hidden while empty.

## Batch 2 (reference images)

- `src/data/gallery-batch2.ts`: 18 records with `batch: 2`, `contentStatus: "unverified"`, `projectId: null`. Site copies are `public/assets/gallery/b2-*.jpg`.
- Optional flags: `watermark` (shows a note, never use as hero/featured; mark is not removed), `kind: "reference-3d"`, `relatedIds` (possible same model, internal only).
- `Office Interior.jpg` is the same scene as ` -3.jpg`: no new card; `b1-03` now uses the slightly larger file and lists both paths (`originalPath`, `alsoOriginalPaths`).
- `example.com` in Downloads is a JPEG of a kitchen with no description; it was not added.

## Not active yet (needs your input)

- **Phone, WhatsApp, Instagram, service area:** empty in `contact.ts`; the related links/sections are hidden until filled.
- **Contact form sending:** disabled preview with an explanatory notice. To enable, set `formEndpoint` in `contact.ts` to a URL that accepts a JSON `POST` (`name, phone, projectType, city, message`). Data goes only to that URL, never into the page URL or logs.
- No domain, structured data, ratings or business address were created.
