# P9 Entry Decision

This document is the current one-page decision record for whether formal P9 proposal infrastructure may continue. The canonical phase snapshot remains `../04_CURRENT_STATUS.md`.

It does not authorize stable learning, proposal application, wildcard live, live-class expansion, or provider-controlled mutation.

## Verdict

P9 proposal infrastructure may continue through P9-G2 bounded shadow experiment-integrity work. Historical P9.5A-P9.5E labels remain implementation aliases.

The project has enough guardrails to proceed with append-only proposal and reverse-feedback surfaces:

- protected-path writes remain blocked/audited by default
- legacy finalize learning is labeled and audited as legacy local learning
- explicit whitelist live remains distinct from wildcard live
- read-only evidence slicing exists, while stable-promotion eligibility remains disabled
- typed `LearningProposal` and `ReverseScaffoldFeedback` surfaces exist as run artifacts
- vague proposals cannot become actionable pending review without evidence, scope, counterexamples, expected effect, validation plan, and rollback
- audit-only proposal review decisions can be recorded in an append-only ledger without mutating proposal status or enabling apply/promotion
- P9-G2/P9.5A-P9.5C can perform bounded offline/cloned-packet shadow comparison without changing live or stable behavior

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
| Promotion criteria and rollback fields | pass-for-schema plus G3-A | Fields exist on proposals. Disabled run-local lifecycle artifacts, dry-run retrieval, rollback simulation, and quarantine diagnostics exist, but no active applicator or promotion gate exists. |
| Evidence-slice rules | pass-for-read-only | First-class read-only slice reader exists; promotion-grade canonical slicing remains P9.3 work. |
| Budget governance semantics | pass-for-P9-G1 | Stage 0 guard + telemetry only; learned compute/provider orchestration remains deferred to P11B. Existing `P13` telemetry is a historical label. |
| Weak attribution | pass-for-proposals | Proposal schema includes suspected cause, confidence, counterexample need, and alternative hypotheses. |
| Anti-vague proposal validation | pass | Incomplete proposals are draft/rejected, not actionable pending review. |
| Decision-authority foundation | pass-for-schema, blocker-for-G3 | Fresh executor-logged transitions now record the authority chain without changing behavior. Fresh explicit-mode coverage and old-record `not_recorded` review remain required. |
| Environment identity and evidence scope | pass-for-schema, blocker-for-G3 | Fresh transitions now record explicit fingerprint/scope and exclude missing/partial scope from structural promotion evidence. Verified complete-scope organic paired evidence and future compatibility evaluation remain required. |

## Explicit Non-Readiness

The following are still not implemented or authorized:

- G3-B qualified policy candidate
- G3-C stable promotion ledger and activation events
- active retrieval integration for stable learned policies
- promotion-grade canonical evidence slicing
- fresh authority-complete audit coverage across relevant paths
- verified environment-complete paired evidence, compatibility evaluation, quarantine, and revalidation scope
- wildcard live
- learned compute/provider orchestration

P9-G2 shadow applicator/evaluation exists only in bounded, non-mutating form. G3-A rollback snapshots are simulation-only and dry-run retrieval always refuses activation. One scope-bound organic pair and incomplete counterexample evidence do not authorize qualification, activation, or promotion.

## PR-11 Decision

`LiveDecisionGateway` extraction is deferred.

Reason:

- It is maintainability work, not a blocker for append-only P9.1 proposal infrastructure.
- The current request sequence prioritized schema/store/reporting safety.
- Extracting live orchestration now would touch controller, provider, validation, and fallback-adjacent code with higher regression risk than benefit.

The extraction remains accepted maintainability debt. G2 authority/environment schema work does not require it. Reconsider a narrow extraction before G3 runtime retrieval/application would add more controller pressure; do not make it a reason for a broad controller rewrite.

## Next Work

The next engineering sequence is:

```text
complete the G3-A disabled-kernel audit
  -> P9-G2 fresh authority/environment-complete capture
  -> comparable paired/counterexample evidence
  -> console/debug exclusion verification
  -> P9-G3B qualification audit
  -> P9-G3C activation design only after pass
```

Recommended scope:

- keep all additions read-only or shadow-only
- preserve current provider, live, validation, and execution behavior
- classify proposal behavior impact before promotion design
- scope future promotion evidence to compatible environments

Forbidden next step:

- do not add stable promotion
- do not let proposals alter live prompts, budgets, classification, candidate generation, scoring, validation, execution, memory, derived knowledge, strategy, skills, or scaffold policy
