# Data Schema

This document defines the durable data model. Current code keeps legacy `CollectedStateRecord` and `DecisionLogEntry` compatible while writing Phase 2 agent transitions for real executed actions. The North Star direction is to make transitions carry not only actions and diffs, but also the cognitive scaffold that produced the decision.

Current code paths:

- `src/domain/types.ts`: shared domain contracts.
- `src/data/transitionSchema.ts`: transition helpers and ground-truth invariant checks.
- `src/agent/decisionRecorder.ts`: `AgentDecisionRecorder` writes executor-logged agent transitions.
- `src/replay/reader.ts`: reads transition JSONL and builds timeline summaries.
- `src/replay/cli.ts`: `npm run data:replay -- <runId-or-run-dir>` prints a transition timeline.
- `src/eval/runner.ts`: runs offline engineering checks over saved runs.
- `src/eval/cli.ts`: `npm run data:eval -- --latest|--run-id <runId>|--run-dir <path>`.

## Run Directory

Agent run data lives under:

```text
data/runs/<runId>/
  metadata.json
  snapshots/
  events.jsonl
  transitions.jsonl
  replay.json
  review.json          # future
  rewards.json         # future
  experiment_refs.json # future
```

`memory/collected/` remains compatible for existing snapshot collection.

## Transition Record

Each key decision should be recorded as a transition:

```ts
interface TransitionRecord {
  schemaVersion: number;
  runId: string;
  transitionId: string;
  source: "agent" | "human" | "game" | "replay";
  captureMode: "executor_logged" | "mcp_event" | "diff_inferred" | "snapshot_only";
  isGroundTruth: boolean;
  confidence: number;
  uncertainty: string[];
  candidateActions: unknown[];
  inferenceReason?: string;
  tick: number;
  timestamp: string;
  screen: string;
  floor?: number;
  hp?: number;
  maxHp?: number;
  gold?: number;
  preStateRef: string;
  postStateRef?: string;
  rawStatePath?: string;
  compactState?: unknown;
  preState?: unknown;
  postState?: unknown;
  compactPreState: unknown;
  compactPostState?: unknown;
  legalActions: unknown[];
  selectedAction: unknown | null;
  localScores?: unknown;
  llmDecision?: unknown;
  decisionAudit?: unknown;
  derivedSnapshot?: unknown;
  memorySnapshot?: unknown;
  strategicImpression?: unknown;
  salienceSignals?: unknown[];
  memoryActivation?: unknown;
  candidateFutures?: unknown[];
  deliberationPacket?: unknown;
  promptParity?: unknown;
  workspaceComparison?: unknown;
  shadowWorkspaceDecision?: unknown;
  selectedPlan?: unknown;
  predictionError?: unknown;
  replayFrame?: unknown;
  consolidation?: unknown;
  executionResult?: unknown;
  stateDiff?: unknown;
  rawRefs: string[];
}
```

North Star cognitive fields are optional for compatibility:

- `strategicImpression`: first-pass strategic read of the state, not a generic summary.
- `salienceSignals`: danger, opportunity, uncertainty, memory resonance, irreversible choice, repeated failure, resource pressure, or strategy-quality signals.
- `memoryActivation`: memories retrieved for this decision, with relevance, confidence, evidence, conditions, and omissions.
- `candidateFutures`: candidate plans with predicted outcomes, costs, risks, assumptions, invalidation triggers, and execution requirements.
- `deliberationPacket`: compact strategic package shown to the LLM.
- `promptParity`: coverage metadata comparing current legacy prompt inputs with the shadow packet.
- `workspaceComparison`: P8 shadow comparison between the legacy prompt and the structured DeliberationPacket workspace.
- `shadowWorkspaceDecision`: optional P8 shadow LLM decision audit; recorded only, never executed.
- `selectedPlan`: the chosen candidate future or plan-level decision.
- `predictionError`: post-hoc record of what was predicted, what happened, and which layer likely needs repair.
- `replayFrame`: replay-oriented view used for attribution and review.
- `consolidation`: controlled learning/update proposal with evidence and rollback.

These fields should be populated gradually. Their absence in older transitions is valid; their presence must not weaken ground-truth rules.

Phase 3.0 shadow-mode writer:

- `src/agent/cognitiveScaffold.ts` builds `StrategicImpression`, `SalienceSignal[]`, `MemoryActivation`, `CandidateFuture[]`, and a shadow `DeliberationPacket`.
- `AgentController` constructs these objects after existing candidate scoring.
- `AgentDecisionRecorder` writes them to new executor-logged transitions.
- These objects are recording-only. They do not change prompt construction, candidate ordering, fallback selection, action validation, or execution.
- Initial `CandidateFuture` records are explicitly action-first/shallow futures. They wrap existing scored candidates with plan, score/confidence, risks, assumptions, invalidation triggers, and coarse predicted outcomes.
- New `CandidateFuture` records also include `predictionChecks`, a typed shadow check list generated beside `predictedOutcome`.

