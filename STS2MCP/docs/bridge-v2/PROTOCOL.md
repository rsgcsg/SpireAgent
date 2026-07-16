# Bridge v2 Protocol

Protocol preview: `2.0-preview.1`

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
- readiness and surface kind;
- typed surface data;
- state-scoped opaque legal actions;
- completeness sources and missing fields;
- warnings.

Timestamps and logging fields do not change `state_id`. Semantic surface data or
the legal action set does.

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

If the state changes but the predicate does not pass, the command fails with an
unknown outcome. Unknown outcomes are never auto-retried.

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
