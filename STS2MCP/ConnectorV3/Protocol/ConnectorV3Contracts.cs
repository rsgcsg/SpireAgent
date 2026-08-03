using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.ConnectorV3.Protocol;

public static class ConnectorV3Contract
{
    public const string ProtocolVersion = "3.0-preview.11";
    public const string GatewayId = "sts2_connector_v3_gateway";
    public const string GatewayName = "STS2 Semantic Gateway";
    public const string ObservationSchema = "sts2.connector.v3/observation-1";
    public const string CommandSchema = "sts2.connector.v3/command-1";
    public const string InspectionSchema = "sts2.connector.v3/inspection-1";
    public const string LinkedDetailSchema = "sts2.connector.v3/linked-detail-1";
    public const string ControlSchema = "sts2.connector.v3/control-1";
    public const string HumanEquivalenceSchema =
        "sts2.connector.v3/human-equivalence-1";
    public const string HumanEquivalenceProfile = "native_pages.v1";
}

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
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

public sealed record ConnectorV3CapabilitiesResponse(
    string ProtocolVersion,
    string ObservationSchema,
    string CommandSchema,
    string InspectionSchema,
    string LinkedDetailSchema,
    string ControlSchema,
    string HumanEquivalenceSchema,
    string Status,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    IReadOnlyList<string> Commands,
    object Control,
    BridgePermissionSystemInfo PermissionSystem,
    BridgeQualificationSystemInfo QualificationSystem,
    ConnectorV3HumanEquivalenceCapability HumanEquivalence,
    IReadOnlyList<string> NonClaims);

public sealed record ConnectorV3ClientRegistrationRequest(
    string? ClientInstanceId,
    string? ProductId,
    string? ProductName,
    string? ProductVersion);

public sealed record ConnectorV3ControllerLeaseRequest(
    string? ClientSessionId,
    string? ControllerLeaseId,
    long? ControllerGeneration);

public sealed record ConnectorV3ClientRegistrationResponse(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    BridgeClientRecord Client,
    BridgeControllerLeaseInfo? Controller);

public sealed record ConnectorV3ControlSnapshot(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    IReadOnlyList<BridgeClientRecord> Clients,
    BridgeControllerLeaseInfo? Controller);

public sealed record ConnectorV3ControllerLeaseResponse(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    string Status,
    string Detail,
    BridgeClientRecord? Client,
    BridgeControllerLeaseInfo? Controller);

public sealed record ConnectorV3HumanEquivalenceCapability(
    string Profile,
    bool Enabled,
    IReadOnlyList<string> SupportedKinds,
    bool StateBound,
    bool RuntimeBound,
    bool DefaultInAgentFlow,
    bool CreatesActionAuthority,
    bool EntersCommandLedger);

public sealed record ConnectorV3HumanEquivalenceOpenRequest(
    string? Profile,
    string? Kind,
    string? ExpectedStateToken,
    string? ExpectedRuntimeInstanceId);

public sealed record ConnectorV3HumanEquivalenceReturnRequest(
    string? Profile,
    string? ExpectedRuntimeInstanceId);

public sealed record ConnectorV3HumanEquivalenceOwner(
    string ContextKind,
    string SurfaceKind,
    string NativeOwner);

public sealed record ConnectorV3HumanEquivalencePageRead(
    string NativePageType,
    string InspectionKind,
    int VisibleEntityCount,
    IReadOnlyList<string> VisibleEntityIds,
    IBridgeInspectionContent Content,
    InspectionCompleteness Completeness,
    IReadOnlyList<string> Evidence);

public sealed record ConnectorV3HumanEquivalenceResponse(
    string ProtocolVersion,
    string Schema,
    string SessionId,
    string Profile,
    string Kind,
    string Phase,
    string ExpectedStateToken,
    string PreStateToken,
    string? OpenedStateToken,
    string? PostStateToken,
    string ExpectedRuntimeInstanceId,
    string ObservedRuntimeInstanceId,
    ConnectorV3HumanEquivalenceOwner PreOwner,
    ConnectorV3HumanEquivalenceOwner CurrentOwner,
    ConnectorV3HumanEquivalenceOwner? PostOwner,
    ConnectorV3HumanEquivalencePageRead? Page,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    bool CreatesActionAuthority,
    bool EntersCommandLedger,
    string? ErrorCode,
    string? Detail);

