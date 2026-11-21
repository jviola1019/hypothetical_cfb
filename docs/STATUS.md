# GRIDIRON LAB v0.7 — execution status (2026-11-21)

**Classification:** offline-first research demonstration. None of the game-generator or named-athlete frequencies have been calibrated for actual future games.

## Implemented and tested locally

- Two-tab dark research interface; only Team A, Team B and home field are editable in Game Simulation.
- 2026 138-program and 2025 136-program catalog retained from earlier verified snapshot. These do **not** guarantee every historical athlete is active today.
- Coarse field-position continuity across drives, fumble/INT differentiation, previously corrected NCAA overtime and scoring-quarter accounting; seeded game and 13-format tournament simulations.
- Versioned CFP 2026–27 12-team and 2027–28 24-team rule metadata, site categories, seeded bye and round geometry. **Not** automatic official CFP selection, full stadium mapping, or actual committee rankings. FCS 24-team option remains mixed-field hypothetical.
- Streaming player-event importer with source game/athlete/roster join, event deduplication and cutoff checks, **PRIVATE raw intermediate records discarded after generating small derived player summaries**. Per-team public summaries are capped at 12 sourced names, subject to >=3 observed statistic-event games; no raw per-player/game logs redistributed. Source-data rights remain an issue for historical roster snapshots.
- 2023 rating warmup, 2024 regularized model fitting, 2025 model selection, 2026 forward comparison (2026 examined in previous versions). Six baselines, Brier/log loss/margin and total errors, reliability bins with Wilson intervals, exploratory week-block bootstrap. No hindsight tuning on 2026 in the new selection.
- Browser view shows retrospective derived player sample counts, mean and P10–P90 beside separate synthetic player forecasts. Unavailable data shown as unavailable.
- Source-package JS and Python unit tests, type/syntax checks, build, 390px and 1370px inlined Chromium DOM smoke tests.

## Pending external verification

- Full 2023/2024/2025/2026 source benchmark and 2025/2026 play-level player data refresh on GitHub Actions; until the run finishes, any model-comparison table or recorded-player panel may be unavailable. **Do not claim that local fixtures prove full upstream data coverage.**
- Real Web Worker (native browser imports), native iPhone Safari/WebKit and physical device memory tests remain blocked by this environment.
- Formal 92-case adversarial test matrix complete execution and historical data redistribution licensing clearance are not complete.

## Not implemented / experimental

- A trained joint player/team generative probability model with withheld-game player-prop calibration. Retrospective stat-event games do not prove snaps, availability or injuries.
- Observed possession-level state transitions, defensive return scoring, official pregame CFP field and full geographical schedule, live feeds, betting market comparisons.
- A genuinely untouched 2026 holdout (2026 outcomes were previously reviewed). Future 2027 data are required for a fresh untouched evaluation.

## Evidence

See `docs/VALIDATION.md`, `docs/AUDIT_REPORT.md`, `docs/ARCHITECTURE_V07.md`, `docs/DATA_PROVENANCE.md` and `docs/MODEL_CARD.md`. Each GitHub Actions success and actual refreshed artifact must be inspected before upgrading a pending item to verified.
