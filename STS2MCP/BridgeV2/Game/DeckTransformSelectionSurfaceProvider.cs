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
using MegaCrit.Sts2.Core.Nodes.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact-source adapter for WhisperingHollow ->
/// CardSelectCmd.FromDeckForTransformation. It shares only bounded selection
/// facts with other selectors; random-preview semantics, commit validation,
/// and the transform outcome witness remain purpose-specific.
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
        if (context is not EventBridgeContext eventContext
            || !string.Equals(eventContext.EventId, AuditedEventId, StringComparison.Ordinal))
        {
            return BindingUnavailable(
                game,
                context,
                "The random deck-transform selector has no audited semantic caller in this current context.",
                new[] { "transform_origin", "legal_actions" });
        }

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

        return Build(screen, eventContext, player, entities, game);
    }

    private static BridgeObservationDraft Build(
        NDeckTransformSelectScreen screen,
        EventBridgeContext context,
        Player player,
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
        var surface = new DeckTransformSelectionSurface(
            SurfaceKind,
            stage,
            entities.GetId(screen, "screen"),
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
            cards);
        List<BridgeActionDraft> actions = BuildActions(
            screen,
            player,
            stage,
            prefs,
            holders,
            selected,
            cardIds,
            grid,
            previewButton,
            previewCancel,
            previewConfirm,
            close,
            upgrades,
            upgradeToggleVisible);

        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_whispering_hollow_random_transform_selection",
            actions.Count > 0
                ? "derived_from_same_current_transform_controls_as_execution"
                : "temporarily_empty_while_transform_ui_settles",
            new[]
            {
                "WhisperingHollow.Hug -> CardSelectCmd.FromDeckForTransformation",
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
                "The preview cycles possible cards for player presentation only; it does not reveal or predict the committed random replacement."
            },
            actions);
    }

    private static List<BridgeActionDraft> BuildActions(
        NDeckTransformSelectScreen screen,
        Player player,
        string stage,
        CardSelectorPrefs prefs,
        IReadOnlyList<NGridCardHolder> holders,
        IReadOnlySet<CardModel> selected,
        IReadOnlyDictionary<CardModel, string> cardIds,
        NCardGrid grid,
        NConfirmButton previewButton,
        NBackButton previewCancel,
        NConfirmButton previewConfirm,
        NBackButton close,
        NTickbox upgrades,
        bool upgradeToggleVisible)
    {
        var actions = new List<BridgeActionDraft>();
        if (stage == "selecting")
        {
            foreach (NGridCardHolder holder in holders.Where(IsHolderClickable))
            {
                CardModel card = holder.CardModel;
                bool wasSelected = selected.Contains(card);
                if (!wasSelected && selected.Count >= prefs.MaxSelect)
                    continue;
                string cardId = cardIds[card];
                actions.Add(new BridgeActionDraft(
                    $"toggle_deck_transform_card:{cardId}:{wasSelected}",
                    "toggle_deck_transform_card",
                    "selection",
                    $"{(wasSelected ? "Deselect" : "Select")} {McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry} for random transformation",
                    "NCardGrid.HolderPressed+NDeckTransformSelectScreen.OnCardClicked",
                    () => StartToggle(screen, holder, card, wasSelected),
                    new[] { new ActionEntityBinding("card", cardId) }));
            }

            if (previewButton.IsEnabled && McpMod.IsNodeVisible(previewButton))
            {
                actions.Add(new BridgeActionDraft(
                    "preview_deck_transform",
                    "preview_deck_transform",
                    "preview",
                    "Preview the selected random transformation",
                    "NDeckTransformSelectScreen.ConfirmSelection",
                    () => StartPreview(screen, previewButton)));
            }
            if (prefs.Cancelable && close.IsEnabled && McpMod.IsNodeVisible(close))
            {
                actions.Add(new BridgeActionDraft(
                    "cancel_deck_transform_selection",
                    "cancel_deck_transform_selection",
                    "navigation",
                    "Cancel random card transformation",
                    "NDeckTransformSelectScreen.CloseSelection",
                    () => StartClose(screen, close)));
            }
            if (upgradeToggleVisible && upgrades.IsEnabled)
            {
                actions.Add(new BridgeActionDraft(
                    $"toggle_deck_transform_upgrade_view:{grid.IsShowingUpgrades}",
                    "toggle_deck_transform_upgrade_view",
                    "presentation",
                    grid.IsShowingUpgrades ? "Show current card versions" : "Show upgraded card previews",
                    "NDeckTransformSelectScreen.ToggleShowUpgrades",
                    () => StartUpgradeToggle(screen, upgrades, grid, grid.IsShowingUpgrades)));
            }
        }
        else
        {
            if (previewCancel.IsEnabled && McpMod.IsNodeVisible(previewCancel))
            {
                actions.Add(new BridgeActionDraft(
                    "cancel_deck_transform_preview",
                    "cancel_deck_transform_preview",
                    "navigation",
                    "Return to random transformation selection",
                    "NDeckTransformSelectScreen.CancelSelection",
                    () => StartPreviewCancel(screen, previewCancel)));
            }
            if (previewConfirm.IsEnabled
                && McpMod.IsNodeVisible(previewConfirm)
                && selected.Count >= prefs.MinSelect)
            {
                actions.Add(new BridgeActionDraft(
                    "confirm_deck_transform",
                    "confirm_deck_transform",
                    "commit",
                    "Confirm the random transformation",
                    "NDeckTransformSelectScreen.CompleteSelection+WhisperingHollow.CardCmd.TransformToRandom",
                    () => StartConfirm(screen, previewConfirm, selected, player),
                    selected.Select(card => new ActionEntityBinding("card", cardIds[card])).ToArray()));
            }
        }

        return actions;
    }

    private static BridgeActionStartResult StartToggle(
        NDeckTransformSelectScreen expectedScreen,
        NGridCardHolder expectedHolder,
        CardModel expectedCard,
        bool wasSelected)
    {
        if (!IsCurrent(expectedScreen)
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
        NConfirmButton expectedButton)
    {
        if (!IsCurrent(expectedScreen)
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
        NBackButton expectedButton)
    {
        if (!IsCurrent(expectedScreen)
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
        Player player)
    {
        IReadOnlyList<CardModel> currentSelection = BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen);
        if (!IsCurrent(expectedScreen)
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

        int baselineDeckCount = player.Deck.Cards.Count;
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  && player.Deck.Cards.Count == baselineDeckCount
                  && selectedCards.All(original => player.Deck.Cards.All(card => !ReferenceEquals(card, original))),
            "transform_screen_closed_original_instances_absent_and_deck_count_preserved",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartClose(
        NDeckTransformSelectScreen expectedScreen,
        NBackButton expectedButton)
    {
        if (!IsCurrent(expectedScreen)
            || IsPreviewVisible(expectedScreen)
            || !expectedButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedButton))
        {
            return BridgeActionStartResult.Rejected("transform_close_changed", "The transform selector is no longer cancelable.");
        }
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen),
            "transform_selection_cancelled_and_closed");
    }

    private static BridgeActionStartResult StartUpgradeToggle(
        NDeckTransformSelectScreen expectedScreen,
        NTickbox expectedTickbox,
        NCardGrid expectedGrid,
        bool wasShowingUpgrades)
    {
        if (!IsCurrent(expectedScreen)
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

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        IBridgeContext context,
        string reason,
        IReadOnlyList<string> missing)
    {
        var unavailable = new UnsupportedSurface("unsupported", nameof(NDeckTransformSelectScreen), reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "NDeckTransformSelectScreen exact-source binding" },
            missing);
        string signature = BridgeHash.Object(new { game.Version, context, unavailable, missing });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            unavailable,
            completeness,
            game,
            new[] { "deck_transform_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.deck_transform.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}
