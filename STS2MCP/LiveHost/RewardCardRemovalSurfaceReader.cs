using STS2_MCP.NativeUi;
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

/// <summary>
/// Exact CardRemovalReward child. It reuses bounded deck-removal mechanics,
/// while its reward source, cancellation behavior, authority tier, and
/// completion witness remain independent from merchant and relic removal.
/// </summary>
internal sealed class RewardCardRemovalSurfaceReader : ILiveSurfaceReader
{
    public string Kind => "reward_deck_removal_selection";

    public InputOwnerLayer Layer => InputOwnerLayer.Overlay;

    public LiveObservation? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        NativeEntityRegistry entities,
        GameBuildIdentity game) =>
        DeckRemovalSelectionSurfaceReader.TryBuildReward(snapshot, entities, game);
}
