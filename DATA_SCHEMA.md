# Data Schema

This document defines the durable data model. Current code keeps legacy `CollectedStateRecord` and `DecisionLogEntry` compatible while writing Phase 2 agent transitions for real executed actions. The North Star direction is to make transitions carry not only actions and diffs, but also the cognitive scaffold that produced the decision.

Current code paths:

- `src/domain/types.ts`: shared domain contracts.
- `src/data/transitionSchema.ts`: transition helpers and ground-truth invariant checks.
- `src/agent/decisionRecorder.ts`: `AgentDecisionRecorder` writes executor-logged agent transitions.
- `src/replay/reader.ts`: reads transition JSONL and builds timeline summaries.
- `src/replay/cli.ts`: `npm run data:replay -- <runId-or-run-dir>` prints a transition timeline.
- `src/eval/runner.ts`: runs offline engineering checks over saved runs.
- `src/eval/cli.ts`: `npm run data:eval -- --latest|--run-id <runId>|--run-dir <path>`.

## Run Directory

Agent run data lives under:

```text
data/runs/<runId>/
  metadata.json
  snapshots/
  events.jsonl
  transitions.jsonl
  replay.json
  review.json          # future
  rewards.json         # future
  experiment_refs.json # future
```

`memory/collected/` remains compatible for existing snapshot collection.

## Transition Record

Each key decision should be recorded as a transition:

```ts
interface TransitionRecord {
  schemaVersion: number;
  runId: string;
  transitionId: string;
  source: "agent" | "human" | "game" | "replay";
  captureMode: "executor_logged" | "mcp_event" | "diff_inferred" | "snapshot_only";
  isGroundTruth: boolean;
  confidence: number;
  uncertainty: string[];
  candidateActions: unknown[];
  inferenceReason?: string;
  tick: number;
  timestamp: string;
  screen: string;
  floor?: number;
  hp?: number;
  maxHp?: number;
  gold?: number;
  preStateRef: string;
  postStateRef?: string;
  rawStatePath?: string;
  compactState?: unknown;
  preState?: unknown;
  postState?: unknown;
  compactPreState: unknown;
  compactPostState?: unknown;
  legalActions: unknown[];
  selectedAction: unknown | null;
  localScores?: unknown;
  llmDecision?: unknown;
  decisionAudit?: unknown;
  derivedSnapshot?: unknown;
  memorySnapshot?: unknown;
  strategicImpression?: unknown;
  salienceSignals?: unknown[];
  memoryActivation?: unknown;
  candidateFutures?: unknown[];
  deliberationPacket?: unknown;
  selectedPlan?: unknown;
  predictionError?: unknown;
  replayFrame?: unknown;
  consolidation?: unknown;
  executionResult?: unknown;
  stateDiff?: unknown;
  rawRefs: string[];
}
```

North Star cognitive fields are optional for compatibility:

- `strategicImpression`: first-pass strategic read of the state, not a generic summary.
- `salienceSignals`: danger, opportunity, uncertainty, memory resonance, irreversible choice, repeated failure, resource pressure, or strategy-quality signals.
- `memoryActivation`: memories retrieved for this decision, with relevance, confidence, evidence, conditions, and omissions.
- `candidateFutures`: candidate plans with predicted outcomes, costs, risks, assumptions, invalidation triggers, and execution requirements.
- `deliberationPacket`: compact strategic package shown to the LLM.
- `selectedPlan`: the chosen candidate future or plan-level decision.
- `predictionError`: post-hoc record of what was predicted, what happened, and which layer likely needs repair.
- `replayFrame`: replay-oriented view used for attribution and review.
- `consolidation`: controlled learning/update proposal with evidence and rollback.

These fields should be populated gradually. Their absence in older transitions is valid; their presence must not weaken ground-truth rules.

Phase 3.0 shadow-mode writer:

