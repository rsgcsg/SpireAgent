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
| `STS2MCP/McpMod*.cs` | Active Gateway/v1 compatibility code; v1 retirement is not yet safe. |
| `STS2MCP/mcp/` | Optional current MCP adapter over the Gateway. |
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

## DELETE_GENERATED_OR_DUPLICATE

No tracked source, evidence, or license was deleted in this consolidation.
Ignored local generated directories (`node_modules`, `dist`, `bin`, `obj`,
`out`, local run data, and `.DS_Store`) remain untracked. They can be removed
locally without changing the repository, but this task did not delete them.

## BLOCKED_UNTIL_DEPENDENCY_REMOVED

| Path family | Why it remains | Release condition |
|---|---|---|
| `STS2MCP/McpMod*.cs` v1 routes and state/action helpers | v1 still supplies explicitly legacy-owned compatibility and diagnostic paths. | A v2 equivalent must have exact source/UI audit, advertised action contract, shared execution validation, semantic completion, current loaded identity, bounded Organic evidence, and explicit release policy. |
| `STS2MCP/mcp/server.py` legacy tools | The optional MCP edge still exposes legacy v1 behavior for diagnostics. | The Gateway contract must support the required focused tools and product policy must decide the v1 release posture. |
| `STS2MCP/docs/raw-full.md` and `raw-simplified.md` | They document legacy raw API shapes used by compatibility and diagnostics. | Replace with a decided v2-only or formally supported compatibility contract; do not erase a still-routable client interface. |
| Historical Bridge manifest references | Current operation manifests still cite exact historical evidence files. | Replace only after a current exact-environment evidence record supersedes the cited scope; never erase provenance to make coverage look newer. |

## Classification Rules

- `ACTIVE_KEEP` means current ownership, not automatic permission or product
  qualification.
- `ARCHIVE_LEGACY` means preserved and non-authoritative, not deleted.
- `BLOCKED_UNTIL_DEPENDENCY_REMOVED` means retain in the active component while
  measuring a safe retirement path.
- `EXTRACT_FOR_CURRENT_USE` is intentionally empty until a real dependency is
  demonstrated.
