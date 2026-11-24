# MASTER IMPLEMENTATION PROMPT — GRIDIRON LAB 26 / RETRO 06
Repository: https://github.com/jviola1019/hypothetical_cfb
Reference build: November 23, 2026. Brand: GRIDIRON LAB, an original, independent simulation.
Status: executable engineering brief for the existing repository, not a claim of EA/NCAA affiliation.

## Mission
Re-create the **information architecture and visual sensibility** of early-2000s
college-football console game menus as a production-quality modern responsive
website. This is not a glossy "retro-inspired" sports poster. Use original assets
only; don't copy, extract, embed, or trace EA SPORTS, NCAA, NCAA NEXT, or team
artwork without separate rights. The existing site carries real 2026 school
names as program identifiers; that is not a claim of game or logo licensing.

The source of truth is the repo, not prior generated AI images. The images
contain wrong football scores, stale rosters, unsupported calibration labels,
inconsistent brackets, invented data, and trademarked art; **none of those
outputs may be treated as runtime data or deployed artwork**.

## Phase 0: Baseline and freeze
1. Inspect the default branch, status, full source tree, package scripts, CSP,
   workflows and Pages configuration, docs/MODEL_CARD.md and
   docs/HERITAGE_DYNASTY_RELEASE.md.
2. Record git head SHA, branch, relevant existing test results, any skipped
   tests, and full browser screenshots at 320, 390, 430, 768, 1024, 1366, 1920.
3. Preserve keyboard semantics, 138 FBS program selection, real season data
   cutoffs, stored provenance grades, simulator APIs, historical evaluation,
   tournament seed lifecycle and statistical integrity. No invented "live"
   lineups, title odds, stats or data source timestamps.
4. Maintain an explicit defect log: reproduction, scope, fix, regression,
   remaining uncertainty. Never overwrite or bypass tests to fabricate success.

## Phase 1: Design tokens and period fidelity
Reference period: NCAA Football 2004–07 menu patterns; genre inspiration only.
Use the following project-owned design decisions:
- Graphite #111318, slate #24272D, black #111318, muted crimson #A52B39,
  silver #E4E3DF, off-white #F1EFE9, restrained focus gold #FFE5AD.
- Real **Roboto Condensed** (weight 400/500/600/700) for game-mode headings,
  table headers and all score numerals; **Arial / Helvetica** for body;
  local Arial Narrow / Liberation Sans Narrow as offline headline fallback.
  Upright typography, not stylized college slab serif, tilted varsity headers,
  glowing script, excessive tracked mono, orange/gold chrome or neon.
- Stadium art should occupy one legible background region. Headers are thin
  game-mode strips, selected options rectangular muted-crimson rows; text
  left-aligned and tabular numerals right-aligned.
- Square corners, 1px gray rules, extremely subtle treatment. Layout relies on
  typography, hierarchy and framing, not large glows / gradients / heavy texture.
- A/B/X/Y visual cues are optional nonfunctional nostalgia, never replacements
  for real accessible labels or mouse/touch controls.
- Keep existing text-first charts and tables; use actual dataset values and
  visually distinguish empirical vs synthetic layers.

The implementation CSS is src/retro-06.css. It loads last in index.html.
The prior skin files currently remain for historical/test compatibility, but
this is the final active retro-2006 design layer. Refactoring them into one
production stylesheet is recommended only after updating all style contracts
and demonstrating browser equivalence; don't silently delete working styles.

## Phase 2: Surface inventory and interaction
### Game
- Team A, Team B, venue pickers; first action clearly SIMULATE GAME.
- Distinct pregame scouting reference (never mislabel it game score or sportsbook).
- A centered final scoreboard, source-separated estimate, quarter/overtime
  table and deterministic generated scorebox.
- Team totals and player box-score tables **before** optional tape/graphs.
- Drive events, play-by-play proxy, personnel provenance, dated 2026 depth-chart
  evidence with expired grades identified, all starter slots source-ranked.
- Do not infer injuries, active starts or athlete props from roster inclusion.
- All named QB/rusher/receiver totals reconcile with generated team totals.
  No double-QB role unless workload evidence warrants it; QBs must be distinct.

