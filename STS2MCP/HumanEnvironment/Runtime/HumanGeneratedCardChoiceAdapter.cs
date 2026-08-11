using STS2_MCP.NativeUi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using STS2_MCP.LiveHost;
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.HumanEnvironment.Runtime;

/// <summary>
/// Source-free adapter for the native one-of-N card choice screen. It binds
/// only the current screen, visible holders and native UI controls; the card,
/// relic or event that opened the screen is deliberately irrelevant.
/// </summary>
internal static class HumanGeneratedCardChoiceAdapter
{
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

    internal static LiveObservation? TryBuild(
        NativeEntityRegistry entities,
        GameBuildIdentity game)
    {
        ActiveSurfaceSnapshot active = ActiveInputResolver.Capture();
        if (active.TopOverlay is not NChooseACardSelectionScreen screen)
            return null;

        ILiveContext context = LiveContextReader.Build(entities);
        if (!TryReadBinding(screen, out Binding? binding, out string? error))
        {
            return NativeUiFailClosedObservation.BindingUnavailable(
                game,
                context,
                nameof(NChooseACardSelectionScreen),
                error ?? "The visible card-choice UI binding is unavailable.",
                new[] { "NChooseACardSelectionScreen current UI mechanics" },
                new[] { "visible_cards", "current_controls" },
                "human_ui_generated_choice_binding_unavailable",
                "human-ui.generated-choice.binding-unavailable",
                "The current UI cannot be represented without guessing a target.");
        }

        Control? cardRow = screen.GetNodeOrNull<Control>("CardRow");
        NPeekButton? peek = screen.GetNodeOrNull<NPeekButton>("%PeekButton");
        NCommonBanner? banner = screen.GetNodeOrNull<NCommonBanner>("Banner");
        NChoiceSelectionSkipButton? skip =
            screen.GetNodeOrNull<NChoiceSelectionSkipButton>("SkipButton");
        if (cardRow == null || peek == null || banner?.label == null || skip == null)
        {
            return NativeUiFailClosedObservation.BindingUnavailable(
                game,
                context,
                nameof(NChooseACardSelectionScreen),
                "The visible card row, banner, peek or skip control is unavailable.",
                new[] { "NChooseACardSelectionScreen structured controls" },
                new[] { "visible_cards", "current_controls" },
                "human_ui_generated_choice_controls_unavailable",
                "human-ui.generated-choice.controls-unavailable",
                "The current UI cannot be represented without guessing a target.");
        }

        Binding exact = binding!;
        NGridCardHolder[] holders = cardRow.GetChildren()
            .OfType<NGridCardHolder>()
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .OrderBy(holder => holder.Position.X)
            .ThenBy(holder => holder.Position.Y)
            .ToArray();
        bool holdersMatchCards = holders.Length == exact.Cards.Count
            && exact.Cards.All(card => holders.Count(holder =>
                ReferenceEquals(holder.CardModel, card)) == 1);
        string? prompt = ReadText(banner.label);
        bool guardElapsed = exact.OpenedTicks > 0
            && Time.GetTicksMsec() >= exact.OpenedTicks + SelectionGuardMs;
        bool controlsReady = holdersMatchCards
            && !peek.IsPeeking
            && !string.IsNullOrWhiteSpace(prompt);
        bool commandGateOpen = controlsReady
            && !exact.ScreenComplete
            && guardElapsed;
        VisibleCard[] cards = holders.Select(holder => LiveContextReader.BuildCard(
            holder.CardModel,
            entities.GetId(holder.CardModel, "card")))
            .ToArray();
        string[] selectable = commandGateOpen
            ? holders.Where(IsHolderClickable)
                .Select(holder => entities.GetId(holder.CardModel, "card"))
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        bool canSkip = commandGateOpen
            && exact.CanSkip
            && skip.IsEnabled
            && McpMod.IsNodeVisible(skip);
        var surface = new GeneratedCardChoiceSurface(
            "generated_card_choice",
            entities.GetId(screen, "screen"),
            prompt,
            "visible_one_of_n_choice",
            "unclassified_ui_source",
            "successor_ui",
            "not_inferred",
            null,
            exact.CanSkip,
            peek.IsPeeking,
            cards)
        {
            SelectableCardEntityIds = selectable,
            SkipAvailable = canSkip,
            SelectOperation = "human_select_visible_card",
            SkipOperation = canSkip ? "human_skip_visible_choice" : null,
            SelectCompletionEvidence = "NCardHolder.Pressed input delivery",
            SkipCompletionEvidence = canSkip
                ? "NChoiceSelectionSkipButton.ForceClick input delivery"
                : null
        };
        bool actionable = selectable.Length > 0 || canSkip;
        string readiness = actionable ? "ready" : controlsReady ? "settling" : "degraded";
        var completeness = new StateCompleteness(
            controlsReady ? "complete_current_structured_ui" : "partial_current_structured_ui",
            actionable
                ? "derived_from_current_visible_enabled_controls"
                : "temporarily_empty_while_native_ui_settles",
            new[]
            {
                "NChooseACardSelectionScreen visible card holders",
                "NChooseACardSelectionScreen banner/peek/skip controls"
            },
            controlsReady ? Array.Empty<string>() : new[] { "current_ui_controls" });
        return new LiveObservation(
            StableIdentityHash.Object(new { game.Version, surface, readiness }),
            readiness,
            context,
            surface,
            completeness,
            Game: game,
            Warnings: new[]
            {
                "The opening business source is intentionally not required by Human Environment C."
            })
        {
            CandidateAdmission = "human_ui",
            AuthorityHandoff = new AuthorityHandoff(
                "human_ui_owned",
                surface.Kind,
                "The current native UI owns input; no business source grants authority.")
        };
    }

