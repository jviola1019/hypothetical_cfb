# GRIDIRON LAB · COLLEGE CHAMPIONSHIP STUDIO (v1.2.0)

> **Saturday Night 26 design update:** An original college-football game presentation with athletic Barlow typography, an illustrated stadium, compact broadcast scoreboards, responsive tournament brackets and one consolidated visual skin. Data displays are cross-checked by `npm run audit:data`. [Visual and factual audit](docs/STYLE_SYSTEM_SATURDAY_NIGHT_26.md). This is independent fan-created software, not affiliated with NCAA or EA. The playable score model remains synthetic where its historical margin-coverage gate fails.


**A free, offline-first college-football game and playoff simulator.** Pick two FBS teams and a venue, then see one replayable generated game: scoring by quarter, gameplay/drive timeline, full team and named-athlete box, player stat threshold frequencies, empirical *research* estimate where available, and readable probability distributions. The **Playoffs** tab builds 2–138-team hypothetical brackets with individual game inspection. The **Model & Validation** tab holds all technical statistics, model diagnostics, source cutoffs and caveats.

**November 22 matchup and injury audit:** [16 neutral/home matchup pairs, 14,400-drive-game reference checks, real-vs-generated player means, current-week replacements, and limitations](docs/MATCHUP_AND_AVAILABILITY_AUDIT_2026-11-22.md). 2026 opponent-adjusted Elo now guides **fictional gameplay**. It is not historical score calibration or a valid athlete-prop prediction.\n\n**Playable game backtest:** [2024 fit, 2025 check, 2026 forward diagnostics](docs/REPLAY_VALIDATION_2026-11-22.md). The conditioned replay adapter currently fails its historical margin-uncertainty gate and remains disabled. Source-ranked 2026 role identities are not all game-day verified starters.

**November 22 release audit:** [prioritized defects, fixes and remaining limitations](docs/RELEASE_AUDIT_2026-11-22.md). Simulated drives and player props are still synthetic and uncalibrated.

**Direct result:** https://jviola1019.github.io/hypothetical_cfb/  
**Repository:** https://github.com/jviola1019/hypothetical_cfb

## NEW v1.1 — weekly personnel, dated depth charts and bounded usage

- Simulations continue to use the selected school's **2026 roster**. A **weekly personnel desk** now distinguishes dated external replacement/depth-chart evidence from **usage-estimated** and **roster-only** positions. It gives full source links and expires current-week verification at the week's end.
- Confirmed example sources in the 2026-11-16 through 2026-11-22 bulletin: Ohio State **Luke Fahey** as reported replacement QB, **Jeremiah Smith** as first-team WR, Tennessee **DeSean Bishop** as reported lead RB; Oregon State **Jesse Legree** as **usage-projected**, not independently certified as this week's starter. **Julian Sayin** was reported unavailable for the Ohio State game; that is a dated report, not a perpetual injury designation.
- Every Monday, and additionally Friday, GitHub Actions can rebuild a compact role sheet for **all 138 FBS schools** based on the latest roster plus recorded usage. **That is 138 roster-verified candidate lineups, not 138 verified starting depth charts.** Without a new audited school source, the old verified designation expires and falls back to estimated provenance. Current-week identity lists and research-model cutoffs are independently displayed.
- Featured receiver/rusher output now allocates team opportunities using cautiously shrunk 2026 recorded-stat-event means, and anonymous **Other contributors** absorbs production from athletes not represented by a name slot. This preserves targets, catches, pass and rush yards and touchdown totals; a recorded-stat game is **not** a complete appearance or active-roster forecast.
- Worker and main thread share the same weekly evidence snapshot; a replacement QB cannot silently revert to the prior starter in the Worker. See `docs/ARCHITECTURE_WEEKLY_LINEUPS.md`, `docs/VALIDATION_WEEKLY_LINEUPS.md` and `docs/STATUS.md`.

**Limit:** no free nationwide official depth chart feed covers every FBS starter and game-day change. Source-graded estimates and a scheduled refresh are useful for a fun simulator but do not constitute verified active lineups or calibrated future game player props. A third-party lineup listing is not the same as an official confirmed starter.

## NEW: 2026-roster National Open (v1.0)

