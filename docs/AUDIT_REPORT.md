# GRIDIRON LAB — independent engineering and quantitative audit, v0.6

Baseline: GitHub main `e5db810b85b852fcee176e72546bc130c2d37876`, verified 2026-11-21. Planned architecture recorded in `ARCHITECTURE_PLAN.md` *before* edits. Audit is bounded by available runtime and data. It is **not** a security certification or a claim that all football mechanics are proven realistic.

## Reproduced pre-fix defects

| ID | Severity | Original failure | Remediation | Evidence |
|--|--|--|--|--|
| AUD-01 | High | Second college overtime used routine XP kicks after touchdowns, incorrectly permitting seven-point TD sequences | Second OT now requires modeled two-point try; success awards eight, failure six | `tests/audit_regression.test.js`: second-OT scoring fixture failed before / passes after |
| AUD-02 | High | OT3+ attempts changed team score but not team drive/play counts; no separate overtime point field | Account for every attempt in drives/plays/overtime points/two-point attempts | OT ledger test failed before / passes after |
| AUD-03 | Medium | Exported prop simulator accepted unbounded/invalid `n`, risking main-thread exhaustion | Reject counts outside 1–10,000; validate role, stat and threshold | Count-boundary test failed before / passes after |
| AUD-04 | High | Observed team-season JSON accepted fictitious school IDs and partial 8-game 4–0 records | Strict FBS catalog join and `wins + losses == games` | Atomic snapshot validation test failed before / passes after |
| AUD-05 | Medium | Roster loader accepted nonexistent school IDs | Strict FBS identity membership; invalid input fails without modifying active snapshot | Forged-roster regression failed before / passes after |
| AUD-06 | Medium | 12-team CFP bracket labeled the quarterfinal as "Second round" and the title match as "Semifinals" | Format-sensitive round naming; official sequences checked | Bracket stage-name regression passes |
| AUD-07 | Medium | Scoring drives crossing quarters were attributed to their starting quarter | Score is booked into ending quarter; drive remains a coarse event, not play-by-play | End-clock regression failed before / passes after |
| AUD-08 | Medium | FCS-inspired demo contained FBS teams but title suggested official 2026 FCS tournament | UI says mixed-field hypothetical; qualification remains unsupported | Manual review |
| AUD-09 | High / model | Retrospective 2026 average PPG served as an arbitrary football-strength profile | **Not claimed fixed.** Separate pregame-safe, season-separated Elo baseline introduced; synthetic generator remains explicitly experimental | `scripts/evaluate_rolling_model.py`, leakage unit tests; empirical full-source execution gate pending |

## Tests actually executed

- Baseline: `npm run check` passed, Node **20/20**; Python **7/7**; `npm run build` passed.
- Revised: Node **31/31**; Python **11/11**, syntax/build checked separately. Tests include 13 tournament formats, seeded reproducibility, 300 score-accounting fixtures, 138 FBS identity checks, import anti-poisoning fixtures, 2025→2026 temporal isolation, and fixed-parameter swap symmetry.
- Inlined Chromium DOM harness at **390 × 844 and 1370 × 850**: simulated player/roster labels, independent research panel under mock data, team selection, all game controls, complete 12- and 24-team brackets, inspector open, no horizontal overflow, no page exceptions. Test research statistics are **fictitious fixtures**, not real empirical metrics.
- Attempted native-module/WebWorker browser navigation via localhost; browser blocked `127.0.0.1` with `ERR_BLOCKED_BY_ADMINISTRATOR`, so native worker behavior and physical iPhone Safari remain **unverified**. This is an environment blocker, not a test pass.

## Model architecture and evaluation gate

```
2025 scored FBS-vs-FBS games (chronological pregame-only features)
    -> online Elo (K=24, home edge 55 points, scale 400)
    -> 2025-only regularized logistic slope fit (fixed prior 1.0)
    -> carry 65% of 2025 final Elo into 2026; reset scoring aggregates
2026 scored FBS-vs-FBS games (chronological, past-game state only)
    -> fixed 2025 slope prediction BEFORE each game
    -> Brier / log loss / 10 calibration bins / margin and total MAE & RMSE
    -> 2026 week-clustered paired bootstrap against coin flip
    -> published immutable JSON with team rating state + last scored game
```

2026 cannot influence 2025 fitted slope. Evaluation compares the prespecified model to a constant 50% probability baseline (and raw Elo) and compares point predictions to a constant total derived from 2025 only. The results are **experimental**, with correlated team errors and one-season holdout. This is not proof of reliable calibration; no claim of beating markets or an independently fitted individual-player model.

### Full-source research execution

Scheduled/manual GitHub Actions fetches 2025 and 2026 CSVs from `sportsdataverse/cfbfastR-data`, runs the Python evaluator under a strict 2MB input bound, requires at least 400 completed 2025 FBS-vs-FBS and 300 completed 2026 FBS-vs-FBS games, and commits `public/data/research-2026.json` only if validations pass. If the pipeline hasn't run after code publication, **Brier/log loss are unavailable**, and the UI shows a clear research-unavailable fallback. No fabricated empirical scores are committed.

## Security review / remaining risk

- Static site: no accounts, tokens, cookies, server APIs, uploads, or persistent private data. Most authentication/server vulnerabilities in `THREAT_MODEL.md` are not applicable to the current deployment; enabling a backend requires a fresh review.
- Client-import hardening: bounded optional research JSON, model schema, known school IDs, legitimate roster school IDs, bounded Monte Carlo, score integrity checks, escaped names in UI.
- Not yet verified: complete 92-case exploitation coverage, SRI/pinning for upstream source assets, 2026 provider data licensing review, network-freshness SLA, WebKit/Firefox and real iPhone; secure GitHub Actions supply-chain provenance beyond standard permissions.

## Known model/game limitations NOT corrected by this pass

The drive engine is not a real NCAA play-by-play emulator: no authentic fourth-down policy, penalties, mid-drive state transitions, defensive scores, two-point defensive returns, football-level player usage conditioning, roster availability or statistically fitted drive calibration. It only enforces a tested coarse subset of scoring and bookkeeping invariants. The official FBS format shapes do not assign true committee bids or every stadium/bowl. FCS-inspired bracket mixes divisions and must not be presented as official. The app's synthetic props remain **illustrative only**, despite showing roster-listed full names.

## Deferred quantitative work (priority order)

1. Confirm remote Actions actual 2025/2026 holdout report and inspect values; do not select/tune on the 2026 holdout after seeing it.
2. Ingest timestamped player-game stats and game participation; resolve transfers, names and starters; fit player usage conditional on team pass/run opportunities with withheld games, or suppress unsupported individualized probabilities.
3. Expand chronologically evaluated seasons and compare Elo to ridge/GBM/efficiency alternatives with fixed train/validation/test and leakage-safe features.
4. Calibrate a conditional drive-level generator against held-out game/drive frequencies and ensure expected score/total/win distribution coherence with the research model.
5. Verify real Chromium/WebKit/iOS offline workers and benchmark in physical devices; expand accessibility audit.
