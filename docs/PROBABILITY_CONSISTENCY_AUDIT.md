# Probability and visualization consistency — v1.4 audit

**Scope:** Game Simulation winner estimates, fictional Monte Carlo game frequencies, spread covers, point totals, histogram line markers and player-prop displays. Baseline repository SHA `8cf6a446ffdfeacca95b7debd8a6c05657b3383e` (2026-11-21). The plan was written before modifying code in `docs/ARCHITECTURE_PROBABILITY_AUDIT.md`.

## Reproduced defects

### Missing exact Monte Carlo accounting
Previously, `src/engine.js` generated win fractions and histograms but never reported explicit win, spread-cover, total over/under, or push counts. The interface could not answer “out of 850 trials, how many wins and covers?” Existing tests verified only that win probabilities sum to 1. It was also possible to supply a mixed-matchup input array to `outcomeSummary` and obtain a misleading summary.

**Change:** Every result now calls the same pure ledger, `src/marketAudit.js`, on the exact game array that produces its histograms and prop distributions. It rejects malformed scores, invalid line inputs, or mismatched game configurations. All six event groups and a 2×3 win-versus-cover table reconcile exactly to N.

### Contradictory empirical probability / spread direction
The previously displayed Elo winner probability and score-center spread were trained independently. A full pairwise sweep of the repository's 2026 research snapshot (138 teams; 28,359 unordered pairs × three venues) found **2,301 / 28,359 = 8.11%** configurations where an Elo win probability above 55% corresponded to a score-center margin below −0.5 point, or vice versa. Illustrative examples included Oregon State versus Stanford and Old Dominion versus Oregon State. This is not proof one estimate was numerically wrong; it is proof they were misleadingly packaged as one coherent forecast.

**Change:** The game UI now displays an Elo win probability from the previously evaluated research model, plus an explicitly **illustrative spread translation** from the same probability using the width of the 2024 score-residual 80% interval. This spread is directionally coherent by construction, but is **not statistically trained or validated as an actual handicap**. The independent score-model total remains separate; the illustrative score center uses that total and the translated margin. If the historical residual artifact fails validation, spread and score center are withheld instead of fabricated. The independent scoring center's research limitations remain documented in `docs/MODEL_CARD.md`.

## Exact accounting and mathematical definitions

For a sample of N simulated games, use `margin = pointsA − pointsB` and `total = pointsA + pointsB`. Team A wins if `margin > 0`. A team A spread is a signed number from A's perspective. A covers when `margin + spreadA > 0`, B covers when `< 0`, and the spread pushes at equality. The total is over, under, or push according to whether `total` exceeds, falls below, or equals the total reference.

The read-only generated half-point line is `spreadA = −floor(mean margin) − 0.5` and `totalLine = floor(mean total) + 0.5`. Thus integer scores cannot push at those reference lines; the ledger still supports explicit integer thresholds and pushes in tests. These are **in-sample description lines**, not sportsbook quotes, prices, independently estimated probabilities, or validated forecast lines. This means a plus or minus half-point line can make covering equivalent to winning; that is explained rather than hidden.

The win-rate sampling error displayed on the page is `sqrt(p(1−p)/N)` for the *generated simulation distribution*. It measures finite Monte Carlo sampling noise, **not prediction error, generalization, calibration or accuracy against future game outcomes**. Generated scores, roster-linked player scenarios and tournament Monte Carlo probabilities remain synthetic.

## Elo-implied illustrative spread

Let `p` be the externally evaluated Elo winner-probability estimate and `[q10,q90]` the **2024-fitted** historical margin-residual 80% interval. Approximate a logistic score-margin scale by `scale = (q90−q10)/(2 log 9)`, then set `marginIllustrative = scale × log(p/(1−p))` and `spreadA = −marginIllustrative`. The formula ensures that `p > 0.5` implies a negative team A spread, and vice versa. It is a heuristic linkage of two separately evaluated research artifacts. **It has not been fitted or backtested as a joint margin/win-probability model and must not be advertised as calibrated or market-ready**.

## Verification gates and test evidence

- `tests/market_ledger.test.js`: fabricated deterministic fixtures, exact counts, push conditions, 850-game conservation, malformed data, team/venue mismatch, sign/monotonicity.
- `tests/market_ledger_browser.py`: 320/390/768/1370px Chromium DOM checks, winner/cover/over reconciliation against UI tables, redraw after replay, score/model visual presence, no horizontal overflow. This is a DOM injection harness, not native module loading, real iPhone Safari, or a physical-device test.
- `npm run check`, `npm test`, `npm run build`: syntax, regression and package.
- GitHub Actions checks are required after publication; source upload alone does not mean CI/Pages success.

## Remaining independent risks

1. The drive generator is not fitted to an observed possession distribution, so it can disagree materially with the Elo predictor. The site labels and separates these outputs.
2. The newly displayed illustrative Elo-implied spread is sign-consistent, **not cross-validated**. Do not use it as a sportsbook trading handicap.
3. Player-prop simulations are fictional, not conditional full-participation models. Missing recorded events and unknown availability still limit all 138 schools.
4. The game generator is not a calibrated *joint* score/drive/athlete simulator; interval validation in the research tab applies to a separate score-residual model.
5. GitHub Pages and real native iOS Safari require separate release evidence.
