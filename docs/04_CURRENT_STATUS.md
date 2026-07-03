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

## Current Next Step

Continue P8.5 live-readiness work without enabling live additive:

- preserve `full` semantics and strategic fidelity
- keep semantic validation strict
- keep provider work limited to blocker-class regressions
- improve and verify combat survival/tradeoff presentation without turning CandidateFuture into a shallow action list
- collect more targeted fresh live-eligible evidence before any live additive plan
- keep P8.5 live/additive disabled until readiness clears the gate

## Documentation Notes

- Long-term roadmap changes go to `../PROJECT_PLAN.md`
- Architecture or boundary changes go to `../ARCHITECTURE.md`
- Schema and telemetry changes go to `../DATA_SCHEMA.md`
- Budget-governance changes go to `../BUDGET_GOVERNANCE.md`
- Detailed history stays in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`
