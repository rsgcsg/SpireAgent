using System;
using System.Collections.Generic;
using System.Linq;
using Godot;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Rewards;
using MegaCrit.Sts2.Core.Nodes.Screens;
using MegaCrit.Sts2.Core.Nodes.Screens.Map;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rewards;
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

        // Linked reward sets have their own UI protocol. Never omit them and
        // claim that the remaining ordinary buttons form a complete surface.
        if (linkedSets.Length > 0 || proceedButton == null)
        {
            return BindingUnavailable(
                game,
                linkedSets.Length > 0
                    ? "A visible linked reward set needs its own selection contract."
                    : "The visible rewards screen has no exact proceed-button binding.",
                linkedSets.Length > 0
                    ? new[] { "surface.linked_reward_set", "legal_actions" }
                    : new[] { "surface.proceed_button", "legal_actions" });
        }

        VisibleReward[] rewards = buttons.Select(button => BuildReward(button, entities)).ToArray();
        var actions = new List<BridgeActionDraft>();
        foreach (NRewardButton button in buttons.Where(button => button.IsEnabled))
        {
            Reward reward = button.Reward!;
            VisibleReward visible = rewards.Single(candidate => candidate.EntityId == entities.GetId(button, "reward"));
            actions.Add(new BridgeActionDraft(
                $"claim_reward:{visible.EntityId}",
                "claim_reward",
                "claim",
                $"Claim {visible.Label}",
                "NRewardButton.Reward+NRewardButton.ForceClick",
                () => StartClaim(screen, button, reward, buttons)));
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

    private static VisibleReward BuildReward(NRewardButton button, BridgeEntityRegistry entities)
    {
        Reward reward = button.Reward!;
        string description = McpMod.SafeGetText(() => reward.Description) ?? reward.GetType().Name;
        return new VisibleReward(
            entities.GetId(button, "reward"),
            RewardKind(reward),
            description,
            description,
            button.IsEnabled);
    }

    private static BridgeActionStartResult StartClaim(
        NRewardsScreen expectedScreen,
        NRewardButton expectedButton,
        Reward expectedReward,
        IReadOnlyList<NRewardButton> previousButtons)
    {
        if (!IsCurrent(expectedScreen)
            || !McpMod.FindAll<NRewardButton>(expectedScreen).Any(button => ReferenceEquals(button, expectedButton))
            || !ReferenceEquals(expectedButton.Reward, expectedReward)
            || !McpMod.IsNodeVisible(expectedButton)
            || !expectedButton.IsEnabled)
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
    {
        var unavailable = new UnsupportedSurface(SurfaceKind, nameof(NRewardsScreen), reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            new[] { "NRewardsScreen exact-version binding" },
            missing);
        string signature = BridgeHash.Object(new { game.Version, unavailable, missing });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            new RewardFlowBridgeContext("reward_flow", "room_rewards"),
            unavailable,
            completeness,
            game,
            new[] { "reward_claim_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.reward_claim.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}
