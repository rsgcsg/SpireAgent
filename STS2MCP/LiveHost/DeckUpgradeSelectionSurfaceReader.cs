using STS2_MCP.NativeUi;
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
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

/// <summary>
/// Exact-build adapter for CardSelectCmd.FromDeckForUpgrade. Selection
/// mechanics are shared read-only facts; upgrade purpose, preview, commit, and
/// completion remain owned by this concrete screen contract.
/// </summary>
internal sealed class DeckUpgradeSelectionSurfaceReader : ILiveSurfaceReader
{
    private const string SurfaceKind = "deck_upgrade_selection";
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;
    private static readonly FieldInfo? ClickableField =
        typeof(NCardHolder).GetField("_isClickable", Flags);
    private static readonly FieldInfo? PreviewAfterField =
        typeof(NUpgradePreview).GetField("_after", Flags);

    public string Kind => SurfaceKind;

    public InputOwnerLayer Layer => InputOwnerLayer.Overlay;

    public LiveObservation? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        NativeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NDeckUpgradeSelectScreen screen)
            return null;

        ILiveContext context = LiveContextReader.Build(entities);
        if (context is not EventLiveContext && context is not RestLiveContext)
        {
            return BindingUnavailable(
                game,
                context,
                "The deck-upgrade selector is visible outside the currently audited event/rest origins.",
                new[] { "upgrade_origin", "legal_actions" });
        }

        return Build(screen, context, entities, game);
    }

    private static LiveObservation Build(
        NDeckUpgradeSelectScreen screen,
        ILiveContext context,
        NativeEntityRegistry entities,
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
            return LiveContextReader.BuildCard(card, id, selected.Contains(card), displayPile: PileType.Deck);
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

        string screenId = entities.GetId(screen, "screen");
        string[] selectableIds = stage == "selecting"
            ? holders.Where(holder => IsHolderClickable(holder) && !selected.Contains(holder.CardModel))
                .Select(holder => cardIds[holder.CardModel])
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        string[] deselectableIds = stage == "selecting"
            ? holders.Where(holder => IsHolderClickable(holder) && selected.Contains(holder.CardModel))
                .Select(holder => cardIds[holder.CardModel])
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        NBackButton? previewCancel = stage == "preview"
            ? (singleVisible ? singlePreview : multiPreview).GetNodeOrNull<NBackButton>("Cancel")
            : null;
        NConfirmButton? previewConfirm = stage == "preview"
            ? (singleVisible ? singlePreview : multiPreview).GetNodeOrNull<NConfirmButton>("Confirm")
            : null;
        bool canCancelSelection = stage == "selecting" && prefs.Cancelable && close.IsEnabled;
        bool canCancelPreview = previewCancel is { IsEnabled: true };
        bool canConfirm = previewConfirm is { IsEnabled: true } && selected.Count >= prefs.MinSelect;
        var surface = new DeckUpgradeSelectionSurface(
            SurfaceKind,
            stage,
            screenId,
            prompt,
            prefs.MinSelect,
            prefs.MaxSelect,
            selected.Count,
            selectedIds,
            prefs.Cancelable,
            selectableIds,
            deselectableIds,
            canCancelSelection,
            canCancelPreview,
            canConfirm,
            cards,
            previewCards);

        bool hasCurrentCommand = selectableIds.Length > 0
                                 || deselectableIds.Length > 0
                                 || canCancelSelection
                                 || canCancelPreview
                                 || canConfirm;
        string readiness = hasCurrentCommand ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_visible_deck_upgrade_selection",
            hasCurrentCommand
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
            Array.Empty<string>());
    }

    private static VisibleCard[] BuildPreviewCards(
        bool singleVisible,
        Control singlePreviewContainer,
        Control multiPreviewContainer,
        NativeEntityRegistry entities)
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
            .Select(card => LiveContextReader.BuildCard(
                card,
                entities.GetId(card, "upgrade_preview_card"),
                displayPile: PileType.Deck))
            .ToArray();
    }

    private static NativeInputResult StartToggle(
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
            return NativeInputResult.Rejected(
                "deck_upgrade_card_changed",
                "The advertised card is no longer an exact selectable upgrade candidate.");
        }

        expectedHolder.EmitSignal(NCardHolder.SignalName.Pressed, expectedHolder);
        return NativeInputResult.Started(
            () => IsCurrent(expectedScreen)
                  && (IsPreviewVisible(expectedScreen)
                      || BoundedCardSelectionFacts.IsSelected(expectedScreen, expectedCard) != wasSelected),
            "upgrade_selection_changed_or_preview_opened");
    }

    private static NativeInputResult StartPreviewCancel(
        NDeckUpgradeSelectScreen expectedScreen,
        NBackButton expectedButton)
    {
        if (!IsCurrent(expectedScreen) || !IsPreviewVisible(expectedScreen) || !expectedButton.IsEnabled)
            return NativeInputResult.Rejected("deck_upgrade_preview_changed", "The upgrade preview can no longer be cancelled.");
        expectedButton.ForceClick();
        return NativeInputResult.Started(
            () => IsCurrent(expectedScreen)
                  && !IsPreviewVisible(expectedScreen)
                  && BoundedCardSelectionFacts.ReadSelectedCards(expectedScreen).Count == 0,
            "upgrade_preview_closed_and_selection_cleared");
    }

    private static NativeInputResult StartConfirm(
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
            return NativeInputResult.Rejected("deck_upgrade_commit_changed", "The visible upgrade preview is no longer commit-ready.");
        }

        var previousLevels = selectedCards.ToDictionary(card => card, card => card.CurrentUpgradeLevel);
        expectedButton.ForceClick();
        return NativeInputResult.Started(
            () => !IsCurrent(expectedScreen)
                  && previousLevels.All(entry => entry.Key.CurrentUpgradeLevel > entry.Value),
            "upgrade_screen_closed_and_selected_instances_upgraded");
    }

    private static NativeInputResult StartClose(
        NDeckUpgradeSelectScreen expectedScreen,
        NBackButton expectedButton)
    {
        if (!IsCurrent(expectedScreen) || IsPreviewVisible(expectedScreen) || !expectedButton.IsEnabled)
            return NativeInputResult.Rejected("deck_upgrade_close_changed", "The upgrade selector is no longer cancelable.");
        expectedButton.ForceClick();
        return NativeInputResult.Started(
            () => !IsCurrent(expectedScreen),
            "upgrade_selection_cancelled_and_screen_closed");
    }

    internal static NativeInputResult StartToggle(
        NativeEntityRegistry entities,
        string screenId,
        string cardId,
        bool expectedSelected)
    {
        if (!entities.TryResolve(screenId, out NDeckUpgradeSelectScreen? screen)
            || screen == null
            || !entities.TryResolve(cardId, out CardModel? card)
            || card == null)
        {
            return NativeInputResult.Rejected(
                "deck_upgrade_binding_stale",
                "The exact deck-upgrade screen or card no longer resolves.");
        }
        NGridCardHolder? holder = McpMod.FindAll<NGridCardHolder>(screen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, card));
        return holder == null
            ? NativeInputResult.Rejected(
                "deck_upgrade_card_changed",
                "The exact card is no longer present on the current upgrade screen.")
            : StartToggle(screen, holder, card, expectedSelected);
    }

    internal static NativeInputResult StartPreviewCancel(
        NativeEntityRegistry entities,
        string screenId)
    {
        if (!entities.TryResolve(screenId, out NDeckUpgradeSelectScreen? screen)
            || screen == null)
        {
            return NativeInputResult.Rejected(
                "deck_upgrade_binding_stale",
                "The exact deck-upgrade screen no longer resolves.");
        }
        Control? container = McpMod.IsNodeVisible(
            screen.GetNodeOrNull<Control>("%UpgradeSinglePreviewContainer"))
            ? screen.GetNodeOrNull<Control>("%UpgradeSinglePreviewContainer")
            : screen.GetNodeOrNull<Control>("%UpgradeMultiPreviewContainer");
        NBackButton? cancel = container?.GetNodeOrNull<NBackButton>("Cancel");
        return cancel == null
            ? NativeInputResult.Rejected(
                "deck_upgrade_preview_changed",
                "The exact preview cancel control is no longer available.")
            : StartPreviewCancel(screen, cancel);
    }

    internal static NativeInputResult StartConfirm(
        NativeEntityRegistry entities,
        string screenId,
        IReadOnlyCollection<string> selectedCardIds)
    {
        if (!entities.TryResolve(screenId, out NDeckUpgradeSelectScreen? screen)
            || screen == null)
        {
            return NativeInputResult.Rejected(
                "deck_upgrade_binding_stale",
                "The exact deck-upgrade screen no longer resolves.");
        }
        var selectedCards = new List<CardModel>();
        foreach (string cardId in selectedCardIds)
        {
            if (!entities.TryResolve(cardId, out CardModel? card) || card == null)
            {
                return NativeInputResult.Rejected(
                    "deck_upgrade_binding_stale",
                    "An exact selected upgrade card no longer resolves.");
            }
            selectedCards.Add(card);
        }
        Control? container = McpMod.IsNodeVisible(
            screen.GetNodeOrNull<Control>("%UpgradeSinglePreviewContainer"))
            ? screen.GetNodeOrNull<Control>("%UpgradeSinglePreviewContainer")
            : screen.GetNodeOrNull<Control>("%UpgradeMultiPreviewContainer");
        NConfirmButton? confirm = container?.GetNodeOrNull<NConfirmButton>("Confirm");
        return confirm == null
            ? NativeInputResult.Rejected(
                "deck_upgrade_commit_changed",
                "The exact upgrade confirmation control is no longer available.")
            : StartConfirm(screen, confirm, selectedCards);
    }

    internal static NativeInputResult StartClose(
        NativeEntityRegistry entities,
        string screenId)
    {
        if (!entities.TryResolve(screenId, out NDeckUpgradeSelectScreen? screen)
            || screen == null)
        {
            return NativeInputResult.Rejected(
                "deck_upgrade_binding_stale",
                "The exact deck-upgrade selection no longer resolves.");
        }
        if (screen.GetNodeOrNull<NBackButton>("%Close") is not { } close)
            return NativeInputResult.Rejected(
                "deck_upgrade_binding_stale",
                "The exact deck-upgrade cancel control no longer resolves.");
        return StartClose(screen, close);
    }

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool IsPreviewVisible(NDeckUpgradeSelectScreen screen) =>
        (screen.GetNodeOrNull<Control>("%UpgradeSinglePreviewContainer") is { } single
         && McpMod.IsNodeVisible(single))
        || (screen.GetNodeOrNull<Control>("%UpgradeMultiPreviewContainer") is { } multi
            && McpMod.IsNodeVisible(multi));

    private static bool IsCurrent(NDeckUpgradeSelectScreen screen) =>
        ActiveInputResolver.IsVisibleActiveOverlay(screen)
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

    private static LiveObservation BindingUnavailable(
        GameBuildIdentity game,
        ILiveContext context,
        string reason,
        IReadOnlyList<string> missing)
    {
        var unavailable = new UnsupportedSurface("unsupported", nameof(NDeckUpgradeSelectScreen), reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "NDeckUpgradeSelectScreen exact-version binding" },
            missing);
        string signature = StableIdentityHash.Object(new { game.Version, context, unavailable, missing });
        return new LiveObservation(
            signature,
            "degraded",
            context,
            unavailable,
            completeness,
            game,
            new[] { "deck_upgrade_binding_unavailable" })
        {
            Diagnostics = new[]
            {
                GatewayDiagnostics.Create(
                    "gateway.surface.deck_upgrade.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}
