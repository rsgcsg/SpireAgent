using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.ConnectorV3.Protocol;

public static class ConnectorV3Contract
{
    public const string ProtocolVersion = "3.0-preview.3";
    public const string ObservationSchema = "sts2.connector.v3/observation-1";
    public const string CommandSchema = "sts2.connector.v3/command-1";
    public const string InspectionSchema = "sts2.connector.v3/inspection-1";
}

public sealed record ConnectorV3CapabilitiesResponse(
    string ProtocolVersion,
    string ObservationSchema,
    string CommandSchema,
    string InspectionSchema,
    string Status,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    IReadOnlyList<string> Commands,
    object Control,
    IReadOnlyList<string> NonClaims);

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
