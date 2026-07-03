# Documentation Operating System

This is the documentation entrypoint for both humans and coding agents.

Start here before changing docs, planning a new phase, or deciding which document is authoritative.

## Read Order

1. `../PROJECT_NORTH_STAR.md`
2. `../PROJECT_AUTHORITY_GUIDE.md`
3. `04_CURRENT_STATUS.md`
4. `../PROJECT_PLAN.md`
5. The subsystem source you are about to change:
   - `../ARCHITECTURE.md`
   - `../DATA_SCHEMA.md`
   - `../REPLAY_AND_EVAL.md`
   - `../BUDGET_GOVERNANCE.md`
   - `../MEMORY_SYSTEM.md`
   - `../memory/README.md`
   - `../AGENT_LOOP.md`

## Source Of Truth Rules

Canonical documents define what the project currently is supposed to do.

- `../PROJECT_NORTH_STAR.md`: long-term constitution and enduring project doctrine
- `04_CURRENT_STATUS.md`: canonical current phase, blocker, and next-step snapshot
- `../PROJECT_PLAN.md`: long-horizon roadmap, phase route, and acceptance framing
- `../ARCHITECTURE.md`: architecture and module-boundary source of truth
- `../DATA_SCHEMA.md`: schema and telemetry source of truth
- `../REPLAY_AND_EVAL.md`: replay/eval/review semantics and report rules
- `../BUDGET_GOVERNANCE.md`: long-lived budget governance model
- `decisions/*.md`: durable ADRs that explain why a rule exists

Working or historical documents are useful, but they are not canonical:

- `../LLM_HANDOFF.md`: active engineering handoff and local context
- `../DEBUG_REPORT.md`: append-only debug and iteration history
- `docs/PROJECT_STEERING.md`, `docs/PROJECT_BOUNDARIES.md`, `docs/agent-system-principles.md`, `docs/ai-agent-architecture.md`: redirect compatibility pointers

Runbooks explain how to do things, not what the system fundamentally is:

- `DEPLOYMENT.md`
- `ITERATION_GUIDE.md`
- `MCP_USAGE.md`
- `ai-sts2-local-runbook.md`

Archive and report handling:

- historical reports stay in `../LLM_HANDOFF.md` and `../DEBUG_REPORT.md` until a larger archive migration is worth doing
- redirect files in `docs/` are compatibility pointers, not archive truth
- do not create a new archive tree just to reshuffle files without a clear retrieval benefit

## Where To Write What

- Current phase, current blocker, immediate next step: `04_CURRENT_STATUS.md`
- Long-term P1-P10 route, milestone intent, completion gaps: `../PROJECT_PLAN.md`
- Architecture, boundaries, module responsibilities: `../ARCHITECTURE.md`
- Data model, transition fields, telemetry schema: `../DATA_SCHEMA.md`
- Replay/eval/review behavior, gates, readiness reporting: `../REPLAY_AND_EVAL.md`
- Durable governance decisions: `decisions/*.md`
- Human/operator procedures: runbooks in `docs/`
- Runtime memory hygiene and commit boundary: `../memory/README.md`
- Historical notes, chronological findings, experiment narrative: `../LLM_HANDOFF.md` or `../DEBUG_REPORT.md`

Do not write any of the following only in handoff/debug files:

- the current canonical blocker
- the official phase/milestone state
- the authoritative roadmap
- architecture truth
- durable governance rules

## P1-P10 And P8.x

`../PROJECT_PLAN.md` remains the canonical long-horizon phase book.

- P1-P10 belongs there as the formal maturity route.
- Active sub-phase detail such as `P8.4` or `P8.5` belongs in:
  - `04_CURRENT_STATUS.md` for the live current snapshot
  - `../LLM_HANDOFF.md` or `../DEBUG_REPORT.md` for detailed iteration history
  - an ADR only if a durable rule or governance decision was made

This keeps the long route stable while still allowing active work to be tracked honestly.

## Documentation Update Rules

When a task changes project behavior, policy, or phase judgment:

1. Update the canonical source first.
2. Update `04_CURRENT_STATUS.md` if the active blocker, phase, or next step changed.
3. Update handoff/debug notes only as supporting history, not as the sole record.
4. Add an ADR when the decision is durable, cross-cutting, or easy to forget.
5. Keep redirects, reports, and runbooks non-authoritative.

## Current Practical Map

- Want the project mission: `../PROJECT_NORTH_STAR.md`
- Want the current state in one screen: `04_CURRENT_STATUS.md`
- Want the roadmap: `../PROJECT_PLAN.md`
- Want system shape: `../ARCHITECTURE.md`
- Want fields and telemetry: `../DATA_SCHEMA.md`
- Want replay/eval semantics: `../REPLAY_AND_EVAL.md`
- Want recent engineering context: `../LLM_HANDOFF.md`
- Want chronological debugging history: `../DEBUG_REPORT.md`
