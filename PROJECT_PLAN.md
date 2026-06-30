# Project Plan

This is the Phase 0 project book for the Slay the Spire 2 AI agent. It records the current diagnosis, target architecture, staged plan, risks, and acceptance criteria. Future agents should read this before making structural changes.

## Current Diagnosis

The current package is a working TypeScript agent, not a blank project.

Reusable pieces:

- `src/agent/client.ts` already isolates REST state reads and action execution behind small `StateSource` / `ActionExecutor` interfaces.
- `src/agent/state.ts` normalizes the current MCP JSON into a compact `NormalizedState`.
- `src/agent/candidates.ts` generates candidates for combat, rewards, map, shop, events, rest, menu, card select, and bundle select.
- `src/agent/scoring.ts` routes decisions into local, fallback, and LLM-needed paths.
- `src/agent/controller.ts` runs the loop, calls LLM at most once per tick, executes actions, records checkpoints, and updates memory.
- `src/agent/memory.ts` has run memory, long-term memory, experience memory, strategy params, lightweight reward, and conservative strategy updates.
- `src/agent/checkpoint.ts` computes post-action state diff and checkpoint kind.
- `src/agent/collector.ts` can capture read-only raw and compact state snapshots.
- `src/agent/review.ts` summarizes decision routes, fallbacks, LLM usage, and checkpoints.
- `data/spire-codex/`, `derived/`, and `memory/` are already separate directories.

Main problems:

- The project does not yet have a formal `domain-core` layer. Types are mostly in `src/agent/types.ts`.
- `controller.ts` still owns too much orchestration detail.
- `candidates.ts` and `scoring.ts` are screen-mixed and should be split gradually.
- The current collector records snapshots, not full transition records.
- There is no replay CLI or offline eval runner yet.
- Human action capture is not reliable because current STS2MCP exposes state and executor actions, not human UI event logs.
- LLM output validation is minimal and should become schema-based.
- Prompt building is centralized, but it does not yet pull enough structured derived knowledge.
- Combat is still mostly one action per tick. It has checkpoint detection, but not full segmented plans.
- Adapter capabilities are documented conceptually but not yet represented as a typed runtime interface.

## Recommended Architecture

The long-term architecture is:

```text
Raw MCP/REST State
  -> game-io adapter
  -> state-normalizer
  -> canonical GameState
  -> fact-db + derived-knowledge + memory-system
  -> planning-scaffold
  -> decision gate
  -> local decision or LLM JSON decision
  -> validated action
  -> execution-loop
  -> transition recorder
  -> replay/review/eval
  -> reward + experiment manager
```

Target modules:

- `domain-core`: versioned schemas for state, actions, transitions, memory, reward, experiments, capabilities.
- `game-io`: stable interfaces for state read, action execute, event read, and action-result read.
- `adapters/sts2mcp`: current localhost REST adapter.
- `adapters/spire-codex`: fact database sync/read adapter.
- `state-normalizer`: raw state to canonical state.
- `mechanics-engine`: deterministic legality, energy, target, damage, block, lethal, affordability, state diff.
- `fact-db`: objective cards, relics, characters, keywords, potions.
- `derived-knowledge`: tags, synergies, anti-synergies, strategy experience.
- `memory-system`: run memory, long-term memory, decision log, retrieval, compression.
- `planning-scaffold`: candidate actions, combat plans, route/shop/event/card-reward plans.
- `llm-decision`: compact prompt, provider adapters, JSON validation.
- `execution-loop`: execution, settlement, checkpoint, replan.
- `data-recorder`: snapshots, events, transitions, replay frames.
- `reward-engine`: post-run scoring and conservative feedback.
- `experiment-manager`: strategy params, proposals, rollback.
- `review-cli`, `replay-cli`, `eval-runner`: observability and offline evaluation.

## Module Boundaries

Dependency direction must stay low-to-high:

```text
domain-core
  <- game-io / state-normalizer / mechanics-engine / fact-db
  <- derived-knowledge / memory-system
  <- planning-scaffold
  <- llm-decision
  <- execution-loop
  <- CLI
```

Rules:

- Game I/O does not know strategy.
- Raw facts do not contain learned strategy.
- Derived knowledge does not mutate raw facts.
- Memory is structured, retrievable, compressible, and auditable.
- LLM never directly executes game actions. It selects from validated candidates.
- Recorder records decisions and transitions; it does not decide strategy.
- External projects are hidden behind adapters and capability checks.

## Long-Term Route

Phase 0: Exploration and project book.

- Audit current code and docs.
- Record project diagnosis and architecture.
- Record external dependency evaluation.
- Record human capture limits.
- Record staged implementation plan and acceptance criteria.

