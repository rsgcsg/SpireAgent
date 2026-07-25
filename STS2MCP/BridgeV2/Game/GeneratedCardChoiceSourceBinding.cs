using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HarmonyLib;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.Models.Monsters;
using MegaCrit.Sts2.Core.Models.Potions;
using MegaCrit.Sts2.Core.Models.Powers;
using MegaCrit.Sts2.Core.Models.Relics;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Records an exact game-owned source while a known relic acquisition task is
/// awaiting its generated-card choice. This is evidence only: it never grants
/// authority by itself, and ambiguous concurrent bindings fail closed.
/// </summary>
internal static class GeneratedCardChoiceSourceBinding
{
    private const string ColorlessPotionSourceKind = "colorless_potion";
    private const string AttackPotionSourceKind = "attack_potion";
    private const string SkillPotionSourceKind = "skill_potion";
    private const string PowerPotionSourceKind = "power_potion";
    private const string SplashSourceKind = "splash";
    private const string QuasarSourceKind = "quasar";
    private const string KnowledgeDemonCurseSourceKind = "knowledge_demon_curse";
    private static readonly object Gate = new();
    private static readonly Dictionary<Guid, ActiveBinding> Active = new();

    internal static IReadOnlyList<string> SupportedCombatPotionSourceKinds { get; } =
        new[]
        {
            ColorlessPotionSourceKind,
            AttackPotionSourceKind,
            SkillPotionSourceKind,
            PowerPotionSourceKind
        };

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

    internal sealed record GeneratedCombatPotionBinding(
        Guid Token,
        Player Player,
        PotionModel SourcePotion,
        string ExactSourceKind,
        IReadOnlyList<CardModel> BaselineHand,
        IReadOnlyList<CardModel> BaselineDiscard)
        : ActiveBinding(Token, ExactSourceKind, Player);

    internal sealed record SplashBinding(
        Guid Token,
        Player Player,
        Splash SourceCard,
        IReadOnlyList<CardModel> BaselineHand,
        IReadOnlyList<CardModel> BaselineDiscard)
        : ActiveBinding(Token, SplashSourceKind, Player);

    internal sealed record QuasarBinding(
        Guid Token,
        Player Player,
        Quasar SourceCard,
        IReadOnlyList<CardModel> BaselineHand,
        IReadOnlyList<CardModel> BaselineDiscard)
        : ActiveBinding(Token, QuasarSourceKind, Player);

    internal sealed record KnowledgeDemonCurseBinding(
        Guid Token,
        Player Player,
        KnowledgeDemon SourceMonster,
        IReadOnlyDictionary<Type, int> BaselinePowerAmounts)
        : ActiveBinding(Token, KnowledgeDemonCurseSourceKind, Player);

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
        string? sourceKind = CombatPotionSourceKind(potion.GetType());
        if (sourceKind == null
            || target?.Player is not Player player
            || player.PlayerCombatState is not { } combat)
        {
            return default;
        }

