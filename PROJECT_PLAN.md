# Project Plan

This is the current project book for the Slay the Spire 2 AI agent. Future agents should read this after `PROJECT_NORTH_STAR.md` and before making structural changes.

This document is not the North Star itself. The North Star is the long-lived project philosophy. This plan records the working diagnosis, current phase reality, target architecture, staged roadmap, boundaries, acceptance criteria, and guarded learning route.

## 0. Executive Summary

SpireAgent is an LLM-centered Slay the Spire 2 agent.

The intended architecture is:

```text
LLM = strategic player
local system = legality, state normalization, salience, memory retrieval,
candidate futures, prediction checks, replay/eval, guarded learning scaffold
```

The main product is **LLM-centered, not LLM-exclusive**. Provider choice, rollout mode, learning mode, and strategic authority are separate. Local capability or confidence never silently transfers Level 3 strategic authority away from the LLM in `llm_primary` mode.

The project must not become either:

- a pure rules bot that replaces LLM strategic judgment; or
- an opaque LLM wrapper that cannot explain, replay, validate, or improve its decisions.

The current reality is:

- P8/P8.5 can be honestly closed only as `explicit-whitelist live scaffold MVP complete`.
- Explicit broad-whitelist live evidence exists, but wildcard live is still forbidden.
- Stable learning is not implemented.
- Proposal-driven guarded learning infrastructure has started through typed append-only proposals, weak attribution, evidence slicing, review decisions, and bounded P9-G2 shadow comparison. Stable promotion is still disabled.
- The active blocker before P9-G3 is now the combination of insufficient promotion-grade paired/counterexample evidence, missing decision-authority audit foundations, and missing environment-scoped evidence foundations.

The next real work is not more live expansion.

The next real work is:

```text
P9-G2 Decision Authority Foundation
+ P9-G2 Environment Identity And Evidence Scope
+ provider/environment-comparable paired and counterexample evidence
+ only then P9-G3 promotion-ledger / rollback design
```

Execution ordering note:

- `ReverseScaffoldFeedback` is strategically necessary, but it should enter P9 first as telemetry and proposal-seed material, not as an automatic live second-pass controller.
- Learned context and compute/provider orchestration are real long-term targets, but P11 must not be pulled forward by quietly rewriting prompt assembly or budget behavior during P9.
- For the accepted execution ordering, read `docs/phases/P9_P15_EXECUTION_ROADMAP.md` and ADR-0005.

The long-term maturity route is now best understood as:

```text
P0-P8.5 = build, record, evaluate, scaffold, and safely live-route the LLM
P9      = Trustworthy Change Kernel
P10     = Repeatable Experience Learning
P11     = Learned Deliberation OS
P12     = Environment Compatibility And Revalidation
P13     = Player Runtime Beta
P14     = Delegated Skills And Authority Qualification
P15     = Product Release And Operations
R1      = optional isolated local policy/world-model/autonomy research
```

P10-P15 are not immediate implementation work. Their minimum schema/provenance and product-interface foundations may be seeded earlier, but learned runtime behavior belongs in its guarded owner phase. R1 is optional research and cannot silently redefine the main product.

---

## 1. Current Source-of-Truth Status

This section is a roadmap-level summary. Exact current phase, blocker, and next step are canonical only in `docs/04_CURRENT_STATUS.md`.

### 1.1 Current Phase

The active phase is:

```text
P8/P8.5 closeout + active P9-G2 experiment-integrity foundations
```

P8/P8.5 means:

```text
explicit-whitelist live scaffold MVP complete
```

It does not mean:

- wildcard live has been completed;
- every decision class is live-ready;
- broad unbounded live enabled;
- stable learning implemented;
- proposal-driven learning complete;
- autonomous self-improvement complete.

### 1.2 Current Live Posture

Current live posture:

```text
explicit additive whitelist live is real and locally exercised;
wildcard broad live remains forbidden.
```

The currently exercised whitelist includes:

- `combat:llm_required`
- `card_reward:llm_required`
- `map:llm_required`
- `rest:llm_required`
- `shop:llm_required`
- `event:llm_required`
- `card_select:local_recommended_llm_arbitrate`

This is still not wildcard live. Unlisted classes remain local or follow existing fallback routes.

### 1.3 Current P8/P8.5 Evidence

The latest broad-whitelist live evidence recorded in current status is:

- run id: `run-mr8pwmtm-4z75zt`
- 73 transitions
- 15 additive live decisions
- provider source: `deepseek-live-command`
- invalid output: `0`
- invalid choice: `0`
- missing candidate: `0`
- provider error: `0`
- output-cap hits: `0`
- fallback live decisions: `0`

This evidence supports the P8/P8.5 closeout claim, but it does not prove learning.

### 1.4 Current Blocker

The active blocker is no longer provider reachability or basic workspace survival.

The current blocker is:

```text
P9-G2 evidence is not yet sufficient for stable-change design, and the
fresh authority-complete and environment-complete paired evidence is still missing.
```

Specific gaps:

- protected-path gating is only partially landed;
- older shadow-first readiness semantics still coexist with live-applied rollout reporting;
- typed proposal/reverse-feedback stores, weak attribution, evidence slicing, review-decision ledger, and bounded shadow comparison have started;
- stable promotion, rollback snapshots, and traced stable retrieval are not implemented;
- fresh decision records now provide an audit-only authority chain, while historical records remain incomplete by design;
- fresh decision records now provide an audit-only environment fingerprint/scope, but no verified complete-scope paired evidence exists.

---

## 2. Current Diagnosis

The current package is a working TypeScript agent, not a blank project.

Reusable pieces:

