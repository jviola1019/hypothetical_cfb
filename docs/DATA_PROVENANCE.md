# Data provenance, rights and actual coverage — November 21, 2026

The only actual football observations packaged in the 0.4.0 core are short manually audited 2025 school season excerpts and selected 2025 head-to-head fixtures. **No complete official games, plays, rosters or player games were downloaded into the published core build.**

| Data source | URL | What is included | Rights/limitations |
|---|---|---|---|
| Ole Miss athletics | https://olemisssports.com/sports/football/stats/2025 | 2025 season record, scores/game, conceded/game and five real athlete names with selected season cumulative stats | Factual reference excerpts only; check reuse/attribution policy; full season is NOT pregame-safe |
| Georgia athletics | https://georgiadogs.com/sports/football/stats/2025 | 2025 season reference and four real names | Same limitations |
| Alabama athletics | https://rolltide.com/sports/football/stats/2025 | 2025 season reference and four real names | Same limitations |
| Indiana athletics | https://iuhoosiers.com/sports/football/stats/2025 | 2025 season reference and four real names (not every name has numeric stats) | Same limitations |
| NCAA CC0 2025–26 roster compilation | https://github.com/Dharit13/NCAA_2025-26-Season-Dataset | **Not yet imported**. Optional Github Actions ingestion pipeline is staged: joins `all.csv` and `stats.csv` on unique 2025 athlete ID | Released data CC0 1.0; separate names, likeness and NIL rights; identity and seasonal stats do not establish player availability |
| SportsDataverse cfbfastR | https://github.com/sportsdataverse/cfbfastR | Candidate only; nothing imported | Review original content rights and data-source quality before use |
| CollegeFootballData | https://collegefootballdata.com/ | Candidate only; nothing imported | API key required (free tier availability/rate limits subject to change); keep credentials server side |
| CFP 12 and future 24 format | https://collegefootballplayoff.com/sports/2024/5/29/12-team-format ; https://collegefootballplayoff.com/sports/2026/11/9/24-team-format | Bracket geometry and byes, not official qualification | Effective dates differ; hosted locations not all reproduced |

## Actual coverage

| Category | 2025 reference | Other seasons |
|---|---|---|
| Selectable team names | ~50 curated true school names; fictitious fillers for large brackets | Season IDs used for internal synthetic sim only |
| Observed team record and points/game | Ole Miss, Georgia, Alabama, Indiana | None |
| Selected verified historical fixtures | 5 2025-season matchups | None |
| Named athlete identities | Selected QB, RB, WR and TE slots for 4 schools; 17 player name entries | None |
| Athlete measured full-season stat | Selected categories only, with missing values left null | None |
| Genuine fitted player prop probabilities | **0** | **0** |
| Genuine fitted win/margin/total probabilities | **0** | **0** |
| Verified injuries/weather | **0** | **0** |

## Optional ingestion

`python scripts/import_ncaa_roster.py --roster all.csv --stats stats.csv --out public/data/rosters-2025.json` uses a strict allowlist of fields, per-file size and row limits, unique valid IDs, CSV-formula-safe names, nonnegative counting stats, null-aware numeric parsing, sorted deterministic JSON and source metadata. The full upstream dataset **has not been fetched or validated in this workspace**. `workflow_dispatch` in `.github/workflows/refresh-roster.yml` is a separate human-authorized step; it requires GitHub to fetch and commit a new file.

Import data is supplementary descriptive historical information. It does **not** auto-train or amend the player's simulated statistical forecast; such a change needs a leakage-safe, independently backtested model.
