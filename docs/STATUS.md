# GRIDIRON LAB v0.6.0 — implementation and audit status (2026-11-21)

## Implemented and locally tested

- Existing dark Night Edition retained. Exactly two primary tabs; Game input is **two teams and venue** only. Additional high-contrast observed-vs-experimental research desk panel shows only when the validated JSON research artifact loads; unavailable state explicitly says data is missing.
- Separate experimental pregame Elo baseline pipeline in standard-library Python (`scripts/evaluate_rolling_model.py`), trained chronologically on 2025 data and designed for 2026 holdout; results are schema-validated at UI boundary.
- Football fixes: correct second-OT mandatory 2PT, overtime score/possession/play reconciliation, scoring-quarter allocation at drive completion, symmetric artificial 40-OT failsafe. Input-size limits for prop distributions.
- Import hardening: unknown FBS program IDs, incomplete W–L accounting, forged roster teams rejected. In-memory snapshots are not overwritten after validation failures.
- FBS official format stage-name corrections; FCS-inspired bracket explicitly mixed and hypothetical.
- Node **31/31** tests, Python **11/11** tests, syntax/build, benchmark and Chromium DOM harness at 390px/1370px (see `docs/AUDIT_REPORT.md`). Browser figures use clearly synthetic test fixtures.

## Implemented but not independently verified on full upstream data (until Actions completes)

- Updated scheduled/manual data refresh workflow obtains public 2025/2026 score CSVs, executes a 2025-trained→2026-heldout historical evaluation and (after passed checks) writes `public/data/research-2026.json` for all supported programs.
- **No empirical holdout scores are to be claimed unless the workflow actually ran and its resulting artifact was inspected.** The research panel remains in unavailable state until the data is genuinely published.

## Existing source coverage preserved

- 2026: 138 FBS programs and 15,187 roster-listed athletes; 2025: 136 FBS programs and 15,415 roster-listed athletes were established by a previous GitHub refresh. Roster lists do not validate depth charts, injuries, starter status or individual usage.
- Actual 2026 schedule source previously lagged to 2026-11-15. Any new refresh must show an explicit latest game cutoff; no assertion of live data.

## Experimental / not calibrated

- JavaScript score/drive/player-stat simulator and named player-prop sheets. Actual observations, Elo research predictions, and generator frequencies are not interchangeable. No individual player model was fitted.
- College OT tail cap, full playoff selection logic and FCS entrants incomplete.

## Blocked / not tested

- Browser sandbox blocks native localhost URL navigation, so real Web Workers, native ES imports, installed-hosted Pages runtime and physical iPhone Safari not tested from this environment. Chromium inlined DOM harness passed only; not a substitute for native runtime.
- Licensed comprehensive historical player-game training data, injury/availability feeds, validated player projections and 92 adversarial exploit cases.

See `docs/ARCHITECTURE_PLAN.md`, `docs/AUDIT_REPORT.md`, `docs/MODEL_CARD.md` and `docs/VALIDATION.md` for explicit evidence and remaining work.