- `src/agent/client.ts` isolates REST state reads and action execution behind small `StateSource` / `ActionExecutor` interfaces.
- `src/agent/state.ts` normalizes MCP JSON into `NormalizedState`.
- `src/agent/candidates.ts` generates candidates for combat, rewards, map, shop, events, rest, menu, card select, and bundle select.
- `src/agent/scoring.ts` routes decisions into local, fallback, and LLM-needed paths.
- `src/agent/controller.ts` runs the loop, calls LLM at most once per tick, executes actions, records checkpoints, and currently still owns too much orchestration.
- `src/agent/memory.ts` has run memory, long-term memory, experience memory, strategy params, and conservative reward updates.
- `src/agent/checkpoint.ts` computes post-action state diff and checkpoint kind.
- `src/agent/collector.ts` captures read-only raw and compact state snapshots.
- `src/agent/review.ts`, `src/replay/`, and `src/eval/` provide basic observability.
- `derived/`, `memory/`, `data/spire-codex/`, and `data/runs/` are already separated.

Current strengths:

- Real executor transitions are recorded and replayable.
- Eval can detect JSONL issues, transition consistency problems, ground-truth violations, selected-action mismatch, checkpoint categories, and strategy metrics.
- Cognitive scaffold records exist in shadow/live-adjacent form on fresh transitions.
- `StrategicImpression`, `MemoryActivation`, `CandidateFuture`, `DeliberationPacket`, `PredictionErrorRecord`, `ReplayFrame`, and proposal-only `ConsolidationRecord` are established engineering objects.
- P8 workspace comparison and provider telemetry are visible in replay/eval/review.
- DeepSeek command live adapter can participate in explicit whitelist live execution.

Main problems:

- Stable learning does not exist.
- P9 typed proposal/reverse-feedback stores, audit-only review decisions, weak proposal seeds, evidence slicing, and G2 shadow comparison have started; none of them apply stable behavior.
- Protected-path governance is only partially hardened.
- `controller.ts` remains too broad.
- Some readiness metrics still reflect older shadow/combat-first semantics.
- `cognitiveScaffold`-style responsibilities can become too broad if attribution, prompt parity, proposal logic, and workspace logic accumulate together.
- Prediction checks need conservative deterministic mechanics support; unsupported mechanics must return `unknown`.
- Current STS2MCP REST has no reliable event log or human UI event stream.
- Human diff inference must never be treated as ground truth.
- Combat is still mostly one action per tick; segmented plans and continuation policy are not implemented.
- Coverage metrics must distinguish old transitions from fresh-schema transitions.
- Performance baselines are still less mature than engineering correctness metrics.
- Context OS and Compute/Budget OS are documented as long-term architecture, but should not yet change live behavior.

---

## 3. Target Architecture

The long-term architecture is:

```text
raw game state
  -> game-io adapter
  -> canonical state
  -> deterministic mechanics / fact layer
  -> strategic impression / salience
  -> memory activation
  -> derived knowledge snapshot
  -> candidate futures with prediction checks
  -> deliberation packet / compiled workspace
  -> LLM strategic decision
  -> validation and safe execution
  -> transition recorder
  -> replay / eval / review
  -> prediction attribution
  -> reverse scaffold feedback
  -> typed learning proposals
  -> guarded shadow application
  -> stable promotion gate
  -> rollback if regression
```

Target modules:

- `domain-core`: versioned schemas for state, action, transition, memory, prediction, attribution, proposals, promotion ledgers, budget records, and capabilities.
- `game-io`: state read, action execute, event read, and action-result interfaces.
- `adapters/sts2mcp`: current localhost REST adapter.
- `adapters/spire-codex`: objective fact database sync/read adapter.
- `state-normalizer`: raw state to canonical state.
- `mechanics-engine`: deterministic legality, energy, target, damage, block, lethal, affordability, card flow, phase, and state-diff helpers.
- `fact-db`: objective cards, relics, characters, keywords, potions, enemies, encounters, and game text.
- `derived-knowledge`: tags, synergies, anti-synergies, draft rules, and strategy hints. Must not mutate raw facts silently.
- `memory-system`: run memory, episodic memory, stable memory, retrieval, compression, confidence, evidence, applicability, and rollback metadata.
- `planning-scaffold`: candidate actions, candidate futures, shallow plans, combat continuation hints, route/shop/event/card-reward plans.
- `llm-decision`: compact prompt, provider adapters, output schema, JSON validation, legacy prompt, structured workspace, and gated prompt integration.
- `execution-loop`: execution, settlement, checkpoint, re-read, replan, and continuation control.
- `data-recorder`: metadata, snapshots, events, transitions, replay frames, prediction errors, proposal logs, prompt assembly records, and budget use records.
- `eval-runner`: invariants, replay checks, prediction attribution, proposal health, performance baselines, and go/no-go gates.
- `experiment-manager`: proposals, feature flags, thresholds, rollout gates, shadow overlays, stable promotion ledgers, and rollback.
- `context-os`: long-term layer for prompt assembly, temporary working cache, expanded panels, context exclusion records, and learned Prompt Compiler policies.
- `budget-os`: long-term layer for budget profiles, budget requests, BudgetUseRecord, BudgetROIDigest, and learned compute allocation policies.
- `review-cli`, `replay-cli`, `eval-cli`: observability and offline evaluation.

---

## 4. Module Boundaries

Dependency direction must stay low-to-high:

```text
domain-core
  <- game-io / state-normalizer / mechanics-engine / fact-db
  <- derived-knowledge / memory-system
  <- planning-scaffold
  <- llm-decision / context-os
  <- execution-loop
  <- recorder / replay / eval / review
  <- experiment-manager / budget-os
  <- CLI
```

Rules:

- Game I/O does not know strategy.
- Raw facts do not contain learned strategy.
- Derived knowledge does not silently mutate raw facts.
- Memory is structured, retrievable, compressible, confidence-rated, evidence-linked, and auditable.
- Mechanics calculations must be deterministic and conservative. If not reliable, return `unknown`.
- LLM never directly executes game actions. It selects from validated candidates.
- Recorder records; it does not decide strategy.
- Eval reports, warns, summarizes, and proposes; it does not mutate stable strategy.
- Learning proposals are not stable learning until guarded acceptance.
- External projects are hidden behind adapters and capability checks.
- Human diff inference is never ground truth.
- Old transition compatibility is required, but old data must not hide fresh-schema failures.
- Prompt Compiler and Budget Manager are soft-shell policy surfaces, but they cannot be directly changed by LLM output.
- Context expansion and budget increase require audit records and ROI review.

