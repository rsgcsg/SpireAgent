using STS2_MCP.NativeUi;
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

/// <summary>
/// Exact Precise Scissors acquisition child. It has the same visible grid
/// mechanics as merchant removal but a different source, authority tier and
/// semantic completion, so it remains a distinct semantic surface.
/// </summary>
internal sealed class PreciseScissorsRemovalSurfaceReader : ILiveSurfaceReader
{
    public string Kind => "relic_deck_removal_selection";

    public InputOwnerLayer Layer => InputOwnerLayer.Overlay;

    public LiveObservation? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        NativeEntityRegistry entities,
        GameBuildIdentity game) =>
        DeckRemovalSelectionSurfaceReader.TryBuildPreciseScissors(snapshot, entities, game);
}
