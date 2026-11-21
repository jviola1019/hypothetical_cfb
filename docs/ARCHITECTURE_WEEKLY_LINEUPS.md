# GRIDIRON LAB v1.1 — weekly personnel, depth charts and workload calibration

Planning frozen before source modifications, November 21, 2026.

## Failure being corrected
The existing site ranks roster-listed names by season-long aggregate production and then calls them QB/RB/WR role slots. That method can silently use an injured former starter (e.g. Julian Sayin), omit a temporary replacement (e.g. Luke Fahey), and underallocate high-volume athletes (Jeremiah Smith, Jesse Legree, DeSean Bishop). Current simulation prop distributions may diverge from separately presented historical per-game usage. The previous source data are not an official nationwide starting-depth-chart feed.

## Data / trust architecture

```
2026 source roster, 2026 matched athlete summaries ───┐
                                                        ├─> validated weekly roster-role projection ──> game engine
Human-reviewed game-specific depth-chart evidence ────┘             │
    (named source, observation date, verification type)              ├─> worker same snapshot
                                                                      └─> UI source & freshness stamp
```

1. **Identity:** every active selection must match a name AND team in the 2026 roster. No guessing from last year's roster. Unmatched observations never enter the game.
2. **Evidence hierarchy:** official game-day starter/depth chart > published positional depth chart or identified replacement > recorded 2026 participation/usage > roster position-only fallback. A high-volume athlete is not automatically a verified starter.
3. **Availability:** a reported unavailable athlete must not receive a simulated role for that dated week. Unknown != available. Availability reports have different timing rules for conference games; absence from a report does not certify fitness.
4. **Freshness:** a source-verified lineup entry is usable for its bounded week only. The Monday refresh rebuilds every program, drops outdated confirmed labels, and falls back to dated, estimated usage without inventing current starters. No evergreen verification claim.
5. **Simulation:** use the named current QB and lead roles; use 2026 recorded receiving/rushing participation to allocate team totals by constrained shares, never independently draw conflicting player/team yards. No promise of exact realized personal averages or calibrated future props.
6. **Worker parity:** same roster, weekly lineup and player evidence are loaded in the worker and main thread. Seeded output identical.
7. **Publication:** `public/data/weekly-lineups-2026.json` contains only limited manually verified starter names and derived per-team role selections; `research/weekly-lineups` records public URLs, dates and evidence types. No bulk third-party depth-chart scraping.
8. **Release:** validated schema, 138 program identities when data available, replacement/absence tests, extreme cases, worker identity tests, build and UI smoke tests, audit file; CI publication only after checks.

## Coverage grades (must display)
- `source-verified`: a dated source explicitly lists starter/first-team role for a game or contemporaneous chart.
- `reported-replacement`: contemporaneous reliable reporting verifies new QB/start, but not official depth chart.
- `usage-projected`: current season event participation implies a likely major role; **not starter-verified**.
- `roster-only`: named and eligible, opportunity estimate unsupported.
- `out` / `questionable` / `unknown`: report only if source provides this status, with expiry.

## Critical source checks
- Ohio State WR-X Jeremiah Smith first position and Luke Fahey QB depth-chart 2026-11-14; current projected QB corroborated November 21 (Ourlads; Who's Starting). Julian Sayin reported injured; avoid treating prior passing totals as starting evidence.
- Tennessee official athlete profile names DeSean Bishop starting running back in 2026; a separately published 2026 depth chart identifies him.
- Oregon State official 2026 season statistics Jesse Legree 1,209 receiving yards / nine games, 134.33 per game. These prove featured usage, *not* an official game-week depth-chart designation.
- All three are separately roster-matched in existing 2026 data (subject to GitHub CI confirmation).

## Automation cadence
Run existing data-refresh workflow Monday; compile weekly role snapshot following roster/athlete refresh. Additional Friday run rebuilds source labels. With no updated officially dated evidence, the previous week's verified starting labels expire; data remains visibly usage-projected rather than silently stale. Weekly *reset* is guaranteed only while GitHub Actions is running. Genuine weekly **verification of all 138** cannot be certified without school-specific licensed depth charts and availability sources.

## Independent audit checklist
Quant: playing-time evidence, mean shrinkage, team/player reconciliation; football: official lineup and late replacement; frontend: no extra edits and clear source stamps; security: malicious name, duplicate roles, stale overriding fresh, arbitrary URLs, source injection; reliability: empty updates, worker race, schedule failure; licensing: no third-party depth-chart mirror.
