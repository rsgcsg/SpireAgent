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
source contract       2.0-preview.82
Re normalized schema  31
Prompt/guide baseline global 4 / state guide 5
source state          full tests/checks/build/install verified; static audit reviewed

built/installed       2.0-preview.82
game release          v0.109.1|c8c577f6
actual game hash      -820620422
built/installed SHA   f5f4791091f0480432d2c30ce3bd8f946049380fde0ab02053692285c4ee3b4c
built/installed MVID  1e12b8d5-ebcc-4bf1-a4bc-a9b768cdcc0f
last loaded contract  2.0-preview.81
last loaded SHA       411f8cf5f113e4d39db9d95fb6a5b625aae97eaf00c4ab9c0f3cdf93413637b1
last loaded MVID      c09e8569-19af-4a34-b98b-49339300304b
last runtime          4955bd9ec2da426084ea7cff1cc0ae04
last loaded Modset    exact_bridge_only / b1459e82...c785
last Patch            clean_known_owners / ba7852fb...da70b
last permission       migration_exploration / provisional_trial_scoped
last qualification    empty / persistent authority false
rollback              STS2MCP/.local/deployments/2026-07-30T08-38-44-247Z
```

Preview.82 changes the DLL, protocol and map contract catalog. Preview.81
evidence and session authority do not transfer. Source, tests, build and
install are verified; because the game is closed after installation, loaded
Preview.82 identity remains an explicit non-claim until a cold start.

## Latest Runtime Evidence

Eight exact Preview.81 runs use source `83d80c2f...`, Prompt/guide `4/5`,
the loaded SHA/MVID/runtime shown above, exact bridge-only Modset, clean known
Patch and `provenance=unrecorded`:

```text
run-20260730074240-h09vpq   188 decisions; 185 settled; 1 safe stale; complete boundary
run-20260730080025-oaxily     8 observations; persistent map drawing owner
run-20260730080059-vf7ui2     8 observations; same map drawing boundary
run-20260730080113-tsnmie    32 decisions; provider finish_reason=length
run-20260730080335-w4fitw    49 decisions; 35 settled; complete boundary
run-20260730080848-p8byv8    26 decisions; stale receipt misclassified fatal
run-20260730080929-nbos1d     2 decisions; same stale misclassification
run-20260730080950-qzuchn    48 records; human termination after settled action
```

The 188-decision run exercises broad menu, character-select, map, combat,
event, reward, rest, shop, treasure, selectors, Inspection and game-over
behavior. The later runs prove two local defects: the map annotation input was
a stable player-owned mode with no published exit, and exact
`rejected/not_applied/stale_state` receipts were incorrectly terminal in Re.
Kifuda and New Leaf did not occur.

This is exact-runtime Preview.81 coverage and defect evidence, not Preview.82
evidence, Organic evidence, persistent qualification or durable claim.

## Preview.82 Delta

- `map_navigation` now publishes source-audited `exit_map_annotation` only
  while the exact active `NMapDrawingInput` owns drawing/erasing input.
- Execution revalidates screen, private input instance, mode and readiness,
  calls native `StopDrawing()`, and witnesses annotation mode closure.
- Re decodes the new opaque action without reconstructing drawing legality.
- A Gateway `rejected/not_applied/stale_state` receipt is recorded as
  recoverable `not_executed_stale_state`; Re never retries the old action and
  observes fresh state next tick.
- The Operator Shell now matches exact game executable paths instead of
  misclassifying an npm command that merely contains the game directory.
- Explicit contract count is 50; volatile manifest fallback count remains 38.

Preview.81 retained the following durable-contract boundary:

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
- Every operation on `singleplayer_menu`, `character_select`, `event_option`,
  `card_reward_selection` and `game_over` now has a distinct explicit contract.
- Every operation on merchant `deck_removal_selection`,
  `reward_deck_removal_selection`, Scroll Boxes `card_bundle_selection` and
  `event_dialogue` now has a distinct source-closed explicit contract.
- Provider completion strings are code constants and contract tests prove
  catalog Witness parity.
- Preview.79 naturally exercised the ordinary open/select/embark, event,
  card-reward and game-over paths. Ascension changes, back paths and the
  card-reward alternative remain `not exercised`.
- `reward_claim` was deliberately not migrated: unknown reward subtypes are
  still exposed as `other_visible_reward`, which is insufficient for durable
  semantic contract identity.
- CombatPile/hand and Rest were deliberately not migrated. Their same operation
  names span source- or condition-specific Commit/Outcome partitions; the
  current operation-scoped authority key cannot represent that honestly.

## Clean Closure Inventory

```text
connector shadows                              0
permanent dual-read paths                      0
production action publication paths            1
production authority resolvers                 1
explicit native contracts                     50
manifest session fallback identities          38
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

The local qualification store is empty and no Preview.81 session state can
authorize Preview.82. Only after a complete game restart may loaded identity
or a new bounded journey be claimed. Unknown mutation remains terminal and
non-retryable. Detailed evidence and non-claims are in the
[Preview.82 closeout](audits/WORKFLOW_C_PREVIEW82_RUNTIME_RECOVERY_CLOSEOUT_2026-07-30.md).
