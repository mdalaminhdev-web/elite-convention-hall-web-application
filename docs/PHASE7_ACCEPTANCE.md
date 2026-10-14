# Phase 7 — Gallery (PRD pages 12–18, Figures 4–6)

## Delivered source files
- Public: `GET /api/v1/gallery/albums[?featured=true]`, `GET /api/v1/gallery/albums/:slug`.
- Admin (authenticated + CSRF for mutations): list, create, edit, delete albums; media upload; add/edit/delete/reorder photos.
- Gallery media conversion using Sharp: JPEG, PNG or WebP, 8 MB upload cap, dimensions/pixel limits, WebP re-encoding.
- Public homepage premium featured album cover-flow, All Albums page, individual Album page with photo grid, accessible lightbox, previous/next and swipe.
- Admin Gallery CMS, photo caption/alt/publish controls, album cover changes, featured/published status, photo reordering and replacement.
- Phase 3 migration `004_gallery.sql` and Phase 5 session/security foundations are preserved.

## Confirmed behavior
- Published albums only on public API; hidden albums yield 404 at public detail route.
- Only published photos are exposed publicly and counted as public photos.
- Album publication requires a valid uploaded cover.
- Gallery photos can remain unpublished in the Admin list.
- Media downloads are checked against publication status; unpublished photo files are accessible to an authenticated Admin only. Never configure Nginx to expose the gallery upload directory directly.
- No fabricated albums/photos or inquiry data are seeded.
- Gallery photos are not bookings, and do not alter the Inquiry Calendar.

## Important operational notes
- All gallery media is re-encoded to `.webp` by Sharp and stored in `backend/uploads/gallery` unless `MEDIA_ROOT` is configured.
- Backup both MySQL **and** the uploaded media directory. Restoring only MySQL will produce broken images.
- Gallery item deletion removes relational records. Uploaded media is intentionally not immediately deleted (other records may reference the same asset). A safe orphaned-media cleanup strategy can be added later.
- The Gallery preview background uses a Phase 6 PRD mockup crop pending approved real venue photographs. It is explicitly not asserted to be genuine event media.
- Gallery CRUD is Phase 7; other Admin CMS modules and public Calendar will be implemented later.
- No changes to the approved PRD, authentication schema, or inquiry count Option A behavior.

## Not yet completed in this development package
- Gallery write operations do not yet produce business-level gallery audit log entries; this should be added with CMS-wide activity logging in Phase 11 before production. Authentication audit remains implemented from Phase 5.

## Acceptance checklist (run locally after npm install and MySQL setup)
1. Run `npm install` from project root. If npm cannot reach registry, install in an online development environment.
2. Ensure Phase 3 migrations were executed and `gallery_albums`, `gallery_photos`, `media_assets` exist.
3. Ensure `backend/.env` has MySQL credentials and a persistent strong `SESSION_SECRET`.
4. Start backend/admin/public frontends with `npm run dev:api`, `npm run dev:admin`, `npm run dev:public`.
5. Execute `npm run check:api-syntax`, `npm run test:api`, `npm run build`, `npm run db:check`.
6. Create Admin account if needed with `npm run admin:create`.
7. Sign in to CMS at `http://127.0.0.1:5174/login`; choose **Gallery Management**.
8. Create album (draft), upload cover, upload multiple photographs; edit captions and alt text.
9. Reorder photos; check public page is still hidden before album publication.
10. Mark album Featured and Published; open homepage at `http://127.0.0.1:5173`, verify card, click View All Albums, View Album, open image lightbox, navigate and close.
11. Hide an album or a photo; confirm it is no longer publicly exposed while Admin still sees drafts.
12. Verify anonymous Admin gallery access returns 401 and missing CSRF on edits returns 403.
13. Verify mobile layout and keyboard controls manually; ensure no placeholder album records are treated as genuine.
14. Verify disk persistence across backend restart, MySQL record persistence across reload, and backup storage location.

**Verification status:** Source and static checks only in this environment; app runtime, MySQL CRUD, end-to-end UI and API tests require environment with dependencies and MySQL running.
