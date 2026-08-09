# Current Program Plan - A First, Human-Equivalent C

## Product Outcome

Re-SpireAgent uses the real UI information and controls available to a normal
player to complete ordinary single-player runs. C stays a small, adaptable I/O
boundary; A owns interpretation and strategy; D is optional evidence/hints.

## Current State

The HE vertical slice has exact-runtime `preview.1` evidence across ordinary UI
and one complete journey. It exposed successor-waiting, source-gated selectors
and an A-side shop cycle. `preview.2` removes the migration wire shapes and
fixes cycle identity in source/tests; its next gate is exact cold-load and Live
regression, not more source-specific C semantics.

## Delivery Order

1. Build/install/cold-load and verify the coherent `preview.2` artifact.
2. Regress the HE shop-cycle fix, combat-pile selection and slow end-turn/map delivery, then continue
   an ordinary assisted journey; fix only C facts/input integrity defects.
3. Exercise one unknown-source native selector and one `he_pure` journey.
4. Complete Human information parity: hover, focus, tooltip, scroll and native
   page open/read/return as optional UI transitions.
5. Add bounded custom-drawn UI targeting only when a real unsupported panel
   proves structured controls insufficient.
6. Add run lifecycle governance for abandon/return menu while denying
   destructive profile/save/Mod management and quit by default.
7. Shift main effort to A: compact projection, transition interpretation,
   planning, recovery and long-run quality.

## Invariants

- STS2 owns rules and effects;
- exact state/owner/target and one current controller; native operands stay C-local;
- native target/actionability revalidation at delivery;
- request idempotency and unknown-no-retry;
- player-visible information only;
- D never authorizes or executes;
- no V3 action fallback, arbitrary reflection, node path or coordinate input;
- source/test/build/install/load/Live evidence remain separate.

## Deferred

Learning/training, broad Mod compatibility claims, Companion, Workshop binary
distribution, Headless and public Agent SDK are separate programs. V3
qualification OS is not a prerequisite for the HE core.
