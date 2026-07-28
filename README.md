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

The active connector source shares `2.0-preview.69` between C# and
Re-SpireAgent; Re normalized schema is `28`. Gate 1 is closed as a bounded
ordinary-single-player v2 connector baseline: Re and the default MCP adapter
are v2-only, the entire Gateway `/api/v1` namespace is retired, and the final
Neow's Fury lifecycle was completed under the recorded Preview.61 exact
identity. Preview.63 supplied the first D3 session permission loop. Preview.64
adds minimal runtime-bound client registration, one mutation-controller lease,
generation fencing and command attribution. Preview.65 added exact
operation-scoped persistent qualification. Preview.66 adds a non-authorizing
multi-environment Profile index, a risk-based migration policy, exact
candidate planning, evidence aggregation, automatic qualified-package
assembly, and atomic qualification-store reload. Preview.68 preserves the
non-authorizing identity shadow and adds coherent read-only observation retry,
one-game terminal supervision, typed receipt completion boundaries, exact
Kifuda continuation handoff, source-bound deck-enchant contracts, native
hover-derived Orb text, and a non-authorizing runtime contract/source shadow.
Preview.69 adds exact run-start settling, bounded semantic-cycle recovery, and
ADR-0004 encounter-scoped provisional trials without making one success a
persistent compatibility claim.

The last verified loaded artifact remains Preview.68 on
`v0.109.1|c8c577f6|-820620422` until Preview.69 is cold-started. Recent
Preview.68 runs exposed the defects fixed by Preview.69. Their provenance is
`unrecorded`, so they are real-runtime
defect/coverage evidence rather than Organic qualification. Preview.67
permission does not authorize the new Preview.68 MVID.
Exact source, loaded, candidate, Organic, and persistent evidence remain
separated in [current status](docs/current/STATUS.md).

Bridge v2's safety kernel remains the current direction: one active input
owner, opaque state-bound actions, execute-time validation, semantic completion,
unknown-no-retry, independent read-only inspection, and exact-environment
permission. It is not a claim of complete game coverage or a consumer-ready
product.

The repository has one accepted Connector destination: the
[Semantic Gateway Two-Plane Architecture](docs/current/decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
It preserves one Gateway authority, separates live decisions from compatibility
evidence, and keeps future model projections on the Re consumer side.
[ADR-0003](docs/current/decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md)
defines the shadow-first retirement of global operation identity and the exact
native continuation boundary.

## Start Here

- [Current documentation map](docs/current/DOCUMENT_MAP.md)
- [Current status](docs/current/STATUS.md)
- [Current architecture](docs/current/ARCHITECTURE.md)
- [Connector target architecture ADR](docs/current/decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md)
- [Operation retirement and native continuation ADR](docs/current/decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md)
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

After a cold game start, the single bounded live entry is:

```bash
cd Re-SpireAgent
npm run agent:run
```

It verifies exact loaded identity and resumes a Gateway-revalidated exact trial
before invoking the model; permission never carries across MVIDs.

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
