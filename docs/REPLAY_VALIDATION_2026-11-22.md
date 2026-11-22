# Gridiron Lab — canonical replay temporal evaluation, 2026-11-22

**Status: Conditioned playable replay DISABLED.** This is a measured actual JavaScript-drive-engine backtest, not merely the separate Elo winner research.

Source: [GitHub Actions completed pregame time-split evaluation](https://github.com/jviola1019/hypothetical_cfb/actions/runs/44997271708). Reproduction scripts: scripts/export_pregame_sim_fixtures.py and scripts/evaluate_playable_generator.mjs. Completed FBS/FBS games and features come from publicly sourced SportsDataverse cfbfastR CSVs. 2023 warms up team state; no result enters its own pregame features. 2024 fits 798 games; 2025 checks 808 games; 2026 checks 676 previously inspected games. There are 48 actual deterministic replay seeds per 2025/2026 fixture. A bounded 2024-only empirical ensemble CRPS grid selected **27-point base, 0.15 per-team volatility and 0 differential margin volatility**.

| Historical test metric | 2025 (808 games) | 2026 (676 games) |
| --- | ---: | ---: |
| Simulated team points MAE | 10.166873 | 10.098604 |
| Flat 27-point baseline MAE | 10.748762 | 10.630178 |
| Winner Brier | 0.219438 | 0.219982 |
| Winner log loss | 0.627793 | 0.630173 |
| Margin MAE | 14.672649 | 14.336693 |
| Total MAE | 13.611128 | 13.763221 |
| Margin empirical CRPS | 10.681878 | 10.356632 |
| Total empirical CRPS | 9.557652 | 9.685637 |
| Nominal 80% margin interval coverage | **71.1634%** | 74.7041% |
| Nominal 80% total interval coverage | 77.8465% | 77.3669% |

**Activation rule:** The 2025 validation must improve score MAE against a flat 27 points/team baseline, achieve Brier no greater than 0.25, and achieve at least 74% actual coverage on BOTH nominal-80% score-margin and point-total intervals. The first two criteria pass; the margin interval **fails**. Research-conditioned game mode must therefore remain disabled, rather than report falsely calibrated odds.

### Outstanding science / source constraints

- The 2025 results were consulted during this development. The 2026 outcomes were previously inspected in other iterations. **Neither is an untouched independent holdout.** Future tuning against these outcomes cannot turn them into pristine validation.
- These results evaluate generated whole-game scores, not exact NCAA play-by-play, stoppages, penalties, actual health/availability, individual snaps, carries/targets or unconditional player props. The research Elo probabilities and simulated game frequencies remain different claims; chart counts stay internally exact.
- The 138-roster 2026 archive (15,187 names) and the six-slot/138-school weekly projection pipeline validate season roster identity, **not 828 confirmed starting roles**. Restricted third-party projection sites cannot lawfully be bulk copied without authorization. Preserve weekly source grades and dated links.
- The next genuine statistical step requires a frozen forecast specification and **new, unexamined future games** for evaluation of scoring, win calibration and uncertainty. Official/licensed game-day lineup and participation feeds plus play-by-play are needed for credible player-prop calibration.
- CI's browser job covers live HTTP-loaded JavaScript modules, real browser Web Workers, 390px/1370px Chromium and Linux WebKit interactions, screenshots, overflow, and playoff bracket state. Physical iOS Safari and comprehensive accessibility are not yet certified.
