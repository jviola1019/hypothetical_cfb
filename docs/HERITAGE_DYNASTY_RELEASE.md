# Heritage Dynasty — model, presentation and scorebook contract
**Release candidate:** 2026-11-23. **Branch:** `feature/heritage-dynasty-showcase-v2`. **Scope:** original independent college-football game styling, NOT official NCAA/EA product or datasets.

## Evidence and design references

- [Anthropic's Agent Skills format](https://platform.claude.com/docs/en/managed-agents/skills): project-local `.claude/skills/<skill>/SKILL.md` with YAML frontmatter and a description. `CLAUDE.md` defines repo-wide behavior. Neither changes the user's account-wide Claude settings.
- [NCAA Next (community, historical visual inspiration)](https://github.com/ncaanext/NCAA06Next) provided a general historical game-era reference. **No EA, NCAA Next, team-logo, or proprietary video-game assets have been copied into this website.**
- Original vintage football artwork: `public/assets/heritage-stadium.svg`. Original CSS type/theme: `src/heritage-dynasty.css`.

## 15-second championship contract

| Presentation phase | Earliest elapsed real time |
| --- | ---: |
| Kickoff, display field and opening titles | 0–2.6 s |
| Genuine canonical `simulateRound` updates | First round 3.1 s; final round at 10.9 s |
| Display national champion | 11.6 s |
| MVP, Offensive Player of Year, Defensive Player of Year, Championship MVP | 13.2 s |
| Open full bracket and trophy case | 15.0 s |

There is no substituted outcome or decorative delay with tournament precomputed instantly. The UI updates canonical seeded game objects one round per timed stage. The round-report verification checks the new bracket and all previous scoreboxes. The initial tournament or a partially played tournament can be resumed through this sequence, and a cancellation token prevents old asynchronous callbacks from changing newer results. A cancelled full simulation restores its pre-run bracket state. Reduced-motion CSS stops decorative animations but retains the ≥10-second progression requirement and actual game results.

## Seed lifecycle and replay-diversity evidence

- A new page load, one-game replay, team/venue change, tournament format change, manual reset, restored ranked field, or newly started tournament after a champion now draws a fresh 32-bit simulation seed using browser `crypto.getRandomValues` (nonsecurity gameplay fallback for legacy browsers). Adjacent run seed collisions are explicitly rejected.
- Continuing the same unfinished tournament deliberately retains its original seed, preserving the legitimacy of already played games. Round match seeds derive deterministically from the *tournament seed, round and matchup index*; independent matches cannot inherit stale scoreboxes from other run seeds.
- The UI prints the single-game seed and tournament seed to make outputs traceable. Replaying the same scenario with the same explicit seed reproduces **the exact scores, drive events, player statistics, bracket and award ledger**.
- `tests/seeded_replay_diversity.test.js` validates 64 game seeds, 16 full 12-team tournament seeds, a 138-school per-match-seed audit, exact stat aggregation into MVP/OPOY/title MVP, defensive-source caveats, and rejection of stale game/award evidence.
- **Distinct seeds are guaranteed for adjacent app actions, not distinct score totals.** Two legitimate football simulations may happen to finish with the same score or even have the same winner. This is measured at scale, not falsified by score manipulation.
- Hosted Chromium and WebKit check visible seed changes on the **Play It Again** button and reset/new-tournament workflow, and changes in the box score and award totals.

## Full bracket and internal scorebook

- For each real simulated game, internal verification covers quarter and overtime sum, drive-event points, scoring team ownership, winner direction, turnovers, and the preexisting `auditGeneratedGame` checks.
- For a complete single-elimination bracket, there must be exactly `participant_count−1` **unique** played games; later round participants must match the previously advanced winners and title champion must win its final.
- Games stay inspectable in the all-round scrollable bracket and in the full scorebox index. Seeded stepwise tournaments have identical actual fixture results to whole-tournament simulations.
- **This is an internal arithmetic and attribution audit, not evidence the simulator's fictional game outcomes match real college football frequencies, scores or individual player prop distributions.** The independent historical evaluation and its release limitations remain unchanged.

## The awards are fictional, and why that matters

- **MVP:** the top aggregate offensive contributor from the tournament champion.
- **OPOY:** top aggregate offensive contributor among all tournament entrants.
- **Championship MVP:** strongest offensive simulated contribution in the title game.
- **DPOY:** deterministic simulation-only attribution of *team* takeaways to possible roster-listed defensive candidates. The generator lacks defender-level tackle, coverage, pressure, sack, snap and actual interception event identities. Its individual DPOY credit is **not an observed or evidence-calibrated player statistic**. Source warnings are displayed in the awards cabinet.
- All offensive totals are derived by adding actual generated `players` box-score objects; source-graded names are roster-linked identities, not proof of real lineup/medical availability.

## Responsive validation contract

GitHub Actions `Verify / Hosted-module Chromium & WebKit` runs an actual localhost-served ES module / Web Worker build at **320, 390, 430, 768, 1024, 1366 and 1920 pixels** in both Chromium and WebKit, including game, 15-second real-timer championship, awards, full 138 bracket, boxscore index, data research tab and no body horizontal scroll. Recorded captures are uploaded as ephemeral workflow artifacts. **Linux-hosted WebKit is not a physical iPhone Safari certification.**

## Mandatory final checks

```sh
npm run check
npm test
npm run audit:data
npm run build
python3 -m unittest discover -s tests -p 'test_*.py'
# CI-only hosted Playwright with actual Chromium and WebKit:
python tests/live_browser.py
```

Release only if all jobs on the final pull-request head are green. The pre-existing playable score generator still fails its 2025 margin-coverage activation gate. Previously examined 2026 games are not a pristine independent holdout and the synthetic defensive awards do not gain forecast-calibration status from source-linked names.
