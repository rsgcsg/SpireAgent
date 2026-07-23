# Current Documentation Map

This directory is the authoritative repository-level documentation entrypoint.
It describes the rebuilt `Re-SpireAgent` plus the real STS2 connector. It does
not inherit authority from the archived root SpireAgent runtime.

## Authority Order

1. [Status](STATUS.md): short current milestone, blocker, and immediate next
   step.
2. [Architecture](ARCHITECTURE.md): component ownership and non-negotiable
   connector boundaries.
3. [Roadmap](ROADMAP.md): current functional gates and retirement sequence.
4. [Program plan](PROGRAM_PLAN.md): cross-component dependencies and future
   admission gates without changing the current delivery priority.
5. [Internal development and evaluation](DEVELOPMENT_AND_EVALUATION.md):
   current evidence/eval capabilities, honest non-claims, and staged D-lane
   delivery.
6. [Product](PRODUCT.md): product boundary and deferred product work.
7. [Operations](OPERATIONS.md): safe local development and validation map.
8. [Repository inventory](REPOSITORY_INVENTORY.md): current/legacy ownership
   classification and v1-retirement holdouts.
9. [Repository consolidation ADR](decisions/ADR-0001-current-mainline-and-legacy-archive.md):
   durable authority and archive decision.

Current cross-component audits:

- [Visibility and observation architecture audit](audits/VISIBILITY_AND_OBSERVATION_ARCHITECTURE_AUDIT_2026-07-22.md):
  current Gateway/Re fact flow, Prompt projection debt, evidence limits, and
  falsifiable next experiments. It is an audit, not an accepted protocol change.
- [Future program and consumer architecture audit](audits/FUTURE_PROGRAM_AND_CONSUMER_ARCHITECTURE_AUDIT_2026-07-23.md):
  critical review of future-consumer requirements, program dependencies,
  rejected premature platforms, and the adopted macro sequencing.
- [Program-plan second review](audits/PROGRAM_PLAN_SECOND_REVIEW_2026-07-23.md):
  evidence-backed correction that makes internal D and official Agent A
  distinct workstreams without claiming a public platform or SDK.

Component-owned truth:

- `Re-SpireAgent/README.md`, `Re-SpireAgent/AGENT.md`, and `Re-SpireAgent/docs/`
  own Agent behavior, records, and consumer contracts.
- `STS2MCP/README.md` and `STS2MCP/docs/bridge-v2/` own Gateway protocol,
  capabilities, coverage, source identity, and Organic evidence.
- [Gate 1 operation inventory](../../STS2MCP/docs/bridge-v2/GATE1_OPERATION_AND_JOURNEY_INVENTORY.md)
  owns current operation-level v1 retirement and ordinary-journey blockers.
- [Wood Carvings Gate 1 closeout](../../STS2MCP/docs/bridge-v2/GATE1_WOOD_CARVINGS_CLOSEOUT_2026-07-22.md)
  records the first organic fail-closed gap and its preview.56 canary closure.
- [Gate 1 real-run defect closeout](../../STS2MCP/docs/bridge-v2/GATE1_REAL_RUN_DEFECT_CLOSEOUT_2026-07-22.md)
  records the Headbutt completion, shop Inspection, and power-text repairs from
  fresh Re runs, including exact evidence limitations.

## Historical Material

- [`../../archive/original-spireagent/`](../../archive/original-spireagent/)
  contains the retired root runtime and P8--P15 documentation tree.
- [`../../archive/bridge-v2-previews/`](../../archive/bridge-v2-previews/)
  contains preview closeouts, dated audits, and historical runtime evidence.

Historical records may explain a decision or evidence scope. They never grant
current action permission, runtime compatibility, or roadmap authority.
The [relocation manifest](../../archive/RELOCATION_MANIFEST.md) records why
each historical path family moved and where to find it.
