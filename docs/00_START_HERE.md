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
   - `../ENVIRONMENT_COMPATIBILITY.md`

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
- `headless/`
  - deferred future Headless STS2 boundary, admission gate, phases, and
    acceptance criteria; no current implementation or authority
- `product/`
  - player-product, distribution, local-security, Companion, BYOK, SDK, and
    release architecture audits; roadmap documents describe gates, not shipped
    product capability
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
- `../ENVIRONMENT_COMPATIBILITY.md`
  - game/mod/adapter identity, evidence scope, compatibility, quarantine, and revalidation truth
- `product/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md`
  - conditional player-product, Companion, Workshop, BYOK, SDK, security, and
    distribution architecture; it is not a shipped-capability statement

## Current High-Value Docs

- [P8_CLOSEOUT.md](phases/P8_CLOSEOUT.md)
- [P8_P9_DEBT_REGISTER.md](debt/P8_P9_DEBT_REGISTER.md)
- [PRE_P9_ENGINEERING_DEBT_AUDIT.md](debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md)
- [P9_ENTRY_CRITERIA.md](phases/P9_ENTRY_CRITERIA.md)
- [P9_ENTRY_DECISION.md](phases/P9_ENTRY_DECISION.md)
- [P9_GUARDED_LEARNING_PLAN.md](phases/P9_GUARDED_LEARNING_PLAN.md)
- [P9_P15_EXECUTION_ROADMAP.md](phases/P9_P15_EXECUTION_ROADMAP.md)
- [P9-P10 Trustworthy Change Kernel Audit](reports/P9_P10_TRUSTWORTHY_CHANGE_KERNEL_AUDIT_2026-07-11.md)
- [P9 G3-A Disabled Change-Kernel Audit](reports/P9_G3A_DISABLED_CHANGE_KERNEL_AUDIT_2026-07-12.md)
- [P9-P15 Phase Architecture Audit](reports/P9_P15_PHASE_ARCHITECTURE_AUDIT_2026-07-11.md)
- [Phase Architecture ADR](decisions/ADR-0005-phase-architecture-and-parallel-workstreams.md)
- [Policy influence and provenance ADR](decisions/ADR-0006-policy-influence-and-evidence-provenance.md)
- [Disabled change-kernel gating ADR](decisions/ADR-0007-disabled-change-kernel-gating.md)
- [Strategic authority ADR](decisions/ADR-0003-strategic-authority-and-experience-shell.md)
- [Environment-scope ADR](decisions/ADR-0004-environment-scoped-evidence-and-knowledge.md)
- [Player Product Vision](PRODUCT_VISION.md)
- [Real Productization Architecture Audit And Roadmap](product/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md)
- [Live STS2 Connection Boundary](../STS2MCP/docs/bridge-v2/LIVE_GAME_CONNECTION_BOUNDARY.md)
- [Real STS2 Connector Architecture Audit And Migration Plan](../STS2MCP/docs/bridge-v2/REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md)
- [Deferred Headless STS2 Plan](headless/README.md)
- [North Star Authority And Roadmap Audit](reports/NORTH_STAR_AUTHORITY_AND_ROADMAP_AUDIT_2026-07-10.md)
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
- product packaging, Companion, BYOK, SDK, and distribution architecture
  - `product/*.md`
- old redirect docs and stale low-priority material
  - `archive/legacy/*.md`

## P0-P15, R1, And P8.x

`../PROJECT_PLAN.md` remains the canonical P0-P15 mainline. `phases/P9_P15_EXECUTION_ROADMAP.md` is the forward execution ordering. `phases/P9_P13_EXECUTION_ROADMAP.md` and `phases/P9_P16_EXECUTION_ROADMAP.md` are historical supporting detail. Optional local-autonomy research is track R1, not a maturity phase.

Use `phases/*.md` for:

- P8 closeout
- P8.5 rollout policy
- P9 entry criteria
- P9 guarded learning implementation
- P9-P15 execution ordering, phase gates, and parallel workstreams

Use `04_CURRENT_STATUS.md` for the short active snapshot only.

## Documentation Rules

When a task changes project behavior, policy, or phase judgment:

1. Update the canonical source first.
2. Update `04_CURRENT_STATUS.md` if the current blocker, phase, or next step changed.
3. Update phase docs when a milestone judgment changed.
4. Update handoff/debug only as supporting history.
5. Prefer moving stale docs into `archive/legacy/` plus redirect stubs over leaving them mixed with active docs.

## Status Drift Check

When a subsystem status changes, update or verify all of the following together so active docs do not drift:

1. `04_CURRENT_STATUS.md`
2. the relevant `phases/*.md` roadmap or entry-criteria doc
3. the relevant `debt/*.md` entry
4. the relevant subsystem source doc such as `../REPLAY_AND_EVAL.md`, `../DATA_SCHEMA.md`, or `../BUDGET_GOVERNANCE.md`
5. schema/eval wording if the change affects report semantics

Important wording guardrails:

- "started" is not the same as "complete"
- "read-only evidence slicing" is not the same as "promotion-grade evidence"
- "promotion-eligible evidence" is not the same as "promotion applied"
- "budget telemetry" is not the same as "Budget OS"
- "`BudgetPolicyProposal`" is not the same as runtime budget autonomy
- provider mode or rollout mode is not the same as decision-authority mode
- measured capability is not automatic strategic authority
- successful execution is not environment compatibility
- an observed outcome is evidence, not precise causal proof