Phase 1: Core boundaries and schema.

- Add `domain-core` schemas.
- Add `GameIO` interface and `AdapterCapabilities`.
- Wrap current REST client as `STS2MCP` adapter.
- Add transition schema.
- Preserve existing commands and behavior.

Current Phase 1 status:

- Source-of-truth documentation is being consolidated.
- New code should land behind additive interfaces and schema helpers.
- Existing `src/agent/*` commands must remain compatible.
- No full controller rewrite, replay/eval implementation, event-log mod, vector memory, or segmented combat rewrite belongs in Phase 1.
- Implemented Phase 1 code anchors:
  - `src/domain/types.ts`
  - `src/game-io/types.ts`
  - `src/adapters/sts2mcp/capabilities.ts`
  - `src/data/transitionSchema.ts`
  - minimal LLM candidate validation in `src/agent/llm.ts`

Phase 2: Precise agent recording and replay.

- Add `AgentDecisionRecorder`.
- Create `data/runs/<runId>/`.
- Write `metadata.json`, `snapshots/`, `transitions.jsonl`.
- Add state diff module and replay reader.
- Keep `collect:state` and `collect:watch` compatible.

Current Phase 2 MVP status:

- `src/agent/decisionRecorder.ts` writes executor-logged agent transitions around successful real agent actions.
- `data/runs/<runId>/` now contains `metadata.json`, `snapshots/`, `events.jsonl`, `transitions.jsonl`, and a minimal `replay.json` placeholder.
- Existing `memory/collected/` snapshot collection remains compatible.
- `src/replay/reader.ts` and `src/replay/cli.ts` can read transitions and print a timeline with `npm run data:replay -- <runId-or-run-dir>`.
- Smoke covers agent executor ground truth transitions, snapshot-only mapping, JSONL parsing, and replay reader loading.

Remaining Phase 2+ gaps:

- No offline eval runner yet.
- No HumanPlayRecorder diff fallback implementation yet.
- No event-log mod or ground-truth human event adapter yet.

Phase 3: Layered scaffold and short prompt.

- Split mechanics from scoring.
- Add combat plan generator and decision gate.
- Improve card reward, shop, route, event, rest candidates.
- Add schema validation for LLM decisions.
- Improve checkpoint continuation.

Phase 4: Memory, derived, reward.

- Make memory retrieval explicit.
- Add derived retrieval snapshots.
- Add structured reflection and reward output.
- Add strategy update records with rollback metadata.
- Add experiment log.

Phase 5: Event log adapter.

- Design or implement STS2MCP event-log extension.
- Add `GET /api/v1/events?since=<eventId>`.
- Add event-first human recorder.
- Keep diff inference only as fallback and validation.

## First Phase File Change List

Phase 1 should touch only structural boundaries and tests:

- Add `src/domain/types.ts` or `src/core/domain.ts` for stable schemas.
- Add `src/game-io/types.ts` for `GameIO`, `StateReader`, `ActionExecutor`, `GameEventReader`, `AdapterCapabilities`.
- Move or re-export current `AgentAction`, `NormalizedState`, and transition-related types without breaking imports.
- Add `src/adapters/sts2mcp/capabilities.ts`.
- Add `src/data/transitionSchema.ts`.
- Add smoke assertions for adapter capabilities and LLM candidate validation.
- Update `README.md`, `ARCHITECTURE.md`, `GAME_IO_CAPABILITIES.md`, and `DATA_SCHEMA.md`.

Avoid in Phase 1:

- No full controller rewrite.
- No changing action semantics.
- No deleting existing `src/agent/*`.
- No new hard dependency on external packages unless justified.

## Acceptance Criteria

Early acceptance:

- `npm install` succeeds.
- `npm exec tsc -- --noEmit` succeeds.
- `npm run agent:smoke` succeeds offline.
- `npm run agent:review` works on existing memory.
- `npm run collect:state` works when MCP is running.
- `npm run agent:tick -- --dry-run` works when MCP is running.
- Existing `agent:run` and `agent:run:bridge` scripts are preserved.
- STS2MCP capabilities are explicit, including `canReadHumanEvents=false`.
- Human diff inference is never marked ground truth.
- New docs describe current limits and future path.

Production-oriented acceptance:

- Live runs produce transition logs.
- Replay can answer what was seen, what was selected, and what changed.
- LLM calls are short JSON and validated.
- Prompt never includes full raw state, full Codex, or full memory.
- Strategy updates include reason, evidence, confidence, and rollback.
- Program bugs become fixtures or smoke tests.
