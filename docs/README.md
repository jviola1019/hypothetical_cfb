# GRIDIRON LAB — The Football Outcome Engine

**Research status: SYNTHETIC DEMONSTRATOR, NOT AN EMPIRICAL PREDICTOR.**

Two prominent experiences: GAME SIMULATION and PLAYOFF SIMULATION. The offline simulator has seeded drive-level scoring, internally reconciled synthetic positional player lines, game and bracket inspection, user-defined thresholds, four calculated charts, bracket editor, and Monte Carlo tournament experiments. The implementation deliberately refuses to imply that these results are trained on actual NCAA outcomes.

## Run

Open using a local HTTP static server: `python3 -m http.server 4173`, then visit `http://localhost:4173`. Or run `npm run dev`. No authentication, API key or npm install is required to use the core application.

`npm test` runs Node's native unit/property tests. `npm run benchmark` measures local CPU time. `npm run build` prepares `dist/` for GitHub Pages. `npm run check` runs Node JavaScript syntax checks.

### Github Pages

For repository `jviola1019/hypothetical_cfb`, the build uses relative asset URLs and `.nojekyll`. Settings → Pages → Build and deployment → GitHub Actions. On pushes to `main`, `.github/workflows/deploy-pages.yml` builds and publishes the static `dist/` folder. Pages deployment needs repository Actions permissions and GitHub Pages settings; initial deployment status must be verified from Actions, not inferred from a committed workflow.

## Scope and non-scope

**Implemented:** 13 tournament presets (12-team FBS and 24-team FBS geometry with verified initial pairings; a 24-team FCS-inspired geometry; 10 custom sizes), 209+ selectable team labels including explicitly fictitious entries, seed editing and swapping, repeatable simulated box scores, game scoring/drive log, quantified synthetic margin/total/championship frequencies, percentile intervals and Monte Carlo sampling error, prop probabilities for synthetic player slots, downloadable bracket JSON, shareable bracket URL with validation, responsive CSS, static build.

**Not implemented:** trained NCAA forecast, observed scores, live feeds, real historical player rosters/props, genuine calibrated win-probability curves, travel/weather/injury model, football play-by-play/down-and-distance simulation, model-adjusted seeding, actual CFP selection criteria/committee rankings, geographic FCS bracket pairing, official full postseason hosting beyond early-round FBS rules, complete regulated OT statistics, authentic player-level performance, identity/access control, hosted backend.

**Use of real school names:** team names in the pickers are identifiers only, not historical results, rosters, ratings or claims of affiliation. The UI cannot produce real player props because no verified roster or player game histories are bundled.

See `MODEL_CARD.md`, `VALIDATION.md`, `RULEBOOK.md`, `STATUS.md`, and `SECURITY.md` before trusting the math in any decision-making context.
