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

/// <summary>
/// Exact-build adapter for selections from a combat pile. This deliberately
/// does not generalize every NCardGridSelectionScreen subclass: pile source,
/// auto-completion, and manual-confirmation semantics are specific here.
/// </summary>
internal sealed class CombatPileCardSelectionSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "combat_pile_card_selection";
    private const string ReflectionEvidence =
        "sts2-v0.108.0:cached_reflection:NCombatPileCardSelectScreen";
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
        if (snapshot.TopOverlay is not NCombatPileCardSelectScreen screen)
            return null;
        return Build(screen, entities, game);
    }

    private static BridgeObservationDraft Build(
        NCombatPileCardSelectScreen screen,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        IBridgeContext context = BridgeContextBuilder.Build(entities);
        if (context is not CombatBridgeContext)
        {
            return BindingUnavailable(
                game,
                context,
                "The combat-pile selector is visible without a qualified combat context.",
                new[] { "combat_context", "legal_actions" });
        }

        if (!TryReadBinding(screen, out Binding? binding, out string? bindingError)
            || ClickableField == null)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError ?? "The exact combat-pile selection binding is unavailable.",
                new[] { "selection_constraints", "selected_cards", "source_pile", "card_selectability", "legal_actions" });
        }

        Binding exactBinding = binding!;
        if (!exactBinding.Pile.IsCombatPile)
        {
            return BindingUnavailable(
                game,
                context,
                $"NCombatPileCardSelectScreen referenced non-combat pile {exactBinding.Pile.Type}.",
                new[] { "source_pile", "legal_actions" });
        }

        string? prompt = ReadNodeText(screen, "%BottomLabel");
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return BindingUnavailable(
                game,
                context,
                "The player-visible combat-pile selection prompt is unavailable.",
                new[] { "prompt", "legal_actions" });
        }

        IReadOnlyList<NGridCardHolder> holders = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .ToArray();
        HashSet<CardModel> selectedCards = exactBinding.SelectedCards.ToHashSet();
        var cards = new List<VisibleCard>(holders.Count);
        var cardIds = new Dictionary<CardModel, string>();
        foreach (NGridCardHolder holder in holders)
        {
            CardModel card = holder.CardModel;
            string cardId = entities.GetId(card, "card");
            cardIds[card] = cardId;
            cards.Add(BridgeContextBuilder.BuildCard(
                card,
                cardId,
                selectedCards.Contains(card),
                displayPile: exactBinding.Pile.Type));
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
                "A selected combat-pile card is absent from the visible grid.",
                new[] { "selected_cards", "legal_actions" });
        }

        var surface = new CombatPileCardSelectionSurface(
            SurfaceKind,
            entities.GetId(screen, "screen"),
            prompt,
            exactBinding.Pile.Type.ToString().ToLowerInvariant(),
            exactBinding.Preferences.MinSelect,
            exactBinding.Preferences.MaxSelect,
            selectedCards.Count,
            selectedIds,
            exactBinding.Preferences.RequireManualConfirmation,
            exactBinding.Preferences.Cancelable,
            cards);

        List<BridgeActionDraft> actions = BuildActions(
            screen,
            exactBinding,
            holders,
            selectedCards,
            cardIds);
        bool cancelBindingMissing = exactBinding.Preferences.Cancelable
                                    && !HasVisibleEnabledClose(screen);
        if (cancelBindingMissing)
        {
            return BindingUnavailable(
                game,
                context,
                "The selection is cancelable but its visible close control is not bound.",
                new[] { "cancel_action", "legal_actions" });
        }

        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_combat_pile_card_selection",
            actions.Count > 0
                ? "derived_from_exact_visible_grid_and_current_controls"
                : "temporarily_empty_while_selection_completes_or_settles",
            new[]
            {
                "NCombatPileCardSelectScreen visible overlay",
                "NCardGrid visible holders",
                "NCardHolder._isClickable exact-version binding",
                "NCombatPileCardSelectScreen.%BottomLabel",
                ReflectionEvidence
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
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
                "Private-field bindings are exact-version scoped and expose only semantics already visible in the combat selection UI."
            },
            actions);
    }

    private static List<BridgeActionDraft> BuildActions(
        NCombatPileCardSelectScreen screen,
        Binding binding,
        IReadOnlyList<NGridCardHolder> holders,
        HashSet<CardModel> selectedCards,
        IReadOnlyDictionary<CardModel, string> cardIds)
    {
        var actions = new List<BridgeActionDraft>();
        foreach (NGridCardHolder holder in holders.Where(IsHolderClickable))
        {
            CardModel card = holder.CardModel;
            bool selected = selectedCards.Contains(card);
            if (!selected && selectedCards.Count >= binding.Preferences.MaxSelect)
                continue;

            string cardId = cardIds[card];
            string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
            actions.Add(new BridgeActionDraft(
                $"toggle_combat_pile_card:{cardId}:{selected}",
                "toggle_combat_pile_card",
                "selection",
                selected ? $"Deselect {cardName}" : $"Select {cardName}",
                "NCardGrid.HolderPressed+NCombatPileCardSelectScreen.OnCardClicked",
                () => StartToggleCard(screen, card, selected),
                new[] { new ActionEntityBinding("card", cardId) }));
        }

        if (binding.Preferences.RequireManualConfirmation)
        {
            NConfirmButton? confirm = screen.GetNodeOrNull<NConfirmButton>("%Confirm");
            if (confirm is { IsEnabled: true } && McpMod.IsNodeVisible(confirm))
            {
                actions.Add(new BridgeActionDraft(
                    "confirm_combat_pile_selection",
                    "confirm_combat_pile_selection",
                    "commit",
                    "Confirm selected cards",
                    "NCombatPileCardSelectScreen.%Confirm",
                    () => StartConfirm(screen)));
            }
        }

        if (binding.Preferences.Cancelable)
        {
            NBackButton? close = FindVisibleEnabledClose(screen);
            if (close != null)
            {
                actions.Add(new BridgeActionDraft(
                    "cancel_combat_pile_selection",
                    "cancel_combat_pile_selection",
                    "navigation",
                    "Cancel card selection",
                    "NCombatPileCardSelectScreen.%Close",
                    () => StartCancel(screen)));
            }
        }

        return actions;
    }

    private static BridgeActionStartResult StartToggleCard(
        NCombatPileCardSelectScreen expectedScreen,
        CardModel expectedCard,
        bool expectedSelected)
    {
        if (!IsCurrent(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_changed", "Combat-pile selection is no longer current.");

        NGridCardHolder? holder = McpMod.FindAllSortedByPosition<NGridCardHolder>(expectedScreen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, expectedCard)
                                         && McpMod.IsNodeVisible(candidate)
                                         && IsHolderClickable(candidate));
        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(expectedScreen);
        if (holder == null || grid == null || IsSelected(expectedScreen, expectedCard) != expectedSelected)
        {
            return BridgeActionStartResult.Rejected(
                "card_not_actionable",
                "The advertised combat-pile card or its selected state changed before execution.");
        }

        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, holder);
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  || IsSelected(expectedScreen, expectedCard) != expectedSelected,
            "selected_membership_changed_or_auto_completed");
    }

    private static BridgeActionStartResult StartConfirm(NCombatPileCardSelectScreen expectedScreen)
    {
        if (!IsCurrent(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_changed", "Combat-pile selection is no longer current.");
        NConfirmButton? confirm = expectedScreen.GetNodeOrNull<NConfirmButton>("%Confirm");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("confirm_not_available", "The selection confirm control is no longer enabled.");

        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen),
            "combat_pile_selection_confirmed_and_closed");
    }

    private static BridgeActionStartResult StartCancel(NCombatPileCardSelectScreen expectedScreen)
    {
        if (!IsCurrent(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_changed", "Combat-pile selection is no longer current.");
        NBackButton? close = FindVisibleEnabledClose(expectedScreen);
        if (close == null)
            return BridgeActionStartResult.Rejected("cancel_not_available", "The selection close control is no longer enabled.");

        close.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen),
            "combat_pile_selection_cancelled_and_closed");
    }

    private static bool TryReadBinding(
        NCombatPileCardSelectScreen screen,
        out Binding? binding,
        out string? error)
    {
        binding = null;
        error = null;
        object? prefsValue = ReadField(screen, "_prefs");
        object? selectedValue = ReadField(screen, "_selectedCards");
        object? pileValue = ReadField(screen, "_pile");

        if (prefsValue is not CardSelectorPrefs prefs)
            error = "Missing or incompatible _prefs binding.";
        else if (selectedValue is not IEnumerable<CardModel> selected)
            error = "Missing or incompatible _selectedCards binding.";
        else if (pileValue is not CardPile pile)
            error = "Missing or incompatible _pile binding.";
        else
            binding = new Binding(prefs, selected.ToArray(), pile);

        return binding != null;
    }

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

    private static bool IsSelected(NCombatPileCardSelectScreen screen, CardModel card) =>
        ReadField(screen, "_selectedCards") is IEnumerable<CardModel> cards
        && cards.Any(selected => ReferenceEquals(selected, card));

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool HasVisibleEnabledClose(NCombatPileCardSelectScreen screen) =>
        FindVisibleEnabledClose(screen) != null;

    private static NBackButton? FindVisibleEnabledClose(NCombatPileCardSelectScreen screen)
    {
        NBackButton? close = screen.GetNodeOrNull<NBackButton>("%Close");
        return close is { IsEnabled: true } && McpMod.IsNodeVisible(close) ? close : null;
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

    private static bool IsCurrent(NCombatPileCardSelectScreen screen) =>
        ActiveSurfaceResolver.IsVisibleActiveOverlay(screen)
        && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        IBridgeContext context,
        string reason,
        IReadOnlyList<string> missing)
    {
        var unavailable = new UnsupportedSurface(SurfaceKind, nameof(NCombatPileCardSelectScreen), reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "NCombatPileCardSelectScreen exact-version binding" },
            missing);
        string signature = BridgeHash.Object(new { game.Version, unavailable, missing });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            unavailable,
            completeness,
            game,
            new[] { "combat_pile_card_selection_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.combat_pile_card_selection.binding_unavailable",
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
        IReadOnlyList<CardModel> SelectedCards,
        CardPile Pile);
}
