using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Events;
using MegaCrit.Sts2.Core.Models.Events;
using MegaCrit.Sts2.Core.Nodes.Events;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Nodes.Screens.Map;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal sealed class EventOptionSurfaceProvider : IBridgeSurfaceProvider
{
    public string Kind => "event_option";

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Room;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        NEventRoom? room = NEventRoom.Instance;
        if (runState?.CurrentRoom is not EventRoom eventRoom
            || room == null
            || !McpMod.IsLiveNode(room)
            || CombatManager.Instance.IsInProgress)
        {
            return null;
        }

        EventBridgeContext context = BridgeContextBuilder.BuildEvent(eventRoom);
        if (context.InDialogue)
            return null;

        NEventOptionButton[] allButtons = room.Layout?.OptionButtons.ToArray()
            ?? Array.Empty<NEventOptionButton>();
        var visibleButtons = allButtons
            .Select((button, index) => (Button: button, Index: index))
            .Where(entry => McpMod.IsNodeVisible(entry.Button))
            .ToArray();
        var options = new List<VisibleEventOption>(visibleButtons.Length);
        var actions = new List<BridgeActionDraft>();
        foreach ((NEventOptionButton button, int position) in visibleButtons)
        {
            EventOption option = button.Option;
            string entityId = entities.GetId(option, "event_option");
            options.Add(new VisibleEventOption(
                entityId,
                position,
                McpMod.SafeGetText(() => option.Title),
                McpMod.SafeGetText(() => option.Description),
                option.IsLocked,
                option.IsProceed,
                option.WasChosen,
                option.Relic == null ? null : McpMod.SafeGetText(() => option.Relic.Title),
                option.Relic == null ? null : McpMod.SafeGetText(() => option.Relic.DynamicDescription)));

            if (!option.IsLocked && button.IsEnabled)
            {
                actions.Add(new BridgeActionDraft(
                    $"choose_event_option:{entityId}",
                    option.IsProceed ? "proceed_event" : "choose_event_option",
                    option.IsProceed ? "navigation" : "selection",
                    BuildLabel(option),
                    "NEventRoom.OptionButtonClicked+NEventOptionButton",
                    () => StartOption(room, button, option, position),
                    new[] { new ActionEntityBinding("option", entityId) }));
            }
        }

        var surface = new EventOptionSurface(
            Kind,
            entities.GetId(room, "screen"),
            options);
        var missing = new List<string>();
        if (context.Name == null)
            missing.Add("context.name");
        if (options.Count == 0)
            missing.Add("surface.options");
        string readiness = ClassifyReadiness(context.Name != null, options.Count, actions.Count);
        var completeness = new StateCompleteness(
            missing.Count == 0 ? "contract_complete_for_supported_surface" : "partial",
            actions.Count > 0 ? "derived_from_same_validator_as_execution" : "temporarily_empty_while_ui_settles",
            new[]
            {
                "NEventRoom.current_event",
                "NEventLayout.rendered_text",
                "NEventLayout.OptionButtons",
                "NEventOptionButton.Option"
            },
            missing);
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
            actions);
    }

    internal static string ClassifyReadiness(
        bool contextNameAvailable,
        int visibleOptionCount,
        int actionCount)
    {
        // A normal event can render before its option buttons are attached.
        // That is a known protocol in a transient state, not a malformed or
        // unsupported surface. Missing context semantics remain degraded.
        if (!contextNameAvailable)
            return "degraded";
        if (visibleOptionCount == 0)
            return "settling";
        return actionCount > 0 ? "ready" : "settling";
    }

    private static BridgeActionStartResult StartOption(
        NEventRoom expectedRoom,
        NEventOptionButton expectedButton,
        EventOption expectedOption,
        int expectedIndex)
    {
        NEventRoom? currentRoom = NEventRoom.Instance;
        if (!ReferenceEquals(currentRoom, expectedRoom) || !McpMod.IsLiveNode(expectedRoom))
            return BridgeActionStartResult.Rejected("event_room_changed", "The event room is no longer current.");
        NEventOptionButton[] currentButtons = expectedRoom.Layout?.OptionButtons.ToArray()
            ?? Array.Empty<NEventOptionButton>();
        if (expectedIndex < 0
            || expectedIndex >= currentButtons.Length
            || !ReferenceEquals(currentButtons[expectedIndex], expectedButton)
            || !ReferenceEquals(expectedButton.Option, expectedOption)
            || expectedOption.IsLocked
            || !expectedButton.IsEnabled
            || !McpMod.IsNodeVisible(expectedButton))
        {
            return BridgeActionStartResult.Rejected("event_option_changed", "The event option is no longer enabled at the advertised position.");
        }

        expectedButton.ForceClick();
        string completionEvidence = expectedOption.IsProceed
            ? "event_proceed_opened_map_or_left_room"
            : "event_option_applied_or_required_subsurface_opened";
        return BridgeActionStartResult.Started(
            () => (!expectedOption.IsProceed && expectedOption.WasChosen)
                  || !ReferenceEquals(NEventRoom.Instance, expectedRoom)
                  || NMapScreen.Instance?.IsOpen == true
                  || CombatManager.Instance.IsInProgress
                  || NOverlayStack.Instance?.Peek() != null
                  || HasReplacementOptions(expectedRoom, currentButtons),
            completionEvidence);
    }

    private static bool HasReplacementOptions(
        NEventRoom expectedRoom,
        IReadOnlyList<NEventOptionButton> previous)
    {
        if (!ReferenceEquals(NEventRoom.Instance, expectedRoom) || expectedRoom.Layout == null)
            return true;
        NEventOptionButton[] current = expectedRoom.Layout.OptionButtons.ToArray();
        return current.Length > 0
               && (current.Length != previous.Count
                   || current.Where((button, index) => !ReferenceEquals(button, previous[index])).Any());
    }

    private static string BuildLabel(EventOption option)
    {
        string? title = McpMod.SafeGetText(() => option.Title);
        string? description = McpMod.SafeGetText(() => option.Description);
        return title ?? description ?? (option.IsProceed ? "Proceed" : "Choose event option");
    }
}
