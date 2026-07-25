using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact Precise Scissors acquisition child. It has the same visible grid
/// mechanics as merchant removal but a different source, authority tier and
/// semantic completion, so it remains a distinct semantic surface.
/// </summary>
internal sealed class PreciseScissorsRemovalSurfaceProvider : IBridgeSurfaceProvider
{
    public string Kind => "relic_deck_removal_selection";

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game) =>
        DeckRemovalSelectionSurfaceProvider.TryBuildPreciseScissors(snapshot, entities, game);
}
