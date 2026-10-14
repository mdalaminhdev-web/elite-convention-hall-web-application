# Elite Convention Hall — Phase 12: Integration & End-to-End Testing

**Project:** Public Portfolio Website + secure Website Admin CMS only.  
**Basis:** Approved 40-page Elite Convention Hall Website PRD.  
**Package type:** Full, incremental source snapshot building on the approved Phase 11 package. No Project B features.

## Phase 12 additions

- `backend/tests/phase12.integration.test.js`: Five cross-module Express integration scenarios using shared in-memory repositories. Exercises Inquiry/Calendar modes, idempotency, Gallery publication, Hero/Footer CMS visibility, Facilities/Contact CMS, dashboard and Admin sessions.
- `e2e/public-workflows.spec.js`: Five Playwright Chromium desktop/mobile UI scenarios using **mocked API responses**, including calendar Option A, Day/Night selection, inquiry submission, Gallery lightbox, FAQ and empty states.
- `playwright.config.mjs`: Launches the public React/Vite development server automatically during Playwright testing; does not need a live MySQL server.
- `scripts/contracts.test.mjs`: Six Node-only PRD/security/SQL source contract checks, runnable without npm packages.
- `scripts/live-smoke.mjs`: Read-only HTTP checks against the running backend's public APIs and protected Admin endpoints; does not create test records.
- `docs/PHASE12_ACCEPTANCE.md`: Detailed PRD traceability and live test acceptance matrix.
- **Integration fix:** Query Calendar initially opens the current month in **Bangladesh time (`Asia/Dhaka`)**, independent of the visitor's device timezone.

**No previous database migration has been modified.** Existing Gallery, Inquiry, Hero/About/Footer and all other CMS endpoints are preserved.

## Installation (Windows PowerShell)

1. Unzip into a new project directory, rather than replacing your only working copy.
2. Copy over your previously configured `backend/.env` and preserve your uploaded media files/directory. Do **not** overwrite `.env` with examples.
3. Open a terminal in the project root:

```powershell
npm install
npm run check:contracts
npm run check:api-syntax
npm run test:api
npm run test:integration
npm run build
npm run db:check
```

### Browser journeys, mocked API (no MySQL required)

```powershell
npx playwright install chromium
npm run test:e2e
```

Playwright tests run against the real public React app but stub the API responses with **test fixtures**; passing them does **not** demonstrate a live backend/database integration.

### Real server and MySQL integration (separate tests)

Start the backend with a valid test database and the approved migration set:

```powershell
npm run dev:api
```

Then run **in a second PowerShell terminal**:

```powershell
npm run test:smoke
```

Test the UI manually in additional terminals:

```powershell
npm run dev:public
npm run dev:admin
```

- Public: `http://127.0.0.1:5173/`
- Admin: `http://127.0.0.1:5174/login`
- Backend: `http://127.0.0.1:4000/api/v1/health`

**Never run destructive Admin CMS checks against your production data.** Back up the test database and media directory first.

## Verification evidence at package preparation time

- Six dependency-free source/SQL checks: **passed**.
- 75 JavaScript/JSX/MJS source files: **parsed**, 141 relative imports resolved using an available TypeScript parser in the packaging environment.
- 20 backend JavaScript files: **syntax-check passed**.
- New cross-module API test source: **syntax-check passed**; runtime not executed because npm dependencies could not be installed in this environment.
- Playwright desktop/mobile tests: **authored, not executed**; requires `npm install` plus Chromium download.
- Live MySQL, full React builds, real image upload and browser integration: **not verified**.

See `docs/PHASE12_ACCEPTANCE.md` for the full test matrix, risks, and acceptance gate. The following phases are still pending until runtime verification: Phase 13 security/SEO/performance, Phase 14 deployment, Phase 15 handover.
