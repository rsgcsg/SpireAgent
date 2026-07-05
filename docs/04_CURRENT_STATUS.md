# Current Status

This file is the canonical short-form snapshot of the project's current phase, blocker, and next step.

Do not turn it into a long narrative log. Historical detail belongs in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`.

## Mission Snapshot

The project is building an LLM-centered Slay the Spire 2 agent where the LLM remains the strategic player and the local system acts as a predictive cognitive scaffold.

## Current Phase

- Formal maturity route: P1-P10 in `../PROJECT_PLAN.md`
- Active milestone: P8.5 combat-only additive live rollout review and CandidateFuture-quality blocker triage
- Current live posture: live additive is default-off; one explicitly approved tiny `combat:llm_required` additive live window has been executed with temporary process env only

## Current State

- `full` remains the sacred control-group workspace mode
- `full_bounded_candidate_futures` exists as a shadow-only experiment mode
- P8.5 static pre-audit is passed
- Broad P8.5 live/additive is not allowed yet
- The first tiny `combat:llm_required` additive-only live window has executed; do not expand the whitelist without a separate evidence window and plan
- DeepSeek remains shadow-only and does not execute actions
- Stable memory, derived knowledge, and strategy mutation remain outside the current live path
- North Star alignment audit: P8 is still broadly aligned, but some inner scaffold policies are too fixed and should become evidence-backed, proposal-driven, and rollback-capable over time. See `reports/P8_NORTH_STAR_ALIGNMENT_AUDIT_2026-07-04.md`.
- P8.5 live rollout policy is now canonicalized in `P8_5_LIVE_ROLLOUT_POLICY.md`.

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
- class-level combat review telemetry still includes historical `missing_survival_line`, but the newest called/live-eligible revision-window samples no longer reproduce it
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
- current canonical readiness result from replay/eval/review after the narrow attribution fix:
  - `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE`
  - this is a healthier result than the earlier `combat_candidate_future_quality_not_clear` block, because the gate no longer treats budget-skipped review-only combat signals as fresh live blocker evidence
  - combat still clears the class-quality gate on called live-eligible evidence and remains the first whitelist candidate
  - broad P8.5 is still no-go because `card_reward:llm_required` and `map:llm_required` remain blocked
  - `map:llm_required` is still a clear evidence gap: current fresh runtime evidence has `0` called fresh samples in the latest run, so it stays out of the first whitelist
  - historical provider/network failures remain visible in mixed and all-history windows and must not be washed away, but they no longer describe the current fresh combat slice
- latest blocker audit for `combat_candidate_future_quality_not_clear`:
  - the active `missing_survival_line` that trips the class-level combat future-quality gate comes from `transition-000026-agent-mr6f5b3k-fx42ij`
  - that transition was `called=false`, `outcome=skipped`, `budget.status=call_budget_exceeded`, so it is not fresh called live-eligible evidence
  - its cue attribution is still useful: `survival_line` existed in the original future and was lost in bounded serialization (`compression_lost`)
  - this means there is a real compression warning worth keeping, but the current blocker is mostly an evidence-window / readiness-aggregation issue, because non-called budget-skipped review signals are currently mixed into class-level live-readiness gating
  - `missing_lethal_line` is present on fresh called combat transitions `transition-000001-agent-mr649465-7hdlvb` and `transition-000002-agent-mr6498uu-ovos54`, both with `compression_lost`; this is a review-quality warning, not the current hard blocker
  - the old fresh `missing_tradeoff` sample remains `transition-000001-agent-mr649465-7hdlvb`, but cue attribution shows `tradeoff` was preserved in serialization and omitted by the model reason (`model_reason_omitted`), so it is not a CandidateFuture-content failure
  - honest read: cue attribution is doing its job; the next narrow engineering question is whether combat live-readiness should gate on all class-level review signals, or only on called/live-eligible/current-window evidence
- readiness attribution semantics are now narrowed:
  - combat live gate now evaluates CandidateFuture-quality blockers from `liveEligibleCalled` completeness/signals, not from all class transitions
  - replay/review still keep the full `signals=` line for historical smoke alarms
  - replay/review now also show `liveComplete=` and `liveSignals=` so readiness and review can be read separately
  - latest replay confirms the intended effect:
    - `combat:llm_required` still shows `signals={"missing_lethal_line":2,"missing_survival_line":1}`
    - readiness now uses `liveSignals={"missing_lethal_line":2}` and `liveComplete=27/27`
    - canonical status therefore drops back to `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE` instead of `NOT_READY_CANDIDATE_FUTURE_QUALITY`
- newest narrow runtime safety cleanup:
  - repeated no-progress local-action churn was found in `run-mr648yt5-h2h1dw` on `combat:local_fast_combat`, not on `combat:llm_required`
  - the controller now blocks immediately repeating the exact same action on the exact same state after an `unknown` checkpoint whose reasons include `settlement_timeout_or_no_visible_change`
  - this is intentionally narrow and does not change additive-live policy, provider recovery, candidate generation, scoring, semantic validation, or execution semantics
  - first retest after the patch did not reproduce the earlier repeated `Offering` loop
  - that retest also did not add new fresh `combat:llm_required` live-eligible evidence, so the blocker remains evidence volume rather than a local repeated-action bug
- latest same-budget combat-only additive attempt after the guard:
  - used temporary process env only; no persistent live flag change
  - earlier we misread this window as a persistence gap because we inspected the run surface too early and treated `run-mr71izvf-roz0yp` as menu-only
  - corrected audit shows the additive combat window did persist into `run-mr71izvf-roz0yp`, which now contains 10 transitions total and 8 `combat:llm_required`
  - replay/eval/review all resolve that run cleanly, so there is no active recorder or replay-artifact blocker from this window
  - honest read: the real remaining limit is evidence scope, not missing persistence
- root cause of the earlier silent windows is now clear:
  - `npm run agent:run:bridge` is a manual/Codex bridge path, not a direct model caller
  - without an external bridge responder writing `/tmp/sts2-llm-bridge/response-<id>.json`, `tick()` blocks waiting for the LLM command and no new transition is recorded
  - this was an operational usage mistake, not a game-window problem and not a provider/runtime regression
- separate corrected read for the later `run-mr71izvf-roz0yp` continuation:
  - once the bridge responses were actually supplied, additive combat decisions were recorded normally
  - that run is now canonical evidence, but it stops at a `combat -> card_select` transition after `Hologram`
  - this matters for rollout reading: the persisted run is valid, yet its tail naturally leaves the combat-only whitelist surface and should not be over-read as non-combat readiness evidence
- fresh corrected tiny live window with an active bridge responder:
  - run: `run-mr6gnmo8-egk8sr`
  - transitions: 4
  - all 4 were fresh `combat:llm_required`, additive live-eligible, called, valid, and executed
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`, invalid=0, error=0
  - replay now reports `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - broad P8.5 still remains blocked by missing fresh `card_reward:llm_required` and `map:llm_required` evidence
- follow-up controlled combat-only live window on the same run:
  - run remains `run-mr6gnmo8-egk8sr`
  - total transitions now 12, with `combat:llm_required` transitions 10 and fresh live-eligible called shadow decisions 6
  - latest replay remains `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - provider stayed clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`, invalid=0, error=0
  - one low-visibility `Coolheaded` action produced an acceptable `unknown` checkpoint with settlement timeout, but did not repeat into no-progress churn and did not create a live safety blocker
  - fresh `combat:llm_required` reason quality is usable but not perfect: `adequate=4`, `thin=2`, both thin cases remain `missing_tradeoff`
- more formal narrow combat-only rollout step:
  - same whitelist, same temporary flags, same active bridge responder
  - run `run-mr6gnmo8-egk8sr` now has 17 transitions total and 13 `combat:llm_required`
  - provider is still clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`, invalid=0, error=0
  - however, the longer fresh window re-opened a quality blocker: replay now reports `NOT_READY_CANDIDATE_FUTURE_QUALITY`
  - current combat blocker is no longer provider; it is fresh live combat review telemetry: `liveSignals={"missing_survival_line":2}`
  - one new `end_turn` transition also finished with `checkpoint.kind=unknown`, which eval classed as `needs_fixture_bug_candidate`; this is not a provider failure, but it is rollout-relevant evidence that the longer slice is not fully clean yet
