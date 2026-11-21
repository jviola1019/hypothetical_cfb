# GRIDIRON LAB v0.6 — executed tests and evidence

Baseline (pre-modification): Node 20/20; Python 7/7; static build passes.

Revised: Node **31/31**; Python **11/11** (including four new pregame-leakage tests); static syntax checks and build pass. Browser inline-source Chromium run at 390px and 1370px passed team selection, full 138-school picker, research panel under test-fixture data, named test players, 12/24 bracket play and game inspector with no overflow or page exceptions.

Seven specifically reproduced defects and regression fixtures are enumerated in `AUDIT_REPORT.md`. Browser localhost navigation was attempted and blocked by administrator; native workers remain unverified. Full-source historical refresh has completed successfully; the 2025-trained/2026-heldout results are recorded below. Local browser fixtures remain synthetic.

Commands: `npm run check`; `npm test`; `python -m unittest discover -s tests -p 'test_*.py'`; `npm run build`; `python tests/season_browser.py --mobile`; `python tests/season_browser.py`; `npm run benchmark`.

## Full-source chronological benchmark — executed November 21, 2026

- GitHub Actions refresh run 44879469184: success. Generated public/data/research-2026.json (inspected in GitHub).
- Training: 808 completed FBS-vs-FBS games in 2025; chronological holdout: 629 games in 2026, through November 15, 2026. Model: chronological-elo-slope-0.1.0.
- Brier: fitted Elo 0.210914; raw Elo 0.217346; constant 50/50 baseline 0.250000. Log loss: fitted Elo 0.610867; 50/50 baseline 0.693147.
- Mean absolute error: point margin 14.5939; game total 13.1911. RMSE: margin 18.6669; game total 16.3861.
- Home teams won 0.60095 of the holdout; constant 50/50 is a weak baseline. An alternative home-rate baseline must be fitted from training data, not the holdout.
- Exploratory 1500-resample week-cluster bootstrap: Brier difference (fitted Elo minus 50/50) 95% range [-0.057239, -0.023354] from 11 weeks. Sparse clusters and dependent outcomes limit inference.
- Calibration remains imperfect: in the 0.50–0.60 predicted bin, mean predicted 0.55355 vs observed frequency 0.44737 (n=114). Do not label the model perfectly calibrated.
- Neither historical winner accuracy nor scoring-error measurements establish player-prop validity, sportsbook edge, injury/roster usage accuracy or simulation realism.
