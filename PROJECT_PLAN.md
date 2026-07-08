# Project Plan

This is the current project book for the Slay the Spire 2 AI agent. It records the project diagnosis, target architecture, staged plan, risks, boundaries, acceptance criteria, and guarded learning roadmap. Future agents should read this after `PROJECT_NORTH_STAR.md` before making structural changes.

The formal route is Phase 0 through Phase 10. Phase 10 is the first target state for a complete **Guarded Learning Loop**: candidate futures make structured predictions before execution; real execution produces checkpoint/state-diff evidence; replay/eval attributes prediction errors; repeated evidence generates consolidation proposals; and only guarded, reversible, evidence-backed updates may affect stable memory, derived knowledge, prompt inputs, or strategy parameters.

The project must not become either:

* a pure rules bot that replaces LLM strategic judgment; or
* an opaque LLM wrapper that cannot explain, replay, validate, or improve its decisions.

The intended architecture is:

```text
LLM = strategic player
local system = legality, state normalization, salience, memory retrieval, candidate futures, prediction checks, replay/eval, guarded learning scaffold
```

## Current Diagnosis

The current package is a working TypeScript agent, not a blank project.

Reusable pieces:

* `src/agent/client.ts` already isolates REST state reads and action execution behind small `StateSource` / `ActionExecutor` interfaces.
* `src/agent/state.ts` normalizes current MCP JSON into a compact `NormalizedState`.
* `src/agent/candidates.ts` generates candidates for combat, rewards, map, shop, events, rest, menu, card select, and bundle select.
* `src/agent/scoring.ts` routes decisions into local, fallback, and LLM-needed paths.
* `src/agent/controller.ts` runs the loop, calls LLM at most once per tick, executes actions, records checkpoints, and updates memory.
* `src/agent/memory.ts` has run memory, long-term memory, experience memory, strategy params, lightweight reward, and conservative strategy updates.
* `src/agent/checkpoint.ts` computes post-action state diff and checkpoint kind.
* `src/agent/collector.ts` can capture read-only raw and compact state snapshots.
* `src/agent/review.ts` summarizes decision routes, fallbacks, LLM usage, checkpoints, and shadow cognitive coverage.
* `data/spire-codex/`, `derived/`, `memory/`, and `data/runs/` are already separated enough to support staged migration.

Current strengths:

* Real executor transitions are recorded and replayable.
* Eval can detect JSONL issues, transition consistency problems, ground-truth violations, selected-action mismatch, checkpoint categories, and lightweight strategy metrics.
* Cognitive scaffold objects now exist in shadow form.
* `CandidateFuture.predictionChecks`, `PredictionErrorRecord`, `ReplayFrame`, and proposal-only `ConsolidationRecord` have begun to form a guarded learning skeleton.
* Live behavior remains protected: prompt, candidate generation, candidate ordering, fallback, validation, and execution have not been replaced by the shadow scaffold.

Main problems:

* Some cognitive objects are still sparse because historical transitions predate the new schema.
* `controller.ts` owns too much orchestration and should be decomposed gradually around stable builders and recorders.
* `cognitiveScaffold.ts` risks becoming a large mixed-responsibility module if prediction checks, attribution, prompt parity, and consolidation proposal logic keep accumulating there.
* Prediction checks are becoming typed, but without a small deterministic mechanics engine they can become pseudo-precise heuristics.
* Current STS2MCP REST has no reliable event log or human UI event stream. `events.jsonl` is a forward-compatible sink, not proof of event-ground-truth capture.
* Human action capture is not reliable and must not be treated as ground truth without an event-log adapter.
* Combat is still mostly one action per tick. It has checkpoint detection, but not full segmented plans or continuation policy.
* Coverage metrics can be misleading when old transitions are included in the denominator. Eval must distinguish all-run coverage from fresh-schema coverage.
* Engineering correctness is better measured than playing strength. The project needs stable performance baselines, not just schema/replay coverage.

## Recommended Architecture

The long-term architecture is:

