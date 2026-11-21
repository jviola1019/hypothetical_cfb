# GRIDIRON LAB v0.8 — Independent second-pass engineering audit

## Defect / risk register

| ID | Severity | Finding | Resolution / evidence | Residual |
|---|---|---|---|---|
| V08-01 | HIGH / statistical | Prior athlete observed hit percentages were descriptive, yet could be mistaken for forecast odds | Conditional beta-binomial 2025-prior / 2026 sequential research model with clear event-only labels; JS+Python schema and leakage fixtures | True all-game prop probability not supported without appearances, snaps and injury / depth chart history |
| V08-02 | HIGH / statistical | Team score prediction diagnostics omitted predictive interval coverage and distributional error | Frozen 2024 residual distributions with 2025/2026 CRPS, Brier baseline, interval coverage; no synthetic scores used as training data | Drive-level simulation remains synthetic, uncalibrated |
| V08-03 | HIGH / integrity | Historic CFP bracket geometry was not an independent *qualification* algorithm | New pure CFP 12/24 field selector with validated champion/ranking inputs and seven targeted tests; field is expressly hypothetical | Official 2026 committee ranking and future champions not yet determined |
| V08-04 | MEDIUM / reliability | Adversarial game-state perturbations had limited independent invariant checking | Standalone `auditGeneratedGame`, 650 deterministic matches, corruption regressions, overtime guard | Not a statistically calibrated play-by-play generator |
| V08-05 | MEDIUM / security | Remote model artifact could carry nonsensical probabilities, intervals or sample sizes | New fixed-schema bounded fetch adapters and tampered-artifact tests | Client data and local results cannot be tamper-proof |
| V08-06 | MEDIUM / security | Browser fonts could be blocked under restrictive CSP, causing untested typography fallback | Restrict CSP font endpoints while maintaining same-origin scripts and forbidden eval | Google Fonts requires network; offline fallback remains |
| V08-07 | MEDIUM / UX | Score and player-model analytics could be displayed as if they were observed by engine | UI separates empirical score residual evaluation and event-conditional player research; does not show new chart without verified JSON | Native module, worker and Safari rendering not tested |
| V08-08 | HIGH / rights | Publishing raw play-by-play or full player-game observations would risk violating provider redistribution restrictions | Temporary ingest records, public derived capped school aggregates only | Provider license and NIL / publicity requirements require legal review |
| V08-09 | MEDIUM / tournament | Impossible official field or fabricated 2026 committee standings possible if ranking API generated them | Selector requires explicitly passed rankings and champions; no external automatic selection claims | UI does not expose verified official committee selection; selection is programmatic |
| V08-10 | MEDIUM / security | More unbounded data could freeze mobile browser | Research fetch size/time limits, bounded player summary row counts, bounded simulation count and security tests | Memory/latency not characterized on a physical iPhone |

## Distinct reviewers (conducted as separate reasoning and code passes, not as agents)

**Quantitative:** checked training vs evaluation flow, frozen prior rules, single-game vs event-game population, CRPS construction, misleading claims and method limits. No inference of player usage without observed zero participation.

**Football rules:** checked overtime tie resolution, drives/score accumulation, 2026 Notre Dame qualifier, conference AQ mapping and first-round byes; actual CFP policy was cross-checked with published official 2026 and 2027 format pages.

**Frontend and accessibility:** checked no additional matchup controls, data labels, alternative audit table, reduced-motion styling, narrow-screen horizontal overflow, and click-through tournament report.

**Security/reliability:** checked same-origin script CSP, source package size limits, invalid ranking and player-study artifacts, client seed replay and deterministic outcomes, use of bounded exports, and denial-of-service risk.

## What is not certified

External penetration testing, sports-betting suitability, high-fidelity possession and player forecasting, physical Safari/iOS browser operation, uninspected current-2026 matchup data, official future CFP selection and up-to-the-minute roster availability. Do not represent the project as production-certified.

## Verified remote run update

[CI 44884708956](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44884708956), [full-source refresh 44884709038](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44884709038), and [Pages 44884751903](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44884751903) completed successfully on 2026-11-21. Full data metrics and their limitations appear in `docs/VALIDATION_V08.md`. These executions do not constitute native Safari or independent penetration testing.
