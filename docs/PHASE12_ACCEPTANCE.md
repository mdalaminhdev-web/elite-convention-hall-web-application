# Phase 12 — Integration & End-to-End Acceptance Plan

**Project:** Elite Convention Hall Portfolio Website and Admin CMS ONLY  
**Functional authority:** Approved 40-page Website PRD, October 2026  
**Scope exclusions:** No confirmed booking engine, reservation blocking, payments, internal management, staff HR, payroll, or Project B.

## 1. Evidence levels — do not conflate them

| Layer | Test asset | What it establishes | Does not establish |
|---|---|---|---|
| A. Static contracts | `npm run check:contracts` | Approved sections/routes/security hooks/SQL assumptions still appear in source; SQL migration structure | API handlers execute; browser works; data persists |
| B. Backend syntax | `npm run check:api-syntax` | Backend JavaScript parses | Behavior or database integration |
| C. API tests | `npm run test:api` | Express request/response behavior with isolated repository doubles | Live MySQL, production sessions, browser UI |
| D. Cross-module APIs | `npm run test:integration` | Shared in-memory fixture flows across public and Admin endpoints; CSRF/session, calendar, Gallery and CMS publication | MySQL transactions, Nginx, file persistence |
| E. Browser workflows | `npm run test:e2e` | Actual React rendering and visitor interactions in Chromium desktop/mobile **using mocked API responses** | Live API, production MySQL |
| F. Live API smoke | `npm run test:smoke` | Safe read-only real API health, public payload shapes and denied unauthenticated access | Mutations, data durability or concurrency |
| G. Live manual acceptance | Matrix below | Authenticated CRUD, actual file uploads and database persistence | Automated testing until separately scripted |

**Phase 12 is not fully accepted until tests C–G complete against your running MySQL + local/staging application.**

## 2. Run order — PowerShell (project root)

```powershell
npm run check:contracts
npm install
npm run check:api-syntax
npm run test:api
npm run test:integration
npm run build
npm run db:check
```

Browser mock tests use Chromium (desktop and emulated mobile); API server and MySQL are not needed for this specific test layer:

```powershell
npx playwright install chromium
npm run test:e2e
```

Live read-only API smoke (start your API first, ensure the development database exists and migrations have been applied):

```powershell
npm run dev:api
# in a second terminal
npm run test:smoke
```

You may override the target on the second terminal:

```powershell
$env:API_BASE_URL = "http://127.0.0.1:4000"
npm run test:smoke
```

**Safety:** Take a MySQL database backup and copy the configured gallery upload directory before any manual CRUD regression test. Use test-only Admin credentials and test-only records. Do not run destructive tests on production data.

## 3. Public website — functional acceptance matrix

| ID | Procedure | Expected outcome | Priority |
|---|---|---|---|
| WEB-01 | Open `/` on desktop/mobile; scroll all sections | Hero → About → Gallery → Query Calendar → Facilities → Vendors → Reviews → FAQ → Contact → Footer | P0 |
| WEB-02 | Use header navigation and Hero CTA | Correct section anchor; **no availability guarantee** | P0 |
| WEB-03 | Visit `/gallery` with no published albums | Honest empty state, not invented photos | P1 |
| WEB-04 | Publish gallery album with photos; open all three levels | Homepage featured carousel; published list; album grid; lightbox prev/next/close | P0 |
| WEB-05 | Unpublish album or individual photo | Removed from all public displays and direct photo URL no longer accessible | P0 |
| WEB-06 | Select a calendar date and Day/Night | Accessible shift modal; correct event date and shift passed to inquiry form | P0 |
| WEB-07 | Save `MANUAL` count `0` for date A; leave date B unset | Date A displays `0`; date B displays **no count** | P0 |
| WEB-08 | Change mode to REAL then HIDDEN | REAL uses genuine records only; HIDDEN displays nothing | P0 |
| WEB-09 | Submit inquiry with valid date/shift/contact details | One persisted inquiry; success says team confirms availability; **no booking created** | P0 |
| WEB-10 | Retry identical submission using the same submissionKey | Only one real inquiry saved | P0 |
| WEB-11 | Submit invalid date, phone, invalid shift, extra fields | Validation rejects invalid data with no stored record | P0 |
| WEB-12 | Change Facilities, Vendors, Reviews, FAQs in CMS | Only published content appears; vendor modal and FAQ accordion work | P0 |
| WEB-13 | Change Contact info and Footer details | Website reflects only saved business information | P0 |
| WEB-14 | Recheck images and mobile layouts | No missing media, overflow, broken controls, or keyboard traps | P1 |

