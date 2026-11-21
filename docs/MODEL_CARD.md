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

## v0.7 — Multi-year comparator and player study

The comparative benchmark uses 2023 as an Elo warm-up, 2024 to fit regularized Elo/scoring-margin/logistic parameters, and 2025 to select among six named baselines by Brier score. Selected coefficients and model choice are *frozen* before the 2026 forward pass. **2026 cannot be called untouched**, because the project's prior iterations examined its results. Baselines: 50/50, fitted home-only, fitted Elo, fitted team-rate margin, 50/50 fixed blend, L2 two-feature logistic. Reports are separated by season, with Brier, log loss, point-error diagnostics, fixed reliability bins with Wilson uncertainty and exploratory weekly block-bootstrap differences. No certainty claim is made by an interval omitting zero because repeated opponents and schedule dynamics violate independent samples.

A 2026 player-event-derived descriptive summary is **not** a predictive model. In particular, conditional frequency among games with a recorded rushing/passing/receiving event is upward-selection-biased relative to all player appearances. The app must not multiply these derived shares with game win probabilities or call them sportsbook-calibrated prices. The joint game+player forecasting system is pending independent training and chronological validation.

### Actual multi-year run, 2026-11-21

2023 warm-up: n=792; 2024 fitted: n=798; 2025 validation: n=808; 2026 forward checked: n=629. Selected on 2025: two-feature ridge logistic `logisticPair` (2025 Brier 0.191407, 2026 Brier 0.203625; 2026 log loss 0.594256). Comparison Brier on 2026: fitted Elo 0.205865, 50/50 Elo–margin blend 0.203887, raw scoring-rate model 0.211492, home-only 0.239703, and 50/50 coin 0.250000. Week-level bootstrap improvement against home-only: +0.036078, exploratory 95% percentile range +0.025500 to +0.047130. This does not establish significance under recurring teams or true probability calibration. The 0.5–0.6 predicted bin (n=106, mean 55.172%) observed only 44.3396% home wins. **This model does not predict actual player props and does not calibrate the independent synthetic game simulator.**

## v0.8 — observed conditional player-frequency and score-residual research

**Model 1 (player):** beta-binomial posterior for a predefined stat threshold, using position-specific statistic-event cohorts fitted on 2025 recorded events and six pseudo-observations. 2026 evaluation is chronological *within the list of recorded events*. Player event records before an event are used; no later events enter that prediction. Frozen 2025 cohort-prior baseline Brier/log loss is the comparison. It measures an event-conditioned observed-population question, not whether a player plays, catches passes, starts or reaches a betting line in the next game. The three-game-history minimum and 30-event cohort minimum control exposed estimates; credible interval is a normal posterior approximation clipped to [0,1]. A complete future prop model would additionally need appearances, opportunity shares, injuries, snap counts and team/possession-dependent allocations.

**Model 2 (full game score residual):** 2024 FBS/FBS chronological pregame point residuals form separate empirical margin/total distributions. Fixed empirical quantile offsets (10/90, 5/95), MAE, CRPS and winner-probability Brier are evaluated on 2025 and 2026. The location forecasts are produced before each game; residual offsets and 2024 home-prior winner baseline are never updated using later outcomes. Margin and total are evaluated separately: this is not a physically constrained bivariate scoring or observed-drive model. 2025 and 2026 have both been inspected in prior project versions. Full-source numeric performance is pending a successful remote refresh.

**Independent simulation auditor:** `src/gameAudit.js` verifies drive score timeline, legitimate scoring outcomes, field position, 3600-second regulation clock, overtime, player-vs-team pass/rush/TD/turnover totals and possession counts. Passing tests prove accounting integrity, not real-world statistical calibration.

**Playoff rules:** `src/cfpSelection.js` constructs a *hypothetical* participant field only when the caller provides rankings and conference champions; it does not claim to reproduce the actual future CFP committee selections or official live rankings.

All source artifacts must preserve: version, classification, cutoff, fit/evaluation seasons, baseline and limitations. When missing, the GUI omits empirical audits rather than substituting simulated ones.
