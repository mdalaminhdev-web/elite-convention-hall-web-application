# Phase 11 — Hero, About Us & Footer CMS Acceptance

**Scope:** The approved Elite Convention Hall website PRD (40 pages), public website + protected website CMS only. No independent Internal Management System.

## Security and existing data

- This package is a full source snapshot built on Phase 10. **Do not delete or recreate the existing database.** No schema migration was added; all functionality uses tables from the Phase 3 initial SQL.
- Copy your working `backend/.env` into the extracted project (never publish it). Database account/session credentials remain unchanged.
- Ensure all earlier migrations `000` to `010` are applied and functional, particularly `media_assets`, `hero_content`, `about_content`, `about_highlights`, `about_images`, `website_settings`, `footer_settings`, `footer_links`, `admin_audit_logs`.
- Optional seed: `database/seeds/phase11_prd_footer_quick_links.sql` adds only the seven PRD-approved quick links if no QUICK links already exist. It never inserts unapproved privacy-policy destinations.
- Reuse existing authenticated image upload `/api/v1/admin/gallery/media`. Uploaded media is stored under `MEDIA_ROOT/gallery` and **never publicly accessible through `/media/site/` unless currently referenced** by Hero, a visible About image, or Website/Footer logo.
- Preview photographs in the source came from supplied PRD screenshots. They are displayed only in development when approved replacements are missing; do not deploy those screenshots as authentic venue photography. Upload approved source images through CMS first.

## Setup (Windows PowerShell, project root)

```powershell
npm install
# Preserve an existing working backend/.env with the proper DB_* and SESSION_SECRET values
npm run dev:api
# New terminal: npm run dev:public
# New terminal: npm run dev:admin
```

- Public site: `http://127.0.0.1:5173/`
- Admin login: `http://127.0.0.1:5174/login`
- New CMS: `http://127.0.0.1:5174/site?tab=hero`
- About CMS: `http://127.0.0.1:5174/site?tab=about`
- Footer CMS: `http://127.0.0.1:5174/site?tab=footer`

## API checks

Public:
- `GET /api/v1/site/hero` → `hero` content, public Hero media URL (only when configured).
- `GET /api/v1/site/about` → `about` copy, only visible highlights/images.
- `GET /api/v1/site/footer` → `footer`, approved visible links and branding.

Authenticated Admin:
- `GET/PATCH /api/v1/admin/site/hero`
- `GET/PATCH /api/v1/admin/site/about`
- `GET/PATCH /api/v1/admin/site/footer`
- `GET/PATCH /api/v1/admin/site/brand`
- `GET/POST /api/v1/admin/site/highlights`, `PATCH/DELETE /.../:id`
- `GET/POST /api/v1/admin/site/images`, `PATCH/DELETE /.../:id`
- `GET/POST /api/v1/admin/site/links`, `PATCH/DELETE /.../:id`

All write operations must fail without authenticated Admin session and CSRF token. Uploaded images must have real matching `media_assets` records.

## Functional acceptance steps

1. **Hero:** Log in, open Site Content → Hero Section. Edit tagline, heading, description, CTA label/target (`/#query-calendar` or `/inquiry`), and supporting clarification. Save. Reload public homepage and verify changes.
2. **Hero image:** Upload an approved JPG/PNG/WebP, save the section, verify background appears. Confirm an unreferenced uploaded image is **not** publicly accessible through `/media/site/`.
3. **About:** Edit heading, introduction, brand story, service approach, experience/strengths and brand values. Save and refresh the public site; approved fields appear in their correct section.
4. **Highlights:** Add multiple cards, edit copy, change sort order and visibility, verify public ordering and draft hiding. Delete a test card, verify absence.
5. **About photos:** Upload approved venue photos, enter captions, set ordering and visibility, verify only visible photos appear publicly. Confirm draft/hidden image cannot be downloaded from the public media endpoint unless separately used in a publicly visible section.
6. **Branding:** Upload official approved website logo and brand name. Verify Header/Footer reflect it, while uploaded image is stored in `media_assets`.
7. **Footer:** Edit description, logo override (optional), copyright, quick links, policy links. Verify group organization and visibility. Do not publish fake privacy-policy links.
8. **Link validation:** `javascript:`, `//evil.example`, and unsupported protocols must produce 400. Local `/#gallery` and approved `https://` destinations work. Hero CTA must remain an internal website destination.
9. **Security:** Log out and verify private endpoints return 401; write without CSRF returns 403. Public endpoints contain no admin-only draft About photos or hidden policy links.
10. **Regression:** Test Gallery and Album pages, Inquiry Calendar REAL/MANUAL/HIDDEN, Inquiry Form submissions, Admin Inquiry Inbox, Facilities/Vendors/Reviews/FAQ/Contact editors, admin login/logout.
11. **Audit:** Saving/deleting Site CMS items creates meaningful `admin_audit_logs` entries with actor, entity, action, timestamp and previous/new states. No passwords or session tokens should be written.
12. **Responsive:** Check 375px, 768px and desktop widths for Header, Hero, About, Footer and Site CMS; verify keyboard focus, labels, image alt descriptions and errors.

## Available static checks (run from project root)

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

The feature tests in `backend/tests/site-cms.test.js` cover public response mapping, admin authentication + CSRF, valid/invalid Hero updates, draft visibility and Footer policy links. Tests with real MySQL and browser are **not verified in this package**; execute on your local/CI environment.

## Phase completion rule

Phase 11 is code-prepared and syntax-checked only until npm dependencies, tests, MySQL CRUD behavior and production builds have passed on the user's environment. Do not claim the full CMS is tested or production-ready based solely on static checks.
