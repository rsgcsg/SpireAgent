# P9-P10 Trustworthy Change Kernel Audit

Date: 2026-07-11  
Status: accepted corrective audit; implementation fixes are pending  
Canonical current state: [Current Status](../04_CURRENT_STATUS.md)  
Durable semantic decision: [ADR-0006](../decisions/ADR-0006-policy-influence-and-evidence-provenance.md)

## Executive Verdict

P9 and P10 remain necessary and directionally aligned with the North Star, but the current P9-G2 design has data-truth and semantic gaps that make P9-G3 unsafe to implement or start. Detailed G3 implementation design remains deferred; this audit only reserves its required gate contract. This is not a provider reliability blocker and cannot be solved by collecting more samples alone.

The project has a real LLM-centered scaffold MVP: strategic workspace, CandidateFuture, replay/eval/review, explicit-whitelist live, protected-path governance, append-only proposal/review artifacts, and isolated shadow comparisons exist. It does **not** yet have trustworthy learned-policy lifecycle semantics. In particular, it cannot currently prove every record labelled LLM-selected actually executed the LLM-proposed candidate, nor can it honestly call a pre-decision prompt policy `presentation_only`.

Decision:

- keep P9-G3 stable change, stable promotion, wildcard live, budget autonomy, and skill delegation disabled;
- repair P9-G2 provenance and proposal-integrity contracts before gathering more pairing evidence for promotion;
- preserve the P9/P10 phase structure, but revise the first stable target and add explicit P10 integrity/evaluation work packages;
- do not reinterpret historical records or detector alarms as strategic truth.

## Audit Method

This audit cross-checked the North Star, phase plans, schema/replay docs, proposal/overlay code, controller flow, protected paths, run artifacts, and the supplied external critique. It treats the supplied critique as a hypothesis source, not authority.

A read-only scan of `67` transition files (`12,138` transitions) found `372` records with an LLM proposal. Two fresh historical live card-select records had a valid LLM proposal id that differed from the recorded final candidate:

| Run | Transition | LLM proposal | Final candidate | Consequence |
| --- | --- | --- | --- | --- |
| `run-mr8pwmtm-4z75zt` | `transition-000080-agent-mr95kwvx-rwmnfr` | `select-card-12` | `select-card-0` | Cannot support LLM-selection attribution |
| `run-mr9beg4g-tf3z8k` | `transition-000725-agent-mr9c3oam-5ehlu9` | `select-card-1` | `select-card-0` | Cannot support LLM-selection attribution |

Both were additive live calls through `deepseek-live-command`. This is a provenance defect, not evidence of illegal execution: the final candidate was legal, but the record's LLM-selection claim is false or incomplete.

## Confirmed Findings

### Critical: Final selection provenance can be wrong

`controller.ts` accepts a valid LLM choice and sets `chosenBy="llm"`, then later runs the card-select safety guard. The guard may replace `chosen`, but no final-selection override record is emitted and `chosenBy` remains `llm`. `DecisionAuthorizationRecord` then derives selection source from `chosenBy` alone.

Why this matters:

- a local safety transformation can be misreported as LLM-selected execution;
- proposal seed, replay, and future policy-impact claims can use false authority evidence;
- historical data cannot be silently treated as a clean baseline.

Required G2 repair: introduce `SelectionResolutionRecord`; preserve proposal and final choice independently; derive final selection source from the resolution; add invariant tests and a derived historical mismatch exclusion. Do not rewrite raw history.

### Critical: Pre-decision reason guidance is not presentation-only

`reason_policy` is generated with `behaviorImpact="presentation_only"`, and the shadow overlay/preflight accepts only that class. Yet reason guidance is inserted into a cloned `DeliberationPacket` before the provider decision. A future applied policy could therefore influence selection.

Why this matters:

- it creates a false claim of low risk and decision neutrality;
- a clean reason detector result could be mistaken for a harmless policy improvement;
- the former G3 first target would not prove the meaningful soft-shell lifecycle described by the North Star.

Required G2 repair: distinguish post-decision display from pre-decision deliberation shaping. Preserve candidate/fact/order invariants, but classify pre-decision context policies as decision-influencing. The first G3 candidate must be a narrow, explicitly canaried deliberation-shaping policy, not a fake `presentation_only` policy.