---

## 5. Hard Shell and Learnable Soft Shell

### 5.1 Hard Shell

The hard shell is sacred.

The LLM must not directly modify or bypass:

- allowed candidate legality;
- action schema;
- validation;
- execution safety;
- rollback authority;
- provider boundary;
- data truth separation;
- protected path;
- stable promotion gate;
- audit log;
- hard budget cap;
- live whitelist / wildcard boundary;
- API key / secret boundaries;
- privacy/security boundary.

Blocker changes include:

- provider or LLM can write stable memory directly;
- runtime reflection can mutate derived knowledge or strategy params;
- legacy finalize feedback bypasses `ProtectedPathGate`;
- wildcard live is enabled casually;
- validation is weakened to fit LLM output;
- budget cap can be raised directly by LLM request without review, profile policy, hard cap, and rollback;
- console/fixture/debug evidence can be promoted as stable learning;
- Prompt Compiler or Budget Manager changes live behavior without gate.

### 5.2 Learnable Soft Shell

The soft shell is gradually learnable through guarded proposals.

Soft shell includes:

- Strategic Impression;
- SalienceSignal;
- MemoryActivation;
- CandidateFuture;
- candidate templates;
- reason policy;
- classification policy;
- skill policy;
- review rubric;
- memory retrieval policy;
- context expansion policy;
- prompt assembly policy;
- compression policy;
- temporary cache policy;
- token budget allocation policy;
- reasoning profile policy;
- learning compute policy.

Soft shell changes must follow:

```text
signal / feedback
  -> weak attribution
  -> typed pending proposal
  -> evidence and counterexample search
  -> human or strict review
  -> shadow apply
  -> replay/eval comparison
  -> small-live validation when appropriate
  -> stable promotion
  -> usage tracking
  -> rollback if regression
```

A single LLM reflection is never stable learning.

---

## 6. Cross-Cutting New Architecture

### 6.1 Reverse Scaffold Channel

SpireAgent must support an LLM feedback path for criticizing the soft scaffold.

The LLM may report:

- missing information;
- insufficient context;
- bad compression;
- missing candidate family;
- weak candidate future;
- wrong memory retrieval;
- misleading first impression;
- overly coarse classification;
- prompt assembly issue;
- budget insufficiency;
- needed expanded panel;
- skill that should have triggered.

This feedback can only become telemetry, proposal seed, pending proposal, shadow policy, or stable policy after validation.

It cannot directly change live execution, validation, allowed candidates, stable memory, derived knowledge, or budget caps.

Minimal schema direction:

```ts
interface ReverseScaffoldFeedback {
  informationRequests: InformationRequest[];
  candidateSetFeedback: CandidateSetFeedback[];
  compressionFeedback: CompressionFeedback[];
  memoryRetrievalFeedback: MemoryRetrievalFeedback[];
  impressionFeedback: ImpressionFeedback[];
  classificationFeedback: ClassificationFeedback[];
  promptAssemblyFeedback: PromptAssemblyFeedback[];
  contextExpansionFeedback: ContextExpansionFeedback[];
  temporaryCacheFeedback: TemporaryCacheFeedback[];
  budgetFeedback: BudgetFeedback[];
  skillFeedback: SkillFeedback[];
  uncertainty: {
    informationSufficiency: number;
    mainAssumptions: string[];
    suspectedMissingFactors: string[];
  };
}
```

P9 should record this feedback only. Later phases may convert it into proposals, shadow policies, and stable policies.

### 6.2 Context OS / Learned Prompt Compiler

Prompt construction is not a fixed template. It is a compiled workspace.

Long-term structure:

```text
raw state
  -> salience extraction
  -> expandable panels
  -> temporary working cache
  -> memory retrieval
  -> skill/scaffold policy retrieval
  -> prompt compiler
  -> LLM decision
  -> reverse scaffold feedback
  -> proposal/eval/promotion
```

Context OS layers:

- Raw State Layer
- Salience Layer
- Expanded Panel Layer
- Temporary Working Cache
- Episodic Memory Layer
- Stable Memory Layer
- Skill / Scaffold Policy Layer
- Prompt Compiler

More context is not automatically better.

The system must eventually learn both when to add context and when to remove noisy context.

Required audit records for this direction:

- `PromptAssemblyRecord`
- `ContextExclusionRecord`
- `MemoryExclusionRecord`
- `CandidateFamilyExclusionRecord`
- context ROI
- prompt bloat / distractor tracking

In P9, this is telemetry only.

### 6.3 Compute/Budget OS

Budget is a hard resource with learnable allocation.

Future reasoning profiles may include:

- `low`
- `medium`
- `high`
- `research`

The LLM may request more budget, but it cannot approve budget.

In P9, such a request is proposal/review evidence only.
It must not change runtime caps, rescue caps, thinking mode, provider retry behavior, compression, model choice, validation, or execution.

Budget Manager must preserve hard budget caps and decide using:

- remaining run budget;
- floor / boss / elite / shop / reward value;
- uncertainty;
- information sufficiency;
- historical ROI;
- token cost;
- latency;
- provider health;
- rollback/safety risk;
- whether context has already been expanded;
- whether the decision is low-value repetition.

Required audit records:

- `BudgetUseRecord`
- `BudgetROIDigest`
- denied request outcome tracking
- false high-risk request tracking
- cost-benefit review

More tokens are not proof of better reasoning.

In P9, this is telemetry only.

---

## 7. Updated Maturity Route

