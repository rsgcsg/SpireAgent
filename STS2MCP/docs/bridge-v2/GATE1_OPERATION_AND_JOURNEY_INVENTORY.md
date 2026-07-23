# Gate 1 Operation And Journey Inventory

Status: active Gate 1 source of truth for v1 retirement and ordinary
single-player blockers. The machine-checked mapping is
[`OPERATION_RETIREMENT_INVENTORY.json`](OPERATION_RETIREMENT_INVENTORY.json).

## What The Inventory Means

The old v1 dispatch used broad action names such as `proceed`, `select_card`,
and `shop_purchase`. Their continued presence in disabled compatibility code
does not prove that an ordinary journey remains v1-owned. Bridge v2 replaces
most of them with purpose-specific operations whose legality and completion
belong to a bounded semantic contract.

The inventory is checked against the single-player v1 dispatch switch and the
v2 contract manifest by `npm run check:connector-inventory`. It is governance
and migration evidence only: a mapping does not grant permission, prove the
current source binding, or qualify an operation.

## Current Disposition

| Disposition | Meaning | Current Gate 1 result |
|---|---|---|
| `v2_same_semantics` | One bounded v2 operation replaces the old mutation | combat basics, map choice, event choice, rest choice, reward claim, and ordinary card reward selection are represented |
| `v2_purpose_split` | A broad v1 action was replaced by several source/purpose-specific contracts | navigation, shop purchase, card selectors, bundle selectors, and treasure flows must be judged per v2 operation |
| `partial_v2` | A normal subset is v2, but a visible variant remains unsupported | manual potion discard outside reward capacity handling; non-standard menu/profile flows |
| `fail_closed` | No valid v2 semantic contract exists | Crystal Sphere tool/cell/proceed lifecycle |
| `out_of_scope` | Not part of ordinary single-player Gate 1 | multiplayer and profile mutation |

Re-SpireAgent has no v1 mutation transport. Gateway v1 mutation endpoints are
disabled by default. Therefore unsupported operations now stop explicitly;
they do not silently fall back.

## Ordinary Journey Inventory

| Journey | Current v2 boundary | Current exact-build evidence | Remaining Gate 1 work |
|---|---|---|---|
| root menu -> standard run setup | `main_menu`, `singleplayer_menu`, `character_select` | exact Re canaries reached a real run; final-artifact recheck repeated `main_menu -> singleplayer_menu -> main_menu` with command completion and one-poll successors | first-run tutorial and abandon confirmation remain unsupported; current operations are canary, not broadly qualified |
| run start -> Neow -> map | `event_option`, then `map_navigation` | 2026-07-22 exact Re journey selected Winged Boots, proceeded, and reached an actionable map | more event origins remain evidence debt |
| map -> ordinary combat | `choose_map_node` -> `combat_turn` | 2026-07-22 exact Re journey settled after 9 polls / about 1.9 seconds | long-run diversity and unusual room transitions remain; current source suppresses UI-travelable coordinates already present in `RunState.VisitedMapCoords`, but that repair needs a newly loaded ordinary-map canary |
| ordinary combat | `combat_turn` plus bounded child selectors | current contract is qualified for the exact build; Preview.59 fail-closed runs exposed exact Quasar and Knowledge Demon source gaps | Preview.60 source-binds Quasar, Knowledge Demon, and Charge as separate canaries; loaded identity and bounded lifecycles remain required, while every unknown selector stays fail closed |
| reward -> card reward -> map | `reward_claim`, `card_reward_selection`, `map_navigation` | 2026-07-22 exact Re canary claimed gold, potion, opened a card reward, selected Headbutt, and proceeded to an actionable map | linked/special rewards and more reward origins remain |
| shop including removal | `shop_room`, `shop_inventory`, `deck_removal_selection` | source-audited and historical canaries; removal is qualified | repeat exact current-identity purchase/removal journey |
| rest including Smith | `rest_site`, `deck_upgrade_selection` | exact-build qualified contracts | source diversity for nonstandard rest options |
| treasure | `treasure_room` | bounded canary contract | open/skip/empty variants and current exact journey |
| Wood Carvings deterministic replacement | `wood_carvings_replacement_selection` | preview.56 Bird select/cancel/reselect/confirm and exact run-deck post-state under one loaded identity | Torus and repeated Bird diversity; remains canary-only |
| run end -> menu | `game_over`, `main_menu` | historical canary lifecycle | current exact loss/win lifecycle |
| Crystal Sphere event | no v2 contract | none | source/UI/tool legality and semantic completion must be independently designed before any authority |

## Gate 1 Runtime Defect Closed On 2026-07-22

The first fresh run exposed an asynchronous successor bug in Re rather than a
missing Neow Surface. `embark_standard_run` completed in the Gateway, but the
first post-command read was a transient `unknown + unsupported` observation.
Re previously treated every non-loading adapter-confirmed observation as a
settled successor and reported the run start as complete at that transient
checkpoint.

Settlement now accepts only `actionable` or explicit `non_actionable` semantic
checkpoints. `unknown`, `invalid`, `loading`, `settling`, and `transitioning`
remain observations but cannot prove settlement. Unknown outcome is still not
retried. Opaque v2 `choose_map_node` also uses the dedicated room-transition
budget. The same exact runtime subsequently completed:

```text
event_option(Neow)
-> choose Winged Boots
-> proceed_event
-> map_navigation
-> choose_map_node
-> combat_turn
```

This proves the Re-side settlement repair for this bounded journey. It does not
promote `event_option` or `map_navigation` from canary to qualified and does not
claim complete ordinary-run coverage.

The journey then used 17 fresh combat actions to finish the encounter and five
reward/card-reward operations to return to the map. Every explicit canary
reported `executed_and_settled`; no v1 transport or fallback was available. A
separate bounded `agent:run` attempt stopped before execution on a DeepSeek
`fetch failed` provider error. That provider failure is not connector success
or connector failure and is excluded from the operation canary count.

This evidence is `operator_directed`, exact-identity coverage evidence. It is
not autonomous strategy evidence and does not by itself change an operation's
canary/qualified tier.

## Priority Order

1. Continue the exact-identity journey from the map and record the next actual
   fail-closed or unsupported semantic variant. The first, Wood Carvings
   deterministic replacement, is closed as a bounded canary.
2. Renew shop/removal and rest/Smith journeys under the current loaded identity.
3. Close run-end lifecycle evidence.
4. Audit visible manual potion discard only if it blocks an organic journey.
5. Treat Crystal Sphere as a purpose-specific future slice, not a reason to
   restore broad v1 actions.
