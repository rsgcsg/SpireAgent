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

The project must not become either:

- a pure rules bot that replaces LLM strategic judgment; or
- an opaque LLM wrapper that cannot explain, replay, validate, or improve its decisions.

The current reality is:

- P8/P8.5 can be honestly closed only as `explicit-whitelist live scaffold MVP complete`.
- Explicit broad-whitelist live evidence exists, but wildcard live is still forbidden.
- Stable learning is not implemented.
- Proposal-driven guarded learning has not started in full engineering terms.
- The active blocker is now the gap between P9.0 hardening and real proposal-driven learning.

The next real work is not more live expansion.

The next real work is:

```text
ProtectedPathGate
+ typed LearningProposal schema/store
+ ReverseScaffoldFeedback schema
+ EvidenceSliceReader
+ weak attribution
+ minimal prompt/context/budget telemetry
```

Execution ordering note:

- `ReverseScaffoldFeedback` is strategically necessary, but it should enter P9 first as telemetry and proposal-seed material, not as an automatic live second-pass controller.
- `Context OS` and `Compute/Budget OS` are real long-term targets, but P12/P13 should not be pulled forward by quietly rewriting current prompt assembly or budget behavior during P9.
- For the execution-first ordering, read `docs/phases/P9_P13_EXECUTION_ROADMAP.md`.

The long-term maturity route is now best understood as:

```text
P0-P8.5 = build, record, evaluate, scaffold, and safely live-route the LLM
P9      = protected proposal-driven guarded learning
P10     = continuous learning loop
P11     = autonomous curriculum and meta-scaffold optimization
P12     = self-optimizing Context OS / learned Prompt Compiler
P13     = Compute/Budget OS
```

P12 and P13 are not immediate implementation work. Their schemas and telemetry may be seeded earlier, but their stable policy promotion belongs later.

---

## 1. Current Source-of-Truth Status

### 1.1 Current Phase

The active phase is:

```text
P8/P8.5 closeout + early P9.0 hardening
```

P8/P8.5 means:

```text
explicit-whitelist live scaffold MVP complete
```

It does not mean:

- wildcard live complete;
- all decision classes live-ready;
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
P9.0 hardening has not fully become a real proposal-driven learning system.
```

Specific gaps:

- protected-path gating is only partially landed;
- older shadow-first readiness semantics still coexist with live-applied rollout reporting;
- typed learning proposal schema/store has not started;
- weak attribution, anti-vague-proposal rules, and stable promotion gates are documented but not implemented.

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
- P9 proposal schema/store has not started.
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
- budget cap can be raised by LLM request;
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

The old Phase 0-10 plan remains historically useful, but the forward route should now be expressed as P0-P13.

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

- no typed P9 LearningProposal schema/store yet;
- no stable promotion;
- no full review/approve/reject/revert lifecycle;
- no proposal-to-shadow-to-stable pipeline.

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
- all decision classes live-ready;
- stable learning;
- automatic derived knowledge writes;
- strategy-param writes;
- scaffold-policy promotion;
- full proposal-driven learning;
- fully hardened protected-path governance.

Required next move:

Do not expand live. Move to P9 hardening and proposal infrastructure.

---

## 8. P9: Protected Proposal-Driven Learning

P9 is not “turn on automatic learning.”

P9 is:

```text
protected, typed, evidence-linked, rollback-capable proposal learning
```

Goal:

Turn replayable run evidence and scaffold feedback into typed pending proposals without weakening the hard shell.

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

### P9.0 Protected Path Hardening

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

### P9.1 LearningProposal Schema and Store

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

### P9.2 Reverse Feedback and Weak Attribution

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

### P9.3 EvidenceSliceReader

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

### P9.4 Review CLI

Goal:

Let humans inspect, approve, reject, expire, and revert proposals.

Acceptance:

- `list`, `show`, `reject`, `approve-for-shadow`, `expire`, and `mark-counterexample-needed` paths exist;
- approval for review is not stable application;
- review history is recorded.

### P9.5 Shadow Applicator

Goal:

Apply low-risk proposals in shadow first.

Allowed early targets:

- `ReasonPolicyProposal`
- `CandidateTemplateProposal`
- memory retrieval tags
- classification policy labels

Forbidden early targets:

- validation;
- execution;
- action legality;
- hard whitelist;
- stable memory direct writes;
- hard budget cap.

### P9.6 Stable Promotion Gate

Goal:

Allow narrow stable promotion only after evidence, shadow comparison, and rollback readiness.

Acceptance:

- promotion ledger exists;
- rollback snapshot exists;
- before/after eval exists;
- usage tracking exists;
- regression blocks promotion.

### P9.7 Retrieval / Scaffold Integration

Goal:

Let stable learned policies influence future scaffold construction in a recorded way.

Acceptance:

- transition records which learned policy was used;
- review can explain policy impact;
- rollback removes the effect.

### P9.8 End-to-End Guarded Learning Window

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

- `ReasonPolicyProposal`, or
- `CandidateTemplateProposal`

Do not start with strategy params.

---

## 9. P10: Continuous Learning Loop

Goal:

Turn P9’s manual/small proposal loop into a continuous multi-run learning loop.

P10 should include:

- automatic aggregation of similar prediction errors;
- automatic proposal candidate generation;
- automatic evidence search;
- automatic counterexample search;
- shadow apply;
- replay A/B comparison;
- semi-automatic promotion;
- rollback detection;
- skill usage tracking;
- retrieval usefulness tracking;
- scaffold policy impact tracking;
- cross-run generalization;
- proposal survival metrics;
- regression alerts.

P10 should not mean full unsupervised self-modification.

The human role changes from:

```text
writing rules
```

to:

```text
auditing learning system behavior
```

P10 demo:

```text
multi-run evidence
  -> proposal candidates
  -> counterexample search
  -> shadow compare
  -> semi-automatic promote
  -> rollback if regression
