# Preview.35 Map Controller-Gate Closeout

Status date: 2026-07-18  
Protocol: `2.0-preview.35`  
Base remote HEAD: `18de3bd9e457e9529cc92376754085d1413f8eb3`

## Trigger And Scope

Preview.34 successfully exercised ordinary mouse/single-player map travel. A
final source/IL comparison then found one unrepresented mechanical gate:
`NMapPoint.OnRelease` requires `NMapScreen.IsNodeOnScreen` while controller
input is active. The Provider's shared exact-choice predicate did not include
that condition.

Preview.35 changes only this map-choice validator and protocol revision. The
current exact-build permission matrix remains three canaries
`[event_option,event_card_acquisition,map_navigation]`, zero qualified
Surfaces, and zero Inspection kinds.

## Implementation

`MapNavigationSurfaceProvider.CanAdvertiseMapChoice` now provides one pure
legality kernel for:

- exact `MapPointState.Travelable`;
- current UI `IsEnabled`;
- row-zero FTUE completion;
- controller-mode node visibility.

Publication and execution both call the same exact helper. Controller mode
requires the exact node to be on screen; mouse mode preserves the map's
scrollable route semantics. A missing controller manager fails closed.
Execution still additionally binds the same screen, run, node reference, and
coordinate before calling `OnMapPointSelectedLocally`.

The suspected multiplayer gap was denied by current source:
`BridgeSnapshotBuilder` rejects every multiplayer run before Provider
resolution. No duplicate Provider gate was added.

## Verification And Loaded Identity

- Bridge tests: `64/64` passed.
- Re tests: `128/128` passed.
- Re strict typecheck and production build: passed.
- Tracked Python entry points: compiled.
- Release rebuild: zero warnings, zero errors.
- Release/installed SHA-256:
  `505e9db42b79edc52fd7fd2aead6145a255e47dea54f3a07059b781e1b84dbe6`.
- Release/loaded MVID: `547842a2-27d4-4c5d-8188-ca1d525d7e98`.
- Runtime instance: `65ecb6bf7ee34d9d8c007fbd137eeda8`.
- Exact game identity: `v0.109.0|c12f634d|1833084275`.

Cold-loaded capabilities reported protocol `2.0-preview.35`, the exact MVID
and runtime above, qualified actions `[]`, the same three action canaries,
Inspection `disabled_for_current_build`, and Inspection kinds `[]`.

## Bounded Journey And Organic Evidence

The saved run resumed in an unsupported floor-five combat. v1 was used only as
a bounded transport through main-menu Continue, that combat, immediate gold and
potion rewards, and reward Proceed. One repeated end-turn attempt during a
transient old snapshot was rejected by v1; the window stopped immediately and
continued only after the game visibly advanced to the next round. None of
these v1 actions are Bridge qualification evidence.

At the next map:

1. Bridge state `state_ed14bb023a_1` showed current `(5,4)`, one exact
   travelable `(5,5) monster` node, route input ready, and drawing mode `none`.
2. Re strict inspect agreed on the exact action/entity binding, diagnostics
   `ok`, `bridge_advertised` authority, and zero Inspection facts.
3. Request `preview35-map-1784363763173` selected
   `map_node_f43f0d90_18`. The lifecycle was
   `received -> validated -> started -> completed`, outcome `confirmed`.
4. Semantic Completion was
   `map_closed_or_current_map_coordinate_reached`; arbitrary state change was
   not accepted.
5. The successor was another real combat. `combat_turn` stayed
   `not_qualified_for_current_build`; Re reported
   `bridge_v2:combat:unsupported`, action authority `none`, zero actions, and
   zero Inspection facts.

This is Organic canary evidence for preview.35 map navigation only. The
controller branch is fixture-tested but not organically exercised with a live
controller. The two event canaries were not re-exercised on this MVID.

## Evidence Governance

Preview.34 SHA
`b029d0119f70ba19c582c2dfe5148622b9c3f006fee66b4672dcb43a630acb97`,
MVID `ff3537d8-ee16-4ae3-9e18-0796f87abe7e`, runtime
`8fd06a38d2c841debdd0b7796888af39`, and `(4,3) -> (5,4)` journey remain
historical mouse/single-player evidence. They are not attributed to preview.35.

Likewise, preview.32/33 event evidence remains bound to its own SHA/MVID/runtime
records. Canary permission is not qualification, and implementation, tests,
build, install, or load do not promote it.

## Architecture Decision

Decision: **B-level internal fix, A-level external contract retention**.

- Keep one semantic `map_navigation` Surface and one opaque
  `choose_map_node` operation.
- Keep exact entity/state binding and purpose-specific Completion.
- Keep the small pure shared validator because it removes real publication vs
  execution drift.
- Do not add a generic navigation adapter, click API, Effect DSL, or broad
  witness engine.

The next boundary is `combat_turn`. Its current Surface-kind canary scope would
cover `play_card`, `use_potion`, and `end_turn` together, unlike the map's
single operation. The next smallest safe work is a non-authorizing exact-source
and operation-granularity audit before any combat permission change.

## Final Status

`map_navigation`: Implemented, Fixture-tested, Compiled, Installed, Loaded,
Observed, Canary-permitted, and Canary-exercised on the exact preview.35 MVID.
It is not qualified. Live controller mode, drawing mode, row-zero FTUE, special
map modes, and future MVIDs remain unexercised or Fail Closed as applicable.
