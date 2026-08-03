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
    bool AllowIntermediateStateChanges,
    string CompletionBoundary,
    Func<string?>? CompletionEvidenceProvider,
    Func<string?>? CompletionBoundaryProvider)
{
    public static BridgeActionStartResult Started(
        Func<bool>? completionProbe = null,
        string? completionEvidence = null,
        bool allowIntermediateStateChanges = false,
        string completionBoundary = BridgeOperationQualificationCatalog.GatewayCompletionBoundary,
        Func<string?>? completionEvidenceProvider = null,
        Func<string?>? completionBoundaryProvider = null) =>
        new(
            true,
            null,
            null,
            completionProbe,
            completionEvidence,
            allowIntermediateStateChanges,
            completionBoundary,
            completionEvidenceProvider,
            completionBoundaryProvider);

    public static BridgeActionStartResult Rejected(string code, string detail) =>
        new(
            false,
            code,
            detail,
            null,
            null,
            false,
            BridgeOperationQualificationCatalog.GatewayCompletionBoundary,
            null,
            null);
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
        "The current semantic surface is owned by the Gateway; legacy action fallback is forbidden.");

    public IReadOnlyList<BridgeDiagnostic> Diagnostics { get; init; } =
        Array.Empty<BridgeDiagnostic>();
}

internal sealed record RegisteredBridgeAction(
    LegalAction Descriptor,
    Func<BridgeActionStartResult> Start,
    BridgeActionPermissionBinding? PermissionBinding = null,
    BridgeBoundActionContract? ContractBinding = null);
