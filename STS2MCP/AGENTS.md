# STS2 Connector V3 Engineering Guide

Read `../docs/current/decisions/ADR-0007-connector-v3-canonical-architecture.md`,
`../docs/current/CONNECTOR_V3_IMPLEMENTATION_PLAN.md`, and
`docs/connector-v3/` before changing the current Connector.

## Purpose

This repository contains the current game-side Live Semantic Gateway for Slay
the Spire 2 plus REST and optional MCP adapters. It is not the strategic brain.
In this workspace, "SpireAgent" means the rebuilt client under
`../Re-SpireAgent/` unless a legacy system is named explicitly.

The bridge owns:

- game-version identity and compatibility checks;
- player-visible observations with explicit completeness;
- state/interaction-scoped parameterized commands with exact entity operands;
- execution-time revalidation on the Godot main thread;
- idempotent command lifecycle and honest outcome reporting.

The bridge does not own:

- strategy, scoring, memory, learning, or prompt policy;
- arbitrary model-generated game calls;
- hidden information extraction;
- inferred facts that the game does not expose to the player.

## Hard Boundaries

- Never accept an index, node path, method name, coordinate, arbitrary
  reflection target or effect payload. V3 accepts only a current command and
  exact operands advertised for its state and interaction.
- Command publication and execution must share native legality.
- Rebuild and compare state before execution. Stale means reject.
- HTTP success or a UI click means `started`, not `completed`.
- Timeout means `outcome=unknown`; do not auto-retry an unknown outcome.
- Unknown interactions stay observable but publish no commands.
- Private reflection must be exact-game-version scoped, documented, cached when
  appropriate, and fail closed.
- The complete v1 HTTP namespace is retired. Preserve its archive as migration
  evidence, but never restore it as a state, diagnostic, or mutation fallback.
- Do not leak draw order, RNG state, undisclosed event results, future rewards,
  enemy future moves, or other non-player-visible information.

## Module Boundaries

- `ConnectorV3/Protocol`: current wire DTOs only.
- `ConnectorV3/Runtime`: V3 observation, binding and command runtime.
- `ConnectorV3/Transport`: V3 HTTP routing.
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
6. Update `docs/connector-v3/COVERAGE.md` and repository `STATUS.md`.

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
