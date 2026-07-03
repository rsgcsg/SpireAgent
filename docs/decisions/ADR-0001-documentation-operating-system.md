# ADR-0001: Documentation Operating System

## Status

Accepted

## Context

The repository has accumulated many top-level Markdown files plus legacy material under `docs/`.

That growth created a predictable failure mode:

- current status was spread across `PROJECT_PLAN.md`, `LLM_HANDOFF.md`, `DEBUG_REPORT.md`, and README
- roadmap, phase history, and active blockers were easy to confuse
- historical notes could accidentally override canonical documents in future Codex runs
- redirect files and runbooks lived beside architecture sources without a clear authority model

The project now needs a small documentation operating system so future humans and agents can quickly answer:

- what is the highest authority
- where current status lives
- where the roadmap lives
- where architecture, schema, runbooks, reports, and ADRs belong
- which files are historical support rather than project truth

## Decision

The project adopts the following documentation operating system.

### 1. Canonical hierarchy

- `PROJECT_NORTH_STAR.md`: highest-priority long-term constitution
- `docs/04_CURRENT_STATUS.md`: canonical current phase, blocker, and next step
- `PROJECT_PLAN.md`: canonical long-range roadmap and phase book
- `ARCHITECTURE.md`, `DATA_SCHEMA.md`, `REPLAY_AND_EVAL.md`, `BUDGET_GOVERNANCE.md`: canonical subsystem sources
- `docs/decisions/*.md`: durable decision records explaining why important governance rules exist

### 2. Non-canonical but useful documents

- `LLM_HANDOFF.md`: working handoff and recent engineering context
- `DEBUG_REPORT.md`: append-only debug and iteration history
- README: repository entrypoint, not a long-form project report
- runbooks in `docs/`: operational procedures, not architecture truth
- redirect files in `docs/`: compatibility pointers only

### 3. Update discipline

When behavior, policy, phase judgment, or governance changes:

1. Update the canonical target first.
2. Update `docs/04_CURRENT_STATUS.md` if the active milestone, blocker, or next step changed.
3. Add or update an ADR for durable, cross-cutting rules.
4. Use handoff/debug files only as supporting context and chronology.

### 4. P1-P10 and P8.x coexistence

- The formal P1-P10 route stays in `PROJECT_PLAN.md`.
- Active sub-phase detail such as `P8.4` or `P8.5` lives in `docs/04_CURRENT_STATUS.md` for the short snapshot and in handoff/debug files for detailed chronology.
- This prevents active iteration logs from silently becoming the roadmap.

## Consequences

Positive:

- future Codex runs have a stable entrypoint and write target
- current truth is easier to find than historical context
- roadmap, status, architecture, schema, and debug roles are separated
- handoff/debug files can stay useful without pretending to be canonical

Tradeoffs:

- maintainers must do a little more disciplined documentation routing
- some information will remain duplicated in short form between status and historical logs
- the project keeps existing files for compatibility instead of doing a large cleanup immediately

## Rollout

This ADR is intentionally minimal.

- No large-scale file moves
- No historical deletion
- No roadmap rewrite
- No code-path changes

Future phases may perform a larger migration once the operating system has proven useful in daily work.
