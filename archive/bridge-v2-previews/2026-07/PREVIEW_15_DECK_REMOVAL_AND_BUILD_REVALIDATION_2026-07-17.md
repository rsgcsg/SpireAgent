# Preview.15 Merchant Removal And Build Revalidation

Status date: 2026-07-17  
Protocol: `2.0-preview.15`

> Historical implementation note. Preview.16 supersedes its current-build
> compatibility statement with an exact, non-executable v0.109 candidate
> observation gate. See
> [Preview.16 candidate observation audit](PREVIEW_16_CANDIDATE_OBSERVATION_GATE_2026-07-17.md).

## Verdict

Preview.15 implements a narrow `deck_removal_selection` contract for the
merchant's child `NDeckCardSelectScreen`. It is not a universal deck selector.
The code and contract tests are complete, but runtime qualification is blocked:
Steam updated the installed game from the historically qualified
`v0.108.0|58694f64|-2044609792` to
`v0.109.0|c12f634d|-840572606`.

Bridge v2 therefore disables all actions and state-bound inspections on the
current build. No new-build deletion, legacy fallback action, or inspection was
used to claim qualification.

## Why The Surface Is Narrow

Installed API documentation identifies `CardSelectCmd.FromDeckForRemoval` as
the merchant-style deck-removal flow and describes `NDeckCardSelectScreen` as
the composition-changing selector with an extra confirmation stage. The
merchant parent and this child have a coherent lifecycle:

```text
shop_inventory open_card_removal
  -> shop + deck_removal_selection(selecting)
  -> select card
  -> preview
  -> confirm removal or cancel
  -> shop_inventory post-state
```

Upgrade, transform, and enchantment have distinct gameplay effects and UI
semantics. They remain separate contracts; the protocol does not infer purpose
from English prompt text.

## Selection Overlap Is Not Surface Equivalence

`deck_removal_selection` and `deck_enchant_selection` share a *selection
grammar*: both render a card grid, expose a selected set and min/max bounds,
and may move through selecting and preview stages. That overlap can justify
future non-executable helpers for selected-card projection, selection-bound
validation, or lifecycle test fixtures.

It must not justify a shared Surface or action contract. Enchantment is owned
by `NDeckEnchantSelectScreen`, requires visible enchantment semantics, filters
cards through `CanEnchant`, and commits a different game effect. Merchant
removal is owned by `ShopBridgeContext + NDeckCardSelectScreen`, uses the
merchant removal command and its own controls, and must prove removal-specific
post-state. A generic `deck_selection` surface would lose the purpose required
for safe candidate generation, action validation, and completion evidence.

The same rule applies to future upgrade and transform flows even if they use
`NDeckCardSelectScreen`: repeated source and runtime evidence may justify a
shared internal selection-lifecycle helper, but each effect remains a distinct
active Surface until its input ownership, visible semantics, execution path,
and post-state have been qualified.

## Contract

The provider requires all of the following:

- exact `ShopBridgeContext` while `NDeckCardSelectScreen` is the visible active
  overlay;
- exact-version `_prefs` and `_selectedCards` bindings;
- visible, player-rendered `NGridCardHolder` cards and selected membership;
- current main/preview confirmation and cancel controls;
- opaque action IDs bound to actual visible card or screen identities.

It publishes only `toggle_deck_removal_card`, `preview_deck_removal`,
`confirm_deck_removal`, `cancel_deck_removal_preview`, and
`cancel_deck_removal_selection`. A missing binding, missing visible prompt, or
stage/control mismatch suppresses every action.

## Verification Performed

- `dotnet build -c Release` against current v0.109 public assemblies: passed.
- Bridge contract tests: `43/43` passed.
- Re-SpireAgent strict decoder, projection, wrong-context, and stage tests:
  `110/110` passed.
- Preview.15 initially reported the new build as untested with
  `action_execution_allowed=false`. Preview.16 retains that execution denial
  and adds only the separate candidate-observation behavior documented above.

Compilation proves public API compatibility only. It does not qualify private
reflection fields, scene paths, visible controls, completion predicates, or
player-visible semantics on v0.109.

## Required Revalidation Before Any Execution

1. Audit v0.109 identity and the private `NDeckCardSelectScreen` bindings.
2. Read a natural merchant removal child and verify context, prompt, card grid,
   limits, controls, and action list without execution.
3. Execute one state-bound select, observe selecting/preview transition, then
   verify cancel in a separate journey.
4. Execute one state-bound select/preview/confirm journey and verify exact card
   removal, gold/service post-state, and no stale shop action.
5. Requalify the affected shared prior surfaces separately; no historical
   v0.108 evidence automatically carries forward.
