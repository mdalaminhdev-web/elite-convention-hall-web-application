# Elite Convention Hall — Website and Admin CMS (Phase 7)

**Scope:** Public Portfolio & Event Inquiry Website plus secured Website Admin CMS only. No separate internal management system. Built from `Elite_Convention_Hall_PRD_Final_Revised.pdf` (40 pages).

## Phase 7 included
- Premium Gallery preview section with featured album cover-flow carousel.
- `/gallery` All Albums page.
- `/gallery/:slug` individual Album Photo Grid and accessible lightbox.
- `/admin/gallery` authenticated Gallery Management (development Admin frontend uses `/gallery` on port 5174).
- MySQL-backed gallery API using approved Phase 3 `gallery_albums`, `gallery_photos`, and `media_assets` tables.
- Admin cover upload, photo upload/replace, captions, alt text, reorder, publish/hide and delete.
- Previous Phase 6 public UI and Phase 5 secure Admin login are preserved.

## Prerequisites
Node.js >=22.12, npm >=10, MySQL 8.x. Apply existing Phase 3 migrations before starting backend. Use approved project and original company assets when available.

## Local setup
From extracted project root:

```powershell
npm install
Copy-Item backend/.env.example backend/.env
```

**If you are upgrading from the Phase 6 project, KEEP your existing `backend/.env` and copy that file into the new backend instead of replacing your credentials/session secret.**

Configure DB details and `SESSION_SECRET` in `backend/.env`. For optional media directory override configure `MEDIA_ROOT` to an absolute, writable filesystem path; otherwise images are stored under `backend/uploads/gallery`.

Start each in its own PowerShell terminal:

```powershell
npm run dev:api
npm run dev:public
npm run dev:admin
```

URLs:
- Public: http://127.0.0.1:5173
- Gallery: http://127.0.0.1:5173/gallery
- Website Admin: http://127.0.0.1:5174/login
- API Health: http://127.0.0.1:4000/api/v1/health

Prepare Admin account if not already provisioned:

```powershell
npm run admin:create
```

## Verification

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

Create your first published album through the secured Admin GUI. No fake albums are seeded, so the public Gallery correctly shows an empty state until genuine, approved content is added.

The public `Gallery` section can function without Login; all Admin mutations require authenticated session and CSRF token. Gallery images are converted to WebP. Public media at `/media/gallery/<uuid>.webp` is allowed only while referenced by published albums/photos; Admin previews use a protected route. Never use an Nginx static alias for this media path. **Back up the upload directory and MySQL together.**

See `docs/PHASE7_ACCEPTANCE.md` for the exact acceptance checklist and operational limitations.

## Existing phases
- Phase 3: Website-only database schema.
- Phase 4: Vite/Express workspace foundation.
- Phase 5: Secure Admin login, MySQL session storage, CSRF.
- Phase 6: Navbar, Hero, About, Footer.
- Phase 7: Gallery, public pages, secured Gallery CMS.

**Phase 8 (not implemented yet):** Query Calendar, date and Day/Night shift selection, Inquiry Form, MySQL inquiry capture. Manual count Option A remains approved and unchanged.

## Status
The code package is **prepared**, not validated against a running MySQL server in this environment. Do not deploy as production-ready without `npm install`, automated tests, UI testing, database verification, secure media backup/storage configuration, and review of all later-phase features.
