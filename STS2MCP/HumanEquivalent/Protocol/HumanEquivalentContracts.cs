using System;
using System.Collections.Generic;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace STS2_MCP.HumanEquivalent.Protocol;

/// <summary>
/// The fair-player environment boundary shared by Live UI and future hosts.
/// Host lifecycle, rewards, strategy and privileged simulation are outside it.
/// </summary>
public static class HumanEquivalentContract
{
    public const string ProtocolVersion = "1.0-preview.4";
    public const string GatewayId = "sts2_human_environment";
    public const string GatewayName = "STS2 Human Environment";
    public const string ObservationSchema = "sts2.human-environment/observation-2";
    public const string ActionSchema = "sts2.human-environment/action-1";
    public const string ReceiptSchema = "sts2.human-environment/receipt-2";
    public const string ReadSchema = "sts2.human-environment/read-2";
    public const string ControlSchema = "sts2.human-environment/control-1";
}

public sealed record HumanEnvironmentHostIdentity(
    string Id,
    string Name,
    string Version,
    string RuntimeInstanceId,
    string HostKind,
    HumanEnvironmentImplementationIdentity Implementation);

public sealed record HumanEnvironmentImplementationIdentity(
    string? SourceRevision,
    string? ModuleVersionId,
    string? ArtifactSha256);

public sealed record HumanEnvironmentCompatibility(
    string Status,
    bool ObservationAllowed,
    string Detail);

public sealed record HumanEnvironmentModset(
    string Status,
    string Fingerprint,
    string Scope,
    IReadOnlyList<string> LoadedModIds,
    string Detail);

public sealed record HumanEnvironmentGameIdentity(
    string? Version,
    string? Commit,
    string? Branch,
    int? MainAssemblyHash,
    HumanEnvironmentCompatibility Compatibility,
    HumanEnvironmentModset Modset);

public sealed record HumanEnvironmentSessionReference(
    string RuntimeInstanceId,
    string EnvironmentFingerprint);

public sealed record HumanEnvironmentObservationPolicy(
    string Id,
    string Scope,
    bool IncludesHiddenInformation,
    string UnknownFieldBehavior);

public sealed record HumanEnvironmentControlPolicy(
    int RecommendedRenewalMs);

public sealed record HumanEquivalentCapabilitiesResponse(
    string ProtocolVersion,
    string ObservationSchema,
    string ActionSchema,
    string ReceiptSchema,
    string ControlSchema,
    string Status,
    HumanEnvironmentHostIdentity Host,
    HumanEnvironmentGameIdentity Game,
    string EnvironmentFingerprint,
    IReadOnlyList<string> Actions,
    bool SnapshotBound,
    bool SingleController,
    bool ExecutionAvailable,
    HumanEnvironmentControlPolicy Control,
    IReadOnlyList<string> NonClaims);

public sealed record HumanEquivalentClientRegistrationRequest(
    string? ClientInstanceId,
    string? ProductId,
    string? ProductName,
    string? ProductVersion);

public sealed record HumanEquivalentControllerLeaseRequest(
    string? ClientSessionId,
    string? ControllerLeaseId,
    long? ControllerGeneration);

public sealed record HumanEnvironmentClient(
    string ClientSessionId,
    string ClientInstanceId,
    string ProductId,
    string ProductName,
    string ProductVersion,
    DateTimeOffset RegisteredAt,
    DateTimeOffset LastSeenAt);

public sealed record HumanEnvironmentControllerLease(
    string Status,
    string ControllerLeaseId,
    long ControllerGeneration,
    string ClientSessionId,
    DateTimeOffset AcquiredAt,
    DateTimeOffset ExpiresAt);

public sealed record HumanEquivalentClientRegistrationResponse(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    HumanEnvironmentClient Client,
    HumanEnvironmentControllerLease? Controller);

public sealed record HumanEquivalentControlSnapshot(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    IReadOnlyList<HumanEnvironmentClient> Clients,
    HumanEnvironmentControllerLease? Controller);

public sealed record HumanEquivalentControllerLeaseResponse(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    string Status,
    string Detail,
    HumanEnvironmentClient? Client,
    HumanEnvironmentControllerLease? Controller);

