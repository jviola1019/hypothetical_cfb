# GRIDIRON LAB 1.0 — Second-pass engineering gauntlet

**Method:** Distinct quantitative, football, user-experience, security and reliability source reviews in the same execution session. This environment has **no general-purpose subagent runner**; no independent human or separate AI reviewers were claimed. Each area lists checked properties and residual risks.

## Quantitative reviewer

- Found unsubstantiated alphabetical tournament seeding. Replaced it with installed 2026 Elo research artifact order, with model version, source date, coverage and labeled fallback. No external CFP committee endorsement.
- Verified no 2025 athlete roster fallback for 2026 simulation. A 2026 event-summary athlete must match a genuine 2026 same-team roster full name. Data are not current starters.
- Fixed worker/main-thread mismatched athlete selection caused by differing player-evidence inputs. Independent Node worker-message parity reproduces entire prop distribution and player name.
- Model rating is a game-design **seed order**; outcome generator is not using Elo as a calibrated scoring model. 2026 outcome data previously examined, so no pristine post-tuning accuracy claims.

## Football and tournament reviewer

- Tested all 13 user-selectable formats from 2 through 138. Each completed bracket has N−1 games and exactly one title winner; no duplicate participants or invalid elimination returns.
- National Open has ten 2026-eligible preliminary games and 118 advances to round of 128. 68-team March concept has preliminary First Four-style stage; **not NCAA basketball tournament rules**.
- Official CFP 12 and 24 presets only claim **bracket geometry**. Authentic qualification still requires external committee and champion data. FCS mixed-field demo is not exposed as an official 2026 FCS field.
- Simulated per-game reports remain separately seeded and inspectable. Football play-by-play remains a coarse stochastic generator, not observed-drive calibrated.

## Frontend / accessibility reviewer

- 2026 roster coverage above all generated player lines; provenance chips, paper-style model seed sheet, seed swap console, expandable source ranking and paginated four-lane bracket atlas.
- Mobile at 390px uses one fixture column and an expandable ranked field rather than reducing 138 cards into tiny targets. Screen-wide overflow tests pass.
- Checks for focus outlines, labels, reduced-motion mode, color pairing. Screen reader navigation and full WCAG acceptance need independent tooling.

## Security / reliability reviewer

- Ids validated against canonical 138 FBS catalog; seed swaps validate indices, distinct participants and correct lock state; simulation sizes bounded; malicious roster/evidence payloads rejected.
- No API keys, authenticated data proxy or private user data. Browser is only a local deterministic simulator; client-side brackets are not tamper-proof authoritative results.
- Live data snapshots are local static JSON from public GitHub, with source cutoff and installation guards. Worker messages include season-matched athlete evidence; Node isolation parity passed.
- Unable to run real iPhone Safari and full penetration tests; these are explicitly not accepted as complete.

## Prioritized residual work

1. Obtain and legally ingest observed full-game participation/snap denominators and drive-state data, then calibrate conditional player volume and possession outcomes on strictly forward held-out seasons.
2. Verify official committee selection and on-campus hosting rules from validated season-effective records; maintain separate hypothetical tournament labels.
3. Execute real HTTPS Pages browser tests in native Safari and screen-reader navigation, with memory and animation budgets.
4. Run comprehensive dependency, CSP, supply-chain and asset-source threat testing beyond the current negative fixtures.
