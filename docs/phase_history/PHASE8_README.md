# Elite Convention Hall Website — Phase 8

**Approved scope:** Public Portfolio & Event Inquiry Website + protected website CMS. No internal management system.

**What's new:** Database-backed Query Calendar and event inquiry submission, Day/Night shift selection, protected Admin inquiry list/details and real/manual/hidden count management. All Phase 7 Gallery features and earlier authentication/database files remain present.

See [`docs/PHASE8_ACCEPTANCE.md`](docs/PHASE8_ACCEPTANCE.md) for the detailed acceptance checklist, Option A definition and tests.

## Prerequisites

- Node.js 22.12+ and npm 10+.
- MySQL 8.0.16+ with the **Phase 3 schema already applied**.
- Existing `backend/.env` configured with your DB credentials and session secret.
- At least one administrator account (run `npm run admin:create` if required).

The ZIP omits node_modules and all real secrets. Do **not** overwrite your working `backend/.env` when replacing code.

## Setup (PowerShell)

From the extracted project root:

```powershell
npm install
# Only if backend/.env is missing:
Copy-Item backend/.env.example backend/.env
# Configure DB credentials and SESSION_SECRET in backend/.env
```

Open three PowerShell terminals in the project root:

```powershell
npm run dev:api
npm run dev:public
npm run dev:admin
```

URLs:

- Public: http://127.0.0.1:5173
- Calendar: http://127.0.0.1:5173/#query-calendar
- Inquiry form: http://127.0.0.1:5173/inquiry
- Admin login: http://127.0.0.1:5174/login
- Inquiry count Admin: http://127.0.0.1:5174/calendar
- Received inquiries: http://127.0.0.1:5174/inquiries
- Gallery CMS: http://127.0.0.1:5174/gallery

## Verify

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

The backend requires the same MySQL tables that were defined in the approved Phase 3 schema; no additional migrations are introduced in this phase.

### Public APIs

- `GET /api/v1/inquiries/calendar?month=YYYY-MM`
- `POST /api/v1/inquiries`

### Protected Admin APIs (session + CSRF for writes)

- `GET /api/v1/admin/inquiries/summary`
- `GET /api/v1/admin/inquiries?page=1&pageSize=20&search=`
- `GET /api/v1/admin/inquiries/:id`
- `GET /api/v1/admin/calendar/settings`
- `PATCH /api/v1/admin/calendar/settings`
- `GET /api/v1/admin/calendar/manual-counts?month=YYYY-MM`
- `PUT /api/v1/admin/calendar/manual-counts/:date`
- `DELETE /api/v1/admin/calendar/manual-counts/:date`

The calendar **does not indicate actual venue availability, confirmed bookings or reservations**. The hall team confirms availability after reviewing the inquiry.

## Verification limitations

JavaScript syntax and relative module imports can be checked without npm dependencies. Full automated tests, browser builds and MySQL checks must be performed in the configured development environment.
