# Bridge v2 Current Status

Status date: 2026-07-17

## Current Phase

Protocol `2.0-preview.14` is implemented and loaded against exact game identity
`v0.108.0|58694f64|-2044609792`. It exposes fourteen bounded executable Surface
contracts and two fixed read-only Inspection kinds. Every current executable
surface family has organic evidence for at least one observed interaction
shape, but qualification remains action/category-specific and does not imply
full-game coverage.

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
| `shop_inventory` | full typed inventory, one card purchase, sold-out and run-deck post-state | card purchase qualified; relic/potion/removal category actions still need organic evidence |

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

The organic strict-client read also caught nullable C# fields omitted on the
wire. Re-SpireAgent now accepts omission for explicitly optional shop product
and blocked-reason fields while retaining stocked/product and action-binding
invariants.

## Verification

- Bridge contract/runtime tests: 43/43.
- Re-SpireAgent tests: 109/109, including 45 Bridge integration tests.
- Re-SpireAgent strict typecheck and production build pass.
- Preview.14 normal merchant open/close/reopen/card-purchase/Proceed lifecycle
  completed with confirmed action-specific evidence and no diagnostics.
- Preview.13 organic run `run-20260716182900-50gm7n` recorded 71 settled actions
  before the legacy Smith confirm settlement stopped the bounded runner; the
  Bridge-owned rest option itself was settled.
- Preview.13 Proceed rerun `run-20260717012922-la5ibg` settled and reached map.

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

Shop has the same honest child boundary: launching card removal is implemented,
but its generic deck-removal selector is not yet a qualified v2 Surface. Relic,
potion, and removal purchase categories are source/contract implemented but do
not yet have organic action evidence.

## Current Blocker And Next Step

The architecture blocker remains coverage breadth without dishonest
generalization, not a failed core model. Shop no longer blocks the normal room
and card-purchase journey. The next candidate should be selected from remaining
frequent player-visible gaps, with generic deck maintenance likely higher value
than another purchase category because both rest Smith and shop removal already
reach that boundary. It still requires source-derived purpose, selection,
preview, confirmation, cancellation, and completion semantics rather than a
universal card selector. Menu and treasure remain separate debt.

See [the preview.14 shop audit](PREVIEW_14_SHOP_SURFACE_AUDIT_2026-07-17.md),
[the preview.13 closeout audit](PREVIEW_13_CLOSEOUT_AUDIT_2026-07-17.md),
[the coverage matrix](PLAYER_VISIBLE_COVERAGE.md), and
[the organic long-run audit](ORGANIC_LONG_RUN_AUDIT_2026-07-17.md).