The old Phase 0-13 and intermediate P9-P16 plans remain historically useful, but the accepted mainline is P0-P15 plus optional research track R1. See `docs/phases/P9_P15_EXECUTION_ROADMAP.md` and ADR-0005 for canonical forward ordering and historical mapping.

### P0-P2.6: Trusted Boundaries, Recording, Replay, and Eval

Goal:

Establish trusted boundaries, schema anchors, executor-grounded transition recording, replay, and eval.

Status:

Completed MVP.

Key outputs:

- basic domain and adapter boundaries;
- executor transition recording;
- replay reader/CLI;
- eval runner;
- warning classification;
- strategy metrics.

Remaining concerns:

- `domain-core` is not fully separated;
- runtime schema validation is still light;
- human event capture remains blocked;
- old transition compatibility must remain preserved.

### P3-P6: Predictive Cognitive Scaffold and Attribution

Goal:

Make Strategic Impression, salience, memory activation, candidate futures, DeliberationPacket, prediction checks, and attribution visible, replayable, and testable.

Status:

MVP implemented in shadow / replayable form.

Key outputs:

- cognitive scaffold records on fresh transitions;
- DeliberationPacket and workspace comparison;
- CandidateFuture prediction checks;
- PredictionErrorRecord;
- attribution buckets;
- replay/eval/review visibility.

Remaining concerns:

- old transitions are sparse;
- candidate futures remain shallow;
- mechanics helpers need more numeric expected-vs-actual coverage;
- attribution modules should stay decomposed;
- output remains non-mutating.

### P7: Proposal Surface and Aggregation

Goal:

Turn prediction-error and unsupported/critical attribution into non-mutating proposal surfaces.

Status:

Proposal surface MVP exists, but not a full guarded learning system.

Key outputs:

- proposal-only ConsolidationRecord;
- proposal evidence fields;
- proposal counts and grouped review visibility;
- P7.5 aggregation surface.

Remaining concerns:

- typed P9 proposal infrastructure exists, but no stable promotion exists;
- review decisions are audit-only and do not apply proposals;
- P9-G2 paired/counterexample evidence remains incomplete;
- no proposal-to-shadow-to-stable lifecycle has completed.

### P8/P8.5: Structured Workspace and Explicit-Whitelist Live Scaffold

Goal:

Let the DeliberationPacket enter the LLM workspace in an auditable, feature-flagged way, and allow additive live use only under explicit whitelist, validation, and rollback.

Status:

Can be closed only as:

```text
P8/P8.5 explicit-whitelist live scaffold MVP complete
```

What is complete:

- StrategicImpression, SalienceSignal, MemoryActivation, CandidateFuture, DeliberationPacket, PredictionErrorRecord, ReplayFrame, and ConsolidationRecord on fresh transitions.
- P8 workspace comparison and provider telemetry in replay/eval/review.
- DeepSeek shadow provider plumbing.
- DeepSeek command live adapter.
- Additive live prompting behind feature flag and explicit decision-class whitelist.
- Separate live-applied rollout audit exists.
- Latest broad-whitelist evidence demonstrates clean provider/validation/execution on a bounded explicit whitelist.

What is not complete:

- wildcard live;
- every decision class being live-ready;
- stable learning;
- automatic derived knowledge writes;
- strategy-param writes;
- scaffold-policy promotion;
- full proposal-driven learning;
- fully hardened protected-path governance.

Required next move:

Do not expand live. Move to P9 hardening and proposal infrastructure.

---

## 8. P9: Trustworthy Change Kernel

P9 is not “turn on automatic learning.”

P9 is:

```text
protected, typed, evidence-linked, rollback-capable proposal learning
```

Goal:

Prove that one low-risk soft-shell policy can move from organic evidence to stable use and back to baseline through a complete, independently auditable lifecycle.

P9 uses four finite gates. Existing P9.0-P9.8 names remain implementation-history aliases, not an endlessly extensible phase taxonomy:

| Forward gate | Historical aliases | Purpose |
| --- | --- | --- |
| P9-G1 Evidence Safety | P9.0-P9.4 | protected paths, typed proposals, weak attribution, evidence provenance, audit-only review |
| P9-G2 Experiment Integrity | P9.5A-P9.5E | comparable shadow overlays, counterexamples, decision authority, environment scope |
| P9-G3 Stable Change | P9.6-P9.7 | promotion ledger, rollback, compatible retrieval, regression guards |
| P9-G4 Lifecycle Demonstration | P9.8 | one complete low-risk lifecycle and rollback drill |

P9 must include:

- `ProtectedPathGate`
- typed `LearningProposal` schema/store
- `ReverseScaffoldFeedback` schema
- `EvidenceSliceReader`
- weak attribution
- anti-vague-proposal rules
- pending vs stable separation
- append-only proposal store
- review CLI
- shadow-before-stable flow
- stable promotion ledger
- rollback mechanism
- minimal `PromptAssemblyRecord`
- minimal `BudgetUseRecord`

P9 must not include:

- wildcard live;
- automatic stable memory writes;
- automatic stable derived knowledge writes;
- automatic skill promotion;
- automatic PromptCompiler behavior changes;
- automatic BudgetManager behavior changes;
- live behavior changes from context/budget feedback;
- provider contract heroics as a substitute for learning.

### P9-G1 Evidence Safety

Historical implementation packages P9.0-P9.4 live under this gate.

#### P9.0 Protected Path Hardening

Goal:

Prevent accidental stable writes before learning infrastructure starts.

Work:

- block live/provider-originated writes to protected paths;
- isolate or gate legacy `finalizeRun()` stable write behavior;
- label legacy feedback as legacy, gated, and auditable;
- prevent bridge/live responders from writing memory/derived/strategy/skill;
- add protected-path audit logs and fixtures.

Acceptance:

- live LLM output cannot mutate stable memory, derived knowledge, strategy params, skill, or scaffold policy;
- legacy stable-write paths are gated or disabled by default;
- malicious or accidental `memoryUpdates` cannot bypass the gate;
- explicit whitelist live remains behaviorally unchanged except for protection.

