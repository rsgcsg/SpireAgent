# Architecture

The system is an LLM-centered Slay the Spire 2 agent with a predictive cognitive scaffold. The LLM is the strategic player; local TypeScript code turns raw game data into compact strategic evidence, candidate futures, validation, execution, memory, and replayable learning signals.

This document follows `PROJECT_NORTH_STAR.md`. If an older phrase such as "layered local scaffold" conflicts with the North Star, interpret it as the local machinery that supports this flow:

```text
raw game state
  -> canonical state
  -> Strategic Impression / Salience
  -> Memory Activation
  -> Candidate Futures
  -> Deliberation Packet
  -> LLM strategic decision
  -> validated safe execution
  -> transition recording
  -> replay / evaluation / review
  -> prediction-error-driven learning
```

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
- expose deterministic evidence for salience and candidate futures

Current code:

- `src/domain/types.ts`
- `src/agent/state.ts`
- `src/agent/checkpoint.ts`

## Plane 3: Planning + LLM Decision

Responsibilities:

- build Strategic Impression and SalienceSignal records from canonical state
- activate relevant memory with evidence, conditions, confidence, and omissions
- generate legal candidates and CandidateFuture plans with predictions, costs, risks, assumptions, and invalidation triggers
- score candidates and route decisions
- build a compact DeliberationPacket for the LLM
- call LLM at most once per tick
- validate LLM JSON and candidate IDs
- choose fallback safely when LLM is unavailable or invalid

Current code:

- `src/agent/candidates.ts`
- `src/agent/scoring.ts`
- `src/agent/prompt.ts`
- `src/agent/derivedKnowledge.ts`
- `src/agent/llm.ts`
- `src/agent/fallback.ts`
- `src/agent/controller.ts`

## Plane 4: Data + Memory + Learning

Responsibilities:

- record snapshots, decisions, transitions, checkpoints, and run summaries
- maintain run memory, long-term memory, experience memory, and strategy params
- retrieve relevant memory and derived knowledge
- score runs with lightweight reward
- record prediction errors and replay frames for later attribution
- apply conservative, auditable updates

P2 shadow refinement retrieves a small read-only derived snapshot from `derived/` and records it in the cognitive scaffold. This supports prompt-parity and prediction-error inspection without replacing the live prompt or changing candidate ordering.

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
  -> build StrategicImpression + SalienceSignal[]
  -> activate memory and derived knowledge
  -> generate CandidateFuture[]
  -> build DeliberationPacket
  -> local routing or LLM JSON decision
  -> validate candidate
  -> execute via GameIO
  -> read post-state
  -> checkpoint/diff
  -> record decision/transition
  -> replay/eval/review
  -> prediction-error-driven learning proposal
```

## Current Implementation Boundary

The current code has the data loop, replay reader, offline eval, grouped warning summary, and lightweight strategy metrics. It does not yet fully construct the North Star cognitive objects in the live loop.

Additive anchors exist in `src/domain/types.ts` for:

- `StrategicImpression`
- `SalienceSignal`
- `MemoryActivation`
- `CandidateFuture`
- `DeliberationPacket`
- `PredictionErrorRecord`
- `ReplayFrame`
- `ConsolidationRecord`

Near-term refactors should populate these objects around the existing controller instead of rewriting the controller. They should keep live execution semantics stable, preserve replay/eval compatibility, and add tests before changing strategic behavior.

Phase 3.0 shadow-mode status:

- `src/agent/cognitiveScaffold.ts` now builds the first five objects in recording-only mode.
- New executor-logged transitions can carry `strategicImpression`, `salienceSignals`, `memoryActivation`, `candidateFutures`, `deliberationPacket`, and `selectedPlan`.
- Replay/eval can report coverage.
- The objects are not yet used to change prompt text, route decisions, candidate ordering, or execution.

P1 shadow DeliberationPacket status:

- `DeliberationPacket` now mirrors the current live prompt inputs as structured data.
- `promptParity` measures shadow coverage without storing the full live prompt.
- `PredictionErrorRecord` is generated from selected candidate future predictions and checkpoint/state-diff evidence.
- These remain observability objects only; the live prompt is still built by `src/agent/prompt.ts`.

P3/P4/P5 shadow status:

- Prediction errors now include typed checks and checkpoint attribution so replay/eval can distinguish block, damage, kill, card-flow, phase, and resource evidence.
- `CandidateFuture` now carries `predictionChecks`; `PredictionErrorRecord` consumes these structured checks before falling back to text-derived checks.
- `AgentDecisionRecorder` writes `ReplayFrame` MVP records into transitions.
- Unsupported prediction errors can create proposed `ConsolidationRecord` objects with conditions and rollback text, but they do not apply stable learning updates.
- Eval parses `events.jsonl` for future event-log adapters while current STS2MCP REST capabilities continue to report no reliable event log.

P6 attribution status:

- Candidate futures now carry mechanics-informed expected records where the scaffold can infer them.
- Checkpoint diffs can include `enemyDeltas`, allowing damage and kill predictions to be checked against actual post-action state.
- Prediction attribution is still shadow-only and feeds replay/eval/review, not stable learning updates.
