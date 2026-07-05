# Portable Agent Debug Report

> Historical append-only debug log. This file records what was true during earlier engineering passes; older "current status" sections may be stale. It is not the canonical source for current phase, blocker, roadmap, or architecture. Start from `docs/00_START_HERE.md` and `docs/04_CURRENT_STATUS.md`, then use `PROJECT_NORTH_STAR.md`, `PROJECT_AUTHORITY_GUIDE.md`, `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `GAME_IO_CAPABILITIES.md`, and `DATA_SCHEMA.md` as source of truth.

## 2026-07-05 Controlled Combat-Only Continuation On `run-mr71izvf-roz0yp`

- Kept the same narrow rollout boundaries:
  - temporary process env only
  - whitelist still only `combat:llm_required`
  - no provider/recovery change
  - no candidate/scoring/fallback/validation/execution change
- New fresh additive combat transitions:
  - `transition-000050-agent-mr7dqa5v-c5tx6x`
    - reason: `Push damage and draw now, but it spends this turn into 30 incoming.`
    - `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`, `retryCount=0`
    - `candidateFutureReviewSignals={}`
    - `candidateFutureCompleteness.completeEnough=3`, `shallowFutureCount=0`
    - cue attribution:
      - `tradeoff=serialization_preserved`
      - `resource_tradeoff=serialization_preserved`
      - `future_risk=serialization_preserved`
      - `survival_line=serialization_preserved`
  - `transition-000051-agent-mr7dqzlx-f5ekbt`
    - reason: `Take the free chip and preserve energy, but it still leaves the 30 incoming mostly unanswered.`
    - `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
    - `candidateFutureReviewSignals={}`
    - `candidateFutureCompleteness.completeEnough=3`, `shallowFutureCount=0`
    - cue attribution:
      - `tradeoff=serialization_preserved`
      - `resource_tradeoff=serialization_preserved`
      - `survival_line=serialization_preserved`
      - `future_risk=compression_lost` (review-only warning, not a live blocker in this slice)
- Replay/eval/review after the continuation:
  - `last5`: called=4, valid=4, invalid=0, error=0
  - `reasonQuality={"adequate":4}`
  - `failureBucket={"none":4}`, `finishReason={"stop":4}`, `outputCapHits=0`
  - top-level readiness still stays conservative because `combat:llm_required` is judged over a broader class window than just this continuation
- Honest interpretation:
  - this continuation is clean on the unit that matters for rollout policy: fresh called/live-eligible combat
  - provider is not the blocker
  - current caution is mostly evidence synthesis and promotion depth, not a reopened combat regression

## 2026-07-05 Focused Fresh Combat Slice For Rollout Judgment

- To reduce evidence-retrieval churn, replay/eval/review now expose a focused rollout slice instead of forcing operators to infer from raw `last5`.
- Canonical combat-only rollout slice:
  - `combat:llm_required:fresh_live_eligible`
- It filters to:
  - `decisionClass="combat:llm_required"`
  - `called=true`
  - `liveEligible=true`
  - same revision
  - same `plannedShadowCalls`
- This intentionally excludes trailing `combat:local_fast_combat` and `combat:forced_local` tails from the rollout judgment unit.
- Latest focused slice on `run-mr71izvf-roz0yp`:
  - samples=5
  - transitions:
    - `transition-000045-agent-mr7dj2e4-0txyci`
    - `transition-000050-agent-mr7dqa5v-c5tx6x`
    - `transition-000053-agent-mr7dyyfy-ylbli2`
    - `transition-000055-agent-mr7dzyc1-3ahlwm`
    - `transition-000061-agent-mr7ea81s-rnm5rs`
  - `called=5`, `liveEligibleCalled=5`, `valid=5`, `liveEligibleValid=5`
  - `invalid=0`, `liveEligibleInvalid=0`, `error=0`, `liveEligibleError=0`
  - `failureBucket={"none":5}`
  - `finishReason={"stop":5}`
  - `outputCapHits=0`
  - `thinReasons={"missing_tradeoff":1}`
- Operational interpretation:
  - provider and recovery are currently clean on the combat-only evidence unit that matters
  - raw trailing windows like `last5` are still useful for situational debugging, but not for first-whitelist rollout judgment
  - this does not broaden authorization: `map`, `card_reward`, and other non-combat classes remain outside the first live whitelist

## 2026-07-05 Slightly More Aggressive Combat-Only Continuation

- Ran one slightly more aggressive but still narrow rollout window:
  - same whitelist: `combat:llm_required`
  - same temporary-env additive mode
  - same active bridge responder
  - no provider/recovery/candidate/scoring/fallback/validation/execution changes
- Fresh additive combat transitions:
  - `transition-000053-agent-mr7dyb2f-txe4z9`
    - reason: `Push heavier damage now, but it leaves the 30 incoming mostly unanswered.`
    - `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
  - `transition-000055-agent-mr7dzyc1-3ahlwm`
    - reason: `Take the free chip now, but it still leaves most of the 30 incoming unanswered.`
    - `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
- These were followed by local tail transitions:
  - `transition-000056-agent-mr7e03eg-kdwmxu` (`combat:local_fast_combat`)
  - `transition-000057-agent-mr7e03p9-l5g8lo` (`combat:local_fast_combat`)
  - `transition-000058-agent-mr7e03xf-0cr4e7` (`combat:local_fast_combat`)
  - `transition-000059-agent-mr7e049f-0cmjlr` (`combat:forced_local`)
- Replay/eval interpretation:
  - `last20`: called=16, liveEligibleCalled=7, valid=16, liveEligibleValid=7, invalid=0, error=0
  - `failureBucket={"none":16}`, `finishReason={"stop":16}`, `outputCapHits=0`
  - `reasonQuality={"adequate":12,"thin":4}`
  - `last5` looks mixed, but only one of those five transitions is fresh live-eligible combat (`transition-000055-agent-mr7dzyc1-3ahlwm`)
- Honest interpretation:
  - this is not a provider wobble
  - this is not a new additive-combat regression
  - it is another example of why combat rollout judgment should stay centered on the fresh `liveEligible combat` slice rather than the raw trailing `last5`

## 2026-07-05 Narrow No-Progress Guard For Unknown Checkpoints

- This was a runtime safety cleanup, not a live-readiness feature expansion.
- Triggering evidence came from repeated local fast-combat transitions in `run-mr648yt5-h2h1dw`, where the controller kept replaying the same `Offering` action after no visible progress:
  - `transition-000029-agent-mr6fs2lk-loobvo`
  - `transition-000034-agent-mr6fscdm-c75iob`
  - `transition-000038-agent-mr6fsgdu-zttedk`
  - `transition-000043-agent-mr6fslwy-4box8n`
- Scope read:
  - route: `local_fast_combat`
  - chosenBy: `local`
  - not a `combat:llm_required` additive-provider failure
  - not a CandidateFuture/provider-contract issue
- Narrow fix in `src/agent/controller.ts`:
  - after an execution checkpoint with `kind="unknown"`, `preStateHash === postStateHash`, and reason `settlement_timeout_or_no_visible_change`
  - remember the action signature plus state fingerprint
  - on the next tick, block the exact same action on the exact same state instead of immediately repeating it
- Guard boundaries:
  - no provider/recovery change
  - no live additive policy change
  - no candidate generation/order/scoring change
  - no semantic validation change
  - no execution legality change
  - no alternative candidate auto-promotion; the controller simply waits instead of repeating the exact no-progress action
- Smoke coverage was added in `src/agent/smoke.ts` for the repeated-no-progress path.
- Validation after the patch:
  - `npm exec tsc -- --noEmit`
  - `npm run check`
  - both passed
- First temporary-env retest after the patch:
  - did not reproduce the repeated `Offering` loop
  - did not add new fresh `combat:llm_required` live-eligible additive evidence either
- Honest interpretation:
  - the guard removes one source of local runtime pollution and makes replay/eval cleaner
  - it does not itself advance P8.5 authorization
- the active blocker remains insufficient promotion-usable fresh `combat:llm_required` evidence under the same budget/rules

## 2026-07-05 Fresh Combat Survival-Cue Audit And Forced-Local Death Tail Review

- Re-audited the fresh `run-mr6gnmo8-egk8sr` combat blocker instead of assuming the new `missing_survival_line` warnings were raw CandidateFuture regressions.
- The two fresh live-eligible combat hits are:
  - `transition-000027-agent-mr6h1qwn-tpxci4`
  - `transition-000030-agent-mr6h28hh-5kylgc`
- Both are high-pressure `combat:llm_required` transitions with provider-clean outcomes, and both record:
  - `candidateFutureCompleteness.completeEnough > 0`
  - `shallowFutureCount=0`
  - `candidateFutureCueAttribution.cues.survival_line = { original: true, serialized: false, source: "compression_lost" }`
- Honest interpretation:
  - this is not "CandidateFuture never contained survival reasoning"
  - it is specifically "survival cue existed in the original future set but did not survive the serialized/bounded representation strongly enough for the detector"
  - in the same transitions, `tradeoff`, `resource_tradeoff`, and `future_risk` remain `serialization_preserved`
  - `lethal_line` is still absent or weak, but that is a separate review warning
- There are also earlier non-live-eligible transitions in the same run with the same shape:
  - `transition-000020-agent-mr6gz7zd-qmwy4a`
  - `transition-000024-agent-mr6gz9js-02y385`
- That matters because it confirms two things at once:
  - the warning is not confined to a single called sample
  - the warning is still specifically a compression/presentation problem, not proof that the raw future generator dropped survival content
- Separate audit of the new `end_turn` unknown checkpoint:
  - `transition-000032-agent-mr6h2hek-umgnbj`
  - route: `forced_local`
  - chosenBy: `local`
  - only legal action left: `end_turn`
  - execution returned `status="ok"`
  - pre-state: player already on a death-edge turn (`hp=26`, `incoming=36`, `energy=0`)
  - post-state: enemy-turn death tail (`hp=0`, `turn="enemy"`, `isPlayPhase=false`)
- The user also reported using an STS2 console `room boss` command, and that after death the game can get stuck in a non-progress tail.
- Honest interpretation of `transition-000032-agent-mr6h2hek-umgnbj`:
  - do not call it a provider failure
  - do not call it an additive live-path execution regression
  - keep it as a runtime/program-risk candidate until reproduced without manual console positioning
  - for current rollout judgment, it reads more like a low-visibility forced-local death tail than a new combat-additive blocker
- Narrow follow-up fix:
  - bounded combat futures now try to emit an explicit normalized `survivalLine` from `player_hp_delta` expectations
  - survival cue review patterns now recognize both English and Chinese combat-survival phrasing such as `生死`, `保命`, `补防`, and `挡血`
  - this is deliberately narrow: no provider policy change, no live-path change, no candidate/scoring/execution change
- Console-assisted interpretation rule for this debugging lane:
  - if a test window used STS2 console positioning like `room boss`, record it as console-assisted evidence
  - treat post-boss or post-death stuck tails in that window as suspicious-but-noncanonical until reproduced without console
  - this is supported by outside context as well: community bug reports mention getting stuck after defeating a boss, and console guides explicitly frame the STS2 dev console as a tool for testing and breaking normal flow rather than a stable gameplay path

## 2026-07-05 Fresh Revision Confirmation For Survival-Cue Preservation

- Ran another short fresh combat window on the same current run `run-mr6gnmo8-egk8sr` after the `v5.1.7` survival-cue-preservation patch.
- Important runtime nuance:
  - terminal output still showed some legacy `fallbackReason=\"llm_unavailable\"`
  - this is the legacy/live LLM path because `STS2_LLM_COMMAND` is unset in the normal runtime
  - it is not a P8 shadow provider failure and should not be confused with DeepSeek shadow health
- Replay now shows for `since:2026-07-05-v5.1.7-survival-cue-preservation`:
  - called=8
  - liveEligibleCalled=2
  - valid=8
  - invalid=0
  - error=0
  - `failureBucket={\"none\":8}`
  - `finishReason={\"stop\":8}`
  - `outputCapHits=0`
- The two fresh called/live-eligible combat samples are:
  - `transition-000267-agent-mr71482w-j3adut`
  - `transition-000283-agent-mr717m6i-si8tfm`
- Both samples show:
  - `reasonQuality=adequate`
  - `candidateFutureReviewSignals={}`
  - `candidateFutureCompleteness.completeEnough=3`
  - `shallowFutureCount=0`
  - `candidateFutureCueAttribution.cues.survival_line = { original: true, serialized: true, source: \"serialization_preserved\" }`
- Honest interpretation:
  - the fresh `missing_survival_line` blocker is no longer reproducing on called/live-eligible combat under the new revision
  - the remaining blocker is now promotion evidence sufficiency and older aggregated smoke alarms, not current survival-cue loss
  - broad P8.5 remains no-go, but the combat-specific problem has narrowed again

## 2026-07-05 Same-Budget Combat-Only Additive Continuation

- Continued the narrow additive rollout with the same basic constraints:
  - temporary process env only
  - whitelist still exactly `combat:llm_required`
  - no provider/recovery change
  - no candidate/scoring/fallback/validation/execution change
- Operational note:
  - after the combat window ended in death, a new 2-transition menu run `run-mr71izvf-roz0yp` was created automatically
  - that run is only menu navigation and should not be used as the rollout evidence window
  - the actual combat evidence is appended to the prior combat run `run-mr6gnmo8-egk8sr`
- New live-eligible combat transitions in `run-mr6gnmo8-egk8sr`:
  - `transition-000304-agent-mr71hk3l-vvda8x`
    - reason: `Free damage on attacker, but leaves block deficit.`
    - `reasonQuality=adequate`
  - `transition-000309-agent-mr71i98z-7s34bu`
    - reason: `Block 3 to reduce lethal damage but still risk death.`
    - `reasonQuality=adequate`
  - `transition-000310-agent-mr71iw2i-qdbksc`
    - reason: `Prioritize scaling despite inevitable death risk.`
    - `reasonQuality=adequate`
- All three show:
  - `chosenBy="llm"`
  - `decisionClass="combat:llm_required"`
  - `liveEligible=true`
  - `outcome=valid`
  - `failureBucket=none`
  - `finishReason=stop`
  - `outputCapHit=false`
  - `candidateFutureReviewSignals={}`
  - `candidateFutureCompleteness.completeEnough=3`
  - `shallowFutureCount=0`
  - `survival_line` and `tradeoff` preserved through serialization
- Replay for `run-mr6gnmo8-egk8sr` after this continuation:
  - `last5`: called=3, liveEligibleCalled=2, valid=3, invalid=0, error=0
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - the only thin reason in `last5` is the forced-local `end_turn` line, not a live-eligible additive combat reason
- Honest interpretation:
  - the newest combat-only continuation is healthy
  - it does not re-open provider or survival-cue blockers
  - canonical readiness still reads `NOT_READY_CANDIDATE_FUTURE_QUALITY` on the full run because earlier same-revision live signals remain in the aggregate
  - this argues for one more clean combat window or a fresh same-revision combat run, not another combat wording patch

## 2026-07-05 Corrected Read On The `run-mr71izvf-roz0yp` Additive Combat Window

- Re-audited the temporary-env, combat-only additive bridge window on `act=2 floor=11` against the persisted artifacts after the process had fully settled.
- The earlier "missing persisted artifacts" read was wrong.
- What actually happened:
  - the additive combat decisions did persist into `data/runs/run-mr71izvf-roz0yp/transitions.jsonl`
  - that run now contains 10 transitions total: 2 menu transitions plus 8 `combat:llm_required`
  - `memory/current-run.json` and `transitions.jsonl` agree on the same run id and same combat sequence
  - replay/eval/review all resolve the run cleanly
- Persisted live combat sequence includes:
  - `Scrape -> The Insatiable`
  - `Offering`
  - `Restlessness`
  - `Strike+ -> The Insatiable`
  - `Subroutine`
  - `Chill`
  - `Defend`
  - `Hologram`
