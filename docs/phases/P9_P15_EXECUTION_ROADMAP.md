# P9-P15 Execution Roadmap

This is the canonical forward execution roadmap after the 2026-07-11 phase-architecture audit.

It implements [ADR-0005](../decisions/ADR-0005-phase-architecture-and-parallel-workstreams.md). Current implementation truth remains in [Current Status](../04_CURRENT_STATUS.md).

This roadmap does not authorize stable promotion, live expansion, skill delegation, or budget autonomy.

## Mainline

```text
P9   Trustworthy Change Kernel
P10  Repeatable Experience Learning
P11  Learned Deliberation OS
P12  Environment Compatibility And Revalidation
P13  Player Runtime Beta
P14  Delegated Skills And Authority Qualification
P15  Product Release And Operations
```

Optional local-autonomy work is research track `R1`, not a phase.

## Permanent Invariants

- Main product mode remains `llm_primary`.
- Capability, confidence, provider, rollout, learning, and strategic authority remain separate.
- Validation, execution legality, live authorization, protected paths, promotion authority, and rollback stay in the hard shell.
- All stable changes require evidence, counterexamples, versioning, environment scope, review, and rollback.
- A successful outcome is evidence, not exact causal proof.
- `full` remains the P8 control group.
- Wildcard live is not implied by any learning or product phase.
- Runtime artifacts, secrets, and mutable learning stores remain local-only unless a release policy explicitly defines otherwise.

## Historical Mapping

| Historical label | Forward owner |
| --- | --- |
| P9.0-P9.4 | P9-G1 Evidence Safety |
| P9.5A-P9.5C | P9-G2 Experiment Integrity |
| P9.5D authority foundation | P9-G2 work package |
| P9.5E environment scope | P9-G2 work package |
| P9.6-P9.7 | P9-G3 Stable Change |
| P9.8 | P9-G4 Lifecycle Demonstration |
| old P10 | P10 Repeatable Experience Learning |
| old P11 curriculum/experiment scheduling | P10 bounded coverage scheduler |
| old P11 prompt/memory/candidate ablation | P11A Context Compiler |
| old P11 skill/delegation | P14 Delegated Skills |
| old P12 Context OS | P11A Context Compiler |
| old P13 Compute/Budget OS | P11B Compute And Provider Orchestration |
| old P14 Environment OS | P12 Environment Compatibility |
| old P15 productization | P13 beta + P15 release/operations |
| old P16 autonomy | R1 optional research |

Historical labels in existing telemetry remain backward-compatible metadata until a deliberate schema migration.

## P9: Trustworthy Change Kernel

### Objective

Prove that one low-risk soft-shell policy can move from organic evidence to stable use and back to baseline through a complete, independently auditable lifecycle.

### P9-G1 Evidence Safety

Work packages:

- `ProtectedPathGate`
- legacy finalize isolation
- typed `LearningProposal` and `ReverseScaffoldFeedback`
- anti-vague proposal validation
- weak attribution
- `EvidenceSliceReader`
- provenance exclusion
- append-only review-decision ledger

Allowed:

- schema, stores, read-only reports, audit decisions, tests.

Forbidden:

- proposal apply;
- stable write;
- live/provider-controlled mutation;
- exact-causality claims.

Gate evidence:

- protected writes are blocked/audited;
- old records remain readable;
- excluded evidence remains visible but cannot qualify promotion;
- vague proposals remain draft/rejected.

### P9-G2 Experiment Integrity

Work packages:

- `SelectionResolutionRecord` and conservative historical proposal/final mismatch exclusion;
- one shared structured evidence-role classifier for replay, proposal generation, and manifests;
- source-resolved evidence references, non-empty protected-target validation, and one final overlay eligibility decision;
- bounded shadow overlay planning;
- cloned-packet baseline/overlay assembly;
- same-slice provider comparison with a non-secret provider experiment fingerprint;
- candidate/fact/prompt/profile invariants;
- counterexample review;
- `DecisionAuthorizationRecord` and `ProposalBehaviorImpact`;
- `EnvironmentFingerprint` and evidence environment scope;
- manifest integrity diagnostics plus exact P9 identity applicability;
- experiment manifest tying proposal, evidence, provider, authority, and environment together.

Allowed:

- offline/shadow provider calls under explicit caps;
- audit-only authority/environment telemetry;
- comparable-pair and counterexample reports.

Forbidden:

- live effect;
- proposal status mutation from one pair;
- stable policy write;
- guessing unknown environment identity;
- treating reason-detector improvement as strategic proof.

Gate evidence:

