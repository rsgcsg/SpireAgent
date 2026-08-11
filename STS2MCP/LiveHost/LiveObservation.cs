using System;
using System.Collections.Generic;
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

internal sealed record LiveObservation(
    string Signature,
    string Readiness,
    ILiveContext Context,
    ILiveSurface Surface,
    StateCompleteness Completeness,
    GameBuildIdentity Game,
    IReadOnlyList<string> Warnings)
{
    public string CandidateAdmission { get; init; } = "business_contract";

    public AuthorityHandoff AuthorityHandoff { get; init; } = new(
        "gateway_owned",
        Surface.Kind,
        "The current semantic surface is owned by the Gateway; fallback authority is forbidden.");

    public IReadOnlyList<GatewayDiagnostic> Diagnostics { get; init; } =
        Array.Empty<GatewayDiagnostic>();
}
