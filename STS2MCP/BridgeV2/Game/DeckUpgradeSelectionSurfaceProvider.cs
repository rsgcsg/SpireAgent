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
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact-build adapter for CardSelectCmd.FromDeckForUpgrade. Selection
/// mechanics are shared read-only facts; upgrade purpose, preview, commit, and
/// completion remain owned by this concrete screen contract.
/// </summary>
internal sealed class DeckUpgradeSelectionSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "deck_upgrade_selection";
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;
    private static readonly FieldInfo? ClickableField =
        typeof(NCardHolder).GetField("_isClickable", Flags);
    private static readonly FieldInfo? PreviewAfterField =
        typeof(NUpgradePreview).GetField("_after", Flags);

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NDeckUpgradeSelectScreen screen)
            return null;

        IBridgeContext context = BridgeContextBuilder.Build(entities);
        if (context is not EventBridgeContext && context is not RestBridgeContext)
        {
            return BindingUnavailable(
                game,
                context,
                "The deck-upgrade selector is visible outside the currently audited event/rest origins.",
                new[] { "upgrade_origin", "legal_actions" });
        }

        return Build(screen, context, entities, game);
    }

    private static BridgeObservationDraft Build(
        NDeckUpgradeSelectScreen screen,
        IBridgeContext context,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!BoundedCardSelectionFacts.TryRead(
                screen,
                out CardSelectorPrefs prefs,
                out IReadOnlyList<CardModel> selectedCards,
                out string? bindingError)
            || ClickableField == null
            || PreviewAfterField == null)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError ?? "The exact deck-upgrade selection binding is unavailable.",
                new[] { "selection_constraints", "selected_cards", "preview", "legal_actions" });
        }

        Control? singlePreview = screen.GetNodeOrNull<Control>("%UpgradeSinglePreviewContainer");
        Control? multiPreview = screen.GetNodeOrNull<Control>("%UpgradeMultiPreviewContainer");
        NBackButton? close = screen.GetNodeOrNull<NBackButton>("%Close");
        if (singlePreview == null || multiPreview == null || close == null)
        {
            return BindingUnavailable(
                game,
                context,
                "One or more exact deck-upgrade stage controls are unavailable.",
                new[] { "preview_controls", "close_control", "legal_actions" });
        }

        bool singleVisible = McpMod.IsNodeVisible(singlePreview);
        bool multiVisible = McpMod.IsNodeVisible(multiPreview);
        if (singleVisible && multiVisible)
        {
            return BindingUnavailable(
                game,
                context,
                "Both mutually exclusive upgrade preview stages are visible.",
                new[] { "unambiguous_stage", "legal_actions" });
        }

        string stage = singleVisible || multiVisible ? "preview" : "selecting";
        string? prompt = ReadNodeText(screen, "%BottomLabel");
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return BindingUnavailable(
                game,
                context,
                "The player-visible deck-upgrade prompt is unavailable.",
                new[] { "prompt", "legal_actions" });
        }

        NGridCardHolder[] holders = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .ToArray();
        HashSet<CardModel> selected = selectedCards.ToHashSet();
        var cardIds = new Dictionary<CardModel, string>();
        VisibleCard[] cards = holders.Select(holder =>
        {
            CardModel card = holder.CardModel;
            string id = entities.GetId(card, "card");
            cardIds[card] = id;
            return BridgeContextBuilder.BuildCard(card, id, selected.Contains(card), displayPile: PileType.Deck);
        }).ToArray();
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
                "A selected upgrade card is absent from the current visible grid.",
                new[] { "selected_cards", "legal_actions" });
        }

        VisibleCard[] previewCards = stage == "preview"
            ? BuildPreviewCards(singleVisible, singlePreview, multiPreview, entities)
            : Array.Empty<VisibleCard>();
        if (stage == "preview" && (selected.Count == 0 || previewCards.Length != selected.Count))
        {
            return BindingUnavailable(
                game,
                context,
                "The visible upgrade preview does not exactly match the selected-card count.",
                new[] { "preview_cards", "legal_actions" });
        }

        var surface = new DeckUpgradeSelectionSurface(
            SurfaceKind,
            stage,
            entities.GetId(screen, "screen"),
            prompt,
            prefs.MinSelect,
            prefs.MaxSelect,
            selected.Count,
            selectedIds,
            prefs.Cancelable,
            cards,
            previewCards);
        List<BridgeActionDraft> actions = BuildActions(
            screen,
            stage,
            prefs,
            holders,
            selected,
            cardIds,
            close,
            singleVisible ? singlePreview : multiPreview);

        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_visible_deck_upgrade_selection",
            actions.Count > 0
                ? "derived_from_same_current_upgrade_controls_as_execution"
                : "temporarily_empty_while_upgrade_ui_settles",
            new[]
            {
                "CardSelectCmd.FromDeckForUpgrade+NDeckUpgradeSelectScreen",
                "NDeckUpgradeSelectScreen._prefs+_selectedCards exact-version bindings",
                "NGridCardHolder.CardModel+NCardHolder._isClickable",
                "NDeckUpgradeSelectScreen single/multi preview controls",
                "NUpgradePreview upgraded after-card or multi-preview holders"
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
            Array.Empty<string>(),
            actions);
    }

    private static List<BridgeActionDraft> BuildActions(
        NDeckUpgradeSelectScreen screen,
        string stage,
        CardSelectorPrefs prefs,
        IReadOnlyList<NGridCardHolder> holders,
        IReadOnlySet<CardModel> selected,
        IReadOnlyDictionary<CardModel, string> cardIds,
        NBackButton close,
        Control previewContainer)
    {
        var actions = new List<BridgeActionDraft>();
        if (stage == "selecting")
        {
            foreach (NGridCardHolder holder in holders.Where(IsHolderClickable))
            {
                CardModel card = holder.CardModel;
                string cardId = cardIds[card];
                bool isSelected = selected.Contains(card);
                actions.Add(new BridgeActionDraft(
                    $"toggle_deck_upgrade_card:{cardId}",
                    "toggle_deck_upgrade_card",
                    "selection",
                    $"{(isSelected ? "Deselect" : "Select")} {McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry} for upgrade",
                    "NDeckUpgradeSelectScreen.OnCardClicked via NCardHolder.Pressed",
                    () => StartToggle(screen, holder, card, isSelected),
                    new[] { new ActionEntityBinding("card", cardId) }));
            }
            if (prefs.Cancelable && close.IsEnabled)
            {
                actions.Add(new BridgeActionDraft(
                    "cancel_deck_upgrade_selection",
                    "cancel_deck_upgrade_selection",
                    "cancel",
                    "Cancel deck upgrade selection",
                    "NDeckUpgradeSelectScreen.CloseSelection via visible close button",
                    () => StartClose(screen, close)));
            }
        }
        else
        {
            NBackButton? cancel = previewContainer.GetNodeOrNull<NBackButton>("Cancel");
            NConfirmButton? confirm = previewContainer.GetNodeOrNull<NConfirmButton>("Confirm");
            if (cancel is { IsEnabled: true })
            {
                actions.Add(new BridgeActionDraft(
                    "cancel_deck_upgrade_preview",
                    "cancel_deck_upgrade_preview",
                    "cancel",
                    "Cancel preview and return to upgrade selection",
                    "NDeckUpgradeSelectScreen.CancelSelection via visible preview control",
                    () => StartPreviewCancel(screen, cancel)));
            }
            if (confirm is { IsEnabled: true } && selected.Count >= prefs.MinSelect)
            {
                actions.Add(new BridgeActionDraft(
                    "confirm_deck_upgrade",
                    "confirm_deck_upgrade",
                    "commit",
                    "Confirm the visible card upgrade",
                    "NDeckUpgradeSelectScreen.ConfirmSelection+caller CardCmd.Upgrade",
                    () => StartConfirm(screen, confirm, selected),
                    selected.Select(card => new ActionEntityBinding("card", cardIds[card])).ToArray()));
            }
        }
        return actions;
    }

    private static VisibleCard[] BuildPreviewCards(
        bool singleVisible,
        Control singlePreviewContainer,
        Control multiPreviewContainer,
        BridgeEntityRegistry entities)
    {
        Control? root;
        if (singleVisible)
        {
            NUpgradePreview? preview = singlePreviewContainer.GetNodeOrNull<NUpgradePreview>("UpgradePreview");
            root = preview == null ? null : PreviewAfterField?.GetValue(preview) as Control;
        }
        else
        {
            root = multiPreviewContainer.GetNodeOrNull<Control>("Cards");
        }
        if (root == null)
            return Array.Empty<VisibleCard>();

        CardModel[] previewCards = McpMod.FindAll<NPreviewCardHolder>(root)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .Select(holder => holder.CardModel)
            .OfType<CardModel>()
            .ToArray();
        return previewCards
            .Select(card => BridgeContextBuilder.BuildCard(
                card,
                entities.GetId(card, "upgrade_preview_card"),
                displayPile: PileType.Deck))
            .ToArray();
    }

    private static BridgeActionStartResult StartToggle(
        NDeckUpgradeSelectScreen expectedScreen,
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
            || !expectedCard.IsUpgradable
            || BoundedCardSelectionFacts.IsSelected(expectedScreen, expectedCard) != wasSelected)
        {
            return BridgeActionStartResult.Rejected(
                "deck_upgrade_card_changed",
                "The advertised card is no longer an exact selectable upgrade candidate.");
        }

        expectedHolder.EmitSignal(NCardHolder.SignalName.Pressed, expectedHolder);
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen)
                  && (IsPreviewVisible(expectedScreen)
                      || BoundedCardSelectionFacts.IsSelected(expectedScreen, expectedCard) != wasSelected),
            "upgrade_selection_changed_or_preview_opened");
    }

    private static BridgeActionStartResult StartPreviewCancel(
        NDeckUpgradeSelectScreen expectedScreen,
        NBackButton expectedButton)
    {
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen) || !expectedButton.IsEnabled)
            return BridgeActionStartResult.Rejected("deck_upgrade_preview_changed", "The upgrade preview can no longer be cancelled.");
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen)
                  && !IsPreviewVisible(expectedScreen)
                  && BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen).Count == 0,
            "upgrade_preview_closed_and_selection_cleared");
    }

    private static BridgeActionStartResult StartConfirm(
        NDeckUpgradeSelectScreen expectedScreen,
        NConfirmButton expectedButton,
        IReadOnlyCollection<CardModel> selectedCards)
    {
        IReadOnlyList<CardModel> currentSelection = BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen);
        if (!IsCurrent(expectedScreen)
            || !IsPreviewVisible(expectedScreen)
            || !expectedButton.IsEnabled
            || selectedCards.Count == 0
            || currentSelection.Count != selectedCards.Count
            || selectedCards.Any(expected => !currentSelection.Any(current => ReferenceEquals(current, expected)))
            || selectedCards.Any(card => !card.IsUpgradable))
        {
            return BridgeActionStartResult.Rejected("deck_upgrade_commit_changed", "The visible upgrade preview is no longer commit-ready.");
        }

        var previousLevels = selectedCards.ToDictionary(card => card, card => card.CurrentUpgradeLevel);
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  && previousLevels.All(entry => entry.Key.CurrentUpgradeLevel > entry.Value),
            "upgrade_screen_closed_and_selected_instances_upgraded");
    }

    private static BridgeActionStartResult StartClose(
        NDeckUpgradeSelectScreen expectedScreen,
        NBackButton expectedButton)
    {
        if (!IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen) || !expectedButton.IsEnabled)
            return BridgeActionStartResult.Rejected("deck_upgrade_close_changed", "The upgrade selector is no longer cancelable.");
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen),
            "upgrade_selection_cancelled_and_screen_closed");
    }

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool IsPreviewVisible(NDeckUpgradeSelectScreen screen) =>
        (screen.GetNodeOrNull<Control>("%UpgradeSinglePreviewContainer") is { } single
         && McpMod.IsNodeVisible(single))
        || (screen.GetNodeOrNull<Control>("%UpgradeMultiPreviewContainer") is { } multi
            && McpMod.IsNodeVisible(multi));

    private static bool IsCurrent(NDeckUpgradeSelectScreen screen) =>
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
        var unavailable = new UnsupportedSurface("unsupported", nameof(NDeckUpgradeSelectScreen), reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "NDeckUpgradeSelectScreen exact-version binding" },
            missing);
        string signature = BridgeHash.Object(new { game.Version, context, unavailable, missing });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            unavailable,
            completeness,
            game,
            new[] { "deck_upgrade_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.deck_upgrade.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}
