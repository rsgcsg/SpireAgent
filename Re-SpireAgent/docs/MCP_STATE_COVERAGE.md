# MCP State Coverage

Coverage is based on observed old-project raw snapshots and reduced fixture copies. A fixture proves the current parser/action contract for that shape; it does not guarantee future game or mod versions.

| MCP `state_type` / active payload | Normalized context + surface | Status | Action protocol |
|---|---|---|---|
| `monster`, `boss`, `elite` | `combat` + `combat_turn` | fixture-backed | play card, potion, end turn |
| `monster` or `elite` without `battle`, message `Combat ended. Waiting for rewards...` | `post_combat` + `no_action` | fixture-backed from real MCP smoke | none; poll for rewards |
| active `hand_select` over combat | `combat` + `card_selection` | fixture-backed | combat select/confirm; combat facts retained |
| `card_select` with no verified semantic origin | `unknown` + `card_selection` | partially verified from real MCP | card selection is verified; when MCP exposes `can_confirm`, only confirm/cancel are offered because selected IDs/capacity are absent. `NDeckEnchantSelectScreen` confirmation is currently an adapter completion gap: the REST endpoint returns success but did not advance the observed game state, so it is recorded as `executed_unsettled`, not treated as a settled action. |
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

- Legal actions are reconstructed locally; MCP does not enumerate them.
- Action responses are partial; post-state observation verifies effects.
- Some combat card effects open modal selection surfaces while retaining battle data.
- Some screens briefly expose loading/settlement shapes.
- Non-combat snapshots may omit deck/energy details that would improve strategy.
- Sparse potion arrays require raw slot identity when available.
