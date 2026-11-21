# GRIDIRON LAB v0.6 — executed tests and evidence

Baseline (pre-modification): Node 20/20; Python 7/7; static build passes.

Revised: Node **31/31**; Python **11/11** (including four new pregame-leakage tests); static syntax checks and build pass. Browser inline-source Chromium run at 390px and 1370px passed team selection, full 138-school picker, research panel under test-fixture data, named test players, 12/24 bracket play and game inspector with no overflow or page exceptions.

Seven specifically reproduced defects and regression fixtures are enumerated in `AUDIT_REPORT.md`. Browser localhost navigation was attempted and blocked by administrator; native workers remain unverified. Full-source **2026 held-out Brier/log loss are pending the refreshed research artifact**; no empirical model metrics are supplied by local fixtures.

Commands: `npm run check`; `npm test`; `python -m unittest discover -s tests -p 'test_*.py'`; `npm run build`; `python tests/season_browser.py --mobile`; `python tests/season_browser.py`; `npm run benchmark`.
