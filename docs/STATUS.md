# GRIDIRON LAB v0.5.0 — status / 2026-11-21

## Implemented and verified locally

- Dark **Night Edition** design: Archivo Narrow display, Public Sans text, IBM Plex Mono numerals; navy-black panels, copper highlights, asymmetric header/score typography, field graphic, comprehensive data tables and SVG chart contrast. Two primary tabs retained; game controls only team A, team B, home/away/neutral. Reduced-motion CSS.
- Verified 2026 138 FBS **program names** extracted from the 2026 season schedule and 2025 136 distinct FBS program names; unique slug tests (including Texas A&M, Miami (OH), Hawai'i).
- Historical `2026` and `2025` team-record adapters with source cutoff and per-school reference panels, and roster adapters for source-backed 2026 names/positions. **Full upstream roster imports are not considered complete until workflow success.**
- Source-validated school/season IDs; malformed snapshot, duplicate record, forged HTML-like names, excess file size, incorrect school names, and incomplete schedules handled by guards or safe fallback.
- Seeded simulation with generated score distribution, possession report, player box reconciliation, threshold player props and Monte Carlo tournaments; **none calibrated against real outcomes**.
- 13 tournament formats and inspectable games; large formats render horizontally. Only FBS-specific 12/24 rules are diagrammatic; qualification and officially seeded brackets not reconstructed.
- Executed locally: `npm run check`, `npm test` (**20/20**), `python -m unittest discover -s tests -p 'test_*.py'` (**5/5**), `npm run build`. Browser Chromium harness at 390 and 1370 viewport passed game controls, 138-team picker, simulated named-prop sheet using explicitly fabricated TEST fixtures, 12/24 team bracket and game-inspector, with no horizontal overflow. Browser harness mocks worker and optional network fixtures, so it does not validate live Pages or physical Safari.

## Implemented but deployment/source execution not yet independently verified

- `.github/workflows/refresh-season-data.yml` scheduled/manual 2025+2026 game ingestion and 2026 roster plus 2025 CC0 roster, commits only schema-valid data and rebuilds Pages after success. This is a staged pipeline until a real upstream download + action run succeeds.
- External-free 2026 roster refresh may cover many FBS programs. Exact school/athlete count must be measured, not guessed. Names are roster identities, not official depth charts or athlete availability.
- Native browser ES modules, actual Web Workers and iPhone Safari remain unverified beyond DOM harness. Documented benchmark refers to CPU environment, not physical iPhone.

## Partial / experimental

- Team strength model uses source-backed retrospective scoring as a simple uncalibrated profile proxy where available, synthetic hashed fallback where absent. No out-of-sample validation, opponent adjustment, or predictive research evidence.
- The named player sheet associates verified roster-listed names with illustrative QB/RB/WR/TE slots in sorted position order; starter assignment is **not verified**. Generated stats are not projected performance for those individuals.
- FCS24 option only demonstrates tournament shape and currently mixes five named FCS school references with FBS entries; it is **not an authentic FCS participant field**. Official campus and reseeding rules are incomplete.
- Some detailed play-by-play and true player usages are not represented by this coarse drive model. A 92-threat architecture applicability matrix exists, but not a complete pen test.

## Not implemented / blocked

- Verified full 2026 athlete participation or real-time injuries, official 2026 depth charts, full 2026 per-player actual prop training data, true opponent-adjusted 2026 forecast model, chronological backtest, Brier/log loss, real sportsbook lines, a reliable keyless live 2026 API, complete NCAA rules enforcement, per-play play-by-play simulator.
- Comprehensive Firefox/WebKit/physical iPhone accessibility and performance QA.

**Strict rule:** school lists, imported observations, and model-generated outputs must remain independently and visibly labeled. No numeric synthetic score or prop frequency is represented as a validated betting probability.
