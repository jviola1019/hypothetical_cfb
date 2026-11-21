# Local validation record — 2026-11-20

Node v22.16.0, npm v10.9.2, Python v3.13.5, Linux x86_64 container. No network npm dependencies.

## Commands actually executed

- `npm run check` — PASS: five JavaScript source files parsed.
- `npm test` — PASS: 12/12 Node tests, 0 failures (includes 300 synthetic game integrity property fixtures across seeds, every bracket format N−1, 20 deterministic fixtures, MC symmetry and prop allocation).
- `npm run benchmark` — PASS measured: single game 1.9 ms; 1,000 games + aggregation 183.4 ms; 12-team tournament 1.9 ms; 24-team 2.1 ms; 64-team 6.2 ms; 128-team 13.3 ms; 50 12-team tournaments 58.7 ms. These are environment-specific, not phone guarantees.
- `npm run build` — PASS: static `dist/` produced.
- `python tests/browser_smoke.py` — PASS: Chromium DOM harness at 1365×860 and 390×844, synthetic game, bracket completion, 11 reports, zero horizontal document overflow at 390 px, no page JS exceptions. Browser navigation to `http://127.0.0.1:4173/` and `file://` was explicitly rejected with `ERR_BLOCKED_BY_ADMINISTRATOR`. To make DOM checks possible, this harness inlines the actual application module source and substitutes a synchronous-scheduler Worker stub: **the real ES-module loader, Worker spawning, live DOM worker cancellation and GitHub Pages deployment were not verified in the browser.**

## Historical statistics

Chronological holdouts: NOT RUN. Training seasons: 0. Validation games: 0. Empirical baseline: NOT RUN. Brier/log loss/RMSE/CRPS: NOT AVAILABLE. No claims of calibration or performance superiority are made.

## Remaining security/browser tests

Firefox, WebKit, physical iPhone Safari, screen-reader testing, high-load Web Worker cancellation, load Lighthouse, dependency/CodeQL GitHub CI, host HSTS/CSP headers and published Pages link require downstream verification. Full 92-entry applicability assessment is recorded in `THREAT_MODEL.md`, not 92 individually executed exploit tests.
