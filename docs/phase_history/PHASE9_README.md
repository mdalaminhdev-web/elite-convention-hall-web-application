# Elite Convention Hall — Phase 9 (Website and CMS ONLY)

This package **extends the approved Phase 8 source** with PRD-defined Facilities, Vendor Details, Client Reviews, Frequently Asked Questions and Contact Us sections, protected CMS editing, and MySQL-backed public APIs. Earlier authentication, Gallery, Query Calendar, and inquiry forms have been preserved in the project structure.

The approved scope is the **Elite Convention Hall Portfolio & Event Inquiry Website plus its Website Admin CMS**. No separate internal system is included.

## Phase 9 additions
- Public: Facilities and Amenities cards; approved Vendors directory with details dialog; real testimonials; category-aware FAQ accordion; official Contact panel and links; Footer contact/social data integration.
- Admin: `/content` editor for Facilities (including editable amenities/service features), Vendor Categories, Vendors, Client Reviews, FAQ Categories, FAQs, Social Links and Contact Information. Images are uploaded using the already-protected Gallery media service.
- Backend: `GET /api/v1/content/{facilities,vendors,reviews,faqs,vendorCategories,faqCategories,social,contact}` and protected Admin CRUD under `/api/v1/admin/content`.
- Media: `/media/content/:filename` permits public access **only to files referenced by a currently published** facility, vendor in a visible category, or client review. Unpublished media remains behind protected Admin preview URLs.
- No fabricated business records or additional SQL migration required: existing Phase 3 tables are used.

## Install and run (PowerShell)

You need Node.js >=22.12, npm >=10, and a working MySQL 8.x instance with the Phase 3 schema applied.

```powershell
npm install
# Preserve backend/.env from your Phase 8 working project.
# If this is the first installation only:
Copy-Item backend/.env.example backend/.env
# Edit .env for database credentials and session secret.
```

Open **three separate terminals** at project root:

```powershell
npm run dev:api
npm run dev:public
npm run dev:admin
```

Visit:
- Public website: http://127.0.0.1:5173
- Admin login: http://127.0.0.1:5174/login
- New CMS content editor: http://127.0.0.1:5174/content
- Existing Gallery CMS: http://127.0.0.1:5174/gallery
- Query Calendar Admin: http://127.0.0.1:5174/calendar
- Received Inquiries Admin: http://127.0.0.1:5174/inquiries
- API health: http://127.0.0.1:4000/api/v1/health

Create an Admin (if not already created) with `npm run admin:create`. Do not copy real secrets into chat or source control.

## Verification

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

See `docs/PHASE9_ACCEPTANCE.md` for full browser and publication-security tests. These scripts need to be run on a machine with npm dependencies and MySQL configured. Local package generation did not execute the live application.

## Data entry sequence
1. Create and activate Vendor Categories before Vendors.
2. Create and activate FAQ Categories before categorizing FAQs.
3. Add approved Facilities, Vendors, Reviews and FAQs; keep records as drafts until business details and photography are confirmed.
4. Set official Contact Information and HTTPS Social Links.
5. Publish entries only after confirmation. Public pages expose only published records.

**All approved Phase 3 migration files remain unchanged.** Existing uploaded images are stored through the earlier Gallery media pipeline; the new content-media route performs its own publication checks. A future media-maintenance phase may separate storage prefixes without altering the approved database relationships.

## Known restrictions and scope boundaries
- Footer policy links, Hero editing and About editing remain for the scheduled CMS completion phase.
- The Contact section is a display/contact-links section only; no independent contact form is implemented because the approved PRD does not fully specify its fields and processing.
- Vendor View Details is an accessible dialog in this phase, not an independently routed Vendor page.
- PRD-derived reference photographs and provisional branding are development preview assets, **not verified original venue photographs**. Replace before production.
- No final browser visual regression or MySQL CRUD verification has been performed within this environment.
