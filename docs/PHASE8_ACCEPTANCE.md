# Phase 8 — Query Calendar, Inquiry Submission, Count CMS

## Scope (approved PRD pages 19–22, 33–36)

* Public monthly calendar with previous/next controls and day selection.
* Day / Night shift modal with keyboard Escape and focus containment.
* Event inquiry form pre-filled from selected date and shift, also reachable directly.
* Server-validated MySQL persistence of genuine submissions, with a UUID idempotency key.
* Real / Manual / Hidden calendar display modes; only one may be active.
* Admin date-wise manual count entry (including zero), update and removal.
* Protected read-only Admin inquiry list, details and summary.
* No confirmed booking, reservation, blockout, or availability status is created.

### Approved Option A

When `MANUAL` is active, a date without a manual row must be omitted from the `counts` API array and display no numeric count. If a row exists with `display_count=0`, the API must return `{date, count:0}` and the calendar must display `0 inquiries`. Deleting that manual entry returns the date to a blank state. In `REAL` mode, dates with no submitted inquiries display 0. In `HIDDEN` mode, no counts are returned or displayed.

### Validation assumptions (not new business policy)

The PRD lists seven visitor form fields, without specifying which are mandatory. The Phase 8 code minimally requires full name, phone number, event date and shift. All other fields are optional to avoid inventing stricter requirements. It validates actual ISO dates and phone/email formats. Past-date policy is **not** enforced until the client confirms the permitted date range; this must be resolved before production.

### Local verification prerequisites

1. Complete the Phase 3 MySQL migrations with `inquiries`, `manual_inquiry_counts`, `inquiry_count_settings`, and `admin_audit_logs` tables. No schema changes are required from Phase 7.
2. Preserve `backend/.env` from the previous working phase, set MySQL credentials and a strong `SESSION_SECRET`.
3. `npm install` from project root; dependencies are not bundled.
4. `npm run dev:api`, `npm run dev:public`, `npm run dev:admin` in separate terminals.
5. Provision an admin with `npm run admin:create` if not already provisioned.

### Manual browser/API tests

| Test | Expected |
|---|---|
| Browse homepage to Query Calendar | Monthly grid loads; PRD disclaimer is visible |
| Click a date and Day/Night shift | Shift modal appears; Continue goes to `/inquiry` with correct date/shift |
| Visit `/inquiry` directly | Date and shift can be selected there |
| Submit valid inquiry | `201` and success confirmation; one real MySQL record |
| Retry with same UUID | `200` with duplicate flag; no second record |
| Submit malformed date or shift | `400 VALIDATION_ERROR`, no insert |
| Anonymous `/api/v1/admin/inquiries` | `401 UNAUTHORIZED` |
| Admin changes count mode without CSRF | `403 CSRF_DENIED` |
| Admin enables MANUAL and saves 0 | Public calendar displays 0 on that date |
| MANUAL date with no entry | Public calendar shows blank count |
| Admin deletes a manual count | Public calendar goes blank for that date |
| Admin selects HIDDEN | No count appears on public calendar |
| Admin selects REAL | Counts derive from real `inquiries` rows |
| Admin opens inquiry | Full submitted details are visible; no booking created |

### Commands

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

**Runtime acceptance not yet verified in this sandbox.** Never claim MySQL, browser, or npm-based tests passed until they have been run on the user's machine.

### Deferred to later CMS/production phases

Full status/follow-up workflow is not approved in this PDF; read-only inquiry inbox only. Dashboard cosmetic refinements, confirmed contact details, final original imagery, and production QA belong to the scheduled upcoming phases.
