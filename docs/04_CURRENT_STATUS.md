# Current Status

This file is the canonical short-form snapshot of the project's current phase, blocker, and next step.

Do not turn it into a long narrative log. Historical detail belongs in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`.

## Mission Snapshot

The project is building an LLM-centered Slay the Spire 2 agent where the LLM remains the strategic player and the local system acts as a predictive cognitive scaffold.

## Current Phase

- Formal maturity route: P1-P10 in `../PROJECT_PLAN.md`
- Active milestone: P8.4 closeout and P8.5 pre-live readiness
- Current live posture: shadow-only for P8 workspace experiments; live additive remains disabled

## Current State

- `full` remains the sacred control-group workspace mode
- `full_bounded_candidate_futures` exists as a shadow-only experiment mode
- P8.5 static pre-audit is passed
- P8.5 live/additive is not allowed yet
- DeepSeek remains shadow-only and does not execute actions
- Stable memory, derived knowledge, and strategy mutation remain outside the current live path
- North Star alignment audit: P8 is still broadly aligned, but some inner scaffold policies are too fixed and should become evidence-backed, proposal-driven, and rollback-capable over time. See `reports/P8_NORTH_STAR_ALIGNMENT_AUDIT_2026-07-04.md`.

## Current Blocker

Broad P8.5 live readiness is still blocked, but the blocker has narrowed.

Fresh high-pressure `combat:llm_required` provider recovery has now been tested on current runtime evidence and did not reproduce the historical provider-length failure.

Historical blocker shape:

- readiness status: `NOT_READY_LIVE_SAFETY_BLOCKER`
- failure bucket: `provider_length_empty`
- finish reason: `length`
- affected transitions:
  - `transition-000130-agent-mr4sg5sl-xm6o7z`
  - `transition-000131-agent-mr4sh7t9-l925tb`

Targeted replay retest on current code recovered both transitions as valid, with `reasonQuality=adequate`, `finishReason=stop`, and `failureBucket=none`. One retest path demonstrated the intended recovery behavior: primary `length+empty` followed by truncation rescue with `thinking=disabled` and an independent rescue output cap.

Fresh runtime evidence on the same revision:

- run: `run-mr4rh1mb-tohmxl`
- fresh slice: 3 shadow calls, including 2 live-eligible high-pressure `combat:llm_required` calls
- result: valid=3, invalid=0, error=0
- liveEligibleInvalid=0, liveEligibleError=0
- failureBucket=`none`
- finishReason=`stop`
- outputCapHits=0
- retries=0

Do not erase or reinterpret the historical `provider_length_empty` transitions. They remain useful regression evidence, but current fresh evidence no longer supports treating provider length/empty as the active P8.5 blocker.

The active no-go reason is now CandidateFuture/reason-quality readiness:

- fresh combat still shows at least one `reasonQuality=thin` due `missing_tradeoff`
- combat review signals still include `missing_survival_line`
- broader live-eligible evidence is still too small for a live additive rollout
- current `reasonQuality` / review signals are useful smoke alarms, not final objectives
- minimal cue-source attribution telemetry is now implemented so fresh samples can distinguish CandidateFuture generation gaps, compression loss, and model reason omissions
- first fresh attribution sample: `transition-000136-agent-mr5p8cor-n0h5r7`
  - `combat:llm_required`, valid shadow, `reasonQuality=adequate`, `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
  - `tradeoff`, `resource_tradeoff`, and `future_risk` were preserved through serialization
  - `survival_line` existed in original futures but was lost in serialization (`compression_lost`)
  - `lethal_line` was missing before serialization (`candidate_future_missing`)
