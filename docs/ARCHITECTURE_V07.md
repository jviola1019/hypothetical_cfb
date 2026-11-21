# GRIDIRON LAB 0.7 — Engineering execution plan (written before edits)

Baseline: GitHub `main` `e5db810b85b852fcee176e72546bc130c2d37876`, source tree recovered from the previously verified v0.6 working files. Plan date: 2026-11-21. Release gates require actual evidence, not intent.

## Findings and precedence
1. The deployed game-generator's PPG input is a full-season/season-to-date retrospective proxy, **not** an evaluated pregame predictive model. Its Monte Carlo win frequencies and named player props must not be advertised as empirically calibrated.
2. Roster identity does not establish player participation or depth chart; first matching QB/RB/WR position is not a defensible prop target.
3. Prior baseline compares only with coin toss and raw Elo. To test meaningful improvement, add season-separated home-only, offense-defense and Elo comparisons; select tuning using older seasons rather than optimizing on the already-viewed 2026 holdout.
4. The 12- and 24-team CFP format requires qualification rules, explicit seed mapping, and hosted campus/neutral rounds. A generic seeded bracket is not automatic official CFP field selection.
5. Native worker/offline functionality must be verified in a real browser where possible; avoid claiming physical iPhone Safari from desktop emulation.

## Target architecture and evidence tiers

```
2023–2026 upstream schedules [public provenance, cutoff]
  -> strict canonical FBS identity / game result schemas
  -> chronological feature snapshots (pregame ONLY)
  -> model candidates [logistic Elo, home baseline, team-rate and margin baselines]
  -> fixed pre-2026 design choices + 2026 forward evaluation [previously viewed holdout]
  -> research.json with calibration, residual summaries, benchmarks, deterministic bootstrap

2025–2026 player game stat CSVs [licensed-access caveat]
  -> streaming parser with explicit column mapping and game/team/player joins
  -> snapshots with source, reliability flags, games played and missingness
  -> only supported stat distributions; roster-only names not called modeled starters

Game UI [A, B, home field only] -> research adapter + experimental drive generator
  -> hard separation between observed, evaluated baseline, simulated draws
  -> box-score reconciliation & visible assumptions
Playoff UI -> official-format rules-as-data and custom formats
  -> deterministic tournament state, venues, N-1 invariants
```

## Phase gates
**A. Freeze and audit**: inspect exact remote head, run source tests, inventory installed toolchain, verify official CFP documents and upstream player data shape and license. Document errors with reproducer.

**B. Math and rules**: fix score conservation/scoring classification/overtime, implement explicit official seeding/hosting metadata and preserve seeded reproducibility; write tests first where feasible.

**C. Data and predictions**: create game-log ingestion with cutoff, schema validation, player-game identity, missingness, and safe fallback. Extend baseline evaluation to older seasons and appropriate home/strength baselines; no tuning on already inspected 2026 results. Published player prop models require actual per-game stats and validation; otherwise render observed-only usage/coverage.

**D. UX**: retain existing dark broadcast visual identity; only game input controls remain Team A, Team B and venue; add transparent model/provenance, observed player table, uncertainty and degradation states. No deceptive player projections.

**E. Testing, security and release**: Node, Python, stat/metamorphic tests, actual browser Chromium/WebKit when supported, build and workflow validation, source/security matrix delta, provenance docs, ZIP, GitHub connector write with non-force ref and verify commit + CI.

## Explicit acceptance and nonclaims
- Correct end-of-drive clock and NCAA OT accounting; no thrown exceptions for valid games, no contradictory team/receiver stats; no score/source cross-class contamination.
- No unidentified real athlete assigned a made-up starting role as an unqualified prop projection. Historical player lines are not current-season active/depth-chart certification.
- All 2025/2026 FBS teams preserved; absent 2026 game stats result in `data unavailable`, not fabricated precision.
- 2026 forecast validity is exploratory: that holdout was previously inspected. New model choices use 2023/24/25 development partitions, and any 2026 re-evaluation is marked *previously inspected forward test*.
- Tests are reported as executed only if actually run. GitHub Actions successful publication is not assumed.
