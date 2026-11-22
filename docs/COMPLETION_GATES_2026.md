# Gridiron Lab · Temporal simulator and nationwide starters completion gates

Date: 2026-11-22. Repository enhancement target: 2026 FBS season, 138 programs.

## What is newly measurable

- The *actual canonical JavaScript drive simulator* can now be exercised on time-safe historical games: 2023 warms up season state, **2024 fits one scoring denominator**, **2025 gates activation**, and **2026 is a previously-inspected forward diagnostic**. No current-season full-year team rate or later result is used for a historical kickoff.
- 2024 fit ranks a small preregistered set of denominator parameters by team-score center MAE. The fixed 2025 rule requires improved score MAE over a flat 27-point baseline and winner Brier <=0.25; **2026 is not used to enable the replay mode**.
- Runtime reads the same source-backed conditioning artifact on main thread and Web Worker. The engine still builds real simulated drives, play totals, player aggregates and overtime, with conservation checks rather than replacing the final score after the fact.
- Evaluation exposes score MAE, total/margin MAE, winner Brier/log loss, simulated 80%-interval coverage, unsupported-team count and actual replay count. These are model diagnostics, not proof of game-day starter or individual prop accuracy.

## Why the remaining claims cannot be certified from these data

- Snapshot identity is 138/138, 15,187 **roster listed** names. Weekly assignment audit checks 828 role slots, largely based on usage/roster fallback, **not 828 confirmed starters**.
- Third-party projected charts may say 'starter' without official game-day confirmation. Do not imply official verification. Who's Starting terms forbid wholesale scraping; TWO·DEEP terms prohibit wholesale scraping/republishing without permission. Link brief attributed evidence or obtain license; do not automate bulk ingestion from either service without permission.
- Previously examined 2026 outcomes are not a virgin unseen holdout. The historical model is point- and game-level; neither authentic play-by-play down-distance physics nor unconditional athlete injury, snap, target and carry models have been fitted. A favorable Brier score is not a license for player betting projections.

## Next acceptance conditions

1. Report independent game results on an **entirely new uninspected future season or weeks** with parameters frozen before kickoff; require Brier, log loss, score CRPS, interval coverage, segmented error and uncertainty.
2. Obtain permitted official or licensed **per-game depth charts, availability and starter verification for all 138 schools**, including observed timestamp and independent evidence URL; reject missing/suspicious/unrostered names. Until then the UI must distinguish sourced, projected and roster-only identities and never claim all positions are confirmed.
3. Expand to audited FBS actual possession/play-by-play data and team-conditioned player opportunities; derive player appearance denominators and injury/transfer handling before promoting props as empirically calibrated.
4. Run Chromium and Linux WebKit against actual HTTP-loaded ES modules and real Workers; keep screenshots. WebKit simulation is not physical iPhone Safari certification.

## Sources
- SportsDataverse CFB data: https://github.com/sportsdataverse/cfbfastR-data
- Who's Starting usage terms: https://whosstarting.com/terms/
- TWO·DEEP usage terms: https://www.thetwodeep.com/terms
