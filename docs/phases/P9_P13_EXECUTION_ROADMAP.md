# P9-P13 Execution Roadmap

> Historical supporting roadmap. The canonical forward phase ordering is now [P9_P16_EXECUTION_ROADMAP.md](P9_P16_EXECUTION_ROADMAP.md), which adds the decision-authority and environment-scope prerequisites before P9.6 and extends the route through productization and optional autonomy research. Keep this file for the original P9-P13 implementation detail; do not use it alone to authorize new work.

This document is the execution-oriented roadmap for P9 through P13.

It is narrower than `PROJECT_PLAN.md`.
It is not the North Star.
It exists to answer a practical engineering question:

```text
What actually has to happen next,
in what order,
with what boundaries,
so the project can move from P8/P8.5 live scaffold MVP
to real proposal-driven guarded learning?
```

Read with:

- `../../PROJECT_NORTH_STAR.md`
- `../../PROJECT_PLAN.md`
- `../../ARCHITECTURE.md`
- `../../DATA_SCHEMA.md`
- `../debt/P8_P9_DEBT_REGISTER.md`
- `P9_ENTRY_CRITERIA.md`
- `P9_GUARDED_LEARNING_PLAN.md`

## Executive Verdict

The direction in `CORE_LEARNING_ARCHITECTURE.md` is broadly correct.

The most important correct ideas are:

- explicit whitelist live is not the same thing as learning
- the hard shell must remain outside LLM authority
- the soft shell should become increasingly proposal-driven instead of permanently hand-authored
- Context OS and Budget OS should eventually become learnable inner-scaffold policy layers
- reverse feedback from the LLM back into the scaffold is necessary

But the draft becomes too aggressive if read as an immediate implementation plan.

The main corrections are:

1. `ReverseScaffoldChannel` is strategically right, but it is not a P9.1 stable-learning feature.
   In P9 it should start as telemetry and proposal seed material, not as a second-pass controller or live self-rewrite path.
2. `Context OS` is a real long-term target, but P12 should not be backported into P9 by quietly replacing current prompt assembly with a large learned compiler.
   P9-P10 should only seed the data structures and review path needed for future context-policy learning.
3. `Compute/Budget OS` is also a real long-term target, but P13 must stay downstream of guarded proposal infrastructure.
   The project should not let budget adaptation become an early hidden optimizer that changes live behavior without proposal review.
   Current fixed call caps are provider-profile defaults, not a universal long-term budget strategy.
   P9 may define budget telemetry and `BudgetPolicyProposal` schema, but it must not implement adaptive runtime budget selection.
4. The project still has unfinished P8 debt that matters to P9:
   protected-path governance is only partially landed,
   live rollout reporting is still partly split-brain,
   and the current proposal surface is still P7 evidence, not a true P9 ledger.

So the honest roadmap is:

```text
finish P8/P9 boundary hardening
-> implement typed pending proposal infrastructure
-> add weak attribution and reverse-scaffold telemetry
-> add clean evidence slicing
-> add review/shadow/stable promotion gates
-> only then scale into P10-P13
```

## What Must Be True Before P9.1

These items are still pre-P9.1 work, not optional polish.

### 1. Protected-path governance must be unambiguous

Current state:

- live/provider memory updates are blocked by default
- legacy `finalizeRun()` stable writes are blocked by default and audited

Still missing:

- a fuller protected-path model that clearly covers future derived/strategy/skill/scaffold promotions
- explicit classification of legacy finalize behavior as legacy local learning rather than normal future learning

### 2. Live-applied rollout and shadow readiness must stay separate

Current state:

- `liveAppliedRollout` now exists in replay/eval/review

Still missing:

- a clearer reader model that prevents future engineers from confusing:
  - shadow workspace readiness
  - live-applied rollout evidence
  - console/debug slices
  - stable-promotion evidence

### 3. The current proposal surface is not enough

Current `ConsolidationRecord` is useful P7 evidence.

It was not enough for P9 because it did not provide:

- proposal family typing
- weak-attribution fields
- anti-vague-proposal enforcement
- protected-path impact declaration
- audit-only review decisions
- promotion ledger linkage

Current state:

- typed proposals, weak-attribution fields, anti-vague validation, protected-path impact declarations, and audit-only review-decision ledger entries now exist
- proposal lifecycle is still not strong enough for promotion because shadow applicator, stable promotion ledger, rollback snapshots, and retrieval integration do not exist

### 4. Reverse scaffold feedback exists as typed telemetry

The idea is correct and necessary.

The codebase now has typed `ReverseScaffoldFeedback` plus an append-only run store.

It remains telemetry/proposal-seed material only. It still does not feed an automatic proposal generator or change live behavior.

### 5. Evidence slicing has started, but it is not yet promotion-grade

P9 cannot safely promote anything while evidence windows are still partly reconstructed from replay summaries and report-layer readers.

The project now has a first-class read-only `EvidenceSliceReader` surface for:

- shadow readiness
- live-applied rollout
- future stable-learning promotion slices that remain disabled
- provenance-based promotion exclusion such as console/debug/fixture and unknown evidence

