# Consolidation Relocation Manifest

## Baseline

- Source branch: `develop`
- Source commit before consolidation: `55384931e1dbd2952b84e27513a02315d44ecf0d`
- Migration date: 2026-07-22

## Original SpireAgent Archive

| Original path family | New path family | Reason | Still useful for |
|---|---|---|---|
| root `src/`, `scripts/`, `package.json`, `tsconfig.json` | `original-spireagent/src/`, `scripts/`, package files | Retired original runtime; no current Re/STS2MCP runtime import. | Historical implementation and targeted extraction only. |
| root `data/spire-codex/`, `derived/`, tracked `memory/` | `original-spireagent/data/`, `derived/`, `memory/` | Old runtime knowledge, derived rules, and legacy-finalize records. | Historical evidence; never current stable knowledge. |
| root architecture, North Star, plan, schema, memory, replay, handoff, debug, and runbook Markdown | `original-spireagent/` with original relative layout | Root P8--P15 documentation system is retired. | Historical rationale and evidence scope. |
| root `docs/` phase, debt, decisions, reports, runbooks, and legacy redirects | `original-spireagent/docs/` with original relative layout | Preserve context without competing with current docs. | Historical planning and audits. |

## Current Documents Moved Rather Than Retired

| Original path | New path | Reason |
|---|---|---|
| `docs/product/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md` | `docs/current/audits/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md` | Still current product analysis; old P9 dependency wording was removed. |
| `docs/headless/README.md` | `docs/current/headless/README.md` | Current future boundary. |
| `docs/headless/TARGET_ARCHITECTURE.md` | `docs/current/headless/TARGET_ARCHITECTURE.md` | Current future host research gate. |

## Bridge Preview Archive

All `STS2MCP/docs/bridge-v2/PREVIEW_*.md` files and dated preview-era audits,
closeouts, baseline, upstream, smoke, and long-run records moved to
`bridge-v2-previews/2026-07/`. Current protocol, current status, observation
policy, player-visible coverage, live boundary, migration audit, ADRs, and Re
integration remain under `STS2MCP/docs/bridge-v2/`.

## Legacy Connector v1 Archive

On 2026-07-24 the active Gateway retired the complete `/api/v1` namespace.
The old single-player/multiplayer state builders, index mutation dispatchers,
profile/compendium/wiki handlers, formatter, and raw API references moved from
`STS2MCP/` into `archive/legacy-connector-v1/`.

The move followed evidence that nominal v1 GET state construction was not
strictly read-only: treasure and fake-merchant builders could invoke native
controls. The archive preserves the 27-action migration source and historical
failure context, but none of its C# files is compiled by the active project.

## Notes

- Per-file rename provenance is retained by Git's move history for this
  consolidation commit.
- No tracked license, historical source audit, or evidence document was
  intentionally deleted.
- Ignored local runtime outputs and secrets were not moved, read, or committed.