- Current replay/eval read for `run-mr71izvf-roz0yp`:
  - `Transitions=10`
  - fresh live-eligible called combat shadow decisions: `4`
  - valid=`4`, invalid=`0`, error=`0`
  - `failureBucket=none`
  - `finishReason=stop`
  - `outputCapHits=0`
  - `reasonQuality={"adequate":4}`
  - readiness: `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
- Important nuance:
  - this run ends on a persisted `combat -> card_select` transition after `Hologram`
  - that is not a persistence bug; it is a real game-flow boundary where combat creates a card-selection sub-screen
  - for rollout interpretation, the run is canonical evidence for `combat:llm_required`, but its tail should not be over-read as non-combat whitelist readiness
- Honest correction:
  - there is no active recorder / replay persistence blocker from this additive combat window
  - the remaining blocker is still rollout evidence scope and class boundaries, not artifact loss

## 2026-07-05 Fresh Retest After Survival-Future Preservation

- Ran a fresh same-budget additive combat continuation on the patched revision with the same narrow scope:
  - temporary process env only
  - whitelist still only `combat:llm_required`
  - no provider/recovery change
  - no candidate/scoring/fallback/validation/execution change
- Fresh called/live transitions in `run-mr71izvf-roz0yp`:
  - `transition-000030-agent-mr7d0vyd-l2dbfr`
  - `transition-000031-agent-mr7d1h88-ypoya6`
  - `transition-000032-agent-mr7d2657-026jl2`
- All 3 remained provider-clean:
  - `failureBucket=none`
  - `finishReason=stop`
  - `outputCapHits=0`
  - invalid=0, error=0
- Direct cue audit:
  - `transition-000030-agent-mr7d0vyd-l2dbfr`
    - reason: `Play 0-cost FTL to damage while preserving energy for later block.`
    - `reasonQuality=adequate`
    - `candidateFutureCueAttribution.cues.survival_line = { original: true, serialized: true, source: "serialization_preserved" }`
  - `transition-000031-agent-mr7d1h88-ypoya6`
    - reason: `Block 9/26 now, but forgo damage this turn.`
    - `reasonQuality=adequate`
    - `candidateFutureCueAttribution.cues.survival_line = { original: true, serialized: true, source: "serialization_preserved" }`
  - `transition-000032-agent-mr7d2657-026jl2`
    - reason: `Gain block now, lose damage potential.`
    - `reasonQuality=thin`
    - `reasonQualityNotes=["missing_tradeoff"]`
    - `candidateFutureCueAttribution.cues.survival_line = { original: true, serialized: true, source: "serialization_preserved" }`
- Honest interpretation:
  - this retest is strong evidence that the narrow survival-future preservation patch is working on fresh called/live combat
  - the earlier `missing_survival_line` sample was not just a detector mistake; it was a real bounded-presentation loss, but it did not reproduce here
  - the remaining fresh combat wobble is reason expression, not survival-cue preservation and not provider health
  - the current narrow blocker is now one setup/defense-style `missing_tradeoff` reason, not a re-opened survival/compression failure

## 2026-07-05 Extra-Narrow Same-Budget Combat Promotion Window

- Ran one more very small combat-only additive continuation under the same constraints:
  - temporary env only
  - whitelist still only `combat:llm_required`
  - no provider/recovery change
  - no candidate/scoring/fallback/validation/execution change
- Fresh additional live-eligible combat sample:
  - `transition-000034-agent-mr7d8f9g-6jybpc`
  - persisted shadow reason: `High damage to reduce threat, but leaves block deficit.`
  - `reasonQuality=adequate`
  - `candidateFutureReviewSignals={}`
  - `tradeoff`, `resource_tradeoff`, `future_risk`, and `survival_line` all stayed `serialization_preserved`
- Replay after this continuation:
  - `last5`: called=5, liveEligibleCalled=4, valid=5, invalid=0, error=0
  - provider stayed clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - `reasonQuality={"adequate":4,"thin":1}`
  - `thinReasons={"missing_tradeoff":1}`
- Honest interpretation:
  - this small continuation strengthens the current combat-only promotion slice
  - it does not eliminate the remaining fresh `missing_tradeoff` wobble entirely
  - it also does not reopen the survival-cue blocker; the remaining issue is still one thin setup/defense reason plus the broader historical aggregate

## 2026-07-05 One More Same-Budget Combat-Only Follow-Up

- Ran one more narrow continuation with the same rules and temporary env only.
- Fresh live-eligible combat sample:
  - `transition-000038-agent-mr7dcn6k-6ju0ra`
  - persisted reason: `Take block now, but it still leaves a large damage deficit this turn.`
  - `reasonQuality=adequate`
  - provider clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
- Replay after this continuation:
  - `last5`: called=5, liveEligibleCalled=3, valid=5, invalid=0, error=0
  - `reasonQuality={"adequate":4,"thin":1}`
  - `thinReasons={"missing_tradeoff":1}`
- Honest interpretation:
  - this fresh called/live sample is another positive data point for combat-only additive rollout
  - it confirms the current remaining blocker is not provider and not survival-cue loss
  - but the combat promotion slice still is not perfectly clean, so the rollout case is stronger yet still short of a no-asterisk promotion window

## 2026-07-05 Narrow Formal Combat-Only Additive Rollout Step

- Proceeded to a more formal but still very narrow combat-only additive rollout step after the equivalent fresh liveEligible combat slice stayed clean.
- Guardrails remained unchanged:
  - whitelist still only `combat:llm_required`
  - additive-only
  - temporary process env only
  - provider/recovery/candidate/scoring/fallback/validation/execution unchanged
- Fresh additive combat transitions:
  - `transition-000044-agent-mr7dimll-zjv79w`
    - reason: `Kill now to survive, save energy.`
    - `reasonQuality=adequate`
  - `transition-000045-agent-mr7dj2e4-0txyci`
    - reason: `Cycle to find scaling while using 0-cost.`
    - `reasonQuality=adequate`
- Provider stayed clean:
  - `failureBucket=none`
  - `finishReason=stop`
  - `outputCapHits=0`
  - invalid=0, error=0
- Important read on the fresh `last5` slice:
  - replay still reports `reasonQuality={"adequate":3,"thin":2}`
  - but the two thin lines are:
    - `transition-000041-agent-mr7dh784-hejkc1` (`combat:local_fast_combat`)
    - `transition-000043-agent-mr7dhc6r-xj7ddw` (`combat:forced_local`)
  - they are not the new additive `combat:llm_required` samples
- Honest interpretation:
  - the formal combat-only additive step itself remained clean
  - the surface `last5` wobble is a slice-composition issue, not a fresh additive-combat regression
  - this strengthens the case that combat-only additive rollout can continue under the narrow policy, while broad P8.5 still remains blocked

## 2026-07-05 Additional Same-Budget Combat-Only Continuation On `run-mr71izvf-roz0yp`

- Continued the same temporary-env additive setup without widening the whitelist.
- First transition in the continuation was an in-combat generated-card choice:
  - `transition-000011-agent-mr72t8hf-yr4any`
  - `decisionClass=card_select:local_recommended_llm_arbitrate`
  - `fallbackReason=live_additive_decision_class_not_whitelisted`
  - Honest read: this is correct combat-only boundary behavior. It also confirms the user's reminder that combat can produce card-pick sub-screens, so rollout interpretation must not treat every mid-combat choice as part of the first whitelist.
- After that boundary check, two additional additive live combat calls were recorded:
  - `transition-000018-agent-mr72tqfd-hhc785`
    - action: `Charge Battery`
    - reason: `Block now to cut incoming, but it slows damage or scaling.`
  - `transition-000019-agent-mr72tr6y-9ea5oy`
    - action: `Tesla Coil -> The Insatiable`
    - reason: `Push damage now, but it still leaves a block deficit.`
- Both new live combat transitions are:
  - `decisionClass=combat:llm_required`
  - `chosenBy="llm"`
  - `outcome=valid`
  - `failureBucket=none`
  - `finishReason=stop`
  - `outputCapHit=false`
- Replay after the continuation:
  - run: `run-mr71izvf-roz0yp`
  - transitions: `18`
  - fresh window `last20`: called=`8`, liveEligibleCalled=`4`, valid=`8`, liveEligibleValid=`4`, invalid=`0`, error=`0`
  - readiness remains `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
- Important nuance:
  - the continuation did not end right after the two live calls
  - the fight naturally moved into `local_fast_combat` (`Compile Driver`, `Frantic Escape`) and therefore `last5` is no longer a pure combat-live promotion slice
  - this is not a readiness regression; it is a window-cutting issue
- Honest next implication:
  - combat-only rollout evidence is stronger than before
  - if we want a cleaner promotion-quality slice than the current `last20`, the next narrow runtime window should stop immediately after the next 1-2 live-eligible combat calls

## 2026-07-05 Early-Stop Promotion Window On `run-mr71izvf-roz0yp`

- Ran another same-budget combat-only additive window after repositioning to a fresh high-pressure combat (`act=3 floor=16`, `Test Subject #C8`).
- This time the window was intentionally cut earlier to preserve a cleaner promotion slice.
- Fresh called/live additive combat transitions:
  - `transition-000022-agent-mr77u775-nx55b7`
    - `All for One -> Test Subject #C8`
    - reason: `Push damage now, but it still leaves a block deficit.`
    - `reasonQuality=adequate`
  - `transition-000023-agent-mr77uc8e-myim33`
    - `Bolas -> Test Subject #C8`
    - reason: `Push damage now, but it still leaves a block deficit.`
    - `reasonQuality=adequate`
  - `transition-000024-agent-mr77ufh3-ns9kpu`
    - `Master of Strategy`
    - reason: `Use setup now, but it delays immediate block.`
    - `reasonQuality=thin`
    - `reasonQualityNotes=["missing_tradeoff"]`
  - `transition-000025-agent-mr77ultm-ekpp5v`
    - `Panache`
    - reason: `Add scaling now, but it spends tempo against this attack.`
    - `reasonQuality=adequate`
- All four transitions are:
  - `decisionClass=combat:llm_required`
  - `chosenBy="llm"`
  - `outcome=valid`
  - `failureBucket=none`
  - `finishReason=stop`
  - `outputCapHit=false`
- Replay after this window:
  - `run-mr71izvf-roz0yp`
  - `Transitions=22`
  - `last5`: called=`4`, liveEligibleCalled=`4`, valid=`4`, invalid=`0`, error=`0`
  - `last5` is the cleanest current combat-only promotion slice
- Honest interpretation:
  - combat-only additive evidence is now materially stronger than before
  - provider is still not the blocker
  - the remaining wobble in the clean slice is narrow and specific: one setup-style reason still trips `missing_tradeoff`
  - broad P8.5 still remains out of scope because this evidence says nothing new about `map` or `card_reward`

## 2026-07-05 Same-Budget Combat Continuation On `run-mr71izvf-roz0yp`

