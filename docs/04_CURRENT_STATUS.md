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

P8.5 live readiness is still blocked, but the active blocker has shifted.

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

## Current Next Step

Continue P8.5 live-readiness work without enabling live additive:

- preserve `full` semantics and strategic fidelity
- keep semantic validation strict
- keep provider work limited to blocker-class regressions
- collect more fresh live-eligible quality evidence after the survival-line compressor fix and combat reason-contract refinement
- treat missing lethal-line cues as CandidateFuture/template evidence, not a compression issue
- keep the remaining combat `missing_tradeoff` work narrow: verify whether the new combat reason contract reduces fresh thin reasons before changing CandidateFuture content again
- after this narrow fix, the next step is still fresh `combat:llm_required` shadow validation, not more keyword expansion
- continue non-combat `card_reward` / `map` readiness work before any P8.5 live enablement
- collect more targeted fresh live-eligible evidence before any live additive plan
- keep P8.5 live/additive disabled until readiness clears the gate

## Documentation Notes

- Long-term roadmap changes go to `../PROJECT_PLAN.md`
- Architecture or boundary changes go to `../ARCHITECTURE.md`
- Schema and telemetry changes go to `../DATA_SCHEMA.md`
- Budget-governance changes go to `../BUDGET_GOVERNANCE.md`
- Detailed history stays in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`