Phase 3.1/P1 shadow DeliberationPacket:

- `DeliberationPacket` now records structured prompt-adjacent sections: state facts, enemy intent, hand summary, deck summary, legal actions, top candidates, run memory summary, derived knowledge summary, output schema, prompt parity, and the existing strategic/salience/memory/candidate-future objects.
- `promptParity` records which live-prompt sections are represented in the shadow packet and which are still missing. It stores coverage metadata, not the full prompt text.
- `predictionError` records a minimal post-action prediction check against checkpoint/state-diff evidence. It is intentionally conservative: unsupported or unmeasurable predictions become unknown/open rather than guessed.
- These fields are still shadow-only. They do not replace `src/agent/prompt.ts`, alter LLM prompts, alter candidate ordering, or alter action selection.

P2 shadow derived/parity refinement:

- `src/agent/derivedKnowledge.ts` retrieves a small read-only subset from `derived/card-tags.json`, `derived/relic-tags.json`, `derived/synergy-rules.json`, and `derived/draft-rules.md`.
- New transitions receive a non-empty `derivedSnapshot` when relevant local derived rules exist.
- `DeliberationPacket.derivedKnowledgeSummary` reflects whether derived knowledge was present and how many facts/rules were included.
- `promptParity.missingSections` should no longer include `derived_knowledge` on fresh transitions when derived retrieval succeeds.
- `PredictionErrorRecord.evidence[0].attribution` now separates damage, defense, hp, card flow, phase, and resource signals from checkpoint/state-diff evidence.
- Replay/eval/review now expose `derivedSnapshot` and `derivedKnowledgeSummary` coverage directly, instead of requiring readers to infer derived coverage only from `promptParity.missingSections`.

P3/P4/P5 shadow object refinement:

- `PredictionErrorRecord.evidence[0].typedChecks` now stores typed checks such as `block_delta`, `enemy_hp_or_block_delta`, `card_removed_from_hand`, `phase_or_turn_change`, and `phase_or_visible_progress`.
- `PredictionErrorRecord` now prefers `CandidateFuture.predictionChecks` over text-derived checks when they are present. Text `predictedOutcome` remains for compatibility and human readability.
- New executor-logged transitions receive a `ReplayFrame` MVP that binds the transition id, state summary, selected action, state diff, cognitive scaffold, prompt parity, and prediction error.
- Unsupported or partially unknown prediction errors can produce a shadow-only `ConsolidationRecord` proposal. These proposals include rollback text and conditions, and they do not mutate memory, derived knowledge, candidate templates, or strategy params.
- Offline eval parses `events.jsonl` and reports `parsedEvents`. Empty event logs are valid with current STS2MCP capabilities; malformed event JSONL is a program-level eval error.

P6 typed attribution refinement:

- `PredictionErrorRecord.attributionBuckets` summarizes typed prediction checks into damage, defense, HP, kill, phase, card-flow, resource, route/reward, or unknown buckets.
- Buckets include status, prediction types, expected evidence, actual checkpoint evidence, evidence reasons, and severity.
- `CandidateFuture.predictionChecks.expected` can include mechanics-informed expectations such as card index removal, target id, expected damage/block, expected HP loss, expected energy cost, route progress, and reward-flow progress.
- New checkpoint diffs can include `enemyDeltas`, which let replay/eval compare damage and kill predictions against post-action state instead of only checking broad checkpoint reason names.
- Buckets are shadow evidence for replay/eval/review. They do not apply stable memory, derived knowledge, candidate template, or strategy-param updates by themselves.

P7 consolidation proposal lifecycle MVP:

- `ConsolidationRecord` proposals can carry `affectedModule`, `proposedChange`, `expiry`, `revalidation`, `createdAt`, `proposalKind`, `evidenceStrength`, and `blockedStableTargets`.
- Fresh runs create `data/runs/<runId>/proposals.jsonl` as the P7 proposal surface. It is append-only proposal evidence, not a stable learning store.
- Replay/eval can fall back to transition-level `consolidation` objects for older runs that do not have `proposals.jsonl`.
- Proposals are generated from unsupported or critical `PredictionErrorRecord.attributionBuckets`. Low-visibility `unknown` attribution remains an evidence gap unless later evidence supports it.
- Lifecycle status supports `proposed`, `accepted`, `rejected`, `expired`, `reverted`, plus legacy `rolled_back` for old data compatibility.
- Proposal lifecycle metadata is review/eval evidence only until a later guarded applicator exists.
- P7 proposals explicitly block automatic writes to memory, derived knowledge, strategy params, candidate ordering, and prompt behavior.

