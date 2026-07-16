using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal sealed class CardRewardSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "card_reward_selection";
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
        if (snapshot.TopOverlay is not NCardRewardSelectionScreen screen)
            return null;
        return Build(screen, entities, game);
    }

    private static BridgeObservationDraft Build(
        NCardRewardSelectionScreen screen,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        Control? cardRow = screen.GetNodeOrNull<Control>("UI/CardRow");
        Control? alternativesContainer = screen.GetNodeOrNull<Control>("UI/RewardAlternatives");
        if (cardRow == null || alternativesContainer == null || ClickableField == null)
            return BindingUnavailable(
                game,
                "The exact card reward UI binding is unavailable.",
                new[] { "card_row", "reward_alternatives", "card_selectability", "legal_actions" });

        NGridCardHolder[] holders = cardRow.GetChildren()
            .OfType<NGridCardHolder>()
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .OrderBy(holder => holder.Position.X)
            .ThenBy(holder => holder.Position.Y)
            .ToArray();
        NCardRewardAlternativeButton[] buttons = alternativesContainer.GetChildren()
            .OfType<NCardRewardAlternativeButton>()
            .Where(McpMod.IsNodeVisible)
            .OrderBy(button => button.Position.X)
            .ThenBy(button => button.Position.Y)
            .ToArray();
        string?[] alternativeLabels = buttons.Select(ReadAlternativeLabel).ToArray();
        if (alternativeLabels.Any(string.IsNullOrWhiteSpace))
        {
            return BindingUnavailable(
                game,
                "A visible card reward alternative has no readable player-facing label.",
                new[] { "reward_alternatives.visible_label", "legal_actions" });
        }

        VisibleCard[] cards = holders.Select(holder =>
            BridgeContextBuilder.BuildCard(
                holder.CardModel,
                entities.GetId(holder.CardModel, "card")))
            .ToArray();
        VisibleCardRewardAlternative[] alternatives = buttons
            .Select((button, index) => new VisibleCardRewardAlternative(
                entities.GetId(button, "card_reward_alternative"),
                index,
                alternativeLabels[index]!,
                button.IsEnabled))
            .ToArray();

        var actions = new List<BridgeActionDraft>();
        foreach (NGridCardHolder holder in holders.Where(IsHolderClickable))
        {
            CardModel card = holder.CardModel;
            string cardId = entities.GetId(card, "card");
            string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
            actions.Add(new BridgeActionDraft(
                $"select_card_reward:{cardId}",
                "select_card_reward",
                "selection",
                $"Take {cardName}",
                "NCardRewardSelectionScreen.SelectCard via NCardHolder.Pressed",
                () => StartCardSelection(screen, cardRow, holder, card, holders, buttons)));
        }
        foreach ((NCardRewardAlternativeButton button, int index) in buttons.Select((button, index) => (button, index)))
        {
            if (!button.IsEnabled)
                continue;
            string label = alternatives[index].Label;
            string alternativeId = alternatives[index].EntityId;
            actions.Add(new BridgeActionDraft(
                $"choose_card_reward_alternative:{alternativeId}",
                "choose_card_reward_alternative",
                "alternative",
                label,
                "NCardRewardAlternativeButton.visible_label+ForceClick",
                () => StartAlternative(screen, alternativesContainer, button, holders, buttons)));
        }

        var surface = new CardRewardSelectionSurface(
            SurfaceKind,
            entities.GetId(screen, "screen"),
            cards,
            alternatives);
        bool hasVisibleOptions = cards.Length > 0 || alternatives.Length > 0;
        string readiness = actions.Count > 0 ? "ready" : hasVisibleOptions ? "settling" : "degraded";
        var missing = hasVisibleOptions
            ? Array.Empty<string>()
            : new[] { "surface.cards_or_alternatives" };
        var completeness = new StateCompleteness(
            hasVisibleOptions ? "contract_complete_for_card_reward_selection" : "partial",
            actions.Count > 0
                ? "derived_from_current_clickability_and_enabled_buttons"
                : "temporarily_empty_while_ui_settles",
            new[]
            {
                "NCardRewardSelectionScreen.UI.CardRow",
                "NGridCardHolder.CardModel",
                "NCardRewardSelectionScreen.UI.RewardAlternatives",
                "NCardRewardAlternativeButton.visible_label",
                "NCardHolder._isClickable exact-version binding"
            },
            missing);
        string signature = BridgeHash.Object(new
        {
            game.Version,
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });

        return new BridgeObservationDraft(
            signature,
            readiness,
            new RewardFlowBridgeContext("reward_flow", "card_reward"),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            actions);
    }

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        string reason,
        IReadOnlyList<string> missing)
    {
        var unavailable = new UnsupportedSurface(
            SurfaceKind,
            nameof(NCardRewardSelectionScreen),
            reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "NCardRewardSelectionScreen exact-version binding" },
            missing);
        string signature = BridgeHash.Object(new { game.Version, unavailable, missing });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            new RewardFlowBridgeContext("reward_flow", "card_reward"),
            unavailable,
            completeness,
            game,
            new[] { "card_reward_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.card_reward.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }

    private static BridgeActionStartResult StartCardSelection(
        NCardRewardSelectionScreen expectedScreen,
        Control expectedCardRow,
        NGridCardHolder expectedHolder,
        CardModel expectedCard,
        IReadOnlyList<NGridCardHolder> previousHolders,
        IReadOnlyList<NCardRewardAlternativeButton> previousButtons)
    {
        if (!IsCurrent(expectedScreen)
            || expectedScreen.GetNodeOrNull<Control>("UI/CardRow") is not { } currentRow
            || !ReferenceEquals(currentRow, expectedCardRow)
            || !currentRow.GetChildren().OfType<NGridCardHolder>().Any(holder => ReferenceEquals(holder, expectedHolder))
            || !ReferenceEquals(expectedHolder.CardModel, expectedCard)
            || !McpMod.IsNodeVisible(expectedHolder)
            || !IsHolderClickable(expectedHolder))
        {
            return BridgeActionStartResult.Rejected(
                "card_reward_card_changed",
                "The advertised card reward option is no longer selectable.");
        }

        expectedHolder.EmitSignal(NCardHolder.SignalName.Pressed, expectedHolder);
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  || OptionSetChanged(expectedScreen, previousHolders, previousButtons),
            "card_reward_selected_or_visible_options_replaced");
    }

    private static BridgeActionStartResult StartAlternative(
        NCardRewardSelectionScreen expectedScreen,
        Control expectedContainer,
        NCardRewardAlternativeButton expectedButton,
        IReadOnlyList<NGridCardHolder> previousHolders,
        IReadOnlyList<NCardRewardAlternativeButton> previousButtons)
    {
        if (!IsCurrent(expectedScreen)
            || expectedScreen.GetNodeOrNull<Control>("UI/RewardAlternatives") is not { } currentContainer
            || !ReferenceEquals(currentContainer, expectedContainer)
            || !currentContainer.GetChildren().OfType<NCardRewardAlternativeButton>()
                .Any(button => ReferenceEquals(button, expectedButton))
            || !McpMod.IsNodeVisible(expectedButton)
            || !expectedButton.IsEnabled)
        {
            return BridgeActionStartResult.Rejected(
                "card_reward_alternative_changed",
                "The advertised card reward alternative is no longer enabled.");
        }

        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  || OptionSetChanged(expectedScreen, previousHolders, previousButtons),
            "card_reward_alternative_applied_or_visible_options_replaced");
    }

    private static bool OptionSetChanged(
        NCardRewardSelectionScreen screen,
        IReadOnlyList<NGridCardHolder> holders,
        IReadOnlyList<NCardRewardAlternativeButton> buttons)
    {
        Control? cardRow = screen.GetNodeOrNull<Control>("UI/CardRow");
        Control? alternatives = screen.GetNodeOrNull<Control>("UI/RewardAlternatives");
        if (cardRow == null || alternatives == null)
            return true;
        NGridCardHolder[] currentHolders = cardRow.GetChildren().OfType<NGridCardHolder>().ToArray();
        NCardRewardAlternativeButton[] currentButtons = alternatives.GetChildren()
            .OfType<NCardRewardAlternativeButton>()
            .ToArray();
        return currentHolders.Length != holders.Count
               || currentButtons.Length != buttons.Count
               || currentHolders.Where((holder, index) => !ReferenceEquals(holder, holders[index])).Any()
               || currentButtons.Where((button, index) => !ReferenceEquals(button, buttons[index])).Any();
    }

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool IsCurrent(NCardRewardSelectionScreen screen) =>
        McpMod.IsLiveNode(screen) && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    private static string? ReadAlternativeLabel(NCardRewardAlternativeButton button)
    {
        try
        {
            Node? label = button.GetNodeOrNull("Label");
            if (label == null)
                return null;
            Variant value = label.Get("text");
            return value.VariantType == Variant.Type.Nil
                ? null
                : McpMod.StripRichTextTags(value.AsString()).Replace("\n", " ");
        }
        catch
        {
            return null;
        }
    }
}