```text
raw game state
  -> game-io adapter
  -> canonical state
  -> deterministic mechanics engine
  -> strategic impression / salience
  -> memory activation
  -> derived knowledge retrieval
  -> candidate futures with typed prediction checks
  -> deliberation packet
  -> LLM strategic decision
  -> validation and safe execution
  -> transition recorder
  -> replay frame
  -> replay / evaluation / review
  -> prediction-error attribution
  -> consolidation proposals
  -> guarded prompt / memory / derived / strategy updates
```

Target modules:

* `domain-core`: versioned schemas for state, actions, transitions, memory, reward, experiments, capabilities, prediction checks, attribution, and consolidation records.
* `game-io`: stable interfaces for state read, action execute, event read, and action-result read.
* `adapters/sts2mcp`: current localhost REST adapter.
* `adapters/spire-codex`: fact database sync/read adapter.
* `state-normalizer`: raw state to canonical state.
* `mechanics-engine`: deterministic legality, target, energy, affordability, damage, block, lethal, card flow, resource delta, simple phase expectations, and state diff helpers.
* `fact-db`: objective cards, relics, characters, keywords, potions, enemies, encounters.
* `derived-knowledge`: tags, synergies, anti-synergies, draft rules, strategy experience, and rule candidates.
* `memory-system`: run memory, long-term memory, decision log, retrieval, compression, confidence, evidence, and rollback metadata.
* `planning-scaffold`: candidate actions, candidate futures, shallow plans, combat continuation hints, route/shop/event/card-reward plans.
* `llm-decision`: compact prompt, provider adapters, JSON validation, legacy prompt path, and gated structured prompt path.
* `execution-loop`: execution, settlement, checkpoint, replan, and continuation control.
* `data-recorder`: metadata, snapshots, events, transitions, replay frames, prediction errors, proposal logs.
* `eval-runner`: engineering invariants, prediction attribution, coverage, performance baselines, go/no-go gates.
* `reward-engine`: post-run scoring, strategy metrics, conservative feedback.
* `experiment-manager`: proposals, feature flags, thresholds, rollout gates, rollback, and experiment reports.
* `review-cli`, `replay-cli`, `eval-cli`: observability and offline evaluation.

## Module Boundaries

Dependency direction must stay low-to-high:

```text
domain-core
  <- game-io / state-normalizer / mechanics-engine / fact-db
  <- derived-knowledge / memory-system
  <- planning-scaffold
  <- llm-decision
  <- execution-loop
  <- recorder / replay / eval / review
  <- CLI
```

Rules:

* Game I/O does not know strategy.
* Raw facts do not contain learned strategy.
* Derived knowledge does not mutate raw facts silently.
* Memory is structured, retrievable, compressible, confidence-rated, and auditable.
* Mechanics calculations should be deterministic and conservative. If the engine cannot calculate a value reliably, it must return `unknown`, not fake precision.
* LLM never directly executes game actions. It selects from validated candidates.
* Recorder records decisions and transitions; it does not decide strategy.
* Eval can warn, fail, summarize, and propose; it does not mutate stable strategy state.
* Consolidation proposals are not stable learning until accepted by a guarded applicator.
* External projects are hidden behind adapters and capability checks.
* Human diff inference is never ground truth.
* Old transition compatibility is required, but old data must not hide fresh-schema failures.

## Engineering Corrections From Current Plan

This revision makes four corrections to the previous route.

### Correction 1: Phase 5 must distinguish agent events from human events

Current STS2MCP REST supports state read and action execution, but not reliable event-log or human UI event stream. Therefore:

```text
agent executor transitions = ground truth for agent actions
events.jsonl = forward-compatible event sink
human diff inference = non-ground-truth
human event recorder = blocked until event-log adapter exists
```

Phase 5 should not pretend full human event capture exists.

### Correction 2: Phase 6 must include deterministic mechanics calculators

Typed prediction checks are only useful if expected values come from deterministic, conservative calculators where possible. Otherwise typed checks become structured guesses.

Phase 6 must include small mechanics helpers for:

```text
damage
block
energy
card flow
kill expectation
phase / visible progress
```

Unsupported mechanics must return `unknown`.

### Correction 3: Guarded prompt integration should happen before guarded stable updates