- fresh final selection provenance distinguishes LLM proposal, local override, fallback, and executed candidate; historical mismatches are excluded from LLM-selection claims;
- all G2 surfaces derive the same role/eligibility result from source-resolved records;
- a pair has complete named provider experiment and exact-identity facts, or is explicitly incomplete;
- more than one comparable organic pair where the target scope applies, when a real hypothesis survives integrity repair;
- at least one out-of-scope or counterexample case correctly refuses/narrows the overlay;
- provider/recovery divergence is separated from policy evidence;
- authority fields and environment identity are complete enough for review; P9 makes no compatibility-range claim before P12;
- no candidate/fact/validation regression.

### P9-G3 Trustworthy Change Kernel

G3 is split by ADR-0007. G3-A can build disabled append-only lifecycle records, exact-scope dry-run retrieval, quarantine diagnostics, and rollback simulation without a policy candidate. G3-B qualification remains blocked on natural repeated, counterexample-reviewed evidence. G3-C activation/canary/promotion remains forbidden until G3-B passes.

Work packages:

- G3-A disabled append-only lifecycle artifact/event records and simulation-only rollback snapshot;
- G3-B candidate qualification record and immutable before/after diff design;
- G3-C promotion ledger plus executable rollback command only after qualification;
- promotion criteria evaluator;
- expiry/invalidation/revalidation record;
- G3-A mode- and environment-aware dry-run retrieval trace; active retrieval only in G3-C;
- regression and emergency-disable path.

First allowed target:

- a narrow, human-approved `deliberation_shaping` context policy that preserves facts, legal candidate ids, candidate order, validation, execution, authority, and protected-path boundaries.

`presentation_only` means post-decision display/observability only. It is not a meaningful first learned policy. A pre-decision reason or CandidateFuture presentation policy can influence selection and must not be relabeled as decision-neutral.

Forbidden first targets:

- memory truth or derived facts;
- scoring weights;
- candidate generation;
- classification/routing;
- budget escalation;
- skill authority;
- validation/execution/live authorization.

Gate evidence:

- promotion and rollback are both reproducible from the ledger;
- exact P9 identity mismatch, later incompatible environment, expired scope, or corrupt learned artifact blocks retrieval;
- transition/replay records policy use and fallback;
- no protected-path bypass exists.

### P9-G4 Lifecycle Demonstration

Required demonstration:

```text
organic transition
  -> weak attribution
  -> typed proposal
  -> counterexample-aware review
  -> bounded shadow comparison
  -> guarded promotion
  -> traced retrieval
  -> fresh compatible evaluation
  -> rollback drill
```

### P9 Exit

P9 is complete after the G4 audit bundle is accepted. It is not extended to more policy families merely to accumulate features.

Human approval is required for the first stable promotion and rollback drill.

## P10: Repeatable Experience Learning

### Objective

Demonstrate that the P9 lifecycle remains bounded, interpretable, and useful across multiple runs and proposal types.

### Work Packages

#### P10-A: Change semantics and integrity

- canonical policy semantic key and typed patch canonicalization;
- immutable event lifecycle/projector, idempotency, artifact digests, and corruption quarantine;
- conflict, supersession, scope lattice, expiry, and policy invalidation semantics;
- `AuthorityPolicy` evidence-eligibility contract without authority transfer;
- legacy-store digest/invalidation boundary.

#### P10-B: Proposal and evidence operations

- `ProposalAggregator`
- `ProposalDeduplicator`
- backlog age, size, and review-load metrics
- `CounterexampleHarvester`
- `EvidenceAgingPolicy`
- scope/environment invalidation
- repeated-evidence and contradiction tracking

#### P10-C: Policy impact and evaluation

- `RetrievalImpactTracker`
- usefulness/harm attribution
- regression monitor
- rollback recommendation
- matched-slice consistency, prediction/forecast calibration, candidate coverage, and bounded organic canary metrics;
- reason-quality signals retained as warnings only.

#### P10-D: Bounded experiment scheduling and candidate challenge telemetry

- `CoverageGapDetector`
- `ExperimentQueue`
- counterexample and regression-test selection
- environment revalidation priority
- non-executable `CandidateChallengeRecord` for reject-all/missing-candidate observations; no replan or invented action path yet.

This scheduler prioritizes defined evidence gaps. It is not an autonomous curriculum or arbitrary task generator.

### Forbidden

- automatic self-approval;
- automatic Level 3 authority transfer;
- unbounded proposal generation;
- fixture/debug evidence used as organic proof;
- optimization to reason wording alone.

### Verification

- replay/eval/review report backlog, dedupe, contradictions, impact, and rollback;
- deterministic fixtures cover proposal conflict, expiry, and environment invalidation;
- controlled matched slices validate mechanism while organic windows validate bounded retrieval impact;
- review workload is measured.

### P10 Exit Matrix

