# Repository Ownership Inventory

## Current Production

| Path | Ownership |
|---|---|
| `STS2MCP/LiveHost/` | real-game visible facts and current input owner |
| `STS2MCP/NativeUi/` | private native controls, entity/operand binding and delivery |
| `STS2MCP/Authority/` | exact identity, controller and request idempotency |
| `STS2MCP/PlayerEnvironment/` | public Snapshot/Read/BoundAction/Receipt runtime |
| `STS2MCP/McpMod.cs` | in-game entrypoint and HTTP dispatch |
| `STS2MCP/mcp/` | optional thin MCP-to-HTTP transport |
| `Re-SpireAgent/` | current Player Environment LLM consumer |
| `contracts/` | checked cross-component machine contract |
| `tools/` | deployment, provenance, boundary and documentation checks |
| `docs/current/` | repository-level current truth |

The historical `STS2MCP` Mod ID does not make MCP mandatory. `McpMod.cs` is the
Host entrypoint; protocol authority remains in `PlayerEnvironment/Protocol`.

## Retired History

Bridge v2, Connector V3, operation permission, qualification, SourceContract
and migration-tool source are absent from the current production graph. Their
Git history and dated documents retain provenance. `/api/v1`, `/api/v2`,
`/api/v3` and `/api/he` return `410`; there is no compatibility executor.

## Generated And Local Only

`node_modules`, `dist`, `bin`, `obj`, `out`, `.local`, installed DLLs,
`Re-SpireAgent/data/runs`, runtime logs and `.env.local` are not source truth and
must not be committed.
