# P9 Entry Decision

This document is the current one-page decision record for whether formal P9 proposal infrastructure may continue.

It does not authorize stable learning, proposal application, wildcard live, live-class expansion, or provider-controlled mutation.

## Verdict

P9.1 read-only proposal infrastructure may continue.

The project has enough guardrails to proceed with append-only proposal and reverse-feedback surfaces:

- protected-path writes remain blocked/audited by default
- legacy finalize learning is labeled and audited as legacy local learning
- explicit whitelist live remains distinct from wildcard live
- read-only evidence slicing exists, while stable-promotion eligibility remains disabled
- typed `LearningProposal` and `ReverseScaffoldFeedback` surfaces exist as run artifacts
- vague proposals cannot become actionable pending review without evidence, scope, counterexamples, expected effect, validation plan, and rollback
- audit-only proposal review decisions can be recorded in an append-only ledger without mutating proposal status or enabling apply/promotion

This is not approval for stable learning.

## Entry Criteria Status

| Criterion | Status | Notes |
|---|---|---|
| `npm run check` passes | pass | Last checked during PR-7/8/9 implementation. |
| Latest replay/eval/review can read current evidence | pass | Replay/eval/review now include live rollout, evidence slices, budget governance, learning proposals, and reverse feedback surfaces. |
| P8 closeout written | pass | See `P8_CLOSEOUT.md`. |
| P8/P9 debt register exists | pass | See `../debt/P8_P9_DEBT_REGISTER.md`. |
| Comprehensive pre-P9 audit exists | pass | See `../debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md`. |
| Explicit whitelist live only | pass | Wildcard live remains forbidden. |
| Stable writes protected | pass-with-watch | Current protected-path gate and legacy finalize isolation exist; future stable-promotion surface still needs a dedicated gate. |
| Typed pending proposal schema/store | pass | `LearningProposal` plus `learning-proposals.jsonl`, append-only/read-only. |
| Reverse scaffold feedback schema/store | pass | `ReverseScaffoldFeedback` plus `reverse-scaffold-feedback.jsonl`, telemetry/proposal seed only. |
| Proposal review-decision ledger | pass-for-audit-only | `approve`, `reject`, and `expire` create append-only audit records only; proposal mutation, apply, and stable promotion remain disabled. |
| Promotion criteria and rollback fields | pass-for-schema | Fields exist on proposals; no applicator or promotion gate exists yet. |
| Evidence-slice rules | pass-for-read-only | First-class read-only slice reader exists; promotion-grade canonical slicing remains P9.3 work. |
| Budget governance semantics | pass-for-P9.1 | Stage 0 guard + telemetry only; Budget/Compute OS remains P13. |
| Weak attribution | pass-for-proposals | Proposal schema includes suspected cause, confidence, counterexample need, and alternative hypotheses. |
| Anti-vague proposal validation | pass | Incomplete proposals are draft/rejected, not actionable pending review. |

## Explicit Non-Readiness

The following are still not implemented:

- stable promotion ledger
- shadow applicator
- rollback snapshots
- retrieval integration for stable learned policies
- promotion-grade canonical evidence slicing
- wildcard live
- Budget/Compute OS runtime behavior

## PR-11 Decision

`LiveDecisionGateway` extraction is deferred.

Reason:

- It is maintainability work, not a blocker for append-only P9.1 proposal infrastructure.
- The current request sequence prioritized schema/store/reporting safety.
- Extracting live orchestration now would touch controller, provider, validation, and fallback-adjacent code with higher regression risk than benefit.

The extraction should be reconsidered before P9.5/P9.6, when proposal application and stable promotion would otherwise add more controller pressure.

## Next PR

The next engineering PR after the audit-only review-decision ledger should be:

```text
P9.2 weak attribution and proposal generation seed
```

Recommended scope:

- convert selected replay/eval/review signals into draft or pending `LearningProposal` records through weak attribution
- keep proposal generation conservative and evidence-backed
- keep apply/promote unavailable until shadow applicator and promotion gate exist

Forbidden next step:

- do not add stable promotion
- do not let proposals alter live prompts, budgets, classification, candidate generation, scoring, validation, execution, memory, derived knowledge, strategy, skills, or scaffold policy
