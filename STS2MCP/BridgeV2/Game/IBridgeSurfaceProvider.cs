using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal interface IBridgeSurfaceProvider
{
    string Kind { get; }

    BridgeObservationDraft? TryBuild(
        BridgeEntityRegistry entities,
        GameBuildIdentity game);
}
