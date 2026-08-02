# Connector V3 Preview.3 Direct Journey Evidence

Date: 2026-08-02

Evidence class: reviewed exact-runtime coverage with `unrecorded` provenance.
This is not Organic qualification, persistent qualification or a durable claim.

## Exact Identity

All three reviewed runs used the same clean Re source and loaded Gateway:

| Field | Exact value |
|---|---|
| Re source revision | `3d9477aba72f599f19ee685c304fb8aadc47ea3c` |
| Connector protocol | `3.0-preview.3` |
| Gateway SHA-256 | `1f82431fa5798768074628eea98a131a20f6faa20eda997d6770035045ec44b0` |
| Gateway MVID | `17252734-e9e8-46a4-ba3a-37e6107a5f98` |
| runtime instance | `028362bff531495caa375aca0c62eb75` |
| game | `v0.110.1`, commit `db5d3552`, assembly hash `-205573697` |
| Modset | `exact_bridge_only` |
| Modset fingerprint | `d70ae57ed91becc30c0fd68c6330681622069fa2f936e3c67dac04fdcff70a3b` |
| authority | scoped provisional trial; no persistent qualification |

The Godot log records one canonical `STS2_MCP.dll` initialization and no
Gateway exception for this runtime. Build/install identity alone did not
establish these facts; the run metadata negotiated the loaded identity.

## Runs

| Run | Decisions | Boundary |
|---|---:|---|
| `run-20260802081721-rbd1qh` | 48 | stopped before mutation on an invalid model action ID |
| `run-20260802090111-51w94r` | 10 | stopped at a misclassified RestSite mount transition |
| `run-20260802090204-x7lsad` | 118 | `completed_run_boundary`, `completedGame=true` |

Across 176 decisions, 172 commands returned `completed` with application
`confirmed` and successor `available`. There were 173 V3 command submissions:
one was refused locally as stale before Gateway execution, and every other
submission used `connector_v3_command`. No V2 action ID was executed.

The completed run exercised combat, combat-hand selection, generated-card
choice, event, map, reward/card reward, shop, rest, treasure, game-over and
menu transitions. The exact command totals were 55 `play_card`, 19
`end_turn`, four `use_potion`, 27 `activate_control`, 25 `choose`, 16
`navigate`, 11 `select_entity`, six `cancel_interaction`, five
`confirm_interaction` and four `purchase`.

Direct Re consumption was exercised for ordinary combat (78 observations),
menu, event, map, reward/card reward, shop, rest, treasure, game-over and one
Attack Potion generated-card choice. The two combat-hand observations still
used the migration sidecar and Provider native-binding adapter in Preview.3;
both completed with confirmed receipts.

## Four Non-Success Decisions

1. `run-20260802081721-rbd1qh`, decision 48: the model returned
   `v3choice_bc29e0ee585a23a8643bdc0`; the advertised ID was
   `v3choice_bc29e0ee585a23a864d3bdc0`. Re rejected the unknown ID without
   mutation. This is an A/provider output error, not Gateway execution drift.
   Re intentionally does not repair almost-matching opaque IDs.
2. `run-20260802090111-51w94r`, decision 10: the observation had semantic
   context `rest`, source `run_without_visible_overlay`, no commands and an
   unsupported Surface immediately after map navigation. This is a Gateway
   lifecycle classification defect: the exact RestSite room model was current
   before its native input owner mounted. It was not an unsupported RestSite
   mechanic.
3. `run-20260802090204-x7lsad`, decision 26: local state identity changed
   between selecting and executing a treasure relic choice. Re refused the
   stale action before execution; a fresh successor decision completed. This
   is the expected stale-safety boundary.
4. `run-20260802090204-x7lsad`, decision 118: the completed game returned to
   the main menu. Re stopped at the bounded run boundary instead of starting a
   second game. This is the expected terminal boundary.

No command returned `unknown`, no completed receipt lacked a successor, and no
runtime exception was observed in these three runs.

## Preview.4 Consequence

Preview.4 source makes two bounded changes based on this evidence:

- exact native RestSite, Merchant and Treasure room models with no mounted
  input owner are projected as typed `settling/no_action`, but only when the
  active-surface source is `run_without_visible_overlay` and no blocking or
  expected room owner is present;
- combat-hand selection publishes explicit actionable card/control facts and
  uses direct V3 candidate discovery, exact hand/card resolution and direct Re
  consumption. It does not create a universal selector.

Preview.4 source/tests/build/install are separate evidence. Until its exact
SHA/MVID is cold-loaded, neither repair has Preview.4 Live evidence.

## Non-Claims

- The runs do not qualify Kifuda, New Leaf, multi-stack Stratagem or any family
  that did not naturally occur.
- V3 Inspection was not exercised.
- `unrecorded` provenance cannot establish Organic qualification.
- Preview.3 evidence cannot authorize Preview.4 or another game/Modset/Patch.
