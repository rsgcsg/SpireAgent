using System.Collections.Generic;

namespace STS2_MCP.LiveHost.Contracts;

public sealed record EventDeckRemovalSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string SourceKind,
    string Purpose,
    string Prompt,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    IReadOnlyList<string> SelectableCardEntityIds,
    IReadOnlyList<string> DeselectableCardEntityIds,
    bool CanCancelPreview,
    bool CanConfirm,
    IReadOnlyList<string> ExpectedEffects,
    IReadOnlyList<VisibleCard> Cards) : ILiveSurface;