What is still missing is the promotion-grade completion of that reader. It still needs to become the canonical slice authority for:

- same revision
- same budget profile
- same rollout mode
- live-applied vs shadow-only
- console/debug-assisted vs organic runtime
- counterexample windows

## Priority Order

This is the honest engineering order.

### Tier 1: Must finish before real P9.1

1. finish protected-path hardening
2. classify legacy finalize behavior
3. define typed `LearningProposal` schema
4. define typed `ReverseScaffoldFeedback` schema
5. complete `EvidenceSliceReader` into the canonical promotion-slice authority
6. define proposal lifecycle and promotion ledger

### Tier 2: P9.1-P9.3 core learning infrastructure

1. append-only pending proposal store
2. weak-attribution engine
3. reverse-scaffold telemetry capture
4. proposal-generation rules
5. review CLI / inspection path

### Tier 3: P9.4-P9.8 guarded application

1. shadow applicator
2. stable-promotion gate
3. rollback snapshots and ledger
4. retrieval integration
5. one end-to-end guarded learning demo

### Tier 4: P10-P13 expansion

1. continuous proposal loop
2. curriculum and meta-scaffold experiments
3. Context OS policy learning
4. Budget/Compute OS policy learning

## P9 Detailed Task Stack

### P9.0 Complete Hardening

Goal:

- make sure live/provider paths cannot silently become learning paths

Remaining tasks:

- extend protected-path semantics beyond live memory updates
- classify legacy finalize as legacy local learner or freeze-only path
- record protected-path decisions in a durable, reviewable way

Not allowed:

- stable learning writes
- provider-controlled strategy mutation
- budget policy mutation

### P9.1 Typed LearningProposal Schema And Store

Goal:

- replace free-form proposal evidence with an append-only, typed pending proposal family

Current state:

- typed `LearningProposal` schema and append-only `learning-proposals.jsonl` store have started
- typed `ReverseScaffoldFeedback` schema and append-only `reverse-scaffold-feedback.jsonl` telemetry have started
- audit-only `learning-proposal-review-decisions.jsonl` ledger has started
- replay/eval/review expose proposal, review-decision, and reverse-feedback surfaces
- `npm run learning:proposals` provides proposal/reverse-feedback inspection plus audit-only `approve`, `reject`, and `expire` review decisions
- anti-vague validation keeps incomplete proposals in `draft` or `rejected` rather than actionable pending review
- there is still no apply path, stable promotion, or live behavior change

Required proposal families:

- `MemoryProposal`
- `DerivedKnowledgeProposal`
- `CandidateTemplateProposal`
- `ReasonPolicyProposal`
- `BudgetPolicyProposal`
- `ClassificationPolicyProposal`
- `SkillProposal`
- `ScaffoldPolicyProposal`

Each proposal should include:

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
- `protectedPathImpact`
- `createdFromRunIds`
- `createdFromTransitionIds`
- `reviewHistory`

P9.1 must not:

- apply proposals
- mutate live behavior
- write stable memory
- change budget caps, rescue caps, thinking mode, provider retry behavior, compression, model choice, validation, or execution

Budget-specific note:

- `BudgetPolicyProposal` is schema/proposal-only in P9.1.
- It may describe affected profile parameters, expected cost/latency/quality impact, counterexamples, promotion criteria, and rollback.
- It must not approve spending or select a higher budget profile.

### P9.2 Weak Attribution And Reverse Scaffold Telemetry

Goal:

- turn replay/review evidence into cautious repair hypotheses, not fake certainty

This phase should introduce:

- `suspectedCause`
- `confidence`
- `counterexampleNeeded`
- `alternativeHypotheses`

It should also introduce a typed `ReverseScaffoldFeedback` family, but only as:

- telemetry
- proposal seed material
- replay/review evidence

Current state:

- weak-attribution proposal seed generation has started in `src/learning/proposalGenerator.ts`
- proposal seeds are generated from existing replay/review telemetry, not from a second live provider pass
- proposal generation is evidence-slice aware and excludes console/debug/fixture, human-observed, snapshot-only, and unknown-provenance transitions by default
- the CLI default is dry-run: `npm run learning:proposals -- generate --latest`
- explicit `--write` appends run-local proposal and reverse-feedback seed artifacts only
- `--include-ineligible-evidence` is debug-only inspection and does not make excluded evidence promotion-ready
- generated seeds still cannot apply, promote, change live behavior, widen budgets, rewrite prompts, or mutate stable memory/derived/strategy

Not as:

- second-pass live prompt expansion
- automatic budget escalation
- automatic scaffold rewriting

### P9.3 EvidenceSliceReader

Goal:

- make promotion evidence explicit, comparable, and reviewable

Current state:

- `EvidenceSliceReader` exists as read-only report-layer infrastructure
- proposal seed generation now uses its provenance eligibility boundary by default
- promotion remains disabled because shadow applicator, stable promotion ledger, rollback snapshots, and retrieval integration do not exist

Required slice dimensions:

- revision
- budget/governance profile
- cap/recovery profile where recorded
- rollout mode
- decision class
- live-applied vs shadow-only
- console/debug assistance
- counterexample inclusion

