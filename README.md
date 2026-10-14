# Elite Convention Hall — Complete Web Application (Phases 1–12)

**One consolidated source project:** React public website + React Admin CMS + Node.js/Express API + MySQL initial database schema and tests.

**Scope:** Only the approved **Elite Convention Hall Portfolio & Event Inquiry Website** and its Admin CMS. This does NOT contain a separate internal management, confirmed booking, payment, payroll, or CRM application.

## Where everything is

| Component | Folder |
| --- | --- |
| Public website (React + Vite) | `frontend/public-website/` |
| Admin Dashboard and CMS (React + Vite) | `frontend/admin-dashboard/` |
| Backend REST API (Node.js + Express) | `backend/` |
| One-file MySQL database setup | `database/Elite_Convention_Hall_Full_Initial_MySQL_Setup.sql` |
| Ordered MySQL migrations | `database/migrations/` (`000`–`010`) |
| Database ER diagram and column dictionary | `database/ERD.mmd`, `database/DATABASE_DESIGN.md` |
| Database verification scripts | `database/verify_installation.sql`, `database/calendar_option_a_test.sql` |
| API and integration tests | `backend/tests/` |
| Browser end-to-end tests | `e2e/`, `playwright.config.mjs` |
| Approved 40-page website PRD | `docs/requirements/Elite_Convention_Hall_PRD_Final_Revised.pdf` |
| Phased acceptance checklists | `docs/PHASE*_ACCEPTANCE*.md` |
| Historical phase READMEs | `docs/phase_history/` |

## Quick setup: Windows + VS Code + MySQL Workbench

### Requirements

- Node.js >=22.12 and npm >=10
- MySQL >=8.0.16 (8.4 LTS recommended for new installations)
- MySQL Workbench

### Step 1 — Install the database (first-time only)

1. Open **MySQL Workbench** and connect with a database account authorized to create the database.
2. Open `database/Elite_Convention_Hall_Full_Initial_MySQL_Setup.sql`.
3. **Use this only for a brand-new database** named `elite_convention_hall`; if you have an existing populated database, back it up and do not reimport the initial setup script.
4. Execute the SQL file once and run `database/verify_installation.sql`.
5. Expected: `schema_migrations` records **000–010**; **25 application tables** plus the migration table (26 total).
6. Create a separate, least-privileged application MySQL account and grant only needed privileges to `elite_convention_hall`. Configure that account in the backend environment file.

**Important:** These SQL files create the **database structure** and initial mode/settings, not a backup of your existing live customers, inquiries, uploaded images, or real administrator accounts. Those data cannot be reconstructed from source code alone.

### Step 2 — Configure backend and install packages

Open PowerShell in this extracted project directory:

```powershell
npm install
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env` to set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `ADMIN_ALLOWED_ORIGINS` for your computer.
Generate a secure, random session secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Paste this value as `SESSION_SECRET` in `backend/.env`. Never commit or share `.env`.

### Step 3 — Check MySQL and create your first Admin login

```powershell
npm run db:check
npm run admin:create
```

`admin:create` prompts interactively for an Admin name, email and password. No hardcoded default password is supplied.

### Step 4 — Run all three applications (three terminals)

**Terminal 1:**
```powershell
npm run dev:api
```

**Terminal 2:**
```powershell
npm run dev:public
```

**Terminal 3:**
```powershell
npm run dev:admin
```

- **Public site:** http://127.0.0.1:5173/
- **Gallery:** http://127.0.0.1:5173/gallery
- **Event inquiry:** http://127.0.0.1:5173/inquiry
- **Admin login:** http://127.0.0.1:5174/login
- **API health:** http://127.0.0.1:4000/api/v1/health

### Step 5 — Test before accepting production readiness

```powershell
npm run check:contracts
npm run check:api-syntax
npm run test:api
npm run test:integration
npm run build
npm run db:check
npx playwright install chromium
npm run test:e2e
```

Playwright browser tests use **mock API fixtures**. Passing them does not establish that production MySQL and API transactions work correctly. See `docs/PHASE12_ACCEPTANCE.md` for live acceptance criteria and remaining test blockers.

## Included business features

The homepage follows the approved section order: Hero, About, Gallery, Query Calendar, Facilities, Vendors, Client Reviews, FAQ, Contact and Footer. The Gallery includes album listing, album details and lightbox. Visitor inquiry submissions capture preferred date/shift, not a booking or confirmed reservation.

Admin CMS includes protected Dashboard, Inquiry Management, Inquiry Count Management, Gallery, Facilities, Vendors, Reviews, FAQs, Contact, Hero, About, Footer and branding content.

**Calendar policy approved by the user:** in MANUAL mode, dates with no manual count record are blank, while an explicit manual `0` is displayed as `0`. REAL mode uses submitted inquiry records. HIDDEN mode displays no counts. Inquiry submission never books, reserves or blocks a date.

## Status / production limitations

- This is the **cumulative developed source through Phase 12**. It is not a claim that all live E2E tests have passed or that the project is deployed.
- Source-level contract tests and backend syntax checks passed in the packaging environment; full npm builds, integration runtime against live MySQL, browser verification and real media upload tests remain to be performed on a properly configured machine.
- **Phases 13–15** (security/SEO/performance hardening, deployment, final handover) have **not** been developed in this package.
- PRD-cropped reference images and preview assets are temporary; replace with actual approved venue media/branding. No fictitious live reviews, vendors, inquiries or customer information are included.
- npm dependencies (`node_modules`), personal secrets (`.env`), live uploaded media and real MySQL data are intentionally excluded from the ZIP.
- Keep any existing `backend/.env`, uploads, MySQL data, and backups safe if migrating from an older project copy. Do **not** overwrite a populated database with the initial setup script.

Read the existing `database/README.md`, `docs/PHASE12_ACCEPTANCE.md`, and `docs/phase_history/PHASE12_ORIGINAL_README.md` for technical details.
