using System;
using System.Collections.Generic;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal sealed record BridgeActionStartResult(
    bool Accepted,
    string? ErrorCode,
    string? Detail,
    Func<bool>? CompletionProbe,
    string? CompletionEvidence,
    bool AllowIntermediateStateChanges)
{
    public static BridgeActionStartResult Started(
        Func<bool>? completionProbe = null,
        string? completionEvidence = null,
        bool allowIntermediateStateChanges = false) =>
        new(true, null, null, completionProbe, completionEvidence, allowIntermediateStateChanges);

    public static BridgeActionStartResult Rejected(string code, string detail) =>
        new(false, code, detail, null, null, false);
}

internal sealed record BridgeActionDraft(
    string Key,
    string Kind,
    string Category,
    string Label,
    string EvidenceCode,
    Func<BridgeActionStartResult> Start,
    IReadOnlyList<ActionEntityBinding>? EntityBindings = null);

internal sealed record BridgeObservationDraft(
    string Signature,
    string Readiness,
    IBridgeContext Context,
    IBridgeSurface Surface,
    StateCompleteness Completeness,
    GameBuildIdentity Game,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<BridgeActionDraft> Actions)
{
    public AuthorityHandoff AuthorityHandoff { get; init; } = new(
        "bridge_owned",
        Surface.Kind,
        "The current semantic surface is owned by Bridge v2; legacy action fallback is forbidden.");

    public IReadOnlyList<BridgeDiagnostic> Diagnostics { get; init; } =
        Array.Empty<BridgeDiagnostic>();
}

internal sealed record RegisteredBridgeAction(
    LegalAction Descriptor,
    Func<BridgeActionStartResult> Start);
