# Elite Convention Hall — Phase 10: Admin Dashboard & Inquiry Management

**Approved project scope:** Public Portfolio Website + Website Admin Dashboard/CMS only, following `Elite_Convention_Hall_PRD_Final_Revised.pdf` (40 pages). **No independent Internal Management System.**

This project is an incremental update to the approved Phase 9 package. It retains all existing Gallery, Query Calendar, public sections, content APIs, Admin authentication, database scripts, and migration version history.

## What's new in Phase 10

- Premium responsive dark navy/gold Admin layout with reusable sidebar and top bar.
- Real-time-on-refresh Admin dashboard with genuine metrics: total received, received today, received this month, published albums, event dates with inquiries, last 7 days submission counts, six newest inquiries, live calendar count mode.
- Dashboard latest inquiry entries deep-link to the Inquiry Management view.
- Professional read-only Inbox with search by name/phone/email, event date and Day/Night shift filters, pagination, complete detail modal, and contact shortcuts.
- Protected `GET /api/v1/admin/inquiries/dashboard` API backed by SQL aggregate queries; no new database tables or migrations.
- Previous Gallery CMS and public-content editors preserved and accessible from the same Admin navigation; public-content links open their corresponding editing tabs.

## Production date/time requirement

Reporting counts are based on **Bangladesh calendar dates (Asia/Dhaka)** and MySQL `created_at` values stored in **UTC**. Since the original table has a MySQL `CURRENT_TIMESTAMP(3)` default, **confirm MySQL server/session timezone is UTC** before production. `SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP();` should demonstrate suitable consistency. See `docs/PHASE10_ACCEPTANCE.md`.

## Setup — Windows / PowerShell

Extract this ZIP into a new folder; it is a full project snapshot, not a patch.

Do **not** overwrite or commit your working `backend/.env`. Preserve your actual local credentials and session secret from Phase 9.

```powershell
npm install
# If backend/.env does not exist, create it and edit DB_HOST/DB_NAME/DB_USER/DB_PASSWORD/SESSION_SECRET
Copy-Item backend/.env.example backend/.env
```

Run services from the project root in separate terminals:

```powershell
npm run dev:api
npm run dev:public
npm run dev:admin
```

- Website: http://127.0.0.1:5173/
- Admin login: http://127.0.0.1:5174/login
- Admin dashboard: http://127.0.0.1:5174/dashboard
- Inquiry inbox: http://127.0.0.1:5174/inquiries
- Inquiry count settings: http://127.0.0.1:5174/calendar
- Gallery CMS: http://127.0.0.1:5174/gallery
- Public-content CMS: http://127.0.0.1:5174/content?tab=facilities

If the same physical folder already holds an `.env`, **do not run Copy-Item again**. Migration scripts included for completeness should **not** be blindly rerun on an existing production database.

## Verification

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

Review `docs/PHASE10_ACCEPTANCE.md` for full end-to-end verification, expected results, security checks, and limitations. Tests must be run locally; generated source code is not proof that the live system was tested.

## Scope reminder

A website inquiry is not a confirmed booking. The three count modes are `REAL`, `MANUAL`, and `HIDDEN`. In MANUAL mode, **missing manual date = no count**, while **explicit zero = display zero**. No fake inquiries or booking records are inserted.

## Subsequent phase

Phase 11: Hero, About Us, and Footer content management in the Website CMS, preserving the approved PRD scope and existing public/frontend conventions.
