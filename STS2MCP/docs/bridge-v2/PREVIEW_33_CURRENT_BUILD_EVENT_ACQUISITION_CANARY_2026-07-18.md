# Preview.33 Current-Build Event Acquisition Canary

Status date: 2026-07-18  
Protocol: `2.0-preview.33`  
Base remote HEAD: `18de3bd9e457e9529cc92376754085d1413f8eb3`

## Scope

This slice adds `event_card_acquisition` beside `event_option` in the explicit
canary list for exact game identity `v0.109.0|c12f634d|1833084275`. There are no
qualified actions and no Inspection kinds. The Surface remains source-gated to
Brain Leech one-of-five and Room Full of Cheese two-of-eight selectors.

## Exact Source And UI

The current installed assembly confirms:

- `NSimpleCardSelectScreen` retains `_cardResults`, `_cards`, `_prefs`, and
  `_selectedCards` and auto-completes when a non-manual selection reaches max;
- `NCardGridSelectionScreen` routes exact holders through `HolderPressed`;
- `NCardHolder._isClickable` remains the actual interaction gate;
- `EventModel.SelectCardsToAddToDeckFromGrid` awaits the selector and adds each
  selected exact `CardModel` to `PileType.Deck`;
- Brain Leech constructs five candidates with select count one;
- Room Full of Cheese constructs eight common candidates with select count two.

The live Brain Leech child showed five exact visible cards, prompt `Choose a
card`, min=max=1, no cancel, and no manual confirmation. The existing Provider's
publication and execution both use the same binding/source checks. Completion
requires child closure, deck-count growth, and each selected exact instance in
the run deck; screen closure alone is insufficient.

## Validation And Loaded Identity

- Bridge: `63/63` tests passed.
- Re: `128/128` tests, strict typecheck, and production build passed.
- Python MCP entry compiled.
- Release build passed with zero warnings and zero errors.
- Release/installed SHA-256:
  `9fceb2887b9527e45ec2cdc3346a410c30a46bf41a7d376097940f3040de7248`.
- Loaded MVID: `c5492a5b-8840-4557-9ba0-2c74bd7a31f0`.
- Runtime instance: `15ca0dec2a134f699d2a8009880270de`.

Capabilities reported exactly two action canaries, no qualified Surface, and
`disabled_for_current_build` Inspection with an empty kind list.

## Organic Lifecycle

All commands below belong to the loaded identity above:

1. `preview33-event-option-1784361786064` selected Brain Leech `Share
   Knowledge` from `state_6d5c086e99_1`; it completed with
   `event_option_replaced_or_required_subsurface_opened` and produced ready
   `event_card_acquisition` state `state_6d5c086e99_2` with five actions.
2. Re strict inspect accepted the child with exact visible cards, one-to-one
   entity bindings, `bridge_advertised` authority, and no Inspection facts.
3. `preview33-event-card-acquisition-1784361829259` selected
   `BEAM_CELL/card_a085375b_b`; it completed with
   `selected_event_cards_added_as_exact_instances_to_run_deck` and observed
   `state_6d5c086e99_3`.
4. `preview33-event-proceed-1784361847130` completed with
   `event_proceed_opened_map_or_left_room` and reached
   `state_6d5c086e99_4`.
5. `map_navigation` was source-resolved but remained unsupported with zero legal
   actions. Re preserved event Context, set action authority to none, and did
   not import a v1 action.

## Architecture Decision

Decision: **A/B**. Keep event acquisition as its own semantic contract and keep
the small existing reflection/projection helpers local. The Provider already
separates grid mechanics, deterministic source binding, execution validation,
and semantic completion sufficiently for these two audited origins. A generic
selector or Effect DSL would reduce safety. A shared Mechanism Adapter remains a
future experiment only after another real selector shows repeated stable code.

## Status And Next Boundary

Both current-build Surfaces are Implemented, Fixture-tested, Compiled,
Installed, Loaded, Observed, Canary-permitted, and Canary-exercised. Neither is
qualified. Room Full of Cheese remains unexercised. The next natural boundary
is the currently visible `map_navigation` Surface; it needs its own exact-source
audit and fresh-MVID canary.
