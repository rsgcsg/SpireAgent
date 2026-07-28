# Current Documentation Map

This directory is the authoritative repository-level documentation entrypoint.
It describes the rebuilt `Re-SpireAgent` plus the real STS2 connector. It does
not inherit authority from the archived root SpireAgent runtime.

## Authority Order

1. [Status](STATUS.md): short current milestone, blocker, and immediate next
   step.
2. [Architecture](ARCHITECTURE.md): component ownership and non-negotiable
   connector boundaries.
3. [Connector target architecture ADR](decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md):
   the single accepted Workflow C destination, responsibility boundaries,
   rejected alternatives, staged migration, and bounded completion definition.
   [ADR-0003](decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md)
   defines the accepted operation-retirement and native-continuation
   refinement without changing current authority prematurely.
   [ADR-0004](decisions/ADR-0004-risk-calibrated-encounter-trial-and-scoped-claims.md)
   separates diagnostic observation, volatile encounter trial admission, and
   persistent scoped claims.
4. [Roadmap](ROADMAP.md): current functional gates and retirement sequence.
5. [Program plan](PROGRAM_PLAN.md): cross-component dependencies and future
   admission gates without changing the current delivery priority.
6. [Internal development and evaluation](DEVELOPMENT_AND_EVALUATION.md):
   current evidence/eval capabilities, honest non-claims, and staged D-lane
   delivery.
7. [Product](PRODUCT.md): product boundary and deferred product work.
8. [Local setup](LOCAL_SETUP.md): fresh clone, exact-game build, safe install,
   loaded-identity verification, Re configuration, and cross-device rules.
9. [Operations](OPERATIONS.md): safe local development and validation map.
10. [Repository inventory](REPOSITORY_INVENTORY.md): current/legacy ownership
   classification and v1-retirement holdouts.
11. [Repository consolidation ADR](decisions/ADR-0001-current-mainline-and-legacy-archive.md):
   durable authority and archive decision.

Current cross-component audits:

- [Preview.69 risk-calibrated trial and reliability migration](audits/PREVIEW_69_RISK_CALIBRATED_TRIAL_AND_RELIABILITY_MIGRATION_2026-07-28.md):
  latest-run root causes, encounter-only provisional authority, session claim
  semantics, direct runtime fixes, test boundary, and live non-claims.
- [Preview.68 long-run reliability and native-contract migration audit](audits/PREVIEW_68_LONG_RUN_RELIABILITY_AND_NATIVE_CONTRACT_MIGRATION_2026-07-27.md):
  exact three-run failure attribution, Kifuda source/continuation evidence,
  coherent-read and one-game-boundary repairs, and the current architecture
  migration/non-claim boundary.
- [Workflow C fact-first Connector audit](audits/WORKFLOW_C_FACT_FIRST_CONNECTOR_AUDIT_2026-07-27.md):
  first-principles architecture verdict, measured run/Prompt evidence,
  retained and rejected abstractions, Preview.67 identity-shadow slice, thin
  operator CLI, bounded completion definition, and falsifiable next tests.
- [Preview.67 operator-readiness closeout](audits/PREVIEW_67_OPERATOR_READINESS_CLOSEOUT_2026-07-27.md):
  real Loaded/Failed Mod root cause, architecture re-review, CLI/readiness
  repairs, exact loaded identity, session-canary preparation, and remaining
  Organic boundary.
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
- [D3 permission and gray rollout closeout](../../STS2MCP/docs/bridge-v2/D3_PERMISSION_GRAY_ROLLOUT_CLOSEOUT_2026-07-25.md):
  Preview.63 operation-scoped session grants, exact identity/Patch binding,
  first real canary/auto-approval, rollback and explicit non-claims.
- [Gate 3 local control coordination closeout](../../STS2MCP/docs/bridge-v2/GATE3_LOCAL_CONTROL_COORDINATION_CLOSEOUT_2026-07-25.md):
  Preview.64's deliberately minimal client registration, single-writer lease,
  command attribution, overlap audit, and Preview.65 loaded two-client check.
- [Preview 65 persistent qualification and adaptation closeout](../../STS2MCP/docs/bridge-v2/PREVIEW_65_PERSISTENT_QUALIFICATION_AND_ADAPTATION_CLOSEOUT_2026-07-25.md):
  exact operation identities, candidate-versus-qualified package tiers,
  append-only lifecycle, impact tooling, loaded identity, and current
  qualification architecture.
- [Preview 65 v0.109.1 requalification closeout](../../STS2MCP/docs/bridge-v2/PREVIEW_65_V01091_REQUALIFICATION_CLOSEOUT_2026-07-26.md):
  exact second-environment binding audit, two real persistent operation
  qualifications, restart recovery, lifecycle failures, and remaining
  fail-closed boundaries.
- [Preview 66 multi-environment migration closeout](../../STS2MCP/docs/bridge-v2/PREVIEW_66_MULTI_ENVIRONMENT_MIGRATION_CLOSEOUT_2026-07-26.md):
  non-authorizing Environment Profiles, risk-based candidate policy,
  multi-environment qualification slots, atomic hot reload, automatic
  evidence-to-package orchestration, final exact runtime identity, and the
  first final-binary persistent migration slice.
- [ADR-0005 semantic-state/authority identity separation](../../STS2MCP/docs/bridge-v2/ADR-0005-semantic-state-and-authority-identity-separation.md):
  accepted shadow-only split, negative boundaries, and authority-migration
  evidence gate.
- [Preview 67 identity-shadow Live handoff](../../STS2MCP/docs/bridge-v2/PREVIEW_67_IDENTITY_SHADOW_LIVE_HANDOFF_2026-07-27.md):
  historical pre-cold-load checklist and prepared identity. Its deployment
  facts are superseded by the operator-readiness closeout above; its explicit
  non-claims remain useful evidence.

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
