using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Entities.RestSite;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.RestSite;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;
using STS2_MCP.ConnectorV3.Runtime;

namespace STS2_MCP.HumanEquivalent.Runtime;

/// <summary>
/// Source-free rest-site UI adapter. Human Environment authority comes from
/// the exact visible option buttons, not from business-specific completion
/// witnesses for REST, SMITH, DIG or future options.
/// </summary>
internal static class HumanRestSiteAdapter
{
    internal const string SurfaceKind = "rest_site";

    internal static BridgeObservationDraft? TryBuild(
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        ActiveSurfaceSnapshot active = ActiveSurfaceResolver.Capture();
        if (active.TopOverlay != null || active.MapIsOpen || active.OpenModal != null)
            return null;

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
            {
                return BindingUnavailable(
                    game,
                    $"Rest option {option.OptionId} does not have exactly one live UI button.");
            }
            buttonByOption[option] = matches[0];
        }

        string screenId = entities.GetId(room, "screen");
        VisibleRestOption[] visibleOptions = options.Select((option, index) =>
        {
            NRestSiteButton button = buttonByOption[option];
            return new VisibleRestOption(
                entities.GetId(option, "rest_option"),
                index,
                option.OptionId,
                McpMod.SafeGetText(() => option.Title),
                McpMod.SafeGetText(() => option.Description),
                IsOptionActionable(
                    option.IsEnabled,
                    button.IsEnabled,
                    McpMod.IsNodeVisible(button)));
        }).ToArray();
        NProceedButton proceed = room.ProceedButton;
        bool canProceed = proceed.IsEnabled && McpMod.IsNodeVisible(proceed);
        var surface = new RestSiteSurface(
            SurfaceKind,
            screenId,
            visibleOptions,
            canProceed);
        bool actionable = visibleOptions.Any(option => option.Enabled) || canProceed;
        string readiness = actionable ? "ready" : "settling";
        return new BridgeObservationDraft(
            BridgeHash.Object(new { game.Version, surface, readiness }),
            readiness,
            new RestBridgeContext("rest"),
            surface,
            new StateCompleteness(
                "complete_current_structured_ui",
                actionable
                    ? "derived_from_current_visible_enabled_controls"
                    : "temporarily_empty_while_native_ui_settles",
                new[]
                {
                    "RestSiteRoom.Options",
                    "NRestSiteRoom live room",
                    "NRestSiteButton.Option+IsEnabled+visibility",
                    "NRestSiteRoom.ProceedButton"
                },
                Array.Empty<string>()),
            game,
            new[] { "Rest option purpose is visible information, not Human Environment authority." },
            Array.Empty<BridgeActionDraft>())
        {
            CandidateAdmission = "human_ui",
            AuthorityHandoff = new AuthorityHandoff(
                "human_ui_owned",
                SurfaceKind,
                "The exact visible rest-site controls own input; upstream business semantics do not grant authority.")
        };
    }

    internal static IReadOnlyList<ConnectorV3CommandDescriptor> DescribeCommands(
        RestSiteSurface surface)
    {
        var commands = new List<ConnectorV3CommandDescriptor>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        foreach (VisibleRestOption option in surface.Options.Where(value => value.Enabled))
        {
            commands.Add(new ConnectorV3CommandDescriptor(
                $"human-rest:option:{surface.ScreenEntityId}:{option.EntityId}",
                "choose_rest_option",
                "selection",
                option.Name ?? option.OptionId,
                "NRestSiteButton current visible enabled UI control",
                new[]
                {
                    screen,
                    new ActionEntityBinding("rest_option", option.EntityId)
                }));
        }
        if (surface.CanProceed)
        {
            commands.Add(new ConnectorV3CommandDescriptor(
                $"human-rest:proceed:{surface.ScreenEntityId}",
                "proceed_rest_site",
                "navigation",
                "Proceed to map",
                "NRestSiteRoom current visible enabled proceed control",
                new[] { screen }));
        }
        return commands;
    }

    internal static BridgeActionStartResult Start(
        BridgeEntityRegistry entities,
        RestSiteSurface surface,
        ConnectorV3BoundCommand binding,
        IReadOnlyDictionary<string, string> parameters)
    {
        string operation = binding.Candidate.Operation;
        if (!parameters.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "human_ui_owner_changed",
                "The exact rest-site screen is no longer current.");
        }
        if (operation == "choose_rest_option"
            && parameters.TryGetValue("rest_option_id", out string? optionId))
        {
            return StartOption(entities, screenId, optionId);
        }
        if (operation == "proceed_rest_site")
            return StartProceed(entities, screenId);
        return BridgeActionStartResult.Rejected(
            "human_ui_action_not_current",
            "The requested rest-site affordance is not current.");
    }

    private static BridgeActionStartResult StartOption(
        BridgeEntityRegistry entities,
        string expectedScreenId,
        string expectedOptionId)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (runState?.CurrentRoom is not RestSiteRoom restRoom
            || NRestSiteRoom.Instance is not { } room
            || !McpMod.IsLiveNode(room)
            || !string.Equals(entities.GetId(room, "screen"), expectedScreenId, StringComparison.Ordinal)
            || !entities.TryResolve(expectedOptionId, out RestSiteOption? option)
            || option == null)
        {
            return Changed("The exact rest-site screen or option is no longer current.");
        }

        RestSiteOption[] options = restRoom.Options.ToArray();
        NRestSiteButton[] buttons = McpMod.FindAll<NRestSiteButton>(room)
            .Where(button => McpMod.IsLiveNode(button) && ReferenceEquals(button.Option, option))
            .ToArray();
        if (!options.Any(candidate => ReferenceEquals(candidate, option))
            || buttons.Length != 1
            || !IsOptionActionable(option.IsEnabled, buttons[0].IsEnabled, McpMod.IsNodeVisible(buttons[0])))
        {
            return Changed("The exact rest-site option is no longer visible and actionable.");
        }

        buttons[0].ForceClick();
        return BridgeActionStartResult.Started(
            completionEvidence: "native_rest_option_button_clicked",
            completionBoundary: "input_delivery");
    }

    private static BridgeActionStartResult StartProceed(
        BridgeEntityRegistry entities,
        string expectedScreenId)
    {
        if (RunManager.Instance.DebugOnlyGetState()?.CurrentRoom is not RestSiteRoom
            || NRestSiteRoom.Instance is not { } room
            || !McpMod.IsLiveNode(room)
            || !string.Equals(entities.GetId(room, "screen"), expectedScreenId, StringComparison.Ordinal)
            || !room.ProceedButton.IsEnabled
            || !McpMod.IsNodeVisible(room.ProceedButton))
        {
            return Changed("The exact rest-site proceed control is no longer visible and actionable.");
        }

        room.ProceedButton.ForceClick();
        return BridgeActionStartResult.Started(
            completionEvidence: "native_rest_proceed_button_clicked",
            completionBoundary: "input_delivery");
    }

    internal static bool IsOptionActionable(
        bool optionEnabled,
        bool buttonEnabled,
        bool buttonVisible) => optionEnabled && buttonEnabled && buttonVisible;

    private static BridgeActionStartResult Changed(string detail) =>
        BridgeActionStartResult.Rejected("human_ui_target_changed", detail);

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        string reason)
    {
        var context = new RestBridgeContext("rest");
        return BridgeFailClosedObservation.BindingUnavailable(
            game,
            context,
            nameof(NRestSiteRoom),
            reason,
            new[] { "NRestSiteRoom current UI mechanics" },
            new[] { "visible_rest_options", "current_controls" },
            "human_ui_rest_binding_unavailable",
            "human-ui.rest.binding-unavailable",
            "The current rest-site UI cannot be represented without guessing a target.");
    }
}
