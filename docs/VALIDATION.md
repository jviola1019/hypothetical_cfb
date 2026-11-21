# Verification report — v0.5.0 / 2026-11-21

Executed in an isolated container with Node.js, Python and headless Chromium:

- `npm run check`: **passed** (JavaScript syntax including catalog, data adapters, worker, game/tournament engine).
- `npm test`: **20/20 passed**. Four added tests check 138 unique FBS IDs, 2026 snapshot validation and recovery on malformed payload, strict roster-name safety, historical-year isolation, named synthetic props and seed reproducibility. Existing 16 tests cover 300 simulated game integrity fixtures, 13 bracket configurations, N-1 played games, Monte Carlo consistency, illegal inputs, player yard/target reconciliation.
- `python -m unittest discover -s tests -p 'test_*.py'`: **5/5 passed** including new score schedule fixture for all 138 sample schools, duplicate-game rejection, 2026 full-name roster CSV parser and bounded ZIP member parsing. Test input schools/players are synthetic and do not assert real historical performance.
- `npm run build`: passed using only Node built-ins (no npm runtime packages).
- `python tests/season_browser.py --mobile` and `python tests/season_browser.py`: passed on headless Chromium 390px and 1370px. Loaded mock season and roster fixtures with 138 FBS entries, selected teams, inspected a complete 12-team playoff and completed 24-team bracket, with no document overflow. **Inline source injection, synthetic Worker, and intercepted data transport were used**; browser result does not establish native worker, network, or real Safari correctness.

## Source observation audit

`cfbfastR-data` schedule CSVs examined via authorized GitHub connector. 2026: 888 fixture rows, 752 scored, 138 FBS programs, latest scored November 15. 2025: 3,831 rows, 3,829 scored, 136 FBS programs. The 2026 roster CSV and weekly November 16 school release were verified **available by metadata**, but full dataset contents could not be downloaded within this container. Full roster ingestion remains pending a successful Actions run.

## Empirical evaluation status

No historical train/validation/test split, no held-out forecasts or real-game fitted player model. Brier score: not measured. Log loss: not measured. Spread MAE and total RMSE: not measured. Calibration: not established. Football realism is a coarse demonstration, not independently established by passing invariant tests.

## Browser/security limitations

Playwright smoke tests use an injected DOM harness (which proved interaction behavior and narrow-screen width), not hosted HTTPS navigation. Chromium only, not Firefox/Safari/iOS. Google Fonts were removed from the inline test harness to prevent blocked font-network waits; fonts remain available with fallback in the published site. Threat matrix classifies 92 hazards but is not 92 completed exploit tests. No secrets or authenticated endpoints in the static frontend.
