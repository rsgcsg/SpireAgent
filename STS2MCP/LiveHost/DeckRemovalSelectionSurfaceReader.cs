using STS2_MCP.NativeUi;
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
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

/// <summary>
/// Exact-build child adapter for MerchantCardRemovalEntry ->
/// CardSelectCmd.FromDeckForRemoval. It intentionally owns only the merchant
/// removal journey: upgrade, transform, enchant, and unrelated deck screens
/// have different effects and must receive their own evidence-backed adapters.
/// </summary>
internal sealed class DeckRemovalSelectionSurfaceReader : ILiveSurfaceReader
{
    private const string SurfaceKind = "deck_removal_selection";
    internal const string ToggleCompletionWitness =
        "selected_membership_changed_preview_opened_or_selection_closed";
    internal const string PreviewCompletionWitness =
        "removal_preview_opened_or_selection_closed";
    internal const string MerchantConfirmCompletionWitness =
        "merchant_removal_selected_card_absent_gold_spent_count_incremented_and_service_used";
    internal const string RewardConfirmCompletionWitness =
        "reward_removal_selected_card_absent_after_exact_reward_task_completion";
    internal const string CancelPreviewCompletionWitness =
        "removal_preview_closed";
    internal const string MerchantCancelSelectionCompletionWitness =
        "deck_removal_selection_cancelled_and_closed";
    internal const string RewardCancelSelectionCompletionWitness =
        "reward_removal_cancelled_source_completed_and_deck_unchanged";
    private const string ReflectionEvidence =
        "sts2-v0.108.0:cached_reflection:NDeckCardSelectScreen._prefs+_selectedCards+preview_controls";
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;

    private static readonly FieldInfo? ClickableField =
        typeof(NCardHolder).GetField("_isClickable", Flags);

    public string Kind => SurfaceKind;

    public InputOwnerLayer Layer => InputOwnerLayer.Overlay;

