# GRIDIRON LAB / The Football Outcome Engine

**v0.5.0 · night edition · 2026-first FBS reference · static GitHub Pages**

GRIDIRON LAB is a dark, responsive, dependency-free football simulation laboratory. Under **Game simulation**, the only editable inputs are **Team A, Team B, and location (home/away/neutral)**. It generates a scoreboard, 2026-versus-2025 source-backed comparison, four score-distribution studies, a drive ledger, full-name roster-based illustrative player props where verified identities exist, and an FBS coverage explorer. The **Playoff simulation** tab retains optional format and participant selection to build a bracket, run championship studies, and inspect individual games.

> **Statistical warning:** Scores, player lines, matchup margins, and win frequencies are draws from an uncalibrated synthetic football engine. Observed 2026/2025 records and verified player *roster membership* are real-world descriptive data, **not validated future-game forecasts, starting lineups, confirmed availability, or sportsbook markets**.

## Actual historical coverage and date limitations

- **2026 FBS team catalog:** 138 distinct FBS programs extracted from SportsDataverse's published 2026 FBS schedule, inspected **November 21, 2026**. The source's latest completed score on inspection was **November 15, 2026**. Historical score updates are **not live**; some later games may be absent until the next upstream refresh.
- **2025 FBS team catalog:** 136 distinct FBS programs from the published completed-season schedule. The four previously manually checked school historical reports remain as a fallback if the full archive is unavailable.
- **2026 current rosters:** the GitHub Actions ingestion **succeeded on November 21, 2026**. It verified **138/138 2026 schools, 15,187 roster-listed athlete names**, via SportsDataverse and selectively newer `ncaapyscraper` weekly rows only when their size and position breadth justified replacing the existing school roster. Exact current depth charts and injuries are **not verified**. [See the passed data-refresh job](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44877761545).
- **2025 historical rosters:** **136/136 FBS schools, 15,415 roster-listed names** from the season-matched SportsDataverse roster CSV. Separately validated 2025 CC0 NCAA roster data is historical corroboration, not used to assume 2026 membership. Identifiers remain season-specific.
- **All 138 FBS programs can be selected** for synthetic simulation. Coverage is disclosed per team; a team-selector entry is not a promise of validated individual player props. No API key or paid API is needed to use the static simulator.

Sources: [2026 games](https://github.com/sportsdataverse/cfbfastR-data/blob/main/schedules/csv/cfb_schedules_2026.csv) · [2025 games](https://github.com/sportsdataverse/cfbfastR-data/blob/main/schedules/csv/cfb_schedules_2025.csv) · [2026 rosters](https://github.com/sportsdataverse/cfbfastR-data/blob/main/rosters/csv/cfb_rosters_2026.csv) · [weekly school rosters](https://github.com/fakhar-ud-din/ncaapyscraper/releases/latest) · [2025 CC0 archive](https://github.com/Dharit13/NCAA_2025-26-Season-Dataset).

## Design

The v0.5 **Night Edition** uses charcoal-blue broadcast surfaces, restrained copper signals, thin technical dividers, legible data tables, yard-line illustrations and meaningful distribution charts. Type hierarchy uses **Archivo Narrow** display, **Public Sans** body, and **IBM Plex Mono** stats. Fonts load over Google Fonts online with system fallback offline. All backgrounds, field graphics and analytical SVG charts are original code, not copied logos. Reduced-motion CSS is supported.

## Run locally

```bash
python3 -m http.server 4173     # visit http://localhost:4173
npm run check                    # syntax
npm test                         # deterministic simulation, FBS catalog, roster and tournament invariants
python3 -m unittest discover -s tests -p 'test_*.py'  # offline importer fixtures
npm run build                    # generate dist/ for Pages
python3 tests/season_browser.py --mobile  # optional locally installed Playwright/Chromium
python3 tests/season_browser.py           # 1370px desktop harness
```

No npm runtime dependency is needed. Browser smoke harness tests source in an inline DOM with a mocked Web Worker; it **does not** establish that a physical Safari device or the deployed site has passed.

## Automated free-data refresh

Workflow: `.github/workflows/refresh-season-data.yml`. Trigger with **Actions → Refresh FBS 2025 + 2026 season data and 2026 rosters → Run workflow**, or let its weekly schedule run. It downloads 2025/2026 SportsDataverse schedules, the 2026 roster CSV and optionally the newer released school roster ZIP, then the 2025 CC0 NCAA roster/stats archive, and the 2025 SportsDataverse roster CSV. It rejects malformed schemas, duplicate fixtures, conflicting IDs and implausible values; records source information and last completed game. The workflow publishes only validated `public/data/season-2026.json`, `public/data/rosters-2026.json`, `public/data/season-2025.json`, `public/data/rosters-2025.json` artifacts and commits them to `main`. A downstream Pages workflow rebuilds on successful refresh. **The refresh completed successfully** on November 21, 2026; later scheduled refreshes must be checked separately. See `docs/DATA_PROVENANCE.md`.

If a dataset is absent or rejected, the simulator still runs offline, labels its fallback, and does not invent names. Historical completeness is displayed in the site.

## Publishing

GitHub: https://github.com/jviola1019/hypothetical_cfb

GitHub Pages: https://jviola1019.github.io/hypothetical_cfb/

Set **Settings → Pages → Build and deployment → Source: GitHub Actions**. The `Deploy GitHub Pages` workflow runs tests, builds and publishes `dist/`. Verify run status and actual page load before assuming publication succeeded. For offline hosting, use `npm run build` and serve the `dist/` folder.

## What is not scientifically verified

No chronological model fitting, opponent-adjusted efficiencies, calibrated margin/total/win probabilities, confirmed 2026 depth charts, possession-level player usage, injuries, or betting market comparisons. Whole-season scoring means are retrospective and **must not** be used for historical point-in-time validation. Simplified football drives and playoffs have deterministic structural tests but are not an official NCAA competition prediction engine. See `docs/MODEL_CARD.md`, `docs/STATUS.md`, `docs/RULEBOOK.md` and `docs/THREAT_MODEL.md`.

License: MIT for original application code. Upstream data and athlete name/likeness rights remain with their respective sources and people.