/// <summary>
/// The one current human interaction scope. A Live host normally derives this
/// from the active UI owner; a Headless host may derive it from a decision
/// point without fabricating a UI node or control.
/// </summary>
public sealed record HumanEnvironmentInteraction(
    string InteractionId,
    string Kind,
    string Stage,
    string? Prompt,
    string ContentSchema,
    JsonNode Content);

public sealed record HumanEnvironmentContent(
    string ContentSchema,
    JsonNode Content);

public sealed record HumanEnvironmentReferentState(
    bool Visible,
    bool Actionable,
    bool? Selected,
    bool? Focused,
    string ObservationBasis);

/// <summary>
/// A stable player-visible object or control in the current snapshot. This is
/// an information identity, not an authorization object. Exact native operands
/// remain private to the host implementation.
/// </summary>
public sealed record HumanEnvironmentReferent(
    string ReferentId,
    string Role,
    string Kind,
    string? Label,
    HumanEnvironmentReferentState State,
    string? PropertiesSchema,
    JsonNode? Properties);

public sealed record HumanEnvironmentAffordanceArgument(
    string Role,
    string ReferentId);

public sealed record HumanEquivalentAffordance(
    string AffordanceId,
    string Action,
    string InteractionId,
    string? SubjectRef,
    IReadOnlyList<HumanEnvironmentAffordanceArgument> Arguments,
    string Label);

public sealed record HumanEnvironmentReadOpportunity(
    string ReadId,
    string Kind,
    string? TargetReferentId,
    string ContentSchema,
    string VisibilityBasis,
    bool SnapshotBound,
    string OrderingSemantics,
    IReadOnlyList<string> HiddenByPolicy);

public sealed record HumanEnvironmentCompleteness(
    string Status,
    string VisibleInformation,
    string InteractionDiscovery,
    IReadOnlyList<string> Missing,
    IReadOnlyList<string> HiddenByPolicy);

public sealed record HumanEquivalentObservationResponse(
    string ProtocolVersion,
    string Schema,
    string SnapshotId,
    long Sequence,
    DateTimeOffset ObservedAt,
    string Status,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] HumanEnvironmentContent? Persistent,
    HumanEnvironmentInteraction Interaction,
    IReadOnlyList<HumanEnvironmentReferent> Referents,
    IReadOnlyList<HumanEquivalentAffordance> Affordances,
    IReadOnlyList<HumanEnvironmentReadOpportunity> Reads,
    HumanEnvironmentCompleteness Completeness,
    HumanEnvironmentSessionReference Session,
    HumanEnvironmentObservationPolicy ObservationPolicy);

public sealed record HumanEnvironmentReadResponse(
    string ProtocolVersion,
    string Schema,
    string ReadId,
    string ExpectedSnapshotId,
    string ObservedSnapshotId,
    DateTimeOffset ObservedAt,
    string Kind,
    string? TargetReferentId,
    string VisibilityBasis,
    string OrderingSemantics,
    string ContentSchema,
    JsonNode Content,
    HumanEnvironmentCompleteness Completeness,
    HumanEnvironmentSessionReference Session,
    HumanEnvironmentObservationPolicy ObservationPolicy);

public sealed record HumanEquivalentActionRequest(
    string? RequestId,
    string? ExpectedSnapshotId,
    string? AffordanceId,
    string? ClientSessionId,
    string? ControllerLeaseId,
    long? ControllerGeneration);

public sealed record HumanEquivalentActionSummary(
    string AffordanceId,
    string Action,
    string? SubjectRef,
    IReadOnlyList<HumanEnvironmentAffordanceArgument> Arguments);

public sealed record HumanEquivalentRetryPolicy(
    bool Allowed,
    string Reason);

public sealed record HumanEnvironmentAttribution(
    string RuntimeInstanceId,
    string ClientSessionId,
    string ClientInstanceId,
    string ProductId,
    string ProductName,
    string ProductVersion,
    string ControllerLeaseId,
    long ControllerGeneration);

public sealed record HumanEquivalentActionReceipt(
    string ProtocolVersion,
    string Schema,
    string RequestId,
    string Delivery,
    HumanEquivalentActionSummary Action,
    string? ReasonCode,
    string? Detail,
    HumanEquivalentRetryPolicy Retry,
    HumanEquivalentObservationResponse? Successor)
{
    public HumanEnvironmentAttribution? Attribution { get; init; }
}
