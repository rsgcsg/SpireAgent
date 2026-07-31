# Connector V3 Protocol

Source protocol: `3.0-preview.1`

Schemas:

- `sts2.connector.v3/observation-1`
- `sts2.connector.v3/command-1`

## Observation

An observation contains:

- exact Gateway/game/Modset identity;
- `state_token` and monotonic sequence;
- shared player-visible state, semantic context and visible surface;
- one active interaction and its execution support;
- bounded parameterized command candidates;
- completeness, visibility, diagnostics and hidden-by-policy declarations.

A visible unsupported interaction remains present with
`execution_support=unsupported` and no candidates.

Event options expose `is_enabled` separately from `is_locked`. V3 candidate
discovery requires both the exact current native control to be enabled and the
semantic option to be unlocked; option text or position never grants authority.

## Command

```json
{
  "request_id": "client-generated-id",
  "expected_state_token": "state_...",
  "interaction_id": "interaction_...",
  "command": "play_card",
  "operands": {
    "card_id": "card_...",
    "target_id": "enemy_..."
  },
  "client_session_id": "client_...",
  "controller_lease_id": "lease_...",
  "controller_generation": 1
}
```

The Gateway accepts only the command and operands advertised for the exact
state and interaction. Entity IDs resolve to the same native object instance;
replacement objects do not inherit IDs. Native owner and legality are checked
again immediately before STS2 Commit.

Generic `activate_control` candidates include a semantic `control_id` even
when they also bind an owner entity. This distinguishes multiple visible
controls on one owner, such as opening a merchant inventory versus leaving the
same merchant room. `control_id` is not a V2 action ID and cannot name an
unadvertised method or UI node.

Event-option candidates bind the exact event screen and option entity.
Treasure candidates bind the exact room and, for relic choice, the exact
relic entity. Both families resolve current native controls at execution and
do not execute through Bridge v2 action IDs or Provider action closures.

## Receipt

Receipt states are:

- `completed`: the action-specific Gateway Outcome was observed;
- `not_executed`: validation rejected before Commit;
- `pending`: poll the same request ID;
- `unknown`: mutation may have occurred; do not retry automatically.

`retry.allowed` is always false. `pending` means polling the existing request,
not submitting it again.

## MCP

The Python adapter exposes V3 capabilities, observation, submit and receipt
tools. It is a transport adapter and cannot add commands, legality or
authority.
