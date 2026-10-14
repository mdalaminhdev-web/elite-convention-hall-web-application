# Phase 4 — acceptance and manual verification

1. `npm install` at the repository root installs dependencies successfully and creates `package-lock.json`.
2. `npm run check:api-syntax` succeeds.
3. `npm run test:api` succeeds (requires installed dependencies).
4. `npm run dev:api` serves `http://127.0.0.1:4000/api/v1/health` with `status: ok`.
5. `npm run dev:public` serves the foundation page at `http://127.0.0.1:5173` and shows backend connection successful when API is running.
6. `npm run dev:admin` serves the Admin foundation at `http://127.0.0.1:5174`; there is no Admin login or data access yet.
7. `npm run build` compiles both Vite frontends successfully.
8. After running the approved Phase 3 schema on local MySQL and setting valid credentials in `backend/.env`, `npm run db:check` reports 26 total tables (including schema_migrations), 11 migration ledger rows, and one count mode record.
9. Explicit 0 versus no manual record is tested using `database/calendar_option_a_test.sql`.

**Remaining:** No MySQL server was available to the author when this package was created; do not claim the schema runtime test is passed until your MySQL verification succeeds. Admin authentication and CMS functionality begin in Phase 5 and subsequent phases.
