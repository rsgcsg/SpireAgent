# Preview.40 Combat Transition And Runtime Progress Guard Closeout

Status: source/test/build/install/load verified; bounded current-MVID Organic
evidence complete for the two combat no-input phases, the Re semantic-cycle
guard, and the command-completion/next-checkpoint split. This report grants no
new action or Inspection permission.

## Problem

Preview.39 correctly stopped calling one post-combat interval unsupported, but
its `post_combat` Context modeled only one half of an exact `CombatRoom`
lifecycle. High-frequency current-build observation also found a short setup
interval before `combat_turn`. Separately, a long Re run could alternate
`shop_room` and `shop_inventory` forever because each Bridge observation
regenerated transport state/action IDs even though no business state changed.

Neither problem justified a universal loading Surface, a generic no-overlay
rule, a new action, or wider authority.

## Source-Bounded Contract

Exact current source shows `CombatManager.IsStarting` is set during combat
setup before `IsInProgress`, while retained combat state and a live
`NCombatRoom` identify bounded post-combat room resolution. Preview.40 models:

```text
combat_transition phase=setup
  transition=awaiting_combat_start

combat_transition phase=resolution
  transition=awaiting_room_resolution
```

Both require current `CombatRoom`, no blocking input owner, combat not in
progress, `no_action`, readiness `settling`, `none_fail_closed`, and zero legal
actions. Setup additionally requires `IsStarting` or absent combat state.
Resolution requires retained combat state and live `NCombatRoom`. Other rooms,
ambiguous ownership, and generic no-overlay states remain unsupported.

Architecture decision: **C, a strong typed shared lifecycle Context with an
independent no-authority Surface**. The alternative one-purpose `post_combat`
Context was too narrow; a universal loading/no-overlay Surface was rejected as
unsupported and permission-obscuring.

## Re Semantic Progress Guard

Re computes a semantic transition identity from normalized pre-state,
selected allowed action, and normalized post-state. It removes only transport
identity fields (`stateId`, `actionId`, expected/observed state IDs, and
inspection IDs). HP, gold, deck, inventory, entity bindings, Surface stage,
and action semantics remain. The second identical semantic transition stops a
bounded run with `repeated_semantic_transition` and records auditable hashes.

This guard does not change allowed actions, model output, Bridge validation,
execution, completion, or game state. It prevents a regenerated-ID loop from
being mistaken for progress.

## Command Completion Versus Next Checkpoint

Bridge v2 confirms an opaque command through an action-specific semantic
witness before Re begins looking for the next stable decision state. Those
facts were previously collapsed: a long enemy turn could make the second wait
time out and label the already confirmed command `executed_unsettled`.

Re now uses `executed_checkpoint_pending` only when the opaque Bridge command
was confirmed and polling observed a different valid state that had not yet
stabilized twice. The next tick performs a fresh read; the action is never
retried. Legacy acknowledgement, unchanged state, read errors, and unknown
Bridge outcomes remain terminal. Cycle detection ignores checkpoint-pending
observations.

## Exact Environment

- game: `v0.109.0|c12f634d|-840572606`
- protocol: `2.0-preview.40`
- Release/installed SHA-256:
  `10d06ac79b63ce2bbbbcdd4c3e391f9c2a6a9fe59a1bf3d0b696d899dfd3b524`
- loaded MVID: `ea77dcfb-2ad7-47a9-9e39-d7b3fc1fe015`
- runtime instance: `6c95a03082874ac1aa8f590d95c20abc`
- Modset: `exact_bridge_only`
- Modset fingerprint:
  `a6b92b0dc1c9b156f6ac7896c7c7deae7a73b8a4c87bf4da6be5695818cd9938`

## Organic Evidence

High-frequency observer `/tmp/bridge-v2-preview40-observe-1784389871`
captured:

- `state_a5162da2cc_4` and `state_a5162da2cc_94`: setup/no-action;
- `state_a5162da2cc_2f` and `state_a5162da2cc_8b`:
  resolution/no-action.

Every state was settling, `none_fail_closed`, zero-action, and carried
`bridge.lifecycle.no_input_transition`. Strict-v2 run
`run-20260718155144-xkdstj` completed 40 decisions: 29 combat, 9 reward-flow,
and 2 map. All 40 had `bridge_advertised` authority, opaque v2 actions,
confirmed Bridge outcomes, and settled Re outcomes. No v1 action appeared.

Earlier organic run `run-20260718154042-ftcmwf` repeated the same semantic
shop open/close transition. The new guard stopped occurrence two as
`repeated_semantic_transition` while preserving the full audit record.

The observer also saw an early-load shared-state build failure and a brief
generic no-overlay state. Both remained unsupported with zero actions. They are
transition debt, not evidence for widening `combat_transition`.

After the checkpoint split, strict-v2 run `run-20260718160447-f8yi48`
completed 8/8 combat actions, including an immediate end-turn, as ordinary
`executed_and_settled`. This is a normal-path regression check; it does not
claim that a natural long-turn checkpoint timeout occurred.

## Verification

- Bridge contract tests: `84/84`
- Re tests: `139/139`
- Re typecheck and production build: passed
- Bridge Release: passed with zero warnings/errors
- installed SHA equals Release SHA
- loaded protocol/MVID/runtime/game/Modset identities match this report

## Remaining Boundary

- No capability, canary, qualification, or Inspection permission changed.
- Generic loading, no-overlay, non-CombatRoom, multiplayer, and unknown-source
  intervals remain fail closed.
- A natural long enemy-turn sample has not yet exercised
  `executed_checkpoint_pending`; fixture tests prove the classification and the
  8-action Organic run proves normal settled behavior is unchanged.
- Runtime data under `Re-SpireAgent/data/runs/` and `/tmp` is local evidence,
  not repository content.
