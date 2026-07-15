# MCP State Coverage

Coverage is based on observed old-project raw snapshots and reduced fixture copies. A fixture proves the current parser/action contract for that shape; it does not guarantee future game or mod versions.

| MCP `state_type` / active payload | Normalized kind | Status | Action protocol |
|---|---|---|---|
| `monster`, `boss` | `combat` | fixture-backed | play card, potion, end turn |
| active `hand_select` over combat | `card_selection` | fixture-backed | combat select/confirm |
| `card_select` | `card_selection` | fixture-backed | select/confirm/cancel |
| `card_reward` | `card_reward` | fixture-backed | take, skip, proceed when exposed |
| `rewards` | `rewards` | fixture-backed | claim, potion discard, proceed |
| `map` | `map` | fixture-backed | choose next node |
| `rest_site` | `rest` | fixture-backed | choose option, explicit proceed |
| `event` | `event` | fixture-backed | choose visible option, including proceed option |
| `shop` | `shop` | fixture-backed with one documented inference | buy affordable stocked item, leave |
| `treasure` | `treasure` | fixture-backed | take relic when exposed, proceed |
| `crystal_sphere` | `crystal_sphere` | fixture-backed | switch tool, click observed cell, finish |
| `menu` | `menu` | fixture-backed | choose enabled option |
| `game_over` | `game_over` | fixture-backed | choose exposed menu option |
| `bundle_select` | `unknown` | intentionally unsupported | none |
| unrecognized future state | `unknown` | fail closed | none |

## Verification Rule

A new state is supported only after a real raw sample, normalized variant, allowed-action mapping, serializer verification, state guide, and tests exist. Old smoke objects or game-class names without an observed adapter payload are not enough.

## Adapter Limits

- Legal actions are reconstructed locally; MCP does not enumerate them.
- Action responses are partial; post-state observation verifies effects.
- Some combat card effects open modal selection surfaces while retaining battle data.
- Some screens briefly expose loading/settlement shapes.
- Non-combat snapshots may omit deck/energy details that would improve strategy.
- Sparse potion arrays require raw slot identity when available.
