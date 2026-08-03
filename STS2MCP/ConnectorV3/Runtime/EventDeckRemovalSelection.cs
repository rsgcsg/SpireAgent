using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Godot;
using HarmonyLib;
using MegaCrit.Sts2.Core.CardSelection;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Events;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;
using STS2_MCP.ConnectorV3.Protocol;

namespace STS2_MCP.ConnectorV3.Runtime;

internal static class EventDeckRemovalSourceBinding
{
    private static readonly object Gate = new();
    private static readonly Dictionary<Guid, ActiveBinding> Active = new();

    internal sealed record ActiveBinding(
        Guid Token,
        LuminousChoir SourceEvent,
        Player Player,
        IReadOnlyList<CardModel> BaselineDeck,
        int BaselineSporeMindCount);

    internal readonly record struct Scope(Guid Token)
    {
        public bool IsTracked => Token != Guid.Empty;
    }

    internal enum Resolution
    {
        None,
        Unique,
        Ambiguous
    }

    internal static Scope Begin(LuminousChoir sourceEvent)
    {
        if (sourceEvent.Owner is not Player player)
            return default;

        var binding = new ActiveBinding(
            Guid.NewGuid(),
            sourceEvent,
            player,
            player.Deck.Cards.ToArray(),
            player.Deck.Cards.Count(card => card is SporeMind));
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    internal static async Task Complete(Task task, Scope scope)
    {
        try
        {
            await task;
        }
        finally
        {
            if (scope.IsTracked)
            {
                lock (Gate)
                    Active.Remove(scope.Token);
            }
        }
    }

    internal static Resolution Read(out ActiveBinding? binding)
    {
        lock (Gate)
        {
            if (Active.Count == 0)
            {
                binding = null;
                return Resolution.None;
            }
            if (Active.Count == 1)
            {
                binding = Active.Values.Single();
                return Resolution.Unique;
            }
            binding = null;
            return Resolution.Ambiguous;
        }
    }

    internal static bool IsActive(Guid token)
    {
        lock (Gate)
            return Active.ContainsKey(token);
    }
}

[HarmonyPatch]
internal static class LuminousChoirDeckRemovalSourcePatch
{
    internal static MethodBase ResolveTargetMethod() =>
        AccessTools.DeclaredMethod(typeof(LuminousChoir), "ReachIntoTheFlesh")
        ?? throw new MissingMethodException(typeof(LuminousChoir).FullName, "ReachIntoTheFlesh");

    private static MethodBase TargetMethod() => ResolveTargetMethod();

    private static void Prefix(
        LuminousChoir __instance,
        out EventDeckRemovalSourceBinding.Scope __state)
    {
        __state = EventDeckRemovalSourceBinding.Begin(__instance);
    }

    private static void Postfix(
        ref Task __result,
        EventDeckRemovalSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = EventDeckRemovalSourceBinding.Complete(__result, __state);
    }
}

internal static class EventDeckRemovalSelection
{
    internal const string SurfaceKind = "event_deck_removal_selection";
    internal const string SourceKind = "luminous_choir_reach_into_flesh";
    internal const string ToggleWitness =
        "event_removal_exact_selected_membership_changed";
    internal const string PreviewCancelWitness =
        "event_removal_preview_closed_and_selection_cleared";
    internal const string ConfirmWitness =
        "luminous_choir_exact_cards_removed_spore_mind_added_and_event_finished";

    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;
    private static readonly FieldInfo? ClickableField =
        typeof(NCardHolder).GetField("_isClickable", Flags);