### Playoffs
- 2, 4, 12, 24, 64, 68, 128, 138 fields where supported by FORMAT_MAP.
- Explicit official-geometry vs hypothetical / provisional seed labels.
- Ranked 2026 seeds where sourced; editable swaps must never duplicate schools.
- Full scrollable bracket, byes, correct connections, round navigation and each
  game-inspector scorebox. Preserve format-specific preview distinctions.
- Run entire tournament through a real round-by-round progression. Keep
  canonically recorded per-game seeds and results; do not fabricate intermediate
  scores or recompute merely for a visual animation.
- The >=10-second dramatic buildup remains; champion reveal at 11.6 seconds,
  awards at 13.2 seconds, finale at 15 seconds. Reduced-motion substitutes
  must keep state transitions and input accessibility.
- Trophy room: MVP, OPOY, DPOY, title MVP from finalized generated results.
  DPOY's individual takeaways are synthetic attributions, NOT defender-level
  actual tackles / sacks / snaps. Do not show made-up tackles/sacks.

### Model & Validation
- Preserve separately labeled research evidence, synthetic distributions,
  exact win/cover/over/push counts, and their common Monte Carlo denominator.
- Plot: Brier/log loss comparison, reliability vs diagonal with confidence
  intervals, score histograms with proper denominators, event distributions,
  team-strength context, source freshness, roster evidence grades.
- Keep honest negative results: the 2025 interval-coverage failure disables
  the predictive replay adapter; 2026 previously inspected outcomes are NOT
  a pristine holdout. Never add a fake green "Model Validated" status.
- Reuse existing SVG plotting data, axes, labels, hidden states and keyboard
  annotations. Change presentation, not modeling definitions, unless a
  reproduced error necessitates a specific patch and test.

## Phase 3: Accessibility and responsive
- All controls >=44 CSS px tap height; visible focus and skip navigation.
- Body text contrast >=4.5:1 and large text >=3:1 where applicable;
  decorative bars must not be the only carrier of meaning.
- No body scroll overflow at 320, 360, 390, 430, 768, 1024, 1366, 1920 px.
  Internal data-table/bracket scrolling may be allowed with keyboard focus.
- iPhone layout must reorder controls vertically, not squeeze the desktop
  frame; no overlap of score numerals, teams or results.
- Verify screen-reader reading order and semantics where tools permit.
- Motion respects prefers-reduced-motion and no decorative 15-second
  animation blocks the user from seeing results or cancelling.

## Phase 4: Data, security, licensing
- Model invariants: actual outcome seed reproducibility; randomly fresh seed on
  new run, not forced different score; player -> team reconciliation; bracket
  N-1 contests, one champion; no cross-seed stale scoreboxes/awards.
- Review docs/THREAT_MODEL.md and the user's 92-case baseline. Apply cases
  relevant to this static architecture: untrusted dataset markup escaping,
  prototype pollution, DOM XSS, insecure file/path handling, CSP, origin
  restrictions, dependencies, cache poisoning, input bounds, unsafe SVG,
  source tampering and deploy provenance. Mark authentication, SAML, JWT,
  database RLS, WebSocket, password reset and payment classes N/A **only if**
  those attack surfaces truly do not exist. Do not claim comprehensive pen test.
- Verify source/update timestamps and program counts from committed artifacts.
- Keep offline-first/no secret/no dynamic backend and GitHub Pages deployment.

## Phase 5: Stop/go quality gates
Run and retain exit codes:
  npm run check
  npm test
  npm run audit:data
  npm run build
  python3 -m unittest discover -s tests -p 'test_*.py'
  python tests/live_browser.py # hosted CI after build/dependencies
Inspect visual screenshots and DOM computed styles in maintained Chromium and
WebKit, including real ES modules and Worker. Verify clicks, changes, focus,
bracket inspector, 138 format, 15-second ceremony, restored seed and awards.
Real iOS Safari and physical devices remain untested unless observed directly.

Do not merge or announce deployed when CI jobs or Pages are pending/failed.
Use a feature branch + PR for the redesign, leave unresolved blockers listed,
and only release after direct evidence of required checks on the exact commit.
Output: concise before/after design comparison, file manifest, objective test
counts/pass/fail/skip, screenshot evidence links where provided by CI, and
non-certifications / known limitations.
