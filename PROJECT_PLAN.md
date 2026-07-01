# Project Plan

This is the current project book for the Slay the Spire 2 AI agent. It records the current diagnosis, target architecture, staged plan, risks, and acceptance criteria. Future agents should read this after `PROJECT_NORTH_STAR.md` before making structural changes.

The current formal route is Phase 0 through Phase 10. Phase 10 is the first target state for a complete Guarded Learning Loop: predictions are made before decisions, checked after execution, attributed in replay/eval, converted into evidence-gated consolidation proposals, and only then allowed to update stable memory/derived/strategy state with rollback.

## Maturity Route Constraint

P1 through P10 are not a task checklist. They are the North Star maturity route for keeping the LLM as the strategic player while the local system grows into a predictive cognitive scaffold that improves how the LLM can see, remember, imagine, deliberate, execute, replay, and learn.

Hard phase intent:

- P1 through P2.6: establish trusted boundaries, recording, replay, and eval. Do not optimize for intelligence gains yet.
- P3 through P6: make `StrategicImpression`, `MemoryActivation`, `CandidateFuture`, and `PredictionErrorRecord` shadow-visible, testable, and replayable.
- P7: turn prediction-error attribution into evidence-backed learning proposals without automatic learning.
- P8: only here may `DeliberationPacket` begin entering the LLM strategic workspace under feature flags while preserving the legacy prompt.
- P9: only here may guarded stable memory, derived, or scoring updates be considered, and only with evidence, thresholds, and rollback.
- P10: complete the guarded learning loop.

Non-negotiable evaluation questions for every phase change:

1. Does it help the LLM see, remember, imagine, deliberate, or learn better?
2. Does it preserve the LLM as the core strategic player instead of replacing it with local rules?
3. Does it preserve data truth boundaries between fact, observation, inference, memory, derived knowledge, and reflection?
4. Is it replayable, evaluable, testable, and rollback-capable?
5. Does it avoid prematurely contaminating stable memory, derived knowledge, or strategy state?
6. Does it improve future decision quality rather than merely increasing schema or coverage fields?

If a phase implementation only proves that fields exist but does not improve prediction, attribution, replay, review, or future decisions, stop and reshape the goal before proceeding to the next phase.

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

- New North Star cognitive objects are only lightly anchored in code and are not yet populated by the live loop.
- `prompt.ts` builds compact context, but it is not yet a named `DeliberationPacket`.
- `candidates.ts` and `scoring.ts` generate and rank actions, but not full `CandidateFuture` records with predictions, assumptions, and invalidation triggers.
- `memory.ts` has structured memory, confidence, evidence, and conservative updates, but not explicit `MemoryActivation` records with omissions and counterexamples per decision.
- `eval/runner.ts` checks engineering invariants and strategy metrics, but not full prediction-error attribution.
- `controller.ts` still owns too much orchestration detail and should be decomposed gradually around stable objects.
- Human action capture is not reliable because current STS2MCP exposes state and executor actions, not human UI event logs.
- Combat is still mostly one action per tick. It has checkpoint detection, but not full segmented plans or continuation policy.

## Recommended Architecture

The long-term architecture is:

```text
raw game state
  -> game-io adapter
  -> canonical state
  -> Strategic Impression / Salience
  -> Memory Activation
  -> Candidate Futures
  -> Deliberation Packet
  -> LLM strategic decision
  -> validated safe execution
  -> transition recorder
  -> replay / evaluation / review
  -> prediction-error-driven learning
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

Completed Phase 1 status:

- Source-of-truth documentation was consolidated.
- New code should still land behind additive interfaces and schema helpers when possible.
- Existing `src/agent/*` commands must remain compatible.
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
- `src/eval/runner.ts` and `src/eval/cli.ts` run offline engineering eval with grouped warning categories and lightweight strategy metrics.
- Smoke covers agent executor ground truth transitions, snapshot-only mapping, JSONL parsing, replay reader loading, eval runner loading, and cognitive scaffold type anchors.

Remaining Phase 2+ gaps:

- No HumanPlayRecorder diff fallback implementation yet.
- No event-log mod or ground-truth human event adapter yet.
- Prediction-error attribution and consolidation records now exist as shadow MVPs, but they are not yet full learning updates.

Phase 3: Predictive cognitive scaffold migration.

- Populate `StrategicImpression` and `SalienceSignal` from canonical state without changing execution semantics.
- Convert relevant memory retrieval into explicit `MemoryActivation` records.
- Wrap existing scored candidates as `CandidateFuture` records before changing candidate behavior.
- Build `DeliberationPacket` from the existing prompt inputs and keep prompt length bounded.
- Store cognitive objects on transitions for replay/eval/review.
- Add prediction-error records from eval/review before allowing stable learning updates.
- Only after those anchors are stable, add segmented combat plan and checkpoint continuation.

Current Phase 3 status:

- Strategic impression, salience, memory activation, candidate futures, DeliberationPacket, prompt parity, and PredictionErrorRecord are written in shadow mode.
- Prediction errors now include typed checks and attribution.
- Candidate futures now carry structured `predictionChecks` beside human-readable `predictedOutcome`.
- ReplayFrame MVP is recorded on new executor-logged transitions.
- Live prompt, candidate ordering, fallback, validation, and execution semantics remain unchanged.

Phase 4: Memory, derived, reward.

- Make memory retrieval explicit.
- Add derived retrieval snapshots.
- Add structured reflection and reward output.
- Add strategy update records with rollback metadata.
- Add experiment log.

Current Phase 4 status:

- Derived retrieval snapshots are wired into shadow transitions.
- Unsupported prediction errors can create proposed ConsolidationRecord objects with rollback metadata.
- No stable memory/derived/strategy update is applied from these proposals yet.

Phase 5: Event log adapter.

- Design or implement STS2MCP event-log extension.
- Add `GET /api/v1/events?since=<eventId>`.
- Add event-first human recorder.
- Keep diff inference only as fallback and validation.

Current Phase 5 status:

- Adapter capabilities still correctly report no reliable event log or human event stream for current STS2MCP REST.
- `events.jsonl` is present in run directories and eval now parses it for future adapter output.
- Human diff inference remains non-ground-truth.

Phase 6: Typed prediction-error attribution.

- Convert shadow prediction checks into structured attribution buckets for damage, block, HP, kill, phase change, card flow, resource use, route/reward consequences, and unknowns.
- Prefer deterministic checkpoint/state-diff evidence over LLM reflection.
- Add fixture coverage for supported, unsupported, and unknown attribution.
- Keep all output shadow-only; do not update stable memory or strategy params from Phase 6 records.

Target Phase 6 output:

- `PredictionErrorRecord` contains typed attribution suitable for replay/eval grouping.
- Eval reports attribution coverage and highlights unsupported critical predictions as WARN, not learning updates.
- Review can point to concrete prediction misses without requiring raw transition inspection.

Current Phase 6 status:

- `PredictionErrorRecord.attributionBuckets` is implemented as a shadow MVP tied to the CandidateFuture Doctrine.
- `CandidateFuture.predictionChecks` now carry mechanics-informed expected records for card removal, damage/block/kill, HP change, energy/resource change, phase change, route progress, and reward flow where the current scaffold can infer them.
- New checkpoint state diffs include `enemyDeltas` so damage and kill predictions can be checked against deterministic post-action evidence.
- Buckets are generated from CandidateFuture expected-vs-actual checks and checkpoint/state-diff evidence.
- Eval/review report attribution bucket coverage, bucket counts, and bucket status counts.
- Eval classifies unsupported or critical attribution buckets as `prediction_error` WARNs, not learning updates.
- Smoke covers supported, unsupported, and unknown attribution bucket cases.
- No stable learning update is applied from these buckets.

Phase 7: Consolidation proposal pipeline.

- Convert unsupported or critical prediction attribution into explicit `ConsolidationRecord` proposals.
- Treat low-visibility `unknown` attribution as an evidence gap, not as a learning proposal by itself.
- Require evidence, conditions, confidence, affected module, proposed change, rollback path, and expiry/revalidation policy.
- Separate proposed, accepted, rejected, expired, and reverted consolidation states.
- Add replay/eval/review visibility for pending proposals and proposal surface health.
- Do not auto-apply proposals.

Target Phase 7 output:

- The system can explain what it would learn and why.
- Proposed learning remains auditable and non-mutating by default.
- Every proposal says which stable targets are blocked until a later guarded applicator exists.

Current Phase 7 status:

- Proposal surface MVP is implemented.
- New `ConsolidationRecord` proposals are generated only from unsupported or critical attribution buckets, not from unsupported evidence-free guesses.
- New runs create `proposals.jsonl`; old runs remain compatible via transition-level `consolidation` fallback.
- Proposals include affected module, proposed change, expiry, revalidation, created timestamp, lifecycle status, evidence strength, blocked stable targets, and explicit forbidden next steps.
- Replay/eval/review surface proposal counts, status counts, target layer counts, evidence strength, pending review, and mutating/accepted risk.
- P7.5 aggregation is implemented as a derived review surface over proposal evidence. It groups proposals by target layer, proposed action, and actionable attribution bucket, then reports occurrences, recurring groups, sample transitions, grouped evidence strength, blocked stable targets, allowed review steps, and forbidden stable mutations.
- No proposal is auto-applied; stable updates remain Phase 9 work.

Phase 8: DeliberationPacket as LLM strategic workspace.

- Move from shadow packet parity toward letting the LLM deliberate inside a structured strategic workspace.
- The workspace is a compact but strategically complete `DeliberationPacket`, not raw state and not a local-rule replacement for judgment.
- Compare legacy live prompt and `DeliberationPacket`-derived workspace over fresh runs.
- Add workspace parity and information-preservation acceptance thresholds before routing live decisions through it.
- Gradually route selected high-dispute decision classes through the workspace while preserving validation and fallback.

Target Phase 8 output:

- The LLM sees Strategic Impression, Salience, MemoryActivation, CandidateFutures, assumptions, risks, invalidation triggers, and output schema as a coherent strategic workspace.
- Action selection remains validated against current candidates.
- The local scaffold still shapes the problem; it does not become the strategic player.

Current Phase 8 status:

- P8 shadow workspace surface is implemented.
- `src/agent/workspace.ts` builds a compact structured prompt from `DeliberationPacket`, compares it with the legacy live prompt, records hashes, byte/token estimates, coverage, missing sections, decision class, and gated readiness.
- Feature flags:
  - `STS2_P8_WORKSPACE_SHADOW`: enables P8 readiness for shadow workspace evaluation. Default is off.
  - `STS2_P8_WORKSPACE_CALL`: allows an optional structured shadow LLM call when readiness is satisfied. Default is off.
- New executor-logged transitions can carry `workspaceComparison` and `shadowWorkspaceDecision`.
- Replay/eval/review expose P8 workspace coverage, readiness, shadow-call counts, agreement/disagreement, invalid output, missing candidate, and error stats.
- Live LLM input path remains unchanged by default. P8 currently does not replace the legacy prompt, change candidate generation/order/scoring, change fallback, change validation, change execution, or write stable learning.
- Next gated step is to define acceptance thresholds and a very narrow live-routing experiment, still preserving legacy fallback and validation.

Phase 9: Guarded stable updates.

- Add a guarded applicator for a narrow first class of stable updates, such as memory confidence adjustments or derived rule drafts.
- Enforce evidence count, confidence threshold, scope condition, rollback metadata, and eval-before/after checks.
- Write accepted updates as records, not silent mutations.
- Keep strategy-param changes behind an experiment gate.

Target Phase 9 output:

- The project can apply a small, reversible learning update from replay/eval evidence.
- Stable updates are reviewable and can be rolled back.

Current Phase 9 status:

- Not implemented.

Phase 10: Guarded Learning Loop.

- Close the loop from candidate future prediction to execution evidence to prediction error to consolidation to guarded stable update to replay/eval validation.
- Require all learning updates to be evidence-backed, scoped, confidence-rated, reversible, and evaluated.
- Keep facts, observations, inferences, memory, derived knowledge, LLM reflection, and stable learning records separate.
- Add run-level reports showing what was predicted, what happened, what was learned, what was rejected, and what was rolled back.

Target Phase 10 output:

- A complete guarded learning loop exists without turning the system into an opaque rules bot.
- The LLM remains the strategic player; local learning improves the scaffold's salience, memory activation, candidate futures, and deliberation packet.

Current Phase 10 status:

- Not implemented. Phase 10 remains the target integration milestone after Phase 6-9 are complete.

## Phase 1-5 Completion Gaps

Phase 1 remaining gaps:

- `domain-core` is still represented by additive TypeScript anchors rather than a fully separated package/module.
- Runtime schema validation is minimal; most compatibility still relies on TypeScript and smoke coverage.
- The STS2MCP REST adapter is typed, but not fully isolated from legacy `src/agent` imports.

Phase 2 remaining gaps:

- HumanPlayRecorder does not exist.
- Human diff inference remains intentionally non-ground-truth.
- `replay.json` is still a minimal placeholder; replay is primarily derived from `transitions.jsonl`.

Phase 3 remaining gaps:

- Cognitive objects are not yet present on every historical transition.
- `DeliberationPacket` is still shadow-only and does not replace the live prompt.
- Candidate futures are still action-first shallow futures, not full multi-step plans.
- Segmented combat plan and checkpoint continuation are not implemented.

Phase 4 remaining gaps:

- `ConsolidationRecord` is proposal-only.
- Stable memory, derived knowledge, reward, and strategy updates are not yet guarded by a full proposal/apply/rollback lifecycle.
- Experiment logging exists conceptually but not as a full managed subsystem.

Phase 5 remaining gaps:

- No STS2MCP event-log extension has been implemented.
- No reliable human event stream is available.
- `events.jsonl` is a forward-compatible sink, not proof of event-ground-truth capture.

## Historical Phase 1 File Change List

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