### High: Evidence-role classification has three incompatible implementations

`EvidenceSliceReader` and proposal generation prioritize `llm_selected_execution`; experiment manifests prioritize `workspace_shadow_provider`. A transition that contains both receives conflicting evidence roles depending on the surface.

Required G2 repair: one shared structured classifier that carries workspace-call, proposed/final selection, execution, and eligibility facts independently. Role labels must be derived, not independently reimplemented.

### High: Proposal eligibility is advisory in places where it must be authoritative

Current proposal validation accepts an empty `protectedTargets` array as structurally present. The overlay planner adds `protected_targets_not_declared` but still exposes `eligibleForShadowApplication` from a separate checker. That checker trusts proposal-supplied evidence tags/raw flags rather than resolving source transitions, and it accepts exact organic scope without applying a compatibility policy.

Required G2 repair:

- require non-empty validated protected targets;
- make all preview/applicator paths consume the same final `blockers.length === 0` decision;
- resolve evidence references against source run/transition artifacts plus digests;
- introduce explicit P9 exact-identity applicability and fail closed for unsupported, quarantined, degraded, or unresolved scope;
- do not trust proposal self-assertions as authorization.

### High: Experiment identity and manifest integrity are incomplete

Current provider comparison profiles omit provider/model identity, sampling controls, parser/schema revision, system/prompt assembly revision, and complete recovery behavior. Manifest `authorityRecorded` accepts any non-empty object; malformed manifest lines are silently discarded.

Required G2 repair: add a non-secret `ProviderExperimentFingerprint`, validate required authority fields, and surface malformed/invalid manifest lines as integrity failures. A provider recovery mismatch remains an incomplete comparison, not a policy result.

### High: Authority is visible but not yet enforced as product policy

`DecisionAuthorizationRecord` is audit telemetry. Runtime routing still permits local scoring/routes to select actions, with `unclassified_local_scaffold` labelling. That is acceptable for P8 safety/fallback history, but it is not proof that `llm_primary` already governs strategic authority.

Required placement: P9-G2 must repair truthful observation; P10-A must introduce an `AuthorityPolicy` contract for evidence eligibility and impact evaluation; P14 owns qualification and delegation of reusable local skills. Do not change current live routing as part of this audit.

### High: Legacy state remains a data-integrity boundary

Legacy `finalizeRun()` can still write long-term memory, experience, and strategy when explicitly enabled. It is default-blocked and audited, which is an important improvement, but P10 needs a separate learning store and must treat any legacy-store digest change as a contamination/invalidation event. `readJson()` also silently returns defaults on read/parse failure, which is unacceptable for future stable-policy stores because it can hide corruption and later overwrite evidence.

Required placement: P9-G2 defines the separation and invalidation rule; P9-G3's single change kernel must fail closed on learned-store corruption; P10 generalizes event integrity, quarantine, and retention. Preserve legacy data reading; do not delete memory files.

## North Star Assessment

The architecture is not fundamentally a rules bot today. Local code still builds facts, CandidateFuture, constraints, and safe execution around an LLM decision. The current explicit-whitelist live system is a legitimate bootstrap, not a claim of wildcard autonomy.

However, three drift risks are real:

1. **Prompt-pile drift.** Repeated per-class reason or CandidateFuture patches can become permanent human-authored strategy. P9 must turn recurring shortcomings into typed, scoped, counterexample-aware proposals instead of hand-maintained wording rules.
2. **Authority drift.** Local scoring/fallback is necessary as a hard safety/availability layer, but its selection share, overrides, and authority scopes must be measured before claiming LLM-primary strategic ownership.
3. **Metric drift.** `reasonQuality`, `missing_tradeoff`, and survival cues are smoke alarms. Optimizing them directly would train prose compliance rather than play quality.

The soft shell should become less hand-authored over time, but cannot "almost disappear" by removing useful structure. It must become a versioned, evidence-backed, inspectable interface that the LLM can propose changes to under hard-shell limits. Facts, legal candidates, validation, execution, protected writes, authorization, rollback, and environment quarantine remain non-negotiable outer-shell functions.

## Corrected Architecture Contract

### Resolution and authority

