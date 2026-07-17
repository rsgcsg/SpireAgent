# Bridge v2 Current Status

Status date: 2026-07-17

## Current Phase

Protocol `2.0-preview.18` is implemented. Its historical exact qualification is
`v0.108.0|58694f64|-2044609792`, where it exposes fifteen bounded executable
Surface contracts and two fixed read-only Inspection kinds. Every formerly
executable surface family has organic evidence for at least one observed shape,
but that evidence remains action/category-specific and does not imply full-game
coverage.

The currently installed Steam build is
`v0.109.0|c12f634d|-840572606`. Preview.16 recorded a natural read-only
merchant-removal child with the expected prompt, ten-card grid, limits, and no
actions. Preview.17 passed one temporary action-canary lifecycle:
`shop + deck_removal_selection` cancel. Preview.18 additionally permits only
the state-bound, read-only `run_deck` inspection needed to observe a future
destructive post-state. It keeps every other surface
`not_qualified_for_current_build`, keeps `combat_piles` and every other
inspection disabled, and suppresses legacy-sidecar merging across the candidate
build. No v0.109 action or inspection is generally qualified by v0.108 history
or by these canaries.

## Canonical Model

Runtime identity is:

```text
context.kind + surface.kind + action authority
```

- Context describes the current semantic game situation.
- Exactly one Active Surface describes the topmost player-owned interaction
  grammar and owns all executable actions.
- Inspection contains state-bound player-inspectable facts that are not the
  active input protocol.
- Authority is independent: `bridge_advertised`, `local_reconstruction`, or
  `none` in Re-SpireAgent.
- Diagnostics report visibility/completeness/safety without inventing actions.

## Implemented And Organically Observed

| Surface | Bounded organic evidence | Current qualification |
|---|---|---|
| `deck_enchant_selection` | select/preview/confirm and post-state deck inspection | qualified for observed Glam flow |
| `event_dialogue` | two revealed-line advances, then transition to options | qualified; future dialogue lines withheld |
| `event_option` | ordinary and Neow option/proceed flows | qualified for observed options |
| `rest_site` | Smith option opens separate deck selector; later Proceed reaches map | qualified for rest controls; child deck selector remains legacy |
| `combat_turn` | repeated card/potion/end-turn lifecycles | qualified for observed player-turn shapes |
| `combat_pile_card_selection` | discard-pile single-pick | qualified only for observed shape |
| `combat_hand_card_selection` | observed select/confirm upgrade flows | qualified only for observed modes |
| `generated_card_choice` | natural generated-card selection in the preview.12 long run | qualified for observed temporary choice |
| `card_bundle_selection` | natural bundle preview/commit lifecycle | qualified for observed bundle shape |
| `card_reward_selection` | ordinary card and alternative selection | qualified for observed reward shapes |
| `reward_claim` | gold, card child surface, potion capacity/discard, Proceed/Skip | qualified for observed ordinary rewards; linked sets fail closed |
| `map_navigation` | repeated exact-node travel and map close/current-coordinate completion | qualified for observed singleplayer map travel |
| `shop_room` | saved-run restore, open inventory, close/reopen, Proceed to map | qualified for observed normal merchant room controls |
| `shop_inventory` | typed inventory, card/relic/potion purchase, sold-out post-state, capacity suppression, removal-child launch | direct purchases and removal launch qualified for observed shapes; child selector remains pending |
| `deck_removal_selection` | static contract, natural v0.109 selecting stage, and settled cancel | temporary action canary only | smoke v0.109 `run_deck`, then separately test select/preview/confirm and exact deck/shop post-state before any qualification decision |

Read-only `run_deck` and `combat_piles` inspections are organically qualified.
They expose no action authority and never reveal draw order.

## Preview.13 Rest Lifecycle Evidence

Organic run `run-20260716182900-50gm7n` reached floor 7 with exact Bridge-owned
`rest + rest_site` state. Decision 71 selected Smith and completed with the
action-specific overlay-open witness. The resulting deck card-selection overlay
was intentionally owned by the legacy local adapter, not merged into rest.
After the upgrade selection closed, preview.13 exposed only the exact
`proceed_rest_site` action. Run `run-20260717012922-la5ibg`, decision 1,
completed that action and the next Bridge state was `map + map_navigation` at
the visited rest coordinate.

This run found and fixed one strict-client bug: Re-SpireAgent originally did not
count a surface-level `screen_entity_id` as a visible entity, so the valid
Proceed binding was rejected before execution. The decoder now recognizes
explicit `entity_id` and `*_entity_id` identity fields while continuing to
reject bindings to absent IDs.

## Preview.14 Shop Evidence

The installed preview.14 DLL restored a floor-9 merchant at 26 gold with a full
2/2 potion belt, seven cards, three relics, three potions, and one removal
service. `shop_room` exposed only open/Proceed. `shop_inventory` exposed only
the affordable on-sale Armaments purchase plus close. Close/reopen completed;
the purchase changed gold 26 to 0, changed that exact offer to sold out, and a
state-bound run-deck inspection changed from 17 to 18 with Armaments present.
Final Proceed completed to `map + map_navigation`.

