using System;

namespace STS2_MCP.NativeUi;

internal static class NativeUiCompletionBoundary
{
    internal const string SemanticObserved =
        "gateway_semantic_completion_observed";
}

internal sealed record NativeInputResult(
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
    public static NativeInputResult Started(
        Func<bool>? completionProbe = null,
        string? completionEvidence = null,
        bool allowIntermediateStateChanges = false,
        string completionBoundary = NativeUiCompletionBoundary.SemanticObserved,
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

    public static NativeInputResult Rejected(string code, string detail) =>
        new(
            false,
            code,
            detail,
            null,
            null,
            false,
            NativeUiCompletionBoundary.SemanticObserved,
            null,
            null);
}
