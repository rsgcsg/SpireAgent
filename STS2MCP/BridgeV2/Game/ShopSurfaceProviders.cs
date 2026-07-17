using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Merchant;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.Helpers;
using MegaCrit.Sts2.Core.Hooks;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Nodes.Screens.Map;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Nodes.Screens.Shops;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// The open merchant inventory owns purchase and close controls. It is not the
/// same input surface as the surrounding merchant room, whose Proceed button
/// is disabled while the inventory is open.
/// </summary>
internal sealed class ShopInventorySurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "shop_inventory";

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Room;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!ShopSurfaceFacts.TryGetCurrent(out MerchantRoom? currentMerchantRoom, out NMerchantRoom? currentRoom, out MerchantInventory? currentInventory)
            || currentRoom == null
            || currentMerchantRoom == null
            || currentInventory == null
            || !currentRoom.Inventory.IsOpen)
        {
            return null;
        }

        return Build(currentMerchantRoom, currentRoom, currentInventory, entities, game);
    }

    private static BridgeObservationDraft Build(
        MerchantRoom merchantRoom,
        NMerchantRoom room,
        MerchantInventory inventory,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        NMerchantInventory inventoryUi = room.Inventory;
        MerchantEntry[] entries = inventory.AllEntries.ToArray();
        NMerchantSlot[] slots = inventoryUi.GetAllSlots().ToArray();
        var slotByEntry = new Dictionary<MerchantEntry, NMerchantSlot>();
        foreach (MerchantEntry entry in entries)
        {
            NMerchantSlot[] matches = slots.Where(slot => ReferenceEquals(slot.Entry, entry)).ToArray();
            if (matches.Length != 1)
                return BindingUnavailable(game, $"Merchant entry {entry.GetType().Name} does not have exactly one UI slot.");
            slotByEntry[entry] = matches[0];
        }

        NBackButton[] backButtons = McpMod.FindAll<NBackButton>(inventoryUi)
            .Where(McpMod.IsLiveNode)
            .ToArray();
        if (backButtons.Length != 1)
            return BindingUnavailable(game, "The open merchant inventory does not have exactly one live back button.");
        NBackButton backButton = backButtons[0];

        Player player = inventory.Player;
        int occupiedPotionSlots = ShopSurfaceFacts.OccupiedPotionSlots(player);
        bool potionSlotsFull = occupiedPotionSlots >= player.PotionSlots.Count;
        VisibleShopCardOffer[] cards = inventory.CardEntries.Select(entry =>
            BuildCardOffer(entry, slotByEntry[entry], Array.IndexOf(entries, entry), entities)).ToArray();
        VisibleShopRelicOffer[] relics = inventory.RelicEntries.Select(entry =>
            BuildRelicOffer(entry, slotByEntry[entry], Array.IndexOf(entries, entry), entities)).ToArray();
        VisibleShopPotionOffer[] potions = inventory.PotionEntries.Select(entry =>
            BuildPotionOffer(entry, slotByEntry[entry], Array.IndexOf(entries, entry), player, potionSlotsFull, entities)).ToArray();
        MerchantCardRemovalEntry? removalEntry = inventory.CardRemovalEntry;
        VisibleShopCardRemovalOffer? removal = removalEntry != null
            ? BuildRemovalOffer(
                removalEntry,
                slotByEntry[removalEntry],
                Array.IndexOf(entries, removalEntry),
                entities)
            : null;

        var actions = new List<BridgeActionDraft>();
        foreach (MerchantCardEntry entry in inventory.CardEntries.Where(entry =>
                     cards.Single(offer => offer.EntityId == entities.GetId(entry, "shop_entry")).CanPurchase))
        {
            VisibleShopCardOffer offer = cards.Single(candidate => candidate.EntityId == entities.GetId(entry, "shop_entry"));
            CardModel purchasedCard = entry.CreationResult!.Card;
            actions.Add(PurchaseAction(
                offer.EntityId,
                "purchase_shop_card",
                $"Buy {offer.Card?.Name ?? offer.Card?.DefinitionId ?? "card"} for {offer.Price} gold",
                "MerchantCardEntry.OnTryPurchaseWrapper+CardPileCmd.Add",
                merchantRoom,
                room,
                inventory,
                entry,
                slotByEntry[entry],
                () => !ReferenceEquals(entry.CreationResult?.Card, purchasedCard)));
        }
        foreach (MerchantRelicEntry entry in inventory.RelicEntries.Where(entry =>
                     relics.Single(offer => offer.EntityId == entities.GetId(entry, "shop_entry")).CanPurchase))
        {
            VisibleShopRelicOffer offer = relics.Single(candidate => candidate.EntityId == entities.GetId(entry, "shop_entry"));
            RelicModel purchasedRelic = entry.Model!;
            actions.Add(PurchaseAction(
                offer.EntityId,
                "purchase_shop_relic",
                $"Buy {offer.Relic?.Name ?? offer.Relic?.DefinitionId ?? "relic"} for {offer.Price} gold",
                "MerchantRelicEntry.OnTryPurchaseWrapper+RelicCmd.Obtain",
                merchantRoom,
                room,
                inventory,
                entry,
                slotByEntry[entry],
                () => !ReferenceEquals(entry.Model, purchasedRelic)));
        }
        foreach (MerchantPotionEntry entry in inventory.PotionEntries.Where(entry =>
                     potions.Single(offer => offer.EntityId == entities.GetId(entry, "shop_entry")).CanPurchase))
        {
            VisibleShopPotionOffer offer = potions.Single(candidate => candidate.EntityId == entities.GetId(entry, "shop_entry"));
            PotionModel purchasedPotion = entry.Model!;
            actions.Add(PurchaseAction(
                offer.EntityId,
                "purchase_shop_potion",
                $"Buy {offer.Name ?? offer.DefinitionId ?? "potion"} for {offer.Price} gold",
                "MerchantPotionEntry.OnTryPurchaseWrapper+PotionCmd.TryToProcure",
                merchantRoom,
                room,
                inventory,
                entry,
                slotByEntry[entry],
                () => !ReferenceEquals(entry.Model, purchasedPotion),
                () => ShopSurfaceFacts.CanProcurePotion(player, entry.Model)));
        }
        if (removalEntry != null && removal?.CanPurchase == true)
        {
            actions.Add(new BridgeActionDraft(
                $"open_shop_card_removal:{removal.EntityId}",
                "open_shop_card_removal",
                "selection",
                $"Choose a card to remove for {removal.Price} gold",
                "MerchantCardRemovalEntry.OnTryPurchaseWrapper+CardSelectCmd.FromDeckForRemoval",
                () => StartCardRemoval(merchantRoom, room, inventory, removalEntry, slotByEntry[removalEntry]),
                new[] { new ActionEntityBinding("shop_card_removal", removal.EntityId) }));
        }

        bool canClose = backButton.IsEnabled && McpMod.IsNodeVisible(backButton);
        if (canClose)
        {
            string screenId = entities.GetId(inventoryUi, "screen");
            actions.Add(new BridgeActionDraft(
                $"close_shop_inventory:{screenId}",
                "close_shop_inventory",
                "navigation",
                "Close shop inventory",
                "NMerchantInventory.BackButton+NBackButton.ForceClick",
                () => StartCloseInventory(merchantRoom, room, inventory, backButton),
                new[] { new ActionEntityBinding("screen", screenId) }));
        }

        var surface = new ShopInventorySurface(
            SurfaceKind,
            entities.GetId(inventoryUi, "screen"),
            cards,
            relics,
            potions,
            removal,
            canClose);
        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_visible_normal_merchant_inventory",
            actions.Count > 0
                ? "derived_from_exact_inventory_entries_ui_slots_capacity_and_back_control"
                : "temporarily_empty_while_merchant_inventory_settles",
            new[]
            {
                "MerchantRoom.GetLocalInventory",
                "MerchantInventory typed entries",
                "NMerchantInventory.GetAllSlots",
                "MerchantEntry.Cost+EnoughGold+IsStocked",
                "Player.PotionSlots+Hook.ShouldProcurePotion",
                "NMerchantInventory.BackButton"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            context = BridgeContextBuilder.BuildShop(merchantRoom, entities),
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            BridgeContextBuilder.BuildShop(merchantRoom, entities),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            actions);
    }

    private static VisibleShopCardOffer BuildCardOffer(
        MerchantCardEntry entry,
        NMerchantSlot slot,
        int inventoryIndex,
        BridgeEntityRegistry entities)
    {
        bool stocked = entry.IsStocked && entry.CreationResult?.Card != null;
        bool visible = McpMod.IsNodeVisible(slot);
        bool canPurchase = stocked && visible && entry.EnoughGold && slot.Hitbox.IsEnabled;
        return new VisibleShopCardOffer(
            entities.GetId(entry, "shop_entry"),
            entities.GetId(slot, "shop_slot"),
            inventoryIndex,
            entry.Cost,
            stocked,
            visible,
            entry.EnoughGold,
            canPurchase,
            ShopSurfaceFacts.BlockedReason(stocked, visible, entry.EnoughGold, canPurchase),
            entry.IsOnSale,
            stocked
                ? BridgeContextBuilder.BuildCard(
                    entry.CreationResult!.Card,
                    entities.GetId(entry.CreationResult.Card, "card"),
                    displayPile: PileType.None)
                : null);
    }

    private static VisibleShopRelicOffer BuildRelicOffer(
        MerchantRelicEntry entry,
        NMerchantSlot slot,
        int inventoryIndex,
        BridgeEntityRegistry entities)
    {
        bool stocked = entry.IsStocked && entry.Model != null;
        bool visible = McpMod.IsNodeVisible(slot);
        bool canPurchase = stocked && visible && entry.EnoughGold && slot.Hitbox.IsEnabled;
        VisibleRelic? relic = entry.Model is { } model
            ? new VisibleRelic(
                entities.GetId(model, "relic"),
                model.Id.Entry,
                McpMod.SafeGetText(() => model.Title),
                McpMod.SafeGetText(() => model.DynamicDescription),
                model.ShowCounter ? model.DisplayAmount : null)
            : null;
        return new VisibleShopRelicOffer(
            entities.GetId(entry, "shop_entry"),
            entities.GetId(slot, "shop_slot"),
            inventoryIndex,
            entry.Cost,
            stocked,
            visible,
            entry.EnoughGold,
            canPurchase,
            ShopSurfaceFacts.BlockedReason(stocked, visible, entry.EnoughGold, canPurchase),
            relic);
    }

    private static VisibleShopPotionOffer BuildPotionOffer(
        MerchantPotionEntry entry,
        NMerchantSlot slot,
        int inventoryIndex,
        Player player,
        bool potionSlotsFull,
        BridgeEntityRegistry entities)
    {
        bool stocked = entry.IsStocked && entry.Model != null;
        bool visible = McpMod.IsNodeVisible(slot);
        bool procurementAllowed = stocked && ShopSurfaceFacts.CanProcurePotion(player, entry.Model);
        bool canPurchase = stocked
                           && visible
                           && entry.EnoughGold
                           && slot.Hitbox.IsEnabled
                           && !potionSlotsFull
                           && procurementAllowed;
        string? blockedReason = !stocked ? "sold_out"
            : !visible ? "not_visible"
            : !entry.EnoughGold ? "insufficient_gold"
            : potionSlotsFull ? "potion_slots_full"
            : !procurementAllowed ? "potion_procurement_forbidden"
            : !canPurchase ? "ui_control_disabled"
            : null;
        PotionModel? potion = entry.Model;
        return new VisibleShopPotionOffer(
            entities.GetId(entry, "shop_entry"),
            entities.GetId(slot, "shop_slot"),
            inventoryIndex,
            entry.Cost,
            stocked,
            visible,
            entry.EnoughGold,
            canPurchase,
            blockedReason,
            potion?.Id.Entry,
            potion == null ? null : McpMod.SafeGetText(() => potion.Title),
            potion == null ? null : McpMod.SafeGetText(() => potion.DynamicDescription),
            potion?.Rarity.ToString());
    }

    private static VisibleShopCardRemovalOffer BuildRemovalOffer(
        MerchantCardRemovalEntry entry,
        NMerchantSlot slot,
        int inventoryIndex,
        BridgeEntityRegistry entities)
    {
        bool stocked = entry.IsStocked;
        bool visible = McpMod.IsNodeVisible(slot);
        bool canPurchase = stocked && visible && entry.EnoughGold && slot.Hitbox.IsEnabled;
        return new VisibleShopCardRemovalOffer(
            entities.GetId(entry, "shop_entry"),
            entities.GetId(slot, "shop_slot"),
            inventoryIndex,
            entry.Cost,
            MerchantCardRemovalEntry.PriceIncrease,
            stocked,
            visible,
            entry.EnoughGold,
            canPurchase,
            !stocked ? "already_used"
                : ShopSurfaceFacts.BlockedReason(stocked, visible, entry.EnoughGold, canPurchase));
    }

    private static BridgeActionDraft PurchaseAction(
        string offerId,
        string kind,
        string label,
        string evidence,
        MerchantRoom expectedMerchantRoom,
        NMerchantRoom expectedRoom,
        MerchantInventory expectedInventory,
        MerchantEntry expectedEntry,
        NMerchantSlot expectedSlot,
        Func<bool> productChanged,
        Func<bool>? extraValidator = null) =>
        new(
            $"{kind}:{offerId}",
            kind,
            "purchase",
            label,
            evidence,
            () => StartPurchase(
                expectedMerchantRoom,
                expectedRoom,
                expectedInventory,
                expectedEntry,
                expectedSlot,
                productChanged,
                extraValidator),
            new[] { new ActionEntityBinding("shop_offer", offerId) });

    private static BridgeActionStartResult StartPurchase(
        MerchantRoom expectedMerchantRoom,
        NMerchantRoom expectedRoom,
        MerchantInventory expectedInventory,
        MerchantEntry expectedEntry,
        NMerchantSlot expectedSlot,
        Func<bool> productChanged,
        Func<bool>? extraValidator)
    {
        if (!ShopSurfaceFacts.IsCurrentInventory(expectedMerchantRoom, expectedRoom, expectedInventory)
            || !ReferenceEquals(expectedSlot.Entry, expectedEntry)
            || !expectedEntry.IsStocked
            || !expectedEntry.EnoughGold
            || !McpMod.IsNodeVisible(expectedSlot)
            || !expectedSlot.Hitbox.IsEnabled
            || extraValidator?.Invoke() == false)
        {
            return BridgeActionStartResult.Rejected(
                "shop_offer_changed",
                "The advertised shop offer is no longer current and purchasable.");
        }

        TaskHelper.RunSafely(expectedEntry.OnTryPurchaseWrapper(expectedInventory));
        return BridgeActionStartResult.Started(
            () => productChanged()
                  || !ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedMerchantRoom)
                  || ActiveSurfaceResolver.IsVisibleActiveOverlay(NOverlayStack.Instance?.Peek()),
            "shop_product_changed_child_surface_opened_or_room_left",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartCardRemoval(
        MerchantRoom expectedMerchantRoom,
        NMerchantRoom expectedRoom,
        MerchantInventory expectedInventory,
        MerchantCardRemovalEntry expectedEntry,
        NMerchantSlot expectedSlot)
    {
        if (!ShopSurfaceFacts.IsCurrentInventory(expectedMerchantRoom, expectedRoom, expectedInventory)
            || !ReferenceEquals(expectedSlot.Entry, expectedEntry)
            || !expectedEntry.IsStocked
            || !expectedEntry.EnoughGold
            || !McpMod.IsNodeVisible(expectedSlot)
            || !expectedSlot.Hitbox.IsEnabled)
        {
            return BridgeActionStartResult.Rejected(
                "shop_card_removal_changed",
                "The advertised card-removal service is no longer current and purchasable.");
        }

        TaskHelper.RunSafely(expectedEntry.OnTryPurchaseWrapper(expectedInventory));
        return BridgeActionStartResult.Started(
            () => expectedEntry.Used
                  || ActiveSurfaceResolver.IsVisibleActiveOverlay(NOverlayStack.Instance?.Peek())
                  || !ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedMerchantRoom),
            "shop_card_removal_selector_opened_completed_or_room_left",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartCloseInventory(
        MerchantRoom expectedMerchantRoom,
        NMerchantRoom expectedRoom,
        MerchantInventory expectedInventory,
        NBackButton expectedBackButton)
    {
        if (!ShopSurfaceFacts.IsCurrentInventory(expectedMerchantRoom, expectedRoom, expectedInventory)
            || !expectedBackButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedBackButton))
        {
            return BridgeActionStartResult.Rejected(
                "shop_inventory_close_changed",
                "The advertised shop inventory close control is no longer current and enabled.");
        }

        expectedBackButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !expectedRoom.Inventory.IsOpen,
            "shop_inventory_closed");
    }

    private static BridgeObservationDraft BindingUnavailable(GameBuildIdentity game, string reason)
    {
        var context = new UnknownBridgeContext("unknown", nameof(MerchantRoom), reason);
        var surface = new UnsupportedSurface("unsupported", SurfaceKind, reason);
        var completeness = new StateCompleteness(
            "partial",
            "empty_fail_closed",
            new[] { "MerchantRoom+NMerchantInventory exact-version binding" },
            new[] { "shop_inventory", "legal_actions" });
        string signature = BridgeHash.Object(new { game.Version, reason });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            surface,
            completeness,
            game,
            new[] { "shop_inventory_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.shop_inventory.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}

/// <summary>
/// The merchant room owns opening the inventory and proceeding to the map only
/// after the inventory is closed. These actions never coexist with purchases.
/// </summary>
internal sealed class ShopRoomSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "shop_room";

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Room;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!ShopSurfaceFacts.TryGetCurrent(out MerchantRoom? merchantRoom, out NMerchantRoom? room, out MerchantInventory? inventory)
            || room == null
            || merchantRoom == null
            || inventory == null
            || room.Inventory.IsOpen)
        {
            return null;
        }

        string roomId = entities.GetId(room, "room");
        bool canOpen = room.MerchantButton.IsEnabled && McpMod.IsNodeVisible(room.MerchantButton);
        bool canProceed = room.ProceedButton.IsEnabled && McpMod.IsNodeVisible(room.ProceedButton);
        var actions = new List<BridgeActionDraft>();
        if (canOpen)
        {
            actions.Add(new BridgeActionDraft(
                $"open_shop_inventory:{roomId}",
                "open_shop_inventory",
                "navigation",
                "Open shop inventory",
                "NMerchantButton.ForceClick+NMerchantRoom.OpenInventory",
                () => StartOpenInventory(merchantRoom, room, inventory),
                new[] { new ActionEntityBinding("room", roomId) }));
        }
        if (canProceed)
        {
            actions.Add(new BridgeActionDraft(
                $"proceed_shop:{roomId}",
                "proceed_shop",
                "navigation",
                "Leave shop and open map",
                "NMerchantRoom.ProceedButton+NMapScreen.Open",
                () => StartProceed(merchantRoom, room),
                new[] { new ActionEntityBinding("room", roomId) }));
        }

        var surface = new ShopRoomSurface(SurfaceKind, roomId, canOpen, canProceed);
        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_visible_normal_merchant_room_controls",
            actions.Count > 0
                ? "derived_from_exact_merchant_and_proceed_controls"
                : "temporarily_empty_while_merchant_room_settles",
            new[]
            {
                "NMerchantRoom.MerchantButton",
                "NMerchantRoom.ProceedButton",
                "NMerchantInventory.IsOpen"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            context = BridgeContextBuilder.BuildShop(merchantRoom, entities),
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            BridgeContextBuilder.BuildShop(merchantRoom, entities),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            actions);
    }

    private static BridgeActionStartResult StartOpenInventory(
        MerchantRoom expectedMerchantRoom,
        NMerchantRoom expectedRoom,
        MerchantInventory expectedInventory)
    {
        if (!ShopSurfaceFacts.IsCurrentRoom(expectedMerchantRoom, expectedRoom, expectedInventory)
            || expectedRoom.Inventory.IsOpen
            || !expectedRoom.MerchantButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedRoom.MerchantButton))
        {
            return BridgeActionStartResult.Rejected(
                "shop_open_changed",
                "The advertised merchant control is no longer current and enabled.");
        }

        expectedRoom.MerchantButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => expectedRoom.Inventory.IsOpen,
            "shop_inventory_opened");
    }

    private static BridgeActionStartResult StartProceed(
        MerchantRoom expectedMerchantRoom,
        NMerchantRoom expectedRoom)
    {
        if (!ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedMerchantRoom)
            || !ReferenceEquals(NMerchantRoom.Instance, expectedRoom)
            || expectedRoom.Inventory.IsOpen
            || !expectedRoom.ProceedButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedRoom.ProceedButton))
        {
            return BridgeActionStartResult.Rejected(
                "shop_proceed_changed",
                "The advertised shop proceed control is no longer current and enabled.");
        }

        expectedRoom.ProceedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedMerchantRoom)
                  || NMapScreen.Instance?.IsOpen == true,
            "shop_room_left_or_map_opened",
            allowIntermediateStateChanges: true);
    }
}

