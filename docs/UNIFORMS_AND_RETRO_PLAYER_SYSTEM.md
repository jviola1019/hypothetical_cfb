# Gridiron Lab 26 — school uniforms and retro player-rendering contract

## Design target

The supplied three-screen concept is the visual brief: a convincing 2004–2007 console college-football menu, not a generic sports SaaS dashboard. Typography, pacing and hierarchy follow compact PS2/Xbox-era selection rows and scorebug framing. The output is an independent game; EA/NCAA logos and official copyrighted graphics are not included.

The previous release used a single hardcoded red generic quarterback and a partially populated team-accent map. That could never reproduce a Georgia/Ohio State matchup, distinct LSU/Oregon uniforms, or accurate team-colored award portraits.

## What is now implemented

- All **138 named 2026 FBS programs**, plus **five FCS reference programs**, have a static curated presentation kit: base jersey color, contrasting accent, helmet shell and stripe grammar in `src/teamKits.js`.
- 80 distinctive programs have explicit visual overrides; the rest use an institutional color source paired with the multi-color cross-reference. These are **artistic uniform concepts**, not documented 2026 game-worn jersey combinations.
- `src/playerArtwork.js`: two original vector pseudo-3D athlete models, a generic QB and RB pose, layered helmet highlights, facemasks, jersey fabric shading, shoulder bars, trouser stripes, and vector football. The team palettes drive all fills. Generic jersey **26** is a season-art motif and is NOT the real athlete's uniform number.
- `src/branding.js`: all 138 programs now share the same identity palette for the pregame HUD, detailed scoreboard and roster scouting accents. Previously only 32 names were covered.
- The Game screen renders the actual two selected teams' uniforms, not Ohio State/Georgia images baked into the page. Similar home colors automatically generate an **illustrative contrasting away kit** for the second team.
- Playoff preview and full 138-school bracket derive team colors from the same IDs as the canonical standings. Existing results/seed geometry are unchanged; no future winners are fabricated.
- MVP/OPOY/DPOY/title-game MVP cards and the championship spotlight display the corresponding generated winners' team colors and original concept athletes.
- `src/teamUniformStage.css`: real Barlow Condensed italic display and Tahoma fallback, controlled silver bevels, school-specific bars, stadium depth, player intro/idle animations. `prefers-reduced-motion` removes those animations. Styles load after the existing period menu design.
- Original school-agnostic graphics remain a functional fallback. The color/UI layer never changes simulation seeds, projections, player roles or results.

## Data and authenticity boundary

School identity sources:
- Primary palettes: https://github.com/array-carpenter/the_spade/blob/main/cfb_team_colors.json
- Multi-color cross-check: https://github.com/glidej/ncaa-team-colors
- Real-world uniform research reference: https://cfbuniform.com/about/
- Period UI research reference: https://adrian-peterson.com/ncaa_2006.html

These sources do not validate each team's exact 2026 helmet/jersey/pants combinations, nor player numbers or likenesses. The site must not claim that they do. No photographs, EA/NCAA marks, mascot logos, real athlete likenesses, or uniform scans are embedded. SVG models are original **stylized console-era characters**, not imported 3D models or photorealistic renders.

Player projections remain synthetic. A graphic cannot turn fictional season totals into calibrated player props; source-grade disclosures and the replay-model activation gate remain intact.

## Layout and style gates

Use browser screenshots, not inferred CSS output, to compare:
1. Game: two different team-colored 3D-style figures, authentic helmet details, legible independent score totals and quarter-by-quarter line, left selectors and right research panel.
2. Playoffs: each displayed school has a distinct team-color stripe/helmet, aligned seed numbers, no overwritten later-round cards, full 138-team scrolling remains accessible.
3. Awards: four source-derived award recipients; each uniform follows its actual generated team; no invented athlete jersey numbers; trophy at 11.6 seconds, award reveal at 13.2 seconds, finish at 15 seconds.
4. Accessibility: all 138 kits have >=4.5:1 number/jersey contrast, visible focus, no page overflow at 320, 390, 768, 1366, 1920px, and disabled ornamental animation on reduced motion.
5. Source/data integrity: no change to historical score data, modeled result calibration, player usage assumptions, or roster freshness assertions.

## Commands and evidence

```sh
npm run check
npm test
npm run audit:data
npm run build
python3 -m unittest discover -s tests -p 'test_*.py'
python tests/console_visual_browser.py
python tests/live_browser.py
```

The GitHub Actions **Console-era visual browser** and **Hosted-module Chromium & WebKit** jobs provide independent synthetic gameplay and responsive checks. Review their actual desktop/mobile screenshots, including Oregon vs LSU, before merge; source tests alone cannot certify artistic fidelity. Verify Pages deployment refers to the exact merged SHA.

## Security review

Keep model-data strings escaped; no remote image fetch, external SVG fragments, unsafe SVG event attributes, or inline executable scripts. FBS identity inputs are limited to the compiled catalog; CSS variables are compiled hexadecimal literals. Preserve CSP and same-origin Worker constraints. Check XSS, prototype pollution, import/data provenance, SVG misuse, caching and dependency integrity. The user's larger security checklist also includes server/database/authentication categories that are not applicable to this static app and should be recorded as not applicable—not as tested.

## Follow-up candidates

Only after the above gates: date-stamped uniform-combination metadata per 2026 game from verified sources; jersey-number fields from licensed/verified depth charts; independent audits of source metadata; original licensed athlete photography or commissioned 3D character assets if separately obtained. Do not manufacture any of these values for a visual effect.
