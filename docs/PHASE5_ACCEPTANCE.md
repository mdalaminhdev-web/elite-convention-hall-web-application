# Phase 5 — Admin Authentication and Backend Security Foundation

## Scope

- Admin login and logout with secure cookies and sessions; no public signup.
- Database-backed sessions using existing Phase 3 `admin_sessions` schema (SHA-256 session-ID keys).
- Password hashing (bcrypt, factor 12 for provisioned accounts).
- Protected `/api/v1/admin/auth/me` and `/api/v1/admin/ping`.
- Anti-CSRF tokens for state-changing admin routes.
- Origin restrictions, SameSite cookies, Helmet headers, login throttling.
- Account disable checks on every authorized request.
- Admin creation via interactive terminal, not public endpoint.
- No internal management system.

## Exact endpoints

| Method | Route | Behavior |
|---|---|---|
| GET | `/api/v1/health` | Public liveness, no DB requirement |
| GET | `/api/v1/admin/auth/csrf` | Acquire CSRF token, sets pre-auth session cookie |
| POST | `/api/v1/admin/auth/login` | CSRF + origin + rate limit + credential check + rotate session |
| GET | `/api/v1/admin/auth/me` | Returns authenticated, enabled Admin profile, or 401 |
| POST | `/api/v1/admin/auth/logout` | CSRF-protected session invalidation, 204 |
| GET | `/api/v1/admin/ping` | Protected API sample, 401 if unauthorized |

## Acceptance checklist

- [ ] `npm install` completes on a machine with registry access.
- [ ] Approved Phase 3 MySQL setup executed and `database/verify_installation.sql` passes.
- [ ] `npm run check:api-syntax` passes.
- [ ] `npm run test:api` passes (mock user and in-memory test-only sessions).
- [ ] `npm run build` passes for both frontends.
- [ ] `npm run db:check` passes with real MySQL.
- [ ] `npm run admin:create` creates an Admin in MySQL without echoing the password.
- [ ] Anonymous `/me` and `/ping` return HTTP 401.
- [ ] Missing/invalid CSRF token blocks login (403).
- [ ] Invalid credentials return 401 without revealing which field was wrong.
- [ ] Correct credentials log in and return Admin profile; cookie is HttpOnly, SameSite=Lax.
- [ ] Admin page reload stays logged in while session remains valid.
- [ ] Logout invalidates the session and access to `/me` (401).
- [ ] Disabling an Admin user in MySQL makes future protected requests return 401.
- [ ] Actual DB session records use hashed cookie-session identifiers, not cleartext IDs.
- [ ] Security test for unapproved Origin returns 403.
- [ ] Production refuses placeholder/absent session secret and database password.
- [ ] Backend and Nginx secure-cookie configuration verified over actual HTTPS before deployment.

## Important limitations

- `express-rate-limit` uses an in-process memory counter. Appropriate only for a **single API process**; replace with shared storage before horizontal scaling/multiple backend workers.
- The frontend route guard is usability only. Do NOT consider it a substitute for server-side protection or production edge access rules.
- This phase does NOT implement password reset, MFA, admin account self-management, inquiry CRUD, or any CMS business actions. Those need separate approval/implementation according to PRD.
- Real MySQL and HTTPS behavior MUST be verified in your environment.
- In development only, if `SESSION_SECRET` is omitted, a fresh temporary secret is generated on each backend process restart, invalidating earlier cookies.