    internal static BridgeObservationDraft? TryBuild(
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        ActiveSurfaceSnapshot snapshot = ActiveSurfaceResolver.Capture();
        if (snapshot.TopOverlay is not NDeckCardSelectScreen screen)
            return null;
        EventDeckRemovalSourceBinding.Resolution sourceResolution =
            EventDeckRemovalSourceBinding.Read(
                out EventDeckRemovalSourceBinding.ActiveBinding? source);
        if (sourceResolution == EventDeckRemovalSourceBinding.Resolution.None)
        {
            return null;
        }
        if (sourceResolution == EventDeckRemovalSourceBinding.Resolution.Ambiguous
            || source == null)
        {
            return BindingUnavailable(
                game,
                BridgeContextBuilder.Build(entities),
                "More than one Luminous Choir event-removal task claims the current selector.");
        }

        IBridgeContext context = BridgeContextBuilder.Build(entities);
        if (context is not EventBridgeContext
            || RunManager.Instance.DebugOnlyGetState()?.CurrentRoom is not EventRoom room
            || !ReferenceEquals(room.LocalMutableEvent, source.SourceEvent))
        {
            return BindingUnavailable(
                game,
                context,
                "The active deck selector is not owned by the exact current event task.");
        }

        if (!BoundedCardSelectionFacts.TryRead(
                screen,
                out CardSelectorPrefs prefs,
                out IReadOnlyList<CardModel> selectedCards,
                out string? bindingError)
            || ClickableField == null
            || prefs.MinSelect != 2
            || prefs.MaxSelect != 2
            || prefs.Cancelable)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError
                ?? "The exact two-card non-cancelable event-removal selector contract changed.");
        }

