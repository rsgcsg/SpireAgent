# Current Status

This file is the canonical short-form snapshot of the current phase, blocker, and next step.

Do not turn it into a narrative log. Detailed history belongs in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`.

## Current Phase

- Formal route: P0-P15 in `../PROJECT_PLAN.md` and `phases/P9_P15_EXECUTION_ROADMAP.md`; optional autonomy is research track R1
- Active milestone: P9-G2 Experiment Integrity. Historical P9.5A-P9.5C shadow evidence and planned P9.5D authority/P9.5E environment work map into this gate
- Live posture: explicit additive whitelist live is real and locally exercised; wildcard broad live remains forbidden

## Current Truth

- `full` remains the sacred P8 control-group workspace mode
- `full_bounded_candidate_futures` remains a shadow-only experiment mode
- DeepSeek has both:
  - P8 shadow workspace provider plumbing
  - command-adapter live additive execution for explicit whitelisted classes
- Latest guarded broad-whitelist evidence run is `run-mr8pwmtm-4z75zt`
- Latest broad-whitelist live evidence recorded:
  - 73 transitions
  - 15 additive live decisions
  - provider source `deepseek-live-command`
  - invalid output `0`
  - invalid choice `0`
  - missing candidate `0`
  - provider error `0`
  - output-cap hits `0`
  - fallback live decisions `0`
- Current locally exercised whitelist:
  - `combat:llm_required`
  - `card_reward:llm_required`
  - `map:llm_required`
  - `rest:llm_required`
  - `shop:llm_required`
  - `event:llm_required`
  - `card_select:local_recommended_llm_arbitrate`

## Current Blocker

The active blocker is no longer provider reachability or P8 workspace survival-cue preservation.

P9-G1 protected-path closure is complete. P9-G2 cannot pass or begin G3 until its data-truth and policy-impact contracts are repaired:

- two historical additive-live `card_select` transitions recorded `chosenBy="llm"` while the final executed candidate differed from the valid LLM proposal after a local guard. They remain execution history but cannot support `llm_selected_execution` claims until derived mismatch exclusion and fresh `SelectionResolutionRecord` telemetry exist;
- replay, proposal generation, and manifests still use inconsistent exclusive evidence-role precedence when one transition includes both a workspace-shadow call and an LLM selection;
- a `reason_policy` injected before provider deliberation is currently labelled `presentation_only`. It is actually deliberation-shaping if ever applied, so the former "presentation-only first G3 policy" is invalid.

The detailed findings, corrected architecture, and repair order are canonical in [P9-P10 Trustworthy Change Kernel Audit](reports/P9_P10_TRUSTWORTHY_CHANGE_KERNEL_AUDIT_2026-07-11.md) and [ADR-0006](decisions/ADR-0006-policy-influence-and-evidence-provenance.md). The following is implementation history and current G2 evidence, not authorization for G3:

- protected-path governance now has one stable-write authorization evaluator across live LLM intent, legacy finalize, future P9 promotion, shadow experiment, and runtime reflection; P9/shadow/reflection origins are explicitly deny-only; ordinary runtime persistence writes run state only
- live-applied rollout reporting now exists, but older shadow-first readiness semantics still coexist beside it
- typed learning proposal schema/store has started as append-only read-only P9.1 infrastructure
- typed reverse-scaffold feedback schema/store has started as append-only read-only telemetry
- proposal review-decision ledger has started as append-only audit-only P9.1 infrastructure
- weak-attribution proposal seed generation has started as P9.2 infrastructure; default CLI mode is dry-run and explicit writes are append-only run artifacts
- first-class read-only evidence slicing has started; proposal seed generation now excludes ineligible console/debug/fixture/unknown evidence by default; stable-promotion eligibility remains disabled until proposal/promotion gates exist
- `EvidenceSliceReader` can now print a read-only focused slice by class/revision/budget/environment/authority/provenance/shadow-call state, including matched transition IDs; a clean filter never enables promotion
- controlled G2 shadow capture can reserve provider-call budget for an explicit evidence class through `STS2_P8_WORKSPACE_SHADOW_DECISION_CLASSES`; it is shadow-only, telemetry-visible, default-off, and not a live whitelist
- P9.5A can assemble a low-risk proposal only into a cloned offline `DeliberationPacket` and compare baseline versus overlay workspace prompts; it cannot call a provider, write a run artifact, change live/runtime behavior, or promote stable policy
- P9.5B can evaluate a supplied paired same-slice baseline/overlay shadow outcome for candidate/fact invariants, provider/output regressions, and reason smoke alarms; `paired_evidence_ready_for_review` is explicitly not `shadow_validated`
- P9.5C can run one explicit low-risk proposal against a cloned replay packet with the baseline's recorded provider profile. It has produced one **scope-bound** organic combat pair (`transition-000194-agent-mr7smrum-sk2bgv`): legal candidate unchanged, provider clean, and the `missing_tradeoff` reason smoke alarm improved. The overlay is refused for an independent adequate baseline without that trigger. A second matching baseline triggered provider recovery and changed its terminal profile, so it is explicitly `incomplete`, not a confirming pair. This is review evidence only, not a policy result.
- Fresh executor-logged transitions now carry audit-only `DecisionAuthorizationRecord` fields for deliberation, selection, authorization, execution, plan origin, authority mode/level, and delegation identity. Old transitions remain `not_recorded`; authority mode is `unknown` unless explicitly configured.
- Fresh executor-logged transitions now carry audit-only `EnvironmentFingerprint` and `EvidenceEnvironmentScope`. Missing values stay unknown, console/debug provenance must be explicitly declared, and pre-P12 compatibility remains `unknown`. No fresh verified complete-scope paired evidence exists yet.
- P9-G2 now has an append-only experiment manifest that binds a proposal, baseline/overlay pair, authority, environment, and invariants. It remains audit-only and is not a promotion ledger.
- G2 proposal seeds now record an observed evidence role. Exact organic environment scope is necessary but insufficient: local fallback/scaffold/mechanical observations remain draft-only, while an actual LLM selection or called workspace provider outcome is required before a future seed can be actionable. This does not promote, apply, or alter any decision.
- Focused replay slices now aggregate those observed evidence roles, so `llm_selected_execution`, `workspace_shadow_provider`, and local observation evidence are visible without manually inspecting transition JSON. The `promotionEligible` counter remains environment/provenance scope only and must be read beside `evidenceRole`.
- G2 experiment manifests and `shadow-preflight` now record/require a called workspace-shadow baseline role for same-slice provider comparisons. A declared authority mode is not enough; a manifest remains audit-only and cannot promote.
- Current dry-run inventory leaves two repeated `candidate_future:card_flow` seeds with `workspace_shadow_provider` evidence. They are `candidate_shaping`, not a basis to start G3 or manufacture an overlay. A facts/order-preserving presentation projection remains useful G2 comparison tooling only; it is not evidence that a future pre-decision policy is decision-neutral.
- Two natural exact-organic `card_select:local_recommended_llm_arbitrate` captures (`transition-000391-agent-mrfu596y-ad2qik`, `transition-000433-agent-mrfun527-vddpuj`) repeat an action-first CandidateFuture template: empty structured costs, generic `shallow_future_risk_model`, and flow-only prediction checks. The model still expressed adequate scaling-versus-tempo and low-HP risk tradeoffs, making the lexical `missing_tradeoff` note a false positive and leaving causal decision harm unproven. This is a real `candidate_shaping` debt, not a low-risk `presentation_only` proposal seed; retain it for a later qualified candidate-template path rather than relabeling it to enter G3.
- Fresh G2 organic evidence now exists in `run-mrfq2vw1-aap49m`: direct-shadow calls across combat, shop, event, rest, rewards, and card selection under exact environment scope and `llm_primary` mode. They have `finishReason=stop`, `failureBucket=none`, and no output-cap hit; one combat outcome used retry=1 and therefore cannot be mixed with no-retry pair evidence. Fixed budget/capture sub-windows are separately inspectable; other profiles must not be mixed into a future pair. A card-reward reason that explicitly named benefit and deck-bloat cost was labeled `missing_tradeoff`, so it remains a detector counterexample. The initial high-HP rest reason omitted an explicit heal-for-upgrade cost, but a separately captured low-HP rest outcome said `Heal to survive, but lose upgrade tempo.` The latter is a contextual counterexample, not a same-budget pair. Reject the global rest reason-policy hypothesis; do not create a proposal from the isolated high-HP wording. These records are baselines/counterexamples only, not paired policy results or promotion evidence.
- A later three-call shadow-only combat slice in the same run now has a verified Steam build/depot, declared empty mod set, adapter/agent revision, facts snapshot hash, and organic provenance under fingerprint `389afd94acaf901d`. It is structurally exact but not a pair: one call was mechanical zero-energy flow, one was already adequate, and one stated the block-versus-damage tradeoff despite a `missing_tradeoff` smoke alarm. Two calls recovered through a different terminal provider profile. Treat this slice as environment and detector counterexample evidence, not a proposal trigger.
- budget governance remains Stage 0 guard + telemetry; learned deliberation/compute policy belongs to P11B. Existing telemetry that says `P13` is a backward-compatible historical phase label, not current roadmap authority
- weak proposal attribution and anti-vague proposal validation are implemented for pending proposals; stable-promotion gates are still not implemented

## What Is Explicitly Not True

- wildcard broad live is not authorized
- all decision classes are not live-ready
- stable learning is not implemented
- P9.1/P9.2 typed proposal, review-decision, reverse-feedback, and proposal-seed infrastructure is append-only/audit-only; stable-promotion machinery has not started
- `LLM_HANDOFF.md` and `DEBUG_REPORT.md` are not the canonical source of truth

## Next Step

Complete P9-G2 without enabling stable promotion:

1. preserve `ProtectedPathGate` as the only future stable-write authorization entry; do not add a direct writer or enable any P9 origin
2. implement G2.1 `SelectionResolutionRecord` and conservative historical proposal/final mismatch exclusion before using more records as LLM-selection evidence
3. implement G2.2 one structured evidence-role classifier and source-resolved proposal eligibility; console/debug exclusion and old `not_recorded` handling must remain intact
4. implement G2.3 provider experiment fingerprint, authority/manifest integrity diagnostics, and P9 exact-identity applicability; do not infer P12 compatibility
5. only after G2.1-G2.3, requalify existing slices and collect naturally occurring same-scope evidence/counterexamples; do not blind-sample or manufacture a proposal
6. keep candidate-template/generation, classification, authority, action, and hard-shell changes outside the first stable path
7. audit G2; only then design and seek approval for a narrow deliberation-shaping G3 ledger, rollback, retrieval trace, and canary

## Canonical Follow-On Docs

- [P8_CLOSEOUT.md](phases/P8_CLOSEOUT.md)
- [P8_P9_DEBT_REGISTER.md](debt/P8_P9_DEBT_REGISTER.md)
- [P9_ENTRY_CRITERIA.md](phases/P9_ENTRY_CRITERIA.md)
- [P9_ENTRY_DECISION.md](phases/P9_ENTRY_DECISION.md)
- [P9_GUARDED_LEARNING_PLAN.md](phases/P9_GUARDED_LEARNING_PLAN.md)
- [P9_P15_EXECUTION_ROADMAP.md](phases/P9_P15_EXECUTION_ROADMAP.md)
- [P9-P10 Trustworthy Change Kernel Audit](reports/P9_P10_TRUSTWORTHY_CHANGE_KERNEL_AUDIT_2026-07-11.md)
- [P9-P15 Phase Architecture Audit](reports/P9_P15_PHASE_ARCHITECTURE_AUDIT_2026-07-11.md)
- [Strategic authority ADR](decisions/ADR-0003-strategic-authority-and-experience-shell.md)
- [Environment-scope ADR](decisions/ADR-0004-environment-scoped-evidence-and-knowledge.md)
- [Policy influence and provenance ADR](decisions/ADR-0006-policy-influence-and-evidence-provenance.md)
- [Environment Compatibility](../ENVIRONMENT_COMPATIBILITY.md)
- [P8_5_LIVE_ROLLOUT_POLICY.md](phases/P8_5_LIVE_ROLLOUT_POLICY.md)
- [LLM_RUN_MODES.md](runbooks/LLM_RUN_MODES.md)