P7.5 consolidation proposal aggregation:

- Replay/eval/review derive grouped proposal evidence from `proposals.jsonl` or transition-level consolidation fallback.
- Aggregation groups proposals by target layer, proposed action, and actionable attribution bucket. It tracks occurrences, sample transitions, evidence strength, confidence, blocked stable targets, allowed next review steps, and forbidden stable mutations.
- Repeated weak evidence can be surfaced as a moderate review signal inside the aggregated view, but this is still shadow-only evidence. It does not write memory, derived knowledge, strategy params, candidate ordering, prompt behavior, fallback, validation, or execution.
- Aggregation exists to help reviewers decide which fixture, attribution, or CandidateFuture mechanics work to do next. It is not a stable learning applicator.

P9 guarded learning direction:

- Current `ConsolidationRecord` is sufficient for P7 proposal evidence but not yet sufficient for P9 stable learning.
- P9 now introduces a typed `LearningProposal` schema and append-only pending proposal store surface. This is P9.1 read-only infrastructure, not stable learning.
- `LearningProposal` families include memory, derived knowledge, candidate template, reason policy, budget/compression policy, classification policy, skill policy, and scaffold policy.
- Learning proposal records preserve:
  - evidence
  - counterexample handling
  - scope
  - confidence
  - promotion criteria
  - rollback plan
  - protected-path impact
- Learning proposals also carry weak-attribution fields: `suspectedCause`, `confidence`, `counterexampleNeeded`, and `alternativeHypotheses`.
- The append-only pending store is `data/runs/<runId>/learning-proposals.jsonl`. It is a run artifact and not a stable learning store.
- Proposal validation is intentionally conservative. Vague proposals without concrete evidence, scope, counterexamples, expected effect, validation plan, rollback, classified behavior impact, and exact organic environment scope are kept as `draft` or `rejected` rather than actionable pending proposals. Read paths revalidate historical JSONL records without rewriting them, so an old `pending_review` label cannot bypass a newer safety requirement.
- Proposal evidence records also preserve an observed `evidenceRole`. Exact organic environment scope alone is not an LLM-learning claim: `local_fallback_observation`, `local_scaffold_observation`, and `local_mechanical_observation` remain visible as draft-only observations. Only `llm_selected_execution` or `workspace_shadow_provider` evidence may seed future actionable review, and neither role enables promotion.
- P9.1 also has an append-only review-decision ledger at `data/runs/<runId>/learning-proposal-review-decisions.jsonl`.
- Review-decision records preserve:
  - `proposalId`
  - `decision` (`approve`, `reject`, or `expire`)
  - `reviewer`
  - `notes`
  - proposal status/actionability snapshot
  - `reviewScope="audit_only"`
  - `proposalMutationEnabled=false`
  - `applyPathEnabled=false`
  - `stablePromotionEnabled=false`
