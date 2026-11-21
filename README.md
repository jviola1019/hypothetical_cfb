# GRIDIRON LAB · PRESSBOX NATIONAL OPEN (v1.0.0)

**A free, offline-first college-football game and playoff simulator.** Pick two FBS teams and a venue, then see one replayable generated game: scoring by quarter, gameplay/drive timeline, full team and named-athlete box, player stat threshold frequencies, empirical *research* estimate where available, and readable probability distributions. The **Playoffs** tab builds 2–138-team hypothetical brackets with individual game inspection. The **Model & Validation** tab holds all technical statistics, model diagnostics, source cutoffs and caveats.

**Direct result:** https://jviola1019.github.io/hypothetical_cfb/  
**Repository:** https://github.com/jviola1019/hypothetical_cfb

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
