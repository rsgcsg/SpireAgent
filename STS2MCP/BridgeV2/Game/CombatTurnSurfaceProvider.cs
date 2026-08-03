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
    internal const string PlayCardCompletionWitness =
        "card_transaction_settled_or_required_subsurface_opened";
    internal const string UsePotionCompletionWitness =
        "potion_transaction_settled_or_required_subsurface_opened";
    internal const string EndTurnCompletionWitness =
        "player_play_phase_ended";

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

        var playableCards = new List<VisibleCombatCommandOption>();
        var usablePotions = new List<VisibleCombatCommandOption>();
        if (context.IsPlayPhase)
        {
            AddCardOptions(playableCards, player, playerCombat, entities);
            AddPotionOptions(usablePotions, player, entities);
        }

        bool canEndTurn = context.IsPlayPhase
                          && !hand.InCardPlay
                          && hand.CurrentMode == NPlayerHand.Mode.Play;
        var surface = new CombatTurnSurface(
            Kind,
            entities.GetId(room, "room"),
            canEndTurn)
        {
            PlayableCards = playableCards,
            UsablePotions = usablePotions
        };
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
            surface
        });

        return new BridgeObservationDraft(
            signature,
            readiness,
            context,
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            Array.Empty<BridgeActionDraft>())
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

    private static void AddCardOptions(
        ICollection<VisibleCombatCommandOption> commandOptions,
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
                var targetIds = new List<string>();
                foreach (Creature target in player.Creature.CombatState?.HittableEnemies ?? Array.Empty<Creature>())
                {
                    string targetId = entities.GetId(target, "enemy");
                    targetIds.Add(targetId);
                }
                if (targetIds.Count > 0)
                    commandOptions.Add(new VisibleCombatCommandOption(cardId, cardName, targetIds));
            }
            else
            {
                commandOptions.Add(new VisibleCombatCommandOption(cardId, cardName, Array.Empty<string>()));
            }
        }
    }

    private static void AddPotionOptions(
        ICollection<VisibleCombatCommandOption> commandOptions,
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
            if (potion!.TargetType == TargetType.AnyEnemy)
            {
                var targetIds = new List<string>();
                foreach (Creature target in (player.Creature.CombatState?.HittableEnemies ?? Array.Empty<Creature>()).Where(potion.IsValidTarget))
                {
                    string targetId = entities.GetId(target, "enemy");
                    targetIds.Add(targetId);
                }
                if (targetIds.Count > 0)
                    commandOptions.Add(new VisibleCombatCommandOption(potionId, potionName, targetIds));
            }
            else
            {
                Creature? target = potion.TargetType switch
                {
                    TargetType.Self or TargetType.AnyPlayer => player.Creature,
                    TargetType.AnyAlly => player.Creature.CombatState?.PlayerCreatures.FirstOrDefault(potion.IsValidTarget),
                    _ => null
                };
                if (!IsAdvertisablePotionTarget(potion, target))
                    continue;
                commandOptions.Add(new VisibleCombatCommandOption(
                    potionId,
                    potionName,
                    target == null
                        ? Array.Empty<string>()
                        : new[] { entities.GetId(target, "creature") }));
            }
        }
    }

    internal static bool IsAdvertisablePotionTarget(
        PotionModel potion,
        Creature? target) => potion.IsValidTarget(target);

    internal static BridgeActionStartResult StartDirectPlayCard(
        BridgeEntityRegistry entities,
        string expectedRoomId,
        string expectedCardId,
        string? expectedTargetId)
    {
        if (!TryResolveDirectCombatOwner(entities, expectedRoomId, out Player? player)
            || !entities.TryResolve(expectedCardId, out CardModel? card)
            || card == null)
        {
            return BridgeActionStartResult.Rejected(
                "combat_binding_changed",
                "The exact combat room, player, or hand card is no longer current.");
        }
        Creature? target = null;
        if (expectedTargetId != null
            && (!entities.TryResolve(expectedTargetId, out target) || target == null))
        {
            return BridgeActionStartResult.Rejected(
                "target_no_longer_legal",
                "The exact advertised combat target no longer resolves.");
        }
        return StartPlayCard(player!, card, target);
    }

    internal static BridgeActionStartResult StartDirectUsePotion(
        BridgeEntityRegistry entities,
        string expectedRoomId,
        string expectedPotionId,
        string? expectedTargetId)
    {
        if (!TryResolveDirectCombatOwner(entities, expectedRoomId, out Player? player)
            || !entities.TryResolve(expectedPotionId, out PotionModel? potion)
            || potion == null)
        {
            return BridgeActionStartResult.Rejected(
                "combat_binding_changed",
                "The exact combat room, player, or potion is no longer current.");
        }
        int slot = Enumerable.Range(0, player!.PotionSlots.Count)
            .FirstOrDefault(index => ReferenceEquals(player.GetPotionAtSlotIndex(index), potion), -1);
        if (slot < 0)
        {
            return BridgeActionStartResult.Rejected(
                "potion_slot_changed",
                "The exact advertised potion is no longer in a current slot.");
        }
        Creature? target = null;
        if (expectedTargetId != null
            && (!entities.TryResolve(expectedTargetId, out target) || target == null))
        {
            return BridgeActionStartResult.Rejected(
                "target_no_longer_legal",
                "The exact advertised potion target no longer resolves.");
        }
        return StartUsePotion(player, potion, slot, target);
    }

    internal static BridgeActionStartResult StartDirectEndTurn(
        BridgeEntityRegistry entities,
        string expectedRoomId) =>
        TryResolveDirectCombatOwner(entities, expectedRoomId, out Player? player)
            ? StartEndTurn(player!)
            : BridgeActionStartResult.Rejected(
                "combat_binding_changed",
                "The exact combat room or player is no longer current.");

    private static bool TryResolveDirectCombatOwner(
        BridgeEntityRegistry entities,
        string expectedRoomId,
        out Player? player)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        NCombatRoom? room = NCombatRoom.Instance;
        player = runState == null ? null : LocalContext.GetMe(runState);
        return runState?.CurrentRoom is CombatRoom
               && room != null
               && McpMod.IsLiveNode(room)
               && string.Equals(entities.GetId(room, "room"), expectedRoomId, StringComparison.Ordinal)
               && player != null;
    }

    internal static BridgeActionStartResult StartPlayCard(
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
            () => HasQueuedMutationCompletionBoundary(
                CombatManager.Instance.IsInProgress,
                expectedPlayer.PlayerCombatState?.Hand.Cards.Contains(expectedCard) != true,
                RunManager.Instance.ActionQueueSet.IsEmpty,
                HasRequiredSubsurface()),
            PlayCardCompletionWitness,
            allowIntermediateStateChanges: true);
    }

    internal static BridgeActionStartResult StartUsePotion(
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
            () => HasQueuedMutationCompletionBoundary(
                CombatManager.Instance.IsInProgress,
                !ReferenceEquals(expectedPlayer.GetPotionAtSlotIndex(expectedSlot), expectedPotion),
                RunManager.Instance.ActionQueueSet.IsEmpty,
                HasRequiredSubsurface()),
            UsePotionCompletionWitness,
            allowIntermediateStateChanges: true);
    }

    internal static BridgeActionStartResult StartEndTurn(Player expectedPlayer)
    {
        if (!IsActionablePlayerTurn(expectedPlayer))
            return BridgeActionStartResult.Rejected("combat_phase_changed", "Combat is no longer in the local player's play phase.");
        NPlayerHand? hand = NPlayerHand.Instance;
        if (hand == null || hand.InCardPlay || hand.CurrentMode != NPlayerHand.Mode.Play)
            return BridgeActionStartResult.Rejected("end_turn_not_available", "The hand UI no longer permits ending the turn.");

        PlayerCmd.EndTurn(expectedPlayer, canBackOut: false);
        return BridgeActionStartResult.Started(
            () => !CombatManager.Instance.IsInProgress || !IsActionablePlayerTurn(expectedPlayer),
            EndTurnCompletionWitness,
            allowIntermediateStateChanges: true);
    }

    internal static bool CanUsePotion(Player player, PotionModel? potion) =>
        potion != null
        && IsActionablePlayerTurn(player)
        && potion.Usage != PotionUsage.Automatic
        && !potion.IsQueued
        && !potion.Owner.Creature.IsDead
        && potion.PassesCustomUsabilityCheck;

    internal static bool HasQueuedMutationCompletionBoundary(
        bool combatInProgress,
        bool sourceMutationObserved,
        bool actionQueueEmpty,
        bool requiredSubsurfaceOpened) =>
        !combatInProgress
        || requiredSubsurfaceOpened
        || (sourceMutationObserved && actionQueueEmpty);

    private static bool HasRequiredSubsurface() =>
        NPlayerHand.Instance?.IsInCardSelection == true
        || NOverlayStack.Instance?.Peek() != null;

    internal static bool IsActionablePlayerTurn(Player player) =>
        CombatManager.Instance.IsInProgress
        && !CombatManager.Instance.PlayerActionsDisabled
        && player.PlayerCombatState?.Phase == PlayerTurnPhase.Play
        && CombatManager.Instance.IsPartOfPlayerTurn(player);
}
