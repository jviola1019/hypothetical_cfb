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

## v0.7 audit addendum — 2026-11-21

| ID | Severity | Finding | Fix/evidence | Status |
|--|--|--|--|--|
| V07-01 | High | Drive starts were independent of previous turnover/punt/failed FG state | `src/engine.js` next-start transitions, `tests/game_field_audit.test.js` | Fixed / local tested |
| V07-02 | High | 2026 roster order might be mistaken for validated quarterback/receiver availability and props | Separate `src/playerEvidence.js` derived retrospective athlete summaries, missing-data suppression; user-visible evidence labels | Partial; future player model not fitted |
| V07-03 | High | Public per-player game-ledger plan would approximate bulk redistribution of CFBD data | Changed pipeline to publish at most 12 **derived** player aggregates/team, no raw per-game records; private intermediates disposed | Fixed prospectively; legacy dataset rights still require review |
| V07-04 | Medium | Prior fitted Elo vs coin-only lacked strong competitors | 2024 fitted / 2025 selected six models, 2026 previously inspected forward; reliability bins, Wilson intervals, week bootstrap | Implemented; full-source Actions pending |
| V07-05 | Medium | CFP bracket lacked explicit year-effective site and bid definitions | Versioned 2026–27 and 2027–28 metadata; site-kind generated for each game | Geometry implemented; committee qualification missing |
| V07-06 | Medium | Historic browser harnesses broke when new modules added | Source modules isolated by lexical scope; two viewport tests and no raw-data scenarios | Fixed / locally tested |
| V07-07 | High | Raw past-game player stats may falsely imply future probability calibration | UI calls them retrospective stat-recorded-game shares, requires at least 3 games, with explicit cutoff and quantiles | Fixed descriptive labeling; independent prop forecast still not implemented |

### Remaining security and reliability risks

- Client-side scores are user-tamperable by design and should never be used as server-authoritative bets; forged winner/margin checked before bracket advancement, but local browser source is not cryptographically trusted.
- The source repository's historical team/roster snapshots derive partly from upstream services with redistribution conditions; current metadata alone does not grant unrestricted data republication. Reassess existing snapshots and permissions separately.
- CI relies on pinned GitHub Actions major tags, without commit-SHA pinning, SBOM or artifact signing. This is an open CI supply-chain risk.
- Browser test harness is not native WebKit/Safari, so first-run workers and offline caching must be separately tested.

### Release-verification and honest uncertainty

Full-source pipeline succeeded, not merely its fixtures: [Actions data refresh 44882376273](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44882376273). Actual player summaries and model evaluation files were fetched from `main` and inspected; named 2026 athletes include Trinidad Chambliss (Ole Miss), Gunner Stockton (Georgia), and Josh Hoover (Indiana), which intentionally **does not** conflate Indiana's 2025 roster with its 2026 lineup. Source last completed game varies by school: Ole Miss 2026-11-15, Georgia 2026-11-14, Indiana 2026-11-14. No source is a live injury report. 2026 reliability shows residual miscalibration; selected model is a research baseline rather than production forecast.

## v0.8 second-pass audit

See `docs/AUDIT_V08.md` for the severity-ranked limitations, mitigations, test evidence and residual risks.
