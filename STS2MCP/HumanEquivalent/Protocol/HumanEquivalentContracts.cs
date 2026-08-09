using System;
using System.Collections.Generic;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.ConnectorV3.Protocol;

namespace STS2_MCP.HumanEquivalent.Protocol;

public static class HumanEquivalentContract
{
    public const string ProtocolVersion = "1.0-preview.2";
    public const string GatewayId = "sts2_human_equivalent_connector";
    public const string GatewayName = "STS2 Human-Equivalent Connector";
    public const string ObservationSchema = "sts2.connector.human-ui/observation-2";
    public const string ActionSchema = "sts2.connector.human-ui/action-2";
    public const string ReceiptSchema = "sts2.connector.human-ui/receipt-2";
    public const string InspectionSchema = "sts2.connector.human-ui/inspection-1";
    public const string LinkedDetailSchema = "sts2.connector.human-ui/linked-detail-1";
    public const string ControlSchema = "sts2.connector.human-ui/control-1";
}

public sealed record HumanEquivalentCapabilitiesResponse(
    string ProtocolVersion,
    string ObservationSchema,
    string ActionSchema,
    string ReceiptSchema,
    string ControlSchema,
    string Status,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    IReadOnlyList<string> Actions,
    bool StateBound,
    bool SingleController,
    bool BusinessSourceRequired,
    bool BusinessOutcomeRequired,
    bool ExecutionAvailable,
    object Control,
    IReadOnlyList<string> NonClaims);

// Controller coordination is transport-neutral infrastructure. The Human-
// Equivalent route owns its wire names even though the game-side coordinator
// is shared with the historical connector implementations.
public sealed record HumanEquivalentClientRegistrationRequest(
    string? ClientInstanceId,
    string? ProductId,
    string? ProductName,
    string? ProductVersion);

public sealed record HumanEquivalentControllerLeaseRequest(
    string? ClientSessionId,
    string? ControllerLeaseId,
    long? ControllerGeneration);

public sealed record HumanEquivalentClientRegistrationResponse(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    BridgeClientRecord Client,
    BridgeControllerLeaseInfo? Controller);

public sealed record HumanEquivalentControlSnapshot(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    IReadOnlyList<BridgeClientRecord> Clients,
    BridgeControllerLeaseInfo? Controller);

public sealed record HumanEquivalentControllerLeaseResponse(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    string Status,
    string Detail,
    BridgeClientRecord? Client,
    BridgeControllerLeaseInfo? Controller);

public sealed record HumanEquivalentOwner(
    string OwnerId,
    string Kind);

public sealed record HumanEquivalentUiSurface(
    string Kind,
    string Stage,
    string? Prompt,
    JsonNode Facts);

/// <summary>
/// Player-visible state of the native deck-card selector. This intentionally
/// describes UI mechanics only: the card, relic, event or reward that opened
/// the selector is not action authority in Human-Equivalent mode.
/// </summary>
public sealed record HumanDeckCardSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string? Prompt,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    IReadOnlyList<string> SelectableCardEntityIds,
    IReadOnlyList<string> DeselectableCardEntityIds,
    bool Cancelable,
    bool CanPreview,
    bool CanCancelSelection,
    bool CanCancelPreview,
    bool CanConfirm,
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

/// <summary>
/// Player-visible mechanics of the native combat-pile selector. Business
/// source, destination and eventual effect are deliberately absent.
/// </summary>
public sealed record HumanCombatPileSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string? Prompt,
    string PileType,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    IReadOnlyList<string> SelectableCardEntityIds,
    IReadOnlyList<string> DeselectableCardEntityIds,
    bool Cancelable,
    bool CanCancel,
    bool CanConfirm,
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

public sealed record HumanEquivalentUiEntity(
    string EntityId,
    string Kind,
    string? Label,
    bool Visible,
    bool Enabled,
    bool Selected,
    JsonNode? Detail);

public sealed record HumanEquivalentUiControl(
    string ControlId,
    string OwnerId,
    string Role,
    string? Label,
    bool Visible,
    bool Enabled,
    bool? Selected,
    bool? Focused,
    IReadOnlyList<string> Actions);

public sealed record HumanEquivalentAffordance(
    string AffordanceId,
    string Action,
    string TargetId,
    string OwnerId,
    string Label,
    string Provenance);

public sealed record HumanEquivalentCoverage(
    string VisibleInformation,
    string InteractionDiscovery,
    string ExecutionSupport,
    IReadOnlyList<string> UnmappedVisibleControls,
    IReadOnlyList<string> HiddenByPolicy);

public sealed record HumanEquivalentLinkedDetailCatalogEntry(
    string Kind,
    string EntityId,
    string VisibilityBasis,
    bool StateBound,
    bool CreatesActionAuthority);

public sealed record HumanEquivalentObservationResponse(
    string ProtocolVersion,
    string Schema,
    string StateToken,
    long Sequence,
    DateTimeOffset ObservedAt,
    string Status,
    HumanEquivalentOwner Owner,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] SharedVisibleState? PersistentState,
    HumanEquivalentUiSurface Surface,
    IReadOnlyList<HumanEquivalentUiEntity> Entities,
    IReadOnlyList<HumanEquivalentUiControl> Controls,
    IReadOnlyList<HumanEquivalentAffordance> Affordances,
    StateCompleteness Completeness,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    BridgeVisibilityState Visibility,
    IReadOnlyList<BridgeInspectionCatalogEntry> InspectionCatalog,
    IReadOnlyList<HumanEquivalentLinkedDetailCatalogEntry> LinkedDetailCatalog,
    IReadOnlyList<BridgeDiagnostic> Diagnostics,
    IReadOnlyList<string> Warnings,
    HumanEquivalentCoverage Coverage);

public sealed record HumanEquivalentInspectionResponse(
    string ProtocolVersion,
    string Schema,
    string InspectionId,
    string ExpectedStateToken,
    string ObservedStateToken,
    DateTimeOffset ObservedAt,
    string Kind,
    string VisibilityClass,
    string OrderingSemantics,
    IBridgeInspectionContent Content,
    InspectionCompleteness Completeness,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    IReadOnlyList<BridgeDiagnostic> Diagnostics);

public sealed record HumanEquivalentLinkedDetailResponse(
    string ProtocolVersion,
    string Schema,
    string DetailId,
    string ExpectedStateToken,
    string ObservedStateToken,
    DateTimeOffset ObservedAt,
    string Kind,
    string EntityId,
    VisibleCard Content,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    IReadOnlyList<BridgeDiagnostic> Diagnostics);

public sealed record HumanEquivalentActionRequest(
    string? RequestId,
    string? ExpectedStateToken,
    string? AffordanceId,
    string? ClientSessionId,
    string? ControllerLeaseId,
    long? ControllerGeneration);

public sealed record HumanEquivalentActionSummary(
    string AffordanceId,
    string Action,
    string TargetId);

public sealed record HumanEquivalentRetryPolicy(
    bool Allowed,
    string Reason);

public sealed record HumanEquivalentActionReceipt(
    string ProtocolVersion,
    string Schema,
    string RequestId,
    string Status,
    string Delivery,
    HumanEquivalentActionSummary Action,
    string? ReasonCode,
    string? Detail,
    HumanEquivalentRetryPolicy Retry,
    HumanEquivalentObservationResponse? Successor)
{
    public BridgeCommandAttribution? Attribution { get; init; }
}
