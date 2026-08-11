using STS2_MCP.NativeUi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.CardSelection;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

/// <summary>
/// Exact-build adapter for source-qualified bounded selections from a combat
/// pile. The wire contract describes stable mechanics and transaction effects;
/// source identity remains provenance and an internal authorization input.
/// Every unqualified caller of the same native selector remains fail closed.
/// </summary>
internal sealed class CombatPileCardSelectionSurfaceReader : ILiveSurfaceReader
{
    private const string SurfaceKind = "combat_pile_card_selection";
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;

    private static readonly FieldInfo? ClickableField =
        typeof(NCardHolder).GetField("_isClickable", Flags);

    public string Kind => SurfaceKind;

    public InputOwnerLayer Layer => InputOwnerLayer.Overlay;

    public LiveObservation? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        NativeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NCombatPileCardSelectScreen screen)
            return null;

        ILiveContext context = LiveContextReader.Build(entities);
        if (!CombatPileSelectionSourceBinding.TryGetUnique(
                out CombatPileSelectionSourceBinding.SourceBinding? source))
        {
            return BindingUnavailable(
                game,
                context,
                "The combat-pile selector has no unique qualified source binding.",
                new[] { "combat_pile_selection_source", "legal_actions" });
        }

        return Build(screen, source!, context, entities, game);
    }

    private static LiveObservation Build(
        NCombatPileCardSelectScreen screen,
        CombatPileSelectionSourceBinding.SourceBinding source,
        ILiveContext context,
        NativeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (context is not CombatLiveContext
            || source.Player.PlayerCombatState is not { } combat)
        {
            return BindingUnavailable(
                game,
                context,
                "The combat-pile selector is visible without a qualified combat context.",
                new[] { "combat_context", "legal_actions" });
        }

        string? bindingError = null;
        if (!TryDescribeSource(source, out SourceSemantics? sourceSemantics)
            || !TryReadBinding(screen, out Binding? binding, out bindingError)
            || ClickableField == null)
        {
            return BindingUnavailable(
                game,
                context,
                bindingError ?? "The exact combat-pile selection binding is unavailable.",
                new[] { "selection_constraints", "selected_cards", "source_pile", "card_selectability", "legal_actions" });
        }

        Binding exactBinding = binding!;
        SourceSemantics semantics = sourceSemantics!;
        if (!IsExpectedSourcePile(exactBinding.Pile, combat, semantics.SourcePile)
            || !exactBinding.Pile.IsCombatPile
            || source.BaselineSourcePile.Count != exactBinding.Pile.Cards.Count
            || source.BaselineSourcePile.Any(card =>
                !exactBinding.Pile.Cards.Any(current => ReferenceEquals(current, card)))
            || !MatchesSelectionContract(source, semantics, exactBinding.Preferences)
            || exactBinding.Preferences.Cancelable)
        {
            return BindingUnavailable(
                game,
                context,
                $"The visible selector does not match exact {semantics.SourceKind} {semantics.SourcePile} selection semantics.",
                new[] { "source_pile", "selection_constraints", "source_semantics", "legal_actions" });
        }

        string? prompt = ReadNodeText(screen, "%BottomLabel");
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return BindingUnavailable(
                game,
                context,
                "The player-visible combat-pile selection prompt is unavailable.",
                new[] { "prompt", "legal_actions" });
        }

        IReadOnlyList<NGridCardHolder> holders = McpMod.FindAllSortedByPosition<NGridCardHolder>(screen)
            .Where(holder => McpMod.IsNodeVisible(holder) && holder.CardModel != null)
            .ToArray();
        HashSet<CardModel> selectedCards = exactBinding.SelectedCards.ToHashSet();
        var cards = new List<VisibleCard>(holders.Count);
        var cardIds = new Dictionary<CardModel, string>();
        foreach (NGridCardHolder holder in holders)
        {
            CardModel card = holder.CardModel;
            string cardId = entities.GetId(card, "card");
            cardIds[card] = cardId;
            cards.Add(LiveContextReader.BuildCard(
                card,
                cardId,
                selectedCards.Contains(card),
                displayPile: exactBinding.Pile.Type));
        }

        string[] selectedIds = selectedCards
            .Select(card => cardIds.TryGetValue(card, out string? id) ? id : null)
            .Where(id => id != null)
            .Cast<string>()
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToArray();
        if (selectedIds.Length != selectedCards.Count)
        {
            return BindingUnavailable(
                game,
                context,
                "A selected combat-pile card is absent from the visible grid.",
                new[] { "selected_cards", "legal_actions" });
        }

        string[] selectableIds = holders
            .Where(holder => IsHolderClickable(holder)
                             && !selectedCards.Contains(holder.CardModel)
                             && selectedCards.Count < exactBinding.Preferences.MaxSelect)
            .Select(holder => cardIds[holder.CardModel])
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToArray();
        string[] deselectableIds = holders
            .Where(holder => IsHolderClickable(holder)
                             && selectedCards.Contains(holder.CardModel))
            .Select(holder => cardIds[holder.CardModel])
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToArray();
        bool canConfirm = semantics.CommitMode == "manual_confirm"
                          && selectedCards.Count >= exactBinding.Preferences.MinSelect
                          && selectedCards.Count <= exactBinding.Preferences.MaxSelect
                          && FindVisibleEnabledConfirm(screen) != null;
        var surface = new CombatPileCardSelectionSurface(
            SurfaceKind,
            entities.GetId(screen, "screen"),
            prompt,
            semantics.Purpose,
            semantics.MutationKind,
            semantics.CommitMode,
            semantics.SourceKind,
            source.SourceEntityKind,
            entities.GetId(source.SourceModel, source.SourceEntityKind),
            source.SourceDefinitionId,
            source.SourceCard == null
                ? null
                : entities.GetId(source.SourceCard, "card"),
            source.SourceCard?.Id.Entry,
            exactBinding.Pile.Type.ToString().ToLowerInvariant(),
            semantics.DestinationPile,
            semantics.DestinationPosition,
            semantics.OverflowDestination,
            semantics.ReplacementCardDefinitionId,
            exactBinding.Preferences.MinSelect,
            exactBinding.Preferences.MaxSelect,
            selectedCards.Count,
            selectedIds,
            exactBinding.Preferences.RequireManualConfirmation,
            exactBinding.Preferences.Cancelable,
            cards)
        {
            SelectableCardEntityIds = selectableIds,
            DeselectableCardEntityIds = deselectableIds,
            CanConfirm = canConfirm
        };

        bool hasCurrentCommand = selectableIds.Length > 0
                                 || deselectableIds.Length > 0
                                 || canConfirm;
        string readiness = hasCurrentCommand ? "ready" : "settling";
        var completeness = new StateCompleteness(
            semantics.Completeness,
            hasCurrentCommand
                ? "derived_from_exact_visible_grid_and_current_controls"
                : "temporarily_empty_while_selection_completes_or_settles",
            new[]
            {
                "NCombatPileCardSelectScreen visible overlay",
                "NCardGrid visible holders",
                "NCardHolder._isClickable exact-version binding",
                $"{semantics.SourceType} exact source task",
                $"CardSelectCmd.FromCombatPile({semantics.SourcePile}, source-specific-bounds)",
                semantics.CommitEvidence,
                "NCombatPileCardSelectScreen.%BottomLabel"
            },
            Array.Empty<string>());
        string signature = StableIdentityHash.Object(new
        {
            game.Version,
            surface
        });

        return new LiveObservation(
            signature,
            readiness,
            context,
            surface,
            completeness,
            game,
            new[]
            {
                "Private-field bindings are exact-version scoped and expose only semantics already visible in the combat selection UI."
            });
    }

    private static NativeInputResult StartSelection(
        NCombatPileCardSelectScreen expectedScreen,
        CombatPileSelectionSourceBinding.SourceBinding source,
        SourceSemantics semantics,
        CardModel expectedCard,
        bool expectedSelected)
    {
        if (!IsCurrent(expectedScreen))
            return NativeInputResult.Rejected("screen_changed", "Combat-pile selection is no longer current.");

        NGridCardHolder? holder = McpMod.FindAllSortedByPosition<NGridCardHolder>(expectedScreen)
            .FirstOrDefault(candidate => ReferenceEquals(candidate.CardModel, expectedCard)
                                         && McpMod.IsNodeVisible(candidate)
                                         && IsHolderClickable(candidate));
        NCardGrid? grid = McpMod.FindFirst<NCardGrid>(expectedScreen);
        if (holder == null || grid == null || IsSelected(expectedScreen, expectedCard) != expectedSelected)
        {
            return NativeInputResult.Rejected(
                "card_not_actionable",
                "The advertised combat-pile card or its selected state changed before execution.");
        }

        IReadOnlyList<CardModel> previousSelection = ReadSelectedCards(expectedScreen);
        bool automaticCommitStarts = semantics.CommitMode == "automatic_at_max"
                                     && !expectedSelected
                                     && previousSelection.Count + 1 >= BindingMax(source);
        IReadOnlyList<CardModel> committedSelection = automaticCommitStarts
            ? previousSelection.Append(expectedCard).ToArray()
            : Array.Empty<CardModel>();

        grid.EmitSignal(NCardGrid.SignalName.HolderPressed, holder);
        string completionEvidence = source switch
        {
            CombatPileSelectionSourceBinding.RegistryBinding registered =>
                automaticCommitStarts
                    ? registered.Contract.CompletionEvidence
                    : $"{registered.Contract.SourceKind}_intermediate_selection_exactly_changed_without_commit",
            _ => semantics.CompletionEvidence
        };
        return NativeInputResult.Started(
            () => source.Player.PlayerCombatState is { } combat
                  && source switch
                  {
                      CombatPileSelectionSourceBinding.RegistryBinding registered =>
                          RegistrySelectionResult(
                              expectedScreen,
                              registered,
                              combat,
                              previousSelection,
                              ReadSelectedCards(expectedScreen),
                              committedSelection,
                              expectedCard,
                              expectedSelected,
                              automaticCommitStarts),
                      _ => false
                  },
            completionEvidence,
            allowIntermediateStateChanges: true);

    }

    private static NativeInputResult StartConfirm(
        NCombatPileCardSelectScreen expectedScreen,
        CombatPileSelectionSourceBinding.SourceBinding source,
        SourceSemantics semantics,
        NConfirmButton expectedConfirm)
    {
        if (!IsCurrent(expectedScreen)
            || semantics.CommitMode != "manual_confirm"
            || FindVisibleEnabledConfirm(expectedScreen) is not { } currentConfirm
            || !ReferenceEquals(currentConfirm, expectedConfirm))
        {
            return NativeInputResult.Rejected(
                "confirm_not_available",
                "The advertised combat-pile confirmation is no longer current.");
        }

        IReadOnlyList<CardModel> selectedCards = ReadSelectedCards(expectedScreen);
        if (!TryReadBinding(expectedScreen, out Binding? binding, out _)
            || binding == null
            || selectedCards.Count < binding.Preferences.MinSelect
            || selectedCards.Count > binding.Preferences.MaxSelect
            || binding.Preferences.MaxSelect != BindingMax(source))
        {
            return NativeInputResult.Rejected(
                "selection_changed",
                "The combat-pile selection bounds or selected count changed before confirmation.");
        }

        expectedConfirm.ForceClick();
        return NativeInputResult.Started(
            () => source.Player.PlayerCombatState is { } combat
                  && source switch
                  {
                      CombatPileSelectionSourceBinding.RegistryBinding registered =>
                          RegistryManualCommitCompleted(
                              expectedScreen,
                              registered,
                              combat,
                              selectedCards),
                      _ => false
                  },
            semantics.CompletionEvidence,
            allowIntermediateStateChanges: true);
    }

    internal static NativeInputResult StartDirectToggle(
        NativeEntityRegistry entities,
        CombatPileCardSelectionSurface expectedSurface,
        string cardId,
        bool expectedSelected)
    {
        if (!TryResolveDirect(
                entities,
                expectedSurface,
                out NCombatPileCardSelectScreen? screen,
                out CombatPileSelectionSourceBinding.SourceBinding? source,
                out SourceSemantics? semantics)
            || !entities.TryResolve(cardId, out CardModel? card)
            || card == null)
        {
            return NativeInputResult.Rejected(
                "combat_pile_binding_stale",
                "The exact combat-pile screen, source, or card no longer resolves.");
        }
        return StartSelection(screen!, source!, semantics!, card, expectedSelected);
    }

    internal static NativeInputResult StartDirectConfirm(
        NativeEntityRegistry entities,
        CombatPileCardSelectionSurface expectedSurface)
    {
        if (!TryResolveDirect(
                entities,
                expectedSurface,
                out NCombatPileCardSelectScreen? screen,
                out CombatPileSelectionSourceBinding.SourceBinding? source,
                out SourceSemantics? semantics)
            || FindVisibleEnabledConfirm(screen!) is not { } confirm)
        {
            return NativeInputResult.Rejected(
                "combat_pile_binding_stale",
                "The exact combat-pile confirmation no longer resolves.");
        }
        return StartConfirm(screen!, source!, semantics!, confirm);
    }

    private static bool TryResolveDirect(
        NativeEntityRegistry entities,
        CombatPileCardSelectionSurface expectedSurface,
        out NCombatPileCardSelectScreen? screen,
        out CombatPileSelectionSourceBinding.SourceBinding? source,
        out SourceSemantics? semantics)
    {
        screen = null;
        source = null;
        semantics = null;
        if (!entities.TryResolve(expectedSurface.ScreenEntityId, out screen)
            || screen == null
            || !IsCurrent(screen)
            || !CombatPileSelectionSourceBinding.TryGetUnique(out source)
            || source == null
            || !TryDescribeSource(source, out semantics)
            || semantics == null)
        {
            return false;
        }

        string sourceEntityId = entities.GetId(source.SourceModel, source.SourceEntityKind);
        string? sourceCardEntityId = source.SourceCard == null
            ? null
            : entities.GetId(source.SourceCard, "card");
        return string.Equals(sourceEntityId, expectedSurface.SourceEntityId, StringComparison.Ordinal)
               && string.Equals(source.SourceEntityKind, expectedSurface.SourceEntityKind, StringComparison.Ordinal)
               && string.Equals(source.SourceDefinitionId, expectedSurface.SourceDefinitionId, StringComparison.Ordinal)
               && string.Equals(sourceCardEntityId, expectedSurface.SourceCardEntityId, StringComparison.Ordinal)
               && string.Equals(source.SourceCard?.Id.Entry, expectedSurface.SourceCardDefinitionId, StringComparison.Ordinal)
               && string.Equals(semantics.SourceKind, expectedSurface.SourceKind, StringComparison.Ordinal)
               && string.Equals(semantics.Purpose, expectedSurface.Purpose, StringComparison.Ordinal)
               && string.Equals(semantics.MutationKind, expectedSurface.MutationKind, StringComparison.Ordinal)
               && string.Equals(semantics.CommitMode, expectedSurface.CommitMode, StringComparison.Ordinal)
               && string.Equals(semantics.SourcePile, expectedSurface.PileType, StringComparison.Ordinal)
               && string.Equals(semantics.DestinationPile, expectedSurface.DestinationPile, StringComparison.Ordinal)
               && string.Equals(semantics.DestinationPosition, expectedSurface.DestinationPosition, StringComparison.Ordinal)
               && string.Equals(semantics.OverflowDestination, expectedSurface.OverflowDestination, StringComparison.Ordinal)
               && string.Equals(semantics.ReplacementCardDefinitionId, expectedSurface.ReplacementCardDefinitionId, StringComparison.Ordinal);
    }

    private static bool TryDescribeSource(
        CombatPileSelectionSourceBinding.SourceBinding source,
        out SourceSemantics? semantics)
    {
        semantics = source is CombatPileSelectionSourceBinding.RegistryBinding registered
            ? FromContract(registered.Contract)
            : null;
        return semantics != null;
    }

    private static SourceSemantics FromContract(CombatPileSourceContract contract) =>
        new(
            contract.Purpose,
            contract.MutationKind,
            contract.CommitMode,
            contract.SourceKind,
            contract.SourceDisplayName,
            contract.SourcePile,
            contract.DestinationPile,
            contract.DestinationPosition,
            contract.OverflowDestination,
            contract.ReplacementCardDefinitionId,
            contract.Completeness,
            contract.CommitEvidence,
            contract.Label,
            contract.CompletionEvidence);

    private static bool TryReadBinding(
        NCombatPileCardSelectScreen screen,
        out Binding? binding,
        out string? error)
    {
        binding = null;
        error = null;
        object? prefsValue = ReadField(screen, "_prefs");
        object? selectedValue = ReadField(screen, "_selectedCards");
        object? pileValue = ReadField(screen, "_pile");

        if (prefsValue is not CardSelectorPrefs prefs)
            error = "Missing or incompatible _prefs binding.";
        else if (selectedValue is not IEnumerable<CardModel> selected)
            error = "Missing or incompatible _selectedCards binding.";
        else if (pileValue is not CardPile pile)
            error = "Missing or incompatible _pile binding.";
        else
            binding = new Binding(prefs, selected.ToArray(), pile);

        return binding != null;
    }

    private static object? ReadField(object source, string fieldName)
    {
        const BindingFlags SearchFlags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly;
        for (Type? type = source.GetType(); type != null; type = type.BaseType)
        {
            FieldInfo? field = type.GetField(fieldName, SearchFlags);
            if (field != null)
                return field.GetValue(source);
        }
        return null;
    }

    private static bool IsSelected(NCombatPileCardSelectScreen screen, CardModel card) =>
        ReadField(screen, "_selectedCards") is IEnumerable<CardModel> cards
        && cards.Any(selected => ReferenceEquals(selected, card));

    private static IReadOnlyList<CardModel> ReadSelectedCards(NCombatPileCardSelectScreen screen) =>
        ReadField(screen, "_selectedCards") is IEnumerable<CardModel> cards
            ? cards.ToArray()
            : Array.Empty<CardModel>();

    private static bool MatchesSelectionContract(
        CombatPileSelectionSourceBinding.SourceBinding source,
        SourceSemantics semantics,
        CardSelectorPrefs preferences)
    {
        if (preferences.RequireManualConfirmation != (semantics.CommitMode == "manual_confirm"))
            return false;

        if (source is CombatPileSelectionSourceBinding.RegistryBinding registered)
        {
            return preferences.MinSelect == registered.MinSelect
                   && preferences.MaxSelect == registered.MaxSelect;
        }
        return false;
    }

    private static int BindingMax(CombatPileSelectionSourceBinding.SourceBinding binding) =>
        binding switch
        {
            CombatPileSelectionSourceBinding.RegistryBinding registered =>
                registered.MaxSelect,
            _ => 0
        };

    private static bool RegistrySelectionResult(
        NCombatPileCardSelectScreen expectedScreen,
        CombatPileSelectionSourceBinding.RegistryBinding binding,
        PlayerCombatState combat,
        IReadOnlyCollection<CardModel> previousSelection,
        IReadOnlyCollection<CardModel> currentSelection,
        IReadOnlyCollection<CardModel> committedSelection,
        CardModel toggledCard,
        bool wasSelected,
        bool automaticCommitStarted)
    {
        IReadOnlyList<CardModel>? currentSource =
            ResolveCurrentPile(combat, binding.Contract.SourcePile);
        IReadOnlyList<CardModel>? currentDestination =
            ResolveCurrentPile(combat, binding.Contract.DestinationPile);
        if (currentSource == null || currentDestination == null)
            return false;

        if (!automaticCommitStarted)
        {
            return CombatPileSelectionWitness.SelectionChanged(
                CombatPileSelectionSourceBinding.IsActive(binding.Token),
                IsCurrent(expectedScreen),
                binding.BaselineSourcePile,
                binding.BaselineDestinationPile,
                currentSource,
                currentDestination,
                previousSelection,
                currentSelection,
                toggledCard,
                wasSelected);
        }

        bool sourceCompleted = !CombatPileSelectionSourceBinding.IsActive(binding.Token);
        bool surfaceClosed = !IsCurrent(expectedScreen);
        return binding.Contract.WitnessKind switch
        {
            "move_one_to_top" =>
                MoveOneToTopWitness.Selected(
                    surfaceClosed,
                    binding.BaselineSourcePile,
                    binding.BaselineDestinationPile,
                    currentSource,
                    currentDestination,
                    toggledCard),
            "move_one_to_hand_or_source_if_full" =>
                MoveOneToDestinationOrFallbackWitness.Selected(
                    sourceCompleted,
                    surfaceClosed,
                    binding.BaselineSourcePile,
                    binding.BaselineDestinationPile,
                    currentSource,
                    currentDestination,
                    toggledCard,
                    CardPile.MaxCardsInHand),
            "move_one_between_piles" =>
                MoveOneBetweenPilesWitness.Selected(
                    sourceCompleted,
                    surfaceClosed,
                    binding.BaselineSourcePile,
                    binding.BaselineDestinationPile,
                    currentSource,
                    currentDestination,
                    toggledCard),
            "replace_one_same_index" =>
                ReplaceOneAtSameIndexWitness.Selected(
                    sourceCompleted,
                    surfaceClosed,
                    binding.BaselineSourcePile,
                    currentSource,
                    toggledCard,
                    replacement => IsExpectedReplacement(binding, replacement)),
            "move_exact_batch_between_piles" =>
                MoveExactBatchWitness.Completed(
                    sourceCompleted,
                    surfaceClosed,
                    binding.BaselineSourcePile,
                    binding.BaselineDestinationPile,
                    currentSource,
                    currentDestination,
                    committedSelection,
                    binding.MaxSelect),
            "replace_exact_batch_same_index" =>
                ReplaceExactBatchAtSameIndexesWitness.Completed(
                    sourceCompleted,
                    surfaceClosed,
                    binding.BaselineSourcePile,
                    currentSource,
                    committedSelection,
                    binding.MaxSelect,
                    replacement => IsExpectedReplacement(binding, replacement)),
            _ => false
        };
    }

    private static bool RegistryManualCommitCompleted(
        NCombatPileCardSelectScreen expectedScreen,
        CombatPileSelectionSourceBinding.RegistryBinding binding,
        PlayerCombatState combat,
        IReadOnlyCollection<CardModel> selectedCards)
    {
        IReadOnlyList<CardModel>? currentSource =
            ResolveCurrentPile(combat, binding.Contract.SourcePile);
        IReadOnlyList<CardModel>? currentDestination =
            ResolveCurrentPile(combat, binding.Contract.DestinationPile);
        if (currentSource == null
            || currentDestination == null
            || binding.Contract.WitnessKind != "move_optional_batch_between_piles")
        {
            return false;
        }

        return MoveOptionalBatchWitness.Completed(
            !CombatPileSelectionSourceBinding.IsActive(binding.Token),
            !IsCurrent(expectedScreen),
            binding.BaselineSourcePile,
            binding.BaselineDestinationPile,
            currentSource,
            currentDestination,
            selectedCards,
            binding.MaxSelect);
    }

    private static IReadOnlyList<CardModel>? ResolveCurrentPile(
        PlayerCombatState combat,
        string pile) => pile switch
    {
        "draw" => combat.DrawPile.Cards,
        "discard" => combat.DiscardPile.Cards,
        "hand" => combat.Hand.Cards,
        "exhaust" => combat.ExhaustPile.Cards,
        _ => null
    };

    private static bool IsExpectedReplacement(
        CombatPileSelectionSourceBinding.RegistryBinding binding,
        CardModel card)
    {
        if (!string.Equals(
                card.Id.Entry,
                binding.Contract.ReplacementCardDefinitionId,
                StringComparison.Ordinal))
        {
            return false;
        }

        return binding.Contract.ReplacementUpgradePolicy !=
                   "source_upgrade_implies_replacement_upgrade"
               || binding.SourceCard is not { IsUpgraded: true }
               || card.IsUpgraded;
    }

    private static bool IsHolderClickable(NCardHolder holder) =>
        ClickableField?.GetValue(holder) is true;

    private static bool IsExpectedSourcePile(
        CardPile pile,
        PlayerCombatState combat,
        string sourcePile) =>
        sourcePile switch
        {
            "discard" => ReferenceEquals(pile, combat.DiscardPile) && pile.Type == PileType.Discard,
            "draw" => ReferenceEquals(pile, combat.DrawPile) && pile.Type == PileType.Draw,
            _ => false
        };

    private static bool HasVisibleEnabledClose(NCombatPileCardSelectScreen screen) =>
        FindVisibleEnabledClose(screen) != null;

    private static NConfirmButton? FindVisibleEnabledConfirm(NCombatPileCardSelectScreen screen)
    {
        NConfirmButton? confirm = screen.GetNodeOrNull<NConfirmButton>("%Confirm");
        return confirm is { IsEnabled: true } && McpMod.IsNodeVisible(confirm)
            ? confirm
            : null;
    }

    private static NBackButton? FindVisibleEnabledClose(NCombatPileCardSelectScreen screen)
    {
        NBackButton? close = screen.GetNodeOrNull<NBackButton>("%Close");
        return close is { IsEnabled: true } && McpMod.IsNodeVisible(close) ? close : null;
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

    private static bool IsCurrent(NCombatPileCardSelectScreen screen) =>
        ActiveInputResolver.IsVisibleActiveOverlay(screen)
        && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    private static LiveObservation BindingUnavailable(
        GameBuildIdentity game,
        ILiveContext context,
        string reason,
        IReadOnlyList<string> missing)
        => NativeUiFailClosedObservation.BindingUnavailable(
            game,
            context,
            nameof(NCombatPileCardSelectScreen),
            reason,
            new[] { "NCombatPileCardSelectScreen exact-version binding" },
            missing,
            "combat_pile_card_selection_binding_unavailable",
            "gateway.surface.combat_pile_card_selection.binding_unavailable",
            "Combat pile-selection source or completion semantics are not exact.");

    private sealed record Binding(
        CardSelectorPrefs Preferences,
        IReadOnlyList<CardModel> SelectedCards,
        CardPile Pile);

    private sealed record SourceSemantics(
        string Purpose,
        string MutationKind,
        string CommitMode,
        string SourceKind,
        string SourceType,
        string SourcePile,
        string DestinationPile,
        string DestinationPosition,
        string? OverflowDestination,
        string? ReplacementCardDefinitionId,
        string Completeness,
        string CommitEvidence,
        Func<string, bool, string> ActionLabel,
        string CompletionEvidence);
}
