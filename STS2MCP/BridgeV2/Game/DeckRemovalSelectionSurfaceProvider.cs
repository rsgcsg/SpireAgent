using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.CardSelection;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Merchant;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rooms;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact-build child adapter for MerchantCardRemovalEntry ->
/// CardSelectCmd.FromDeckForRemoval. It intentionally owns only the merchant
/// removal journey: upgrade, transform, enchant, and unrelated deck screens
/// have different effects and must receive their own evidence-backed adapters.
/// </summary>
internal sealed class DeckRemovalSelectionSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "deck_removal_selection";
    private const string ReflectionEvidence =
        "sts2-v0.108.0:cached_reflection:NDeckCardSelectScreen._prefs+_selectedCards+preview_controls";
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;

    private static readonly FieldInfo? ClickableField =
        typeof(NCardHolder).GetField("_isClickable", Flags);

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NDeckCardSelectScreen screen)
            return null;

        IBridgeContext context = BridgeContextBuilder.Build(entities);
        // FromDeckForRemoval is the only observed NDeckCardSelectScreen path in
        // a normal merchant room for this exact build. Require that parent
        // context rather than inferring purpose from localized prompt text.
        if (context is not ShopBridgeContext)
            return null;

        if (!ShopSurfaceFacts.TryGetCurrent(
                out MerchantRoom? merchantRoom,
                out NMerchantRoom? room,
                out MerchantInventory? inventory)
            || merchantRoom == null
            || room == null
            || inventory == null
            || inventory.CardRemovalEntry is not { } removalEntry
            || !room.Inventory.IsOpen)
        {
            return BindingUnavailable(
                game,
                context,
                "The active selector is not bound to one current merchant card-removal transaction.",
                new[] { "merchant_transaction", "legal_actions" });
        }

        var transaction = new MerchantRemovalTransaction(
            merchantRoom,
            room,
            inventory,
            removalEntry,
            inventory.Player);
        return Build(screen, context, transaction, entities, game);
    }

    private static BridgeObservationDraft Build(
        NDeckCardSelectScreen screen,
        IBridgeContext context,
        MerchantRemovalTransaction transaction,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!TryReadBinding(screen, out Binding? binding, out string? bindingError)
            || ClickableField == null)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError ?? "The exact merchant deck-removal binding is unavailable.",
                new[] { "selection_constraints", "selected_cards", "legal_actions" });
        }

        Binding exactBinding = binding!;
        string? prompt = ReadNodeText(screen, "%InfoLabel")
                         ?? ReadNodeText(screen, "%BottomLabel");
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return BindingUnavailable(
                game,
                context,
                "The player-visible merchant removal prompt is unavailable.",
                new[] { "prompt", "legal_actions" });
        }

        string stage = IsPreviewVisible(screen) ? "preview" : "selecting";
        IReadOnlyList<NGridCardHolder> holders = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .ToArray();
        HashSet<CardModel> selectedCards = exactBinding.SelectedCards.ToHashSet();
        var cardIds = new Dictionary<CardModel, string>();
        var cards = new List<VisibleCard>(holders.Count);
        foreach (NGridCardHolder holder in holders)
        {
            CardModel card = holder.CardModel;
            string cardId = entities.GetId(card, "card");
            cardIds[card] = cardId;
            cards.Add(BridgeContextBuilder.BuildCard(
                card,
                cardId,
                selectedCards.Contains(card),
                displayPile: PileType.Deck));
        }

        string[] selectedIds = selectedCards
            .Select(card => cardIds.TryGetValue(card, out string? id) ? id : null)
            .Where(id => id != null)
            .Cast<string>()
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToArray();
        if (selectedIds.Length != selectedCards.Count)
        {
            return BindingUnavailable(
                game,
                context,
                "A selected removal card is absent from the visible grid.",
                new[] { "selected_cards", "legal_actions" });
        }

        var surface = new DeckRemovalSelectionSurface(
            SurfaceKind,
            stage,
            entities.GetId(screen, "screen"),
            prompt,
            exactBinding.Preferences.MinSelect,
            exactBinding.Preferences.MaxSelect,
            selectedCards.Count,
            selectedIds,
            exactBinding.Preferences.Cancelable,
            cards);
        List<BridgeActionDraft> actions = BuildActions(
            screen,
            exactBinding,
            stage,
            holders,
            selectedCards,
            cardIds,
            transaction);

        bool cancelBindingMissing = exactBinding.Preferences.Cancelable
                                    && stage == "selecting"
                                    && FindControl<NBackButton>(screen, "_closeButton") == null;
        if (cancelBindingMissing)
        {
            return BindingUnavailable(
                game,
                context,
                "Merchant removal is cancelable but its exact close control is unavailable.",
                new[] { "cancel_action", "legal_actions" });
        }

        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_merchant_deck_removal_selection",
            actions.Count > 0
                ? "derived_from_exact_visible_grid_and_current_controls"
                : "temporarily_empty_while_selection_completes_or_settles",
            new[]
            {
                "MerchantCardRemovalEntry -> CardSelectCmd.FromDeckForRemoval",
                "NDeckCardSelectScreen visible overlay",
                "NCardGrid visible holders",
                "NCardHolder._isClickable exact-version binding",
                ReflectionEvidence
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            context,
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            context,
            surface,
            completeness,
            game,
            new[]
            {
                "This adapter is limited to the observed merchant removal child and does not generalize other deck selection effects."
            },
            actions);
    }

    private static List<BridgeActionDraft> BuildActions(
        NDeckCardSelectScreen screen,
        Binding binding,
        string stage,
        IReadOnlyList<NGridCardHolder> holders,
        HashSet<CardModel> selectedCards,
        IReadOnlyDictionary<CardModel, string> cardIds,
        MerchantRemovalTransaction transaction)
    {
        var actions = new List<BridgeActionDraft>();
        if (stage == "selecting")
        {
            foreach (NGridCardHolder holder in holders.Where(IsHolderClickable))
            {
                CardModel card = holder.CardModel;
                bool selected = selectedCards.Contains(card);
                if (!selected && selectedCards.Count >= binding.Preferences.MaxSelect)
                    continue;

                string cardId = cardIds[card];
                string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
                actions.Add(new BridgeActionDraft(
                    $"toggle_deck_removal_card:{cardId}:{selected}",
                    "toggle_deck_removal_card",
                    "selection",
                    selected ? $"Deselect {cardName}" : $"Select {cardName} to remove",
                    "NCardGrid.HolderPressed+NDeckCardSelectScreen selection",
                    () => StartToggleCard(screen, card, selected),
                    new[] { new ActionEntityBinding("card", cardId) }));
            }

            NConfirmButton? preview = FindControl<NConfirmButton>(screen, "_confirmButton");
            if (preview is { IsEnabled: true } && McpMod.IsNodeVisible(preview))
            {
                actions.Add(new BridgeActionDraft(
                    "preview_deck_removal",
                    "preview_deck_removal",
                    "preview",
                    "Preview removal of the selected card",
                    "NDeckCardSelectScreen._confirmButton",
                    () => StartPreview(screen)));
            }

            NBackButton? close = FindControl<NBackButton>(screen, "_closeButton");
            if (binding.Preferences.Cancelable && close is { IsEnabled: true } && McpMod.IsNodeVisible(close))
            {
                actions.Add(new BridgeActionDraft(
                    "cancel_deck_removal_selection",
                    "cancel_deck_removal_selection",
                    "navigation",
                    "Cancel card removal",
                    "NDeckCardSelectScreen._closeButton",
                    () => StartClose(screen)));
            }
        }
        else
        {
            NConfirmButton? confirm = FindControl<NConfirmButton>(screen, "_previewConfirmButton");
            if (confirm is { IsEnabled: true } && McpMod.IsNodeVisible(confirm))
            {
                actions.Add(new BridgeActionDraft(
                    "confirm_deck_removal",
                    "confirm_deck_removal",
                    "commit",
                    "Confirm removal of the selected card",
                    "NDeckCardSelectScreen._previewConfirmButton",
                    () => StartPreviewConfirm(screen, selectedCards, transaction)));
            }

            NBackButton? cancel = FindControl<NBackButton>(screen, "_previewCancelButton");
            if (cancel is { IsEnabled: true } && McpMod.IsNodeVisible(cancel))
            {
                actions.Add(new BridgeActionDraft(
                    "cancel_deck_removal_preview",
                    "cancel_deck_removal_preview",
                    "navigation",
                    "Return to removal selection",
                    "NDeckCardSelectScreen._previewCancelButton",
                    () => StartPreviewCancel(screen)));
            }
        }

        return actions;
    }

    private static BridgeActionStartResult StartToggleCard(
        NDeckCardSelectScreen expectedScreen,
        CardModel expectedCard,
        bool expectedSelected)
    {
        if (!IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Merchant removal is no longer selecting a card.");

        NGridCardHolder? holder = McpMod.FindAllSortedByPosition<NGridCardHolder>(expectedScreen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, expectedCard)
                                         && McpMod.IsNodeVisible(candidate)
                                         && IsHolderClickable(candidate));
        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(expectedScreen);
        if (holder == null || grid == null || IsSelected(expectedScreen, expectedCard) != expectedSelected)
        {
            return BridgeActionStartResult.Rejected(
                "card_not_actionable",
                "The advertised removal card or its selected state changed before execution.");
        }

        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, holder);
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  || IsPreviewVisible(expectedScreen)
                  || IsSelected(expectedScreen, expectedCard) != expectedSelected,
            "selected_membership_changed_preview_opened_or_selection_closed");
    }

    private static BridgeActionStartResult StartPreview(NDeckCardSelectScreen expectedScreen)
    {
        if (!IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Merchant removal is no longer ready for preview.");
        NConfirmButton? confirm = FindControl<NConfirmButton>(expectedScreen, "_confirmButton");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("preview_not_available", "The removal preview control is no longer enabled.");

        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen),
            "removal_preview_opened_or_selection_closed");
    }

    private static BridgeActionStartResult StartPreviewConfirm(
        NDeckCardSelectScreen expectedScreen,
        IReadOnlyCollection<CardModel> expectedSelectedCards,
        MerchantRemovalTransaction transaction)
    {
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Merchant removal confirmation is no longer current.");
        if (expectedSelectedCards.Count != 1)
            return BridgeActionStartResult.Rejected("selection_changed", "Merchant removal no longer has exactly one selected card.");

        CardModel expectedCard = expectedSelectedCards.Single();
        IReadOnlyList<CardModel> currentSelectedCards = BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen);
        if (currentSelectedCards.Count != 1
            || !ReferenceEquals(currentSelectedCards[0], expectedCard)
            || !transaction.Player.Deck.Cards.Any(card => ReferenceEquals(card, expectedCard))
            || !ShopSurfaceFacts.IsCurrentMerchant(transaction.MerchantRoom, transaction.Room, transaction.Inventory)
            || !ReferenceEquals(transaction.Inventory.CardRemovalEntry, transaction.Entry)
            || transaction.Entry.Used
            || !transaction.Entry.IsStocked
            || !transaction.Entry.EnoughGold)
        {
            return BridgeActionStartResult.Rejected(
                "merchant_removal_transaction_changed",
                "The selected card or merchant-removal transaction changed before confirmation.");
        }

        NConfirmButton? confirm = FindControl<NConfirmButton>(expectedScreen, "_previewConfirmButton");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("confirm_not_available", "The removal confirmation control is no longer enabled.");

        var baseline = new MerchantRemovalCommitBaseline(
            transaction.Player.Gold,
            transaction.Entry.Cost,
            transaction.Player.Deck.Cards.Count,
            transaction.Player.ExtraFields.CardShopRemovalsUsed);
        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => MerchantRemovalCompletionWitness.IsSatisfied(
                baseline,
                new MerchantRemovalCommitObservation(
                    SelectorClosed: !IsCurrent(expectedScreen),
                    SelectedCardStillInDeck: transaction.Player.Deck.Cards.Any(card => ReferenceEquals(card, expectedCard)),
                    Gold: transaction.Player.Gold,
                    DeckCount: transaction.Player.Deck.Cards.Count,
                    CardShopRemovalsUsed: transaction.Player.ExtraFields.CardShopRemovalsUsed,
                    ServiceUsed: transaction.Entry.Used)),
            "merchant_removal_selected_card_absent_gold_spent_count_incremented_and_service_used",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartPreviewCancel(NDeckCardSelectScreen expectedScreen)
    {
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Merchant removal preview is no longer current.");
        NBackButton? cancel = FindControl<NBackButton>(expectedScreen, "_previewCancelButton");
        if (cancel is not { IsEnabled: true } || !McpMod.IsNodeVisible(cancel))
            return BridgeActionStartResult.Rejected("cancel_not_available", "The removal preview cancel control is no longer enabled.");

        cancel.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen) && !IsPreviewVisible(expectedScreen),
            "removal_preview_closed");
    }

    private static BridgeActionStartResult StartClose(NDeckCardSelectScreen expectedScreen)
    {
        if (!IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Merchant removal is no longer cancelable from selection.");
        NBackButton? close = FindControl<NBackButton>(expectedScreen, "_closeButton");
        if (close is not { IsEnabled: true } || !McpMod.IsNodeVisible(close))
            return BridgeActionStartResult.Rejected("cancel_not_available", "The removal close control is no longer enabled.");

        close.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen),
            "merchant_removal_selection_cancelled_and_closed");
    }

    private static bool TryReadBinding(
        NDeckCardSelectScreen screen,
        out Binding? binding,
        out string? error)
    {
        binding = null;
        error = null;
        if (BoundedCardSelectionFacts.TryRead(
                screen,
                out CardSelectorPrefs prefs,
                out IReadOnlyList<CardModel> selected,
                out error))
        {
            binding = new Binding(prefs, selected);
        }
        return binding != null;
    }

    private static T? FindControl<T>(NDeckCardSelectScreen screen, string fieldName)
        where T : Control => ReadField(screen, fieldName) as T;

    private static object? ReadField(object source, string fieldName)
    {
        const BindingFlags SearchFlags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly;
        for (Type? type = source.GetType(); type != null; type = type.BaseType)
        {
            FieldInfo? field = type.GetField(fieldName, SearchFlags);
            if (field != null)
                return field.GetValue(source);
        }
        return null;
    }

    private static bool IsPreviewVisible(NDeckCardSelectScreen screen) =>
        ReadField(screen, "_previewContainer") is Control preview
        && McpMod.IsNodeVisible(preview);

    private static bool IsSelected(NDeckCardSelectScreen screen, CardModel card) =>
        BoundedCardSelectionFacts.IsSelected(screen, card);

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool IsCurrent(NDeckCardSelectScreen screen) =>
        ActiveSurfaceResolver.IsVisibleActiveOverlay(screen)
        && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    private static string? ReadNodeText(Node screen, string path)
    {
        try
        {
            Node? node = screen.GetNodeOrNull(path);
            if (node == null)
                return null;
            Variant value = node.Get("text");
            return value.VariantType == Variant.Type.Nil
                ? null
                : McpMod.StripRichTextTags(value.AsString()).Replace("\n", " ");
        }
        catch
        {
            return null;
        }
    }

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        IBridgeContext context,
        string reason,
        IReadOnlyList<string> missing)
    {
        var unavailable = new UnsupportedSurface(SurfaceKind, nameof(NDeckCardSelectScreen), reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "NDeckCardSelectScreen exact-version binding" },
            missing);
        string signature = BridgeHash.Object(new { game.Version, context, unavailable, missing });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            unavailable,
            completeness,
            game,
            new[] { "merchant_deck_removal_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.deck_removal_selection.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }

    private sealed record Binding(
        CardSelectorPrefs Preferences,
        IReadOnlyList<CardModel> SelectedCards);

    private sealed record MerchantRemovalTransaction(
        MerchantRoom MerchantRoom,
        NMerchantRoom Room,
        MerchantInventory Inventory,
        MerchantCardRemovalEntry Entry,
        Player Player);
}
