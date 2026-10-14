# Elite Convention Hall — Phase 11: Hero, About Us & Footer CMS

**Scope:** Approved 40-page Website PRD. Public Portfolio Website + Website Admin CMS only. **No Project B or Internal Management System.**

Full incremental source snapshot based on the approved Phase 10 package. This release makes Hero, About Us, official Branding, and Footer editable from the Admin CMS, with protected APIs, media upload reuse, and audit logging.

## What's new

- React Admin editor at `/site?tab=hero`, `/site?tab=about`, `/site?tab=footer`.
- Hero heading/tagline/description/CTA/clarification/background image loaded dynamically from `hero_content`.
- About copy, ordered highlight cards, approved photos from `about_content`, `about_highlights`, `about_images`.
- Website brand name/logo from `website_settings`; Footer text/logo/links from `footer_settings`, `footer_links`.
- Authenticated CMS routes `/api/v1/admin/site/*` with CSRF and strict input validation.
- Public site content routes `/api/v1/site/*` and visibility-checked `/media/site/:filename`.
- Audit transactions for Site CMS edits in the existing `admin_audit_logs` table.
- Existing Gallery, Inquiry Calendar, Inquiry Inbox, Public Content CMS, Admin authentication, and approved SQL schema preserved.

## Installation (PowerShell, project root)

```powershell
npm install
# Copy your existing working backend/.env to this extracted project.
# Only if you do not already have an .env file:
Copy-Item backend/.env.example backend/.env
npm run dev:api
# New terminal: npm run dev:public
# New terminal: npm run dev:admin
```

Public website `http://127.0.0.1:5173/`, Admin login `http://127.0.0.1:5174/login`.

Admin routes:

- `/site?tab=hero` — Hero Section
- `/site?tab=about` — About, highlights and images
- `/site?tab=footer` — Website branding, Footer details, links & policies
- `/gallery` — Gallery CMS (preserved)
- `/calendar` — Inquiry Count Management (preserved)
- `/inquiries` — Inquiry Inbox (preserved)
- `/content` — Facilities, Vendors, Reviews, FAQs and Contact CMS (preserved)

There are **no new schema migrations**. Existing Phase 3 tables are used unchanged. If needed, run the optional non-destructive `database/seeds/phase11_prd_footer_quick_links.sql` to add the seven quick navigation links explicitly specified by the approved PRD, provided there are currently no QUICK links.

**Media note:** Reuse of `/api/v1/admin/gallery/media` means images are uploaded to the configured `MEDIA_ROOT` directory. Preserve this directory when upgrading. An uploaded media item is public through `/media/site/` only after association with visible Hero/About/website brand/Footer content.

**PRD image warning:** In development, preview screenshots from the PRD may be used where no approved source photography has been uploaded. Production must use client-approved original assets. The Phase 11 public components do not intentionally use reference photographs as production fallback.

## Tests and acceptance

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

See **`docs/PHASE11_ACCEPTANCE.md`** for end-to-end, security, publishing and regression tests.

The codebase was syntax-checked statically in the packaging environment. Runtime build, automated API tests, browser verification and live MySQL CRUD have **not** been independently verified here; run them locally before accepting this release as fully tested.

**Next:** Phase 12 — Full integration and end-to-end testing of the public site, inquiry workflow and all CMS modules.

