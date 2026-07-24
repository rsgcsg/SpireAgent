using System;
using MegaCrit.Sts2.Core.Debug;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeGameIdentity
{
    public static GameBuildIdentity Read()
    {
        ReleaseInfo? release = null;
        try
        {
            release = ReleaseInfoManager.Instance.ReleaseInfo;
        }
        catch
        {
            // Identity remains unknown and action execution fails closed.
        }

        int? runtimeMainAssemblyHash = null;
        try
        {
            runtimeMainAssemblyHash = AssemblyHasher.GetMainAssemblyHash();
        }
        catch
        {
            // A missing runtime digest is an unknown identity and fails closed.
        }

        CompatibilityAssessment gameCompatibility = Assess(
            release?.Version,
            release?.Commit,
            runtimeMainAssemblyHash);
        ModsetIdentity modset = BridgeModsetIdentity.Read();
        CompatibilityAssessment compatibility = ApplyModset(gameCompatibility, modset);

        return new GameBuildIdentity(
            release?.Version,
            release?.Commit,
            release?.Branch,
            runtimeMainAssemblyHash,
            compatibility,
            modset)
        {
            ReleaseDeclaredMainAssemblyHash = release?.MainAssemblyHash
        };
    }

    internal static CompatibilityAssessment ApplyModset(
        CompatibilityAssessment gameCompatibility,
        ModsetIdentity modset)
    {
        if (modset.ExactPermissionEligible)
            return gameCompatibility;

        return gameCompatibility with
        {
            Status = gameCompatibility.StateObservationAllowed
                ? "unqualified_modset"
                : gameCompatibility.Status,
            ActionExecutionAllowed = false,
            InspectionAllowed = false,
            ActionExecutionSurfaceKinds = Array.Empty<string>(),
            ActionCanarySurfaceKinds = Array.Empty<string>(),
            InspectionAllowedKinds = Array.Empty<string>(),
            InspectionCanaryKinds = Array.Empty<string>(),
            ObservationOnlySurfaceKinds = Array.Empty<string>(),
            ActionPermissionScopes = Array.Empty<ActionPermissionScope>(),
            AdaptationLevel = "diagnostic_only",
            Detail = $"{gameCompatibility.Detail} Modset {modset.Status} ({modset.Fingerprint}) is not explicitly qualified; action and Inspection scopes fail closed."
        };
    }

    internal static CompatibilityAssessment Assess(
        string? version,
        string? commit,
        int? mainAssemblyHash) =>
        BridgeExactEnvironmentPolicy.Assess(version, commit, mainAssemblyHash);
}