#### P9.1 LearningProposal Schema and Store

Goal:

Replace free-form proposals with typed pending proposals.

Required proposal families:

- `MemoryProposal`
- `DerivedKnowledgeProposal`
- `CandidateTemplateProposal`
- `ReasonPolicyProposal`
- `BudgetCompressionPolicyProposal`
- `ClassificationPolicyProposal`
- `SkillProposal`
- `ScaffoldPolicyProposal`
- `RetrievalPolicyProposal`
- `ImpressionPolicyProposal`
- `ContextExpansionPolicyProposal`
- `PromptAssemblyPolicyProposal`
- `BudgetAllocationPolicyProposal`

Minimum fields:

- `id`
- `schemaVersion`
- `type`
- `status`
- `scope`
- `targetLayer`
- `targetObject`
- `proposedPatch`
- `evidence`
- `counterexamples`
- `confidence`
- `riskLevel`
- `promotionCriteria`
- `rollbackPlan`
- `createdFromRunIds`
- `createdFromTransitionIds`
- `protectedPathImpact`
- `reviewHistory`
- `revalidationResults`

Acceptance:

- proposals are append-only;
- vague proposals are rejected or draft-only;
- proposal store does not mutate live or stable behavior.

#### P9.2 Reverse Feedback and Weak Attribution

Goal:

Record why the LLM believes the scaffold was insufficient.

Work:

- add `ReverseScaffoldFeedback`;
- record `informationSufficiency`;
- record missing information;
- record candidate set feedback;
- record compression/memory/impression/classification/prompt/budget feedback;
- map replay/review failures to suspected repair layers;
- keep attribution weak.

Acceptance:

- feedback does not change live behavior;
- all attribution is marked suspected unless validated;
- counterexample requirements are recorded.

#### P9.3 EvidenceSliceReader

Goal:

Ensure promotion evidence is clean, scoped, and comparable.

Work:

- distinguish real live, shadow, bridge, console-assisted, fixture/debug, mixed budget, mixed revision, latest window, and historical windows;
- exclude dirty evidence from stable promotion;
- expose evidence windows to review CLI.

Acceptance:

- console/fixture/debug evidence cannot promote stable learning;
- mixed windows are labeled;
- latest live evidence remains separate from shadow-only readiness.

#### P9.4 Review CLI

Goal:

Let humans inspect, approve, reject, expire, and revert proposals.

Acceptance:

- `list`, `show`, `reject`, `approve-for-shadow`, `expire`, and `mark-counterexample-needed` paths exist;
- approval for review is not stable application;
- review history is recorded.

### P9-G2 Experiment Integrity

Historical P9.5A-P9.5E work belongs to this gate. G2 must prove comparable experiment conditions and refusal/narrowing on counterexamples; a single improved reason string is not validation.

Before another pair can advance G2, the project must repair selection provenance, shared evidence-role classification, source-resolved proposal eligibility, provider experiment fingerprinting, manifest integrity, and P9 exact-identity applicability. See [ADR-0006](docs/decisions/ADR-0006-policy-influence-and-evidence-provenance.md) and the [P9-P10 corrective audit](docs/reports/P9_P10_TRUSTWORTHY_CHANGE_KERNEL_AUDIT_2026-07-11.md).

#### P9.5 Shadow Applicator

Goal:

Apply low-risk proposals in shadow first.

Allowed early targets:

- cloned facts/order-preserving context projections for G2 comparison only
- no G3 target is authorized by that cloned comparison alone

Forbidden early targets:

- validation;
- execution;
- action legality;
- hard whitelist;
- stable memory direct writes;
- hard budget cap.

#### P9.5D Decision Authority Foundation

Goal:

Make deliberation, selection, authorization, execution, plan origin, and delegated-skill identity independently auditable without changing current behavior.

Acceptance:

- provider/run mode is no longer treated as decision authority;
- proposed selection, final selection, local override, authorization, and execution are independently auditable;
- proposal mutation surface and possible decision influence are explicit;
- authority-changing proposals cannot enter the first stable-promotion path;
- old transitions remain readable.

#### P9.5E Environment Identity And Evidence Scope

Goal:

Scope evidence and future learned objects to game build/channel, content/mod set, adapter capabilities, fact snapshot, agent revision, and provenance.

Acceptance:

- unknown and mixed incompatible environments cannot qualify stable promotion;
- historical evidence remains readable;
- compatibility and quarantine are explicit;
- no live behavior changes.

### P9-G3 Stable Change

G3 may begin only after a written G2 audit passes. The first target must be a narrow human-approved **deliberation-shaping** policy that preserves facts, legal candidates, candidate order, validation, execution, live authorization, strategic authority, and protected paths. `presentation_only` is reserved for post-decision display/observability changes and cannot prove the meaningful soft-shell lifecycle.

#### P9.6 Stable Promotion Gate

Goal:

Allow narrow stable promotion only after evidence, shadow comparison, and rollback readiness.

Acceptance:

- promotion ledger exists;
- rollback snapshot exists;
- before/after eval exists;
- usage tracking exists;
- regression blocks promotion.

#### P9.7 Retrieval / Scaffold Integration

Goal:

Let stable learned policies influence future scaffold construction in a recorded way.

Acceptance:

- transition records which learned policy was used;
- review can explain policy impact;
- rollback removes the effect.

### P9-G4 Lifecycle Demonstration

#### P9.8 End-to-End Guarded Learning Window

Goal:

Demonstrate one full proposal lifecycle:

```text
error / scaffold feedback
  -> proposal
  -> evidence/counterexample
  -> shadow validation
  -> stable promotion
  -> future use
  -> rollback possible
```

First recommended stable target:

- no specific proposal family is pre-approved;
- a future narrow context policy may qualify only with source-resolved evidence, counterexamples, exact identity match, provider-profile-comparable shadow evidence, retrieval trace, rollback, organic canary, and explicit human approval.