- narrow audit of those fresh combat warnings:
  - the two live-eligible `missing_survival_line` samples in `run-mr6gnmo8-egk8sr` are `transition-000027-agent-mr6h1qwn-tpxci4` and `transition-000030-agent-mr6h28hh-5kylgc`
  - both transitions have `candidateFutureCueAttribution.cues.survival_line = { original: true, serialized: false, source: "compression_lost" }`
  - honest read: this is not a raw CandidateFuture-generation miss; the original combat futures already contained survival cues, and the warning is coming from bounded presentation / cue-detection semantics after serialization
  - those same transitions still show `candidateFutureCompleteness.completeEnough` and `shallowFutureCount=0`; the blocker is specifically survival-cue preservation, not whole-future collapse
  - the same run also contains earlier non-live-eligible `missing_survival_line` samples (`transition-000020-agent-mr6gz7zd-qmwy4a`, `transition-000024-agent-mr6gz9js-02y385`) with the same `compression_lost` attribution, so review and readiness must keep distinguishing called/live-eligible evidence from class-wide smoke alarms
- narrow audit of the new `end_turn` unknown checkpoint:
  - `transition-000032-agent-mr6h2hek-umgnbj` is `decisionAudit.route="forced_local"` and `chosenBy="local"`, not an additive/provider decision
  - the action is a single forced `end_turn` at `energy=0` with only one legal action left; execution returned `status="ok"`
  - post-state is an enemy-turn death state (`hp=0`, `turn="enemy"`, `isPlayPhase=false`), which matches the reported manual `room boss` console positioning and death-tail behavior
  - honest read: this is more likely a low-visibility / console-induced tail state than a new provider or live-path regression
  - keep it as a runtime/program-risk candidate until it is disproved without console injection, but do not treat it as evidence that the additive combat path itself regressed
