using System;
using System.Collections.Generic;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal sealed record BridgeActionStartResult(
    bool Accepted,
    string? ErrorCode,
    string? Detail,
    Func<bool>? CompletionProbe,
    string? CompletionEvidence)
{
    public static BridgeActionStartResult Started(
        Func<bool>? completionProbe = null,
        string? completionEvidence = null) =>
        new(true, null, null, completionProbe, completionEvidence);

    public static BridgeActionStartResult Rejected(string code, string detail) =>
        new(false, code, detail, null, null);
}

internal sealed record BridgeActionDraft(
    string Key,
    string Kind,
    string Category,
    string Label,
    string EvidenceCode,
    Func<BridgeActionStartResult> Start);

internal sealed record BridgeObservationDraft(
    string Signature,
    string Readiness,
    IBridgeSurface Surface,
    StateCompleteness Completeness,
    GameBuildIdentity Game,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<BridgeActionDraft> Actions);

internal sealed record RegisteredBridgeAction(
    LegalAction Descriptor,
    Func<BridgeActionStartResult> Start);
