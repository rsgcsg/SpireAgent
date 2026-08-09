# Current Status - Human-Equivalent Connector

Baseline date: 2026-08-09

Branch: `human_equivalent_connector`

Current source protocol is `1.0-preview.1`.

## Verdict

Human-Equivalent C is the implemented and Live-exercised default product path.
Gateway, Re and the operator CLI use the HE contract by default. The latest
Live evidence belongs to source `250ebc6d`, SHA `693c1689...`, MVID
`894be927...` and runtime `d00531f2...`; later source/build/install identities
do not inherit that evidence. No current document may convert a build/install
into Live proof.

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
- source-free current `NDeckCardSelectScreen` select/deselect, preview, cancel
  and confirm delivery, independent of merchant/relic/event/reward source;
- source-free current `NCombatPileCardSelectScreen` select/deselect, cancel and
  confirm delivery, independent of its opening card/relic/event source;
- strict Re decoder, direct opaque affordance choices and successor supervision;
- `he_assisted` plus mandatory `he_pure` without D annotations;
- HE-native state-bound run-deck/combat-pile/shop Inspection and current
  surface-card linked detail;
- `/api/he/*` default REST and root deployment/run tooling.

## Retained From V3

Exact runtime/artifact identity, player-visible observation policy,
`NativeUiRuntime` entity registry, current-owner resolution, native UI adapters, main-thread dispatch,
single-controller lease, stale checks, read-only Inspection assets and local
evidence recording remain useful infrastructure.

V3 source permission, durable qualification, SourceContract and business
Outcome are not HE admission or completion requirements. `/api/v3/*` is an
explicit rollback/comparison surface only; HE has no silent V3 action fallback.
The HE runtime is no longer a `ConnectorV3Runtime` partial. Unmigrated UI
families still call six explicitly checked bounded V3 adapter-library seams.
That one-way reuse is not V3 wire or authority, but moving the remaining
providers/adapters under `NativeUi` remains readability debt.

## Latest Live Evidence

Nine `he_assisted` runs from `run-20260809074101-s34jqz` through
`run-20260809074935-ck0e2y` used protocol `1.0-preview.1` and the exact loaded
identity above. Across 85 decisions they recorded 46 settled deliveries, 26
non-actionable states, seven delivered inputs whose client checkpoint timed
out, and six safe stale refusals. They exercised menu, combat, rewards, card
rewards, map, rest, event and treasure.

The seven checkpoint timeouts were a Re receipt-boundary defect: C had already
returned `applied`, sometimes with a changed transitional successor. Sixteen
non-actionable decisions were the same visible combat-pile selector being
suppressed by a business-source binding. Both defects are fixed in source and
tests but are pending exact-runtime evidence on the replacement artifact.

## Pending Exact-Runtime Evidence

- cold-load the replacement HE artifact and verify matching SHA/MVID;
- one replacement-artifact `he_assisted` ordinary journey and one bounded
  `he_pure` journey;
- source-free combat-pile select/deselect/confirm Live regression;
- actual source-unclassified one-of-N and deck-card selector screens;
- stale snapshot, duplicate request and unknown-delivery runtime negatives;
- hover/focus/scroll/native-page operations in normal Agent flow;
- abandon-run/return-menu and persistent-management denial policy.

## Non-Claims

- all human-reachable UI is complete;
- arbitrary versions or Mods are compatible;
- visual pointer fallback exists;
- HE has Organic or durable qualification;
- inherited Preview.11/12 evidence transfers to HE.

## Per-Machine Deployment Truth

Run `npm run doctor`, `npm run deploy` with STS2 closed, then after a cold start
run `npm run verify:loaded`. Those commands are the authority for one machine's
source/build/install/load tuple; this document intentionally contains no
mutable local SHA, MVID or runtime instance.
