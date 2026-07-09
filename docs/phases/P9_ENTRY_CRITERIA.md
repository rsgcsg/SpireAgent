# P9 Entry Criteria

P9 should start only when the project is ready to shift from live-scaffold expansion to guarded learning infrastructure.

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
  live/provider-originated memory updates and strategy-parameter suggestions are blocked/audited by default, and the future stable-write target vocabulary is explicit. The gate still needs to expand into the full future proposal/promotion surface before stable learning can be enabled.
- Decide how legacy `finalizeRun()` writes are handled during P9:
  - freeze
  - isolate
  - or gate behind explicit legacy-local-learning labeling
  Current state:
  legacy finalize stable writes are blocked by default, audited, and labeled as `legacy_local_learning`. If explicitly enabled, the path is still audited as legacy finalize and remains separate from P9 proposal promotion.
- Define typed pending proposal schema.
- Define typed reverse-scaffold feedback schema and keep it telemetry/proposal-seed only at first.
- Define promotion criteria and rollback fields before any stable proposal may be applied.
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
- Reject vague proposals without evidence, scope, counterexample handling, and validation planning.

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
