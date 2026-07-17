# MCP State Coverage

Coverage is based on observed old-project raw snapshots and reduced fixture copies. A fixture proves the current parser/action contract for that shape; it does not guarantee future game or mod versions.

| MCP `state_type` / active payload | Normalized context + surface | Status | Action protocol |
|---|---|---|---|
| `monster`, `boss`, `elite` | `combat` + `combat_turn` | fixture-backed | play card, potion, end turn |
| `monster` or `elite` without `battle`, message `Combat ended. Waiting for rewards...` | `post_combat` + `no_action` | fixture-backed from real MCP smoke | none; poll for rewards |
| active `hand_select` over combat | `combat` + `card_selection` | fixture-backed | combat select/confirm; combat facts retained |
| `card_select` with no verified semantic origin | `unknown` + `card_selection` | partially verified from real MCP | card selection is verified; when MCP exposes `can_confirm`, only confirm/cancel are offered because selected IDs/capacity are absent. `NDeckEnchantSelectScreen` confirmation is currently an adapter completion gap: the REST endpoint returns success but did not advance the observed game state, so it is recorded as `executed_unsettled`, not treated as a settled action. |
| Bridge v2 `deck_enchant_selection` | Bridge `event`/`combat` context + `deck_enchant_selection` + `bridge_advertised` | organic Bridge + Re lifecycle passed | opaque select/preview/confirm/cancel/close only |
| Bridge v2 `event_option` | Bridge `event` + `event_option` + `bridge_advertised` | organic Bridge + Re choose/settlement lifecycle passed for ordinary options | opaque choose/proceed only |
| Bridge v2 `combat_turn` | Bridge `combat` + `combat_turn` + `bridge_advertised` | organic Bridge + Re targeted-card/settlement lifecycle passed | opaque play-card/potion/end-turn only |
| Bridge v2 `combat_pile_card_selection` | Bridge `combat` + exact pile selector + `bridge_advertised` | four single-pick actions passed across two organic runs | opaque toggle/confirm/cancel/peek-close only |
| Bridge v2 `combat_hand_card_selection` | Bridge `combat` + exact hand selector + `bridge_advertised` | organic upgrade select + confirm passed | opaque toggle/confirm/cancel/peek-close only |
| Bridge v2 `generated_card_choice` | Bridge `combat` + temporary-card choice + `bridge_advertised` | organic temporary-card lifecycle passed | opaque temporary-card select/skip/peek-close only |
| Bridge v2 `card_bundle_selection` | exact parent context + atomic visible bundle choice + `bridge_advertised` | organic preview/commit lifecycle passed | opaque bundle preview/confirm/cancel only |
| Bridge v2 `event_dialogue` | Bridge ancient `event` + revealed-prefix dialogue + `bridge_advertised` | two organic advances then option transition passed | opaque current-line advance only; future lines hidden |
| Bridge v2 `rest_site` | Bridge `rest` + exact options/Proceed + `bridge_advertised` | Smith-to-child-overlay and Proceed-to-map passed | opaque rest option or Proceed; child deck selection separate |
| Bridge v2 `map_navigation` | Bridge `map` + visible topology/current choices + `bridge_advertised` | repeated organic exact-node travel passed | opaque current-node choice only |
| Bridge v2 `card_reward_selection` | Bridge `reward_flow(card_reward)` + `card_reward_selection` + `bridge_advertised` | organic Bridge + Re lifecycle passed | opaque card or separately labeled alternative only |
| Bridge v2 `reward_claim` | Bridge `reward_flow(room_rewards)` + `reward_claim` + `bridge_advertised` | ordinary Gold, Proceed/Skip, and full-belt potion discard-then-claim completed | opaque visible claim, exact capacity discard, or explicit proceed only |
| Bridge v2 `shop_room` | Bridge `shop` + room controls + `bridge_advertised` | open, close/reopen, and Proceed-to-map lifecycle passed | opaque merchant-open or Proceed only |
| Bridge v2 `shop_inventory` | Bridge `shop` + typed inventory + `bridge_advertised` | one Armaments purchase, sold-out state, and run-deck post-state passed | typed category purchase or close; relic/potion/removal organic evidence pending |
| Bridge v2 `run_deck` inspection | optional typed player run-deck evidence on supported and legacy-fallback states | organic post-reward Glam reinspection passed | none; read-only evidence |
| Bridge v2 `combat_piles` inspection | optional typed unordered draw/discard/exhaust evidence in combat | non-empty draw/discard/exhaust organic smoke passed | none; read-only evidence |
| `card_reward` | `card_reward` | fixture-backed | take, skip, proceed when exposed |
| `rewards` | `rewards` | fixture-backed | claim, potion discard, proceed |
| legacy `map` fallback | `map` | fixture-backed | only when v2 explicitly unsupported |
| legacy `rest_site` fallback | `rest` | fixture-backed | only when v2 explicitly unsupported |
| `event` | `event` | fixture-backed | choose visible option, including proceed option |
| legacy v1 `shop` fallback | `shop` + `shop_interaction` | fixture-backed with one documented inference | only when v2 explicitly unsupported |
| `treasure` | `treasure` | fixture-backed | take relic when exposed, proceed |
| `crystal_sphere` | `crystal_sphere` | fixture-backed | switch tool, click observed cell, finish |
| `menu` | `menu` | fixture-backed | explicit `agent:tick` protocol test only; `agent:run` stops at this boundary |
| `game_over` | `game_over` | fixture-backed | explicit `agent:tick` protocol test only; `agent:run` stops before any restart action |
| `bundle_select` over known context | known context + `unsupported` | intentionally unsupported | none |
| unrecognized future state | `unknown` + `unsupported` | fail closed | none |

## Verification Rule

A new state is supported only after a real raw sample, normalized variant, allowed-action mapping, serializer verification, state guide, and tests exist. Old smoke objects or game-class names without an observed adapter payload are not enough.

## Adapter Limits

- v1 legal actions are reconstructed locally. Bridge v2 source `preview.14`
  enumerates authoritative actions for fourteen bounded surfaces. Qualification
  remains per observed action shape; unsupported screens never inherit a nearby
  surface's authority.
- v1 action responses are partial; post-state observation verifies effects.
  Bridge v2 has a command lifecycle and action-specific completion evidence.
- Some combat card effects open modal selection surfaces while retaining battle data.
- Similar card payloads do not imply one selector protocol. Pile, hand,
  generated, reward, and run-deck selectors retain separate authority and
  completion semantics.
- Some screens briefly expose loading/settlement shapes.
- Non-combat snapshots may omit deck/energy details that would improve strategy.
- Sparse potion arrays require raw slot identity when available.
- Shop room and inventory are separate input owners. Price/affordability never
  imply purchase authority, and one organic card purchase does not qualify
  relic, potion, or removal categories. The removal child deck selector remains
  a separate unsupported v2 boundary.
- Combat context intentionally carries immediate pile counts. Fixed read-only
  inspection carries pile contents without adding fields to
  `combat_turn.surface`; draw order is never exposed.
