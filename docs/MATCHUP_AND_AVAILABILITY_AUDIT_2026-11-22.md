# Gridiron Lab — 2026 opponent-strength, player-production and availability audit

Audit date: **2026-11-22**. Scope: independent original hypothetical college-football simulator, **not** EA SPORTS or NCAA-affiliated. Latest checked-in results were observed through **2026-11-21 21:00 UTC**. Players, fantasy playbooks, future football outcomes and Elo probabilities remain different evidence categories.

## Problem found and controlled before tuning

The original gameplay model multiplied retrospective 2026 points scored and conceded per game. These raw rates do not control for opponent strength. It ignored existing opponent-adjusted 2026 Elo research when generating drives. Consequently, a high-scoring G5 team could be too likely to beat a more accomplished P4 school; conversely, strong non-P4 programs sometimes were unfairly underweighted. **Blindly penalizing every G5 is not statistically defensible.**

We ran **16 pairs across three venue settings, 300 seeded games per scenario = 14,400 exact generated games** using the project's current 2026 lineups and models. This is an engineering agreement study, **not a prospective accuracy study**. Separate research Elo outputs were a *comparison model*, not betting truth.

| Matchup and site | Legacy replay A win | New 2026 Elo-guided replay A win | Separate 2026 Elo reference |
|---|---:|---:|---:|
| Oklahoma vs Tulsa · neutral | 40.7% | 61.3% | 68.7% |
| Georgia vs Kent State · neutral | 89.0% | 94.3% | 89.6% |
| Ohio State vs Akron · neutral | 78.3% | 91.7% | 85.7% |
| Oregon vs Nevada · neutral | 65.7% | 87.3% | 82.4% |
| Virginia Tech vs Memphis · neutral | 47.7% | 31.0% | 30.5% |
| Clemson vs East Carolina · neutral | 49.7% | 45.3% | 43.2% |

Across 48 cases, mean absolute internal model-reference disagreement fell from **9.43 to 4.80 percentage points**; max from **37.30 to 10.20 points**. The remaining gaps, including sometimes overconfident large favorite simulations, deserve further prospective validation. These numbers are **not** independent win-probability calibration or sportsbook predictions.

### Observed non-P4 results are not a model adjustment factor

