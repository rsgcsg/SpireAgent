using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HarmonyLib;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Relics;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Binds the otherwise generic deck-removal selector to the exact
/// PreciseScissors acquisition task. The screen and prompt alone do not prove
/// why a removal is being requested, so this task-local binding is required
/// before the relic child can own actions.
/// </summary>
internal static class PreciseScissorsRemovalSourceBinding
{
    private static readonly object Gate = new();
    private static readonly Dictionary<Guid, ActiveBinding> Active = new();

    internal sealed record ActiveBinding(
        Guid Token,
        PreciseScissors SourceRelic,
        Player Player,
        IReadOnlyList<CardModel> BaselineDeck);

    internal readonly record struct Scope(Guid Token)
    {
        public bool IsTracked => Token != Guid.Empty;
    }

    internal static Scope Begin(PreciseScissors relic)
    {
        if (relic.Owner is not Player player)
            return default;

        var binding = new ActiveBinding(Guid.NewGuid(), relic, player, player.Deck.Cards.ToArray());
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

[HarmonyPatch(typeof(PreciseScissors), nameof(PreciseScissors.AfterObtained))]
internal static class PreciseScissorsRemovalSourcePatch
{
    private static void Prefix(
        PreciseScissors __instance,
        out PreciseScissorsRemovalSourceBinding.Scope __state)
    {
        __state = PreciseScissorsRemovalSourceBinding.Begin(__instance);
    }

    private static void Postfix(
        ref Task __result,
        PreciseScissorsRemovalSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = PreciseScissorsRemovalSourceBinding.Complete(__result, __state);
    }
}

internal static class PreciseScissorsRemovalCompletionWitness
{
    internal static bool IsSatisfied<T>(
        bool sourceCompleted,
        bool selectorClosed,
        IReadOnlyCollection<T> baselineDeck,
        IReadOnlyCollection<T> currentDeck,
        T selectedCard) where T : class =>
        sourceCompleted
        && selectorClosed
        && baselineDeck.Any(card => ReferenceEquals(card, selectedCard))
        && currentDeck.All(card => !ReferenceEquals(card, selectedCard))
        && currentDeck.Count == baselineDeck.Count - 1;
}
