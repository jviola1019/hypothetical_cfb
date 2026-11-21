# GRIDIRON LAB / The Football Outcome Engine

**v0.4.0 · editorial redesign · offline-first static website**

A two-tab, mobile-friendly college football simulation laboratory. Choose **Team A**, **Team B** and **home field**—the full matchup report updates automatically. In the Playoff tab, choose a bracket format and optionally change participating teams, then simulate a full tournament and inspect any completed game.

**Important:** model-generated scores, win percentages and athlete prop outcomes are synthetic demonstrations, **not calibrated predictions or betting recommendations**. This is a research prototype, not a production forecasting model. Distinct text labels separate factual 2025 season observations from generated samples.

## Experience

- **Game Simulation:** two team pickers and a home/neutral venue picker. Oversized editorial scoreboard, estimated margin/total, score probability atlas, margin and total histograms, convergence chart, animated drive ledger, final-score breakdown, actual limited-coverage 2025 context and a sourced full-name player sheet.
- **Playoff Simulation:** 13 seeded bracket presets (2–128 teams), graphically browsable bracket, editable team composition, single-tournament simulation, inspectable generated games and 400-tournament championship frequency study. All historical-looking bracket inputs are hypothetical unless explicitly verified.
- **Player props:** full names for **2025 Ole Miss, Georgia, Alabama and Indiana only**. Names are real historical 2025 identities; future game stat lines are **generated**, and simulated player roles are not trained on actual individual usage. Unsupported teams do not receive invented athlete identities. Athlete tables show observed season averages only when the precise underlying stat is verified.
- **Historical record:** selected observed team season averages and limited verified 2025 head-to-head outcomes; no current-season/live feed.

## Appearance

Custom restrained sports-editorial interface (chalk-white paper, midnight pine, vermilion accents), typography using **Barlow Condensed**, **DM Sans** and **IBM Plex Mono**, flat print-desk tables, field geometry, responsive charts and reduced-motion support. Google Fonts load when online; installed/system font fallbacks work offline. No generated logo assets, third-party tracking scripts or paid UI dependencies.

## Run and test

```bash
python3 -m http.server 4173    # open http://localhost:4173
npm run check                  # syntax checks
npm test                       # 16 Node tests
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build                  # copies static site into dist/
```

No `npm install`, API key, commercial service, login or backend is needed for the core demo. `npm run benchmark` reports environment-dependent CPU times. `tests/redesign_browser.py` contains source-injected DOM checks for environments where localhost loading is blocked; it does **not** verify native ES modules or real Web Workers.

## Data expansion

The reproducible optional ingestion stage uses the **CC0 2025–26 NCAA rosters and seasonal statistics dataset** at https://github.com/Dharit13/NCAA_2025-26-Season-Dataset. To refresh, dispatch `.github/workflows/refresh-roster.yml` manually. It fetches public data and applies row, identifier, schema, value, duplicate and safety validation with `scripts/import_ncaa_roster.py`, then writes `public/data/rosters-2025.json`. **The full dataset download and successful refresh remain unverified in this execution environment; it is not necessary for normal site use, and the site does not yet use it to forecast players.** Facts about historical athletes are not permissions to use their likenesses or imply endorsement. The optional workflow will attempt to commit transformed data and may require GitHub workflow write privileges.

CollegeFootballData (https://collegefootballdata.com/) and SportsDataverse (https://github.com/sportsdataverse/cfbfastR) are future pipeline candidates. CFBD requires a free API key; never ship that key to the browser. See `docs/DATA_PROVENANCE.md`, `docs/MODEL_CARD.md`, and `docs/STATUS.md` for all restrictions.

## Deploy on GitHub Pages

Repository: https://github.com/jviola1019/hypothetical_cfb

1. Settings → Pages → source: **GitHub Actions**.
2. Push to `main`; `.github/workflows/deploy-pages.yml` checks, tests, builds and deploys the `dist` directory.
3. Verify Actions is green before trusting `https://jviola1019.github.io/hypothetical_cfb/`.

The GitHub connector can verify source commits, but it does not itself prove the published Pages runtime is healthy.

## Engineering and known limitations

Source is dependency-free JavaScript/ES modules, CSS and SVG. Simulation occurs in a local Web Worker where browser policy permits, with a fallback; results are deterministic for the same engine version, inputs and seed. All 13 formats satisfy single-elimination structural rules under tests; classification of published championship formats is noted in `docs/RULEBOOK.md`.

**Not implemented:** authentic opponent-adjusted EPA, point-in-time historical modeling, calibrated spreads/totals, complete official rankings and selection rules, independent per-player historical forecasting, live scores/rosters/injuries, real market prop lines, production sports data API proxy, fully physically verified iPhone Safari, or a production threat/penetration audit. Do not infer such features from polished visuals.

License: MIT for application code. Externally sourced data retains its own rights and attribution obligations.
