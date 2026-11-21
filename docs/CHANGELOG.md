# Changelog

## v0.4.0 — November 21, 2026

- Replaced the former floating-card dashboard with a bespoke editorial sports-research design: deep pine, warm newsprint, signal vermilion, flat typography hierarchy (Barlow Condensed / DM Sans / IBM Plex Mono), responsive score mastheads, field-inspired graphics and purposeful motion with reduced-motion fallback.
- Reduced game setup to **only two school choices plus home/away/neutral field**. Other game assumptions are fixed inside the documented simulation engine.
- Added a **2025 observed reference layer** for four schools, including factual season metrics, limited historical head-to-head scores, real player names and selected full-season totals. Any model projection remains explicitly synthetic.
- Introduced four custom analytical SVG charts, original possession flow, readable team comparisons, named-player stat and prop tables, fixed prop distribution inspector and clearer playoff hierarchy.
- Added optional keyless CC0 NCAA historical roster importer with two Python fixture tests and manual GitHub Actions refresh. Upstream data has not been ingested or fitted.
- Added four more JavaScript integrity tests (total 16) and revised data/method/security scope disclosures.

## v0.3.0 — November 20, 2026

Initial dependency-free static synthetic football simulator with two tabs, 13 tournament formats, deterministic game and player aggregates, bracket inspection, 12 Node tests, smoke harness, static build and GitHub Pages workflow.

## v0.5.0 — November 21, 2026

- Darker Night Edition design (Archivo Narrow, Public Sans, graphite/navy + copper) replaces the light desk palette. Improved chart contrast and animated broadcast-like score presentation with reduced motion option.
- Expanded 2026 FBS name catalog to all **138** verified schedule-listed programs and separated 2025 **136**-school historical catalog, including year-specific team/roster adapters, coverage explorer, historical reference table, and 2026-first defaults.
- Added free source refresh workflow for 2025/2026 game results, 2026 rosters and 2025 CC0 roster archive, strict schema checks, bounded ZIP parsing, canonical team ID tests, and source cutoff notices.
- Expanded local evidence to **20 Node** tests, **5 Python** tests, and headless Chromium browser checks at **390px** and **1370px**. None are empirical prediction model calibration.

- GitHub Actions refresh run 44877761545 successfully produced source-backed 2026 138-team results and **138 school rosters / 15,187 names**, 2025 136-team results and **136 school rosters / 15,415 names**. Added explicit 2025 season-matched roster importer; numerical prop distributions remain synthetic.

- Audited weekly 2026 roster completeness: later but truncated school feeds are no longer allowed to overwrite broad primary rosters. Published roster entries include per-program source provenance. Added a regression test for the 45-vs-120 player failure.

## 2026-11-21 · v0.7 quantitative audit release

- Added multi-year chronological model comparison; 2024 fitted, 2025 selected, 2026 forward only; home-only, Elo, scoring rate, fixed ensemble, two-feature regularized logistic and coin baselines, Wilson reliability bins, descriptive weekly bootstrap.
- Added score-state continuity, fumble/INT transitions, round-aware CFP site metadata and tournament-state integrity tests.
- Added 2025/26 player-event ETL with a **derived-aggregate-only** public output (12 names per school cap), preserving raw inputs only in temporary Actions workspace. Added actual observed player trend ranges and protected raw-log ingestion boundary.
- New accessible 2026 model reliability SVG plot with intervals, accessible exact data table; source evidence distinct from synthetic prop controls.
- Expanded 39 JS and 19 Python tests, mobile/desktop DOM harnesses and architecture/security/license documentation.
- Verified data workflow, CI and Pages deployment on GitHub; remaining native Safari/worker and live availability validation outstanding.
