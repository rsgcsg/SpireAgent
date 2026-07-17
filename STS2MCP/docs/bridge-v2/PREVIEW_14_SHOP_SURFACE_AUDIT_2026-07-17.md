# Preview.14 Shop Surface Audit

Status date: 2026-07-17  
Protocol: `2.0-preview.14`  
Exact game identity: `v0.108.0|58694f64|-2044609792`

## Verdict

Preview.14 adds a source-audited and organically exercised normal singleplayer
merchant contract without introducing a universal purchase abstraction.
`shop` is the semantic Context. Input ownership is split between exactly one
of two Active Surfaces:

```text
shop + shop_room + bridge_advertised
shop + shop_inventory + bridge_advertised
```

`shop_inventory` owns typed card, relic, potion, and card-removal offers plus
the inventory Back control. `shop_room` owns only the merchant-open and Proceed
controls. Purchase and Proceed actions never coexist.

The normal merchant main lifecycle is qualified for the observed exact build:
open, close, reopen, one card purchase, sold-out post-state, and Proceed to map.
This does not claim organic qualification for every purchasable category or the
child deck-removal selector.

## Game-Fact Audit

Installed source and live UI agree on these boundaries:

- `MerchantRoom.GetLocalInventory()` owns the local player's exact inventory.
- `MerchantInventory` retains separate card, relic, potion, and optional card
  removal entries. Their shared base class does not make their effects or
  completion conditions interchangeable.
- `NMerchantInventory.IsOpen` determines whether inventory or room controls own
  input. Room Proceed is not advertised while inventory is open.
- `MerchantEntry.OnTryPurchaseWrapper` first rechecks stock and gold, awaits the
  subtype purchase, and only then clears or restocks the product and runs shop
  hooks.
- Cards add a concrete card instance to the run deck. Relics obtain a relic.
  Potions use `PotionCmd.TryToProcure` and can fail because capacity or hooks
  prohibit procurement.
- Card removal opens `CardSelectCmd.FromDeckForRemoval`; payment and removal
  complete only after that child selection resolves. It is not an immediate
  item purchase.

These facts reject both a single universal `purchase_shop_item` action and a
single shop Surface that mixes inventory and room controls.

## Player-Visible Contract

`ShopBridgeContext` exposes only shared current facts that remain valid while
the Active Surface changes:

- current gold;
- maximum potion slots;
- occupied potion instances with exact slot identity and visible semantics.

`shop_inventory` exposes each visible inventory entry with:

- stable entry, UI slot, and inventory-index identity;
- exact price;
- stock, visibility, affordability, action eligibility, and blocked reason as
  separate facts;
- card sale state and exact visible card semantics;
- relic or potion visible semantics;
- card-removal current price and next price increase.

`affordable=true` does not grant action authority. The same offer must also be
stocked, visible, UI-enabled, and category-valid. Potion actions additionally
require free capacity and `Hook.ShouldProcurePotion` approval.

Sold-out product payloads and an absent optional removal entry are omitted on
the C# wire because nulls are suppressed. Re-SpireAgent preview.14 treats those
omissions as absent semantics, not malformed state, while still requiring
stocked offers to expose their product.

## Action And Completion Matrix

| Surface | Action | Start revalidation | Completion evidence |
|---|---|---|---|
| `shop_room` | `open_shop_inventory` | exact room/inventory, visible enabled merchant button, inventory closed | inventory becomes open |
| `shop_room` | `proceed_shop` | exact room, inventory closed, visible enabled Proceed | room changes or map opens |
| `shop_inventory` | `purchase_shop_card` | exact room/inventory/entry/slot, stocked, affordable, visible, enabled | exact card product changes, valid child overlay opens, or room exits |
| `shop_inventory` | `purchase_shop_relic` | same typed relic checks | exact relic product changes, valid child overlay opens, or room exits |
| `shop_inventory` | `purchase_shop_potion` | same typed potion checks plus capacity/hook | exact potion product changes, valid child overlay opens, or room exits |
| `shop_inventory` | `open_shop_card_removal` | exact removal entry/slot, unused, affordable, visible, enabled | child selector opens, removal becomes used, or room exits |
| `shop_inventory` | `close_shop_inventory` | exact open inventory and live Back control | inventory becomes closed |

Commands still accept only opaque `action_id` plus exact `state_id`. Entry
indices are descriptive and never executable.

## Organic Evidence

The installed preview.14 DLL was loaded from Steam against the exact identity
above. A saved floor-9 merchant produced:

- 26 gold;
- seven cards, three relics, three potions, and one removal service;
- a full 2/2 potion belt;
- one affordable on-sale Armaments offer at 26 gold;
- all other entries visible but not actionable;
- removal visible at 100 gold and not actionable.

Observed lifecycle:

1. Saved-run restore exposed only `shop_room` actions: open inventory and
   Proceed.
2. `open_shop_inventory` completed with `shop_inventory_opened`.
3. Inventory exposed only `purchase_shop_card(Armaments)` and close.
4. Close and reopen both completed with their own state predicates.
5. Armaments purchase completed as confirmed. Gold changed 26 to 0; its exact
   offer became sold out and lost action authority.
6. State-bound run-deck inspection changed from 17 to 18 cards and contained
   the purchased Armaments instance.
7. Final close completed, then `proceed_shop` completed and the next Bridge
   state was `map + map_navigation` with no shop actions.

No command was rejected, failed, timed out, or outcome-unknown. State,
completeness, and diagnostic responses remained clean.

Re-SpireAgent strict organic inspection found and fixed two wire compatibility
bugs before any autonomous decision: nullable `blocked_reason` and sold-out
product fields are omitted by C# serialization. The strict client now accepts
omission only for those explicitly optional fields and preserves fail-closed
semantic checks.

## Qualification Matrix

| Shape | Source audit | Contract tests | Organic action | Qualification |
|---|---:|---:|---:|---|
| room open/close ownership | yes | yes | yes | qualified for observed normal merchant |
| card purchase and sold-out post-state | yes | yes | yes | qualified for observed ordinary card |
| Proceed to map | yes | yes | yes | qualified |
| relic purchase | yes | yes | no | implemented, organic category evidence pending |
| potion purchase with free capacity | yes | yes | no | implemented, organic category evidence pending |
| full-belt potion suppression | yes | yes | capacity visible; no affordable potion | implemented, isolated organic suppression pending |
| card-removal service launch | yes | yes | visible but unaffordable | implemented, organic launch pending |
| card-removal child selection and settlement | partial | no v2 child Surface | no | unsupported as an all-v2 journey |

## Architecture Assessment

The core abstraction remains healthy:

- Context is not a whole-state discriminator.
- Exactly one Surface owns input.
- Inspection remains read-only and cannot grant actions.
- Diagnostics and completeness remain separate from action authority.
- Typed category actions preserve differences that affect validation and
  completion without duplicating the entire shop implementation.

The main remaining debt is coverage, not a need for a universal UI model.
`NCardGridSelectionScreen` used by removal/upgrade/transform still requires its
own source-derived Surface family or deliberately concrete variants. It must
not be smuggled into `shop_inventory`. Relic and potion purchases also need
bounded organic category evidence before their observed shapes are called
qualified.