- high-pressure combat compressor refinement now preserves `survivalLine` when the original future contains survival/block/incoming/mitigation cues
- fresh post-fix samples:
  - `transition-000138-agent-mr5pj4ib-fx0yvq`
  - `transition-000139-agent-mr5pjdm4-spanei`
  - both are `combat:llm_required`, valid shadow, `reasonQuality=adequate`, `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
  - `survival_line` is now `serialization_preserved`
- extended `v5.1.6` fresh combat window:
  - since revision `2026-07-04-v5.1.6-survival-line-preservation`: called=5, liveEligibleCalled=5, valid=5, invalid=0, error=0
  - liveEligibleInvalid=0, liveEligibleError=0, failureBucket=`none`, finishReason=`stop`, outputCapHits=0
- survival-line preservation is mostly fixed, but fresh combat still shows `reasonQuality=thin` in 2/5 calls, both due `missing_tradeoff`
- fresh combat audit shows the remaining thin cases are mixed: some older samples were evaluator-sensitive, but the newest called samples still include true benefit-only reasons such as `Reduce incoming damage with free attack.` and `Block incoming 21 with 0-cost Hotfix.`
- the next narrow fix is now a combat-only reason-contract refinement in the workspace prompt: require one short sentence that names both the immediate gain and the main cost, delay, or risk this turn, without changing provider/live/candidate execution behavior
- first post-patch fresh called combat sample is `transition-000152-agent-mr5qwaky-xkx56i`; provider remained clean (`failureBucket=none`, `finishReason=stop`) but the reason was still thin: `Block immediately to survive, then scale later.`
- that means the new contract is directionally aligned but not yet sufficient evidence of improvement; combat `missing_tradeoff` remains the active fresh quality blocker
- follow-up evaluator narrowing for temporal tradeoffs is now in place, but the next fresh called combat sample (`transition-000155-agent-mr5r64iv-cljtlw`) still came back benefit-only: `Draw and energy gain to enable block.`
- this makes the current conclusion sharper: the remaining blocker is not provider and not mainly evaluator noise; fresh combat still needs stronger tradeoff expression from the reason contract itself
- this manual combat reason-contract fix is acceptable as a P8.5 transition repair, but it is now explicitly treated as a future learnable scaffold policy rather than a forever hand-written rule. Long term it should become proposal-driven through replay/eval/review attribution (`missing_tradeoff`, `missing_survival_line`, prediction error) and guarded promotion of `CombatReasonPolicy` / `CandidateTemplate` / `BudgetPolicy` candidates.
- latest fresh combat follow-up after wiring the combat-specific system prompt as well as the user prompt:
  - run: `run-mr4rh1mb-tohmxl`
  - fresh slice `last5`: called=3, liveEligibleCalled=1, valid=3, invalid=0, error=0
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - `reasonQuality=adequate` for all 3 called fresh samples in the slice
  - this is the first fresh slice after the narrowed contract fix that shows a clean called window instead of mixed adequate/thin combat reasons
- follow-up fresh high-pressure combat window on the same run strengthened that result:
  - fresh slice `last5`: called=4, liveEligibleCalled=3, valid=4, invalid=0, error=0
  - the 3 live-eligible combat reasons were:
    - `Block 6 to survive, but leaves 44 damage unblocked.`
    - `Block 6 to survive 50 damage, but no damage output.`
    - `Damage Spectral Knight to reduce incoming, but leaves block deficit.`
  - all 3 were `reasonQuality=adequate`, `finishReason=stop`, `failureBucket=none`
  - the only fresh thin reason in the slice was a non-live-eligible `combat:forced_local` end-state line
- latest promotion-quality fresh combat window:
  - run: `run-mr648yt5-h2h1dw`
  - fresh slice: called=4, liveEligibleCalled=3, valid=4, invalid=0, error=0
  - liveEligibleValid=3, liveEligibleInvalid=0, liveEligibleError=0
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`, `retryCount=0`
  - the 3 fresh live-eligible `combat:llm_required` reasons were:
    - `Use free draw to find block or combo.` (`thin`, `missing_tradeoff`)
    - `Search scaling while losing tempo.` (`adequate`)
    - `Tutor for block while conserving energy.` (`adequate`)
  - all 3 kept `candidateFutureCompleteness.completeEnough`, `shallowFutureCount=0`, and preserved `tradeoff`, `resource_tradeoff`, `future_risk`, and `survival_line` through serialization
