using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HarmonyLib;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Relics;

namespace STS2_MCP.LiveHost;

/// <summary>
/// Preserves the exact New Leaf acquisition task while its native random
/// transform selector is open. The selector shape alone cannot identify its
/// caller, so unknown or concurrent sources remain fail closed.
/// </summary>
internal static class DeckTransformSourceBinding
{
    private static readonly object Gate = new();
    private static readonly Dictionary<Guid, NewLeafBinding> Active = new();

    internal sealed record NewLeafBinding(
        Guid Token,
        NewLeaf SourceRelic,
        Player Player,
        IReadOnlyList<CardModel> BaselineDeck);

    internal readonly record struct Scope(Guid Token)
    {
        public bool IsTracked => Token != Guid.Empty;
    }

    internal static Scope Begin(NewLeaf relic)
    {
        if (relic.Owner is not Player player)
            return default;

        var binding = new NewLeafBinding(
            Guid.NewGuid(),
            relic,
            player,
            player.Deck.Cards.ToArray());
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

    internal static bool TryGetUnique(out NewLeafBinding? binding)
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

[HarmonyPatch(typeof(NewLeaf), nameof(NewLeaf.AfterObtained))]
internal static class NewLeafTransformSourcePatch
{
    private static void Prefix(
        NewLeaf __instance,
        out DeckTransformSourceBinding.Scope __state)
    {
        __state = DeckTransformSourceBinding.Begin(__instance);
    }

    private static void Postfix(
        ref Task __result,
        DeckTransformSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = DeckTransformSourceBinding.Complete(__result, __state);
    }
}

internal static class DeckTransformCompletionWitness
{
    internal static bool IsSatisfied<T>(
        bool sourceSettled,
        bool selectorClosed,
        IReadOnlyCollection<T> baselineDeck,
        IReadOnlyCollection<T> currentDeck,
        IReadOnlyCollection<T> selectedCards) where T : class =>
        sourceSettled
        && selectorClosed
        && selectedCards.Count > 0
        && selectedCards.All(selected => baselineDeck.Any(card => ReferenceEquals(card, selected)))
        && selectedCards.All(selected => currentDeck.All(card => !ReferenceEquals(card, selected)))
        && currentDeck.Count == baselineDeck.Count;
}
