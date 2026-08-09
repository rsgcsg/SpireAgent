# Current Status - Human-Equivalent Connector

Baseline date: 2026-08-09

Branch: `human_equivalent_connector`

Current source protocol is `1.0-preview.2`.

## Verdict

Human-Equivalent C is the only default product path. Gateway, Re and the
operator CLI use `/api/he/*`; V3 is explicit rollback/comparison only.
Protocol `preview.2` is source, test, build, install and exact-load verified.
Its first Live run exposed and reproduced a Re strict-decoder mismatch for
omitted, unobserved control state; that defect is fixed in source and tests.
It does not inherit `preview.1` journey evidence.

Freeze verdict is `conditional freeze`, with the core C wire, authority and
delivery contract frozen. A fixed-`preview.2` ordinary journey completed; the
remaining conditions are bounded `he_pure`, source-free selector and Human
information-parity evidence, not another C business-semantics redesign.

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
HE runtime still calls five machine-checked V3 adapter-library seams for
unmigrated families. This is one-way implementation reuse, not wire or
authority, but moving those implementations under neutral `NativeUi`
ownership remains readability debt.

## Latest Exact Live Evidence

`run-20260809125843-1k1zrv` used exact-loaded `preview.2` artifact SHA
`28e4b335...`, MVID `69657c34...`, runtime `b87e2551...`, and stopped before
mutation at decision 1. C correctly omitted unobserved `selected` and
`focused`; Re incorrectly required those keys despite allowing null values.
The consumer now accepts omitted or null control state, with a fixture matching
the Live shape. This run proves exact load and the defect boundary, not an
ordinary journey.

After that consumer fix, `run-20260809130134-e1b0kj` used source `ceb995f4`,
SHA `c32a3092...`, MVID `daa75e36...`, runtime `b493c49b...`, protocol
`preview.2`, and STS2 `v0.110.1/db5d3552`. It completed a game and stopped at
the bounded top-level-menu boundary after 261 decisions: 186 settled inputs,
22 delivered checkpoint-pending inputs, 9 safe stale refusals, and 44
non-actionable transition polls. It covered menu, event, map, combat, reward,
rest, shop, treasure and game-over return. No unknown delivery occurred. The
metadata remains `provenance=unrecorded` and `qualificationUse=coverage_only`;
this is exact Live journey evidence, not Organic evidence or qualification.

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

- one bounded `he_pure` journey;
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
