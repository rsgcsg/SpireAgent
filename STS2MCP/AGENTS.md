# STS2 Human-Equivalent Connector Engineering Guide

Read `../docs/current/decisions/ADR-0008-human-equivalent-ui-first-connector.md`,
`../docs/current/HUMAN_EQUIVALENT_CONNECTOR_IMPLEMENTATION_PLAN.md`, and
`docs/human-equivalent/` before changing the current Connector.

## Purpose

This repository contains the current game-side Human-Equivalent C plus REST
and optional MCP adapters. It is not the strategic brain.
In this workspace, "SpireAgent" means the rebuilt client under
`../Re-SpireAgent/` unless a legacy system is named explicitly.

The bridge owns:

- exact artifact/runtime identity and player-visible observations;
- state/frame/current-owner-bound UI affordances;
- execution-time native target validation on the Godot main thread;
- idempotent delivery and honest delivery uncertainty;
- immediate successor observations.

The bridge does not own:

- strategy, scoring, memory, learning, or prompt policy;
- arbitrary model-generated game calls;
- hidden information extraction;
- inferred facts that the game does not expose to the player.

## Hard Boundaries

- Never accept an index, node path, method name, coordinate, arbitrary
  reflection target or effect payload. HE accepts only a current advertised
  affordance with exact state/frame/owner/target parameters.
- Command publication and execution must share native legality.
- Rebuild and compare state before execution. Stale means reject.
- `applied` means input delivery, not complete business Outcome.
- Delivery uncertainty means `unknown`; never retry it.
- Unknown business source may still use exact known UI mechanics. Unknown UI
  owner/target remains visible unsupported.
- Private reflection must be exact-game-version scoped, documented, cached when
  appropriate, and fail closed.
- The complete v1 HTTP namespace is retired. Preserve its archive as migration
  evidence, but never restore it as a state, diagnostic, or mutation fallback.
- Do not leak draw order, RNG state, undisclosed event results, future rewards,
  enemy future moves, or other non-player-visible information.

## Module Boundaries

- `HumanEquivalent/Protocol`: current public C wire DTOs.
- `HumanEquivalent/Runtime`: current UI snapshot, affordance and delivery projection.
- `HumanEquivalent/Transport`: current `/api/he` HTTP handlers.
- `ConnectorV3/`: bounded native UI adapters and controller infrastructure
  reused internally during migration; `/api/v3` is explicit rollback only.
- `BridgeV2/`: internal migration assets and rollback, not current Agent API.
- `BridgeV2/Runtime`: game-independent identity, action registry, and command
  lifecycle.
- `BridgeV2/Game`: exact-version game facts and surface adapters.
- `BridgeV2/Transport`: HTTP routing only.
- `mcp/server.py`: thin MCP-to-HTTP pass-through; no game rules.
- `tests/`: pure protocol/runtime tests. Fixtures prove code behavior, not game
  compatibility.

The old v1 state/action switch is archived. Do not implement V3 by looking up a
V2 action ID. Share bounded native mechanics internally while preserving exact
source, owner, operands, Commit and Outcome.

## Required Change Evidence

For a new interaction or source:

1. Verify the current game class/API using the installed build, decompilation,
   or a reproducible runtime trace.
2. Document what the normal UI shows and what remains unavailable.
3. Add state and action contract tests.
4. Build against the exact supported game version.
5. Run a real in-game smoke before marking it Live-exercised.
6. Update `docs/human-equivalent/COVERAGE.md` and repository `STATUS.md`.

## Validation

On macOS:

```bash
GAME_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"
dotnet test STS2_MCP.sln -p:STS2GameDir="$GAME_DIR" -p:UseSharedCompilation=false
python3 -m py_compile mcp/server.py
dotnet build STS2_MCP.csproj -c Release -p:STS2GameDir="$GAME_DIR" -p:UseSharedCompilation=false
```

Never commit installed game assemblies, local config, `.env.local`, logs,
runtime request/response payloads, or local MCP client permissions.
