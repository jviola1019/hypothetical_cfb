# GRIDIRON LAB — prioritized release audit and follow-up plan
Date: 2026-11-22. Audited main baseline: `91ce479fdea49a4b1269cde4f299384ae4e919ad`.

## Reproduced issues and applied repairs

| Priority | Issue | Repair |
|---|---|---|
| P1 | Monte Carlo and market ledgers allowed mixed seasons/pace/strength settings in one probability sample. | Full simulation-scenario invariant and four negative regression fixtures. |
| P1 | Sourced weekly roles and availability were treated as existing on days before publication; impossible calendar dates could normalize through Date.parse. | Strict calendar validation, observed-time gating and temporal tests. |
| P1 | Manifest 1.1 and November 15 cutoffs differed from the checked-in 1.2 package and November 21 datasets; refresh workflow omitted manifest. | Deterministic synchronizer, new CI --check gate and refresh integration. |
| P2 | Dark legacy foreground tokens leaked into the new light broadcast design. | Contrast-compatible token correction and original navy/blue/gold championship menu-and-scoreboard layer. |
| P2 | Drive validator did not require the actual opposing participant as defender. | Exact opponent invariant. |

## Evidence and limitations at baseline

- 2026 FBS roster archive: **138 school rosters / 15,187 listed athletes**. Roster presence does **not** confirm starter, game-day availability, injury or snap share. Weekly six-role assignments are mostly usage-projected or roster-only.
- Source season snapshot: **781 scored games through 2026-11-21T19:00:00Z**; independent Elo research snapshot last scored game **2026-11-21T18:00:00Z**. Different datasets can have different cutoffs.
- Historical score-residual evaluation (2026, n=655): 80% margin coverage **0.79542** and total coverage **0.79847**, winner Brier **0.2175815** against home prior **0.2398709**. This is not validation of generated drives.
- Retrospective recorded-stat conditional player evaluation (n=7,674): Brier **0.1665306** vs cohort baseline **0.1869485**. This is not unconditional player-prop accuracy or playing-time estimation.
- Elo research trained on 2025 and evaluated chronologically on 2026. **2026 has already been inspected** in development, so it is not a pristine independent holdout. Retrospective team profile snapshots are not pregame-safe for replaying past matchups.

## Prioritized remaining risks — not claimed fixed

1. **P0 — calibrate the actual synthetic game generator and named-player opportunities** using timestamped pregame opponent and lineup features, real score/drive/participation outcomes and sealed later-period testing. Report Brier/log loss, CRPS, interval coverage, MAE, multi-season drift, stratified slices and uncertainty. Exact synthetic counts do not establish real win/cover odds.
2. **P0 — verify starters for all 138 FBS schools** using independently dated official depth charts, school injury reports, suspensions and game-day availability, with provenance and per-role uncertainty. This data does not exist in the current free nationwide roster feed.
3. **P1 — validate football physics and substitutions** using historical play-by-play for clock, downs, drive possessions, penalty effects, overtime, field position, special teams and active player usage. Current game engine is a deliberately simple toy generator.
4. **P1 — secure truly new holdout data**: freeze features/model choices ahead of as-yet-unseen future weeks and seasons. Never optimize repeatedly on the same 2026 evaluation period while calling it independent.
5. **P1 — real device validation**: native iOS Safari and hosted GitHub Pages real module/Web Worker boot, screenshots, keyboard focus, offline failure, screen reader and layout tests. Existing source-injected Chromium scripts do not prove this.
6. **P2 — security/performance**: pin Actions dependency SHAs, review third-party feeds and licensing, payload caps, 138-team mobile load, independent pen-test, robust fallbacks.

## Repeatable release verification

`npm ci --ignore-scripts && npm run check && npm test`

`python3 -m unittest discover -s tests -p 'test_*.py'`

`python3 scripts/sync_data_manifest.py --check`

`python3 scripts/audit_all_fbs_roles.py --roster public/data/rosters-2026.json --weekly public/data/weekly-lineups-2026.json --players public/data/players-2026 --out /tmp/personnel-audit-2026.json --strict`

`npm run build`

Review Verify and Pages workflows on the **new commit** before claiming deployment. Do not infer native Safari, official full roster/depth-chart veracity, or empirical game-generator calibration from CI.
