using System;
using System.Linq;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeSurfacePermission
{
    public static bool IsActionPermitted(CompatibilityAssessment compatibility, string surfaceKind) =>
        compatibility.ActionExecutionAllowed
        && (compatibility.ActionExecutionSurfaceKinds.Contains(surfaceKind, StringComparer.Ordinal)
            || compatibility.ActionCanarySurfaceKinds.Contains(surfaceKind, StringComparer.Ordinal));

    public static string SupportLevel(CompatibilityAssessment compatibility, string surfaceKind)
    {
        if (compatibility.ActionExecutionAllowed
            && compatibility.ActionExecutionSurfaceKinds.Contains(surfaceKind, StringComparer.Ordinal))
        {
            return "qualified_exact_build";
        }

        if (compatibility.ActionExecutionAllowed
            && compatibility.ActionCanarySurfaceKinds.Contains(surfaceKind, StringComparer.Ordinal))
        {
            return "candidate_action_canary";
        }

        if (compatibility.StateObservationAllowed
            && compatibility.ObservationOnlySurfaceKinds.Contains(surfaceKind, StringComparer.Ordinal))
        {
            return "candidate_observation_only";
        }

        return "not_qualified_for_current_build";
    }
}
