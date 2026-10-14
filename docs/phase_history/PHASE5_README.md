# Elite Convention Hall — Phase 5 Admin Authentication Starter

**Scope:** The approved 40-page Portfolio Website PRD and its Website Admin CMS only. No independent Internal Management System.

## What's new versus Phase 4

- Website Admin login and protected dashboard (real backend session; no fake credentials).
- `POST /api/v1/admin/auth/login` and `/logout`, plus session/CSRF endpoints.
- MySQL-backed `admin_sessions` using the existing Phase 3 schema; session IDs hashed before storage.
- bcrypt password verification and private interactive Admin provisioning.
- CSRF validation, Origin restrictions, login rate limiting and admin account disable checks.
- API tests for anonymous access, invalid login, successful login, sign-out, CSRF and Origin rejection.
- Phase 3 migrations are **unchanged** from the approved starter.

## Prerequisites

- Node.js >= 22.12 and npm >= 10.
- MySQL >= 8.0.16 with the approved Phase 3 schema installed (prefer supported 8.4 LTS).
- Node dependencies installed via the npm registry.
- The existing `elite_app` MySQL user with least-privilege DML access to app/session/audit tables.

## Setup in Windows PowerShell

From the extracted project root:

```powershell
npm install
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env` with valid local MySQL credentials. Generate a unique secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Use its output for `SESSION_SECRET` in your local, **untracked** `backend/.env`. Never put the value in source code or Git.

In MySQL Workbench, run `database/Elite_Convention_Hall_Full_Initial_MySQL_Setup.sql` only if the database has not yet been installed. Then verify using `database/verify_installation.sql`.

### Provision the first Website Admin

```powershell
npm run admin:create
```

It interactively asks for a full name, email and hidden password (12–72 UTF-8 bytes). The database stores only a bcrypt password hash. No public signup is provided. Admin creation requires a DB account permitted to `INSERT` into `admin_users` and the backend SQL tables.

### Run all three services

Use three terminals in the project root:

```powershell
npm run dev:api
```

```powershell
npm run dev:public
```

```powershell
npm run dev:admin
```

Open `http://127.0.0.1:5174/login` (local development). On production the admin route is `/admin/login`.

Public website foundation is unchanged and runs at `http://127.0.0.1:5173`.

Backend health check: `http://127.0.0.1:4000/api/v1/health`.

### Verify

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

Backend API endpoints and acceptance tests: `docs/PHASE5_ACCEPTANCE.md`.

## Operational security notes

- Production requires a unique 32+ character non-placeholder `SESSION_SECRET`, HTTPS origin in `ADMIN_ALLOWED_ORIGINS`, and real `DB_PASSWORD`.
- Behind Nginx, configure correct `TRUST_PROXY` only after reviewing trusted forwarded-header handling.
- Session cookie uses Path `/api/v1/admin` so it is not sent with ordinary public API requests.
- Production cookies use `Secure`, `HttpOnly` and `SameSite=Lax`. Reverse proxy must terminate HTTPS correctly.
- CSRF token returned by GET `/api/v1/admin/auth/csrf`; send it in the `x-csrf-token` header for admin POST/PUT/PATCH/DELETE.
- The cookie is signed, and the server stores only a hash of the session identifier.
- A disabled Admin cannot access protected endpoints, even with an unexpired session.
- Local backend uses an ephemeral `SESSION_SECRET` if omitted, but doing so invalidates sessions on every restart.
- No raw credentials, admin default passwords, or real customer data are shipped in the starter.
- Login throttling uses process-local memory. For multi-process deployment, use a shared rate-limit store.
- Frontend route protection does not replace API authentication. Keep CMS business APIs behind `requireAdmin` as developed.
- This phase does not deliver PRD CMS content features; subsequent phases do.

## Known verification limitation

This package must be verified with `npm install`, frontend builds, tests, an actual MySQL installation, and HTTPS proxy configuration. Do not label Phase 5 production-ready until those checks pass.
