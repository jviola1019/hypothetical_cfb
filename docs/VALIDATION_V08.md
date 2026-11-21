# GRIDIRON LAB v0.8 — Verification record

**Execution date:** 2026-11-21. **Frozen starting commit:** `d69345a109b2ee39662ef66080947f51ff997d2d`.

## Actual local execution evidence

| Gate | Observation | Status |
|---|---|---|
| Node unit, regression, integrity and threat tests | 55 passed; 0 failed | PASS |
| Python ETL, chronological data / model tests | 28 passed; 0 failed | PASS |
| JavaScript syntax | `npm run check` exits 0 | PASS |
| Offline static build | `npm run build` creates `dist/` | PASS |
| Chromium 390×844 DOM smoke | team dropdown, observed player, score audit, CFP 12/24, matchup inspect, no overflow / page errors | PASS in harness |
| Chromium 1370×850 DOM smoke | same functionality | PASS in harness |
| Fully loaded static site, native ES modules and Web Worker | browser blocks both `file:` and localhost navigation | BLOCKED |
| WebKit and physical iPhone Safari | not executable on this environment | NOT VERIFIED |
| GitHub Actions real-source score/athlete refresh | source workflow staged, latest run must be inspected | NOT YET VERIFIED |
| 92-threat full penetration testing | threat matrix is a design inventory; focused guards tested | NOT VERIFIED |

The Chromium harness *inlines* local JavaScript modules and substitutes a scripted Worker and synthetic data fixtures. No browser-level test is presented as a real-world statistical model evaluation.

## Recorded container timings

- 1 game: 9.0 ms
- 1,000 games and summary: 592.6 ms
- 12-team complete tournament: 10.8 ms
- 24-team complete tournament: 6.2 ms
- 64-team complete tournament: 27.2 ms
- 128-team complete tournament: 60.3 ms
- 50 Monte Carlo 12-team tournaments: 249.7 ms

These are single-run Node CPU timings, not representative mobile latency or cold-load performance. No machine-wide workload normalization or CI repetitions performed.

## Statistical design

**Existing winner baseline:** 2023 ratings warmup; fit hyperparameters on 2024; model choice on 2025; 2026 inspected in earlier versions, therefore cannot be called pristine untouched. Previous 2026 forward check selected two-feature Brier .203625 (629 FBS matchups) versus .239703 home-only and .250000 coin flip. These numbers are from the *prior published* model-comparison artifact, not the new v0.8 model outputs.

**New score-level residual model:** fit chronological 2024 margin and total residual distribution only; evaluate frozen residuals against 2025 and 2026 games using empirical CRPS, MAE, 80/90 interval coverage and winner Brier versus a 2024-only home prior. Scores are **whole-game** marginal residuals: this does not calibrate possession, play-by-play or player usage. Fixture/unit tests passed; numerical performance from the full-source refresh is pending.

**New player event model:** estimate position/stat threshold exceedance conditional on a *recorded game with that statistic*. Freeze 2025 cohort priors, then sequentially update for each athlete in 2026 using previous recorded events only. Report paired Brier/log loss versus frozen 2025 prior-only baseline; only after three prior events and 30+ cohort events. Missing game events cannot distinguish inactivity from zero snaps or zero production; do not interpret these as unconditional player-prop probabilities. Real-data score metrics pending the complete Actions ingest. Source and derived artifacts have bounded validation and are not a raw event mirror.

**Tournament qualifications:** Pure selector validates external purported committee rankings and ten conference winners, 2026 Notre Dame top-12 exception, 2027 24-team bid and bye counts. Does not verify supplied committee rankings, conference champions, or live official selection. Existing geometry and N−1 game invariants remain separate.

## Data and security conditions

- Versioned 2025 and 2026 FBS catalogs contain 136 and 138 distinct FBS programs in the last verified source snapshot. Rosters are historical reports, not up-to-the-minute validated starters.
- High-volume third-party raw play-level data live only in temporary ingest working files; workflow commits derived capped summaries and bounded research metrics.
- UI rejects malformed, oversized or inconsistent derived artifacts; simulated sports states are client-owned and can be altered by end users, so none are authoritative outcomes.
- CSP limits browser script execution to same-origin. Google Fonts uses explicitly allowed font endpoints, no third-party JavaScript.
- No native cross-browser / iOS certification and no independent red-team report.

## Commands rerun for release

```bash
npm ci --ignore-scripts
npm run check
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build
python3 tests/season_browser.py --mobile
python3 tests/season_browser.py
npm run benchmark
```

Record actual GitHub Actions run URLs and artifacts only after remote checks complete. Failures must be preserved in `docs/STATUS.md`.