- three independent lifecycles;
- at least two proposal families and distinct scopes;
- one proposal rejected;
- one proposal narrowed after counterexamples;
- one rollback or formal rollback drill;
- one environment invalidation/expiry case;
- retrieval usefulness and harm both observable;
- duplicate proposals suppressed;
- backlog and review load remain within documented limits;
- event projection, source provenance, and learned-store corruption are auditable and fail closed;
- no metric or scheduler has become an automatic strategy or authority mechanism.

Human approval remains required for protected stable targets. Automation may prepare evidence, not approve itself.

## P11: Learned Deliberation OS

### Objective

Learn how the LLM should be informed and how much deliberation resource it should receive, under fixed strategic authority and hard caps.

### P11A Context Compiler

Modules:

- `SaliencePolicy`
- `MemoryRoutingPolicy`
- `CandidatePresentationPolicy`
- `ContextOmissionRecord`
- `CompressionPolicy`
- `PromptAssemblyLineage`
- `ContextPolicyEvaluator`

Learning targets:

- salience;
- memory inclusion/omission;
- CandidateFuture presentation;
- context panel expansion;
- compression and assembly order;
- reverse-scaffold feedback response.

Hard boundaries:

- no raw-state dump as a learned shortcut;
- no candidate/fact loss hidden as compression success;
- no authority or validation change;
- `full` control remains comparable.

P11A exit:

- one rollbackable context policy demonstrates downstream utility or information-preservation improvement across compatible slices without candidate/fact regression.

### P11B Compute And Provider Orchestration

Modules:

- `DeliberationProfile`
- `DeliberationProfileSelector`
- `ProviderCapabilityRegistry`
- `BudgetUseRecord`
- `BudgetPolicyEvaluator`
- `SecondOpinionPolicy`
- circuit breakers and hard caps.

Learning targets:

- provider/profile selection;
- reasoning and context budget;
- second opinion or critique allocation;
- latency/cost/quality tradeoffs.

Infrastructure that stays separate:

- provider adapter contract;
- failure classifier;
- failure-specific recovery;
- semantic validation;
- hard cost/time/call caps.

P11B exit:

- under fixed authority and comparable evidence, one rollbackable deliberation profile improves measured quality/cost/latency without context loss, provider-failure laundering, or automatic cap escalation.

### P11 Exit

- P11A complete before P11B promotion;
- context and compute policies have separate ids, ledgers, and rollbacks;
- combined deliberation lineage explains both;
- provider/profile selection never changes authority mode.

## P12: Environment Compatibility And Revalidation

### Objective

Make learned memory, policies, and future skills safe across game, mod, adapter, fact-data, and schema changes.

### Work Packages

- `EnvironmentHandshake`
- `EnvironmentFingerprintStore`
- `CompatibilityRegistry`
- `LearnedObjectDependencyGraph`
- `QuarantineManager`
- `RevalidationQueue`
- `AdapterConformanceSuite`
- `CompatibilityCanaryRunner`
- compatibility-aware retrieval and delegation eligibility
- migration and rollback records

### Compatibility States

- compatible
- degraded
- quarantined
- unsupported

### Forbidden

- guessing version identity;
- treating one successful action as compatibility proof;
- deleting historical evidence instead of scoping it;
- allowing quarantined policies/skills to execute;
- using provider identity as game-environment identity.

### Verification

- simulated build/content/mod/adapter changes;
- dependency-impact fixtures;
- partial quarantine tests;
- conformance and canary tests;
- retrieval and delegation refusal tests;
- migration rollback drill.

### P12 Exit

One environment-change scenario identifies affected objects, preserves unaffected objects, quarantines incompatible objects, revalidates safely, and records restore/rollback decisions.

## P13: Player Runtime Beta

### Objective

Expose the safe LLM-primary product to non-developer users early enough to validate installation, provider, authority, explanation, and takeover interfaces.

The [productization architecture audit](../product/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md)
defines a cross-cutting `PROD-*` engineering workstream. It does not replace
this phase sequence: PROD-0/1 are connector/product safety prerequisites,
PROD-2/3/4 may seed the interface and packaging foundation, and PROD-5 is the
execution of this beta gate. None may claim P13 before the verification and exit
conditions below pass, and they must consume P12 compatibility/quarantine truth.

### Work Packages

- thin game mod/adapter package;
- local runtime installer/launcher;
- provider-neutral decision adapter;
- local secret setup and redaction;
- Observe, Copilot, and LLM-primary modes;
- authority/explanation/replay view;
- pause, takeover, emergency disable;
- compatibility status;
- local data inspection/deletion controls;
- beta diagnostics.

### Forbidden

- delegated skill authority;
- broad local autonomy;
- unreviewed stable learning;
- secrets in mod, logs, replay, or Git;
- hiding degraded compatibility.

### Verification

