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
source contract       2.0-preview.78
Re normalized schema  31
Prompt/guide baseline global 4 / state guide 5
source state          full tests/audits/build/install verified

built/installed       2.0-preview.78
game release          v0.109.1|c8c577f6
actual game hash      -820620422
built/installed SHA   2f3f6141a8dbc2e286b6a496aa9ed16bb2bee2784fadb585914ef1b73702b948
built/installed MVID  be29a156-4746-4e97-9334-c144e42b1462
last loaded contract  2.0-preview.77
last loaded SHA       9d6737b1e34e15b59f4d2d2bad8a239f21d771b0eef25ffedccb8048417edf8d
last loaded MVID      0a945d2d-0787-4f6d-a820-4947936aa6be
last runtime          8dbfab27b2e5474d92fd0d9dfb197083
last loaded Modset    exact_bridge_only / 60c919e5...41f5fb
last Patch            clean_known_owners / ba7852fb...da70b
last permission       migration_exploration / provisional_trial_scoped
last qualification    invalid_fail_closed (legacy schema-1 ledger)
rollback              STS2MCP/.local/deployments/2026-07-29T15-40-32-760Z
```

Preview.78 changes the whole DLL and protocol identity. Preview.77 evidence and
session authority do not transfer. Source, tests, build and install are
verified; because the game is closed after installation, loaded Preview.78
identity remains an explicit non-claim until a later cold start.

## Latest Runtime Evidence

The latest exact Preview.77 run is
`run-20260729145711-kh8d6k` at source revision `913c057a...`, loaded SHA/MVID
shown above, Prompt/guide `4/5`, and `provenance=unrecorded`:

```text
decisions                    94
executed_and_settled         91
safe pre-execution stale     2 (reward choice; no Gateway call)
normal completed boundary    1
termination                  completed_run_boundary
```

It exercised menu, character select, map, combat, event, reward, rest, shop
card purchase/navigation, game-over and read-only run-deck/combat-piles
Inspection. It did **not** exercise New Leaf, Kifuda or CombatPile selection.
Its combat and shop evidence motivated the Preview.78 migration but cannot
qualify Preview.78. Kifuda remains `not exercised`.

This is bounded coverage evidence, not Organic evidence, persistent
qualification or durable claim.

## Preview.78 Contract Delta

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
- Ordinary `play_card`, `use_potion`, `end_turn`, `proceed_shop`,
  `close_shop_inventory` and `purchase_shop_card` now use reviewed explicit
  contract digests. Shared mechanics do not merge their source-specific
  operands, Commit or Outcome.

## Clean Closure Inventory

```text
connector shadows                              0
permanent dual-read paths                      0
production action publication paths            1
production authority resolvers                 1
explicit native contracts                     13
manifest session fallback identities          74
operation-authority branches                   3
persistent fallback claim admission paths       0
mixed explicit/fallback supported Surfaces      3
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

The old schema-1 local qualification ledger was preserved without migration
under `mods/backups/qualification-ledgers/`; it cannot authorize Preview.78.
Only after a complete game restart may loaded identity or a new bounded
journey be claimed. Unknown mutation remains terminal and non-retryable.