- The review-decision ledger records human/system audit judgment only. It does not mutate the proposal, apply the patch, promote stable policy, or change live/runtime behavior.
- P9 also introduces `ReverseScaffoldFeedback` as telemetry/proposal-seed material. It records target scaffold layer, omitted or misleading information, evidence, confidence, risk, and proposal seed links.
- Reverse feedback is stored in `data/runs/<runId>/reverse-scaffold-feedback.jsonl`. It does not change prompts, budgets, candidate generation, validation, execution, live rollout, memory, derived knowledge, strategy, skills, or scaffold policy.
- P9.2 adds weak-attribution proposal seed generation from existing replay/review evidence. Generated seeds can come from prediction errors, candidate-future review signals, cue attribution, reason-quality notes, and budget cap-exhaustion telemetry.
- Proposal seed generation is evidence-slice aware. By default, console/debug/fixture, human-observed, snapshot-only, or unknown-provenance transitions are excluded from generation. Exclusions are reported through `consideredTransitions`, `excludedTransitions`, and `exclusionReasonCounts`.
- `npm run learning:proposals -- generate --latest` is dry-run by default. `--write` explicitly appends generated records to the run-local `learning-proposals.jsonl` and `reverse-scaffold-feedback.jsonl` stores, with duplicate ids skipped.
- `--include-ineligible-evidence` exists for debugging only. It may show what a proposal seed would look like from excluded evidence, but it must not be treated as promotion-ready learning evidence.
- Generated proposal seeds are conservative. They carry `suspectedCause`, confidence, counterexample requirements, alternative hypotheses, scoped evidence, expected effect, validation plan, protected-path impact, and rollback text. Incomplete or smoke-alarm-only evidence remains `draft`.
- `LearningProposal`, review-decision ledger, generated proposal seeds, and `ReverseScaffoldFeedback` records remain non-executable against live/runtime or stable stores. P9.5A adds only offline shadow-workspace assembly for a narrow subset of proposals.
- `LearningProposalShadowOverlayPlan` reports whether a proposal is eligible for an *offline* shadow comparison. Eligibility requires actionable `pending_review` status, `riskLevel="low"`, organic promotion-eligible evidence, and an explicit bounded `proposedPatch.shadowOverlay` shape. It does not imply approval, promotion, or runtime applicability.
- `P9ShadowWorkspaceOverlay` is an optional, in-memory `DeliberationPacket` field created only by `p9_shadow_workspace_applicator_v1`. It carries reason or candidate-future guidance into a cloned offline workspace packet. The normal scaffold builder does not create it; no provider call, transition write, candidate reorder, validation/execution change, or stable mutation is permitted.
- `npm run learning:proposals -- shadow-compare --latest --id <proposalId> --transition-id <transitionId>` emits baseline versus overlay prompt hashes/bytes for one replayable packet. It refuses to synthesize missing candidates or unknown candidate-future ids, and reports `wouldCallProvider=false`, `wouldWriteRunArtifact=false`, `wouldAffectLiveBehavior=false`, `wouldAffectRuntimeDecision=false`, and `stablePromotionEnabled=false`.
- P9.5B defines a read-only `p9_shadow_workspace_evaluation` surface for a paired baseline/overlay shadow outcome. The pair must share transition id, revision tag, budget window, provider profile (`output`, thinking mode, response mode, retry count), allowed-candidate hash, candidate-future-facts hash, and their respective baseline/overlay prompt hashes. It records reason-quality smoke alarms, provider/output-cap failures, and candidate agreement without treating different valid choices as an automatic regression.
- P9.5C may obtain the overlay side with a one-call cloned-packet provider run. Its `same_slice_shadow` outcome uses the same schema fields, but does not create a transition, write proposal state, or permit any live/stable behavior.
- `LearningExperimentManifest` is the append-only G2 audit record at `data/runs/<runId>/learning-experiment-manifests.jsonl`. It binds one proposal, recorded baseline, optional same-slice overlay, evaluation, authority chain, environment fingerprint/scope, observed baseline/overlay evidence roles, and invariant results. `shadow-run` preflight requires a called workspace-shadow baseline; a declared authority mode alone is insufficient. It may be emitted by `shadow-run` and is written only with explicit `--record-manifest`; it is not a promotion ledger and never changes proposal status.
- `ShadowWorkspaceOutcomeEvidence.providerAttempts` optionally records observed primary/rescue attempt details. `provider_profile_mismatch` distinguishes provider recovery divergence from candidate/fact invariants or policy evaluation; such a pair is incomplete.
- `reason_policy` overlays additionally require a structured `requiredReasonQualityNote` precondition in `proposedPatch.shadowOverlay`; P9.5C supplies recorded baseline review notes and rejects out-of-scope packets instead of applying a class-wide reason rule.
- A `paired_evidence_ready_for_review` evaluation means only that the supplied pair passed structural and provider-contract checks. It never changes proposal status, never sets `shadow_validated`, and never authorizes stable promotion. A missing overlay outcome, a changed candidate/fact invariant, or a reason/provider regression remains `incomplete` or `regression_detected`.

P8 DeliberationPacket strategic workspace shadow surface:

- `src/agent/workspace.ts` serializes the existing `DeliberationPacket` into a compact structured LLM workspace.
- `workspaceComparison` records:
  - `phase="P8"` and `mode="shadow"`
  - feature flag state
  - legacy and structured prompt hashes
  - byte and token estimates
  - decision class
  - covered/missing packet sections
  - structured workspace section coverage
  - required, preserved, and missing legacy-information sections
  - per-section token estimates
  - information-preservation score
  - v5 workspace-size telemetry: compression mode, candidate-futures bytes/tokens before vs after, full workspace bytes/tokens before vs after, futures truncated/omitted, truncated-field counts, largest field sources, repeated-text estimate, and information-preservation estimate
  - CandidateFuture quality review telemetry:
    - `candidateFutureCompleteness`: counts of serialized futures that still expose core tactical facts, benefit/cost, risk or uncertainty, assumption or invalidation, prediction-check trace, and at least one core tradeoff
      - `withCoreTacticalFacts` may come from explicit structured fields or from action-specific plan/outcome wording when the serialized future still carries concrete tactical detail in text form
    - `candidateFutureReviewSignals`: review-only counts such as `shallow_candidate_future`, `missing_survival_line`, `missing_lethal_line`, `missing_resource_tradeoff`, `missing_card_reward_direction`, and `missing_future_risk`
    - `candidateFutureProposalSignals`: proposal-only review signals such as `candidate_template_improvement_proposal`, `combat_reason_policy_proposal`, `budget_policy_proposal`, `context_feature_proposal`, and `prediction_check_improvement_proposal`
    - `candidateFutureCueAttribution`: source attribution for quality cues such as survival line, lethal line, resource tradeoff, future risk, card-reward direction, route risk, and general tradeoff. It records whether each cue existed in the original `CandidateFuture` set and whether it survived serialization, with source buckets such as `candidate_future_missing`, `compression_lost`, and `serialization_preserved`.
      - high-pressure combat bounded serialization may include a short serialized-only `survivalLine` field when the original future already contains survival/block/incoming/mitigation cues. This does not add a new stable `CandidateFuture` domain field.
  - token/call/cost/timeout budget status
  - gated readiness and readiness reasons
  - provider readiness: `ready_for_shadow_call`, `needs_api_key`, or `not_ready`
  - P8.4/P8.5 rollout-gate metadata for future additive live experiments
- `shadowWorkspaceDecision` records:
  - whether shadow workspace evaluation was enabled, attempted, and called
  - whether an LLM bridge was available
  - provider/model identity when known
  - estimated/actual tokens, max output tokens, latency, estimated cost, and budget status when available
  - outcome: not enabled, not ready, skipped, unavailable, valid, invalid output, invalid choice, or error
  - agreement/disagreement/missing-candidate against the live selected candidate
  - reason quality when a structured shadow LLM decision exists
  - short P8 schema fields: `selectedCandidateId`, `confidence`, `reasonBrief`, `riskTags`, `missingInfo`, and `scaffoldFeedback`
  - `reasonCueAttribution`: model-output attribution for the same quality cues when a shadow LLM reason is available. It helps distinguish `model_reason_omitted` from scaffold/compression loss. This remains telemetry only and does not change validation.
  - `protectedPathAttemptedWrites`: protected-path governance telemetry for provider-originated stable-write intent targets that were observed on a live LLM decision, such as `memory` or `strategy_params`
  - `protectedPathBlockedWrites`: protected-path governance telemetry for blocked live/provider-originated write attempts such as memory updates or strategy-parameter suggestions that are denied by default
    - The current protected stable-write target vocabulary is `memory`, `derived_knowledge`, `strategy_params`, `skills`, `prompt_policy`, `budget_policy`, `candidate_templates`, `classification_policy`, and `scaffold_policy`.
    - This vocabulary is an audit and gate surface only. It does not enable stable learning, proposal application, wildcard live, or provider-controlled mutation of future decisions.
- `memory/legacy-finalize-audit.jsonl` records legacy finalize-run learning attempts:
  - `learningMode=legacy_local_learning`
  - `proposalPromotion=false`
  - `stablePromotion=false`
  - `attemptedStableWriteTargets`
  - `protectedStableWriteTargets`
  - `blockedStableWrites` plus blocked/applied target lists
  - This audit stream is not a P9 proposal ledger and must not be used as stable-promotion proof.
