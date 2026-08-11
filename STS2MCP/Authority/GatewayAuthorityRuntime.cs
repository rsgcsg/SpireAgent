using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.LiveHost;
using STS2_MCP.NativeUi;

namespace STS2_MCP.Authority;

/// <summary>
/// Owns the exact live environment identity and the only mutation-admission
/// policy. Wire protocols consume this authority; no transport owns it.
/// </summary>
internal static class GatewayAuthorityRuntime
{
    private static readonly object Gate = new();
    private static readonly string RuntimeInstanceId = Guid.NewGuid().ToString("N");
    private static readonly EnvironmentPermissionManager PermissionManager =
        new(RuntimeInstanceId);
    private static readonly ConcurrentDictionary<string, string>
        QualificationSessionQuarantine = new(StringComparer.Ordinal);
    private static EnvironmentQualificationStore QualificationStore =
        EnvironmentQualificationStore.Disabled(
            sessionQuarantineReasons: QualificationSessionQuarantine);
    private static string? QualificationStorePath;
    private static string QualificationStoreFileIdentity = "not_configured";

    internal static void Configure(
        EnvironmentPermissionMode mode,
        string? qualificationStorePath)
    {
        PermissionManager.ConfigureMode(mode);
        lock (Gate)
        {
            QualificationStorePath = qualificationStorePath;
            QualificationStoreFileIdentity = "force_initial_load";
            RefreshQualificationStore();
        }
    }

    internal static GameBuildIdentity ReadCurrentGameIdentity()
    {
        RefreshQualificationStore();
        GameBuildIdentity game = LiveGameIdentity.Read();
        CompatibilityAssessment compatibility = NativeOperationManifest.WithExplicitActionScopes(
            game.Compatibility);
        if (CombatPileSourceContractRegistry.LoadError is { } registryError)
        {
            compatibility = compatibility with
            {
                ActionExecutionSurfaceKinds = compatibility.ActionExecutionSurfaceKinds
                    .Where(kind => kind != "combat_pile_card_selection")
                    .ToArray(),
                ActionCanarySurfaceKinds = compatibility.ActionCanarySurfaceKinds
                    .Where(kind => kind != "combat_pile_card_selection")
                    .ToArray(),
                ActionPermissionScopes = compatibility.ActionPermissionScopes
                    .Where(scope => scope.SurfaceKind != "combat_pile_card_selection")
                    .ToArray(),
                Detail = $"{compatibility.Detail} Combat-pile source registry failed closed: {registryError}"
            };
        }
        if (GatewayAssemblyIdentity.LoadedAssemblySha256 == null)
        {
            compatibility = compatibility with
            {
                Status = "gateway_artifact_identity_unavailable",
                ActionExecutionAllowed = false,
                InspectionAllowed = false,
                ActionExecutionSurfaceKinds = Array.Empty<string>(),
                ActionCanarySurfaceKinds = Array.Empty<string>(),
                InspectionAllowedKinds = Array.Empty<string>(),
                InspectionCanaryKinds = Array.Empty<string>(),
                ActionPermissionScopes = Array.Empty<ActionPermissionScope>(),
                Detail = $"{compatibility.Detail} The loaded Gateway assembly digest is unavailable; action and read authority fail closed."
            };
        }

        game = game with { Compatibility = compatibility };
        GatewayPatchInventoryInfo patchInventory = GatewayPatchInventory.Read();
        game = QualificationStore.Apply(game, HostIdentity(), patchInventory);
        compatibility = PermissionManager.Apply(game, HostIdentity(), patchInventory);
        return game with { Compatibility = compatibility };
    }

    internal static GatewayHostIdentity HostIdentity() => new(
        "sts2_human_environment_gateway",
        "STS2 Human Environment Gateway",
        McpMod.Version,
        "20eadebde358a37cca41f8b38728099e6d0d19db",
        typeof(McpMod).Assembly.ManifestModule.ModuleVersionId.ToString("D"),
        RuntimeInstanceId)
    {
        AssemblyFileSha256 = GatewayAssemblyIdentity.LoadedAssemblySha256 ?? string.Empty
    };

    internal static ObservationPolicyInfo ObservationPolicy() => new(
        "player_visible_ui_v1",
        "Information currently rendered by or directly available through the local player's game UI.",
        IncludesHiddenInformation: false,
        UnknownFieldBehavior: "omit_and_mark_incomplete");

    internal static LiveObservation AdmitEncounter(
        LiveObservation observation,
        IReadOnlyList<EncounterAuthorityCandidate>? authorityCandidates = null) =>
        PermissionManager.AdmitEncounter(observation, HostIdentity(), authorityCandidates);

    internal static bool AuthorizeBoundExecution(
        OperationPermissionBinding permissionBinding,
        BoundOperationContract contractBinding)
    {
        GameBuildIdentity executionGame = ReadCurrentGameIdentity();
        if (!PermissionManager.AuthorizeExecution(
                permissionBinding,
                executionGame.Compatibility,
                contractBinding))
        {
            return false;
        }
        ActionPermissionScope? executionScope =
            EnvironmentPermissionScopes.FindActionScope(
                executionGame.Compatibility,
                contractBinding.SurfaceKind,
                contractBinding.Operation);
        return executionScope != null && contractBinding.Matches(executionScope);
    }

    internal static void ObserveCommand(
        string requestId,
        OperationPermissionBinding? permissionBinding,
        GatewayCommandOutcomeEvidence response)
    {
        PermissionManager.ObserveCommand(requestId, permissionBinding, response);
        QualificationStore.ObserveCommand(requestId, permissionBinding, response);
    }

    internal static PermissionSystemInfo PermissionSnapshot() =>
        PermissionManager.Snapshot();

    internal static QualificationSystemInfo QualificationSnapshot() =>
        QualificationStore.Snapshot();

    private static void RefreshQualificationStore()
    {
        lock (Gate)
        {
            string fileIdentity = QualificationStorePath == null
                ? "not_configured"
                : File.Exists(QualificationStorePath)
                    ? FileIdentity(QualificationStorePath)
                    : "configured_missing";
            if (fileIdentity == QualificationStoreFileIdentity)
                return;

            QualificationStore = EnvironmentQualificationStore.Load(
                QualificationStorePath,
                sessionQuarantineReasons: QualificationSessionQuarantine);
            QualificationStoreFileIdentity = fileIdentity;
        }
    }

    private static string FileIdentity(string path)
    {
        try
        {
            var info = new FileInfo(path);
            return $"{info.Length}:{info.LastWriteTimeUtc.Ticks}";
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return $"unreadable:{ex.GetType().Name}";
        }
    }
}