- Ran one more tiny same-budget additive combat continuation with temporary env only and the same whitelist: `combat:llm_required`.
- Fresh live-eligible combat samples:
  - `transition-000026-agent-mr7cac4b-nahdgw`
    - valid, `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
    - reason: `Gain 8 block now, but still leave a block deficit.`
    - `reasonQuality=adequate`
    - `survival_line=serialization_preserved`
  - `transition-000027-agent-mr7caxrt-be9f38`
    - valid, `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
    - reason: `Gain block with 0-cost Chill, save energy for scaling.`
    - `reasonQuality=adequate`
    - review signal: `missing_survival_line`
    - cue attribution: `survival_line = { original: true, serialized: false, source: "compression_lost" }`
  - `transition-000028-agent-mr7cbfcx-t5y0um`
    - valid, `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
    - reason: `Gain scaling for long fight, takes 18 damage.`
    - `reasonQuality=thin`
    - `thinReason=missing_tradeoff`
- The trailing `transition-000029-agent-mr7cbln1-lkhqy4` is `combat:local_fast_combat`; it is thin but not live-eligible rollout evidence.
- Replay after this continuation:
  - `last5`: called=5, liveEligibleCalled=4, valid=5, liveEligibleValid=4, invalid=0, error=0
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - `reasonQuality={"adequate":3,"thin":2}`
  - `thinReasons={"missing_tradeoff":2}`
  - canonical readiness regressed to `NOT_READY_CANDIDATE_FUTURE_QUALITY`
  - reason: `combat_candidate_future_quality_not_clear`
- Honest read:
  - provider still is not the blocker
  - live execution still did not drift
  - the active fresh blocker is now narrow and concrete: one live-eligible survival cue was lost in bounded serialization, and one live-eligible setup/scaling reason still failed the tradeoff bar

## 2026-07-05 Survival Cue Audit On `transition-000027-agent-mr7caxrt-be9f38`

- Audited whether `missing_survival_line` was a detector mistake or a real bounded-presentation loss.
- Conclusion: the current signal is materially real.
  - original combat futures with survival cues existed on:
    - `play-5` / `Defend`
    - `end-turn`
  - bounded critical-pressure serialization kept only 3 futures:
    - `play-0`
    - `play-1`
    - `play-4`
  - neither retained survival-relevant future made it into the serialized slice
  - cue attribution is therefore correct for this sample:
    - `survival_line = { original: true, serialized: false, source: "compression_lost" }`
- Narrow fix applied:
  - high-pressure combat bounded serialization now preserves at least one survival-relevant future if the original packet contains one
  - this does not change provider behavior, live flags, candidate generation, scoring, fallback, validation, or execution
  - a new smoke regression covers the exact failure shape: top-ranked setup futures must no longer crowd out every survival future
- Verification:
  - `npm exec tsc -- --noEmit`: pass
  - `npm run agent:smoke`: pass
  - `npm run check`: pass
- Important honesty clause:
  - replay/eval/review on `run-mr71izvf-roz0yp` still show the old blocker, because we did not rewrite historical artifacts
  - the next required proof is a fresh same-budget combat-only runtime window on the patched revision

## 2026-07-05 Bridge-Responder Operational Root Cause And Corrected Tiny Live Window

- Re-audited the repeated "silent runtime window" behavior after multiple additive combat attempts produced no new transitions.
- Root cause was not the combat window itself:
  - `npm run agent:run:bridge` uses `STS2_LLM_COMMAND="node scripts/llm-bridge-decider.mjs"`
  - that script writes a request into `/tmp/sts2-llm-bridge/` and then blocks waiting for `response-<id>.json`
  - without an active external/manual/Codex responder, `tick()` waits inside the LLM command path and no transition is recorded
- Direct evidence:
  - `scripts/llm-bridge-decider.mjs` writes `latest-request.json`, `pending-id.txt`, and waits up to `STS2_LLM_BRIDGE_TIMEOUT_MS`
  - `/tmp/sts2-llm-bridge/latest-request.json` and `pending-id.txt` showed live pending requests during the failed silent attempts
  - single `tick` calls also hung until manually interrupted, confirming this was not just a `run` logging quirk
- Important conclusion:
  - prior silent attempts were invalid rollout evidence because the bridge responder was absent
  - this was an operational usage mistake, not a provider regression, not a game-window issue, and not a new code regression in the additive path
- Corrected tiny live window with an active bridge responder:
  - run: `run-mr6gnmo8-egk8sr`
  - 4 fresh transitions, all `combat:llm_required`
  - all 4 additive live decisions were called, valid, executed, and recorded
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`, invalid=0, error=0
  - replay status moved to `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - `card_reward:llm_required` and `map:llm_required` remain blocked by missing fresh evidence

## 2026-07-04 Narrow Combat Reason-Contract Follow-Up

- Combat-only additive live-enable plan has now been drafted in `docs/04_CURRENT_STATUS.md`.
- This is a planning artifact only. It does not enable live, does not set `STS2_P8_LIVE_ADDITIVE=1`, and does not change provider/recovery, candidate generation, scoring, fallback, validation, execution, stable memory, derived knowledge, or strategy behavior.
- The plan is supported by the fresh promotion-quality evidence from `run-mr648yt5-h2h1dw`:
  - `combat:llm_required` live-eligible called samples: 3
  - valid=4, invalid=0, error=0 across called shadow decisions
  - liveEligibleValid=3, liveEligibleInvalid=0, liveEligibleError=0
  - `failureBucket=none`
  - `finishReason=stop`
  - `outputCapHits=0`
  - `retryCount=0`
  - CandidateFuture remained completeEnough with `shallowFutureCount=0`
  - tradeoff/resource/future-risk/survival cues were preserved through serialization
- Plan boundary:
  - first whitelist may only be `combat:llm_required`
  - `map:llm_required`, `card_reward:llm_required`, shop/reward/route/event/rest/menu/card-select classes remain excluded
  - first mode may only be additive legacy prompt plus compact workspace summary
  - structured-prompt-only live remains forbidden
  - selected-candidate validation and semantic validation remain unchanged
  - execution remains unchanged
- Required rollback:
  - set `STS2_P8_LIVE_ADDITIVE=0`
  - preserve failed rollout evidence
  - return to legacy-only / shadow-only behavior before any tuning
- Immediate stop conditions include provider failure, unrecovered `finishReason=length`, output cap hit, invalid/error, semantic validation failure, illegal or nonexistent selected candidate id, unexpected fallback behavior, execution mismatch, reason-quality collapse, missing survival/tradeoff cues returning, or any uncertainty about live-path boundaries.
- Honest interpretation:
  - `combat:llm_required` can move from whitelist candidate to ready-to-draft combat-only additive live-enable plan
  - broad P8.5 remains no-go
  - live still requires explicit human approval before any flag change
- Follow-up after explicit human approval:
  - implemented the minimal controller-side additive prompt consumption behind `STS2_P8_LIVE_ADDITIVE` and `STS2_P8_LIVE_DECISION_CLASSES`
  - the additive prompt remains JSON-shaped and appends `p8_live_additive` context to the legacy prompt only when the current decision class is explicitly whitelisted
  - added live LLM audit fields for `promptMode`, `liveAdditiveEnabled`, `liveAdditiveApplied`, `liveAdditiveDecisionClass`, `liveAdditiveWhitelist`, and `liveAdditiveSummaryBytes`
  - preserved candidate generation/order/scoring, fallback, validation, execution, provider recovery, stable memory, derived knowledge, and strategy behavior
  - preflight found no persistent `STS2_LLM_COMMAND`; the later live test used the existing bridge adapter through temporary process env only
  - DeepSeek remains P8 shadow-only and was not repurposed as the live executor

## 2026-07-04 Combat CandidateFuture Quality Attribution Audit

- Audited the latest combat blocker `combat_candidate_future_quality_not_clear` instead of continuing blind live windows.
- The key finding is that the current blocker is not primarily a fresh called-combat CandidateFuture collapse.
- Current combat future-quality gate logic in `src/replay/p8LiveReadiness.ts` trips on any class-level `reviewSignals.missing_survival_line`, `missing_future_risk`, `missing_resource_tradeoff`, or `shallow_candidate_future`.
- Current aggregation in `src/replay/workspaceQuality.ts` merges `candidateFutureReviewSignals` across all transitions in the class, including `called=false` and budget-skipped transitions.
- The specific `missing_survival_line` currently poisoning combat readiness is:
  - `transition-000026-agent-mr6f5b3k-fx42ij`
  - `decisionClass=combat:llm_required`
  - `called=false`
  - `outcome=skipped`
  - `budget.status=call_budget_exceeded`
  - cue attribution:
    - `survival_line`: `original=true`, `serialized=false`, `source=compression_lost`
    - `lethal_line`: `original=false`, `serialized=false`, `source=candidate_future_missing`
- Honest interpretation of that sample:
  - it is a real bounded-compression warning and should remain visible in review telemetry
  - it is not fresh called live-eligible evidence
  - using it as a direct live-readiness blocker mixes review smoke alarms with rollout authorization evidence
- Fresh called combat evidence from the same run paints a narrower picture:
  - `transition-000001-agent-mr649465-7hdlvb`
    - `called=true`, `liveEligible=true`, `outcome=valid`
    - `reasonQuality=thin`, `thinReasons=["missing_tradeoff"]`
    - cue attribution preserved `tradeoff`, `resource_tradeoff`, `future_risk`, `survival_line`
    - `lethal_line` was `compression_lost`
    - reason attribution shows `tradeoff` was `model_reason_omitted`, not missing from the serialized CandidateFuture
  - `transition-000002-agent-mr6498uu-ovos54`
    - `called=true`, `liveEligible=true`, `outcome=valid`
    - `reasonQuality=adequate`
    - `lethal_line` again `compression_lost`, but `survival_line` preserved
  - `transition-000004-agent-mr649j14-q7t9tb`
    - `called=true`, `liveEligible=true`, `outcome=valid`
    - `reasonQuality=adequate`
    - `lethal_line` was already missing in the original future (`candidate_future_missing`)
- Root-cause split after audit:
  - `missing_survival_line`: currently an attribution / aggregation problem first, compression warning second
  - `missing_lethal_line`: real compression or source-future warning, but currently review-only rather than a readiness blocker
  - old `missing_tradeoff`: current fresh sample points to `model_reason_omitted`, not CandidateFuture content loss
  - cue attribution telemetry is functioning correctly and is valuable; the main ambiguity is how replay/readiness consumes it
- Most honest next engineering move:
  - do not broaden live
  - do not blindly keep tuning combat wording
  - first decide whether combat live-readiness should gate on all class-level review signals, or only on called/live-eligible/current-window evidence
  - keep `missing_lethal_line` and compression-lost cues visible as review signals even if readiness gating becomes narrower

## 2026-07-04 Readiness Attribution Semantics Narrowing

- Implemented the narrowest possible fix:
  - no provider change
  - no prompt change
  - no candidate/scoring/fallback/validation/execution change
  - no live flag change
- `src/replay/workspaceQuality.ts` now keeps two parallel views for CandidateFuture quality:
  - full class-level review telemetry: `signals=` and overall completeness
  - live-readiness telemetry: `liveSignals=` and `liveComplete=` derived only from `called=true && liveEligible=true`
- `src/replay/p8LiveReadiness.ts` now gates `classFutureShallow()` on the `liveEligibleCalled` view instead of all class transitions.
- This preserves review visibility while preventing `budget.status=call_budget_exceeded` / `called=false` samples from directly blocking combat live readiness.
- Verification result on latest run `run-mr648yt5-h2h1dw`:
  - replay status moved from `NOT_READY_CANDIDATE_FUTURE_QUALITY` to `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE`
  - combat quality line now reads:
    - `complete=51/51`
    - `liveComplete=27/27`
    - `signals={"missing_lethal_line":2,"missing_survival_line":1}`
    - `liveSignals={"missing_lethal_line":2}`
  - honest interpretation:
    - the old `missing_survival_line` remains visible as a historical/budget-skipped compression warning
    - it no longer blocks current combat rollout judgment
    - the remaining blocker is evidence-window usability and non-combat readiness, not combat CandidateFuture collapse
- What did not change:
  - `missing_lethal_line` remains visible on fresh called combat as review telemetry
  - `missing_tradeoff` remains a reason-quality issue where present
  - broad P8.5 remains no-go
  - `map` and `card_reward` are still outside first-whitelist readiness

## 2026-07-04 Tiny Combat-Only Additive Live Window

This was an explicitly approved, temporary-env, combat-only additive rollout. It did not persist `STS2_P8_LIVE_ADDITIVE=1`, did not write API keys, and did not expand the whitelist beyond `combat:llm_required`.

Pre-run stop-condition discovery:

- The first bridge preflight surfaced a non-whitelisted `card_select:local_recommended_llm_arbitrate` live request with no additive context.
- That was treated as a stop condition because enabling `STS2_LLM_COMMAND` could otherwise let non-combat legacy live LLM calls occur during a combat-only rollout.
- The process was stopped before a response was written and before the action executed.
- Minimal fix: live LLM calls are now blocked before provider invocation when `STS2_P8_LIVE_ADDITIVE=1` and the decision class is not in `STS2_P8_LIVE_DECISION_CLASSES`.

Actual tiny rollout:

- run: `run-mr648yt5-h2h1dw`
- temporary env included:
  - `STS2_LLM_COMMAND="node scripts/llm-bridge-decider.mjs"`
  - `STS2_P8_LIVE_ADDITIVE=1`
  - `STS2_P8_LIVE_DECISION_CLASSES=combat:llm_required`
  - `STS2_P8_WORKSPACE_ABLATION_MODE=full_bounded_candidate_futures`
- non-whitelist guard:
  - one `card_select:local_recommended_llm_arbitrate` transition was blocked before live LLM call
  - fallback reason: `live_additive_decision_class_not_whitelisted`
  - audit outcome: `disabled_by_live_whitelist`
- live additive combat decisions:
  - Scrape: `play-4-MECHA_KNIGHT_0`, reason `Scrape deals damage and draws toward block, but risks taking most incoming.`
  - Defend: `play-5`, reason `Defend reduces incoming damage, but delays offense and leaves most attack unblocked.`
- audit:
  - prompt mode: `additive_legacy_prompt_plus_compact_workspace_summary`
  - whitelist: `combat:llm_required`
  - live additive applied: true for both combat decisions
  - invalid=0, error=0, execution mismatch=0
- latest replay interpretation:
  - latest run remains provider/shadow clean in fresh slices: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - readiness now reports `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE` because the latest promotion window is mixed-budget / not usable as clean class-level authorization evidence
  - do not wash or delete historical failures; also do not let them obscure the successful tiny combat smoke window

Current conclusion:

- The combat-only additive path has passed one tiny live smoke window.
- Broad P8.5 remains no-go.
- `map:llm_required` and `card_reward:llm_required` remain excluded from the first live whitelist.
- The next live step, if approved, should be another clean same-budget combat-only window rather than whitelist expansion.

## 2026-07-04 Same-Budget Combat-Only Follow-Up

This follow-up did not change code or widen the whitelist. It only tried to improve combat-only rollout evidence with the same temporary-env additive setup.

- same temporary env:
  - `STS2_LLM_COMMAND="node scripts/llm-bridge-decider.mjs"`
  - `STS2_P8_LIVE_ADDITIVE=1`
  - `STS2_P8_LIVE_DECISION_CLASSES=combat:llm_required`
  - `STS2_P8_WORKSPACE_MAX_SHADOW_CALLS=4`
- one additional additive live combat decision executed:
  - `play-1-MECHA_KNIGHT_0` / Ultimate Strike
  - reason `Ultimate Strike pushes damage now, but leaves most incoming damage unblocked.`
- later ticks in the same combat naturally routed to `combat:local_fast_combat`:
  - `Uproar`
  - `Cascade`
  - `TURBO`
  - `Catastrophe`
- honest read:
  - this is good boundary behavior because the agent did not force every combat tick through live additive
  - it is bad for evidence volume because only one additional `combat:llm_required` call landed in the clean same-budget slice

Replay/eval after the follow-up:

- `last5` is now a clean same-budget slice:
  - `plannedShadowCallValueCounts={"4":5}`
  - `mixedBudget=false`
  - `called=5`, `valid=5`, `invalid=0`, `error=0`
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
- but `last5` still has only `liveEligibleCalled=1`
- broader readiness therefore remains `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE`
  - not because provider failed
  - not because the additive live path failed
  - but because the clean same-budget slice still has too little live-eligible combat volume, and the broader since-revision promotion window still mixes earlier budget profiles

## 2026-07-04 P8.5 Live Rollout Policy

- Added `docs/P8_5_LIVE_ROLLOUT_POLICY.md` as the durable policy for P8.5 additive live rollout.
- The policy records the current engineering judgment:
  - clean same-budget `combat:llm_required` evidence is the right promotion unit
  - acceleration means larger windows inside the same whitelist, not broader whitelist
  - first whitelist remains exactly `combat:llm_required`
  - `map`, `card_reward`, shop, reward, route, event, rest, menu, and card-select classes remain excluded
  - temporary process env is allowed for bounded windows; persistent live flag edits are not
  - stable memory, derived knowledge, strategy params, candidate generation/order/scoring/fallback/validation/execution remain protected
- Current policy tier:
  - tiny live smoke has passed
  - clean same-budget evidence exists
  - usable combat-only rollout evidence is still insufficient because the clean same-budget slice has only one live-eligible combat call
- This policy does not enable live by itself and does not change schema or runtime behavior.

## 2026-07-04 Larger Combat-Only Additive Window

This window followed `docs/P8_5_LIVE_ROLLOUT_POLICY.md` and kept the whitelist at `combat:llm_required`.

- temporary env only:
  - `STS2_P8_LIVE_ADDITIVE=1`
  - `STS2_P8_LIVE_DECISION_CLASSES=combat:llm_required`
  - `STS2_LLM_COMMAND="node scripts/llm-bridge-decider.mjs"`
  - `STS2_P8_WORKSPACE_MAX_SHADOW_CALLS=4`
- no persistent `.env.local` change
- no whitelist expansion
- no provider/recovery/candidate/scoring/fallback/validation/execution change
- no stable memory, derived knowledge, or strategy write

Live combat decisions executed in the larger window:

- Offering: `Offering digs for block and tempo now, but spends a card slot before damage.`
- Charge Battery: `Charge Battery blocks incoming damage now, but delays attack pressure on the minion.`
- Backflip: `Backflip adds block and digs for answers, but delays killing the attacking minion.`
- Ultimate Strike: `Ultimate Strike pressures the attacker now, but still leaves some incoming damage unblocked.`
- Rocket Punch: `Rocket Punch damages the attacker and cycles, but adds status burden and leaves damage leaking.`
- Defend: `Defend nearly covers the remaining attack, but gives up tempo and damage this turn.`
- Feral: `Feral adds scaling for later turns, but accepts a small block deficit now.`
- Loop: `Loop improves orb scaling for later, but does not fully cover this attack.`

Validation result:

- `npm run check`: pass
- `npm run data:replay -- --latest`: completed
- `npm run data:eval -- --latest`: `WARN`, no errors
- `npm run agent:review`: completed
- live execution symptoms: invalid output 0, provider failure 0, output cap hits 0, missing candidate 0, execution mismatch 0

Important readiness result:

- Replay now reports `NOT_READY_CANDIDATE_FUTURE_QUALITY`
- Reason: `combat_candidate_future_quality_not_clear`
- This is a stop signal for rollout acceleration.
- The failure is not provider reliability or live execution safety; it is the quality gate saying combat CandidateFuture/reason cue evidence is not yet clean enough across the readiness window.
- Next engineering step should inspect the cue attribution behind `missing_survival_line`, `missing_lethal_line`, and older `missing_tradeoff`, not broaden live or continue blind live windows.

- Fresh promotion-quality combat shadow window on the same revision now supports a narrower readiness conclusion than earlier logs in this file.
- Run: `run-mr648yt5-h2h1dw`
- Fresh combat-only slice:
  - called=4
  - liveEligibleCalled=3
  - valid=4
  - invalid=0
  - error=0
  - `failureBucket=none`
  - `finishReason=stop`
  - `outputCapHits=0`
  - `retryCount=0`
- The 3 fresh live-eligible `combat:llm_required` samples were:
  - `transition-000001-agent-mr649465-7hdlvb`
    - reason: `Use free draw to find block or combo.`
    - `reasonQuality=thin`
    - `thinReasons=["missing_tradeoff"]`
    - provider remained clean: `failureBucket=none`, `finishReason=stop`
    - serialized cues preserved `tradeoff`, `resource_tradeoff`, `future_risk`, `survival_line`; `lethal_line` was `compression_lost`
    - reason attribution shows the issue is `model_reason_omitted` on `tradeoff`, not provider failure and not missing CandidateFuture content
  - `transition-000002-agent-mr6498uu-ovos54`
    - reason: `Search scaling while losing tempo.`
    - `reasonQuality=adequate`
    - provider clean: `failureBucket=none`, `finishReason=stop`
    - CandidateFuture completeness stayed completeEnough with `shallowFutureCount=0`
  - `transition-000004-agent-mr649j14-q7t9tb`
    - reason: `Tutor for block while conserving energy.`
    - `reasonQuality=adequate`
    - provider clean: `failureBucket=none`, `finishReason=stop`
    - CandidateFuture completeness stayed completeEnough with `shallowFutureCount=0`
- Honest interpretation:
  - provider is still not the active blocker on fresh combat evidence
  - combat serialization is preserving the core survival/tradeoff/future-risk cues
  - one fresh thin reason still exists, but it is now attributable to model omission rather than workspace collapse or provider truncation
  - this is enough to move combat from `whitelist candidate` to `ready to draft combat-only additive live-enable plan`
  - it is not enough to declare broad P8.5 ready, and it does not authorize live by itself
- Historical-window interpretation:
  - older `provider_length_empty`, network outages, and broader mixed-window quality failures remain valid historical evidence
  - they should stay visible in all-history and mixed-window reporting
  - they should not be misread as describing the current fresh combat-only window on this revision

- Fresh combat replay review confirmed provider is no longer the active blocker in the latest `combat:llm_required` window: fresh called samples are valid with `failureBucket=none`, `finishReason=stop`, and `outputCapHits=0`.
- The remaining blocker is still reason quality, not provider recovery.
- Latest called combat samples split into:
  - adequate tradeoff expression, for example `Scrape deals damage and draws 4 cards, but risks missing block.`
  - still-thin benefit-only lines, for example `Reduce incoming damage with free attack.` and `Block incoming 21 with 0-cost Hotfix.`
- That means the remaining `missing_tradeoff` signal is not purely evaluator noise.
- Minimal code fix applied:
  - no provider change
  - no live-path change
  - no candidate/scoring/execution change
  - combat workspace prompt now carries a decision-class-specific reason contract asking for one short sentence that states both immediate gain and the main cost, delay, or risk this turn
- This is explicitly a temporary inner-scaffold patch. Long term it should be replaced by proposal-driven refinement from replay/eval/review attribution rather than a growing pile of hand-written combat phrases.
- First post-patch fresh called sample:
  - `transition-000152-agent-mr5qwaky-xkx56i`
  - provider stayed clean: `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
  - returned reason: `Block immediately to survive, then scale later.`
  - current evaluator still marks it `reasonQuality=thin`, `reasonQualityNotes=["missing_tradeoff"]`
  - practical takeaway: the patch did not yet produce a clear fresh reduction in combat `missing_tradeoff`
- Follow-up narrow fix:
  - wired the combat-specific system prompt to the workspace prompt too, so the combat tradeoff contract now activates on both system and user prompt paths
  - no provider change
  - no live-path change
  - no candidate/scoring/execution change
- Fresh runtime after that wiring:
  - run `run-mr4rh1mb-tohmxl`
  - replay/eval `last5`: called=3, liveEligibleCalled=1, valid=3, invalid=0, error=0
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - `reasonQualityCounts={"adequate":3}` for the called slice
- Honest interpretation:
  - this is a good fresh signal that the narrowed combat contract is helping
  - it is not enough to declare live readiness on its own
  - the broader `last20` slice still carries `missing_tradeoff` history, so one more fresh combat shadow window should confirm repeatability before any live-enable planning
- Follow-up fresh high-pressure combat window on the same run:
  - replay/eval `last5`: called=4, liveEligibleCalled=3, valid=4, invalid=0, error=0
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - live-eligible combat reasons:
    - `Block 6 to survive, but leaves 44 damage unblocked.`
    - `Block 6 to survive 50 damage, but no damage output.`
    - `Damage Spectral Knight to reduce incoming, but leaves block deficit.`
  - all 3 were graded `reasonQuality=adequate`
  - the only fresh thin reason in the slice was a non-live-eligible `combat:forced_local` death-state reason
- Updated interpretation:
  - the combat-specific missing-tradeoff blocker is now materially reduced on fresh high-pressure `combat:llm_required`
  - provider still is not the blocker
  - remaining no-go is broader readiness evidence, especially mixed historical windows and non-combat quality/readiness coverage, not this narrow combat contract itself

## 2026-07-01 Phase 6-10 Planning And P6 Attribution MVP

本轮完成：

- 将正式路线从 Phase 0-5 扩展为 Phase 0-10。
- 明确 Phase 10 目标为 Guarded Learning Loop：prediction -> execution evidence -> typed prediction error -> consolidation proposal -> guarded stable update -> replay/eval validation -> rollback-capable review。
- 在 `PROJECT_PLAN.md` 记录 Phase 1-5 未完成项，避免误判历史 MVP 为完整实现。
- 清理 `AGENTS.md` 的必读入口，不再把旧 redirect 文档列为当前架构权威。
- 新增 Phase 6 shadow MVP：`PredictionErrorRecord.attributionBuckets`。
- eval/review 现在能统计 attribution bucket coverage。
- smoke 覆盖 supported 与 unknown attribution bucket，以及 transition 挂载。

后续追加：