Changing live prompt input behind a feature flag is easier to roll back than writing stable memory, derived knowledge, or strategy parameters.

Therefore:

```text
Phase 8 = guarded prompt integration
Phase 9 = guarded stable memory / derived / scoring updates
```

Stable updates should wait until structured prompt use has been tested.

### Correction 4: Eval must add performance baselines, not just schema coverage

The project must track whether the agent gets better at playing, not just whether records are present.

Minimum performance metrics:

```text
floor reached
death floor
combat HP loss
invalid action count
fallback rate
LLM call rate
settlement timeout rate
bad checkpoint rate
block deficit
tempo loss
potion use
route/reward decision quality proxy
prediction mismatch rate
```

Eval should separate:

```text
all-run coverage
fresh-schema coverage
latest-transition coverage
performance baseline trend
```

## Long-Term Route

## Phase 0: Exploration and Project Book

Goal:

Establish the project direction, architecture, risks, and source-of-truth documentation.

Work:

* Audit current code and docs.
* Record project diagnosis and architecture.
* Record external dependency evaluation.
* Record human capture limits.
* Record staged implementation plan and acceptance criteria.
* Define the North Star: LLM as strategic player, local system as cognitive scaffold.

Status:

Completed.

Acceptance:

* `PROJECT_NORTH_STAR.md` exists.
* `PROJECT_PLAN.md` exists.
* Human capture limits are explicit.
* The project is not treated as a blank rewrite.

## Phase 1: Core Boundaries and Schema

Goal:

Create minimal stable boundaries without breaking existing commands.

Work:

* Add `domain-core` schemas.
* Add `GameIO` interface and `AdapterCapabilities`.
* Wrap current REST client as `STS2MCP` adapter.
* Add transition schema.
* Preserve existing commands and behavior.
* Add minimal LLM candidate validation.

Completed Phase 1 status:

* Source-of-truth documentation was consolidated.
* New code lands behind additive interfaces and schema helpers where possible.
* Existing `src/agent/*` commands remain compatible.
* Implemented anchors:

  * `src/domain/types.ts`
  * `src/game-io/types.ts`
  * `src/adapters/sts2mcp/capabilities.ts`
  * `src/data/transitionSchema.ts`
  * minimal LLM candidate validation in `src/agent/llm.ts`

Remaining gaps:

* `domain-core` is still represented by additive TypeScript anchors rather than a fully separated package/module.
* Runtime schema validation is minimal.
* STS2MCP REST adapter is typed, but not fully isolated from legacy `src/agent` imports.

Acceptance:

* `npm exec tsc -- --noEmit` passes.
* Existing commands remain compatible.
* Adapter capabilities are explicit.
* No live action semantics are changed.

## Phase 2: Precise Agent Recording and Replay

Goal:

Make agent decisions replayable and auditable.

Work:

* Add `AgentDecisionRecorder`.
* Create `data/runs/<runId>/`.
* Write:

  * `metadata.json`
  * `snapshots/`
  * `events.jsonl`
  * `transitions.jsonl`
  * `replay.json` placeholder or generated summary
* Add state diff module and replay reader.
* Keep `collect:state` and `collect:watch` compatible.

Current Phase 2 status:

* `src/agent/decisionRecorder.ts` writes executor-logged agent transitions around successful real agent actions.
* `data/runs/<runId>/` contains metadata, snapshots, events, transitions, and replay placeholder.
* Existing `memory/collected/` snapshot collection remains compatible.
* `src/replay/reader.ts` and `src/replay/cli.ts` can read transitions and print a timeline.
* `src/eval/runner.ts` and `src/eval/cli.ts` run offline engineering eval.
* Smoke covers executor ground-truth transitions, snapshot-only mapping, JSONL parsing, replay reader loading, eval runner loading, and cognitive scaffold type anchors.

Remaining gaps:

* `HumanPlayRecorder` does not exist.
* Human diff inference remains intentionally non-ground-truth.
* `replay.json` is still secondary; replay is primarily derived from `transitions.jsonl`.

Acceptance:

