# P9-G3A Disabled Change-Kernel Audit

**Date:** 2026-07-12  
**Verdict:** pass for disabled infrastructure only

## Scope

This audit assesses whether G3-A can provide lifecycle-safety infrastructure without creating a learned-policy activation path. It does not assess G3-B candidate quality or G3-C canary/promotion readiness.

## Verified Invariants

- `src/learning/changeKernel.ts` creates only run-local append-only artifact, event, and rollback-simulation records.
- Every constructed artifact has literal `activationEnabled=false` and `stableWriteEnabled=false`.
- Missing semantic key, exact environment scope, or provider experiment fingerprint quarantines the artifact.
- Dry-run retrieval requires exact environment and provider identity, but even an exact match returns `disabled_no_activation`.
- Rollback snapshots are `simulation_only`; no rollback command can alter runtime or stable state.
- Store readers count malformed lines rather than silently presenting a clean store.
- `assessChangeKernelActivation()` delegates to `ProtectedPathGate` with `p9_stable_promotion`; that origin remains denied.
- Only smoke coverage writes these records, inside a temporary directory removed by the test. Replay reads a run directory only for summary output.
- No controller, workspace, provider, prompt, candidate, validation, execution, memory, derived-knowledge, strategy, skill, or live-rollout module imports the G3-A writer.

## Test Evidence

- `npm exec tsc -- --noEmit`: pass
- `npm run agent:smoke`: pass; covers exact-match disabled retrieval, provider mismatch, invalid-artifact quarantine, rollback simulation, and protected-path denial.
- `npm run check`: pass
- `npm run data:replay -- --latest`: pass; G3-A summary remains empty for the latest real run.
- `npm run data:eval -- --latest`: pass; existing `strategy_block_deficit` WARN remains non-blocking.
- `npm run agent:review`: pass
- `git diff --check`: pass

## Deliberate Non-Features

- No qualified `LearningProposal` becomes a policy artifact automatically.
- No human review decision can activate an artifact.
- No active retrieval trace, stable promotion ledger, executable rollback command, or emergency runtime disable is implemented. Because activation is impossible in G3-A, the permanent disabled state is the only safe emergency posture.
- Fixture behavior does not count as natural evidence or policy qualification.

## Exit And Next Gate

G3-A is complete. G3-B remains blocked until a naturally observed, repeated, source-resolved, exact-scope, low-risk `deliberation_shaping` deficiency survives semantic and counterexample review. G3-C remains forbidden until a G3-B candidate is explicitly qualified.
