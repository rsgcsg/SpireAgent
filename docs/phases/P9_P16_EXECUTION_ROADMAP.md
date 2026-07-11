# P9-P16 Execution Roadmap

> Historical roadmap retained for phase-history compatibility. It was superseded on 2026-07-11 by [P9_P15_EXECUTION_ROADMAP.md](P9_P15_EXECUTION_ROADMAP.md), [ADR-0005](../decisions/ADR-0005-phase-architecture-and-parallel-workstreams.md), and [ADR-0006](../decisions/ADR-0006-policy-influence-and-evidence-provenance.md). Do not use this file to authorize new work. In particular, its former `presentation_only` first-promotion wording is obsolete.

This file records the intermediate P9-P16 model that added authority/environment foundations and optional autonomy research. The accepted forward model keeps those foundations, restructures P9 as gates, merges deliberation context/compute, moves environment/product work earlier, and moves optional autonomy to research track R1.

Current implementation truth lives in [docs/04_CURRENT_STATUS.md](../04_CURRENT_STATUS.md).

## Invariants Across All Phases

- Main product mode is `llm_primary`: the LLM owns strategic deliberation.
- Provider mode, rollout mode, learning mode, and authority mode are separate.
- Capability and confidence do not automatically grant strategic authority.
- The hard shell remains outside LLM and learned-policy control.
- Stable change requires scoped evidence, counterexamples, versioning, review, rollback, and revalidation.
- Game/mod/adapter environment identity is part of evidence truth.
- Wildcard live remains forbidden unless separately authorized by a future rollout decision.
- Experimental local autonomy remains isolated from the main product.

## P9: Proposal-Driven Guarded Scaffold Learning

P9 proves that experience can create a low-risk, reviewable, rollback-capable stable scaffold improvement. It does not create automatic learning or transfer authority.

### P9.0-P9.4: Safety, Proposal, Evidence, And Review Foundations

Current direction:

- protected-path writes blocked by default;
- legacy finalize isolated;
- typed append-only proposals and reverse feedback;
- weak attribution and anti-vague validation;
- read-only evidence slicing and provenance exclusions;
- audit-only human review decisions.

No proposal apply or stable promotion is authorized.

### P9.5A-P9.5C: Bounded Shadow Applicator And Paired Evidence

Goal:

- compare explicit low-risk proposal overlays against the same replayable packet and provider profile;
- preserve candidate/fact invariants;
- classify provider divergence separately from policy evidence;
- collect counterexamples without changing live or stable state.

Completion requires more than a changed prompt or one clean pair. It requires scope-matched organic evidence, comparable provider profiles, counterexample review, and no candidate/fact regression.

### P9.5D: Decision Authority Foundation

Goal:

- make strategic agency auditable before learned policy can affect future decisions.

Deliverables:

- `DecisionAuthorityMode`;
- `DecisionAuthorityLevel`;
- `DecisionAuthorizationRecord`;
- `ActionExplanationRecord`;
- `ProposalBehaviorImpact`;
- future `DelegatedSkill` contract;
- replay/eval distinction between deliberation owner, selection source, authorization source, execution source, and plan origin.

Allowed:

- types, schema, recording/reporting, fixtures, compatibility reads.

Forbidden:

- changing who decides;
- granting local skill authority;
- changing live whitelist, validation, fallback, or execution;
- treating `chosenBy` as sufficient after the new record exists.

Completion:

- old transitions remain readable;
- fresh audit records can explain the authority chain;
- proposal impact is explicit;
- `authority_shaping`, `action_shaping`, and `hard_shell` proposals cannot enter an executable promotion path.

### P9.5E: Environment Identity And Evidence Scope

Goal:

- prevent promotion from mixed or stale game/mod/adapter environments.

Deliverables:

- minimal `EnvironmentFingerprint`;
- `EvidenceEnvironmentScope`;
- compatibility state: compatible/degraded/quarantined/unsupported;
- promotion-slice exclusion for unknown or mixed incompatible environments;
- environment/version dependency fields for future proposals and stable objects.

Allowed:

- read-only capture, schema, replay/eval/reporting, compatibility fixtures.

Forbidden:

- deleting historical evidence;
- guessing unknown versions;
- automatic policy migration;
- stable promotion.

Completion:

- fresh organic evidence carries a fingerprint or explicit unknown state;
- mixed environment slices cannot qualify promotion;
- console/debug/fixture and modded/unmodded provenance stay separable.

### P9.6: Narrow Stable Promotion Gate

Goal:

- promote one low-risk scaffold policy with a ledger, immutable version diff, rollback snapshot, environment scope, and regression gate.

First permitted target:

- `presentation_only` `ReasonPolicyProposal`; or
- a narrowly bounded `presentation_only` `CandidateTemplateProposal` that changes presentation without changing candidate identity/order/facts.

The first promotion is a governance proof, not proof that reason wording improved strategy. A reason detector or prettier explanation cannot satisfy promotion by itself.

Required:

- approved proposal and review history;
- completed P9.5 shadow/counterexample evidence;
- compatible environment scope;
- promotion ledger entry;
- rollback snapshot and command;
- protected-path decision;
- expiration/revalidation conditions;
- post-promotion fresh evidence plan.

Forbidden first targets:

- memory truth;
- derived strategy facts;
- scoring weights;
- classification/routing;
- budget escalation;
- skill authority;
- live authorization;
- validation or execution.

### P9.7: Mode-Aware, Environment-Aware Retrieval

Goal:

- let a promoted policy enter future scaffold construction with a complete retrieval trace.

Required trace:

- policy id/version;
- proposal/promotion ledger id;
- authority mode;
- environment compatibility decision;
- retrieval reason and scope match;
- affected packet section;
- fallback when unavailable or quarantined.

