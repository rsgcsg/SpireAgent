# Current Status

This is the canonical short current-state document for the rebuilt project.

## Program And Architecture

- Current priority: **Workflow C Clean Closure**, before further A/D/P feature
  expansion.
- Mainline: `Re-SpireAgent/` plus the `STS2MCP/` Semantic Gateway.
- Canonical architecture: ADR-0002's Semantic Gateway two-plane boundary,
  ADR-0005's vertical family migration, and
  [ADR-0006](decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md)
  as the current contract/authority convergence decision.
- Gateway v1 mutation and the original root runtime remain retired.

The 2026-07-30 architecture cleanliness reaudit chose verdict **B**: the macro
architecture is correct, but the mixed explicit-contract/manifest-fallback
admission core required replacement. `operation` remains telemetry and a
temporary volatile trial key; it is not sufficient durable authority identity.

## Source, Install And Load

```text
source contract       2.0-preview.79
Re normalized schema  31
Prompt/guide baseline global 4 / state guide 5
source state          full tests/audits/build/install verified

built/installed       2.0-preview.79
game release          v0.109.1|c8c577f6
actual game hash      -820620422
built/installed SHA   1032e079ea1344fb42d1dce4f4dc60bfd85b36c1d7db167877d9e475dddf9268
built/installed MVID  d9435656-951f-42f7-8275-7adc67f05572
last loaded contract  2.0-preview.78
last loaded SHA       2f3f6141a8dbc2e286b6a496aa9ed16bb2bee2784fadb585914ef1b73702b948
last loaded MVID      be29a156-4746-4e97-9334-c144e42b1462
last runtime          e08c8bb0d31d4adb8bb4b50454324bf1
last loaded Modset    exact_bridge_only / 0e556089...34b1
last Patch            clean_known_owners / ba7852fb...da70b
last permission       migration_exploration / provisional_trial_scoped
last qualification    empty / persistent authority false
rollback              STS2MCP/.local/deployments/2026-07-30T02-18-23-483Z
```

Preview.79 changes the whole DLL, protocol and explicit contract digests.
Preview.78 evidence and session authority do not transfer. Source, tests,
build and install are verified; because the game is closed after installation,
loaded Preview.79 identity remains an explicit non-claim until a cold start.

## Latest Runtime Evidence

The latest exact Preview.78 run is
`run-20260730010057-w2pqnh` at source revision `f019ac8d...`, loaded SHA/MVID
shown above, Prompt/guide `4/5`, and `provenance=unrecorded`:

```text
decisions                       200
executed_and_settled            198
safe pre-execution stale          1 (treasure choice; no Gateway call)
normal completed boundary         1
unsupported / unknown / unsettled 0 / 0 / 0
termination                       completed_run_boundary
```

It exercised menu, character select, map, combat, event, reward, rest, shop
card purchase/removal/navigation, treasure choose/proceed, game-over and all
three read-only Inspection kinds. The stale treasure choice was safely refused
before Gateway submit and succeeded from a fresh observation on the next tick.
It did **not** exercise New Leaf, Kifuda, CombatPile selection, shop potion or
treasure skip. It cannot qualify Preview.79.

This is bounded coverage evidence, not Organic evidence, persistent
qualification or durable claim.

## Preview.79 Contract Delta

- Every operation contract projection has `contract_kind`:
  `explicit_native_contract` or `manifest_migration_fallback`.
- Qualification-system schema is `2`; contract kind enters contract and
  evidence identity.
- Only explicit native contracts may be assembled, installed, loaded,
  superseded or rolled back as durable qualification packages.
- Gateway store and operator CLI independently reject legacy/missing/fallback
  package kinds.
- Manifest fallbacks remain runtime-epoch-bound encounter trials so ordinary
  continuity is not replaced with blanket blindness during family migration.
- Re records the kind for provenance and still derives no legality, Commit or
  completion.
- Preview.78's ordinary combat and shop card/navigation contracts obtained
  exact-runtime positive evidence in the completed run above.
- Nine remaining shop, treasure and deck-enchant operations now use reviewed
  explicit contract digests; their source-specific operands, Commit and
  Outcome remain independent.
- The supported `shop_inventory`, `treasure_room` and
  `deck_enchant_selection` Surfaces no longer mix explicit and fallback
  authority. Shop potion, treasure skip and Kifuda remain exact-runtime
  evidence gaps, not inferred qualifications.

## Clean Closure Inventory

```text
connector shadows                              0
permanent dual-read paths                      0
production action publication paths            1
production authority resolvers                 1
explicit native contracts                     22
manifest session fallback identities          65
operation-authority branches                   3
persistent fallback claim admission paths       0
mixed explicit/fallback supported Surfaces      0
bulk candidate startup paths                    0
Re native-completion reconstruction             0
control-history semantic identity inputs        0
```

The source-of-truth machine inventory is
[`CLEAN_CLOSURE_DELETION_INVENTORY.json`](../../STS2MCP/docs/bridge-v2/CLEAN_CLOSURE_DELETION_INVENTORY.json).
The detailed evidence and decision are in the
[2026-07-30 reaudit](audits/WORKFLOW_C_ARCHITECTURE_CLEANLINESS_REAUDIT_AND_CLOSURE_TARGET_2026-07-30.md).

## Boundaries And Next Step

Known typed unsupported/out-of-scope includes Crystal Sphere, standalone
manual potion discard, Tutor's unreviewed owner, unknown generated sources,
non-standard profile/menu paths and multiplayer. New Leaf and Kifuda are
separate `pending exact-runtime evidence` gates; neither may be inferred from
fixtures or another selector source.

The local qualification store is empty and no Preview.78 session state can
authorize Preview.79. Only after a complete game restart may loaded identity
or a new bounded journey be claimed. Unknown mutation remains terminal and
non-retryable. Detailed evidence and non-claims are in the
[Preview.79 closeout](audits/WORKFLOW_C_PREVIEW79_MIXED_SURFACE_CONVERGENCE_CLOSEOUT_2026-07-30.md).
