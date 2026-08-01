# Connector V3 v0.110.1 516-Decision Journey Evidence

This record closes only the exact runtime and families actually exercised by
`run-20260801124814-414z9f`. It does not transfer authority to a later build.

## Exact Identity

- Agent source: clean `connectorV3@5e731893bef9090ca6d7fadf295594286599018b`;
- Agent source digest:
  `5fc9c674ca16ccecf619a6182041598db7fa6ac85ca4c20f2d79e8a331e33c99`;
- Connector protocol: `3.0-preview.1`;
- loaded Gateway SHA:
  `f6274db5945fa9e7af905f44ac5f1dc97a0559614ce00529a06dbd7bf2ba276b`;
- loaded Gateway MVID: `3d7bf3f9-46ce-4e8c-8607-d8544e7a6254`;
- runtime instance: `6aa46ac719444902a074be0ef59af7d9`;
- game: `v0.110.1`, commit `db5d3552`, runtime assembly hash `-205573697`;
- Modset: `exact_bridge_only`, fingerprint
  `c2f4661b8e4f2a40c733231807b8343f57bb1d10416fb842c2d44a6d060ec0da`;
- authority: exact-runtime provisional trial; no persistent qualification.

## Journey Result

The run reached `completed_run_boundary` after 516 decisions and returned to
the main menu. It recorded 513 `executed_and_settled` decisions, one safe
pre-submit `not_executed_stale_state`, one
`executed_checkpoint_pending`, and the final non-actionable completed boundary.
No mutation receipt was `unknown`.

The run covered combat, events, map, rewards, rest, shop, treasure, game over
and menu. Surface counts were:

| Surface | Decisions |
|---|---:|
| `combat_turn` | 344 |
| `combat_hand_card_selection` | 2 |
| `event_option` | 12 |
| `event_card_acquisition` | 1 |
| `map_navigation` | 32 |
| `reward_claim` | 67 |
| `card_reward_selection` | 19 |
| `rest_site` | 12 |
| `deck_upgrade_selection` | 12 |
| `shop_inventory` | 4 |
| `shop_room` | 2 |
| `treasure_room` | 6 |
| `game_over` | 2 |
| `main_menu` | 1 |

Five hundred selected commands used `native_direct_resolver`. Fifteen used
the bounded `provider_native_binding_adapter`: combat-hand select/confirm,
deck-upgrade toggle/confirm and one event-card-acquisition selection.

## Direct Consumer Evidence

The exact run exercised direct, no-v2-sidecar Re normalization for:

- 12 `event:event_option` decisions;
- 32 `map:map_navigation` decisions;
- two `game_over:game_over` decisions;
- the final `menu:main_menu` boundary.

Both direct game-over commands reached Gateway `completed` receipts with
confirmed native Outcomes. `return_game_over` produced the main-menu successor
and settled normally. `advance_game_over_summary` produced a successor and the
`game_over_summary_animation_started` completion fact, but Re's separate
decision-readiness wait timed out while the summary animation remained
transitional. The run continued from a fresh observation. This is a Re
readiness diagnostic, not an unknown Gateway mutation or failed Commit.

The stale treasure decision was refused before submit and recovered from a
fresh state. It is expected state-binding behavior, not a mutation failure.

## Evidence Gaps And Non-Claims

- Generated-card choice did not occur: `not exercised`.
- Kifuda and New Leaf did not occur: `not exercised`.
- The `ENDLESS_CONVEYOR` rendered `{Gold}` source did not occur. General event
  rendering was exercised without observation failure, but the exact source
  repair remains `pending exact-runtime evidence`.
- Reward and card-reward Gateway commands were exercised, but this run still
  normalized those surfaces through the temporary Re sidecar. The later direct
  Re reward consumer cannot inherit this Live evidence.
- The run is coverage evidence only. It is not Organic qualification, a
  persistent claim or cross-version/cross-Mod proof.

## Recorded Replay For The Next Consumer Cutover

All 86 reward/card-reward pre-state snapshots from this run normalize under
the direct V3 Re consumer after removing both `bridge_v2_state` and
`bridge_v2_capabilities`. This is recorded-data replay evidence for source and
tests. It is not loaded or Live evidence for the replacement artifact.

The replacement was subsequently built and installed as SHA
`954150c6d964a4f6a78a6483aa82c5cb5066fc5e2bdf762ce56efb22e2166ff5`,
MVID `2e1b0a8f-05e8-4262-b7ff-5791564e9d56`. The prior deployment is backed up
at `STS2MCP/.local/deployments/2026-08-01T13-38-46-096Z`. The game was stopped
for installation; loaded identity remains a non-claim pending cold start.
