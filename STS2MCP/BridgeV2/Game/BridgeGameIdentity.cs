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
    private const string CurrentCanaryVersion = "0.109.0";
    private const string CurrentCanaryCommit = "c12f634d";
    private const int CurrentCanaryMainAssemblyHash = 1833084275;
    private static readonly string[] TestedBuildFingerprints =
    {
        $"v0.108.0|{TestedCommit}|{TestedMainAssemblyHash}",
        $"v{ScopedQualifiedVersion}|{ScopedQualifiedCommit}|{ScopedQualifiedMainAssemblyHash}",
        $"v{CurrentCanaryVersion}|{CurrentCanaryCommit}|{CurrentCanaryMainAssemblyHash}"
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
    private static readonly string[] ScopedCanaryInspectionKinds = { "combat_piles", "shop_catalog" };
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
        "main_menu",
        "singleplayer_menu",
        "event_dialogue",
        "event_option",
        "deck_transform_selection",
        "deck_enchant_selection",
        "generated_card_choice",
        "combat_pile_card_selection"
    };
    private static readonly string[] CurrentActionCanarySurfaceKinds =
    {
        "event_option",
        "event_card_acquisition",
        "map_navigation"
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

        CompatibilityAssessment gameCompatibility = Assess(
            release?.Version,
            release?.Commit,
            release?.MainAssemblyHash);
        ModsetIdentity modset = BridgeModsetIdentity.Read();
        CompatibilityAssessment compatibility = ApplyModset(gameCompatibility, modset);

        return new GameBuildIdentity(
            release?.Version,
            release?.Commit,
            release?.Branch,
            release?.MainAssemblyHash,
            compatibility,
            modset);
    }

    internal static CompatibilityAssessment ApplyModset(
        CompatibilityAssessment gameCompatibility,
        ModsetIdentity modset)
    {
        if (modset.ExactPermissionEligible)
            return gameCompatibility;

        return new CompatibilityAssessment(
            gameCompatibility.StateObservationAllowed
                ? "unqualified_modset"
                : gameCompatibility.Status,
            gameCompatibility.TestedGameVersions,
            gameCompatibility.TestedBuildFingerprints,
            ActionExecutionAllowed: false,
            StateObservationAllowed: gameCompatibility.StateObservationAllowed,
            InspectionAllowed: false,
            ActionExecutionSurfaceKinds: Array.Empty<string>(),
            ActionCanarySurfaceKinds: Array.Empty<string>(),
            InspectionAllowedKinds: Array.Empty<string>(),
            InspectionCanaryKinds: Array.Empty<string>(),
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: gameCompatibility.ObservationCandidateBuildFingerprints,
            Detail: $"{gameCompatibility.Detail} Modset {modset.Status} ({modset.Fingerprint}) is not explicitly qualified; action and Inspection scopes fail closed.");
    }

    internal static CompatibilityAssessment Assess(
        string? version,
        string? commit,
        int? mainAssemblyHash)
    {
        string normalized = Normalize(version);
        bool fullExactBuild = normalized == "0.108.0"
                          && string.Equals(commit, TestedCommit, StringComparison.OrdinalIgnoreCase)
                          && mainAssemblyHash == TestedMainAssemblyHash;
        bool scopedQualifiedBuild = normalized == ScopedQualifiedVersion
                                    && string.Equals(commit, ScopedQualifiedCommit, StringComparison.OrdinalIgnoreCase)
                                    && mainAssemblyHash == ScopedQualifiedMainAssemblyHash;
        bool currentCanaryBuild = normalized == CurrentCanaryVersion
                                  && string.Equals(commit, CurrentCanaryCommit, StringComparison.OrdinalIgnoreCase)
                                  && mainAssemblyHash == CurrentCanaryMainAssemblyHash;

        return fullExactBuild
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
                Detail: $"Game build {Fingerprint(version, commit, mainAssemblyHash)} is a recognized historical exact identity. Current Bridge v2 actions still require an explicit per-surface qualified or canary list; this identity currently grants no v2 Surface action authority and remains eligible only for explicit legacy handoff.")
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
                    InspectionCanaryKinds: ScopedCanaryInspectionKinds,
                    ObservationOnlySurfaceKinds: Array.Empty<string>(),
                    ObservationCandidateBuildFingerprints: Array.Empty<string>(),
                Detail: $"Game build {Fingerprint(version, commit, mainAssemblyHash)} is exactly qualified for deck_removal_selection, event/rest deck_upgrade_selection, ordinary combat_turn, combat_hand_card_selection, and ordinary single-player rest_site actions plus run_deck inspection; combat_piles and shop_catalog inspections are read-only canaries; event_card_acquisition, reward_claim, card_reward_selection, map_navigation, shop_inventory, shop_room, treasure_room, ordinary single-player game_over, source-qualified Scroll Boxes card_bundle_selection, ordinary single-player character_select, purpose-specific root/single-player menu navigation, revealed-prefix ancient event_dialogue, ordinary single-player event_option, Whispering Hollow deck_transform_selection, Self-Help Book deck_enchant_selection, source-discriminated Lead Paperweight, native Colorless/Attack/Skill/Power Potion, and native Splash generated_card_choice branches, and exact Headbutt/Graveblast combat_pile_card_selection branches are limited to action canaries, and every unlisted surface and inspection remains disabled.")
            : currentCanaryBuild
                ? new CompatibilityAssessment(
                    "qualified_scoped",
                    TestedVersions,
                    TestedBuildFingerprints,
                    ActionExecutionAllowed: true,
                    StateObservationAllowed: true,
                    InspectionAllowed: false,
                    ActionExecutionSurfaceKinds: Array.Empty<string>(),
                    ActionCanarySurfaceKinds: CurrentActionCanarySurfaceKinds,
                    InspectionAllowedKinds: Array.Empty<string>(),
                    InspectionCanaryKinds: Array.Empty<string>(),
                    ObservationOnlySurfaceKinds: Array.Empty<string>(),
                    ObservationCandidateBuildFingerprints: Array.Empty<string>(),
                    Detail: $"Game build {Fingerprint(version, commit, mainAssemblyHash)} permits only the source-audited event_option, event_card_acquisition, and map_navigation action canaries; every qualified action scope, every other Surface canary, and every Inspection remain disabled pending current-build Organic Evidence.")
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
                    : $"Game build {Fingerprint(version, commit, mainAssemblyHash)} is not an exact tested bridge binding; v2 action execution is disabled.");
    }

    private static string Normalize(string? version) =>
        (version ?? string.Empty).Trim().TrimStart('v', 'V');

    private static string Fingerprint(string? version, string? commit, int? mainAssemblyHash) =>
        version == null
            ? "unknown"
            : $"{version}|{commit}|{mainAssemblyHash}";
}