## 4. Admin & security acceptance matrix

| ID | Procedure | Expected outcome | Priority |
|---|---|---|---|
| ADM-01 | Open `/api/v1/admin/inquiries` without logging in | 401, no private customer data | P0 |
| ADM-02 | Login with correct and incorrect credentials | Correct login succeeds, incorrect credentials rejected, session rotated | P0 |
| ADM-03 | Submit POST/PATCH/DELETE without CSRF token | 403 and no mutation | P0 |
| ADM-04 | Submit Admin mutation from unauthorized Origin | 403 and no mutation | P0 |
| ADM-05 | Logout, then use old session cookie | Protected APIs deny access | P0 |
| ADM-06 | Upload valid JPG/PNG/WebP and disallowed file | Valid image processed; invalid/oversized uploads rejected | P0 |
| ADM-07 | Upload draft media and access public media URL | 404 until image is referenced by published content | P0 |
| ADM-08 | Update Gallery CMS and refresh website in new browser | Publication, ordering, captions and cover changes persist | P0 |
| ADM-09 | Save Hero, About highlights, images, logo, Footer links; refresh | Website reflects persisted CMS content | P0 |
| ADM-10 | Submit public inquiry; review Inbox and Dashboard | Complete fields, filters, matching counts, real statistics | P0 |
| ADM-11 | Switch count mode and delete manually entered `0` | Deleted date becomes blank, genuine inquiries remain untouched | P0 |
| ADM-12 | Restart backend and login session store | Sessions persist/expire according to configured store and policy | P1 |
| ADM-13 | Check HTTPS, Secure/HttpOnly cookies, CSRF, rate limits behind Nginx | Security behavior matches deployment configuration | P0 |

## 5. Regression checklist (carryovers from earlier phases)

- [ ] Phase 3 migration version history is unchanged and all schema constraints exist.
- [ ] Phase 5 Admin authentication and security flows still pass.
- [ ] Phase 7 Gallery album/photo publication is not bypassed.
- [ ] Phase 8 Option A blank-versus-zero distinction still holds.
- [ ] Phase 9 published/unpublished Facilities, Vendors, Reviews, FAQ, Contact still work.
- [ ] Phase 10 Dashboard uses genuine inquiry records and Bangladesh business reporting dates.
- [ ] Phase 11 Hero, About and Footer are editable and persisted.
- [ ] Public visitor never has an account/login/registration page.
- [ ] No separate management system or confirmed reservation engine has been introduced.

## 6. Acceptance blockers and outstanding business materials

1. **Environment:** npm installation, Chromium installation, and real MySQL connection must succeed on the target computer.
2. **Runtime:** run existing API tests, new integrated tests, production frontend builds, browser tests and live smoke checks.
3. **Live database CRUD:** full Admin CMS changes, image uploads, inquiries, publishing and audit records need test-database verification; no live MySQL server was available during package preparation.
4. **Production assets:** replace PRD screenshot crops and provisional branding with venue-authorized originals; verify actual contact details, facility capacities, vendor approvals, and testimonial permissions.
5. **PRD open point:** standalone Contact Us message form was visible in a screenshot but its exact persistence/handling is not finalized. It remains intentionally unimplemented.
6. **Business validation:** confirm remaining mandatory-versus-optional form field rules, past-date selection, and exact vendor details presentation before go-live. Current implemented behavior should not be mistaken for approved business decisions on those points.

## 7. Defects found / remediation this phase

| Issue | Change | Evidence |
|---|---|---|
| Calendar initially used the viewer's device timezone | Initial calendar month now derived from `Asia/Dhaka` via `Intl.DateTimeFormat(...).formatToParts(...)` | Source inspection and static contract test; browser/live verification pending |
| Prior tests verified modules individually but not shared public/Admin workflows | Added in-memory cross-module API integration tests | Tests authored; runtime dependencies unavailable |
| No automated desktop/mobile visitor UI journey | Added Playwright mocked-API browser scenarios | Tests authored; browser execution pending |
| No safe shared-system smoke test | Added read-only live API smoke checker | Script syntax verified; live API execution pending |

## 8. Decision gate

**Prepared for local acceptance testing; not production approved.** A passing static check is not proof of live MySQL functionality. Record command output, browser screenshots, and any failing test logs before approving the next phase.