- current canonical readiness result from replay/eval/review:
  - `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - this does **not** authorize live by itself; it means the evidence is now strong enough to draft a constrained combat-only additive live-enable plan
  - broad P8.5 is still no-go because `card_reward:llm_required` and `map:llm_required` remain blocked
  - `map:llm_required` is still a clear evidence gap: current fresh runtime evidence has `0` called fresh samples in the latest run, so it stays out of the first whitelist
  - historical provider/network failures remain visible in mixed and all-history windows and must not be washed away, but they no longer describe the current fresh combat slice

## Current Next Step

Continue P8.5 live-readiness work without enabling live additive:

- preserve `full` semantics and strategic fidelity
- keep semantic validation strict
- keep provider work limited to blocker-class regressions
- do not do more combat wording tuning unless fresh combat evidence regresses
- use the current combat-only status to draft a constrained additive live-enable plan, not to enable live yet
- keep the first whitelist narrow: `combat:llm_required` only, with legacy fallback preserved and execution unchanged
- continue separate non-combat freshness work for `card_reward:llm_required` and especially `map:llm_required`
- keep P8.5 live/additive disabled until an explicit live-enable plan is reviewed and authorized

## Draft P8.5 Combat-Only Live-Enable Plan

Status: draft only. This plan is not authorization to enable live additive.

North Star fit:

- The plan keeps the LLM as the strategic player for a narrow live-eligible combat slice.
- The additive context may only improve the LLM's strategic view of validated `CandidateFuture` tradeoffs; it must not replace candidate generation, scoring, fallback, validation, or execution.
- The outer safety shell stays fixed: selected candidate validation, semantic validation, executor legality checks, fallback, rollback, stable memory boundaries, and replay/eval review remain non-negotiable.

Scope:

- First whitelist: `combat:llm_required` only.
- Excluded from the first whitelist: `map:llm_required`, `card_reward:llm_required`, shop, reward, route, event, rest, menu, card select, and any non-combat decision class.
- Mode: additive-only `legacy prompt + compact workspace summary`.
- Forbidden first-live mode: structured-prompt-only replacement.
- Live execution path: unchanged.
- Legacy fallback: unchanged and always available.
- Provider/recovery policy: unchanged.
- Candidate generation/order/scoring: unchanged.
- Semantic validation and `selectedCandidateId` validation: unchanged.
- Stable memory, derived knowledge, and strategy writes: forbidden.

Manual gate:

- `STS2_P8_LIVE_ADDITIVE` must remain off until a human explicitly approves the rollout.
- The first authorized rollout must also set the decision-class whitelist to `combat:llm_required` only.
- Any broader whitelist requires a separate fresh evidence window and a separate plan update.

Rollback:

- Primary rollback flag: set `STS2_P8_LIVE_ADDITIVE=0`.
- Keep replay data from the failed rollout window; do not delete or wash failed transitions.
- Return to shadow-only / legacy-only behavior before further tuning.

Immediate stop conditions:

- Any provider failure in the live slice, including network, unavailable provider, `provider_length_empty`, or unrecovered empty content.
- Any `finishReason=length` that cannot be recovered.
- Any `outputCapHit=true`.
- Any invalid output or error.
- Any semantic validation failure.
- Any illegal, missing, or nonexistent `selectedCandidateId`.
- Any unexpected fallback shape or fallback rate spike that cannot be explained by normal budget or provider guards.
- Any execution mismatch or illegal action attempt.
- Any reason-quality collapse into mostly `thin` or any `missing` live decision reason.
- Any return of missing survival/tradeoff cues in the additive context.
- Any uncertainty about whether additive context changed live execution, validation, candidate generation, scoring, or fallback behavior.

Audit fields required for the first rollout window:

- run id, transition id, decision class, live whitelist, live/additive flag state, and revision tag
- legacy-only versus additive-live marker
- selected candidate id and validation result
- provider failure category and bucket
- finish reason, output cap hit, retry count, recovery policy, and latency/cost/tokens
- fallback reason and fallback policy
- reasonQuality and thin reasons
- CandidateFuture completeness, shallow count, cue attribution, and reason cue attribution
- execution checkpoint result and mismatch indicators

Fresh rollout window:

- Start with a tiny manually authorized combat-only window.
- Stop after the first few live-eligible combat decisions for review.
- Do not include `map` or `card_reward` decisions in the live whitelist even if they appear during the run.
- Treat disagreement as review signal, not failure, unless validation or execution safety is touched.

Post-rollout review commands:

```bash
npm run check
npm run data:replay -- --latest
npm run data:eval -- --latest
npm run agent:review
git status --short
```

Current planning conclusion:

- `combat:llm_required` is ready to draft this plan.
- It is not live-authorized until a human approves the manual flag rollout.
- Broad P8.5 remains no-go.
- `map:llm_required` and `card_reward:llm_required` need separate fresh readiness evidence before any whitelist expansion.

## Documentation Notes

- Long-term roadmap changes go to `../PROJECT_PLAN.md`
- Architecture or boundary changes go to `../ARCHITECTURE.md`
- Schema and telemetry changes go to `../DATA_SCHEMA.md`
- Budget-governance changes go to `../BUDGET_GOVERNANCE.md`
- Detailed history stays in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`
