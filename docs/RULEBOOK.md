# Bracket rulebook — audited v0.6 (2026-11-21)

The game engine is a **simplified possession simulator**, not complete NCAA rulebook enforcement. College overtime now models:
- First overtime: alternating possessions from opponent's 25-yard line; touchdown may have routine one-point try.
- Second overtime: touchdown requires two-point attempt; no ordinary PAT; two-point try results tracked separately.
- Third overtime onward: alternating two-point tries; a deterministic, symmetric emergency cap at period 40 prevents indefinite loops, so marathon overtime tail probabilities are **synthetic**.
- Every try updates simulated drive/play and overtime-score ledgers. Defensive return scores, penalties, 1-point safeties, and exact play clocks are not modeled.

Bracket structures:
- `fbs12`: 2026–27 official **size and bracket lane geometry**, first-round 5–12, 6–11, 7–10, 8–9; seeds 1–4 byes, then quarterfinals, semifinals, championship. Selection/qualification and exact bowl assignments not reproduced.
- `fbs24`: 2027–28 announced **size and lane geometry**, 1–8 byes, 9–16 host 17–24, second round, quarterfinals, semifinals, championship. Field qualifications and hosting exceptions remain outside model.
- `fcs24`: explicitly **FCS-inspired mixed-field demonstration** because current program catalog includes only five FCS example teams. Not an official FCS selection or champion.
- Other formats: hypothetical fields, no official qualification.

Sources:
- https://collegefootballplayoff.com/sports/2026/8/9/bracket-place-holder
- https://collegefootballplayoff.com/sports/2026/11/9/24-team-format
- https://collegefootballplayoff.com/news/2026/11/9/24-team-expansion
