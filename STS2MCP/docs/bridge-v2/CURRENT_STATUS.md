# Bridge v2 Current Status

This is the canonical component-level Gateway/Re boundary. Repository priority
is in [Current Status](../../../docs/current/STATUS.md); current authority
convergence is in
[ADR-0006](../../../docs/current/decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md).

## Exact Truth

```text
Gateway/Re source      2.0-preview.79
Re normalized schema  31
Prompt/guide baseline  4 / 5
source state           full tests/audits/build/install verified

built/installed        2.0-preview.79
game                   v0.109.1|c8c577f6|-820620422
built/installed SHA    1032e079ea1344fb42d1dce4f4dc60bfd85b36c1d7db167877d9e475dddf9268
built/installed MVID   d9435656-951f-42f7-8275-7adc67f05572
last loaded contract   2.0-preview.78
last loaded SHA        2f3f6141a8dbc2e286b6a496aa9ed16bb2bee2784fadb585914ef1b73702b948
last loaded MVID       be29a156-4746-4e97-9334-c144e42b1462
last runtime epoch     e08c8bb0d31d4adb8bb4b50454324bf1
last loaded Modset     exact_bridge_only / 0e556089...34b1
last Patch             clean_known_owners / ba7852fb...da70b
last permission        migration_exploration / provisional_trial_scoped
last qualification     empty / persistent authority false
rollback               STS2MCP/.local/deployments/2026-07-30T02-18-23-483Z
```

Preview.79 has a new protocol/DLL/contract identity and inherits no Preview.78
session grant or evidence. Build and installation are verified. The game is
closed; loaded Preview.79 remains a non-claim until a cold start.

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

Exact loaded Preview.78 run `run-20260730010057-w2pqnh` used source revision
`f019ac8d...`, Prompt/guide `4/5`, the SHA/MVID/runtime above and
`provenance=unrecorded`. It completed a 200-decision boundary with 198 settled
mutations, one safe pre-execution treasure stale refusal and a normal completed
boundary; no unsupported, unknown, unsettled, provider or observation failure
occurred.

It exercised broad ordinary menu/run/map/combat/event/reward/rest/shop,
treasure and all three Inspection kinds. It did not exercise New Leaf, Kifuda,
CombatPile selection, shop potion or treasure skip. The evidence supports the
Preview.79 review but does not qualify the new artifact.

## Preview.79 Delta

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
- Preview.78's ordinary combat/shop contracts now have exact-runtime positive
  coverage on their loaded artifact.
- Nine shop, treasure and deck-enchant siblings now use explicit
  owner/source/operand/Commit/Outcome revisions instead of fallback identity.
- Supported mixed explicit/fallback Surfaces are zero. Unexercised operation
  contracts remain session-trial candidates, not durable qualifications.

## Clean Closure Inventory

```text
connector shadows                              0
permanent dual reads                           0
production publication paths                   1
production authority resolvers                 1
explicit native contracts                     22
manifest session fallback identities          65
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
the [Preview.79 closeout](../../../docs/current/audits/WORKFLOW_C_PREVIEW79_MIXED_SURFACE_CONVERGENCE_CLOSEOUT_2026-07-30.md).
