using System;
using System.Collections.Generic;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace STS2_MCP.HumanEnvironment.Protocol;

/// <summary>
/// The fair-player environment boundary shared by Live UI and future hosts.
/// Host lifecycle, rewards, strategy and privileged simulation are outside it.
/// </summary>
public static class HumanEnvironmentContract
{
    public const string ProtocolVersion = "1.0-preview.6";
    public const string GatewayId = "sts2_human_environment";
    public const string GatewayName = "STS2 Human Environment";
    public const string ObservationSchema = "sts2.human-environment/observation-3";
    public const string ActionSchema = "sts2.human-environment/action-2";
    public const string ReceiptSchema = "sts2.human-environment/receipt-3";
    public const string ReadSchema = "sts2.human-environment/read-2";
    public const string ControlSchema = "sts2.human-environment/control-1";
    public const string NativePageEvidenceSchema =
        "sts2.human-environment/native-page-evidence-1";
    public const string NativePageEvidenceProfile = "native_pages.v1";
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

public sealed record HumanEnvironmentCapabilitiesResponse(
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
    IReadOnlyList<HumanEnvironmentEvidenceProfile> EvidenceProfiles,
    IReadOnlyList<string> NonClaims);

public sealed record HumanEnvironmentEvidenceProfile(
    string Id,
    bool Enabled,
    IReadOnlyList<string> SupportedKinds,
    bool SnapshotBound,
    bool RuntimeBound,
    bool DefaultInConsumerFlow,
    bool CreatesMutationAuthority,
    bool EntersActionLedger);

public sealed record HumanEnvironmentNativePageOpenRequest(
    string? Profile,
    string? Kind,
    string? ExpectedSnapshotId,
    string? ExpectedRuntimeInstanceId);

public sealed record HumanEnvironmentNativePageReturnRequest(
    string? Profile,
    string? ExpectedRuntimeInstanceId);

public sealed record HumanEnvironmentNativePageOwner(
    string ContextKind,
    string InteractionKind,
    string NativeOwner);

public sealed record HumanEnvironmentNativePageRead(
    string NativePageType,
    string ReadKind,
    int VisibleReferentCount,
    IReadOnlyList<string> VisibleReferentIds,
    string ContentSchema,
    JsonNode Content,
    HumanEnvironmentCompleteness Completeness,
    IReadOnlyList<string> Evidence);

public sealed record HumanEnvironmentNativePageResponse(
    string ProtocolVersion,
    string Schema,
    string SessionId,
    string Profile,
    string Kind,
    string Phase,
    string ExpectedSnapshotId,
    string PreSnapshotId,
    string? OpenedSnapshotId,
    string? PostSnapshotId,
    string ExpectedRuntimeInstanceId,
    string ObservedRuntimeInstanceId,
    HumanEnvironmentNativePageOwner PreOwner,
    HumanEnvironmentNativePageOwner CurrentOwner,
    HumanEnvironmentNativePageOwner? PostOwner,
    HumanEnvironmentNativePageRead? Page,
    HumanEnvironmentHostIdentity Host,
    HumanEnvironmentGameIdentity Game,
    bool CreatesMutationAuthority,
    bool EntersActionLedger,
    string? ErrorCode,
    string? Detail);

public sealed record HumanEnvironmentClientRegistrationRequest(
    string? ClientInstanceId,
    string? ProductId,
    string? ProductName,
    string? ProductVersion);

public sealed record HumanEnvironmentControllerLeaseRequest(
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

public sealed record HumanEnvironmentClientRegistrationResponse(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    HumanEnvironmentClient Client,
    HumanEnvironmentControllerLease? Controller);

public sealed record HumanEnvironmentControlSnapshot(
    string ProtocolVersion,
    string Schema,
    string RuntimeInstanceId,
    IReadOnlyList<HumanEnvironmentClient> Clients,
    HumanEnvironmentControllerLease? Controller);

public sealed record HumanEnvironmentControllerLeaseResponse(
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
    HumanEnvironmentInteractionContent Content,
    IReadOnlyList<HumanEnvironmentInteractionCapability> Capabilities);

/// <summary>
/// The tagged, player-visible interaction payload. Surface and context may
/// evolve independently, but both must identify their current semantic kind.
/// </summary>
public sealed record HumanEnvironmentInteractionContent(
    JsonNode Surface,
    JsonNode Context);

/// <summary>
/// Strategy-free grammar for an input currently accepted by this interaction.
/// It describes roles, not executable operand combinations. Exact bindings stay
/// private to the host and are exposed separately through a finite projection.
/// </summary>
public sealed record HumanEnvironmentInteractionCapability(
    string Action,
    string? SubjectRole,
    IReadOnlyList<HumanEnvironmentCapabilityArgument> Arguments,
    string AvailabilityBasis);

public sealed record HumanEnvironmentCapabilityArgument(
    string Role,
    bool Required);

public sealed record HumanEnvironmentContent(
    string ContentSchema,
    JsonNode Content);

public sealed record HumanEnvironmentReferentState(
    bool Visible,
    bool? Enabled,
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

public sealed record HumanEnvironmentBoundActionArgument(
    string Role,
    string ReferentId);

public sealed record HumanEnvironmentBoundAction(
    string BoundActionId,
    string Action,
    string InteractionId,
    string? SubjectRef,
    IReadOnlyList<HumanEnvironmentBoundActionArgument> Arguments,
    string Label);

/// <summary>
/// A deterministic finite consumer projection over the current C-local
/// execution bindings. Truncated projections never grant action authority.
/// </summary>
public sealed record HumanEnvironmentBoundActionProjection(
    string Schema,
    string Status,
    int MaterializedCount,
    long TotalCount,
    int Limit,
    string OrderingSemantics,
    IReadOnlyList<HumanEnvironmentBoundAction> Actions);

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

public sealed record HumanEnvironmentObservationResponse(
    string ProtocolVersion,
    string Schema,
    string SnapshotId,
    long Sequence,
    DateTimeOffset ObservedAt,
    string Status,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] HumanEnvironmentContent? Persistent,
    HumanEnvironmentInteraction Interaction,
    IReadOnlyList<HumanEnvironmentReferent> Referents,
    HumanEnvironmentBoundActionProjection BoundActions,
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

public sealed record HumanEnvironmentActionRequest(
    string? RequestId,
    string? ExpectedSnapshotId,
    string? BoundActionId,
    string? ClientSessionId,
    string? ControllerLeaseId,
    long? ControllerGeneration);

public sealed record HumanEnvironmentActionSummary(
    string BoundActionId,
    string Action,
    string? SubjectRef,
    IReadOnlyList<HumanEnvironmentBoundActionArgument> Arguments);

public sealed record HumanEnvironmentRetryPolicy(
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

public sealed record HumanEnvironmentActionReceipt(
    string ProtocolVersion,
    string Schema,
    string RequestId,
    string Delivery,
    HumanEnvironmentActionSummary Action,
    string? ReasonCode,
    string? Detail,
    HumanEnvironmentRetryPolicy Retry,
    HumanEnvironmentObservationResponse? Successor)
{
    public HumanEnvironmentAttribution? Attribution { get; init; }
}
