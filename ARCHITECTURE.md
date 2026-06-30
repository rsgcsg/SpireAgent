# Architecture

The system is an LLM-first Slay the Spire 2 agent with a layered local scaffold. The LLM is the strategic player; local TypeScript code provides state clarity, deterministic checks, candidate generation, validation, execution, memory, and observability.

## Five Planes

```text
Plane 1: Game Integration
Plane 2: Canonical State + Mechanics
Plane 3: Planning + LLM Decision
Plane 4: Data + Memory + Learning
Plane 5: Evaluation + Engineering Governance
```

## Plane 1: Game Integration

Responsibilities:

- read raw game state
- execute validated actions
- expose coarse action results
- report adapter capabilities
- eventually read game/human event logs

Current code:

- `src/agent/client.ts`
- `src/game-io/types.ts`
- `src/adapters/sts2mcp/capabilities.ts`

Boundary:

- The game-side mod is a sensor and actuator.
- The mod may expose state, actions, legal-action/raw-actionable data, action results, event logs, card instance IDs, target IDs, option IDs, and pre/post state hashes.
- The mod must not contain LLM calls, prompts, API keys, memory, derived strategy, reward, experiment logic, replay/eval, vector DBs, or training export logic.

## Plane 2: Canonical State + Mechanics

Responsibilities:

- normalize raw MCP/REST state into canonical state
- define domain schemas
- validate legality, energy, targets, options, affordability
- estimate damage, block, incoming damage, lethal, and deterministic risk
- compute state diffs and checkpoints

Current code:

- `src/domain/types.ts`
- `src/agent/state.ts`
- `src/agent/checkpoint.ts`

## Plane 3: Planning + LLM Decision

Responsibilities:

- generate legal candidates and future candidate plans
- score candidates and route decisions
- build compact prompt context
- call LLM at most once per tick
- validate LLM JSON and candidate IDs
- choose fallback safely when LLM is unavailable or invalid

Current code:

- `src/agent/candidates.ts`
- `src/agent/scoring.ts`
- `src/agent/prompt.ts`
- `src/agent/llm.ts`
- `src/agent/fallback.ts`
- `src/agent/controller.ts`

## Plane 4: Data + Memory + Learning

Responsibilities:

- record snapshots, decisions, transitions, checkpoints, and run summaries
- maintain run memory, long-term memory, experience memory, and strategy params
- retrieve relevant memory and derived knowledge
- score runs with lightweight reward
- apply conservative, auditable updates

Current code:

- `src/data/transitionSchema.ts`
- `src/agent/decisionRecorder.ts`
- `src/agent/collector.ts`
- `src/agent/memory.ts`
- `src/agent/review.ts`
- `data/spire-codex/`
- `derived/`
- `memory/`

## Plane 5: Evaluation + Engineering Governance

Responsibilities:

- replay and offline eval
- smoke and fixture tests
- debug reports
- adapter conformance
- experiment logs and rollback
- documentation authority

Current code/docs:

- `src/replay/reader.ts`
- `src/replay/cli.ts`
- `src/eval/runner.ts`
- `src/eval/cli.ts`
- `src/agent/smoke.ts`
- `DEBUG_REPORT.md`
- `PROJECT_AUTHORITY_GUIDE.md`
- `CONTRIBUTING_OR_ENGINEERING_RULES.md`

## Runtime Flow

```text
GameIO.readState()
  -> normalizeGameState()
  -> update run memory
  -> generate candidates/plans
  -> score + route
  -> local decision or LLM JSON
  -> validate candidate
  -> execute via GameIO
  -> read post-state
  -> checkpoint/diff
  -> record decision/transition
  -> review/reward after run
```

## Current Phase 2 Boundary

Phase 2 adds executor-logged agent transition recording, a minimal replay timeline reader, and Phase 2.5 offline engineering eval without replacing the controller. It should not implement strategy-quality eval, event-log mod work, vector memory, or segmented combat planning.
