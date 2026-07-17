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
| Bridge v2 `combat_pile_card_selection` | Bridge `combat` + exact pile selector + `bridge_advertised` | four preview.9 single-pick actions passed across two organic runs | opaque toggle/confirm/cancel/peek-close only |
| Bridge v2 `combat_hand_card_selection` | Bridge `combat` + exact hand selector + `bridge_advertised` | organic upgrade select + confirm passed | opaque toggle/confirm/cancel/peek-close only |
| Bridge v2 `generated_card_choice` | Bridge `combat` + temporary-card choice + `bridge_advertised` | exact-source and fixture backed; fresh preview.9 organic lifecycle pending | opaque temporary-card select/skip/peek-close only |
| Bridge v2 `card_reward_selection` | Bridge `reward_flow(card_reward)` + `card_reward_selection` + `bridge_advertised` | organic Bridge + Re lifecycle passed | opaque card or separately labeled alternative only |
| Bridge v2 `reward_claim` | Bridge `reward_flow(room_rewards)` + `reward_claim` + `bridge_advertised` | ordinary Gold, Proceed/Skip, and full-belt potion discard-then-claim completed | opaque visible claim, exact capacity discard, or explicit proceed only |
| Bridge v2 `run_deck` inspection | optional typed player run-deck evidence on supported and legacy-fallback states | organic post-reward Glam reinspection passed | none; read-only evidence |
| Bridge v2 `combat_piles` inspection | optional typed unordered draw/discard/exhaust evidence in combat | non-empty draw/discard/exhaust organic smoke passed | none; read-only evidence |
| `card_reward` | `card_reward` | fixture-backed | take, skip, proceed when exposed |
| `rewards` | `rewards` | fixture-backed | claim, potion discard, proceed |
| `map` | `map` | fixture-backed | choose next node |
| `rest_site` | `rest` | fixture-backed | choose option, explicit proceed |
| `event` | `event` | fixture-backed | choose visible option, including proceed option |
| `shop` | `shop` | fixture-backed with one documented inference | buy affordable stocked item, leave |
| `treasure` | `treasure` | fixture-backed | take relic when exposed, proceed |
| `crystal_sphere` | `crystal_sphere` | fixture-backed | switch tool, click observed cell, finish |
| `menu` | `menu` | fixture-backed | explicit `agent:tick` protocol test only; `agent:run` stops at this boundary |
| `game_over` | `game_over` | fixture-backed | explicit `agent:tick` protocol test only; `agent:run` stops before any restart action |
| `bundle_select` over known context | known context + `unsupported` | intentionally unsupported | none |
| unrecognized future state | `unknown` + `unsupported` | fail closed | none |

## Verification Rule

A new state is supported only after a real raw sample, normalized variant, allowed-action mapping, serializer verification, state guide, and tests exist. Old smoke objects or game-class names without an observed adapter payload are not enough.

## Adapter Limits

- v1 legal actions are reconstructed locally. Bridge v2 source `preview.9`
  enumerates authoritative actions for deck enchant, ordinary event options,
  immediate player-phase combat, three distinct combat card selectors, card
  reward selection, and outer room reward claims. Qualification remains per
  observed action shape; generated-card choice still lacks fresh preview.9
  organic execution.
- v1 action responses are partial; post-state observation verifies effects.
  Bridge v2 has a command lifecycle and action-specific completion evidence.
- Some combat card effects open modal selection surfaces while retaining battle data.
- Similar card payloads do not imply one selector protocol. Pile, hand,
  generated, reward, and run-deck selectors retain separate authority and
  completion semantics.
- Some screens briefly expose loading/settlement shapes.
- Non-combat snapshots may omit deck/energy details that would improve strategy.
- Sparse potion arrays require raw slot identity when available.
- Combat context intentionally carries immediate pile counts. Fixed read-only
  inspection carries pile contents without adding fields to
  `combat_turn.surface`; draw order is never exposed.
