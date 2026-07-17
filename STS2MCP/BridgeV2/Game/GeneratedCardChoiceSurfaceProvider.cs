using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact-build adapter for the one-of-N card choice shown by in-combat
/// generators such as Skill Potion. This is not a card reward, hand selector,
/// or pile selector: its cards are temporary generated options and choosing
/// one completes the overlay immediately.
/// </summary>
internal sealed class GeneratedCardChoiceSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "generated_card_choice";
    private const ulong SelectionGuardMs = 350;
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;

    private static readonly FieldInfo? CardsField =
        typeof(NChooseACardSelectionScreen).GetField("_cards", Flags);
    private static readonly FieldInfo? CanSkipField =
        typeof(NChooseACardSelectionScreen).GetField("_canSkip", Flags);
    private static readonly FieldInfo? OpenedTicksField =
        typeof(NChooseACardSelectionScreen).GetField("_openedTicks", Flags);
    private static readonly FieldInfo? ScreenCompleteField =
        typeof(NChooseACardSelectionScreen).GetField("_screenComplete", Flags);
    private static readonly FieldInfo? ClickableField =
        typeof(NCardHolder).GetField("_isClickable", Flags);

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NChooseACardSelectionScreen screen)
            return null;
        return Build(screen, entities, game);
    }

    private static BridgeObservationDraft Build(
        NChooseACardSelectionScreen screen,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        IBridgeContext context = BridgeContextBuilder.Build(entities);
        if (context is not CombatBridgeContext)
        {
            return BindingUnavailable(
                game,
                context,
                "The generated-card choice is visible without a qualified combat context.",
                new[] { "combat_context", "legal_actions" });
        }

        if (!TryReadBinding(screen, out Binding? binding, out string? error))
        {
            return BindingUnavailable(
                game,
                context,
                error ?? "The exact generated-card choice binding is unavailable.",
                new[] { "generated_cards", "skip_semantics", "opening_guard", "legal_actions" });
        }

        Binding exact = binding!;
        Control? cardRow = screen.GetNodeOrNull<Control>("CardRow");
        NPeekButton? peek = screen.GetNodeOrNull<NPeekButton>("%PeekButton");
        NCommonBanner? banner = screen.GetNodeOrNull<NCommonBanner>("Banner");
        NChoiceSelectionSkipButton? skip = screen.GetNodeOrNull<NChoiceSelectionSkipButton>("SkipButton");
        if (cardRow == null || peek == null || banner?.label == null || skip == null)
        {
            return BindingUnavailable(
                game,
                context,
                "The visible generated-card choice controls are unavailable.",
                new[] { "card_row", "peek_control", "prompt", "skip_control", "legal_actions" });
        }

        NGridCardHolder[] holders = cardRow.GetChildren()
            .OfType<NGridCardHolder>()
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .OrderBy(holder => holder.Position.X)
            .ThenBy(holder => holder.Position.Y)
            .ToArray();
        bool holdersMatchCards = holders.Length == exact.Cards.Count
                                 && exact.Cards.All(card => holders.Count(holder =>
                                     ReferenceEquals(holder.CardModel, card)) == 1);
        VisibleCard[] cards = holders.Select(holder => BridgeContextBuilder.BuildCard(
            holder.CardModel,
            entities.GetId(holder.CardModel, "card")))
            .ToArray();
        string? prompt = ReadText(banner.label);
        bool guardElapsed = exact.OpenedTicks > 0
                            && Time.GetTicksMsec() >= exact.OpenedTicks + SelectionGuardMs;
        bool isPeeking = peek.IsPeeking;

        var surface = new GeneratedCardChoiceSurface(
            SurfaceKind,
            entities.GetId(screen, "screen"),
            prompt,
            exact.CanSkip,
            isPeeking,
            cards);
        var actions = new List<BridgeActionDraft>();
        if (holdersMatchCards && !exact.ScreenComplete && guardElapsed && !string.IsNullOrWhiteSpace(prompt))
        {
            if (isPeeking)
            {
                if (peek.IsEnabled && McpMod.IsNodeVisible(peek))
                {
                    actions.Add(new BridgeActionDraft(
                        "close_generated_card_choice_peek",
                        "close_generated_card_choice_peek",
                        "navigation",
                        "Return to generated card choices",
                        "NPeekButton.OnRelease+SetPeeking(false)",
                        () => StartClosePeek(screen, peek)));
                }
            }
            else
            {
                foreach (NGridCardHolder holder in holders.Where(IsHolderClickable))
                {
                    CardModel card = holder.CardModel;
                    string cardId = entities.GetId(card, "card");
                    string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
                    actions.Add(new BridgeActionDraft(
                        $"select_generated_card:{cardId}",
                        "select_generated_card",
                        "selection",
                        $"Choose {cardName}",
                        "NChooseACardSelectionScreen.SelectHolder via NCardHolder.Pressed",
                        () => StartSelect(screen, card),
                        new[] { new ActionEntityBinding("card", cardId) }));
                }

                if (exact.CanSkip && skip.IsEnabled && McpMod.IsNodeVisible(skip))
                {
                    string? skipLabel = ReadNodeText(skip, "Label");
                    if (!string.IsNullOrWhiteSpace(skipLabel))
                    {
                        actions.Add(new BridgeActionDraft(
                            "skip_generated_card_choice",
                            "skip_generated_card_choice",
                            "alternative",
                            skipLabel,
                            "NChooseACardSelectionScreen.OnSkipButtonReleased via NChoiceSelectionSkipButton",
                            () => StartSkip(screen, skip)));
                    }
                }
            }
        }

        bool controlsReady = holdersMatchCards
                             && !string.IsNullOrWhiteSpace(prompt)
                             && (!isPeeking || (peek.IsEnabled && McpMod.IsNodeVisible(peek)));
        string readiness = actions.Count > 0 ? "ready" : controlsReady ? "settling" : "degraded";
        string[] missing = controlsReady
            ? Array.Empty<string>()
            : new[] { "surface.visible_generated_cards_or_controls" };
        var completeness = new StateCompleteness(
            controlsReady ? "contract_complete_for_generated_combat_card_choice" : "partial",
            actions.Count > 0
                ? "derived_from_exact_visible_choice_controls_and_opening_guard"
                : "temporarily_empty_while_choice_opens_completes_or_settles",
            new[]
            {
                "NChooseACardSelectionScreen visible overlay",
                "NChooseACardSelectionScreen._cards/_canSkip/_openedTicks/_screenComplete exact-version bindings",
                "NChooseACardSelectionScreen.CardRow visible holders",
                "NChooseACardSelectionScreen.Banner player-visible prompt",
                "NChoiceSelectionSkipButton visible enabled state",
                "NPeekButton visible state"
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
            context,
            surface,
            completeness,
            game,
            new[]
            {
                "This exact slice is limited to generated in-combat card choices; reward, hand, pile, bundle, and deck selectors retain separate contracts."
            },
            actions);
    }

    private static BridgeActionStartResult StartSelect(
        NChooseACardSelectionScreen expectedScreen,
        CardModel expectedCard)
    {
        if (!TryCurrentActionable(expectedScreen, out Binding? binding, out string? error))
            return BridgeActionStartResult.Rejected("choice_changed", error ?? "Generated-card choice is no longer current.");
        if (!binding!.Cards.Any(card => ReferenceEquals(card, expectedCard)))
            return BridgeActionStartResult.Rejected("card_changed", "The advertised generated card is no longer in this choice.");

        Control? row = expectedScreen.GetNodeOrNull<Control>("CardRow");
        NGridCardHolder? holder = row?.GetChildren().OfType<NGridCardHolder>().FirstOrDefault(candidate =>
            ReferenceEquals(candidate.CardModel, expectedCard)
            && McpMod.IsNodeVisible(candidate)
            && IsHolderClickable(candidate));
        if (holder == null)
            return BridgeActionStartResult.Rejected("card_not_actionable", "The advertised generated card is no longer clickable.");

        holder.EmitSignal(NCardHolder.SignalName.Pressed, holder);
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen),
            "generated_card_selected_and_choice_closed");
    }

    private static BridgeActionStartResult StartSkip(
        NChooseACardSelectionScreen expectedScreen,
        NChoiceSelectionSkipButton expectedSkip)
    {
        if (!TryCurrentActionable(expectedScreen, out Binding? binding, out string? error)
            || binding?.CanSkip != true)
        {
            return BridgeActionStartResult.Rejected("skip_changed", error ?? "Generated-card skip is no longer available.");
        }
        NChoiceSelectionSkipButton? current = expectedScreen.GetNodeOrNull<NChoiceSelectionSkipButton>("SkipButton");
        if (!ReferenceEquals(current, expectedSkip)
            || !expectedSkip.IsEnabled
            || !McpMod.IsNodeVisible(expectedSkip))
        {
            return BridgeActionStartResult.Rejected("skip_not_actionable", "The generated-card skip control is no longer enabled.");
        }

        expectedSkip.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen),
            "generated_card_choice_skipped_and_closed");
    }

    private static BridgeActionStartResult StartClosePeek(
        NChooseACardSelectionScreen expectedScreen,
        NPeekButton expectedPeek)
    {
        if (!IsCurrent(expectedScreen)
            || !expectedPeek.IsPeeking
            || !expectedPeek.IsEnabled
            || !McpMod.IsNodeVisible(expectedPeek))
        {
            return BridgeActionStartResult.Rejected("peek_changed", "Generated-card peek is no longer current.");
        }

        expectedPeek.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen) || !expectedPeek.IsPeeking,
            "generated_card_choice_peek_closed");
    }

    private static bool TryCurrentActionable(
        NChooseACardSelectionScreen screen,
        out Binding? binding,
        out string? error)
    {
        if (!IsCurrent(screen))
        {
            binding = null;
            error = "Generated-card choice is no longer the active surface.";
            return false;
        }
        if (!TryReadBinding(screen, out binding, out error))
            return false;
        if (binding!.ScreenComplete)
        {
            error = "Generated-card choice has already completed.";
            return false;
        }
        if (binding.OpenedTicks == 0 || Time.GetTicksMsec() < binding.OpenedTicks + SelectionGuardMs)
        {
            error = "Generated-card choice is still inside its opening input guard.";
            return false;
        }
        NPeekButton? peek = screen.GetNodeOrNull<NPeekButton>("%PeekButton");
        if (peek?.IsPeeking == true)
        {
            error = "Generated-card choice is in peek mode.";
            return false;
        }
        return true;
    }

    private static bool TryReadBinding(
        NChooseACardSelectionScreen screen,
        out Binding? binding,
        out string? error)
    {
        binding = null;
        error = null;
        if (CardsField?.GetValue(screen) is not IEnumerable<CardModel> cards)
            error = "Missing or incompatible NChooseACardSelectionScreen._cards binding.";
        else if (CanSkipField?.GetValue(screen) is not bool canSkip)
            error = "Missing or incompatible NChooseACardSelectionScreen._canSkip binding.";
        else if (OpenedTicksField?.GetValue(screen) is not ulong openedTicks)
            error = "Missing or incompatible NChooseACardSelectionScreen._openedTicks binding.";
        else if (ScreenCompleteField?.GetValue(screen) is not bool screenComplete)
            error = "Missing or incompatible NChooseACardSelectionScreen._screenComplete binding.";
        else if (ClickableField == null)
            error = "Missing NCardHolder._isClickable binding.";
        else
            binding = new Binding(cards.ToArray(), canSkip, openedTicks, screenComplete);
        return binding != null;
    }

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static string? ReadText(Node node)
    {
        try
        {
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

    private static string? ReadNodeText(Node owner, string path) =>
        owner.GetNodeOrNull(path) is { } node ? ReadText(node) : null;

    private static bool IsCurrent(NChooseACardSelectionScreen screen) =>
        ActiveSurfaceResolver.IsVisibleActiveOverlay(screen)
        && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        IBridgeContext context,
        string reason,
        IReadOnlyList<string> missing)
    {
        var unavailable = new UnsupportedSurface(SurfaceKind, nameof(NChooseACardSelectionScreen), reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "NChooseACardSelectionScreen exact-version binding" },
            missing);
        string signature = BridgeHash.Object(new { game.Version, unavailable, missing });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            unavailable,
            completeness,
            game,
            new[] { "generated_card_choice_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.generated_card_choice.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }

    private sealed record Binding(
        IReadOnlyList<CardModel> Cards,
        bool CanSkip,
        ulong OpenedTicks,
        bool ScreenComplete);
}
