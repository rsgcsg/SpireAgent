# Repository Ownership Inventory

## Current Production

| Path | Ownership |
|---|---|
| `STS2MCP/LiveHost/` | real-game visible observation and current input owner |
| `STS2MCP/NativeUi/` | exact native candidates, entity/control/operand binding and delivery |
| `STS2MCP/Authority/` | environment admission, controller, idempotency and qualification |
| `STS2MCP/HumanEnvironment/` | canonical Observe/Read/Interact protocol and runtime |
| `STS2MCP/Transport/` | shared HTTP-only support |
| `STS2MCP/mcp/` | optional thin MCP transport |
| `Re-SpireAgent/` | current HE LLM consumer and runtime |
| `contracts/` | checked cross-component contract inventory |
| `tools/` | deployment, identity, boundary and documentation checks |
| `docs/current/` | repository-level current truth |

`McpMod.cs`, `McpMod.Helpers.cs` and `McpMod.SettingsUI.cs` host the in-game
entrypoint and configuration. They do not define a second protocol authority.

## Retired History

Bridge v2 and Connector V3 source paths are removed from the compiled Gateway.
Their dated documents remain historical evidence under the existing archives
and component history folders. Retired `/api/v2*` and `/api/v3*` requests return
`410`; there is no compatibility execution path.

## Generated And Local Only

`node_modules`, `dist`, `bin`, `obj`, `out`, `.local`, installed DLLs,
`Re-SpireAgent/data/runs`, runtime logs and `.env.local` are not source truth and
must not be committed.

## Evidence Rule

Historical policy IDs or evidence references may retain old names when changing
them would falsify provenance. A historical label never creates current runtime
ownership or permission.
