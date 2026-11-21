# Model card — GRIDIRON LAB v0.6

## Two deliberately separate engines

**Research baseline (experimental, source-backed only after pipeline succeeds).** Python `scripts/evaluate_rolling_model.py` uses only completed games with valid scores, season and kickoff timestamps, FBS/FBS matching, and 2025-to-2026 time separation. It trains one regularized Elo-logit slope using **2025** chronologically constructed pregame features. On **2026** it scores predictions before updating either team's rating, and produces Brier, log loss, scoring-error and calibration tables. Initial rating 1500, year retention .65, K=24, home effect 55 Elo, logistic scale 400; no model weights tuned on the 2026 holdout. Approximate scored-point estimates use smoothed team 2026 games observed before the game and a fixed 2.4-point home margin. This is a deliberately simple opponent-aware baseline because opponents enter Elo; point means are not fully opponent-adjusted.

**Synthetic drive simulator (still not fitted).** JS `src/engine.js` uses fixed illustrative scoring/turnover probabilities and retrospective offensive/defensive multipliers from current season aggregates. It is deterministic under seed and audited for point/drive/player bookkeeping and 2026-style OT handling, but a validated model win frequency does **not** follow from successful accounting tests. The model is a game-design demonstrator. No run should be used as a betting or fantasy projection.

## Training, validation and leakage

Train 2025 completed FBS/FBS games, hold out 2026 completed FBS/FBS games through a recorded cutoff. Rates/rating state for each historical fixture are computed from earlier played games only. 2025 end-of-season ratings are known before August 2026; 2026 scores affect **later**, never earlier, predictions. The GUI uses the latest 2026 team rating state for hypothetical future games; it does not recreate pregame predictions for already-played dates. All metrics must be obtained from the committed `public/data/research-2026.json` with model version and source cutoff; if missing the UI refuses to show empirical scores. The app never silently substitutes demo fixture scores.

## Coverage and eligibility

Catalog: 138 FBS programs in 2026 and 136 in 2025, based on the inspected SportsDataverse schedule. Results feed lag is shown in UI. Public rosters contain names/position only; role allocation is not confirmed. Player prop thresholds remain synthetic regardless of whether a full name is printed. FCS 24-option is not an official selection field.

## Risk: calibration and generalization

2026 evaluation is chronologically separated from 2025 fit, but one year's holdout and shared opponents limit confidence. The fixed Elo hyperparameters are documented engineering choices, not a proof of optimality. Confidence intervals for calibration use Wilson uncertainty; an exploratory weekly cluster bootstrap measures paired Brier improvement. Before first full-source Actions run, quantitative performance is **unverified**. After that, historical metrics do not authorize real-money recommendations.