* Live runs produce transition logs.
* Replay can answer:

  * what was seen;
  * what candidates existed;
  * what was selected;
  * what changed;
  * whether the transition is ground truth.
* Snapshot-only or diff-inferred records are never treated as executor ground truth.

## Phase 2.5: Offline Eval Runner

Goal:

Use replay data to catch program-level bugs and semantic mismatches.

Work:

* Eval latest run.
* Check JSONL parse.
* Check runId / transitionId / snapshot refs.
* Check ground-truth invariants.
* Re-normalize state where available.
* Re-generate candidates where possible.
* Match selected actions semantically.
* Detect invalid action, stale index, illegal target, no candidates, and ground-truth violations.

Status:

Completed MVP.

Acceptance:

* `npm run data:eval -- --latest` works.
* Program errors become eval errors, not hidden warnings.
* Selected action matching is semantic, not only string-based.

## Phase 2.6: Eval WARN Classification and Strategy Metrics

Goal:

Reduce warning noise while preserving real risks.

Work:

* Classify warnings:

  * normal checkpoint;
  * acceptable settlement timeout;
  * real program risk;
  * historical fixed evidence;
  * strategy quality issue;
  * shadow coverage gap.
* Add lightweight strategy metrics:

  * block deficit;
  * fallback rate;
  * potion use;
  * tempo loss;
  * checkpoint distribution;
  * settlement timeout rate.

Status:

Completed MVP.

Acceptance:

* Old known warnings do not hide new dangerous errors.
* Invalid action, stale index, illegal target, no candidates, and ground-truth violations remain high-severity.
* Eval output is actionable.

## Phase 3: Predictive Cognitive Scaffold Migration

Goal:

Introduce cognitive objects in shadow mode before using them live.

Work:

* Populate `StrategicImpression` and `SalienceSignal` from canonical state.
* Convert relevant memory retrieval into explicit `MemoryActivation`.
* Wrap scored candidates as `CandidateFuture`.
* Add structured `CandidateFuture.predictionChecks`.
* Build `DeliberationPacket` from existing prompt inputs.
* Add `PromptParityReport`.
* Store cognitive objects on transitions.
* Add `PredictionErrorRecord`.
* Add `ReplayFrame` MVP.
* Keep live prompt, candidate ordering, fallback, validation, and execution unchanged.

Current Phase 3 status:

* Strategic impression, salience, memory activation, candidate futures, DeliberationPacket, prompt parity, PredictionErrorRecord, typed checks, and ReplayFrame exist in shadow mode.
* Candidate futures carry structured `predictionChecks` beside human-readable `predictedOutcome`.
* PredictionErrorRecord prefers structured checks and falls back to text only for old transitions.

Remaining gaps:

* Cognitive objects are not present on historical transitions.
* DeliberationPacket remains shadow-only.
* Candidate futures are still action-first shallow futures, not full multi-step plans.
* Segmented combat plans and checkpoint continuation are not implemented.
* Some builders may need decomposition to avoid large mixed-responsibility files.

Acceptance:

* New transitions contain cognitive scaffold records.
* Old transitions remain compatible.
* Replay/eval/review show cognitive coverage.
* Live decision behavior is unchanged.

## Phase 4: Memory, Derived, Reward, and Proposal-Only Consolidation

Goal:

Make memory and derived knowledge explicit, auditable, and available to the shadow scaffold.

Work:

* Make memory retrieval explicit.
* Add derived retrieval snapshots.
* Add structured reward/reflection records.
* Add proposed `ConsolidationRecord` with:

  * evidence;
  * conditions;
  * confidence;
  * affected module;
  * proposed change;
  * rollback metadata;
  * expiry or revalidation policy.
* Add experiment log scaffolding.

Current Phase 4 status:

* Derived retrieval snapshots are wired into shadow transitions.
* Unsupported/unknown prediction errors can create proposed ConsolidationRecord objects.
* Consolidation remains proposal-only.
* No stable memory, derived knowledge, reward, or strategy update is applied from proposals.

Remaining gaps:

* No full proposal/apply/rollback lifecycle.
* No stable learning applicator.
* No managed experiment subsystem.
* No evidence threshold enforcement beyond shadow records.

