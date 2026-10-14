# Phase 9 — Public Sections / CMS Acceptance Checklist

**Scope:** 40-page approved Elite Convention Hall Website PRD, Facilities (pp. 22–24), Vendors (pp. 24–25), Reviews (p. 26), FAQs (p. 27), Contact (pp. 28–29). The Admin CMS includes controls for these modules; remaining Hero/About/Footer management follows the later CMS phase.

## Preconditions
- Local MySQL schema from **Phase 3** has been installed and verified. In particular migrations `002`, `005`, `006`, and `007` have been applied.
- Project `backend/.env` points to the existing development MySQL database and has the original `SESSION_SECRET`.
- A real Admin account has been provisioned in Phase 5.
- Run `npm install` in project root and start all three services.
- No sample vendors, guest counts, client reviews or business details are seeded as genuine records.

## Public content tests
1. Visit `http://127.0.0.1:5173/`. Confirm the five sections appear in the correct order immediately after Query Calendar: Facilities → Vendors → Client Reviews → FAQ → Contact Us, followed by Footer.
2. With no records published, confirm each section has a clear empty state. Unpublished records must not be shown.
3. Open `http://127.0.0.1:5174/login`, sign in with the provisioned Admin, then visit `/content`.
4. Create a Facility with an approved name and description. Leave `Publish facility` unchecked. Verify the public Facilities section still shows no item. Edit it, check Publish, save and refresh the public page. Verify the facility appears; hide it and verify it disappears.
5. Upload a real/approved facility photograph using the editor. Save and publish the Facility, check that the image loads publicly. Hide the Facility and confirm the public `media/content/...` image is no longer available (404). Logged-in Admin preview is still accessible through the private `/api/v1/admin/gallery/media/...` path.
6. Add an approved Vendor Category. Add an approved Vendor within that category. Publish and verify the vendor appears. Select **View Details**, check that the details modal shows only approved information and Escape closes it. Hide the category, then verify its vendors disappear from public responses.
7. Publish one genuine, permission-approved Review. Confirm rating and client image (if approved) display. Unpublish it and confirm removal from the public section. Do not use invented reviews.
8. Add an FAQ Category and a Q&A; publish both. Verify the accordion expands and collapses. Hide the category and confirm the categorized FAQs are excluded.
9. Add the venue's official contact phone, email, WhatsApp, address, contact hours, and approved HTTPS map link. Verify the Contact section shows only supplied values and the Footer reflects verified phone/email/address.
10. Add a genuine HTTPS social link and choose CONTACT, FOOTER, or BOTH. Confirm it appears only in the permitted location(s).
11. Check all components at desktop (1440px), tablet (~768px), and mobile (~375px). Verify keyboard focus, FAQ accordion and vendor dialog behavior.

## API and security tests
- Public routes: `GET /api/v1/content/{facilities,vendors,reviews,faqs,vendorCategories,faqCategories,social,contact}`.
- Protected CMS routes: `GET/POST/PATCH/DELETE /api/v1/admin/content/...` plus protected Contact GET/PATCH.
- Unauthenticated admin edits return 401.
- Authenticated state-changing requests without correct CSRF token return 403.
- Invalid IDs and malformed body fields return 400.
- Nonexistent records return 404.
- Invalid referenced category or in-use foreign key changes produce a controlled 409 error.
- Public image routes check current publication state for facility, vendor and review references.
- CMS uses only the approved Website Admin login, not a separate Internal Management System.
- Run `npm run test:api`, `npm run build`, `npm run db:check` and record actual results.

## What Phase 9 does not implement
- Independent Contact message form: the mockup contains one, but fields and business workflow are not sufficiently specified in the approved written PRD.
- Separate Internal Management System, confirmed bookings, customer accounts, CRM, or payments.
- Hero/About/Footer **CMS editing** is scheduled under Phase 11. Footer's verified Contact/Social data integration is included now.
- A separate Vendor Profile page: the documented View Details interaction is implemented as a modal, subject to UX confirmation.

## Verification status at package creation
- All source files JavaScript/JSX parsed using TypeScript parser, relative imports checked.
- Backend `.js` files passed `node --check`.
- npm packages, MySQL server and live browser were not available in the packaging environment; live API tests, database CRUD, frontend build and responsive acceptance must be run locally.
