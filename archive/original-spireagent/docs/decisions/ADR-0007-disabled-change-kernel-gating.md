# ADR-0007: Disabled Change-Kernel Gating

## Status

Accepted for P9-G3A infrastructure only.

## Context

P9-G2 correctly requires natural, exact-scope, source-resolved, counterexample-reviewed evidence before a learned policy can influence future deliberation. Treating that evidence requirement as a prohibition on all lifecycle-safety engineering, however, leaves the project stalled whenever no honest policy candidate exists.

## Decision

Split G3 into three independent gates:

- **G3-A: disabled change-kernel infrastructure.** May create run-local append-only artifact/event/simulation records, exact-scope dry-run retrieval traces, malformed-input diagnostics, and rollback simulations. Artifacts are disabled or quarantined; no active retrieval, promotion, stable write, or live integration exists.
- **G3-B: policy qualification.** Requires a natural repeated same-scope deficiency, source-resolved exact identity, semantic review, counterexample or non-applicability conditions, bounded risk, and human review. No candidate is currently qualified.
- **G3-C: activation/canary/promotion.** Requires a qualified G3-B candidate and separately approved lifecycle, active retrieval, stop conditions, organic canary, regression, and rollback evidence. It remains forbidden.

Fixtures can test G3-A code paths only. They cannot qualify a policy, make an artifact eligible, or substitute for organic evidence.

## Consequences

- Absence of an honest learning candidate does not block safety infrastructure.
- No G3-A record changes runtime behavior, live routing, memory, derived knowledge, strategy, skill, prompt, budget, candidate, classification, or scaffold policy.
- `ProtectedPathGate` remains the single fail-closed barrier for future stable writes.
- Reports must distinguish `infrastructure ready`, `no qualified policy candidate`, and `activation forbidden`; they must not describe G3-A as promotion or learning activation.

## Rejected Alternatives

- Waiting to design all ledger/rollback/retrieval safeguards until a candidate appears: this couples safety construction to incidental model failure.
- Using detector alarms, fixtures, or console/debug runs as a candidate: this would manufacture evidence and violate promotion integrity.
- Enabling retrieval merely to exercise the code: retrieval is decision-shaping and belongs to G3-C.
