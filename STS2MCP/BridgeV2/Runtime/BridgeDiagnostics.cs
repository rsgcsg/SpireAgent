using System;
using System.Collections.Generic;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal static class BridgeDiagnostics
{
    public static IReadOnlyList<BridgeDiagnostic> ForObservation(BridgeObservationDraft draft)
    {
        var result = new List<BridgeDiagnostic>(draft.Diagnostics);
        bool requiredForAction = string.Equals(
            draft.Completeness.LegalActions,
            "empty_fail_closed",
            StringComparison.Ordinal);
        foreach (string path in draft.Completeness.Missing)
        {
            result.Add(new BridgeDiagnostic(
                "bridge.completeness.missing_field",
                requiredForAction ? "error" : "warning",
                "completeness",
                requiredForAction ? "actions_suppressed" : "field_omitted",
                requiredForAction ? "change_surface" : "unknown",
                Path: path,
                RequiredForAction: requiredForAction,
                SafeDetail: "A player-visible field required by this bounded surface contract is absent."));
        }

        foreach (string warning in draft.Warnings)
        {
            result.Add(new BridgeDiagnostic(
                "bridge.compatibility.legacy_warning",
                "warning",
                "compatibility",
                "none",
                "unknown",
                SafeDetail: Bound(warning)));
        }
        return result;
    }

    public static BridgeDiagnostic Create(
        string code,
        string severity,
        string category,
        string effect,
        string recoverability,
        string? detail = null) =>
        new(code, severity, category, effect, recoverability, SafeDetail: Bound(detail));

    private static string? Bound(string? value) =>
        value == null || value.Length <= 500 ? value : value[..500];
}
