# Retro 06 design / verification record
Baseline: main @ 4bbafc4c3758813acfaa5f67fef63c3e666c264d (2026-11-23).
Branch: design/retro06-authentic-console.
Owner: independent GRIDIRON LAB project, not EA SPORTS or NCAA.

## Defect and corrective action
The existing entrypoint layers styles.css, stadium-edition.css, cartridge.css,
and heritage-dynasty.css; they disagree on brand fonts, page colors, border
geometry and the appearance of charts, awards, brackets and scoreboards.
Prior image mockups repeatedly introduced copyrighted logos, fake model success
badges, conflicting scorelines and typography unrelated to period game menus.
They are NOT deployed assets.

A final src/retro-06.css layer establishes one intended visual system for the
current build. It uses genuine Roboto Condensed (loaded if available) with
Arial Narrow/Liberation Sans Narrow/Arial fallback; gray/graphite surfaces,
warm silver typography, a single muted-crimson selected state, squared panels,
compact boxscores, restrained stadium backgrounds and 44px controls. Existing
project-authored heritage-stadium.svg is reused. All working app DOM, labels,
provenance, seed flow, and the 15-second real tournament ceremony remain.
Active graph marks in src/charts.js and inline app-generated SVGs use a neutral
slate / crimson sports palette. No modeling coefficients, inputs or objectives
have been changed by the visual patch.

## Included surfaces
- Header / main navigation / game setup (2 programs, venue, replay).
- Pregame scouting HUD, scorebug, quarter/OT score, generated seed and report.
- Team and player scoreboxes, possession tape, roster/role confidence,
  synthetic player distributions and exact market-count ledger.
- Playoff format controls and accessible seeded bracket (including 138 FBS),
  tournament theater, all-round scorebox index, championship animation.
- Tournament MVP, OPOY, DPOY and championship MVP cards.
- Research model comparison, reliability, score uncertainty, source coverage,
  roster freshness, tables, histograms and accessibility.
- Compact mobile navigation, stacked controls, scrollable tables and brackets.

## Scientific acceptance boundaries
- Simulated drive/score/player props remain synthetic and uncalibrated.
- The trained 2025 comparison is distinct from the fictional gameplay engine.
- Previously inspected 2026 is not a pristine external holdout.
- Individual defensive award credits are synthetic team-takeaway allocations,
  not verified tackle/sack/interception events.
- Source-ranked 2026 roster roles do not prove actual game-day starts.
- Adjacent random seeds must differ; actual outcomes need not always differ.
- Exact wins, covers and totals must reconcile to one set of N samples.
- Official 2026 CFP geometry never implies final committee qualifiers.

## Verification gates (only report executed results)
1. npm run check (syntax and core modules)
2. npm test (all Node contracts, simulation, bracket and seed integrity)
3. npm run audit:data and strict FBS personnel audit
4. python3 -m unittest discover -s tests -p 'test_*.py'
5. npm run build
6. Hosted real-ES-module/Web-Worker Chromium and WebKit at
   320/390/430/768/1024/1366/1920 pixels. Inspect screenshots in
   gridiron-real-browser-screenshots CI artifact (when produced).
7. Verify all primary tabs, controls, selected menu color, actual CSS font
   family, body width, graph/table contrast, 15-second championship,
   awards, 138-school bracket, accurate scorebox + no JS exceptions.
8. Deployment: confirm the exact main commit's GitHub Pages deployment
   succeeded, then inspect published page. CI success is not itself deployment.

## Security and provenance
No new executable third-party JavaScript, backend, secrets or credentials.
CSS font loading is optional and CSP already restricts font endpoints; local
fallback typography must remain usable without remote font loading.
The 92-case application security baseline must be scoped to actual attack
surfaces documented in docs/THREAT_MODEL.md; server authentication/DB issues
cannot be claimed 'tested' on a static site with no such components.
Browser platform checks do not certify physical iPhone Safari, WCAG, full
penetration testing, or licensing for all upstream source datasets.

## Known engineering tradeoff
Four legacy stylesheets remain in the HTML to preserve existing contracts;
the new, last-loaded retro-06.css is their intentional final presentation
authority. This is a transitional cascade, not yet a fully consolidated
single source stylesheet. Follow-up consolidation requires replacing
historical CSS-specific test contracts, eliminating dead imports, and taking
full cross-browser screenshots before and after, not deleting styles blindly.
