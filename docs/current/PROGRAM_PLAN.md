# Current Program Plan - Human Environment C, A First

## Outcome

Agents use one fair-player environment boundary to play ordinary STS2. Live
and future Headless Hosts implement the same Human Environment meaning while
Host control, strategy, training and evaluation remain orthogonal.

## Current State

Preview.3 completed broad exact-runtime HE mutation and a resumed `he_pure`
journey, but exposed ambiguous targeted actions and discarded visible combat
context in Re. Preview.4 fixes those contract/consumer defects and unifies the
read path. It has source and automated evidence only until cold-loaded.

## Delivery Order

1. Build, install and cold-load Preview.4; verify exact SHA/MVID/runtime.
2. Run a short multi-enemy combat action and one state-bound read, including a
   stale-read refusal.
3. Run one ordinary `he_pure` journey and retain selector-loop failures as A/Re
   evidence rather than changing C authority.
4. Complete missing human information parity.
5. Shift normal product work to A strategy, planning and recovery.
6. Add a second Host and conformance fixtures before freezing C 1.0.

## Invariants

- Game/Host owns native truth and legality; C owns fair-player truth and input.
- Exact operands remain Host-local.
- Observation facts do not depend on candidate publication.
- Publication and execution both bind the current snapshot and interaction.
- Requests are idempotent; unknown delivery is never retried.
- D never authorizes or executes.
- Evidence never transfers across source, artifact, runtime or Host.

Full Headless, RL, MCTS, learning, clone/fork, vectorization and arbitrary Mod
compatibility are intentionally deferred.
