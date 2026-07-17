using System;
using MegaCrit.Sts2.Core.Debug;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeGameIdentity
{
    private static readonly string[] TestedVersions = { "0.108.0" };
    private const string TestedCommit = "58694f64";
    private const int TestedMainAssemblyHash = -2044609792;
    private const string ObservationCandidateVersion = "0.109.0";
    private const string ObservationCandidateCommit = "c12f634d";
    private const int ObservationCandidateMainAssemblyHash = -840572606;
    private static readonly string[] TestedBuildFingerprints =
    {
        $"v0.108.0|{TestedCommit}|{TestedMainAssemblyHash}"
    };
    private static readonly string[] ObservationOnlySurfaceKinds = { "deck_removal_selection" };
    private static readonly string[] ActionCanarySurfaceKinds = { "deck_removal_selection" };
    private static readonly string[] InspectionCanaryKinds = { "run_deck" };
    private static readonly string[] ObservationCandidateBuildFingerprints =
    {
        $"v{ObservationCandidateVersion}|{ObservationCandidateCommit}|{ObservationCandidateMainAssemblyHash}"
    };

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

        string? version = release?.Version;
        string normalized = Normalize(version);
        bool exactVersion = Array.Exists(TestedVersions, candidate => candidate == normalized);
        bool exactBuild = exactVersion
                          && string.Equals(release?.Commit, TestedCommit, StringComparison.OrdinalIgnoreCase)
                          && release?.MainAssemblyHash == TestedMainAssemblyHash;
        bool observationCandidate = Normalize(version) == ObservationCandidateVersion
                                    && string.Equals(release?.Commit, ObservationCandidateCommit, StringComparison.OrdinalIgnoreCase)
                                    && release?.MainAssemblyHash == ObservationCandidateMainAssemblyHash;

        // This compile-time canary is deliberately build and surface scoped. It
        // exists only to establish the two merchant-removal lifecycle witnesses
        // after the natural preview.16 observation. It must never broaden v0.109
        // into a whole-build exact approval.
        bool actionCanary = observationCandidate;

        CompatibilityAssessment compatibility = exactBuild
            ? new CompatibilityAssessment(
                "supported_exact",
                TestedVersions,
                TestedBuildFingerprints,
                ActionExecutionAllowed: true,
                StateObservationAllowed: true,
                InspectionAllowed: true,
                ActionExecutionSurfaceKinds: Array.Empty<string>(),
                InspectionAllowedKinds: Array.Empty<string>(),
                ObservationOnlySurfaceKinds: Array.Empty<string>(),
                ObservationCandidateBuildFingerprints: Array.Empty<string>(),
                Detail: $"Game build {Fingerprint(release)} matches the exact tested bridge binding.")
            : actionCanary
                ? new CompatibilityAssessment(
                    "action_and_inspection_canary_candidate",
                    TestedVersions,
                    TestedBuildFingerprints,
                    ActionExecutionAllowed: true,
                    StateObservationAllowed: true,
                    InspectionAllowed: true,
                    ActionExecutionSurfaceKinds: ActionCanarySurfaceKinds,
                    InspectionAllowedKinds: InspectionCanaryKinds,
                    ObservationOnlySurfaceKinds: Array.Empty<string>(),
                    ObservationCandidateBuildFingerprints: ObservationCandidateBuildFingerprints,
                    Detail: $"Game build {Fingerprint(release)} permits only the deck_removal_selection action canary and run_deck read-only inspection canary; every other surface and inspection remain disabled.")
            : observationCandidate
                ? new CompatibilityAssessment(
                    "observation_only_candidate",
                    TestedVersions,
                    TestedBuildFingerprints,
                    ActionExecutionAllowed: false,
                    StateObservationAllowed: true,
                    InspectionAllowed: false,
                    ActionExecutionSurfaceKinds: Array.Empty<string>(),
                    InspectionAllowedKinds: Array.Empty<string>(),
                    ObservationOnlySurfaceKinds: ObservationOnlySurfaceKinds,
                    ObservationCandidateBuildFingerprints: ObservationCandidateBuildFingerprints,
                    Detail: $"Game build {Fingerprint(release)} passed static binding audit only; Bridge v2 permits read-only candidate observation for deck_removal_selection and suppresses every action and inspection.")
            : new CompatibilityAssessment(
                version == null ? "unknown" : "untested",
                TestedVersions,
                TestedBuildFingerprints,
                ActionExecutionAllowed: false,
                StateObservationAllowed: false,
                InspectionAllowed: false,
                ActionExecutionSurfaceKinds: Array.Empty<string>(),
                InspectionAllowedKinds: Array.Empty<string>(),
                ObservationOnlySurfaceKinds: Array.Empty<string>(),
                ObservationCandidateBuildFingerprints: Array.Empty<string>(),
                Detail: version == null
                    ? "Game build identity is unavailable; v2 action execution is disabled."
                    : $"Game build {Fingerprint(release)} is not an exact tested bridge binding; v2 action execution is disabled.");

        return new GameBuildIdentity(
            version,
            release?.Commit,
            release?.Branch,
            release?.MainAssemblyHash,
            compatibility);
    }

    private static string Normalize(string? version) =>
        (version ?? string.Empty).Trim().TrimStart('v', 'V');

    private static string Fingerprint(ReleaseInfo? release) =>
        release == null
            ? "unknown"
            : $"{release.Version}|{release.Commit}|{release.MainAssemblyHash}";
}
