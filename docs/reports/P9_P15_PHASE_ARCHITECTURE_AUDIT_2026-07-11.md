# P9-P15 Phase Architecture Audit

Date: 2026-07-11

Status: accepted architecture audit. Current implementation truth remains in [Current Status](../04_CURRENT_STATUS.md). The canonical forward route is [P9-P15 Execution Roadmap](../phases/P9_P15_EXECUTION_ROADMAP.md).

## Executive Verdict

The previous P9-P16 route contained the right capabilities but the wrong program structure.

The principal defects were:

1. P9 kept accumulating prerequisites under increasingly specific subphase names instead of exposing finite gates.
2. P11 mixed evidence scheduling, context experiments, skill qualification, and strategic delegation.
3. Context policy and compute/provider policy were split across phases despite sharing the same downstream quality evaluator and deliberation lineage.
4. Full environment compatibility and player-product feedback arrived too late.
5. Optional local-autonomy research was numbered as a main phase, making optional research look mandatory.

The accepted mainline is now:

```text
P9   Trustworthy Change Kernel
P10  Repeatable Experience Learning
P11  Learned Deliberation OS
P12  Environment Compatibility And Revalidation
P13  Player Runtime Beta
P14  Delegated Skills And Authority Qualification
P15  Product Release And Operations

R1   Optional Local Policy / World Model / Autonomy Research
     (parallel, isolated, not a maturity phase)
```

This is not a reduction in ambition. It removes duplicated phase ownership and makes every stage independently finishable.

## Audit Method

A phase is justified only if it:

- solves a distinct engineering problem;
- has explicit prerequisites and outputs;
- has a finite acceptance test;
- does not duplicate the owner of another subsystem;
- is ordered by real dependency rather than perceived sophistication;
- preserves the `llm_primary` product identity and hard shell.

The audit checked the current P9.0-P9.5C implementation, proposal/evidence stores, shadow comparison, authority and environment ADRs, budget governance, product direction, and the supplied critique.

## What The Supplied Critique Got Right

The supplied critique correctly identified:

- P9 is necessary but too large to manage as one unstructured phase;
- P10 needs finite operational acceptance rather than an endless "continuous learning" label;
- the old P11 was not a coherent phase;
- open-ended autonomous curriculum is not yet justified for this game or architecture;
- context and compute policy share a deliberation-quality loop;
- full environment compatibility must precede delegated skill authority;
- product interfaces need beta feedback before all research features are complete;
- productization must be split from production release/operations.

## What The Supplied Critique Needed Correction On

### Context and compute share a phase, not a module

P11 becomes one `Learned Deliberation OS` phase because both context and compute optimize the quality/cost of LLM deliberation. They remain separate modules and gates:

- `ContextCompiler` decides what information is presented.
- `DeliberationProfileSelector` chooses provider/reasoning/context profiles.
- `ProviderGateway` and failure-specific recovery remain operational infrastructure.
- `BudgetPolicyEvaluator` measures cost, latency, quality, and cap behavior.

Provider recovery must not become a learned context policy, and context omission must not be hidden as budget optimization.

### Product work is not strictly serial

P13 is the maturity gate for a player beta, but product interface work starts earlier as a parallel workstream. Provider adapters, pause/takeover boundaries, explanation records, packaging spikes, and secret handling should not wait for P12 completion.

### Delegated skills do not block a core product release

P14 qualifies delegated skills. P15 may release the LLM-primary product with delegated play disabled if no skill meets its gate. A release must never ship an unqualified skill merely because P14 precedes P15 numerically.

### Optional autonomy should not be P16

Local policy/value/world-model and authority-allocation research remains valuable, but it is not required to complete the LLM-centered product. It moves to isolated research track `R1` rather than a formal phase.

## Research Review

The external work supports individual mechanisms, not wholesale architecture copying:

