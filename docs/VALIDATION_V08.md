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
| GitHub Actions real-source score/athlete refresh | full workflow 44884709038 completed, both new empirical JSON outputs inspected | PASS |
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

**New score-level residual model:** fit chronological 2024 margin and total residual distribution only; evaluate frozen residuals against 2025 and 2026 games using empirical CRPS, MAE, 80/90 interval coverage and winner Brier versus a 2024-only home prior. Scores are **whole-game** marginal residuals: this does not calibrate possession, play-by-play or player usage. Fixture/unit tests passed; Full-source 2026 results: margin CRPS 10.35532 and 80/90% coverage 79.332%/90.302%; total CRPS 9.23050 and coverage 79.650%/89.030%.

**New player event model:** estimate position/stat threshold exceedance conditional on a *recorded game with that statistic*. Freeze 2025 cohort priors, then sequentially update for each athlete in 2026 using previous recorded events only. Report paired Brier/log loss versus frozen 2025 prior-only baseline; only after three prior events and 30+ cohort events. Missing game events cannot distinguish inactivity from zero snaps or zero production; do not interpret these as unconditional player-prop probabilities. Real-data 2026 conditional-event results: n=7,250 events across 1,623 athletes, Brier 0.166846 vs prior-only 0.1872194; this is not an unconditional full-game player prop model. Source and derived artifacts have bounded validation and are not a raw event mirror.

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

## Verified GitHub Actions v0.8 full-source results (2026-11-21)

- [CI workflow 44884708956](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44884708956) **succeeded** for code commit `61a4d568ce73e3e856bfbb97ebb4c1851d400d80`.
- [Refresh workflow 44884709038](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44884709038) **succeeded**; all FBS schedule, roster, score-interval, player-event ingestion and data integrity steps succeeded. Refresh output commit: `d004db829c5822541bfd575f138fec9deb0e2e72`.
- Score residual model [artifact](https://github.com/jviola1019/hypothetical_cfb/blob/main/public/data/score-evaluation-2026.json): 2024 training n=798, 2025 evaluation n=808, 2026 evaluation n=629.
  * 2026 **margin** CRPS **10.35532**, MAE **14.59385**, 80% interval coverage **79.332%**, 90% coverage **90.302%**.
  * 2026 **total** CRPS **9.23050**, MAE **13.19107**, 80% interval coverage **79.650%**, 90% coverage **89.030%**.
  * Margin-residual win prediction Brier **0.2174466**, versus fixed historical home-prior **0.2396811**. This is not better than the separate selected two-feature winner benchmark's previously reported **0.203625**; they answer different modeling questions.
- Event-conditioned player [artifact](https://github.com/jviola1019/hypothetical_cfb/blob/main/public/data/player-model-evaluation-2026.json): **1,623 athletes**, **7,250 evaluation events**; 2026 sequential event-game Brier **0.166846**, log loss **0.5089542**; frozen 2025 cohort-only prior Brier **0.1872194**, log loss **0.5626787**. Relative Brier difference **0.0203734**, descriptive only; repeated athlete events are dependent and 2026 was already inspected. **Not** an all-games or pregame player-prop probability.
- The 2026 limited public derived player import produced **1,628 summaries across 138 schools** from **193,254 source rows** and **752 matched games**; per-team public snapshot limits and source provenance remain in effect.
- First v0.8 Pages attempt was cancelled when refresh committed new data; [subsequent Pages run 44884751903](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44884751903) **passed** for data commit `d004db829c5822541bfd575f138fec9deb0e2e72`.