- P6 eval/review visibility 已扩展为 bucket counts 和 bucket status counts。
- P6 eval 会把 unsupported 或 critical attribution bucket 归入 `prediction_error` WARN，而不是自动学习。
- P6 CandidateFuture 预测已进一步从“字段存在”推进到 mechanics-informed expected-vs-actual：`predictionChecks.expected` 可携带 card removal、target/damage/block、HP loss、energy cost、route progress、reward flow 等期望。
- checkpoint diff 新增 `enemyDeltas`，用于 damage/kill actual evidence。
- P7 proposal surface MVP 已实现：`ConsolidationRecord` 可携带 affected module、proposed change、expiry、revalidation、createdAt、proposalKind、evidenceStrength、blockedStableTargets 和 proposed/accepted/rejected/expired/reverted/legacy rolled_back 状态。
- fresh run 会创建 `proposals.jsonl`；replay/eval/review 现在能显示 proposal count、pending review、status counts、target layer、evidence strength 和 mutating/accepted risk。
- P7.5 proposal aggregation 已实现：replay/eval/review 会按 target layer、proposed action 和 actionable attribution bucket 聚合 proposal evidence，显示 occurrence、recurring group、sample transition、grouped evidence strength、blocked stable targets、allowed next review steps 和 forbidden stable mutations。
- `buildConsolidationRecord()` 现在只从 unsupported 或 critical attribution bucket 生成 learning proposal；unknown/low-visibility attribution 只保留为 evidence gap。
- P7 proposal 明确 `stableMutation=false` 和 forbidden next steps，禁止自动写 memory、derived knowledge、strategy params、candidate ordering 或 prompt。

边界：

- P6 仍然 shadow-only。
- P7 仍然 proposal-only。
- P7.5 aggregation 仍然是 replay/eval/review surface，不是 stable learning applicator。
- 没有改变 live prompt、candidate ordering、fallback、validation 或 execution semantics。
- 没有启用 P8 DeliberationPacket strategic workspace、P9 stable update applicator 或 P10 guarded learning loop。

## 2026-07-03 P8 Cleanup / Provider-Contract Hardening Pass

本轮目标不是推进 P8.5 live，而是把 P8 shadow 的结构和可审计性拉回清晰边界：

- 维持 `full` 为 control group，不让 bounded candidate-future compression 静默污染 baseline。
- 将 bounded combat `candidate_futures` 序列化抽到 `src/agent/candidateFutureCompressor.ts`，减少 `workspace.ts` 的职责缠绕。
- 将 P8 flags/revision/mode 规范化抽到 `src/agent/workspaceExperimentConfig.ts`，避免 revision/mode/flag 常量继续散落。
- 新增 `src/agent/providerFailureClassifier.ts`，统一区分：
  - `provider_reliability`
  - `semantic_validation`
  - `candidate_safety`
  以及更细的 bucket，例如 `provider_length_empty`、`provider_tail_noise_after_json`、`semantic_missing_candidate_id`。
- `reasonQuality` 不再只按字符串长度判 thin；现在会额外记录 thin 原因，例如 `missing_tradeoff`、`missing_tactical_factor`、`templated_reason`。这仍然只是 report signal，不是 validation blocker。
- DeepSeek request telemetry 现在会记录 thinking 请求模式：
  - 未显式设置时，保留 provider default
  - 可通过 `STS2_DEEPSEEK_THINKING_MODE=disabled|enabled` 做 shadow-only A/B
  - 同时记录 response 是否返回 `reasoning_content`、content source、reasoning bytes
- P8.4 收口标准已显式写清：
  - provider/output contract 只需稳定到可分桶、可审计，不追求把所有低频 provider failure 清零
  - `invalidChoice=0`
  - `missingCandidate=0`
  - live-eligible provider failure 低频且可解释
  - `full` 保持 control group 原义
  - `reasonQuality` 不出现大面积 missing 或严重变薄
  - `CandidateFuture` 不能退化成 shallow action list
  - shadow 不能污染 live / stable memory / derived / strategy
- 新增 CandidateFuture quality review telemetry：
  - `candidateFutureCompleteness` 统计 serialized future 是否仍保留 core tactical facts、benefit/cost、risk/uncertainty、assumption/invalidation、prediction-check trace、core tradeoff
  - `candidateFutureReviewSignals` 记录 `shallow_candidate_future`、`missing_survival_line`、`missing_lethal_line`、`missing_resource_tradeoff`、`missing_card_reward_direction`、`missing_future_risk`
  - `candidateFutureProposalSignals` 仅作为 review/eval 的 proposal-only signal，指向 candidate template / context feature / prediction-check refinement；不自动修改 candidate generator、stable memory、derived 或 strategy

边界保持不变：

- 没有启用 `STS2_P8_LIVE_ADDITIVE`。
- DeepSeek 仍然只 shadow，不执行。
- 没有改变 live prompt、candidate generation/order/scoring、fallback、validation、execution。
- 没有放松 semantic validation，没有把空/截断输出洗成 valid。
- 没有写 stable memory / derived / strategy，也没有提交 runtime memory 产物。

追加 blocker 复盘：

- fresh high-pressure `combat:llm_required` transitions `transition-000130-agent-mr4sg5sl-xm6o7z` 与 `transition-000131-agent-mr4sh7t9-l925tb` 都命中了 `provider_length_empty`。
- 两个 case 都不是 `CandidateFuture` 退化成 shallow action list；bounded combat `candidate_futures` 仍保留了 tactical facts / tradeoff / risk / invalidation，且 serialized future completeness 为 completeEnough。
- 这两个 case 的直接失败链路是：

## 2026-07-04 Combat Missing-Tradeoff Narrow Audit

本轮只盯 `combat` 的 `missing_tradeoff`，不继续扩面到 provider、live path、candidate generation、scoring 或 execution。

结论：

- v5.1.6 fresh combat 样本里，至少一部分 `missing_tradeoff` 不是 CandidateFuture 压缩丢失，也不是 provider 问题，而是 `reasonQuality` 规则误判。
- 新增 cue attribution 已证明相关 combat reason 使用了保留的 tradeoff/resource/survival cues，例如：
  - `Draw for block without losing HP.`
  - `0-cost draw 3 to find block, sacrificing no energy.`
- 这些句子已经表达了 gain-vs-cost / gain-vs-risk，但旧规则只识别 `while/but/avoid/...`，没有把 `without`、`sacrificing`、`save/saving`、`keep` 这类 combat 常见 tradeoff 句式算进去。

最小修复：

- 只调整 `assessReasonQuality()` 的 tradeoff 识别词表：
  - 新增 `without`
  - 新增 `sacrifice/sacrificing`
  - 新增 `save/saving`
  - 新增 `keep`
- 这不会改变 provider contract、workspace 内容、candidate 顺序、validation 或 live 行为。
- 这只是 quality telemetry 修正，不会把 invalid output 洗成 valid，也不会放松 semantic validation。

补充设计结论：

- 当前人工修复的 `combat reason contract` 符合 North Star，因为它仍然是在改善 LLM 看到和表达 tradeoff 的 scaffold，而不是把 LLM 降级成按钮选择器，也没有触碰 live、validation、execution 或 stable 写路径。
- 但它不应长期停留在“继续手写更多关键词”的状态。
- 长期正确方向应是：
  - replay/eval/review 用 `missing_tradeoff`、`missing_survival_line`、prediction error、cue attribution 区分来源；
  - 形成 proposal-only 的 `CombatReasonPolicy`、`CandidateTemplate`、`BudgetPolicy` 候选；
  - 在 shadow/fresh evidence 中验证；
  - 只有满足 evidence、review、rollback、stable-promotion 条件后，才允许 promotion。
- 外层死硬边界不进入学习面：
  - semantic validation
  - execution safety
  - live flags / rollout authorization
  - rollback authority
  - fact / memory / derived separation
  - stable promotion rules
  - primary request `finishReason=length`
  - `message.content=""`
  - `reasoning_content` returned
  - truncation rescue and empty rescue both also `finishReason=length`
- 复盘结论更接近 provider contract / output-budget recovery 问题，而不是 parser、candidate choice、shadow execution 或 baseline `full` 语义问题。
- 最小修复方向已落到 shadow-only provider recovery：
  - primary request 保持原行为，便于和既有 evidence 对照
  - rescue retries 默认显式 disable thinking
  - rescue output caps widened from the earlier `120/140` style micro caps to dedicated rescue caps so `length+empty` can actually recover
  - replay/eval/review 继续保留 finish reason、reasoning bytes、failure bucket、retry telemetry，不把 provider error 洗成 valid

2026-07-04 targeted replay retest:

- 用当前代码重建并重测 `transition-000130-agent-mr4sg5sl-xm6o7z` 与 `transition-000131-agent-mr4sh7t9-l925tb`，只做 shadow call，不执行动作，不写 runtime memory。
- 旧样本的原始根因仍然成立：bounded candidate futures 约 `2496B / 605 tokens`，完整 futures 约 `11.5KB`，最大字段来源是 `predictionChecks`，但 bounded 后 completeness 为 completeEnough，失败链路更像 provider output/recovery contract。
- 第一次 targeted retest：
  - 两个 transition 都 valid，`reasonQuality=adequate`，`failureBucket=none`。
  - primary 仍出现 `finishReason=length` + empty content。
  - truncation rescue 使用 `thinking=disabled` 与独立 rescue cap `256`，终端 `finishReason=stop`，成功返回 JSON。
- 第二次 targeted retest：
  - 两个 transition 都 primary success，`finishReason=stop`，`failureBucket=none`，`reasonQuality=adequate`。
- 最小代码修正：
  - `providerAudit.requestedThinkingMode` / provider metadata 现在记录终端 attempt 的 thinking mode，而不是始终显示 primary mode。
  - `providerRecoveryPolicy` 现在汇总 primary/rescue thinking modes 和 terminal thinking mode。
- 当前结论：同类 replayed high-pressure blocker 已被当前 recovery contract 救回；P8.5 live 仍 no-go，直到 fresh high-pressure runtime shadow window 证明 `provider_length_empty` 不再是当前 blocker。

2026-07-04 fresh high-pressure runtime shadow window:

- 在用户手动调到高压 elite combat 后，跑了一个小 fresh shadow window，live additive 保持关闭。
- Run: `run-mr4rh1mb-tohmxl`，新增 transitions `transition-000133-agent-mr525lng-9n0zi0` 到 `transition-000135-agent-mr525ums-jlubdn`。
- Fresh slice since revision `2026-07-03-output-contract-v5.1.5-high-pressure-recovery`:
  - shadow called=3
  - valid=3
  - invalid=0
  - error=0
  - liveEligibleCalled=2
  - liveEligibleInvalid=0
  - liveEligibleError=0
  - failureBucket=`none`
  - finishReason=`stop`
  - outputCapHits=0
  - retries=0
- The two fresh live-eligible calls were both high-pressure `combat:llm_required`; neither reproduced `provider_length_empty`.
- Primary requests succeeded directly in this small fresh window, so rescue was not exercised here. The earlier targeted replay still covers the rescue path where primary `length+empty` is recovered by explicit disabled-thinking rescue and an independent output cap.
- Quality note:
  - One fresh combat reason remained `thin` due `missing_tradeoff`.
  - Fresh combat review signals still included `missing_survival_line`.
  - CandidateFuture completeness stayed `completeEnough` with `shallowFutureCount=0`.
- Current interpretation:
  - Current-code provider recovery no longer looks like the active blocker for high-pressure combat.
  - Historical `provider_length_empty` remains visible in all-history / mixed windows and must not be deleted or washed into success.
  - P8.5 live remains no-go because readiness is now blocked by CandidateFuture / reason-quality evidence and small fresh live-eligible sample size, not by a reproduced provider-length failure.

## 2026-07-04 P8 North Star Alignment Audit

Full report: `docs/reports/P8_NORTH_STAR_ALIGNMENT_AUDIT_2026-07-04.md`.

Summary:

- P8 is still broadly aligned with the North Star. The outer safety shell is intact, shadow decisions do not execute, `full` remains a control group, provider errors are classified instead of hidden, and cognitive scaffold objects are replayable.
- The largest drift risk is not live safety right now; it is inner scaffold hardening by accumulation:
  - fixed CandidateFuture templates and local scoring heuristics
  - fixed compression caps and prompt fields
  - fixed budget/recovery profiles
  - lexical `reasonQuality` and review signals that can become goals instead of diagnostics
  - historical memory/strategy update paths that predate the stricter P9/P10 promotion doctrine
- Current `reasonQuality=thin`, `missing_tradeoff`, and `missing_survival_line` should be treated as useful smoke alarms, not final objectives.
- The next P8.5 step should be attribution, not blind tuning: determine whether survival/tradeoff gaps come from CandidateFuture generation, compression, prompt contract, model output, or review heuristic.
- Future budget governance should evolve toward a learning-aware Budget Governor through attribution-only reporting, proposal-only policy changes, shadow experiments, guarded promotion, and decision-class deliberation profiles.

No code logic was changed for this audit. No live/additive path was enabled.

## 2026-07-04 P8.5 Quality Source Attribution Telemetry

本轮实现最小 attribution telemetry，用来把 `missing_tradeoff` / `missing_survival_line` 从单纯红灯拆成可归因信号。

新增字段：

- `workspaceComparison.coverage.candidateFutureCueAttribution`
  - 比较原始 `CandidateFuture` 与序列化 workspace 后的 cue 状态
  - source buckets: `candidate_future_missing`, `compression_lost`, `serialization_preserved`
  - 覆盖 cue: `tradeoff`, `resource_tradeoff`, `future_risk`, combat 的 `survival_line` / `lethal_line`, card reward 的 `card_reward_direction`, map 的 `route_risk`
- `shadowWorkspaceDecision.reasonCueAttribution`
  - 当 shadow LLM 返回 reason 时，检查模型是否使用了已经保留下来的 cue
  - source buckets: `candidate_future_missing`, `compression_lost`, `model_reason_omitted`, `model_reason_used`

报表：

- `Workspace quality by class` 现在汇总 `cueSources` 和 `reasonCueSources`。
- 这些字段只是 review/eval telemetry，不改变 live prompt、candidate generation/order/scoring、fallback、validation、execution、stable memory、derived knowledge 或 strategy params。

当前预期用途：

- 如果 cue 在原始 futures 中缺失，修 CandidateFuture/template。
- 如果 cue 在原始 futures 中存在但序列化后缺失，修 compressor/policy。
- 如果 cue 保留下来但模型 reason 没用，修 prompt/reason contract 或继续采样判断是否是模型输出问题。
- 如果 cue 存在且被使用，但 review 仍报 thin，修 review heuristic。

Fresh validation:

- Generated fresh transition `transition-000136-agent-mr5p8cor-n0h5r7` in run `run-mr4rh1mb-tohmxl`.
- Decision class: `combat:llm_required`.
- Shadow result: valid, `reasonQuality=adequate`, `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`.
- `candidateFutureCueAttribution`:
  - `tradeoff`, `resource_tradeoff`, and `future_risk`: `serialization_preserved`
  - `survival_line`: `compression_lost`
  - `lethal_line`: `candidate_future_missing`
- `reasonCueAttribution`:
  - `tradeoff` and `future_risk`: `model_reason_used`
  - `resource_tradeoff`: `model_reason_omitted`
  - `survival_line`: still attributed to `compression_lost` because it was absent from serialized candidate futures
  - `lethal_line`: `candidate_future_missing`
- Interpretation:
  - The current `missing_survival_line` blocker is at least partly a compressor/presentation issue in high-pressure combat.
  - Missing lethal-line evidence should be treated separately as CandidateFuture/template evidence.
  - Provider recovery was not the blocker in this sample.

Minimal fix:

- Updated high-pressure combat bounded serialization to preserve a short `survivalLine` when the original future contains survival, block, incoming-damage, mitigation, or stabilization cues.
- This only changes P8 shadow workspace serialization in `full_bounded_candidate_futures`.
- It does not change `full`, live prompt, candidate generation/order/scoring, fallback, validation, execution, provider recovery, stable memory, derived knowledge, or strategy params.

Fresh post-fix validation:

- New transitions:
  - `transition-000138-agent-mr5pj4ib-fx0yvq`
  - `transition-000139-agent-mr5pjdm4-spanei`
- Both are `combat:llm_required`.
- Both shadow calls were valid with `reasonQuality=adequate`, `failureBucket=none`, `finishReason=stop`, and `outputCapHit=false`.
- In both samples:
  - `tradeoff`, `resource_tradeoff`, `future_risk`, and `survival_line` were `serialization_preserved`
  - `lethal_line` remained `candidate_future_missing`
  - `candidateFutureReviewSignals` did not add `missing_survival_line`
- Since-revision fresh slice after these samples: valid=7, liveEligibleValid=5, liveEligibleInvalid=0, error=0, failureBucket=`none`, outputCapHits=0, gate=go.
- P8.5 live remains no-go because overall readiness still reports `NOT_READY_CANDIDATE_FUTURE_QUALITY`, with non-combat and broader evidence still incomplete.

## 2026-07-03 Budget Governance Consolidation

本轮把“预算”从 P8 provider 参数集合提升为项目级治理主题：

- 新增 `BUDGET_GOVERNANCE.md`，明确预算不是单纯省 token，而是 North-Star-aligned governance：
  - call budget
  - recovery budget
  - run budget
  - evidence budget
  - rollout budget
  - protected-path budget
- 文档明确指出当前项目的问题不是“没有 budget”，而是 budget 过度局部化在 P8 workspace shadow，且部分语义仍混在 token cap / retry / readiness / evidence 里。
- 新文档要求：
  - `full` 保持 control baseline
  - compression 服从 strategic fidelity，而不是 token thrift
  - rescue policy 与 workspace compression 分离
  - live promotion 的预算必须比 shadow exploration 更严格
- 已同步更新：
  - `README.md`
  - `PROJECT_AUTHORITY_GUIDE.md`
  - `PROJECT_PLAN.md`
  - `ARCHITECTURE.md`
  - `DATA_SCHEMA.md`
  - `REPLAY_AND_EVAL.md`
  - `LLM_HANDOFF.md`
  - `CONTRIBUTING_OR_ENGINEERING_RULES.md`
- 这次工作只调整治理文档和后续工程路线，没有改变 live prompt、candidate generation/order/scoring、fallback、validation、execution、stable memory、derived 或 strategy 行为。

