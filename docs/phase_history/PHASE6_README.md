# Elite Convention Hall — Phase 6 Public Website UI Foundation

Scope remains the final approved **40-page Website PRD only**, with its existing secure website CMS foundation. **No separate Internal Management System.**

## Delivered in Phase 6

- Premium black/champagne visual system adapted from PRD Figures 1–3 and 15.
- Responsive sticky header with exact PRD navigation: Logo / Home / Query Calendar / Gallery / Facilities / About Us / Contact.
- Mobile menu, keyboard navigation, active-section highlighting, hash navigation (including from separate routes).
- Hero heading, tagline, conversion CTA and accurate inquiry-not-booking clarification (PRD pp. 8–10).
- About Us values/highlights and three-image gallery composition (PRD p. 11).
- Footer with the approved link categories and no fabricated contact details or policies (PRD pp. 29–31).
- Honest labelled development placeholders for future sections, preserving all ten homepage sections in PRD order.
- Routes for `/gallery`, `/gallery/:slug`, `/inquiry` that explicitly indicate features are not yet live.
- Existing Phase 5 backend, secure Admin CMS authentication and the approved Phase 3 SQL migration files preserved unchanged.

**Important content/asset policy:** The files `public/media/reference-*.webp` are cropped from the visual mockups embedded in the client-supplied PDF. They are **reference-only illustrations**, not verified photographs of the real Elite Convention Hall. The logo in the code is also a *typographic placeholder*, not an official logo. Replace these with official approved image files, approved logo, verified contact/policy information and finalized section copy before production release. To swap the media easily, update `src/content/sitePreview.js`.

**Important functionality policy:** This is a *Phase 6 UI-only foundation*. The Gallery, Query Calendar, Inquiry Form, Facilities, Vendor, Reviews, FAQ and Contact sections are clearly labelled as upcoming work. They do **not** accept inquiries, reserve dates, display real event availability, or claim production-ready functionality. PRD CMS-backed content and API wiring occur in later phases. The temporary route screens are not final public page designs. The frontends include `<meta name="robots" content="noindex,nofollow">` for development preview.

## Set up on Windows (PowerShell)

Install Node.js >= 22.12 and npm >= 10; install/verify approved Phase 3 MySQL schema before using Admin authentication.

```powershell
npm install
Copy-Item backend/.env.example backend/.env
```

If `backend/.env` already exists, **keep it**; do not overwrite your secrets. Configure it based on the Phase 5 README and follow Phase 5 admin account provisioning instructions.

Run each in a separate terminal from project root:

```powershell
npm run dev:api
npm run dev:public
npm run dev:admin
```

Preview public website: `http://127.0.0.1:5173`.
Admin login: `http://127.0.0.1:5174/login`.
Health: `http://127.0.0.1:4000/api/v1/health`.

## Verification

```powershell
npm run check:api-syntax
npm run test:api
npm run build
npm run db:check
```

Additional manual UI checks:

1. On desktop, check horizontal navigation, Hero sizing and About photo layout.
2. Click all header links. Each must move to the appropriate *existing* section in PRD order.
3. Click the Hero CTA; it must scroll to the labelled future Query Calendar area, **not pretend that availability was checked**.
4. Navigate to `/gallery`, then use header links; they must return to the homepage section.
5. Test 360px mobile viewport: open/close mobile menu, tap links, check no horizontal overflow.
6. Check About/brand layout and footer at tablet and desktop widths.
7. Test keyboard focus, skip link and reduced-motion support.
8. Confirm previously working Phase 5 Admin authentication remains functional with the local MySQL server.

**Verification limitation:** In this environment only source generation, backend JavaScript syntax, ZIP integrity, image file checks and other static checks can be performed; npm dependencies are not cached, so the Vite production build, runtime browser interactions and MySQL integration must be validated locally. These must not be reported as passed until tested.

## PRD phase references

- Figure 1: Navbar, pages 6–8.
- Figure 2: Hero, pages 8–10.
- Figure 3: About Us, page 11.
- Figure 15: Footer, pages 29–31.
- Full Gallery: Phase 7, pages 12–18.
- Query Calendar and Event Inquiry: Phase 8, pages 19–22.
- Remaining website sections: Phase 9.
- CMS integration and public-content dynamic loading: Phase 10–11.

## Next phase

**Phase 7:** Gallery album APIs and a fully functional three-level Gallery, using the approved MySQL schema, CMS authentication and secure media asset upload handling. The reference-only media may be replaced with client-provided originals before the next phase.
