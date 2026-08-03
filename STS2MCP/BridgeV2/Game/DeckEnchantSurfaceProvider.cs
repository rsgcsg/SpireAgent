using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.CardSelection;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Enchantments;
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

internal sealed class DeckEnchantSurfaceProvider : IBridgeSurfaceProvider
{
    private const string ReflectionEvidence =
        "sts2-v0.110.0:NDeckEnchantSelectScreen+SelfHelpBook.SelectAndEnchant+Symbiote.Approach+Kifuda.AfterObtained";
    internal const string ToggleCompletionWitness =
        "selected_card_membership_changed";
    internal const string PreviewCompletionWitness =
        "enchantment_preview_became_visible";
    internal const string ConfirmCompletionWitness =
        "enchantment_screen_closed_and_exact_cards_enchanted";
    internal const string CancelPreviewCompletionWitness =
        "preview_closed_and_selection_cleared";
    internal const string CloseCompletionWitness =
        "enchantment_screen_closed_without_selection";

    public string Kind => "deck_enchant_selection";

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NDeckEnchantSelectScreen screen)
            return null;
        return Build(screen, entities, game);
    }

    private static BridgeObservationDraft Build(
        NDeckEnchantSelectScreen screen,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!TryReadBinding(screen, out Binding? binding, out string? bindingError))
        {
            var degradedSurface = new UnsupportedSurface(
                "deck_enchant_selection",
                nameof(NDeckEnchantSelectScreen),
                bindingError ?? "Required screen binding is unavailable.");
            var degradedCompleteness = new StateCompleteness(
                "degraded",
                "empty_fail_closed",
                new[] { "public_scene_tree" },
                new[] { "selection_constraints", "selected_cards", "enchantment_semantics", "legal_actions" });
            string degradedSignature = BridgeHash.Object(new
            {
                game.Version,
                degradedSurface,
                actionKeys = Array.Empty<string>()
            });

            return new BridgeObservationDraft(
                degradedSignature,
                "degraded",
                BridgeContextBuilder.Build(entities),
                degradedSurface,
                degradedCompleteness,
                game,
                new[] { "deck_enchant_binding_unavailable", bindingError ?? "unknown_binding_error" },
                Array.Empty<BridgeActionDraft>());
        }

        Binding exactBinding = binding!;
        if (!TryResolveSource(exactBinding, out DeckEnchantSource? source, out string? sourceError))
        {
            var unsupported = new UnsupportedSurface(
                "deck_enchant_selection",
                nameof(NDeckEnchantSelectScreen),
                sourceError ?? "Deck enchant source contract is not recognized.");
            return new BridgeObservationDraft(
                BridgeHash.Object(new { game.Version, unsupported }),
                "degraded",
                BridgeContextBuilder.Build(entities),
                unsupported,
                new StateCompleteness(
                    "degraded",
                    "empty_fail_closed",
                    new[] { "public_scene_tree", ReflectionEvidence },
                    new[] { "source_contract", "legal_actions" }),
                game,
                new[] { "deck_enchant_source_unresolved", sourceError ?? "unknown_source" },
                Array.Empty<BridgeActionDraft>());
        }

        string stage = IsPreviewVisible(screen) ? "preview" : "selecting";
        string screenEntityId = entities.GetId(screen, "screen");
        HashSet<CardModel> selectedCards = exactBinding.SelectedCards.ToHashSet();
        IReadOnlyList<NGridCardHolder> holders = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .ToArray();

        var cards = new List<VisibleCard>(holders.Count);
        var cardIds = new Dictionary<CardModel, string>();
        foreach (NGridCardHolder holder in holders)
        {
            CardModel card = holder.CardModel;
            string entityId = entities.GetId(card, "card");
            cardIds[card] = entityId;
            cards.Add(BridgeContextBuilder.BuildCard(
                card,
                entityId,
                selectedCards.Contains(card),
                displayPile: PileType.Deck));
        }

        string[] selectedIds = selectedCards
            .Select(card => cardIds.TryGetValue(card, out string? id) ? id : entities.GetId(card, "card"))
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToArray();

        string[] selectableIds = stage == "selecting"
            ? holders.Where(holder => !selectedCards.Contains(holder.CardModel)
                                      && selectedCards.Count < exactBinding.Preferences.MaxSelect
                                      && exactBinding.Enchantment.CanEnchant(holder.CardModel))
                .Select(holder => cardIds[holder.CardModel])
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        string[] deselectableIds = stage == "selecting"
            ? holders.Where(holder => selectedCards.Contains(holder.CardModel))
                .Select(holder => cardIds[holder.CardModel])
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        NConfirmButton? mainConfirm = screen.GetNodeOrNull<NConfirmButton>("Confirm")
                                      ?? screen.GetNodeOrNull<NConfirmButton>("%Confirm");
        NBackButton? close = screen.GetNodeOrNull<NBackButton>("%Close");
        Control? preview = GetVisiblePreview(screen);
        NConfirmButton? previewConfirm = preview?.GetNodeOrNull<NConfirmButton>("Confirm");
        NBackButton? previewCancel = preview?.GetNodeOrNull<NBackButton>("Cancel");

        VisibleEnchantment enchantment = BuildEnchantment(screen, exactBinding.Enchantment, exactBinding.EnchantmentAmount);
        var surface = new DeckEnchantSelectionSurface(
            "deck_enchant_selection",
            stage,
            screenEntityId,
            source!,
            ReadNodeText(screen, "%BottomLabel"),
            exactBinding.Preferences.MinSelect,
            exactBinding.Preferences.MaxSelect,
            selectedCards.Count,
            selectedIds,
            exactBinding.Preferences.Cancelable,
            enchantment,
            cards)
        {
            SelectableCardEntityIds = selectableIds,
            DeselectableCardEntityIds = deselectableIds,
            CanPreview = stage == "selecting"
                         && mainConfirm is { IsEnabled: true }
                         && McpMod.IsNodeVisible(mainConfirm),
            CanCloseSelection = stage == "selecting"
                                && exactBinding.Preferences.Cancelable
                                && close is { IsEnabled: true }
                                && McpMod.IsNodeVisible(close),
            CanConfirm = stage == "preview"
                         && previewConfirm is { IsEnabled: true }
                         && McpMod.IsNodeVisible(previewConfirm),
            CanCancelPreview = stage == "preview"
                               && previewCancel is { IsEnabled: true }
                               && McpMod.IsNodeVisible(previewCancel)
        };

        var missing = new List<string>();
        if (surface.Enchantment.Name == null)
            missing.Add("enchantment.name");
        if (surface.Enchantment.Description == null)
            missing.Add("enchantment.description");
        if (surface.Prompt == null)
            missing.Add("prompt");

        var completeness = new StateCompleteness(
            missing.Count == 0 ? "contract_complete_for_supported_surface" : "partial",
            "derived_from_same_validator_as_execution",
            new[]
            {
                "public_scene_tree",
                "localized_visible_ui_text",
                "card_models_rendered_by_grid",
                ReflectionEvidence
            },
            missing);
        string signature = BridgeHash.Object(new
        {
            game.Version,
            surface
        });

        return new BridgeObservationDraft(
            signature,
            missing.Count == 0 ? "ready" : "degraded",
            BridgeContextBuilder.Build(entities),
            surface,
            completeness,
            game,
            new[]
            {
                "Private-field bindings are exact-version scoped and fail closed outside the tested game identity."
            },
            Array.Empty<BridgeActionDraft>());
    }

    private static BridgeActionStartResult StartToggleCard(
        NDeckEnchantSelectScreen expectedScreen,
        CardModel expectedCard,
        EnchantmentModel enchantment)
    {
        if (!IsCurrentScreen(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Enchant selection is no longer in selecting stage.");

        NGridCardHolder? holder = McpMod.FindAllSortedByPosition<NGridCardHolder>(expectedScreen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, expectedCard) && McpMod.IsNodeVisible(candidate));
        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(expectedScreen);
        if (holder == null || grid == null)
            return BridgeActionStartResult.Rejected("card_not_actionable", "The selected card is no longer present in the active grid.");
        if (!enchantment.CanEnchant(expectedCard))
            return BridgeActionStartResult.Rejected("card_not_enchantable", "The game model no longer permits this enchantment on the card.");

        bool wasSelected = IsCardSelected(expectedScreen, expectedCard);
        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, holder);
        return BridgeActionStartResult.Started(
            () => IsCurrentScreen(expectedScreen)
                  && IsCardSelected(expectedScreen, expectedCard) != wasSelected,
            ToggleCompletionWitness);
    }

    private static BridgeActionStartResult StartMainPreview(NDeckEnchantSelectScreen expectedScreen)
    {
        if (!IsCurrentScreen(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Enchant selection is no longer in selecting stage.");

        NConfirmButton? confirm = expectedScreen.GetNodeOrNull<NConfirmButton>("Confirm")
                                  ?? expectedScreen.GetNodeOrNull<NConfirmButton>("%Confirm");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("preview_not_available", "The preview button is no longer enabled.");

        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrentScreen(expectedScreen) && IsPreviewVisible(expectedScreen),
            PreviewCompletionWitness);
    }

    private static BridgeActionStartResult StartPreviewConfirm(
        NDeckEnchantSelectScreen expectedScreen,
        IReadOnlyList<CardModel> expectedCards,
        string expectedEnchantmentId,
        int expectedEnchantmentAmount)
    {
        if (!IsCurrentScreen(expectedScreen) || !IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Enchant selection is no longer in preview stage.");

        if (!TryReadBinding(expectedScreen, out Binding? currentBinding, out string? bindingError))
            return BridgeActionStartResult.Rejected(
                "enchantment_binding_changed",
                bindingError ?? "Enchant selection binding is unavailable at commit time.");

        Binding exactBinding = currentBinding!;
        IReadOnlyList<CardModel> currentCards = exactBinding.SelectedCards;
        if (!string.Equals(exactBinding.Enchantment.Id.Entry, expectedEnchantmentId, StringComparison.Ordinal)
            || exactBinding.EnchantmentAmount != expectedEnchantmentAmount
            || currentCards.Count != expectedCards.Count
            || currentCards.Count < exactBinding.Preferences.MinSelect
            || currentCards.Count > exactBinding.Preferences.MaxSelect
            || expectedCards.Any(expected => !currentCards.Any(current => ReferenceEquals(current, expected))))
        {
            return BridgeActionStartResult.Rejected(
                "enchantment_commit_state_changed",
                "The exact selected cards or target enchantment changed before confirmation.");
        }

        if (expectedCards.Any(card => !exactBinding.Enchantment.CanEnchant(card)))
            return BridgeActionStartResult.Rejected(
                "card_not_enchantable",
                "At least one selected card is no longer eligible for the target enchantment.");

        NConfirmButton? confirm = GetVisiblePreview(expectedScreen)?.GetNodeOrNull<NConfirmButton>("Confirm");
        if (confirm is not { IsEnabled: true } || !McpMod.IsNodeVisible(confirm))
            return BridgeActionStartResult.Rejected("confirm_not_available", "The preview confirm button is no longer enabled.");

        confirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrentScreen(expectedScreen)
                  && expectedCards.All(card => HasExpectedEnchantment(
                      card,
                      expectedEnchantmentId,
                      expectedEnchantmentAmount)),
            ConfirmCompletionWitness);
    }

    private static bool HasExpectedEnchantment(
        CardModel card,
        string expectedEnchantmentId,
        int expectedEnchantmentAmount)
    {
        try
        {
            EnchantmentModel? applied = card.Enchantment;
            return applied != null
                   && string.Equals(applied.Id.Entry, expectedEnchantmentId, StringComparison.Ordinal)
                   && applied.Amount == expectedEnchantmentAmount;
        }
        catch
        {
            return false;
        }
    }

    private static BridgeActionStartResult StartPreviewCancel(NDeckEnchantSelectScreen expectedScreen)
    {
        if (!IsCurrentScreen(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_changed", "Enchant selection is no longer the current screen.");

        NBackButton? cancel = GetVisiblePreview(expectedScreen)?.GetNodeOrNull<NBackButton>("Cancel");
        if (cancel is not { IsEnabled: true } || !McpMod.IsNodeVisible(cancel))
            return BridgeActionStartResult.Rejected("cancel_not_available", "The preview cancel button is no longer enabled.");

        cancel.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrentScreen(expectedScreen)
                  && !IsPreviewVisible(expectedScreen)
                  && ReadSelectedCards(expectedScreen).Count == 0,
            CancelPreviewCompletionWitness);
    }

    private static BridgeActionStartResult StartClose(NDeckEnchantSelectScreen expectedScreen)
    {
        if (!IsCurrentScreen(expectedScreen) || IsPreviewVisible(expectedScreen))
            return BridgeActionStartResult.Rejected("screen_stage_changed", "Enchant selection is no longer closable from the selecting stage.");

        NBackButton? close = expectedScreen.GetNodeOrNull<NBackButton>("%Close");
        if (close is not { IsEnabled: true } || !McpMod.IsNodeVisible(close))
            return BridgeActionStartResult.Rejected("close_not_available", "The close button is no longer enabled.");

        close.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrentScreen(expectedScreen),
            CloseCompletionWitness,
            completionBoundary: "continuation_handoff_observed");
    }

    internal static BridgeActionStartResult StartToggleCard(
        BridgeEntityRegistry entities,
        string expectedScreenId,
        string expectedCardId)
    {
        if (!TryResolveCurrentScreen(entities, expectedScreenId, out NDeckEnchantSelectScreen? screen)
            || !entities.TryResolve(expectedCardId, out CardModel? card)
            || card == null)
        {
            return BridgeActionStartResult.Rejected(
                "enchantment_binding_changed",
                "The exact enchant screen or card is no longer current.");
        }
        if (!TryReadBinding(screen!, out Binding? binding, out string? error))
        {
            return BridgeActionStartResult.Rejected(
                "enchantment_binding_changed",
                error ?? "The exact enchant screen binding is no longer current.");
        }

        return StartToggleCard(screen!, card, binding!.Enchantment);
    }

    internal static BridgeActionStartResult StartMainPreview(
        BridgeEntityRegistry entities,
        string expectedScreenId) =>
        TryResolveCurrentScreen(entities, expectedScreenId, out NDeckEnchantSelectScreen? screen)
            ? StartMainPreview(screen!)
            : BridgeActionStartResult.Rejected(
                "screen_changed",
                "The exact enchant screen is no longer current.");

    internal static BridgeActionStartResult StartPreviewConfirm(
        BridgeEntityRegistry entities,
        string expectedScreenId)
    {
        if (!TryResolveCurrentScreen(entities, expectedScreenId, out NDeckEnchantSelectScreen? screen))
        {
            return BridgeActionStartResult.Rejected(
                "enchantment_binding_changed",
                "The exact enchant screen is no longer current.");
        }
        if (!TryReadBinding(screen!, out Binding? binding, out string? error))
        {
            return BridgeActionStartResult.Rejected(
                "enchantment_binding_changed",
                error ?? "The exact enchant screen binding is no longer current.");
        }

        return StartPreviewConfirm(
            screen!,
            binding!.SelectedCards.ToArray(),
            binding.Enchantment.Id.Entry,
            binding.EnchantmentAmount);
    }

    internal static BridgeActionStartResult StartPreviewCancel(
        BridgeEntityRegistry entities,
        string expectedScreenId) =>
        TryResolveCurrentScreen(entities, expectedScreenId, out NDeckEnchantSelectScreen? screen)
            ? StartPreviewCancel(screen!)
            : BridgeActionStartResult.Rejected(
                "screen_changed",
                "The exact enchant screen is no longer current.");

    internal static BridgeActionStartResult StartClose(
        BridgeEntityRegistry entities,
        string expectedScreenId) =>
        TryResolveCurrentScreen(entities, expectedScreenId, out NDeckEnchantSelectScreen? screen)
            ? StartClose(screen!)
            : BridgeActionStartResult.Rejected(
                "screen_changed",
                "The exact enchant screen is no longer current.");

    private static bool TryResolveCurrentScreen(
        BridgeEntityRegistry entities,
        string expectedScreenId,
        out NDeckEnchantSelectScreen? screen)
    {
        if (!entities.TryResolve(expectedScreenId, out screen)
            || screen == null
            || !IsCurrentScreen(screen)
            || !string.Equals(
                entities.GetId(screen, "screen"),
                expectedScreenId,
                StringComparison.Ordinal))
        {
            screen = null;
            return false;
        }
        return true;
    }

    private static bool TryReadBinding(
        NDeckEnchantSelectScreen screen,
        out Binding? binding,
        out string? error)
    {
        binding = null;
        error = null;

        if (!BoundedCardSelectionFacts.TryRead(
                screen,
                out CardSelectorPrefs prefs,
                out IReadOnlyList<CardModel> selected,
                out string? selectionError))
        {
            error = selectionError;
            return false;
        }

        object? enchantmentValue = ReadField(screen, "_enchantment");
        object? amountValue = ReadField(screen, "_enchantmentAmount");

        if (enchantmentValue is not EnchantmentModel enchantment)
            error = "Missing or incompatible _enchantment binding.";
        else if (amountValue is not int amount)
            error = "Missing or incompatible _enchantmentAmount binding.";
        else
            binding = new Binding(prefs, selected, enchantment, amount);

        return binding != null;
    }

    internal static bool IsKifudaContinuation(
        NDeckEnchantSelectScreen screen,
        RelicModel expectedRelic)
    {
        if (expectedRelic is not Kifuda
            || !IsCurrentScreen(screen)
            || !TryReadBinding(screen, out Binding? binding, out _)
            || !TryResolveSource(binding!, out DeckEnchantSource? source, out _))
        {
            return false;
        }

        return source!.Kind == "kifuda_relic_pickup"
               && ReferenceEquals(expectedRelic.Owner.Relics
                   .FirstOrDefault(relic => ReferenceEquals(relic, expectedRelic)), expectedRelic);
    }

    private static bool TryResolveSource(
        Binding binding,
        out DeckEnchantSource? source,
        out string? error)
    {
        source = null;
        error = null;
        RunState? runState = RunManager.Instance.DebugOnlyGetState();

        if (runState?.CurrentRoom is MerchantRoom
            && binding.Enchantment is Adroit
            && binding.EnchantmentAmount == 3
            && binding.Preferences.MinSelect == 0
            && binding.Preferences.MaxSelect == 3
            && binding.Preferences.RequireManualConfirmation
            && !binding.Preferences.Cancelable
            && LocalContext.GetMe(runState)?.Relics.Any(relic => relic is Kifuda) == true)
        {
            source = new DeckEnchantSource(
                "kifuda_relic_pickup",
                "KIFUDA",
                "Kifuda.AfterObtained+Adroit:3+min0:max3+manual+noncancelable+owned-relic");
            return true;
        }

        EventModel? eventModel = (runState?.CurrentRoom as EventRoom)?.LocalMutableEvent
                                 ?? (runState?.CurrentRoom as EventRoom)?.CanonicalEvent;
        DeckEnchantSource? eventSource = ResolveEventSource(eventModel, binding);
        if (eventSource != null)
        {
            source = eventSource;
            return true;
        }

        error =
            "The active enchant screen does not match a source-audited vanilla Self-Help Book, Symbiote, or Kifuda contract.";
        return false;
    }

    internal static DeckEnchantSource? ResolveEventSource(
        EventModel? eventModel,
        Binding binding)
    {
        if (eventModel is SelfHelpBook
            && binding.EnchantmentAmount == 2
            && binding.Preferences.MinSelect == 1
            && binding.Preferences.MaxSelect == 1
            && !binding.Preferences.Cancelable
            && binding.Enchantment is Sharp or Nimble or MegaCrit.Sts2.Core.Models.Enchantments.Swift)
        {
            return new DeckEnchantSource(
                "self_help_book_event",
                "SELF_HELP_BOOK",
                "SelfHelpBook.SelectAndEnchant+supported-enchantment:2+single+noncancelable");
        }

        if (IsSymbioteSourceContract(
                eventModel is Symbiote,
                binding.Enchantment is Corrupted,
                binding.EnchantmentAmount,
                binding.Preferences.MinSelect,
                binding.Preferences.MaxSelect,
                binding.Preferences.RequireManualConfirmation,
                binding.Preferences.Cancelable))
        {
            return new DeckEnchantSource(
                "symbiote_event",
                "SYMBIOTE",
                "Symbiote.Approach+Corrupted:1+single+noncancelable");
        }

        return null;
    }

    internal static bool IsSymbioteSourceContract(
        bool exactEventType,
        bool exactEnchantmentType,
        int enchantmentAmount,
        int minSelect,
        int maxSelect,
        bool requireManualConfirmation,
        bool cancelable) =>
        exactEventType
        && exactEnchantmentType
        && enchantmentAmount == 1
        && minSelect == 1
        && maxSelect == 1
        && !requireManualConfirmation
        && !cancelable;

    private static object? ReadField(object source, string fieldName)
    {
        const BindingFlags Flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly;
        for (Type? type = source.GetType(); type != null; type = type.BaseType)
        {
            FieldInfo? field = type.GetField(fieldName, Flags);
            if (field != null)
                return field.GetValue(source);
        }
        return null;
    }

    private static bool IsCardSelected(NDeckEnchantSelectScreen screen, CardModel card) =>
        BoundedCardSelectionFacts.IsSelected(screen, card);

    private static IReadOnlyList<CardModel> ReadSelectedCards(NDeckEnchantSelectScreen screen) =>
        BoundedCardSelectionFacts.ReadSelectedCards(screen);

    private static VisibleEnchantment BuildEnchantment(
        NDeckEnchantSelectScreen screen,
        EnchantmentModel enchantment,
        int amount)
    {
        string? name = ReadNodeText(screen, "%EnchantmentTitle")
                       ?? McpMod.SafeGetText(() => enchantment.Title);
        string? description = ReadNodeText(screen, "%EnchantmentDescription");

        if (description == null)
        {
            try
            {
                EnchantmentModel display = enchantment.ToMutable();
                display.Amount = amount;
                display.RecalculateValues();
                description = McpMod.SafeGetText(() => display.DynamicDescription);
            }
            catch
            {
                description = McpMod.SafeGetText(() => enchantment.DynamicDescription);
            }
        }

        return new VisibleEnchantment(
            enchantment.Id.Entry,
            name,
            description,
            amount,
            "localized_visible_ui_text+model_identity");
    }

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

    private static bool IsCurrentScreen(NDeckEnchantSelectScreen screen) =>
        ActiveSurfaceResolver.IsVisibleActiveOverlay(screen)
        && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    private static bool IsPreviewVisible(NDeckEnchantSelectScreen screen) =>
        GetVisiblePreview(screen) != null;

    private static Control? GetVisiblePreview(NDeckEnchantSelectScreen screen)
    {
        Control? single = screen.GetNodeOrNull<Control>("%EnchantSinglePreviewContainer");
        if (single != null && McpMod.IsNodeVisible(single))
            return single;

        Control? multi = screen.GetNodeOrNull<Control>("%EnchantMultiPreviewContainer");
        return multi != null && McpMod.IsNodeVisible(multi) ? multi : null;
    }

    internal sealed record Binding(
        CardSelectorPrefs Preferences,
        IReadOnlyList<CardModel> SelectedCards,
        EnchantmentModel Enchantment,
        int EnchantmentAmount);
}
