using System;
using System.Collections.Generic;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Builds a non-authorizing observation when a provider recognizes the active
/// UI owner but cannot prove its exact semantic binding. This helper never
/// creates actions or legacy fallback authority.
/// </summary>
internal static class BridgeFailClosedObservation
{
    internal static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        IBridgeContext context,
        string sourceType,
        string reason,
        IReadOnlyList<string> sources,
        IReadOnlyList<string> missing,
        string warning,
        string diagnosticCode,
        string authorityReason)
    {
        var surface = new UnsupportedSurface("unsupported", sourceType, reason);
        var completeness = new StateCompleteness(
            "degraded",
            "empty_fail_closed",
            sources,
            missing);
        string signature = BridgeHash.Object(new { game.Version, context, surface, missing });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            surface,
            completeness,
            game,
            new[] { warning },
            Array.Empty<BridgeActionDraft>())
        {
            AuthorityHandoff = new AuthorityHandoff(
                "none_fail_closed",
                null,
                authorityReason),
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    diagnosticCode,
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}
