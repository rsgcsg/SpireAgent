# P8 / P8.5 Closeout

This document is the canonical closeout record for P8 and P8.5.

It answers a narrow question:

```text
What did P8 actually finish,
what remains explicitly unfinished,
and what must be true before the project should call P8 closed
and enter P9 guarded learning work?
```

Read with:

- `../../PROJECT_NORTH_STAR.md`
- `../../PROJECT_PLAN.md`
- `../../ARCHITECTURE.md`
- `../../DATA_SCHEMA.md`
- `../../REPLAY_AND_EVAL.md`
- `../04_CURRENT_STATUS.md`

## Scope

P8 is the phase where `DeliberationPacket` enters the LLM workspace in a replayable, auditable, and feature-flagged way.

P8.5 is the phase where that workspace may be used in additive live form behind an explicit whitelist, strict validation, and immediate rollback.

P8/P8.5 do not include:

- wildcard live rollout
- broad unbounded `:llm_required` enablement
- automatic stable memory writes
- automatic derived knowledge writes
- automatic strategy-param writes
- automatic scaffold-policy promotion

## What P8 Finished

- `StrategicImpression`, `SalienceSignal`, `MemoryActivation`, `CandidateFuture`, `DeliberationPacket`, `PredictionErrorRecord`, `ReplayFrame`, and `ConsolidationRecord` are recorded on fresh transitions.
- P8 workspace comparison and provider telemetry are recorded in replay/eval/review.
- `full` remains the control-group workspace mode.
- `full_bounded_candidate_futures` exists as a shadow-only experiment and did not silently replace `full`.
- DeepSeek shadow provider plumbing exists with provider failure classification, retry telemetry, and bounded workspace experiments.
- Additive live prompting exists behind `STS2_P8_LIVE_ADDITIVE` and an explicit decision-class whitelist.
- DeepSeek command live adapter exists and has been exercised on real live additive calls.
- P9.0 hardening has started:
  - live/provider-originated memory updates are blocked by default
  - legacy `finalizeRun()` stable writes are blocked by default and audited
  - replay/eval/review now expose a separate live-applied rollout summary
- Explicit whitelist live evidence now exists for:
  - `combat:llm_required`
  - `card_reward:llm_required`
  - `map:llm_required`
  - `rest:llm_required`
  - `shop:llm_required`
  - `event:llm_required`
  - `card_select:local_recommended_llm_arbitrate`
- Latest broad-whitelist evidence run `run-mr8pwmtm-4z75zt` recorded 15 additive live decisions with:
  - provider source `deepseek-live-command`
  - invalid output `0`
  - invalid choice `0`
  - missing candidate `0`
  - provider error `0`
  - fallback live decision `0`
  - output-cap hit `0`

## What P8 Explicitly Did Not Finish

- Wildcard broad live is not authorized.
- Route, reward, menu, and other unlisted classes are not broad-live ready by default.
- P8 readiness reporting is still partly shadow/combat-first and does not fully describe current broad live-applied evidence.
- Stable learning promotion does not exist.
- Protected-path stable-write governance is only partially hardened.
- Replay/eval/review can surface proposal evidence, but they do not yet drive a promotion pipeline.

## Honest Status

P8 can be closed only under this name:

```text
P8/P8.5 explicit-whitelist live scaffold MVP complete
```

P8 cannot honestly be closed under any of these names:

- broad wildcard live complete
- autonomous learning complete
- stable scaffold-promotion complete
- all decision classes live-ready
- proposal-driven guarded learning complete

## Hard Closeout Conditions

Before the project marks P8 closed and starts P9 implementation, these conditions should be true:

1. P8 live remains explicit-whitelist only.
2. `full` remains unchanged in meaning.
3. Provider/validation/execution cleanliness is demonstrated on the current broad-whitelist path.
4. P8 closeout debt is captured in a durable debt register.
5. P9 entry criteria are written down and accepted as the next real gate.
6. No one treats handoff/debug files as the canonical source for current P8 state.

## P8 Exit Risks

These are the main ways the project could mis-call P8 as complete:

- confusing explicit whitelist live with wildcard broad live
- confusing prompt/candidate/reason patching with real learning
- treating adapter-side stripping as sufficient protection for stable writes
- letting stale shadow-only readiness reports override live-applied evidence
- continuing class-by-class manual perfection work instead of moving to proposal-driven guarded learning

## Required Follow-On

P9 must begin with hardening and proposal infrastructure, not with more live expansion and not with direct stable learning writes.

See:

- [P8_P9_DEBT_REGISTER.md](../debt/P8_P9_DEBT_REGISTER.md)
- [P9_ENTRY_CRITERIA.md](P9_ENTRY_CRITERIA.md)
- [P9_GUARDED_LEARNING_PLAN.md](P9_GUARDED_LEARNING_PLAN.md)