Acceptance:

* Memory activation and derived knowledge summary are separately visible.
* Derived knowledge does not silently mutate.
* Consolidation proposals are auditable and non-mutating by default.

## Phase 5: Event Log Adapter Capability

Goal:

Prepare for reliable event logs while clearly documenting current limits.

Work:

* Maintain `events.jsonl` as a forward-compatible sink.
* Parse `events.jsonl` in eval.
* Keep adapter capabilities explicit.
* Separate agent executor transitions from human UI events.
* Design future event-log extension:

  * `GET /api/v1/events?since=<eventId>`;
  * event IDs;
  * action result events;
  * reward events;
  * room transition events;
  * combat card play events;
  * human UI events where possible.

Current Phase 5 status:

* Current STS2MCP REST has no reliable event log or human event stream.
* `events.jsonl` exists and eval parses it.
* `parsedEvents=0` is acceptable under current adapter capability.
* Human diff inference remains non-ground-truth.

Phase 5A: Agent executor event log.

* Record all agent-executed actions as ground-truth executor transitions.
* Optionally mirror executor actions into event-shaped records.
* This is feasible now.

Phase 5B: Human/UI event log.

* Requires MCP/mod support.
* Cannot be inferred reliably from snapshots.
* Must remain blocked until adapter capabilities change.

Remaining gaps:

* No STS2MCP event-log extension.
* No reliable human event stream.
* No event-first human recorder.

Acceptance:

* Eval can parse event files.
* Bad event JSONL becomes eval error.
* Absence of events is a capability warning, not a program failure.
* Human diff inference is never upgraded to ground truth.

## Phase 6: Typed Prediction Attribution and Mechanics Engine

Goal:

Make prediction errors measurable, attributable, and testable with conservative deterministic mechanics.

Work:

* Extract a small `mechanics-engine` or equivalent helper layer for:

  * legality;
  * energy delta;
  * card removed from hand;
  * discard/exhaust/card flow;
  * simple damage through known block;
  * simple block gain;
  * player HP delta where visible;
  * kill expectation;
  * phase or visible progress expectation.
* Convert `CandidateFuture.predictionChecks` into structured attribution buckets:

  * damage;
  * block;
  * HP;
  * kill;
  * phase change;
  * card flow;
  * resource use;
  * route/reward consequence;
  * unknown.
* Prefer deterministic checkpoint/state-diff evidence over LLM reflection.
* If a mechanic cannot be calculated reliably, return `unknown`, not guessed values.
* Add fixture coverage:

  * supported case;
  * mismatch case;
  * unknown case;
  * unsupported case;
  * unsupported/unknown -> proposal-only ConsolidationRecord case.
* Keep all output shadow-only.

Current Phase 6 status:

* `PredictionErrorRecord.attributionBuckets` exists as shadow MVP.
* Buckets are generated from `CandidateFuture.predictionChecks` and checkpoint/state-diff evidence.
* Eval/review report attribution coverage.
* Smoke covers supported and unknown attribution cases.

Required Phase 6 improvements:

* Move calculation logic out of broad scaffold files into focused modules:

  * `predictionChecksBuilder`;
  * `predictionAttribution`;
  * `mechanicsEngine`;
  * `consolidationProposal`.
* Add numeric expected-vs-actual comparisons:

  * `expectedEnemyHpDelta` vs `actualEnemyHpDelta`;
  * `expectedBlockDelta` vs `actualBlockDelta`;
  * `expectedPlayerHpDelta` vs `actualPlayerHpDelta`;
  * `expectedEnergyDelta` vs `actualEnergyDelta`;
  * `expectedCardRemoved` vs `actualCardRemoved`;
  * `expectedKill` vs `actualKill`;
  * `expectedPhaseChange` vs `actualPhaseChange`.
* Add eval summaries:

  * attribution coverage;
  * mismatch by category;
  * unknown by category;
  * unsupported by category;
  * critical unsupported predictions.

Acceptance:

