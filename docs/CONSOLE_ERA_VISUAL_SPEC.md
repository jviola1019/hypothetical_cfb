# Gridiron Lab 26 / Image-faithful console menu
**Reference**: user's generated 1672×941 Game / Playoffs / Model & Validation screen mockups in conversation (visual inspiration, not deployable data/assets).
**Current product**: original independent college football simulator. No EA SPORTS/NCAA affiliation.

## Why the previous version was rejected
The previous design only changed a long vertical dashboard's palette. It never reconstructed the screen grammar of the supplied console-game screenshots: a two-tier stadium masthead, selected crimson game mode, sidebar control menu, boxed live result and quarter lines, photo-style action panel, stat/drive rows, right model context, a bracket that occupies the main screen and bottom controller strip. Decorative CSS could not fix the information architecture.

## Implemented contract
- Header: 2026 wordmark over original stadium art; three primary tabs at full width.
- Game: left live team/venue selectors; generated score pair and true period totals; original **generic** quarterback SVG; functional Box Score / Players / Drives / Simulation Ledger controls; separate research model estimate and data-source sidebar.
- Playoffs: seed/format controls at left; genuine per-round scoreboxes and winner coloring in an immediately visible bracket, scrollable at smaller widths; deep view preserves the full 138-team tree, seeding swaps, inspectors and championship.
- Model & Validation: actual reliability chart, evaluated model comparison, interval coverage and source totals in compact old-game data panels. The generated scoring engine is not certified as calibrated; 2026 is not a pristine holdout.
- Shared: archival charcoal/silver, restrained crimson selected states, genuine Roboto Condensed / Arial fallback, rectangular border geometry and bottom console-key *visual hints*. The hints do not claim hardware controller support.
- Real inputs and all source/evidence disclosures remain HTML; no image mockup is placed over controls, and no demo scores are hardcoded.
- User-supplied screenshots were design references; they contain contradictory outcomes, fake calibration claims and trademarked publisher marks, so screenshots themselves are not used as production website backgrounds.
- Original assets: existing heritage-stadium.svg and new code-generated generic player illustration; no copied player likeness, proprietary mascot logo, or game screenshot.

## Acceptance and comparisons
1. `tests/console_era_design.test.js` inspects structural layout, data bindings, original imagery, terminology and CSS.
2. `tests/console_visual_browser.py` captures six game, six playoff and six research images in hosted Chromium/WebKit at 390, 768 and 1366px. It checks interactive menu switching, dynamic source score consistency, 12/138 formats, no page overflow and no JavaScript exceptions.
3. The existing browser and simulation gauntlet independently checks seeded replays, 850-sample workers, 14 form factors, ≥10-second live staged tournament, 137 separate games for all-FBS, and award/scorebox reconciliation.
4. Human visual review of screenshots is required before merge. Compare: *masthead*, *selected menu*, *main scorebox/art*, *right rail*, *bracket geometry*, *graph/table density*, *mobile controls*, *trophy/award presentation*. Automated tests cannot establish artistic similarity alone.
5. Only merge and deploy after all jobs green on exact PR head, then verify deployment commit and published asset.

## Data limitations
The reference design shows Ohio State and Georgia with invented stats. This site draws whichever teams are currently selected and their outcomes from one canonical simulation. Team-specific branding/art is original text and color treatment only. Individual DPOY credits are synthetic allocations, not observed defender events. No claims of physical iOS Safari testing or calibrated player props are made.