- `src/agent/cognitiveScaffold.ts` builds `StrategicImpression`, `SalienceSignal[]`, `MemoryActivation`, `CandidateFuture[]`, and a shadow `DeliberationPacket`.
- `AgentController` constructs these objects after existing candidate scoring.
- `AgentDecisionRecorder` writes them to new executor-logged transitions.
- These objects are recording-only. They do not change prompt construction, candidate ordering, fallback selection, action validation, or execution.
- Initial `CandidateFuture` records are explicitly action-first/shallow futures. They wrap existing scored candidates with plan, score/confidence, risks, assumptions, invalidation triggers, and coarse predicted outcomes.
- New `CandidateFuture` records also include `predictionChecks`, a typed shadow check list generated beside `predictedOutcome`.

Phase 3.1/P1 shadow DeliberationPacket:

- `DeliberationPacket` now records structured prompt-adjacent sections: state facts, enemy intent, hand summary, deck summary, legal actions, top candidates, run memory summary, derived knowledge summary, output schema, prompt parity, and the existing strategic/salience/memory/candidate-future objects.
- `promptParity` records which live-prompt sections are represented in the shadow packet and which are still missing. It stores coverage metadata, not the full prompt text.
- `predictionError` records a minimal post-action prediction check against checkpoint/state-diff evidence. It is intentionally conservative: unsupported or unmeasurable predictions become unknown/open rather than guessed.
- These fields are still shadow-only. They do not replace `src/agent/prompt.ts`, alter LLM prompts, alter candidate ordering, or alter action selection.

P2 shadow derived/parity refinement:

- `src/agent/derivedKnowledge.ts` retrieves a small read-only subset from `derived/card-tags.json`, `derived/relic-tags.json`, `derived/synergy-rules.json`, and `derived/draft-rules.md`.
- New transitions receive a non-empty `derivedSnapshot` when relevant local derived rules exist.
- `DeliberationPacket.derivedKnowledgeSummary` reflects whether derived knowledge was present and how many facts/rules were included.
- `promptParity.missingSections` should no longer include `derived_knowledge` on fresh transitions when derived retrieval succeeds.
- `PredictionErrorRecord.evidence[0].attribution` now separates damage, defense, hp, card flow, phase, and resource signals from checkpoint/state-diff evidence.
- Replay/eval/review now expose `derivedSnapshot` and `derivedKnowledgeSummary` coverage directly, instead of requiring readers to infer derived coverage only from `promptParity.missingSections`.

P3/P4/P5 shadow object refinement:

- `PredictionErrorRecord.evidence[0].typedChecks` now stores typed checks such as `block_delta`, `enemy_hp_or_block_delta`, `card_removed_from_hand`, `phase_or_turn_change`, and `phase_or_visible_progress`.
- `PredictionErrorRecord` now prefers `CandidateFuture.predictionChecks` over text-derived checks when they are present. Text `predictedOutcome` remains for compatibility and human readability.
- New executor-logged transitions receive a `ReplayFrame` MVP that binds the transition id, state summary, selected action, state diff, cognitive scaffold, prompt parity, and prediction error.
- Unsupported or partially unknown prediction errors can produce a shadow-only `ConsolidationRecord` proposal. These proposals include rollback text and conditions, and they do not mutate memory, derived knowledge, candidate templates, or strategy params.
- Offline eval parses `events.jsonl` and reports `parsedEvents`. Empty event logs are valid with current STS2MCP capabilities; malformed event JSONL is a program-level eval error.

P6 typed attribution refinement:

- `PredictionErrorRecord.attributionBuckets` summarizes typed prediction checks into damage, defense, HP, kill, phase, card-flow, resource, route/reward, or unknown buckets.
- Buckets include status, prediction types, expected evidence, actual checkpoint evidence, evidence reasons, and severity.
- `CandidateFuture.predictionChecks.expected` can include mechanics-informed expectations such as card index removal, target id, expected damage/block, expected HP loss, expected energy cost, route progress, and reward-flow progress.
- New checkpoint diffs can include `enemyDeltas`, which let replay/eval compare damage and kill predictions against post-action state instead of only checking broad checkpoint reason names.
- Buckets are shadow evidence for replay/eval/review. They do not apply stable memory, derived knowledge, candidate template, or strategy-param updates by themselves.

P7 consolidation proposal lifecycle MVP:

- `ConsolidationRecord` proposals can carry `affectedModule`, `proposedChange`, `expiry`, `revalidation`, and `createdAt`.
- Lifecycle status supports `proposed`, `accepted`, `rejected`, `expired`, `reverted`, plus legacy `rolled_back` for old data compatibility.
- Proposal lifecycle metadata is review/eval evidence only until a later guarded applicator exists.

## Ground Truth Rules

- Agent-selected executor actions: `captureMode=executor_logged`, `isGroundTruth=true`.
- MCP/mod event actions: `captureMode=mcp_event`, `isGroundTruth=true` only if the event has enough identity fields.
- Human actions from any non-`mcp_event` capture mode cannot be ground truth.
- Human diff inference: `captureMode=diff_inferred`, `isGroundTruth=false`.
- Snapshot-only records: `captureMode=snapshot_only`, `isGroundTruth=false`.

These rules are enforced by `assertGroundTruthInvariants()` in `src/data/transitionSchema.ts`.

Current helpers:

- `createSnapshotOnlyTransition()`
- `createSnapshotOnlyTransitionFromCollectedState()`
- `createExecutorLoggedTransitionSkeleton()`
- `createDiffInferredTransitionSkeleton()`
- `assertGroundTruthInvariants()`

Phase 2 writer:

- `AgentDecisionRecorder` records only actions selected and sent by the agent executor.
- It writes raw pre/post snapshots to `data/runs/<runId>/snapshots/`.
- It writes compact pre/post aliases into `transitions.jsonl`.
- It marks agent actions as `source="agent"`, `captureMode="executor_logged"`, `isGroundTruth=true`.
- In shadow mode, it attaches a read-only `derivedSnapshot` built from the local `derived/` files. This snapshot is for recording, replay, eval, and prompt-parity inspection only; it does not alter live prompts or action selection.
- It now also writes `replayFrame` and, when appropriate, a proposed `consolidation` object. Both are observability records and remain shadow-only.

Phase 2.5 eval:

- Reads `metadata.json`, `transitions.jsonl`, and referenced snapshots.
- Re-normalizes pre raw snapshots and regenerates local candidates.
- Compares `selectedAction` semantically against regenerated candidates.
- Enforces ground-truth invariants, run ID consistency, transition ID uniqueness, JSONL parseability, and snapshot ref existence.
- Flags stale index, illegal target, unknown-screen blocking, hard/unknown checkpoints, settlement timeout, and repeated no-progress risks.
- Uses indexed action identities for replay/eval summaries when actions carry `cardIndex` or `index`, so distinct indexed choices with the same card name remain distinguishable.

Phase 2.6 eval classification:

- Adds `warningSummary` grouped by category and code.
- Adds focused top-level warnings for actionable/risk/strategy items.
- Classifies normal hard checkpoints separately from actionable fixture candidates.
- Classifies acceptable low-visibility settlement timeouts separately from program risks.
- Marks known historical fixed evidence separately from current blockers.
- Adds lightweight strategy metrics:
  - low HP transitions
  - high incoming transitions
  - block deficit turns
  - deck-too-thick transitions
  - potion use and low-pressure potion use
  - route greed choices
  - fallback count/rate
  - repeated low-confidence choices
  - combat tempo loss

These strategy metrics are WARN-only signals. They do not change `TransitionRecord` ground-truth semantics and do not make a run fail by themselves.

## Compatibility

Current `CollectedStateRecord` maps to a snapshot-only transition:

- `rawStatePath` -> `preStateRef`
- `compactState` -> `compactPreState`
- `action=null`
- `executionResult=null`
- `stateDiff=null`
- `captureMode=snapshot_only`
- `isGroundTruth=false`

Current `DecisionLogEntry` is a decision audit and should be linked to future transition records by `transitionId` or timestamp.

## Phase 2 MVP Limit

The current writer covers agent executor actions, replay timeline reading, grouped offline engineering eval, and lightweight strategy-quality metrics. It does not yet implement HTML replay, event-log human capture, diff-inferred human transition generation, training, or vector memory.