## 2026-07-01 Desktop North Star Alignment Pass

当前工作目录：

```text
/Users/fire/Desktop/SpireAgent
```

本轮完成：

- 阅读新的 `PROJECT_NORTH_STAR.md` 和 `PROJECT_NORTH_STAR_CHINESE.md`，确认长期方向已升级为 LLM-centered predictive cognitive scaffold。
- 审计主要文档、核心 `src/agent`、`src/domain`、`src/data`、`src/replay`、`src/eval` 代码路径。
- 确认当前工程闭环可运行：transition/replay/eval 已可用，但 live loop 尚未正式产出 North Star 认知对象。
- 新增/扩展 `src/domain/types.ts` 中的可选类型锚点：`StrategicImpression`、`SalienceSignal`、`MemoryActivation`、`CandidateFuture`、`DeliberationPacket`、`PredictionErrorRecord`、`ReplayFrame`、`ConsolidationRecord`。
- 扩展 `TransitionRecord` 可选字段以承载这些对象，不改变旧 transition 或 ground-truth 语义。
- 扩展 smoke，验证认知对象能挂到 executor-logged transition 上。
- 更新 `AGENTS.md`、`README.md`、`ARCHITECTURE.md`、`PROJECT_AUTHORITY_GUIDE.md`、`PROJECT_PLAN.md`、`AGENT_LOOP.md`、`MEMORY_SYSTEM.md`、`DATA_SCHEMA.md`、`REPLAY_AND_EVAL.md`、`LLM_HANDOFF.md`。

验证结果：

- `npm install`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- `npm run data:replay -- --latest`：通过，latest run 为 `run-mr1jyh2e-5hmiwn`，54 transitions。
- `npm run data:eval -- --latest`：`WARN`，0 errors，54 parsed transitions，54 selected actions matched regenerated candidates。
- MCP 在线验证：`curl http://localhost:15526/`、`npm run collect:state`、`npm run agent:tick -- --dry-run` 通过。

当前主要缺口：

- prompt 还不是正式 `DeliberationPacket`。
- candidate generation 仍是 action-first，还未生成完整 `CandidateFuture`。
- memory retrieval 还不是显式 `MemoryActivation`。
- eval/review 还没有生成 `PredictionErrorRecord` 和 `ConsolidationRecord`。
- controller 仍应渐进拆分，不能大改 live 行为。

## 2026-07-01 Phase 3.0 Shadow Cognitive Scaffold Pass

本轮完成：

- 新增 `src/agent/cognitiveScaffold.ts`。
- 实现 shadow-mode `buildStrategicImpression()`、`buildSalienceSignals()`、`buildMemoryActivation()`、`buildCandidateFutures()` 和 `buildCognitiveScaffold()`。
- `AgentController` 在现有 scoring 后构造认知脚手架，只传给 recorder，不参与 prompt、排序、fallback 或执行。
- `AgentDecisionRecorder` 和 transition schema 写入 `strategicImpression`、`salienceSignals`、`memoryActivation`、`candidateFutures`、`deliberationPacket`、`selectedPlan`。
- replay CLI 输出 cognitive coverage。
- eval summary 输出 `cognitiveCoverage`，旧 run 缺字段只产生 `cognitive_coverage` WARN，不产生 FAIL。
- smoke 覆盖 builder、executor transition 写入、replay coverage、eval coverage、旧 transition 兼容。

真实验证：

- `npm run collect:state`：通过，当前为 Act 1 floor 5 combat。
- `npm run agent:tick -- --dry-run`：通过，选择 `Strike -> SEAPUNK_0`。
- `npm run agent:run -- --max-ticks 1 --delay-ms 120`：通过，真实执行 `Strike -> SEAPUNK_0`。
- 新 transition `transition-000140-agent-mr1mga2q-olr8ch` 写入 shadow scaffold：
  - `StrategicImpression`: present
  - `SalienceSignal[]`: 4
  - `MemoryActivation.items`: 3
  - `CandidateFuture[]`: 4
  - `DeliberationPacket`: present
  - `selectedPlan.sourceCandidateId`: `play-0-SEAPUNK_0`
- `npm run data:replay -- --latest`：55 transitions，full shadow scaffold coverage 1/55。
- `npm run data:eval -- --latest`：`WARN`，0 errors，55 selected actions matched regenerated candidates，cognitive coverage 1/55。

行为边界：

- 本轮没有改变 live 决策语义。
- 没有把 `StrategicImpression` 接入 prompt。
- 没有改变 candidate generation、scoring、fallback、validation 或 execution。
- 初版 `CandidateFuture` 仍是 action-first/shallow future，用于记录和后续回放归因。

## 2026-07-01 P1 Shadow DeliberationPacket / Prediction Error Pass

本轮完成：

- P0 审计：上一轮 shadow cognitive scaffold 从 builder、controller、recorder、transition schema、replay/eval、smoke 到旧数据 WARN 兼容已闭环，无需补救性大改。
- 扩展 `DeliberationPacket`，记录 state facts、enemy intent、hand/deck summary、legal actions、top candidates、run memory、derived summary、output schema、prompt parity。
- 新增 `PromptParityReport`，只记录 coverage metadata，不记录完整 live prompt。
- 新增最小 `PredictionErrorRecord` 生成：用 `CandidateFuture.predictedOutcome` 对照 checkpoint/state-diff reasons，能确认则 `prediction_supported`，不能确认则 open/unknown。
- replay 输出增加 `promptParity` 和 `predictionError` coverage。
- eval summary 增加 `deliberationCoverage`、`promptParityCoverage`、`predictionErrorCoverage`。
- review 增加当前 run 的 cognitive coverage 摘要。
- smoke 覆盖 P1 字段写入、coverage 读取、旧 transition 兼容。

真实验证：

- `npm run collect:state`：通过，观察到当前为 menu。
- `npm run agent:tick -- --dry-run`：通过，候选为 menu `continue`。
- `npm run agent:run -- --max-ticks 1 --delay-ms 120`：通过，真实执行 menu `continue`。
- 新 transition `transition-000142-agent-mr1mv96o-2bmm6c` 写入：
  - structured `DeliberationPacket`: present
  - `PromptParityReport.coverage`: 0.909
  - `PredictionErrorRecord.errorType`: `prediction_supported`
  - `PredictionErrorRecord.status`: `accepted`
- `npm run data:replay -- --latest`：56 transitions，prompt parity coverage 1/56，prediction error coverage 1/56。
- `npm run data:eval -- --latest`：`WARN`，0 errors，56 selected actions matched regenerated candidates。

行为边界：

- 本轮没有替换 live prompt。
- 没有改变 candidate generation、scoring、fallback、validation、execution 或真实 action selection。
- P1 仍是 shadow-only observability。

调试目录：

```text
/Users/fire/STS2MCP/sts2-ai-agent-portable
```

调试时间：

```text
2026-06-30
```

## Verification Result

已通过：

- `npm install --ignore-scripts`
- `npm exec tsc -- --noEmit`
- `npm run agent:smoke`
- `curl -sS --max-time 2 http://localhost:15526/`
- `npm run agent:tick -- --dry-run`
- `npm run agent:run -- --max-ticks 10 --delay-ms 120`

## Live MCP Result

游戏侧 MCP/REST 服务可连接：

```json
{
  "message": "Hello from STS2 MCP v0.4.0",
  "status": "ok"
}
```

## Agent Execution Result

portable 目录内的 agent 已经真实执行过一小段当前局：

- 在卡牌奖励界面选择 `Hologram`。
- 按右到左顺序领取 potion 和 gold。
- 继续到地图。
- 选择普通怪节点。
- 进入战斗后能读取敌人意图、自身状态、手牌、能量并执行出牌。
- 能处理出牌后的手牌 index 位移。
- 能写入 `memory/decision-log.jsonl` 和 `memory/current-run.json`。

## Observed Behavior

这次调试没有配置外部 LLM，所以部分“不够明显但仍可执行”的节点使用了 `fallback`：

- 卡牌奖励：选择 `Hologram`。
- 战斗第二回合：选择 `Strike -> Corpse Slug`。

这不是运行错误。正式评估智能度时建议配置：

```bash
export STS2_LLM_COMMAND='node /path/to/your-decider.mjs'
npm run agent:run -- --max-ticks 500 --delay-ms 120
```

或开发时使用：

```bash
npm run agent:run:bridge -- --max-ticks 500 --delay-ms 120
```

## Current Status

结论：这个 portable agent 包已经在新目录中调试通过。

## 2026-06-30 Engineering Pass

本轮接手后完成：

- 运行 `npm install`、`npm exec tsc -- --noEmit`、`npm run agent:smoke`、`npm run agent:review`。
- 连接本机 MCP/REST，并运行 `npm run agent:tick -- --dry-run`。
- 未真实执行游戏动作。
- 新增结构化 decision route：`forced_local`、`obvious_local`、`local_fast_combat`、`local_confident`、`local_recommended_llm_arbitrate`、`llm_required`、`no_op_or_poll`。
- tick 输出和新 decision log 增加 LLM audit、fallbackReason、candidateCount、topCandidate。
- `agent:review` 默认输出聚合摘要，`agent:review -- --full` 保留完整 memory dump。
- smoke test 覆盖 LLM 不可用 fallback 和非法 candidate fallback。

已知说明：

- 当前历史 decision log 是旧 schema，因此 review 中旧记录 route 会显示 `unknown`。
- dry-run 会读取并刷新 run memory 的状态摘要，但不会执行游戏动作，也不会写入 decision log。

## 2026-06-30 Checkpoint Pass

本轮完成：

- 复验 baseline：`npm install`、`npm exec tsc -- --noEmit`、`npm run agent:smoke`、`npm run agent:review`、`npm run agent:tick -- --dry-run`。
- 新增 `src/agent/checkpoint.ts`。
- 真实执行后记录 `preStateHash`、`postStateHash`、state diff、checkpoint kind、checkpoint reasons、settled、polls。
- checkpoint kind 包括 `none`、`soft`、`hard`、`unknown`。
- `agent:review` 增加 checkpointByKind、hardCheckpointReasons、recentHardCheckpoints。
- smoke 增加 soft play-card、generated-card hard checkpoint、enemy-death hard checkpoint。
- 真实执行了两段短跑：
  - `npm run agent:run -- --max-ticks 5 --delay-ms 120`
  - `npm run agent:run -- --max-ticks 8 --delay-ms 120`
- 真实短跑结果：完成当前 floor 3 战斗，领取奖励，选择 `Glasswork`，领取 gold，进入地图并选择下一个普通怪节点。
- 修复真实跑局暴露的问题：`end_turn` 已进入新回合但 `isPlayPhase` 短暂为 false 时不应判 settlement timeout。
- 低自由度优化：单一 `choose_map_node` 和单一 `claim_reward` 归入 `forced_local`，避免不必要 LLM 请求。

真实观察：

- 普通出牌 checkpoint 多为 `soft`。
- 敌人死亡、进入奖励、选卡、地图流转为 `hard`。
- 无 LLM 配置时，card reward 仍会 `llm_required -> fallback llm_unavailable`，这是预期；正式评估需要接 `STS2_LLM_COMMAND`。
- 战斗结束瞬间曾出现一次 `screen=unknown` 过渡态，下一 tick 正常进入 rewards；目前作为 hard checkpoint 记录，后续可考虑在 state inference 层专门处理。

剩余外部前提：

- 目标位置需要能运行 Node.js。
- 目标位置需要先执行 `npm install`。
- 游戏侧 MCP/REST 服务需要运行并可通过 `STS2_API_URL` 访问。
- 如果需要 LLM-first 行为，需要接入 `STS2_LLM_COMMAND` 或 Codex bridge。

## 2026-06-30 Collector And Conservative Fallback Pass

本轮补充 steer：项目不能只在 controller 里堆功能，要逐步演进成可采集、可回放、可测试、可评估、可复盘、可改进的 agent 系统。

已完成：

- 阅读新增 steer、当前架构文档、client、checkpoint、controller、types、review、smoke、package 配置。
- 新增 `docs/agent-system-principles.md`，保存长期目标、核心思想、模块边界、数据分层和迭代循环。
- 新增 `src/agent/fallback.ts`，把 LLM fallback 策略从 controller 拆出。
- 高压战斗中 LLM 不可用/无效时，fallback 会记录 `fallbackPolicy`；疑似斩杀保留，否则可切到更安全的格挡/保命候选。
- 新增 `src/agent/collector.ts`，提供只读采集 MVP：
  - `npm run collect:state`
  - `npm run collect:watch`
  - 输出 `memory/collected/state-log.jsonl`
  - 保存 raw snapshot 到 `memory/collected/snapshots/`
  - record 包含 schemaVersion、runId、tick、timestamp、screen、floor、hp、gold、stateHash、rawStatePath、compactState。
- `client.ts` 新增最小 `StateSource` / `ActionExecutor` 边界，后续 fixture/replay/dataset source 可以沿这个方向扩展。
- `client.ts` 改善 MCP/REST 不可用时的错误提示。
- `agent:review` 增加 `fallbackByPolicy`，recentDecisions 显示 fallbackPolicy。
- `memory` counters 增加 `conservativeFallbackDecisions`。
- smoke 增加保守 fallback 和 collector record schema 覆盖。
- 更新 README、架构文档、LLM bridge、project boundaries、portable usage、bundle manifest、memory README、handoff。

运行结果：

- `npm install`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run agent:review`：通过。
- `curl -sS --max-time 2 http://localhost:15526/`：失败，localhost:15526 未连接。
- `npm run agent:tick -- --dry-run`：因 MCP/REST 不可用失败，错误信息已明确提示服务未运行。
- `npm run collect:state`：因 MCP/REST 不可用失败，错误信息已明确提示服务未运行。

本轮没有真实执行游戏动作。原因是本机当前无法连接游戏侧 MCP/REST 服务。该 integration 跳过不视为代码失败。

架构审计结论：

- controller 仍承担 orchestration、LLM gate、fallback、settlement、decision log 组装等多项职责；本轮先拆出 fallback，后续应继续拆 decision-router / executor / settlement。
- 当前 `GameClient` 已能作为最小 StateSource + ActionExecutor，但 controller 还没有完全转为可注入 fixture/replay source。
- 当前可以独立采集游戏状态，但 replay/eval 还未实现。
- checkpoint/state hash 已独立，可被 collector 和后续 replay 共用。
- candidates/scoring 仍偏大，下一步最值得按 screen 拆 combat/card reward/map/shop/event。

## 2026-06-30 Live Collector / Dry-run / Short-run Validation

本轮按要求执行：

- 启动 Steam 游戏：`open "steam://rungameid/2868840"`。
- 验证 MCP/REST：`curl http://localhost:15526/` 返回 `Hello from STS2 MCP v0.4.0`。
- `npm install`：通过。
- `npm run collect:state`：通过，写入 `memory/collected/state-log.jsonl` 和 raw snapshot。
- `npm run agent:tick -- --dry-run`：通过。
- `npm run agent:run -- --max-ticks 5 --delay-ms 120`：真实执行了菜单/Neow 初始事件流程。
- `npm run agent:run -- --max-ticks 3 --delay-ms 120`：真实执行并验证 bundle select / confirm / Proceed。
- `npm run agent:run -- --max-ticks 5 --delay-ms 120`：真实进地图、进普通怪战斗并出牌。
- `npm run agent:review`：通过。

真实验证结果：

- collector 可以采集真实 menu、bundle_select、map、combat 状态。
- fallbackPolicy 真实写入日志：
  - `local_top` 用于无 LLM 时的 `standard`、Neow Scroll Boxes、bundle_select。
- checkpoint 真实记录：
  - bundle confirm / event proceed / map flow 是 hard checkpoint。
  - 普通出牌是 soft checkpoint。
  - bundle preview 选择当前仍容易 settlement timeout，记录为 unknown，但下一 tick 可以继续 confirm。

真实跑局暴露并修复的问题：

- 问题：`bundle_select` 被归一化成 `screen=unknown`，导致 dry-run `No actionable candidates`。
  - 修复：新增 `bundle_select` screen、candidate、scoring、action type、smoke fixture。
- 问题：REST action 名称写错为 `bundle_select`。
  - 修复：`client.ts` 改为实际 REST action：`select_bundle`、`confirm_bundle_selection`、`cancel_bundle_selection`。
- 问题：菜单评分会被旧 run memory 中的 `菜单 DEFECT` 污染，导致过早点 `embark`，这次真实局误开成 Ironclad。
  - 修复：只认最近 120 秒内当前菜单流程的 DEFECT 选择；character_select 未确认 Defect 时降低 embark。

真实跑局仍暴露但尚未修复的问题：

- 当前局已经误开成 Ironclad，不是目标 Defect；后续新局应验证菜单修复是否生效。
- 地图节点选择出现连续两次 `choose_map_node` 才进入战斗；需要进一步区分 map transition / waiting state。
- 当前 combat 本地评分在满血时偏进攻，打完能量后 dry-run 只能 end turn 且会掉 11 HP；需要改进战斗评分，让高 incoming 时保留足够防御价值，即使满血也不应无脑用完能量攻击。
- 一次 Strike 后出现 `hand_changed_beyond_expected_card_removal` / `hand_grew_or_generated_card` hard checkpoint，说明该敌人或遗物/卡牌效果可能让手牌变化非预期，需要继续采集 replay 分析。

本轮停止位置：

- 当前真实游戏在 Act 1 floor 2 combat。
- 当前 dry-run 下一步是 `end_turn`，会掉 11 HP；因此本轮没有继续执行，避免无谓伤血。

## 2026-06-30 GitHub Readiness And Steering Docs Pass

本轮目标：把 portable agent 整理成可以远程上传到 GitHub、被其他人 clone 后重新部署的项目，并把最近几个长期 prompt 的核心目标、架构思想、迭代规范和真实跑局规范写入项目。