```text
facts + legal candidates
  -> LLM/local candidate proposal
  -> SelectionResolutionRecord
       (proposal, guard transformation, final candidate, reason)
  -> AuthorizationRecord
  -> validated execution
  -> transition / evidence record
```

Final selection provenance, not `chosenBy`, drives LLM-selection evidence. A guard override is a valid safety event and must be explicit.

### Evidence model

Evidence must carry independent dimensions:

- source artifact identity and digest;
- environment identity and exact P9 applicability;
- provider experiment fingerprint for provider comparisons;
- baseline/overlay role facts;
- selection and execution provenance;
- capture provenance (`organic`, console/debug, fixture, unknown);
- revision, budget/recovery profile, and policy version;
- evidence tier and counterexample status.

Evidence tiers have distinct jobs:

| Tier | Permitted claim | Cannot prove |
| --- | --- | --- |
| Organic discovery | a pattern occurs in real runtime distribution | mechanism or causal effect |
| Reproducible fixture | code/adapter/edge behavior is reproducible | frequency or strategic prevalence |
| Controlled shadow comparison | a bounded mechanism differs under matched conditions | live strategic value by itself |
| Organic canary | no immediate regression in a real scoped window | broad generalization or exact causality |

No tier is substituted for another merely to advance a gate.

### Policy impact model

Future schema must separate `mutationSurface` from `decisionInfluence`:

| Mutation surface | Decision influence | P9 treatment |
| --- | --- | --- |
| post-decision display | none | audit/UI only; not a meaningful first stable policy |
| prompt serialization or context content | possible | `deliberation_shaping`; shadow/canary/rollback required |
| CandidateFuture content/generation | intended | candidate shaping; later qualified path |
| classification/routing/authority | direct | authority shaping; outside first stable change |
| action/execution/validation/protected store | direct | hard shell; not learnable |

### P9 exact-identity policy

Before P12, P9 can only use a learned object when its complete recorded environment fingerprint exactly equals the current fingerprint. This is a narrow applicability rule, not a compatibility verdict. No cross-build, cross-mod, cross-adapter, or compatibility-range inference is permitted.

## Revised Engineering Order

### P9-G2.1: Selection truth repair

Deliverables:

- `SelectionResolutionRecord` schema and recorder path;
- controller/authority integration that records proposal versus final resolution;
- replay/eval exclusion and warning for historical proposal/final mismatch;
- smoke fixtures for LLM accepted/no override, local safety override, invalid output fallback, and forced local.

Exit: final candidate, final actor, and any transformation are unambiguous in fresh transitions. No selection provenance mismatch can be counted as `llm_selected_execution`.

### P9-G2.2: Shared evidence and proposal-authorization kernel

Deliverables:

- one structured evidence-role classifier shared by replay, generator, and manifests;
- source-resolved `EvidenceRef` validation with digests;
- non-empty protected-target and target/layer compatibility validation;
- one final overlay/preflight eligibility decision with no bypass;
- test fixtures for forged labels, empty targets, stale/missing source, and unsupported scope.

Exit: every G2 surface gives the same role and eligibility answer for a transition/proposal pair.

### P9-G2.3: Comparison integrity and exact applicability

Deliverables:

- non-secret `ProviderExperimentFingerprint` and profile-comparison rules;
- authority-field completeness validator;
- manifest parse diagnostics and fail-closed integrity surface;
- exact-identity applicability guard and legacy stable-store digest marker.

Exit: a pair is either structurally comparable with named identity/profile facts or explicitly incomplete. No malformed artifact disappears silently.

### P9-G2.4: Evidence requalification audit

After G2.1-G2.3, re-run focused slices and reclassify historical evidence conservatively. Then collect only naturally occurring, low-risk, same-scope evidence and counterexamples. Do not manufacture a proposal or keep blind-sampling a class to pass the gate.

Exit: written G2 audit confirms truthful selection provenance, shared roles, source-resolved evidence, exact applicability, and at least one appropriately scoped hypothesis/counterexample review. Only then may G3 implementation design begin.

### P9-G3/G4: reserved, not authorized now

G3 must use an immutable event lifecycle:

```text
ProposalCreated -> ReviewRecorded -> ExperimentAttached
-> QualificationComputed -> PromotionAuthorized
-> PolicyArtifactPublished -> PolicyActivated
-> Quarantined | Reverted | Expired
```

