# GRIDIRON LAB 1.0 — Verified QA, bracket and 2026 identity contract

**Execution date:** 2026-11-21. **Source baseline:** `2e096908b56b493747b42001eb31ffb2d34f02c9`. Architecture documented first in [`ARCHITECTURE_V10.md`](ARCHITECTURE_V10.md). Implementation tested locally before GitHub publication.

## Reproducible checks

Run with Node.js >=20 and Python 3:

```bash
npm run check
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build
python3 tests/pressbox_browser.py
python3 tests/national_open_browser.py
```

Local Node unit/property/security tests: **77 pass / 1 skipped / 0 failed** (78 total). Skipped `remote_data_contract.test.js` only because the stand-alone source ZIP omits the 2026 large source snapshots; they exist in the GitHub repository and the test is designed to run with those checked out. Python: **28 pass / 0 failed**. Node static syntax check and static build: **passed**. The 390px and 1370px **source-injected Chromium** DOM harnesses passed the Game/Playoff/Model views, both regular CFP formats, the 138-field builder, seed swap/reset, 137 played games, match inspection, and document-width overflow checks. Browser navigation to localhost is blocked in this execution environment, so the tests do **not** certify actual module/asset loading in a hosted browser, genuine iOS Safari, or browser-native Web Worker behavior. A Node `worker_threads` isolate **did** pass athlete/name and prop-distribution parity against the main engine.

## Independent checks

| Audit perspective | Actual executed evidence | Verdict |
|---|---|---|
| Football / bracket | Power-two bracket permutations, 138 teams → 10 play-in games + 118 opening byes → 128 main draw → 137 played games, 1 champion; all 13 public formats N−1 | Pass locally |
| 2026 athlete identity | Season-specific 2026 roster IDs, same-season derived event-name membership tests, no unlisted athlete injection | Pass with fixtures; live full census remotely inspected |
| Worker reliability | Node isolated worker & main-thread simulated named-prop distributions match exactly for identical 2026 evidence | Pass |
| Security / state | Malformed team IDs, duplicate participants, malicious HTML-like names, invalid swaps, oversized Monte Carlo, malformed player evidence | Pass subset; full 92-threat audit not executed |
| Accessibility / visual | Keyboard focus CSS, reduced-motion CSS, 390px/1370px browser checks; foreground contrast ratios below | Partial (no automated WCAG/full assistive-tech certification) |
| Runtime performance | 10 seeded single-elimination tournaments per tested format in Node 22; no native iPhone performance measurements | Pass local timing only |
| Quantitative prediction | Elo research artifact dated 2026-11-15 used for ordering; distinct from synthetic match outcomes, not official CFP rankings | Provenance check, **no new calibration gain claimed** |

## Measured tournament timings (Node container, ten runs each)

| Format | Median | Slowest observed |
|---|---:|---:|
| 12 | 2.28 ms | 8.23 ms |
| 24 | 4.42 ms | 5.74 ms |
| 64 | 6.10 ms | 16.18 ms |
| 68 | 6.67 ms | 23.71 ms |
| 128 | 11.76 ms | 22.35 ms |
| Full 138 | 14.16 ms | 16.46 ms |

The timings cover one **complete tournament** including individual generated football games. They do not measure first-contentful paint, memory on Safari, production network throughput, or 400-tournament Monte Carlo batches.

## Visual checks

Computed CSS contrast ratios using sRGB luminance: primary cream against night **17.19:1**, secondary text against night **9.80:1**, lime signal against night **15.33:1**, ink against seed-paper **11.99:1**. These pair checks do not constitute independent WCAG 2.2 AA certification. Desktop and narrow mobile screenshots were visually inspected; high-cardinality bracket shows 16 match cards at a time rather than hundreds.

## Source scope / limits

- GitHub `public/data/rosters-2026.json` inspected via connected repository API: **138 FBS schools, 15,187 roster-listed athlete names** (no program missing), published `2026-11-21T08:24:16+00:00`.
- GitHub `public/data/research-2026.json`: 138 team research ratings; **latest recorded game in artifact `2026-11-15T18:00:00.000Z`**, so rankings are **not** November 21 live committee rankings.
- Source group `sportsdataverse/cfbfastR-data`. 2026 derived per-player aggregates are **conditional on recorded events**, not proof of starts, snaps or playing time. Athlete-derived selection matches normalized full names back to the same-team, same-season roster first.
- When ratings cannot load, the app labels an observed-results fallback or an **unranked** field. When roster/evidence cannot load, no verified starting player is invented. 2025 rosters are never substituted as 2026 names.
- All scoring/drive production and sample player props remain **hypothetical and uncalibrated**. This release improves source integrity, interaction and bracket fidelity; it does not establish new real-world forecast skill.

## Unverified

Actual GitHub Actions checks and live Pages success are separately reported after pushing; this document's local results are not evidence of remote deployment. Physical iPhone Safari, native browser worker loading, 2026 late-November injury/transfer status, 2027 pristine holdout, complete security pen testing and independent assistive-technology audit remain unverified.
