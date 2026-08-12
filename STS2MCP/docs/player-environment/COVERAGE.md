# Player Environment Coverage

## Interaction

LiveHost readers cover menu/run entry, combat cards/potions/end turn, map,
event, rewards/card rewards, shop, rest, treasure, generated choices, combat
hand/piles, upgrade/removal/transform/enchant/bundle selectors and game over.

Visible state is explicitly projected before finite action projection; native
owner/slot/control IDs do not enter public Surface facts. Referents are derived
only from those facts. A complete bound-action
catalog expresses exact public subject/argument combinations while native
objects remain Host-local. Unknown owner or target fails closed. Unknown
business provenance alone does not suppress an exact visible native control.

## Information

Implemented:

- persistent run/player summary;
- tagged current interaction content;
- visible referents and directly observed state;
- `run_deck`, `combat_piles`, `shop_catalog` and `surface_card` reads;
- default-off native-page evidence for run deck, combat draw/discard/exhaust
  piles and shop catalog.

Partial/unsupported: current keyboard/controller focus, active hover traversal,
arbitrary scrolling, exhaustive native tooltip subtype coverage and native
pages outside the fixed profile.
See the repository [Player Environment Information Closure](../../../docs/current/PLAYER_ENVIRONMENT_INFORMATION_CLOSURE.md).

## Evidence

The current source migration has automated and build evidence only after its
checks complete. It has no loaded or Live evidence yet. Preview.5's completed
journey and stale-read proof remain historical evidence for that exact old
artifact and do not qualify this source or its next DLL.

## Unsupported

There is no arbitrary click/reflection, visual computer-use fallback, Headless
Host, Training authority, hidden-state projection or arbitrary-version/Mod
compatibility claim. Retired V2/V3 protocols are not fallbacks.
