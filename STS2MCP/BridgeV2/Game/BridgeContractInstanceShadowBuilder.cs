using System;
using System.Linq;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Audits how the current semantic contract maps onto the legacy exact-environment
/// Surface gate. This inventory is intentionally non-authorizing.
/// </summary>
internal static class BridgeContractInstanceShadowBuilder
{
    public static BridgeContractInstanceShadow Build(BridgeObservationDraft draft)
    {
        BridgeContractManifestEntry? manifest = BridgeContractManifest.Find(draft.Surface.Kind);
        string[] published = draft.Actions
            .Select(action => action.Kind)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        BridgeContractOperationShadow[] operations = manifest?.Operations
            .Select(operation => new BridgeContractOperationShadow(
                operation.Operation,
                EvidenceName(operation.EvidenceStatus),
                published.Contains(operation.Operation, StringComparer.Ordinal)))
            .ToArray()
            ?? published.Select(operation => new BridgeContractOperationShadow(
                operation,
                "unregistered",
                Published: true)).ToArray();
        string authorityTier = CurrentAuthorityTier(draft);
        string? semanticContractId = manifest == null
            ? null
            : $"bridge.surface.{manifest.Kind}.{manifest.ProtocolRevision}";
        string instanceId = "contract_instance_" + BridgeHash.Object(new
        {
            draft.Signature,
            semanticContractId,
            operations = operations.Select(operation => new
            {
                operation.Operation,
                operation.EvidenceStatus,
                operation.Published
            })
        })[..20];

        return new BridgeContractInstanceShadow(
            manifest == null ? "unresolved" : "resolved_manifest_contract",
            instanceId,
            draft.Surface.Kind,
            semanticContractId,
            manifest?.SourceBindingId,
            operations,
            authorityTier,
            "exact_environment_surface_kind_gate",
            Authorizing: false,
            new[]
            {
                "shadow_inventory_only",
                "manifest_binding_is_not_runtime_binding_proof",
                "operation_evidence_does_not_grant_permission",
                "authority_remains_surface_kind_scoped"
            });
    }

    private static string CurrentAuthorityTier(BridgeObservationDraft draft)
    {
        CompatibilityAssessment compatibility = draft.Game.Compatibility;
        if (draft.AuthorityHandoff.Status == "bridge_owned"
            && compatibility.ActionExecutionAllowed
            && compatibility.ActionExecutionSurfaceKinds.Contains(draft.Surface.Kind, StringComparer.Ordinal))
            return "qualified";
        if (draft.AuthorityHandoff.Status == "bridge_owned"
            && compatibility.ActionExecutionAllowed
            && compatibility.ActionCanarySurfaceKinds.Contains(draft.Surface.Kind, StringComparer.Ordinal))
            return "canary";
        if (compatibility.StateObservationAllowed
            && compatibility.ObservationOnlySurfaceKinds.Contains(draft.Surface.Kind, StringComparer.Ordinal))
            return "observation_only";
        return "disabled";
    }

    private static string EvidenceName(BridgeOperationEvidenceStatus status) => status switch
    {
        BridgeOperationEvidenceStatus.SurfaceLevelOnly => "surface_level_only",
        BridgeOperationEvidenceStatus.SourceAudited => "source_audited",
        BridgeOperationEvidenceStatus.OrganicCanaryExercised => "organic_canary_exercised",
        BridgeOperationEvidenceStatus.OrganicQualified => "organic_qualified",
        _ => "unknown"
    };
}