internal static class ShopSurfaceFacts
{
    public static bool TryGetCurrent(
        out MerchantRoom? merchantRoom,
        out NMerchantRoom? room,
        out MerchantInventory? inventory)
    {
        merchantRoom = RunManager.Instance.DebugOnlyGetState()?.CurrentRoom as MerchantRoom;
        room = NMerchantRoom.Instance;
        inventory = merchantRoom?.GetLocalInventory();
        return merchantRoom != null
               && room != null
               && inventory != null
               && McpMod.IsLiveNode(room)
               && ReferenceEquals(room.Room, merchantRoom)
               && ReferenceEquals(room.Inventory.Inventory, inventory);
    }

    public static bool IsCurrentRoom(
        MerchantRoom merchantRoom,
        NMerchantRoom room,
        MerchantInventory inventory) =>
        IsCurrentMerchant(merchantRoom, room, inventory)
        && !ActiveSurfaceResolver.IsVisibleActiveOverlay(NOverlayStack.Instance?.Peek())
        && NMapScreen.Instance?.IsOpen != true;

    public static bool IsCurrentMerchant(
        MerchantRoom merchantRoom,
        NMerchantRoom room,
        MerchantInventory inventory) =>
        TryGetCurrent(out MerchantRoom? currentRoom, out NMerchantRoom? currentUi, out MerchantInventory? currentInventory)
        && ReferenceEquals(currentRoom, merchantRoom)
        && ReferenceEquals(currentUi, room)
        && ReferenceEquals(currentInventory, inventory);

    public static bool IsCurrentInventory(
        MerchantRoom merchantRoom,
        NMerchantRoom room,
        MerchantInventory inventory) =>
        IsCurrentRoom(merchantRoom, room, inventory)
        && room.Inventory.IsOpen
        && McpMod.IsNodeVisible(room.Inventory);

    public static int OccupiedPotionSlots(Player player)
    {
        int occupied = 0;
        for (int slot = 0; slot < player.PotionSlots.Count; slot++)
        {
            if (player.GetPotionAtSlotIndex(slot) != null)
                occupied++;
        }
        return occupied;
    }

    public static bool CanProcurePotion(Player player, PotionModel? potion) =>
        potion != null
        && OccupiedPotionSlots(player) < player.PotionSlots.Count
        && Hook.ShouldProcurePotion(player.RunState, player.Creature.CombatState, potion, player);

    public static string? BlockedReason(bool stocked, bool visible, bool affordable, bool canPurchase) =>
        !stocked ? "sold_out"
            : !visible ? "not_visible"
            : !affordable ? "insufficient_gold"
            : !canPurchase ? "ui_control_disabled"
            : null;
}
