# v0.7 verification evidence — 2026-11-21

## Locally executed

- JavaScript Node unit/property tests: **39/39 passed** (`npm test`). Includes all 13 tournament formats, CFP sites and tamper rejection, field position, scoring, seeded repeatability, boundary checks, and derived-player-schema validation.
- Python ingestion and modeling tests: **19/19 passed** (`python -m unittest discover -s tests -p 'test_*.py'`). Includes duplicate event idempotency, source-team fencing, minimum observed-game counts, output contains no raw game logs, chronological separation, and 2026 label inversion cannot change fitted parameters.
- JS syntax: `npm run check` passed. Static site: `npm run build` passed.
- Chromium inlined DOM harness at 390×844 and 1370×850: source mocked FBS names and derived player records, team change, two tabs, bracket play, match inspection, no horizontal overflow or JavaScript exceptions. `tests/season_browser.py --mobile`, `tests/season_browser.py`, `tests/redesign_browser.py 390`, `tests/redesign_browser.py 1370` passed. **This is not a real server/ES-module/worker or physical Safari test.**
- Monte Carlo benchmark: local CPU-specific, not validated iPhone performance. Run `npm run benchmark` for the specific container and record its numbers.

## Pending external workflow

`.github/workflows/refresh-season-data.yml` downloads full 2023–26 schedule data, computes model candidate tables (2025 validation vs previously inspected 2026 forward reference), and optionally builds 2025/26 private intermediate athlete game logs into small derived player-summary snapshots. It must pass source schemas and minimum coverage; if not, files remain missing. No fabricated model evaluation result should be substituted.

## Methodological boundaries

Historical data are source-defined, not refreshed live. Brier score requires matchup-level pregame probabilities; win frequency in a synthetic game simulator is not calibration. Model improvement is descriptive unless paired comparisons and their dependence limitations are reported. Wilson reliability bands and exploratory weekly block bootstrap are included in the research artifact; week grouping does not eliminate opponent dependence.

## Actual remote validation results

- GitHub [CI run 44882376304](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44882376304) **succeeded**.
- GitHub [data refresh 44882376273](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44882376273) **succeeded** and published verified multi-year sample counts 792/798/808/629, 1,627 current-year derived athlete summaries and 1,617 archived-year summaries. See `public/data/model-compare-2026.json` and `public/data/players-2026/manifest.json` for ground truth.
- GitHub [Pages run 44882408482](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44882408482) **succeeded** after the data-refresh commit superseded the initial deployment.
- Reported 2026 forward Brier 0.203625 for the model selected by 2025 Brier; comparison 0.239703 home-only and 0.250000 coin. The 2026 sample has been inspected in past project releases; the 2026 check is exploratory and **not a newly untouched holdout**.

## v0.8 evidence

See `docs/VALIDATION_V08.md` for the new locally executed 55 JS / 28 Python tests, Chromium simulated DOM harnesses, native browser blocks, performance measurements, and still-pending external v0.8 full-source checks.
