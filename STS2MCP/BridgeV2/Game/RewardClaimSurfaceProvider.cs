using System;
using System.Collections.Generic;
using System.Linq;
using Godot;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.GameActions;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Rewards;
using MegaCrit.Sts2.Core.Nodes.Screens;
using MegaCrit.Sts2.Core.Nodes.Screens.Map;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rewards;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Owns the outer rewards screen only. A card reward claim completes when the
/// UI changes to its separate card-selection surface; it is never flattened
/// into a generic reward index.
/// </summary>
internal sealed class RewardClaimSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "reward_claim";

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NRewardsScreen screen)
            return null;
        return Build(screen, entities, game);
    }

    private static BridgeObservationDraft Build(
        NRewardsScreen screen,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        NRewardButton[] buttons = McpMod.FindAll<NRewardButton>(screen)
            .Where(button => McpMod.IsNodeVisible(button) && button.Reward != null)
            .OrderBy(button => button.Position.Y)
            .ThenBy(button => button.Position.X)
            .ToArray();
        NLinkedRewardSet[] linkedSets = McpMod.FindAll<NLinkedRewardSet>(screen)
            .Where(McpMod.IsNodeVisible)
            .ToArray();
        NProceedButton? proceedButton = McpMod.FindFirst<NProceedButton>(screen);
        Player? player = RunManager.Instance.DebugOnlyGetState() is { } runState
            ? LocalContext.GetMe(runState)
            : null;

        // Linked reward sets have their own UI protocol. Never omit them and
        // claim that the remaining ordinary buttons form a complete surface.
        if (linkedSets.Length > 0 || proceedButton == null || player == null)
        {
            return BindingUnavailable(
                game,
                linkedSets.Length > 0
                    ? "A visible linked reward set needs its own selection contract."
                    : proceedButton == null
                        ? "The visible rewards screen has no exact proceed-button binding."
                        : "The local player is unavailable while rewards are visible.",
                linkedSets.Length > 0
                    ? new[] { "surface.linked_reward_set", "legal_actions" }
                    : proceedButton == null
                        ? new[] { "surface.proceed_button", "legal_actions" }
                        : new[] { "local_player", "legal_actions" });
        }

        Player exactPlayer = player;
        IReadOnlyList<(int Slot, PotionModel Potion)> occupiedPotions = OccupiedPotions(exactPlayer);
        bool potionSlotsFull = ArePotionSlotsFull(exactPlayer, occupiedPotions.Count);
        bool hasPotionReward = buttons.Any(button => button.Reward is PotionReward);
        VisibleReward[] rewards = buttons.Select(button =>
            BuildReward(button, entities, !IsBlockedPotionReward(button.Reward!, potionSlotsFull))).ToArray();
        VisibleCombatPotion[] discardablePotions = hasPotionReward && potionSlotsFull
            ? occupiedPotions.Select(entry => BuildDiscardablePotion(entry.Slot, entry.Potion, entities)).ToArray()
            : Array.Empty<VisibleCombatPotion>();
        var actions = new List<BridgeActionDraft>();
        foreach (NRewardButton button in buttons.Where(button =>
                     button.IsEnabled && !IsBlockedPotionReward(button.Reward!, potionSlotsFull)))
        {
            Reward reward = button.Reward!;
            VisibleReward visible = rewards.Single(candidate => candidate.EntityId == entities.GetId(button, "reward"));
            actions.Add(new BridgeActionDraft(
                $"claim_reward:{visible.EntityId}",
                "claim_reward",
                "claim",
                $"Claim {visible.Label}",
                "NRewardButton.Reward+NRewardButton.ForceClick",
                () => StartClaim(screen, exactPlayer, button, reward, buttons),
                new[] { new ActionEntityBinding("reward", visible.EntityId) }));
        }
        if (hasPotionReward && potionSlotsFull && exactPlayer.CanUseOrRemovePotions)
        {
            foreach ((int slot, PotionModel potion) in occupiedPotions)
            {
                string potionId = entities.GetId(potion, "potion");
                string potionName = McpMod.SafeGetText(() => potion.Title) ?? potion.Id.Entry;
                actions.Add(new BridgeActionDraft(
                    $"discard_potion_for_reward:{potionId}:{slot}",
                    "discard_potion_for_reward",
                    "capacity",
                    $"Discard {potionName} from slot {slot + 1} to make room",
                    "NPotionPopup.OnDiscardButtonPressed+DiscardPotionGameAction",
                    () => StartDiscardPotion(screen, exactPlayer, potion, slot),
                    new[] { new ActionEntityBinding("potion", potionId) }));
            }
        }
        if (proceedButton.IsEnabled)
        {
            bool skips = proceedButton.IsSkip;
            actions.Add(new BridgeActionDraft(
                $"proceed_rewards:{entities.GetId(proceedButton, "proceed_button")}",
                "proceed_rewards",
                "navigation",
                skips ? "Skip remaining rewards and continue" : "Continue from rewards",
                "NRewardsScreen.ProceedButton+NProceedButton.ForceClick",
                () => StartProceed(screen, proceedButton, buttons)));
        }

        bool hasVisibleControls = buttons.Length > 0 || proceedButton.IsEnabled;
        string readiness = actions.Count > 0 ? "ready" : hasVisibleControls ? "settling" : "degraded";
        var missing = hasVisibleControls ? Array.Empty<string>() : new[] { "surface.rewards_or_enabled_proceed" };
        var surface = new RewardClaimSurface(
            SurfaceKind,
            entities.GetId(screen, "screen"),
            rewards,
            potionSlotsFull,
            discardablePotions,
            proceedButton.IsEnabled,
            proceedButton.IsSkip);
        var completeness = new StateCompleteness(
            hasVisibleControls ? "contract_complete_for_reward_claim" : "partial",
            actions.Count > 0
                ? "derived_from_same_current_ui_controls_as_execution"
                : "temporarily_empty_while_ui_settles",
            new[]
            {
                "NRewardsScreen._rewardButtons rendered as NRewardButton",
                "NRewardButton.Reward",
                "NRewardButton.Reward.Description",
                "PotionReward.OnSelect+PotionProcureFailureReason.TooFull",
                "NPotionPopup.OnDiscardButtonPressed+DiscardPotionGameAction",
                "NRewardsScreen.ProceedButton"
            },
            missing);
        string signature = BridgeHash.Object(new
        {
            game.Version,
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            new RewardFlowBridgeContext("reward_flow", "room_rewards"),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            actions);
    }

    private static VisibleReward BuildReward(
        NRewardButton button,
        BridgeEntityRegistry entities,
        bool claimable)
    {
        Reward reward = button.Reward!;
        string description = McpMod.SafeGetText(() => reward.Description) ?? reward.GetType().Name;
        return new VisibleReward(
            entities.GetId(button, "reward"),
            RewardKind(reward),
            description,
            description,
            button.IsEnabled && claimable);
    }

    private static VisibleCombatPotion BuildDiscardablePotion(
        int slot,
        PotionModel potion,
        BridgeEntityRegistry entities) =>
        new(
            entities.GetId(potion, "potion"),
            potion.Id.Entry,
            McpMod.SafeGetText(() => potion.Title),
            McpMod.SafeGetText(() => potion.DynamicDescription),
            slot,
            potion.TargetType.ToString(),
            CanUse: false,
            Automatic: potion.Usage == PotionUsage.Automatic);

    private static IReadOnlyList<(int Slot, PotionModel Potion)> OccupiedPotions(Player player)
    {
        var result = new List<(int, PotionModel)>();
        for (int slot = 0; slot < player.PotionSlots.Count; slot++)
        {
            PotionModel? potion = player.GetPotionAtSlotIndex(slot);
            if (potion != null)
                result.Add((slot, potion));
        }
        return result;
    }

    private static bool IsBlockedPotionReward(Reward reward, bool potionSlotsFull) =>
        reward is PotionReward && potionSlotsFull;

    private static bool ArePotionSlotsFull(Player player, int? occupiedCount = null) =>
        (occupiedCount ?? OccupiedPotions(player).Count) >= player.PotionSlots.Count;

    private static BridgeActionStartResult StartClaim(
        NRewardsScreen expectedScreen,
        Player expectedPlayer,
        NRewardButton expectedButton,
        Reward expectedReward,
        IReadOnlyList<NRewardButton> previousButtons)
    {
        if (!IsCurrent(expectedScreen)
            || !McpMod.FindAll<NRewardButton>(expectedScreen).Any(button => ReferenceEquals(button, expectedButton))
            || !ReferenceEquals(expectedButton.Reward, expectedReward)
            || !McpMod.IsNodeVisible(expectedButton)
            || !expectedButton.IsEnabled
            || IsBlockedPotionReward(expectedReward, ArePotionSlotsFull(expectedPlayer)))
        {
            return BridgeActionStartResult.Rejected(
                "reward_claim_changed",
                "The advertised reward is no longer claimable.");
        }

        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  || !ReferenceEquals(NOverlayStack.Instance?.Peek(), expectedScreen)
                  || RewardSetChanged(expectedScreen, previousButtons),
            "reward_claimed_or_reward_surface_replaced");
    }

    private static BridgeActionStartResult StartProceed(
        NRewardsScreen expectedScreen,
        NProceedButton expectedButton,
        IReadOnlyList<NRewardButton> previousButtons)
    {
        if (!IsCurrent(expectedScreen)
            || McpMod.FindFirst<NProceedButton>(expectedScreen) is not { } currentButton
            || !ReferenceEquals(currentButton, expectedButton)
            || !McpMod.IsNodeVisible(expectedButton)
            || !expectedButton.IsEnabled)
        {
            return BridgeActionStartResult.Rejected(
                "reward_proceed_changed",
                "The advertised rewards proceed control is no longer enabled.");
        }

        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  || RewardSetChanged(expectedScreen, previousButtons)
                  || IsVisibleMapAfterRewards(),
            "rewards_proceeded_or_visible_map_opened_or_reward_surface_replaced");
    }

    private static BridgeActionStartResult StartDiscardPotion(
        NRewardsScreen expectedScreen,
        Player expectedPlayer,
        PotionModel expectedPotion,
        int expectedSlot)
    {
        if (!IsCurrent(expectedScreen)
            || !expectedPlayer.CanUseOrRemovePotions
            || !ArePotionSlotsFull(expectedPlayer)
            || !ReferenceEquals(expectedPlayer.GetPotionAtSlotIndex(expectedSlot), expectedPotion)
            || !McpMod.FindAll<NRewardButton>(expectedScreen).Any(button =>
                McpMod.IsNodeVisible(button) && button.Reward is PotionReward))
        {
            return BridgeActionStartResult.Rejected(
                "potion_capacity_changed",
                "The advertised potion slot or full-potion reward state changed before execution.");
        }

        var action = new DiscardPotionGameAction(
            expectedPlayer,
            (uint)expectedSlot,
            CombatManager.Instance.IsInProgress);
        RunManager.Instance.ActionQueueSynchronizer.RequestEnqueue(action);
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen)
                  || !ReferenceEquals(expectedPlayer.GetPotionAtSlotIndex(expectedSlot), expectedPotion),
            "potion_slot_cleared_or_reward_surface_replaced");
    }

    private static bool RewardSetChanged(NRewardsScreen screen, IReadOnlyList<NRewardButton> previousButtons)
    {
        NRewardButton[] currentButtons = McpMod.FindAll<NRewardButton>(screen)
            .Where(button => McpMod.IsNodeVisible(button) && button.Reward != null)
            .ToArray();
        return currentButtons.Length != previousButtons.Count
               || currentButtons.Where((button, index) => !ReferenceEquals(button, previousButtons[index])).Any();
    }

    private static bool IsCurrent(NRewardsScreen screen) =>
        ActiveSurfaceResolver.IsVisibleActiveOverlay(screen)
        && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    // An ordinary terminal reward can expose the map before the old overlay
    // leaves the stack. Map visibility is player-visible completion evidence,
    // unlike a merely disabled Proceed button or a hidden first-time tutorial.
    private static bool IsVisibleMapAfterRewards()
    {
        NMapScreen? map = NMapScreen.Instance;
        return map != null && (map.IsOpen || McpMod.IsNodeVisible(map));
    }

    private static string RewardKind(Reward reward) => reward switch
    {
        GoldReward => "gold",
        PotionReward => "potion",
        RelicReward => "relic",
        CardReward => "card",
        _ => "other_visible_reward"
    };

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        string reason,
        IReadOnlyList<string> missing)
        => BridgeFailClosedObservation.BindingUnavailable(
            game,
            new RewardFlowBridgeContext("reward_flow", "room_rewards"),
            nameof(NRewardsScreen),
            reason,
            new[] { "NRewardsScreen exact-version binding" },
            missing,
            "reward_claim_binding_unavailable",
            "bridge.surface.reward_claim.binding_unavailable",
            "Reward source, controls, or completion semantics are not exact.");
}