Do not start with strategy params.

P9 exits after one independently auditable low-risk lifecycle and successful rollback drill. It does not remain open merely to add more proposal families.

---

## 9. P10: Repeatable Experience Learning

Goal:

Prove that the P9 lifecycle remains bounded, interpretable, and operational as evidence, proposals, policies, and environments accumulate.

Engineering modules:

- `ProposalAggregator` and `ProposalDeduplicator`;
- conflict, supersession, expiry, and evidence-aging handling;
- `CounterexampleHarvester`;
- `RetrievalImpactTracker` and `RegressionMonitor`;
- proposal survival, rollback, and policy-use impact reporting;
- `CoverageGapDetector` and bounded `ExperimentQueue`;
- backlog size, age, duplicate rate, and human-review load reporting.

The scheduler may prioritize defined evidence gaps, counterexamples, regressions, and environment revalidation. It is not an open-ended autonomous curriculum and may not invent arbitrary objectives or approve its own policy changes.

P10 exit matrix:

- three independent lifecycles;
- at least two proposal families and distinct scopes;
- one correctly rejected proposal;
- one proposal narrowed after counterexamples;
- one rollback or formal rollback drill;
- one environment invalidation or expiry case;
- retrieval usefulness and harm are both observable;
- duplicates are suppressed and review backlog stays within documented limits.

P10 does not transfer strategic authority. It improves the experience shell under the current authorized mode.

---

## 10. P11: Learned Deliberation OS

Goal:

Learn how the LLM should be informed and how much deliberation resource it should receive, while keeping strategic authority, hard caps, and provider failure handling explicit.

P11 combines context and compute policy at the phase level because both affect deliberation quality. They remain separate modules and gates.

### P11A Context Compiler

Modules:

- `SaliencePolicy`;
- `MemoryRoutingPolicy`;
- `CandidatePresentationPolicy`;
- `ContextOmissionRecord`;
- `CompressionPolicy`;
- `PromptAssemblyLineage`;
- `ContextPolicyEvaluator`.

P11A may learn salience, memory inclusion, CandidateFuture presentation, context-panel expansion, compression, assembly order, and response to reverse-scaffold feedback. It must not use raw-state dumping, hide fact/candidate loss, or optimize merely for reason-detector wording.

P11A exits when one context-policy family is promoted and rolled back through the P9/P10 kernel and shows downstream utility or information-preservation benefit on compatible slices without candidate/fact loss.

### P11B Compute And Provider Orchestration

Modules:

- `DeliberationProfile` and `DeliberationProfileSelector`;
- `ProviderCapabilityRegistry`;
- `BudgetUseRecord` and `BudgetROIDigest`;
- `BudgetPolicyEvaluator`;
- second-opinion policy;
- hard call, recovery, run, cost, time, and concurrency circuit breakers.

P11B begins only after P11A provides context-lineage baselines. Provider recovery remains operational infrastructure and is not silently learned. More compute, another model, or a second opinion never grants strategic authority.

P11B must not allow self-approved spending, automatic cap escalation, provider-failure laundering, hidden context compression, or token saving as a strategic objective.

P11B exits when a rollbackable deliberation-profile policy demonstrates a measured quality/cost/latency benefit under equivalent evidence and fixed authority without crossing hard caps.

---

## 11. P12: Environment Compatibility And Revalidation

Goal:

Keep facts, evidence, learned policies, and qualified skills valid across game builds, content/mod sets, adapters, schemas, and fact snapshots.

Minimum read-only environment identity begins in P9-G2. P12 turns that foundation into an operating system.

Modules:

- `EnvironmentHandshake` and `EnvironmentFingerprintStore`;
- `CompatibilityRegistry`;
- learned-object dependency graph;
- `QuarantineManager` and `RevalidationQueue`;
- adapter conformance suite and compatibility canaries;
- compatibility-aware retrieval and delegated-skill eligibility;
- user-visible compatible/degraded/quarantined/unsupported state.

P12 exits when an environment change can identify affected objects, quarantine only those objects, block incompatible use, run conformance/shadow/canary checks, and restore or preserve quarantine with an auditable migration record.

---

## 12. P13: Player Runtime Beta

Goal:

Expose the safe LLM-primary runtime to non-developer use early enough that operational reality can correct the architecture before release.

Product-interface work may proceed as a parallel workstream before P13, but P13 is the beta acceptance gate.

Modules:

- installer/bootstrap and environment diagnostics;
- provider-neutral command/gateway contract;
- local secret management;
- observe, copilot, LLM-primary, pause, takeover, and review controls;
- visible provider, authority, rollout, learning, and compatibility modes;
- evidence/privacy controls and deletion/export;
- secret-redacted support bundle;
- crash recovery and degraded-mode behavior.

Delegated play is not required for beta. Wildcard live is not implied.

P13 exits when multiple clean-machine beta installations complete normal play, provider failure, pause/takeover, rollback, update, and support-diagnostic scenarios without secret leakage or hidden authority changes.

---

## 12.1 P14: Delegated Skills And Authority Qualification

Goal:

Qualify bounded reusable skills without displacing LLM long-horizon strategic ownership in `llm_primary` mode.

Modules:

- `SkillProposal` and immutable skill artifact;
- initiation, termination, invalidation, and escalation conditions;
- competence-region and out-of-distribution evaluator;
- environment compatibility requirement;
- authority ledger and LLM takeover path;
- canary, rollback, revocation, and regression monitoring.

P14 must not infer authority from confidence, use a decision class as proof of competence, or let a skill expand its own scope.

P14 exits only when one bounded skill passes organic evidence, counterexample, environment, takeover, rollback, and revocation tests. If none qualify, delegated play stays disabled and the core product may still proceed.

## 12.2 P15: Product Release And Operations

Goal:

Release and operate a provider-neutral LLM-primary player product with explicit compatibility, authority, learning, privacy, update, and rollback controls.

