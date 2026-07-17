using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.GodotExtensions;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Nodes.Screens.Map;
using MegaCrit.Sts2.Core.Nodes.Screens.ScreenContext;
using MegaCrit.Sts2.Core.Nodes.Screens.TreasureRoomRelic;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact-build single-player treasure-room contract. The four stages retain
/// different business commits and completion witnesses instead of flattening
/// the room into a generic reward button.
/// </summary>
internal sealed class TreasureRoomSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "treasure_room";
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;
    private static readonly FieldInfo? CollectionOpenField =
        typeof(NTreasureRoom).GetField("_isRelicCollectionOpen", Flags);
    private static readonly FieldInfo? ChestOpenedField =
        typeof(NTreasureRoom).GetField("_hasChestBeenOpened", Flags);

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Room;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (runState?.CurrentRoom is not TreasureRoom room)
            return null;

        string step = "scene_root";
        try
        {
        step = "screen_authority";
        NTreasureRoom? uiRoom = NRun.Instance?.TreasureRoom;
        if (uiRoom == null
            || !McpMod.IsLiveNode(uiRoom)
            || !ActiveScreenContext.Instance.IsCurrent(uiRoom))
            return BindingUnavailable(game, "The visible treasure room does not own the current screen context.");

        step = "lifecycle_flags";
        if (!TryReadBool(ChestOpenedField, uiRoom, out bool chestOpened)
            || !TryReadBool(CollectionOpenField, uiRoom, out bool collectionOpen))
        {
            return BindingUnavailable(game, "Exact treasure lifecycle flags are unavailable.");
        }

        step = "exact_controls";
        NButton? chest = uiRoom.GetNodeOrNull<NButton>("%Chest");
        NTreasureRoomRelicCollection? collection =
            uiRoom.GetNodeOrNull<NTreasureRoomRelicCollection>("%RelicCollection");
        NProceedButton proceed = uiRoom.ProceedButton;
        Player? player = LocalContext.GetMe(runState);
        if (chest == null || collection == null || proceed == null || player == null)
            return BindingUnavailable(game, "Treasure controls, relic collection, or local player are unavailable.");

        step = "relic_collection";
        RelicModel[] currentRelics =
            RunManager.Instance.TreasureRoomRelicSynchronizer.CurrentRelics?.ToArray()
            ?? Array.Empty<RelicModel>();
        NTreasureRoomRelicHolder? holder = collection.SingleplayerRelicHolder;
        bool holderMatches = currentRelics.Length == 1
                             && holder != null
                             && holder.Relic?.Model is { } holderRelic
                             && ReferenceEquals(holderRelic, currentRelics[0]);
        bool holderVisible = holderMatches
                             && McpMod.IsLiveNode(holder!)
                             && McpMod.IsNodeVisible(holder!)
                             && collectionOpen;
        bool holderActionable = holderVisible
                                && holder!.IsEnabled
                                && holder.MouseFilter != Control.MouseFilterEnum.Ignore;

        step = "surface_projection";
        string stage = !chestOpened
            ? chest.IsEnabled && McpMod.IsNodeVisible(chest) ? "closed" : "opening"
            : collectionOpen
                ? currentRelics.Length > 0 ? "relic_choice" : "opening"
                : "completed";
        VisibleTreasureRelic[] visibleRelics = holderVisible
            ? new[] { BuildRelic(currentRelics[0], entities) }
            : Array.Empty<VisibleTreasureRelic>();
        bool canSkip = stage == "relic_choice"
                       && proceed.IsSkip
                       && proceed.IsEnabled
                       && McpMod.IsNodeVisible(proceed);
        bool canProceed = stage == "completed"
                          && !proceed.IsSkip
                          && proceed.IsEnabled
                          && McpMod.IsNodeVisible(proceed);

        string roomId = entities.GetId(uiRoom, "treasure_room");
        var actions = new List<BridgeActionDraft>();
        if (stage == "closed"
            && chest.IsEnabled
            && McpMod.IsNodeVisible(chest)
            && chest.MouseFilter != Control.MouseFilterEnum.Ignore)
        {
            actions.Add(new BridgeActionDraft(
                $"open_treasure_chest:{roomId}",
                "open_treasure_chest",
                "reveal",
                "Open the treasure chest",
                "NTreasureRoom.OnChestButtonReleased+OpenChest+InitializeRelics",
                () => StartOpen(room, uiRoom, chest),
                new[] { new ActionEntityBinding("treasure_room", roomId) }));
        }
        if (stage == "relic_choice" && holderActionable)
        {
            RelicModel relic = currentRelics[0];
            string relicId = visibleRelics[0].EntityId;
            actions.Add(new BridgeActionDraft(
                $"choose_treasure_relic:{relicId}",
                "choose_treasure_relic",
                "claim",
                $"Take {visibleRelics[0].Name ?? visibleRelics[0].DefinitionId}",
                "NTreasureRoomRelicCollection.PickRelic+RelicCmd.Obtain+player-relic-post-state",
                () => StartChoose(room, uiRoom, collection, holder!, relic, player),
                new[] { new ActionEntityBinding("relic", relicId) }));
        }
        if (canSkip)
        {
            actions.Add(new BridgeActionDraft(
                $"skip_treasure_relic:{roomId}",
                "skip_treasure_relic",
                "skip",
                "Skip the visible treasure relic",
                "NTreasureRoom.ProceedButton.IsSkip+SkipRelicLocally+room-exit-post-state",
                () => StartSkip(room, uiRoom, collection, proceed, player),
                new[] { new ActionEntityBinding("treasure_room", roomId) }));
        }
        if (canProceed)
        {
            actions.Add(new BridgeActionDraft(
                $"proceed_treasure_room:{roomId}",
                "proceed_treasure_room",
                "navigation",
                "Continue from the treasure room",
                "NTreasureRoom.ProceedButton+room-exit-or-map-open",
                () => StartProceed(room, uiRoom, proceed),
                new[] { new ActionEntityBinding("treasure_room", roomId) }));
        }

        var surface = new TreasureRoomSurface(
            SurfaceKind,
            stage,
            roomId,
            chestOpened,
            visibleRelics,
            canSkip,
            canProceed);
        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_single_player_treasure_room_lifecycle",
            actions.Count > 0
                ? "derived_from_same_exact_current_controls_as_execution"
                : "temporarily_empty_while_chest_or_relic_award_animation_settles",
            new[]
            {
                "TreasureRoom+NTreasureRoom exact room ownership",
                "NTreasureRoom._hasChestBeenOpened+_isRelicCollectionOpen exact-version bindings",
                "NTreasureRoomRelicCollection.CurrentRelics+SingleplayerRelicHolder",
                "RelicModel visible title+description+rarity+hover keywords",
                "NProceedButton.IsSkip+IsEnabled"
            },
            Array.Empty<string>());
        step = "state_signature";
        string signature = BridgeHash.Object(new
        {
            game.Version,
            context = new TreasureBridgeContext("treasure"),
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            new TreasureBridgeContext("treasure"),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            actions);
        }
        catch (Exception ex)
        {
            return BindingUnavailable(
                game,
                $"Treasure projection failed at {step}: {ex.GetType().Name}.");
        }
    }

    private static VisibleTreasureRelic BuildRelic(
        RelicModel relic,
        BridgeEntityRegistry entities) =>
        new(
            entities.GetId(relic, "treasure_relic"),
            relic.Id.Entry,
            McpMod.SafeGetText(() => relic.Title),
            McpMod.SafeGetText(() => relic.DynamicDescription),
            relic.Rarity.ToString(),
            BuildKeywords(relic));

    private static IReadOnlyList<VisibleKeyword> BuildKeywords(RelicModel relic)
    {
        var result = new List<VisibleKeyword>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        try
        {
            foreach (IHoverTip tip in IHoverTip.RemoveDupes(relic.HoverTipsExcludingRelic))
            {
                string? name = null;
                string? description = null;
                if (tip is HoverTip hover)
                {
                    name = hover.Title == null ? null : McpMod.StripRichTextTags(hover.Title);
                    description = McpMod.StripRichTextTags(hover.Description);
                }
                if (name is not null && seen.Add(name))
                    result.Add(new VisibleKeyword(name, description));
            }
        }
        catch
        {
            // Main relic semantics remain available; incomplete hover-tip
            // semantics are surfaced by the empty keyword list, never guessed.
        }
        return result;
    }

    private static BridgeActionStartResult StartOpen(
        TreasureRoom expectedRoom,
        NTreasureRoom expectedUi,
        NButton expectedChest)
    {
        if (!IsCurrent(expectedRoom, expectedUi)
            || !TryReadBool(ChestOpenedField, expectedUi, out bool opened)
            || opened
            || !ReferenceEquals(expectedUi.GetNodeOrNull<NButton>("%Chest"), expectedChest)
            || !expectedChest.IsEnabled
            || !McpMod.IsNodeVisible(expectedChest)
            || expectedChest.MouseFilter == Control.MouseFilterEnum.Ignore)
        {
            return BridgeActionStartResult.Rejected(
                "treasure_chest_changed",
                "The advertised unopened treasure chest is no longer current and clickable.");
        }

        expectedChest.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedRoom, expectedUi)
                  && TryReadBool(ChestOpenedField, expectedUi, out bool isOpened)
                  && isOpened
                  && RunManager.Instance.TreasureRoomRelicSynchronizer.CurrentRelics != null,
            "treasure_chest_opened_and_relic_result_initialized",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartChoose(
        TreasureRoom expectedRoom,
        NTreasureRoom expectedUi,
        NTreasureRoomRelicCollection expectedCollection,
        NTreasureRoomRelicHolder expectedHolder,
        RelicModel expectedRelic,
        Player expectedPlayer)
    {
        int beforeCount = CountRelic(expectedPlayer, expectedRelic.Id.Entry);
        RelicModel[] current =
            RunManager.Instance.TreasureRoomRelicSynchronizer.CurrentRelics?.ToArray()
            ?? Array.Empty<RelicModel>();
        if (!IsCurrent(expectedRoom, expectedUi)
            || !TryReadBool(CollectionOpenField, expectedUi, out bool collectionOpen)
            || !collectionOpen
            || !ReferenceEquals(expectedUi.GetNodeOrNull<NTreasureRoomRelicCollection>("%RelicCollection"), expectedCollection)
            || !ReferenceEquals(expectedCollection.SingleplayerRelicHolder, expectedHolder)
            || current.Length != 1
            || !ReferenceEquals(current[0], expectedRelic)
            || !ReferenceEquals(expectedHolder.Relic?.Model, expectedRelic)
            || !expectedHolder.IsEnabled
            || !McpMod.IsNodeVisible(expectedHolder)
            || expectedHolder.MouseFilter == Control.MouseFilterEnum.Ignore
            || CountRelic(expectedPlayer, expectedRelic.Id.Entry) != beforeCount)
        {
            return BridgeActionStartResult.Rejected(
                "treasure_relic_changed",
                "The advertised treasure relic is no longer the current selectable offer.");
        }

        expectedHolder.ForceClick();
        return BridgeActionStartResult.Started(
            () => CountRelic(expectedPlayer, expectedRelic.Id.Entry) > beforeCount
                  && (!IsCurrent(expectedRoom, expectedUi)
                      || TryReadBool(CollectionOpenField, expectedUi, out bool stillOpen) && !stillOpen),
            "treasure_relic_owned_and_selection_closed",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartSkip(
        TreasureRoom expectedRoom,
        NTreasureRoom expectedUi,
        NTreasureRoomRelicCollection expectedCollection,
        NProceedButton expectedProceed,
        Player expectedPlayer)
    {
        int beforeRelicCount = expectedPlayer.Relics.Count;
        if (!IsCurrent(expectedRoom, expectedUi)
            || !TryReadBool(CollectionOpenField, expectedUi, out bool collectionOpen)
            || !collectionOpen
            || !ReferenceEquals(expectedUi.GetNodeOrNull<NTreasureRoomRelicCollection>("%RelicCollection"), expectedCollection)
            || !ReferenceEquals(expectedUi.ProceedButton, expectedProceed)
            || !expectedProceed.IsSkip
            || !expectedProceed.IsEnabled
            || !McpMod.IsNodeVisible(expectedProceed))
        {
            return BridgeActionStartResult.Rejected(
                "treasure_skip_changed",
                "The advertised treasure skip control is no longer current and enabled.");
        }

        expectedProceed.ForceClick();
        return BridgeActionStartResult.Started(
            () => expectedPlayer.Relics.Count == beforeRelicCount
                  && (!ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedRoom)
                      || NMapScreen.Instance?.IsOpen == true),
            "treasure_relic_skipped_without_inventory_change_and_room_left",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartProceed(
        TreasureRoom expectedRoom,
        NTreasureRoom expectedUi,
        NProceedButton expectedProceed)
    {
        if (!IsCurrent(expectedRoom, expectedUi)
            || !ReferenceEquals(expectedUi.ProceedButton, expectedProceed)
            || expectedProceed.IsSkip
            || !expectedProceed.IsEnabled
            || !McpMod.IsNodeVisible(expectedProceed))
        {
            return BridgeActionStartResult.Rejected(
                "treasure_proceed_changed",
                "The advertised treasure proceed control is no longer current and enabled.");
        }

        expectedProceed.ForceClick();
        return BridgeActionStartResult.Started(
            () => !ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedRoom)
                  || NMapScreen.Instance?.IsOpen == true,
            "treasure_room_left_or_map_opened",
            allowIntermediateStateChanges: true);
    }

    private static bool IsCurrent(TreasureRoom expectedRoom, NTreasureRoom expectedUi) =>
        ReferenceEquals(RunManager.Instance.DebugOnlyGetState()?.CurrentRoom, expectedRoom)
        && McpMod.IsLiveNode(expectedUi)
        && ActiveScreenContext.Instance.IsCurrent(expectedUi);

    private static int CountRelic(Player player, string definitionId) =>
        player.Relics.Count(relic => string.Equals(relic.Id.Entry, definitionId, StringComparison.Ordinal));

    private static bool TryReadBool(FieldInfo? field, object instance, out bool value)
    {
        value = false;
        if (field?.GetValue(instance) is not bool current)
            return false;
        value = current;
        return true;
    }

    private static BridgeObservationDraft BindingUnavailable(GameBuildIdentity game, string reason)
    {
        var context = new TreasureBridgeContext("treasure");
        var surface = new UnsupportedSurface("unsupported", SurfaceKind, reason);
        var completeness = new StateCompleteness(
            "partial",
            "empty_fail_closed",
            new[] { "TreasureRoom+NTreasureRoom exact-version binding" },
            new[] { "treasure_stage", "visible_relics", "legal_actions" });
        string signature = BridgeHash.Object(new { game.Version, reason });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            surface,
            completeness,
            game,
            new[] { "treasure_room_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.treasure_room.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}