- **2026 only**: game and every playoff game use full names from the current-season team roster snapshot when available (138 teams; 15,187 listed athletes in the verified repository). Roster inclusion does not verify starters or health. If matched, 2026 derived stat-event history improves *illustrative* role naming but does not establish a player prop forecast.
- **Top-seeded by model**: the 2026 Elo research snapshot ranks teams before starting; the last game in its current snapshot is **November 15, 2026**. Never confuse this with actual committee rankings.
- **Trade two seeds** before playing a game, or restore the ranked field. A swap never duplicates or drops entrants.
- **Massive tournaments**: 64-region-style, 68 First Four-style, 128 main draw, and the complete **138-team FBS National Open**, using 10 preliminary games and 118 byes to form a 128-team main bracket; 137 games decide the winner. These are fictional college-football competitions, not NCAA basketball regulations.
- **Readable on mobile**: the bracket atlas renders up to 16 matches on each page; drill into round/quadrant and open any finished game report.
- **New audits**: `docs/ARCHITECTURE_V10.md`, `docs/VALIDATION_V10.md`, `docs/QA_GAUNTLET_V10.md`.

## Not a forecasting service

Game scores, drives and player outputs are reproducible **synthetic, uncalibrated** scenarios. The separate research predictions have historically evaluated accuracy, but their 2026 sample was previously inspected; do not treat them as verified sports lines or market projections. Full athlete names are matched from season roster sources and **do not establish starting status, injuries or playing time**. Statistical thresholds are simulated; real-life player-prop pricing has not been validated. Scores and plays were tuned to **two 2025 unconditional league-level scale moments**, not calibrated to actual team-conditioned scores or individual drives.

## Design / navigation

- **Game**: select Team A, Team B and venue; replay and inspect the result. Read all generated results without configuring model internals.
- **Playoffs**: choose format, simulate entire bracket, inspect a game and optional tournament advancement estimates. Future official formats refer only to rules geometry; entrants require actual committee evidence.
- **Model & Validation**: review Brier/log loss, prediction-interval coverage, conditional player-event evidence, data provenance and uncertainties. Raw named prop distributions are not empirical forecasts.

Original 'PRESSBOX / NIGHT SHIFT' sports editorial identity: deep asphalt and mineral green, signal chartreuse, strong typographic hierarchy (Barlow Condensed, DM Sans and mono numerals), match-level storytelling, useful SVG charts and reduced-motion alternatives. No fonts are bundled or redistributed; network fonts are optional.

## Local run and test

Requires Node >=20 and Python 3; no JavaScript runtime dependencies or API key.

```bash
npm run check
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build
cd dist && python3 -m http.server 4173
```

Open `http://localhost:4173`. `python3 tests/pressbox_browser.py` runs the Chromium inlined-source interaction harness if Playwright/Chromium are installed. It is *not* a real Web Worker or physical iPhone Safari test. The GitHub repo includes refreshed 2025/26 data snapshots absent from some local-source ZIPs.

## Engineering evidence

- Architecture before edit: `docs/ARCHITECTURE_V10.md` (previous `docs/ARCHITECTURE_V09.md` retained).
- Current test evidence: `docs/VALIDATION_V10.md`; previous generator scale: `docs/VALIDATION_V09.md`.
- Model provenance and interpretation: `docs/MODEL_CARD.md`.
- Updated feature map and limitations: `docs/STATUS.md`.
- Data limitations and provider usage rights: `docs/DATA_PROVENANCE.md`.

Original source MIT licensed; source-data licenses, team branding, and NIL rights remain separate.


### v1.4 — exact simulated game-market accounting

Game Simulation now reports **N exact wins, covers, overs, unders, and pushes out of N generated games**. The reference lines are retrospective, synthetic sample summaries—not sportsbook prices. An independently evaluated Elo winner estimate is labeled separately from the fictional game engine; any spread translated from Elo is explicitly an illustrative conversion, not a validated handicap. The model/graph arithmetic and limitations are recorded in [`docs/PROBABILITY_CONSISTENCY_AUDIT.md`](docs/PROBABILITY_CONSISTENCY_AUDIT.md).


## Retro 06 console menu redesign (November 23, 2026)

The current interface includes a period-inspired **graphite / muted-crimson / warm-silver** college-football menu treatment in `src/retro-06.css`. It uses upright **Roboto Condensed** display typography with local Arial Narrow/Arial fallback, rectangular scoreboards, compact data tables, original stadium artwork, reduced-motion support, and touch-first mobile stacking. The same style covers Game, Playoffs, Model & Validation, player box scores, full brackets, research graphs, the 15-second championship sequence, and tournament awards.

- [Full implementation prompt and acceptance contract](docs/RETRO_06_EXECUTION_PROMPT.md)
- [Design audit, data caveats, verification gates and limitations](docs/RETRO_06_VERIFICATION.md)
- [Theme-specific automated regression checks](tests/retro_06_visual_contract.test.js)

**Technical and scientific limits:** this is an independently designed fan simulator, not an EA SPORTS/NCAA product. The generated game engine and athlete props remain synthetic and not validated predictive odds. A visual refresh does not independently verify every 2026 starter, player availability, future outcome or score calibration. Prior theme layers remain in the cascade pending a separate consolidation regression.
