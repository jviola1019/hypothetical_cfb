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

## Verified upstream execution on GitHub Actions, 2026-11-21

- [Data refresh run 44882376273](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44882376273) succeeded. Data-output commit `3ce1cf8ae9f23eb9147e5b908d80abc78bb17444` published the new JSON snapshots.
- Model sample sizes: **2023 792**, **2024 798**, **2025 808**, **2026 629** completed FBS vs FBS matchups. 2025 selected `logisticPair` with Brier **0.191407**; 2026 previously inspected forward score **0.203625** versus home-only **0.239703**, fitted Elo **0.205865** and coin **0.25**. 2026 log loss **0.594256**, margin MAE **14.5939**, total MAE **13.1911**. Reliability band 0.50–0.60 averaged predicted **0.55172**, observed **0.443396** in 106 games: model is **not proven calibrated**.
- 2026 play-level source processed **193,254 source rows**, matched **752 games**, created **1,627 derived athlete summaries across 138 FBS school files**. 2025 processed **213,202 rows**, matched **931 games**, created **1,617 derived athlete summaries across 136 school files**. These small derived summaries are **not raw game logs or model-validated props**.
- New source data in remote GitHub are not included in the local offline source ZIP; download full `main` archive for the complete refreshed datasets.

## Remaining external verification
- Real Web Worker (native browser imports), native iPhone Safari/WebKit and physical device memory tests remain blocked by this environment.
- Formal 92-case adversarial test matrix complete execution and historical data redistribution licensing clearance are not complete.

## Not implemented / experimental

- A trained joint player/team generative probability model with withheld-game player-prop calibration. Retrospective stat-event games do not prove snaps, availability or injuries.
- Observed possession-level state transitions, defensive return scoring, official pregame CFP field and full geographical schedule, live feeds, betting market comparisons.
- A genuinely untouched 2026 holdout (2026 outcomes were previously reviewed). Future 2027 data are required for a fresh untouched evaluation.

## Evidence

See `docs/VALIDATION.md`, `docs/AUDIT_REPORT.md`, `docs/ARCHITECTURE_V07.md`, `docs/DATA_PROVENANCE.md` and `docs/MODEL_CARD.md`. Each GitHub Actions success and actual refreshed artifact must be inspected before upgrading a pending item to verified.
