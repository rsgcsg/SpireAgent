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
7. [Local setup](LOCAL_SETUP.md): fresh clone, exact-game build, safe install,
   loaded-identity verification, Re configuration, and cross-device rules.
8. [Operations](OPERATIONS.md): safe local development and validation map.
9. [Repository inventory](REPOSITORY_INVENTORY.md): current/legacy ownership
   classification and v1-retirement holdouts.
10. [Repository consolidation ADR](decisions/ADR-0001-current-mainline-and-legacy-archive.md):
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
- [Connector automatic-adaptation and D-workflow audit](audits/CONNECTOR_AUTOMATIC_ADAPTATION_AND_D_WORKFLOW_AUDIT_2026-07-24.md):
  critical review of zero-core-code adaptation, the runtime safety kernel,
  operation fingerprints, conservative candidate classification and the first
  non-authorizing D2 scenario/grader slice.
- [Gate 1 closeout and selector transaction audit](../../STS2MCP/docs/bridge-v2/GATE1_CLOSEOUT_AND_SELECTOR_TRANSACTION_AUDIT_2026-07-24.md):
  exact Neow's Fury failure attribution, structural selector migration, v1
  mutation retirement, evidence limits, and Gate 2 entry order.
- [Gate 1 adaptation and compatibility closeout](../../STS2MCP/docs/bridge-v2/GATE1_ADAPTATION_AND_COMPATIBILITY_CLOSEOUT_2026-07-24.md):
  final runtime seal, reviewed source/environment registries, non-authorizing
  exact-assembly audit, zero-core-code boundary and remaining Mod risks.

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
- [Gate 1 Seance and reward-removal closeout](../../STS2MCP/docs/bridge-v2/GATE1_SEANCE_AND_REWARD_REMOVAL_CLOSEOUT_2026-07-23.md)
  records the exact source split, Preview.58 identity, reward-removal Organic
  canary, and Seance evidence boundary.
- [Gate 1 Dredge closeout](../../STS2MCP/docs/bridge-v2/GATE1_DREDGE_CLOSEOUT_2026-07-23.md)
  records Preview.59's source-scoped multi-step selection contract, exact
  current-build canary, and the boundary between direct native completion and
  an interactive child Surface.

## Historical Material

- [`../../archive/original-spireagent/`](../../archive/original-spireagent/)
  contains the retired root runtime and P8--P15 documentation tree.
- [`../../archive/bridge-v2-previews/`](../../archive/bridge-v2-previews/)
  contains preview closeouts, dated audits, and historical runtime evidence.
- [`../../archive/legacy-connector-v1/`](../../archive/legacy-connector-v1/)
  contains the retired v1 state reconstruction, index actions, and raw API
  references. It is excluded from the active Gateway build.

Historical records may explain a decision or evidence scope. They never grant
current action permission, runtime compatibility, or roadmap authority.
The [relocation manifest](../../archive/RELOCATION_MANIFEST.md) records why
each historical path family moved and where to find it.