No retrieved policy may alter a protected hard-shell target.

### P9.8: End-To-End Guarded Learning Demonstration

Demonstrate:

```text
organic evidence
  -> weak attribution
  -> typed proposal
  -> review
  -> shadow/counterexample validation
  -> narrow stable promotion
  -> traced retrieval
  -> fresh evaluation
  -> successful rollback or rollback drill
```

P9 completes only when the lifecycle is explainable from one audit bundle without relying on chat history.

## P10: Continuous Evidence, Memory, And Scaffold Learning

Goal:

- make P9's guarded lifecycle repeatable across runs without weakening its gates.

Deliverables:

- proposal aggregation and deduplication;
- counterexample harvesting;
- evidence aging and environment invalidation;
- retrieval usefulness/harm metrics;
- proposal survival and rollback metrics;
- calibrated weak-attribution updates;
- conservative memory/scaffold policy families.

P10 may automate proposal generation and evidence collection. It may not automatically grant strategic authority or self-approve protected writes.

Completion:

- multiple proposal lifecycles complete with stable quality, low regression, visible rejected hypotheses, and demonstrated rollback.

## P11: Curriculum, Skill Qualification, And Delegation Governance

Goal:

- let the system propose what to practice and qualify reusable bounded skills without displacing LLM strategic ownership.

Deliverables:

- `SkillProposal` and `DelegatedSkill` lifecycle;
- skill entry/termination/invalidation/escalation contract;
- competence region and OOD detection;
- curriculum proposal and experiment queue;
- shadow/local-shadow skill evaluation;
- authority-level review and delegation ledger;
- LLM takeover and fallback tests.

Completion:

- at least one Level 1 or narrowly bounded Level 2 skill is qualified, delegated, audited, and rollback-tested;
- Level 3 strategic authority remains with the LLM in `llm_primary`.

## P12: Learned Context OS

Goal:

- replace permanent hand-authored context assembly with versioned, proposal-driven context policy.

Learnable domains:

- salience and first-impression policy;
- memory retrieval and omission policy;
- candidate future presentation;
- temporary working cache;
- panel expansion;
- compression and assembly order;
- reverse-scaffold feedback routing.

Required:

- context compilation records;
- information-preservation and retrieval-utility measures;
- environment and authority awareness;
- baseline/control modes;
- rollbackable policy versions.

P12 changes what the LLM sees. It does not change who owns the decision.

## P13: Deliberation And Compute/Budget OS

Goal:

- allocate provider, reasoning, retry, context, and evidence resources under hard caps based on measured value.

Deliverables:

- versioned deliberation/budget profiles;
- proposal-only budget changes before stable use;
- cost/latency/quality and provider-failure attribution;
- circuit breakers;
- shadow comparison and rollback;
- authority-preserving provider routing.

P13 must not:

- optimize token cost ahead of strategic fidelity;
- let the LLM approve its own spend;
- automatically escalate after cap exhaustion;
- use budget pressure to weaken CandidateFuture semantics;
- change decision authority through provider choice.

## P14: Environment Compatibility And Revalidation OS

Goal:

- make the agent robust to game, mod, adapter, schema, and fact-data changes.

Deliverables:

- startup compatibility handshake;
- environment/content/mod/adapter registry;
- dependency graph from learned objects to environment facts;
- automatic quarantine and revalidation queue;
- adapter conformance and migration fixtures;
- shadow and organic canary validation;
- compatibility-aware retrieval and skill delegation;
- degraded and unsupported product behavior.

P14 builds on P9.5E; it does not postpone the minimum P9 evidence-scope requirement.

## P15: Player Product And Provider-Neutral Runtime

Goal:

- turn the engineering runtime into an installable, understandable player product.

Deliverables:

- thin official-mod-compatible sensor/actuator packaging;
- provider-neutral adapter contract;
- local encrypted/keychain secret storage;
- observe/copilot/LLM-primary/delegated-play/review modes;
- explicit authority and learning controls;
- pause, takeover, rollback, and data deletion;
- compatibility UX;
- release, migration, and support process.

Completion is a player-installable product, not merely a CLI that works on the developer's machine.

## P16: Optional Local Policy, World Model, And Autonomy Research

Goal:

- test whether local models or distilled skills improve prediction, candidate generation, value/risk estimation, or bounded autonomy.

Research surfaces:

- local policy/value/world models;
- strategic distillation;
- learned temporal abstractions;
- architecture search;
- automatic authority-allocation experiments.

Hard isolation:

- separate mode, stores, metrics, and rollout authorization;
- no silent promotion into `llm_primary`;
- benchmark against frozen LLM, `llm_full_control`, `llm_primary`, and `local_shadow`;
- a new ADR and North Star review before any main-product authority change.

P16 is optional. Failure or deferral does not invalidate the main SpireAgent product.

## Benchmark Matrix

Starting in P9.5D, evaluation should distinguish:

- frozen LLM baseline;
- `llm_full_control` safe baseline;
- `llm_primary` main product;
- `local_shadow` recommendations;
- local-only mechanical baseline;
- `local_autonomy_experimental` research.

Compare more than win rate:

- prediction accuracy;
- risk calibration;
- legal/execution correctness;
- candidate coverage;
- retrieval usefulness/harm;
- proposal survival/counterexamples;
- skill escalation/OOD behavior;
- policy regression and rollback;
- environment compatibility;
- cost and latency under equal authority constraints.

## Immediate Next Work

1. Implement P9.5D as schema/telemetry-only work.
2. Implement P9.5E as environment/provenance schema/telemetry-only work.
3. Continue P9.5C paired/counterexample evidence under matching provider and environment scope.
4. Audit all P9.6 prerequisites.
5. Design, but do not enable, the first narrow promotion ledger and rollback snapshot.

No live expansion or stable write is required for these steps.
