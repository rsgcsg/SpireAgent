# Current Status - Human-Equivalent Connector

Baseline date: 2026-08-09

Branch: `human_equivalent_connector`

Current source protocol is `1.0-preview.2`.

## Verdict

Human-Equivalent C is the only default product path. Gateway, Re and the
operator CLI use `/api/he/*`; V3 is explicit rollback/comparison only.
Protocol `preview.2` is source and test verified in the current worktree and
does not inherit `preview.1` load or Live evidence.

Freeze verdict is `conditional freeze`. C authority, delivery, positive fact
projection and A consumption boundaries are fixed. Short-term freeze now
requires exact-runtime regression of `preview.2`.

## Implemented

- `HumanSnapshot` with exact state token, current owner, persistent visible
  state, current Surface facts, entities, controls and affordances;
- generic `activate/select/deselect/confirm/cancel/play/use/end_turn/skip/open/close`;
- exact C-local owner/entity/control/native-operand binding;
- execute-time native target/actionability validation and bounded UI adapters;
- positive, type-bounded HE fact projection instead of serializing legacy DTOs
  and deleting business keys;
- request idempotency and `applied/not_applied/unknown` delivery receipts;
- immediate successor; business Outcome is not awaited;
- source-free one-of-N, deck-card and combat-pile selector mechanics;
- strict Re decoder, generic-verb opaque choices and successor supervision;
- one pure C wire; `he_pure` and `he_assisted` are A composition modes;
- state-bound run-deck/combat-pile/shop Inspection and linked card detail;
- `/api/he/*` default REST and root deployment/run tooling.

Unknown control `selected`/`focused` state is omitted, not fabricated as
`false`. C exposes no D mode, annotation, native parameters, V2/V3 action ID,
index, coordinate, node path or arbitrary method.

## Retained Infrastructure And Debt

Runtime/artifact identity, player-visible observation policy, entity registry,
owner resolution, bounded native adapters, main-thread dispatch,
single-controller lease, stale checks, Inspection and local evidence recording
remain valuable.

V3 source permission, qualification, SourceContract and business Outcome are
not HE admission or completion. Re's V3 live client/executor is deleted. The
HE runtime still calls six machine-checked V3 adapter-library seams for
unmigrated families. This is one-way implementation reuse, not wire or
authority, but moving those implementations under neutral `NativeUi`
ownership remains readability debt.

## Latest Exact Live Evidence

Four `he_assisted` runs used source `930941a2`, protocol `1.0-preview.1`, SHA
`257ccac1...`, MVID `2345552d...`, runtime `da0c602d...`, STS2 `v0.110.1` /
`db5d3552` and an `additional_loaded_mods` Modset.

- `run-20260809114611-rldlev` reached `completed_run_boundary` after 20
  decisions and returned from game over to the top menu.
- `run-20260809083202-4ki7ig` exercised combat, reward, upgrade, event, map,
  rest, shop and treasure with two safe stale refusals.
- `run-20260809082509-xi54bi` executed 178 decisions but entered a repeated
  shop open/close cycle. C delivery remained applied; A exposed changing
  affordance identity as the semantic kind and its cycle hash retained HE
  transport identity. Source now projects generic verbs and excludes transport
  IDs from cycle identity.

These runs are `provenance=unrecorded` and
`qualificationUse=coverage_only_unless_independently_reviewed`. They are not
Organic evidence or durable qualification.

## Pending Exact-Runtime Evidence

- build/install/cold-load `preview.2` and verify SHA/MVID;
- one ordinary `preview.2` journey and one bounded `he_pure` journey;
- source-free combat-pile select/deselect/confirm;
- unknown-source one-of-N and deck-card selectors;
- stale, duplicate-request and unknown-delivery runtime negatives;
- hover/focus/tooltip/scroll/native-page operations;
- abandon-run/return-menu and persistent-management denial policy.

## Non-Claims

- all human-reachable UI is complete;
- arbitrary versions or Mods are compatible;
- a visual pointer fallback exists;
- HE has Organic or durable qualification;
- `preview.1` evidence transfers to `preview.2`.

## Per-Machine Deployment Truth

Run `npm run doctor`, `npm run deploy` with STS2 closed, then after a cold start
run `npm run verify:loaded`. Those commands, not this document, are authority
for one machine's source/build/install/load tuple.
