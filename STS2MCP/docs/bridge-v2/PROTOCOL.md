# Bridge v2 Protocol

Protocol preview: `2.0-preview.3`

## Endpoints

```text
GET  /api/v2/capabilities
GET  /api/v2/state
POST /api/v2/commands
GET  /api/v2/commands/{request_id}
```

All game-object reads and mutations run on the Godot main thread. HTTP and MCP
layers own transport only.

## State

Every state response contains:

- protocol, bridge, and exact game identity;
- observation policy;
- stable semantic `state_id` and monotonic process-session sequence;
- readiness, typed semantic `context`, and surface kind;
- typed surface data;
- state-scoped opaque legal actions;
- completeness sources and missing fields;
- typed diagnostics and legacy compatibility warnings.

Timestamps and logging fields do not change `state_id`. Semantic context,
surface data, or the legal action set does.

`context.kind` is not a complete state discriminator. Clients must display and
reason over at least:

```text
context.kind + surface.kind + action authority
```

The context contains durable current-situation semantics. The surface contains
the currently blocking interaction protocol. Authority says whether actions
were Bridge-advertised, locally reconstructed by a legacy client, or absent.
Bridge wire actions always use `authority="game_ui"`; the higher-level client
records the effective state authority separately.

## Legal Actions

Each legal action contains only:

```json
{
  "action_id": "action_opaque",
  "state_id": "state_opaque",
  "kind": "toggle_card",
  "category": "selection",
  "label": "Select Zap",
  "authority": "game_ui",
  "evidence_code": "NCardGrid.HolderPressed"
}
```

The label is explanatory, not executable. Subject, target, node, and call path
remain inside the registry.

## Command Submission

```json
{
  "request_id": "client-generated-idempotency-key",
  "expected_state_id": "state_opaque",
  "action_id": "action_opaque"
}
```

The bridge rebuilds current state, checks exact state identity, resolves the
registered action, and revalidates its game objects before starting it.

Request IDs are idempotent only for an identical payload. Reusing one with a
different action is rejected.

## Lifecycle

```text
received -> validated -> started -> completed
                     \-> rejected
                     \-> failed
                     \-> timed_out (outcome unknown)
```

`completed` requires the action-specific predicate. In the enchant slice:

| Action | Completion evidence |
|---|---|
| toggle card | selected membership changed |
| preview selection | enchant preview became visible |
| confirm preview | enchant screen closed |
| cancel preview | preview closed and selected set cleared |
| close selection | enchant screen closed |

Additional preview.2 completion evidence:

| Surface/action | Completion evidence |
|---|---|
| event choose/proceed | option chosen, room/subsurface transition, or a non-empty replacement option set |
| combat play card | card leaves hand, required subsurface opens, or combat ends |
| combat potion | potion leaves its exact slot or combat ends |
| combat end turn | local player play phase ends or combat ends |

Additional preview.3 completion evidence:

| Surface/action | Completion evidence |
|---|---|
| card reward card | reward overlay closes or the visible option object set is replaced |
| card reward alternative | reward overlay closes or the visible option object set is replaced, including reroll |
| outer reward claim | its exact reward button is removed, or a child card-reward overlay replaces the outer screen |
| outer rewards proceed | outer rewards screen exits, its visible reward control set is replaced, or the player-visible map opens |

If the state changes but the predicate does not pass, the command fails with an
unknown outcome. Unknown outcomes are never auto-retried.

Clients must verify that every command response repeats the submitted
`request_id`, `expected_state_id`, and `action_id`. They must also enforce the
status/outcome pairs: pending lifecycle states use `pending`, `completed` uses
`confirmed`, `rejected` uses `not_applied`, and `failed`/`timed_out` use
`unknown`. A mismatch is an unknown client outcome, not success.

## Diagnostics

`diagnostics` is structured. `severity` describes importance; `effect`
describes operational consequence. Only explicit effects and contract
invariants affect action authority. An informational inspection diagnostic may
coexist with actions; `actions_suppressed`, `surface_unsupported`, or
`outcome_unknown` may not.

Legacy `warnings` remain during preview migration. Clients preserve them for
audit but do not infer safety from warning presence or absence.

## Inspection Contract

Capabilities currently advertise inspection as `disabled_not_implemented`:
state-bound, no arbitrary queries, no hidden visibility, no command-ledger
entry, and no implemented kinds. There is no inspection endpoint in
`preview.3`. This contract prevents future read-only player inspection from
being confused with an executable action or unrestricted object query.

## Error Codes

| Code | Meaning |
|---|---|
| `invalid_json` | malformed request body |
| `invalid_command_contract` | required opaque IDs absent/invalid |
| `request_id_conflict` | idempotency key reused for another payload |
| `command_capacity_exhausted` | bounded session ledger is full; restart required |
| `stale_state` | expected state no longer current |
| `unknown_or_stale_action` | action not registered for current state |
| `screen_stage_changed` | surface changed before execution |
| `card_not_actionable` | bound card/UI object no longer actionable |
| `unexpected_state_transition` | state changed without action-specific proof |
| `completion_probe_failed` | completion observation itself failed |
| `outcome_not_observed` | timeout with unknown outcome |

Error details are safe summaries. Full local exceptions remain in the game log.
