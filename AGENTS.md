# Engineering instructions — Gridiron Lab 26

Primary product reference: [docs/UNIFORMS_AND_RETRO_PLAYER_SYSTEM.md](docs/UNIFORMS_AND_RETRO_PLAYER_SYSTEM.md).
This repository is a *static, offline-first, independently branded* 2026 FBS simulator.

- The 2004–07 console UI is a design reference, not permission to reproduce proprietary menus, EA/NCAA logos, copyrighted player imagery, or official 2026 uniforms.
- Do not modify the statistical engine merely to justify a design. Real-world research estimates and fictional generated gameplay must stay separately and clearly labeled.
- **One data source of truth:** 138 FBS programs in `src/catalog.js`; institutional visual identity in `src/teamKits.js`; original athlete drawing in `src/playerArtwork.js`. Team artwork changes immediately when user changes a school, and awards derive from canonical tournament results.
- Do not add a fifth hardcoded list of team colors, invented player jersey number, mystery football game seed, prewritten tournament winners, or fabricated game-day injuries.
- Keep fonts real, readable and period-appropriate: condensed athletic menu headings, simple body font, grid-aligned scoreboxes, squared metallic borders, muted red selected rows, team colors on team-specific items only.
- Explicit local quality gates: `npm run check && npm test && npm run audit:data && npm run build`; Python units; Chromium + WebKit at desktop/tablet/320/390px; review screenshot artifacts; reduced-motion; bracket 138; 15-second ceremony; awards source equality.
- Security is architecture-specific: escape strings, constrain SVG to static geometry, reject unsafe inputs, preserve CSP and no secrets, no untrusted markup. Do not claim to test non-existent authentication, server DB, SAML, JWT, payments or WebSockets.
- Before editing, record baseline commit, intended files, invariants, and rollback option. After editing, record exactly which tests ran, their exit status and screenshots. Use a feature branch and merge only after all required checks pass on the exact commit.
