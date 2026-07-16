using System;
using System.Collections.Generic;

namespace STS2_MCP.BridgeV2.Protocol;

public static class BridgeV2Contract
{
    public const string ProtocolVersion = "2.0-preview.1";
    public const string ObservationPolicyId = "player_visible_ui_v1";
}

public sealed record BridgeServerIdentity(
    string Id,
    string Name,
    string Version,
    string UpstreamCommit);

public sealed record CompatibilityAssessment(
    string Status,
    IReadOnlyList<string> TestedGameVersions,
    IReadOnlyList<string> TestedBuildFingerprints,
    bool ActionExecutionAllowed,
    string Detail);

public sealed record GameBuildIdentity(
    string? Version,
    string? Commit,
    string? Branch,
    int? MainAssemblyHash,
    CompatibilityAssessment Compatibility);

public sealed record ObservationPolicyInfo(
    string Id,
    string Scope,
    bool IncludesHiddenInformation,
    string UnknownFieldBehavior);

public sealed record SurfaceCapability(
    string Kind,
    string Support,
    IReadOnlyList<string> Operations,
    string Evidence);

public sealed record CommandContractCapability(
    bool OpaqueActionsOnly,
    bool StateBound,
    bool IdempotentRequestIds,
    IReadOnlyList<string> LifecycleStates,
    int OutcomeTimeoutMs);

public sealed record BridgeCapabilitiesResponse(
    string ProtocolVersion,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    IReadOnlyList<SurfaceCapability> Surfaces,
    CommandContractCapability Commands,
    IReadOnlyList<string> Warnings);

public sealed record StateCompleteness(
    string PlayerVisibleSemantics,
    string LegalActions,
    IReadOnlyList<string> Sources,
    IReadOnlyList<string> Missing);

public sealed record LegalAction(
    string ActionId,
    string StateId,
    string Kind,
    string Category,
    string Label,
    string Authority,
    string EvidenceCode);

public sealed record VisibleEnchantment(
    string DefinitionId,
    string? Name,
    string? Description,
    int Amount,
    string ObservationSource);

public sealed record VisibleCard(
    string EntityId,
    string DefinitionId,
    string? Name,
    string Type,
    string Cost,
    string? StarCost,
    string? Description,
    string Rarity,
    bool IsUpgraded,
    bool IsSelected,
    VisibleEnchantment? ExistingEnchantment);

public sealed record DeckEnchantSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string? Prompt,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    bool Cancelable,
    VisibleEnchantment Enchantment,
    IReadOnlyList<VisibleCard> Cards);

public sealed record UnsupportedSurface(
    string Kind,
    string SourceType,
    string Reason);

public sealed record BridgeStateEnvelope(
    string ProtocolVersion,
    string StateId,
    long StateSequence,
    DateTimeOffset ObservedAt,
    string Readiness,
    string SurfaceKind,
    object Surface,
    IReadOnlyList<LegalAction> LegalActions,
    StateCompleteness Completeness,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    IReadOnlyList<string> Warnings);

public sealed record BridgeCommandRequest(
    string? RequestId,
    string? ExpectedStateId,
    string? ActionId);

public sealed record BridgeCommandEvent(
    string Status,
    DateTimeOffset At,
    string? Evidence,
    string? ErrorCode,
    string? Detail);

public sealed record BridgeCommandResponse(
    string RequestId,
    string ExpectedStateId,
    string ActionId,
    string Status,
    string Outcome,
    string? ObservedStateId,
    IReadOnlyList<BridgeCommandEvent> Events);
