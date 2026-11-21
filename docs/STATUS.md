# Status — 2026-11-20 / v0.3.0

## Implemented and tested

- Offline two-tab static website; runs from a local HTTP server.
- Seeded synthetic game generator with regulation/limited overtime and drive logs.
- Team/pass/receiving/rushing and kicking aggregate stat reconciliation.
- Simulated single-game score, synthetic role player props in both game tab and playoff game inspector, custom spread/total lines, sample score/margin/total diagrams, running win-frequency chart.
- 13 labeled tournament presets, seed mapping (including official FBS 12/24 first-round geometry), bracket seed editing/swapping and byes, manual match simulation, full round and tournament simulation, individual game inspector, synthetic championship frequency from full tournament Monte Carlo.
- Node test and syntax suites, measured local benchmarks, dependency-free static build, Chromium DOM smoke tests at desktop and iPhone width with a verified no-horizontal-overflow assertion, GitHub Pages workflow source.

## Implemented but not independently verified

- Native ES module and Web Worker execution in actual browser URL navigation (sandbox blocked navigation); module worker cancellation, progressive UI updating, published GitHub Pages runtime.
- Shareable fragment-link and JSON download interactions under native browser API.

## Partially implemented / experimental

- **Statistical model:** coherent but completely synthetic/untuned drive-level generator; no observed-data baseline, fitted parameters or holdout calibration.
- **Players:** synthetic roles, not historical athletes; only selected QB/RB/WR/TE/K stats; no defensive players.
- **Official playoffs:** initial bracket geometry, byes and FBS host labels implemented; qualifying selection, all bowls, regional FCS mapping and committee ranking not reproduced.
- **NCAA gameplay:** simplified possession events and scoring; no down/distance, punts/touchbacks as exact rule mechanics, penalties, NCAA 2-point conversion box stats, substitutions or clock stoppages.
- **Visuals:** functional score atlas, margin/total histograms, scoreboard, convergence and advancement bars; full 17-chart wish list not completed.
- **Security:** static threat triage + boundary validation and unit tests, not exhaustive pen test.

## Not implemented

- Real historic game/drive/roster/athlete data or CFBD integration, calibrated pregame model, model-fitting Python pipeline, longitudinal data feature store and audit, opponent-adjusted EPA, real player markets, model-versus-market holdout evaluation, injury/weather/rest carryover, advanced playoff conditional analysis, win-probability live model, realistic down-by-down football, model ranking/auto-bid selection, accessible bracket tables independent of cards, import workflow, custom tournament rules designer, visual animations beyond basic transition, rigorous WebKit/physical mobile/axe verification, Figma/design image asset production, actual server-backed enterprise security.

## Deployment status

Local archive and static build generated. GitHub publication and Actions/Pages deployment must be confirmed independently; a committed workflow alone does not prove public hosting.
