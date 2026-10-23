# آتلیه فدک | Fadak Atelier

Next.js (App Router, TypeScript) content site. No database, no backend, no CMS.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

> **Content is now edited in the admin panel.** Gallery records, page texts and contact details live in the backend database (`backend/data`). The files in `src/data/` (`gallery.ts`, `gallery-batch2.ts`, `gallery-en.*`, `site*.ts`, `contact.ts`) are only the **first-start seed and the fallback** if the backend is unreachable; editing them does not change the live site once the database has content. Use the panel instead. The "Common edits" below describe the old file-based workflow.

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

## Languages

- `/` redirects (307) to `/en`; Persian lives at `/fa`. The browser language never changes this.
- Old unprefixed paths (`/gallery`, `/services`, `/about`, `/contact`, `/gallery/<slug>`) redirect to `/fa/...`.
- Pages: `src/app/[locale]/`; per-language views in `src/views/{en,fa}`; English data in `src/data/site-en.ts` and `src/data/gallery-en.json` (keyed by gallery id).
- English look: `src/app/en.css` (Manrope, local). Persian look: `src/app/fa.css` (Vazirmatn). Keep them separate.
- Adding a gallery item: also add its English entry to `gallery-en.json`; `npm run build && TEST_BASE_URL=http://localhost:3000 node tests/verify.mjs` (with the server running) checks coverage.
- Not built: customer accounts/files (needs a backend and auth, outside the current no-backend scope).

## Accounts, projects and enquiries (Go backend)

`backend/` is a standalone Go service (stdlib `net/http` + SQLite via `modernc.org/sqlite`, no CGO). The Next.js site proxies `/api/*` to it (`next.config.mjs`, `BACKEND_URL`, default `http://127.0.0.1:8080`), so cookies stay same-origin.

Run both (two terminals):

```bash
cp backend/.env.example backend/.env   # set ADMIN_PHONE / ADMIN_PASSWORD (staff login), never commit it
npm run backend                        # http://127.0.0.1:8080
npm run dev                            # http://localhost:3000
```

- **Customers:** sign up with name + phone + password at `/en/account` or `/fa/account` (one account for both languages), open a project, exchange messages, upload private files (JPG/PNG/WebP/PDF, 10 MB, 20 per project), delete their account and all data.
- **Staff:** the account created from `ADMIN_PHONE`/`ADMIN_PASSWORD` sees all projects, replies, sets the status, downloads files and sees public enquiries. Restarting the backend resets that password to the configured one (this is also how customer passwords are "reset": there is no email/SMS yet).
- **Enquiries:** the contact form posts to `/api/inquiries`; saved gallery references (favourites, stored only in the visitor's browser) are attached when they tick the box.
- **Data:** `backend/data/` (SQLite + `uploads/`, git-ignored). Files are only served through authenticated, owner/staff-checked downloads with `nosniff` and `attachment`.
- **Security basics:** bcrypt, random session tokens (only hashes stored), HttpOnly SameSite=Lax cookie (`COOKIE_SECURE=true` behind HTTPS), Origin check on every state-changing request, rate limits on sign-up/sign-in/enquiries, file type sniffed from content. Set `ALLOWED_ORIGINS` to the real site origin(s) when deploying.
- **Not built:** email/SMS notifications or verification, password reset, an admin screen beyond the project list. Customer text and files are never translated or sent to third parties.
- Tests: `cd backend && go test ./...`; site: build, start, then `TEST_BASE_URL=http://localhost:3000 npm run test:site`.

## Other additions

Saved references (heart button, "Saved" filter, attached to enquiries/projects), previous/next on image pages (arrow keys too), WhatsApp button, Telegram/Instagram/phone from `src/data/contact.ts`, `sitemap.xml`, `robots.txt`, favicon, Open Graph tags (set `NEXT_PUBLIC_SITE_URL` once a real domain exists; it defaults to `http://localhost:3000`).
Known issue: for unknown URLs Next serves the correct 404 status, but the localized "not found" text is rendered on the client (empty without JavaScript).

## Admin panel (`/en/admin`, `/fa/admin`)

Staff accounts (the `ADMIN_PHONE` one, plus any added under *Team*) sign in at the normal account page and get an **Admin panel** button.

- **Dashboard:** counters (awaiting our reply, unread, in progress, completed, new enquiries), search by name/phone/title, status filter, "awaiting reply only" toggle. Projects waiting for a reply come first; the browser tab title shows `(n)` while any wait. The page refreshes every 8 seconds while visible.
- **Project workspace:** client contact (call / WhatsApp links), change status (logged in the project history the client also sees), reply to the client, upload/download/delete files, **internal notes** (staff only, never sent to the client), full timeline.
- **Enquiries:** from the contact form, with call/WhatsApp links and a handled/new toggle.
- **Clients:** list with project counts; set a new password for a client (signs them out everywhere) since there is no email/SMS reset yet.
- **Team:** add staff members.
- Customers see a "New reply" badge on projects with staff activity they have not opened yet.
- Updates are polling-based (8 s), not push; there is no email/SMS/WhatsApp notification when a client writes, so keep the dashboard open or check it regularly.

## Editing the site from the admin panel (Gallery and Texts tabs)

In `/en/admin` or `/fa/admin` (staff login):

- **Gallery:** add images (JPG/PNG/WebP up to 10 MB, aspect ratio kept), replace an image, edit title / description / alt / subcategory / work types / tags in **both languages**, category, featured, hidden, watermark flag, verification status and real project id, `3D model` flag; reorder with Up/Down; hide/show; delete. The page address (slug) is fixed at creation so links never break.
- **Texts & contact:** hero text and image, tagline, intro, gallery description, areas of work, services (with related images), collaboration steps, About text, and the phone / WhatsApp / Instagram / Telegram / address, per language.
- Saving calls `/revalidate` (staff-only) so visitors see changes immediately; otherwise pages refresh within ~15 seconds.
- Uploaded images are stored in `backend/data/media` and served publicly from `/api/public/media/<name>` (optimised by Next.js like the others).
- **Seed:** on first start the backend loads `backend/seed/content.json` (built by `node scripts/export-seed.mjs` from `src/data`) into an empty database. To reset content, stop the backend, delete `backend/data/fadak.db` and start again (this also deletes accounts and projects).
- **Backups:** copy `backend/data/` (database + `uploads/` + `media/`). There is no automatic backup yet.
- The public site falls back to the static `src/data` content if the backend is down, so it still renders (without your latest edits).
