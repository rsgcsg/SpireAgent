using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.LiveHost.Contracts;
namespace STS2_MCP.Authority;

internal static class EnvironmentPermissionScopes
{
    public static bool IsActionPermitted(CompatibilityAssessment compatibility, string surfaceKind) =>
        compatibility.ActionExecutionAllowed
        && compatibility.ActionPermissionScopes.Any(scope =>
            string.Equals(scope.SurfaceKind, surfaceKind, StringComparison.Ordinal));

    public static bool IsActionPermitted(
        CompatibilityAssessment compatibility,
        string surfaceKind,
        string operation) => FindActionScope(
            compatibility,
            surfaceKind,
            operation) != null;

    public static ActionPermissionScope? FindActionScope(
        CompatibilityAssessment compatibility,
        string surfaceKind,
        string operation,
        string? sourceEvidence = null)
    {
        if (!compatibility.ActionExecutionAllowed)
            return null;

        OperationQualificationIdentity? identity =
            OperationQualificationCatalog.Describe(surfaceKind, operation);
        bool explicitContract = OperationQualificationCatalog.IsExplicitContract(
            surfaceKind,
            operation);
        string? sourceFingerprint = sourceEvidence == null
            ? null
            : BoundOperationContract.AuthorityFingerprintFor(
                surfaceKind,
                operation,
                sourceEvidence);
        return compatibility.ActionPermissionScopes.SingleOrDefault(scope =>
            string.Equals(scope.SurfaceKind, surfaceKind, StringComparison.Ordinal)
            && (explicitContract
                ? identity != null
                  && (sourceFingerprint != null
                      && string.Equals(
                          scope.OperationFingerprint,
                          sourceFingerprint,
                          StringComparison.Ordinal)
                      || scope.AdmissionBasis != "encounter_source_resolved"
                         && string.Equals(
                             scope.OperationFingerprint,
                             identity.ContractDigest,
                             StringComparison.Ordinal))
                : string.Equals(scope.Operation, operation, StringComparison.Ordinal)));
    }

    public static bool IsInspectionPermitted(CompatibilityAssessment compatibility, string inspectionKind) =>
        compatibility.InspectionAllowed
        && (compatibility.InspectionAllowedKinds.Contains(inspectionKind, StringComparer.Ordinal)
            || compatibility.InspectionCanaryKinds.Contains(inspectionKind, StringComparer.Ordinal));

    public static IReadOnlyList<string> PermittedInspectionKinds(
        CompatibilityAssessment compatibility,
        IEnumerable<string> declaredKinds) =>
        !compatibility.InspectionAllowed
            ? Array.Empty<string>()
            : declaredKinds.Where(kind => IsInspectionPermitted(compatibility, kind)).ToArray();

    public static string InspectionSupportLevel(
        CompatibilityAssessment compatibility,
        IEnumerable<string> declaredKinds)
    {
        IReadOnlyList<string> permitted = PermittedInspectionKinds(compatibility, declaredKinds);
        if (permitted.Count == 0)
            return "disabled_for_current_build";

        bool hasQualified = permitted.Any(kind =>
            compatibility.InspectionAllowedKinds.Contains(kind, StringComparer.Ordinal));
        bool hasCanary = permitted.Any(kind =>
            compatibility.InspectionCanaryKinds.Contains(kind, StringComparer.Ordinal));
        if (hasQualified && !hasCanary && compatibility.Status == "qualified_scoped")
            return "qualified_read_only_scoped";
        if (hasQualified && hasCanary && compatibility.Status == "qualified_scoped")
            return "mixed_scoped_read_only";
        return hasCanary ? "candidate_read_only_canary" : "disabled_for_current_build";
    }

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
