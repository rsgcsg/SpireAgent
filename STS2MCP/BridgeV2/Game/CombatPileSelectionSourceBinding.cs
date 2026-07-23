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
using MegaCrit.Sts2.Core.Models.Cards;

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

    internal sealed record HeadbuttBinding(
        Guid Token,
        Player Player,
        Headbutt Headbutt,
        IReadOnlyList<CardModel> BaselineDiscard,
        IReadOnlyList<CardModel> BaselineDraw)
        : SourceBinding(Token, Player, Headbutt, BaselineDiscard);

    internal sealed record GraveblastBinding(
        Guid Token,
        Player Player,
        Graveblast Graveblast,
        IReadOnlyList<CardModel> BaselineDiscard,
        IReadOnlyList<CardModel> BaselineHand)
        : SourceBinding(Token, Player, Graveblast, BaselineDiscard);

    internal sealed record CleanseBinding(
        Guid Token,
        Player Player,
        Cleanse Cleanse,
        IReadOnlyList<CardModel> BaselineDraw,
        IReadOnlyList<CardModel> BaselineExhaust)
        : SourceBinding(Token, Player, Cleanse, BaselineDraw);

    internal sealed record SeanceBinding(
        Guid Token,
        Player Player,
        Seance Seance,
        IReadOnlyList<CardModel> BaselineDraw)
        : SourceBinding(Token, Player, Seance, BaselineDraw);

    internal sealed record DredgeBinding(
        Guid Token,
        Player Player,
        Dredge Dredge,
        IReadOnlyList<CardModel> BaselineDiscard,
        IReadOnlyList<CardModel> BaselineHand)
        : SourceBinding(Token, Player, Dredge, BaselineDiscard);

    internal readonly record struct Scope(Guid Token)
    {
        public bool IsTracked => Token != Guid.Empty;
    }

    internal static Scope Begin(CardModel card)
    {
        if (card.Owner is not Player player
            || player.PlayerCombatState is not { } combat)
        {
            return default;
        }

        Guid token = Guid.NewGuid();
        SourceBinding? binding = card switch
        {
            Headbutt headbutt => new HeadbuttBinding(
                token,
                player,
                headbutt,
                combat.DiscardPile.Cards.ToArray(),
                combat.DrawPile.Cards.ToArray()),
            Graveblast graveblast => new GraveblastBinding(
                token,
                player,
                graveblast,
                combat.DiscardPile.Cards.ToArray(),
                combat.Hand.Cards.ToArray()),
            _ => null
        };
        if (binding == null)
            return default;

        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    internal static Scope BeginCleanse(Cleanse cleanse)
    {
        if (cleanse.Owner is not Player player
            || player.PlayerCombatState is not { } combat)
        {
            return default;
        }

        var binding = new CleanseBinding(
            Guid.NewGuid(),
            player,
            cleanse,
            combat.DrawPile.Cards.ToArray(),
            combat.ExhaustPile.Cards.ToArray());
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    internal static Scope BeginSeance(Seance seance)
    {
        if (seance.Owner is not Player player
            || player.PlayerCombatState is not { } combat)
        {
            return default;
        }

        var binding = new SeanceBinding(
            Guid.NewGuid(),
            player,
            seance,
            combat.DrawPile.Cards.ToArray());
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    internal static Scope BeginDredge(Dredge dredge)
    {
        if (dredge.Owner is not Player player
            || player.PlayerCombatState is not { } combat)
        {
            return default;
        }

        var binding = new DredgeBinding(
            Guid.NewGuid(),
            player,
            dredge,
            combat.DiscardPile.Cards.ToArray(),
            combat.Hand.Cards.ToArray());
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
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

/// <summary>
/// Cleanse owns its pile choice inside the card-specific OnPlay task. Binding
/// that exact task keeps source evidence local to the business effect and
/// avoids depending on the broader wrapper lifecycle used by older sources.
/// </summary>
[HarmonyPatch]
internal static class CleanseCombatPileSelectionSourcePatch
{
    internal static MethodBase ResolveTargetMethod() =>
        AccessTools.DeclaredMethod(
            typeof(Cleanse),
            "OnPlay",
            new[] { typeof(PlayerChoiceContext), typeof(CardPlay) })
        ?? throw new MissingMethodException(typeof(Cleanse).FullName, "OnPlay");

    private static MethodBase TargetMethod() => ResolveTargetMethod();

    private static void Prefix(
        Cleanse __instance,
        out CombatPileSelectionSourceBinding.Scope __state)
    {
        __state = CombatPileSelectionSourceBinding.BeginCleanse(__instance);
    }

    private static void Postfix(
        ref Task __result,
        CombatPileSelectionSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = CombatPileSelectionSourceBinding.Complete(__result, __state);
    }
}

/// <summary>
/// Seance uses the same combat-pile screen as Cleanse but replaces the chosen
/// draw-pile card with a new Soul instance. Keep its exact OnPlay task as the
/// source binding so shared selector mechanics do not erase business purpose.
/// </summary>
[HarmonyPatch]
internal static class SeanceCombatPileSelectionSourcePatch
{
    internal static MethodBase ResolveTargetMethod() =>
        AccessTools.DeclaredMethod(
            typeof(Seance),
            "OnPlay",
            new[] { typeof(PlayerChoiceContext), typeof(CardPlay) })
        ?? throw new MissingMethodException(typeof(Seance).FullName, "OnPlay");

    private static MethodBase TargetMethod() => ResolveTargetMethod();

    private static void Prefix(
        Seance __instance,
        out CombatPileSelectionSourceBinding.Scope __state)
    {
        __state = CombatPileSelectionSourceBinding.BeginSeance(__instance);
    }

    private static void Postfix(
        ref Task __result,
        CombatPileSelectionSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = CombatPileSelectionSourceBinding.Complete(__result, __state);
    }
}

/// <summary>
/// Dredge has a bounded multi-pick transaction whose exact count depends on
/// current hand capacity. Bind the card-specific task so intermediate selected
/// states remain attributable without granting generic pile-grid authority.
/// </summary>
[HarmonyPatch]
internal static class DredgeCombatPileSelectionSourcePatch
{
    internal static MethodBase ResolveTargetMethod() =>
        AccessTools.DeclaredMethod(
            typeof(Dredge),
            "OnPlay",
            new[] { typeof(PlayerChoiceContext), typeof(CardPlay) })
        ?? throw new MissingMethodException(typeof(Dredge).FullName, "OnPlay");

    private static MethodBase TargetMethod() => ResolveTargetMethod();

    private static void Prefix(
        Dredge __instance,
        out CombatPileSelectionSourceBinding.Scope __state)
    {
        __state = CombatPileSelectionSourceBinding.BeginDredge(__instance);
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
