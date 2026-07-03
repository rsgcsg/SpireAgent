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

P8.5 live readiness is still blocked until high-pressure `combat:llm_required` provider recovery is confirmed on fresh runtime evidence.

Historical blocker shape:

- readiness status: `NOT_READY_LIVE_SAFETY_BLOCKER`
- failure bucket: `provider_length_empty`
- finish reason: `length`
- affected transitions:
  - `transition-000130-agent-mr4sg5sl-xm6o7z`
  - `transition-000131-agent-mr4sh7t9-l925tb`

Targeted replay retest on current code recovered both transitions as valid, with `reasonQuality=adequate`, `finishReason=stop`, and `failureBucket=none`. One retest path demonstrated the intended recovery behavior: primary `length+empty` followed by truncation rescue with `thinking=disabled` and an independent rescue output cap.

## Current Next Step

Collect a small fresh high-pressure combat shadow window under the current recovery contract:

- preserve `full` semantics and strategic fidelity
- keep semantic validation strict
- confirm live-eligible `combat:llm_required` has no current `provider_length_empty`
- keep P8.5 live/additive disabled until fresh evidence clears the gate

## Documentation Notes

- Long-term roadmap changes go to `../PROJECT_PLAN.md`
- Architecture or boundary changes go to `../ARCHITECTURE.md`
- Schema and telemetry changes go to `../DATA_SCHEMA.md`
- Budget-governance changes go to `../BUDGET_GOVERNANCE.md`
- Detailed history stays in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md`
