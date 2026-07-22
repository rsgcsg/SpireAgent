# SpireAgent

SpireAgent is being rebuilt around two active components:

- [`Re-SpireAgent/`](Re-SpireAgent/): the standalone LLM agent runtime.
- [`STS2MCP/`](STS2MCP/): the in-game STS2 Live Semantic Gateway, REST
  connector, and optional MCP adapter.

The original root-level SpireAgent runtime and its P8--P15 learning roadmap are
historical. They are preserved under [`archive/original-spireagent/`](archive/original-spireagent/)
and do not define the current architecture, permission model, or roadmap.

## Current Truth

The active connector now shares a `2.0-preview.55` contract between C# and
Re-SpireAgent. A Release DLL was installed and loaded by Steam with a matching
SHA/MVID, and Re completed a read-only strict-v2 inspection. One bounded
existing action/completion canary remains required before v2 coverage or
permission grows.

Bridge v2's safety kernel remains the current direction: one active input
owner, opaque state-bound actions, execute-time validation, semantic completion,
unknown-no-retry, independent read-only inspection, and exact-environment
permission. It is not a claim of complete game coverage or a consumer-ready
product.

## Start Here

- [Current documentation map](docs/current/DOCUMENT_MAP.md)
- [Current status](docs/current/STATUS.md)
- [Current architecture](docs/current/ARCHITECTURE.md)
- [Current functional roadmap](docs/current/ROADMAP.md)
- [Product direction](docs/current/PRODUCT.md)
- [Re-SpireAgent setup and commands](Re-SpireAgent/README.md)
- [Gateway setup and commands](STS2MCP/README.md)

## Local Checks

```bash
# Re-SpireAgent typecheck, tests, and production build
npm run check

# Current documentation links only; archive material is intentionally excluded
npm run check:docs
```

Gateway checks need an installed copy of Slay the Spire 2 and `STS2_GAME_DIR`.
Use the exact commands in [`STS2MCP/README.md`](STS2MCP/README.md); do not
assume a successful build or historical preview is live-game qualification.

## Historical Material

- [`archive/original-spireagent/`](archive/original-spireagent/): retired
  root runtime, P8--P15 plans, learning artifacts, and their original
  documentation hierarchy.
- [`archive/bridge-v2-previews/`](archive/bridge-v2-previews/): dated Bridge
  preview closeouts and runtime evidence. These records retain evidence value
  only within their recorded environment and are not current permission.

No API keys, game binaries, installed DLLs, run records, or mutable local state
belong in Git.
