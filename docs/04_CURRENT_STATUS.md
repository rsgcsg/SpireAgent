# Current Status

This file is the canonical short-form snapshot of the current phase, blocker, and next step.

Do not turn it into a narrative log. Detailed history belongs in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`.

## Current Phase

- Formal route: P1-P10 in `../PROJECT_PLAN.md`
- Active milestone: P8/P8.5 closeout and early P9.0 hardening
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
- typed learning proposal schema/store has not started
- weak prediction attribution, anti-vague-proposal rules, and stable-promotion gates are documented but not implemented

## What Is Explicitly Not True

- wildcard broad live is not authorized
- all decision classes are not live-ready
- stable learning is not implemented
- P9 proposal-driven learning has not started in engineering terms yet
- `LLM_HANDOFF.md` and `DEBUG_REPORT.md` are not the canonical source of truth

## Next Step

Continue and complete P9.0 hardening:

1. finish protected-path hardening by treating remaining legacy stable-write paths as gated legacy behavior, not normal learning
2. keep live-applied rollout audit separate from stale shadow-only readiness semantics in replay/eval/review
3. start typed learning proposal schema/store work for P9.1

## Canonical Follow-On Docs

- [P8_CLOSEOUT.md](/Users/fire/Desktop/SpireAgent/docs/phases/P8_CLOSEOUT.md)
- [P8_P9_DEBT_REGISTER.md](/Users/fire/Desktop/SpireAgent/docs/debt/P8_P9_DEBT_REGISTER.md)
- [P9_ENTRY_CRITERIA.md](/Users/fire/Desktop/SpireAgent/docs/phases/P9_ENTRY_CRITERIA.md)
- [P9_GUARDED_LEARNING_PLAN.md](/Users/fire/Desktop/SpireAgent/docs/phases/P9_GUARDED_LEARNING_PLAN.md)
- [P8_5_LIVE_ROLLOUT_POLICY.md](/Users/fire/Desktop/SpireAgent/docs/phases/P8_5_LIVE_ROLLOUT_POLICY.md)
- [LLM_RUN_MODES.md](/Users/fire/Desktop/SpireAgent/docs/runbooks/LLM_RUN_MODES.md)