Modules:

- signed/versioned packaging and release channels;
- migration, upgrade, downgrade, and rollback tooling;
- provider setup and capability diagnostics;
- privacy, evidence retention, export, and deletion policy;
- compatibility quarantine and recovery UX;
- crash reporting and support diagnostics with secret redaction;
- release canaries, incident response, and rollback runbooks.

P15 exits when a release candidate passes clean install, upgrade, downgrade/rollback, secret-leak, data migration, compatibility quarantine, crash recovery, and support-diagnostic tests. Delegated play ships only if P14-qualified; otherwise it remains disabled.

## 12.3 R1: Optional Local Policy, World Model, And Autonomy Research

Goal:

Explore local policy/value/world models, strategic distillation, skill discovery, and architecture search in an isolated mode.

R1 must remain separate from `llm_primary`, use separate authorization, stores, and benchmarks, preserve legality/validation/rollback/provenance/environment scope, and never treat capability gain as automatic authority transfer.

R1 failure or deferral does not invalidate the LLM-centered player product or P15 release.

---

## 13. Cross-Phase Performance Baselines

Engineering correctness is necessary but not sufficient.

Starting from P6 and continuing through P15, each mainline phase should preserve or improve performance baselines appropriate to its authority and environment scope. R1 research must use separate benchmarks and must not contaminate mainline claims.

Minimum metrics:

- floor reached
- death floor
- combat HP loss
- block deficit
- tempo loss
- fallback rate
- LLM call rate
- invalid action count
- illegal target count
- stale index count
- settlement timeout rate
- bad checkpoint rate
- prediction mismatch rate
- prediction accuracy by horizon and environment scope
- risk calibration and escalation quality
- decision consistency under equivalent states
- unknown prediction rate
- unsupported prediction rate
- potion use
- route/reward quality proxy
- proposal survival rate
- rollback frequency
- retrieval usefulness
- retrieval harm rate
- delegated-skill success, termination, escalation, and OOD rate
- authority-chain completeness and unauthorized-authority count
- environment compatibility, quarantine, and revalidation rate
- context expansion ROI
- budget ROI
- prompt bloat ratio

Coverage must be separated:

```text
allRunCoverage
freshSchemaCoverage
latestTransitionCoverage
```

Go/no-go rules:

- Schema coverage alone cannot justify live integration.
- Prompt/scoring/memory/context/budget changes require performance comparison.
- Any increase in invalid actions, illegal targets, stale indices, or ground-truth violations blocks rollout.
- Any uncertain improvement remains shadow-only.
- More context and more tokens are not automatically better.

---

## 14. Completion Gaps

P8/P8.5 gaps:

- wildcard live remains forbidden;
- all-class live is not authorized;
- stable learning is not implemented;
- P8 readiness reporting still has older shadow-first semantics beside live-applied rollout reporting;
- protected-path stable-write governance is closed for P9 origins but legacy-finalize and learned-store integrity remain auditable boundaries;
- replay/eval/review can surface proposal evidence, but do not yet drive a real promotion pipeline.

P9 gaps:

- G2 selection provenance is not yet truthful when a local guard overrides a valid LLM proposal; historical mismatches need conservative exclusion;
- replay, proposal, and manifest evidence-role classifiers need one shared structured source of truth;
- proposal eligibility needs source-resolved evidence, non-empty protected targets, and one final fail-closed decision;
- pre-decision policy overlays need mutation-surface/decision-influence semantics rather than `presentation_only` labelling;
- P9-G2 counterexample and comparable paired evidence is incomplete after those integrity repairs;
- fresh environment scope needs provider experiment fingerprinting, manifest diagnostics, and exact-identity applicability before P12 compatibility evaluation;
- stable promotion ledger, rollback snapshot, status transition, and traced retrieval are not implemented.

P10 gaps:

- no immutable policy event projector, semantic key, scope lattice, corruption quarantine, or authority-policy evidence contract;
- no bounded proposal aggregation/deduplication operation;
- no counterexample harvester or evidence-aging policy;
- no matched-slice impact hierarchy, proposal survival, retrieval-impact, or backlog-health report;
- no bounded coverage-gap/regression experiment queue or candidate-challenge telemetry.

P11 gaps:

- no promoted Context Compiler policy or complete prompt-assembly lineage;
- no context omission/utility evaluator;
- no deliberation-profile selector or provider capability registry;
- no guarded compute/provider policy evaluation under hard caps.

P12 gaps:

- no full environment handshake or compatibility registry;
- no learned-object dependency graph, quarantine, or revalidation queue;
- no compatibility-aware retrieval or canary process.

P13 gaps:

- no non-developer clean-install beta;
- no complete provider/authority/learning/compatibility controls;
- no secret-redacted support bundle, privacy controls, or tested degraded-mode UX.

P14 gaps:

- no bounded skill artifact lifecycle;
- no competence/OOD, initiation/termination, takeover, revocation, or authority qualification.

P15 gaps:

- no release-grade packaging, migration, downgrade/rollback, incident response, or support operations.

R1 research gaps:

- no isolated local policy/value/world-model benchmark;
- no separate local-autonomy authority mode or North Star change process.

---

## 15. Acceptance Criteria

### Engineering Acceptance

- `npm install` succeeds.
- `npm exec tsc -- --noEmit` succeeds.
- `npm run check` succeeds when code changes are made.
- Existing `agent:run`, DeepSeek live runner, replay, eval, and review commands remain compatible.
- STS2MCP capabilities remain explicit.
- Human diff inference is never marked as ground truth.
- Live runs produce transition logs.
- Replay can answer what was seen, what candidates existed, what was selected, and what changed.
- Eval separates errors, warnings, strategy issues, proposal health, and shadow coverage gaps.
- LLM outputs are validated.
- Prompt never includes full raw state, full fact DB, or full memory.
- Program bugs become fixtures or smoke tests.
- Old transition compatibility is preserved.

