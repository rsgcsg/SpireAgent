using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
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
    string SourceType)
{
    public bool HasBlockingOverlay => TopOverlay != null;
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
        IOverlayScreen? overlay = NOverlayStack.Instance?.Peek();
        string sourceType = overlay?.GetType().Name
            ?? (RunManager.Instance.IsInProgress ? "run_without_overlay" : "menu_or_no_run");
        return new ActiveSurfaceSnapshot(overlay, sourceType);
    }

    public static ActiveSurfaceResolution Resolve(
        ActiveSurfaceSnapshot snapshot,
        IReadOnlyList<IBridgeSurfaceProvider> providers,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        var matches = new List<(string Kind, BridgeObservationDraft Draft)>();
        foreach (IBridgeSurfaceProvider provider in providers.Where(provider =>
                     IsActiveLayer(provider.Layer, snapshot.HasBlockingOverlay)))
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

    internal static BridgeSurfaceLayer SelectLayer(bool hasBlockingOverlay) =>
        hasBlockingOverlay ? BridgeSurfaceLayer.Overlay : BridgeSurfaceLayer.Room;

    internal static bool IsActiveLayer(
        BridgeSurfaceLayer providerLayer,
        bool hasBlockingOverlay) =>
        providerLayer == SelectLayer(hasBlockingOverlay);
}