* Prediction attribution is grouped and numeric where possible.
* Unknowns are explicit.
* Unsupported critical predictions become WARN, not learning updates.
* Review can point to concrete prediction misses without inspecting raw transition JSON.
* No stable memory or strategy update is applied from Phase 6 records.
* Live prompt, candidate generation, scoring, fallback, validation, and execution remain unchanged.

## Phase 7: Offline Learning Proposal Pipeline

Goal:

Convert repeated, scoped prediction errors into auditable learning proposals without mutating stable behavior.

Work:

* Aggregate PredictionErrorRecords across transitions and runs.
* Detect repeated error patterns with scope:

  * action;
  * card;
  * enemy;
  * room phase;
  * buff/debuff context;
  * relic context;
  * route/reward context.
* Generate `LearningProposal` / `ConsolidationRecord` candidates only when evidence thresholds are met.
* Required proposal fields:

  * proposalId;
  * sourceRunIds;
  * sourceTransitionIds;
  * evidenceCount;
  * counterexampleCount;
  * scopeCondition;
  * confidence;
  * severity;
  * affectedModule;
  * proposedChange;
  * expectedBenefit;
  * risk;
  * rollbackPath;
  * expiry;
  * revalidationPolicy;
  * status: proposed / accepted / rejected / expired / reverted.
* Add CLI/review visibility for pending proposals.
* Do not auto-apply proposals by default.

Target Phase 7 output:

* The system can explain what it would learn and why.
* Learning remains auditable and non-mutating.
* Repeated prediction errors become structured proposals instead of isolated warnings.

Current Phase 7 status:

* Not implemented beyond proposal-only ConsolidationRecord MVP.

Acceptance:

* Single-error proposals are either blocked or marked low confidence.
* Repeated errors require evidence and counterexample checks.
* Proposals do not mutate stable memory, derived knowledge, prompt, scoring, or strategy params.
* Eval/review can list pending proposals and their evidence.

## Phase 8: Guarded Prompt Integration

Goal:

Let the live LLM prompt consume a small, stable subset of `DeliberationPacket` under feature flag control.

Rationale:

Prompt integration is safer to roll back than stable memory or strategy mutation. Therefore it must happen before guarded stable updates.

Work:

* Add feature flag:

```text
USE_DELIBERATION_PACKET_PROMPT=false
```

* Keep legacy prompt as default.
* Generate a compact structured prompt section from DeliberationPacket:

  * state summary;
  * enemy intent summary;
  * hand/deck summary;
  * top candidates;
  * memory activation summary;
  * derived knowledge summary;
  * prediction risk summary;
  * known unknowns.
* Start with additive prompt mode:

```text
livePrompt = legacyPrompt + compactDeliberationSummary
```

* Do not fully replace legacy prompt initially.
* Add prompt parity thresholds before any wider rollout.
* Add A/B or shadow comparison:

  * legacy prompt output;
  * structured prompt output;
  * selected action difference;
  * validation outcome;
  * replay/eval result.
* Preserve validation and fallback.

Target Phase 8 output:

* DeliberationPacket can influence selected live LLM context for gated decision classes.
* Feature flag can disable it instantly.
* Legacy prompt path remains available.
* Structured prompt usage is evaluated before broader rollout.

Current Phase 8 status:

* Not implemented.
* Live prompt remains unchanged.

Acceptance:

* Feature flag defaults off.
* Prompt integration is additive first, not full replacement.
* Replay/eval can compare structured vs legacy prompt decisions.
* If metrics degrade, structured prompt can be disabled without data migration.
* Candidate validation still prevents illegal actions.

## Phase 9: Guarded Stable Updates and Scoring / Memory Calibration

Goal:

Allow a narrow first class of reversible stable updates only after evidence and eval gates pass.

Work:

* Add guarded applicator for limited update types:

  * memory confidence adjustment;
  * derived rule draft;
  * prompt hint draft;
  * prediction calibration note;
  * low-risk scoring calibration behind experiment flag.
* Enforce:

  * evidence count threshold;
  * counterexample threshold;
  * confidence threshold;
  * scope condition;
  * affected module;
  * rollback metadata;
  * expiry/revalidation;
  * eval-before/after comparison.