An additional descriptive count from [SportsDataverse 2025/2026 completed FBS schedules](https://github.com/sportsdataverse/cfbfastR-data) found that SEC/Big Ten/Big 12/ACC teams played 107 games against American, Mountain West, MAC, Conference USA, Sun Belt and Pac-12 opponents in 2025, with **15 non-P4 winners (14.0%)**. Through November 21, 2026 the comparable record was **3 non-P4 winners in 76 matchups (3.9%)**. Independents such as Notre Dame were excluded rather than falsely treated as G5. The 2026 set was heavily P4-hosted (**69 of 76 matchups**), and matchups are not random; the two years should not be combined into a blanket P4 adjustment. This is descriptive external-data cross-checking, not a new untouched forecast holdout.

The deterministic 2026 game-strength adapter blends opponent-adjusted Elo strength at 82% and raw team offense-vs-defense log strength at 18%, then conserves a geometric game scoring environment. The coefficients are a transparent game-design heuristic **not fitted to a sealed new season**. It never introduces a blanket P4-vs-G5 indicator. The independent historical *pregameScoring* research engine remains unchanged, and its historical coverage gate still blocks activation.

## 2026 player stat and identity validation

The existing engine overstated QB passing yards due to high non-scoring-drive gains and an excessive passing-yard fraction on every simulated possession. New 2026 gameplay limits unrealistically long non-scoring gains and reduces excessive passing allocation; the real-time model's internal accounting and its historical pregame validation are separate.

Illustrative neutral-matchup diagnostics from the 300-run research-conditioned roster view:

| 2026 athlete | Position | Legacy simulated average | Revised simulated average | Observed 2026 per *recorded-stat event game* |
|---|---|---:|---:|---:|
| Luke Fahey (Ohio State) | QB passing yards | 363.5 | 261.3 | 220.8 |
| Gunner Stockton (Georgia) | QB passing yards | 373.8 | 231.8 | 212.7 |
| Trinidad Chambliss (Ole Miss) | QB passing yards | 370.3 | 273.2 | 262.5 |
| DeSean Bishop (Tennessee) | RB rushing yards | source-dependent | 115.9 | 112.0 |
| Jeremiah Smith (Ohio State) | WR receiving yards | source-dependent | 128.4 after WR-share refinement | 135.6 |

The receiving opportunity model uses a shrinkage-weighted 2026 QB game mean rather than an inflated fixed 330-yard denominator. Source-event means are not guaranteed playing-time-adjusted targets, and the model still lacks full targets/snaps denominators. **These means are conditional on a player having a recorded event. Absences or unknown snap denominators were not zero-filled; comparing them with unconditional synthetic games is exploratory.** The player sheet explicitly reports each difference, uses an observed-mean derived *illustrative reference threshold* when supported, and warns about large mismatches.

The old JSON validator silently dropped six schools' entire player-event documents because a runner's 10th-percentile net rushing yards can legitimately be negative. It now allows bounded negatives **only for rushing** and a CI test loads all 138 school documents through the same validator used by the browser.

## Known November 21 availability and starter evidence (expires weekly)

- **Ohio State:** Luke Fahey handled quarterback duties against Nebraska, connecting twice with Jeremiah Smith for touchdowns; school game recap and box score confirm performance. Julian Sayin was reported out for that game with a throwing-arm issue. Source: https://ohiostatebuckeyes.com/news/2026/11/21/football-buckeyes-drop-tightly-contested-game-at-nebraska and https://ohiostatebuckeyes.com/sports/football/stats/2026/nebraska/boxscore/22224
- **Oregon State:** Braden Atkinson was reported sidelined with a hand injury for the November 21 game; Maalik Murphy replaced him and appears in official box-score production. Source: https://sports.yahoo.com/articles/hand-injury-keeps-atkinson-sidelined-183912374.html and https://osubeavers.com/sports/football/stats/2026/utah-state/boxscore/22719
- **Tennessee:** Faizon Brandon started against LSU but George MacIntyre **also played**; the official box score records 6 vs 21 passes, respectively. The single-QB simulator does not reliably apportion a shared-QB game or model injury-driven participation. Source: https://utsports.com/sports/football/stats/2026/lsu/boxscore/29985
- **Ole Miss:** Trinidad Chambliss made his 24th start on November 21 against Wofford. Source: https://olemisssports.com/news/2026/11/21/football-potgame-notes-vs-wofford

These are verified **past-game facts**, not medical diagnoses, injury clearance for subsequent games, or guaranteed future starters. A roster-listed or usage-projected role is explicitly not a verified kickoff starter. Nationwide 138-team game-day starter and complete injury coverage remains unavailable from current public sources without official or licensed team-by-team feeds.

## UI and quality gates

The new original, mobile-responsive game screen includes a bespoke interactive-feeling field-playbook SVG, team-color (curated visual, not numerical ranking) badges, 5 quick-section game-navigation tabs, game-result scorebug, 2026 Elo scouting panel, source-linked availability desk, synthetic player cards showing observed vs modeled stats, and full 850-run worker-dependent outcomes. Animation is disabled when the user prefers reduced motion; game and research still have distinct data sources.

Required verification:

```sh
npm run check && npm test && npm run audit:data
python -m unittest discover -s tests -p 'test_*.py'
node scripts/audit_matchup_reality.mjs /tmp/matchup-audit-2026.json
python scripts/audit_all_fbs_roles.py --roster public/data/rosters-2026.json --weekly public/data/weekly-lineups-2026.json --players public/data/players-2026 --out /tmp/personnel.json --strict
```

The GitHub real-browser job uses **actual ES modules and Web Workers** in Chromium and Linux WebKit across 320/390/768/1370-pixel viewports, including running a 138-team national tournament. Linux WebKit is **not a substitute for physical iPhone Safari testing**.

### Unresolved scientific model gaps

1. This new balancing behavior reduces **cross-model disagreement**; it does not establish genuine game forecast calibration. An unseen future-season holdout must be frozen and scored prospectively.
2. No per-play snap participation, individual pass target denominator, complete injury availability, substitutions/QB splits or official full-schedule starter audit is implemented. Full player props cannot be asserted accurate.
3. The simulator still simplifies possession physics, fourth down, pace, drives and special teams. Heavy mismatch warnings are visible until empirical tests justify more specific gameplay corrections.
4. Official logos, athlete photography, licensed EA SPORTS/NCAA interface assets and paid depth charts were **not** downloaded or replicated without rights.
