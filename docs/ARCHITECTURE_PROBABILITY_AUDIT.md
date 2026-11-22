# Probability / market graphics consistency audit — plan (written before implementation)

Baseline: `main` 8cf6a446ffdfeacca95b7debd8a6c05657b3383e. Timestamp: 2026-11-21.

## Invariants to enforce
1. Matchup-specific win counts and share must derive from the identical N simulated games. A-wins + B-wins = N; every displayed fraction has numerator and denominator.
2. Synthetic point spread is written from Team A's perspective. Team A covers iff margin + spreadA > 0; B covers iff < 0; pushes if =0. CoverA + CoverB + spread pushes = N.
3. Total points = scoreA+scoreB. Overs + unders + pushes = N. Reference line must be visibly identified as GENERATED, not a bookmaker quote or empirical forecast.
4. The joint win/cover contingency table, marginal counts, and percentages must reconcile exactly for a given N. A-win and A-cover are different events; favorite/underdog scenarios include win-but-no-cover outcomes.
5. Histogram bin labels and counts must reflect the underlying values; chart probability denominators always sum to N, with accessible counts and labels.
6. Empirical Elo win probability and empirical score-center margin can disagree because they were trained independently. Do not silently display the contradictory margin as *the* Elo-based spread. Instead derive a single sign-consistent, explicitly heuristic Elo-implied margin and retain the independent score-center estimate as separate diagnostic evidence.
7. Async result must carry the configuration identity used when computing; never show stale results after a matchup change or worker failure. Browser worker/fallback must compute same summary algorithm.
8. Existing data provenance, roster identities and game/tournament structure must remain unchanged.

## Audit baseline (source-verified)
- Existing `src/engine.js` `outcomeSummary` returns pA and marginal distribution but zero cover/over counts; UI shows no win count or cover denominator.
- Existing `src/research.js` returns Elo pA and independent scoring-derived expectedMargin. A sweep of 28,359 ordered school pairs and venues found 2,301 configurations (8.11%) with pA >55% but negative score margin, or pA <45% but positive score margin. This is a material presentation inconsistency, not evidence either model was intentionally trained to yield one coherent spread.
- The synthetic histogram currently marks 0 on the margin chart and sample mean on total chart, with no actionable cover and total outcome table.

## Execution order
A. Implement pure `marketAudit` calculations + differential/property tests and fake edge-case fixtures.
B. Wire the identical summary into Node fallback and module worker. Keep generation unchanged.
C. Add a small read-only simulated win/cover and over/under table, explicitly marked hypothetical, below the result; link histogram markers to the same reference thresholds.
D. Resolve research probability/margin sign conflicts without inventing calibration: Elo-implied margin using transparent, fixed points-per-log-odds coefficient labeled an illustrative translation. Evaluate sweep and compare with old independent score center.
E. Re-run syntax, unit/property, build, browser harness, live GitHub CI. Record evidence and limitations.

## Release gates
- Fail if any conservation/round-trip invariant fails.
- No unexplained disagreement between a displayed probability and the numeric figure its label says it implies.
- No claims of market odds, external spreads, player-prop calibration, native iPhone Safari, or fully calibrated drive generator.
- Do not call Pages deployed until its workflow shows success on the new commit.
