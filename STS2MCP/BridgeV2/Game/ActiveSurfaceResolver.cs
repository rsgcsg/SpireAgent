using System;
using System.Collections.Generic;
using System.Linq;
using Godot;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Nodes.Screens.Map;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal enum BridgeSurfaceLayer
{
    Overlay,
    Room
}

internal sealed record ActiveSurfaceSnapshot(
    IOverlayScreen? TopOverlay,
    bool MapIsOpen,
    string SourceType)
{
    public bool HasBlockingSurface => TopOverlay != null || MapIsOpen;
}

internal sealed record ActiveSurfaceResolution(
    BridgeObservationDraft? Draft,
    IReadOnlyList<string> MatchedKinds,
    string? FailedProvider,
    Exception? Failure);

internal static class ActiveSurfaceResolver
{
    public static ActiveSurfaceSnapshot Capture()
    {
        IOverlayScreen? candidate = NOverlayStack.Instance?.Peek();
        // The map's explicit open state wins over a rewards overlay retained
        // during the room-exit animation. This is not a strategic inference:
        // it is the game's own active player-facing screen state.
        bool mapIsOpen = NMapScreen.Instance?.IsOpen == true;
        // The overlay stack can retain a node for a frame (or during a room
        // transition) after it has left the visible UI. It must not keep
        // publishing stale actions over the new room state.
        IOverlayScreen? overlay = !mapIsOpen && IsVisibleActiveOverlay(candidate) ? candidate : null;
        string sourceType = overlay?.GetType().Name
            ?? (mapIsOpen ? "map_open" : RunManager.Instance.IsInProgress ? "run_without_visible_overlay" : "menu_or_no_run");
        return new ActiveSurfaceSnapshot(overlay, mapIsOpen, sourceType);
    }

    internal static bool IsVisibleActiveOverlay(IOverlayScreen? overlay) =>
        overlay is CanvasItem canvas
        && McpMod.IsLiveNode(canvas)
        && McpMod.IsNodeVisible(canvas);

    public static ActiveSurfaceResolution Resolve(
        ActiveSurfaceSnapshot snapshot,
        IReadOnlyList<IBridgeSurfaceProvider> providers,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        var matches = new List<(string Kind, BridgeObservationDraft Draft)>();
        foreach (IBridgeSurfaceProvider provider in providers.Where(provider =>
                     IsActiveLayer(provider.Layer, snapshot.TopOverlay != null, snapshot.MapIsOpen)))
        {
            try
            {
                BridgeObservationDraft? draft = provider.TryBuild(snapshot, entities, game);
                if (draft != null)
                    matches.Add((provider.Kind, draft));
            }
            catch (Exception ex)
            {
                return new ActiveSurfaceResolution(
                    null,
                    matches.Select(match => match.Kind).ToArray(),
                    provider.Kind,
                    ex);
            }
        }

        return new ActiveSurfaceResolution(
            matches.Count == 1 ? matches[0].Draft : null,
            matches.Select(match => match.Kind).ToArray(),
            null,
            null);
    }

    internal static BridgeSurfaceLayer SelectLayer(bool hasVisibleOverlay, bool mapIsOpen) =>
        hasVisibleOverlay || mapIsOpen ? BridgeSurfaceLayer.Overlay : BridgeSurfaceLayer.Room;

    internal static bool IsActiveLayer(
        BridgeSurfaceLayer providerLayer,
        bool hasVisibleOverlay,
        bool mapIsOpen) =>
        providerLayer == SelectLayer(hasVisibleOverlay, mapIsOpen);
}