已完成：

- 新增 `LICENSE`。
- 新增 `.github/workflows/ci.yml`，CI 运行 `npm ci`、`npm run typecheck`、`npm run agent:smoke`。
- 更新 `package.json`：
  - 包名改为 `sts2-ai-agent-portable`。

  - 增加 `version`、`description`、`license`。
  - 增加 `typecheck` 和 `check` 脚本。
- 更新 `.gitignore`：
  - 忽略 runtime memory、collector raw data、`.env`、`node_modules`。
- 新增 `docs/DEPLOYMENT.md`：
  - 说明 GitHub clone 后安装、MCP mod 安装/验证、启动游戏、dry-run、短跑、LLM bridge。
- 新增 `docs/PROJECT_STEERING.md`：
  - 保存 prompt-derived 长期目标、架构分层、数据层边界、真实跑局规范和当前已知缺口。
- 新增 `docs/ITERATION_GUIDE.md`：
  - 说明 baseline、collector、dry-run、live run、局后修正、patch discipline。
- 新增 `docs/GITHUB_CHECKLIST.md`：
  - 上传 GitHub 前检查项。
- 更新 `README.md`、`AGENTS.md`、`LLM_HANDOFF.md`、`BUNDLE_MANIFEST.md`、`PORTABLE_USAGE.md`、`docs/agent-system-principles.md`、`docs/ai-agent-architecture.md`。

重要规范修正：

- 真实游戏测试时，普通掉血不是工程风险，也不是中途停下改代码的理由。
- 只有明显程序问题才中途停下修复，例如 invalid REST action、unknown screen 阻塞、无候选、重复无进展、过期手牌 index、settlement 卡住、崩溃或 LLM validator 失效。
- 策略质量问题应继续跑到自然节点或局后，根据 collector、review 和 decision log 复盘修正。

运行结果：

- `npm install`：通过。
- `npm run check`：通过。
- `npm run agent:review`：通过。

本轮没有继续真实执行游戏动作；当前真实局仍停在之前记录的 Act 1 floor 2 combat。

## 2026-07-01 Phase 2.6 Eval Classification / Noise Reduction Pass

本轮目标：不加大功能，不拆 controller，只把 Phase 2.5 已有 transition/replay/eval 闭环升级成更可行动的 WARN 分类，并用真实 200 tick 验证。

已完成：

- `data:eval` 新增 WARN 分类：`normal_flow_checkpoint`、`acceptable_settlement_timeout`、`program_risk`、`historical_fixed_evidence`、`strategy_quality`、`needs_fixture_bug_candidate`。
- CLI 顶层 `warnings` 降噪：普通流程和可接受 settlement timeout 留在 `warningSummary`，顶层只保留 actionable/risk/strategy 项。
- 正常 hard checkpoint 白名单覆盖 menu、reward、map、rest、proceed、end_turn、card reward、card select 成功返回、combat 出牌移除/斩杀/跳转等流程。
- shop/treasure/card-select/menu/奖励/地图等低可见度结算 timeout 标成可接受 info。
- 修复前遗留 repeated no-progress 证据标成 historical，不再误导为当前 blocker。
- 新增轻量策略质量 metrics：低血量、高 incoming、block deficit、deck too thick、potion misuse、route greed、fallback rate、repeated low confidence、combat tempo loss。

真实验证：

- 先读状态：`npm run collect:state` 通过，战斗位于 Act 2 floor 31，HP 16/75。
- dry-run：`npm run agent:tick -- --dry-run` 通过，建议使用 Strength Potion。
- 真实 200 tick：`npm run agent:run -- --max-ticks 200 --delay-ms 120` 退出码 0。
- 旧 run `run-mr0rfdcb-yewhg8` 在 boss 后死亡/结束，随后新 run `run-mr192jap-y1qb0x` 开始并推进到 Act 1 floor 15 rewards，HP 39/75，gold 11。
- `npm run data:replay -- --latest` 通过，latest run 为 `run-mr192jap-y1qb0x`，142 transitions。
- `npm run data:eval -- --latest` 返回 `WARN` 且 0 errors；142/142 selected actions 匹配 regenerated candidates。
- 降噪后 `needs_fixture_bug_candidate=0`，顶层 warnings 只剩策略质量项：block deficit、一次 low-pressure potion use、fallback-heavy decisions。

验证命令：

- `npm install`
- `npm exec tsc -- --noEmit`
- `npm run agent:smoke`
- `npm run check`
- `npm run agent:review`
- `npm run data:replay -- --latest`
- `npm run data:eval -- --latest`

本轮未发现需要停跑修复的程序级 bug。剩余问题主要是策略质量：fallback 比例偏高、防御缺口偏多、一次低压药水使用。这些不作为 Phase 2.6 blocker。

## 2026-06-30 Phase 0 Project Book And Architecture Audit

本轮目标：按照最新长期 prompt 开始 Phase 0，不做大规模代码重构，先完成真实项目诊断、外部依赖评估、推荐架构、模块边界、数据流、风险、实施路线和验收标准，并把这些内容落到仓库文档里。

阅读和审计：

- 阅读最新附件 prompt。
- 审计当前目录结构、`package.json`、README、handoff、steering docs。
- 审计核心代码：
  - `src/agent/types.ts`
  - `src/agent/client.ts`
  - `src/agent/state.ts`
  - `src/agent/candidates.ts`
  - `src/agent/scoring.ts`
  - `src/agent/controller.ts`
  - `src/agent/checkpoint.ts`
  - `src/agent/fallback.ts`
  - `src/agent/memory.ts`
  - `src/agent/prompt.ts`
  - `src/agent/llm.ts`
  - `src/agent/collector.ts`
  - `src/agent/review.ts`
  - `src/agent/sts2Knowledge.ts`
  - `src/agent/smoke.ts`
- 复查当前 STS2MCP mod 能力：可读状态、可执行 agent 动作；未发现可靠 human event/action log。
- 外部项目评估：
  - STS2MCP：适合作为 game I/O adapter。
  - Spire Codex：适合作为事实数据库和本地缓存来源，不应污染策略层。

新增 Phase 0 文档：

- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `EXTERNAL_DEPENDENCIES.md`
- `GAME_IO_CAPABILITIES.md`
- `DATA_SCHEMA.md`
- `MEMORY_SYSTEM.md`
- `DERIVED_KNOWLEDGE.md`
- `AGENT_LOOP.md`
- `COMBAT_PLAN_AND_CHECKPOINT.md`
- `HUMAN_CAPTURE_LIMITS.md`
- `REPLAY_AND_EVAL.md`
- `REWARD_AND_EXPERIMENTS.md`
- `CONTRIBUTING_OR_ENGINEERING_RULES.md`

更新文档入口：

- `README.md`
- `LLM_HANDOFF.md`
- `docs/PROJECT_STEERING.md`

基线验证：

- `npm install`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- `curl -sS --max-time 2 http://localhost:15526/`：通过，返回 `Hello from STS2 MCP v0.4.0`。
- `npm run collect:state`：通过，采集当前真实局 `screen=combat`、`floor=2`。
- `npm run agent:tick -- --dry-run`：通过，选择 `end_turn`，`route=forced_local`，未执行真实动作。

本轮没有真实执行游戏动作。

审计发现的主要问题：

- 当前 TypeScript agent 已能跑通基本 loop，但还没有 formal `domain-core` / `game-io` / adapter capability schema。
- `controller.ts` 仍承担较多 orchestration 细节。
- `candidates.ts` 和 `scoring.ts` 仍是多 screen 混合文件。
- collector 仍是 snapshot-only，不是完整 transition recorder。
- 没有 replay CLI 和离线 eval runner。
- Human play 目前只能 snapshot 或 diff inference，不能作为 ground truth labeled examples。
- Combat 已有 checkpoint，但还不是完整 segmented plan。
- Review 已能聚合 route/fallback/checkpoint，但 transition/reward/experiment 还未闭环。

下一步最值得做：

1. Phase 1：新增 typed `AdapterCapabilities`、`GameIO` interface 和 transition schema，同时保持旧命令兼容。
2. Phase 2：实现 agent transition recorder，把 agent action 记录为 `executor_logged` + `isGroundTruth=true`。
3. Phase 2/3：添加 state diff / replay reader / offline eval fixture，优先覆盖地图重复点击、hand index、human diff ambiguity。
4. Phase 3：把 combat candidate 从单动作升级为短 plan + checkpoint continuation。

## 2026-06-30 Phase 1 Source Of Truth And Schema Pass

本轮目标：在 Phase 0 文档基础上继续开发，不另起项目，不继续只堆文档；先审计文档和代码，然后收敛文档 source-of-truth，并落地 Phase 1 的 schema/interface/capability/transition 基础。

审计结论：

- `README.md` 太像完整文档索引，已精简为 quick start + authority docs。
- `LLM_HANDOFF.md` 过长且复制架构内容，已改成当前接手状态。
- `docs/PROJECT_STEERING.md`、`docs/PROJECT_BOUNDARIES.md`、`docs/agent-system-principles.md`、`docs/ai-agent-architecture.md` 与根目录权威文档重复，已改为 redirect。
- `DEBUG_REPORT.md` 顶部已加历史 warning，避免旧“当前状态”误导后续 agent。
- 当前代码已有可工作的 agent loop，但缺 formal domain-core、typed GameIO、runtime AdapterCapabilities、TransitionRecord schema 和 ground truth invariant。

文档整理：

- `PROJECT_NORTH_STAR.md` 保持长期最高原则文档。
- `PROJECT_AUTHORITY_GUIDE.md` 保持工程权威索引，并补充 Phase 1 状态和“代码变更必须同步文档”要求。
- `PROJECT_PLAN.md` 补充 Phase 1 当前状态和代码 anchors。
- `ARCHITECTURE.md` 重写为 five planes 架构，并明确 mod vs local agent boundary。
- `DATA_SCHEMA.md` 同步 `src/data/transitionSchema.ts` helpers 和 ground truth rules。
- `GAME_IO_CAPABILITIES.md` 同步 `src/domain/types.ts`、`src/game-io/types.ts`、`src/adapters/sts2mcp/capabilities.ts`、`src/agent/client.ts`。

新增代码：

- `src/domain/types.ts`
  - `AdapterCapabilities`
  - `GameIO` 相关接口
  - `GameState` / `CanonicalState`
  - `GameAction` / `LegalAction`
  - `GameEvent` / `ActionEvent`
  - `TransitionRecord`
  - `CaptureMode`
  - `RunRecord`
  - `StateSnapshot`
  - `StateDiff`
  - `DecisionAudit`
  - `LlmDecision`
  - `MemorySnapshot`
  - `DerivedSnapshot`
  - `ExecutionResult`
- `src/game-io/types.ts`
  - re-export typed GameIO boundary。
- `src/adapters/sts2mcp/capabilities.ts`
  - `STS2MCP_REST_CAPABILITIES`
  - `getSts2McpRestCapabilities()`
- `src/data/transitionSchema.ts`
  - `createSnapshotOnlyTransition()`
  - `createSnapshotOnlyTransitionFromCollectedState()`
  - `createExecutorLoggedTransitionSkeleton()`
  - `createDiffInferredTransitionSkeleton()`
  - `assertGroundTruthInvariants()`
- `src/agent/llm.ts`
  - `validateLlmDecisionForCandidates()`
- `src/agent/client.ts`
  - `RestGameClient.capabilities()`

Ground truth rules：

- `executor_logged` 可以 `isGroundTruth=true`，但必须有 `selectedAction`。
- `snapshot_only` 永远不能是 ground truth。
- `diff_inferred` 永远不能是 ground truth。
- `mcp_event` 只有同时具备 action identity 和 timing evidence 时才可标记为 ground truth。

Smoke 覆盖：

- STS2MCP capabilities，包括 `canReadHumanEvents=false`。
- `snapshot_only` 不能 ground truth。
- `diff_inferred` 不能 ground truth。
- `executor_logged` 可以 ground truth。
- `CollectedStateRecord` 到 snapshot-only transition 的兼容映射。
- LLM candidate validator：合法、missing candidate、missing candidateId。
- controller 中 invalid LLM output / invalid choice fallback。

运行结果：

- `npm install`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run agent:review`：通过。
- `npm run check`：通过。
- MCP 在线：`curl http://localhost:15526/` 返回 `Hello from STS2 MCP v0.4.0`。
- `npm run collect:state`：通过，采集当前真实局 `screen=combat`、`floor=2`。
- `npm run agent:tick -- --dry-run`：通过，选择 `end_turn`，未执行真实动作。

本轮没有真实执行游戏动作。

下一步最值得做：

1. Phase 2：实现 `AgentDecisionRecorder`，在 executor 周围生成 `executor_logged` transition skeleton。
2. Phase 2：新增 `data/runs/<runId>/metadata.json`、`snapshots/`、`transitions.jsonl` 写入器。
3. Phase 2：把 current collector 的 snapshot-only record 迁移/导出为 TransitionRecord。
4. Phase 2：新增最小 replay reader，能按 timeline 打印 pre/action/post/diff。

## 2026-06-30 Phase 2 Minimum Data Loop Pass

本轮目标：实现最小可用数据闭环，不重写 controller，不改变 action semantics，保留 `memory/collected/` collector 兼容。

已完成：

- 新增 `src/agent/decisionRecorder.ts`。
- CLI agent 默认创建 `AgentDecisionRecorder`。
- controller 在真实动作成功执行、settlement 完成并生成 checkpoint 后写 transition。
- 新增 `data/runs/<runId>/` 写入结构：
  - `metadata.json`
  - `snapshots/`
  - `events.jsonl`
  - `transitions.jsonl`
  - `replay.json` placeholder
- transition 记录：
  - `source="agent"`
  - `captureMode="executor_logged"`
  - `isGroundTruth=true`
  - `preStateRef` / `postStateRef`
  - `rawStatePath`
  - `compactPreState` / `compactPostState`
  - `legalActions`
  - `selectedAction`
  - `executionResult`
  - `stateDiff.checkpoint`
  - `decisionAudit`
  - `memorySnapshot`
  - minimal `derivedSnapshot`
- `CollectedStateRecord` 仍可映射为 `snapshot_only + isGroundTruth=false`。
- 新增 `src/replay/reader.ts` 和 `src/replay/cli.ts`。
- 新增 `npm run data:replay -- <runId-or-run-dir>`。
- `.gitignore` 忽略 `data/runs/` runtime output。
- smoke 新增：
  - agent executor_logged transition 是 ground truth。
  - transition JSONL 可解析。
  - replay reader 能读取 transitions。
  - run directory 基础文件存在。

已验证：

- `npm install`：通过。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- MCP 在线：`curl http://localhost:15526/` 通过。
- MCP 在线：`npm run collect:state` 通过，当前真实状态为 `screen=combat`、`floor=2`。
- MCP 在线：`npm run agent:tick -- --dry-run` 通过，当前 dry-run 为 `end_turn`，未执行真实动作。

真实短跑验证：

- `npm run agent:run -- --max-ticks 10 --delay-ms 120`：通过。
- 本轮真实执行 10 个动作：
  - floor 2 combat end turn。
  - Defend / Bash / end turn / Unrelenting。
  - 领取 card reward，选择 `Cinder`。
  - 领取 potion、gold。
  - proceed 到地图。
- `data/runs/run-mr0ckah9-99khw3/transitions.jsonl` 写入 10 条真实 transition。
- `data/runs/run-mr0ckah9-99khw3/snapshots/` 写入 20 个 pre/post raw snapshots。
- 抽查首条 transition：
  - `source="agent"`
  - `captureMode="executor_logged"`
  - `isGroundTruth=true`
  - 有 pre/post refs、selectedAction、executionResult、stateDiff、legalActions、memorySnapshot。
- `npm run data:replay`：通过，输出 10 条 timeline。
- 短跑后 `npm run agent:review`：通过。
- 短跑后 `npm run collect:state`：通过，当前真实状态为 `screen=map`、`floor=2`、`hp=72/80`、`gold=116`。

剩余缺口：

- offline eval runner 已有最小工程检查版本，但还没有策略质量评分。
- 未实现 HumanPlayRecorder diff fallback。
- 当前 STS2MCP 仍不能可靠提供 human UI action ground truth。

## 2026-07-01 Phase 2.5 Offline Eval Runner Pass

本轮目标：把 transition/replay 数据升级为可自动检查的工程闭环，不重写 controller，不调复杂策略。

已完成：

- 新增 `src/eval/runner.ts`。
- 新增 `src/eval/cli.ts`。
- 新增 `npm run data:eval`。
- `data:eval` 默认读取 latest run，也支持：
  - `npm run data:eval -- --latest`
  - `npm run data:eval -- --run-id <runId>`
  - `npm run data:eval -- --run-dir <path>`
- eval 输出：
  - `status`: `PASS` / `WARN` / `FAIL`
  - `summary`
  - `errors`
  - `warnings`
- 当前检查项：
  - `metadata.json` 可读且有 runId。
  - `transitions.jsonl` 每行可解析。
  - transition runId 与 metadata runId 一致。
  - transitionId 唯一。
  - pre/post/raw snapshot ref 存在。
  - ground truth invariant。
  - human 非 `mcp_event` 不能 ground truth。
  - pre raw snapshot 可重新 normalize。
  - actionable screen 不能 0 candidates。
  - selectedAction 必须匹配 regenerated candidates。
  - stale card index、illegal target、unknown screen action 作为 FAIL。
  - hard/unknown checkpoint、settlement timeout、repeated no-progress 作为 WARN。
- `src/replay/cli.ts` 支持 `npm run data:replay -- --latest` 和 `--run-id`。
- smoke 覆盖 eval runner PASS 路径和 human ground-truth invariant。

已验证：

- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run data:replay -- --latest`：通过。
- `npm run data:eval -- --latest`：通过，当前真实 run 返回 `WARN`，0 errors，10/10 selectedAction matched，仅 hard checkpoint warnings。

## 2026-07-01 Phase 2.5 Live Hardening Follow-up

本段修正上一节之后继续真实长跑暴露的程序级问题。上一节的 eval `WARN` 结果只适用于当时的短 run；后续 latest run 保留了修复前的坏 transition，因此会被当前 eval 正确判为 `FAIL`。

已修复：

- map/loading 状态不再生成不可用的 proceed。
- `hand_select` 归一化为 card-select 流程，并使用真实 REST action `combat_select_card` / `combat_confirm_selection`。
- shop 不再为 sold-out 或 unaffordable 商品生成购买候选。
- treasure loading 状态不再生成无效 proceed；可领取 relic 时使用 `claim_treasure_relic`。
- event loading 状态不再生成通用 proceed。
- potion reward 在药水槽已满时不再直接 `claim_reward`；候选改为 proceed/skip 或 discard potion。
- potion action 使用 raw `slot`，避免稀疏 potion 数组导致 stale slot。
- self/buff potion 不再带 enemy target；只有 enemy-target potion 才生成 target。
- rest 选择后增加短 settlement backoff，避免立即 proceed 时 REST 按钮尚未启用。

已验证：

- `npm install`：通过。
- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- `npm run data:replay -- --latest`：通过。

当前重要说明：

- `npm run data:eval -- --latest` 对 `run-mr0qudda-21si27` 返回 `FAIL` 是预期的历史证据：该 run 内含修复前的重复 `claim_reward:0` no-progress 和旧 potion target action。
- 不要把这个 latest-run FAIL 记为当前代码未通过；需要用修复后的新 run 覆盖 latest，再用 `npm run data:eval -- --latest` 判断当前闭环。
- 普通掉血、路线争议、fallback 策略不聪明仍不是停跑条件。程序级 FAIL 才停。

## 2026-07-01 Phase 2.5 Fresh Latest Run And Adapter Edge Fixes

本段继续真实跑局，旧污染 run 已结束并开启新的 Defect run：`run-mr0rfdcb-yewhg8`。

新发现并修复的程序级问题：

- `embark` 后 raw state 仍短暂显示 `state_type=menu` / `menu_screen=character_select`，但 `run.act=1`、`floor=0`，并且 `embark/confirm` 已 disabled。此前会再生成 stale menu action，REST 报 `Not on a menu screen`。
  - 修复：菜单候选过滤 disabled options；post-embark run-start menu transition 返回空候选等待下一 screen。
- `Fairy in a Bottle` 出现在 potion list 中但为 automatic potion，不能手动 `use_potion`。此前会重复请求手动使用，REST 报 `Potion 'Fairy in a Bottle' is automatic and cannot be manually used`。
  - 修复：combat potion candidate 过滤 raw unusable/automatic flags，并按文本过滤 `Fairy in a Bottle` / automatic / upon death 类药水。

已验证：

- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过，新增 disabled menu / run-start transition / automatic potion fixture。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- MCP 在线：`npm run collect:state`：通过。
- MCP 在线：`npm run agent:tick -- --dry-run`：通过，Fairy 被过滤后候选为 `end_turn`。
- MCP 在线：`npm run agent:run -- --max-ticks 10 --delay-ms 120`：通过，解除 automatic potion no-progress 后继续完成 floor 2 战斗并进入 rewards。
- `npm run data:replay -- --latest`：通过，latest run 22 transitions。
- `npm run data:eval -- --latest`：通过，返回 `WARN`、0 errors、22/22 selectedAction matched、0 repeatedNoProgress。

当前 latest run 说明：

- `run-mr0rfdcb-yewhg8` 为当前最新 run，可作为当前代码的 engineering eval 信号。
- Eval 仍为 `WARN`，因为 hard checkpoint、menu Defect unknown checkpoint、Dexterity Potion unknown checkpoint 属于审计项；当前没有 JSONL/schema/snapshot/action matching 错误。

## 2026-07-01 Phase 2.5 Live Stability Validation

本段继续使用现有 transition/replay/eval 闭环做真实稳定性验证，没有新增大功能或重写 controller。当前 latest run 仍是 `run-mr0rfdcb-yewhg8`，后续 transition 已推进到 Act 2。

真实验证过程：

- 50 tick 真实跑局从 Act 1 floor 2 推进到 Act 1 floor 5，`data:eval -- --latest` 返回 `WARN`、0 errors。
- 随后 200 tick 真实跑局暴露 stale hand index：一次 `play_card` 后 post-state 仍保留同 index/cardName，settlement 误判为完成，下一 tick 使用了过期手牌，REST 返回 `card_index 2 out of range`。
- 修复 stale index 后继续 200 tick，跑过 Act 1 boss 并进入 Act 2 floor 18 event。
- Act 2 floor 18 `Pael's Tooth` 多选移除事件暴露 repeated no-progress：REST 接受 `select_card index=0` 但 raw fingerprint 不变，agent 重复 toggle 同一张 Strike。
- 修复 card-select guard 后，50 tick 验证成功选择 index 0/1/2/3/4 并 confirm，离开事件，继续到 Act 2 floor 20 rewards。

已修复的程序级问题：

- `play_card` settlement 不再接受“同 screen/state 且被打出的 card 仍在同一 hand index/name”的 post-state；此类状态继续轮询，避免 stale index。
- `card_select` / `combat_select_card` 在未 settle 且 fingerprint 不变时记录已尝试 index，后续选择同类未尝试 candidate；若没有可尝试项则等待，不再无限 toggle 同一选择。
- replay/eval 的短 action 标识现在包含 `cardIndex` / `index`，避免把 `select_card:0:Strike`、`select_card:1:Strike` 等误判为同一 repeated no-progress。

已验证：

- `npm exec tsc -- --noEmit`：通过。
- `npm run agent:smoke`：通过，包含 stale play-card settlement 和 repeated card-select guard fixture。
- `npm run check`：通过。
- `npm run agent:review`：通过。
- `npm run data:replay -- --latest`：通过。
- `npm run data:eval -- --latest`：通过，返回 `WARN`、0 errors、374 parsed transitions、374 selected actions matched。

当前 eval 说明：

- `run-mr0rfdcb-yewhg8` 的 `WARN` 包含历史 transition 证据：修复前同一 run 内曾重复 `select_card:0:Strike`，因此 repeatedNoProgress 仍会显示 14。
- 修复后的 Pael's Tooth 流程已在同一 run 中依次记录 `select_card:0:Strike`、`select_card:1:Strike`、`select_card:2:Strike`、`select_card:3:Strike`、`select_card:4:Defend`、`confirm_selection`。
- 没有 JSONL parse、snapshot ref、ground truth invariant、candidate regeneration、selectedAction matching 错误。
- 第二个修复之后已完成一整段新的 200 tick 无程序级中断验证：从 Act 2 floor 20 rewards 推进到 Act 2 floor 31 combat。`data:eval -- --latest` 返回 `WARN`、0 errors、574 parsed transitions、574 selected actions matched。下一步可进入 Phase 2.6 的轻量设计/验证准备，但仍应把 checkpoint/settlement WARN 当作后续工程审计输入。

## 2026-07-01 Phase 2.5 Fresh 200 Tick Validation

在 stale play-card settlement、card-select guard、indexed replay/eval action identity 都修复后，重新执行 200 tick：

- 起点：Act 2 floor 20 rewards，hp 55/75。
- 终点：Act 2 floor 31 combat，hp 16/75，run `run-mr0rfdcb-yewhg8`。
- 新增 transition：从 374 增至 574。
- `npm run data:replay -- --latest`：通过，可读取 574 条 timeline。
- `npm run data:eval -- --latest`：`WARN`，0 errors，574/574 selectedAction matched regenerated candidates。

本段没有发现新的程序级 bug。剩余主要是策略/审计问题：

- LLM 不可用时 fallback 仍会在无 incoming 或高压局面做不聪明选择。
- shop/treasure/potion/card-select 等界面仍会产生 unknown checkpoint / settlement timeout WARN，但没有形成 invalid REST action 或重复无进展。
- 同一 run 内仍保留修复前 Pael's Tooth 的 14 条 historical repeatedNoProgress warning；它们不是 fresh 200 的新回归。

## 2026-07-01 P2 Shadow Prompt Parity Refinement

Implemented the next shadow-only scaffold step in the Desktop project:

- Added `src/agent/derivedKnowledge.ts` to retrieve a small read-only derived snapshot from `derived/card-tags.json`, `derived/relic-tags.json`, `derived/synergy-rules.json`, and `derived/draft-rules.md`.
- Wired `derivedSnapshot` into the existing transition recorder path through `AgentController` and `buildCognitiveScaffold`.
- Kept live behavior unchanged: no live prompt replacement, no candidate reordering, no scoring change, no fallback change, no validation/execution change.
- Extended replay/eval/review coverage so `derivedSnapshot` and `derivedKnowledgeSummary` are visible as first-class shadow coverage.
- Refined `PredictionErrorRecord.evidence[0].attribution` into damage, defense, hp, card flow, phase, and resource groups derived from checkpoint reasons and state-diff evidence.

Latest observed P2 transition:

- run `run-mr1jyh2e-5hmiwn`
- transition `transition-000144-agent-mr1okkpq-j6zgbb`
- selected action `Defend`
- `derivedSnapshot`: 0 relevant facts, 8 relevant rules from local derived knowledge
- `promptParity.coverage`: 1.0 with no missing sections on the fresh transition
- prediction attribution captured block gain, energy spend, discard change, and expected hand removal

Latest eval signal after P2:

- `npm run data:eval -- --latest`: `WARN`, 0 errors, 57 parsed transitions, 57 selected actions matched.
- Remaining WARN status is coverage/history visibility from older transitions in the same run, not a current program-level failure.

## 2026-07-01 P3/P4/P5 Shadow Object Refinement

Implemented the next ordered shadow-only slice:

- P3: `PredictionErrorRecord` evidence now includes typed prediction checks, and new transitions receive a `ReplayFrame` MVP.
- P3 continuation: `CandidateFuture.predictionChecks` now carries the structured checks directly, and `PredictionErrorRecord` prefers them over text-derived checks.
- P4: unsupported/unknown prediction errors can create proposed `ConsolidationRecord` objects with conditions and rollback metadata. These do not mutate memory, derived knowledge, strategy params, or candidate templates.
- P5: offline eval now parses `events.jsonl` and reports `parsedEvents`, while current STS2MCP REST capabilities still correctly say event logs and human events are unavailable.

Live behavior remains unchanged: no live prompt replacement, no candidate reordering, no scoring change, no fallback change, no validation/execution change.

## 2026-07-01 P8 DeliberationPacket Strategic Workspace Shadow Surface

Implemented P8 as a gated shadow workspace, not a live prompt swap:

- Added `DeliberationWorkspaceComparison` and `ShadowWorkspaceDecision` domain records.
- Added `src/agent/workspace.ts` to serialize `DeliberationPacket` into a compact structured LLM strategic workspace.
- The workspace comparison records legacy prompt hash, structured prompt hash, byte/token estimates, decision class, packet coverage, structured section gaps, gated readiness, and readiness reasons.
- Optional structured shadow LLM calls are supported only when both flags allow it.
- Feature flags default off:
  - `STS2_P8_WORKSPACE_SHADOW`
  - `STS2_P8_WORKSPACE_CALL`
- New executor-logged transitions can now include `workspaceComparison` and `shadowWorkspaceDecision`.
- Replay/eval/review now expose P8 workspace coverage, readiness, shadow call counts, valid/invalid/error stats, and agreement/disagreement/missing-candidate counts.

North Star boundary:

- LLM remains the strategic player.
- The local system shapes a better strategic workspace; it does not replace LLM judgment with local rules.
- Legacy prompt remains the live path by default.
- No candidate generation, ordering, scoring, fallback, validation, execution, stable memory, derived knowledge, or strategy params were changed.
- Disagreement is review evidence, not a program failure.

Validation run for this patch:

- `npm exec tsc -- --noEmit`: passed.
- `npm run agent:smoke`: passed.
- `npm run check`: passed.
- `npm run data:replay -- --latest`: passed.
- `npm run data:eval -- --latest`: `WARN`, 0 errors.
- `npm run agent:review`: passed.
- `npm run collect:state`: passed, current MCP state was Act 2 floor 17 map, HP 23/75.
- `npm run agent:tick -- --dry-run`: passed, selected the forced map node without executing.
- `npm run agent:run -- --max-ticks 1 --delay-ms 120`: passed, executed one map node and advanced to Act 2 floor 18 event.

Fresh P8 signal after the 1 tick validation:

- Latest run: `run-mr20xf22-o5tlcp`.
- Transitions: 142.
- `workspaceComparison`: 1/142.
- `shadowWorkspaceDecision`: 1/142.
- `workspaceReady`: 0/142 because `STS2_P8_WORKSPACE_SHADOW` is off by default.
- `shadowWorkspaceCalled`: 0/142 because `STS2_P8_WORKSPACE_CALL` is off by default.
- Eval workspace summary: structured prompt available on the fresh transition, no invalid output, no invalid choice, no workspace errors, agreement `not_applicable`.
- Eval status remained `WARN` with 0 errors; focused warning remained strategy-only (`strategy_block_deficit`).

Remaining P8 work:

- Validate coverage on a fresh real transition.
- Define acceptance thresholds for readiness and information preservation before any gated live experiment.
- If a future gated experiment is attempted, preserve legacy fallback and current validation/execution.

## 2026-07-02 P8.1-P8.3 Non-API Workspace Readiness Pass

Implemented the next P8.x slice up to the real-provider boundary:

- P8.1 readiness / information preservation:
  - `workspaceComparison.coverage` now records required legacy-information sections, preserved sections, missing sections, per-section token estimates, and `informationPreservationScore`.
  - Readiness reasons now distinguish missing information, feature flags, provider readiness, and low preservation.
- P8.2 DeepSeek V4 Flash preparation:
  - Added provider config, request shape, response parser, short JSON output schema, timeout/error handling, and unavailable/skipped paths.
  - Expected structured output fields are `selectedCandidateId`, `confidence`, `reasonBrief`, `riskTags`, `missingInfo`, and `scaffoldFeedback`.
  - No real provider call is made without `STS2_DEEPSEEK_API_KEY` plus explicit P8 flags.
  - DeepSeek is kept on a P8 workspace-decider path, separate from the legacy live-prompt decider.
- P8.3 non-API shadow-call plumbing:
  - `shadowWorkspaceDecision` can now record provider/model identity, skipped/unavailable/valid/invalid/error outcomes, agreement/disagreement/missing-candidate, risk tags, missing info, and scaffold feedback.
  - Replay/eval/review surface provider readiness, skipped/unavailable counts, and information-preservation visibility.
- Eval compatibility fix:
  - Old P8.0 runs that do not contain `informationPreservationScore` are now reported as pre-P8.1 visibility, not as misleading low-preservation evidence.

North Star boundary:

- Live behavior remains unchanged by default.
- Legacy prompt remains the live path.
- No candidate generation, ordering, scoring, fallback, validation, execution, stable memory, derived knowledge, strategy params, or P7 proposal application was changed.
- P8 remains a shadow strategic workspace until a real DeepSeek shadow call is explicitly authorized.

Validation run for this patch:

- `npm exec tsc -- --noEmit`: passed.
- `npm run agent:smoke`: passed.
- `npm run check`: passed.
- `npm run data:replay -- --latest`: passed.
- `npm run data:eval -- --latest`: `WARN`, 0 errors. Current WARNs are strategy quality plus pre-P8.1 visibility on the latest historical run.
- `npm run agent:review`: passed.
- `npm run collect:state`: passed. Current MCP state was Act 1 floor 7 combat, HP 37/75, block 10, energy 1, hand `[Defend, Subroutine+, Defend]`.
- `npm run agent:tick -- --dry-run`: passed, selected `Defend`, executed nothing.
- `STS2_P8_WORKSPACE_SHADOW=1 npm run agent:tick -- --dry-run`: passed, selected the same `Defend`, executed nothing, and did not call a real LLM.

Current P8 gate:

- Ready for a real DeepSeek V4 Flash shadow-call experiment only after the user provides credentials and explicitly enables the shadow call flags.
- Not ready for gated live prompt integration. P8.4/P8.5 remain design-only until shadow evidence is collected and reviewed.

## 2026-07-02 P8.3 Guarded DeepSeek Shadow Path And P8.4 Gate

Implemented the guarded real-provider path while preserving live behavior:

- DeepSeek V4 Flash remains a P8 workspace decider only; `createLlmDecider()` still ignores DeepSeek credentials and the legacy live prompt path is unchanged.
- Removed the controller fallback from workspace shadow decider to legacy live decider. If no workspace decider is available, P8 records unavailable instead of borrowing the live decider.
- Added conservative P8 shadow-call guards: max shadow calls default `1`, soft/hard input-token limits default `8000`/`12000`, max output tokens default `400`, timeout default `25000ms`, retry default `0`, and estimated cost cap default `$0.05`.
- Budget excess records `skipped` with reasons such as `token_budget_exceeded`, `call_budget_exceeded`, or `cost_budget_exceeded`; these are review/eval signals, not FAIL.
- Shadow decisions now record provider/model, estimated and actual tokens when returned by the provider, max output tokens, latency, estimated cost, budget status, selected candidate id, agreement/disagreement/missing candidate, risk tags, missing info, scaffold feedback, and reason quality.
- Replay/eval/review now expose P8.4 gate data: decision class, readiness, token budget, missing sections, invalid/error/missing-candidate stats, reason quality, cost/latency, and go/no-go.
- P8.5 remains preparation-only. The rollout metadata still permits only additive `legacy prompt + compact workspace summary`, behind a whitelist/feature flag/rollback path, and structured-prompt-only is not allowed by default.