- Voyager combines automatic curriculum, a skill library, and environment-feedback-driven program refinement in open-ended Minecraft. That supports skill lifecycle ideas, but its exploration curriculum does not establish a need for a curriculum OS in a structured deckbuilder: <https://arxiv.org/abs/2305.16291>.
- GEPA uses execution trajectories and natural-language feedback to propose and test prompt changes. This supports proposal-driven context learning, while later critical work also warns that reflective prompt optimization can follow opaque or degrading trajectories without explicit hypotheses and verification: <https://arxiv.org/abs/2507.19457>, <https://arxiv.org/abs/2603.18388>.
- MIPROv2 jointly optimizes instructions and demonstrations, supporting systematic context-policy experiments rather than permanent manual prompt editing: <https://github.com/stanfordnlp/dspy/blob/main/docs/docs/api/optimizers/MIPROv2.md>.
- FrugalGPT demonstrates learned model cascades for cost/quality tradeoffs. It supports future provider routing, but not authority transfer or automatic budget escalation: <https://arxiv.org/abs/2305.05176>.
- Option-Critic supports initiation and termination as essential parts of reusable temporal skills. SpireAgent additionally requires legality, environment scope, escalation, authority, audit, and rollback: <https://ojs.aaai.org/index.php/AAAI/article/view/10916>.

No cited method removes the need for SpireAgent's evidence, authority, environment, validation, or rollback boundaries.

## Phase Verdicts

| Previous phase | Necessity | Structural verdict | Final disposition |
| --- | --- | --- | --- |
| P9 guarded learning | essential | correct purpose, oversized execution plan | retain as four finite gates |
| P10 continuous learning | essential | independent but previously open-ended | retain with operational acceptance matrix |
| P11 curriculum/skills/delegation | partially essential | incoherent mixture | split into P10, P11, and P14 |
| P12 Context OS | core | too isolated from compute policy | merge into P11A |
| P13 Compute/Budget OS | important | not independently phase-sized | merge into P11B |
| P14 Environment OS | essential | ordered too late | move to P12 |
| P15 productization | essential | too large and too late | split into P13 beta and P15 release/ops |
| P16 autonomy research | optional | should not be mainline | move to R1 research track |

## P9: Trustworthy Change Kernel

### Why it exists

P9 changes the system from "can observe and propose" to "can safely change one low-risk soft policy and undo it." Every later learned subsystem depends on this kernel.

### Gate structure

#### P9-G1 Evidence Safety

- protected-path gate;
- legacy finalize isolation;
- typed proposal and reverse-feedback stores;
- weak attribution and anti-vague validation;
- evidence slicing and provenance exclusion;
- audit-only review ledger.

Current state: substantially implemented, with remaining protected-surface hardening debt.

#### P9-G2 Experiment Integrity

- bounded shadow overlay;
- same-packet baseline/overlay comparison;
- provider-profile comparability;
- counterexample review;
- decision-authority record;
- environment fingerprint and evidence scope;
- proposal behavior-impact classification.

Current state: active. Existing P9.5A-P9.5C map here; planned P9.5D/P9.5E become G2 work packages rather than more permanent subphase numbering.

#### P9-G3 Stable Change

- promotion ledger;
- immutable before/after diff;
- rollback snapshot and command;
- expiry and invalidation;
- environment-compatible retrieval trace;
- post-promotion regression gate.

#### P9-G4 Lifecycle Demonstration

One complete low-risk lifecycle:

```text
organic evidence -> proposal -> review -> shadow/counterexample
-> stable promotion -> traced retrieval -> fresh evaluation -> rollback drill
```

### Exit criterion

P9 ends after one independently auditable `presentation_only` lifecycle and a successful rollback drill. It does not expand to additional policy families merely to make P9 appear more intelligent.

## P10: Repeatable Experience Learning

### Why it exists

P9 proves the mechanism once. P10 proves the mechanism remains operable when evidence, proposals, policies, and environments accumulate.

### Engineering modules

- `ProposalAggregator`
- `ProposalDeduplicator`
- `CounterexampleHarvester`
- `EvidenceAgingPolicy`
- `RetrievalImpactTracker`
- `RegressionMonitor`
- `CoverageGapDetector`
- `ExperimentQueue`
- `BacklogHealthReporter`

### Curriculum decision

P10 may prioritize missing evidence, counterexamples, regressions, and environment revalidation. It does not create an open-ended autonomous curriculum or invent arbitrary learning objectives.

### Exit matrix

P10 requires, at minimum:

- three independent lifecycles across at least two proposal families and distinct scopes;
- one correctly rejected proposal;
- one proposal narrowed after counterexample evidence;
- one real rollback or formal rollback drill;
- one environment-scope expiry/invalidation case;
- measurable retrieval usefulness and harm;
- duplicate suppression and bounded backlog behavior;
- an explicit human-review load report.

This matrix proves operational variety, not statistical strategic superiority.

## P11: Learned Deliberation OS

### Why it exists

