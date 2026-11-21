# Model card — GRIDIRON LAB simulated outcome engine v0.5.0

**Status:** experimental, uncalibrated. Synthetic game and player stat generator; not a statistically fitted, scientifically validated prediction model.

## Inputs and season semantics

The default comparison and simulation season is **2026**. All 138 FBS program names in the verified 2026 schedule are selectable. The 2025 archive has 136 schedule-listed FBS programs. When `public/data/season-2026.json` or `season-2025.json` is present and validated, observed `games`, `wins`, `losses`, average points scored and average allowed may be displayed; `teamProfile()` also transforms retrospective season averages into simple bounded simulated offense/defense multipliers. **These transformations are arbitrary, not opponent-adjusted or fitted; the aggregates are not pregame-safe observations for past matches.** When actual data is unavailable, the engine uses reproducible seeded synthetic strength proxies.

## Score simulation

Approximate alternating drive generator, with conditional scoring/turnover chances, allocated passes/rushes, yards and touchdowns, and coarse overtime. Simulated scores and teams' box lines obey internal arithmetic rules tested on fixtures. Simulations use seeded hashing and provide sampled mean points, score-margin and total distributions and win share. Sample win frequency MC standard error is √[p(1-p)/N], which is **only computer simulation uncertainty**, not real-world forecasting confidence.

## Athlete identities versus player prop results

The **2026 roster snapshot**, when downloaded, supplies full names and football position codes for recognized schools. Sorting a roster by position to label synthetic QB/RB/WR/TE roles **does not establish who starts, is available, or will receive opportunities**. No individual player usage, injury or depth-chart observations are fitted. If identity is missing the name slot is suppressed, and a fictitious human name is never invented. Past 2025 players are not reused as 2026 identities. All generated player box scores/props are synthetic samples; they are not statistically calibrated estimates of those named athletes.

## Evaluation

Training seasons: 0. Held-out seasons: 0. Empirical coverage: sourced school results/identities only, pending workflow. Proper scores, spread/total accuracy, individual player errors and forecast calibration: **not available**. Intended use: transparent game design and educational exploration. Not suitable for betting, official NCAA selection, fantasy lineup decisions, player assessment or policy making.

## Risk and governance

Data freshness varies by school; latest 2026 game score in inspected source was November 15 while current date is November 21. An import manifest records the source and last-completed game. A verified player name never implies rights to publish photos or endorsements. The site cannot certify historical results as server-authoritative because it's served as static HTML/JS. Future work requires timed cutoffs, protected validation sets, a credible opponent-adjusted fitted baseline, and independent backtests before any predictive skill claim.