A follow-up at the same merchant with player-visible high gold exercised a
typed Blood Vial relic purchase: gold changed 10025 to 9824, the exact offer
became sold out, and the player relic list showed Blood Vial. It also confirmed
that a full belt suppresses all potion purchase actions with
`potion_slots_full`, even where the offer is stocked and affordable. Finally,
the affordable removal service completed only as far as its child
`NDeckCardSelectScreen`; Bridge v2 correctly surfaced that child as unsupported
with no actions while the read-only sidecar exposed its prompt, cards, and
cancel/confirm facts.

After one visible potion slot was freed, the typed Fire Potion action completed
with gold 9824 to 9772, Fire Potion in exact slot 0, and its source offer sold
out. The full belt then again removed every potion purchase action. Direct
shop purchase categories now each have bounded observed evidence.

The organic strict-client read also caught nullable C# fields omitted on the
wire. Re-SpireAgent now accepts omission for explicitly optional shop product
and blocked-reason fields while retaining stocked/product and action-binding
invariants.

## Verification

- Bridge contract/runtime tests: 43/43.
- Re-SpireAgent tests: 110/110, including Bridge integration coverage for the
  static merchant-removal contract.
- Re-SpireAgent strict typecheck and production build pass.
- Preview.14 normal merchant open/close/reopen/card-purchase/Proceed lifecycle
  completed with confirmed action-specific evidence and no diagnostics.
- Preview.13 organic run `run-20260716182900-50gm7n` recorded 71 settled actions
  before the legacy Smith confirm settlement stopped the bounded runner; the
  Bridge-owned rest option itself was settled.
- Preview.13 Proceed rerun `run-20260717012922-la5ibg` settled and reached map.
- Preview.16 captured the exact non-executable v0.109 selecting stage. Preview.17
  upgraded only that same child into a no-inspection action canary. Its first
  lifecycle step completed on 2026-07-17: opaque request
  `preview17-cancel-1784269191` cancelled the selecting child and settled to
  unsupported shop context with zero legal actions. This qualifies the bounded
  cancel transition only; it does not claim deck or merchant-service post-state
  facts that the candidate build could not yet inspect. Preview.18 adds only
  `run_deck` as a state-bound inspection canary; its runtime smoke remains
  pending and `combat_piles` stays disabled.

## Honest Completeness Boundary

`contract_complete_for_visible_*` means complete for the bounded active Surface
contract and its action-critical facts. It does **not** mean that Bridge v2
already exposes every fact visible anywhere in the whole game UI.

Known gaps include treasure, menu/game-over, generic deck
remove/transform/upgrade selectors, linked reward sets, multiplayer, some hover
keyword/tool-tip semantics, and shared run/HUD facts that Re-SpireAgent still
obtains from the v1 sidecar or fixed inspection. Smith's child deck selection is
the clearest preview.13 example: rest ownership is correct, but the whole
multi-surface journey is not yet all-v2.

Shop has the same honest child boundary: launching card removal is historically
qualified. Preview.15 now has a narrow merchant removal child contract, but it
is not yet runtime-qualified on the current game build. Card, relic, and potion
purchase are only qualified for their historical observed shapes.

## Current Blocker And Next Step

The cancel action-canary lifecycle has passed. The next step is a fresh,
same-state v0.109 `run_deck` inspection smoke. It must prove exact identity,
player-visible policy, count/card consistency, and no command authority before
any destructive confirmation. Only then may a separate fresh journey verify
select -> preview -> confirm with the exact removed card plus deck/shop
post-state. Any command rejection, unexpected state transition, failed
completion probe, missing evidence, or cross-surface action immediately returns
the build to the preview.16 observation-only gate. Generic deck maintenance
remains a future shared-boundary study: rest Smith and shop removal have
purpose-specific selection/preview/confirmation semantics and must not become a
universal card selector. Menu and treasure remain separate debt.

See [the preview.14 shop audit](PREVIEW_14_SHOP_SURFACE_AUDIT_2026-07-17.md),
[the preview.13 closeout audit](PREVIEW_13_CLOSEOUT_AUDIT_2026-07-17.md),
[the preview.16 candidate-observation audit](PREVIEW_16_CANDIDATE_OBSERVATION_GATE_2026-07-17.md),
[the preview.17 action-canary plan](PREVIEW_17_DECK_REMOVAL_ACTION_CANARY_2026-07-17.md),
[the preview.18 inspection-canary plan](PREVIEW_18_RUN_DECK_INSPECTION_CANARY_2026-07-17.md),
[the coverage matrix](PLAYER_VISIBLE_COVERAGE.md), and
[the organic long-run audit](ORGANIC_LONG_RUN_AUDIT_2026-07-17.md).