For an LLM-centered agent, learning how to present a decision and how much deliberation to allocate is one coherent optimization domain. It changes how the LLM deliberates, not who owns strategy.

### P11A Context Compiler

Modules:

- `SaliencePolicy`
- `MemoryRoutingPolicy`
- `CandidatePresentationPolicy`
- `ContextOmissionRecord`
- `CompressionPolicy`
- `PromptAssemblyLineage`
- `ContextPolicyEvaluator`

Exit:

- one rollbackable context-policy family improves a downstream decision metric or information-preservation/utility tradeoff across compatible slices without candidate/fact loss.

### P11B Compute And Provider Orchestration

Modules:

- `DeliberationProfile`
- `DeliberationProfileSelector`
- `ProviderCapabilityRegistry`
- `BudgetUseRecord`
- `BudgetPolicyEvaluator`
- `SecondOpinionPolicy`
- hard call/run/cost/time circuit breakers.

Exit:

- under a fixed authority mode and equivalent evidence slices, a rollbackable profile policy demonstrates a measured quality/cost/latency benefit without hidden context loss, provider-failure laundering, or cap escalation.

P11A precedes P11B. Existing provider recovery remains separately audited infrastructure.

## P12: Environment Compatibility And Revalidation

### Why it exists

Slay the Spire 2 remains an actively changing Early Access environment. Official updates continue to change content, balance, mod behavior, and serialization: <https://store.steampowered.com/app/2868840/Slay_the_Spire_2/>, <https://steamcommunity.com/app/2868840/allnews/>.

Minimum environment identity begins in P9-G2. P12 turns it into an operating system.

### Engineering modules

- `EnvironmentHandshake`
- `EnvironmentFingerprintStore`
- `CompatibilityRegistry`
- `LearnedObjectDependencyGraph`
- `QuarantineManager`
- `RevalidationQueue`
- `AdapterConformanceSuite`
- `CompatibilityCanaryRunner`
- compatibility-aware retrieval and skill eligibility.

### Exit criterion

A simulated or real environment change must:

- identify affected and unaffected learned objects;
- quarantine only affected objects;
- block incompatible retrieval/delegation;
- run conformance, shadow, and canary checks;
- restore compatible objects or preserve rollback/quarantine;
- leave an auditable migration record.

## P13: Player Runtime Beta

### Why it exists

The project needs non-developer feedback before research architecture hardens into unusable interfaces.

### Engineering modules

- thin mod/adapter packaging;
- provider-neutral local runtime;
- environment-variable then secure local secret setup;
- Observe, Copilot, and LLM-primary modes;
- authority/explanation/replay surface;
- pause, takeover, and emergency disable;
- compatibility status display;
- beta diagnostics and consented local data controls.

### Exit criterion

At least one non-developer can install, configure a provider, start Observe or LLM-primary, inspect the authority/explanation record, pause/take over, and recover from a documented compatibility/provider failure without repository-level intervention.

P13 does not include delegated-play authority or production-grade support commitments.

## P14: Delegated Skills And Authority Qualification

### Why it exists

Bounded local skills are valuable only after stable change, repeated evidence, environment revalidation, and player takeover controls exist.

### Engineering modules

- `SkillProposal`
- `SkillQualificationRecord`
- `CompetenceRegion`
- initiation/entry predicates;
- termination predicates;
- invalidation and OOD detection;
- `DelegationAuthorizationRecord`
- escalation and LLM takeover;
- skill versioning, retrieval, telemetry, and rollback.

### Exit criterion

- one Level 1 deterministic bounded skill;
- one narrow Level 2 delegated skill;
- both pass environment scope, entry/termination, OOD, escalation, execution matching, and rollback drills;
- no Level 3 strategic authority transfer in `llm_primary`.

Coverage-driven experiment scheduling may target skill boundaries. A general autonomous curriculum remains optional.

## P15: Product Release And Operations

### Why it exists

Beta usability is not a maintainable release. P15 owns the operational obligations required for other players to trust upgrades, data, secrets, and recovery.

### Engineering modules

- release and Workshop packaging;
- signed/versioned runtime distribution;
- keychain/encrypted secret storage;
- provider and authority controls;
- migration/version compatibility;
- backup/restore and data deletion;
- crash recovery and safe mode;
- diagnostics bundle with secret redaction;
- release channels, rollback, support, and incident runbooks.

### Exit criterion

