# Implementation status — November 21, 2026 / v0.4.0

## Implemented and tested

- Completely redesigned responsive, two-tab sports-editorial interface. Game controls are restricted to two teams and home/neutral field. Original CSS design uses Barlow Condensed, DM Sans and IBM Plex Mono when loaded, plus offline fallbacks. Mobile no-overflow and game/playoff DOM controls tested in Chromium source-injected harness.
- 2025 observed full-season team PPG, PPG conceded, records and manually checked athlete identities for **Ole Miss, Georgia, Alabama and Indiana**; limited sourced head-to-head results, including postseason played in January 2026. Sources in `src/observed.js` and `DATA_PROVENANCE.md`.
- Seeded synthetic engine, player/team stat reconciliation, 2025 full-name slot labeling for verified players only; unsupported player props suppressed.
- Read-only prop distributions with fixed labeled thresholds, empirical means, sampled frequencies and descriptive observed season means where the measurement matches. Playoff game inspector includes player and team stat tables and synthetic prop samples.
- Interactive outcome atlas, margin/total histograms, convergence, drive paths, final-score illustration, factual reference table and playoff title-advancement table.
- 13 bracket formats, reliable N−1 generated games, score/round report, repeatable tournament Monte Carlo.
- Optional NCAA CC0 roster+stats importer validated on **two offline fixtures**; independent import workflow staged and documented; zero upstream files downloaded by the tests.
- Node test suite **16/16** and Python ingestion **2/2**; static build and source syntax checks. See `VALIDATION.md`.

## Implemented but not end-to-end verified

- Real Web Worker and native module resolution under GitHub Pages runtime; actual iPhone Safari performance, axe/WCAG automated audit, and Google Fonts web loading.
- `.github/workflows/refresh-roster.yml` full upstream ingestion and commit (requires workflow dispatch, GitHub network and permission; not executed).
- Direct HTTPS response from the public Pages URL remains unverified by this container. The deployment action itself succeeded on commit `bae3cc71c65c224d85b34a6e96f919b20390569d`.

## Experimental / partial

- 2025 full-season efficiency proxy only for four audited teams, plus synthetic values for all others. This proxy is **retrospective and in-sample** and leaks the selected season’s completed outcomes; cannot be used as point-in-time backtest predictor. No historical forecast accuracy claim.
- Player props use actual historical names but **synthetic role allocations**, not individual playing-time/usage fitted projections. Full names are suppressed for unverified schools/positions.
- Static bracket topology approximates official 12-team and announced 24-team FBS initial pairings; no committee qualification, precise host logistics, or region-aware FCS seeding.
- Simplified drive-level football, coarse overtime and no actual down-by-down plays. Scoring clock events are generated, not official match events.
- Applicable 92-threat security matrix is an architectural classification, not 92 exploit tests.

## Not implemented / blocked

- A licensed data warehouse with chronological cutoff, real play-by-play opponent adjustments, held-out season calibration, game-level player usage/participation, verifiable player prop probabilities for all schools, actual 2026 live feed, official full CFP selection and authentic defensive player props.
- Automatic free authenticated CFBD ingestion; free CFBD key not available and static public bundle must not expose one.
- Complete official future bracket logic, risk-factor-driven injury/weather/rest effects, realistic play-level engine, comprehensive multi-browser accessibility audits, independent pen test.

**Evidence rule:** Source file or CI workflow existence is never evidence its real provider refresh or production deployment succeeded.

## Publication verification

Remote source commit `bae3cc71c65c224d85b34a6e96f919b20390569d` verified via GitHub connector. GitHub Actions **Verify** run 44875923917 completed **success**; **Deploy GitHub Pages** run 44875923915 completed **success**, including `actions/deploy-pages@v4`. A direct fetch to `https://jviola1019.github.io/hypothetical_cfb/` was blocked by the browsing environment; live page HTTP rendering and Safari runtime are not independently verified.
