# ADR-0002: Proposal-Driven Guarded Learning

## Status

Accepted

## Context

P8/P8.5 established:

- replayable cognitive scaffold objects
- proposal surface evidence
- additive live under explicit whitelist

But the project still lacks a safe way to turn replay/review evidence into stable scaffold improvement.

Two mistakes must be avoided:

1. treating explicit whitelist live rollout as if learning were already solved
2. letting future learning mutate validation, execution, live authorization, or stable knowledge directly

## Decision

P9 will be implemented as proposal-driven guarded learning.

This means:

- replay/review signals produce typed pending proposals
- proposals require evidence, scope, confidence, counterexample handling, promotion criteria, and rollback
- proposals are applied in shadow before any stable promotion
- protected-path authority remains outside proposal control

Protected paths include:

- validation
- execution legality
- live authorization flags
- rollback authority
- stable memory/derived/strategy writes

## Consequences

- P9 must begin with protected-path hardening, not with direct stable writes
- the current `ConsolidationRecord` surface is not enough by itself for P9 promotion
- class-by-class manual scaffold tuning should gradually be replaced by reviewable proposal families
- explicit live rollout and stable learning are now separate concerns in both code and reporting
