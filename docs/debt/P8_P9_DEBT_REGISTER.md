# P8 / P9 Debt Register

This document tracks the debts that remain after P8/P8.5 closeout and before P9 guarded learning should begin.

For the comprehensive pre-P9 audit, full classification matrix, repair order, and copy-paste follow-up PR prompts, see [PRE_P9_ENGINEERING_DEBT_AUDIT.md](PRE_P9_ENGINEERING_DEBT_AUDIT.md).

For the accepted forward phase order, see [P9-P15 Phase Architecture Audit](../reports/P9_P15_PHASE_ARCHITECTURE_AUDIT_2026-07-11.md), [P9_P15_EXECUTION_ROADMAP.md](../phases/P9_P15_EXECUTION_ROADMAP.md), and ADR-0005. The July 10 authority/environment audit remains supporting history.

Status values:

- `open`
- `in_progress`
- `accepted_for_later`
- `closed`

## Critical

### `selection_resolution_provenance_mismatch`

- Status: `open`
- Evidence:
  - [controller.ts](../../src/agent/controller.ts#L353)
  - [controller.ts](../../src/agent/controller.ts#L421)
  - historical live transitions `transition-000080-agent-mr95kwvx-rwmnfr` and `transition-000725-agent-mr9c3oam-5ehlu9`
- Problem:
  - A valid LLM candidate can set `chosenBy="llm"`, then the local card-select safety guard can replace the final candidate. The recorder retains the final candidate but does not record the transformation or change final selection provenance.
  - The two cited additive-live records proposed `select-card-12` / `select-card-1` but executed `select-card-0` while their historical decision audit reported `chosenBy="llm"`.
- Why it matters:
  - It makes `llm_selected_execution` false or incomplete for affected records. Execution safety may still be correct, but authority, proposal, and future policy-impact evidence become untrustworthy.
- Required G2 repair before G3:
  - add a `SelectionResolutionRecord` containing proposed candidate/source, final candidate/source, transformation kind/reason, validation, and evidence eligibility;
  - derive authority/replay evidence from final resolution, not `chosenBy` alone;
  - retain raw history and add a conservative derived mismatch warning/exclusion instead of rewriting transitions;
  - cover accepted LLM selection, local safety override, invalid fallback, and forced-local paths with smoke/replay fixtures.

### `pre_decision_policy_impact_misclassification`

- Status: `open`
- Evidence:
  - [proposalGenerator.ts](../../src/learning/proposalGenerator.ts#L446)
  - [shadowOverlayPolicy.ts](../../src/learning/shadowOverlayPolicy.ts#L23)
  - [experimentManifest.ts](../../src/learning/experimentManifest.ts#L77)
- Problem:
  - `reason_policy` guidance is placed into a packet before the provider decision but is classified and preflighted as `presentation_only`.
- Why it matters:
  - Offline clone isolation means no current runtime mutation; it does not mean a future application cannot change LLM deliberation. Treating it as decision-neutral understates risk and invalidates the former first-G3 target wording.
- Required G2 repair before G3:
  - split post-decision display from pre-decision `deliberation_shaping` using explicit mutation-surface and decision-influence semantics;
  - retain fact/candidate/order invariants as safeguards, not proof of no decision influence;
  - require the first G3 candidate to be a narrow deliberation-shaping canary with human approval, retrieval trace, and rollback.

### `proposal_authorization_bypass_risk`

- Status: `open`
- Evidence:
  - [proposals.ts](../../src/learning/proposals.ts#L312)
  - [proposals.ts](../../src/learning/proposals.ts#L635)
  - [shadowOverlayPolicy.ts](../../src/learning/shadowOverlayPolicy.ts#L81)
- Problem:
  - Empty protected-target arrays pass structural validation; one planner exposes blockers but delegates application eligibility to a separate checker; that checker trusts proposal-embedded evidence eligibility/role labels.
- Why it matters:
  - A malformed or forged proposal can look shadow-eligible without source-resolved evidence or complete protected-path declaration.
- Required G2 repair before G3:
  - require non-empty validated targets and target/layer compatibility;
  - resolve evidence references and digests from source run/transition artifacts;
  - make every preflight/applicator path consume the same final deny-by-default eligibility decision;
  - fail closed for unsupported, quarantined, degraded, or unresolved applicability.

### `protected_path_write_gate_missing`

- Status: `closed`
- Evidence:
  - [controller.ts](../../src/agent/controller.ts#L362)
  - [memory.ts](../../src/agent/memory.ts#L140)
- Resolution:
  - `ProtectedPathGate` is now the single stable-write authorization evaluator. It centralizes explicit targets and origins for live LLM, legacy finalize, P9 stable promotion, shadow experiment, and runtime reflection.
  - Existing live/legacy wrappers retain their compatibility behavior; P9 promotion, shadow experiment, and runtime reflection are deny-only even if historical flags are present.
  - Ordinary runtime persistence writes only current-run state. Legacy finalize remains blocked by default, audited, and labeled `legacy_local_learning`; it is the only legacy path that writes the stable memory/experience/strategy stores when explicitly enabled. No P9 proposal/promotion writer exists.

### `readiness_semantics_stale_for_broad_live`

- Status: `in_progress`
- Evidence:
  - [p8LiveReadiness.ts](../../src/replay/p8LiveReadiness.ts#L26)
  - [evidenceBudget.ts](../../src/replay/evidenceBudget.ts#L5)
- Problem:
  - Replay readiness still encodes a shadow/combat-first worldview while the project already runs explicit broad-whitelist live windows.
  - A separate live-applied rollout summary now exists, but the old shadow-first readiness view still coexists and can still be misread.
- Why it matters:
  - It becomes too easy to misread clean live-applied evidence as `no_go`, or to compare the wrong slices.
- Minimum fix:
  - keep the new separate live-applied rollout audit
  - keep shadow readiness, but stop using it as the only broad-live truth
  - eventually introduce a clearer live rollout reader that distinguishes shadow readiness, live-applied evidence, and future promotion slices

### `p9_learning_schema_missing`

- Status: `closed`
- Evidence:
  - [types.ts](../../src/domain/types.ts#L547)
  - [DATA_SCHEMA.md](../../DATA_SCHEMA.md#L147)
- Problem:
  - Current `ConsolidationRecord` remains useful P7 evidence, but P9 now has a separate typed `LearningProposal` family and append-only pending store.
  - Weak-attribution fields and anti-vague validation exist for pending proposals.
- Resolution:
  - `src/domain/types.ts` defines typed proposal families, weak attribution, promotion criteria, rollback, protected-path impact, and review history.
  - `src/learning/proposals.ts` appends and reads `learning-proposals.jsonl` without any apply or promotion path.
  - `learning-proposal-review-decisions.jsonl` records audit-only `approve`, `reject`, and `expire` decisions without mutating proposals.

### `reverse_scaffold_feedback_schema_missing`

- Status: `closed`
- Problem:
  - The project now has a typed reverse-scaffold feedback object and append-only run store.
  - It remains telemetry/proposal-seed material only.
- Why it matters:
  - Without a typed reverse feedback channel, the project risks drifting back toward human-authored per-class patching instead of proposal-driven soft-shell learning.
- Resolution:
  - `ReverseScaffoldFeedback` records target layer, omitted/misleading information, evidence, confidence, risk, and proposal seed links.
  - `reverse-scaffold-feedback.jsonl` is visible in replay/eval/review and cannot alter live prompts, budgets, or stable policy.

### `evidence_slice_reader_missing`

- Status: `in_progress`
- Problem:
  - Promotion evidence is moving out of ad hoc replay summary interpretation into a first-class read-only slice reader, but that reader is not yet the canonical promotion-grade slice authority.
  - The current reader still deliberately keeps stable-learning promotion ineligible until P9 proposal/promotion gates exist.
- Why it matters:
  - P9 cannot safely promote or reject policies if mixed revision, mixed budget, console-assisted, and live-vs-shadow evidence are not explicitly separable.
- Minimum fix:
  - keep expanding the first-class `EvidenceSliceReader`
  - make slice dimensions explicit in code and docs
  - keep stable-learning promotion disabled until proposal/promotion gates exist

### `decision_authority_audit_missing`

- Status: `in_progress`
- Problem:
  - Fresh executor-logged transitions now carry a read-only `DecisionAuthorizationRecord` with separate deliberation, selection, authorization, execution, plan-origin, and authority fields.
  - Historical `chosenBy` remains incomplete and is deliberately reported as `not_recorded` rather than retroactively inferred.
- Why it matters:
  - Learned capability could silently become authority, turning the main product into a local policy bot without an explicit North Star decision.
- Remaining fix before P9-G3:
  - capture fresh explicit authority-mode evidence across LLM, local, and fallback paths
  - preserve routing and execution behavior
  - retain exclusion of authority/action/hard-shell proposals from the first stable promotion path

### `evidence_role_and_authority_conflation`

- Status: `in_progress`
- Evidence:
  - [experimentManifest.ts](../../src/learning/experimentManifest.ts)
  - [proposalGenerator.ts](../../src/learning/proposalGenerator.ts)
  - [evidenceSliceReader.ts](../../src/replay/evidenceSliceReader.ts)
- Problem:
  - Exact organic environment scope and a declared `llm_primary` mode do not prove that the LLM selected or executed the recorded action. Controlled direct-workspace shadow windows may intentionally execute local fallback while still yielding a valid provider outcome.
  - `EvidenceSliceReader` and proposal generation currently prioritize `llm_selected_execution`, while experiment manifests prioritize `workspace_shadow_provider`. The same transition can therefore receive incompatible roles across G2 surfaces.
  - Existing focused slice `promotionEligible` counts remain environment/provenance eligibility, not proof of execution authority or authorization.
- Why it matters:
  - Without this distinction, G2 could promote a shadow prompt-quality result as if it were evidence that an LLM-owned decision improved, or let local/mechanical smoke alarms become actionable soft-shell changes.
- Minimum fix before P9-G3:
  - replace local precedence rules with one shared structured observation classifier for workspace calls, proposed/final selection, execution, and provenance consistency;
  - derive display roles from that one record, retain baseline/overlay role facts, and require a called workspace-shadow baseline for provider comparison;
  - require G3 to state whether a claim concerns shadow workspace quality, LLM-selected execution, or both.

### `candidate_template_shadow_overlay_eligibility_mismatch`

- Status: `in_progress`
- Evidence:
  - [shadowOverlayPolicy.ts](../../src/learning/shadowOverlayPolicy.ts)
  - [proposalGenerator.ts](../../src/learning/proposalGenerator.ts)
  - [P9_GUARDED_LEARNING_PLAN.md](../phases/P9_GUARDED_LEARNING_PLAN.md)
- Resolution:
  - A cloned `candidate_template` overlay is only a facts/order-preserving presentation projection over existing CandidateFuture objects. It may add bounded guidance and reference existing ids, but cannot create, remove, reorder, or alter candidates/facts.
  - Actual candidate-template/generation change remains `candidate_shaping`; generated `candidate_future:card_flow` seeds therefore remain review-only and cannot use the presentation-only overlay path.
  - Smoke coverage proves the permitted projection preserves candidate-fact hashes and has no runtime/live effect.
- Remaining repair:
  - A presentation projection may still shape a future provider decision if applied before deliberation. It is G2 comparison tooling, not proof that a G3 policy is `presentation_only` or decision-neutral.
  - Reclassify all pre-decision overlays under the mutation-surface/decision-influence contract from ADR-0006 before G3.

### `card_select_candidate_future_content_deficit`

- Status: `in_progress`
- Evidence:
  - organic exact-scope workspace-provider transitions `transition-000391-agent-mrfu596y-ad2qik` and `transition-000433-agent-mrfun527-vddpuj`
  - both `card_select:local_recommended_llm_arbitrate` captures under the same revision, environment fingerprint, and focused budget profile
- Problem:
  - Both CandidateFuture sets are action-first templates with empty structured `cost`, generic `shallow_future_risk_model` risk, and flow-only prediction checks. This is repeated scaffold-content weakness, not a one-off lexical reason issue.
- Counterexample and boundary:
  - The second model reason was adequate (`High reward scaling but risky at low hp.`), so the evidence does not establish that the template weakness caused a bad decision or that a presentation-only wording patch would help.
  - The defect is `candidate_shaping`; it cannot enter the facts/order-preserving presentation overlay path or be relabeled to start P9-G3.
- Minimum next step:
  - retain the two records as scoped counterexample/review evidence;
  - defer any candidate-template/generation proposal until a later qualified candidate-shaping experiment path exists with stronger causal and counterexample evidence.

### `environment_scoped_evidence_missing`

- Status: `in_progress`
- Problem:
  - Fresh transitions now carry read-only `EnvironmentFingerprint` and `EvidenceEnvironmentScope`; verified exact-organic baseline captures exist, but no verified complete-scope baseline/overlay pair exists.
  - Slay the Spire 2 Early Access updates can invalidate mechanics, content, serialization, and mod assumptions.
- Why it matters:
  - P9 could promote stale knowledge or skills and then self-reinforce them under a different environment.
- Remaining fix before P9-G3:
  - repeat verified game build/channel, content/mod, adapter, fact snapshot, revision, provenance, and provider-experiment fingerprint fields in organic paired evidence;
  - implement P9 exact-identity applicability: only exact complete fingerprint equality may support a first narrow policy, with no inferred compatibility before P12;
  - preserve historical evidence but block missing or unknown **scope**, and unsupported/quarantined/degraded applicability, from structural promotion evidence; P9 exact identity may still carry compatibility as `not_evaluated_pre_p12` rather than infer it;
  - add future invalidation/revalidation fields to learned objects.

## High

### `controller_owns_too_many_concerns`

- Status: `open`
- Evidence:
  - [controller.ts](../../src/agent/controller.ts#L292)
- Problem:
  - Live additive prompt shaping, provider call, validation, memory side-effects, execution, and recording remain in one orchestration file.
- Risk:
  - P9 learning hooks will further tangle live, shadow, memory, and rollout behavior.
- Minimum fix:
  - first repair and test selection-resolution provenance in place;
  - then extract a narrow `LiveDecisionGateway` only if it can preserve the new resolution/authority contract without changing prompt, provider, validation, execution, or whitelist behavior.

### `manifest_and_stable_store_corruption_can_be_silent`

- Status: `open`
- Evidence:
  - [experimentManifest.ts](../../src/learning/experimentManifest.ts#L181)
  - [utils.ts](../../src/agent/utils.ts#L15)
  - [memory.ts](../../src/agent/memory.ts#L143)
- Problem:
  - Malformed experiment-manifest JSONL lines are silently skipped. Generic stable-state reads fall back to defaults on any read or parse error.
  - Legacy finalize remains explicitly gateable and can write long-term memory, experience, and strategy outside the future P9 policy store.
- Why it matters:
  - Future learned policy evidence could disappear from view or be overwritten after a corruption event. A changed legacy stable store could contaminate a promotion/evaluation window without an explicit digest/invalidation record.
- Minimum fix:
  - P9-G2 must expose malformed manifest diagnostics and record legacy-store digests in experiment evidence;
  - P9-G3 must fail closed and quarantine learned-policy state on parse/digest failure;
  - P10-A must use an immutable, idempotent policy event lifecycle and retain legacy read compatibility without treating legacy data as P9 promotion state.

### `authority_telemetry_not_authority_enforcement`

- Status: `open`
- Evidence:
  - [decisionAuthority.ts](../../src/agent/decisionAuthority.ts#L11)
  - [controller.ts](../../src/agent/controller.ts#L270)
- Problem:
  - Authority mode is currently recorded from configuration, while controller routing still permits local scaffold selection and only labels it `unclassified_local_scaffold`.
- Why it matters:
  - The project can incorrectly claim LLM-primary strategic authority from provider/live configuration while local selection remains a material execution path.
- Minimum fix:
  - P9-G2 repairs truthful selection telemetry only;
  - P10-A defines an `AuthorityPolicy` for evidence eligibility and impact reporting;
  - P14 remains responsible for qualified skill delegation. No routing change is authorized by this debt entry alone.

### `budget_and_recovery_governance_still_p8_local`

- Status: `in_progress`
- Evidence:
  - [BUDGET_GOVERNANCE.md](../../BUDGET_GOVERNANCE.md#L58)
  - [llm.ts](../../src/agent/llm.ts#L1)
- Problem:
  - Budget language is now clearer than current implementation: current code is mostly Stage 0 guard + telemetry, not Budget OS.
  - Recovery policy, cap failure attribution, and readiness policy are still partly P8 workspace/shadow semantics.
  - Current fixed caps are provider-profile defaults, not a mature per-class deliberation profile system.
- Current state:
  - `BUDGET_GOVERNANCE.md` now distinguishes fixed call caps, cap-exhaustion failure classes, accounting vs authorization, recovery policy direction, circuit breakers, P9 proposal-only budget work, and future P11B compute/provider orchestration.
- Minimum fix:
  - add provider cap-failure classification as telemetry
  - add `BudgetUseRecord` / `BudgetProfile` / `BudgetPolicyProposal` schema-only surfaces before any adaptive budget behavior
  - keep dynamic budget/profile selection deferred to P11B guarded promotion

### `reason_quality_detector_overfit_risk`

- Status: `accepted_for_later`
- Evidence:
  - replay quality summaries and `missing_tradeoff` heavy logic
- Problem:
  - Review signals are useful alarms, but they are still shallow enough to be gamed by phrasing.
- Rule:
  - keep as review/eval signal, not validation truth

### `class_whitelist_ossification_risk`

- Status: `open`
- Problem:
  - The project can drift into a permanent class-by-class manual tuning workflow.
- Minimum fix:
  - make classification and scaffold policy proposal-driven in P9
  - keep decision classes as hard-shell routing/audit labels rather than permanent definitions of inner thought
  - require authority-impact review before classification/routing proposals can ever become executable

### `prediction_error_precision_overclaim_risk`

- Status: `in_progress`
- Problem:
  - Slay the Spire failures are often delayed and multi-step, so exact causal attribution will often be false confidence.
- Minimum fix:
  - start with weak attribution fields such as `suspectedCause`, `confidence`, `counterexampleNeeded`, and `alternativeHypotheses`
- Current state:
  - typed proposal records already carry weak-attribution fields
  - P9.2 proposal seed generation now derives cautious repair hypotheses from prediction errors and review telemetry
  - generated seeds remain draft or pending-review evidence only and cannot apply or promote
- Remaining risk:
  - the current generator is still a heuristic seed surface, not a validated causal attribution engine
  - P9.5A/P9.5B can compare bounded low-risk overlays and evaluate same-slice pairs. P9.5C has one real cloned-packet organic combat pair with matched provider profile, but no proposal can be marked `shadow_validated` or influence future decisions yet.
  - Future pairs also need explicit environment compatibility and proposal authority-impact review before they can support P9.6.

### `shadow_applicator_validation_missing`

- Status: `in_progress`
- Current state:
  - P9.5A has a deliberately narrow offline applicator for explicit low-risk reason/candidate-future guidance.
  - It uses a cloned `DeliberationPacket`, emits baseline/overlay prompt metadata, makes no provider call, and writes no run artifact.
  - It rejects missing replay candidates, unknown future ids, ineligible evidence, unsupported policy families, and non-low-risk proposals.
  - P9.5B now evaluates supplied same-slice pairs for evidence-scope and candidate/fact invariants, matched provider profile, provider/output-cap failure, and reason-quality regression.
  - P9.5C can obtain one overlay outcome with the recorded ablation/provider profile while remaining fully outside game/live/runtime/stable paths. Reason-policy overlays now require a structured review trigger, so an adequate baseline cannot be used to widen a one-case prompt repair.
- Remaining risk:
  - Prompt change and one clean paired outcome are not strategic improvement.
  - Counterexample review remains incomplete; one scope-bound clean pair and a reason detector improvement are not strategic improvement. A second matching sample diverged through provider recovery and is recorded as incomplete. Decision-authority records, environment scope, explicit status-transition rules, and rollback/retrieval design remain required before any P9.6 promotion ledger is designed.

### `proposal_vagueness_risk`

- Status: `closed`
- Problem:
  - LLM-generated proposals can easily collapse into non-actionable advice.
- Resolution:
  - require evidence, scope, counterexample handling, risk, expected effect, promotion criteria, and rollback before non-draft status

## Medium

### `console_fixture_pollution_risk`

- Status: `mitigated`
- Problem:
  - Console-assisted runs are useful for reproduction but must stay out of stable learning evidence.
- Current state:
  - `EvidenceSliceReader` now reports promotion provenance eligibility separately from general replay visibility.
  - Console/debug/fixture, human-observed, snapshot-only, and unknown-provenance transitions remain visible, but are counted as promotion-excluded evidence.
  - P9.2 proposal seed generation excludes those ineligible transitions by default and reports excluded counts.
  - `--include-ineligible-evidence` is debug-only inspection and does not make excluded evidence promotion-ready.
- Remaining risk:
  - Future P9 promotion code must enforce this boundary again instead of reinterpreting raw latest windows.

### `run_modes_explainer_missing`

- Status: `closed`
- Problem:
  - Shadow, bridge, explicit whitelist live, and wildcard forbidden modes are not explained in one concise operator doc.
 - Resolution:
   - `docs/runbooks/LLM_RUN_MODES.md`

### `current_status_too_long`

- Status: `closed`
- Problem:
  - `docs/04_CURRENT_STATUS.md` grew into a long narrative.
- Minimum fix:
  - keep it short and link out to phase docs and debug history

## Low

### `old_docs_still_too_visible`

- Status: `in_progress`
- Problem:
  - Legacy redirect docs and old strategy notes are too close to active docs.
- Fix:
  - move them under `docs/archive/legacy/` and keep redirect stubs

## Comprehensive Audit Overlay

The detailed audit adds broader debt IDs beyond this compact register, including:

- `D-014` controller boundary / orchestration debt
- `D-015` optional LiveDecisionGateway boundary debt
- `D-020` candidate generation and scoring maintainability debt
- `D-021` cognitiveScaffold responsibility creep debt
- `D-022` mechanics-engine / deterministic prediction debt
- `D-023` Game IO / event log / human recorder debt
- `D-024` replay/eval benchmark maturity debt
- `D-025` test coverage and CI/check debt
- `D-026` adapter/capability boundary debt
- `D-027` secrets/runtime artifact hygiene debt
- `D-028` Context OS long-term debt
- `D-029` Budget OS long-term debt
- `D-030` team workflow / ADR / PR governance debt

Keep this file as the compact active debt register. Use the comprehensive audit for repair sequencing and phase classification.
