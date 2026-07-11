# P9 Entry Criteria

P9 should start only when the project is ready to shift from live-scaffold expansion to guarded learning infrastructure.

Forward phase reporting uses P9-G1 through P9-G4 from ADR-0005. Historical P9.0-P9.4 items below map to G1; P9.5A-P9.5E map to G2; P9.6-P9.7 map to G3; P9.8 maps to G4.

## Required

- `npm run check` passes.
- Latest replay/eval/review can read current live-applied evidence without provider/validation/execution corruption.
- P8 closeout is written and accepted.
- P8/P9 debt register exists and calls out protected-path and readiness-reporting debt.
- The comprehensive pre-P9 engineering debt audit is reviewed, and any unresolved `must_fix_before_formal_P9` item is either fixed or explicitly accepted as a documented entry blocker.
- Explicit whitelist live remains the only authorized live model.
- Wildcard broad live remains forbidden.
- Stable memory, derived knowledge, and strategy writes are still protected paths and not part of current live rollout.

## Must Be Done Before First P9 Stable-Learning Work

- Keep a hard protected-path gate for live/provider-originated memory or strategy suggestions.
  Current state:
  live/provider-originated memory updates and strategy-parameter suggestions are blocked/audited by default, and the future stable-write target vocabulary is explicit. `ProtectedPathGate` now centralizes authorization for live LLM, legacy finalize, future P9 promotion, shadow experiment, and runtime reflection origins; the latter three are deny-only. No stable-learning writer or promotion path exists.
- Decide how legacy `finalizeRun()` writes are handled during P9:
  - freeze
  - isolate
  - or gate behind explicit legacy-local-learning labeling
  Current state:
  legacy finalize stable writes are blocked by default, audited, and labeled as `legacy_local_learning`. Ordinary runtime persistence writes only current-run state; if legacy finalize is explicitly enabled, the stable paths are written and audited as legacy finalize, remaining separate from P9 proposal promotion.
- Define typed pending proposal schema.
  Current state:
  typed `LearningProposal` schema and append-only `learning-proposals.jsonl` store exist. They are read-only proposal infrastructure and have no apply or promotion path.
- Define typed reverse-scaffold feedback schema and keep it telemetry/proposal-seed only at first.
  Current state:
  typed `ReverseScaffoldFeedback` schema and append-only `reverse-scaffold-feedback.jsonl` telemetry exist. They do not affect live prompts, budgets, validation, execution, or stable policy.
- Define promotion criteria and rollback fields before any stable proposal may be applied.
- Define the decision-authority chain before any learned policy may affect future decisions:
  - provider/run mode is not authority mode
  - deliberation, selection, authorization, and execution sources are separable
  - proposal behavior impact is explicit
  - authority/action/hard-shell proposals are excluded from the first promotion path
  Current state:
  fresh executor-logged transitions now record an audit-only authority chain. Explicit authority mode coverage and fresh replay/eval/review evidence remain required before P9-G3.
- Repair final selection provenance before using any record as LLM-selection evidence:
  - proposed candidate/source and final candidate/source must be separate
  - a local safety override must be explicit and must not retain LLM final-selection attribution
  - historical proposal/final mismatches must be conservatively excluded rather than rewritten
  Current state:
  G2.1 is implemented. Fresh executor-logged transitions emit `SelectionResolutionRecord`; final authority is derived from that record, and historical proposal/final mismatches are read-only excluded. The two historical additive-live card-select records remain execution history, not LLM-final-selection evidence. Fresh same-scope evidence under this contract is still required before G3.
- Use one source-resolved evidence-role and proposal-authorization contract before shadow comparison can support G3:
  - workspace-provider call, proposed/final selection, execution, provenance, and eligibility are separate facts
  - evidence tags embedded in a proposal are display context, not authorization
  - protected targets must be non-empty and valid; malformed/missing source artifacts fail closed
  Current state:
  G2.2 is implemented. Replay, proposal generation, shadow preflight, manifests, and live-rollout reporting use the shared source-resolved evidence-role classifier. It records additive source roles, final selection provenance, and one fail-closed `proposalSeedEligible` result; malformed, unknown, or empty protected targets remain ineligible. Natural evidence under this contract is still required before G3.