A release candidate passes clean install, upgrade, downgrade/rollback, secret-leak, data migration, compatibility quarantine, crash recovery, and support-diagnostics tests. Delegated play ships only if P14-qualified; otherwise it remains disabled.

## R1: Optional Local Autonomy Research

R1 may explore:

- local policy/value/world models;
- strategic distillation;
- learned temporal abstractions;
- architecture search;
- automatic authority allocation.

It uses separate stores, authorization, metrics, and rollout. It is benchmarked against `llm_full_control`, `llm_primary`, `local_shadow`, and mechanical baselines. Moving any R1 authority into the main product requires a new ADR and North Star review.

## Dependency Graph

```text
P9 Trustworthy Change Kernel
  -> P10 Repeatable Experience Learning
  -> P11 Learned Deliberation OS
  -> P12 Environment Compatibility OS
  -> P13 Player Runtime Beta
  -> P14 Delegated Skills
  -> P15 Product Release And Operations
```

This is a maturity dependency, not a ban on parallel engineering.

Parallel workstreams from P9 onward:

- product interface and packaging spikes;
- environment identity capture;
- benchmark maintenance;
- provider adapter conformance;
- security, secrets, privacy, and artifact hygiene;
- documentation and migration design.

## Core, Supporting, And Optional Work

### Core cognitive/learning path

- P9, P10, P11;
- StrategicImpression, MemoryActivation, CandidateFuture, DeliberationPacket;
- proposals, evidence, weak attribution, promotion, retrieval, rollback.

### Core safety and truth path

- hard validation/execution/protected paths;
- decision authority;
- P12 environment compatibility;
- audit and rollback.

### Product path

- P13 beta and P15 release/operations;
- mod/runtime integration, provider UX, secrets, takeover, diagnostics.

### Optional capability path

- P14 delegated skills may remain disabled until qualified;
- R1 local autonomy is never required for product completion.

## Engineering Disposition

### Retain as core

- the P8 explicit-whitelist live gateway, deterministic validation/execution shell, transition recorder, replay/eval/review, and provider adapters;
- \`StrategicImpression\`, \`MemoryActivation\`, \`CandidateFuture\`, and \`DeliberationPacket\` as the LLM-facing cognitive scaffold;
- P9 typed proposals, reverse feedback, weak attribution, evidence slicing, protected paths, review ledger, and bounded shadow comparison;
- decision-authority and environment-scope foundations as mandatory evidence truth.

### Refactor only at pressure points

- replace indefinite P9.5 subphase growth with G1-G4 gates while retaining historical labels;
- add a narrow \`LiveDecisionGateway\` extraction only before stable retrieval/application would further overload the controller;
- evolve current readiness reports into distinct shadow-readiness, live-rollout, and promotion-evidence views without deleting historical data;
- migrate historical phase labels such as runtime budget deferral only through a deliberate backward-compatible schema change.

### Rewrite in purpose, not wholesale code

- old P10 "continuous learning" becomes finite repeatable operations with backlog and counterexample controls;
- old P11 autonomous curriculum becomes a bounded experiment queue;
- context and budget optimization become separate P11A/P11B policy families sharing deliberation lineage;
- player product work becomes an early parallel workstream with P13/P15 acceptance gates.

### Do not build as previously planned

- no open-ended autonomous curriculum main phase;
- no mandatory P16 autonomy phase;
- no permanent per-decision-class prompt/template pile as the learned inner shell;
- no monolithic Context/Budget module;
- no stable policy, skill, or authority promotion based on reason wording, one successful outcome, fixture evidence, or provider confidence.

### External/supporting rather than architectural core

- the game mod and STS2 adapter remain sensors/actuators;
- DeepSeek and future providers remain replaceable deliberation implementations;
- installer, UI, packaging, diagnostics, and support are product-critical workstreams but do not own strategic cognition;
- R1 local-policy research remains isolated unless a future ADR explicitly changes product authority.

## Immediate Decision

Current implementation remains in P9. The next work does not change behavior:

1. close remaining P9-G1 protected-surface debt;
2. implement P9-G2 authority-chain telemetry;
3. implement P9-G2 environment fingerprint/evidence scope;
4. collect comparable paired/counterexample shadow evidence;
5. audit G2 completion;
6. only then design P9-G3 promotion ledger, rollback snapshot, and retrieval trace.

No stable promotion, live expansion, skill delegation, budget autonomy, or product authority change is authorized by this audit.
