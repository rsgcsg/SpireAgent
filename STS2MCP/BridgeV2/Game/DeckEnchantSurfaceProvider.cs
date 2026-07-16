using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.CardSelection;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal sealed class DeckEnchantSurfaceProvider : IBridgeSurfaceProvider
{
    private const string ReflectionEvidence = "sts2-v0.108.0:cached_reflection:NDeckEnchantSelectScreen";

    public string Kind => "deck_enchant_selection";

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NDeckEnchantSelectScreen screen)
            return null;
        return Build(screen, entities, game);
    }

    private static BridgeObservationDraft Build(
        NDeckEnchantSelectScreen screen,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!TryReadBinding(screen, out Binding? binding, out string? bindingError))
        {
            var degradedSurface = new UnsupportedSurface(
                "deck_enchant_selection",
                nameof(NDeckEnchantSelectScreen),
                bindingError ?? "Required screen binding is unavailable.");
            var degradedCompleteness = new StateCompleteness(
                "degraded",
                "empty_fail_closed",
                new[] { "public_scene_tree" },
                new[] { "selection_constraints", "selected_cards", "enchantment_semantics", "legal_actions" });
            string degradedSignature = BridgeHash.Object(new
            {
                game.Version,
                degradedSurface,
                actionKeys = Array.Empty<string>()
            });

            return new BridgeObservationDraft(
                degradedSignature,
                "degraded",
                BridgeContextBuilder.Build(entities),
                degradedSurface,
                degradedCompleteness,
                game,
                new[] { "deck_enchant_binding_unavailable", bindingError ?? "unknown_binding_error" },
                Array.Empty<BridgeActionDraft>());
        }

        Binding exactBinding = binding!;
        string stage = IsPreviewVisible(screen) ? "preview" : "selecting";
        string screenEntityId = entities.GetId(screen, "screen");
        HashSet<CardModel> selectedCards = exactBinding.SelectedCards.ToHashSet();
        IReadOnlyList<NGridCardHolder> holders = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .ToArray();

        var cards = new List<VisibleCard>(holders.Count);
        var cardIds = new Dictionary<CardModel, string>();
        foreach (NGridCardHolder holder in holders)
        {
            CardModel card = holder.CardModel;
            string entityId = entities.GetId(card, "card");
            cardIds[card] = entityId;
            cards.Add(BuildCard(card, entityId, selectedCards.Contains(card)));
        }

        string[] selectedIds = selectedCards
            .Select(card => cardIds.TryGetValue(card, out string? id) ? id : entities.GetId(card, "card"))
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToArray();

        VisibleEnchantment enchantment = BuildEnchantment(screen, exactBinding.Enchantment, exactBinding.EnchantmentAmount);
        var surface = new DeckEnchantSelectionSurface(
            "deck_enchant_selection",
            stage,
            screenEntityId,
            ReadNodeText(screen, "%BottomLabel"),
            exactBinding.Preferences.MinSelect,
            exactBinding.Preferences.MaxSelect,
            selectedCards.Count,
            selectedIds,
            exactBinding.Preferences.Cancelable,
            enchantment,
            cards);

        List<BridgeActionDraft> actions = BuildActions(
            screen,
            exactBinding,
            stage,
            holders,
            selectedCards,
            cardIds);

        var missing = new List<string>();
        if (surface.Enchantment.Name == null)
            missing.Add("enchantment.name");
        if (surface.Enchantment.Description == null)
            missing.Add("enchantment.description");
        if (surface.Prompt == null)
            missing.Add("prompt");

        var completeness = new StateCompleteness(
            missing.Count == 0 ? "contract_complete_for_supported_surface" : "partial",
            "derived_from_same_validator_as_execution",
            new[]
            {
                "public_scene_tree",
                "localized_visible_ui_text",
                "card_models_rendered_by_grid",
                ReflectionEvidence
            },
            missing);
        string signature = BridgeHash.Object(new
        {
            game.Version,
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });

        return new BridgeObservationDraft(
            signature,
            missing.Count == 0 ? "ready" : "degraded",
            BridgeContextBuilder.Build(entities),
            surface,
            completeness,
            game,
            new[]
            {
                "Private-field bindings are exact-version scoped and fail closed outside the tested game identity."
            },
            actions);
    }

    private static List<BridgeActionDraft> BuildActions(
        NDeckEnchantSelectScreen screen,
        Binding binding,
        string stage,
        IReadOnlyList<NGridCardHolder> holders,
        HashSet<CardModel> selectedCards,
        IReadOnlyDictionary<CardModel, string> cardIds)
    {
        var actions = new List<BridgeActionDraft>();

        if (stage == "selecting")
        {
            foreach (NGridCardHolder holder in holders)
            {
                CardModel card = holder.CardModel;
                bool selected = selectedCards.Contains(card);
                if (!selected && selectedCards.Count >= binding.Preferences.MaxSelect)
                    continue;
                if (!selected && !binding.Enchantment.CanEnchant(card))
                    continue;

                string cardId = cardIds[card];
                string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
                actions.Add(new BridgeActionDraft(
                    $"toggle_card:{cardId}:{selected}",
                    "toggle_card",
                    "selection",
                    selected ? $"Deselect {cardName}" : $"Select {cardName}",
                    "NCardGrid.HolderPressed",
                    () => StartToggleCard(screen, card, binding.Enchantment)));
            }

            NConfirmButton? mainConfirm = screen.GetNodeOrNull<NConfirmButton>("Confirm")
                                               ?? screen.GetNodeOrNull<NConfirmButton>("%Confirm");
            if (mainConfirm is { IsEnabled: true } && McpMod.IsNodeVisible(mainConfirm))
            {
                actions.Add(new BridgeActionDraft(
                    "preview_selection",
                    "preview_selection",
                    "selection",
                    "Preview selected cards with the enchantment",
                    "NDeckEnchantSelectScreen.main_confirm",
                    () => StartMainPreview(screen)));
            }

            NBackButton? close = screen.GetNodeOrNull<NBackButton>("%Close");
            if (binding.Preferences.Cancelable && close is { IsEnabled: true } && McpMod.IsNodeVisible(close))
            {
                actions.Add(new BridgeActionDraft(
                    "close_selection",
                    "close_selection",
                    "navigation",
                    "Close enchant selection without choosing cards",
                    "NDeckEnchantSelectScreen.close",
                    () => StartClose(screen)));
            }
        }
        else
        {
            Control? preview = GetVisiblePreview(screen);
            NConfirmButton? confirm = preview?.GetNodeOrNull<NConfirmButton>("Confirm");
            if (confirm is { IsEnabled: true } && McpMod.IsNodeVisible(confirm))
            {
                actions.Add(new BridgeActionDraft(
                    "confirm_enchantment",
                    "confirm_selection",
                    "commit",
                    "Confirm and apply the displayed enchantment",
                    "NDeckEnchantSelectScreen.preview_confirm",
                    () => StartPreviewConfirm(screen)));
            }

            NBackButton? cancel = preview?.GetNodeOrNull<NBackButton>("Cancel");
            if (cancel is { IsEnabled: true } && McpMod.IsNodeVisible(cancel))
            {
                actions.Add(new BridgeActionDraft(
                    "cancel_enchantment_preview",
                    "cancel_preview",
                    "navigation",
                    "Cancel preview and return to card selection",
                    "NDeckEnchantSelectScreen.preview_cancel",
                    () => StartPreviewCancel(screen)));
            }
        }

        return actions;
    }

    private static BridgeActionStartResult StartToggleCard(
        NDeckEnchantSelectScreen expectedScreen,
        CardModel expectedCard,
        EnchantmentModel enchantment)
    {
        if (!IsCurrentScreen(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Enchant selection is no longer in selecting stage.");

        NGridCardHolder? holder = McpMod.FindAllSortedByPosition<NGridCardHolder>(expectedScreen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, expectedCard) && McpMod.IsNodeVisible(candidate));
        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(expectedScreen);
        if (holder == null || grid == null)
            return BridgeActionStartResult.Rejected("card_not_actionable", "The selected card is no longer present in the active grid.");
        if (!enchantment.CanEnchant(expectedCard))
            return BridgeActionStartResult.Rejected("card_not_enchantable", "The game model no longer permits this enchantment on the card.");

        bool wasSelected = IsCardSelected(expectedScreen, expectedCard);
        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, holder);
        return BridgeActionStartResult.Started(
            () => IsCurrentScreen(expectedScreen)
                  && IsCardSelected(expectedScreen, expectedCard) != wasSelected,
            "selected_card_membership_changed");
    }

    private static BridgeActionStartResult StartMainPreview(NDeckEnchantSelectScreen expectedScreen)
    {
        if (!IsCurrentScreen(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Enchant selection is no longer in selecting stage.");

        NConfirmButton? confirm = expectedScreen.GetNodeOrNull<NConfirmButton>("Confirm")
                                  ?? expectedScreen.GetNodeOrNull<NConfirmButton>("%Confirm");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("preview_not_available", "The preview button is no longer enabled.");

        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrentScreen(expectedScreen) && IsPreviewVisible(expectedScreen),
            "enchantment_preview_became_visible");
    }

    private static BridgeActionStartResult StartPreviewConfirm(NDeckEnchantSelectScreen expectedScreen)
    {
        if (!IsCurrentScreen(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_changed", "Enchant selection is no longer the current screen.");

        NConfirmButton? confirm = GetVisiblePreview(expectedScreen)?.GetNodeOrNull<NConfirmButton>("Confirm");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("confirm_not_available", "The preview confirm button is no longer enabled.");

        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrentScreen(expectedScreen),
            "enchantment_screen_closed_after_preview_confirm");
    }

    private static BridgeActionStartResult StartPreviewCancel(NDeckEnchantSelectScreen expectedScreen)
    {
        if (!IsCurrentScreen(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_changed", "Enchant selection is no longer the current screen.");

        NBackButton? cancel = GetVisiblePreview(expectedScreen)?.GetNodeOrNull<NBackButton>("Cancel");
        if (cancel is not { IsEnabled: true } || !McpMod.IsNodeVisible(cancel))
            return BridgeActionStartResult.Rejected("cancel_not_available", "The preview cancel button is no longer enabled.");

        cancel.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrentScreen(expectedScreen)
                  && !IsPreviewVisible(expectedScreen)
                  && ReadSelectedCards(expectedScreen).Count == 0,
            "preview_closed_and_selection_cleared");
    }

    private static BridgeActionStartResult StartClose(NDeckEnchantSelectScreen expectedScreen)
    {
        if (!IsCurrentScreen(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Enchant selection is no longer closable from the selecting stage.");

        NBackButton? close = expectedScreen.GetNodeOrNull<NBackButton>("%Close");
        if (close is not { IsEnabled: true } || !McpMod.IsNodeVisible(close))
            return BridgeActionStartResult.Rejected("close_not_available", "The close button is no longer enabled.");

        close.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrentScreen(expectedScreen),
            "enchantment_screen_closed_without_selection");
    }

    private static bool TryReadBinding(
        NDeckEnchantSelectScreen screen,
        out Binding? binding,
        out string? error)
    {
        binding = null;
        error = null;

        object? prefsValue = ReadField(screen, "_prefs");
        object? selectedValue = ReadField(screen, "_selectedCards");
        object? enchantmentValue = ReadField(screen, "_enchantment");
        object? amountValue = ReadField(screen, "_enchantmentAmount");

        if (prefsValue is not CardSelectorPrefs prefs)
            error = "Missing or incompatible _prefs binding.";
        else if (selectedValue is not IEnumerable<CardModel> selected)
            error = "Missing or incompatible _selectedCards binding.";
        else if (enchantmentValue is not EnchantmentModel enchantment)
            error = "Missing or incompatible _enchantment binding.";
        else if (amountValue is not int amount)
            error = "Missing or incompatible _enchantmentAmount binding.";
        else
            binding = new Binding(prefs, selected.ToArray(), enchantment, amount);

        return binding != null;
    }

    private static object? ReadField(object source, string fieldName)
    {
        const BindingFlags Flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly;
        for (Type? type = source.GetType(); type != null; type = type.BaseType)
        {
            FieldInfo? field = type.GetField(fieldName, Flags);
            if (field != null)
                return field.GetValue(source);
        }
        return null;
    }

    private static bool IsCardSelected(NDeckEnchantSelectScreen screen, CardModel card) =>
        ReadSelectedCards(screen).Any(selected => ReferenceEquals(selected, card));

    private static IReadOnlyList<CardModel> ReadSelectedCards(NDeckEnchantSelectScreen screen) =>
        ReadField(screen, "_selectedCards") is IEnumerable<CardModel> cards
            ? cards.ToArray()
            : Array.Empty<CardModel>();

    private static VisibleCard BuildCard(CardModel card, string entityId, bool selected)
    {
        string cost = card.EnergyCost.CostsX ? "X" : card.EnergyCost.GetAmountToSpend().ToString();
        string? starCost = card.HasStarCostX
            ? "X"
            : card.CurrentStarCost >= 0 ? card.GetStarCostWithModifiers().ToString() : null;
        string? description = null;
        try
        {
            description = McpMod.StripRichTextTags(card.GetDescriptionForPile(PileType.Deck)).Replace("\n", " ");
        }
        catch
        {
            description = McpMod.SafeGetText(() => card.Description)?.Replace("\n", " ");
        }

        VisibleEnchantment? existing = card.Enchantment == null
            ? null
            : new VisibleEnchantment(
                card.Enchantment.Id.Entry,
                McpMod.SafeGetText(() => card.Enchantment.Title),
                McpMod.SafeGetText(() => card.Enchantment.DynamicDescription),
                card.Enchantment.Amount,
                "card_hover_semantics");

        return new VisibleCard(
            entityId,
            card.Id.Entry,
            McpMod.SafeGetText(() => card.Title),
            card.Type.ToString(),
            cost,
            starCost,
            description,
            card.Rarity.ToString(),
            card.IsUpgraded,
            selected,
            existing);
    }

    private static VisibleEnchantment BuildEnchantment(
        NDeckEnchantSelectScreen screen,
        EnchantmentModel enchantment,
        int amount)
    {
        string? name = ReadNodeText(screen, "%EnchantmentTitle")
                       ?? McpMod.SafeGetText(() => enchantment.Title);
        string? description = ReadNodeText(screen, "%EnchantmentDescription");

        if (description == null)
        {
            try
            {
                EnchantmentModel display = enchantment.ToMutable();
                display.Amount = amount;
                display.RecalculateValues();
                description = McpMod.SafeGetText(() => display.DynamicDescription);
            }
            catch
            {
                description = McpMod.SafeGetText(() => enchantment.DynamicDescription);
            }
        }

        return new VisibleEnchantment(
            enchantment.Id.Entry,
            name,
            description,
            amount,
            "localized_visible_ui_text+model_identity");
    }

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

    private static bool IsCurrentScreen(NDeckEnchantSelectScreen screen) =>
        McpMod.IsLiveNode(screen) && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    private static bool IsPreviewVisible(NDeckEnchantSelectScreen screen) =>
        GetVisiblePreview(screen) != null;

    private static Control? GetVisiblePreview(NDeckEnchantSelectScreen screen)
    {
        Control? single = screen.GetNodeOrNull<Control>("%EnchantSinglePreviewContainer");
        if (single != null && McpMod.IsNodeVisible(single))
            return single;

        Control? multi = screen.GetNodeOrNull<Control>("%EnchantMultiPreviewContainer");
        return multi != null && McpMod.IsNodeVisible(multi) ? multi : null;
    }

    private sealed record Binding(
        CardSelectorPrefs Preferences,
        IReadOnlyList<CardModel> SelectedCards,
        EnchantmentModel Enchantment,
        int EnchantmentAmount);
}
