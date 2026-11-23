---
name: dynasty-football-engineer
description: Build, redesign, test or audit college football simulator and video game UI in Gridiron Lab, including vintage NCAA-inspired UX, live/playable game simulations, bracket/tournament animation, champion MVP/OPOY/DPOY honors, player props, Brier calibration and scorebox checks. Use whenever changing the football model, roster claims, playoffs, game score display, timeline or responsive UI.
---

# Dynasty Systems Engineer — repeatable workflow
You must treat the project as an independent football simulator, not official NCAA/EA software.

## Intake
Read `CLAUDE.md`, `src/app.js`, `src/engine.js`, `src/tournament.js`, `src/tournamentHonors.js`, `src/dynastyCeremony.js`, the relevant data provenance and tests. Check `git status` before edits. Preserve customer data and avoid privileged or invasive writes.

## Model discipline
Validate the existing research and gameplay generators separately. Every displayed game number must come from the canonical game; every historical figure needs a source and cutoff. Use the 2024-fit, 2025-gate, previously inspected-2026 temporal report; NEVER claim an unrun new Brier score or 2026 as pristine. Add new tests for calibration/seed direction, QB2 roster availability, representative Power-Four vs Group-of-Five matchups, turnovers and award ledger reconciliation.

## Design discipline
One deliberate vintage 2000s college game personality; no trendy generic glassmorphism, gradient-blobs or AI template cards. Strong typographic scale (athletic Graduate headings, Archivo body, Red Hat Mono scoreboard), warm campus-program paper, dark collegiate navy, aged brass, burgundy, simplified stadium bleachers and PS2-era scoreboards. New imagery must be original SVG/CSS or verified usable licensed open source. Annotate intended animation with accessible reduced-motion behavior.

## Ship discipline
Keep a versioned, seeded and reproducible tournament. A full simulation animates in phases for at least 10 real seconds before champion reveal; rounds advance genuinely, and all races or interruptions are controlled by cancellation tokens. Build complete scorebox checks, all-round full bracket viewing, and award cards computed from actual simulated team/player statistics. Assert that internal arithmetic agreement is not external real-world accuracy. Browser-test mobile/tablet/desktop with real HTTP JavaScript modules and Web Workers, plus keyboard focus, reduced-motion and orientation. Run all CI, inspect failing logs, fix and rerun until green. Publish only with passing checks. Document unverified physical iOS Safari, true starters and defensive attributions.

## Definition of done
Zero internal scorebox errors, completed bracket games equal N−1, semifinal/final advancement correct, champion matches last final winner, awards cite simulated aggregates, no undisclosed fabricated defensive or player details, at least 10-second presentation under fake clock test and >=10 seconds real browser clock, three main tabs usable at 320–1920 px, zero document-width overflow, no blocking JS errors, no test failures.
