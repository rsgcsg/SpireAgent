# P9 Guarded Learning Plan

P9 is not "turn on automatic learning".

P9 is the phase where the project turns replayable evidence into typed, guarded, proposal-driven inner-scaffold changes while keeping the outer safety shell fixed.

P9 improves the experience shell. It does not automatically transfer strategic authority. The durable authority boundary is defined by `docs/decisions/ADR-0003-strategic-authority-and-experience-shell.md`; environment-scoped evidence is defined by `docs/decisions/ADR-0004-environment-scoped-evidence-and-knowledge.md`; finite gate ownership is defined by `docs/decisions/ADR-0005-phase-architecture-and-parallel-workstreams.md`.

Forward execution uses P9-G1 through P9-G4. Historical P9.0-P9.5E labels remain implementation-history aliases: P9.0-P9.4 map to G1, P9.5A-P9.5E map to G2, P9.6-P9.7 map to G3, and P9.8 maps to G4.

## Definition

P9 should be understood as:

```text
proposal-driven guarded learning
```

The outer shell stays hard:

- candidate legality
- semantic validation
- execution safety
- live authorization
- rollback authority
- stable-write protection
- fact / memory / derived separation

The inner scaffold becomes gradually learnable:

- memory content
- memory retrieval tags and compression
- first-impression shaping
- candidate templates
- reason contract
- budget/compression policy
- decision classification policy
- scaffold policy and future skill policy

Long-term direction:

```text
the soft shell should gradually almost disappear
```

That does not mean the hard shell disappears.

It means humans should not permanently hand-author separate combat/shop/card_reward/event soft frameworks forever. Over time, the LLM should be able to propose, validate, revise, and improve:

- memory structure and retrieval
- first-impression structure
- candidate templates
- review style
- scoring/scaffold heuristics
- classification/routing structure
- skills
- scaffold policies

under the fixed outer shell of validation, execution safety, rollback, protected-path governance, and fact/memory/derived separation.

The experience shell becoming less hand-authored does not mean it becomes the unrestricted strategic principal. In `llm_primary`, Level 3 long-horizon and irreversible strategic deliberation remains LLM-owned. Learned local skills require explicit qualification and delegation governance.

## P9-G2 Foundations Before Stable Change

The July 2026 architecture audits add prerequisites before stable promotion design. [ADR-0006](../decisions/ADR-0006-policy-influence-and-evidence-provenance.md) is binding for the corrections below.

### Selection truth and policy-impact prerequisite

G2.1 and G2.2 now provide the required truthful telemetry, but this implementation is not G3 evidence:

- fresh executor-logged transitions emit `SelectionResolutionRecord`, preserving the proposed and final candidate/source plus any guard transformation;
- a shared source-resolved evidence-role classifier reports additive workspace, selection, execution, provenance, and eligibility facts instead of competing precedence labels;
- pre-decision `reason_policy` is classified as `deliberation_shaping`, not `presentation_only`.

Raw historical transitions remain immutable. A detected proposal/final mismatch is a conservative derived exclusion from LLM-final-selection evidence, and old `chosenBy`-only records remain `not_recorded`. G3 still requires fresh natural same-scope evidence under these contracts.

`presentation_only` is reserved for post-decision display/observability changes with no possible decision influence. It is not a meaningful first stable policy. Any prompt/workspace/context guidance applied before the LLM decides is `deliberation_shaping`, even when an offline clone currently leaves runtime unchanged.

### Authority prerequisite

Implemented audit-only telemetry now records:

- deliberation owner;
- selection source;
- authorization source;
- execution source;
- plan origin;
- decision authority mode and level;
- delegated skill identity;
- proposal behavior impact.

This work must not change current routing, provider use, live authorization, fallback, validation, or execution.

### Environment prerequisite

Implemented read-only environment identity now records, when explicitly supplied:

- game build/channel;
- content/mod set;
- adapter identity and capabilities;
- fact snapshot and agent revision;
- organic/console/debug/fixture provenance;
- an environment compatibility-state field, emitted as `unknown` before P12 owns compatibility evaluation.

