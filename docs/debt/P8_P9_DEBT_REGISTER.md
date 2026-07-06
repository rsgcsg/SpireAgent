# P8 / P9 Debt Register

This document tracks the debts that remain after P8/P8.5 closeout and before P9 guarded learning should begin.

Status values:

- `open`
- `in_progress`
- `accepted_for_later`
- `closed`

## Critical

### `protected_path_write_gate_missing`

- Status: `in_progress`
- Evidence:
  - [controller.ts](/Users/fire/Desktop/SpireAgent/src/agent/controller.ts:362)
  - [memory.ts](/Users/fire/Desktop/SpireAgent/src/agent/memory.ts:140)
- Problem:
  - Live/provider-originated memory updates are now blocked by default, but protected-path governance is still not fully centralized.
  - Legacy run-finalization is now blocked by default and audited, but it still exists as a legacy path that has not yet been fully isolated behind a P9 promotion model.
- Why it matters:
  - P9 cannot claim guarded learning while protected-path writes depend on provider obedience or legacy reward feedback.
- Minimum fix:
  - keep the controller-level protected-path gate as the single live/provider write authority
  - finish isolating legacy finalize behavior as legacy local learning
  - add the next protected-path gate layer for future derived/strategy/skill proposals

### `readiness_semantics_stale_for_broad_live`

- Status: `in_progress`
- Evidence:
  - [p8LiveReadiness.ts](/Users/fire/Desktop/SpireAgent/src/replay/p8LiveReadiness.ts:26)
  - [evidenceBudget.ts](/Users/fire/Desktop/SpireAgent/src/replay/evidenceBudget.ts:5)
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

- Status: `open`
- Evidence:
  - [types.ts](/Users/fire/Desktop/SpireAgent/src/domain/types.ts:547)
  - [DATA_SCHEMA.md](/Users/fire/Desktop/SpireAgent/DATA_SCHEMA.md:147)
- Problem:
  - Current `ConsolidationRecord` is good P7 evidence but not enough for typed pending proposals, promotion criteria, or rollback.
  - The current system also lacks first-class weak-attribution fields and proposal-rejection rules for vague advice.
- Minimum fix:
  - introduce a typed `LearningProposal` family and ledger

## High

### `controller_owns_too_many_concerns`

- Status: `open`
- Evidence:
  - [controller.ts](/Users/fire/Desktop/SpireAgent/src/agent/controller.ts:292)
- Problem:
  - Live additive prompt shaping, provider call, validation, memory side-effects, execution, and recording remain in one orchestration file.
- Risk:
  - P9 learning hooks will further tangle live, shadow, memory, and rollout behavior.
- Minimum fix:
  - extract `LiveDecisionGateway` and `ProtectedPathGate` first

### `budget_and_recovery_governance_still_p8_local`

- Status: `open`
- Evidence:
  - [BUDGET_GOVERNANCE.md](/Users/fire/Desktop/SpireAgent/BUDGET_GOVERNANCE.md:58)
  - [llm.ts](/Users/fire/Desktop/SpireAgent/src/agent/llm.ts:1)
- Problem:
  - Budget language is broader than current implementation.
  - Recovery policy and readiness policy are still too fused to P8 workspace/shadow semantics.

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

### `prediction_error_precision_overclaim_risk`

- Status: `open`
- Problem:
  - Slay the Spire failures are often delayed and multi-step, so exact causal attribution will often be false confidence.
- Minimum fix:
  - start with weak attribution fields such as `suspectedCause`, `confidence`, `counterexampleNeeded`, and `alternativeHypotheses`

### `proposal_vagueness_risk`

- Status: `open`
- Problem:
  - LLM-generated proposals can easily collapse into non-actionable advice.
- Minimum fix:
  - require evidence, scope, counterexample handling, risk, expected effect, promotion criteria, and rollback before non-draft status

## Medium

### `console_fixture_pollution_risk`

- Status: `open`
- Problem:
  - Console-assisted runs are useful for reproduction but must stay out of stable learning evidence.

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
