# P8 / P9 Debt Register

This document tracks the debts that remain after P8/P8.5 closeout and before P9 guarded learning should begin.

For the comprehensive pre-P9 audit, full classification matrix, repair order, and copy-paste follow-up PR prompts, see [PRE_P9_ENGINEERING_DEBT_AUDIT.md](PRE_P9_ENGINEERING_DEBT_AUDIT.md).

Status values:

- `open`
- `in_progress`
- `accepted_for_later`
- `closed`

## Critical

### `protected_path_write_gate_missing`

- Status: `in_progress`
- Evidence:
  - [controller.ts](../../src/agent/controller.ts#L362)
  - [memory.ts](../../src/agent/memory.ts#L140)
- Problem:
  - Live/provider-originated memory updates and strategy-parameter suggestions are now blocked/audited by default, and the future protected target vocabulary is explicit.
  - Protected-path governance is still not the full future proposal/promotion surface.
  - Legacy run-finalization is now blocked by default, audited, and labeled as `legacy_local_learning`; it still exists as a legacy path that must not be confused with a P9 promotion model.
- Why it matters:
  - P9 cannot claim guarded learning while protected-path writes depend on provider obedience or legacy reward feedback.
- Minimum fix:
  - keep the controller-level protected-path gate as the single live/provider write authority
  - keep legacy finalize behavior isolated as legacy local learning
  - add the next protected-path gate layer for future derived/strategy/skill proposals

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

- Status: `open`
- Evidence:
  - [types.ts](../../src/domain/types.ts#L547)
  - [DATA_SCHEMA.md](../../DATA_SCHEMA.md#L147)
- Problem:
  - Current `ConsolidationRecord` is good P7 evidence but not enough for typed pending proposals, promotion criteria, or rollback.
  - The current system also lacks first-class weak-attribution fields and proposal-rejection rules for vague advice.
- Minimum fix:
  - introduce a typed `LearningProposal` family and ledger

### `reverse_scaffold_feedback_schema_missing`

- Status: `open`
- Problem:
  - The project has review signals, cue attribution, and proposal-only improvement hints, but it still lacks a typed reverse-scaffold feedback object.
  - That means the LLM still has no formal, reviewable channel for saying that the scaffold omitted information, compressed the wrong thing, retrieved the wrong memory, or needed a different panel/classification/budget framing.
- Why it matters:
  - Without a typed reverse feedback channel, the project risks drifting back toward human-authored per-class patching instead of proposal-driven soft-shell learning.
- Minimum fix:
  - add a typed `ReverseScaffoldFeedback` schema
  - keep it telemetry/proposal-seed only at first
  - do not let it directly alter live prompts, budgets, or stable policy

### `evidence_slice_reader_missing`

- Status: `open`
- Problem:
  - Promotion evidence still depends too much on replay summary interpretation instead of a first-class clean-slice reader.
- Why it matters:
  - P9 cannot safely promote or reject policies if mixed revision, mixed budget, console-assisted, and live-vs-shadow evidence are not explicitly separable.
- Minimum fix:
  - add a first-class `EvidenceSliceReader`
  - make slice dimensions explicit in code and docs

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
  - extract `LiveDecisionGateway` and `ProtectedPathGate` first

### `budget_and_recovery_governance_still_p8_local`

- Status: `open`
- Evidence:
  - [BUDGET_GOVERNANCE.md](../../BUDGET_GOVERNANCE.md#L58)
  - [llm.ts](../../src/agent/llm.ts#L1)
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