```

---

## 10. P11: Autonomous Curriculum and Meta-Scaffold Optimization

Goal:

Let the agent decide what it should study and which soft-scaffold policies need experiments.

P11 should include:

- autonomous curriculum;
- multi-policy experiments;
- scaffold ablation;
- memory policy ablation;
- candidate template ablation;
- prompt assembly ablation;
- budget policy ablation;
- cross-run generalization;
- cross-archetype generalization;
- meta-scaffold policy proposals.

The agent should be able to propose:

- next scenario families to train;
- skills that may be invalid;
- memory policies to A/B test;
- candidate templates that may overfit;
- context panels worth adding;
- budget profiles that may waste compute;
- lessons that do not transfer across character/deck/boss contexts.

P11 must still preserve:

- hard shell;
- evidence requirements;
- rollback;
- human/guarded review for promotion.

P11 demo:

```text
agent identifies a weakness
  -> proposes curriculum
  -> proposes scaffold experiments
  -> runs A/B or replay comparisons
  -> recommends policy changes with evidence
```

---

## 11. P12: Self-Optimizing Context OS / Learned Prompt Compiler

Goal:

Let the agent optimize what it sees, expands, compresses, caches, retrieves, orders, and uploads to the LLM.

P12 is not about learning more game slogans.

P12 is about learning how the agent should be fed information.

P12 should include:

- Context OS audit;
- PromptAssemblyPolicy schema;
- Temporary Working Cache;
- Multi-layer Memory Routing;
- Expand-and-Recompress Loop;
- Learned Context Budget Allocation;
- Context Ablation;
- Prompt Assembly Lineage;
- Context Exclusion Records;
- Prompt Compiler Promotion;
- End-to-end Context OS demo.

P12 must not:

- bypass hard budget cap;
- let LLM directly rewrite PromptCompiler;
- turn context expansion into raw-state dumping;
- treat longer prompt as automatic improvement;
- promote context policy without ROI and rollback.

P12 required records:

- `PromptAssemblyRecord`
- `ContextExclusionRecord`
- `MemoryExclusionRecord`
- `CandidateFamilyExclusionRecord`

P12 demo:

```text
agent requests expanded context in a key decision
  -> system records whether expansion helped
  -> evidence becomes a context policy proposal
  -> shadow comparison validates it
  -> future prompt/context policy changes in a rollbackable way