        string? prompt = ReadNodeText(screen, "%InfoLabel")
                         ?? ReadNodeText(screen, "%BottomLabel");
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return BindingUnavailable(
                game,
                context,
                "The player-visible event-removal prompt is unavailable.");
        }

        IReadOnlyList<NGridCardHolder> holders =
            McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
                .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
                .ToArray();
        HashSet<CardModel> selected = selectedCards.ToHashSet();
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
                selected.Contains(card),
                displayPile: PileType.Deck));
        }

        string[] selectedIds = selected
            .Select(card => cardIds.TryGetValue(card, out string? id) ? id : null)
            .Where(id => id != null)
            .Cast<string>()
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToArray();
        if (selectedIds.Length != selected.Count)
        {
            return BindingUnavailable(
                game,
                context,
                "A selected event-removal card is absent from the visible grid.");
        }

        string stage = IsPreviewVisible(screen) ? "preview" : "selecting";
        string[] selectableIds = stage == "selecting"
            ? holders.Where(holder => IsHolderClickable(holder)
                                      && !selected.Contains(holder.CardModel)
                                      && selected.Count < prefs.MaxSelect)
                .Select(holder => cardIds[holder.CardModel])
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        string[] deselectableIds = stage == "selecting"
            ? holders.Where(holder => IsHolderClickable(holder)
                                      && selected.Contains(holder.CardModel))
                .Select(holder => cardIds[holder.CardModel])
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        bool canCancelPreview = stage == "preview"
                                && FindControl<NBackButton>(screen, "_previewCancelButton")
                                    is { IsEnabled: true } previewCancel
                                && McpMod.IsNodeVisible(previewCancel);
        bool canConfirm = stage == "preview"
                          && FindControl<NConfirmButton>(screen, "_previewConfirmButton")
                              is { IsEnabled: true } previewConfirm
                          && McpMod.IsNodeVisible(previewConfirm);
        string screenId = entities.GetId(screen, "screen");
        var surface = new EventDeckRemovalSelectionSurface(
            SurfaceKind,
            stage,
            screenId,
            SourceKind,
            "remove_two_cards_then_gain_spore_mind",
            prompt,
            prefs.MinSelect,
            prefs.MaxSelect,
            selected.Count,
            selectedIds,
            selectableIds,
            deselectableIds,
            canCancelPreview,
            canConfirm,
            new[] { "remove_selected_cards", "add_spore_mind", "finish_event" },
            cards);
        IReadOnlyList<ConnectorV3CommandDescriptor> actions = DescribeCommands(surface);
        bool actionable = actions.Count > 0;
        var completeness = new StateCompleteness(
            "contract_complete_for_luminous_choir_event_deck_removal",
            actionable
                ? "derived_from_exact_event_task_visible_grid_and_current_controls"
                : "temporarily_empty_while_native_selector_settles",
            new[]
            {
                "LuminousChoir.ReachIntoTheFlesh exact task scope",
                "CardSelectCmd.FromDeckForRemoval(min=2,max=2,cancelable=false)",
                "NDeckCardSelectScreen visible overlay",
                "CardPileCmd.RemoveFromDeck+AddCurseToDeck<SporeMind>+SetEventFinished"
            },
            Array.Empty<string>());
        return new BridgeObservationDraft(
            BridgeHash.Object(new
            {
                game.Version,
                context,
                surface,
                actionKeys = actions.Select(action => action.Key)
            }),
            actionable ? "ready" : "settling",
            context,
            surface,
            completeness,
            game,
            new[]
            {
                "This authority is limited to the exact active Luminous Choir task; all other NDeckCardSelectScreen sources remain fail closed."
            },
            []);
    }

    internal static IReadOnlyList<ConnectorV3CommandDescriptor> DescribeCommands(
        EventDeckRemovalSelectionSurface surface)
    {
        if (surface.Kind != SurfaceKind
            || surface.SourceKind != SourceKind)
        {
            return Array.Empty<ConnectorV3CommandDescriptor>();
        }

        var cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        var actions = new List<ConnectorV3CommandDescriptor>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        foreach (string cardId in surface.SelectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(Descriptor(
                $"select_event_removal_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_event_deck_removal_card",
                "selection",
                $"Select {card.Name ?? card.DefinitionId} to remove",
                "LuminousChoir task+NCardGrid.HolderPressed+exact-unselected-card",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        foreach (string cardId in surface.DeselectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(Descriptor(
                $"deselect_event_removal_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_event_deck_removal_card",
                "selection",
                $"Deselect {card.Name ?? card.DefinitionId}",
                "LuminousChoir task+NCardGrid.HolderPressed+exact-selected-card",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        ActionEntityBinding[] selected = new[] { screen }.Concat(
            surface.SelectedCardEntityIds.Select(id => new ActionEntityBinding("card", id)))
            .ToArray();
        if (surface.CanCancelPreview)
        {
            actions.Add(Descriptor(
                $"cancel_event_removal_preview:{surface.ScreenEntityId}",
                "cancel_event_deck_removal_preview",
                "cancel",
                "Return to the two-card removal selection",
                "LuminousChoir task+NDeckCardSelectScreen._previewCancelButton",
                selected));
        }
        if (surface.CanConfirm)
        {
            actions.Add(Descriptor(
                $"confirm_event_removal:{surface.ScreenEntityId}",
                "confirm_event_deck_removal",
                "commit",
                "Remove the two selected cards and accept Spore Mind",
                "LuminousChoir task+exact-selected-cards+native-event-transaction-witness",
                selected));
        }
        return actions;
    }

    internal static BridgeActionStartResult Start(
        BridgeEntityRegistry entities,
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        BridgeActionStartResult? rejection = null;
        if (snapshot.Draft.Surface is not EventDeckRemovalSelectionSurface surface
            || surface.Kind != SurfaceKind
            || surface.SourceKind != SourceKind
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId)
            || !TryResolveCurrent(
                entities,
                surface.ScreenEntityId,
                out NDeckCardSelectScreen? screen,
                out EventDeckRemovalSourceBinding.ActiveBinding? source,
                out rejection)
            || screen == null
            || source == null)
        {
            return rejection ?? BridgeActionStartResult.Rejected(
                "event_removal_owner_changed",
                "The exact event-removal owner is no longer current.");
        }

        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Operation == "toggle_event_deck_removal_card"
            && operands.TryGetValue("card_id", out string? cardId)
            && entities.TryResolve(cardId, out CardModel? card)
            && card != null)
        {
            if (request.Command == "select_entity"
                && surface.SelectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return StartToggle(screen, card, expectedSelected: false);
            }
            if (request.Command == "deselect_entity"
                && surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return StartToggle(screen, card, expectedSelected: true);
            }
        }
        if (binding.Candidate.Operation == "cancel_event_deck_removal_preview"
            && request.Command == "cancel_interaction"
            && surface.Stage == "preview"
            && surface.CanCancelPreview
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return StartPreviewCancel(screen);
        }
        if (binding.Candidate.Operation == "confirm_event_deck_removal"
            && request.Command == "confirm_interaction"
            && surface.Stage == "preview"
            && surface.CanConfirm
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            var selectedCards = new List<CardModel>();
            foreach (string selectedId in surface.SelectedCardEntityIds)
            {
                if (!entities.TryResolve(selectedId, out CardModel? selectedCard)
                    || selectedCard == null)
                {
                    return BridgeActionStartResult.Rejected(
                        "event_removal_binding_stale",
                        "An exact selected event-removal card no longer resolves.");
                }
                selectedCards.Add(selectedCard);
            }
            return StartConfirm(screen, source, selectedCards);
        }
        return BridgeActionStartResult.Rejected(
            "event_removal_command_unsupported",
            "The command does not match the exact current event-removal stage and membership.");
    }

    internal static bool CompletionSatisfied<T>(
        bool sourceCompleted,
        bool selectorClosed,
        bool eventFinished,
        IReadOnlyCollection<T> baselineDeck,
        IReadOnlyCollection<T> currentDeck,
        IReadOnlyCollection<T> selectedCards,
        int baselineSporeMindCount,
        int currentSporeMindCount) where T : class =>
        sourceCompleted
        && selectorClosed
        && eventFinished
        && selectedCards.Count == 2
        && selectedCards.All(selected => baselineDeck.Any(card => ReferenceEquals(card, selected)))
        && selectedCards.All(selected => currentDeck.All(card => !ReferenceEquals(card, selected)))
        && currentSporeMindCount == baselineSporeMindCount + 1
        && currentDeck.Count == baselineDeck.Count - selectedCards.Count + 1;

    internal static bool ToggleCompletionSatisfied(
        bool isCurrent,
        bool isSelected,
        bool expectedSelected) =>
        isCurrent && isSelected != expectedSelected;

    private static BridgeActionStartResult StartToggle(
        NDeckCardSelectScreen screen,
        CardModel card,
        bool expectedSelected)
    {
        if (!IsCurrent(screen) || IsPreviewVisible(screen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Event removal is no longer selecting cards.");
        NGridCardHolder? holder = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, card)
                                         && McpMod.IsNodeVisible(candidate)
                                         && IsHolderClickable(candidate));
        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(screen);
        if (holder == null
            || grid == null
            || BoundedCardSelectionFacts.IsSelected(screen, card) != expectedSelected)
        {
            return BridgeActionStartResult.Rejected(
                "card_not_actionable",
                "The advertised event-removal card or selected state changed before execution.");
        }

        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, holder);
        return BridgeActionStartResult.Started(
            () => ToggleCompletionSatisfied(
                IsCurrent(screen),
                BoundedCardSelectionFacts.IsSelected(screen, card),
                expectedSelected),
            ToggleWitness);
    }

    private static BridgeActionStartResult StartPreviewCancel(NDeckCardSelectScreen screen)
    {
        if (!IsCurrent(screen) || !IsPreviewVisible(screen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Event removal preview is no longer current.");
        NBackButton? cancel = FindControl<NBackButton>(screen, "_previewCancelButton");
        if (cancel is not { IsEnabled: true } || !McpMod.IsNodeVisible(cancel))
            return BridgeActionStartResult.Rejected("cancel_not_available", "The preview return control is no longer enabled.");

        cancel.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(screen)
                  && !IsPreviewVisible(screen)
                  && BoundedCardSelectionFacts.ReadSelectedCards(screen).Count == 0,
            PreviewCancelWitness);
    }

    private static BridgeActionStartResult StartConfirm(
        NDeckCardSelectScreen screen,
        EventDeckRemovalSourceBinding.ActiveBinding source,
        IReadOnlyCollection<CardModel> expectedSelected)
    {
        if (!IsCurrent(screen)
            || !IsPreviewVisible(screen)
            || expectedSelected.Count != 2
            || !EventDeckRemovalSourceBinding.IsActive(source.Token))
        {
            return BridgeActionStartResult.Rejected(
                "event_removal_transaction_changed",
                "The exact event-removal transaction is no longer current.");
        }
        IReadOnlyList<CardModel> currentSelected =
            BoundedCardSelectionFacts.ReadSelectedCards(screen);
        if (currentSelected.Count != expectedSelected.Count
            || currentSelected.Any(card => !expectedSelected.Any(expected => ReferenceEquals(card, expected)))
            || expectedSelected.Any(card => !source.Player.Deck.Cards.Any(current => ReferenceEquals(card, current))))
        {
            return BridgeActionStartResult.Rejected(
                "event_removal_selection_changed",
                "The exact selected event-removal cards changed before confirmation.");
        }
        NConfirmButton? confirm = FindControl<NConfirmButton>(screen, "_previewConfirmButton");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("confirm_not_available", "The event-removal confirmation is no longer enabled.");

        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => CompletionSatisfied(
                !EventDeckRemovalSourceBinding.IsActive(source.Token),
                !IsCurrent(screen),
                source.SourceEvent.IsFinished,
                source.BaselineDeck,
                source.Player.Deck.Cards,
                expectedSelected,
                source.BaselineSporeMindCount,
                source.Player.Deck.Cards.Count(card => card is SporeMind)),
            ConfirmWitness,
            allowIntermediateStateChanges: true);
    }

    private static bool TryResolveCurrent(
        BridgeEntityRegistry entities,
        string screenId,
        out NDeckCardSelectScreen? screen,
        out EventDeckRemovalSourceBinding.ActiveBinding? source,
        out BridgeActionStartResult? rejection)
    {
        source = null;
        rejection = null;
        if (!entities.TryResolve(screenId, out screen)
            || screen == null
            || !IsCurrent(screen))
        {
            rejection = BridgeActionStartResult.Rejected(
                "event_removal_owner_changed",
                "The exact event-removal screen is no longer current.");
            return false;
        }
        if (EventDeckRemovalSourceBinding.Read(out source)
                != EventDeckRemovalSourceBinding.Resolution.Unique
            || source == null
            || RunManager.Instance.DebugOnlyGetState()?.CurrentRoom is not EventRoom room
            || !ReferenceEquals(room.LocalMutableEvent, source.SourceEvent))
        {
            rejection = BridgeActionStartResult.Rejected(
                "event_removal_source_changed",
                "The exact event-removal task is no longer current.");
            return false;
        }
        return true;
    }

    private static bool HasExactOperand(
        ConnectorV3CommandRequest request,
        string key,
        string expected) =>
        request.Operands?.TryGetValue(key, out string? actual) == true
        && string.Equals(actual, expected, StringComparison.Ordinal);

    private static ConnectorV3CommandDescriptor Descriptor(
        string key,
        string operation,
        string category,
        string label,
        string evidenceCode,
        IReadOnlyList<ActionEntityBinding> entityBindings) => new(
        key,
        operation,
        category,
        label,
        evidenceCode,
        entityBindings);

    private static T? FindControl<T>(NDeckCardSelectScreen screen, string fieldName)
        where T : Control => ReadField(screen, fieldName) as T;

    private static object? ReadField(object source, string fieldName)
    {
        const BindingFlags SearchFlags = BindingFlags.Instance
                                         | BindingFlags.Public
                                         | BindingFlags.NonPublic
                                         | BindingFlags.DeclaredOnly;
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
        string reason) => BridgeFailClosedObservation.BindingUnavailable(
        game,
        context,
        nameof(NDeckCardSelectScreen),
        reason,
        new[]
        {
            "LuminousChoir.ReachIntoTheFlesh exact task scope",
            "NDeckCardSelectScreen exact-version binding"
        },
        new[] { "source_binding", "selection_constraints", "legal_actions" },
        SurfaceKind,
        SourceKind,
        "The event-removal source, selector contract, or completion semantics are not exact.");
}
