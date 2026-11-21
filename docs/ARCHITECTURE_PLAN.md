# GRIDIRON LAB — v0.6 architecture and validation plan

Status: **planned before modification**, 2026-11-21. Baseline repository: `jviola1019/hypothetical_cfb`, `main` commit `e5db810b85b852fcee176e72546bc130c2d37876`.

## Product contract
- Exactly two top-level views (Game Simulation and Playoff Simulation); Game inputs remain team A, team B, and venue. Forecast details, charts, and player records are read-only.
- Supported historical FBS programs: explicit 2025/2026 catalogs. No invented roster names, injuries, starters, actual player stats, or sportsbook lines.
- Three separately labelled evidence tiers: **Observed** (sourced games/rosters); **Evaluated model** (strict chronological out-of-sample scores); **Synthetic simulation** (drive/prop engine until actual fit is demonstrated).
- Never represent an in-sample full-season average or final-season Elo as available before a past game.

## Target data architecture
```
Public schedules (2025, 2026) ──> bounded importer ──> validated game-event ledger (as-of dates)
       |                                |                        |
       |                                +--> 2025/26 descriptive team snapshots
       |                                                         |
       +--------------------> chronological baseline evaluation <-+
                                      |
                                      +--> immutable results / model card / holdout scores
Public CFBD rosters + optional weekly reports --> roster validator --> season-scoped names
                                      |
                             strictly labeled identity lookup
Game controls --> validated configuration --> predictive adapter --> seeded drive model
                                                        |              |
                                                        |              +--> internally constrained team/player score sheet
                                                        +--> many whole-game Monte Carlo draws
                                                                     |
                                        projections/tables/charts/props (with provenance)
Bracket rules + teams --> bracket state machine --> seeded games --> round advancement
                                               +--> tournament Monte Carlo statistics
```

## Hard boundaries and schemas
1. **Historical game record**: `{gameId, season, startUtc, homeId, awayId, homePts, awayPts, neutral, completed}`; unique `gameId`, team identity verified; future results inaccessible to prior predictions.
2. **Feature snapshot**: keyed by `(gameId, predictionCutoff)`; team rolling ratings updated only after each preceding game; no future final records, post-game Elo, season totals, or 2026 end-year rosters.
3. **Model evaluation**: 2025 chronological development, 2026 untouched holdout by default; temporal split and sample counts recorded. Each evaluated estimate is distinct from live display/drive parameters until the simulator is actually calibrated.
4. **Player roster snapshot**: `(season, teamId, personName, position, sourceUrl, observedAt)`; no claim of depth-chart or verified playing time. Synthetic player allocations cannot be presented as calibrated props.
5. **Simulation run**: `{modelVersion, dataVersion, seed, inputs, game, sampledDistribution, provenance}`; no external client API keys, deterministic RNG, explicit iteration bounds.
6. **Tournament**: rules tagged official/hypothetical; no FCS/FBS mixing marketed as official. `N-1` played games, one champion; seed advances only through legal bracket edges.

## Phase plan, gates and order (no redesign before math audit)
**Gate A — baseline audit**: verify remote HEAD; run clean tests/build; inspect sources, scoring/OT, player allocation, bracket tree, data import, web accessibility and security. Record reproducible defects and severity.

**Gate B — repairs**: correct any found high-impact scoring and state invariants (OT, accounting), player-total consistency, unsafe/misleading labels, malformed source acceptance, stale-data handling. Add regression tests that fail for the original defect.

**Gate C — quantitative baseline**: implement zero-key rolling chronological forecast (simple Elo / prior scoring baseline) using *game results known at prediction time*. Hold out the 2026 season; publish Brier/log loss, margin/total errors against flat baselines, sample sizes, calibration bins; no tuning on holdout. Validate leakage with counterexample tests. If offline data is not reproducible, report unverified and do not enable its probabilities.

**Gate D — design/engineering**: keep current dark identity, simplify analytical text; make observed vs synthetic graphics unmistakable; verify mobile and keyboard operation. Cap browser workloads; test failure/retry cases.

**Gate E — release**: test Node/Python, build, desktop/mobile browser and benchmarks; append `docs/AUDIT_REPORT.md`, model card and status with evidence. Commit through authorized GitHub connector with non-force/lease update; verify remote HEAD and Actions, and provide downloadable source.

## Fail-closed release criteria
- No false statement of calibration. No misleading live or data-as-of label. No unknown team IDs or overwritten historical season data.
- Every simulated win has a legal football score, consistent team and player box, valid overtime scoring and terminal state.
- All 13 format fixture invariants pass; official-format limitations are labeled.
- Any model deployment requires a reproducible chronological historical validation report, otherwise remain an experimental baseline.
- UI labels and charts identify observed vs simulated values, model version and cutoff.

## Known architectural risks at plan time
- `teamProfile` currently consumes complete in-season PPG totals and uses ad-hoc scaling, not a fitted forecast.
- The drive generator is deliberately coarse and has known unverified college overtime accounting and PAT logic.
- Roster-first positional selection is not a verified starter or usage model.
- Actual 2025/2026 snapshot JSON is stored in GitHub; the local source archive lacks those generated snapshots. Local tests must not be misrepresented as a full upstream data audit.
- Github Pages only hosts static files; the scheduled ingest lives in Actions. Offline simulation remains available when data refresh fails.

## Review roles / evidence
Quant: independent leakage review, baseline metrics; Football: scoring and OT invariants; Data: provenance/identities; Security: applicability and data budget; UX: mobile/contrast/labels; Release: clean build and remote commit verification. These are review perspectives, not separate autonomous agents.