- Classify pre-decision policies honestly before the first stable target:
  - post-decision display is the only `presentation_only` surface
  - prompt/workspace/memory-activation guidance is `deliberation_shaping` with possible decision influence
  - candidate generation, routing/authority, execution, and hard-shell changes remain outside the first stable path
  Current state:
  G2 semantics are implemented: prompt/workspace guidance is `deliberation_shaping`, while `presentation_only` is limited to post-decision observability. The first possible G3 target remains a narrow, human-approved deliberation-shaping canary; it is not yet authorized.
- Define a minimal `EnvironmentFingerprint` and evidence environment scope before any stable proposal may be applied:
  - unknown or mixed incompatible game/mod/adapter evidence cannot qualify promotion
  - historical evidence remains readable
  - promoted objects require compatibility, invalidation, and revalidation fields
  Current state:
  fresh executor-logged transitions now record an audit-only fingerprint and scope. Missing fields remain unknown and promotion-excluded; verified complete-scope paired evidence and compatibility evaluation remain required before P9-G3.
- Define P9 exact-identity applicability and provider experiment comparability:
  - P9 may only compare/retrieve under exact complete environment fingerprint equality; this is not a P12 compatibility claim
  - provider/model/sampling/response/retry/parser/prompt-assembly facts must be named or digested for a pair
  - malformed manifest or learned-policy artifacts must be visible and fail closed
  Current state:
  G2.3 is implemented. `ProviderExperimentFingerprint` records secret-free provider source/model/mode/thinking/output/retry/recovery-attempt identity, manifests report exact-identity applicability, and manifest readers expose malformed/legacy-store diagnostics. A fresh exact-identity natural baseline/overlay/counterexample set is still required before G3.
- Define evidence-slice rules so mixed revision, mixed budget, and console fixture data cannot silently qualify stable promotion.
  Current state:
  a read-only `EvidenceSliceReader` now separates shadow readiness, live-applied rollout, and future stable-learning promotion slices. It also reports organic promotion-eligible transition counts separately from console/debug/fixture, human-observed, snapshot-only, and unknown-provenance exclusions. Promotion remains disabled and ineligible by default.
- Define budget-governance semantics before any budget-related proposal can be reviewed:
  - fixed caps are provider-profile defaults, not universal strategy
  - budget accounting is separate from budget authorization
  - cap exhaustion must be classified before recovery
  - repeated cap failure creates review/proposal evidence, not automatic escalation
  - `BudgetPolicyProposal` is proposal-only until later shadow validation and promotion gates exist
- Accept that prediction attribution starts weak, not precise, and encode that in schema and review flow.
  Current state:
  pending proposals carry weak-attribution fields such as suspected cause, confidence, counterexample need, and alternative hypotheses.
- Reject vague proposals without evidence, scope, counterexample handling, and validation planning.
  Current state:
  proposal validation keeps vague or incomplete records out of actionable pending review.

## Explicitly Not Required

These are not required before entering P9:

- wildcard broad live readiness
- every decision class being live-ready
- perfect reason-quality detectors
- total controller refactor
- adaptive Budget/Compute OS behavior
- dynamic low/medium/high/research profile selection
- live budget escalation

## First P9 Success Condition

The first honest P9 milestone is not:

```text
the agent writes stable memory automatically
```

It is:

```text
the system can turn replay/review evidence into typed pending proposals,
review them,
apply one proposal in shadow,
validate it,
and roll it back if needed
```

This success condition also requires truthful selection resolution, source-resolved evidence, an explicit decision-authority mode, exact P9 identity applicability, and a rollbackable policy-use trace. The first meaningful policy is not assumed decision-neutral merely because its initial comparison runs in shadow.
