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

The active source Connector contract is `2.0-preview.77`; Re normalized schema
is `31`. Gate 1/M0 is closed as a bounded ordinary-single-player v2 interface:
Re and the optional MCP adapter are v2-only, Gateway `/api/v1` is retired, and
the exact loaded Preview.74 completed a 202-decision bounded one-game journey.
Preview.77 preserves Preview.76's New Leaf source repair and adds a typed
contract boundary: manifest migration fallbacks may support volatile session
trials but cannot become durable qualification packages.

The latest exact Preview.76 run completed a 172-decision boundary with 170
settled mutations and one safe stale refusal. It has `unrecorded` provenance
and did not exercise New Leaf, Kifuda or ordinary relic purchase, so it is
bounded coverage rather than Preview.77 evidence, Organic evidence, persistent
qualification or strategic-quality proof. See [current status](docs/current/STATUS.md).

The current program milestone is **M1 Measurable External Agent Baseline**,
with a bounded C-R1 connector-completion track running alongside A/D.
`Re-SpireAgent` is the primary value runtime; C provides the authoritative game
interface, D independently evaluates C and A, and P remains a minimum local
control/product track. See the [program plan](docs/current/PROGRAM_PLAN.md).

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
defines operation retirement and the native continuation boundary;
[ADR-0006](docs/current/decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md)
owns the current explicit-contract/durable-authority convergence.

## Start Here

- [Current documentation map](docs/current/DOCUMENT_MAP.md)
- [Current status](docs/current/STATUS.md)
- [Current architecture](docs/current/ARCHITECTURE.md)
- [Connector target architecture ADR](docs/current/decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md)
- [Operation retirement and native continuation ADR](docs/current/decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md)
- [Explicit contract and durable authority ADR](docs/current/decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md)
- [Current functional roadmap](docs/current/ROADMAP.md)
- [Current cross-component program plan](docs/current/PROGRAM_PLAN.md)
- [Workflow C-R1 short-term completion contract](docs/current/audits/WORKFLOW_C_R1_SHORT_TERM_COMPLETION_CONTRACT_2026-07-29.md)
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
