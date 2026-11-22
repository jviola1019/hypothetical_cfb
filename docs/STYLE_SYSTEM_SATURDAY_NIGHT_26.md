# Saturday Night / 26 — visual system and displayed-data audit

Date: 2026-11-22. Independent website, **not** an official NCAA or EA SPORTS game, product or partnership.

## Visual design specification

The previous interface loaded four conflicting visual overrides (original olive base, college blue/gold, dark refinements, then championship blue/gold). That composition was difficult to audit and retained contradictory foreground rules. The shipped site now uses **structural styles.css + one stadium-edition.css**. Unused historical stylesheets are kept only for repository archaeology; they are not served via HTML.

- **Broadcast/console style:** charcoal black #090c10, opaque carbon surfaces #141a22, warm gray paper #e9e9e5, crisp off-white text, orange-red action cue #ed5a36. No cyan/gold generically glowing panel palettes, neon glows, translucent decorative cards or emoji indicators.
- **Type:** Barlow Condensed heavy/italic for sports scoreboards, headings and navigation, DM Sans for accessible body text, IBM Plex Mono only for data labels and machine metadata. Fonts have readable fallbacks and motion preferences are respected.
- **Original artwork:** public/assets/night-stadium.svg is a locally authored stylized stadium illustration. No protected team marks, sports league logos, traced commercial menus or copied game art. School color accents are a curated **aesthetic approximation only** for a subset of programs, with neutral fallback elsewhere; a color never acts as a substantive sporting model feature.
- **Information hierarchy:** game setup and replay score before statistical panels; past data/probability research clearly separated from one synthetic final; model validation in a separate tab; title shares explicitly fictional. Control surfaces have 44px minimum hit heights, visible keyboard focus and responsive layouts.
- **Browser acceptance:** use the GitHub CI live-browser job with real served ES modules and actual Web Workers in Chromium and Linux WebKit at 390px and 1370px. Inspect screenshots for text collision/contrast. Linux WebKit does not certify a physical iPhone.

Design references are **inspirational only**: public college football broadcast graphic systems and broad genre cues from sports game menus. Never reproduce an EA/NCAA protected scorebug or logo.

## Display-data truth conditions

The repository now runs scripts/audit_published_data.mjs against the actual committed artifacts as a CI and deployment gate. It checks:

- Exact FBS 2026 catalog/season/roster/weekly/experimental-Elo school identity agreement for **138 programs**.
- Actual **15,187 roster-listed names**, derived by adding rosters and compared to the manifest (not independent current-week starters).
- A season feed with **803 scored FBS-involving games** including games against FCS; a 2026 research backtest of **676 eligible FBS-versus-FBS games**. Never display these as the same denominator.
- Source cutoffs for scored game data, Elo research and release metadata are identical; school team records are internally consistent.
- All **828 modeled six-role slots** map to a listed 2026 roster athlete. Provenance categories and counts agree with the strict personnel audit; this checks identity, NOT who started on kickoff.
- The fitted replay adapter remains **disabled** because of failed 2025 nominal-80% margin interval coverage. Do not present it as a calibrated predictive score or unconditional player prop model.
- The game panel shows an illustrative Elo-based win chance (trained on 2025) separately from the multi-year model comparison selected from the 2025 test set. The score pair comes from the research scoring-rate baseline. **Visible point totals and margins are recomputed after rounding the two displayed teams to 0.1 point**. Thus score A + B is the displayed total, and A - B is the displayed margin. Neither is a bookmaker spread.
- Monte Carlo sample counts on market ledgers/histograms retain the same underlying simulation sample. 2026 data carries explicit as-of timestamps and source links.

## Scientific and operational limitations

This audit verifies **internal data integrity and representation of committed records**, not external game-day authenticity for all rosters, player availability, official starting lineups, NCAA licensing, or future forecast calibration. The 2025/2026 periods were inspected during development, so no claims of pristine held-out proof should be made. Current 2026 weekly reports can become stale. Source licensing must be respected for athlete and depth-chart directories.

Primary dataset: https://github.com/sportsdataverse/cfbfastR-data
Player roster supplement: https://github.com/fakhar-ud-din/ncaapyscraper
Statistical report: docs/REPLAY_VALIDATION_2026-11-22.md

## Three additional independently inspected final-score checks

The 2026 upstream schedule file was directly compared against the university-published records for three fixtures selected **before** inserting the automated regression. The data matched exactly:

| 2026 game | Official final | Upstream game ID | University source |
|---|---|---|---|
| November 21, Nebraska hosts Ohio State | Nebraska 31, Ohio State 28 | 401858531 | https://ohiostatebuckeyes.com/sports/football/stats/2026/nebraska/boxscore/22224 |
| November 21, Tennessee hosts LSU | Tennessee 27, LSU 13 | 401856754 | https://utsports.com/sports/football/stats/2026/lsu/boxscore/29985 |
| September 12, Oregon State hosts Texas Tech | Oregon State 24, Texas Tech 35 | 401856783 | https://osubeavers.com/news/2026/9/12/football-beavs-battle-legree-shines-in-near-record-breaking-day |

The verifier runs during the actual historical source retrieval, so a changed or contradictory score blocks publication rather than only raising a passive notice. **This is three independent spot checks, not verification of all 803 scored games, full rosters or kickoff starters.** The complete game/roster data audit remains source-internal and cannot provide full independent authentication.
