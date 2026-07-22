using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.CardSelection;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.Models.Events;
using MegaCrit.Sts2.Core.Nodes.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Purpose-specific adapter for Wood Carvings Bird/Torus. It reuses the
/// native generic deck-selection mechanics but preserves the branch-specific,
/// deterministic replacement and its semantic completion witness.
/// </summary>
internal sealed class WoodCarvingsReplacementSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "wood_carvings_replacement_selection";
    private const string AuditedEventId = "WOOD_CARVINGS";
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
        if (context is not EventBridgeContext eventContext
            || !string.Equals(eventContext.EventId, AuditedEventId, StringComparison.Ordinal))
        {
            return null;
        }

        if (!WoodCarvingsReplacementSourceBinding.TryGetUnique(
                out WoodCarvingsReplacementSourceBinding.ActiveBinding? source)
            || source == null
            || RunManager.Instance.DebugOnlyGetState()?.CurrentRoom is not EventRoom eventRoom
            || eventRoom.LocalMutableEvent is not WoodCarvings currentEvent
            || !ReferenceEquals(currentEvent, source.Event)
            || !ReferenceEquals(currentEvent.Owner, source.Player))
        {
            return BindingUnavailable(
                game,
                context,
                "The generic deck selector has no unique active Wood Carvings Bird/Torus source binding.",
                new[] { "event_branch", "replacement_semantics", "legal_actions" });
        }

        return Build(screen, eventContext, source, entities, game);
    }

    private static BridgeObservationDraft Build(
        NDeckCardSelectScreen screen,
        EventBridgeContext context,
        WoodCarvingsReplacementSourceBinding.ActiveBinding source,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!BoundedCardSelectionFacts.TryRead(
                screen,
                out CardSelectorPrefs prefs,
                out IReadOnlyList<CardModel> selected,
                out string? bindingError)
            || ClickableField == null)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError ?? "The exact generic deck-selection binding is unavailable.",
                new[] { "selection_constraints", "selected_cards", "legal_actions" });
        }

        if (prefs.MinSelect != 1 || prefs.MaxSelect != 1 || prefs.Cancelable)
        {
            return BindingUnavailable(
                game,
                context,
                "Wood Carvings no longer has the audited exactly-one, non-cancelable selection contract.",
                new[] { "selection_constraints", "legal_actions" });
        }

        string? prompt = ReadNodeText(screen, "%BottomLabel");
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return BindingUnavailable(
                game,
                context,
                "The player-visible Wood Carvings selection prompt is unavailable.",
                new[] { "prompt", "legal_actions" });
        }

        string stage = IsPreviewVisible(screen) ? "preview" : "selecting";
        IReadOnlyList<NGridCardHolder> holders = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .ToArray();
        HashSet<CardModel> selectedCards = selected.ToHashSet();
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
        if (holders.Count == 0 || selectedIds.Length != selectedCards.Count)
        {
            return BindingUnavailable(
                game,
                context,
                "The visible Wood Carvings grid is empty or omits a selected card.",
                new[] { "cards", "selected_cards", "legal_actions" });
        }

        CardModel replacement = source.Branch == "bird"
            ? ModelDb.Card<Peck>()
            : ModelDb.Card<ToricToughness>();
        var surface = new WoodCarvingsReplacementSelectionSurface(
            SurfaceKind,
            stage,
            entities.GetId(screen, "screen"),
            prompt,
            source.Branch,
            source.ReplacementDefinitionId,
            McpMod.SafeGetText(() => replacement.Title),
            ReadCardDescription(replacement),
            prefs.MinSelect,
            prefs.MaxSelect,
            selectedCards.Count,
            selectedIds,
            cards);
        List<BridgeActionDraft> actions = BuildActions(
            screen,
            stage,
            holders,
            selectedCards,
            cardIds,
            source);

        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_wood_carvings_deterministic_replacement",
            actions.Count > 0
                ? "derived_from_exact_source_binding_visible_grid_and_current_controls"
                : "temporarily_empty_while_selection_completes_or_settles",
            new[]
            {
                $"WoodCarvings.{(source.Branch == "bird" ? "Bird" : "Torus")}",
                "CardSelectCmd.FromDeckGeneric exactly-one Basic transformable filter",
                "NDeckCardSelectScreen visible overlay",
                "WoodCarvings source-task Harmony binding",
                "CardCmd.TransformTo exact replacement",
                "exact-original-absent+replacement-count+deck-count witness"
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
                "This contract is limited to native Wood Carvings Bird/Torus and does not authorize other generic deck selectors."
            },
            actions);
    }

    private static List<BridgeActionDraft> BuildActions(
        NDeckCardSelectScreen screen,
        string stage,
        IReadOnlyList<NGridCardHolder> holders,
        HashSet<CardModel> selectedCards,
        IReadOnlyDictionary<CardModel, string> cardIds,
        WoodCarvingsReplacementSourceBinding.ActiveBinding source)
    {
        var actions = new List<BridgeActionDraft>();
        if (stage == "selecting")
        {
            foreach (NGridCardHolder holder in holders.Where(IsHolderClickable))
            {
                CardModel card = holder.CardModel;
                if (selectedCards.Contains(card))
                    continue;
                string cardId = cardIds[card];
                string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
                actions.Add(new BridgeActionDraft(
                    $"select_wood_carvings_replacement_card:{cardId}",
                    "select_wood_carvings_replacement_card",
                    "selection",
                    $"Replace {cardName} with {source.ReplacementDefinitionId}",
                    "NCardGrid.HolderPressed+WoodCarvings source binding",
                    () => StartSelect(screen, card),
                    new[] { new ActionEntityBinding("card", cardId) }));
            }
        }
        else
        {
            NConfirmButton? confirm = FindControl<NConfirmButton>(screen, "_previewConfirmButton");
            if (confirm is { IsEnabled: true } && McpMod.IsNodeVisible(confirm))
            {
                actions.Add(new BridgeActionDraft(
                    "confirm_wood_carvings_replacement",
                    "confirm_wood_carvings_replacement",
                    "commit",
                    $"Confirm replacement with {source.ReplacementDefinitionId}",
                    "NDeckCardSelectScreen._previewConfirmButton+CardCmd.TransformTo",
                    () => StartConfirm(screen, selectedCards, source)));
            }

            NBackButton? cancel = FindControl<NBackButton>(screen, "_previewCancelButton");
            if (cancel is { IsEnabled: true } && McpMod.IsNodeVisible(cancel))
            {
                actions.Add(new BridgeActionDraft(
                    "cancel_wood_carvings_replacement_preview",
                    "cancel_wood_carvings_replacement_preview",
                    "navigation",
                    "Return to Wood Carvings card selection",
                    "NDeckCardSelectScreen._previewCancelButton",
                    () => StartPreviewCancel(screen)));
            }
        }
        return actions;
    }

    private static BridgeActionStartResult StartSelect(
        NDeckCardSelectScreen expectedScreen,
        CardModel expectedCard)
    {
        if (!IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Wood Carvings is no longer selecting a card.");
        NGridCardHolder? holder = McpMod.FindAllSortedByPosition<NGridCardHolder>(expectedScreen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, expectedCard)
                                         && McpMod.IsNodeVisible(candidate)
                                         && IsHolderClickable(candidate));
        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(expectedScreen);
        if (holder == null || grid == null || BoundedCardSelectionFacts.IsSelected(expectedScreen, expectedCard))
            return BridgeActionStartResult.Rejected("card_not_actionable", "The advertised Wood Carvings card changed before execution.");

        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, holder);
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  || IsPreviewVisible(expectedScreen)
                  || BoundedCardSelectionFacts.IsSelected(expectedScreen, expectedCard),
            "wood_carvings_card_selected_and_preview_opened");
    }

    private static BridgeActionStartResult StartConfirm(
        NDeckCardSelectScreen expectedScreen,
        IReadOnlyCollection<CardModel> expectedSelectedCards,
        WoodCarvingsReplacementSourceBinding.ActiveBinding source)
    {
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Wood Carvings confirmation is no longer current.");
        if (expectedSelectedCards.Count != 1)
            return BridgeActionStartResult.Rejected("selection_changed", "Wood Carvings no longer has exactly one selected card.");

        CardModel expectedCard = expectedSelectedCards.Single();
        IReadOnlyList<CardModel> currentSelected = BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen);
        if (currentSelected.Count != 1
            || !ReferenceEquals(currentSelected[0], expectedCard)
            || !source.Player.Deck.Cards.Any(card => ReferenceEquals(card, expectedCard))
            || !WoodCarvingsReplacementSourceBinding.IsActive(source.Token))
        {
            return BridgeActionStartResult.Rejected("wood_carvings_source_changed", "The selected card or exact Wood Carvings source changed before confirmation.");
        }

        NConfirmButton? confirm = FindControl<NConfirmButton>(expectedScreen, "_previewConfirmButton");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("confirm_not_available", "The Wood Carvings confirmation control is no longer enabled.");

        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => DeterministicDeckReplacementWitness.IsSatisfied(
                sourceCompleted: !WoodCarvingsReplacementSourceBinding.IsActive(source.Token),
                selectorClosed: !IsCurrent(expectedScreen),
                source.BaselineDeck,
                source.Player.Deck.Cards,
                expectedCard,
                card => card.GetType() == source.ReplacementType),
            "wood_carvings_source_completed_original_absent_exact_replacement_added_and_deck_count_preserved",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartPreviewCancel(NDeckCardSelectScreen expectedScreen)
    {
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Wood Carvings preview is no longer current.");
        NBackButton? cancel = FindControl<NBackButton>(expectedScreen, "_previewCancelButton");
        if (cancel is not { IsEnabled: true } || !McpMod.IsNodeVisible(cancel))
            return BridgeActionStartResult.Rejected("cancel_not_available", "The Wood Carvings preview cancel control is no longer enabled.");

        cancel.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen) && !IsPreviewVisible(expectedScreen),
            "wood_carvings_preview_closed");
    }

    private static T? FindControl<T>(NDeckCardSelectScreen screen, string fieldName)
        where T : Control => ReadField(screen, fieldName) as T;

    private static object? ReadField(object source, string fieldName)
    {
        const BindingFlags search = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly;
        for (Type? type = source.GetType(); type != null; type = type.BaseType)
        {
            FieldInfo? field = type.GetField(fieldName, search);
            if (field != null)
                return field.GetValue(source);
        }
        return null;
    }

    private static bool IsPreviewVisible(NDeckCardSelectScreen screen) =>
        ReadField(screen, "_previewContainer") is Control preview && McpMod.IsNodeVisible(preview);

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

    private static string? ReadCardDescription(CardModel card)
    {
        try
        {
            return McpMod.StripRichTextTags(card.GetDescriptionForPile(PileType.Deck))
                .Replace("\n", " ");
        }
        catch
        {
            return McpMod.SafeGetText(() => card.Description)?.Replace("\n", " ");
        }
    }

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        IBridgeContext context,
        string reason,
        IReadOnlyList<string> missing) =>
        BridgeFailClosedObservation.BindingUnavailable(
            game,
            context,
            nameof(NDeckCardSelectScreen),
            reason,
            new[] { "WoodCarvings.Bird/Torus exact source-task binding", "NDeckCardSelectScreen exact-version binding" },
            missing,
            "wood_carvings_replacement_binding_unavailable",
            "bridge.surface.wood_carvings_replacement.binding_unavailable",
            "Wood Carvings branch, selection, or deterministic replacement semantics are not exact.");
}
