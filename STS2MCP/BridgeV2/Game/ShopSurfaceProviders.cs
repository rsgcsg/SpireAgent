using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Merchant;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.Helpers;
using MegaCrit.Sts2.Core.Hooks;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Nodes.Screens;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Map;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Nodes.Screens.ScreenContext;
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
    internal const string CardPurchaseCompletionWitness =
        "shop_card_purchase_committed_with_exact_card_gold_and_entry_witness";
    internal const string PotionPurchaseCompletionWitness =
        "shop_potion_purchase_committed_with_exact_slot_gold_and_entry_witness";
    internal const string RelicPurchaseCompletionWitness =
        "shop_relic_purchase_committed_or_linked_reward_handoff_observed";
    internal const string CardRemovalHandoffCompletionWitness =
        "shop_card_removal_selector_opened_or_removal_completed";
    internal const string CloseInventoryCompletionWitness =
        "shop_inventory_closed";

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
        bool inputReady = ActiveScreenContext.Instance.IsCurrent(inventoryUi)
                          && backButton.IsEnabled
                          && McpMod.IsNodeVisible(backButton);

        Player player = inventory.Player;
        int occupiedPotionSlots = ShopSurfaceFacts.OccupiedPotionSlots(player);
        bool potionSlotsFull = occupiedPotionSlots >= player.PotionSlots.Count;
        VisibleShopCardOffer[] cards = inventory.CardEntries.Select(entry =>
            BuildCardOffer(entry, slotByEntry[entry], Array.IndexOf(entries, entry), inputReady, entities)).ToArray();
        VisibleShopRelicOffer[] relics = inventory.RelicEntries.Select(entry =>
            BuildRelicOffer(entry, slotByEntry[entry], Array.IndexOf(entries, entry), inputReady, entities)).ToArray();
        VisibleShopPotionOffer[] potions = inventory.PotionEntries.Select(entry =>
            BuildPotionOffer(entry, slotByEntry[entry], Array.IndexOf(entries, entry), player, potionSlotsFull, inputReady, entities)).ToArray();
        MerchantCardRemovalEntry? removalEntry = inventory.CardRemovalEntry;
        VisibleShopCardRemovalOffer? removal = removalEntry != null
            ? BuildRemovalOffer(
                removalEntry,
                slotByEntry[removalEntry],
                Array.IndexOf(entries, removalEntry),
                inputReady,
                entities)
            : null;

        bool canClose = inputReady;
        var surface = new ShopInventorySurface(
            SurfaceKind,
            entities.GetId(inventoryUi, "screen"),
            cards,
            relics,
            potions,
            removal,
            canClose);
        bool hasActionableControl = canClose
            || cards.Any(offer => offer.CanPurchase)
            || relics.Any(offer => offer.CanPurchase)
            || potions.Any(offer => offer.CanPurchase)
            || removal?.CanPurchase == true;
        string readiness = hasActionableControl ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_visible_normal_merchant_inventory",
            hasActionableControl
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
            surface
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            BridgeContextBuilder.BuildShop(merchantRoom, entities),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            Array.Empty<BridgeActionDraft>());
    }

    internal static VisibleShopCardOffer BuildCardOffer(
        MerchantCardEntry entry,
        NMerchantSlot slot,
        int inventoryIndex,
        bool inputReady,
        BridgeEntityRegistry entities)
    {
        bool stocked = entry.IsStocked && entry.CreationResult?.Card != null;
        bool visible = McpMod.IsNodeVisible(slot);
        bool canPurchase = stocked && visible && inputReady && entry.EnoughGold && slot.Hitbox.IsEnabled;
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

    internal static VisibleShopRelicOffer BuildRelicOffer(
        MerchantRelicEntry entry,
        NMerchantSlot slot,
        int inventoryIndex,
        bool inputReady,
        BridgeEntityRegistry entities)
    {
        bool stocked = entry.IsStocked && entry.Model != null;
        bool visible = McpMod.IsNodeVisible(slot);
        bool canPurchase = stocked && visible && inputReady && entry.EnoughGold && slot.Hitbox.IsEnabled;
        VisibleRelic? relic = entry.Model is { } model
            ? BridgeVisibleEntityFacts.BuildRelic(model, entities)
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

    internal static VisibleShopPotionOffer BuildPotionOffer(
        MerchantPotionEntry entry,
        NMerchantSlot slot,
        int inventoryIndex,
        Player player,
        bool potionSlotsFull,
        bool inputReady,
        BridgeEntityRegistry entities)
    {
        bool stocked = entry.IsStocked && entry.Model != null;
        bool visible = McpMod.IsNodeVisible(slot);
        bool procurementAllowed = stocked && ShopSurfaceFacts.CanProcurePotion(player, entry.Model);
        bool canPurchase = stocked
                           && visible
                           && inputReady
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

    internal static VisibleShopCardRemovalOffer BuildRemovalOffer(
        MerchantCardRemovalEntry entry,
        NMerchantSlot slot,
        int inventoryIndex,
        bool inputReady,
        BridgeEntityRegistry entities)
    {
        bool stocked = entry.IsStocked;
        bool visible = McpMod.IsNodeVisible(slot);
        bool canPurchase = stocked && visible && inputReady && entry.EnoughGold && slot.Hitbox.IsEnabled;
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

    private static BridgeActionStartResult StartPurchase(
        MerchantRoom expectedMerchantRoom,
        NMerchantRoom expectedRoom,
        MerchantInventory expectedInventory,
        MerchantEntry expectedEntry,
        NMerchantSlot expectedSlot,
        int expectedPrice,
        Func<bool> productAcquired,
        Func<bool> entryAdvanced,
        Func<bool> productAbsentBeforePurchase,
        Func<bool>? extraValidator,
        Func<bool>? nativeContinuationVisible,
        string completionEvidence)
    {
        if (!ShopSurfaceFacts.IsCurrentInventory(expectedMerchantRoom, expectedRoom, expectedInventory)
            || !ReferenceEquals(expectedSlot.Entry, expectedEntry)
            || !expectedEntry.IsStocked
            || !expectedEntry.EnoughGold
            || expectedEntry.Cost != expectedPrice
            || !McpMod.IsNodeVisible(expectedSlot)
            || !expectedSlot.Hitbox.IsEnabled
            || !productAbsentBeforePurchase()
            || extraValidator?.Invoke() == false)
        {
            return BridgeActionStartResult.Rejected(
                "shop_offer_changed",
                "The advertised shop offer is no longer current and purchasable.");
        }

        int goldBeforePurchase = expectedInventory.Player.Gold;
        Task<bool> purchaseTask;
        try
        {
            purchaseTask = expectedEntry.OnTryPurchaseWrapper(expectedInventory);
        }
        catch (Exception)
        {
            return BridgeActionStartResult.Rejected(
                "shop_purchase_start_failed",
                "The exact merchant purchase command could not be started.");
        }

        return BridgeActionStartResult.Started(
            () => ShopPurchaseCompletionWitness.IsComplete(
                purchaseTask.IsCompleted,
                purchaseTask.IsCompletedSuccessfully,
                purchaseTask.IsCompletedSuccessfully && purchaseTask.Result,
                goldBeforePurchase,
                expectedInventory.Player.Gold,
                expectedPrice,
                productAcquired(),
                entryAdvanced(),
                HasVisibleLinkedRewardContinuation(),
                nativeContinuationVisible?.Invoke() == true),
            completionEvidence,
            allowIntermediateStateChanges: true,
            completionBoundary: "native_commit_observed");
    }

    private static bool HasVisibleLinkedRewardContinuation() =>
        NOverlayStack.Instance?.Peek() is NRewardsScreen rewards
        && ActiveSurfaceResolver.IsVisibleActiveOverlay(rewards);

    private static bool HasExactRelicAcquisitionContinuation(RelicModel expectedRelic) =>
        NOverlayStack.Instance?.Peek() is NDeckEnchantSelectScreen enchantScreen
        && DeckEnchantSurfaceProvider.IsKifudaContinuation(enchantScreen, expectedRelic);

    private static BridgeActionStartResult StartCardRemoval(
        MerchantRoom expectedMerchantRoom,
        NMerchantRoom expectedRoom,
        MerchantInventory expectedInventory,
        MerchantCardRemovalEntry expectedEntry,
        NMerchantSlot expectedSlot,
        int expectedPrice)
    {
        if (!ShopSurfaceFacts.IsCurrentInventory(expectedMerchantRoom, expectedRoom, expectedInventory)
            || !ReferenceEquals(expectedSlot.Entry, expectedEntry)
            || !expectedEntry.IsStocked
            || !expectedEntry.EnoughGold
            || expectedEntry.Cost != expectedPrice
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
                  || (NOverlayStack.Instance?.Peek() is NDeckCardSelectScreen
                      && ShopSurfaceFacts.IsCurrentMerchant(
                          expectedMerchantRoom,
                          expectedRoom,
                          expectedInventory)),
            CardRemovalHandoffCompletionWitness,
            allowIntermediateStateChanges: true,
            completionBoundary: "continuation_handoff_observed");
    }

    internal static BridgeActionStartResult StartCardPurchase(
        BridgeEntityRegistry entities,
        string expectedScreenId,
        string expectedOfferId,
        int expectedPrice)
    {
        NativeOfferBinding<MerchantCardEntry>? binding =
            ResolveNativeOffer<MerchantCardEntry>(
                entities,
                expectedScreenId,
                expectedOfferId);
        if (binding?.Entry.CreationResult?.Card is not { } card)
        {
            return NativeOfferRejected();
        }
        return StartPurchase(
            binding.MerchantRoom,
            binding.Room,
            binding.Inventory,
            binding.Entry,
            binding.Slot,
            expectedPrice,
            () => binding.Inventory.Player.Deck.Cards.Any(value => ReferenceEquals(value, card)),
            () => !ReferenceEquals(binding.Entry.CreationResult?.Card, card),
            () => binding.Inventory.Player.Deck.Cards.All(value => !ReferenceEquals(value, card)),
            null,
            null,
            CardPurchaseCompletionWitness);
    }

    internal static BridgeActionStartResult StartRelicPurchase(
        BridgeEntityRegistry entities,
        string expectedScreenId,
        string expectedOfferId,
        int expectedPrice)
    {
        NativeOfferBinding<MerchantRelicEntry>? binding =
            ResolveNativeOffer<MerchantRelicEntry>(
                entities,
                expectedScreenId,
                expectedOfferId);
        if (binding?.Entry.Model is not { } relic)
        {
            return NativeOfferRejected();
        }
        return StartPurchase(
            binding.MerchantRoom,
            binding.Room,
            binding.Inventory,
            binding.Entry,
            binding.Slot,
            expectedPrice,
            () => binding.Inventory.Player.Relics.Any(value => ReferenceEquals(value, relic)),
            () => !ReferenceEquals(binding.Entry.Model, relic),
            () => binding.Inventory.Player.Relics.All(value => !ReferenceEquals(value, relic)),
            null,
            () => HasExactRelicAcquisitionContinuation(relic),
            RelicPurchaseCompletionWitness);
    }

    internal static BridgeActionStartResult StartPotionPurchase(
        BridgeEntityRegistry entities,
        string expectedScreenId,
        string expectedOfferId,
        int expectedPrice)
    {
        NativeOfferBinding<MerchantPotionEntry>? binding =
            ResolveNativeOffer<MerchantPotionEntry>(
                entities,
                expectedScreenId,
                expectedOfferId);
        if (binding?.Entry.Model is not { } potion)
        {
            return NativeOfferRejected();
        }
        return StartPurchase(
            binding.MerchantRoom,
            binding.Room,
            binding.Inventory,
            binding.Entry,
            binding.Slot,
            expectedPrice,
            () => ShopSurfaceFacts.ContainsPotionInstance(binding.Inventory.Player, potion),
            () => !ReferenceEquals(binding.Entry.Model, potion),
            () => !ShopSurfaceFacts.ContainsPotionInstance(binding.Inventory.Player, potion),
            () => ShopSurfaceFacts.CanProcurePotion(binding.Inventory.Player, potion),
            null,
            PotionPurchaseCompletionWitness);
    }

    internal static BridgeActionStartResult StartCardRemoval(
        BridgeEntityRegistry entities,
        string expectedScreenId,
        string expectedOfferId,
        int expectedPrice)
    {
        NativeOfferBinding<MerchantCardRemovalEntry>? binding =
            ResolveNativeOffer<MerchantCardRemovalEntry>(
                entities,
                expectedScreenId,
                expectedOfferId);
        if (binding == null)
        {
            return NativeOfferRejected();
        }
        return StartCardRemoval(
            binding.MerchantRoom,
            binding.Room,
            binding.Inventory,
            binding.Entry,
            binding.Slot,
            expectedPrice);
    }

    internal static BridgeActionStartResult StartCloseInventory(
        BridgeEntityRegistry entities,
        string expectedScreenId)
    {
        if (!ShopSurfaceFacts.TryGetCurrent(
                out MerchantRoom? merchantRoom,
                out NMerchantRoom? room,
                out MerchantInventory? inventory)
            || merchantRoom == null
            || room == null
            || inventory == null
            || !entities.TryResolve(
                expectedScreenId,
                out NMerchantInventory? inventoryUi)
            || inventoryUi == null
            || !ReferenceEquals(inventoryUi, room.Inventory))
        {
            return BridgeActionStartResult.Rejected(
                "shop_inventory_binding_changed",
                "The exact merchant inventory is no longer current.");
        }
        NBackButton[] backButtons = McpMod.FindAll<NBackButton>(inventoryUi)
            .Where(McpMod.IsLiveNode)
            .ToArray();
        return backButtons.Length == 1
            ? StartCloseInventory(
                merchantRoom,
                room,
                inventory,
                backButtons[0])
            : BridgeActionStartResult.Rejected(
                "shop_inventory_binding_changed",
                "The exact merchant inventory close control is unavailable.");
    }

    private sealed record NativeOfferBinding<TEntry>(
        MerchantRoom MerchantRoom,
        NMerchantRoom Room,
        MerchantInventory Inventory,
        TEntry Entry,
        NMerchantSlot Slot)
        where TEntry : MerchantEntry;

    private static NativeOfferBinding<TEntry>? ResolveNativeOffer<TEntry>(
        BridgeEntityRegistry entities,
        string expectedScreenId,
        string expectedOfferId)
        where TEntry : MerchantEntry
    {
        if (!ShopSurfaceFacts.TryGetCurrent(
                out MerchantRoom? merchantRoom,
                out NMerchantRoom? room,
                out MerchantInventory? inventory)
            || merchantRoom == null
            || room == null
            || inventory == null
            || !ShopSurfaceFacts.IsCurrentInventory(merchantRoom, room, inventory)
            || !entities.TryResolve(
                expectedScreenId,
                out NMerchantInventory? inventoryUi)
            || inventoryUi == null
            || !ReferenceEquals(inventoryUi, room.Inventory)
            || !entities.TryResolve(expectedOfferId, out TEntry? entry)
            || entry == null
            || !inventory.AllEntries.Any(value => ReferenceEquals(value, entry)))
        {
            return null;
        }

        NMerchantSlot[] matches = inventoryUi.GetAllSlots()
            .Where(value => ReferenceEquals(value.Entry, entry))
            .ToArray();
        if (matches.Length != 1)
            return null;
        return new NativeOfferBinding<TEntry>(
            merchantRoom,
            room,
            inventory,
            entry,
            matches[0]);
    }

    private static BridgeActionStartResult NativeOfferRejected() =>
        BridgeActionStartResult.Rejected(
            "shop_offer_changed",
            "The exact merchant offer is no longer current and purchasable.");

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
            CloseInventoryCompletionWitness);
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
    internal const string OpenInventoryCompletionWitness =
        "shop_inventory_opened";
    internal const string ProceedCompletionWitness =
        "shop_room_left_or_map_opened";

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
        var surface = new ShopRoomSurface(SurfaceKind, roomId, canOpen, canProceed);
        bool hasActionableControl = canOpen || canProceed;
        string readiness = hasActionableControl ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_visible_normal_merchant_room_controls",
            hasActionableControl
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
            surface
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            BridgeContextBuilder.BuildShop(merchantRoom, entities),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            Array.Empty<BridgeActionDraft>());
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
            OpenInventoryCompletionWitness);
    }

    internal static BridgeActionStartResult StartOpenInventory(
        BridgeEntityRegistry entities,
        string expectedRoomId)
    {
        if (!ShopSurfaceFacts.TryGetCurrent(
                out MerchantRoom? merchantRoom,
                out NMerchantRoom? room,
                out MerchantInventory? inventory)
            || merchantRoom == null
            || room == null
            || inventory == null
            || !string.Equals(
                entities.GetId(room, "room"),
                expectedRoomId,
                StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "shop_room_binding_changed",
                "The exact merchant room is no longer current.");
        }
        return StartOpenInventory(merchantRoom, room, inventory);
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
            ProceedCompletionWitness,
            allowIntermediateStateChanges: true);
    }

    internal static BridgeActionStartResult StartProceed(
        BridgeEntityRegistry entities,
        string expectedRoomId)
    {
        if (!ShopSurfaceFacts.TryGetCurrent(
                out MerchantRoom? merchantRoom,
                out NMerchantRoom? room,
                out MerchantInventory? inventory)
            || merchantRoom == null
            || room == null
            || inventory == null
            || !string.Equals(
                entities.GetId(room, "room"),
                expectedRoomId,
                StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "shop_room_binding_changed",
                "The exact merchant room is no longer current.");
        }
        return StartProceed(merchantRoom, room);
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
        && ActiveScreenContext.Instance.IsCurrent(room)
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
        IsCurrentMerchant(merchantRoom, room, inventory)
        && !ActiveSurfaceResolver.IsVisibleActiveOverlay(NOverlayStack.Instance?.Peek())
        && room.Inventory.IsOpen
        && ActiveScreenContext.Instance.IsCurrent(room.Inventory)
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

    public static bool ContainsPotionInstance(Player player, PotionModel expectedPotion)
    {
        for (int slot = 0; slot < player.PotionSlots.Count; slot++)
        {
            if (ReferenceEquals(player.GetPotionAtSlotIndex(slot), expectedPotion))
                return true;
        }
        return false;
    }

    public static string? BlockedReason(bool stocked, bool visible, bool affordable, bool canPurchase) =>
        !stocked ? "sold_out"
            : !visible ? "not_visible"
            : !affordable ? "insufficient_gold"
            : !canPurchase ? "ui_control_disabled"
            : null;
}

internal static class ShopPurchaseCompletionWitness
{
    public static bool IsComplete(
        bool taskCompleted,
        bool taskCompletedSuccessfully,
        bool purchaseSucceeded,
        int goldBeforePurchase,
        int currentGold,
        int expectedPrice,
        bool productAcquired,
        bool entryAdvanced,
        bool linkedRewardContinuationVisible,
        bool nativeContinuationVisible = false) =>
        ((taskCompletedSuccessfully && purchaseSucceeded && entryAdvanced)
         || (!taskCompleted && linkedRewardContinuationVisible)
         || (!taskCompleted && nativeContinuationVisible))
        && expectedPrice >= 0
        && currentGold == goldBeforePurchase - expectedPrice
        && productAcquired;
}
