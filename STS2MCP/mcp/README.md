# Human-Equivalent MCP Adapter

This optional adapter is a thin transport over `/api/he`. It owns no STS2
legality, business source, action authorization, strategy or completion rule.

## Tools

| Tool | Contract |
|---|---|
| `get_sts2_human_capabilities()` | exact loaded Gateway/game/Modset identity |
| `get_sts2_human_snapshot()` | player-visible UI facts and current finite affordances |
| `inspect_sts2_visible_state(...)` | state-bound run deck, combat pile or shop read |
| `get_sts2_surface_card_detail(...)` | state-bound linked visible card detail |
| `apply_sts2_ui_affordance(...)` | deliver one exact advertised affordance |
| `get_sts2_ui_delivery_receipt(request_id)` | read the original delivery result |

`unknown` delivery is terminal and must not be retried. No tool accepts a game
method, node path, coordinate, index, arbitrary reflection target or hidden
information request. The action tool accepts only request ID, current state
token and opaque affordance ID; exact native operands remain inside C.

## Run

```bash
uv run --directory /absolute/path/to/STS2MCP/mcp python server.py
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

Validate with:

```bash
uv lock --check --directory /absolute/path/to/STS2MCP/mcp
uv run --directory /absolute/path/to/STS2MCP/mcp python -m py_compile server.py
```

Import success proves transport shape only, not a loaded game or Live action.
