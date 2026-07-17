using System;
using System.Collections.Generic;
using System.Linq;
using Godot;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Merchant;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Events;
using MegaCrit.Sts2.Core.MonsterMoves.MonsterMoveStateMachine;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Events;
using MegaCrit.Sts2.Core.Nodes.GodotExtensions;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeContextBuilder
{
    public static IBridgeContext Build(BridgeEntityRegistry entities)
    {
        try
        {
            RunState? runState = RunManager.Instance.DebugOnlyGetState();
            if (runState?.CurrentRoom is EventRoom eventRoom)
                return BuildEvent(eventRoom);
            if (runState?.CurrentRoom is RestSiteRoom)
                return new RestBridgeContext("rest");
            if (runState?.CurrentRoom is MerchantRoom merchantRoom)
                return BuildShop(merchantRoom, entities);
            if (runState?.CurrentRoom is CombatRoom combatRoom && CombatManager.Instance.IsInProgress)
                return BuildCombat(runState, combatRoom, entities);

            return new UnknownBridgeContext(
                "unknown",
                runState?.CurrentRoom?.GetType().Name ?? "no_active_run_context",
                "This context has not yet received a player-visible Bridge v2 projection.");
        }
        catch (Exception ex)
        {
            return new UnknownBridgeContext(
                "unknown",
                "context_read_failed",
                $"Context projection failed closed: {ex.GetType().Name}");
        }
    }

    public static EventBridgeContext BuildEvent(EventRoom room)
    {
        EventModel model = room.LocalMutableEvent ?? room.CanonicalEvent;
        NEventRoom? uiRoom = NEventRoom.Instance;
        bool ancient = model is AncientEventModel;
        bool inDialogue = false;
        if (ancient && uiRoom != null)
        {
            NAncientEventLayout? layout = McpMod.FindFirst<NAncientEventLayout>(uiRoom);
            NClickableControl? hitbox = layout?.GetNodeOrNull<NClickableControl>("%DialogueHitbox");
            inDialogue = hitbox is { IsEnabled: true } && McpMod.IsNodeVisible(hitbox);
        }

        return new EventBridgeContext(
            "event",
            model.Id.Entry,
            ReadNodeText(uiRoom, "%Title") ?? McpMod.SafeGetText(() => model.Title),
            ancient,
            inDialogue,
            ReadNodeText(uiRoom, "%EventDescription") ?? McpMod.SafeGetText(() => model.Description));
    }

    public static ShopBridgeContext BuildShop(MerchantRoom room, BridgeEntityRegistry entities)
    {
        MerchantInventory inventory = room.GetLocalInventory()
            ?? throw new InvalidOperationException("Local merchant inventory is unavailable.");
        Player player = inventory.Player
            ?? throw new InvalidOperationException("Local merchant player is unavailable.");
        var potions = new List<VisibleOwnedPotion>();
        for (int slot = 0; slot < player.PotionSlots.Count; slot++)
        {
            PotionModel? potion = player.GetPotionAtSlotIndex(slot);
            if (potion == null)
                continue;
            potions.Add(new VisibleOwnedPotion(
                entities.GetId(potion, "potion"),
                potion.Id.Entry,
                McpMod.SafeGetText(() => potion.Title),
                McpMod.SafeGetText(() => potion.DynamicDescription),
                slot));
        }

        return new ShopBridgeContext(
            "shop",
            player.Gold,
            player.PotionSlots.Count,
            potions);
    }

    public static CombatBridgeContext BuildCombat(
        RunState runState,
        CombatRoom room,
        BridgeEntityRegistry entities)
    {
        CombatState combat = CombatManager.Instance.DebugOnlyGetState()
            ?? throw new InvalidOperationException("Combat state is unavailable.");
        Player player = LocalContext.GetMe(runState)
            ?? throw new InvalidOperationException("Local player is unavailable.");
        PlayerCombatState playerCombat = player.PlayerCombatState
            ?? throw new InvalidOperationException("Player combat state is unavailable.");

        VisibleCombatPlayer visiblePlayer = BuildPlayer(player, playerCombat, entities);
        VisibleEnemy[] enemies = combat.Enemies
            .Where(enemy => enemy.IsAlive)
            .Select(enemy => BuildEnemy(enemy, entities))
            .ToArray();
        bool playPhase = playerCombat.Phase == PlayerTurnPhase.Play
                         && CombatManager.Instance.IsPartOfPlayerTurn(player)
                         && !CombatManager.Instance.PlayerActionsDisabled;

        return new CombatBridgeContext(
            "combat",
            room.RoomType switch
            {
                RoomType.Monster => "normal",
                RoomType.Elite => "elite",
                RoomType.Boss => "boss",
                _ => "unknown"
            },
            combat.RoundNumber,
            combat.CurrentSide.ToString().ToLowerInvariant(),
            playPhase,
            visiblePlayer,
            enemies);
    }

    public static VisibleCard BuildCard(
        CardModel card,
        string entityId,
        bool selected = false,
        bool includeCombatLegality = false,
        PileType displayPile = PileType.Hand)
    {
        string cost = card.EnergyCost.CostsX ? "X" : card.EnergyCost.GetAmountToSpend().ToString();
        string? starCost = card.HasStarCostX
            ? "X"
            : card.CurrentStarCost >= 0 ? card.GetStarCostWithModifiers().ToString() : null;
        string? description;
        try
        {
            description = McpMod.StripRichTextTags(card.GetDescriptionForPile(displayPile)).Replace("\n", " ");
        }
        catch
        {
            description = McpMod.SafeGetText(() => card.Description)?.Replace("\n", " ");
        }

        VisibleEnchantment? existing = card.Enchantment == null
            ? null
            : new VisibleEnchantment(
                card.Enchantment.Id.Entry,
                McpMod.SafeGetText(() => card.Enchantment.Title),
                McpMod.SafeGetText(() => card.Enchantment.DynamicDescription),
                card.Enchantment.Amount,
                "card_hover_semantics");

        bool? canPlay = null;
        string? unplayableReason = null;
        if (includeCombatLegality)
        {
            card.CanPlay(out UnplayableReason reason, out _);
            canPlay = reason == UnplayableReason.None;
            unplayableReason = reason == UnplayableReason.None ? null : reason.ToString();
        }

        return new VisibleCard(
            entityId,
            card.Id.Entry,
            McpMod.SafeGetText(() => card.Title),
            card.Type.ToString(),
            cost,
            starCost,
            description,
            card.Rarity.ToString(),
            card.IsUpgraded,
            selected,
            existing,
            includeCombatLegality ? card.TargetType.ToString() : null,
            canPlay,
            unplayableReason);
    }

    public static IReadOnlyList<VisibleStatus> BuildStatuses(Creature creature)
    {
        var result = new List<VisibleStatus>();
        foreach (PowerModel power in creature.Powers)
        {
            if (!power.IsVisible)
                continue;
            try
            {
                result.Add(new VisibleStatus(
                    power.Id.Entry,
                    McpMod.SafeGetText(() => power.Title),
                    power.DisplayAmount,
                    power.Type.ToString(),
                    McpMod.SafeGetText(() => power.SmartDescription)));
            }
            catch
            {
                // An individual transitioning power is omitted; completeness is
                // evaluated by the owning surface rather than fabricating text.
            }
        }
        return result;
    }

    public static IReadOnlyList<VisibleCombatPotion> BuildPotions(
        Player player,
        BridgeEntityRegistry entities,
        bool playPhase)
    {
        var result = new List<VisibleCombatPotion>();
        for (int slot = 0; slot < player.PotionSlots.Count; slot++)
        {
            PotionModel? potion = player.GetPotionAtSlotIndex(slot);
            if (potion == null)
                continue;
            bool automatic = potion.Usage == PotionUsage.Automatic;
            bool canUse = playPhase
                          && !automatic
                          && !potion.IsQueued
                          && !potion.Owner.Creature.IsDead
                          && potion.PassesCustomUsabilityCheck
                          && HasVisiblePotionTarget(potion, player);
            result.Add(new VisibleCombatPotion(
                entities.GetId(potion, "potion"),
                potion.Id.Entry,
                McpMod.SafeGetText(() => potion.Title),
                McpMod.SafeGetText(() => potion.DynamicDescription),
                slot,
                potion.TargetType.ToString(),
                canUse,
                automatic));
        }
        return result;
    }

    private static bool HasVisiblePotionTarget(PotionModel potion, Player player)
    {
        if (potion.TargetType == TargetType.AnyEnemy)
            return player.Creature.CombatState?.HittableEnemies.Any(potion.IsValidTarget) == true;
        if (potion.TargetType == TargetType.AnyAlly)
            return player.Creature.CombatState?.PlayerCreatures.Any(potion.IsValidTarget) == true;
        Creature? target = potion.TargetType is TargetType.Self or TargetType.AnyPlayer
            ? player.Creature
            : null;
        return potion.IsValidTarget(target);
    }

    private static VisibleCombatPlayer BuildPlayer(
        Player player,
        PlayerCombatState combat,
        BridgeEntityRegistry entities)
    {
        bool playPhase = combat.Phase == PlayerTurnPhase.Play
                         && CombatManager.Instance.IsPartOfPlayerTurn(player)
                         && !CombatManager.Instance.PlayerActionsDisabled;
        VisibleRelic[] relics = player.Relics.Select(relic => new VisibleRelic(
            entities.GetId(relic, "relic"),
            relic.Id.Entry,
            McpMod.SafeGetText(() => relic.Title),
            McpMod.SafeGetText(() => relic.DynamicDescription),
            relic.ShowCounter ? relic.DisplayAmount : null)).ToArray();
        VisibleOrb[] orbs = combat.OrbQueue?.Orbs.Select(orb => new VisibleOrb(
            entities.GetId(orb, "orb"),
            orb.Id.Entry,
            McpMod.SafeGetText(() => orb.Title),
            McpMod.SafeGetText(() => orb.SmartDescription),
            orb.PassiveVal,
            orb.EvokeVal)).ToArray() ?? Array.Empty<VisibleOrb>();

        return new VisibleCombatPlayer(
            entities.GetId(player.Creature, "player"),
            McpMod.SafeGetText(() => player.Character.Title),
            player.Creature.CurrentHp,
            player.Creature.MaxHp,
            player.Creature.Block,
            combat.Energy,
            combat.MaxEnergy,
            player.Character.ShouldAlwaysShowStarCounter || combat.Stars > 0 ? combat.Stars : null,
            player.Gold,
            combat.Hand.Cards.Select(card => BuildCard(card, entities.GetId(card, "card"), includeCombatLegality: true)).ToArray(),
            combat.DrawPile.Cards.Count,
            combat.DiscardPile.Cards.Count,
            combat.ExhaustPile.Cards.Count,
            BuildStatuses(player.Creature),
            relics,
            BuildPotions(player, entities, playPhase),
            player.MaxPotionCount,
            orbs,
            combat.OrbQueue?.Capacity);
    }

    private static VisibleEnemy BuildEnemy(Creature creature, BridgeEntityRegistry entities)
    {
        var intents = new List<VisibleIntent>();
        if (creature.Monster?.NextMove is MoveState move)
        {
            foreach (var intent in move.Intents)
            {
                string? label = null;
                string? title = null;
                string? description = null;
                try
                {
                    var targets = creature.CombatState?.PlayerCreatures;
                    if (targets != null)
                    {
                        label = McpMod.StripRichTextTags(intent.GetIntentLabel(targets, creature).GetFormattedText());
                        var tip = intent.GetHoverTip(targets, creature);
                        title = tip.Title == null ? null : McpMod.StripRichTextTags(tip.Title);
                        description = tip.Description == null ? null : McpMod.StripRichTextTags(tip.Description);
                    }
                }
                catch
                {
                    // Intent type remains visible even if transient localization fails.
                }
                intents.Add(new VisibleIntent(intent.IntentType.ToString(), label, title, description));
            }
        }

        return new VisibleEnemy(
            entities.GetId(creature, "enemy"),
            creature.CombatId,
            creature.Monster?.Id.Entry ?? "unknown",
            McpMod.SafeGetText(() => creature.Monster?.Title),
            creature.CurrentHp,
            creature.MaxHp,
            creature.Block,
            BuildStatuses(creature),
            intents);
    }

    private static string? ReadNodeText(Node? owner, string path)
    {
        try
        {
            Node? node = owner?.GetNodeOrNull(path);
            if (node == null)
                return null;
            Variant text = node.Get("text");
            return text.VariantType == Variant.Type.Nil
                ? null
                : McpMod.StripRichTextTags(text.AsString()).Replace("\n", " ");
        }
        catch
        {
            return null;
        }
    }
}
