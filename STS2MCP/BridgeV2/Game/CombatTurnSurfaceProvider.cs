using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal sealed class CombatTurnSurfaceProvider : IBridgeSurfaceProvider
{
    public string Kind => "combat_turn";

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Room;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        NCombatRoom? room = NCombatRoom.Instance;
        NPlayerHand? hand = NPlayerHand.Instance;
        if (runState?.CurrentRoom is not CombatRoom combatRoom
            || !CombatManager.Instance.IsInProgress
            || room == null
            || hand == null
            || !McpMod.IsLiveNode(room)
            || hand.IsInCardSelection)
        {
            return null;
        }

        if (BridgeContextBuilder.BuildCombat(runState, combatRoom, entities) is not CombatBridgeContext context)
            return null;
        Player player = LocalContext.GetMe(runState)
            ?? throw new InvalidOperationException("Local player is unavailable.");
        PlayerCombatState? playerCombat = player.PlayerCombatState;
        if (playerCombat == null)
            return null;

        var actions = new List<BridgeActionDraft>();
        if (context.IsPlayPhase)
        {
            AddCardActions(actions, player, playerCombat, entities);
            AddPotionActions(actions, player, entities);
        }

        bool canEndTurn = context.IsPlayPhase
                          && !hand.InCardPlay
                          && hand.CurrentMode == NPlayerHand.Mode.Play;
        if (canEndTurn)
        {
            actions.Add(new BridgeActionDraft(
                "end_turn",
                "end_turn",
                "commit",
                "End turn",
                "PlayerCmd.EndTurn+NEndTurnButton.CanTurnBeEnded guards",
                () => StartEndTurn(player)));
        }

        var surface = new CombatTurnSurface(
            Kind,
            entities.GetId(room, "room"),
            canEndTurn);
        string readiness = context.IsPlayPhase ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_immediate_combat_turn_including_visible_companions; pile contents available through separate read-only inspection",
            context.IsPlayPhase
                ? "derived_from_same_validator_as_execution"
                : "empty_during_non_player_phase",
            new[]
            {
                "CombatManager.DebugOnlyGetState",
                "LocalContext.GetMe",
                "PlayerCombatState",
                "PlayerCombatState.Pets+MonsterModel.IsHealthBarVisible",
                "CardModel.CanPlay",
                "CombatState.HittableEnemies",
                "NPlayerHand play-phase guards"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            context,
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });

        return new BridgeObservationDraft(
            signature,
            readiness,
            context,
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            actions)
        {
            Diagnostics = new[]
            {
                new BridgeDiagnostic(
                    "bridge.visibility.combat_pile_contents_externalized",
                    "info",
                    "visibility",
                    "none",
                    "unknown",
                    Path: "context.player.draw_discard_exhaust_piles",
                    VisibilityClass: "normal_inspection",
                    RequiredForAction: false,
                    SafeDetail: "Pile counts remain in immediate context; player-inspectable contents use the state-bound inspection contract.")
            }
        };
    }

    private static void AddCardActions(
        ICollection<BridgeActionDraft> actions,
        Player player,
        PlayerCombatState playerCombat,
        BridgeEntityRegistry entities)
    {
        foreach (CardModel card in playerCombat.Hand.Cards)
        {
            if (!card.CanPlay(out UnplayableReason reason, out _) || reason != UnplayableReason.None)
                continue;
            string cardId = entities.GetId(card, "card");
            string cardName = McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry;
            if (card.TargetType == TargetType.AnyEnemy)
            {
                foreach (Creature target in player.Creature.CombatState?.HittableEnemies ?? Array.Empty<Creature>())
                {
                    string targetId = entities.GetId(target, "enemy");
                    string targetName = McpMod.SafeGetText(() => target.Monster?.Title) ?? targetId;
                    actions.Add(new BridgeActionDraft(
                        $"play_card:{cardId}:target:{targetId}",
                        "play_card",
                        "combat",
                        $"Play {cardName} on {targetName}",
                        "CardModel.CanPlay+CombatState.HittableEnemies+CardModel.TryManualPlay",
                        () => StartPlayCard(player, card, target),
                        new[]
                        {
                            new ActionEntityBinding("card", cardId),
                            new ActionEntityBinding("target", targetId)
                        }));
                }
            }
            else
            {
                actions.Add(new BridgeActionDraft(
                    $"play_card:{cardId}",
                    "play_card",
                    "combat",
                    $"Play {cardName}",
                    "CardModel.CanPlay+CardModel.TryManualPlay",
                    () => StartPlayCard(player, card, null),
                    new[] { new ActionEntityBinding("card", cardId) }));
            }
        }
    }

    private static void AddPotionActions(
        ICollection<BridgeActionDraft> actions,
        Player player,
        BridgeEntityRegistry entities)
    {
        for (int slot = 0; slot < player.PotionSlots.Count; slot++)
        {
            PotionModel? potion = player.GetPotionAtSlotIndex(slot);
            if (!CanUsePotion(player, potion))
                continue;
            string potionId = entities.GetId(potion!, "potion");
            string potionName = McpMod.SafeGetText(() => potion!.Title) ?? potion!.Id.Entry;
            int capturedSlot = slot;
            if (potion!.TargetType == TargetType.AnyEnemy)
            {
                foreach (Creature target in (player.Creature.CombatState?.HittableEnemies ?? Array.Empty<Creature>()).Where(potion.IsValidTarget))
                {
                    string targetId = entities.GetId(target, "enemy");
                    string targetName = McpMod.SafeGetText(() => target.Monster?.Title) ?? targetId;
                    actions.Add(new BridgeActionDraft(
                        $"use_potion:{potionId}:target:{targetId}",
                        "use_potion",
                        "combat",
                        $"Use {potionName} on {targetName}",
                        "PotionModel.PassesCustomUsabilityCheck+CombatState.HittableEnemies",
                        () => StartUsePotion(player, potion, capturedSlot, target),
                        new[]
                        {
                            new ActionEntityBinding("potion", potionId),
                            new ActionEntityBinding("target", targetId)
                        }));
                }
            }
            else
            {
                Creature? target = potion.TargetType switch
                {
                    TargetType.Self or TargetType.AnyPlayer => player.Creature,
                    TargetType.AnyAlly => player.Creature.CombatState?.PlayerCreatures.FirstOrDefault(potion.IsValidTarget),
                    _ => null
                };
                if (!potion.IsValidTarget(target))
                    continue;
                actions.Add(new BridgeActionDraft(
                    $"use_potion:{potionId}",
                    "use_potion",
                    "combat",
                    $"Use {potionName}",
                    "PotionModel.PassesCustomUsabilityCheck",
                    () => StartUsePotion(player, potion, capturedSlot, target),
                    new[] { new ActionEntityBinding("potion", potionId) }));
            }
        }
    }

    private static BridgeActionStartResult StartPlayCard(
        Player expectedPlayer,
        CardModel expectedCard,
        Creature? expectedTarget)
    {
        if (!IsActionablePlayerTurn(expectedPlayer))
            return BridgeActionStartResult.Rejected("combat_phase_changed", "Combat is no longer in the local player's play phase.");
        PlayerCombatState combat = expectedPlayer.PlayerCombatState!;
        if (!combat.Hand.Cards.Contains(expectedCard))
            return BridgeActionStartResult.Rejected("card_left_hand", "The advertised card is no longer in hand.");
        if (!expectedCard.CanPlay(out UnplayableReason reason, out _) || reason != UnplayableReason.None)
            return BridgeActionStartResult.Rejected("card_no_longer_playable", $"The card is no longer playable: {reason}.");
        if (expectedCard.TargetType == TargetType.AnyEnemy)
        {
            if (expectedTarget == null
                || expectedPlayer.Creature.CombatState?.HittableEnemies.Contains(expectedTarget) != true)
            {
                return BridgeActionStartResult.Rejected("target_no_longer_legal", "The advertised enemy target is no longer hittable.");
            }
        }

        if (!expectedCard.TryManualPlay(expectedTarget))
            return BridgeActionStartResult.Rejected("card_target_no_longer_valid", "The card no longer accepts the advertised target.");
        return BridgeActionStartResult.Started(
            () => !CombatManager.Instance.IsInProgress
                  || expectedPlayer.PlayerCombatState?.Hand.Cards.Contains(expectedCard) != true
                  || NPlayerHand.Instance?.IsInCardSelection == true
                  || NOverlayStack.Instance?.Peek() != null,
            "card_left_hand_or_required_subsurface_opened");
    }

    private static BridgeActionStartResult StartUsePotion(
        Player expectedPlayer,
        PotionModel expectedPotion,
        int expectedSlot,
        Creature? expectedTarget)
    {
        if (!IsActionablePlayerTurn(expectedPlayer) || !CanUsePotion(expectedPlayer, expectedPotion))
            return BridgeActionStartResult.Rejected("potion_no_longer_usable", "The potion is no longer usable in the current phase.");
        if (!ReferenceEquals(expectedPlayer.GetPotionAtSlotIndex(expectedSlot), expectedPotion))
            return BridgeActionStartResult.Rejected("potion_slot_changed", "The advertised potion is no longer in the same slot.");
        if (!expectedPotion.IsValidTarget(expectedTarget)
            || (expectedPotion.TargetType == TargetType.AnyEnemy
                && expectedPlayer.Creature.CombatState?.HittableEnemies.Contains(expectedTarget!) != true))
        {
            return BridgeActionStartResult.Rejected("target_no_longer_legal", "The advertised potion target is no longer hittable.");
        }

        expectedPotion.EnqueueManualUse(expectedTarget);
        return BridgeActionStartResult.Started(
            () => !CombatManager.Instance.IsInProgress
                  || !ReferenceEquals(expectedPlayer.GetPotionAtSlotIndex(expectedSlot), expectedPotion),
            "potion_consumed_or_combat_ended");
    }

    private static BridgeActionStartResult StartEndTurn(Player expectedPlayer)
    {
        if (!IsActionablePlayerTurn(expectedPlayer))
            return BridgeActionStartResult.Rejected("combat_phase_changed", "Combat is no longer in the local player's play phase.");
        NPlayerHand? hand = NPlayerHand.Instance;
        if (hand == null || hand.InCardPlay || hand.CurrentMode != NPlayerHand.Mode.Play)
            return BridgeActionStartResult.Rejected("end_turn_not_available", "The hand UI no longer permits ending the turn.");

        PlayerCmd.EndTurn(expectedPlayer, canBackOut: false);
        return BridgeActionStartResult.Started(
            () => !CombatManager.Instance.IsInProgress || !IsActionablePlayerTurn(expectedPlayer),
            "player_play_phase_ended");
    }

    private static bool CanUsePotion(Player player, PotionModel? potion) =>
        potion != null
        && IsActionablePlayerTurn(player)
        && potion.Usage != PotionUsage.Automatic
        && !potion.IsQueued
        && !potion.Owner.Creature.IsDead
        && potion.PassesCustomUsabilityCheck;

    private static bool IsActionablePlayerTurn(Player player) =>
        CombatManager.Instance.IsInProgress
        && !CombatManager.Instance.PlayerActionsDisabled
        && player.PlayerCombatState?.Phase == PlayerTurnPhase.Play
        && CombatManager.Instance.IsPartOfPlayerTurn(player);
}