    internal static NativeInputResult StartSelect(
        NativeEntityRegistry entities,
        string screenEntityId,
        string cardEntityId)
    {
        string? error = null;
        if (!entities.TryResolve(screenEntityId, out NChooseACardSelectionScreen? screen)
            || screen == null
            || !entities.TryResolve(cardEntityId, out CardModel? card)
            || card == null
            || !TryCurrentActionable(screen, out Binding? binding, out error)
            || !binding!.Cards.Any(candidate => ReferenceEquals(candidate, card)))
        {
            return NativeInputResult.Rejected(
                "human_ui_target_changed",
                error ?? "The exact visible card-choice owner or card is no longer current.");
        }

        NGridCardHolder? holder = screen.GetNodeOrNull<Control>("CardRow")?
            .GetChildren()
            .OfType<NGridCardHolder>()
            .SingleOrDefault(candidate =>
                ReferenceEquals(candidate.CardModel, card)
                && McpMod.IsNodeVisible(candidate)
                && IsHolderClickable(candidate));
        if (holder == null)
        {
            return NativeInputResult.Rejected(
                "human_ui_target_not_actionable",
                "The advertised card holder is no longer visible and clickable.");
        }

        holder.EmitSignal(NCardHolder.SignalName.Pressed, holder);
        return NativeInputResult.Started(
            completionEvidence: "native_card_holder_pressed",
            completionBoundary: "input_delivery");
    }

    internal static NativeInputResult StartSkip(
        NativeEntityRegistry entities,
        string screenEntityId)
    {
        string? error = null;
        if (!entities.TryResolve(screenEntityId, out NChooseACardSelectionScreen? screen)
            || screen == null
            || !TryCurrentActionable(screen, out Binding? binding, out error)
            || binding?.CanSkip != true)
        {
            return NativeInputResult.Rejected(
                "human_ui_target_changed",
                error ?? "The exact visible choice no longer permits skip.");
        }

        NChoiceSelectionSkipButton? skip =
            screen.GetNodeOrNull<NChoiceSelectionSkipButton>("SkipButton");
        if (skip == null || !skip.IsEnabled || !McpMod.IsNodeVisible(skip))
        {
            return NativeInputResult.Rejected(
                "human_ui_target_not_actionable",
                "The advertised skip control is no longer visible and enabled.");
        }

        skip.ForceClick();
        return NativeInputResult.Started(
            completionEvidence: "native_skip_control_clicked",
            completionBoundary: "input_delivery");
    }

    private static bool TryCurrentActionable(
        NChooseACardSelectionScreen screen,
        out Binding? binding,
        out string? error)
    {
        binding = null;
        error = null;
        if (!IsCurrent(screen) || !TryReadBinding(screen, out binding, out error))
            return false;
        if (binding!.ScreenComplete)
        {
            error = "The choice screen has already completed.";
            return false;
        }
        if (binding.OpenedTicks == 0
            || Time.GetTicksMsec() < binding.OpenedTicks + SelectionGuardMs)
        {
            error = "The choice screen is still inside its native opening guard.";
            return false;
        }
        if (screen.GetNodeOrNull<NPeekButton>("%PeekButton")?.IsPeeking == true)
        {
            error = "The choice screen is currently showing its peek page.";
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
            error = "Missing NChooseACardSelectionScreen._cards binding.";
        else if (CanSkipField?.GetValue(screen) is not bool canSkip)
            error = "Missing NChooseACardSelectionScreen._canSkip binding.";
        else if (OpenedTicksField?.GetValue(screen) is not ulong openedTicks)
            error = "Missing NChooseACardSelectionScreen._openedTicks binding.";
        else if (ScreenCompleteField?.GetValue(screen) is not bool complete)
            error = "Missing NChooseACardSelectionScreen._screenComplete binding.";
        else if (ClickableField == null)
            error = "Missing NCardHolder._isClickable binding.";
        else
            binding = new Binding(cards.ToArray(), canSkip, openedTicks, complete);
        return binding != null;
    }

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool IsCurrent(NChooseACardSelectionScreen screen) =>
        ActiveInputResolver.IsVisibleActiveOverlay(screen)
        && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

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

    private sealed record Binding(
        IReadOnlyList<CardModel> Cards,
        bool CanSkip,
        ulong OpenedTicks,
        bool ScreenComplete);
}