- `STS2_P8_WORKSPACE_ABLATION_MODE=full_bounded_candidate_futures` is a new v5 shadow-only experiment. It keeps `full` unchanged as the control group and only applies bounded serialization to combat `candidate_futures`.
- CandidateFuture completeness and missing/shallow signals are review/eval telemetry only. They do not change validation, candidate generation, fallback, execution, stable memory, derived knowledge, or strategy params.
- Future proposal families such as `CombatReasonPolicy`, `CandidateTemplate`, or `BudgetPolicy` are inner-scaffold policy candidates only. They must begin as replay/eval/review evidence, remain shadow/proposal-only until fresh validation exists, and may not mutate validation, execution legality, live rollout flags, rollback authority, or fact/memory/derived separation.
- DeepSeek V4 Flash is prepared as the preferred P8 external provider, but real calls require `STS2_DEEPSEEK_API_KEY` and explicit flags. Missing credentials must produce skipped/unavailable observability, not fake model output.
- `STS2_P8_WORKSPACE_SHADOW` defaults off; `STS2_P8_WORKSPACE_CALL` defaults off. Fresh transitions still record the comparison surface with both flags off.
- Budget guard skips use reasons such as `token_budget_exceeded`, `call_budget_exceeded`, `cost_budget_exceeded`, or `timeout`. They are review/eval signals, not selected-action failures.
- These current fields mostly describe workspace-call budget. Future schema evolution should distinguish call budget, recovery budget, run budget, evidence budget, rollout budget, and protected-path budget without weakening compatibility. See `BUDGET_GOVERNANCE.md`.
- `DeliberationWorkspaceBudget.governanceProfile` and `governancePolicy` are the first BG-1/BG-2 schema anchors. They record the budget profile plus call, recovery, run, evidence, rollout, and protected-path budget interpretation. They are observability/governance metadata and must not change candidate generation, scoring, fallback, validation, execution, stable memory, derived knowledge, or strategy params by themselves.
- `ShadowWorkspaceDecision.providerRecoveryPolicyName` and `providerRecoveryPolicy` are the first BG-3 recovery-policy anchors. They summarize existing provider attempts, rescue cap relationships, primary/rescue thinking modes, terminal attempt state, and recovery outcome; they do not change retry behavior, semantic validation, workspace compression, or candidate choice.
- `P8LiveReadinessAssessment.evidenceBudget` is the first BG-4 evidence-budget anchor. It explains fresh sample sufficiency and mixed-window promotion risk without changing the underlying readiness status.
- `P8LiveReadinessAssessment.rolloutBudget` is the first BG-5/BG-6 rollout/protected-path anchor. It records explicit live-flag, human-authorization, rollback, structured-prompt-only, and stable-write constraints without enabling any protected path.
- Field names such as `promotionUseAllowed` and `promotionAllowedByBudget` are local evidence/readiness flags. They do not authorize stable promotion, stable learning, provider-controlled budget changes, wildcard live, or protected-path writes.
- Current fixed values such as `maxOutputTokens`, rescue output caps, timeout, retry limit, and thinking mode are provider-profile defaults. They are not universal budget strategy and should eventually be represented by explicit `BudgetProfile` / `DeliberationProfile` objects.
- Future budget schema should separate:
  - accounting records such as estimated/actual tokens, cost, latency, finish reason, cap hit, retry lineage, profile identity, and validation result
  - authorization records such as skip, stop, retry, human-review, rollout, and protected-path decisions
- Future cap-failure attribution should distinguish buckets such as `output_cap_hit_with_partial`, `reasoning_budget_exhausted_no_visible_output`, `truncation_likely_empty`, `rescue_cap_insufficient`, `context_window_pressure`, `schema_or_prompt_contract_too_large`, `invalid_json_not_length`, `invalid_choice_not_budget`, `provider_timeout`, and `provider_rate_limit`.
- P9 may introduce `BudgetPolicyProposal` schema/proposal-only records. Those records must not apply budget changes by themselves. Learned compute/provider orchestration belongs to P11B after proposal review, shadow validation, stable-promotion gates, rollback, and P11A context-lineage baselines exist. Existing runtime/report fields that defer this work to `P13` preserve a historical roadmap label; they do not authorize P13 behavior or require an immediate schema migration.
- Replay/eval/review may also derive a `liveAppliedRollout` summary from transition-level LLM audit fields. This is not a stored transition object; it is a report-layer aggregation over `liveAdditiveApplied`, `chosenBy`, provider source, prompt mode, and live invalid/error/missing-candidate signals.
- Replay/eval/review may also derive a `budgetGovernance` summary from `workspaceComparison.budget.governancePolicy` and `shadowWorkspaceDecision.providerRecoveryPolicy`. This is not a stored transition object. It is a report-layer aggregation that keeps call, recovery, run, evidence, rollout, and protected-path budget interpretation visible side by side.
- Live LLM audit may include P8.5 additive prompt fields when a manually authorized live window is run:
  - `promptMode`: `legacy_only` or `additive_legacy_prompt_plus_compact_workspace_summary`
  - `liveAdditiveEnabled`
  - `liveAdditiveApplied`
  - `liveAdditiveDecisionClass`
  - `liveAdditiveWhitelist`
  - `liveAdditiveSummaryBytes`
  These fields explain whether compact P8 workspace context was appended to the live LLM prompt. They do not change candidate generation, scoring, fallback, validation, execution, stable memory, derived knowledge, or strategy params.
- P8 fields are observability data. They do not replace `src/agent/prompt.ts`, alter action selection, change candidate generation/order/scoring, change fallback, change validation/execution, or write stable memory/derived/strategy updates.

Protected-path governance note:

- Runtime memory audit may now include `memory/legacy-finalize-audit.jsonl` for blocked legacy stable-write attempts.
- This file is local runtime audit evidence, not a stable learning store and not a promotion ledger.

## P9-G2 Decision Authority Records

Fresh executor-logged transitions now carry an audit-only `DecisionAuthorizationRecord`. Old transitions remain readable and report `not_recorded`; their historical `chosenBy` value must not be reconstructed as a complete authority chain.

