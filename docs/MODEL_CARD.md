# Model card — GRIDIRON LAB v0.6

## Two deliberately separate engines

**Research baseline (experimental, source-backed only after pipeline succeeds).** Python `scripts/evaluate_rolling_model.py` uses only completed games with valid scores, season and kickoff timestamps, FBS/FBS matching, and 2025-to-2026 time separation. It trains one regularized Elo-logit slope using **2025** chronologically constructed pregame features. On **2026** it scores predictions before updating either team's rating, and produces Brier, log loss, scoring-error and calibration tables. Initial rating 1500, year retention .65, K=24, home effect 55 Elo, logistic scale 400; no model weights tuned on the 2026 holdout. Approximate scored-point estimates use smoothed team 2026 games observed before the game and a fixed 2.4-point home margin. This is a deliberately simple opponent-aware baseline because opponents enter Elo; point means are not fully opponent-adjusted.

**Synthetic drive simulator (still not fitted).** JS `src/engine.js` uses fixed illustrative scoring/turnover probabilities and retrospective offensive/defensive multipliers from current season aggregates. It is deterministic under seed and audited for point/drive/player bookkeeping and 2026-style OT handling, but a validated model win frequency does **not** follow from successful accounting tests. The model is a game-design demonstrator. No run should be used as a betting or fantasy projection.

## Training, validation and leakage

Train 2025 completed FBS/FBS games, hold out 2026 completed FBS/FBS games through a recorded cutoff. Rates/rating state for each historical fixture are computed from earlier played games only. 2025 end-of-season ratings are known before August 2026; 2026 scores affect **later**, never earlier, predictions. The GUI uses the latest 2026 team rating state for hypothetical future games; it does not recreate pregame predictions for already-played dates. All metrics must be obtained from the committed `public/data/research-2026.json` with model version and source cutoff; if missing the UI refuses to show empirical scores. The app never silently substitutes demo fixture scores.

## Coverage and eligibility

Catalog: 138 FBS programs in 2026 and 136 in 2025, based on the inspected SportsDataverse schedule. Results feed lag is shown in UI. Public rosters contain names/position only; role allocation is not confirmed. Player prop thresholds remain synthetic regardless of whether a full name is printed. FCS 24-option is not an official selection field.

## Risk: calibration and generalization

2026 evaluation is chronologically separated from 2025 fit, but one year's holdout and shared opponents limit confidence. The fixed Elo hyperparameters are documented engineering choices, not a proof of optimality. Confidence intervals for calibration use Wilson uncertainty; an exploratory weekly cluster bootstrap measures paired Brier improvement. The first full-source Actions run succeeded; the measured values appear below. This does not establish uniform probability calibration, future-season validity, or real-money edge.

## Full-source chronological benchmark — executed November 21, 2026

- GitHub Actions refresh run 44879469184: success. Generated public/data/research-2026.json (inspected in GitHub).
- Training: 808 completed FBS-vs-FBS games in 2025; chronological holdout: 629 games in 2026, through November 15, 2026. Model: chronological-elo-slope-0.1.0.
- Brier: fitted Elo 0.210914; raw Elo 0.217346; constant 50/50 baseline 0.250000. Log loss: fitted Elo 0.610867; 50/50 baseline 0.693147.
- Mean absolute error: point margin 14.5939; game total 13.1911. RMSE: margin 18.6669; game total 16.3861.
- Home teams won 0.60095 of the holdout; constant 50/50 is a weak baseline. An alternative home-rate baseline must be fitted from training data, not the holdout.
- Exploratory 1500-resample week-cluster bootstrap: Brier difference (fitted Elo minus 50/50) 95% range [-0.057239, -0.023354] from 11 weeks. Sparse clusters and dependent outcomes limit inference.
- Calibration remains imperfect: in the 0.50–0.60 predicted bin, mean predicted 0.55355 vs observed frequency 0.44737 (n=114). Do not label the model perfectly calibrated.
- Neither historical winner accuracy nor scoring-error measurements establish player-prop validity, sportsbook edge, injury/roster usage accuracy or simulation realism.