Unknown or mixed incompatible environments must not qualify stable promotion. Historical evidence remains readable, but records without first-class scope are promotion-excluded. Pre-P12 compatibility remains `unknown`; a successful action cannot change it.

## Target Proposal Families

- `MemoryProposal`
- `DerivedKnowledgeProposal`
- `CandidateTemplateProposal`
- `ReasonPolicyProposal`
- `BudgetCompressionPolicyProposal`
- `ClassificationPolicyProposal`
- `SkillProposal`
- `ScaffoldPolicyProposal`

`ReverseScaffoldFeedback` is adjacent but not identical to a proposal family.

It should begin as:

- telemetry
- replay/review evidence
- proposal seed material

It should not begin as:

- a second-pass live controller
- automatic prompt expansion
- automatic budget escalation
- direct stable policy mutation

Budget-specific rule:

- `BudgetCompressionPolicyProposal` can exist in P9 as schema, telemetry, and proposal evidence.
- It must not change runtime caps, rescue caps, thinking mode, model choice, retry behavior, compression behavior, validation, execution, or live rollout.
- Learned compute/provider orchestration belongs to P11B after shadow validation, promotion gates, rollback, and P11A context-policy baselines exist. Current telemetry that says `P13` is a historical phase label.

Each proposal must include at least:

- scope
- target layer
- proposed patch
- supporting evidence
- counterexamples
- confidence
- risk
- promotion criteria
- rollback plan
- current behavior-impact label and, before G3, explicit mutation surface plus possible decision influence (`post_decision_display`, prompt/workspace context, candidate content/generation, routing/authority, execution, or hard shell). `unclassified` records are non-actionable.
- environment scope and invalidation conditions

## Minimal Data Model

The durable learning flow should look like:

```text
transition/replay/review signal
  -> PredictionErrorAttributor
  -> LearningProposalEngine
  -> pending proposal store
  -> EvidenceSliceReader
  -> decision-authority and environment-scope review
  -> human review / guarded gate
  -> shadow applicator
  -> replay/eval/fresh validation
  -> stable promotion ledger
  -> rollback if regression
```

## Evidence Tier Rule

P9 uses complementary evidence tiers rather than pretending every artifact proves the same thing:

- organic discovery proves a pattern occurs in runtime distribution;
- reproducible fixture proves code/adapter behavior, not frequency or strategic prevalence;
- controlled shadow comparison tests a bounded mechanism under matched conditions;
- organic canary checks a scoped change for immediate regression.

Console/debug/fixture artifacts remain visible but cannot independently satisfy organic discovery or organic canary requirements. A clean pair is evidence for review, not proof of exact causality or promotion authorization.

## Required Components

### `ProtectedPathGate`

Purpose:

- stop live/provider-originated writes to protected paths
- separate live rollout from learning promotion

### `EvidenceSliceReader`

Purpose:

- define clean evidence windows
- exclude mixed revision/budget windows when needed
- exclude console fixture/debug evidence from stable promotion
- expose a read-only focused filter for decision class, revision, budget, environment fingerprint, authority mode, provenance, and shadow-call state; a selected slice must retain its filters and transition IDs for audit

### `PredictionErrorAttributor`

Purpose:

- map replay/review failures to likely repair layers
- keep provider failure, candidate-future weakness, reason omission, and budget issues separable
- start with weak attribution instead of pretending to know exact causality

### `LearningProposalEngine`

Purpose:

- turn repeated evidence into typed pending proposals
- avoid direct mutation
- reject vague advice that cannot be tied to evidence, scope, risk, and validation

### `ReverseScaffoldFeedback`

Purpose:

- let the LLM report that the scaffold itself omitted information, candidates, memory, compression, classification, or budget framing
- capture this as telemetry and proposal-seed material
- avoid turning ad hoc human patching into the default repair loop

### `LearningProposalReviewDecisionLedger`

Purpose:

- record human/system review decisions as append-only audit events
- support `approve`, `reject`, and `expire` as review judgments only
- preserve proposal status/actionability snapshots for later review
- keep proposal mutation, apply, stable promotion, and live/runtime behavior disabled

### `StablePromotionGate`

Purpose:

- require promotion criteria
- write promotion logs
- produce rollback snapshots

## Major P9 Weak Points

