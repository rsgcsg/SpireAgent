using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact CardRemovalReward child. It reuses bounded deck-removal mechanics,
/// while its reward source, cancellation behavior, authority tier, and
/// completion witness remain independent from merchant and relic removal.
/// </summary>
internal sealed class RewardCardRemovalSurfaceProvider : IBridgeSurfaceProvider
{
    public string Kind => "reward_deck_removal_selection";

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game) =>
        DeckRemovalSelectionSurfaceProvider.TryBuildReward(snapshot, entities, game);
}
