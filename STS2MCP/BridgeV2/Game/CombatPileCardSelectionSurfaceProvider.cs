using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.CardSelection;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
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
/// Exact-build adapter for source-discriminated selections from a combat pile.
/// Headbutt, Graveblast, and Cleanse share exact-one selection mechanics, but
/// retain independent source piles, business semantics, and post-state
/// witnesses. Every other caller of the same game screen remains fail closed.
/// </summary>
internal sealed class CombatPileCardSelectionSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "combat_pile_card_selection";
    private const string ReflectionEvidence =
        "sts2-v0.109.0:Headbutt/Graveblast.OnPlay+CardSelectCmd.FromCombatPile+NCombatPileCardSelectScreen";
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

        IBridgeContext context = BridgeContextBuilder.Build(entities);
        if (!CombatPileSelectionSourceBinding.TryGetUnique(
                out CombatPileSelectionSourceBinding.SourceBinding? source))
        {
            return BindingUnavailable(
                game,
                context,
                "The combat-pile selector has no unique qualified source binding.",
                new[] { "combat_pile_selection_source", "legal_actions" });
        }

        return Build(screen, source!, context, entities, game);
    }

    private static BridgeObservationDraft Build(
        NCombatPileCardSelectScreen screen,
        CombatPileSelectionSourceBinding.SourceBinding source,
        IBridgeContext context,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (context is not CombatBridgeContext
            || source.Player.PlayerCombatState is not { } combat)
        {
            return BindingUnavailable(
                game,
                context,
                "The combat-pile selector is visible without a qualified combat context.",
                new[] { "combat_context", "legal_actions" });
        }

        string? bindingError = null;
        if (!TryDescribeSource(source, out SourceSemantics? sourceSemantics)
            || !TryReadBinding(screen, out Binding? binding, out bindingError)
            || ClickableField == null)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError ?? "The exact combat-pile selection binding is unavailable.",
                new[] { "selection_constraints", "selected_cards", "source_pile", "card_selectability", "legal_actions" });
        }

        Binding exactBinding = binding!;
        SourceSemantics semantics = sourceSemantics!;
        if (!IsExpectedSourcePile(exactBinding.Pile, combat, semantics.SourcePile)
            || !exactBinding.Pile.IsCombatPile
            || source.BaselineSourcePile.Count != exactBinding.Pile.Cards.Count
            || source.BaselineSourcePile.Any(card =>
                !exactBinding.Pile.Cards.Any(current => ReferenceEquals(current, card)))
            || exactBinding.Preferences.MinSelect != 1
            || exactBinding.Preferences.MaxSelect != 1
            || exactBinding.Preferences.RequireManualConfirmation
            || exactBinding.Preferences.Cancelable)
        {
            return BindingUnavailable(
                game,
                context,
                $"The visible selector does not match exact {semantics.SourceKind} {semantics.SourcePile} single-pick semantics.",
                new[] { "source_pile", "selection_constraints", "source_semantics", "legal_actions" });
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
            semantics.Purpose,
            semantics.SourceKind,
            entities.GetId(source.SourceCard, "card"),
            source.SourceCard.Id.Entry,
            exactBinding.Pile.Type.ToString().ToLowerInvariant(),
            semantics.DestinationPile,
            semantics.DestinationPosition,
            semantics.OverflowDestination,
            exactBinding.Preferences.MinSelect,
            exactBinding.Preferences.MaxSelect,
            selectedCards.Count,
            selectedIds,
            exactBinding.Preferences.RequireManualConfirmation,
            exactBinding.Preferences.Cancelable,
            cards);

        List<BridgeActionDraft> actions = BuildActions(
            screen,
            source,
            semantics,
            exactBinding,
            holders,
            selectedCards,
            cardIds);

        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            semantics.Completeness,
            actions.Count > 0
                ? "derived_from_exact_visible_grid_and_current_controls"
                : "temporarily_empty_while_selection_completes_or_settles",
            new[]
            {
                "NCombatPileCardSelectScreen visible overlay",
                "NCardGrid visible holders",
                "NCardHolder._isClickable exact-version binding",
                $"{semantics.SourceType}.OnPlay exact source task",
                "CardSelectCmd.FromCombatPile(discard, exact-one)",
                semantics.CommitEvidence,
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
        CombatPileSelectionSourceBinding.SourceBinding source,
        SourceSemantics semantics,
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
                $"{semantics.ActionKeyPrefix}:{cardId}",
                semantics.Operation,
                "selection",
                semantics.ActionLabel(cardName),
                semantics.CommitEvidence,
                () => StartSelection(screen, source, semantics, card, selected),
                new[] { new ActionEntityBinding("card", cardId) }));
        }

        return actions;
    }

    private static BridgeActionStartResult StartSelection(
        NCombatPileCardSelectScreen expectedScreen,
        CombatPileSelectionSourceBinding.SourceBinding source,
        SourceSemantics semantics,
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
            () => source.Player.PlayerCombatState is { } combat
                  && source switch
                  {
                      CombatPileSelectionSourceBinding.HeadbuttBinding headbutt =>
                          HeadbuttCombatPileWitness.Selected(
                              !CombatPileSelectionSourceBinding.IsActive(headbutt.Token),
                              !IsCurrent(expectedScreen),
                              headbutt.BaselineDiscard,
                              headbutt.BaselineDraw,
                              combat.DiscardPile.Cards,
                              combat.DrawPile.Cards,
                              expectedCard),
                      CombatPileSelectionSourceBinding.GraveblastBinding graveblast =>
                          GraveblastCombatPileWitness.Selected(
                              !CombatPileSelectionSourceBinding.IsActive(graveblast.Token),
                              !IsCurrent(expectedScreen),
                              graveblast.BaselineDiscard,
                              graveblast.BaselineHand,
                              combat.DiscardPile.Cards,
                              combat.Hand.Cards,
                              expectedCard,
                              CardPile.MaxCardsInHand),
                      CombatPileSelectionSourceBinding.CleanseBinding cleanse =>
                          CleanseCombatPileWitness.Selected(
                              !CombatPileSelectionSourceBinding.IsActive(cleanse.Token),
                              !IsCurrent(expectedScreen),
                              cleanse.BaselineDraw,
                              cleanse.BaselineExhaust,
                              combat.DrawPile.Cards,
                              combat.ExhaustPile.Cards,
                              expectedCard),
                      _ => false
                  },
            semantics.CompletionEvidence,
            allowIntermediateStateChanges: true);
    }

    private static bool TryDescribeSource(
        CombatPileSelectionSourceBinding.SourceBinding source,
        out SourceSemantics? semantics)
    {
        semantics = source switch
        {
            CombatPileSelectionSourceBinding.HeadbuttBinding => new SourceSemantics(
                "move_one_discard_card_to_draw_top",
                "headbutt",
                "Headbutt",
                "discard",
                "draw",
                "top",
                null,
                "contract_complete_for_headbutt_discard_to_draw_top_selection",
                "Headbutt.OnPlay+NCardGrid.HolderPressed+CardPileCmd.Add(Draw,Top)+exact-card-witness",
                "headbutt_select_discard_for_draw_top",
                "select_discard_card_for_draw_top",
                cardName => $"Put {cardName} on top of the Draw Pile",
                "headbutt_source_completed_screen_closed_and_exact_card_moved_from_discard_to_draw_top"),
            CombatPileSelectionSourceBinding.GraveblastBinding => new SourceSemantics(
                "move_one_discard_card_to_hand",
                "graveblast",
                "Graveblast",
                "discard",
                "hand",
                "bottom",
                "discard_if_hand_full",
                "contract_complete_for_graveblast_discard_to_hand_selection",
                "Graveblast.OnPlay+NCardGrid.HolderPressed+CardPileCmd.Add(Hand)+exact-card-witness",
                "graveblast_select_discard_for_hand",
                "select_discard_card_for_hand",
                cardName => $"Put {cardName} back in your Hand",
                "graveblast_source_completed_screen_closed_and_exact_card_moved_from_discard_to_hand_or_full_hand_discard"),
            CombatPileSelectionSourceBinding.CleanseBinding => new SourceSemantics(
                "exhaust_one_draw_card",
                "cleanse",
                "Cleanse",
                "draw",
                "exhaust",
                "bottom",
                null,
                "contract_complete_for_cleanse_draw_to_exhaust_selection",
                "Cleanse.OnPlay+NCardGrid.HolderPressed+CardCmd.Exhaust+exact-card-witness",
                "cleanse_select_draw_for_exhaust",
                "select_draw_card_for_exhaust",
                cardName => $"Exhaust {cardName}",
                "cleanse_source_completed_screen_closed_and_exact_card_moved_from_draw_to_exhaust"),
            _ => null
        };
        return semantics != null;
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

    private static bool IsExpectedSourcePile(
        CardPile pile,
        PlayerCombatState combat,
        string sourcePile) =>
        sourcePile switch
        {
            "discard" => ReferenceEquals(pile, combat.DiscardPile) && pile.Type == PileType.Discard,
            "draw" => ReferenceEquals(pile, combat.DrawPile) && pile.Type == PileType.Draw,
            _ => false
        };

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
        => BridgeFailClosedObservation.BindingUnavailable(
            game,
            context,
            nameof(NCombatPileCardSelectScreen),
            reason,
            new[] { "NCombatPileCardSelectScreen exact-version binding" },
            missing,
            "combat_pile_card_selection_binding_unavailable",
            "bridge.surface.combat_pile_card_selection.binding_unavailable",
            "Combat pile-selection source or completion semantics are not exact.");

    private sealed record Binding(
        CardSelectorPrefs Preferences,
        IReadOnlyList<CardModel> SelectedCards,
        CardPile Pile);

    private sealed record SourceSemantics(
        string Purpose,
        string SourceKind,
        string SourceType,
        string SourcePile,
        string DestinationPile,
        string DestinationPosition,
        string? OverflowDestination,
        string Completeness,
        string CommitEvidence,
        string ActionKeyPrefix,
        string Operation,
        Func<string, string> ActionLabel,
        string CompletionEvidence);
}
