# Data provenance and coverage

Retrieved source specifications: 2026-11-20. **No third-party data file was downloaded into this repository.** Team names are an explicitly curated display list; all team-season rating features are reproducible synthetic values computed from IDs, not fitted real-world features.

| Provider | URL | Observed availability / use | Access and limitations |
|---|---|---|---|
| CFP | https://collegefootballplayoff.com/sports/2024/5/29/12-team-format | Current 12-team bracket descriptions | Official format source; not gameplay statistics |
| CFP | https://collegefootballplayoff.com/sports/2026/11/9/24-team-format | 24-team format from 2027–28 | Official topology and host rules, effective date |
| NCAA | https://www.ncaa.com/news/football/article/2026-08-24/2026-fcs-football-championship-bracket-schedule-selection-info-playoffs | 2026 FCS 24-field description | NCAA page bot-protected during live inspection; search result yielded format summary |
| CFBD | https://api.collegefootballdata.com/getting-started | Historical teams/games/players API described | Free key required; no authenticated retrieval or licensing assessment for data redistribution conducted |
| OWASP | https://owasp.org/projects/Top-Ten | Top 10 2025 | Security framework, not sporting data |
| OWASP | https://owasp.org/projects/asvs | ASVS 5.0 | Security verification references |

## Data coverage matrix

| Years | Team name picker | True game results | Ratings fitted to data | Authentic rosters | Verified player props | Injury/weather |
|---|---:|---:|---:|---:|---:|---:|
| 2010–2026 | Curated labels available (all synthetic season profiles) | 0 | 0 | 0 | 0 | 0 |

**Fictitious demo identifiers:** `lab-001` through `lab-136` and `fcs-lab-01` through `fcs-lab-32` exist solely to fill arbitrary brackets. Do not misinterpret the number of named team options as real NCAA coverage.

No historical dataset license is conveyed by this repository. Additional API usage must comply with the original provider's current terms and should be performed in a server-side pipeline with credentials stored in secrets.
