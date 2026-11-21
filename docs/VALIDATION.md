# Validation record — November 21, 2026 / v0.4.0

## Executed in the local environment

- `npm run check`: **PASS** for `src/observed.js`, `app.js`, `engine.js`, `tournament.js`, `worker.js`, `charts.js`.
- `npm test`: **16/16 PASS**, zero failures. Includes RNG, malformed inputs, reproduction, 300 simulation/game property fixtures, player catch/yard reconciliation, complementary probability, win-frequency sampling error, 13 tournament formats and N−1 games, bye assignment, historic-name coverage restrictions and prop-empirical frequency equality.
- `python3 -m unittest discover -s tests -p 'test_*.py'`: **2/2 PASS** on small fabricated CSV fixtures. It tests the ingestion code, **not the authentic upstream 72k-row roster dataset**.
- `npm run build`: independently run for release artifacts. See command logs captured during this turn.
- Chromium DOM smoke checks: source injection at responsive viewport, synthetic result, source-derived full names, team change, bracket completion and game inspection, no horizontal overflow at 390px. This harness mocks the scheduling portion of the Worker and cannot validate real module execution, Web Workers or hosted HTTPS.

## Statistical baseline/holdout results

No real-game historical holdout backtest was run. Train seasons 0; test seasons 0. Brier, log loss, CRPS, calibration plots, player out-of-sample errors, and real-game spread accuracy are not available. The displayed model percentages cannot be advertised as forecasting skill.

## Unverified

Firefox, WebKit, iPhone physical browser, screen reader, live Google Fonts loading, hosting HTTP response security headers, external NCAA roster refresh workflow, public URL HTTP response, 92-threat dynamic pen test, large-data memory profiling. See `STATUS.md` and `THREAT_MODEL.md`.

## GitHub CI evidence

For source commit `bae3cc71c65c224d85b34a6e96f919b20390569d`, [CI Verify](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44875923917) and [Deploy GitHub Pages](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44875923915) both reported `completed/success`. The latter verified steps checkout, Node setup, lint/test/build, `configure-pages`, artifact upload, and `deploy-pages`. A successful Action does not by itself establish that every client runtime interaction works on an actual iPhone.
