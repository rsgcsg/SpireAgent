# Human-Equivalent Coverage

## Structured Core

The HE runtime reuses current native observation and adapters for menu/run
entry, combat cards/potions/end turn, map, event, reward/card reward, shop,
rest, treasure, generated choices, combat hand/piles, upgrade/removal/
transform/enchant/bundle selectors and game over.

Current one-of-N, deck-card and combat-pile native selectors additionally have source-free
discovery: an unknown card/event/relic/reward source does not suppress exact
visible choices. Deck-card selection includes select, deselect, preview, return,
cancel when native-cancelable and confirm. Combat-pile selection includes exact
visible select, deselect, native cancel and confirm. These actions prove only
UI input delivery; STS2 owns their eventual effect.

Baseline HE Live runs exercised ordinary menu, combat, reward/card reward, map,
rest, event and treasure. Source-free combat-pile handling is source/test only
until the replacement artifact is cold-loaded and exercised.

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
