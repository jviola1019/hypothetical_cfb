# Model card: GRIDIRON LAB synthetic v0.3.0

**Model type:** rule-based, seeded stochastic football drive generator. **Training status:** none. **External datasets ingested:** zero. **Data cutoff:** not applicable to training; this build uses labels and synthetic season-dependent profiles.

### Quantitative mechanism

`teamProfile(teamId, year)` hashes the team's display ID and year into deterministic latent attack, defense and tempo factors in narrow arbitrary bounded intervals. The factors were **not estimated from historical college football data**. The per-drive outcome generator uses bounded, hand-selected probabilities for TD, field goal, turnover and punt, modified by attack/defense factor ratios and limited home-field adjustment. Possession durations and yardage are generated with bounded distributions. Team scoring comes entirely from these drive events.

`E[margin]` is the sample mean of score_A−score_B. `E[total]` is the sample mean of score_A+score_B. For these generated games, `p_A = sum(1{A wins})/N`, `p_B=1−p_A`, and estimated independent-draw Monte Carlo SE is `sqrt(p_A(1−p_A)/N)`. The conventional A-handicap display is the **negative** of the estimated A margin. Cover frequency counts draws where margin + handicap > 0; pushes are excluded from success counts but not removed from the N denominator (interpreted as unconditional win frequency against threshold).

**Uncertainty:** displayed central 5th–95th percentile ranges measure spread among synthetic simulated scores. MCSE measures sample-count noise only. Neither quantity is a confidence band on a validated real-world prediction.

### Player-stat dependency design

Each generated drive has aggregate run/pass attempts, actual team yards, and an allocation of attempts/targets/completions and yards to QB1/RB1/WR1/WR2/TE1/K1 synthetic roles. Receiver catches never exceed targets; QB passing yards equal total receiving yards and team passing yards; aggregate rush attempts/yards reconcile to team rushing. Passing TDs credit a passer and a receiver, and rushing TDs credit one rusher. There is **no real athlete identity, usage calibration or verified defensive player forecasting**.

### Validation status

**Executable invariants pass** (see `VALIDATION.md`): RNG deterministic; score conservation; complementary win probabilities; constrained player aggregate totals; single winner and N−1 games in each tested bracket. **Out-of-sample historical calibration, Brier score, log loss, CRPS, MAE/RMSE against real results, cross-era calibration, baseline comparisons, injury response calibration, player historical error and spread against observed markets are NOT POSSIBLE** because no actual game dataset was acquired or fitted.

### Known failure modes

Extreme score ranges, unphysical aggregate yards/play distributions, uncoupled defense scoring details, over-time statistical omissions, opponent-independent invented latent team profiles, false impressions of matchup accuracy, mismatch between real CFP qualification and hypothetical seed assignments, seeded RNG not fit for competitive integrity. This version must never be used for financial decisions, gambling value determination or sporting performance claims.
