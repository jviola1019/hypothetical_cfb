# GRIDIRON LAB v0.9 — Usability & predictive-honesty redesign

Prepared before edits on November 21, 2026. Baseline GitHub main `396fb377ec7af19cfa8c57c0844b8ef6d600ad01`.

## Product verdict
Useful today as a seeded fantasy football simulator with real-school references, not a production-calibrated game or unconditional player prop predictor. Fix priority: front-page scientific distinction, action discoverability, output reading order, gameplay continuity, and mobile legibility.

## Source inspirations (not copied)
- GridironViz sports-data comparison and controlled color, https://www.gridironviz.co/
- NFL Next Gen Trends football-first narrative, https://amp.nfl.com/news/go-beyond-the-box-score-with-next-gen-trends-powered-by-aws
- SportsDataverse/sdvplot sports-specific chart grammar, https://github.com/sportsdataverse/sportsdataverse-js
- UCSB sports-stats-explorer offline-safe dashboard patterns, https://github.com/data-science-ucsb/sports-stats-explorer

## Users and essential journeys
1. Casual: choose two teams, venue -> immediately see a single generated result and a clearly sourced empirical estimate when available -> press Replay or Another game.
2. Tournament: choose bracket format -> simulate tournament -> open any completed game for score and named-player box -> optionally view title probability estimate.
3. Curious analyst: open separate Model & Validation tab -> provenance, calibration errors, Brier, score interval coverage and data freshness, with plain-English definitions.

## Information architecture
Three equal navigation destinations: Game, Playoffs, Model & Validation. No editable sensitivity, betting lines, team-strength overrides or simulation seeds. Game exposes only two team selectors and home site selector, and its primary action Simulate a game. No backend or paid API required. Research data are optional immutable artifacts; missing artifacts have explicit unavailable state.

## Visual system
'PRESSBOX / NIGHT SHIFT' — black asphalt #080b0d, deep stadium green #111d1b, mineral white #efeee6, safety chartreuse #d6f065, faded khaki #a8b0a5; minimally used alert orange #ef8354. Sports-film editorial, architectural lines, typographic rhythm, pure CSS original field graphics and SVG plots. Headline typography uses open-source Barlow Condensed and body uses DM Sans with mono numerals via system fallback. No card soup, glassmorphism or neon gradients.

## Trust and modeling contract
- Empirical Elo winner p and independent score reference, when validated research snapshot is available, displayed as `Research estimate`. Its 2026 evaluation has been previously inspected, so don't call it an untouched holdout.
- Simulated score, player box and sampled probabilities are labeled `Hypothetical / uncalibrated`. Never present the mean simulated score as the empirically expected score.
- Derived athlete event-game figures are descriptive, conditional on stat being recorded; no verified availability/starting inference.
- Coach/roster status, CFP selections and market odds not verified: omit them.

## Engineering gates
- Existing Node and Python suites continue passing.
- Add new usability tests: exactly three nav tabs; only 3 editable game fields; data labels; no unsupported forecast when unavailable; player ID/name provenance; complementarity and spread sign; proper tournament advancement; instrumented click to replay, inspect, reset.
- Validate mobile viewport overflow, keyboard focus, reduced-motion CSS; Chromium DOM harness if full navigation is blocked.
- CSP stays restrictive, no secrets, size-bounded external JSON, no untrusted HTML. Avoid unsourced images.
- Publish via existing GitHub connector in an atomic commit; verify published source. CI/Pages must be separately observed before declaring deployed.

## Known blockers
No physical Safari, complete source data snapshots in local container, nor independently validated true usage/injury data. Official CFP field needs committee rankings; cannot synthesize official entrants.

## Score-scale audit discovery and controlled repair (added before engine adjustment)
The published, season-matched 2025 FBS team-results JSON was aggregated via the authorized GitHub connector: 136 programs, game-weighted 27.5107 points/team/game (55.0213 combined). The 2026 138-program snapshot through 2026-11-15 measured 27.916 points/team/game (55.8319 combined); this has been inspected previously and cannot be a true holdout. An initial 1,000-game synthetic test of the current default fixture generated only 40.397 total points/game. This is a material face-validity failure for a casual sports simulator.

Remediation: reduce average drive duration (thus increase possessions) by adjusting ONE documented pacing parameter, with 2025 55.02 aggregate points as the predeclared tuning target. Keep TD/FG/turnover and player-allocation rules unchanged to avoid hidden complexity. Measure the same deterministic fixture and multiple other fixtures; reject the change if accounting/regression tests break. Reevaluate 2026 aggregate only as descriptive secondary sanity check. This is aggregate moment alignment, NOT drive-transition, conditional team-score, injury, or named-prop calibration. Report sample counts, model versions and measured errors.

### Second moment: offensive snaps
Following the drive-duration adjustment, a 700-game seeded audit produced 26.35 possessions/game and 246.96 offensive plays/game. This is not plausible for contemporary FBS football. External 2025 collegiate-football pace reference (On3, 2026 feature) reports ~134.0 combined plays/game and 5.61 plays/possession: https://www.on3.com/news/the-latest-reason-why-passing-is-important-to-rushing-potency/ . We will alter ONLY the yardage-to-play-count heuristic, then require accounting checks and a deterministic regression guard for both total points and plays. This calibrates two unconditional first moments; it does not claim drive-, EPA-, conditional-passing- or player-prop calibration.
