using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HarmonyLib;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Potions;
using MegaCrit.Sts2.Core.Models.Relics;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Records an exact game-owned source while a known relic acquisition task is
/// awaiting its generated-card choice. This is evidence only: it never grants
/// authority by itself, and ambiguous concurrent bindings fail closed.
/// </summary>
internal static class GeneratedCardChoiceSourceBinding
{
    private static readonly object Gate = new();
    private static readonly Dictionary<Guid, ActiveBinding> Active = new();

    internal abstract record ActiveBinding(
        Guid Token,
        string SourceKind,
        Player Player);

    internal sealed record LeadPaperweightBinding(
        Guid Token,
        Player Player,
        RelicModel SourceRelic,
        IReadOnlyList<CardModel> BaselineDeck)
        : ActiveBinding(Token, "lead_paperweight", Player);

    internal sealed record ColorlessPotionBinding(
        Guid Token,
        Player Player,
        PotionModel SourcePotion,
        IReadOnlyList<CardModel> BaselineHand,
        IReadOnlyList<CardModel> BaselineDiscard)
        : ActiveBinding(Token, "colorless_potion", Player);

    internal readonly record struct Scope(Guid Token)
    {
        public bool IsTracked => Token != Guid.Empty;
    }

    internal static Scope BeginRelic(RelicModel relic, Player player)
    {
        if (relic is not LeadPaperweight)
            return default;

        var binding = new LeadPaperweightBinding(
            Guid.NewGuid(),
            player,
            relic,
            player.Deck.Cards.ToArray());
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    internal static Scope BeginPotion(PotionModel potion, Creature? target)
    {
        if (potion is not ColorlessPotion
            || target?.Player is not Player player
            || player.PlayerCombatState is not { } combat)
        {
            return default;
        }

        var binding = new ColorlessPotionBinding(
            Guid.NewGuid(),
            player,
            potion,
            combat.Hand.Cards.ToArray(),
            combat.DiscardPile.Cards.ToArray());
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    internal static async Task<RelicModel> Complete(Task<RelicModel> task, Scope scope)
    {
        try
        {
            return await task;
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

    internal static bool TryGetUnique(out ActiveBinding? binding)
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
    typeof(RelicCmd),
    nameof(RelicCmd.Obtain),
    new[] { typeof(RelicModel), typeof(Player), typeof(int) })]
internal static class GeneratedCardChoiceRelicObtainPatch
{
    private static void Prefix(
        RelicModel relic,
        Player player,
        out GeneratedCardChoiceSourceBinding.Scope __state)
    {
        __state = GeneratedCardChoiceSourceBinding.BeginRelic(relic, player);
    }

    private static void Postfix(
        ref Task<RelicModel> __result,
        GeneratedCardChoiceSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = GeneratedCardChoiceSourceBinding.Complete(__result, __state);
    }
}


[HarmonyPatch(
    typeof(PotionModel),
    nameof(PotionModel.OnUseWrapper),
    new[] { typeof(PlayerChoiceContext), typeof(Creature) })]
internal static class GeneratedCardChoicePotionUsePatch
{
    private static void Prefix(
        PotionModel __instance,
        Creature? target,
        out GeneratedCardChoiceSourceBinding.Scope __state)
    {
        __state = GeneratedCardChoiceSourceBinding.BeginPotion(__instance, target);
    }

    private static void Postfix(
        ref Task __result,
        GeneratedCardChoiceSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = GeneratedCardChoiceSourceBinding.Complete(__result, __state);
    }
}

internal static class GeneratedRunCardAcquisitionWitness
{
    internal static bool Selected<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyCollection<T> baselineDeck,
        IReadOnlyCollection<T> currentDeck,
        T selectedCard) where T : class =>
        sourceCompleted
        && surfaceClosed
        && !ContainsReference(baselineDeck, selectedCard)
        && ContainsReference(currentDeck, selectedCard)
        && currentDeck.Count == baselineDeck.Count + 1;

    internal static bool Skipped<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyCollection<T> baselineDeck,
        IReadOnlyCollection<T> currentDeck,
        IReadOnlyCollection<T> offeredCards) where T : class =>
        sourceCompleted
        && surfaceClosed
        && currentDeck.Count == baselineDeck.Count
        && offeredCards.All(card => !ContainsReference(currentDeck, card));

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}

internal static class GeneratedCombatCardChoiceWitness
{
    internal static bool Selected<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyCollection<T> baselineHand,
        IReadOnlyCollection<T> baselineDiscard,
        IReadOnlyCollection<T> currentHand,
        IReadOnlyCollection<T> currentDiscard,
        T selectedCard,
        bool hasFreeThisTurnCostModifier) where T : class =>
        sourceCompleted
        && surfaceClosed
        && !ContainsReference(baselineHand, selectedCard)
        && !ContainsReference(baselineDiscard, selectedCard)
        && (ContainsReference(currentHand, selectedCard) || ContainsReference(currentDiscard, selectedCard))
        && currentHand.Count + currentDiscard.Count == baselineHand.Count + baselineDiscard.Count + 1
        && hasFreeThisTurnCostModifier;

    internal static bool Skipped<T>(
        bool sourceCompleted,
        bool surfaceClosed,
        IReadOnlyCollection<T> baselineHand,
        IReadOnlyCollection<T> baselineDiscard,
        IReadOnlyCollection<T> currentHand,
        IReadOnlyCollection<T> currentDiscard,
        IReadOnlyCollection<T> offeredCards) where T : class =>
        sourceCompleted
        && surfaceClosed
        && currentHand.Count == baselineHand.Count
        && currentDiscard.Count == baselineDiscard.Count
        && offeredCards.All(card =>
            !ContainsReference(currentHand, card) && !ContainsReference(currentDiscard, card));

    private static bool ContainsReference<T>(IEnumerable<T> cards, T expected) where T : class =>
        cards.Any(card => ReferenceEquals(card, expected));
}
