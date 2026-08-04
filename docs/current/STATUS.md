# Current Status - Human-Equivalent Connector

Baseline date: 2026-08-04

Branch: `human_equivalent_connector`

Current source protocol is `1.0-preview.1`.

## Verdict

Human-Equivalent C is now an implemented production path in source. Gateway,
Re and the operator CLI use the new contract by default. The implementation is
tested and buildable; exact installed and loaded status remains per-machine
evidence. No current document may convert a build/install into Live proof.

## Implemented

- `HumanSnapshot` with exact state, frame, current owner, persistent visible
  state, current surface/context facts, entities, controls and affordances;
- generic `activate/select/deselect/confirm/cancel/play/use/end_turn/skip/open/close`;
- exact state/frame/owner/entity/control and controller binding;
- execute-time native UI target validation and existing native adapters;
- request idempotency and `applied/not_applied/unknown` delivery receipts;
- immediate successor snapshot; business Outcome is not awaited;
- source-free current `NChooseACardSelectionScreen` operation, including an
  unclassified new source;
- strict Re decoder, direct opaque affordance choices and successor supervision;
- `he_assisted` plus mandatory `he_pure` without D annotations;
- HE-native state-bound run-deck/combat-pile/shop Inspection and current
  surface-card linked detail;
- `/api/he/*` default REST and root deployment/run tooling.

## Retained From V3

Exact runtime/artifact identity, player-visible observation policy, entity
registry, current-owner resolution, native UI adapters, main-thread dispatch,
single-controller lease, stale checks, read-only Inspection assets and local
evidence recording remain useful infrastructure.

V3 source permission, durable qualification, SourceContract and business
Outcome are not HE admission or completion requirements. `/api/v3/*` is an
explicit rollback/comparison surface only; HE has no silent V3 action fallback.

## Pending Exact-Runtime Evidence

- cold-load the newly installed HE artifact and verify matching SHA/MVID;
- one `he_assisted` ordinary journey and one bounded `he_pure` journey;
- an actual source-unclassified card-choice screen;
- stale snapshot, duplicate request and unknown-delivery runtime negatives;
- hover/focus/scroll/native-page operations in normal Agent flow;
- abandon-run/return-menu and persistent-management denial policy.

## Non-Claims

- all human-reachable UI is complete;
- arbitrary versions or Mods are compatible;
- visual pointer fallback exists;
- HE has Live, Organic or durable qualification;
- inherited Preview.11/12 evidence transfers to HE.

## Per-Machine Deployment Truth

Run `npm run doctor`, `npm run deploy` with STS2 closed, then after a cold start
run `npm run verify:loaded`. Those commands are the authority for one machine's
source/build/install/load tuple; this document intentionally contains no
mutable local SHA, MVID or runtime instance.