    public LiveObservation? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        NativeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NDeckCardSelectScreen screen)
            return null;

        ILiveContext context = LiveContextReader.Build(entities);
        // FromDeckForRemoval is the only observed NDeckCardSelectScreen path in
        // a normal merchant room for this exact build. Require that parent
        // context rather than inferring purpose from localized prompt text.
        if (context is not ShopLiveContext)
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

        return Build(
            screen,
            context,
            SurfaceKind,
            "merchant",
            entities,
            game,
            "MerchantCardRemovalEntry -> CardSelectCmd.FromDeckForRemoval",
            "This adapter is limited to the observed merchant removal child and does not generalize other deck selection effects.");
    }

    /// <summary>
    /// Reuses only the exact selector mechanics for Precise Scissors. The
    /// caller supplies a task-local source binding and this method deliberately
    /// publishes a distinct surface kind so merchant authority cannot leak.
    /// </summary>
    internal static LiveObservation? TryBuildPreciseScissors(
        ActiveSurfaceSnapshot snapshot,
        NativeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NDeckCardSelectScreen screen)
            return null;
        if (!PreciseScissorsRemovalSourceBinding.TryGetUnique(
                out PreciseScissorsRemovalSourceBinding.ActiveBinding? source)
            || source == null)
        {
            return null;
        }

        ILiveContext context = LiveContextReader.Build(entities);
        return Build(
            screen,
            context,
            "relic_deck_removal_selection",
            "precise_scissors",
            entities,
            game,
            "PreciseScissors.AfterObtained -> CardSelectCmd.FromDeckForRemoval -> CardPileCmd.RemoveFromDeck",
            "This adapter is limited to the exact Precise Scissors acquisition task and does not generalize other relic or deck-removal effects.");
    }

    /// <summary>
    /// Reuses the selector mechanics for an exact CardRemovalReward task. The
    /// reward is the business source even when Forbidden Grimoire created it.
    /// Keeping a distinct permission surface prevents merchant qualification
    /// from authorizing reward-originated removal.
    /// </summary>
    internal static LiveObservation? TryBuildReward(
        ActiveSurfaceSnapshot snapshot,
        NativeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NDeckCardSelectScreen screen)
            return null;
        if (!RewardCardRemovalSourceBinding.TryGetUnique(
                out RewardCardRemovalSourceBinding.ActiveBinding? source)
            || source == null)
        {
            return null;
        }

        ILiveContext context = LiveContextReader.Build(entities);
        return Build(
            screen,
            context,
            "reward_deck_removal_selection",
            "card_removal_reward",
            entities,
            game,
            "CardRemovalReward.OnSelect -> RewardSynchronizer.DoUnsyncedCardRemoval -> CardSelectCmd.FromDeckForRemoval -> CardPileCmd.RemoveFromDeck",
            "This adapter is limited to one exact CardRemovalReward selection task; the originating card, relic, event, or other producer does not inherit authority.");
    }

    private static LiveObservation Build(
        NDeckCardSelectScreen screen,
        ILiveContext context,
        string surfaceKind,
        string sourceKind,
        NativeEntityRegistry entities,
        GameBuildIdentity game,
        string sourceEvidence,
        string limitation)
    {
        if (!TryReadBinding(screen, out Binding? binding, out string? bindingError)
            || ClickableField == null)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError ?? "The exact deck-removal selector binding is unavailable.",
                new[] { "selection_constraints", "selected_cards", "legal_actions" },
                surfaceKind,
                sourceKind);
        }

        Binding exactBinding = binding!;
        string? prompt = ReadNodeText(screen, "%InfoLabel")
                         ?? ReadNodeText(screen, "%BottomLabel");
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return BindingUnavailable(
                game,
                context,
                "The player-visible deck-removal prompt is unavailable.",
                new[] { "prompt", "legal_actions" },
                surfaceKind,
                sourceKind);
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
            cards.Add(LiveContextReader.BuildCard(
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
                new[] { "selected_cards", "legal_actions" },
                surfaceKind,
                sourceKind);
        }

        string screenId = entities.GetId(screen, "screen");
        string[] selectableIds = stage == "selecting"
            ? holders.Where(holder => IsHolderClickable(holder)
                                      && !selectedCards.Contains(holder.CardModel)
                                      && selectedCards.Count < exactBinding.Preferences.MaxSelect)
                .Select(holder => cardIds[holder.CardModel])
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        string[] deselectableIds = stage == "selecting"
            ? holders.Where(holder => IsHolderClickable(holder)
                                      && selectedCards.Contains(holder.CardModel))
                .Select(holder => cardIds[holder.CardModel])
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        NConfirmButton? previewControl = stage == "selecting"
            ? FindControl<NConfirmButton>(screen, "_confirmButton")
            : null;
        NBackButton? selectionCancel = stage == "selecting"
            ? FindControl<NBackButton>(screen, "_closeButton")
            : null;
        NBackButton? previewCancel = stage == "preview"
            ? FindControl<NBackButton>(screen, "_previewCancelButton")
            : null;
        NConfirmButton? previewConfirm = stage == "preview"
            ? FindControl<NConfirmButton>(screen, "_previewConfirmButton")
            : null;
        bool canPreview = previewControl is { IsEnabled: true }
                          && McpMod.IsNodeVisible(previewControl);
        bool supportsSelectionCancel = surfaceKind != "relic_deck_removal_selection";
        bool canCancelSelection = supportsSelectionCancel
                                  && exactBinding.Preferences.Cancelable
                                  && selectionCancel is { IsEnabled: true }
                                  && McpMod.IsNodeVisible(selectionCancel);
        bool canCancelPreview = previewCancel is { IsEnabled: true }
                                && McpMod.IsNodeVisible(previewCancel);
        bool canConfirm = previewConfirm is { IsEnabled: true }
                          && McpMod.IsNodeVisible(previewConfirm);
        var surface = new DeckRemovalSelectionSurface(
            surfaceKind,
            stage,
            screenId,
            prompt,
            exactBinding.Preferences.MinSelect,
            exactBinding.Preferences.MaxSelect,
            selectedCards.Count,
            selectedIds,
            exactBinding.Preferences.Cancelable,
            selectableIds,
            deselectableIds,
            canPreview,
            canCancelSelection,
            canCancelPreview,
            canConfirm,
            cards);

        bool cancelBindingMissing = supportsSelectionCancel
                                    && exactBinding.Preferences.Cancelable
                                    && stage == "selecting"
                                    && FindControl<NBackButton>(screen, "_closeButton") == null;
        if (cancelBindingMissing)
        {
            return BindingUnavailable(
                game,
                context,
                "Deck removal is cancelable but its exact close control is unavailable.",
                new[] { "cancel_action", "legal_actions" },
                surfaceKind,
                sourceKind);
        }

        bool hasCurrentCommand = selectableIds.Length > 0
                                 || deselectableIds.Length > 0
                                 || canPreview
                                 || canCancelSelection
                                 || canCancelPreview
                                 || canConfirm;
        string readiness = hasCurrentCommand ? "ready" : "settling";
        var completeness = new StateCompleteness(
            $"contract_complete_for_{sourceKind}_deck_removal_selection",
            hasCurrentCommand
                ? "derived_from_exact_visible_grid_and_current_controls"
                : "temporarily_empty_while_selection_completes_or_settles",
            new[]
            {
                sourceEvidence,
                "NDeckCardSelectScreen visible overlay",
                "NCardGrid visible holders",
                "NCardHolder._isClickable exact-version binding",
                ReflectionEvidence
            },
            Array.Empty<string>());
        string signature = StableIdentityHash.Object(new
        {
            game.Version,
            context,
            surface
        });
        return new LiveObservation(
            signature,
            readiness,
            context,
            surface,
            completeness,
            game,
            new[] { limitation });
    }

    private static NativeInputResult StartToggleCard(
        NDeckCardSelectScreen expectedScreen,
        CardModel expectedCard,
        bool expectedSelected)
    {
        if (!IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen))
            return NativeInputResult.Rejected("screen_stage_changed", "Deck removal is no longer selecting a card.");

        NGridCardHolder? holder = McpMod.FindAllSortedByPosition<NGridCardHolder>(expectedScreen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, expectedCard)
                                         && McpMod.IsNodeVisible(candidate)
                                         && IsHolderClickable(candidate));
        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(expectedScreen);
        if (holder == null || grid == null || IsSelected(expectedScreen, expectedCard) != expectedSelected)
        {
            return NativeInputResult.Rejected(
                "card_not_actionable",
                "The advertised removal card or its selected state changed before execution.");
        }

        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, holder);
        return NativeInputResult.Started(
            () => !IsCurrent(expectedScreen)
                  || IsPreviewVisible(expectedScreen)
                  || IsSelected(expectedScreen, expectedCard) != expectedSelected,
            ToggleCompletionWitness);
    }

    private static NativeInputResult StartPreview(NDeckCardSelectScreen expectedScreen)
    {
        if (!IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen))
            return NativeInputResult.Rejected("screen_stage_changed", "Deck removal is no longer ready for preview.");
        NConfirmButton? confirm = FindControl<NConfirmButton>(expectedScreen, "_confirmButton");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return NativeInputResult.Rejected("preview_not_available", "The removal preview control is no longer enabled.");

        confirm.ForceClick();
        return NativeInputResult.Started(
            () => !IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen),
            PreviewCompletionWitness);
    }

    private static NativeInputResult StartMerchantPreviewConfirm(
        NDeckCardSelectScreen expectedScreen,
        IReadOnlyCollection<CardModel> expectedSelectedCards,
        object source)
    {
        if (source is not MerchantRemovalTransaction transaction)
            return NativeInputResult.Rejected("merchant_removal_source_changed", "The merchant removal source is no longer exact.");
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen))
            return NativeInputResult.Rejected("screen_stage_changed", "Merchant removal confirmation is no longer current.");
        if (expectedSelectedCards.Count != 1)
            return NativeInputResult.Rejected("selection_changed", "Merchant removal no longer has exactly one selected card.");

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
            return NativeInputResult.Rejected(
                "merchant_removal_transaction_changed",
                "The selected card or merchant-removal transaction changed before confirmation.");
        }

        NConfirmButton? confirm = FindControl<NConfirmButton>(expectedScreen, "_previewConfirmButton");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return NativeInputResult.Rejected("confirm_not_available", "The removal confirmation control is no longer enabled.");

        var baseline = new MerchantRemovalCommitBaseline(
            transaction.Player.Gold,
            transaction.Entry.Cost,
            transaction.Player.Deck.Cards.Count,
            transaction.Player.ExtraFields.CardShopRemovalsUsed);
        confirm.ForceClick();
        return NativeInputResult.Started(
            () => MerchantRemovalCompletionWitness.IsSatisfied(
                baseline,
                new MerchantRemovalCommitObservation(
                    SelectorClosed: !IsCurrent(expectedScreen),
                    SelectedCardStillInDeck: transaction.Player.Deck.Cards.Any(card => ReferenceEquals(card, expectedCard)),
                    Gold: transaction.Player.Gold,
                    DeckCount: transaction.Player.Deck.Cards.Count,
                    CardShopRemovalsUsed: transaction.Player.ExtraFields.CardShopRemovalsUsed,
                    ServiceUsed: transaction.Entry.Used)),
            MerchantConfirmCompletionWitness,
            allowIntermediateStateChanges: true);
    }

    private static NativeInputResult StartPreciseScissorsPreviewConfirm(
        NDeckCardSelectScreen expectedScreen,
        IReadOnlyCollection<CardModel> expectedSelectedCards,
        object source)
    {
        if (source is not PreciseScissorsRemovalSourceBinding.ActiveBinding binding)
            return NativeInputResult.Rejected("precise_scissors_source_changed", "The Precise Scissors source is no longer exact.");
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen))
            return NativeInputResult.Rejected("screen_stage_changed", "Precise Scissors removal confirmation is no longer current.");
        if (expectedSelectedCards.Count != 1)
            return NativeInputResult.Rejected("selection_changed", "Precise Scissors removal no longer has exactly one selected card.");

        CardModel expectedCard = expectedSelectedCards.Single();
        IReadOnlyList<CardModel> currentSelectedCards = BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen);
        if (currentSelectedCards.Count != 1
            || !ReferenceEquals(currentSelectedCards[0], expectedCard)
            || !binding.Player.Deck.Cards.Any(card => ReferenceEquals(card, expectedCard))
            || !binding.Player.Relics.Any(relic => ReferenceEquals(relic, binding.SourceRelic))
            || !PreciseScissorsRemovalSourceBinding.IsActive(binding.Token))
        {
            return NativeInputResult.Rejected(
                "precise_scissors_removal_transaction_changed",
                "The selected card or Precise Scissors acquisition task changed before confirmation.");
        }

        NConfirmButton? confirm = FindControl<NConfirmButton>(expectedScreen, "_previewConfirmButton");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return NativeInputResult.Rejected("confirm_not_available", "The removal confirmation control is no longer enabled.");

        confirm.ForceClick();
        return NativeInputResult.Started(
            () => PreciseScissorsRemovalCompletionWitness.IsSatisfied(
                sourceCompleted: !PreciseScissorsRemovalSourceBinding.IsActive(binding.Token),
                selectorClosed: !IsCurrent(expectedScreen),
                baselineDeck: binding.BaselineDeck,
                currentDeck: binding.Player.Deck.Cards,
                selectedCard: expectedCard),
            "precise_scissors_selected_card_absent_after_exact_relic_task_completion",
            allowIntermediateStateChanges: true);
    }

    private static NativeInputResult StartRewardPreviewConfirm(
        NDeckCardSelectScreen expectedScreen,
        IReadOnlyCollection<CardModel> expectedSelectedCards,
        object source)
    {
        if (source is not RewardCardRemovalSourceBinding.ActiveBinding binding)
            return NativeInputResult.Rejected("reward_removal_source_changed", "The card-removal reward source is no longer exact.");
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen))
            return NativeInputResult.Rejected("screen_stage_changed", "Reward card removal confirmation is no longer current.");
        if (expectedSelectedCards.Count != 1)
            return NativeInputResult.Rejected("selection_changed", "Reward card removal no longer has exactly one selected card.");

        CardModel expectedCard = expectedSelectedCards.Single();
        IReadOnlyList<CardModel> currentSelectedCards = BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen);
        if (currentSelectedCards.Count != 1
            || !ReferenceEquals(currentSelectedCards[0], expectedCard)
            || !binding.Player.Deck.Cards.Any(card => ReferenceEquals(card, expectedCard))
            || !RewardCardRemovalSourceBinding.IsActive(binding.Token))
        {
            return NativeInputResult.Rejected(
                "reward_removal_transaction_changed",
                "The selected card or CardRemovalReward task changed before confirmation.");
        }

        NConfirmButton? confirm = FindControl<NConfirmButton>(expectedScreen, "_previewConfirmButton");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return NativeInputResult.Rejected("confirm_not_available", "The reward-removal confirmation control is no longer enabled.");

        confirm.ForceClick();
        return NativeInputResult.Started(
            () => RewardCardRemovalCompletionWitness.IsSatisfied(
                sourceCompleted: !RewardCardRemovalSourceBinding.IsActive(binding.Token),
                selectorClosed: !IsCurrent(expectedScreen),
                baselineDeck: binding.BaselineDeck,
                currentDeck: binding.Player.Deck.Cards,
                selectedCard: expectedCard),
            RewardConfirmCompletionWitness,
            allowIntermediateStateChanges: true);
    }

    private static NativeInputResult StartPreviewCancel(NDeckCardSelectScreen expectedScreen)
    {
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen))
            return NativeInputResult.Rejected("screen_stage_changed", "Deck removal preview is no longer current.");
        NBackButton? cancel = FindControl<NBackButton>(expectedScreen, "_previewCancelButton");
        if (cancel is not { IsEnabled: true } || !McpMod.IsNodeVisible(cancel))
            return NativeInputResult.Rejected("cancel_not_available", "The removal preview cancel control is no longer enabled.");

        cancel.ForceClick();
        return NativeInputResult.Started(
            () => IsCurrent(expectedScreen) && !IsPreviewVisible(expectedScreen),
            CancelPreviewCompletionWitness);
    }

    private static NativeInputResult StartClose(
        NDeckCardSelectScreen expectedScreen,
        object source)
    {
        if (!IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen))
            return NativeInputResult.Rejected("screen_stage_changed", "Deck removal is no longer cancelable from selection.");
        NBackButton? close = FindControl<NBackButton>(expectedScreen, "_closeButton");
        if (close is not { IsEnabled: true } || !McpMod.IsNodeVisible(close))
            return NativeInputResult.Rejected("cancel_not_available", "The removal close control is no longer enabled.");

        close.ForceClick();
        if (source is RewardCardRemovalSourceBinding.ActiveBinding reward)
        {
            return NativeInputResult.Started(
                () => !RewardCardRemovalSourceBinding.IsActive(reward.Token)
                      && !IsCurrent(expectedScreen)
                      && SameReferences(reward.BaselineDeck, reward.Player.Deck.Cards),
                RewardCancelSelectionCompletionWitness,
                allowIntermediateStateChanges: true);
        }

        return NativeInputResult.Started(
            () => !IsCurrent(expectedScreen),
            MerchantCancelSelectionCompletionWitness);
    }

    internal static NativeInputResult StartDirectToggle(
        NativeEntityRegistry entities,
        string surfaceKind,
        string screenId,
        string cardId,
        bool expectedSelected)
    {
        if (!TryResolveDirectSource(
                entities,
                surfaceKind,
                screenId,
                out NDeckCardSelectScreen? screen,
                out _,
                out NativeInputResult? rejection)
            || screen == null)
        {
            return rejection!;
        }
        if (!entities.TryResolve(cardId, out CardModel? card) || card == null)
        {
            return NativeInputResult.Rejected(
                "deck_removal_binding_stale",
                "The exact source-bound removal card no longer resolves.");
        }
        return StartToggleCard(screen, card, expectedSelected);
    }

    internal static NativeInputResult StartDirectPreview(
        NativeEntityRegistry entities,
        string surfaceKind,
        string screenId)
    {
        return TryResolveDirectSource(
            entities,
            surfaceKind,
            screenId,
            out NDeckCardSelectScreen? screen,
            out _,
            out NativeInputResult? rejection)
            && screen != null
            ? StartPreview(screen)
            : rejection!;
    }

    internal static NativeInputResult StartDirectConfirm(
        NativeEntityRegistry entities,
        string surfaceKind,
        string screenId,
        IReadOnlyCollection<string> selectedCardIds)
    {
        if (!TryResolveDirectSource(
                entities,
                surfaceKind,
                screenId,
                out NDeckCardSelectScreen? screen,
                out object? source,
                out NativeInputResult? rejection)
            || screen == null
            || source == null)
        {
            return rejection!;
        }
        var selectedCards = new List<CardModel>();
        foreach (string cardId in selectedCardIds)
        {
            if (!entities.TryResolve(cardId, out CardModel? card) || card == null)
            {
                return NativeInputResult.Rejected(
                    "deck_removal_binding_stale",
                    "An exact selected source-bound removal card no longer resolves.");
            }
            selectedCards.Add(card);
        }
        return source switch
        {
            MerchantRemovalTransaction transaction =>
                StartMerchantPreviewConfirm(screen, selectedCards, transaction),
            PreciseScissorsRemovalSourceBinding.ActiveBinding preciseScissors =>
                StartPreciseScissorsPreviewConfirm(screen, selectedCards, preciseScissors),
            RewardCardRemovalSourceBinding.ActiveBinding reward =>
                StartRewardPreviewConfirm(screen, selectedCards, reward),
            _ => NativeInputResult.Rejected(
                "deck_removal_source_changed",
                "The exact deck-removal source is no longer supported.")
        };
    }

    internal static NativeInputResult StartDirectPreviewCancel(
        NativeEntityRegistry entities,
        string surfaceKind,
        string screenId)
    {
        return TryResolveDirectSource(
            entities,
            surfaceKind,
            screenId,
            out NDeckCardSelectScreen? screen,
            out _,
            out NativeInputResult? rejection)
            && screen != null
            ? StartPreviewCancel(screen)
            : rejection!;
    }

    internal static NativeInputResult StartDirectClose(
        NativeEntityRegistry entities,
        string surfaceKind,
        string screenId)
    {
        if (surfaceKind == "relic_deck_removal_selection")
        {
            return NativeInputResult.Rejected(
                "precise_scissors_cancel_unsupported",
                "Precise Scissors has no proven cancel-selection completion contract.");
        }
        return TryResolveDirectSource(
            entities,
            surfaceKind,
            screenId,
            out NDeckCardSelectScreen? screen,
            out object? source,
            out NativeInputResult? rejection)
            && screen != null
            && source != null
            ? StartClose(screen, source)
            : rejection!;
    }

    private static bool TryResolveDirectSource(
        NativeEntityRegistry entities,
        string surfaceKind,
        string screenId,
        out NDeckCardSelectScreen? screen,
        out object? source,
        out NativeInputResult? rejection)
    {
        source = null;
        rejection = null;
        if (surfaceKind == "deck_removal_selection")
        {
            bool resolved = TryResolveMerchant(
                entities,
                screenId,
                out screen,
                out MerchantRemovalTransaction? merchant,
                out rejection);
            source = merchant;
            return resolved;
        }

        if (!entities.TryResolve(screenId, out screen) || screen == null || !IsCurrent(screen))
        {
            rejection = NativeInputResult.Rejected(
                "deck_removal_owner_changed",
                "The exact source-bound deck-removal screen is no longer current.");
            return false;
        }
        if (surfaceKind == "relic_deck_removal_selection"
            && PreciseScissorsRemovalSourceBinding.TryGetUnique(
                out PreciseScissorsRemovalSourceBinding.ActiveBinding? preciseScissors)
            && preciseScissors != null)
        {
            source = preciseScissors;
            return true;
        }
        if (surfaceKind == "reward_deck_removal_selection"
            && RewardCardRemovalSourceBinding.TryGetUnique(
                out RewardCardRemovalSourceBinding.ActiveBinding? reward)
            && reward != null)
        {
            source = reward;
            return true;
        }

        rejection = NativeInputResult.Rejected(
            "deck_removal_source_changed",
            "The exact deck-removal source binding is no longer unique and current.");
        return false;
    }

    private static bool TryResolveMerchant(
        NativeEntityRegistry entities,
        string screenId,
        out NDeckCardSelectScreen? screen,
        out MerchantRemovalTransaction? transaction,
        out NativeInputResult? rejection)
    {
        transaction = null;
        rejection = null;
        if (!entities.TryResolve(screenId, out screen) || screen == null || !IsCurrent(screen))
        {
            rejection = NativeInputResult.Rejected(
                "merchant_removal_owner_changed",
                "The exact merchant-removal screen is no longer current.");
            return false;
        }
        if (!ShopSurfaceFacts.TryGetCurrent(
                out MerchantRoom? merchantRoom,
                out NMerchantRoom? room,
                out MerchantInventory? inventory)
            || merchantRoom == null
            || room == null
            || inventory == null
            || inventory.CardRemovalEntry is not { } entry
            || !room.Inventory.IsOpen)
        {
            rejection = NativeInputResult.Rejected(
                "merchant_removal_source_changed",
                "The exact merchant card-removal transaction is no longer current.");
            return false;
        }
        transaction = new MerchantRemovalTransaction(
            merchantRoom,
            room,
            inventory,
            entry,
            inventory.Player);
        return true;
    }

    private static bool SameReferences<T>(
        IReadOnlyCollection<T> expected,
        IReadOnlyCollection<T> actual) where T : class =>
        expected.Count == actual.Count
        && expected.All(item => actual.Any(candidate => ReferenceEquals(candidate, item)));

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
        ActiveInputResolver.IsVisibleActiveOverlay(screen)
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

    private static LiveObservation BindingUnavailable(
        GameBuildIdentity game,
        ILiveContext context,
        string reason,
        IReadOnlyList<string> missing,
        string surfaceKind = SurfaceKind,
        string sourceKind = "merchant")
        => NativeUiFailClosedObservation.BindingUnavailable(
            game,
            context,
            nameof(NDeckCardSelectScreen),
            reason,
            new[] { "NDeckCardSelectScreen exact-version binding" },
            missing,
            $"{sourceKind}_deck_removal_binding_unavailable",
            $"gateway.surface.{surfaceKind}.binding_unavailable",
            $"{sourceKind} removal source or completion semantics are not exact.");

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