```

---

## 12. P13: Compute/Budget OS

Goal:

Let the agent optimize compute allocation under a hard budget cap.

P13 should answer:

- when to use `low`;
- when to use `medium`;
- when to use `high`;
- when to use `research`;
- how to spend a fixed dollar/token budget;
- how to reserve compute for boss/shop/card_reward/high-risk decisions;
- how to measure whether more compute improved decisions;
- how to avoid “more tokens but no improvement.”

P13 should include:

- Budget OS audit;
- `BudgetUseRecord`;
- `BudgetROIDigest`;
- budget request approval policy;
- denied request outcome tracking;
- false high-risk request tracking;
- reasoning profile A/B;
- context expansion ROI;
- critique budget ROI;
- learning compute ROI;
- BudgetPolicyPromotion.

P13 must not:

- let LLM approve its own spending;
- let agent exceed spending cap;
- make high budget the default;
- treat pretty reasons as ROI;
- ignore denied request outcomes.

P13 demo:

```text
user gives 1 USD / 5 USD / fixed token budget
  -> agent dynamically allocates low/medium/high/research profiles
  -> system records cost and outcome
  -> ROI review shows where compute helped or wasted
  -> future budget policy improves under hard cap
```

---

## 13. Cross-Phase Performance Baselines

Engineering correctness is necessary but not sufficient.

Starting from P6 and continuing through P13, each phase should preserve or improve performance baselines.

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
- unknown prediction rate
- unsupported prediction rate
- potion use
- route/reward quality proxy
- proposal survival rate
- rollback frequency
- retrieval usefulness
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
- protected-path stable-write governance is only partially hardened;
- replay/eval/review can surface proposal evidence, but do not yet drive a real promotion pipeline.

P9 gaps:

- `ProtectedPathGate` is not fully finished;
- typed `LearningProposal` schema/store has not started;
- `ReverseScaffoldFeedback` is not yet a durable transition surface;
- `EvidenceSliceReader` is not implemented;
- weak attribution exists in plan, not as a complete system;
- review CLI for typed proposals is not implemented;
- shadow applicator and stable promotion gate are not implemented.

P10 gaps:

- no continuous proposal aggregation loop;
- no automatic evidence/counterexample search;
- no proposal survival metrics;
- no cross-run learning report.

P11 gaps:

- no autonomous curriculum engine;
- no scaffold policy experiment manager;
- no ablation framework for memory/candidate/prompt/budget policies.

P12 gaps:

- no Context OS as a promoted system;
- no PromptAssemblyRecord as a first-class audit record;
- no context exclusion records;
- no expand-and-recompress loop;
- no context ROI dashboard.

P13 gaps:

- no Budget OS as a promoted system;
- no BudgetUseRecord or BudgetROIDigest;
- no denied request outcome tracking;
- no reasoning profile A/B.

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

1. Finish `ProtectedPathGate`.
2. Treat remaining legacy stable-write paths as gated legacy behavior, not normal learning.
3. Keep live-applied rollout audit separate from stale shadow-only readiness semantics.
4. Add typed `LearningProposal` schema/store.
5. Add `ReverseScaffoldFeedback` schema to transition/review surfaces.
6. Add `EvidenceSliceReader`.
7. Add weak attribution fields.
8. Add minimal `PromptAssemblyRecord`.
9. Add minimal `BudgetUseRecord`.
10. Keep all new feedback non-mutating.
11. Use replay/review to produce draft proposals.
12. Shadow-validate a low-risk `ReasonPolicyProposal` or `CandidateTemplateProposal`.
13. Only then consider stable promotion.

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
- The final product is not a rule engine.

---

## 18. Demonstration Milestones

### P8.5 Demo

```text
LLM safely plays through explicit whitelist live scaffold.
```

This is an engineering safety demo, not a learning demo.

### P9.8 Demo

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
multi-run continuous learning loop
  -> repeated errors aggregate
  -> proposals are generated
  -> evidence and counterexamples are found
  -> shadow compare runs
  -> semi-automatic promotion and rollback alerts exist
```

This is the first mature learning-system demo.

### P11 Demo

```text
agent proposes its own curriculum and scaffold experiments.
```

This is a meta-learning / research-style demo.

### P12 Demo

```text
agent requests expanded context in a key situation and turns that evidence into a future prompt/context policy.
```

This is a self-optimizing Context OS demo.

### P13 Demo

```text
user provides a fixed dollar/token budget and the agent allocates low/medium/high/research compute with ROI evidence.
```

This is a self-optimizing Compute/Budget OS demo.

---

## 19. Enduring One-Sentence Plan

Build a real-game Slay the Spire 2 LLM agent where the LLM remains the core strategic player, the local system acts as a predictive cognitive scaffold, P8/P8.5 establishes safe explicit-whitelist live execution, P9 turns replayable evidence into guarded proposals, P10 makes that learning loop continuous, P11 lets the agent design curriculum and scaffold experiments, P12 makes context assembly learnable, and P13 makes compute allocation learnable under hard budget caps.
