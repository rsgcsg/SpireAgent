# Human-Equivalent Coverage

## Structured Core

The HE runtime reuses current native observation and adapters for menu/run
entry, combat cards/potions/end turn, map, event, reward/card reward, shop,
rest, treasure, generated choices, combat hand/piles, upgrade/removal/
transform/enchant/bundle selectors and game over.

Current one-of-N native card choice additionally has source-free discovery:
an unknown card/event/relic source does not suppress exact visible choices.

## Information

Implemented: persistent visible run/player summary, current surface and context,
visible cards, control state, selection, state-bound run-deck/combat-pile/shop
Inspection and current-surface card linked detail.

Pending: hover/focus/tooltip/scroll actions, normal Agent native-page
open/read/return and rendered-frame dimensions.

## Unsupported

An unmapped structured owner remains `visible_unsupported`; arbitrary UI
clicking/reflection is not used. Custom-drawn UI visual fallback is not yet
implemented. Coverage statements require exact-runtime exercise before they
become Live evidence.
