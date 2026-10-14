# Elite Convention Hall — Phase 3 MySQL database

**Scope:** The approved 40-page Portfolio & Event Inquiry Website PRD and its secure Website Admin CMS ONLY. No internal CRM, confirmed bookings, payments, payroll, employee attendance, or financial system.

**Decision approved by the user — Calendar Option A:** In MANUAL count mode, a missing `manual_inquiry_counts` row for a date means **show no count**. An explicit row with `display_count = 0` means **show zero**. In REAL mode, counts derive from `inquiries`. In HIDDEN mode, counts are omitted. `inquiry_count_settings.display_mode` enforces mutual exclusivity.

## Files

- `Elite_Convention_Hall_Full_Initial_MySQL_Setup.sql`: one-file initial setup for a NEW database using MySQL Workbench.
- `migrations/000_database.sql` through `migrations/010_admin_audit.sql`: the same initial schema organized into ordered, versioned migration files.
- `verify_installation.sql`: read-only verification and example count queries.
- `ERD.mmd`: high-level Mermaid ER diagram (major relationships only).
- `DATABASE_DESIGN.md`: schema design and per-table column dictionary.
- `calendar_option_a_test.sql`: safe temporary-table demonstration of missing versus explicit zero.
- `DATABASE_DESIGN.md`: schema design and per-table column dictionary.
- `calendar_option_a_test.sql`: safe temporary-table demonstration of missing versus explicit zero.

## Requirements

- MySQL 8.0.16 or newer (CHECK constraints require 8.0.16+). Prefer a currently supported MySQL 8.4 LTS server for a fresh production deployment when compatible.
- Database-creation privileges to run migration `000_database.sql` (or have an administrator create the database first).
- Use a separate least-privileged application MySQL user. Do not grant application users routine schema DDL permissions.
- Database and all app connections should use a consistent UTC timestamp policy, while `event_date` remains a DATE in local event-date context. Display times in Asia/Dhaka as appropriate.

## Installation — MySQL Workbench

1. Connect to a NEW/EMPTY MySQL instance/database environment with appropriate setup permissions.
2. Open `Elite_Convention_Hall_Full_Initial_MySQL_Setup.sql`.
3. Review the target database name (`elite_convention_hall`) and change it consistently if necessary.
4. Execute the full script once. It creates the database, tables, singleton configuration rows, and migration history rows.
5. Execute `verify_installation.sql`. Confirm 11 migration history records (versions 000–010) and 25 application tables excluding `schema_migrations` (26 total).
6. Create an admin account only using the approved backend admin-provisioning flow; generate the password hash with a secure password-hashing library. No default admin credentials are inserted.
7. Add real approved venue media/contact content via the future CMS; sample venue contact details, vendors, testimonials, and inquiries are intentionally NOT inserted.

### Alternative initial install

Run numbered SQL files in `migrations/` **in numeric order** instead of the single-file setup. Do not run both approaches on the same database as a migration procedure.

## Migration safety

- These scripts are an **initial schema baseline**, not a complete migration engine. `CREATE TABLE IF NOT EXISTS` does NOT upgrade an existing table's columns.
- Never re-run the full initial setup as a production upgrade. Future changes require separate `ALTER TABLE` migration files, backups, and rollback planning.
- MySQL DDL typically commits automatically, so a partially failed migration can leave created tables even when tracking is incomplete. Investigate errors before retrying.
- The `schema_migrations` ledger is informational for these baseline scripts. Choose a migration runner with an exclusive migration lock/check process before production upgrades.
- Do not edit already-deployed numbered migrations; create a new migration for each schema change.

## Security session compatibility

`admin_sessions` uses the `session_id`, `expires`, `data` layout used by `express-mysql-session`. When implementing Node, configure that library with `createDatabaseTable: false` and the custom table name `admin_sessions`. Session user identity stays in the serialized session payload; the session table intentionally has no direct admin-user FK. Session expiry management remains the session store's responsibility.

## Key constraints and important business distinctions

1. Public visitors have no accounts; `admin_users` are **website CMS administrators**, not employees of a separate internal system.
2. Album/photo relationship uses FK and display order; visible galleries filter `is_published=1` at album and photo levels.
3. REAL inquiry counts must be computed from `inquiries.event_date` (not `created_at`) and must never be inferred as booked/available dates.
4. MANUAL inquiry count changes never write to `inquiries`.
5. MANUAL missing date and explicit zero are different states; do not use `COALESCE(display_count, 0)` for manual mode.
6. In REAL mode, months with no submissions may display **0** for those dates; in MANUAL mode a missing row is **blank**. `inquiry_count_settings` is a singleton, seeded to the conservative `HIDDEN` mode until configured in the Admin dashboard. Changing mode updates only this configuration record.
7. Backend form validation still needs the final required/optional field decision. Email/event type/guest count are nullable in the baseline rather than silently assuming mandatory fields; the approved full field list is retained.
8. Backend must require a stable UUID submission key per inquiry attempt; retries reuse it, and duplicate keys must return the original result without creating another row. Customer inquiry records must not be publicly accessible through admin APIs without authentication.
9. Upload media must be validated by the backend; the `media_assets` table stores metadata and storage keys, not image binaries.
10. `admin_audit_logs` must not contain password hashes, session cookies, or unnecessary customer PII in its JSON fields.

## Manual count / zero test (run after you create records from authenticated CMS)

- With no `manual_inquiry_counts` record for `2026-11-01`: API returns no count key for that date.
- With a record for `2026-11-02` having `display_count=0`: API returns `count: 0`.
- With a record for `2026-11-03` having `display_count=7`: API returns `count: 7`.
- In REAL mode, values derive only from actual inquiries regardless of manually entered values.
- In HIDDEN mode, do not expose count entries at all.

## Known details still needing business confirmation before full backend rules

- Which inquiry fields are mandatory versus optional, and phone format requirements.
- Whether prior dates are selectable and how far into the future dates can be chosen.
- Vendor View Details design (modal/dedicated page) and whether any additional vendor assets exist.
- Whether Contact Us screenshot's standalone message form is in scope, and where its submissions go.
- Admin inquiry statuses/actions shown in concept visuals but not established in core written PRD.

These items do **not** justify adding undocumented tables/statuses at this stage.

## Verification status

SQL files were generated and statically checked for structure and dependency order. No running MySQL server/CLI was available in the authoring environment, so successful MySQL execution and constraint behavior must be verified on your MySQL 8.0.16+ installation before Phase 3 is marked runtime-verified.