        var binding = new GeneratedCombatPotionBinding(
            Guid.NewGuid(),
            player,
            potion,
            sourceKind,
            combat.Hand.Cards.ToArray(),
            combat.DiscardPile.Cards.ToArray());
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    internal static Scope BeginCard(CardModel card)
    {
        if (card.Owner is not Player player
            || player.PlayerCombatState is not { } combat)
        {
            return default;
        }

        Guid token = Guid.NewGuid();
        ActiveBinding? binding = card switch
        {
            Splash splash when card.GetType() == typeof(Splash) => new SplashBinding(
                token,
                player,
                splash,
                combat.Hand.Cards.ToArray(),
                combat.DiscardPile.Cards.ToArray()),
            Quasar quasar when card.GetType() == typeof(Quasar) => new QuasarBinding(
                token,
                player,
                quasar,
                combat.Hand.Cards.ToArray(),
                combat.DiscardPile.Cards.ToArray()),
            _ => null
        };
        if (binding == null)
            return default;

        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    internal static Scope BeginKnowledgeDemonCurse(KnowledgeDemon source, Creature target)
    {
        if (target.Player is not Player player
            || player.PlayerCombatState == null
            || !ReferenceEquals(source.CombatState, target.CombatState))
        {
            return default;
        }

        var binding = new KnowledgeDemonCurseBinding(
            Guid.NewGuid(),
            player,
            source,
            new Dictionary<Type, int>
            {
                [typeof(DisintegrationPower)] = PowerAmount<DisintegrationPower>(player),
                [typeof(MindRotPower)] = PowerAmount<MindRotPower>(player),
                [typeof(SlothPower)] = PowerAmount<SlothPower>(player),
                [typeof(WasteAwayPower)] = PowerAmount<WasteAwayPower>(player)
            });
        lock (Gate)
            Active.Add(binding.Token, binding);
        return new Scope(binding.Token);
    }

    /// <summary>
    /// Exact source whitelist for the four native combat potions whose v0.109
    /// OnUse methods share the same choose-one, free-this-turn, hand-or-discard
    /// business outcome. Type equality is deliberate: unknown or Mod-derived
    /// potion behavior must not inherit this authority.
    /// </summary>
    internal static string? CombatPotionSourceKind(Type potionType)
    {
        if (potionType == typeof(ColorlessPotion))
            return ColorlessPotionSourceKind;
        if (potionType == typeof(AttackPotion))
            return AttackPotionSourceKind;
        if (potionType == typeof(SkillPotion))
            return SkillPotionSourceKind;
        if (potionType == typeof(PowerPotion))
            return PowerPotionSourceKind;
        return null;
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

    internal static int CurrentChosenPowerAmount(
        KnowledgeDemonCurseBinding binding,
        CardModel chosenCard) => chosenCard switch
    {
        Disintegration => PowerAmount<DisintegrationPower>(binding.Player),
        MindRot => PowerAmount<MindRotPower>(binding.Player),
        Sloth => PowerAmount<SlothPower>(binding.Player),
        WasteAway => PowerAmount<WasteAwayPower>(binding.Player),
        _ => -1
    };

    internal static int BaselineChosenPowerAmount(
        KnowledgeDemonCurseBinding binding,
        CardModel chosenCard)
    {
        Type? powerType = chosenCard switch
        {
            Disintegration => typeof(DisintegrationPower),
            MindRot => typeof(MindRotPower),
            Sloth => typeof(SlothPower),
            WasteAway => typeof(WasteAwayPower),
            _ => null
        };
        return powerType != null && binding.BaselinePowerAmounts.TryGetValue(powerType, out int amount)
            ? amount
            : -1;
    }

    private static int PowerAmount<T>(Player player) where T : PowerModel =>
        player.Creature.Powers.OfType<T>().Sum(power => power.Amount);
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
internal static class GeneratedCardChoiceCardPlayPatch
{
    private static void Prefix(
        CardModel __instance,
        out GeneratedCardChoiceSourceBinding.Scope __state)
    {
        __state = GeneratedCardChoiceSourceBinding.BeginCard(__instance);
    }

    private static void Postfix(
        ref Task __result,
        GeneratedCardChoiceSourceBinding.Scope __state)
    {
        if (__state.IsTracked)
            __result = GeneratedCardChoiceSourceBinding.Complete(__result, __state);
    }
}

/// <summary>
/// Knowledge Demon's forced choice uses the same generated-card screen but
/// commits an immediate debuff instead of adding a card to a pile.
/// </summary>
[HarmonyPatch]
internal static class GeneratedCardChoiceKnowledgeDemonPatch
{
    internal static System.Reflection.MethodBase ResolveTargetMethod() =>
        AccessTools.DeclaredMethod(
            typeof(KnowledgeDemon),
            "ChooseCurse",
            new[] { typeof(Creature) })
        ?? throw new MissingMethodException(typeof(KnowledgeDemon).FullName, "ChooseCurse");

    private static System.Reflection.MethodBase TargetMethod() => ResolveTargetMethod();

    private static void Prefix(
        KnowledgeDemon __instance,
        Creature target,
        out GeneratedCardChoiceSourceBinding.Scope __state)
    {
        __state = GeneratedCardChoiceSourceBinding.BeginKnowledgeDemonCurse(__instance, target);
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
        bool hasFreeThisTurnCostModifier,
        bool requiresFreeThisTurn = true) where T : class =>
        sourceCompleted
        && surfaceClosed
        && !ContainsReference(baselineHand, selectedCard)
        && !ContainsReference(baselineDiscard, selectedCard)
        && (ContainsReference(currentHand, selectedCard) || ContainsReference(currentDiscard, selectedCard))
        && currentHand.Count + currentDiscard.Count == baselineHand.Count + baselineDiscard.Count + 1
        && hasFreeThisTurnCostModifier == requiresFreeThisTurn;

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