### 1. Prediction Error Is Hard To Define

Slay the Spire errors are often not single-step causal mistakes.

Deaths may come from:

- a card reward several floors ago
- a greedy route
- a missed shop buy
- excessive HP loss in a previous fight
- a boss phase-transition miss

Therefore the first `PredictionErrorAttributor` must use weak attribution.

Initial output should default to fields like:

- `suspectedCause`
- `confidence`
- `counterexampleNeeded`
- `alternativeHypotheses`

Default rule:

- attribution is a suspected cause, not a stable truth
- attribution must not directly become stable knowledge
- only evidence slices, counterexamples, replay/eval confirmation, or live validation may move it toward promotion

### 2. Proposals Can Degrade Into Empty Advice

LLMs are very good at writing plausible but useless summaries such as:

- "defend more"
- "buy better cards"
- "be careful at low HP"

P9 must force proposals to be operational.

Every non-draft proposal should require:

- concrete transition evidence
- scope
- counterexample or non-applicable conditions
- risk
- expected effect
- promotion criteria
- rollback plan

If a proposal lacks evidence, scope, counterexample handling, or validation planning, it should be rejected or remain draft-only.

### 3. Stable Memory Pollution Is The Biggest Risk

Once a bad lesson reaches stable memory, derived knowledge, skill, or scaffold policy, the system can repeatedly retrieve and reinforce the same mistake.

Therefore:

- `ProtectedPathGate` is mandatory P9.0 work
- live LLM, DeepSeek provider, bridge responder, and runtime reflection must not directly write stable memory / derived / strategy / skill
- legacy `finalizeRun()` remains separate `legacy_local_learning`: default-blocked and audited, and if explicitly enabled it is never P9 proposal promotion evidence or a P9 stable-policy writer
- every stable write must go through:
  - pending proposal
  - evidence gate
  - promotion ledger
  - version diff
  - rollback

Legacy `finalizeRun()` behavior must be isolated, labeled, or gated before P9 starts.

### 4. Class Whitelist Can Ossify

Targeted live by decision class was a reasonable P8/P8.5 safety strategy.

But if P9 continues by hand-authoring one soft framework per class, the project will drift toward:

```text
human classification system plus LLM fill-in
```

P9 must add:

- `ClassificationPolicyProposal`
- `ScaffoldPolicyProposal`

so the LLM can gradually propose softer scene structure such as:

- `shop + survival-risk + deck-scaling`
- `card_reward + thin-deck skill`
- `event + risk-budget policy`

Long term, decision classes should remain hard-shell routing and audit labels, not permanent human-authored thinking modes.

### 5. Current Metrics Are Not Enough

`reasonQuality`, `missing_tradeoff`, and `survival_line` are good smoke alarms.

They are not strategic truth.

P9/P10 must avoid training the system to merely produce prettier reasons.

Longer-term evaluation needs signals closer to learning quality, such as:

- decision consistency
- prediction accuracy
- risk calibration
- counterexample rate
- retrieval usefulness
- proposal survival rate
- rollback frequency
- policy usage impact
- regression rate

Reason detectors should remain warning signals, not the long-term optimization target.

## Phases

### P9.0 Protected-Path Hardening

Goal:

- remove accidental write paths before any learning work

Allowed:

- gating
- labeling
- telemetry

Forbidden:

- auto-promoting stable learning

### P9.1 Proposal Schema And Store

Goal:

- replace free-form proposal evidence with typed pending proposals

Allowed:

- schema
- append-only store
- review CLI read path

Current state:

- `LearningProposal` and `ReverseScaffoldFeedback` schemas exist
- `learning-proposals.jsonl`, `learning-proposal-review-decisions.jsonl`, and `reverse-scaffold-feedback.jsonl` are append-only run artifacts
- replay/eval/review can report proposal, review-decision, and reverse-feedback surfaces
- `npm run learning:proposals` provides inspection plus audit-only `approve`, `reject`, and `expire` review-decision commands
- vague proposals cannot become actionable pending review without evidence, scope, counterexamples, expected effect, validation plan, and rollback
- no proposal apply, promotion, or stable write path exists

### P9.2 Attribution And Proposal Generation

