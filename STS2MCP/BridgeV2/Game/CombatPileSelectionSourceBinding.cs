using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using HarmonyLib;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Models;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Tracks the exact card-play task that owns a combat-pile selector. The
/// binding is evidence only; the provider still validates the exact screen,
/// piles, constraints, source semantics, and visible controls.
/// </summary>
internal static class CombatPileSelectionSourceBinding
{
    private static readonly object Gate = new();
    private static readonly Dictionary<Guid, SourceBinding> Active = new();

    internal abstract record SourceBinding(
        Guid Token,
        Player Player,
        CardModel SourceCard,
        IReadOnlyList<CardModel> BaselineSourcePile);

    internal sealed record RegistryBinding(
        Guid Token,
        Player Player,
        CardModel SourceCard,
        IReadOnlyList<CardModel> BaselineSourcePile,
        IReadOnlyList<CardModel> BaselineDestinationPile,
        int MinSelect,
        int MaxSelect,
        CombatPileSourceContract Contract)
        : SourceBinding(Token, Player, SourceCard, BaselineSourcePile);

    internal readonly record struct Scope(Guid Token)
    {
        public bool IsTracked => Token != Guid.Empty;
    }

    internal static Scope Begin(CardModel card) =>
        BeginRegistered(card, "card_on_play_wrapper");

    internal static Scope BeginDeclaredOnPlay(CardModel card) =>
        BeginRegistered(card, "declared_on_play");

    private static Scope BeginRegistered(CardModel card, string hookMode)
    {
        if (card.Owner is not Player player
            || player.PlayerCombatState is not { } combat
            || !CombatPileSourceContractRegistry.TryFind(
                card.GetType(),
                hookMode,
                out CombatPileSourceContract? contract))
        {
            return default;
        }

        CardPile? sourcePile = ResolvePile(combat, contract!.SourcePile);
        CardPile? destinationPile = ResolvePile(combat, contract.DestinationPile);
        if (sourcePile == null
            || destinationPile == null
            || !TryResolveBounds(card, combat, contract, out int minSelect, out int maxSelect)
            || maxSelect <= 0)
        {
            return default;
        }

        var binding = new RegistryBinding(
            Guid.NewGuid(),
            player,
            card,
            sourcePile.Cards.ToArray(),
            destinationPile.Cards.ToArray(),
            minSelect,
            maxSelect,
            contract);
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    private static CardPile? ResolvePile(PlayerCombatState combat, string pile) => pile switch
    {
        "draw" => combat.DrawPile,
        "discard" => combat.DiscardPile,
        "hand" => combat.Hand,
        "exhaust" => combat.ExhaustPile,
        _ => null
    };

    private static bool TryResolveBounds(
        CardModel card,
        PlayerCombatState combat,
        CombatPileSourceContract contract,
        out int minSelect,
        out int maxSelect)
    {
        int handSpace = Math.Max(0, CardPile.MaxCardsInHand - combat.Hand.Cards.Count);
        switch (contract.SelectionBounds)
        {
            case "fixed_exact":
                minSelect = contract.SelectionCount;
                maxSelect = contract.SelectionCount;
                return minSelect > 0;
            case "fixed_exact_capped_by_hand_space":
                minSelect = Math.Min(contract.SelectionCount, handSpace);
                maxSelect = minSelect;
                return minSelect > 0;
            case "dynamic_cards_optional_capped_by_hand_space":
                minSelect = 0;
                maxSelect = Math.Min(card.DynamicVars.Cards.IntValue, handSpace);
                return maxSelect > 0;
            default:
                minSelect = 0;
                maxSelect = 0;
                return false;
        }
    }

    internal static async Task Complete(Task task, Scope scope)
    {
        try
        {
            await task;
        }
        finally
        {
            if (scope.IsTracked)
            {
                lock (Gate)
                    Active.Remove(scope.Token);
            }
        }
    }

    internal static bool TryGetUnique(out SourceBinding? binding)
    {
        lock (Gate)
        {
            binding = Active.Count == 1 ? Active.Values.Single() : null;
            return binding != null;
        }
    }

    internal static bool IsActive(Guid token)
    {
        lock (Gate)
            return Active.ContainsKey(token);
    }
}

[HarmonyPatch(
    typeof(CardModel),
    nameof(CardModel.OnPlayWrapper),
    new[]
    {
        typeof(PlayerChoiceContext),
        typeof(Creature),
        typeof(bool),
        typeof(ResourceInfo),
        typeof(bool)
    })]
internal static class CombatPileSelectionCardPlayPatch
{
    private static void Prefix(
        CardModel __instance,
        out CombatPileSelectionSourceBinding.Scope __state)
    {
        __state = CombatPileSelectionSourceBinding.Begin(__instance);
    }

    private static void Postfix(
        ref Task __result,
        CombatPileSelectionSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = CombatPileSelectionSourceBinding.Complete(__result, __state);
    }
}

[HarmonyPatch]
internal static class DeclaredOnPlayCombatPileSelectionSourcePatch
{
    internal static IReadOnlyList<MethodBase> ResolveTargetMethods() =>
        CombatPileSourceContractRegistry.ResolveDeclaredOnPlayTargets();

