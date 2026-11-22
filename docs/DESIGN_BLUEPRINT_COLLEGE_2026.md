# GRIDIRON LAB — College Championship interface blueprint

**Status:** frozen before implementation, 2026-11-22.
**Baseline:** Github main `8cf6a446ffdfeacca95b7debd8a6c05657b3383e`; local probability-audit draft reviewed with 96 passing JS tests / one skip and a passing static build.

## Brand boundary
Develop an **original** college-football championship visual system inspired by scoreboard and tournament information architecture: navy blue, electric blue, white, varsity gold, sport-specific large numeric typography, bracket connectors, compact data tables and a field-yardline motif. Keep GRIDIRON LAB branding. Do not include the NCAA disk, NCAA wordmark, March Madness or Final Four as branded artwork, trademarked championship lockups, affiliated-site metadata, or unauthorized team logos. Add a visible independent-simulation disclosure.

References: https://www.ncaa.com/scoreboard/football/fbs ; https://www.ncaa.org/championships/brand-licensing/

## User journey
1. GAME: choose two schools and home field; see a complete hypothetical score and box score without scrolling past technical metadata; inspect independent empirical probability, simulated win/cover counts and player stats below.
2. PLAYOFFS: pick official-geometry or hypothetical bracket, inspect model seed list, swap seeds, simulate; focus on champion and fixture path; label unofficial fields.
3. MODEL & VALIDATION: isolate calibration, empirical evaluation and methodological caveats from casual game journey.

## Visual tokens
- Navy foundation `#0a1b32`, steel blue `#153658`, signal blue `#0875d1`, paper `#f4f7fb`, white `#fff`, gold `#f4b746`.
- Typography: `Roboto Condensed` bold sports-headline face; `Source Sans 3` readable body; `IBM Plex Mono` for numerals, sample sizes and technical fields. System fallbacks if Google Fonts is unavailable.
- Geometry: 4–8px corners, 1px rules, squared score fixtures, inset/diagonal stripes, original GL monogram. Deliberately avoid glassmorphism, excessive gradient, irrelevant charts, animated noise or fake team logos.
- Motion: short 150–240ms component transitions and one score entrance, disabled for reduced-motion users.

## Design acceptance gates
- Light and dark text contrast >=4.5:1 for body, >=3:1 for large headings; visible keyboard focus.
- No horizontal document overflow at 320, 360, 390, 768, 1024 and 1370px in maintained Chromium DOM harness.
- Tabs, team controls, bracket, market ledger and CSV/JSON export retain behavior.
- `src/charts.js` palette matches page surfaces, threshold reference lines legible.
- No erroneous implication that synthetic line references are market odds. Count conservation and cross tabs remain exact.
- Baseline tests, build and browser checks pass before GitHub source update; verify new CI and Pages statuses after commit.

## Known limitations
Static hosting and font CDN make external font loading optional. Real Safari/mobile hardware inaccessible in this container. Hypothetical player props and drive generation are not verified future-game probabilities. Source snapshots have season as-of dates; branding is not NCAA affiliation.