public sealed record ConnectorV3OperandDomain(
    string Kind,
    IReadOnlyList<string> EntityIds);

public sealed record ConnectorV3CommandCandidate(
    string CandidateId,
    string Command,
    string Operation,
    string Label,
    IReadOnlyDictionary<string, string> Operands,
    IReadOnlyDictionary<string, ConnectorV3OperandDomain> OperandDomains,
    IReadOnlyList<ActionEntityBinding> EntityBindings,
    string BindingKind,
    string AuthorityState);

public sealed record ConnectorV3Interaction(
    string Id,
    string Kind,
    string Phase,
    string ExecutionSupport,
    string? SupportReason,
    IReadOnlyList<string> Affordances,
    IReadOnlyList<ConnectorV3CommandCandidate> CommandCandidates);

public sealed record ConnectorV3Coverage(
    string VisibleInformation,
    string InteractionDiscovery,
    string ExecutionSupport,
    IReadOnlyList<string> UnmappedVisibleControls,
    IReadOnlyList<string> HiddenByPolicy);

public sealed record ConnectorV3ObservationResponse(
    string ProtocolVersion,
    string Schema,
    string Profile,
    string StateToken,
    long Sequence,
    DateTimeOffset ObservedAt,
    string Status,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] SharedVisibleState? SharedState,
    IBridgeContext Context,
    IBridgeSurface Surface,
    ConnectorV3Interaction Interaction,
    StateCompleteness Completeness,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    BridgeVisibilityState Visibility,
    IReadOnlyList<BridgeInspectionCatalogEntry> InspectionCatalog,
    IReadOnlyList<ConnectorV3LinkedDetailCatalogEntry> LinkedDetailCatalog,
    IReadOnlyList<BridgeDiagnostic> Diagnostics,
    IReadOnlyList<string> Warnings,
    ConnectorV3Coverage Coverage);

public sealed record ConnectorV3InspectionResponse(
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

public sealed record ConnectorV3LinkedDetailCatalogEntry(
    string Kind,
    string EntityId,
    string VisibilityBasis,
    bool StateBound,
    bool CreatesActionAuthority);

public sealed record ConnectorV3LinkedDetailResponse(
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

public sealed record ConnectorV3Consumer(
    string Profile,
    string? AgentId = null,
    string? AgentVersion = null);

public sealed record ConnectorV3CommandRequest(
    string? RequestId,
    string? ExpectedStateToken,
    string? InteractionId,
    string? Command,
    IReadOnlyDictionary<string, string>? Operands,
    string? ClientSessionId = null,
    string? ControllerLeaseId = null,
    long? ControllerGeneration = null,
    ConnectorV3Consumer? Consumer = null);

public sealed record ConnectorV3CommandSummary(
    string Kind,
    IReadOnlyDictionary<string, string> Operands);

public sealed record ConnectorV3Completion(
    string Boundary,
    string Summary);

public sealed record ConnectorV3RetryPolicy(
    bool Allowed,
    string Reason);

public sealed record ConnectorV3Successor(
    string Status,
    string? StateToken);

public sealed record ConnectorV3CommandReceipt(
    string ProtocolVersion,
    string RequestId,
    string Status,
    string Application,
    ConnectorV3CommandSummary Command,
    string? ReasonCode,
    string? Detail,
    ConnectorV3Completion? Completion,
    ConnectorV3RetryPolicy Retry,
    ConnectorV3Successor Successor,
    IReadOnlyList<BridgeCommandEvent> Events)
{
    public BridgeCommandAttribution? Attribution { get; init; }
}
