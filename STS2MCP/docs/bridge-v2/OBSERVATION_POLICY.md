# Player-Visible Observation Policy

Policy id: `player_visible_ui_v1`

## Rule

Bridge v2 may expose information that the local player can currently see or can
obtain through a normal, non-strategic inspection interaction. It must not use
internal access as permission to reveal hidden game state.

Visibility classes:

- `on_screen`: directly rendered by the current UI;
- `normal_inspection`: available through ordinary card/status/deck inspection;
- `count_only`: player can see a count but not ordering/content;
- `hidden`: unavailable through normal play and excluded.

## Source And Completeness

Every supported surface declares source categories and missing fields. A field
may come from:

- public game model used by the visible UI;
- rendered localized UI text;
- visible scene-tree control state;
- exact-version private binding for a fact the UI already renders.

Private binding does not change visibility. It is only an access mechanism.

If a required binding is missing, the surface becomes degraded and legal
actions are empty. Unknown values are omitted, never synthesized.

## Deck Enchant Selection

Allowed facts:

- localized prompt;
- visible candidate cards and card text;
- target enchantment identity, displayed title, dynamic description, and amount;
- min/max selection constraints driving the current UI;
- selected card instances;
- whether the UI is selecting or showing the final preview;
- enabled controls belonging to that exact stage.

The selection constraints and selected set require exact `v0.108.0` private
field bindings. The title/description prefer rendered UI text.

## Read-Only Deck And Pile Inspection

`run_deck` exposes the same card instances a player can inspect through
`NDeckViewScreen`, including upgrades and enchantments. `combat_piles` exposes
the contents shown by the draw, discard, and exhaust pile viewers. These facts
are evidence only: they add no action authority and never enter the command
ledger.

The game sorts the draw-pile viewer for presentation, so the bridge publishes
all three pile collections as unordered multisets. It never exposes underlying
draw order even though internal model access could reveal it. An inspection
timestamp is audit metadata and is excluded from client stale-state identity;
inspection content and state binding remain included.

## Explicit Exclusions

- draw-pile order;
- RNG seeds/state or future random outcomes;
- event outcomes not disclosed by current text;
- future map/reward contents;
- future enemy moves beyond displayed intent;
- internal AI/autoslay decisions;
- hidden multiplayer information;
- arbitrary model registries merely because they are loaded in memory.

## Mod And Update Handling

Custom gameplay mods may add visible semantics the bridge does not understand.
Until a mod-aware adapter identifies them, completeness is degraded and actions
fail closed. A new game build invalidates exact private bindings until audited.