The recorder derives the actor chain from current route, LLM audit, fallback, and executor facts. Product `authorityMode` is deliberately **not** inferred from provider, whitelist, or `chosenBy`; it is `unknown` until explicitly set through `STS2_DECISION_AUTHORITY_MODE`.

```ts
type DecisionAuthorityMode =
  | "llm_primary"
  | "llm_full_control"
  | "local_shadow"
  | "local_autonomy_experimental"
  | "unknown";

type DecisionAuthorityLevel =
  | "mechanical_execution"
  | "deterministic_bounded_skill"
  | "qualified_delegated_skill"
  | "long_horizon_strategy"
  | "unclassified_local_scaffold"
  | "unknown";

interface DecisionAuthorizationRecord {
  schemaVersion: number;
  authorityMode: DecisionAuthorityMode;
  authorityLevel: DecisionAuthorityLevel;
  deliberationOwner: string;
  selectionSource: string;
  authorizationSource: string;
  executionSource: string;
  planOrigin?: string;
  delegatedSkillId?: string;
  fallbackOrEscalationReason?: string;
  notes: string[];
}
```

`unclassified_local_scaffold` is an explicit non-claim: a local score/fallback may have selected an action, but it is not thereby a qualified skill or a transfer of long-horizon strategic authority.

Fresh `LearningProposal` records also require:

```ts
type ProposalBehaviorImpact =
  | "presentation_only"
  | "deliberation_shaping"
  | "candidate_shaping"
  | "authority_shaping"
  | "action_shaping"
  | "hard_shell"
  | "unclassified";
```

Historical proposals without this field remain readable as `unclassified`, but cannot become actionable pending review. P9-G2 cloned shadow overlays accept only explicit low-risk `presentation_only` proposals. A `candidate_template` overlay is permitted only as a presentation projection over existing CandidateFuture facts: it may add bounded guidance and reference existing future ids, but cannot add, remove, reorder, or alter candidates/facts. Actual candidate-template/generation changes remain `candidate_shaping`. The first P9-G3 stable path may consider only `presentation_only`; other values remain review/shadow labels until later governance explicitly authorizes them.

`ActionExplanationRecord` should summarize selected plan, evidence, tradeoff, uncertainty, authority chain, and policy/skill versions for audit. It must not claim to expose private chain-of-thought or prove causal reasoning.

## P9-G2 Environment Identity Records

Fresh executor-logged transitions and their run metadata now carry an audit-only `EnvironmentFingerprint` and `EvidenceEnvironmentScope`. These records never self-mark a policy compatible: pre-P12 compatibility remains `unknown`.

`EvidenceSliceReader` is a read-only report layer. It can narrow a replay view by decision class, revision, budget window, environment fingerprint, authority mode, capture provenance, and whether a workspace shadow call occurred. A filtered slice records its filters and matched transition IDs so a same-scope comparison is inspectable. Provider attribution prefers an applied live provider for live decisions and the workspace provider for called shadow decisions, rather than incorrectly inheriting an unavailable legacy execution command. A controlled shadow capture may declare `STS2_P8_WORKSPACE_SHADOW_DECISION_CLASSES`; this is an experiment-only provider-call filter recorded in the evidence-budget window, not a live whitelist or routing policy. Filtering does not make evidence promotion-ready: `promotionUseAllowed` remains `false` until the future P9-G3 gate exists.

The fields are read only from explicitly named environment values and the fixed adapter capability description. Missing values remain missing. In particular, console assistance cannot be auto-detected from game state: the operator must set `STS2_EVIDENCE_PROVENANCE=console_debug` whenever console/debug setup was used.

```ts
interface EnvironmentFingerprint {
  schemaVersion: number;
  gameId: "slay_the_spire_2";
  gameBuild?: string;
  releaseChannel: "main" | "beta" | "unknown";
  contentManifestHash?: string;
  mods: Array<{
    id: string;
    version?: string;
    affectsGameplay?: boolean;
    hash?: string;
  }>;
  modsDeclared: boolean;
  adapter: {
    id: string;
    version?: string;
    capabilityHash?: string;
  };
  factSnapshotVersion?: string;
  agentRevision?: string;
  captureProvenance: "organic" | "console_debug" | "fixture" | "unknown";
  fingerprintHash?: string;
  identityStatus: "complete" | "partial" | "unknown";
  notes: string[];
}

type EnvironmentCompatibilityState =
  | "compatible"
  | "degraded"
  | "quarantined"
  | "unsupported"
  | "unknown";

interface EvidenceEnvironmentScope {
  schemaVersion: number;
  fingerprintHash?: string;
  scopeStatus: "exact" | "partial" | "unknown";
  compatibilityState: EnvironmentCompatibilityState;
  captureProvenance: "organic" | "console_debug" | "fixture" | "unknown";
  reasons: string[];
}
```

