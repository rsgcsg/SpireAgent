using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.CardSelection;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Events;
using MegaCrit.Sts2.Core.Models.Relics;
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
/// Source-discriminated adapter for native random deck transforms. It shares
/// the exact selector mechanics across audited callers while source identity,
/// execute-time validation, and completion remain explicit.
/// </summary>
internal sealed class DeckTransformSelectionSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "deck_transform_selection";
    private const string AuditedEventId = "WHISPERING_HOLLOW";
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
        if (snapshot.TopOverlay is not NDeckTransformSelectScreen screen)
            return null;

        IBridgeContext context = BridgeContextBuilder.Build(entities);
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (runState == null
            || runState.Players.Count != 1
            || LocalContext.GetMe(runState) is not { } player)
        {
            return BindingUnavailable(
                game,
                context,
                "The exact local single-player transform owner is unavailable.",
                new[] { "transform_owner", "legal_actions" });
        }

        if (!TryResolveSource(context, player, out TransformSourceContract? source, out string? sourceError))
        {
            return BindingUnavailable(
                game,
                context,
                sourceError ?? "The random deck-transform selector has no unique audited semantic caller.",
                new[] { "transform_origin", "legal_actions" });
        }

        return Build(screen, context, player, source!, entities, game);
    }

    private static BridgeObservationDraft Build(
        NDeckTransformSelectScreen screen,
        IBridgeContext context,
        Player player,
        TransformSourceContract source,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!BoundedCardSelectionFacts.TryRead(
                screen,
                out CardSelectorPrefs prefs,
                out IReadOnlyList<CardModel> selectedCards,
                out string? bindingError)
            || ClickableField == null)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError ?? "The exact deck-transform selection binding is unavailable.",
                new[] { "selection_constraints", "selected_cards", "legal_actions" });
        }

        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(screen);
        NConfirmButton? previewButton = screen.GetNodeOrNull<NConfirmButton>("Confirm");
        Control? previewContainer = screen.GetNodeOrNull<Control>("%PreviewContainer");
        NBackButton? previewCancel = previewContainer?.GetNodeOrNull<NBackButton>("Cancel");
        NConfirmButton? previewConfirm = previewContainer?.GetNodeOrNull<NConfirmButton>("Confirm");
        NBackButton? close = screen.GetNodeOrNull<NBackButton>("%Close");
        NTickbox? upgrades = screen.GetNodeOrNull<NTickbox>("%Upgrades");
        if (grid == null
            || previewButton == null
            || previewContainer == null
            || previewCancel == null
            || previewConfirm == null
            || close == null
            || upgrades == null)
        {
            return BindingUnavailable(
                game,
                context,
                "One or more exact transform selector controls are unavailable.",
                new[] { "stage_controls", "upgrade_view_control", "legal_actions" });
        }

        string? prompt = ReadNodeText(screen, "%BottomLabel");
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return BindingUnavailable(
                game,
                context,
                "The player-visible transform prompt is unavailable.",
                new[] { "prompt", "legal_actions" });
        }

        string stage = McpMod.IsNodeVisible(previewContainer) ? "preview" : "selecting";
        NGridCardHolder[] holders = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .ToArray();
        HashSet<CardModel> selected = selectedCards.ToHashSet();
        var cardIds = new Dictionary<CardModel, string>();
        var cards = new List<VisibleCard>(holders.Length);
        foreach (NGridCardHolder holder in holders)
        {
            CardModel original = holder.CardModel;
            string id = entities.GetId(original, "card");
            cardIds[original] = id;
            CardModel? displayed = holder.IsShowingUpgradedCard
                ? holder.CardNode?.Model
                : original;
            if (displayed == null)
            {
                return BindingUnavailable(
                    game,
                    context,
                    "A visible transform card's exact displayed model is unavailable.",
                    new[] { "visible_cards", "legal_actions" });
            }
            cards.Add(BridgeContextBuilder.BuildCard(
                displayed,
                id,
                selected.Contains(original),
                displayPile: PileType.Deck));
        }
        string[] selectedIds = selected
            .Select(card => cardIds.TryGetValue(card, out string? id) ? id : null)
            .Where(id => id != null)
            .Cast<string>()
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToArray();
        if (selectedIds.Length != selected.Count
            || holders.Any(holder => !ReferenceEquals(holder.CardModel.Owner, player)))
        {
            return BindingUnavailable(
                game,
                context,
                "The transform selection is not an exact visible subset of the local player's deck.",
                new[] { "selected_cards", "transform_owner", "legal_actions" });
        }

        bool upgradeToggleVisible = McpMod.IsNodeVisible(upgrades);
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
        bool canPreview = stage == "selecting"
                          && previewButton.IsEnabled
                          && McpMod.IsNodeVisible(previewButton);
        bool canCancelSelection = stage == "selecting"
                                  && prefs.Cancelable
                                  && close.IsEnabled
                                  && McpMod.IsNodeVisible(close);
        bool canToggleUpgradeView = stage == "selecting"
                                    && upgradeToggleVisible
                                    && upgrades.IsEnabled;
        bool canCancelPreview = stage == "preview"
                                && previewCancel.IsEnabled
                                && McpMod.IsNodeVisible(previewCancel);
        bool canConfirm = stage == "preview"
                          && previewConfirm.IsEnabled
                          && McpMod.IsNodeVisible(previewConfirm)
                          && selected.Count >= prefs.MinSelect;
        var surface = new DeckTransformSelectionSurface(
            SurfaceKind,
            stage,
            entities.GetId(screen, "screen"),
            source.Wire,
            prompt,
            prefs.MinSelect,
            prefs.MaxSelect,
            selected.Count,
            selectedIds,
            prefs.Cancelable,
            upgradeToggleVisible,
            grid.IsShowingUpgrades,
            stage == "preview" ? "random_uncommitted_cycle" : "none",
            false,
            cards)
        {
            SelectableCardEntityIds = selectableIds,
            DeselectableCardEntityIds = deselectableIds,
            CanPreview = canPreview,
            CanCancelSelection = canCancelSelection,
            CanCancelPreview = canCancelPreview,
            CanConfirm = canConfirm,
            CanToggleUpgradeView = canToggleUpgradeView
        };

        bool hasCurrentCommand = selectableIds.Length > 0
                                 || deselectableIds.Length > 0
                                 || canPreview
                                 || canCancelSelection
                                 || canCancelPreview
                                 || canConfirm
                                 || canToggleUpgradeView;
        string readiness = hasCurrentCommand ? "ready" : "settling";
        var completeness = new StateCompleteness(
            $"contract_complete_for_{source.Wire.Kind}_random_transform_selection",
            hasCurrentCommand
                ? "derived_from_same_current_transform_controls_as_execution"
                : "temporarily_empty_while_transform_ui_settles",
            new[]
            {
                source.Wire.BindingEvidence,
                "NDeckTransformSelectScreen exact controls and bounded selection fields",
                "NCardGrid visible holders and current upgrade-preview mode",
                "NTransformPreview random uncommitted cycle semantics",
                "CardCmd.TransformToRandom exact-instance replacement semantics"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            context,
            surface
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
                "The preview cycles possible cards for player presentation only; it does not reveal or predict the committed random replacement."
            },
            Array.Empty<BridgeActionDraft>());
    }

    private static BridgeActionStartResult StartToggle(
        NDeckTransformSelectScreen expectedScreen,
        NGridCardHolder expectedHolder,
        CardModel expectedCard,
        bool wasSelected,
        TransformSourceContract source)
    {
        if (!IsCurrent(expectedScreen)
            || !source.IsCurrent()
            || IsPreviewVisible(expectedScreen)
            || !McpMod.FindAll<NGridCardHolder>(expectedScreen).Any(holder => ReferenceEquals(holder, expectedHolder))
            || !ReferenceEquals(expectedHolder.CardModel, expectedCard)
            || !McpMod.IsNodeVisible(expectedHolder)
            || !IsHolderClickable(expectedHolder)
            || !expectedCard.IsTransformable
            || BoundedCardSelectionFacts.IsSelected(expectedScreen, expectedCard) != wasSelected)
        {
            return BridgeActionStartResult.Rejected(
                "deck_transform_card_changed",
                "The advertised card is no longer an exact selectable transform candidate.");
        }

        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(expectedScreen);
        if (grid == null)
            return BridgeActionStartResult.Rejected("transform_grid_changed", "The exact transform grid is unavailable.");
        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, expectedHolder);
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen)
                  && (IsPreviewVisible(expectedScreen)
                      || BoundedCardSelectionFacts.IsSelected(expectedScreen, expectedCard) != wasSelected),
            "transform_selection_changed_or_preview_opened");
    }

    private static BridgeActionStartResult StartPreview(
        NDeckTransformSelectScreen expectedScreen,
        NConfirmButton expectedButton,
        TransformSourceContract source)
    {
        if (!IsCurrent(expectedScreen)
            || !source.IsCurrent()
            || IsPreviewVisible(expectedScreen)
            || !expectedButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedButton))
        {
            return BridgeActionStartResult.Rejected("transform_preview_changed", "The transform preview is no longer available.");
        }
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen) && IsPreviewVisible(expectedScreen),
            "random_transform_preview_opened");
    }

    private static BridgeActionStartResult StartPreviewCancel(
        NDeckTransformSelectScreen expectedScreen,
        NBackButton expectedButton,
        TransformSourceContract source)
    {
        if (!IsCurrent(expectedScreen)
            || !source.IsCurrent()
            || !IsPreviewVisible(expectedScreen)
            || !expectedButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedButton))
        {
            return BridgeActionStartResult.Rejected("transform_preview_changed", "The random transform preview can no longer be cancelled.");
        }
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen)
                  && !IsPreviewVisible(expectedScreen)
                  && BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen).Count == 0,
            "transform_preview_closed_and_selection_cleared");
    }

    private static BridgeActionStartResult StartConfirm(
        NDeckTransformSelectScreen expectedScreen,
        NConfirmButton expectedButton,
        IReadOnlyCollection<CardModel> selectedCards,
        Player player,
        TransformSourceContract source)
    {
        IReadOnlyList<CardModel> currentSelection = BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen);
        if (!IsCurrent(expectedScreen)
            || !source.IsCurrent()
            || !IsPreviewVisible(expectedScreen)
            || !expectedButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedButton)
            || selectedCards.Count == 0
            || currentSelection.Count != selectedCards.Count
            || selectedCards.Any(expected => !currentSelection.Any(current => ReferenceEquals(current, expected)))
            || selectedCards.Any(card => !card.IsTransformable
                                         || !ReferenceEquals(card.Owner, player)
                                         || !player.Deck.Cards.Any(deckCard => ReferenceEquals(deckCard, card))))
        {
            return BridgeActionStartResult.Rejected(
                "deck_transform_commit_changed",
                "The selected cards are no longer an exact commit-ready random transform set.");
        }

        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => DeckTransformCompletionWitness.IsSatisfied(
                source.IsSettled(),
                !IsCurrent(expectedScreen),
                source.BaselineDeck,
                player.Deck.Cards,
                selectedCards),
            "transform_screen_closed_original_instances_absent_and_deck_count_preserved",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartClose(
        NDeckTransformSelectScreen expectedScreen,
        NBackButton expectedButton,
        TransformSourceContract source)
    {
        if (!IsCurrent(expectedScreen)
            || !source.IsCurrent()
            || IsPreviewVisible(expectedScreen)
            || !expectedButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedButton))
        {
            return BridgeActionStartResult.Rejected("transform_close_changed", "The transform selector is no longer cancelable.");
        }
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen) && source.IsSettled(),
            "transform_selection_cancelled_and_closed");
    }

    private static BridgeActionStartResult StartUpgradeToggle(
        NDeckTransformSelectScreen expectedScreen,
        NTickbox expectedTickbox,
        NCardGrid expectedGrid,
        bool wasShowingUpgrades,
        TransformSourceContract source)
    {
        if (!IsCurrent(expectedScreen)
            || !source.IsCurrent()
            || IsPreviewVisible(expectedScreen)
            || !expectedTickbox.IsEnabled
            || !McpMod.IsNodeVisible(expectedTickbox)
            || expectedGrid.IsShowingUpgrades != wasShowingUpgrades)
        {
            return BridgeActionStartResult.Rejected(
                "transform_upgrade_view_changed",
                "The transform upgrade-preview control changed before execution.");
        }
        expectedTickbox.ForceToggleTick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen) && expectedGrid.IsShowingUpgrades != wasShowingUpgrades,
            "transform_upgrade_preview_mode_changed");
    }

    internal static BridgeActionStartResult StartDirectToggle(
        BridgeEntityRegistry entities,
        string screenId,
        string cardId,
        bool expectedSelected,
        DeckTransformSource expectedSource)
    {
        if (!TryResolveDirect(
                entities,
                screenId,
                expectedSource,
                out NDeckTransformSelectScreen? screen,
                out _,
                out TransformSourceContract? source)
            || !entities.TryResolve(cardId, out CardModel? card)
            || card == null)
        {
            return BridgeActionStartResult.Rejected(
                "deck_transform_binding_stale",
                "The exact transform screen, source, or card no longer resolves.");
        }
        NGridCardHolder? holder = McpMod.FindAll<NGridCardHolder>(screen!)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, card));
        return holder == null
            ? BridgeActionStartResult.Rejected(
                "deck_transform_card_changed",
                "The exact transform card is no longer in the current grid.")
            : StartToggle(screen!, holder, card, expectedSelected, source!);
    }

    internal static BridgeActionStartResult StartDirectPreview(
        BridgeEntityRegistry entities,
        string screenId,
        DeckTransformSource expectedSource)
    {
        if (!TryResolveDirect(entities, screenId, expectedSource, out NDeckTransformSelectScreen? screen, out _, out TransformSourceContract? source)
            || screen!.GetNodeOrNull<NConfirmButton>("Confirm") is not { } button)
        {
            return BridgeActionStartResult.Rejected("deck_transform_binding_stale", "The exact transform preview control no longer resolves.");
        }
        return StartPreview(screen, button, source!);
    }

    internal static BridgeActionStartResult StartDirectCancelSelection(
        BridgeEntityRegistry entities,
        string screenId,
        DeckTransformSource expectedSource)
    {
        if (!TryResolveDirect(entities, screenId, expectedSource, out NDeckTransformSelectScreen? screen, out _, out TransformSourceContract? source)
            || screen!.GetNodeOrNull<NBackButton>("%Close") is not { } close)
        {
            return BridgeActionStartResult.Rejected("deck_transform_binding_stale", "The exact transform close control no longer resolves.");
        }
        return StartClose(screen, close, source!);
    }

    internal static BridgeActionStartResult StartDirectCancelPreview(
        BridgeEntityRegistry entities,
        string screenId,
        DeckTransformSource expectedSource)
    {
        if (!TryResolveDirect(entities, screenId, expectedSource, out NDeckTransformSelectScreen? screen, out _, out TransformSourceContract? source)
            || screen!.GetNodeOrNull<Control>("%PreviewContainer")?.GetNodeOrNull<NBackButton>("Cancel") is not { } cancel)
        {
            return BridgeActionStartResult.Rejected("deck_transform_binding_stale", "The exact transform preview cancel control no longer resolves.");
        }
        return StartPreviewCancel(screen, cancel, source!);
    }

    internal static BridgeActionStartResult StartDirectConfirm(
        BridgeEntityRegistry entities,
        string screenId,
        IReadOnlyList<string> selectedCardIds,
        DeckTransformSource expectedSource)
    {
        if (!TryResolveDirect(entities, screenId, expectedSource, out NDeckTransformSelectScreen? screen, out Player? player, out TransformSourceContract? source)
            || screen!.GetNodeOrNull<Control>("%PreviewContainer")?.GetNodeOrNull<NConfirmButton>("Confirm") is not { } confirm)
        {
            return BridgeActionStartResult.Rejected("deck_transform_binding_stale", "The exact transform confirmation no longer resolves.");
        }
        var selected = new List<CardModel>(selectedCardIds.Count);
        foreach (string cardId in selectedCardIds)
        {
            if (!entities.TryResolve(cardId, out CardModel? card) || card == null)
                return BridgeActionStartResult.Rejected("deck_transform_selection_changed", "An exact selected transform card no longer resolves.");
            selected.Add(card);
        }
        return StartConfirm(screen, confirm, selected, player!, source!);
    }

    internal static BridgeActionStartResult StartDirectToggleUpgradeView(
        BridgeEntityRegistry entities,
        string screenId,
        bool expectedShowingUpgrades,
        DeckTransformSource expectedSource)
    {
        if (!TryResolveDirect(entities, screenId, expectedSource, out NDeckTransformSelectScreen? screen, out _, out TransformSourceContract? source)
            || McpMod.FindFirst<NCardGrid>(screen!) is not { } grid
            || screen!.GetNodeOrNull<NTickbox>("%Upgrades") is not { } upgrades)
        {
            return BridgeActionStartResult.Rejected("deck_transform_binding_stale", "The exact transform upgrade-view control no longer resolves.");
        }
        return StartUpgradeToggle(screen, upgrades, grid, expectedShowingUpgrades, source!);
    }

    private static bool TryResolveDirect(
        BridgeEntityRegistry entities,
        string screenId,
        DeckTransformSource expectedSource,
        out NDeckTransformSelectScreen? screen,
        out Player? player,
        out TransformSourceContract? source)
    {
        screen = null;
        player = null;
        source = null;
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        player = runState == null ? null : LocalContext.GetMe(runState);
        IBridgeContext context = BridgeContextBuilder.Build(entities);
        return entities.TryResolve(screenId, out screen)
               && screen != null
               && player != null
               && IsCurrent(screen)
               && TryResolveSource(context, player, out source, out _)
               && source != null
               && string.Equals(source.Wire.Kind, expectedSource.Kind, StringComparison.Ordinal)
               && string.Equals(source.Wire.DefinitionId, expectedSource.DefinitionId, StringComparison.Ordinal)
               && string.Equals(source.Wire.BindingEvidence, expectedSource.BindingEvidence, StringComparison.Ordinal);
    }

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool IsPreviewVisible(NDeckTransformSelectScreen screen) =>
        screen.GetNodeOrNull<Control>("%PreviewContainer") is { } preview
        && McpMod.IsNodeVisible(preview);

    private static bool IsCurrent(NDeckTransformSelectScreen screen) =>
        ActiveSurfaceResolver.IsVisibleActiveOverlay(screen)
        && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    private static string? ReadNodeText(Node root, string path)
    {
        try
        {
            Node? node = root.GetNodeOrNull(path);
            if (node == null)
                return null;
            Variant text = node.Get("text");
            return text.VariantType == Variant.Type.Nil
                ? null
                : McpMod.StripRichTextTags(text.AsString()).Replace("\n", " ");
        }
        catch
        {
            return null;
        }
    }

    private static bool TryResolveSource(
        IBridgeContext context,
        Player player,
        out TransformSourceContract? source,
        out string? error)
    {
        var candidates = new List<TransformSourceContract>();
        if (context is EventBridgeContext eventContext
            && string.Equals(eventContext.EventId, AuditedEventId, StringComparison.Ordinal))
        {
            candidates.Add(new TransformSourceContract(
                new DeckTransformSource(
                    "whispering_hollow_event",
                    AuditedEventId,
                    "WhisperingHollow.Hug+CardSelectCmd.FromDeckForTransformation"),
                player.Deck.Cards.ToArray(),
                () => IsWhisperingHollowCurrent(player),
                static () => true));
        }

        if (DeckTransformSourceBinding.TryGetUnique(out DeckTransformSourceBinding.NewLeafBinding? newLeaf)
            && newLeaf != null
            && ReferenceEquals(newLeaf.Player, player)
            && player.Relics.Any(relic => ReferenceEquals(relic, newLeaf.SourceRelic)))
        {
            candidates.Add(new TransformSourceContract(
                new DeckTransformSource(
                    "new_leaf_relic_pickup",
                    "NEW_LEAF",
                    "NewLeaf.AfterObtained+CardSelectCmd.FromDeckForTransformation+task-local-source-binding"),
                newLeaf.BaselineDeck,
                () => DeckTransformSourceBinding.IsActive(newLeaf.Token)
                      && ReferenceEquals(newLeaf.SourceRelic.Owner, player)
                      && player.Relics.Any(relic => ReferenceEquals(relic, newLeaf.SourceRelic)),
                () => !DeckTransformSourceBinding.IsActive(newLeaf.Token)));
        }

        source = candidates.Count == 1 ? candidates[0] : null;
        error = candidates.Count switch
        {
            0 => "The random deck-transform selector has no audited semantic caller in this current context.",
            _ => "Multiple random deck-transform source bindings are active; authority is ambiguous."
        };
        return source != null;
    }

    private static bool IsWhisperingHollowCurrent(Player player)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (runState == null || !ReferenceEquals(LocalContext.GetMe(runState), player))
            return false;
        EventModel? current = (runState.CurrentRoom as EventRoom)?.LocalMutableEvent
                              ?? (runState.CurrentRoom as EventRoom)?.CanonicalEvent;
        return current is WhisperingHollow;
    }

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        IBridgeContext context,
        string reason,
        IReadOnlyList<string> missing)
    {
        return BridgeFailClosedObservation.BindingUnavailable(
            game,
            context,
            nameof(NDeckTransformSelectScreen),
            reason,
            new[] { "NDeckTransformSelectScreen exact-source binding" },
            missing,
            "deck_transform_binding_unavailable",
            "bridge.surface.deck_transform.binding_unavailable",
            "No exact random-transform source owns mutation authority.");
    }

    private sealed record TransformSourceContract(
        DeckTransformSource Wire,
        IReadOnlyList<CardModel> BaselineDeck,
        Func<bool> IsCurrent,
        Func<bool> IsSettled);
}
