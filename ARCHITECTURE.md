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

Future learning-facing scaffold policies should live in this plane, but only as evidence-backed, proposal-driven inner-loop adjustments. Examples include a future `CombatReasonPolicy`, `CandidateTemplate` refinement, bounded-workspace presentation policy, or decision-class-specific `BudgetPolicy`. They may change how the LLM sees tradeoffs, survival lines, or future structure, but they must not directly mutate validation, execution legality, live flags, rollback authority, or fact/memory/derived separation.

Long term, the project should move toward a thinner permanently hand-authored soft layer. Decision classes may remain useful hard-shell routing and audit labels, but the inner scaffold should become increasingly proposal-driven so the LLM can reshape memory activation, first impressions, candidate templates, review style, scoring/scaffold policy, classification policy, and future skill policy under fixed outer-shell governance.

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

Replay/eval/review should be able to attribute whether a quality gap came from:

- missing candidate future content
- compression loss
- model reason omission
- provider reliability
- budget/recovery policy

Only after that attribution should the system propose inner-scaffold policy updates such as `CombatReasonPolicy`, `CandidateTemplate`, or `BudgetPolicy` changes. Promotion remains guarded, reviewed, and rollback-capable.

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
- `BUDGET_GOVERNANCE.md`
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

The current code has the data loop, replay reader, offline eval, grouped warning summary, lightweight strategy metrics, and shadow cognitive scaffold objects in the live loop.

Additive anchors exist in `src/domain/types.ts` for:

- `StrategicImpression`
- `SalienceSignal`
- `MemoryActivation`
- `CandidateFuture`
- `DeliberationPacket`
- `PredictionErrorRecord`
- `ReplayFrame`
- `ConsolidationRecord`
- `DeliberationWorkspaceComparison`
- `ShadowWorkspaceDecision`

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
- Unsupported or critical prediction attribution can create proposed `ConsolidationRecord` objects with conditions, evidence strength, blocked stable targets, and rollback text.
- Unknown/low-visibility attribution remains an evidence gap instead of becoming a learning proposal by itself.
- Fresh runs write a P7 `proposals.jsonl` surface for replay/eval/review; proposals do not apply stable learning updates.
- P7.5 derives grouped proposal evidence from the proposal surface. The grouping helps reviewers see recurring attribution patterns, but it remains replay/eval/review evidence and does not mutate memory, derived knowledge, strategy params, candidate ordering, prompt behavior, fallback, validation, or execution.
- Eval parses `events.jsonl` for future event-log adapters while current STS2MCP REST capabilities continue to report no reliable event log.

P6 attribution status:

- Candidate futures now carry mechanics-informed expected records where the scaffold can infer them.
- Checkpoint diffs can include `enemyDeltas`, allowing damage and kill predictions to be checked against actual post-action state.
- Prediction attribution is still shadow-only and feeds replay/eval/review, not stable learning updates.

P8 workspace status:

- `src/agent/workspace.ts` turns the existing `DeliberationPacket` into a compact structured strategic workspace for LLM deliberation.
- The controller records a `workspaceComparison` for fresh executor-logged transitions: legacy prompt hash, structured prompt hash, byte/token estimates, decision class, coverage, missing sections, required/preserved legacy-information sections, per-section token estimate, information-preservation score, provider readiness, and readiness.
- The controller can record `shadowWorkspaceDecision` when the P8 flags permit a structured shadow LLM call, but this decision is never executed.
- DeepSeek V4 Flash is prepared as the preferred P8 external provider through config, request shape, parser, output schema, conservative token/call/cost/timeout guards, usage/latency capture, and skipped/unavailable paths. `json_mode` uses `response_format: {"type":"json_object"}` plus explicit JSON-only system/user contract text and a single rescue retry for `empty_content`. It is injected as a P8 workspace decider, not the legacy live-prompt decider. `createLlmDecider()` ignores DeepSeek credentials; real P8 calls require `STS2_DEEPSEEK_API_KEY` plus explicit feature flags.
- `STS2_P8_WORKSPACE_SHADOW` and `STS2_P8_WORKSPACE_CALL` both default off. With defaults, P8 records comparison visibility without extra LLM calls.
- `STS2_P8_WORKSPACE_MAX_SHADOW_CALLS` is the canonical max-call guard and defaults to `1`; `STS2_P8_MAX_SHADOW_CALLS` is a backward-compatible alias. Hard token/cost/call budget excess records a skipped shadow decision and does not fail eval.
- `STS2_P8_WORKSPACE_ABLATION_MODE` is a shadow-only P8.4 provider ablation switch. `full` preserves the structured workspace, while `compact` and `ultra_compact` reduce nested context to test DeepSeek `empty_content` sensitivity. All modes repeat allowed candidate ids at the prompt tail and remain non-executing.
- P8 does not replace the live prompt yet. It does not alter candidate generation, ordering, scoring, fallback, validation, execution, stable memory, derived knowledge, or strategy params.
- P8.4 rollout-gate metadata is now visible in replay/eval/review. P8.5 is no longer preparation-only in the narrow sense: additive `legacy prompt + compact workspace summary` has reached explicit whitelist live execution, but wildcard broad live remains forbidden.
- Shadow boundaries should be relaxed only at the intended gates: P8.5 for additive prompt context, P9 for guarded stable updates, and P10 for the full guarded learning loop.
- This keeps the North Star boundary intact: the local scaffold shapes a better strategic workspace for the LLM, while the LLM remains the strategic player and all actions still pass through current validation/execution.
- P9 should not be interpreted as "direct stable memory writes". It should be implemented as proposal-driven guarded learning, with a hard protected shell around validation, execution, live authorization, rollback, and stable-write authority.
- Budget governance should be interpreted through `BUDGET_GOVERNANCE.md`: current P8 guards are early instances of call budget, recovery budget, run budget, evidence budget, and rollout budget, but they are not yet the finished governance architecture.
- BG-1/BG-2 now have a small code anchor: `src/agent/budgetGovernance.ts` resolves named governance profiles and records structured budget-policy metadata inside P8 workspace comparisons. This is observability and guard interpretation only; it does not change live behavior.
- BG-3 now has a small telemetry anchor: `src/agent/providerRecoveryPolicy.ts` summarizes existing provider recovery attempts so recovery budget can be audited separately from workspace compression. It does not change provider behavior.
- BG-4/BG-5/BG-6 now have readiness-report anchors: `src/replay/evidenceBudget.ts` and `src/replay/rolloutBudget.ts` make evidence sufficiency, rollout authorization, rollback, and protected-path write bans explicit without enabling live or stable learning paths.
