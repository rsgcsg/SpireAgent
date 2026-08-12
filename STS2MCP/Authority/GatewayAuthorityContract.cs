using System;
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.Authority;

internal static class GatewayAuthorityContract
{
    internal const string ControlProtocol = "gateway-control-1";
    internal const string QualificationProtocol = "gateway-authority-1";

    internal static bool HumanEnvironmentExecutionAvailable(
        GameBuildIdentity game,
        string? loadedAssemblySha256) =>
        game.Compatibility.StateObservationAllowed
        && !string.IsNullOrWhiteSpace(game.Version)
        && !string.IsNullOrWhiteSpace(game.Commit)
        && game.MainAssemblyHash.HasValue
        && !string.IsNullOrWhiteSpace(loadedAssemblySha256);
}
