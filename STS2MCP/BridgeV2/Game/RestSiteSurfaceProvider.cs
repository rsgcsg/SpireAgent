using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.RestSite;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.RestSite;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Map;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact rest-site room protocol. Choosing an option and proceeding are room
/// actions; any card-selection overlay opened by Smith remains a separate
/// active surface with its own authority and completion contract.
/// </summary>
internal sealed class RestSiteSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "rest_site";

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Room;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        NRestSiteRoom? room = NRestSiteRoom.Instance;
        if (runState?.CurrentRoom is not RestSiteRoom restRoom
            || room == null
            || !McpMod.IsLiveNode(room)
            || CombatManager.Instance.IsInProgress)
        {
            return null;
        }

        RestSiteOption[] options = restRoom.Options.ToArray();
        RestSiteOption? unsupportedEnabledOption = options.FirstOrDefault(option =>
            option.IsEnabled
            && option is not HealRestSiteOption
            && option is not SmithRestSiteOption);
        if (unsupportedEnabledOption != null)
        {
            return BindingUnavailable(
                game,
                $"Enabled rest option {unsupportedEnabledOption.OptionId} has no purpose-specific v0.109 completion witness.");
        }

        Player? localPlayer = LocalContext.GetMe(runState);
        if (localPlayer == null)
            return BindingUnavailable(game, "The local rest-site player is unavailable.");

        NRestSiteButton[] buttons = McpMod.FindAll<NRestSiteButton>(room)
            .Where(McpMod.IsLiveNode)
            .ToArray();
        var buttonByOption = new Dictionary<RestSiteOption, NRestSiteButton>();
        foreach (RestSiteOption option in options)
        {
            NRestSiteButton[] matches = buttons
                .Where(button => ReferenceEquals(button.Option, option))
                .ToArray();
            if (matches.Length != 1)
                return BindingUnavailable(game, $"Rest option {option.OptionId} does not have exactly one live UI button.");
            buttonByOption[option] = matches[0];
        }

        string screenId = entities.GetId(room, "screen");
        VisibleRestOption[] visibleOptions = options.Select((option, index) => new VisibleRestOption(
            entities.GetId(option, "rest_option"),
            index,
            option.OptionId,
            McpMod.SafeGetText(() => option.Title),
            McpMod.SafeGetText(() => option.Description),
            option.IsEnabled)).ToArray();
        var actions = new List<BridgeActionDraft>();
        foreach ((RestSiteOption option, int index) in options.Select((option, index) => (option, index)))
        {
            NRestSiteButton button = buttonByOption[option];
            if (!option.IsEnabled || !button.IsEnabled || !McpMod.IsNodeVisible(button))
                continue;
            string optionId = entities.GetId(option, "rest_option");
            actions.Add(new BridgeActionDraft(
                $"choose_rest_option:{optionId}",
                "choose_rest_option",
                "selection",
                McpMod.SafeGetText(() => option.Title) ?? option.OptionId,
                "RestSiteRoom.Options+NRestSiteButton.ForceClick",
                () => StartOption(restRoom, room, localPlayer, option, button, index),
                new[] { new ActionEntityBinding("rest_option", optionId) }));
        }

        NProceedButton proceed = room.ProceedButton;
        bool canProceed = proceed.IsEnabled && McpMod.IsNodeVisible(proceed);
        if (canProceed)
        {
            actions.Add(new BridgeActionDraft(
                $"proceed_rest_site:{screenId}",
                "proceed_rest_site",
                "navigation",
                "Proceed to map",
                "NRestSiteRoom.ProceedButton+NMapScreen.Open",
                () => StartProceed(restRoom, room, proceed),
                new[] { new ActionEntityBinding("screen", screenId) }));
        }

        var surface = new RestSiteSurface(
            SurfaceKind,
            screenId,
            visibleOptions,
            canProceed);
        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_visible_rest_site",
            actions.Count > 0
                ? "derived_from_exact_option_buttons_and_proceed_control"
                : "temporarily_empty_while_rest_option_or_overlay_transitions",
            new[]
            {
                "RestSiteRoom.Options",
                "NRestSiteRoom live room",
                "NRestSiteButton.Option+IsEnabled",
                "NRestSiteRoom.ProceedButton"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            new RestBridgeContext("rest"),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            actions);
    }

    private static BridgeActionStartResult StartOption(
        RestSiteRoom expectedRestRoom,
        NRestSiteRoom expectedUiRoom,
        Player expectedPlayer,
        RestSiteOption expectedOption,
        NRestSiteButton expectedButton,
        int expectedIndex)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        RestSiteOption[] currentOptions = expectedRestRoom.Options.ToArray();
        if (!ReferenceEquals(runState?.CurrentRoom, expectedRestRoom)
            || !ReferenceEquals(NRestSiteRoom.Instance, expectedUiRoom)
            || !McpMod.IsLiveNode(expectedUiRoom)
            || !ReferenceEquals(LocalContext.GetMe(runState), expectedPlayer)
            || expectedIndex < 0
            || expectedIndex >= currentOptions.Length
            || !ReferenceEquals(currentOptions[expectedIndex], expectedOption)
            || !ReferenceEquals(expectedButton.Option, expectedOption)
            || !expectedOption.IsEnabled
            || !expectedButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedButton))
        {
            return BridgeActionStartResult.Rejected(
                "rest_option_changed",
                "The advertised rest-site option is no longer current and selectable.");
        }

        int beforeHp = expectedPlayer.Creature.CurrentHp;
        int expectedHealHp = beforeHp;
        if (expectedOption is HealRestSiteOption)
        {
            decimal healAmount = HealRestSiteOption.GetHealAmount(expectedPlayer);
            expectedHealHp = (int)Math.Min(
                (decimal)expectedPlayer.Creature.MaxHp,
                (decimal)beforeHp + healAmount);
        }

        expectedButton.ForceClick();
        Func<bool> completion = expectedOption switch
        {
            HealRestSiteOption => () => IsHealCompleted(
                expectedRestRoom,
                expectedUiRoom,
                expectedPlayer,
                expectedOption,
                expectedHealHp),
            SmithRestSiteOption => () => NOverlayStack.Instance?.Peek() is NDeckUpgradeSelectScreen,
            _ => () => false
        };
        string completionEvidence = expectedOption switch
        {
            HealRestSiteOption => "rest_heal_exact_hp_and_option_progress_observed",
            SmithRestSiteOption => "rest_smith_exact_upgrade_child_opened",
            _ => "rest_option_completion_not_implemented"
        };
        return BridgeActionStartResult.Started(
            completion,
            completionEvidence,
            allowIntermediateStateChanges: true);
    }

    private static bool IsHealCompleted(
        RestSiteRoom expectedRestRoom,
        NRestSiteRoom expectedUiRoom,
        Player expectedPlayer,
        RestSiteOption expectedOption,
        int expectedHealHp)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (!ReferenceEquals(runState?.CurrentRoom, expectedRestRoom)
            || !ReferenceEquals(LocalContext.GetMe(runState), expectedPlayer)
            || expectedPlayer.Creature.CurrentHp != expectedHealHp)
        {
            return false;
        }

        return !ReferenceEquals(NRestSiteRoom.Instance, expectedUiRoom)
               || !expectedRestRoom.Options.Any(option => ReferenceEquals(option, expectedOption))
               || expectedUiRoom.ProceedButton.IsEnabled;
    }

    private static BridgeActionStartResult StartProceed(
        RestSiteRoom expectedRestRoom,
        NRestSiteRoom expectedUiRoom,
        NProceedButton expectedProceed)
    {
        if (!ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedRestRoom)
            || !ReferenceEquals(NRestSiteRoom.Instance, expectedUiRoom)
            || !McpMod.IsLiveNode(expectedUiRoom)
            || !expectedProceed.IsEnabled
            || !McpMod.IsNodeVisible(expectedProceed))
        {
            return BridgeActionStartResult.Rejected(
                "rest_proceed_changed",
                "The rest-site proceed control is no longer current and enabled.");
        }

        expectedProceed.ForceClick();
        return BridgeActionStartResult.Started(
            () => !ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedRestRoom)
                  || !ReferenceEquals(NRestSiteRoom.Instance, expectedUiRoom)
                  || NMapScreen.Instance?.IsOpen == true,
            "rest_site_opened_map_or_left_room",
            allowIntermediateStateChanges: true);
    }

    private static BridgeObservationDraft BindingUnavailable(GameBuildIdentity game, string reason)
    {
        var context = new RestBridgeContext("rest");
        var surface = new UnsupportedSurface("unsupported", SurfaceKind, reason);
        var completeness = new StateCompleteness(
            "partial",
            "empty_fail_closed",
            new[] { "RestSiteRoom+NRestSiteRoom exact-version binding" },
            new[] { "rest_options", "legal_actions" });
        string signature = BridgeHash.Object(new { game.Version, reason });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            surface,
            completeness,
            game,
            new[] { "rest_site_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.rest_site.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}