The event projector derives state; mutable proposal status is never the sole authority. The first policy may be narrowly deliberation-shaping but must preserve facts, legal candidates, candidate order, validation, execution, authority, and protected-path rules. Human approval, a rollback snapshot, retrieval trace, exact identity match, and organic canary are mandatory.

G4 demonstrates one lifecycle and rollback drill. It does not expand policy families for feature count.

## P10 Engineering Plan

P10 is retained, but its first work must make the P9 kernel repeatable rather than merely add more generators.

### P10-A: Change semantics and integrity

- canonical policy semantic key and typed patch canonicalization;
- immutable event store/projector with idempotency, sequencing, and artifact digests;
- proposal conflict, supersession, scope lattice, expiry, and quarantine semantics;
- `AuthorityPolicy` evidence-eligibility contract; do not transfer authority or route behavior;
- learned-store corruption quarantine rather than fallback-and-overwrite.

### P10-B: Evidence, counterexamples, and evaluation

- `EvidenceSliceReader` becomes the source-resolved evidence view, not a mutable promotion engine;
- `CounterexampleHarvester` tracks disconfirming evidence and alternative hypotheses;
- matched-slice/paired comparisons with provider and environment controls;
- impact hierarchy: structural safety, prediction/forecast calibration, candidate coverage, decision consistency, retrieval usefulness/harm, then bounded organic canary outcomes;
- reason alarms remain warnings, never the optimization target.

### P10-C: Bounded operations

- `ProposalAggregator`, `ProposalDeduplicator`, backlog health, review-load limits, evidence aging, and regression monitoring;
- bounded `ExperimentQueue` prioritizes known evidence gaps, counterexamples, regressions, and revalidation; it cannot invent objectives, self-approve, or apply changes;
- single-writer local storage is sufficient initially; introduce a transactional store only if concurrent writers become a real requirement.

### P10-D: Candidate challenge telemetry

The LLM currently cannot safely say `reject_all`, request a missing candidate, or trigger replan. Add non-executable `CandidateChallengeRecord` telemetry first. A bounded replan may only be considered in P11 after explicit candidate/validation/fallback design; it must never invent or execute an action outside allowed candidates.

P10 exits only after repeated independently auditable lifecycles across policy families/scopes, explicit rejection and narrowing cases, a rollback/invalidation drill, observed policy use and harm, and bounded review load. It does not prove game mastery or automatic self-improvement.

## Historical Debt Ownership

| Debt source | Required treatment | Owner |
| --- | --- | --- |
| P1-P8 `chosenBy`/local guard telemetry | preserve raw records; derive conservative mismatch exclusion | P9-G2.1 |
| P7 legacy finalize and heuristic stable state | isolate, digest, and quarantine for learned-policy evidence | P9-G2.3 / P10-A |
| P8 class-specific workspace patches | retain as bootstrap evidence; convert recurring needs into proposal families, not permanent rules | P9-G2 / P11A |
| P8 shadow/live readiness mixture | keep separate rollout, shadow, and promotion evidence views | P9-G2.2 |
| controller coupling | extract only after truthful resolution contract is specified; do not refactor for appearance | P9-G2.1 follow-up |
| provider truncation/recovery | keep operational telemetry and fixed guards; learned compute policy remains P11B | P11B |
| console/game-state visibility | retain debug value but exclude from promotion discovery/canary proof | P9-G2 / P12 |

## Non-Goals And Stop Conditions

This corrective plan does not authorize:

- stable promotion or any stable-policy writer;
- live whitelist expansion or wildcard live;
- prompt/candidate/scoring/fallback/validation/execution changes during documentation correction;
- automatic budget escalation or provider/profile selection;
- skill delegation or authority transfer;
- claims of exact causal attribution from game outcomes.

If repair reveals that final selection cannot be captured without changing execution semantics, stop and split the work into an instrumentation-only PR before touching routing.

## Immediate Next PR

`P9-G2.1 SelectionResolution Provenance` is the next implementation PR. It is deliberately narrow: record and report final resolution truth around the existing guard, add compatibility-safe historical mismatch detection, and test it. It must not alter candidate generation, scoring, provider calls, validation, execution, live flags, stable paths, or P9-G3 state.
