# STS2 AI Agent Portable

LLM-first Slay the Spire 2 agent with a layered local scaffold, structured memory, derived strategy knowledge, lightweight learning, and replaceable game/fact adapters.

This repository contains the TypeScript agent package. It does not include the game, the STS2 MCP C# mod, the Python MCP server, build outputs, or `node_modules`.

## Quick Start

```bash
npm install
npm run check
```

With Slay the Spire 2 and the external STS2 MCP mod running:

```bash
curl -s http://localhost:15526/
npm run collect:state
npm run agent:tick -- --dry-run
npm run agent:run -- --max-ticks 500 --delay-ms 120
```

For manual/Codex bridge LLM decisions:

```bash
npm run agent:run:bridge -- --max-ticks 500 --delay-ms 120
```

## Main Commands

```bash
npm run sync:sts2-data
npm run agent:tick
npm run agent:run
npm run agent:run:bridge
npm run agent:review
npm run agent:smoke
npm run check
npm run collect:state
npm run collect:watch
```

## Authority Docs

Read these first:

- [PROJECT_NORTH_STAR.md](PROJECT_NORTH_STAR.md): long-term constitution.
- [PROJECT_AUTHORITY_GUIDE.md](PROJECT_AUTHORITY_GUIDE.md): document authority, boundaries, phase route.
- [PROJECT_PLAN.md](PROJECT_PLAN.md): current project book and phase plan.
- [ARCHITECTURE.md](ARCHITECTURE.md): five-plane system architecture.
- [GAME_IO_CAPABILITIES.md](GAME_IO_CAPABILITIES.md): adapter capability contract.
- [DATA_SCHEMA.md](DATA_SCHEMA.md): transition and data schema contract.
- [LLM_HANDOFF.md](LLM_HANDOFF.md): current handoff state.

Subsystem docs:

- [AGENT_LOOP.md](AGENT_LOOP.md)
- [MEMORY_SYSTEM.md](MEMORY_SYSTEM.md)
- [DERIVED_KNOWLEDGE.md](DERIVED_KNOWLEDGE.md)
- [COMBAT_PLAN_AND_CHECKPOINT.md](COMBAT_PLAN_AND_CHECKPOINT.md)
- [HUMAN_CAPTURE_LIMITS.md](HUMAN_CAPTURE_LIMITS.md)
- [REPLAY_AND_EVAL.md](REPLAY_AND_EVAL.md)
- [REWARD_AND_EXPERIMENTS.md](REWARD_AND_EXPERIMENTS.md)
- [EXTERNAL_DEPENDENCIES.md](EXTERNAL_DEPENDENCIES.md)
- [CONTRIBUTING_OR_ENGINEERING_RULES.md](CONTRIBUTING_OR_ENGINEERING_RULES.md)

Operational docs live under `docs/` and are not architecture source of truth.

## Runtime Model

- STS2 MCP/REST reads game state and executes actions.
- Local TypeScript code normalizes state, generates candidates, scores locally, validates LLM choices, executes actions, records checkpoints, and maintains memory.
- LLM remains the strategic player for high-dispute decisions, but only selects from validated candidates with short JSON.
- Raw facts live in `data/spire-codex/`; learned strategy lives in `derived/` and `memory/`.

## Live Testing Policy

Normal HP loss or imperfect strategy is gameplay data, not a reason to stop a live run. Stop mid-run only for software defects such as invalid REST actions, no candidates on actionable screens, repeated no-progress actions, stale hand indices, illegal targets, settlement failures, crashes, or invalid LLM output being accepted.