- clean install on a non-development profile;
- provider setup without source edits;
- Observe and LLM-primary smoke;
- pause/takeover/emergency-disable drill;
- provider outage and incompatible-environment behavior;
- secret/artifact scan;
- usability observation with at least one non-developer.

### P13 Exit

A non-developer can install, configure, run, inspect, pause/take over, and recover from a documented failure without repository-level intervention.

Product interface and packaging spikes may run in parallel from P9, but beta status is not claimed until this gate passes.

## P14: Delegated Skills And Authority Qualification

### Objective

Safely delegate proven local subproblems while preserving LLM strategic ownership.

### Work Packages

- `SkillProposal`
- `SkillQualificationRecord`
- `CompetenceRegion`
- entry/initiation predicates
- termination predicates
- invalidation/OOD detection
- `DelegationAuthorizationRecord`
- escalation and LLM takeover
- skill versioning/retrieval
- execution matching and rollback

### Authority Limits

- Level 0 mechanical execution remains hard-shell operation.
- Level 1 deterministic bounded skills require proof and conformance.
- Level 2 delegated skills require empirical qualification, OOD, escalation, and rollback.
- Level 3 long-horizon strategy remains LLM-owned in `llm_primary`.

### Forbidden

- confidence-only delegation;
- delegation outside environment scope;
- silent skill expansion;
- local scoring treated as strategic proof;
- automatic authority promotion.

### Verification

- entry/termination boundary fixtures;
- OOD and invalidation tests;
- environment quarantine tests;
- execution mismatch and emergency takeover;
- local-shadow versus delegated comparison;
- rollback drill.

### P14 Exit

One Level 1 and one narrow Level 2 skill complete qualification, bounded delegation, OOD escalation, execution matching, environment revalidation, and rollback.

P14 is not required to enable unqualified delegated features in P15. Features that do not pass remain disabled.

## P15: Product Release And Operations

### Objective

Turn the player beta into a maintainable, upgradeable, supportable release.

The `PROD-*` workstream supplies implementation and evidence inputs; P15 remains
the sole release/operations acceptance gate. SDK, plugin, or Headless progress
cannot substitute for the operational matrix below.

### Work Packages

- release/Workshop packaging;
- signed and versioned runtime distribution;
- keychain/encrypted secret storage;
- provider, authority, and learning controls;
- schema/data/policy migrations;
- backup/restore and data deletion;
- crash recovery and safe mode;
- redacted diagnostics bundle;
- release channels and rollback;
- incident, compatibility, and support runbooks;
- privacy and retention policy.

### Verification

- clean install and uninstall;
- upgrade and downgrade/rollback;
- schema/data migration;
- backup/restore;
- compatibility quarantine;
- crash recovery/safe mode;
- secret leakage scan;
- diagnostics redaction;
- release rollback drill.

### P15 Exit

A release candidate passes the operational matrix and can be supported without repository-internal knowledge. Delegated play ships only for P14-qualified skills; otherwise it remains disabled.

## R1: Optional Local Autonomy Research

R1 may investigate:

- local policy/value/world models;
- strategic distillation;
- learned temporal abstractions;
- architecture search;
- automatic authority allocation.

R1 requirements:

- separate mode, stores, authorization, and metrics;
- no silent use in `llm_primary`;
- benchmark against frozen LLM, `llm_full_control`, `llm_primary`, `local_shadow`, and mechanical baselines;
- new ADR and North Star review before any main-product authority change.

R1 is never a prerequisite for P15.

## Cross-Phase Workstreams

These are continuous workstreams, not phases:

### Security and protected paths

- API keys and redaction;
- stable-write protection;
- artifact hygiene;
- dependency and supply-chain review.

### Environment identity

- minimum fingerprint starts in P9-G2;
- full compatibility/revalidation matures in P12.

### Product interface

- provider/authority/explanation/pause contracts may prototype from P9;
- P13 is the beta acceptance gate.

### Benchmarks

- frozen LLM;
- `llm_full_control`;
- `llm_primary`;
- `local_shadow`;
- mechanical/local baseline;
- optional R1 mode.

### Documentation and migration

- canonical status and roadmap;
- ADRs;
- schema compatibility;
- operator runbooks;
- historical redirects.

## Immediate Work

Current milestone maps to `P9-G2 Experiment Integrity`.

Next sequence:

1. close remaining G1 protected-surface gaps;
2. collect fresh explicit-authority and complete-environment records across relevant paths;
3. collect comparable organic paired/counterexample evidence under matching provider and environment scope;
4. verify console/debug exclusion and old-record `not_recorded` reporting;
5. produce a G2 audit;
6. only then design G3 ledger, rollback, and retrieval.

Stable promotion remains disabled until G2 passes and the first G3 change receives explicit human approval.