Budget-specific rule:

- mixed budget/profile windows can remain visible as debug evidence, but cannot silently satisfy stable-promotion evidence.
- repeated cap exhaustion under one profile should become review/proposal evidence, not automatic budget escalation.

This is the point where the project stops treating ad hoc replay summaries as sufficient promotion evidence.

### P9.4 Proposal Review CLI

Goal:

- let humans inspect, approve, reject, expire, and revert proposals

Required commands should eventually cover:

- list
- show
- approve
- reject
- expire
- revert

Approval here still does not mean stable promotion.

### P9.5 Shadow Applicator

Goal:

- let low-risk policy proposals affect shadow assembly only

Current state:

- read-only shadow overlay planning exists through `npm run learning:proposals -- plan --latest --id <proposalId>`
- P9.5A now supports an offline cloned-packet overlay comparison for explicit low-risk `reason_policy` and `candidate_template` proposals; it emits baseline/overlay prompt metadata only
- `eligibleForShadowApplication=true` means eligible for that offline comparison only. It does not enable provider calls, run-artifact writes, runtime/live behavior, proposal application, or stable promotion.
- P9.5B now provides a read-only same-slice paired-outcome evaluator. It requires matching transition/revision/budget/candidate/fact/prompt fingerprints and flags provider, output-cap, and reason-quality regressions.
- No proposal may become `shadow_validated` from P9.5A/P9.5B alone. The evaluator produces review evidence only; a real paired sample and counterexample review remain prerequisites for any future P9.6 design.

Safe first targets:

- reason policy
- candidate template presentation
- budget explanation policy
- classification hints

Unsafe early targets:

- strategy params
- validation
- execution
- live whitelist

### P9.6 Stable Promotion Gate

Goal:

- introduce a narrow path from shadow-validated proposal to stable policy

Required:

- promotion ledger
- version diff
- rollback record
- regression criteria
- protected-path impact review

### P9.7 Retrieval Integration

Goal:

- allow promoted stable policies to be retrieved and used in future scaffold construction

Critical rule:

- every use of a promoted policy must be traceable in transitions/replay

### P9.8 End-To-End Guarded Learning Demo

Goal:

- prove one full proposal lifecycle works

The first demo should be low-risk.

Recommended target:

- `ReasonPolicyProposal` or `CandidateTemplateProposal`

Not recommended as the first demo:

- strategy params
- derived knowledge mutation
- permanent classification rewrite

## P10-P13 Ordering

### P10 Continuous Learning Loop

This should begin only after one real P9 lifecycle works.

Goal:

- automate proposal candidate generation and validation loops across many runs

Expected additions:

- proposal aggregation
- counterexample harvesting
- proposal survival metrics
- regression monitoring

### P11 Autonomous Curriculum And Meta-Scaffold Optimization

Goal:

- let the system propose what to practice and which scaffold variants to compare

This is where the project can honestly begin limited curriculum design and meta-scaffold experimentation.

It is not where hard-shell authority is relaxed.

### P12 Context OS / Learned Prompt Compiler

Goal:

- make context assembly itself a learnable soft-shell policy domain

This phase should grow out of earlier proposal families, not appear as a giant prompt rewrite.

Expected policy areas:

- salience shaping
- expanded panels
- temporary working cache
- memory layering
- prompt assembly order
- compression policy

### P13 Compute/Budget OS

Goal:

- make compute allocation and budget policy proposal-driven under hard caps

This phase should not start with automatic budget escalation.

It should begin with:

- budget policy telemetry
- proposal-only budget changes
- shadow validation
- narrow stable promotion
- budget use records
- ROI digests
- rollbackable profile versions

P13 must preserve:

- hard run/cost/time caps
- provider failure classification before recovery
- protected-path bans unless separately promoted
- validation and execution safety
- human or gate approval for promoted budget behavior

P13 must not mean:

- the LLM approves its own spending
- higher budget becomes the default
- valid JSON per dollar replaces strategic fidelity
- cap exhaustion automatically increases live budget
- budget policy weakens candidate legality, validation, rollback, or stable-write protection

## What Should Change In Canonical Docs

The following docs should stay aligned with this roadmap:

- `PROJECT_PLAN.md`
- `PROJECT_AUTHORITY_GUIDE.md`
- `docs/04_CURRENT_STATUS.md`
- `docs/phases/P9_ENTRY_CRITERIA.md`
- `docs/phases/P9_GUARDED_LEARNING_PLAN.md`
- `docs/debt/P8_P9_DEBT_REGISTER.md`
- `README.md`

## Honest Current Answer

The project is ready to continue from P9.1 audit-only proposal infrastructure toward P9.2 weak attribution and proposal generation, but it is not ready for proposal application or stable learning.

The remaining blockers before any proposal can affect future decisions are:

- incomplete future promotion surface around protected-path hardening
- no shadow applicator
- no promotion-grade canonical `EvidenceSliceReader`
- no stable promotion ledger model

That is the work to do now.

Not more live expansion.
Not more per-class prompt patching.
Not more reason-detector tuning.
