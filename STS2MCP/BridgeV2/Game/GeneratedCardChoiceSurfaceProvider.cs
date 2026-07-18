using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Potions;
using MegaCrit.Sts2.Core.Models.Relics;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Shared one-of-N choice mechanics with a deliberately narrow semantic
/// contract. Each authorized source keeps its own business semantics and
/// outcome witness even though the exact game UI mechanics are shared.
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

        IBridgeContext context = BridgeContextBuilder.Build(entities);
        if (!GeneratedCardChoiceSourceBinding.TryGetUnique(out GeneratedCardChoiceSourceBinding.ActiveBinding? source)
            || !SourceMatchesContext(source!, context))
        {
            return BindingUnavailable(
                game,
                context,
                "The generated-card choice has no unique source binding with matching semantic context.",
                new[] { "generated_choice_source", "legal_actions" });
        }

        return Build(screen, source!, context, entities, game);
    }

    private static BridgeObservationDraft Build(
        NChooseACardSelectionScreen screen,
        GeneratedCardChoiceSourceBinding.ActiveBinding source,
        IBridgeContext context,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!TryReadBinding(screen, out Binding? binding, out string? error))
        {
            return BindingUnavailable(
                game,
                context,
                error ?? "The exact generated-card choice mechanics are unavailable.",
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
        bool sourceMatchesCards = SourceMatchesCards(source, exact);
        VisibleCard[] cards = holders.Select(holder => BridgeContextBuilder.BuildCard(
            holder.CardModel,
            entities.GetId(holder.CardModel, "card")))
            .ToArray();
        string? prompt = ReadText(banner.label);
        bool guardElapsed = exact.OpenedTicks > 0
                            && Time.GetTicksMsec() >= exact.OpenedTicks + SelectionGuardMs;
        bool isPeeking = peek.IsPeeking;

        GeneratedChoiceSemantics semantics = SemanticsFor(source);
        var surface = new GeneratedCardChoiceSurface(
            SurfaceKind,
            entities.GetId(screen, "screen"),
            prompt,
            semantics.Purpose,
            source.SourceKind,
            semantics.Destination,
            semantics.SelectedCardCostPolicy,
            semantics.OverflowDestination,
            exact.CanSkip,
            isPeeking,
            cards);
        var actions = new List<BridgeActionDraft>();
        if (holdersMatchCards
            && sourceMatchesCards
            && !exact.ScreenComplete
            && !isPeeking
            && guardElapsed
            && !string.IsNullOrWhiteSpace(prompt))
        {
            foreach (NGridCardHolder holder in holders.Where(IsHolderClickable))
            {
                CardModel card = holder.CardModel;
                string cardId = entities.GetId(card, "card");
                string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
                actions.Add(new BridgeActionDraft(
                    $"{semantics.SelectActionKind}:{cardId}",
                    semantics.SelectActionKind,
                    "selection",
                    semantics.SelectLabel(cardName),
                    semantics.SelectEvidenceCode,
                    () => StartSelect(screen, source, card),
                    new[] { new ActionEntityBinding("card", cardId) }));
            }

            if (skip.IsEnabled && McpMod.IsNodeVisible(skip))
            {
                string? skipLabel = ReadNodeText(skip, "Label");
                if (!string.IsNullOrWhiteSpace(skipLabel))
                {
                    actions.Add(new BridgeActionDraft(
                        semantics.SkipActionKind,
                        semantics.SkipActionKind,
                        "alternative",
                        skipLabel,
                        semantics.SkipEvidenceCode,
                        () => StartSkip(screen, source, skip)));
                }
            }
        }

        bool controlsReady = holdersMatchCards
                             && sourceMatchesCards
                             && !isPeeking
                             && !string.IsNullOrWhiteSpace(prompt);
        string readiness = actions.Count > 0 ? "ready" : controlsReady ? "settling" : "degraded";
        string[] missing = controlsReady
            ? Array.Empty<string>()
            : new[] { "surface.visible_generated_cards_controls_or_source" };
        var completeness = new StateCompleteness(
            controlsReady ? semantics.CompletenessContract : "partial",
            actions.Count > 0
                ? "derived_from_exact_source_visible_choice_controls_and_opening_guard"
                : "temporarily_empty_while_choice_opens_completes_or_settles",
            semantics.Sources.Concat(new[]
            {
                "NChooseACardSelectionScreen._cards/_canSkip/_openedTicks/_screenComplete exact-version bindings",
                "NChooseACardSelectionScreen.CardRow visible holders",
                "NChooseACardSelectionScreen.Banner player-visible prompt",
                "NChoiceSelectionSkipButton visible enabled state"
            }).ToArray(),
            missing);
        string signature = BridgeHash.Object(new
        {
            game.Version,
            source.SourceKind,
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
            new[] { semantics.ScopeWarning },
            actions);
    }

    private static BridgeActionStartResult StartSelect(
        NChooseACardSelectionScreen expectedScreen,
        GeneratedCardChoiceSourceBinding.ActiveBinding expectedSource,
        CardModel expectedCard)
    {
        if (!TryCurrentActionable(expectedScreen, expectedSource, out Binding? binding, out string? error))
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
        return expectedSource switch
        {
            GeneratedCardChoiceSourceBinding.LeadPaperweightBinding lead =>
                BridgeActionStartResult.Started(
                    () => GeneratedRunCardAcquisitionWitness.Selected(
                        !GeneratedCardChoiceSourceBinding.IsActive(lead.Token),
                        !IsCurrent(expectedScreen),
                        lead.BaselineDeck,
                        lead.Player.Deck.Cards,
                        expectedCard),
                    "lead_paperweight_choice_closed_and_exact_generated_card_added_to_run_deck",
                    allowIntermediateStateChanges: true),
            GeneratedCardChoiceSourceBinding.ColorlessPotionBinding potion =>
                BridgeActionStartResult.Started(
                    () => ColorlessSelectionCompleted(potion, expectedScreen, expectedCard),
                    "colorless_potion_choice_closed_and_exact_free_card_added_to_combat_hand_or_full_hand_discard",
                    allowIntermediateStateChanges: true),
            _ => BridgeActionStartResult.Rejected("source_not_supported", "Generated-card source is not supported.")
        };
    }

    private static BridgeActionStartResult StartSkip(
        NChooseACardSelectionScreen expectedScreen,
        GeneratedCardChoiceSourceBinding.ActiveBinding expectedSource,
        NChoiceSelectionSkipButton expectedSkip)
    {
        if (!TryCurrentActionable(expectedScreen, expectedSource, out Binding? binding, out string? error)
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

        IReadOnlyList<CardModel> offeredCards = binding.Cards.ToArray();
        expectedSkip.ForceClick();
        return expectedSource switch
        {
            GeneratedCardChoiceSourceBinding.LeadPaperweightBinding lead =>
                BridgeActionStartResult.Started(
                    () => GeneratedRunCardAcquisitionWitness.Skipped(
                        !GeneratedCardChoiceSourceBinding.IsActive(lead.Token),
                        !IsCurrent(expectedScreen),
                        lead.BaselineDeck,
                        lead.Player.Deck.Cards,
                        offeredCards),
                    "lead_paperweight_choice_skipped_and_run_deck_unchanged",
                    allowIntermediateStateChanges: true),
            GeneratedCardChoiceSourceBinding.ColorlessPotionBinding potion =>
                BridgeActionStartResult.Started(
                    () => ColorlessSkipCompleted(potion, expectedScreen, offeredCards),
                    "colorless_potion_choice_skipped_and_combat_hand_discard_unchanged",
                    allowIntermediateStateChanges: true),
            _ => BridgeActionStartResult.Rejected("source_not_supported", "Generated-card source is not supported.")
        };
    }

    private static bool SourceMatchesContext(
        GeneratedCardChoiceSourceBinding.ActiveBinding source,
        IBridgeContext context) => source switch
    {
        GeneratedCardChoiceSourceBinding.LeadPaperweightBinding lead =>
            context is EventBridgeContext eventContext
            && string.Equals(eventContext.EventId, "NEOW", StringComparison.Ordinal)
            && lead.SourceRelic is LeadPaperweight
            && lead.Player.Relics.Any(relic => ReferenceEquals(relic, lead.SourceRelic)),
        GeneratedCardChoiceSourceBinding.ColorlessPotionBinding potion =>
            context is CombatBridgeContext
            && potion.SourcePotion is ColorlessPotion
            && potion.Player.PlayerCombatState != null,
        _ => false
    };

    private static bool SourceMatchesCards(
        GeneratedCardChoiceSourceBinding.ActiveBinding source,
        Binding binding)
    {
        if (!binding.CanSkip || binding.Cards.Any(card => !ReferenceEquals(card.Owner, source.Player)))
            return false;

        return source switch
        {
            GeneratedCardChoiceSourceBinding.LeadPaperweightBinding lead =>
                binding.Cards.Count == 2
                && binding.Cards.All(card =>
                    card.Pile == null && !ContainsReference(lead.BaselineDeck, card)),
            GeneratedCardChoiceSourceBinding.ColorlessPotionBinding potion =>
                binding.Cards.Count == 3
                && binding.Cards.All(card =>
                    card.Pile == null
                    && !ContainsReference(potion.BaselineHand, card)
                    && !ContainsReference(potion.BaselineDiscard, card)),
            _ => false
        };
    }

    private static GeneratedChoiceSemantics SemanticsFor(
        GeneratedCardChoiceSourceBinding.ActiveBinding source) => source switch
    {
        GeneratedCardChoiceSourceBinding.LeadPaperweightBinding => new GeneratedChoiceSemantics(
            "acquire_one_generated_card",
            "run_deck",
            "unchanged",
            null,
            "select_generated_run_card",
            "skip_generated_run_card_choice",
            cardName => $"Add {cardName} to the run deck",
            "LeadPaperweight.AfterObtained+NChooseACardSelectionScreen.SelectHolder+exact-run-deck-witness",
            "LeadPaperweight.AfterObtained+NChooseACardSelectionScreen.OnSkipButtonReleased+unchanged-run-deck-witness",
            "contract_complete_for_lead_paperweight_generated_run_card_acquisition",
            new[]
            {
                "RelicCmd.Obtain(LeadPaperweight) exact active source binding",
                "LeadPaperweight.AfterObtained -> CardPileCmd.Add(Deck) exact outcome"
            },
            "This exact branch is limited to Lead Paperweight generated run-deck acquisition."),
        GeneratedCardChoiceSourceBinding.ColorlessPotionBinding => new GeneratedChoiceSemantics(
            "choose_one_generated_combat_card",
            "combat_hand",
            "free_this_turn",
            "combat_discard_if_hand_full",
            "select_generated_combat_card",
            "skip_generated_combat_card_choice",
            cardName => $"Choose {cardName}; add it to the combat hand for free this turn",
            "ColorlessPotion.OnUse+NChooseACardSelectionScreen.SelectHolder+exact-combat-pile-and-free-cost-witness",
            "ColorlessPotion.OnUse+NChooseACardSelectionScreen.OnSkipButtonReleased+unchanged-combat-piles-witness",
            "contract_complete_for_colorless_potion_generated_combat_card_choice",
            new[]
            {
                "PotionModel.OnUseWrapper(ColorlessPotion) exact active source binding",
                "ColorlessPotion.OnUse -> SetToFreeThisTurn -> CardPileCmd.AddGeneratedCardToCombat(Hand) exact outcome",
                "CardPileCmd.Add hand-full redirect to combat discard"
            },
            "This exact branch is limited to Colorless Potion; other combat generators remain disabled."),
        _ => throw new InvalidOperationException("Unsupported generated-card source binding.")
    };

    private static bool ColorlessSelectionCompleted(
        GeneratedCardChoiceSourceBinding.ColorlessPotionBinding source,
        NChooseACardSelectionScreen screen,
        CardModel selectedCard)
    {
        if (source.Player.PlayerCombatState is not { } combat)
            return false;
        return GeneratedCombatCardChoiceWitness.Selected(
            !GeneratedCardChoiceSourceBinding.IsActive(source.Token),
            !IsCurrent(screen),
            source.BaselineHand,
            source.BaselineDiscard,
            combat.Hand.Cards,
            combat.DiscardPile.Cards,
            selectedCard,
            selectedCard.EnergyCost.HasLocalModifiers);
    }

    private static bool ColorlessSkipCompleted(
        GeneratedCardChoiceSourceBinding.ColorlessPotionBinding source,
        NChooseACardSelectionScreen screen,
        IReadOnlyCollection<CardModel> offeredCards)
    {
        if (source.Player.PlayerCombatState is not { } combat)
            return false;
        return GeneratedCombatCardChoiceWitness.Skipped(
            !GeneratedCardChoiceSourceBinding.IsActive(source.Token),
            !IsCurrent(screen),
            source.BaselineHand,
            source.BaselineDiscard,
            combat.Hand.Cards,
            combat.DiscardPile.Cards,
            offeredCards);
    }

    private static bool TryCurrentActionable(
        NChooseACardSelectionScreen screen,
        GeneratedCardChoiceSourceBinding.ActiveBinding expectedSource,
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
        if (!GeneratedCardChoiceSourceBinding.TryGetUnique(out GeneratedCardChoiceSourceBinding.ActiveBinding? currentSource)
            || !ReferenceEquals(currentSource, expectedSource))
        {
            error = "Generated-card source binding changed or became ambiguous.";
            return false;
        }
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

    private static bool ContainsReference(IEnumerable<CardModel> cards, CardModel expected) =>
        cards.Any(card => ReferenceEquals(card, expected));

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
        => BridgeFailClosedObservation.BindingUnavailable(
            game,
            context,
            nameof(NChooseACardSelectionScreen),
            reason,
            new[] { "NChooseACardSelectionScreen exact-version mechanics" },
            missing,
            "generated_card_choice_binding_unavailable",
            "bridge.surface.generated_card_choice.binding_unavailable",
            "Generated-card source or completion semantics are not exact.");

    private sealed record Binding(
        IReadOnlyList<CardModel> Cards,
        bool CanSkip,
        ulong OpenedTicks,
        bool ScreenComplete);

    private sealed record GeneratedChoiceSemantics(
        string Purpose,
        string Destination,
        string SelectedCardCostPolicy,
        string? OverflowDestination,
        string SelectActionKind,
        string SkipActionKind,
        Func<string, string> SelectLabel,
        string SelectEvidenceCode,
        string SkipEvidenceCode,
        string CompletenessContract,
        IReadOnlyList<string> Sources,
        string ScopeWarning);
}