    private static IEnumerable<MethodBase> TargetMethods() => ResolveTargetMethods();

    private static void Prefix(
        CardModel __instance,
        out CombatPileSelectionSourceBinding.Scope __state)
    {
        __state = CombatPileSelectionSourceBinding.BeginDeclaredOnPlay(__instance);
    }

    private static void Postfix(
        ref Task __result,
        CombatPileSelectionSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = CombatPileSelectionSourceBinding.Complete(__result, __state);
    }
}

internal static class HeadbuttCombatPileWitness
{
    // The played source card reaches its own post-play pile after this baseline,
    // so aggregate pile counts are not an invariant of the selected-card move.
    internal static bool Selected<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyCollection<T> baselineDiscard,
        IReadOnlyCollection<T> baselineDraw,
        IReadOnlyList<T> currentDiscard,
        IReadOnlyList<T> currentDraw,
        T selectedCard) where T : class =>
        sourceCompleted
        && surfaceClosed
        && ContainsReference(baselineDiscard, selectedCard)
        && !ContainsReference(baselineDraw, selectedCard)
        && !ContainsReference(currentDiscard, selectedCard)
        && currentDraw.Count > 0
        && ReferenceEquals(currentDraw[0], selectedCard);

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}

internal static class GraveblastCombatPileWitness
{
    // As above, completion proves the exact selected-card destination rather
    // than imposing a false aggregate count invariant on the source card.
    internal static bool Selected<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyCollection<T> baselineDiscard,
        IReadOnlyCollection<T> baselineHand,
        IReadOnlyList<T> currentDiscard,
        IReadOnlyList<T> currentHand,
        T selectedCard,
        int maxHandSize) where T : class
    {
        bool handHadCapacity = baselineHand.Count < maxHandSize;
        bool reachedExpectedPile = handHadCapacity
            ? ContainsReference(currentHand, selectedCard)
              && !ContainsReference(currentDiscard, selectedCard)
            : ContainsReference(currentDiscard, selectedCard)
              && !ContainsReference(currentHand, selectedCard);
        return sourceCompleted
               && surfaceClosed
               && ContainsReference(baselineDiscard, selectedCard)
               && !ContainsReference(baselineHand, selectedCard)
               && reachedExpectedPile;
    }

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}

internal static class CleanseCombatPileWitness
{
    // Cleanse's source card may settle into a different post-play pile. The
    // witness therefore proves only the selected draw-pile card's exact move.
    internal static bool Selected<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyCollection<T> baselineDraw,
        IReadOnlyCollection<T> baselineExhaust,
        IReadOnlyList<T> currentDraw,
        IReadOnlyList<T> currentExhaust,
        T selectedCard) where T : class =>
        sourceCompleted
        && surfaceClosed
        && ContainsReference(baselineDraw, selectedCard)
        && !ContainsReference(baselineExhaust, selectedCard)
        && !ContainsReference(currentDraw, selectedCard)
        && ContainsReference(currentExhaust, selectedCard);

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}

internal static class SeanceCombatPileWitness
{
    internal static bool Selected<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyList<T> baselineDraw,
        IReadOnlyList<T> currentDraw,
        T selectedCard,
        Func<T, bool> isSoul) where T : class
    {
        int selectedIndex = IndexOfReference(baselineDraw, selectedCard);
        if (!sourceCompleted
            || !surfaceClosed
            || selectedIndex < 0
            || currentDraw.Count != baselineDraw.Count
            || ContainsReference(currentDraw, selectedCard))
        {
            return false;
        }

        T replacement = currentDraw[selectedIndex];
        return isSoul(replacement)
               && !ContainsReference(baselineDraw, replacement);
    }

    private static int IndexOfReference<T>(IReadOnlyList<T> cards, T expected) where T : class
    {
        for (int index = 0; index < cards.Count; index++)
        {
            if (ReferenceEquals(cards[index], expected))
                return index;
        }
        return -1;
    }

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}

internal static class DredgeCombatPileWitness
{
    internal static bool SelectionChanged<T>(
        bool sourceActive,
        bool surfaceOpen,
        IReadOnlyCollection<T> baselineDiscard,
        IReadOnlyCollection<T> baselineHand,
        IReadOnlyCollection<T> currentDiscard,
        IReadOnlyCollection<T> currentHand,
        IReadOnlyCollection<T> previousSelection,
        IReadOnlyCollection<T> currentSelection,
        T toggledCard,
        bool wasSelected) where T : class
    {
        if (!sourceActive
            || !surfaceOpen
            || !SameReferences(baselineDiscard, currentDiscard)
            || !SameReferences(baselineHand, currentHand))
        {
            return false;
        }

        var expected = previousSelection
            .Where(card => !ReferenceEquals(card, toggledCard))
            .ToList();
        if (!wasSelected)
            expected.Add(toggledCard);

        return SameReferences(expected, currentSelection);
    }

