using STS2_MCP.NativeUi;
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

internal interface ILiveSurfaceReader
{
    string Kind { get; }

    InputOwnerLayer Layer { get; }

    LiveObservation? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        NativeEntityRegistry entities,
        GameBuildIdentity game);
}
