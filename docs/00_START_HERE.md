# Documentation Operating System

This is the documentation entrypoint for both humans and coding agents.

Start here before changing docs, planning a new phase, or deciding which document is authoritative.

## Read Order

1. `../PROJECT_NORTH_STAR.md`
2. `../PROJECT_AUTHORITY_GUIDE.md`
3. `04_CURRENT_STATUS.md`
4. `../PROJECT_PLAN.md`
5. The subsystem source you are about to touch:
   - `../ARCHITECTURE.md`
   - `../DATA_SCHEMA.md`
   - `../REPLAY_AND_EVAL.md`
   - `../BUDGET_GOVERNANCE.md`
   - `../MEMORY_SYSTEM.md`

## Directory Map

- `phases/`
  - current phase closeout, entry criteria, rollout policy, and next-phase plans
- `runbooks/`
  - operator procedures and command guides
- `decisions/`
  - durable ADRs
- `reports/`
  - focused audit reports
- `debt/`
  - active debt registers
- `archive/legacy/`
  - old redirects and low-priority historical docs that should not compete with active documents

## Canonical Sources

- `../PROJECT_NORTH_STAR.md`
  - long-term constitution
- `04_CURRENT_STATUS.md`
  - canonical current phase, blocker, and next step
- `../PROJECT_PLAN.md`
  - long-horizon roadmap and phase route
- `../ARCHITECTURE.md`
  - architecture and module-boundary truth
- `../DATA_SCHEMA.md`
  - schema and telemetry truth
- `../REPLAY_AND_EVAL.md`
  - replay/eval/review semantics
- `../BUDGET_GOVERNANCE.md`
  - budget governance truth

## Current High-Value Docs

- [P8_CLOSEOUT.md](phases/P8_CLOSEOUT.md)
- [P8_P9_DEBT_REGISTER.md](debt/P8_P9_DEBT_REGISTER.md)
- [P9_ENTRY_CRITERIA.md](phases/P9_ENTRY_CRITERIA.md)
- [P9_GUARDED_LEARNING_PLAN.md](phases/P9_GUARDED_LEARNING_PLAN.md)
- [P9_P13_EXECUTION_ROADMAP.md](phases/P9_P13_EXECUTION_ROADMAP.md)
- [P8_5_LIVE_ROLLOUT_POLICY.md](phases/P8_5_LIVE_ROLLOUT_POLICY.md)
- [LLM_RUN_MODES.md](runbooks/LLM_RUN_MODES.md)

## Working And Historical Docs

Useful but non-canonical:

- `../LLM_HANDOFF.md`
- `../DEBUG_REPORT.md`

These exist for engineering continuity and history. They must not become the only source of truth for current state, roadmap, or architecture.

## Where To Write What

- current phase / current blocker / immediate next step
  - `04_CURRENT_STATUS.md`
- phase closeout / next-phase implementation plan
  - `phases/*.md`
- long-term roadmap
  - `../PROJECT_PLAN.md`
- architecture and boundaries
  - `../ARCHITECTURE.md`
- schema and telemetry
  - `../DATA_SCHEMA.md`
- replay/eval/readiness semantics
  - `../REPLAY_AND_EVAL.md`
- durable engineering decisions
  - `decisions/*.md`
- operator commands and runtime procedures
  - `runbooks/*.md`
- debt and cleanup tracking
  - `debt/*.md`
- old redirect docs and stale low-priority material
  - `archive/legacy/*.md`

## P0-P13 And P8.x

`../PROJECT_PLAN.md` remains the canonical P0-P13 route.

Use `phases/*.md` for:

- P8 closeout
- P8.5 rollout policy
- P9 entry criteria
- P9 guarded learning implementation
- P9-P13 execution ordering and realism checks

Use `04_CURRENT_STATUS.md` for the short active snapshot only.

## Documentation Rules

When a task changes project behavior, policy, or phase judgment:

1. Update the canonical source first.
2. Update `04_CURRENT_STATUS.md` if the current blocker, phase, or next step changed.
3. Update phase docs when a milestone judgment changed.
4. Update handoff/debug only as supporting history.
5. Prefer moving stale docs into `archive/legacy/` plus redirect stubs over leaving them mixed with active docs.
