# STS2 AI Agent Portable

LLM-centered Slay the Spire 2 agent with a predictive cognitive scaffold, structured memory, derived strategy knowledge, replay/eval data loop, lightweight learning, and replaceable game/fact adapters.

This repository contains the TypeScript agent package. It does not include the game, the STS2 MCP C# mod, the Python MCP server, build outputs, or `node_modules`.

## Quick Start

```bash
npm install
npm run check
```

## Local API Keys

Secrets are loaded from `.env.local` on this machine only. That file is ignored by git and must not be committed.

To configure DeepSeek for P8 shadow workspace calls:

```bash
cp .env.example .env.local
chmod 600 .env.local
```

Then edit `.env.local` and fill in:

```bash
STS2_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

Keep the variable name as `STS2_DEEPSEEK_API_KEY`. Do not put API keys in source files, docs, replay data, debug reports, commits, or command output.

P8 DeepSeek calls are shadow-only and opt-in. A safe one-call test is:

```bash
npm run agent:tick -- --dry-run
```

With the default `.env.local` settings, the project allows at most one guarded shadow call per process and does not execute the DeepSeek decision.
The canonical limit variable is `STS2_P8_WORKSPACE_MAX_SHADOW_CALLS`; `STS2_P8_MAX_SHADOW_CALLS` is accepted as a backward-compatible alias.
DeepSeek shadow output defaults to `STS2_DEEPSEEK_OUTPUT_MODE=json_mode` with `response_format: { "type": "json_object" }`, `STS2_DEEPSEEK_TEMPERATURE=0`, `STS2_DEEPSEEK_TOP_P=0.1`, and a single `STS2_DEEPSEEK_EMPTY_RETRY_LIMIT=1` rescue retry for `empty_content`. Set `STS2_DEEPSEEK_OUTPUT_MODE=non_json_strict` only for A/B shadow testing.
P8.4 shadow prompt ablation uses `STS2_P8_WORKSPACE_ABLATION_MODE=full` by default. For small shadow-only experiments, use `compact` or `ultra_compact`; these modes do not change the live prompt or execute the DeepSeek decision.

Do not enable live P8 integration by default. The first allowed live experiment is later P8.5-only and must be additive:

```bash
# future gated experiment only; keep off unless the P8.4 gate says go
STS2_P8_LIVE_ADDITIVE=0
STS2_P8_LIVE_DECISION_CLASSES=combat:llm_required,card_reward:llm_required
```

P8.5 may add a compact workspace summary beside the legacy prompt. P9/P10 are the places to gradually relax shadow boundaries for guarded learning updates, with whitelist, fallback, eval, and rollback still required.

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
npm run data:replay -- --latest
npm run data:eval -- --latest
npm run check
npm run collect:state
npm run collect:watch
```

## Authority Docs

Read these first:

- [PROJECT_NORTH_STAR.md](PROJECT_NORTH_STAR.md): long-term constitution.
- [PROJECT_NORTH_STAR_CHINESE.md](PROJECT_NORTH_STAR_CHINESE.md): Chinese long-term constitution.
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

- STS2 MCP/REST reads game state and executes validated actions.
- Local TypeScript code normalizes state, identifies salience, activates memory, generates candidate futures, validates LLM choices, executes actions, records checkpoints, and maintains replayable data.
- LLM remains the strategic player for high-dispute decisions, but only selects from validated candidates with compact strategic context.
- Raw facts live in `data/spire-codex/`; learned strategy lives in `derived/` and `memory/`.

## Phase Route

The formal route currently runs through Phase 10:

- Phase 1-2 established schema, capabilities, transition recording, replay, and eval.
- Phase 3-5 migrate the loop toward shadow cognitive objects, derived/memory visibility, and event-log compatibility.
- Phase 6-9 add typed prediction-error attribution, consolidation proposals, guarded stable updates, and controlled shadow-to-live deliberation migration.
- Phase 10 is the Guarded Learning Loop: prediction -> execution evidence -> prediction error -> consolidation -> guarded update -> replay/eval validation -> rollback-capable review.

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for current completion gaps and acceptance criteria.

## Live Testing Policy

Normal HP loss or imperfect strategy is gameplay data, not a reason to stop a live run. Stop mid-run only for software defects such as invalid REST actions, no candidates on actionable screens, repeated no-progress actions, stale hand indices, illegal targets, settlement failures, crashes, or invalid LLM output being accepted.
