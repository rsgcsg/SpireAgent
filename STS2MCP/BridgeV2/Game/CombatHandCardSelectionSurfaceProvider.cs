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
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact-build adapter for the in-hand selector used by combat card effects.
/// It remains distinct from pile/grid selectors because replacement, selected
/// card rendering, peek mode, and completion are owned by NPlayerHand.
/// </summary>
internal sealed class CombatHandCardSelectionSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "combat_hand_card_selection";
    private const string ReflectionEvidence =
        "sts2-v0.109.0:cached_reflection:NPlayerHand._prefs+_selectedCards";
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;

    private static readonly FieldInfo? PreferencesField =
        typeof(NPlayerHand).GetField("_prefs", Flags);
    private static readonly FieldInfo? SelectedCardsField =
        typeof(NPlayerHand).GetField("_selectedCards", Flags);
    private static readonly FieldInfo? ClickableField =
        typeof(NCardHolder).GetField("_isClickable", Flags);

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Room;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        NPlayerHand? hand = NPlayerHand.Instance;
        if (hand?.IsInCardSelection != true)
            return null;

        return Build(hand, entities, game);
    }

    private static BridgeObservationDraft Build(
        NPlayerHand hand,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        IBridgeContext context = BridgeContextBuilder.Build(entities);
        if (context is not CombatBridgeContext)
        {
            return BindingUnavailable(
                game,
                context,
                "The combat-hand selector is visible without a qualified combat context.",
                new[] { "combat_context", "legal_actions" });
        }

        if (!TryReadBinding(hand, out Binding? binding, out string? bindingError)
            || ClickableField == null)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError ?? "The exact combat-hand selection binding is unavailable.",
                new[] { "selection_constraints", "selected_cards", "card_selectability", "legal_actions" });
        }

        Binding exact = binding!;
        if (exact.Preferences.MinSelect < 0
            || exact.Preferences.MaxSelect < exact.Preferences.MinSelect)
        {
            return BindingUnavailable(
                game,
                context,
                "The combat-hand selection constraints are invalid.",
                new[] { "selection_constraints", "legal_actions" });
        }

        string? prompt = ReadNodeText(hand, "%SelectionHeader");
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return BindingUnavailable(
                game,
                context,
                "The player-visible combat-hand selection prompt is unavailable.",
                new[] { "prompt", "legal_actions" });
        }

        if (!SelectedCardsHaveVisibleWitness(hand, exact.Mode, exact.SelectedCards))
        {
            return BindingUnavailable(
                game,
                context,
                "Selected combat-hand cards do not match the visible selected-card UI.",
                new[] { "selected_cards", "legal_actions" });
        }

        IReadOnlyList<NHandCardHolder> activeHolders = hand.ActiveHolders
            .Where(holder => holder.CardModel != null && McpMod.IsNodeVisible(holder))
            .ToArray();
        var cards = new List<VisibleCard>(activeHolders.Count + exact.SelectedCards.Count);
        var cardIds = new Dictionary<CardModel, string>();
        foreach (NHandCardHolder holder in activeHolders)
        {
            CardModel card = holder.CardModel!;
            string id = entities.GetId(card, "card");
            cardIds[card] = id;
            cards.Add(BridgeContextBuilder.BuildCard(card, id));
        }
        foreach (CardModel card in exact.SelectedCards)
        {
            string id = entities.GetId(card, "card");
            cardIds[card] = id;
            cards.Add(BridgeContextBuilder.BuildCard(card, id, selected: true));
        }

        if (cards.Select(card => card.EntityId).Distinct(StringComparer.Ordinal).Count() != cards.Count)
        {
            return BindingUnavailable(
                game,
                context,
                "A combat-hand card appeared in both selectable and selected UI regions.",
                new[] { "card_membership", "legal_actions" });
        }

        string[] selectedIds = exact.SelectedCards
            .Select(card => cardIds[card])
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToArray();
        var surface = new CombatHandCardSelectionSurface(
            SurfaceKind,
            entities.GetId(hand, "hand"),
            prompt,
            ModeName(exact.Mode),
            exact.Preferences.MinSelect,
            exact.Preferences.MaxSelect,
            exact.SelectedCards.Count,
            selectedIds,
            exact.Preferences.RequireManualConfirmation,
            hand.PeekButton.IsPeeking,
            cards);

        List<BridgeActionDraft> actions = BuildActions(
            hand,
            exact,
            activeHolders,
            cardIds);
        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_combat_hand_card_selection",
            actions.Count > 0
                ? "derived_from_exact_visible_hand_selection_and_current_controls"
                : "temporarily_empty_while_selection_completes_or_settles",
            new[]
            {
                "NPlayerHand.IsInCardSelection+CurrentMode+ActiveHolders",
                "NPlayerHand.%SelectionHeader+%SelectModeConfirmButton",
                "NSelectedHandCardContainer or NUpgradePreview selected-card witness",
                "NCardHolder._isClickable exact-version binding",
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
                "Private-field bindings are exact-version scoped and expose only semantics already visible in the hand-selection UI."
            },
            actions);
    }

    private static List<BridgeActionDraft> BuildActions(
        NPlayerHand hand,
        Binding binding,
        IReadOnlyList<NHandCardHolder> activeHolders,
        IReadOnlyDictionary<CardModel, string> cardIds)
    {
        var actions = new List<BridgeActionDraft>();
        if (hand.PeekButton.IsPeeking)
        {
            if (hand.PeekButton.IsEnabled && McpMod.IsNodeVisible(hand.PeekButton))
            {
                actions.Add(new BridgeActionDraft(
                    "close_combat_hand_peek",
                    "close_combat_hand_peek",
                    "navigation",
                    "Return to card selection",
                    "NPeekButton.OnRelease+SetPeeking(false)",
                    () => StartClosePeek(hand)));
            }
            return actions;
        }

        foreach (NHandCardHolder holder in activeHolders.Where(IsHolderClickable))
        {
            CardModel card = holder.CardModel!;
            string cardId = cardIds[card];
            string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
            actions.Add(new BridgeActionDraft(
                $"select_combat_hand_card:{cardId}",
                "select_combat_hand_card",
                "selection",
                binding.SelectedCards.Count > 0
                    ? $"Replace current selection with {cardName}"
                    : $"Select {cardName}",
                "NPlayerHand.OnHolderPressed+SelectCardInSimpleMode/SelectCardInUpgradeMode",
                () => StartSelect(hand, binding.Mode, card),
                new[] { new ActionEntityBinding("card", cardId) }));
        }

        if (binding.Mode == NPlayerHand.Mode.SimpleSelect)
        {
            NSelectedHandCardContainer? selectedContainer =
                hand.GetNodeOrNull<NSelectedHandCardContainer>("%SelectedHandCardContainer");
            foreach (NSelectedHandCardHolder holder in selectedContainer?.Holders.Where(IsHolderClickable)
                         ?? Enumerable.Empty<NSelectedHandCardHolder>())
            {
                CardModel card = holder.CardModel!;
                string cardId = cardIds[card];
                string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
                actions.Add(new BridgeActionDraft(
                    $"deselect_combat_hand_card:{cardId}",
                    "deselect_combat_hand_card",
                    "selection",
                    $"Deselect {cardName}",
                    "NSelectedHandCardContainer.DeselectHolder",
                    () => StartDeselect(hand, card),
                    new[] { new ActionEntityBinding("card", cardId) }));
            }
        }

        NConfirmButton? confirm = hand.GetNodeOrNull<NConfirmButton>("%SelectModeConfirmButton");
        if (confirm is { IsEnabled: true } && McpMod.IsNodeVisible(confirm))
        {
            actions.Add(new BridgeActionDraft(
                "confirm_combat_hand_selection",
                "confirm_combat_hand_selection",
                "commit",
                "Confirm selected cards",
                "NPlayerHand.%SelectModeConfirmButton",
                () => StartConfirm(hand)));
        }

        return actions;
    }

    private static BridgeActionStartResult StartSelect(
        NPlayerHand expectedHand,
        NPlayerHand.Mode expectedMode,
        CardModel expectedCard)
    {
        if (!IsCurrent(expectedHand, expectedMode))
            return BridgeActionStartResult.Rejected("selection_changed", "Combat-hand selection is no longer current.");
        NHandCardHolder? holder = expectedHand.ActiveHolders.FirstOrDefault(candidate =>
            ReferenceEquals(candidate.CardModel, expectedCard)
            && McpMod.IsNodeVisible(candidate)
            && IsHolderClickable(candidate));
        if (holder == null || IsSelected(expectedHand, expectedCard))
        {
            return BridgeActionStartResult.Rejected(
                "card_not_actionable",
                "The advertised hand card or its selected state changed before execution.");
        }

        holder.EmitSignal(NCardHolder.SignalName.Pressed, holder);
        return BridgeActionStartResult.Started(
            () => !IsCurrentSelection(expectedHand) || IsSelected(expectedHand, expectedCard),
            "selected_membership_changed_or_auto_completed");
    }

    private static BridgeActionStartResult StartDeselect(NPlayerHand expectedHand, CardModel expectedCard)
    {
        if (!IsCurrent(expectedHand, NPlayerHand.Mode.SimpleSelect))
            return BridgeActionStartResult.Rejected("selection_changed", "Simple hand selection is no longer current.");
        NSelectedHandCardContainer? container =
            expectedHand.GetNodeOrNull<NSelectedHandCardContainer>("%SelectedHandCardContainer");
        NSelectedHandCardHolder? holder = container?.Holders.FirstOrDefault(candidate =>
            ReferenceEquals(candidate.CardModel, expectedCard)
            && McpMod.IsNodeVisible(candidate)
            && IsHolderClickable(candidate));
        if (holder == null || !IsSelected(expectedHand, expectedCard))
        {
            return BridgeActionStartResult.Rejected(
                "card_not_actionable",
                "The advertised selected hand card changed before execution.");
        }

        holder.EmitSignal(NCardHolder.SignalName.Pressed, holder);
        return BridgeActionStartResult.Started(
            () => !IsCurrentSelection(expectedHand) || !IsSelected(expectedHand, expectedCard),
            "selected_membership_removed_or_selection_closed");
    }

    private static BridgeActionStartResult StartConfirm(NPlayerHand expectedHand)
    {
        if (!IsCurrentSelection(expectedHand))
            return BridgeActionStartResult.Rejected("selection_changed", "Combat-hand selection is no longer current.");
        NConfirmButton? confirm = expectedHand.GetNodeOrNull<NConfirmButton>("%SelectModeConfirmButton");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("confirm_not_available", "The hand-selection confirm control is no longer enabled.");

        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrentSelection(expectedHand),
            "combat_hand_selection_confirmed_and_closed");
    }

    private static BridgeActionStartResult StartClosePeek(NPlayerHand expectedHand)
    {
        if (!IsCurrentSelection(expectedHand) || !expectedHand.PeekButton.IsPeeking)
            return BridgeActionStartResult.Rejected("peek_changed", "The combat-hand peek view is no longer current.");
        if (!expectedHand.PeekButton.IsEnabled || !McpMod.IsNodeVisible(expectedHand.PeekButton))
            return BridgeActionStartResult.Rejected("peek_close_not_available", "The peek control is no longer enabled.");

        expectedHand.PeekButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrentSelection(expectedHand) || !expectedHand.PeekButton.IsPeeking,
            "combat_hand_peek_closed");
    }

    private static bool TryReadBinding(NPlayerHand hand, out Binding? binding, out string? error)
    {
        binding = null;
        error = null;
        if (PreferencesField?.GetValue(hand) is not CardSelectorPrefs preferences)
            error = "Missing or incompatible NPlayerHand._prefs binding.";
        else if (SelectedCardsField?.GetValue(hand) is not IEnumerable<CardModel> selected)
            error = "Missing or incompatible NPlayerHand._selectedCards binding.";
        else if (hand.CurrentMode is not (NPlayerHand.Mode.SimpleSelect or NPlayerHand.Mode.UpgradeSelect))
            error = $"Unsupported NPlayerHand selection mode {hand.CurrentMode}.";
        else
            binding = new Binding(preferences, selected.ToArray(), hand.CurrentMode);
        return binding != null;
    }

    private static bool SelectedCardsHaveVisibleWitness(
        NPlayerHand hand,
        NPlayerHand.Mode mode,
        IReadOnlyList<CardModel> selected)
    {
        if (mode == NPlayerHand.Mode.SimpleSelect)
        {
            NSelectedHandCardContainer? container =
                hand.GetNodeOrNull<NSelectedHandCardContainer>("%SelectedHandCardContainer");
            return container != null
                   && SetEqualsByReference(
                       container.Holders.Select(holder => holder.CardModel).Where(card => card != null).Cast<CardModel>(),
                       selected);
        }

        NUpgradePreview? preview = hand.GetNodeOrNull<NUpgradePreview>("%UpgradePreview");
        return selected.Count switch
        {
            0 => preview?.Card == null,
            1 => preview?.Card != null && ReferenceEquals(preview.Card, selected[0]),
            _ => false
        };
    }

    private static bool SetEqualsByReference(IEnumerable<CardModel> left, IReadOnlyList<CardModel> right)
    {
        CardModel[] leftArray = left.ToArray();
        return leftArray.Length == right.Count
               && leftArray.All(card => right.Any(other => ReferenceEquals(card, other)));
    }

    private static bool IsSelected(NPlayerHand hand, CardModel card) =>
        SelectedCardsField?.GetValue(hand) is IEnumerable<CardModel> selected
        && selected.Any(candidate => ReferenceEquals(candidate, card));

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool IsCurrent(NPlayerHand hand, NPlayerHand.Mode mode) =>
        IsCurrentSelection(hand) && hand.CurrentMode == mode;

    private static bool IsCurrentSelection(NPlayerHand hand) =>
        ReferenceEquals(NPlayerHand.Instance, hand)
        && hand.IsInCardSelection
        && McpMod.IsLiveNode(hand);

    private static string ModeName(NPlayerHand.Mode mode) => mode switch
    {
        NPlayerHand.Mode.SimpleSelect => "simple_select",
        NPlayerHand.Mode.UpgradeSelect => "upgrade_select",
        _ => "unsupported"
    };

    private static string? ReadNodeText(Node root, string path)
    {
        try
        {
            Node? node = root.GetNodeOrNull(path);
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
        var unavailable = new UnsupportedSurface(SurfaceKind, nameof(NPlayerHand), reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "NPlayerHand exact-version selection binding" },
            missing);
        string signature = BridgeHash.Object(new { game.Version, unavailable, missing });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            unavailable,
            completeness,
            game,
            new[] { "combat_hand_card_selection_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.combat_hand_card_selection.binding_unavailable",
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
        NPlayerHand.Mode Mode);
}
