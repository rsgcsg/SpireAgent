# Current Status

This file is the canonical short-form snapshot of the current phase, blocker, and next step.

Do not turn it into a narrative log. Detailed history belongs in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`.

## Current Phase

- Formal route: P0-P13 in `../PROJECT_PLAN.md`
- Active milestone: P8/P8.5 closeout, P9.0 hardening, P9.1 read-only proposal infrastructure, P9.2 weak-attribution proposal seeding, and P9.5A offline shadow-workspace comparison
- Live posture: explicit additive whitelist live is real and locally exercised; wildcard broad live remains forbidden

## Current Truth

- `full` remains the sacred P8 control-group workspace mode
- `full_bounded_candidate_futures` remains a shadow-only experiment mode
- DeepSeek has both:
  - P8 shadow workspace provider plumbing
  - command-adapter live additive execution for explicit whitelisted classes
- Latest guarded broad-whitelist evidence run is `run-mr8pwmtm-4z75zt`
- Latest broad-whitelist live evidence recorded:
  - 73 transitions
  - 15 additive live decisions
  - provider source `deepseek-live-command`
  - invalid output `0`
  - invalid choice `0`
  - missing candidate `0`
  - provider error `0`
  - output-cap hits `0`
  - fallback live decisions `0`
- Current locally exercised whitelist:
  - `combat:llm_required`
  - `card_reward:llm_required`
  - `map:llm_required`
  - `rest:llm_required`
  - `shop:llm_required`
  - `event:llm_required`
  - `card_select:local_recommended_llm_arbitrate`

## Current Blocker

The active blocker is no longer provider reachability or P8 workspace survival-cue preservation.

The real blocker is now the gap between P9.0 hardening and real proposal-driven learning:

- protected-path gating is only partially landed
- live-applied rollout reporting now exists, but older shadow-first readiness semantics still coexist beside it
- typed learning proposal schema/store has started as append-only read-only P9.1 infrastructure
- typed reverse-scaffold feedback schema/store has started as append-only read-only telemetry
- proposal review-decision ledger has started as append-only audit-only P9.1 infrastructure
- weak-attribution proposal seed generation has started as P9.2 infrastructure; default CLI mode is dry-run and explicit writes are append-only run artifacts
- first-class read-only evidence slicing has started; proposal seed generation now excludes ineligible console/debug/fixture/unknown evidence by default; stable-promotion eligibility remains disabled until proposal/promotion gates exist
- P9.5A can assemble a low-risk proposal only into a cloned offline `DeliberationPacket` and compare baseline versus overlay workspace prompts; it cannot call a provider, write a run artifact, change live/runtime behavior, or promote stable policy
- budget governance has a clearer staged roadmap, but runtime adaptive Budget/Compute OS behavior remains deferred to P13
- weak proposal attribution and anti-vague proposal validation are implemented for pending proposals; stable-promotion gates are still not implemented

## What Is Explicitly Not True

- wildcard broad live is not authorized
- all decision classes are not live-ready
- stable learning is not implemented
- P9.1/P9.2 typed proposal, review-decision, reverse-feedback, and proposal-seed infrastructure is append-only/audit-only; stable-promotion machinery has not started
- `LLM_HANDOFF.md` and `DEBUG_REPORT.md` are not the canonical source of truth

## Next Step

Continue from P9.2/P9.3 proposal seeding and P9.5A offline shadow assembly while keeping P9.0 hardening intact:

1. finish protected-path hardening by treating remaining legacy stable-write paths as gated legacy behavior, not normal learning
2. keep live-applied rollout audit separate from stale shadow-only readiness semantics in replay/eval/review
3. keep expanding read-only evidence slicing so mixed budget/profile, console/debug, live/shadow, and promotion evidence stay separate
4. use `npm run learning:proposals` for inspection of typed proposals, audit-only review decisions, reverse feedback, and dry-run proposal seed generation
5. next add P9.5B evaluation semantics: compare an eligible overlay against the same evidence slice without provider/live execution, then define what counts as shadow validation before any P9.6 design

## Canonical Follow-On Docs

- [P8_CLOSEOUT.md](phases/P8_CLOSEOUT.md)
- [P8_P9_DEBT_REGISTER.md](debt/P8_P9_DEBT_REGISTER.md)
- [P9_ENTRY_CRITERIA.md](phases/P9_ENTRY_CRITERIA.md)
- [P9_ENTRY_DECISION.md](phases/P9_ENTRY_DECISION.md)
- [P9_GUARDED_LEARNING_PLAN.md](phases/P9_GUARDED_LEARNING_PLAN.md)
- [P9_P13_EXECUTION_ROADMAP.md](phases/P9_P13_EXECUTION_ROADMAP.md)
- [P8_5_LIVE_ROLLOUT_POLICY.md](phases/P8_5_LIVE_ROLLOUT_POLICY.md)
- [LLM_RUN_MODES.md](runbooks/LLM_RUN_MODES.md)
