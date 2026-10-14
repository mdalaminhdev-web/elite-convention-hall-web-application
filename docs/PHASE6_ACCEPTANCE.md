# Phase 6 Acceptance

UI foundation generated; runtime checks pending.



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

