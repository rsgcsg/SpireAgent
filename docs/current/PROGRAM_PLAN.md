# Current Program Plan - Human Environment C, A First

## Outcome

Agents use one fair-player environment boundary to play ordinary STS2. Live
and future Headless Hosts implement the same Human Environment meaning while
Host control, strategy, training and evaluation remain orthogonal.

## Current State

Preview.4 completed two broad exact-runtime HE journeys and proved exact
card-subject/enemy-target delivery without unknown mutation. It also exposed a
remaining architecture defect: finite action expansion still defined parts of
canonical observation and silently capped combinations. Preview.5 fixes that
coupling and has source/automated evidence only until cold-loaded.

## Delivery Order

1. Cold-load Preview.5 and verify exact source/build/install/load SHA/MVID and
   runtime. Current-machine build/install has succeeded.
2. Run one action using a complete bound-action projection and one state-bound
   read, including stale refusal.
3. Run one ordinary `he_pure` journey and confirm no truncated projection or
   unknown delivery.
4. Complete missing human information parity.
5. Shift normal product work to A strategy, planning and recovery.
6. Add a second Host and conformance fixtures before freezing C 1.0.

## Invariants

- Game/Host owns native truth and legality; C owns fair-player truth and input.
- Exact operands remain Host-local.
- Observation facts and interaction capabilities do not depend on finite
  consumer projection.
- An incomplete finite projection never grants authority.
- Publication and execution both bind the current snapshot and interaction.
- Requests are idempotent; unknown delivery is never retried.
- D never authorizes or executes.
- Evidence never transfers across source, artifact, runtime or Host.

Full Headless, RL, MCTS, learning, clone/fork, vectorization and arbitrary Mod
compatibility are intentionally deferred.
