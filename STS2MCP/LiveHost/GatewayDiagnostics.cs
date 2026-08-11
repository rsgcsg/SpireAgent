using System;
using System.Collections.Generic;
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

internal static class GatewayDiagnostics
{
    public static IReadOnlyList<GatewayDiagnostic> ForObservation(LiveObservation draft)
    {
        var result = new List<GatewayDiagnostic>(draft.Diagnostics);
        bool requiredForAction = string.Equals(
            draft.Completeness.LegalActions,
            "empty_fail_closed",
            StringComparison.Ordinal);
        foreach (string path in draft.Completeness.Missing)
        {
            result.Add(new GatewayDiagnostic(
                "gateway.completeness.missing_field",
                requiredForAction ? "error" : "warning",
                "completeness",
                requiredForAction ? "actions_suppressed" : "field_omitted",
                requiredForAction ? "change_surface" : "unknown",
                Path: path,
                RequiredForAction: requiredForAction,
                SafeDetail: "A player-visible field required by this bounded interaction is absent."));
        }

        foreach (string warning in draft.Warnings)
        {
            result.Add(new GatewayDiagnostic(
                "gateway.compatibility.legacy_warning",
                "warning",
                "compatibility",
                "none",
                "unknown",
                SafeDetail: Bound(warning)));
        }
        return result;
    }

    public static GatewayDiagnostic Create(
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
