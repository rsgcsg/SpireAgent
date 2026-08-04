using System;
using System.Collections.Generic;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.ConnectorV3.Protocol;

namespace STS2_MCP.HumanEquivalent.Protocol;

public static class HumanEquivalentContract
{
    public const string ProtocolVersion = "1.0-preview.1";
    public const string GatewayId = "sts2_human_equivalent_connector";
    public const string GatewayName = "STS2 Human-Equivalent Connector";
    public const string ObservationSchema = "sts2.connector.human-ui/observation-1";
    public const string ActionSchema = "sts2.connector.human-ui/action-1";
    public const string ReceiptSchema = "sts2.connector.human-ui/receipt-1";
    public const string InspectionSchema = "sts2.connector.human-ui/inspection-1";
    public const string LinkedDetailSchema = "sts2.connector.human-ui/linked-detail-1";
    public const string ControlSchema = "sts2.connector.human-ui/control-1";
    public const string AssistedMode = "he_assisted";
    public const string PureMode = "he_pure";
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
    IReadOnlyList<string> Modes,
    IReadOnlyList<string> Actions,
    bool StateBound,
    bool FrameBound,
    bool SingleController,
    bool BusinessSourceRequired,
    bool BusinessOutcomeRequired,
    bool ExecutionAvailable,
    object Control,
    IReadOnlyList<string> NonClaims);

public sealed record HumanEquivalentFrame(
    string FrameId,
    int Width,
    int Height,
    string Provenance);

public sealed record HumanEquivalentOwner(
    string OwnerId,
    string Kind);

public sealed record HumanEquivalentUiSurface(
    string Kind,
    string Stage,
    string? Prompt,
    JsonNode Facts);

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
    bool Selected,
    bool Focused,
    IReadOnlyList<string> Actions);

public sealed record HumanEquivalentParameterDomain(
    string Kind,
    IReadOnlyList<string> EntityIds);

public sealed record HumanEquivalentAffordance(
    string AffordanceId,
    string Action,
    string TargetId,
    string OwnerId,
    string Label,
    IReadOnlyDictionary<string, string> Parameters,
    IReadOnlyDictionary<string, HumanEquivalentParameterDomain> ParameterDomains,
    IReadOnlyList<ActionEntityBinding> EntityBindings,
    string Provenance);

public sealed record HumanEquivalentAnnotationEnvelope(
    string? SceneHint,
    string? PurposeHint,
    string? PhaseHint,
    string? ExpectedTransition,
    bool TeacherGenerated,
    string AuthorizationEffect);

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
    string Mode,
    string StateToken,
    long Sequence,
    DateTimeOffset ObservedAt,
    string Status,
    HumanEquivalentFrame Frame,
    HumanEquivalentOwner Owner,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] SharedVisibleState? PersistentState,
    HumanEquivalentUiSurface Surface,
    IReadOnlyList<HumanEquivalentUiEntity> Entities,
    IReadOnlyList<HumanEquivalentUiControl> Controls,
    IReadOnlyList<HumanEquivalentAffordance> Affordances,
    HumanEquivalentAnnotationEnvelope? OptionalAnnotations,
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
    string? Mode,
    string? ExpectedStateToken,
    string? ExpectedFrameId,
    string? ExpectedOwnerId,
    string? AffordanceId,
    IReadOnlyDictionary<string, string>? Parameters,
    string? ClientSessionId,
    string? ControllerLeaseId,
    long? ControllerGeneration);

public sealed record HumanEquivalentActionSummary(
    string AffordanceId,
    string Action,
    string TargetId,
    IReadOnlyDictionary<string, string> Parameters);

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
