# GRIDIRON LAB v0.6.0 — implementation and audit status (2026-11-21)

## Implemented and locally tested

- Existing dark Night Edition retained. Exactly two primary tabs; Game input is **two teams and venue** only. Additional high-contrast observed-vs-experimental research desk panel shows only when the validated JSON research artifact loads; unavailable state explicitly says data is missing.
- Separate experimental pregame Elo baseline pipeline in standard-library Python (`scripts/evaluate_rolling_model.py`), trained chronologically on 2025 data and designed for 2026 holdout; results are schema-validated at UI boundary.
- Football fixes: correct second-OT mandatory 2PT, overtime score/possession/play reconciliation, scoring-quarter allocation at drive completion, symmetric artificial 40-OT failsafe. Input-size limits for prop distributions.
- Import hardening: unknown FBS program IDs, incomplete W–L accounting, forged roster teams rejected. In-memory snapshots are not overwritten after validation failures.
- FBS official format stage-name corrections; FCS-inspired bracket explicitly mixed and hypothetical.
- Node **31/31** tests, Python **11/11** tests, syntax/build, benchmark and Chromium DOM harness at 390px/1370px (see `docs/AUDIT_REPORT.md`). Browser figures use clearly synthetic test fixtures.

## Empirical baseline now executed

- The first full-source data workflow succeeded (run 44879469184), and the resulting research-2026.json was independently inspected in GitHub. Measured 2025 training games: 808; 2026 held-out games: 629. See the metrics section below.
- A follow-up GitHub-connected commit triggers the static Pages build to include the research artifact, as automated workflow-token commits do not themselves trigger standard push workflows.

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

## Full-source chronological benchmark — executed November 21, 2026

- GitHub Actions refresh run 44879469184: success. Generated public/data/research-2026.json (inspected in GitHub).
- Training: 808 completed FBS-vs-FBS games in 2025; chronological holdout: 629 games in 2026, through November 15, 2026. Model: chronological-elo-slope-0.1.0.
- Brier: fitted Elo 0.210914; raw Elo 0.217346; constant 50/50 baseline 0.250000. Log loss: fitted Elo 0.610867; 50/50 baseline 0.693147.
- Mean absolute error: point margin 14.5939; game total 13.1911. RMSE: margin 18.6669; game total 16.3861.
- Home teams won 0.60095 of the holdout; constant 50/50 is a weak baseline. An alternative home-rate baseline must be fitted from training data, not the holdout.
- Exploratory 1500-resample week-cluster bootstrap: Brier difference (fitted Elo minus 50/50) 95% range [-0.057239, -0.023354] from 11 weeks. Sparse clusters and dependent outcomes limit inference.
- Calibration remains imperfect: in the 0.50–0.60 predicted bin, mean predicted 0.55355 vs observed frequency 0.44737 (n=114). Do not label the model perfectly calibrated.
- Neither historical winner accuracy nor scoring-error measurements establish player-prop validity, sportsbook edge, injury/roster usage accuracy or simulation realism.
