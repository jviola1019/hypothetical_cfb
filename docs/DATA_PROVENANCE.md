# Data provenance and source coverage — 2026-11-21

The source bundle is independently verifiable against the URLs below. **The `public/data/*.json` snapshots are created only after the upstream importer runs and passes.** Never infer their existence from this documentation. Availability appears in the website's data-status banner.

| Scope | Source | Observed coverage from inspected source | Limitations |
|---|---|---|---|
| 2026 FBS programs and game results | https://github.com/sportsdataverse/cfbfastR-data/blob/main/schedules/csv/cfb_schedules_2026.csv | 138 distinct FBS team names; 888 schedule records, 752 scored; latest completed score `2026-11-15T18:00:00Z`, **not current through Nov 21** | Scores are descriptive season-to-date; no play-by-play opponent adjustments; many 2026 future games unplayed |
| 2025 FBS programs and game results | https://github.com/sportsdataverse/cfbfastR-data/blob/main/schedules/csv/cfb_schedules_2025.csv | 136 distinct FBS team names; 3,831 records, 3,829 scored (includes non-FBS opposition); completed season | Retrospective only; cross-season roster membership differs |
| Current 2026 FBS names/positions | https://github.com/sportsdataverse/cfbfastR-data/blob/main/rosters/csv/cfb_rosters_2026.csv | Public CSV is ~5.1 MB; exact valid FBS player identity counts **not yet established until import** | Source-reported position does not establish participation, depth chart, availability or usage; review underlying reuse terms |
| Supplemental 2026 school roster | https://github.com/fakhar-ud-din/ncaapyscraper/releases/latest | Most recent seen release `2026-11-16`; school JSON reports athletics rosters; pipeline uses it only when >=25 recognized people at a school | Schools update at different times; absence/injuries not verified; MIT source code license is not blanket player likeness rights |
| 2025 athlete identities / historical seasonal totals | https://github.com/Dharit13/NCAA_2025-26-Season-Dataset | ~72,512 published football roster records per source codebook; actual import may vary | CC0 compilation; no permission for athlete images, endorsement or NIL; individual games not reconstructed |
| Manually audited 2025 school references | https://olemisssports.com/sports/football/stats/2025, https://georgiadogs.com/sports/football/stats/2025, https://rolltide.com/sports/football/stats/2025, https://iuhoosiers.com/sports/football/stats/2025 | Ole Miss, Georgia, Alabama, Indiana only, available as site fallback | Historical only; not carried forward to 2026 |

A *program catalog* is not the same as a *validated roster*, and a *roster* is not a *calibrated individual-stat model*.

## Pipeline and data contracts

The `scripts/import_season_schedules.py` importer accepts CSV games with unique `game_id`, season/date, FBS division, valid non-tied scores, and source team identifier. Records after the execution cutoff are excluded; futures are never treated as played. It emits per-school games/wins/losses and scored/conceded points per game, with `lastCompletedGame` and full source URL. `public/data/season-{2025,2026}.json` records are read-only and validated again in-browser.

The `scripts/import_2026_rosters.py` importer accepts 2026 roster CSV, plus an optional ZIP release. It only extracts a minimal first/last/full name and allowed football position labels, reads ZIP members in memory with entry/size limits (never extracts files), rejects HTML-like names, deduplicates and creates `public/data/rosters-2026.json`. School keys are normalized with bounded explicit aliases. A weekly roster replaces, rather than merges with, a previous roster for an individual program if it supplies >=25 usable names. `2026` names are **never inferred from the 2025 roster**. No photographs are distributed.

The `scripts/import_ncaa_roster.py` and `scripts/trim_2025_rosters.py` pair converts the 2025 CC0 data to the historical `rosters-2025.json`, limited to schedule-listed FBS schools. Raw source files aren't retained in the static site. Duplicate games or invalid file fields fail the refresh instead of silently contaminating a forecast.

## Caveats

No free no-key live roster/availability API with universal accuracy is established. CollegeFootballData offers a free-key authenticated service; an API key belongs in a separate secure backend, not GitHub Pages. Sourced season-ending averages are not point-in-time model features and cannot substantiate a valid pregame backtest. No sourced 2026 athlete stat model currently exists; all player props are **illustrative synthetic outcomes** with verified names only when a roster snapshot is loaded.

Retrieval/inspection date: **November 21, 2026**. Upstream rows may be modified; the publish pipeline must update data metadata and run validation on each refresh.
