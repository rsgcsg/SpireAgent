# Current Program Plan

## Current Outcome

Create a newcomer-readable Human Environment baseline for the real STS2 Host.
One canonical fair-player world and one execution authority serve any consumer.

## Active Work

1. Complete automated verification of the ownership and naming migration.
2. Build and safely install the resulting artifact.
3. Cold-load and verify exact runtime identity.
4. Exercise `he_pure`, current/stale reads and native-page evidence/recovery.
5. Record exact new-artifact evidence before considering a freeze.

## Invariants

- Game/Host owns rules, RNG, effects and Commit.
- C owns fair-player facts, reads and one Host-local execution authority.
- consumers own projections and strategy but never legality.
- exact native operands stay Host-local.
- incomplete projection, stale identity and unknown results fail closed.
- evidence never transfers across source, artifact, runtime or Host.

Headless, RL/MCTS, learning, clone/fork and major A work are intentionally not
active in this plan.