- current narrow fix:
  - bounded high-pressure combat futures now preserve survival cues more explicitly
  - the compressor synthesizes a normalized `survivalLine` from `player_hp_delta` checks when possible and also recognizes current Chinese survival-risk phrasing
  - the review detector now recognizes both English and Chinese survival cues instead of treating Chinese-only bounded cues as automatic `compression_lost`
  - no provider/live/candidate/scoring/execution semantics changed
- fresh post-fix revision-window confirmation:
  - current run remains `run-mr6gnmo8-egk8sr`
  - since revision `2026-07-05-v5.1.7-survival-cue-preservation`: called=8, liveEligibleCalled=2, valid=8, invalid=0, error=0
  - provider stayed clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - the two fresh called/live-eligible combat samples are:
    - `transition-000267-agent-mr71482w-j3adut`
    - `transition-000283-agent-mr717m6i-si8tfm`
  - both are `reasonQuality=adequate`
  - both have `candidateFutureReviewSignals={}`
  - both keep `candidateFutureCompleteness.completeEnough=3`, `shallowFutureCount=0`
  - both record `candidateFutureCueAttribution.cues.survival_line = { original: true, serialized: true, source: "serialization_preserved" }`
  - honest read: fresh called/live-eligible `missing_survival_line` has stopped reproducing on the new revision; the remaining blocker is promotion evidence depth plus older aggregated smoke alarms, not current survival-cue loss
- console-assisted evidence rule for current milestone:
  - if runtime positioning used STS2 console commands such as `room boss`, mark the window as `console-assisted`
  - post-death or post-boss non-progression in a `console-assisted` window is review-relevant but not treated as canonical live-path regression unless it reproduces without console injection
  - for future windows, explicitly note when console commands were used so replay/readiness interpretation does not overfit console side effects