`identityStatus=complete` requires explicit game build/channel, content manifest, declared mod set, adapter version/capability identity, fact snapshot version, and agent revision. A complete identity can make evidence structurally comparable; it still does not enable promotion. Unknown, partial, console/debug, fixture, or missing-scope evidence remains visible but is excluded from future stable-promotion slices.

Future stable learned objects must record:

- environment fingerprint or explicit unknown fields;
- exact/compatible/mixed/unknown scope;
- compatibility decision and reason;
- dependencies and invalidation triggers;
- last validation fingerprint;
- revalidation and rollback status.

Unknown or mixed incompatible environments remain visible but cannot qualify stable promotion. Provider/model profile is experiment context and must not be conflated with game/mod/adapter environment truth.

## Ground Truth Rules

- Agent-selected executor actions: `captureMode=executor_logged`, `isGroundTruth=true`.
- MCP/mod event actions: `captureMode=mcp_event`, `isGroundTruth=true` only if the event has enough identity fields.
- Human actions from any non-`mcp_event` capture mode cannot be ground truth.
- Human diff inference: `captureMode=diff_inferred`, `isGroundTruth=false`.
- Snapshot-only records: `captureMode=snapshot_only`, `isGroundTruth=false`.

These rules are enforced by `assertGroundTruthInvariants()` in `src/data/transitionSchema.ts`.

Current helpers:

- `createSnapshotOnlyTransition()`
- `createSnapshotOnlyTransitionFromCollectedState()`
- `createExecutorLoggedTransitionSkeleton()`
- `createDiffInferredTransitionSkeleton()`
- `assertGroundTruthInvariants()`

Phase 2 writer:

- `AgentDecisionRecorder` records only actions selected and sent by the agent executor.
- It writes raw pre/post snapshots to `data/runs/<runId>/snapshots/`.
- It writes compact pre/post aliases into `transitions.jsonl`.
- It marks agent actions as `source="agent"`, `captureMode="executor_logged"`, `isGroundTruth=true`.
- In shadow mode, it attaches a read-only `derivedSnapshot` built from the local `derived/` files. This snapshot is for recording, replay, eval, and prompt-parity inspection only; it does not alter live prompts or action selection.
- It now also writes `replayFrame` and, when appropriate, a proposed `consolidation` object. Both are observability records and remain shadow-only.

Phase 2.5 eval:

- Reads `metadata.json`, `transitions.jsonl`, and referenced snapshots.
- Re-normalizes pre raw snapshots and regenerates local candidates.
- Compares `selectedAction` semantically against regenerated candidates.
- Enforces ground-truth invariants, run ID consistency, transition ID uniqueness, JSONL parseability, and snapshot ref existence.
- Flags stale index, illegal target, unknown-screen blocking, hard/unknown checkpoints, settlement timeout, and repeated no-progress risks.
- Uses indexed action identities for replay/eval summaries when actions carry `cardIndex` or `index`, so distinct indexed choices with the same card name remain distinguishable.

Phase 2.6 eval classification:

- Adds `warningSummary` grouped by category and code.
- Adds focused top-level warnings for actionable/risk/strategy items.
- Classifies normal hard checkpoints separately from actionable fixture candidates.
- Classifies acceptable low-visibility settlement timeouts separately from program risks.
- Marks known historical fixed evidence separately from current blockers.
- Adds lightweight strategy metrics:
  - low HP transitions
  - high incoming transitions
  - block deficit turns
  - deck-too-thick transitions
  - potion use and low-pressure potion use
  - route greed choices
  - fallback count/rate
  - repeated low-confidence choices
  - combat tempo loss

These strategy metrics are WARN-only signals. They do not change `TransitionRecord` ground-truth semantics and do not make a run fail by themselves.

## Compatibility

Current `CollectedStateRecord` maps to a snapshot-only transition:

- `rawStatePath` -> `preStateRef`
- `compactState` -> `compactPreState`
- `action=null`
- `executionResult=null`
- `stateDiff=null`
- `captureMode=snapshot_only`
- `isGroundTruth=false`

Current `DecisionLogEntry` is a decision audit and should be linked to future transition records by `transitionId` or timestamp.

## Phase 2 MVP Limit

The current writer covers agent executor actions, replay timeline reading, grouped offline engineering eval, and lightweight strategy-quality metrics. It does not yet implement HTML replay, event-log human capture, diff-inferred human transition generation, training, or vector memory.
