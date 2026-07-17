using System;
using MegaCrit.Sts2.Core.Debug;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeGameIdentity
{
    private static readonly string[] TestedVersions = { "0.108.0", "0.109.0" };
    private const string TestedCommit = "58694f64";
    private const int TestedMainAssemblyHash = -2044609792;
    private const string ScopedQualifiedVersion = "0.109.0";
    private const string ScopedQualifiedCommit = "c12f634d";
    private const int ScopedQualifiedMainAssemblyHash = -840572606;
    private static readonly string[] TestedBuildFingerprints =
    {
        $"v0.108.0|{TestedCommit}|{TestedMainAssemblyHash}",
        $"v{ScopedQualifiedVersion}|{ScopedQualifiedCommit}|{ScopedQualifiedMainAssemblyHash}"
    };
    private static readonly string[] ScopedQualifiedSurfaceKinds =
    {
        "deck_removal_selection",
        "deck_upgrade_selection",
        "combat_turn",
        "combat_hand_card_selection",
        "rest_site"
    };
    private static readonly string[] ScopedQualifiedInspectionKinds = { "run_deck" };
    private static readonly string[] ScopedActionCanarySurfaceKinds =
    {
        "event_card_acquisition",
        "reward_claim",
        "card_reward_selection",
        "map_navigation",
        "shop_inventory",
        "shop_room",
        "treasure_room",
        "game_over",
        "card_bundle_selection",
        "character_select",
        "event_dialogue",
        "event_option"
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
        bool fullExactBuild = normalized == "0.108.0"
                          && string.Equals(release?.Commit, TestedCommit, StringComparison.OrdinalIgnoreCase)
                          && release?.MainAssemblyHash == TestedMainAssemblyHash;
        bool scopedQualifiedBuild = normalized == ScopedQualifiedVersion
                                    && string.Equals(release?.Commit, ScopedQualifiedCommit, StringComparison.OrdinalIgnoreCase)
                                    && release?.MainAssemblyHash == ScopedQualifiedMainAssemblyHash;

        CompatibilityAssessment compatibility = fullExactBuild
            ? new CompatibilityAssessment(
                "supported_exact",
                TestedVersions,
                TestedBuildFingerprints,
                ActionExecutionAllowed: true,
                StateObservationAllowed: true,
                InspectionAllowed: true,
                ActionExecutionSurfaceKinds: Array.Empty<string>(),
                ActionCanarySurfaceKinds: Array.Empty<string>(),
                InspectionAllowedKinds: Array.Empty<string>(),
                InspectionCanaryKinds: Array.Empty<string>(),
                ObservationOnlySurfaceKinds: Array.Empty<string>(),
                ObservationCandidateBuildFingerprints: Array.Empty<string>(),
                Detail: $"Game build {Fingerprint(release)} matches the exact tested bridge binding.")
            : scopedQualifiedBuild
                ? new CompatibilityAssessment(
                    "qualified_scoped",
                    TestedVersions,
                    TestedBuildFingerprints,
                    ActionExecutionAllowed: true,
                    StateObservationAllowed: true,
                    InspectionAllowed: true,
                    ActionExecutionSurfaceKinds: ScopedQualifiedSurfaceKinds,
                    ActionCanarySurfaceKinds: ScopedActionCanarySurfaceKinds,
                    InspectionAllowedKinds: ScopedQualifiedInspectionKinds,
                    InspectionCanaryKinds: Array.Empty<string>(),
                    ObservationOnlySurfaceKinds: Array.Empty<string>(),
                    ObservationCandidateBuildFingerprints: Array.Empty<string>(),
                Detail: $"Game build {Fingerprint(release)} is exactly qualified for deck_removal_selection, event/rest deck_upgrade_selection, ordinary combat_turn, combat_hand_card_selection, and ordinary single-player rest_site actions plus run_deck inspection; event_card_acquisition, reward_claim, card_reward_selection, map_navigation, shop_inventory, shop_room, treasure_room, ordinary single-player game_over, source-qualified Scroll Boxes card_bundle_selection, ordinary single-player character_select, revealed-prefix ancient event_dialogue, and ordinary single-player event_option are limited to action canaries, and every unlisted surface and inspection remains disabled.")
            : new CompatibilityAssessment(
                version == null ? "unknown" : "untested",
                TestedVersions,
                TestedBuildFingerprints,
                ActionExecutionAllowed: false,
                StateObservationAllowed: false,
                InspectionAllowed: false,
                ActionExecutionSurfaceKinds: Array.Empty<string>(),
                ActionCanarySurfaceKinds: Array.Empty<string>(),
                InspectionAllowedKinds: Array.Empty<string>(),
                InspectionCanaryKinds: Array.Empty<string>(),
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
