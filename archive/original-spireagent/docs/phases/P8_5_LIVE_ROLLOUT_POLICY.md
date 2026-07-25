# P8.5 Live Rollout Policy

This document defines the operational policy for P8.5 additive live rollout.
It is intentionally narrower than the long-term North Star and more durable than a single debug note.

Canonical status still lives in `docs/04_CURRENT_STATUS.md`.
Historical evidence belongs in `DEBUG_REPORT.md`.
Turn-by-turn handoff belongs in `LLM_HANDOFF.md`.

## Philosophy

P8.5 live rollout exists to test whether the LLM can use the P8 strategic workspace in real execution while the existing safety shell remains authoritative.

The rollout goal is not to make metrics look good. The goal is to find out, with replayable evidence, whether additive workspace context improves or at least safely preserves LLM-centered strategic decision-making.

The rollout must preserve these North Star boundaries:

- The LLM remains the strategic player for live-eligible decisions.
- Local code may scaffold perception, memory activation, candidate futures, and validation.
- Local code must not quietly become a hidden strategy engine.
- Candidate generation, candidate order, scoring, fallback, validation, and execution remain protected paths.
- Stable memory, derived knowledge, and strategy parameters must not be written by rollout experiments.
- Every live decision must remain replayable, evaluable, and rollback-capable.

Budget is a guard, not a target. Evidence windows should be large enough to be meaningful and small enough to stop quickly when something goes wrong.

## First Whitelist

The first live whitelist is exactly:

- `combat:llm_required`

The first live mode is exactly:

- additive-only `legacy prompt + compact workspace summary`

Excluded from the first whitelist:

- `map:llm_required`
- `card_reward:llm_required`
- shop decisions
- reward decisions
- route decisions
- event decisions
- rest decisions
- menu decisions
- card-select decisions
- any other non-combat decision class

Any whitelist expansion requires a separate evidence window, policy/status update, and explicit human approval.

## Evidence Tiers

Rollout evidence moves through these tiers. Do not skip tiers because a higher-level metric looks convenient.

### Tier 0: Static Authorization Check

Required before any live flag is set:

- additive live flag defaults off
- whitelist is explicit
- legacy fallback remains available
- selected candidate validation remains unchanged
- semantic validation remains unchanged
- execution path remains unchanged
- rollback is a flag flip back to `STS2_P8_LIVE_ADDITIVE=0`
- audit fields are present in transition data

### Tier 1: Shadow Evidence

Purpose: prove the target decision class is provider-clean and strategically coherent before live execution.

Expected for `combat:llm_required`:

- valid shadow output
- no invalid choice
- no missing candidate
- no live-eligible invalid/error
- `failureBucket=none`
- `finishReason=stop`
- `outputCapHits=0`
- CandidateFuture `completeEnough`
- `shallowFutureCount=0`
- survival/tradeoff/future-risk cues preserved or clearly attributed

### Tier 2: Tiny Live Smoke

Purpose: prove the live additive wiring works in real execution.

This tier may be as small as one or two live-eligible combat decisions.
It is not enough to authorize broad rollout.

Required:

- temporary process env only
- whitelist exactly `combat:llm_required`
- no persistent `.env.local` changes
- additive prompt marker present on whitelisted combat calls
- non-whitelisted classes blocked before live provider invocation
- invalid=0
- error=0
- execution mismatch=0

### Tier 3: Clean Same-Budget Combat Window

Purpose: produce a comparable fresh evidence slice.

Required:

- same revision
- same budget profile
- same whitelist
- same additive mode
- `mixedRevisionWindow=false`
- `mixedBudgetWindow=false`
- provider failure bucket `none`
- finish reason `stop`
- output cap hits 0
- at least one live-eligible combat call

This tier can show that the path is healthy, but it is not promotion-usable if live-eligible volume is too small.

### Tier 4: Usable Combat-Only Rollout Evidence

Purpose: decide whether the combat-only live rollout can be expanded within the same whitelist.

Minimum bar:

- clean same-budget evidence window
- multiple `combat:llm_required` live-eligible calls in the same clean window
- liveEligibleInvalid=0
- liveEligibleError=0
- invalidChoice=0
- missingCandidate=0
- provider failure bucket `none`
- finish reason mostly or entirely `stop`
- output cap hits 0
- no execution mismatch
- reason quality does not collapse
- missing survival/tradeoff cue does not return as a persistent pattern
- CandidateFuture completeness remains healthy

This tier may justify a larger combat-only window. It does not authorize non-combat live.

### Tier 5: Next-Stage Rollout Plan

Purpose: draft a larger rollout plan after combat-only evidence is stable.

This requires:

- a written plan update
- explicit human approval
- clear stop conditions
- rollback command
- post-rollout review commands
- no expansion beyond the approved decision classes

Non-combat classes require their own Tier 1 through Tier 4 evidence.

## Acceleration Criteria

Acceleration means a larger window inside the same whitelist, not a broader whitelist.

Combat-only rollout may accelerate from tiny smoke to a larger combat-only window when:

- the latest clean same-budget window has more than one live-eligible `combat:llm_required` sample
- invalid/error/output-cap/provider failures are zero
- selected candidate validation remains clean
- execution checkpoints are explainable
- reason quality is mostly adequate
- thin reasons are isolated and attributable
- CandidateFuture completeness remains complete enough
- non-whitelisted classes are blocked before live provider invocation
- replay/eval/review agree on the interpretation

Acceleration should be gradual:

- tiny smoke
- short same-budget combat window
- larger combat-only window
- repeated combat-only windows across varied combat states
- only then consider a next-stage plan

## Stop Conditions

Stop immediately and return to `STS2_P8_LIVE_ADDITIVE=0` on any of:

- provider failure in the live slice
- unrecovered `finishReason=length`
- `outputCapHit=true`
- invalid output
- external command error
- semantic validation failure
- illegal selected candidate id
- nonexistent selected candidate id
- missing selected candidate id
- execution mismatch
- illegal game action attempt
- unexpected fallback shape
- non-whitelisted decision class reaches the live provider
- live additive changes candidate generation, order, scoring, fallback, validation, or execution
- stable memory, derived knowledge, or strategy write is attempted
- reason quality collapses into mostly thin or any missing live reason pattern
- survival/tradeoff cues disappear from additive combat evidence
- replay/eval cannot explain the window cleanly

Normal HP loss, debatable strategy, or disagreement between local and LLM is not a stop condition unless it crosses validation, execution, or rollback boundaries.

## Human Approval Gates

Human approval is required for:

- setting `STS2_P8_LIVE_ADDITIVE=1` for any rollout window
- changing `STS2_P8_LIVE_DECISION_CLASSES`
- increasing the rollout window beyond the previous approved size
- moving from combat-only tiny smoke to larger combat-only rollout
- adding any non-combat decision class
- changing provider/recovery policy for live rollout
- changing candidate generation, scoring, fallback, validation, or execution
- promoting any proposal into stable memory, derived knowledge, strategy params, or candidate templates

Approval must be paired with the exact intended scope.

## Audit Fields

Every rollout window should preserve enough data to answer what happened without guessing:

- run id
- transition id
- decision class
- whitelist
- additive flag state
- prompt mode
- whether additive context was applied
- selected candidate id
- validation result
- fallback reason and fallback policy
- provider failure category and bucket
- finish reason
- output cap hit
- retry count
- recovery policy
- token, cost, and latency telemetry when available
- reason quality and thin reasons
- CandidateFuture completeness
- shallow future count
- cue attribution
- reason cue attribution
- execution checkpoint kind and mismatch indicators
- revision tag
- budget profile
- mixed revision/budget window flags

## Rollback

Primary rollback:

```bash
STS2_P8_LIVE_ADDITIVE=0
```

Rollback rules:

- stop the live process
- preserve failed transition data
- do not delete or rewrite failed evidence
- run replay/eval/review
- update `docs/04_CURRENT_STATUS.md`, `DEBUG_REPORT.md`, and `LLM_HANDOFF.md`
- return to shadow-only or legacy-only before tuning

## Replay, Eval, And Learning Boundaries

Live rollout evidence may generate review signals and proposal-only records.
It must not directly mutate:

- stable memory
- derived knowledge
- strategy params
- candidate generation
- candidate ordering
- scoring
- fallback
- validation
- execution

Prediction-error and reason-quality signals may later produce proposals such as:

- `CombatReasonPolicy`
- `CandidateTemplate`
- `BudgetPolicy`
- prediction-check improvements

Promotion from proposal to stable behavior requires a separate guarded learning process.

## Current Policy Read

As of the current P8.5 state:

- `combat:llm_required` is the only live whitelist candidate.
- Tiny live smoke has passed.
- A larger combat-only additive boss-combat window has executed with multiple live combat decisions and no provider/validation/execution failures.
- Replay now reads `READY_FOR_P8_5_LIVE_COMBAT_ONLY`.
- Human approval has been given to enter the combat-only persistent-enable plan, and the narrow local persistent flag has been applied.
- Broad P8.5 remains no-go.
- `map:llm_required` and `card_reward:llm_required` remain blocked by missing fresh evidence and must not enter the first whitelist.

The current approved persistent-enable state is narrow:

- persist `STS2_P8_LIVE_ADDITIVE=1`
- persist `STS2_P8_LIVE_DECISION_CLASSES=combat:llm_required`
- do not persist or broaden any non-combat live class
- keep `STS2_LLM_COMMAND` supplied by the explicit bridge runner, not by the shared local env, so ordinary non-bridge runs do not block waiting for a manual responder
- immediately roll back by setting `STS2_P8_LIVE_ADDITIVE=0` if any stop condition appears

The first persistent-enabled verification run through the explicit bridge runner has completed cleanly for provider, validation, and execution. Replay now reads `READY_FOR_P8_5_LIVE_COMBAT_ONLY` after fixing report-side reason-quality attribution to evaluate the applied additive live reason when `liveAdditiveApplied=true`.

Combat-only can remain persistently enabled under this policy. Any broader live scope still requires a separate evidence ladder and approval.
