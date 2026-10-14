# Phase 10 — Admin Dashboard & Inquiry Management Acceptance

Scope: approved Elite Convention Hall **Portfolio Website and Website Admin CMS only**. No CRM, booking, payments, employee operations, attendance, or internal management system.

## Implemented in this source package

1. Protected Admin dashboard: total genuine inquiries, today's submissions, this month's submissions, published Gallery albums, unique requested event dates, active calendar mode, seven-day submission activity, and six latest inquiries. All sourced from MySQL; no hard-coded counts.
2. Shared responsive Admin shell/navigation for existing Dashboard, Inquiry Inbox, Calendar Count Settings, Gallery CMS, and Phase 9 public-content editors.
3. Inquiry list search by customer name/phone/email, optional preferred event date and preferred shift, pagination, and a complete read-only detail view.
4. Protected inquiry detail deep links from Dashboard to Inbox (`/inquiries?open=123`).
5. Contact shortcuts using the actual submitted phone/email (`tel:` and `mailto:` links); there is no unapproved auto-send workflow.
6. Preserves `REAL`, `MANUAL`, and `HIDDEN` count modes including approved Option A: missing manual date shows no number, explicitly saved zero shows `0`.
7. Improved accessible modal keyboard dismissal and focus containment in the Inbox.
8. Dashboard metrics and seven-day chart use the Asia/Dhaka calendar. MySQL `created_at` storage is expected in UTC (see setup note).

## Automated checks completed here

- JavaScript/JSX syntactic parsing with TypeScript JavaScript/JSX parser: PASSED.
- Relative import resolution: PASSED.
- Backend Node.js syntax checks: PASSED.
- Database migrations unchanged from Phase 9: verify from ZIP if necessary.

## To verify locally before approval as tested

**Prerequisites:** Node.js 22+, npm 10+, installed workspace dependencies, correctly migrated MySQL database, provisioned admin account, `backend/.env` properly configured. Preserve the existing `.env` outside ZIP.

```powershell
npm install
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

In three separate terminals:

```powershell
npm run dev:api
npm run dev:admin
npm run dev:public
```

1. Visit `http://127.0.0.1:5174/dashboard` while logged out; verify redirect to `/login`.
2. Log in using a privately provisioned Admin. Verify Dashboard opens and sidebar links navigate.
3. On a fresh DB, verify **zero real inquiries** and **zero published albums** without fake content.
4. Submit a real website inquiry on the public form. Refresh Dashboard. Verify total/today/month figures, activity chart, and recent inquiry card update accordingly.
5. Click "View details" on recent inquiry. Verify modal shows all submitted details and preselected date/shift. Close via Esc and close control.
6. Use `/inquiries` search (name, phone, email), date filter and shift filter; verify matching/pagination and clear behavior. Verify invalid date/shift values return HTTP 400.
7. Check the contact links in the detail modal use the submitted phone/email and do not generate a booking.
8. Check `/calendar` mode: REAL based on actual records, MANUAL based on saved counts, HIDDEN without counts. Verify missing date versus explicit zero.
9. Click CMS sidebar links and ensure Gallery and Phase 9 content editors work, including switching tabs via URL query parameter.
10. Test browser widths 375px, 768px, 1280px; verify mobile navigation, scrollable inquiry table and details modal.
11. Open `/api/v1/admin/inquiries/dashboard` logged out and verify HTTP 401, then logged in verify data; verify it is never available as a public route.
12. Run a real MySQL verification and inspect all four dashboard count SQL queries, including midnight/month boundaries in Asia/Dhaka.

## Timezone deployment note

Existing MySQL `inquiries.created_at` is a `DATETIME(3)` with `CURRENT_TIMESTAMP(3)` default. The dashboard treats it as **UTC** when computing Bangladesh calendar days and seven-day activity. Before using this on production data, ensure the MySQL server/session `time_zone` is `+00:00` and that historical stored timestamps follow the same convention. Check `SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP();`. If stored historical times are local timestamps, plan a deliberate audited migration instead of silently interpreting them as UTC.

## Known limitations / honest status

- Dependencies cannot be installed in the current authoring environment; runtime integration tests, React production builds, MySQL CRUD, browser accessibility and layout checks remain to be performed locally.
- Phase 11 PRD features (Hero CMS, About CMS, Footer CMS) are not implemented here and must not be represented as available.
- Inquiry records remain read-only in the CMS as required by the confirmed PRD; no unapproved statuses, edits, or booking conversion features.
