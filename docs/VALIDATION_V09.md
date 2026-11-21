# GRIDIRON LAB v0.9 — release audit, November 21, 2026

## Baseline, plan and independence
- Pre-change main `396fb377ec7af19cfa8c57c0844b8ef6d600ad01`.
- `docs/ARCHITECTURE_V09.md` created before the new UI and engine edits; addenda added before the game-scale patches.
- No model training or selection on newly acquired future-season outcomes. The 2026 research data have been repeatedly inspected in this project and **cannot be considered pristine**.

## Executed in the current runtime

| Procedure | Observed result | Limit |
|---|---|---|
| `npm run check` | Pass, all source JS syntax checks | Not static type checking; JavaScript app |
| `npm test` | **62/62 pass**, including 7 new game/UI aggregate checks | Selected fixtures, not exhaustive correctness |
| `python3 -m unittest discover -s tests -p 'test_*.py'` | **28/28 pass** | Local source fixtures only |
| `npm run build` | Pass; offline static `dist/` | Static build only |
| `python3 tests/pressbox_browser.py` | Pass at 1370×900 and 390×844: 3 tabs, 3 game controls, replay, score display, research view, bracket 12/24 game completion, match inspection, no horizontal overflow | Chromium DOM with source injected; native local navigation, JS modules and real Web Workers blocked |
| Unavailable-research fixture | Game still works and does not invent an empirical probability | Synthetic fallback intentionally separate |
| `npm run benchmark` | 1 game 3.9 ms; 1k games 262.6 ms; 12-team 3.5 ms; 24-team 3.9 ms; 64-team 14.5 ms; 128-team 23.0 ms; 50x 12-team MC 85.2 ms | Local container CPU, not physical mobile measurements |

## Game-engine face-validity regression

Historical scale reference: public 2025 FBS source snapshot `public/data/season-2025.json` on GitHub, data via `sportsdataverse/cfbfastR-data/schedules/csv/cfb_schedules_2025.csv`: 136 FBS programs; **game-weighted 27.5107 points scored per FBS team game**, doubled to **55.0213 combined-equivalent points** (average is not a perfect FBS-vs-FBS matchup total). Independent 2025 reported pace reference: approximately **134 combined offensive snaps** and approximately **5.61 snaps per possession** (On3, see source in architecture document). The 2026 scoring snapshot through 2026-11-15 was only inspected descriptively (55.8319 doubled equivalent) and does not serve as independent tune/test data.

| Measurement | Previous / initial defect | New sampled mean | Interpretation |
|---|---:|---:|---|
| Combined score per synthetic game | 40.397 | **55.340** | Unconditional first moment approximately aligned to 2025 scale |
| Combined offensive plays | 246.96 after isolated pace change | **134.479** | Second unconditional moment approximately aligned to reported 2025 scale |
| Generated possessions | 26.35 after pace change | **26.354** | Not fitted to independently verified real drive distribution |
| Generated turnovers | Unchecked in earlier tuning | **3.12** | Descriptive only; not calibrated |

These means were computed across 700 seeded Ole Miss–Georgia demonstration games using `hash32('audit:'+i)` for i=0…699; season 2026 roster references are not a 2026 model holdout. New `tests/aggregate_scale.test.js` checks wide bounds for N=350. This is **not** evidence of calibrated individual conditional scoring, actual game outcomes, possessions, plays, turnovers, player usage, win probabilities or prop markets. Do not call the simulator historically trained.

## Safety and data audit
- HTML text is escaped before DOM insertion. No new untrusted script dependencies or client credentials. Only allowed same-origin source artifacts are loaded; boundaries defined in source adapters.
- Research probability never silently substituted by simulated Monte Carlo frequency; unavailable research shows an unavailable state.
- Named roster athletes are shown as identities only. No current starting designation, game participation guarantee, injuries or sportsbook lines are asserted.
- Bounded Monte Carlo and async worker-free fallback; physical iOS memory/cancellation unverified.
- 12- and 24-team bracket geometry, champion and game counts covered by integration tests; official entrant eligibility remains separate.

## Known unverified and blocked work
- Real Safari/physical iPhone, native Chromium module/worker navigation and browser security header configuration of GitHub Pages.
- WCAG 2.2 AA independent audit; contrast/focus/reduced-motion implemented but not certified.
- Empirical drive-distribution and player-prop calibration, injury/availability, live market odds, official CFP committee selection.
- Publication and live Pages status are **separate** from local passes. See GitHub run logs for release status.
