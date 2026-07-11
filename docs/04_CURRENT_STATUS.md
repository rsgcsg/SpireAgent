# Current Status

This is the canonical short snapshot of the active phase, blocker, and next step. Historical detail belongs in `../DEBUG_REPORT.md` and `../LLM_HANDOFF.md`.

## Phase

- Active milestone: **P9-G2 Experiment Integrity**.
- P9-G1 protected-path hardening is complete.
- P9-G3 stable change design, promotion ledger, rollback snapshot, and retrieval trace are **not authorized**.
- Explicit-whitelist additive live remains independently governed. Wildcard live remains forbidden.

## Implemented G2 Contracts

- **G2.1 Selection truth:** fresh executor-logged transitions now write `SelectionResolutionRecord` with the proposal, validation result, guard override, final selection, and LLM-selection evidence eligibility. `chosenBy` is retained only as legacy summary telemetry. Historical proposal/final mismatches remain immutable and are read-only excluded.
- **G2.2 Evidence truth:** replay, proposal generation, live-rollout reporting, shadow preflight, and manifests use the shared source-resolved evidence-role classifier. A workspace provider outcome and a selection observation may coexist; only a clean, exact-organic, source-resolved path can satisfy proposal-seed eligibility. Overlay assembly additionally resolves the caller-selected transition against proposal/evidence IDs and declared environment scope, rather than trusting embedded labels. Local observations may create draft-only review material. Console/debug/fixture, unresolved legacy selection, provider failure, and empty/unknown protected targets fail closed.
- **G2.3 Experiment identity:** experiment manifests now carry secret-free `ProviderExperimentFingerprint` diagnostics plus exact-identity applicability. Provider source/model/mode/thinking/output/retry/recovery-attempt fields must match for an exact pair. Manifest readers expose a legacy/malformed-store digest instead of silently treating old records as current.

## Requalified Evidence

- Existing records remain readable but do not gain new authority by inference.
- The current latest run predates `SelectionResolutionRecord`; its live additive records are reported as legacy selection telemetry, not fresh `llm_selected_execution` evidence.
- Existing clean called workspace-shadow outcomes can remain review/proposal-seed observations only when their environment and source facts pass the shared classifier. They do not satisfy a G3 promotion gate.
- No manifest with current exact provider identity and no natural, repeatable same-scope baseline/overlay/counterexample set exists yet.

## Current Blocker

G2 implementation work is complete, but **G2 is not passed**. The next valid evidence must be naturally observed after these contracts are in place:

1. a fresh organic, executor-logged baseline with declared exact environment identity, a clean called workspace provider outcome, and a complete provider experiment fingerprint;
2. a repeated low-risk, same-scope `deliberation_shaping` deficiency plus counterexample review; and
3. only then, an explicitly approved same-slice shadow overlay comparison. No proposal may be manufactured merely to advance the phase.

## Non-Goals

- no stable memory, derived knowledge, strategy, skill, budget, candidate-template, classification, or scaffold-policy promotion;
- no proposal application to live/runtime behavior;
- no live-class expansion or wildcard live;
- no claim that reason detectors prove strategic quality.

## Next Step

Requalify a naturally occurring fresh baseline through `learning:proposals shadow-preflight`. If it is exact and clean, collect the corresponding natural counterexample before designing any G3 ledger, rollback, retrieval, or canary. The first possible G3 target remains a narrow, human-approved `deliberation_shaping` canary, never a disguised `presentation_only` change.

## Canonical References

- [P9 Guarded Learning Plan](phases/P9_GUARDED_LEARNING_PLAN.md)
- [P9 Entry Criteria](phases/P9_ENTRY_CRITERIA.md)
- [P8/P9 Debt Register](debt/P8_P9_DEBT_REGISTER.md)
- [P9-P10 Trustworthy Change Kernel Audit](reports/P9_P10_TRUSTWORTHY_CHANGE_KERNEL_AUDIT_2026-07-11.md)
- [ADR-0006: Policy Influence and Evidence Provenance](decisions/ADR-0006-policy-influence-and-evidence-provenance.md)
