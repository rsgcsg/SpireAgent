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
source contract       2.0-preview.77
Re normalized schema  31
Prompt/guide baseline global 4 / state guide 5
source state          full tests/audits/build/install verified

built/installed       2.0-preview.77
game release          v0.109.1|c8c577f6
actual game hash      -820620422
built/installed SHA   9d6737b1e34e15b59f4d2d2bad8a239f21d771b0eef25ffedccb8048417edf8d
built/installed MVID  0a945d2d-0787-4f6d-a820-4947936aa6be
last loaded contract  2.0-preview.76
last loaded SHA       56b24ea36a9ad95f15414cd7882ab2b6b32b9459aa47feb204d3290569de9003
last loaded MVID      37f4ce07-1ca7-4942-aec9-868b7d7d4676
last runtime          8ccf81d0e53b467eb6bf46d86ddd86cc
rollback              STS2MCP/.local/deployments/2026-07-29T14-45-17-887Z
```

Preview.77 changes the whole DLL and protocol identity. Preview.76 evidence and
session authority do not transfer. Source, tests, build and install are
verified; because the game is closed after installation, loaded Preview.77
identity remains an explicit non-claim until a later cold start.

## Latest Runtime Evidence

The latest exact Preview.76 run is
`run-20260729140216-qi8r24` at source revision `6ad4fd92...`, loaded SHA/MVID
shown above, Prompt/guide `4/5`, and `provenance=unrecorded`:

```text
decisions                    172
executed_and_settled         170
safe pre-execution stale     1 (choose_treasure_relic; no Gateway call)
normal completed boundary    1
termination                  completed_run_boundary
```

It exercised menu, character select, map, combat, event, reward, rest,
treasure, shop card/removal, deck removal/upgrade, game-over and read-only
Inspection. It did **not** exercise Preview.76 New Leaf mutation, Kifuda, or
ordinary shop relic purchase. Preview.75 contains an ordinary relic purchase
and the New Leaf defect reproduction, but cannot qualify Preview.76/77. Kifuda
remains `not exercised`.

This is bounded coverage evidence, not Organic evidence, persistent
qualification or durable claim.

## Preview.77 Contract Delta

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

## Clean Closure Inventory

```text
connector shadows                              0
permanent dual-read paths                      0
production action publication paths            1
production authority resolvers                 1
explicit native contracts                      7
manifest session fallback identities          80
operation-authority branches                   3
persistent fallback claim admission paths       0
mixed explicit/fallback supported Surfaces      4
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

All currently available non-Live work is complete. Only after a complete game
restart may loaded identity or a new bounded journey be claimed. Unknown
mutation remains terminal and non-retryable.
