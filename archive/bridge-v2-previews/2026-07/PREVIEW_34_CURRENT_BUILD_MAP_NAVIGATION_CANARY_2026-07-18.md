# Preview.34 Current-Build Map Navigation Canary

Status date: 2026-07-18  
Protocol: `2.0-preview.34`  
Base remote HEAD: `18de3bd9e457e9529cc92376754085d1413f8eb3`

Historical status: superseded by preview.35 after final self-review found that
the shared map-choice predicate omitted the controller-only
`NMapScreen.IsNodeOnScreen` gate. Evidence below remains valid only for the
exercised mouse/single-player path and exact preview.34 MVID.

## Scope

This slice adds only `map_navigation` beside `event_option` and
`event_card_acquisition` in the explicit canary list for exact game identity
`v0.109.0|c12f634d|1833084275`. Qualified Surface and Inspection lists remain
empty. No source-target permission was copied and no canary was promoted.

## Current Source And Real UI

The installed current assembly and live map confirm:

- `NMapScreen` owns `IsOpen`, `IsTravelEnabled`, `IsTraveling`, drawings,
  private `_isInputDisabled`, and `OnMapPointSelectedLocally`;
- `NMapPoint.OnRelease` accepts only a travelable point, the row-zero FTUE
  boundary, no drawing mode, and a screen/controller-valid node;
- `TravelToMapCoord` sets `IsTraveling`, recalculates travelability, disables
  travel, and advances the run coordinate asynchronously;
- `RunState.CurrentMapCoord` is the last exact visited coordinate;
- the live map had current `(4,3)`, 60 visible nodes, and exactly two next UI
  choices: `(3,4) monster` and `(5,4) unknown`.

The Provider requires one live screen and run, unique UI nodes per coordinate,
route input readiness, drawing mode `none`, exact `Travelable` state,
`IsEnabled`, and the FTUE gate. Execution reuses the same exact-choice
predicate and additionally revalidates the same screen, run, node membership,
and coordinate before mutation. Preview.34 did not yet include the
controller-only on-screen condition in that predicate. Completion is map
closure or the exact selected current coordinate; generic state change is
insufficient.

## Validation And Loaded Identity

- Bridge: `63/63` tests passed.
- Re: `128/128` tests passed; strict typecheck and production build passed.
- Tracked Python entry points compiled.
- Release rebuild: zero warnings, zero errors.
- Release/installed SHA-256:
  `b029d0119f70ba19c582c2dfe5148622b9c3f006fee66b4672dcb43a630acb97`.
- Release/loaded MVID: `ff3537d8-ee16-4ae3-9e18-0796f87abe7e`.
- Runtime instance: `8fd06a38d2c841debdd0b7796888af39`.
- Exact game identity: `v0.109.0|c12f634d|1833084275`.

After a cold Steam restart, capabilities reported qualified actions `[]`,
canaries `[event_option,event_card_acquisition,map_navigation]`, Inspection
allowed `false`, and both Inspection scope lists `[]`.

## Organic Lifecycle

The cold restart opened the unsupported root main menu. One v1
`menu_select:continue` was used only to reach the persisted run because v2 has
no root-menu contract. It is navigation evidence, not a Bridge v2 action
canary. All subsequent actions used preview.34 opaque commands on the loaded
identity above:

1. `preview34-resume-event-1784362667206` selected Brain Leech `Share
   Knowledge` and completed with
   `event_option_replaced_or_required_subsurface_opened`.
2. `preview34-resume-card-1784362688311` selected exact
   `BEAM_CELL/card_5247726a_b` and completed with
   `selected_event_cards_added_as_exact_instances_to_run_deck`.
3. `preview34-resume-proceed-1784362711195` completed with
   `event_proceed_opened_map_or_left_room`, producing ready map state
   `state_287469a4de_7`.
4. Re strict inspect reported map Context, current `(4,3)`, 60 nodes, exactly
   the two current opaque node actions, `bridge_advertised` authority,
   diagnostics `ok`, and no Inspection facts.
5. `preview34-map-1784362747378` selected exact entity
   `map_node_5247726a_1f` at `(5,4)`. Its lifecycle was
   `received -> validated -> started -> completed`, outcome `confirmed`, with
   `map_closed_or_current_map_coordinate_reached`.
6. The natural successor was floor-five combat. Bridge source-resolved
   `combat_turn` but capabilities kept it `not_qualified_for_current_build`.
   Re reported `bridge_v2:combat:unsupported`, authority `none`, zero actions,
   and zero Inspection facts.

## Architecture Decision

Decision after final review: **B**, followed by A-level retention of the
external contract. Keep the existing semantic map contract and purpose-specific
Completion, but add the missing controller reachability condition to the
shared exact-choice validator. No repeated evidence justifies a generic
navigation adapter or witness engine.

The next boundary exposes a separate architecture concern: Surface-kind canary
scope is narrow for one-operation map navigation but broad for the three
`combat_turn` operations. Audit operation granularity before granting any
current-build combat authority.

## Status

`map_navigation` was Implemented, Fixture-tested, Compiled, Installed, Loaded,
Observed, Canary-permitted, and Canary-exercised for the exact MVID and
mouse/single-player variant above. It was not qualified. Preview.35 supersedes
the loaded artifact and repeats the map canary after the controller-gate fix.
