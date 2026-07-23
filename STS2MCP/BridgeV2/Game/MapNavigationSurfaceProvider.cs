using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Map;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.Map;
using MegaCrit.Sts2.Core.Runs;
using MegaCrit.Sts2.Core.Saves;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact-build adapter for the map's route-selection protocol. Full visible
/// topology is context; only the currently travelable points own actions.
/// </summary>
internal sealed class MapNavigationSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "map_navigation";
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;
    private static readonly FieldInfo? InputDisabledField =
        typeof(NMapScreen).GetField("_isInputDisabled", Flags);

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (!snapshot.MapIsOpen)
            return null;

        NMapScreen? screen = NMapScreen.Instance;
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (screen == null || runState == null || !McpMod.IsLiveNode(screen))
            return BindingUnavailable(game, "The visible map screen or run state is unavailable.");
        if (InputDisabledField?.GetValue(screen) is not bool inputDisabled)
            return BindingUnavailable(game, "The exact map input-readiness binding is unavailable.");

        NMapPoint[] pointNodes = McpMod.FindAll<NMapPoint>(screen)
            .Where(node => McpMod.IsLiveNode(node) && node.Point != null)
            .OrderBy(node => node.Point.coord.row)
            .ThenBy(node => node.Point.coord.col)
            .ToArray();
        if (pointNodes.Length == 0)
            return BindingUnavailable(game, "The open map has no bound player-visible map points.");

        MapCoord[] duplicateCoords = pointNodes
            .GroupBy(node => node.Point.coord)
            .Where(group => group.Count() != 1)
            .Select(group => group.Key)
            .ToArray();
        if (duplicateCoords.Length > 0)
            return BindingUnavailable(game, "The open map contains ambiguous UI nodes for one or more coordinates.");

        var byCoord = pointNodes.ToDictionary(node => node.Point.coord);
        VisibleMapNode[] nodes = pointNodes.Select(node => BuildNode(node, entities)).ToArray();
        VisibleMapCoordinate[] visited = runState.VisitedMapCoords
            .Select(coord => BuildCoordinate(coord, byCoord))
            .ToArray();
        VisibleMapCoordinate? current = runState.CurrentMapCoord is { } currentCoord
            ? BuildCoordinate(currentCoord, byCoord)
            : null;
        var context = new MapBridgeContext(
            "map",
            runState.CurrentActIndex,
            current,
            visited,
            nodes);

        DrawingMode drawingMode = screen.Drawings.GetLocalDrawingMode();
        bool routeInputReady = CanAdvertiseRouteActions(
            screen.IsOpen,
            screen.IsTravelEnabled,
            screen.IsTraveling,
            inputDisabled,
            drawingMode == DrawingMode.None);
        if (routeInputReady && pointNodes.Any(node =>
                IsExactUiTravelChoice(screen, node)
                && runState.VisitedMapCoords.Contains(node.Point.coord)))
        {
            return ContradictoryRouteState(game, context);
        }

        NMapPoint[] travelable = routeInputReady
            ? pointNodes.Where(node => IsExactMapTravelChoice(screen, runState, node)).ToArray()
            : Array.Empty<NMapPoint>();
        VisibleMapChoice[] options = travelable.Select(node => new VisibleMapChoice(
            entities.GetId(node, "map_node"),
            node.Point.coord.col,
            node.Point.coord.row,
            PointType(node.Point))).ToArray();
        List<BridgeActionDraft> actions = travelable.Select(node => BuildAction(screen, runState, node, entities)).ToList();

        var surface = new MapNavigationSurface(
            SurfaceKind,
            entities.GetId(screen, "screen"),
            screen.IsTravelEnabled,
            screen.IsTraveling,
            drawingMode.ToString().ToLowerInvariant(),
            options);
        string readiness = actions.Count > 0 ? "ready" : "settling";
        IReadOnlyList<string> warnings = drawingMode == DrawingMode.None
            ? Array.Empty<string>()
            : new[] { "map_annotation_mode_suppresses_route_actions" };
        var completeness = new StateCompleteness(
            "contract_complete_for_visible_singleplayer_map_navigation",
            actions.Count > 0
                ? "derived_from_exact_current_travelable_map_point_controls"
                : "temporarily_empty_while_map_input_is_not_route_ready",
            new[]
            {
                "NMapScreen.IsOpen+IsTravelEnabled+IsTraveling",
                "NMapScreen._isInputDisabled exact-version binding",
                "NMapDrawings.GetLocalDrawingMode",
                "NMapPoint.Point+State+IsEnabled+IsTravelable",
                "RunState.CurrentMapCoord+VisitedMapCoords",
                "MapPoint.PointType+Children"
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
            warnings,
            actions);
    }

    internal static bool CanAdvertiseRouteActions(
        bool isOpen,
        bool travelEnabled,
        bool traveling,
        bool inputDisabled,
        bool drawingModeNone) =>
        isOpen && travelEnabled && !traveling && !inputDisabled && drawingModeNone;

    internal static bool CanAdvertiseMapChoice(
        bool stateTravelable,
        bool enabled,
        bool ftueSatisfied,
        bool usingController,
        bool nodeOnScreen,
        bool targetAlreadyVisited = false) =>
        stateTravelable
        && enabled
        && ftueSatisfied
        && (!usingController || nodeOnScreen)
        && !targetAlreadyVisited;

    private static bool IsExactUiTravelChoice(NMapScreen screen, NMapPoint node)
    {
        NControllerManager? controller = NControllerManager.Instance;
        return node.Point != null
               && controller != null
               && CanAdvertiseMapChoice(
                   node.State == MapPointState.Travelable,
                   node.IsEnabled,
                   node.Point.coord.row != 0 || SaveManager.Instance.SeenFtue("map_select_ftue"),
                   controller.IsUsingController,
                   screen.IsNodeOnScreen(node));
    }

    private static bool IsExactMapTravelChoice(NMapScreen screen, RunState runState, NMapPoint node)
    {
        NControllerManager? controller = NControllerManager.Instance;
        return node.Point != null
               && controller != null
               && CanAdvertiseMapChoice(
                   node.State == MapPointState.Travelable,
                   node.IsEnabled,
                   node.Point.coord.row != 0 || SaveManager.Instance.SeenFtue("map_select_ftue"),
                   controller.IsUsingController,
                   screen.IsNodeOnScreen(node),
                   targetAlreadyVisited: !IsExactRunStateDestination(runState, node.Point.coord));
    }

    private static bool IsExactRunStateDestination(RunState runState, MapCoord coord) =>
        !runState.VisitedMapCoords.Contains(coord);

    private static VisibleMapNode BuildNode(NMapPoint node, BridgeEntityRegistry entities) =>
        new(
            entities.GetId(node, "map_node"),
            node.Point.coord.col,
            node.Point.coord.row,
            PointType(node.Point),
            node.State.ToString().ToLowerInvariant(),
            node.Point.Children
                .OrderBy(child => child.coord.row)
                .ThenBy(child => child.coord.col)
                .Select(child => new VisibleMapCoordinate(
                    child.coord.col,
                    child.coord.row,
                    PointType(child)))
                .ToArray());

    private static VisibleMapCoordinate BuildCoordinate(
        MapCoord coord,
        IReadOnlyDictionary<MapCoord, NMapPoint> byCoord) =>
        new(
            coord.col,
            coord.row,
            byCoord.TryGetValue(coord, out NMapPoint? node) ? PointType(node.Point) : null);

    private static BridgeActionDraft BuildAction(
        NMapScreen screen,
        RunState runState,
        NMapPoint node,
        BridgeEntityRegistry entities)
    {
        MapCoord coord = node.Point.coord;
        string nodeId = entities.GetId(node, "map_node");
        string pointType = PointType(node.Point);
        return new BridgeActionDraft(
            $"choose_map_node:{nodeId}:{coord.col}:{coord.row}",
            "choose_map_node",
            "navigation",
            $"Choose {pointType} at ({coord.col},{coord.row})",
            "NMapPoint.OnRelease+NMapScreen.OnMapPointSelectedLocally",
            () => StartTravel(screen, runState, node, coord),
            new[] { new ActionEntityBinding("map_node", nodeId) });
    }

    private static BridgeActionStartResult StartTravel(
        NMapScreen expectedScreen,
        RunState expectedRunState,
        NMapPoint expectedNode,
        MapCoord expectedCoord)
    {
        if (!ReferenceEquals(NMapScreen.Instance, expectedScreen)
            || !expectedScreen.IsOpen
            || expectedScreen.IsTraveling
            || !expectedScreen.IsTravelEnabled
            || expectedScreen.Drawings.GetLocalDrawingMode() != DrawingMode.None
            || InputDisabledField?.GetValue(expectedScreen) is not bool inputDisabled
            || inputDisabled
            || !ReferenceEquals(RunManager.Instance.DebugOnlyGetState(), expectedRunState)
            || !McpMod.FindAll<NMapPoint>(expectedScreen).Any(node => ReferenceEquals(node, expectedNode))
            || expectedNode.Point == null
            || !expectedNode.Point.coord.Equals(expectedCoord)
            || !IsExactMapTravelChoice(expectedScreen, expectedRunState, expectedNode))
        {
            return BridgeActionStartResult.Rejected(
                "map_choice_changed",
                "The advertised map point is no longer the exact current UI travel choice.");
        }

        expectedScreen.OnMapPointSelectedLocally(expectedNode);
        return BridgeActionStartResult.Started(
            () => !ReferenceEquals(NMapScreen.Instance, expectedScreen)
                  || !expectedScreen.IsOpen
                  || expectedRunState.CurrentMapCoord is { } current
                     && current.Equals(expectedCoord),
            "map_closed_or_current_map_coordinate_reached",
            allowIntermediateStateChanges: true);
    }

    private static string PointType(MapPoint point) => point.PointType.ToString().ToLowerInvariant();

    private static BridgeObservationDraft ContradictoryRouteState(
        GameBuildIdentity game,
        MapBridgeContext context)
    {
        const string reason = "The map UI marks a coordinate travelable even though the active run records it as visited.";
        var surface = new UnsupportedSurface("unsupported", SurfaceKind, reason);
        var completeness = new StateCompleteness(
            "partial",
            "empty_fail_closed_due_to_ui_run_state_contradiction",
            new[]
            {
                "NMapScreen.IsOpen+IsTravelEnabled+IsTraveling",
                "NMapPoint.State+IsEnabled",
                "RunState.VisitedMapCoords"
            },
            new[] { "legal_actions" });
        string signature = BridgeHash.Object(new { game.Version, context, reason });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            surface,
            completeness,
            game,
            new[] { "map_navigation_ui_run_state_contradiction" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.map_navigation.ui_run_state_contradiction",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "refresh_or_update_bridge",
                    reason)
            }
        };
    }

    private static BridgeObservationDraft BindingUnavailable(GameBuildIdentity game, string reason)
    {
        var context = new UnknownBridgeContext("unknown", "map_open", reason);
        var surface = new UnsupportedSurface("unsupported", "map_navigation", reason);
        var completeness = new StateCompleteness(
            "partial",
            "empty_fail_closed",
            new[] { "NMapScreen exact-version binding" },
            new[] { "map_context", "map_nodes", "legal_actions" });
        string signature = BridgeHash.Object(new { game.Version, reason });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            surface,
            completeness,
            game,
            new[] { "map_navigation_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.map_navigation.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}
