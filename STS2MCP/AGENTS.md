# STS2 Agent Bridge Engineering Guide

Read `docs/bridge-v2/CURRENT_STATUS.md`,
`docs/bridge-v2/REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md`,
`docs/bridge-v2/PROTOCOL.md`, `docs/bridge-v2/OBSERVATION_POLICY.md`, and
`docs/bridge-v2/LIVE_GAME_CONNECTION_BOUNDARY.md` before changing Bridge v2.

## Purpose

This repository contains the current game-side Live Semantic Gateway for Slay
the Spire 2 plus REST and optional MCP adapters. It is not the strategic brain.
In this workspace, "SpireAgent" means the rebuilt client under
`../Re-SpireAgent/` unless a legacy system is named explicitly.

The bridge owns:

- game-version identity and compatibility checks;
- player-visible observations with explicit completeness;
- state-scoped opaque legal actions;
- execution-time revalidation on the Godot main thread;
- idempotent command lifecycle and honest outcome reporting.

The bridge does not own:

- strategy, scoring, memory, learning, or prompt policy;
- arbitrary model-generated game calls;
- hidden information extraction;
- inferred facts that the game does not expose to the player.

## Hard Boundaries

- Never accept a v2 index, target, node path, method name, or arbitrary payload
  from a client. Clients may submit only an advertised `action_id` with its
  exact `state_id`.
- Legal-action generation and execution must use the same validator.
- Rebuild and compare state before execution. Stale means reject.
- HTTP success or a UI click means `started`, not `completed`.
- Timeout means `outcome=unknown`; do not auto-retry an unknown outcome.
- Unknown surfaces and failed version bindings return no legal actions.
- Private reflection must be exact-game-version scoped, documented, cached when
  appropriate, and fail closed.
- The complete v1 HTTP namespace is retired. Preserve its archive as migration
  evidence, but never restore it as a state, diagnostic, or mutation fallback.
- Do not leak draw order, RNG state, undisclosed event results, future rewards,
  enemy future moves, or other non-player-visible information.

## Module Boundaries

- `BridgeV2/Protocol`: wire DTOs only.
- `BridgeV2/Runtime`: game-independent identity, action registry, and command
  lifecycle.
- `BridgeV2/Game`: exact-version game facts and surface adapters.
- `BridgeV2/Transport`: HTTP routing only.
- `mcp/server.py`: thin MCP-to-HTTP pass-through; no game rules.
- `tests/`: pure protocol/runtime tests. Fixtures prove code behavior, not game
  compatibility.

The old v1 state/action switch is archived outside the active project. Add new
v2 behavior through a bounded semantic contract with a coverage row and
game-fact evidence; never copy archived dispatch logic back into the build.

## Required Change Evidence

For a new surface:

1. Verify the current game class/API using the installed build, decompilation,
   or a reproducible runtime trace.
2. Document what the normal UI shows and what remains unavailable.
3. Add state and action contract tests.
4. Build against the exact supported game version.
5. Run a real in-game smoke before marking the surface `ready`.
6. Update `PLAYER_VISIBLE_COVERAGE.md` and `CURRENT_STATUS.md`.

## Validation

On macOS:

```bash
GAME_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"
dotnet test STS2_MCP.sln -p:STS2GameDir="$GAME_DIR"
python3 -m py_compile mcp/server.py
dotnet build STS2_MCP.csproj -c Release -p:STS2GameDir="$GAME_DIR"
```

Never commit installed game assemblies, local config, `.env.local`, logs,
runtime request/response payloads, or local MCP client permissions.
