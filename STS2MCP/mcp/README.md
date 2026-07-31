# Connector V3 MCP Adapter

This is a thin optional adapter over the Gateway's `/api/v3` REST contract.
It owns no STS2 legality, source binding, action construction, or completion
rules.

## Tools

| Tool | Contract |
|---|---|
| `get_sts2_connector_capabilities_v3()` | exact Gateway/game/Modset identity and V3 capability scope |
| `get_sts2_observation_v3()` | player-visible observation and current parameterized interaction |
| `submit_sts2_command_v3(...)` | submit one exact command and operand set from that interaction |
| `get_sts2_command_receipt_v3(request_id)` | poll completion, rejection, pending or unknown |

The adapter deliberately exposes no v1 or v2 action tools. Unsupported
interaction is a fail-closed result, not permission to synthesize facts,
operands or commands. A timed-out command has unknown outcome and must not be
retried.

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
uv run --directory /absolute/path/to/STS2MCP/mcp python -m py_compile server.py
```

Fixture or import success proves only adapter shape. Current action permission
still comes from the exact loaded Gateway capability and state response.