* Write accepted updates as records, not silent mutations.
* Keep strategy-param changes behind experiment gate.

Feature flags:

```text
USE_MEMORY_CALIBRATION=false
USE_DERIVED_RULE_DRAFTS=false
USE_PREDICTION_CALIBRATION=false
USE_SCORING_CALIBRATION=false
```

Target Phase 9 output:

* The project can apply a small, reversible learning update from replay/eval evidence.
* Stable updates are reviewable and rollbackable.
* Strategy/scoring changes are gated and measurable.

Current Phase 9 status:

* Not implemented.

Acceptance:

* No proposal can become stable without evidence and rollback metadata.
* Accepted updates are logged.
* Reverted updates are logged.
* Eval can compare before/after performance.
* Strategy-param changes require experiment gate.

## Phase 10: Guarded Learning Loop

Goal:

Close the loop from prediction to execution evidence to attribution to proposal to guarded update to eval validation.

Work:

* Connect:

  * candidate future prediction;
  * execution evidence;
  * prediction error;
  * attribution;
  * learning proposal;
  * guarded acceptance;
  * stable update;
  * replay/eval validation;
  * rollback if worse.
* Keep facts, observations, inferences, memory, derived knowledge, LLM reflection, and stable learning records separate.
* Add run-level reports:

  * what was predicted;
  * what happened;
  * what mismatched;
  * what was proposed;
  * what was accepted;
  * what was rejected;
  * what was rolled back.
* Add performance baseline tracking.
* Add go/no-go deployment gate.

Target Phase 10 output:

* A complete guarded learning loop exists.
* Learning is evidence-backed, scoped, confidence-rated, reversible, and evaluated.
* The LLM remains the strategic player.
* Local learning improves salience, memory activation, candidate futures, prompt context, and conservative calibration without turning the agent into an opaque rules bot.

Current Phase 10 status:

* Not implemented.
* Phase 10 remains the target integration milestone after Phases 6-9 mature.

Acceptance:

* Every stable learning update has evidence.
* Every update has rollback.
* Every deployment has before/after eval.
* The system can explain what changed and why.
* Performance does not degrade beyond accepted thresholds.

## Cross-Phase Performance Baselines

Engineering correctness is necessary but not sufficient. Starting from Phase 6, each phase should preserve or improve performance baselines.

Minimum metrics:

```text
floor reached
death floor
combat HP loss
block deficit
tempo loss
fallback rate
LLM call rate
invalid action count
illegal target count
stale index count
settlement timeout rate
bad checkpoint rate
prediction mismatch rate
unknown prediction rate
unsupported prediction rate
potion use
route/reward quality proxy
```

Coverage must be separated:

```text
allRunCoverage
freshSchemaCoverage
latestTransitionCoverage
```

Recommended eval output:

```text
schemaCoverage:
  allRun: ...
  freshSchemaOnly: ...
  latestTransition: ...

predictionAttribution:
  supported: ...
  mismatch: ...
  unknown: ...
  unsupported: ...
  byCategory: ...

performance:
  latestRun: ...
  baselineComparison: ...
  regressionWarnings: ...
```

Go/no-go rule:

* Schema coverage alone cannot justify live integration.
* Prompt/scoring/memory changes require performance comparison.
* Any increase in invalid actions, illegal targets, or ground-truth violations blocks rollout.
* Any uncertain improvement must remain shadow-only.

## Completion Gaps

Phase 1 gaps:

* `domain-core` is not a fully separated package.
* Runtime schema validation is still minimal.
* STS2MCP adapter is not fully isolated from legacy agent imports.

Phase 2 gaps:

* HumanPlayRecorder does not exist.
* Human diff inference remains non-ground-truth.
* Replay is primarily transition-derived.

Phase 3 gaps:

* Cognitive records are sparse on old transitions.
* DeliberationPacket is not live prompt input.
* Candidate futures are shallow, not multi-step plans.
* Segmented combat plan is not implemented.

Phase 4 gaps:

* ConsolidationRecord is proposal-only.
* Stable memory/derived/reward/strategy updates have no full lifecycle.
* Experiment logging is not a managed subsystem.