## Current Next Step

Continue P8.5 combat-only live rollout under `P8_5_LIVE_ROLLOUT_POLICY.md`:

- preserve `full` semantics and strategic fidelity
- keep semantic validation strict
- keep provider work limited to blocker-class regressions
- do not do more combat wording tuning unless fresh combat evidence regresses
- keep the first whitelist narrow: `combat:llm_required` only, with legacy fallback preserved and execution unchanged
- use temporary process env only for approved rollout windows
- do not expand live after the latest larger combat-only window; replay now honestly blocks on insufficient promotion-usable live-eligible evidence
- inspect missing survival/tradeoff/lethal cue attribution before another combat rollout window
- readiness attribution / evidence-window semantics fix is now in place
- the fresh `missing_survival_line` re-audit is now complete on the current revision
- current evidence says survival cues are preserved on fresh called/live-eligible combat samples
- the next narrow step is no longer survival-cue repair or persistence debugging; it is collecting a slightly thicker same-budget combat promotion window without widening scope
- latest same-budget combat-only additive continuation:
  - additive live remained temporary-env only, whitelist still `combat:llm_required` only
  - the later `act=2 floor=11` continuation did persist in `run-mr71izvf-roz0yp`; it is not a menu-only stub
  - `run-mr71izvf-roz0yp` now contains 10 transitions total and 8 `combat:llm_required`
  - replay/eval/review all read that run cleanly:
    - valid live-eligible called combat shadow decisions: `4`
    - invalid=`0`, error=`0`
    - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
    - `reasonQuality={"adequate":4}`
    - readiness: `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - the persisted combat sequence includes `Scrape`, `Offering`, `Restlessness`, `Strike+`, `Subroutine`, `Chill`, `Defend`, and `Hologram`
  - honest read: there is no active recorder/persistence blocker here; this is canonical combat evidence
- newest narrow continuation on the same run:
  - run remains `run-mr71izvf-roz0yp`
  - an in-combat `card_select:local_recommended_llm_arbitrate` screen appeared first and was correctly blocked by the combat-only whitelist:
    - `transition-000011-agent-mr72t8hf-yr4any`
    - `fallbackReason=live_additive_decision_class_not_whitelisted`
    - this is healthy boundary behavior, not a rollout failure
  - two additional additive live combat calls then landed cleanly:
    - `transition-000018-agent-mr72tqfd-hhc785` / `Charge Battery`
    - `transition-000019-agent-mr72tr6y-9ea5oy` / `Tesla Coil -> The Insatiable`
  - both are `combat:llm_required`, `chosenBy="llm"`, `outcome=valid`, `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
  - the model reasons were:
    - `Block now to cut incoming, but it slows damage or scaling.`
    - `Push damage now, but it still leaves a block deficit.`
  - replay/eval still read the full run as `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - nuance: after those two live calls, the fight naturally fell back into `local_fast_combat`, so `last5` is no longer a clean combat-live slice even though the full same-revision window remains clean
  - honest read: this strengthens combat-only evidence, but if we want a cleaner promotion slice than `last20`, the next runtime window should stop earlier right after the next 1-2 live-eligible combat calls
- current honest read is now narrower:
  - historical `missing_survival_line` still matters as review telemetry and should not be erased
  - current fresh called/live-eligible combat evidence points away from active survival-cue loss and provider instability
  - the remaining constraint is evidence scope and whitelist boundaries, not artifact persistence
  - the run tail ends on a real `combat -> card_select` transition after `Hologram`, so it supports combat-only rollout judgment but not non-combat whitelist expansion
  - the `end_turn` unknown checkpoint is not currently strong evidence of a live-path blocker because it sits on a forced-local death tail and may be amplified by manual `room boss` console usage
- continue separate non-combat freshness work for `card_reward:llm_required` and especially `map:llm_required`
- keep P8.5 live/additive default-off outside explicitly approved bounded windows

## P8.5 Combat-Only Live-Enable Plan

Status: approved and executed once as a tiny temporary-env rollout. Live remains off by default and must be explicitly re-enabled for any future window.

The manual approval is scoped to:

- `combat:llm_required` only
- additive-only
- small window
- strict stop conditions
- immediate rollback to `STS2_P8_LIVE_ADDITIVE=0` on any anomaly

Implementation and rollout status:

- The controller consumes additive P8 context only when `STS2_P8_LIVE_ADDITIVE=1` and the current decision class is explicitly whitelisted.
- Non-whitelisted classes are blocked before the live LLM call and fall back with `fallbackReason=live_additive_decision_class_not_whitelisted`.
- The approved rollout used `STS2_LLM_COMMAND="node scripts/llm-bridge-decider.mjs"` as a temporary process env value; it was not written to `.env.local`.
- DeepSeek remains P8 shadow-only and was not used as the live executor.

Tiny rollout evidence:

- run: `run-mr648yt5-h2h1dw`
- temporary flags: `STS2_P8_LIVE_ADDITIVE=1`, `STS2_P8_LIVE_DECISION_CLASSES=combat:llm_required`
- non-whitelist guard check: one `card_select:local_recommended_llm_arbitrate` transition was blocked before the live LLM call and used fallback
- live additive combat decisions executed: 2
  - `play-4-MECHA_KNIGHT_0` / Scrape, reason: `Scrape deals damage and draws toward block, but risks taking most incoming.`
  - `play-5` / Defend, reason: `Defend reduces incoming damage, but delays offense and leaves most attack unblocked.`
- follow-up same-budget combat-only window on the same run:
  - one additional additive live combat decision executed: `play-1-MECHA_KNIGHT_0` / Ultimate Strike, reason `Ultimate Strike pushes damage now, but leaves most incoming damage unblocked.`
  - later ticks in that window naturally routed to `combat:local_fast_combat` rather than `combat:llm_required`
  - this is good boundary behavior, but it means the clean same-budget fresh slice still contains only `liveEligibleCalled=1`
- live additive prompt mode: `additive_legacy_prompt_plus_compact_workspace_summary`
- whitelist: `combat:llm_required` only
- observed failures: invalid=0, error=0, execution mismatch=0
- provider shadow telemetry remained clean in the latest replay slice: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
- latest replay now shows two useful truths at once:
  - the fresh `last5` slice is now clean same-budget: `plannedShadowCallValueCounts={"4":5}`, `mixedBudget=false`, `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - overall readiness still reports `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE` because the class-level promotion window is still judged unusable: the clean `last5` slice only has `liveEligibleCalled=1`, while the broader since-revision window still mixes earlier `plannedShadowCalls=2` and `4`

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

- `STS2_P8_LIVE_ADDITIVE` must remain off unless a human explicitly approves a bounded rollout window.
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

- `combat:llm_required` has passed a tiny additive-only live smoke window with the bridge adapter.
- A larger combat-only additive window then produced multiple real live combat decisions with no invalid output, provider failure, output-cap hit, missing candidate, or execution mismatch.
- Replay/eval still downgraded readiness to `NOT_READY_CANDIDATE_FUTURE_QUALITY`, with `combat_candidate_future_quality_not_clear`; treat that as a stop signal for rollout acceleration.
- Per `P8_5_LIVE_ROLLOUT_POLICY.md`, the current tier has enough execution smoke to continue analysis, but not enough quality clearance to broaden or fully advance combat live.
- Broad P8.5 remains no-go.
- `map:llm_required` and `card_reward:llm_required` need separate fresh readiness evidence before any whitelist expansion.

## Documentation Notes

- Long-term roadmap changes go to `../PROJECT_PLAN.md`
- Architecture or boundary changes go to `../ARCHITECTURE.md`
- Schema and telemetry changes go to `../DATA_SCHEMA.md`
- Budget-governance changes go to `../BUDGET_GOVERNANCE.md`
- Detailed history stays in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`
