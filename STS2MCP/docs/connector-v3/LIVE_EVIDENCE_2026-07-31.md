# Connector V3 Live Evidence: 2026-07-31

This closeout records exact-runtime evidence from the first cold-loaded V3
artifact. Raw run directories and provider output remain local and are not
repository artifacts.

## Exact Runtime

- source revision: `8c68d124e7e02ffd4a8cf0a243a674e34fa92858`
- protocol: `3.0-preview.1`
- loaded SHA:
  `c045438f2a1d32bae1137f4ba2dc923c6f8aed0e1840854d7510bfc5d21577e2`
- loaded MVID: `79b762d1-062d-485a-b36c-ac71f24944dd`
- runtime: `d25ec8ac9725419895c3e1045e35bb14`
- game: `v0.109.1`, commit `c8c577f6`, assembly hash `-820620422`
- Modset: `exact_bridge_only`,
  `55b852d56e6fee41c96ac4e0086b0fd693a4216e8270a73890bedaad7f047f2e`
- permission: `migration_exploration`, encounter-scoped provisional trial
- durable qualification: none

## Runs

| Run | Evidence |
|---|---|
| `run-20260731024338-m9gfi1` | no mutation; strict decode rejected an omitted top-level `shared_state` |
| `run-20260731024411-n419rk` | same wire omission; no mutation |
| `run-20260731024419-s78yf6` | same wire omission; no mutation |
| `run-20260731024431-duehw9` | provider transport `fetch failed`; no Connector mutation |
| `run-20260731024448-rbcjh3` | 52 completed commands across combat, event, map, reward and shop; stopped before Commit when shop-room `activate_control` was ambiguous |
| `run-20260731025025-7q9rq7` | repeated the same pre-Commit shop-room ambiguity |
| `run-20260731025034-mpcez9` | two shop card purchases and inventory close completed; inventory reopen was rejected before Commit by the same ambiguity |
| `run-20260731025052-iu5bv0` | 105 settled commands, two safe local stale refusals, one completed command with successor checkpoint pending, then strict decode failed after game-over return |

The last journey exercised combat, events, map navigation, rest, rewards,
treasure, combat-hand selection, deck upgrade, game over and menu return. V3
receipts were used for 106 completed commands. Direct native combat commands
included `play_card`, `use_potion` and `end_turn`; non-combat commands used the
bounded Provider-native adapter.

The game-over return receipt was `completed/confirmed` with
`game_over_closed_and_main_menu_loaded`. The run was nevertheless recorded as
`stopped_runtime_failure` because the following main-menu observation omitted
the null `shared_state` property and failed strict decode. It is not a completed
journey claim.

## Defects And Repair Boundary

1. The global JSON policy omitted nulls, while the V3 observation schema
   requires an explicit `shared_state: null` outside a run. The V3 property now
   overrides null omission.
2. `open_shop_inventory` and `proceed_shop` both advertised
   `activate_control + room_id`. The resolver correctly rejected two matches,
   but the command model lacked a semantic control operand. Generic controls
   now include `control_id`.
3. Shop-room open/proceed now re-resolve the exact current merchant room and
   native control in a V3-native execute-time resolver. Shop inventory
   purchases and close remain on the bounded Provider-native adapter.

The repaired artifact is installed but has no Live evidence until it is
cold-loaded and exercised. Evidence from the runtime above does not transfer
to a new SHA/MVID.

## Non-Claims

- no persistent V3 qualification or durable claim;
- no V3-native Inspection/detail journey;
- no Live proof yet for the repaired main-menu or shop-room paths;
- no claim that every ordinary vanilla family was exercised;
- no cross-version or cross-Mod V3 compatibility claim.
