using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.CardSelection;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Factories;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Events;
using MegaCrit.Sts2.Core.Nodes.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Purpose-specific adapter for event choices that expose temporary card
/// creation results and add the selected exact card instances to the run deck.
/// NSimpleCardSelectScreen is only the shared interaction mechanic: Sealed
/// Deck, relic pickup, and arbitrary simple-grid selectors retain independent
/// semantic ownership and remain fail closed.
/// </summary>
internal sealed class EventCardAcquisitionSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "event_card_acquisition";
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
        if (snapshot.TopOverlay is not NSimpleCardSelectScreen screen)
            return null;

        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (runState?.CurrentRoom is not EventRoom eventRoom)
            return null;

        EventModel eventModel = eventRoom.LocalMutableEvent;
        if (!IsAuditedEvent(eventModel))
            return null;

        EventBridgeContext context = BridgeContextBuilder.BuildEvent(eventRoom);
        return Build(screen, eventModel, context, entities, game);
    }

    private static BridgeObservationDraft Build(
        NSimpleCardSelectScreen screen,
        EventModel eventModel,
        EventBridgeContext context,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!TryReadBinding(screen, out Binding? binding, out string? error)
            || ClickableField == null)
        {
            return BindingUnavailable(
                game,
                context,
                error ?? "The exact event card-acquisition binding is unavailable.",
                new[] { "event_source", "selection_constraints", "visible_cards", "legal_actions" });
        }

        Binding exact = binding!;
        if (!MatchesAuditedSource(eventModel, exact, out string? sourceError))
        {
            return BindingUnavailable(
                game,
                context,
                sourceError ?? "The simple-grid selector does not match an audited event acquisition source.",
                new[] { "event_source", "selection_constraints", "completion_semantics", "legal_actions" });
        }

        string? prompt = ReadNodeText(screen, "%BottomLabel");
        IReadOnlyList<NGridCardHolder> holders = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .ToArray();
        bool holdersMatchCards = holders.Count == exact.Cards.Count
                                 && exact.Cards.All(card => holders.Count(holder =>
                                     ReferenceEquals(holder.CardModel, card)) == 1);
        if (string.IsNullOrWhiteSpace(prompt) || !holdersMatchCards)
        {
            return BindingUnavailable(
                game,
                context,
                "The rendered event card grid does not exactly match its source card instances.",
                new[] { "prompt", "visible_cards", "legal_actions" });
        }

        HashSet<CardModel> selectedCards = exact.SelectedCards.ToHashSet();
        var cardIds = new Dictionary<CardModel, string>();
        VisibleCard[] cards = holders.Select(holder =>
        {
            CardModel card = holder.CardModel;
            string cardId = entities.GetId(card, "card");
            cardIds[card] = cardId;
            return BridgeContextBuilder.BuildCard(
                card,
                cardId,
                selectedCards.Contains(card),
                displayPile: PileType.None);
        }).ToArray();
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
                "A selected event acquisition card is absent from the visible grid.",
                new[] { "selected_cards", "legal_actions" });
        }

        var surface = new EventCardAcquisitionSurface(
            SurfaceKind,
            entities.GetId(screen, "screen"),
            prompt,
            "run_deck",
            exact.Preferences.MinSelect,
            exact.Preferences.MaxSelect,
            selectedCards.Count,
            selectedIds,
            RequireManualConfirmation: false,
            cards);
        List<BridgeActionDraft> actions = BuildActions(
            screen,
            eventModel,
            exact,
            holders,
            selectedCards,
            cardIds);
        bool controlsComplete = actions.Count > 0 || selectedCards.Count >= exact.Preferences.MaxSelect;
        string readiness = actions.Count > 0 ? "ready" : controlsComplete ? "settling" : "degraded";
        var completeness = new StateCompleteness(
            "contract_complete_for_audited_event_card_acquisition",
            actions.Count > 0
                ? "derived_from_exact_visible_grid_and_source_qualified_commit_semantics"
                : "temporarily_empty_while_selection_commits_or_settles",
            new[]
            {
                $"{eventModel.GetType().Name}.SelectCardsToAddToDeckFromGrid",
                "CardSelectCmd.FromSimpleGridForRewards",
                "NSimpleCardSelectScreen visible grid and selection state",
                "EventModel selected CardPileCmd.Add(..., PileType.Deck)",
                "NCardHolder._isClickable exact-version binding"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            context.EventId,
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
                "This Surface is restricted to exact audited event add-to-deck sources; other NSimpleCardSelectScreen purposes remain unsupported."
            },
            actions);
    }

    private static List<BridgeActionDraft> BuildActions(
        NSimpleCardSelectScreen screen,
        EventModel eventModel,
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
                $"event_card_acquisition:{cardId}:{selected}",
                selected ? "deselect_event_card_acquisition" : "select_event_card_acquisition",
                "selection",
                selected ? $"Deselect {cardName}" : $"Choose {cardName} to add to the run deck",
                "NSimpleCardSelectScreen.NCardGrid.HolderPressed+EventModel.CardPileCmd.Add(Deck)",
                () => StartToggle(screen, eventModel, card, selected),
                new[] { new ActionEntityBinding("card", cardId) }));
        }
        return actions;
    }

    private static BridgeActionStartResult StartToggle(
        NSimpleCardSelectScreen expectedScreen,
        EventModel expectedEvent,
        CardModel expectedCard,
        bool expectedSelected)
    {
        if (!IsCurrent(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_changed", "Event card acquisition is no longer current.");
        string? sourceError = null;
        if (!TryReadBinding(expectedScreen, out Binding? binding, out string? error)
            || !MatchesAuditedSource(expectedEvent, binding!, out sourceError))
        {
            return BridgeActionStartResult.Rejected(
                "event_acquisition_changed",
                sourceError ?? error ?? "The event acquisition source changed before execution.");
        }

        Binding current = binding!;
        bool currentlySelected = current.SelectedCards.Any(card => ReferenceEquals(card, expectedCard));
        NGridCardHolder? holder = McpMod.FindAllSortedByPosition<NGridCardHolder>(expectedScreen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, expectedCard)
                                         && McpMod.IsNodeVisible(candidate)
                                         && IsHolderClickable(candidate));
        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(expectedScreen);
        if (currentlySelected != expectedSelected
            || holder == null
            || grid == null
            || !current.Cards.Any(card => ReferenceEquals(card, expectedCard)))
        {
            return BridgeActionStartResult.Rejected(
                "card_not_actionable",
                "The advertised card or selected membership changed before execution.");
        }

        var expectedAfter = current.SelectedCards.ToHashSet();
        if (expectedSelected)
            expectedAfter.Remove(expectedCard);
        else
            expectedAfter.Add(expectedCard);
        bool commits = !current.Preferences.RequireManualConfirmation
                       && expectedAfter.Count >= current.Preferences.MaxSelect;
        Player? owner = expectedEvent.Owner;
        if (owner == null)
            return BridgeActionStartResult.Rejected("event_owner_unavailable", "The audited event owner is unavailable.");
        int baselineDeckCount = owner.Deck.Cards.Count;

        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, holder);
        if (!commits)
        {
            return BridgeActionStartResult.Started(
                () => IsCurrent(expectedScreen)
                      && TryReadBinding(expectedScreen, out Binding? observed, out _)
                      && ReferenceSetEquals(observed!.SelectedCards, expectedAfter),
                "event_card_acquisition_selected_membership_changed");
        }

        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  && owner.Deck.Cards.Count >= baselineDeckCount + expectedAfter.Count
                  && expectedAfter.All(selected => owner.Deck.Cards.Any(deckCard =>
                      ReferenceEquals(deckCard, selected))),
            "selected_event_cards_added_as_exact_instances_to_run_deck",
            allowIntermediateStateChanges: true);
    }

    private static bool TryReadBinding(
        NSimpleCardSelectScreen screen,
        out Binding? binding,
        out string? error)
    {
        binding = null;
        error = null;
        object? cardsValue = ReadField(screen, "_cards");
        object? resultsValue = ReadField(screen, "_cardResults");
        object? prefsValue = ReadField(screen, "_prefs");
        object? selectedValue = ReadField(screen, "_selectedCards");
        if (cardsValue is not IEnumerable<CardModel> cards)
            error = "Missing or incompatible _cards binding.";
        else if (resultsValue is not IEnumerable<CardCreationResult> results)
            error = "This simple grid is not backed by visible CardCreationResult reward candidates.";
        else if (prefsValue is not CardSelectorPrefs prefs)
            error = "Missing or incompatible _prefs binding.";
        else if (selectedValue is not IEnumerable<CardModel> selected)
            error = "Missing or incompatible _selectedCards binding.";
        else
        {
            CardModel[] exactCards = cards.ToArray();
            CardCreationResult[] exactResults = results.ToArray();
            bool resultCardsMatch = exactResults.Length == exactCards.Length
                                    && exactCards.All(card => exactResults.Count(result =>
                                        ReferenceEquals(result.Card, card)) == 1);
            if (!resultCardsMatch)
                error = "CardCreationResult candidates do not exactly match the visible source cards.";
            else
                binding = new Binding(prefs, exactCards, selected.ToArray());
        }
        return binding != null;
    }

    private static bool MatchesAuditedSource(
        EventModel eventModel,
        Binding binding,
        out string? error)
    {
        error = null;
        bool commonContract = !binding.Preferences.Cancelable
                              && !binding.Preferences.RequireManualConfirmation
                              && binding.Preferences.MinSelect == binding.Preferences.MaxSelect;
        bool matches = commonContract && eventModel switch
        {
            BrainLeech => binding.Cards.Count == 5 && binding.Preferences.MaxSelect == 1,
            RoomFullOfCheese => binding.Cards.Count == 8 && binding.Preferences.MaxSelect == 2,
            _ => false
        };
        if (!matches)
        {
            error = $"Event {eventModel.Id.Entry} and selector constraints do not match the audited v0.109 add-to-deck sources.";
        }
        return matches;
    }

    private static bool IsAuditedEvent(EventModel model) =>
        model is BrainLeech or RoomFullOfCheese;

    private static bool ReferenceSetEquals(
        IEnumerable<CardModel> observed,
        IReadOnlySet<CardModel> expected)
    {
        CardModel[] actual = observed.ToArray();
        return actual.Length == expected.Count
               && actual.All(card => expected.Any(item => ReferenceEquals(item, card)));
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

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool IsCurrent(NSimpleCardSelectScreen screen) =>
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
        var unavailable = new UnsupportedSurface("unsupported", nameof(NSimpleCardSelectScreen), reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "v0.109 exact event-card-acquisition bindings" },
            missing);
        return new BridgeObservationDraft(
            BridgeHash.Object(new { game.Version, context, unavailable, missing }),
            "degraded",
            context,
            unavailable,
            completeness,
            game,
            new[] { "event_card_acquisition_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            AuthorityHandoff = new AuthorityHandoff(
                "none_fail_closed",
                null,
                "Event card-acquisition source or completion semantics are not exact."),
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.event_card_acquisition.binding_unavailable",
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
        IReadOnlyList<CardModel> Cards,
        IReadOnlyList<CardModel> SelectedCards);
}