Phase 5 gaps:

* No reliable event-log extension.
* No human UI event stream.
* `events.jsonl` is a sink, not ground-truth proof.

Phase 6 gaps:

* Mechanics engine is still incomplete.
* Prediction attribution needs numeric expected-vs-actual comparison.
* Unsupported and mismatch fixtures need stronger coverage.
* Attribution logic should be decomposed into focused modules.

Phase 7 gaps:

* No aggregation of repeated errors.
* No evidence threshold.
* No proposal lifecycle.

Phase 8 gaps:

* No guarded structured prompt integration.
* No A/B prompt comparison.
* No prompt parity acceptance threshold for live use.

Phase 9 gaps:

* No stable update applicator.
* No rollback implementation.
* No experiment gate for scoring/memory/derived changes.

Phase 10 gaps:

* No complete guarded learning loop.
* No run-level learning report.
* No deployment gate based on performance baseline.

## Historical Phase 1 File Change List

Phase 1 should touch only structural boundaries and tests:

* Add `src/domain/types.ts` or `src/core/domain.ts` for stable schemas.
* Add `src/game-io/types.ts` for `GameIO`, `StateReader`, `ActionExecutor`, `GameEventReader`, `AdapterCapabilities`.
* Move or re-export current `AgentAction`, `NormalizedState`, and transition-related types without breaking imports.
* Add `src/adapters/sts2mcp/capabilities.ts`.
* Add `src/data/transitionSchema.ts`.
* Add smoke assertions for adapter capabilities and LLM candidate validation.
* Update `README.md`, `ARCHITECTURE.md`, `GAME_IO_CAPABILITIES.md`, and `DATA_SCHEMA.md`.

Avoid in Phase 1:

* No full controller rewrite.
* No changing action semantics.
* No deleting existing `src/agent/*`.
* No new hard dependency on external packages unless justified.

## Acceptance Criteria

Early acceptance:

* `npm install` succeeds.
* `npm exec tsc -- --noEmit` succeeds.
* `npm run agent:smoke` succeeds offline.
* `npm run agent:review` works on existing memory.
* `npm run collect:state` works when MCP is running.
* `npm run agent:tick -- --dry-run` works when MCP is running.
* Existing `agent:run` and `agent:run:bridge` scripts are preserved.
* STS2MCP capabilities are explicit, including `canReadHumanEvents=false`.
* Human diff inference is never marked ground truth.
* New docs describe current limits and future path.

Engineering acceptance:

* Live runs produce transition logs.
* Replay can answer what was seen, what was selected, and what changed.
* Eval separates errors, warnings, strategy quality issues, and shadow coverage gaps.
* LLM calls are short JSON and validated.
* Prompt never includes full raw state, full Codex, or full memory.
* Program bugs become fixtures or smoke tests.
* Old transition compatibility is preserved.

Cognitive scaffold acceptance:

* Strategic impression, salience, memory activation, derived summary, candidate futures, DeliberationPacket, prompt parity, prediction errors, and replay frames are visible in new transitions.
* Shadow records do not change live action selection.
* Candidate futures include typed prediction checks where supported.
* Unknowns are explicit.

Mechanics and prediction acceptance:

* Expected-vs-actual comparison exists for supported mechanics.
* Unsupported mechanics return `unknown`.
* Attribution buckets are grouped and visible in replay/eval/review.
* Critical mismatches become warnings until enough evidence exists.

Learning acceptance:

* Learning proposals require evidence and counterexample tracking.
* Stable updates require feature flag, threshold, rollback, and eval-before/after.
* No stable memory, derived knowledge, scoring, or strategy mutation happens silently.
* Every applied update can be reverted.

Production-oriented acceptance:

* Performance baselines are tracked.
* Prompt/scoring/memory changes require baseline comparison.
* Ground-truth violations block rollout.
* Invalid actions, illegal targets, stale indices, and no-candidate failures block rollout.
* The system can explain:

  * what it predicted;
  * what happened;
  * what it learned;
  * what it rejected;
  * what it changed;
  * what it rolled back.