Goal:

- generate proposal candidates from replay/review evidence
- capture weak reverse-scaffold feedback as structured telemetry

Scope clarification:

- P9.2 is the right place to introduce typed reverse-scaffold feedback
- P9.2 is not the right place to introduce automatic second-pass prompting or live self-recompilation of context

Current state:

- `src/learning/proposalGenerator.ts` can generate weak-attribution proposal seeds from replay/review evidence
- evidence sources currently include prediction errors, candidate-future review/proposal signals, cue attribution, reason-quality notes, and call-budget exhaustion telemetry
- generation is evidence-slice aware; console/debug/fixture, human-observed, snapshot-only, and unknown-provenance transitions are excluded by default and counted as exclusions
- `npm run learning:proposals -- generate --latest` is dry-run by default
- `npm run learning:proposals -- generate --latest --write` explicitly appends generated proposal and reverse-feedback seeds to run-local append-only stores
- `--include-ineligible-evidence` is debug-only inspection, not promotion-ready learning evidence
- generated seeds remain draft or pending-review evidence only; they do not apply patches, promote stable policy, change live behavior, or mutate memory/derived/strategy

### P9.3 Evidence Slicing

Goal:

- ensure promotion evidence is clean, scoped, and comparable

Current state:

- `EvidenceSliceReader` reports source, capture mode, decision class, revision, budget, provider, live mode, and provenance dimensions
- proposal seed generation now consumes this provenance boundary by default
- stable-learning promotion remains disabled; clean slices can support review, but cannot apply stable changes

### P9.4 Review And Decision CLI

Goal:

- let humans inspect proposals and record review decisions

Current P9.1 state:

- inspect/list/show exists for proposals, review decisions, and reverse feedback
- `approve`, `reject`, and `expire` record audit-only ledger events
- apply and stable promotion remain forbidden

### P9.5 Shadow Applicator

Goal:

- apply proposals only in shadow first

Current state:

- read-only shadow overlay planning exists through `npm run learning:proposals -- plan --latest --id <proposalId>`
- the plan names the affected soft layer, protected targets, and blockers
- P9.5A currently admits only an explicit low-risk `reason_policy` `deliberation_shaping` overlay to a cloned offline `DeliberationPacket`, then compares baseline versus overlay workspace prompt hashes/bytes through `npm run learning:proposals -- shadow-compare --latest --id <proposalId> --transition-id <transitionId>`
- candidate-template projections remain comparison/review tooling only; actual candidate-template changes are `candidate_shaping` and cannot enter the first canary path
- eligibility requires source-resolved clean evidence, a caller-selected replay transition that matches the proposal/evidence IDs and declared exact scope, non-empty canonical protected targets, a bounded structured overlay patch, and no policy-local blockers; unsupported proposal families and incomplete replay data are rejected
- P9.5A performs no provider call and writes no run artifact. It does not change candidate facts/order, classification, budget, memory, derived knowledge, strategy, validation, execution, live behavior, or stable policy
- P9.5B now evaluates supplied paired same-slice baseline/overlay outcomes. It requires exact transition, revision, budget, allowed-candidate, candidate-facts, and prompt-hash alignment; it detects provider/output-cap and reason-quality regressions without treating a different valid candidate as automatically wrong.
- P9.5C adds `npm run learning:proposals -- shadow-run --run-id <runId> --id <proposalId> --transition-id <transitionId>`. It reconstructs the recorded ablation mode and provider profile from a replayable called baseline, then makes at most one provider call for the cloned overlay packet. It has no game client, transition write, proposal-status mutation, runtime decision effect, or stable write.
- P9-G2 now has an append-only `LearningExperimentManifest` that binds proposal, baseline/overlay outcomes, pair evaluation, authority record, environment scope, observed evidence roles, and invariant results. It is output by `shadow-run` and appended only with explicit `--record-manifest`; it is audit evidence, not a promotion ledger.
- `shadow-preflight` now refuses a same-slice provider call until final selection provenance, source-resolved eligibility, complete exact organic environment scope, executor capture, a called workspace-shadow baseline, non-empty protected targets, and a complete provider experiment fingerprint are explicit. This is deliberately **not** a G3 authorization.
- A declared product authority mode is distinct from observed evidence roles. A direct workspace-provider shadow outcome can validate a bounded workspace comparison while the executed action remains local fallback; it is not LLM-selected execution evidence. Local fallback/scaffold/mechanical observations stay visible but can seed only draft-only review material.
- A `reason_policy` overlay must carry an explicit `requiredReasonQualityNote`; otherwise it is rejected as unscoped. The runner passes recorded baseline notes into eligibility and refuses the overlay when that trigger is absent. This prevents a one-case reason fix from becoming a broad class prompt rule.
- The same-slice invariant now includes a secret-free `ProviderExperimentFingerprint` (provider source, provider, model, mode, thinking, output cap, retry/recovery attempt topology) in addition to transition, revision, budget, candidate/fact, and prompt hashes. A missing or mismatched profile makes a pair incomplete; manifest-store legacy or malformed records are surfaced by a digest rather than silently treated as current.
- Each outcome may include the observed provider attempt trace (primary/rescue kind, cap, thinking mode, finish reason, and content kind). This is attribution telemetry: it separates a provider-recovery divergence from a candidate/fact or proposal-policy regression. It does not change recovery behavior.
- One scope-bound P9.5C organic combat pair was collected for `transition-000194-agent-mr7smrum-sk2bgv`: candidate/fact invariants and provider profile matched, the legal selected candidate stayed the same, and the `missing_tradeoff` smoke alarm improved. It is only `paired_evidence_ready_for_review`; it does not mutate proposal status or become `shadow_validated`.
- Counterexample review has begun but is not complete. An independent same-revision adequate combat reason was refused by the trigger guard, showing cue detectors are not strategic truth and that P9.5C must not become a reason-wording optimizer. A second matching `missing_tradeoff` baseline entered provider recovery and therefore changed terminal provider profile; it is `incomplete`, not confirming policy evidence. More than one provider-profile-comparable organic slice and explicit counterexample handling remain required before a future guarded status-transition design is considered.
- Targeted shadow capture may reserve a bounded provider-call budget for one evidence class, but it is only an evidence-collection aid. A different capture budget can refute a broad hypothesis contextually, yet cannot be presented as a same-profile paired result. If a repeated deficiency does not survive such counterexample review, reject the hypothesis rather than manufacture a proposal or expand a reason contract.
- Candidate-template semantic boundary: a facts/order-preserving projection may guide evaluation of existing CandidateFuture ids while preserving runtime behavior in the clone. If applied before deliberation later, it is still potentially deliberation-shaping; actual candidate-template/generation changes remain `candidate_shaping` and cannot use this projection path or be relabeled to bypass it.
- Two exact-organic `card_select:local_recommended_llm_arbitrate` captures now repeat empty structured costs, generic shallow risk labels, and flow-only prediction checks in CandidateFutures. Their model reasons still expressed strategic tradeoffs, so this is a scoped candidate-shaping content debt with unproven decision impact, not a presentation-only overlay candidate.

Comparable P9.5C evidence is necessary but not sufficient for P9-G3. Any future paired evidence used for promotion must also pass truthful selection resolution, shared evidence-role, source-resolved proposal eligibility, provider-fingerprint, exact-identity, authority-impact, and counterexample review.

### G2/P9.5D Decision Authority Foundation

Goal:

- make strategic agency auditable without changing who decides

Implemented schema/telemetry:

- typed authority mode/level;
- deliberation/selection/authorization/execution chain;
- proposal behavior-impact class;
- backward-compatible reporting for old `chosenBy` records;
- hard rejection of executable authority/action/hard-shell promotion paths.

Remaining G2 evidence work:

- collect fresh transitions with explicit authority mode and recorded selection resolution across accepted LLM, local guard override, fallback, and forced-local paths;
- retain old transitions as `not_recorded` where fields never existed and preserve proposal/final mismatch exclusions;
- use only the fresh, source-resolved records for a future natural paired/counterexample review.

### G2/P9.5E Environment Identity And Evidence Scope

Goal:

- prevent stable learning from using unknown, stale, or incompatible game/mod/adapter evidence

Implemented schema/telemetry:

- minimal `EnvironmentFingerprint`;
- evidence environment scope and compatibility state;
- mixed/unknown environment exclusion from promotion;
- future policy invalidation and revalidation fields.
- secret-free `ProviderExperimentFingerprint`, exact-identity comparison, and manifest-store legacy/malformed digest diagnostics.

Remaining G2 evidence work:

- repeat verified build/channel/content/mod/adapter/fact/revision/provider-profile fields in an organic **paired** slice; a verified exact organic baseline-only slice exists, but is not a pair or promotion evidence;
- prove console/debug provenance is excluded;
- exercise the implemented narrow P9 exact-identity applicability without claiming P12 compatibility; unsupported, quarantined, degraded, missing, or malformed scope must fail closed.

### G3-A/P9.6 Disabled Change-Kernel Infrastructure

Goal:

- construct the safety machinery for a future change lifecycle without qualifying, activating, retrieving, or promoting a policy

G3-A is allowed after the G2 implementation audit even when no natural policy candidate exists. It contains only run-local append-only `PolicyArtifact`, `PolicyChangeEvent`, `PolicyRollbackSnapshot`, and dry-run `PolicyRetrievalTrace` records. Artifacts are `disabled` by default; malformed or incomplete artifacts are visible as quarantined; rollback is simulation-only; exact-scope retrieval always returns `disabled_no_activation`. The protected-path gate continues to deny `p9_stable_promotion`.

Fixtures may prove G3-A code behavior but cannot qualify a policy, satisfy paired evidence, or support promotion. G3-A must never connect to live prompt assembly, candidate generation, routing, execution, memory, derived knowledge, strategy, skills, or stable policy storage.

### G3-B/P9.6 Policy Qualification Gate

Goal:

- determine whether one natural, low-risk **deliberation-shaping** policy candidate is qualified for a future canary

G3-B remains forbidden until a written G2 evidence audit passes the selection-resolution, evidence-role, proposal-authorization, provider-fingerprint, manifest-integrity, exact-identity, semantic-state, and counterexample checks. The candidate needs repeated same-scope natural evidence, an explicit counterexample or non-applicability condition, human semantic review, and a bounded risk surface. `presentation_only` display changes are not a meaningful learning lifecycle; `candidate_shaping`, `authority_shaping`, `action_shaping`, and `hard_shell` proposals remain outside the first path.

### G3-C/P9.7 Activation, Retrieval, And Canary Gate

Goal:

- allow a qualified policy to be manually approved for a bounded organic canary, then only later consider stable promotion

G3-C remains forbidden. Before it can open, a qualified G3-B candidate must have a review decision, immutable lifecycle ledger, exact-scope applicability, explicit activation/stop conditions, rollback snapshot, active retrieval trace, organic canary plan, and regression guards. It must use exact P9 fingerprint equality rather than claim P12 compatibility, and must not be marketed as strategic learning merely because a reason-quality detector improved.

Active retrieval must record policy version, lifecycle event id, authority mode, environment applicability decision, scope match, and fallback. A quarantined or incompatible policy must not be retrieved as active guidance.

### G4/P9.8 End-To-End Guarded Learning Window

Goal:

- complete one full proposal lifecycle from evidence to stable to rollback-capable validation

## First Recommended Narrow Target

The first P9 stable target should not be strategy params.

The first target is not selected yet. If G2 passes, it may be a narrowly scoped pre-decision context policy only when it:

- preserves all recorded facts, legal candidate ids, candidate order, validation, execution, authority, and protected-path boundaries;
- declares `deliberation_shaping` and possible decision influence honestly;
- has source-resolved evidence, counterexamples, an exact identity scope, provider-fingerprint-comparable shadow evidence, a human approval, retrieval trace, and a rollback drill;
- can be stopped by a bounded organic canary without widening live authority.

Neither a `ReasonPolicyProposal` nor a `CandidateTemplateProposal` is automatically low risk merely because it changes wording or presentation.

## Out Of Scope

P9 does not authorize:

- wildcard live expansion
- provider contract heroics as a substitute for learning
- automatic stable memory writes without proposal review
- letting LLM proposals rewrite validation or execution rules
