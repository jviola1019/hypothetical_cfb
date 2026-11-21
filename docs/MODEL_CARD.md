# Model card: GRIDIRON LAB synthetic reference v0.4.0

**Type:** seeded, rules-driven drive-level score and coarse player stat generator. **Fitting:** none. **Calibration:** none. **Historical context:** observed completed 2025 school season summary statistics for Ole Miss, Georgia, Alabama and Indiana; other team strength values are deterministic synthetic proxies.

## Method

For the four audited 2025 teams, `teamProfile(id,2025)` maps the observed 2025 full-season mean points scored and points allowed into arbitrarily bounded attack/defense multipliers. For the other supported teams, reproducible hashed pseudo-random ratings are used. These weights are **not statistically fitted**, cannot be interpreted as Elo or adjusted efficiency, and the 2025 summary is not available before each 2025 game. Any purported historical backtest using this profile as pregame input would incur **target leakage**.

Seeded simulation draws alternating approximate 4-quarter drives with assigned scores and aggregate plays/pass/rush totals. A limited NCAA-style overtime procedure resolves ties. The score distribution is calculated from 650–1,200 generated games (worker vs fallback); displayed estimated mean score, win frequency, total and margin are **descriptive sample statistics of the generator**, not calibrated real-game win probabilities. For sample win share \(\hat p\), MC sampling SE is \(\sqrt{\hat p(1-\hat p)/N}\). This does not quantify real-world model misspecification.

## Players

Player roles are QB/RB/WR1/WR2/TE/K with opportunity allocation constrained by simulated team play totals. Only verified 2025 names from school records are attached; all yardage and playing-time outcomes are synthetic. Stat lines for those athlete names are **not predictions of those people**. The player prop sheet calculates fixed illustrative thresholds with frequencies measured across the same game simulations. If a role/season/team lacks a verified name, it is omitted rather than invented.

The source for historical name and season performance is in `src/observed.js`, with the school-specific 2025 official athletics season stats URL. These complete-season totals are shown as descriptive context only. In particular, the generated prop distribution is not centered or calibrated on the individual's verified per-game season average.

## Constraints and invariants

Team points equal credited scoring, passing yards equal QB and receiver allocated yards, team rushing yards equal QB/RB allocated yards, player catches ≤ targets; single-elimination tournaments have one winner and exactly N−1 played games. Internal source tests and fixtures are in `tests`.

## Historical validation

Training seasons: **0**. Chronological holdout games: **0**. Brier/log loss/margin MAE/total RMSE/CRPS: **not calculated**. Market comparison: **not calculated**. Roster importer full-source test: **not run**. The model is not supported for betting, commercial predictions, prospect decisions, sensitive athlete profiling, or ranking real teams.

## Known defects / omissions

Season-end data leakage if misinterpreted as predictive, imperfect football drives and overtimes, omitted special-teams/defensive detail, arbitrary game-to-game variance, no individual usage fitting, unverifiable cross-era strength, no calibrated injury/weather/venue effects, and possible changes in upstream historical source revisions. These are research limitations, not presentation bugs.
