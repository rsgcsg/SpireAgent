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

The real blocker is now the gap between partial P9-G2 shadow experiment evidence and a safe P9-G3 stable-change design:

- protected-path gating is only partially landed
- live-applied rollout reporting now exists, but older shadow-first readiness semantics still coexist beside it
- typed learning proposal schema/store has started as append-only read-only P9.1 infrastructure
- typed reverse-scaffold feedback schema/store has started as append-only read-only telemetry
- proposal review-decision ledger has started as append-only audit-only P9.1 infrastructure
- weak-attribution proposal seed generation has started as P9.2 infrastructure; default CLI mode is dry-run and explicit writes are append-only run artifacts
- first-class read-only evidence slicing has started; proposal seed generation now excludes ineligible console/debug/fixture/unknown evidence by default; stable-promotion eligibility remains disabled until proposal/promotion gates exist
- P9.5A can assemble a low-risk proposal only into a cloned offline `DeliberationPacket` and compare baseline versus overlay workspace prompts; it cannot call a provider, write a run artifact, change live/runtime behavior, or promote stable policy
- P9.5B can evaluate a supplied paired same-slice baseline/overlay shadow outcome for candidate/fact invariants, provider/output regressions, and reason smoke alarms; `paired_evidence_ready_for_review` is explicitly not `shadow_validated`
- P9.5C can run one explicit low-risk proposal against a cloned replay packet with the baseline's recorded provider profile. It has produced one **scope-bound** organic combat pair (`transition-000194-agent-mr7smrum-sk2bgv`): legal candidate unchanged, provider clean, and the `missing_tradeoff` reason smoke alarm improved. The overlay is refused for an independent adequate baseline without that trigger. A second matching baseline triggered provider recovery and changed its terminal profile, so it is explicitly `incomplete`, not a confirming pair. This is review evidence only, not a policy result.
- Decision authority is not yet first-class telemetry: provider/run mode and historical `chosenBy` do not fully explain deliberation, selection, authorization, execution, or delegated-skill ownership.
- Promotion evidence is not yet scoped to a first-class game build/channel, content/mod set, adapter capability, and fact-snapshot fingerprint. In the current Early Access environment, this is a stable-promotion blocker.
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

1. close remaining P9-G1 protected-surface gaps
2. implement decision-authority types and audit-only records without changing routing or execution
3. implement environment fingerprint and evidence-scope reporting without changing live behavior
4. continue provider- and environment-comparable organic paired shadow evidence with explicit counterexample review
5. keep `authority_shaping`, `action_shaping`, and `hard_shell` proposals outside the first promotion path
6. audit G2; only then design P9-G3 promotion ledger, immutable version diff, rollback snapshot, status transition, and retrieval trace

## Canonical Follow-On Docs

- [P8_CLOSEOUT.md](phases/P8_CLOSEOUT.md)
- [P8_P9_DEBT_REGISTER.md](debt/P8_P9_DEBT_REGISTER.md)
- [P9_ENTRY_CRITERIA.md](phases/P9_ENTRY_CRITERIA.md)
- [P9_ENTRY_DECISION.md](phases/P9_ENTRY_DECISION.md)
- [P9_GUARDED_LEARNING_PLAN.md](phases/P9_GUARDED_LEARNING_PLAN.md)
- [P9_P15_EXECUTION_ROADMAP.md](phases/P9_P15_EXECUTION_ROADMAP.md)
- [P9-P15 Phase Architecture Audit](reports/P9_P15_PHASE_ARCHITECTURE_AUDIT_2026-07-11.md)
- [Strategic authority ADR](decisions/ADR-0003-strategic-authority-and-experience-shell.md)
- [Environment-scope ADR](decisions/ADR-0004-environment-scoped-evidence-and-knowledge.md)
- [Environment Compatibility](../ENVIRONMENT_COMPATIBILITY.md)
- [P8_5_LIVE_ROLLOUT_POLICY.md](phases/P8_5_LIVE_ROLLOUT_POLICY.md)
- [LLM_RUN_MODES.md](runbooks/LLM_RUN_MODES.md)
