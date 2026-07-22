using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using HarmonyLib;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.Models.Events;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Binds the generic deck selector to the exact Wood Carvings branch that
/// opened it. The selector prompt and screen type cannot distinguish Bird
/// from Torus, so neither may receive authority without this task-local fact.
/// </summary>
internal static class WoodCarvingsReplacementSourceBinding
{
    private static readonly object Gate = new();
    private static readonly Dictionary<Guid, ActiveBinding> Active = new();

    internal sealed record ActiveBinding(
        Guid Token,
        WoodCarvings Event,
        Player Player,
        string Branch,
        Type ReplacementType,
        string ReplacementDefinitionId,
        IReadOnlyList<CardModel> BaselineDeck);

    internal readonly record struct Scope(Guid Token)
    {
        public bool IsTracked => Token != Guid.Empty;
    }

    internal static Scope Begin(WoodCarvings source, MethodBase method)
    {
        if (source.Owner is not Player player)
            return default;

        (string Branch, Type ReplacementType, string ReplacementId)? semantics = method.Name switch
        {
            "Bird" => ("bird", typeof(Peck), ModelDb.Card<Peck>().Id.Entry),
            "Torus" => ("torus", typeof(ToricToughness), ModelDb.Card<ToricToughness>().Id.Entry),
            _ => null
        };
        if (semantics == null)
            return default;

        Guid token = Guid.NewGuid();
        var binding = new ActiveBinding(
            token,
            source,
            player,
            semantics.Value.Branch,
            semantics.Value.ReplacementType,
            semantics.Value.ReplacementId,
            player.Deck.Cards.ToArray());
        lock (Gate)
            Active.Add(token, binding);
        return new Scope(token);
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

[HarmonyPatch]
internal static class WoodCarvingsReplacementSourcePatch
{
    private static IEnumerable<MethodBase> TargetMethods()
    {
        MethodInfo? bird = AccessTools.DeclaredMethod(typeof(WoodCarvings), "Bird");
        MethodInfo? torus = AccessTools.DeclaredMethod(typeof(WoodCarvings), "Torus");
        if (bird != null)
            yield return bird;
        if (torus != null)
            yield return torus;
    }

    private static void Prefix(
        WoodCarvings __instance,
        MethodBase __originalMethod,
        out WoodCarvingsReplacementSourceBinding.Scope __state)
    {
        __state = WoodCarvingsReplacementSourceBinding.Begin(__instance, __originalMethod);
    }

    private static void Postfix(
        ref Task __result,
        WoodCarvingsReplacementSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = WoodCarvingsReplacementSourceBinding.Complete(__result, __state);
    }
}

internal static class DeterministicDeckReplacementWitness
{
    internal static bool IsSatisfied<T>(
        bool sourceCompleted,
        bool selectorClosed,
        IReadOnlyCollection<T> baselineDeck,
        IReadOnlyCollection<T> currentDeck,
        T selectedCard,
        Func<T, bool> isExpectedReplacement) where T : class =>
        sourceCompleted
        && selectorClosed
        && baselineDeck.Any(card => ReferenceEquals(card, selectedCard))
        && currentDeck.All(card => !ReferenceEquals(card, selectedCard))
        && currentDeck.Count == baselineDeck.Count
        && currentDeck.Count(isExpectedReplacement) == baselineDeck.Count(isExpectedReplacement) + 1;
}