### Cognitive Scaffold Acceptance

- Fresh transitions expose strategic impression, salience, memory activation, derived summary, candidate futures, DeliberationPacket, prompt parity, prediction errors, and replay frames.
- Shadow records do not change live action selection unless explicitly gated.
- Candidate futures include typed prediction checks where supported.
- Unknowns are explicit.
- Missing candidate/context/memory signals can be recorded.

### Prediction and Mechanics Acceptance

- Expected-vs-actual comparison exists for supported mechanics.
- Unsupported mechanics return `unknown`.
- Attribution buckets are visible in replay/eval/review.
- Critical mismatches become warnings or proposals, not stable learning.
- Mechanics logic is decomposed enough to test.

### Learning Acceptance

- Learning proposals require evidence and counterexample tracking.
- Stable updates require feature flag, threshold, rollback, and eval-before/after.
- No stable memory, derived knowledge, scoring, strategy, prompt, context, or budget mutation happens silently.
- Every applied update can be reverted.
- Proposal evidence distinguishes live, shadow, bridge, console, fixture, historical, and latest windows.

### Context/Budget Acceptance

- Prompt assembly lineage is recorded before prompt policy changes.
- Context exclusions are recorded for key decisions.
- Budget requests and approvals are recorded before budget policy changes.
- Context and budget policies require ROI review.
- LLM can request more context/compute, but cannot approve it.
- More context or more tokens do not count as success without decision-quality evidence.

---

## 16. Current Minimum Next Step

Do not continue expanding live.

Do not do wildcard.

Do not let LLM write stable memory.

Do not start automatic skill promotion.

Do not start automatic PromptCompiler.

Do not start adaptive budget behavior.

The current minimum next step is:

1. Preserve the existing P9-G1 and partial G2 non-mutating boundaries.
2. Implement G2 selection-resolution provenance and conservative historical mismatch exclusion.
3. Centralize evidence-role classification and source-resolved proposal authorization, preserving console/debug exclusion.
4. Add provider experiment identity, manifest diagnostics, exact-identity applicability, and legacy-store contamination markers.
5. Requalify existing evidence, then collect naturally occurring comparable pairs/counterexamples under matching environment/provider scope.
6. Audit mutation surface and possible decision influence; keep authority/action/hard-shell and candidate-generation changes outside the first stable path.
7. Only then design G3 event ledger, immutable version diff, rollback snapshot, status transition, retrieval trace, and canary.
8. Keep stable promotion disabled until those prerequisites pass.

---

## 17. What Must Not Be Misunderstood

- Explicit whitelist live is not wildcard live.
- Provider/validation/execution clean is not learning complete.
- P8 workspace success is not P9 proposal learning.
- Reflection is not stable knowledge.
- A proposal is not stable learning.
- Reason quality is a smoke alarm, not strategic truth.
- Console/fixture/debug evidence is not stable-promotion proof.
- More context is not automatically better.
- More tokens are not automatically better.
- The hard shell is not learnable.
- Soft shell can become learnable only through evidence, shadow validation, promotion, and rollback.
- Soft-shell capability does not automatically grant strategic authority.
- A successful outcome is evidence, not precise causal proof.
- Evidence from an unknown or incompatible environment is not promotion-grade.
- The final product is not a rule engine.

---

## 18. Demonstration Milestones

### P8.5 Demo

```text
LLM safely plays through explicit whitelist live scaffold.
```

This is an engineering safety demo, not a learning demo.

### P9-G4 Demo

```text
agent makes or detects an error
  -> proposal is generated
  -> evidence/counterexample is collected
  -> shadow validation runs
  -> stable promotion occurs
  -> future decision uses it
  -> rollback remains possible
```

This is the first real learning demo.

### P10 Demo

```text
multiple bounded learning lifecycles
  -> proposals deduplicate and conflict visibly
  -> counterexamples narrow or reject changes
  -> retrieval impact and harm are measured
  -> backlog remains reviewable
  -> rollback and environment expiry are exercised
```

This is the first repeatable learning-operations demo.

### P11 Demo

```text
context lineage identifies an omission or waste
  -> context policy is proposed, compared, promoted, and rolled back
  -> a separate deliberation profile improves quality/cost/latency under hard caps
  -> authority and provider recovery remain unchanged
```

This is the Learned Deliberation OS demo, not autonomous curriculum.

### P12 Demo

```text
a game/mod/adapter change is detected
  -> affected learned objects are quarantined
  -> compatible objects remain available
  -> revalidation and canary evidence restore or reject affected objects
```

This is the environment compatibility and revalidation demo.

### P13 Demo

```text
a non-developer installs the beta, configures a provider safely,
runs LLM-primary play, pauses or takes over, inspects evidence,
and recovers from provider or environment degradation
```

This is the player-runtime beta demo.

### P14 Demo

```text
a bounded skill enters only inside its qualified competence region,
terminates or escalates on uncertainty/OOD,
returns control to the LLM, and can be revoked or rolled back
```

This is delegated-skill and authority qualification, not general local control.

### P15 Demo

```text
a player installs or upgrades the release, selects a provider and authority mode,
runs with visible compatibility/learning controls, and can pause, take over,
inspect evidence, roll back, and recover from migration or runtime failure
```

### R1 Research Demo

```text
an isolated local policy/world-model experiment is benchmarked against
LLM-primary and local-shadow modes without changing the main product authority
```

---

## 19. Enduring One-Sentence Plan

Build a real-game Slay the Spire 2 agent where the LLM remains the primary strategic deliberator in the main product mode, the local experience shell becomes increasingly learned and environment-aware, P9 proves one reversible stable change, P10 makes that lifecycle repeatable, P11 learns context and compute/provider deliberation policy under hard caps, P12 handles environment change and revalidation, P13 validates a player beta, P14 qualifies optional delegated skills, P15 releases and operates the product, and R1 isolates optional local-autonomy research.
