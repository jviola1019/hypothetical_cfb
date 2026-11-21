# Pressbox / Design and usability audit — 2026-11-21

## Scope and baseline
Current GitHub main, the 2026 roster-aware game surface, model and tournament screens. Baseline on local source: 84 Node tests pass with one optional remote-data test skipped; 42 Python tests pass with one skip; static build and maintained source-injected Chromium smoke pass. A native iPhone Safari audit was not possible in this environment.

## Defects and responses
| Priority | Observed issue | Implementation |
|---|---|---|
| P1 | Roster and personnel cards pushed the payoff below the first screen | Scoreboard moved immediately below the three-field picker |
| P1 | Charts preceded readable player/team box scores | Place team/player tables first; collapse optional drive charts into a native details element |
| P1 | Full-DOM redraw cleared keyboard focus | Restore focus to equivalent control and move focus to opened game inspector |
| P2 | Narrow scoreboard crowded team names | Constrained mobile scoreboard layout and resized number typography |
| P2 | No keyboard skip navigation | First-focus skip link and focusable main region |
| P2 | Horizontally scrolling tables lacked keyboard affordances | Focusable labeled regions, maintain natural scrolling |
| P2 | UI claimed a fixed 400 title samples despite lower fallback | Replaced with sample-size-neutral copy; computed output uses actual sample count |
| P3 | Stale version label and overpromotional intro | Season-specific source label and plain-language controls |
| P3 | Small controls and weak focus distinction on paper surfaces | Minimum-sized controls and dark focus outlines on light background |

## Visual system
Retain the dark stadium-green sports score aesthetic and one functional signal color. Barlow Condensed remains the display face, DM Sans body copy, IBM Plex Mono measured data. Incremental visual rules live in src/refinements.css rather than adding overrides into the core CSS.

## Verification
- Existing unit/property, Python and build checks rerun after editing.
- New automated static design-contract checks enforce hierarchy, focus semantics and responsive typography.
- Maintained source-injected Chromium harness checked viewport widths 320, 360, 390, 768, 1024 and 1370 CSS pixels: no document overflow, keyboard skip link, input focus restoration, tab focus retention and accessible game-tape controls.
- Local Chromium checks do not prove real ES module network loading or native Web Worker/Safari behavior. Physical iOS and complete WCAG conformance remain unverified.

## Modeling disclosures preserved
Roster-listed athletes are not guaranteed starters. Simulated score, box score and prop outcomes are hypothetical and not validated betting markets. Official CFP seeding is separate from provisional Elo-based fantasy fields.

## GitHub Pages rollout incident
The first design-audit Pages workflow passed checkout, Node tests, build and artifact upload, but deploy-pages returned zero indexed artifacts immediately after upload. The workflow now grants `actions: read` and polls artifact metadata before deployment. This is a CI artifact discovery / eventual-consistency incident, not a football-code or build failure. The final release is considered deployed only after a successful Pages run.
