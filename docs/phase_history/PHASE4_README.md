# Elite Convention Hall — Phase 4 Development Starter

**Scope:** Only the approved 40-page Public Portfolio Website PRD and its Website Admin CMS. NO independent Internal Management System.

## What is included

- React + Vite + Tailwind CSS public frontend (port 5173): **foundation screen only**, not final PRD UI.
- React + Vite + Tailwind CSS Admin frontend (port 5174): **foundation screen only**, no admin login until Phase 5.
- Express API (port 4000), security headers, JSON parsing, health endpoint and centralized error responses.
- MySQL `mysql2/promise` pool configuration and a separate schema-verification command.
- Phase 3 approved MySQL migrations, SQL verification scripts, ER diagram and database notes, copied without changes.
- API test examples and exact acceptance checklist.

## Prerequisites

- Node.js >= 22.12, npm >= 10.
- MySQL >= 8.0.16, preferably a supported release.
- Permission to run `npm install` using the public npm registry.
- The Phase 3 SQL schema must have been installed in MySQL for the DB connection test.

## Windows PowerShell setup

In a PowerShell terminal in this project root:

```powershell
node -v
npm -v
npm install
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env` with **local** MySQL user credentials (`DB_USER`, `DB_PASSWORD`), leaving secrets out of Git. Do not use the MySQL root account as an application user. In MySQL Workbench, install the approved schema from `database/Elite_Convention_Hall_Full_Initial_MySQL_Setup.sql` if not already installed. Check it using `database/verify_installation.sql`.

Open **three separate** PowerShell terminals, each in the project root:

Terminal 1:
```powershell
npm run dev:api
```

Terminal 2:
```powershell
npm run dev:public
```

Terminal 3:
```powershell
npm run dev:admin
```

Open:
- Public frontend: http://127.0.0.1:5173
- Admin frontend: http://127.0.0.1:5174
- Backend health endpoint: http://127.0.0.1:4000/api/v1/health

The frontends call `/api/v1/health` through Vite's development proxy. No production cross-origin credential configuration is required at this stage.

## Validation

After installing dependencies, from the project root:

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

`db:check` requires a running MySQL database, valid `.env`, and the installed Phase 3 schema. No database credentials are needed for the Express API liveness check.

## Development rules

- This is an intentionally small Phase 4 scaffold; do not mistake its pages for final public or Admin UIs.
- **Do not deploy the Admin frontend publicly before Phase 5 authentication and API authorization.**
- No fake venue details, customer inquiries, Admin users, or default passwords are seeded.
- Public inquiry submission and the three calendar count modes will be implemented and tested in Phase 8/10.
- For Option A in manual mode, **no database row = no displayed count**, and an explicit `display_count = 0` must display `0`.
- Actual venue availability/booking must not be inferred from inquiry counts.
- The base URL for production Admin assets is `/admin/`; configure Nginx SPA fallback and API forwarding during the deployment phase.
- `npm install` creates a lock file: commit that lock file to Git, then use `npm ci` in CI/production.

## Scope and source

Only `Elite_Convention_Hall_PRD_Final_Revised.pdf`, 40 pages (approved by the user), controls feature scope. The source PDF and original venue media must be attached separately when implementing final screenshot-matched UI.

See `docs/PHASE4_ACCEPTANCE.md` for the complete acceptance checklist.
