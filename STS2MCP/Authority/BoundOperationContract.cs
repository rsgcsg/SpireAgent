using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.NativeUi;

namespace STS2_MCP.Authority;

/// <summary>
/// Binds a catalog contract to one exact advertised action. The provider still
/// owns native legality, commit, and completion; this only prevents authority
/// for one contract from being reused after contract or operand drift.
/// </summary>
internal sealed record BoundOperationContract(
    string SurfaceKind,
    string Operation,
    string ContractDigest,
    string AuthorityFingerprint,
    string SourceEvidenceDigest,
    string OperandDigest,
    string BoundActionDigest,
    string CompletionBoundary,
    string WitnessId,
    string ContractKind)
{
    public static BoundOperationContract? Build(
        string surfaceKind,
        string actionKey,
        string operation,
        string evidenceCode,
        IReadOnlyList<ActionEntityBinding>? entityBindings)
    {
        OperationQualificationIdentity? identity =
            OperationQualificationCatalog.Describe(surfaceKind, operation);
        if (identity == null)
            return null;

        string sourceEvidenceDigest = StableIdentityHash.Text(evidenceCode);
        string authorityFingerprint = BuildAuthorityFingerprint(
            identity.ContractDigest,
            sourceEvidenceDigest);
        string operandDigest = StableIdentityHash.Object(new
        {
            Key = actionKey,
            bindings = (entityBindings ?? Array.Empty<ActionEntityBinding>())
                .OrderBy(binding => binding.Role, StringComparer.Ordinal)
                .ThenBy(binding => binding.EntityId, StringComparer.Ordinal)
                .ToArray()
        });
        string boundActionDigest = StableIdentityHash.Object(new
        {
            identity.ContractDigest,
            sourceEvidenceDigest,
            operandDigest
        });
        return new BoundOperationContract(
            surfaceKind,
            operation,
            identity.ContractDigest,
            authorityFingerprint,
            sourceEvidenceDigest,
            operandDigest,
            boundActionDigest,
            identity.CompletionBoundary,
            identity.WitnessId,
            identity.ContractKind);
    }

    public bool Matches(ActionPermissionScope scope)
    {
        OperationQualificationIdentity? current =
            OperationQualificationCatalog.Describe(SurfaceKind, Operation);
        return current != null
            && string.Equals(scope.SurfaceKind, SurfaceKind, StringComparison.Ordinal)
            && (ContractKind == OperationQualificationCatalog.ManifestMigrationFallback
                ? string.Equals(scope.Operation, Operation, StringComparison.Ordinal)
                : true)
            && (string.Equals(
                    scope.OperationFingerprint,
                    AuthorityFingerprint,
                    StringComparison.Ordinal)
                || scope.AdmissionBasis != "encounter_source_resolved"
                   && string.Equals(
                       scope.OperationFingerprint,
                       ContractDigest,
                       StringComparison.Ordinal))
            && string.Equals(current.ContractDigest, ContractDigest, StringComparison.Ordinal);
    }

    public static string? AuthorityFingerprintFor(
        string surfaceKind,
        string operation,
        string sourceEvidence)
    {
        OperationQualificationIdentity? identity =
            OperationQualificationCatalog.Describe(surfaceKind, operation);
        return identity == null
            ? null
            : BuildAuthorityFingerprint(
                identity.ContractDigest,
                StableIdentityHash.Text(sourceEvidence));
    }

    private static string BuildAuthorityFingerprint(
        string contractDigest,
        string sourceEvidenceDigest) =>
        StableIdentityHash.Object(new
        {
            contractDigest,
            sourceEvidenceDigest
        });
}
