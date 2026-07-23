# Repository Classification Inventory

This inventory classifies the repository after the 2026-07-22 consolidation.
It is a current navigation and ownership aid; Git rename history and
[`../../archive/RELOCATION_MANIFEST.md`](../../archive/RELOCATION_MANIFEST.md)
preserve the detailed migration provenance.

## ACTIVE_KEEP

| Path | Reason |
|---|---|
| `Re-SpireAgent/` | Rebuilt Agent runtime, tests, config example, decision records, and current Agent documentation. |
| `STS2MCP/BridgeV2/` | Current game-side semantic Gateway and protocol implementation. |
| `STS2MCP/McpMod.cs`, `McpMod.Helpers.cs`, `McpMod.SettingsUI.cs` | Active Gateway host, shared read helpers, and local port configuration. No v1 state/action route remains. |
| `STS2MCP/mcp/` | Optional current Bridge v2-only MCP adapter. |
| `STS2MCP/tests/` | Current Bridge contract/runtime test suite. |
| `STS2MCP/docs/bridge-v2/` remaining files | Current protocol, coverage, permission, migration, and ownership documents. |
| `docs/current/` | Repository-level current status, architecture, roadmap, operations, and product truth. |
| `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `.gitignore`, `package.json`, `tools/` | Current workspace entrypoints and checks. |
| `LICENSE` | Repository license. |

## ACTIVE_MOVE_OR_RENAME

| Previous location | Current location | Reason |
|---|---|---|
| `docs/product/REAL_PRODUCTIZATION_*` | `docs/current/audits/` | Product audit remains current but no longer sits under the retired root documentation system. |
| `docs/headless/` | `docs/current/headless/` | Headless is a current future boundary, not a root P9 phase. |
| root `README.md`, `AGENTS.md`, package entry | rewritten at root | Root now introduces the active monorepo rather than the retired runtime. |
| Bridge current-status/index documents | concise current files in `STS2MCP/docs/bridge-v2/` | Historical preview chronology moved to the evidence archive. |

## EXTRACT_FOR_CURRENT_USE

No legacy root asset has an active runtime consumer. Extracting a historical
asset requires a focused current-mainline PR that names its owner, current
contract, tests, and rollback boundary. The archive is not a shared library.

## ARCHIVE_LEGACY

| Path | Reason | Reference value |
|---|---|---|
| `archive/original-spireagent/` | Retired root TypeScript runtime, P8--P15 plans, old data/schema, handoffs, and learning artifacts. | Historical implementation, prior evidence, and migration source only. |
| `archive/bridge-v2-previews/2026-07/` | Dated preview closeouts, canaries, source audits, and early architecture records. | Exact environment-scoped lifecycle evidence only. |
| `archive/legacy-connector-v1/` | Retired v1 state reconstruction, index actions, profile/wiki/compendium API, and raw API references. | Historical operation inventory and failure evidence only; excluded from the active build. |

## DELETE_GENERATED_OR_DUPLICATE

No tracked source, evidence, or license was deleted in this consolidation.
Ignored local generated directories (`node_modules`, `dist`, `bin`, `obj`,
`out`, local run data, and `.DS_Store`) remain untracked. They can be removed
locally without changing the repository, but this task did not delete them.

## BLOCKED_UNTIL_DEPENDENCY_REMOVED

| Path family | Why it remains | Release condition |
|---|---|---|
| Historical Bridge manifest references | Current operation manifests still cite exact historical evidence files. | Replace only after a current exact-environment evidence record supersedes the cited scope; never erase provenance to make coverage look newer. |

## Classification Rules

- `ACTIVE_KEEP` means current ownership, not automatic permission or product
  qualification.
- `ARCHIVE_LEGACY` means preserved and non-authoritative, not deleted.
- `BLOCKED_UNTIL_DEPENDENCY_REMOVED` means retain in the active component while
  measuring a safe retirement path.
- `EXTRACT_FOR_CURRENT_USE` is intentionally empty until a real dependency is
  demonstrated.
