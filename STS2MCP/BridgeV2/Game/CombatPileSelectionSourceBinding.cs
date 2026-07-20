using System;
using System.Collections.Generic;
using System.Linq;
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
        IReadOnlyList<CardModel> BaselineDiscard);

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

internal static class HeadbuttCombatPileWitness
{
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
        && ReferenceEquals(currentDraw[0], selectedCard)
        && currentDiscard.Count + currentDraw.Count
            == baselineDiscard.Count + baselineDraw.Count;

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}

internal static class GraveblastCombatPileWitness
{
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
               && reachedExpectedPile
               && currentDiscard.Count + currentHand.Count
                   == baselineDiscard.Count + baselineHand.Count;
    }

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}
