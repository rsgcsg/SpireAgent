using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

/// <summary>
/// Binds a catalog contract to one exact advertised action. The provider still
/// owns native legality, commit, and completion; this only prevents authority
/// for one contract from being reused after contract or operand drift.
/// </summary>
internal sealed record BridgeBoundActionContract(
    string SurfaceKind,
    string Operation,
    string ContractDigest,
    string SourceEvidenceDigest,
    string OperandDigest,
    string BoundActionDigest,
    string CompletionBoundary,
    string WitnessId,
    string ContractKind)
{
    public static BridgeBoundActionContract? Build(
        string surfaceKind,
        BridgeActionDraft action) =>
        Build(
            surfaceKind,
            action.Key,
            action.Kind,
            action.EvidenceCode,
            action.EntityBindings);

    public static BridgeBoundActionContract? Build(
        string surfaceKind,
        string actionKey,
        string operation,
        string evidenceCode,
        IReadOnlyList<ActionEntityBinding>? entityBindings)
    {
        BridgeOperationQualificationIdentity? identity =
            BridgeOperationQualificationCatalog.Describe(surfaceKind, operation);
        if (identity == null)
            return null;

        string sourceEvidenceDigest = BridgeHash.Text(evidenceCode);
        string operandDigest = BridgeHash.Object(new
        {
            Key = actionKey,
            bindings = (entityBindings ?? Array.Empty<ActionEntityBinding>())
                .OrderBy(binding => binding.Role, StringComparer.Ordinal)
                .ThenBy(binding => binding.EntityId, StringComparer.Ordinal)
                .ToArray()
        });
        string boundActionDigest = BridgeHash.Object(new
        {
            identity.ContractDigest,
            sourceEvidenceDigest,
            operandDigest
        });
        return new BridgeBoundActionContract(
            surfaceKind,
            operation,
            identity.ContractDigest,
            sourceEvidenceDigest,
            operandDigest,
            boundActionDigest,
            identity.CompletionBoundary,
            identity.WitnessId,
            identity.ContractKind);
    }

    public bool Matches(ActionPermissionScope scope)
    {
        BridgeOperationQualificationIdentity? current =
            BridgeOperationQualificationCatalog.Describe(SurfaceKind, Operation);
        return current != null
            && string.Equals(scope.SurfaceKind, SurfaceKind, StringComparison.Ordinal)
            && (ContractKind == BridgeOperationQualificationCatalog.ManifestMigrationFallback
                ? string.Equals(scope.Operation, Operation, StringComparison.Ordinal)
                : true)
            && string.Equals(scope.OperationFingerprint, ContractDigest, StringComparison.Ordinal)
            && string.Equals(current.ContractDigest, ContractDigest, StringComparison.Ordinal);
    }
}
