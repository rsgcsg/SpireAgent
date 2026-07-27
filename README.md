# SpireAgent

SpireAgent is being rebuilt around two active components:

- [`Re-SpireAgent/`](Re-SpireAgent/): the standalone LLM agent runtime.
- [`STS2MCP/`](STS2MCP/): the in-game STS2 Live Semantic Gateway, REST
  connector, and optional MCP adapter.

The original root-level SpireAgent runtime and its P8--P15 learning roadmap are
historical. They are preserved under [`archive/original-spireagent/`](archive/original-spireagent/)
and do not define the current architecture, permission model, or roadmap.

This is a public development repository, not yet a consumer-ready Workshop
release. The local HTTP Gateway now has lightweight single-controller
coordination, but no client authentication or malicious-local-process
isolation; keep it on loopback and read [Security](SECURITY.md) before running
third-party clients.

## Current Truth

The active connector source shares `2.0-preview.67` between C# and
Re-SpireAgent; Re normalized schema is `26`. Gate 1 is closed as a bounded
ordinary-single-player v2 connector baseline: Re and the default MCP adapter
are v2-only, the entire Gateway `/api/v1` namespace is retired, and the final
Neow's Fury lifecycle was completed under the recorded Preview.61 exact
identity. Preview.63 supplied the first D3 session permission loop. Preview.64
adds minimal runtime-bound client registration, one mutation-controller lease,
generation fencing and command attribution. Preview.65 added exact
operation-scoped persistent qualification. Preview.66 adds a non-authorizing
multi-environment Profile index, a risk-based migration policy, exact
candidate planning, evidence aggregation, automatic qualified-package
assembly, and atomic qualification-store reload. Preview.67 adds a required,
non-authorizing semantic-state/authority-projection identity shadow without
changing current state/action binding, permission, execution, completion, or
the model Prompt.

Preview.67 SHA `7da8946c...b768`, MVID
`12b55aef-499f-4ea8-8414-d3a360baa2ac` is built and installed locally but is
not yet cold-loaded. The last loaded and Organic-evidenced artifact remains
Preview.66 on
`v0.109.1|c8c577f6|-820620422`. One exact operation,
`main_menu/continue_run`, completed the candidate -> two-epoch Organic
evidence -> persistent qualification -> cold-restart recovery cycle. The
current manifest projects 87 exact operation identities: five explicit
high-precision contracts and 82 conservative identity/test-confirm fallbacks.
The other 86 operations are session canaries only. This is a real automatic
migration slice, not build-wide, all-operation, or cross-Mod qualification.
Exact source, loaded, candidate, Organic, and persistent evidence remain
separated in [current status](docs/current/STATUS.md).

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
- [Current cross-component program plan](docs/current/PROGRAM_PLAN.md)
- [Fresh-clone and local deployment guide](docs/current/LOCAL_SETUP.md)
- [Internal development and evaluation](docs/current/DEVELOPMENT_AND_EVALUATION.md)
- [Product direction](docs/current/PRODUCT.md)
- [Re-SpireAgent setup and commands](Re-SpireAgent/README.md)
- [Gateway setup and commands](STS2MCP/README.md)
- [Security and vulnerability reporting](SECURITY.md)

## Local Checks

```bash
# Re-SpireAgent typecheck, tests, and production build
npm run check

# Current documentation links only; archive material is intentionally excluded
npm run check:docs

# Non-authorizing exact-assembly compatibility report
export STS2_GAME_DIR="/path/to/Slay the Spire 2"
npm run audit:connector-compatibility

# Thin, safe operator entrypoint (see `npm run connector -- help`)
npm run connector -- inspect
```

Gateway checks need an installed copy of Slay the Spire 2 and `STS2_GAME_DIR`.
Use the exact commands in [`STS2MCP/README.md`](STS2MCP/README.md); do not
assume a successful build or historical preview is live-game qualification.

## Public Development Status

The source is published under the [MIT License](LICENSE). Contribution
boundaries are in [CONTRIBUTING.md](CONTRIBUTING.md), and vulnerability/secret
handling is in [SECURITY.md](SECURITY.md). GitHub Actions checks Re, active
documentation, the connector inventory, and Python syntax. The C# Gateway still
requires proprietary local game assemblies, so its tests, exact build,
installation, loaded identity, and Organic evidence remain explicit local
checks.

This repository does not yet publish a consumer Workshop package, Companion,
installer, stable Agent SDK, or support guarantee. `STS2MCP` remains the
compatibility-sensitive source directory and Mod ID; the component's
public-facing architectural name is **STS2 Agent Bridge / Semantic Gateway**.

## Historical Material

- [`archive/original-spireagent/`](archive/original-spireagent/): retired
  root runtime, P8--P15 plans, learning artifacts, and their original
  documentation hierarchy.
- [`archive/bridge-v2-previews/`](archive/bridge-v2-previews/): dated Bridge
  preview closeouts and runtime evidence. These records retain evidence value
  only within their recorded environment and are not current permission.

No API keys, game binaries, installed DLLs, run records, or mutable local state
belong in Git.
