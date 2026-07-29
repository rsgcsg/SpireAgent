using System;
using System.Linq;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal sealed record BridgeCurrentIdentityProjection(
    string SemanticStateId,
    string AuthorityProjectionId,
    string StateSignature);

/// <summary>
/// Separates player-visible semantic identity from the current executable
/// authority projection. Append-only control history is intentionally absent.
/// </summary>
internal static class BridgeCurrentIdentityProjectionBuilder
{
    public static BridgeCurrentIdentityProjection Build(
        BridgeObservationDraft draft,
        SharedVisibleState? sharedState,
        BridgeVisibilityProjection visibility)
    {
        string semanticStateId = "semantic_state_" + BridgeHash.Object(new
        {
            providerSignature = draft.Signature,
            draft.Context,
            draft.Surface,
            draft.Completeness,
            sharedState,
            visibility.Visibility,
            visibility.InspectionCatalog
        });

        var actions = draft.Actions
            .Select(action => new
            {
                action.Kind,
                action.Key,
                contract = BridgeBoundActionContract.Build(draft.Surface.Kind, action)
            })
            .Select(action => new
            {
                action.Kind,
                action.Key,
                contractDigest = action.contract?.ContractDigest,
                sourceEvidenceDigest = action.contract?.SourceEvidenceDigest,
                operandDigest = action.contract?.OperandDigest,
                boundActionDigest = action.contract?.BoundActionDigest
            })
            .Distinct()
            .OrderBy(action => action.Kind, StringComparer.Ordinal)
            .ThenBy(action => action.Key, StringComparer.Ordinal)
            .ToArray();
        string[] actionKinds = actions
            .Select(action => action.Kind)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        string[] explicitContractDigests = draft.Actions
            .Select(action => BridgeBoundActionContract.Build(draft.Surface.Kind, action))
            .Where(contract => contract?.ContractKind
                == BridgeOperationQualificationCatalog.ExplicitNativeContract)
            .Select(contract => contract!.ContractDigest)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        var relevantScopes = draft.Game.Compatibility.ActionPermissionScopes
            .Where(scope =>
                string.Equals(scope.SurfaceKind, draft.Surface.Kind, StringComparison.Ordinal)
                && (explicitContractDigests.Contains(
                        scope.OperationFingerprint,
                        StringComparer.Ordinal)
                    || (!BridgeOperationQualificationCatalog.IsExplicitContract(
                            scope.SurfaceKind,
                            scope.Operation)
                        && actionKinds.Contains(scope.Operation, StringComparer.Ordinal))))
            .Select(scope => new
            {
                scope.SurfaceKind,
                scope.Operation,
                scope.Tier,
                scope.GrantId,
                scope.GrantVersion,
                scope.RuntimeEpoch,
                scope.EnvironmentDigest,
                scope.PatchDigest,
                scope.OperationFingerprint,
                scope.AdmissionBasis
            })
            .OrderBy(scope => scope.Operation, StringComparer.Ordinal)
            .ThenBy(scope => scope.Tier, StringComparer.Ordinal)
            .ThenBy(scope => scope.GrantId, StringComparer.Ordinal)
            .ThenBy(scope => scope.GrantVersion)
            .ToArray();
        string[] inspectionKinds = draft.Game.Compatibility.InspectionAllowedKinds
            .Concat(draft.Game.Compatibility.InspectionCanaryKinds)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(kind => kind, StringComparer.Ordinal)
            .ToArray();
        string authorityProjectionId = "authority_projection_" + BridgeHash.Object(new
        {
            environment = new
            {
                draft.Game.Version,
                draft.Game.Commit,
                draft.Game.MainAssemblyHash,
                modsetFingerprint = draft.Game.Modset?.Fingerprint,
                draft.Game.Compatibility.CompatibilityPolicyDigest
            },
            surfaceKind = draft.Surface.Kind,
            draft.Readiness,
            authorityHandoff = draft.AuthorityHandoff,
            draft.Game.Compatibility.ActionExecutionAllowed,
            actions,
            relevantScopes,
            inspectionKinds,
            visibility.InspectionCatalog
        });

        return new BridgeCurrentIdentityProjection(
            semanticStateId,
            authorityProjectionId,
            BridgeHash.Object(new { semanticStateId, authorityProjectionId }));
    }
}