Validation note:

- `collect:state` succeeded against MCP on Act 1 floor 7 combat.
- `STS2_P8_WORKSPACE_SHADOW=1 STS2_P8_WORKSPACE_CALL=1 npm run agent:tick -- --dry-run` completed without executing an action, but did not call DeepSeek because `STS2_DEEPSEEK_API_KEY` was not visible in the shell environment.
- `STS2_P8_WORKSPACE_SHADOW=1 STS2_P8_WORKSPACE_CALL=1 npm run agent:run -- --max-ticks 1 --delay-ms 120` executed one legacy/local live action and recorded P8 shadow unavailable/needs-key observability. No DeepSeek decision was executed.

Follow-up after local `.env.local` configuration:

- A real DeepSeek V4 Flash shadow dry-run completed without executing a DeepSeek decision.
- A real `max-ticks 1` validation executed the legacy/local live action `play_card:3 Strike -> CORPSE_SLUG_1`.
- The recorded P8 shadow call was valid and agreed with the live selected candidate.
- Non-secret metrics from the recorded shadow call: estimated input tokens `5800`, actual input tokens `6791`, actual output tokens `202`, actual total tokens `6993`, max output tokens `400`, latency `3568ms`, estimated cost `$0.002159`, budget status `within_budget`, reason quality `adequate`.
- P8.5 preparation now includes compact workspace summary generation plus rollout metadata behind `STS2_P8_LIVE_ADDITIVE` and `STS2_P8_LIVE_DECISION_CLASSES`. The controller does not consume this live path yet, and default live integration remains off.
- Future shadow boundary relaxation should happen progressively: P8.5 additive live context, P9 guarded stable updates, and P10 full guarded learning loop, each with whitelist, fallback, eval/review evidence, and rollback.

## 2026-07-03 P8.4 DeepSeek Thinking-Mode Shadow A/B

Shadow-only provider-contract A/B was run without changing live behavior:

- Baseline remained `full_bounded_candidate_futures`; `full` was not redefined or used as the experimental target here.
- DeepSeek remained shadow-only. No shadow decision entered execution, and `STS2_P8_LIVE_ADDITIVE` stayed off.
- Request telemetry now confirms whether thinking was left at the provider default or explicitly disabled, whether JSON mode was used, whether `reasoning_content` was returned, the provider finish reason, output-cap hits, parse state, failure bucket/category, and thin-reason notes.

Recorded A/B sample on `run-mr44lgba-d2qjrn`, revision `2026-07-03-output-contract-v5.1.4-provider-contract-hardening`:

- A = provider default thinking (`providerThinkingMode=default_enabled`), 5 calls:
  - valid `5/5`, invalid `0`, error `0`
  - finish reason `stop=5`, output-cap hits `0`, `empty_content_after_retry=0`
  - failure bucket/category `none=5`
  - reason quality `adequate=2`, `thin=3`, thin note `missing_tradeoff=3`
  - average actual input tokens `3587`, output tokens `365.8`, total tokens `3952.8`
  - average latency `4699.6ms`
  - `reasoning_content` returned on `5/5` calls, average `1293.8` bytes
- B = explicit `thinking: {"type":"disabled"}` (`providerThinkingMode=explicit_disabled`), 5 calls:
  - valid `5/5`, invalid `0`, error `0`
  - finish reason `stop=5`, output-cap hits `0`, `empty_content_after_retry=0`
  - failure bucket/category `none=5`
  - reason quality `adequate=2`, `thin=3`, thin note `missing_tradeoff=3`
  - average actual input tokens `3559.6`, output tokens `37.4`, total tokens `3597`
  - average latency `1197.6ms`
  - `reasoning_content` returned on `0/5` calls

Interpretation:

- This 5-vs-5 shadow sample does not show a validity difference. Both groups avoided `finish_reason=length`, output-cap hits, empty-content retry failure, and semantic invalid output.
- Explicitly disabling thinking materially changed the provider contract:
  - `reasoning_content` disappeared entirely
  - output token usage dropped sharply
  - latency dropped by roughly `3.9x`
- This supports the concern that earlier `temperature=0` / `top_p=0.1` settings may not have been providing the expected stabilizing effect when DeepSeek default thinking was still active.
- The sample is still too small to justify changing the default request behavior. The next safe step, if P8.4 continues, is a larger shadow-only disabled-thinking sample on comparable high-pressure combat slices.

Audit note:

- `npm run data:replay -- --latest`, `npm run data:eval -- --latest`, and `npm run agent:review` after the B pass pointed at the newest fresh run `run-mr4bsqiw-7kdmht`, which had zero real shadow calls because the 5-call budget had already been exhausted in the earlier run. This is expected but easy to misread; for provider A/B evidence, group by `shadowWorkspaceDecision.providerThinkingMode` on the actual call-bearing run instead of relying only on latest-run fresh slices.

## 2026-07-03 P8.4 Thinking-Mode Expansion Check

Follow-up expansion stayed shadow-only and kept live behavior unchanged:

- DeepSeek remained shadow-only; no shadow decision entered execution.
- `STS2_P8_LIVE_ADDITIVE` stayed off.
- `full_bounded_candidate_futures` remained the only workspace ablation used for these runs.
- No prompt, candidate generation, scoring, fallback, validation, or execution logic was changed during this expansion check.

Expanded evidence on `run-mr4bsqiw-7kdmht` (grouped by `shadowWorkspaceDecision.providerThinkingMode`, not by mixed latest-run slices):

- `explicit_disabled` 20-call sample:
  - valid `20/20`, invalid `0`, error `0`
  - live-eligible called `0`, live-eligible invalid `0`
  - finish reason `stop=20`
  - parse state `parsed=20`
  - output-cap hits `0`
  - `empty_content_after_retry=0`
  - `parse_error=0`
  - failure bucket/category `none=20`
  - `reasoning_content` returned `0/20`
  - average input tokens `3370.55`, output tokens `34.4`, total tokens `3404.95`
  - average latency `1172ms`
  - reason quality `adequate=4`, `thin=16`
  - thin notes: `missing_tradeoff=16`, `missing_tactical_factor=5`
- `default_enabled` 10-call control:
  - valid `10/10`, invalid `0`, error `0`
  - live-eligible called `0`, live-eligible invalid `0`
  - finish reason `stop=10`
  - parse state `parsed=10`
  - output-cap hits `0`
  - `empty_content_after_retry=0`
  - `parse_error=0`
  - failure bucket/category `none=10`
  - `reasoning_content` returned `10/10`, average `1781.3` bytes
  - average input tokens `3093.6`, output tokens `448.5`, total tokens `3542.1`
  - average latency `6502.7ms`
  - reason quality `adequate=3`, `thin=7`
  - thin notes: `missing_tradeoff=6`, `missing_tactical_factor=4`

Decision from this expansion pass:

- Disabled thinking still looks provider-clean: no `length`, no output-cap hits, no empty-content retry failures, no parse errors, and no semantic invalid outputs appeared in the 20-call sample.
- However, the expansion did not show a reliability improvement over the default-thinking control; both groups were fully valid in these samples.
- Disabled thinking did preserve the earlier contract-level advantages:
  - no `reasoning_content`
  - much lower output-token usage
  - much lower latency
- But reason quality did not improve, and in this expansion it looked slightly worse rather than better:
  - disabled `thin=16/20` (`80%`)
  - default `thin=7/10` (`70%`)
- Because the explicit user gate for continuing was “provider reliability and reason quality do not get worse,” the evidence was not strong enough to justify a 50-call disabled run or a default switch.

Current recommendation:

- Do not switch `STS2_DEEPSEEK_THINKING_MODE=disabled` to the P8 shadow default yet.
- Treat disabled thinking as a useful provider-contract A/B mode, not a promoted default.
- The next improvement target is reason quality and tradeoff expression under the existing shadow contract, not further token shaving.

## 2026-07-03 P8.5 Live-Readiness Quality Pass

This pass stayed inside the existing P8.4/P8.5 boundaries:

- Live remained unchanged.
- `STS2_P8_LIVE_ADDITIVE` stayed off.
- DeepSeek remained shadow-only.
- No stable memory, derived knowledge, or strategy params were written.
- No candidate generation, ordering, scoring, fallback, validation, or execution logic was changed.

Minimal quality/readiness refinements applied:

- `src/agent/candidateFutureCompressor.ts` now preserves more combat-critical bounded facts from the existing `CandidateFuture` record:
  - nested mechanics-aware facts such as card name, energy cost, expected damage, expected block gain, target block, and simple lethal cues
  - a couple of short survival/lethal/resource cue strings when they already exist in predicted outcome / risk text
- `src/agent/cognitiveScaffold.ts` now gives non-combat `CandidateFuture` records more strategic wording without changing candidate selection:
  - card reward futures mention deck-direction effects and skip tradeoffs
  - map futures mention route commitment and alternate-line cost
  - non-combat mechanics summaries now carry limited strategic reasons/risks for review/eval visibility
- `src/agent/candidateFutureReviewSignals.ts` now treats action-specific plan/outcome text as valid tactical-fact evidence when that detail is genuinely present in the serialized future, instead of requiring only structured mechanics fields.

Why this was needed:

- Post-recovery provider evidence was already clean, so continuing to over-focus on `selectedCandidateId` / retry / output-contract work would have been diminishing-return engineering.
- The next honest blocker for P8.5 live-readiness is workspace quality: thin reason quality, `missing_survival_line` in bounded combat slices, and shallow `card_reward` / `map` futures.
- This pass therefore targeted reviewable strategic content, not JSON-validity padding.

Fresh readiness evidence after the quality pass:

- A fresh post-recovery 20-call shadow sample on `full_bounded_candidate_futures` stayed shadow-only and kept live additive off.
- The sample improved non-combat visibility:
  - `card_reward:llm_required` completeness moved from `0/4` to `4/8`
  - one fresh `card_reward:llm_required` shadow decision was `adequate`
- But readiness is still `no_go`:
  - fresh `last20` still had `invalid=3`, all bucketed as `provider_length_empty -> empty_content_after_retry`
  - fresh `last20` reason quality stayed mixed: `adequate=8`, `thin=9`, `missing=3`
  - fresh live-eligible evidence is still small (`liveEligibleCalled=2` in `last20`)
  - `map:llm_required` remains shallow (`complete=0/2`, `shallow=2`)
- The executor console may still show `fallbackReason=llm_unavailable` on live decisions because the live LLM path remains disabled/unavailable by design. That is separate from the P8 shadow DeepSeek telemetry, which continued recording valid/invalid shadow outcomes in replay/eval/review.

## 2026-07-03 P8.5 CandidateFuture Quality Refinement

This follow-up pass stayed shadow-only and did not change live behavior.

What changed:

- `src/agent/cognitiveScaffold.ts`
  - `buildCandidateFutures()` now receives `run` so non-combat futures can explicitly reference current deck deficits, route pressure, and opportunity cost.
  - `card_reward` futures now spell out:
    - deck direction and current primary deck need
    - skip value vs immediate patch value
    - opportunity cost of passing other reward lines
    - draw dilution / deck-bloat risk
  - `map` futures now spell out:
    - route commitment and alternate-line cost
    - reward timing against HP/resources
    - route pressure, reward expectation, and path lock-in risk
  - Empty risk fields for `card_reward` / `map` now receive minimal strategic risk text instead of the generic `shallow_future_risk_model`.
- `src/agent/llm.ts` and `src/agent/workspace.ts`
  - `reasonBrief` guidance is still short and JSON-light, but now explicitly allows tactical or strategic tradeoff wording instead of only tactical wording.

Fresh evidence after this refinement:

- Fresh `last5` shadow slice was provider-clean: `called=5`, `valid=5`, `invalid=0`, `liveEligibleCalled=1`, `liveEligibleValid=1`, `finishReason.stop=5`, `outputCapHits=0`.
- Fresh `last20` still remains `no_go` because reason quality is not yet strong enough:
  - `called=20`, `valid=19`, `invalid=1`, `error=0`
  - `liveEligibleCalled=3`, `liveEligibleValid=3`, `liveEligibleInvalid=0`, `liveEligibleError=0`
  - reason quality `adequate=7`, `thin=12`, `missing=1`
  - thin notes still led by `missing_tradeoff=10`
- Aggregate readiness is still blocked:
- `card_reward:llm_required` shows improved content shape but not enough new evidence to clear shallow risk globally
- `map:llm_required` remains too sparse in the current evidence set
- provider is not the main blocker here; tradeoff expression and non-combat strategic completeness remain the main blockers

## 2026-07-03 P8.5 Non-Combat Follow-Up

This pass stayed shadow-only and kept live additive off.

What changed:

- `src/agent/providerFailureClassifier.ts`
  - `reasonQuality` now treats non-combat strategic language such as `deck`, `route`, `shop`, `rest`, `elite`, `scaling`, `synergy`, `skip`, `reward`, and `path` as valid tactical/strategic factors instead of grading everything through a combat-only vocabulary.
- `src/agent/candidateFutureCompressor.ts`
  - `full_bounded_candidate_futures` now serializes non-combat futures with explicit strategic facts and a compact `tradeoff` field instead of mirroring the old passthrough shape.
- `src/agent/workspace.ts`
  - non-combat bounded telemetry is now labeled `bounded_candidate_futures_non_combat` so review/eval no longer implies that `full_bounded_candidate_futures` skipped compression outside combat.
- `src/agent/cognitiveScaffold.ts`
  - `map` futures now recover node type from candidate label when raw node facts are sparse, which restores route commitment / reward expectation / lock-in language on map decisions.
  - `reward_flow` prediction checks now tolerate historical simplified states that lack a `rewards` array, which keeps offline audit / replay-side reconstruction from crashing.

What fresh runtime did and did not prove:

- A fresh post-edit sample was still dominated by combat transitions, so it did not generate new live-eligible `map` or `card_reward` shadow records.
- Because of that, this pass does not claim fresh runtime clearance for non-combat readiness.

Offline rebuild evidence from recorded live-eligible transitions:

- Rebuilding `transition-000293-agent-mr4erdtj-p10sgp` with the current scaffold now yields `map` futures that explicitly contain:
  - route timing against `fragile combat resources`
  - reward expectation for `Shop` vs `Monster`
  - route lock-in cost
  - future-floor uncertainty
  - strategic reasons in the predicted outcome
- Rebuilding `transition-000388-agent-mr4fptlo-zd80sv` with the current scaffold now yields `card_reward` futures that explicitly contain:
  - primary deck need
  - opportunity cost of passing other reward lines
  - future draw-slot / deck-bloat risk
  - clearer benefit-vs-cost tradeoff wording

Current honest conclusion:

- Non-combat CandidateFuture content is materially better in code than in the older historical telemetry windows.
- P8.5 live is still `no_go` until fresh runtime evidence re-covers `map:llm_required` / `card_reward:llm_required` and shows that the improved futures actually reduce `missing_tradeoff` without introducing new provider failures.

## 2026-07-03 P8.5 Map Quality Refinement

- `map:llm_required` fresh called evidence was still thin even after provider recovery, so the next patch stayed strictly on the workspace side instead of touching provider / JSON / live behavior.
- `src/agent/cognitiveScaffold.ts` now makes map futures spell out:
  - route tradeoff
  - opportunity cost versus shop/rest/monster timing
  - alternate-route cost and path lock-in risk
  - HP/resource pressure and reward expectation
- `src/agent/candidateFutureCompressor.ts` now treats route/path/timing/opportunity-cost text as valid non-combat tactical facts during review serialization, so `map` futures are less likely to be misread as shallow when the strategic detail is genuinely present.
- `src/agent/smoke.ts` now includes a small map-workspace regression guard to ensure bounded non-combat map prompts contain concrete tradeoff/path language.

## 2026-07-03 P8.5 Live Gate Consolidation

This pass did not enable live additive and did not change runtime behavior. It consolidated the live-readiness rules into project docs so later rollout decisions are made against explicit gates instead of ad-hoc judgment.

Documented policy now says:

- `P8.5` may keep moving on static / pre-live work, but live additive remains `no_go`.
- `STS2_P8_LIVE_ADDITIVE` stays default-off until there is explicit approval plus fresh class-specific evidence.
- The first allowed live slice, if approved later, is additive-only and should start with `combat:llm_required` only.
- `card_reward:llm_required` requires separate non-combat reason/tradeoff evidence before live entry.
- `map:llm_required` must not join the first live slice and still needs additional fresh called evidence.
- Any future live additive test must keep legacy fallback, semantic validation, and executor legality checks unchanged.
- Any live-eligible invalid/error, `invalid_choice`, `missing_candidate`, or fresh target-slice provider truncation/empty-content recurrence is an immediate rollback trigger.
- Rollout evidence must be recorded and reviewed by decision class, revision tag, and bounded window, while keeping `legacy_only`, `shadow_only`, and future `live_additive_enabled` windows distinct.

Current honest status after this consolidation:

- `P8.4` is basically closed as provider-contract work.
- `P8.5 static pre-audit` is allowed to continue.
- `P8.5 live additive` is still blocked primarily by non-combat readiness evidence, not by provider reachability.

Follow-up cleanup:

- replay / eval / review now share a fixed report-side live-readiness vocabulary instead of relying only on generic `go/no_go`:
  - `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - `READY_FOR_P8_5_LIVE_COMBAT_AND_CARD_REWARD`
  - `NOT_READY_PROVIDER_BLOCKER`
  - `NOT_READY_LIVE_SAFETY_BLOCKER`
  - `NOT_READY_REASON_QUALITY`
  - `NOT_READY_CANDIDATE_FUTURE_QUALITY`
  - `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE`
- This does not change runtime behavior; it only makes readiness interpretation more explicit and less ad-hoc.
