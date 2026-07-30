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
source contract       2.0-preview.81
Re normalized schema  31
Prompt/guide baseline global 4 / state guide 5
source state          full tests/checks/build/install verified; static audit reviewed

built/installed       2.0-preview.81
game release          v0.109.1|c8c577f6
actual game hash      -820620422
built/installed SHA   411f8cf5f113e4d39db9d95fb6a5b625aae97eaf00c4ab9c0f3cdf93413637b1
built/installed MVID  c09e8569-19af-4a34-b98b-49339300304b
last loaded contract  2.0-preview.79
last loaded SHA       1032e079ea1344fb42d1dce4f4dc60bfd85b36c1d7db167877d9e475dddf9268
last loaded MVID      d9435656-951f-42f7-8275-7adc67f05572
last runtime          5faa3faa07ca4331a0eedadc3d91e1c3
last loaded Modset    exact_bridge_only / b1459e82...c785
last Patch            clean_known_owners / ba7852fb...da70b
last permission       migration_exploration / provisional_trial_scoped
last qualification    empty / persistent authority false
rollback              STS2MCP/.local/deployments/2026-07-30T06-55-52-576Z
```

Preview.81 changes the whole DLL, protocol, catalog and affected contract
digests. Preview.79 evidence and session authority do not transfer. Source,
tests, build and install are verified; because the game is closed after
installation, loaded Preview.81 identity remains an explicit non-claim until a
cold start.

## Latest Runtime Evidence

Three exact Preview.79 runs use source `9402fedb...`, Prompt/guide `4/5`,
loaded SHA/MVID/runtime shown above, exact bridge-only Modset, clean known
Patch and `provenance=unrecorded`:

```text
run-20260730031529-qlyj44     1 decision; DeepSeek fetch failed; no Gateway submit
run-20260730032119-vivqvr   173 decisions; 170 settled; 1 settling; 1 safe stale; boundary
run-20260730033205-b759ts   100 decisions;  98 settled;             1 safe stale; boundary
unsupported / unknown / unsettled across both complete runs    0 / 0 / 0
```

The two complete runs exercise broad menu, character-select, map, combat,
event, reward, rest, shop, treasure, selectors and game-over behavior. One
includes three Headbutt CombatPile lifecycles; the other includes merchant
removal and combat-hand selection. Both stale treasure choices were refused
before Gateway submit. The first run's provider network failure is Re/provider
infrastructure, not Gateway observation or mutation failure.

This is exact-runtime predecessor coverage, not Preview.81 evidence, Organic
evidence, persistent qualification or durable claim.

## Preview.81 Contract Delta

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
explicit native contracts                     49
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

The local qualification store is empty and no Preview.79 session state can
authorize Preview.81. Only after a complete game restart may loaded identity
or a new bounded journey be claimed. Unknown mutation remains terminal and
non-retryable. Detailed evidence and non-claims are in the
[Preview.81 closeout](audits/WORKFLOW_C_PREVIEW81_SOURCE_CLOSED_SELECTOR_CONTRACT_WAVE_CLOSEOUT_2026-07-30.md).
