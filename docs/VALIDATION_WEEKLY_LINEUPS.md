# GRIDIRON LAB v1.1 — weekly-lineup validation, evidence and limitations

## Reproducible commands

```bash
npm run check
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build
python3 tests/pressbox_browser.py
```

## Source audits

- Existing GitHub snapshot `public/data/rosters-2026.json`: 138 FBS schools and 15,187 distinct athlete list entries; all three example schools and user-mentioned names match the 2026 position/team roster.
- Existing observed 2026 player-event **conditional means**, before the current week: Jeremiah Smith 132.7 receiving yards in 10 stat-recorded games; Jesse Legree 135.3 receiving yards in 10; DeSean Bishop 112 rushing yards in 10. These are not average yards per *all appearances*.
- Official/first-party resources and corroboration links are stored in `research/weekly-lineups/2026-11-21.json`. Luke Fahey QB role is third-party **reported replacement**, not a post-kickoff verified official start. Jesse Legree is a leading-usage inference, not independently current-week certified starter. Julian Sayin availability is a dated injury report, not a perpetual exclusion.
- Week-specific human-verified role list covers selected examples only. Other 2026 school roles are ranked from **recorded stat events** and otherwise fallback roster positions. Snapshot has no claim of 138 independently validated starting depth charts.

## Model and audit

- `src/weeklyLineup.js`: bounded date and team/role schema, label expiry, source URLs, duplicate athlete rejection and freshness grade.
- `scripts/refresh_weekly_lineups.py`: season-2026 roster join, source-reviewed override and historical candidate expiry, event-stat ranking and absence exclusion, deterministic current week.
- `src/observed.js`: roster-first matching with current-week overrides, pregame name provenance and last-observed-stat samples.
- `src/worker.js`: weekly and player evidence handed to isolated Worker so named prop distributions use the same athlete IDs as the main UI.
- `src/usage.js`: 5-channel receiving split WR1/WR2/TE/RB/Other, with shrinkage based on recorded stat-event means; RB and anonymous backup rushing split. **Hand-set reference denominators are modeling assumptions, not fitted opponent-specific expected volume.**
- `src/gameAudit.js`: verifies team-and-player total yards, catches, targets, QB TD and team scores in generated games.
- `tests/workload_realism.test.js`: seeded example games verify source-selected identities, no fabricated sample mean for no-data Luke Fahey, observed-stat type mapping and approximate workload of the three example athletes; these are **fixture checks**, not held-out calibration.

## Unmet scientific acceptance criteria

- Most recent week starts/usage/official depth charts are not verified for all 138 FBS teams, and the workflow cannot infer true availability merely from roster presence.
- 2026 conditional stat-event observations are selective: absences, zero-event appearances, snap counts, opponents and injuries remain incompletely measured.
- Simulated pass/run opportunities are not fitted to actual game-level joint distributions; no prediction interval coverage is established for named future-game player props.
- Game outcomes and scores remain synthetic. Historical score-model backtests are from an independent scoring layer.
- Browser test uses Chromium DOM injection, not native modules/Worker in browser, not physical Safari.

## Release check

Test results, GitHub CI and workflow run IDs are recorded only after executed checks. Uploading code is distinct from confirming a successful hosted deployment.