    internal static bool Completed<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyCollection<T> baselineDiscard,
        IReadOnlyCollection<T> baselineHand,
        IReadOnlyCollection<T> currentDiscard,
        IReadOnlyCollection<T> currentHand,
        IReadOnlyCollection<T> selectedCards,
        int expectedSelectionCount) where T : class
    {
        if (!sourceCompleted
            || !surfaceClosed
            || selectedCards.Count != expectedSelectionCount
            || currentDiscard.Count != baselineDiscard.Count - selectedCards.Count
            || currentHand.Count != baselineHand.Count + selectedCards.Count
            || !baselineHand.All(card => ContainsReference(currentHand, card)))
        {
            return false;
        }

        return selectedCards.All(card =>
                   ContainsReference(baselineDiscard, card)
                   && !ContainsReference(baselineHand, card)
                   && !ContainsReference(currentDiscard, card)
                   && ContainsReference(currentHand, card))
               && baselineDiscard
                   .Where(card => !ContainsReference(selectedCards, card))
                   .All(card => ContainsReference(currentDiscard, card));
    }

    private static bool SameReferences<T>(
        IReadOnlyCollection<T> expected,
        IReadOnlyCollection<T> actual) where T : class =>
        expected.Count == actual.Count
        && expected.All(card => ContainsReference(actual, card));

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}

internal static class NeowsFuryCombatPileWitness
{
    internal static bool SelectionChanged<T>(
        bool sourceActive,
        bool surfaceOpen,
        IReadOnlyCollection<T> baselineDiscard,
        IReadOnlyCollection<T> baselineHand,
        IReadOnlyCollection<T> currentDiscard,
        IReadOnlyCollection<T> currentHand,
        IReadOnlyCollection<T> previousSelection,
        IReadOnlyCollection<T> currentSelection,
        T toggledCard,
        bool wasSelected) where T : class =>
        DredgeCombatPileWitness.SelectionChanged(
            sourceActive,
            surfaceOpen,
            baselineDiscard,
            baselineHand,
            currentDiscard,
            currentHand,
            previousSelection,
            currentSelection,
            toggledCard,
            wasSelected);

    internal static bool Completed<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyCollection<T> baselineDiscard,
        IReadOnlyCollection<T> baselineHand,
        IReadOnlyCollection<T> currentDiscard,
        IReadOnlyCollection<T> currentHand,
        IReadOnlyCollection<T> selectedCards,
        int maxSelect) where T : class
    {
        if (!sourceCompleted
            || !surfaceClosed
            || selectedCards.Count > maxSelect
            || !baselineHand.All(card => ContainsReference(currentHand, card))
            || !baselineDiscard
                .Where(card => !ContainsReference(selectedCards, card))
                .All(card => ContainsReference(currentDiscard, card)))
        {
            return false;
        }

        return selectedCards.All(card =>
            ContainsReference(baselineDiscard, card)
            && !ContainsReference(baselineHand, card)
            && !ContainsReference(currentDiscard, card)
            && ContainsReference(currentHand, card));
    }

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}

internal static class ChargeCombatPileWitness
{
    internal static bool SelectionChanged<T>(
        bool sourceActive,
        bool surfaceOpen,
        IReadOnlyCollection<T> baselineDraw,
        IReadOnlyCollection<T> currentDraw,
        IReadOnlyCollection<T> previousSelection,
        IReadOnlyCollection<T> currentSelection,
        T toggledCard,
        bool wasSelected) where T : class
    {
        if (!sourceActive
            || !surfaceOpen
            || !SameReferences(baselineDraw, currentDraw))
        {
            return false;
        }

        var expected = previousSelection
            .Where(card => !ReferenceEquals(card, toggledCard))
            .ToList();
        if (!wasSelected)
            expected.Add(toggledCard);
        return SameReferences(expected, currentSelection);
    }

    internal static bool Completed<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyList<T> baselineDraw,
        IReadOnlyList<T> currentDraw,
        IReadOnlyCollection<T> selectedCards,
        Func<T, bool> isExpectedReplacement) where T : class
    {
        if (!sourceCompleted
            || !surfaceClosed
            || selectedCards.Count != 2
            || currentDraw.Count != baselineDraw.Count
            || selectedCards.Any(card => ContainsReference(currentDraw, card)))
        {
            return false;
        }

        foreach (T selected in selectedCards)
        {
            int index = IndexOfReference(baselineDraw, selected);
            if (index < 0
                || !isExpectedReplacement(currentDraw[index])
                || ContainsReference(baselineDraw, currentDraw[index]))
            {
                return false;
            }
        }
        return true;
    }

    private static int IndexOfReference<T>(IReadOnlyList<T> cards, T expected) where T : class
    {
        for (int index = 0; index < cards.Count; index++)
        {
            if (ReferenceEquals(cards[index], expected))
                return index;
        }
        return -1;
    }

    private static bool SameReferences<T>(
        IReadOnlyCollection<T> expected,
        IReadOnlyCollection<T> actual) where T : class =>
        expected.Count == actual.Count
        && expected.All(item => ContainsReference(actual, item));

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}
