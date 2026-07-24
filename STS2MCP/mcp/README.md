# Bridge v2 MCP Adapter

This is a thin optional adapter over the Gateway's `/api/v2` REST contract.
It owns no STS2 legality, source binding, action construction, or completion
rules.

## Tools

| Tool | Contract |
|---|---|
| `get_agent_bridge_capabilities_v2()` | exact Gateway/game/Modset identity and capability scope |
| `get_agent_state_v2()` | player-visible state plus state-bound opaque actions |
| `inspect_run_deck_v2(expected_state_id)` | read-only run deck |
| `inspect_combat_piles_v2(expected_state_id)` | read-only combat piles without draw order |
| `inspect_shop_catalog_v2(expected_state_id)` | read-only current-shop catalog |
| `get_agent_observation_bundle_v2(...)` | coherent state plus selected fixed Inspections |
| `submit_agent_action_v2(request_id, expected_state_id, action_id)` | submit one advertised opaque action |
| `get_agent_command_v2(request_id)` | poll completion, rejection, or unknown outcome |

The adapter deliberately exposes no v1 tools or routes. Unsupported state is a
fail-closed result, not permission to synthesize legacy facts or actions. A
timed-out command has unknown outcome and must not be retried.

## Run

```bash
uv run --directory /absolute/path/to/STS2MCP/mcp python server.py
```

Optional transport arguments:

```bash
python server.py --host localhost --port 15526 --no-trust-env
```

Example MCP configuration:

```json
{
  "mcpServers": {
    "sts2": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "/absolute/path/to/STS2MCP/mcp",
        "python",
        "server.py"
      ]
    }
  }
}
```

## Validation

```bash
uv lock --check --directory /absolute/path/to/STS2MCP/mcp
python3 -m py_compile /absolute/path/to/STS2MCP/mcp/server.py
```

Fixture or import success proves only adapter shape. Current action permission
still comes from the exact loaded Gateway capability and state response.
