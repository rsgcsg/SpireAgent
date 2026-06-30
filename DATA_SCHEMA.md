# Data Schema

This document defines the durable data model. Current code keeps legacy `CollectedStateRecord` and `DecisionLogEntry` compatible while writing Phase 2 agent transitions for real executed actions.

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
  source: "agent" | "human" | "game";
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
  executionResult?: unknown;
  stateDiff?: unknown;
  rawRefs: string[];
}
```

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
- `derivedSnapshot` is currently a minimal empty snapshot until derived retrieval is wired into the real-time loop.

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
