# Bridge v2 Current Status

This is the canonical component-level Gateway/Re boundary. Repository priority
is in [Current Status](../../../docs/current/STATUS.md); current authority
convergence is in
[ADR-0006](../../../docs/current/decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md).

## Exact Truth

```text
Gateway/Re source      2.0-preview.77
Re normalized schema  31
Prompt/guide baseline  4 / 5
source state           full tests/audits/build/install verified

built/installed        2.0-preview.77
game                   v0.109.1|c8c577f6|-820620422
built/installed SHA    9d6737b1e34e15b59f4d2d2bad8a239f21d771b0eef25ffedccb8048417edf8d
built/installed MVID   0a945d2d-0787-4f6d-a820-4947936aa6be
last loaded contract   2.0-preview.76
last loaded SHA        56b24ea36a9ad95f15414cd7882ab2b6b32b9459aa47feb204d3290569de9003
last loaded MVID       37f4ce07-1ca7-4942-aec9-868b7d7d4676
last runtime epoch     8ccf81d0e53b467eb6bf46d86ddd86cc
rollback               STS2MCP/.local/deployments/2026-07-29T14-45-17-887Z
```

Preview.77 has a new protocol/DLL identity and inherits no Preview.76 session
grant or evidence. Build and installation are verified. The game is closed;
loaded Preview.77 remains a non-claim until a later cold start.

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

Exact loaded Preview.76 run `run-20260729140216-qi8r24` used source revision
`6ad4fd92...`, Prompt/guide `4/5`, the SHA/MVID/runtime above and
`provenance=unrecorded`. It completed a 172-decision boundary with 170 settled
mutations, one safe pre-execution `choose_treasure_relic` stale refusal and a
normal completed boundary.

It exercised broad ordinary menu/run/map/combat/event/reward/rest/treasure/shop
and Inspection flow. It did not exercise New Leaf mutation, Kifuda or ordinary
shop relic purchase. Preview.75 evidence for relic purchase and New Leaf defect
does not qualify Preview.76/77. Kifuda remains `not exercised`.

## Preview.77 Delta

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

## Clean Closure Inventory

```text
connector shadows                              0
permanent dual reads                           0
production publication paths                   1
production authority resolvers                 1
explicit native contracts                      7
manifest session fallback identities          80
operation-authority branches                   3
persistent fallback claim admission paths       0
mixed explicit/fallback supported Surfaces      4
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
Only a later cold start can establish loaded identity; only exact-runtime
mutation can establish new family evidence.
