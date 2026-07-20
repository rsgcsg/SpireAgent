using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Events;
using MegaCrit.Sts2.Core.HoverTips;
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
            || runState.Players.Count != 1
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
                ReadWillKillPlayer(button, option),
                option.Relic == null ? null : McpMod.SafeGetText(() => option.Relic.Title),
                option.Relic == null ? null : McpMod.SafeGetText(() => option.Relic.DynamicDescription),
                BuildTooltips(option.HoverTips, entityId)));

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
                "NEventOptionButton.Option",
                "EventOption.HoverTips",
                "EventOption.WillKillPlayer"
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

        IOverlayScreen? previousOverlay = NOverlayStack.Instance?.Peek();
        expectedButton.ForceClick();
        if (expectedOption.IsProceed)
        {
            return StartAsyncEventTransition(
                () => !ReferenceEquals(NEventRoom.Instance, expectedRoom)
                      || NMapScreen.Instance?.IsOpen == true,
                "event_proceed_opened_map_or_left_room");
        }

        return StartAsyncEventTransition(
            () => !ReferenceEquals(NEventRoom.Instance, expectedRoom)
                  || CombatManager.Instance.IsInProgress
                  || (NOverlayStack.Instance?.Peek() is { } currentOverlay
                      && !ReferenceEquals(currentOverlay, previousOverlay))
                  || HasReplacementOptions(expectedRoom, currentButtons),
            "event_option_replaced_or_required_subsurface_opened");
    }

    internal static BridgeActionStartResult StartAsyncEventTransition(
        Func<bool> completionProbe,
        string completionEvidence) =>
        BridgeActionStartResult.Started(
            completionProbe,
            completionEvidence,
            allowIntermediateStateChanges: true);

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

    private static bool ReadWillKillPlayer(NEventOptionButton button, EventOption option)
    {
        if (option.WillKillPlayer == null)
            return false;
        var owner = button.Event.Owner
                    ?? throw new InvalidOperationException("A lethal event option has no current player owner.");
        return option.WillKillPlayer(owner);
    }

    private static IReadOnlyList<VisibleEventOptionTooltip> BuildTooltips(
        IEnumerable<IHoverTip> tips,
        string ownerEntityId)
    {
        var result = new List<VisibleEventOptionTooltip>();
        int cardOrdinal = 0;
        foreach (IHoverTip tip in IHoverTip.RemoveDupes(tips))
        {
            switch (tip)
            {
                case HoverTip text:
                    result.Add(new VisibleEventOptionTooltip(
                        "text",
                        text.Title == null ? null : McpMod.StripRichTextTags(text.Title),
                        McpMod.StripRichTextTags(text.Description),
                        null));
                    break;
                case CardHoverTip card:
                    result.Add(new VisibleEventOptionTooltip(
                        "card",
                        null,
                        null,
                        BridgeContextBuilder.BuildCard(
                            card.Card,
                            BridgeVisibleEntityFacts.BuildTooltipCardEntityId(
                                ownerEntityId,
                                card.Card.Id.Entry,
                                cardOrdinal++),
                            displayPile: PileType.Deck)));
                    break;
                default:
                    throw new NotSupportedException($"Unsupported event-option hover-tip type: {tip.GetType().Name}");
            }
        }
        return result;
    }
}
