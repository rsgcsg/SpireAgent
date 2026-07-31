# Bridge v2 Current Status

> Historical final pre-V3 baseline. Current status is
> [repository STATUS](../../../docs/current/STATUS.md).

This is the canonical component-level Gateway/Re boundary. Repository priority
is in [Current Status](../../../docs/current/STATUS.md); current authority
convergence is in
[ADR-0006](../../../docs/current/decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md).

## Exact Truth

```text
Gateway/Re source      2.0-preview.82
Re normalized schema  31
Prompt/guide baseline  4 / 5
source state           full tests/checks/build/install verified; static audit reviewed

built/installed        2.0-preview.82
game                   v0.109.1|c8c577f6|-820620422
built/installed SHA    f5f4791091f0480432d2c30ce3bd8f946049380fde0ab02053692285c4ee3b4c
built/installed MVID   1e12b8d5-ebcc-4bf1-a4bc-a9b768cdcc0f
last loaded contract   2.0-preview.81
last loaded SHA        411f8cf5f113e4d39db9d95fb6a5b625aae97eaf00c4ab9c0f3cdf93413637b1
last loaded MVID       c09e8569-19af-4a34-b98b-49339300304b
last runtime epoch     4955bd9ec2da426084ea7cff1cc0ae04
last loaded Modset     exact_bridge_only / b1459e82...c785
last Patch             clean_known_owners / ba7852fb...da70b
last permission        migration_exploration / provisional_trial_scoped
last qualification     empty / persistent authority false
rollback               STS2MCP/.local/deployments/2026-07-30T08-38-44-247Z
```

Preview.82 has a new protocol/DLL/catalog identity and inherits no Preview.81
session grant or evidence. Build and installation are verified. The game is
closed; loaded Preview.82 remains a non-claim until a cold start.

## Current Contract

- `state.semantic_state_id` identifies current semantic observation facts.
- `state.authority_projection_id` identifies current relevant authority.
- Composite `state_id` binds both for stale-action protection.
- One publication path binds every action to current state, exact source,
  operands and a typed contract identity.
- `explicit_native_contract` has reviewed owner/source/operand/native
  Commit/Outcome meaning and may enter the exact package lifecycle.
- `manifest_migration_fallback` is runtime-local migration identity. It may
  support encounter trial and minimum-scope quarantine, never durable package,
  reload, supersede or rollback authority.
- Re chooses only advertised action IDs and retains generic polling/successor
  supervision. It reconstructs neither native legality nor completion.

## Latest Evidence

Exact loaded Preview.81 run `run-20260730074240-h09vpq` used source revision
`83d80c2f...`, Prompt/guide `4/5`, the SHA/MVID/runtime above and
`provenance=unrecorded`. It completed a 188-decision game boundary with 185
settled actions and one safe stale refusal. Runs `...80025` and `...80059`
reproduced persistent native map drawing ownership; runs `...80848` and
`...80929` proved that Re made Gateway `rejected/not_applied/stale_state`
receipts fatal. A provider length failure and a human termination are not
Gateway mutation defects.

The evidence supports the P82 repair scope but does not qualify Preview.82.

## Preview.82 Delta

- Exact native map drawing ownership is represented by
  `map_navigation/exit_map_annotation`.
- The action remains opaque and state-bound, uses native
  `NMapDrawingInput.StopDrawing`, and completes on annotation-mode closure.
- Re treats exact non-mutating stale rejection as recoverable fresh-observation
  supervision; unknown outcomes remain terminal and non-retryable.
- Operator process detection no longer mistakes its npm parent command for the
  game.
- The explicit catalog contains 50 contracts and 38 volatile fallbacks.

Preview.81 retained the following contract/authority boundary:

- Protocol reports `contract_kind` on every operation contract and applicable
  qualification; qualification-system schema is `2`.
- Contract kind enters contract digest and exact evidence environment.
- Current durable packages require `explicit_native_contract` in Gateway,
  Re schema and operator ledger.
- Legacy/missing/fallback packages are invalid and fail closed.
- Migration planning classifies fallback durable adaptation as `code_required`
  instead of creating a package.
- Existing volatile encounter fallback is retained; no permission mode,
  mutation owner or Re completion rule was added.
- Thirteen operations across five complete standard-run boundary Surfaces now
  use explicit owner/source/operand/Commit/Outcome revisions.
- Fourteen operations across merchant/reward removal, Scroll Boxes bundle and
  event dialogue now use source-closed explicit revisions.
- Provider completion constants and catalog Witnesses are mechanically paired.
- Reward claim, Rest and combat selectors remain fallback by deliberate
  semantic partition decision, not by accidental omission.
- Supported mixed explicit/fallback Surfaces remain zero. Unexercised
  operations remain evidence-pending, not inferred qualifications.

## Clean Closure Inventory

```text
connector shadows                              0
permanent dual reads                           0
production publication paths                   1
production authority resolvers                 1
explicit native contracts                     50
manifest session fallback identities          38
operation-authority branches                   3
persistent fallback claim admission paths       0
mixed explicit/fallback supported Surfaces      0
Re native-completion reconstruction             0
```

Machine truth is
[`CLEAN_CLOSURE_DELETION_INVENTORY.json`](CLEAN_CLOSURE_DELETION_INVENTORY.json).
Unknown rows may become explicit contracts only after family source/runtime
review; otherwise they remain typed fallback, unsupported or `code_required`.

## Remaining Boundary

Current unsupported/evidence-limited scope includes Crystal Sphere, standalone
manual potion discard, Tutor ownership, unknown generated sources,
non-standard profile/menu paths, multiplayer and incomplete detail families.
New Leaf and Kifuda remain separate `pending exact-runtime evidence` gates.

All available non-Live checks, Release build, backup and install are complete.
The local qualification store is empty. Only a cold start can establish loaded
identity; only exact-runtime mutation can establish new family evidence. See
the [Preview.82 closeout](../../../docs/current/audits/WORKFLOW_C_PREVIEW82_RUNTIME_RECOVERY_CLOSEOUT_2026-07-30.md).
