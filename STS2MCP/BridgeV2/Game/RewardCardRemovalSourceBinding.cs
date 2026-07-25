using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using HarmonyLib;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Rewards;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Binds the generic deck-removal screen to one exact CardRemovalReward
/// selection task. Forbidden Grimoire creates this reward, but the reward
/// object is the runtime business owner of selection, cancellation, and commit.
/// </summary>
internal static class RewardCardRemovalSourceBinding
{
    private static readonly object Gate = new();
    private static readonly Dictionary<Guid, ActiveBinding> Active = new();

    internal sealed record ActiveBinding(
        Guid Token,
        CardRemovalReward SourceReward,
        Player Player,
        IReadOnlyList<CardModel> BaselineDeck);

    internal readonly record struct Scope(Guid Token)
    {
        public bool IsTracked => Token != Guid.Empty;
    }

    internal static Scope Begin(CardRemovalReward reward)
    {
        if (reward.Player is not Player player)
            return default;

        var binding = new ActiveBinding(
            Guid.NewGuid(),
            reward,
            player,
            player.Deck.Cards.ToArray());
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    internal static async Task<bool> Complete(Task<bool> task, Scope scope)
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

[HarmonyPatch]
internal static class RewardCardRemovalSourcePatch
{
    internal static MethodBase ResolveTargetMethod() =>
        AccessTools.DeclaredMethod(typeof(CardRemovalReward), "OnSelect")
        ?? throw new MissingMethodException(typeof(CardRemovalReward).FullName, "OnSelect");

    private static MethodBase TargetMethod() => ResolveTargetMethod();

    private static void Prefix(
        CardRemovalReward __instance,
        out RewardCardRemovalSourceBinding.Scope __state)
    {
        __state = RewardCardRemovalSourceBinding.Begin(__instance);
    }

    private static void Postfix(
        ref Task<bool> __result,
        RewardCardRemovalSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = RewardCardRemovalSourceBinding.Complete(__result, __state);
    }
}

internal static class RewardCardRemovalCompletionWitness
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
