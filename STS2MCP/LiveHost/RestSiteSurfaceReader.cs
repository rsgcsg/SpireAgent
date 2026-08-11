using STS2_MCP.NativeUi;
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
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

/// <summary>
/// Exact rest-site room protocol. Choosing an option and proceeding are room
/// actions; any card-selection overlay opened by Smith remains a separate
/// active surface with its own authority and completion contract.
/// </summary>
internal sealed class RestSiteSurfaceReader : ILiveSurfaceReader
{
    internal const string OptionCompletionWitness =
        "rest_option_source_specific_heal_progress_or_smith_upgrade_child_observed";

    private const string SurfaceKind = "rest_site";

    public string Kind => SurfaceKind;

    public InputOwnerLayer Layer => InputOwnerLayer.Room;

    public LiveObservation? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        NativeEntityRegistry entities,
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
        bool hasVisibleOptionCommand = options.Any(option =>
            option.IsEnabled
            && buttonByOption[option].IsEnabled
            && McpMod.IsNodeVisible(buttonByOption[option]));

        NProceedButton proceed = room.ProceedButton;
        bool canProceed = proceed.IsEnabled && McpMod.IsNodeVisible(proceed);
        var surface = new RestSiteSurface(
            SurfaceKind,
            screenId,
            visibleOptions,
            canProceed);
        bool hasCurrentCommand = hasVisibleOptionCommand || canProceed;
        string readiness = hasCurrentCommand ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_visible_rest_site",
            hasCurrentCommand
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
        string signature = StableIdentityHash.Object(new
        {
            game.Version,
            surface,
            commandKeys = visibleOptions
                .Where(option => option.Enabled)
                .Select(option => $"choose_rest_option:{option.EntityId}")
                .Concat(canProceed
                    ? new[] { $"proceed_rest_site:{screenId}" }
                    : Array.Empty<string>())
                .OrderBy(key => key, StringComparer.Ordinal)
                .ToArray()
        });
        return new LiveObservation(
            signature,
            readiness,
            new RestLiveContext("rest"),
            surface,
            completeness,
            game,
            Array.Empty<string>());
    }

    private static NativeInputResult StartOption(
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
            return NativeInputResult.Rejected(
                "rest_option_changed",
                "The advertised rest-site option is no longer current and selectable.");
        }

        int beforeHp = expectedPlayer.Creature.CurrentHp;
        int expectedMinimumHp = beforeHp;
        if (expectedOption is HealRestSiteOption)
        {
            decimal healAmount = HealRestSiteOption.GetHealAmount(expectedPlayer);
            expectedMinimumHp = (int)Math.Min(
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
                expectedMinimumHp),
            SmithRestSiteOption => () => NOverlayStack.Instance?.Peek() is NDeckUpgradeSelectScreen,
            _ => () => false
        };
        return NativeInputResult.Started(
            completion,
            OptionCompletionWitness,
            allowIntermediateStateChanges: true);
    }

    internal static NativeInputResult StartOption(
        NativeEntityRegistry entities,
        string expectedScreenId,
        string expectedOptionId)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (runState?.CurrentRoom is not RestSiteRoom restRoom
            || NRestSiteRoom.Instance is not { } uiRoom
            || !McpMod.IsLiveNode(uiRoom)
            || !string.Equals(
                entities.GetId(uiRoom, "screen"),
                expectedScreenId,
                StringComparison.Ordinal)
            || !entities.TryResolve(expectedOptionId, out RestSiteOption? option)
            || option == null
            || LocalContext.GetMe(runState) is not { } player)
        {
            return NativeInputResult.Rejected(
                "rest_option_changed",
                "The exact rest-site screen or option is no longer current.");
        }

        RestSiteOption[] options = restRoom.Options.ToArray();
        int index = Array.FindIndex(options, candidate => ReferenceEquals(candidate, option));
        NRestSiteButton[] buttons = McpMod.FindAll<NRestSiteButton>(uiRoom)
            .Where(button =>
                McpMod.IsLiveNode(button)
                && ReferenceEquals(button.Option, option))
            .ToArray();
        if (index < 0 || buttons.Length != 1)
        {
            return NativeInputResult.Rejected(
                "rest_option_changed",
                "The exact rest-site option no longer has one current native control.");
        }

        return StartOption(restRoom, uiRoom, player, option, buttons[0], index);
    }

    private static bool IsHealCompleted(
        RestSiteRoom expectedRestRoom,
        NRestSiteRoom expectedUiRoom,
        Player expectedPlayer,
        RestSiteOption expectedOption,
        int expectedMinimumHp)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (!ReferenceEquals(runState?.CurrentRoom, expectedRestRoom)
            || !ReferenceEquals(LocalContext.GetMe(runState), expectedPlayer)
            || !HasReachedExpectedMinimumHp(
                expectedPlayer.Creature.CurrentHp,
                expectedMinimumHp))
        {
            return false;
        }

        bool optionProgressed =
            !ReferenceEquals(NRestSiteRoom.Instance, expectedUiRoom)
            || !expectedRestRoom.Options.Any(option => ReferenceEquals(option, expectedOption))
            || expectedUiRoom.ProceedButton.IsEnabled;
        bool rewardChildOpened =
            NOverlayStack.Instance?.Peek() is NCardRewardSelectionScreen;
        return HasHealCompletionBoundary(
            currentHpReached: true,
            optionProgressed,
            rewardChildOpened);
    }

    internal static bool HasReachedExpectedMinimumHp(
        int currentHp,
        int expectedMinimumHp) => currentHp >= expectedMinimumHp;

    internal static bool HasHealCompletionBoundary(
        bool currentHpReached,
        bool optionProgressed,
        bool rewardChildOpened) =>
        currentHpReached && (optionProgressed || rewardChildOpened);

    private static NativeInputResult StartProceed(
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
            return NativeInputResult.Rejected(
                "rest_proceed_changed",
                "The rest-site proceed control is no longer current and enabled.");
        }

        expectedProceed.ForceClick();
        return NativeInputResult.Started(
            () => !ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedRestRoom)
                  || !ReferenceEquals(NRestSiteRoom.Instance, expectedUiRoom)
                  || NMapScreen.Instance?.IsOpen == true,
            "rest_site_opened_map_or_left_room",
            allowIntermediateStateChanges: true);
    }

    internal static NativeInputResult StartProceed(
        NativeEntityRegistry entities,
        string expectedScreenId)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (runState?.CurrentRoom is not RestSiteRoom restRoom
            || NRestSiteRoom.Instance is not { } uiRoom
            || !McpMod.IsLiveNode(uiRoom)
            || !string.Equals(
                entities.GetId(uiRoom, "screen"),
                expectedScreenId,
                StringComparison.Ordinal))
        {
            return NativeInputResult.Rejected(
                "rest_proceed_changed",
                "The exact rest-site room is no longer current.");
        }

        return StartProceed(restRoom, uiRoom, uiRoom.ProceedButton);
    }

    private static LiveObservation BindingUnavailable(GameBuildIdentity game, string reason)
    {
        var context = new RestLiveContext("rest");
        var surface = new UnsupportedSurface("unsupported", SurfaceKind, reason);
        var completeness = new StateCompleteness(
            "partial",
            "empty_fail_closed",
            new[] { "RestSiteRoom+NRestSiteRoom exact-version binding" },
            new[] { "rest_options", "legal_actions" });
        string signature = StableIdentityHash.Object(new { game.Version, reason });
        return new LiveObservation(
            signature,
            "degraded",
            context,
            surface,
            completeness,
            game,
            new[] { "rest_site_binding_unavailable" })
        {
            Diagnostics = new[]
            {
                GatewayDiagnostics.Create(
                    "gateway.surface.rest_site.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}
