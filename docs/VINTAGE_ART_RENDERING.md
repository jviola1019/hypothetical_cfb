# Gridiron Lab 26 — original cinematic football character renderer

## Why this version exists

The previous vector athletes were flat caricatures, visibly unlike the generated reference storyboard and the early-2000s college-football videogame era. Additional gradients or outline stroke changes could not solve the anatomy, texture, shadows or staging. The redesigned game surface uses two high-resolution original player renderings with realistic helmets, shoulder pads, facemasks and physical lighting while retaining native HTML controls and source-derived scoreboxes.

## Evidence and design reference

- User-owned generated UI references: *Gridiron Classic 26 UI Storyboard.png* and *Gridiron Lab 26 Final Simulation.png*; not copied as an uneditable page background.
- Actual original game-era menu design research: NCAA Football 06's **Heisman Watch** and **Create a School** menus, which show isolated three-dimensional player art beside rectangular tabular menu controls, not floating modern dashboard cards.
- The branded project is independent. It must not display EA Sports or NCAA trademarks, unlicensed team logos, or photorealistic portraits of claimed real student-athletes.

## Implementation

- `public/assets/qb-hero.webp`: original fictional helmeted quarterback, generated for the project; helmet and jersey are deliberately chroma-separated. `runner-hero.webp`: second original fictional ball-carrier, with distinct pose and appearance. Both are approximately 400px wide and optimized for early-console resolution.
- Matching `*-mask.webp` files encode jersey, helmet and trouser tint areas into their R/G/B channels. They are geometry-aware paint mattes, not semantically accurate licensed 2026 uniform descriptions.
- `src/retroPortraits.js` loads only local assets, maps colors through the canonical `teamKit` data, recolors uniforms with material luminance preserved, caches results, and guards against stale async image swaps. It does not read or change the simulation, predictions, rosters, games or awards.
- `public/assets/retro-night-stadium.webp` is an original deterministic stadium texture with crowd dots, floodlights and turf (not a real university stadium).
- `src/retroAuthentic.css` enlarges player/stadium art into a PS2-era game stage, places the genuine generated scoreboard as a desktop overlay, keeps the Playoffs and Research tabs as real tables/graphs, and preserves a readable mobile layout.
- The original animated SVG football figures remain **only** as an asset-failure fallback and are hidden after real portraits are painted.
- `src/app.js` retains canonical team IDs for both actors, source scoreboxes, winner IDs, and award recipients; the art is purely derived from those values.

## Explicit limitations

These are **rendered image assets, not live rigged 3D meshes**. They cannot rotate or change arbitrary body poses; expanding into a full articulated 3D animation system would require a separate licensed/CC0 player mesh, skeletal animation authoring, offline rendering/runtime WebGL, and performance audits. No accurate current-week jersey number, team branding element, exact 2026 uniform combination, or actual player likeness is implied by the artwork. Two visual archetypes are provided rather than falsely claiming 138 individually sculpted 3D models.

## Review gates

1. `npm run check && npm test && npm run build` must succeed against the full repository, not a partial source archive.
2. `tests/retro_portrait.test.js` confirms physical assets are bundled, tint isolation is deterministic and source-projected data is untouched.
3. `tests/console_visual_browser.py` must capture desktop/mobile Chromium and WebKit screens, confirm the recolored player sources are loaded, verify changing Oregon/LSU teams updates two distinct portraits, preserve the real scoreboard totals, and check that there is no horizontal page overflow.
4. `tests/live_browser.py` must continue to pass all worker-generated game, tournament, data, seeded replay, scorer reconciliation, awards, final ceremony and research-data contracts.
5. Inspect the actual screenshots from the GitHub Actions artifacts, not mockups. Hold merge if player images are distorted, clipped at the helmet, too small, have unremoved matte background, or obscure the real game score.
6. Preserve reduced-motion setting, no third-party runtime fetch, CSP and content provenance. Any performance regressions should be treated as release blockers.

## Roadmap beyond this release

For *truly* rotatable and animatable 3D players, replace the images with an independently sourced permissive GLB athlete mesh with correct football pads/helmet, named recolorable materials, QB/RB/WR/DEF poses and skeletal animation. Do not claim that a photographic cutout is a 3D model. This future step is deliberately not shipped without suitable assets and a real browser performance budget.
