using STS2_MCP.Authority;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using STS2_MCP.LiveHost;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.HumanEnvironment.Protocol;
using STS2_MCP.NativeUi;

namespace STS2_MCP.HumanEnvironment.Runtime;

internal sealed record HumanEnvironmentRuntimeSnapshot(
    HumanEnvironmentObservationResponse Observation,
    LiveObservation Draft,
    IReadOnlyDictionary<string, HumanEnvironmentNativeBinding> Bindings);

internal sealed record HumanEnvironmentNativeBinding(
    NativeUiBoundAction Command,
    IReadOnlyDictionary<string, string> Parameters);

internal sealed record HumanEnvironmentReadResult(
    HumanEnvironmentReadResponse? Read,
    string? ErrorCode,
    string? Detail);

internal sealed record HumanEnvironmentLinkedDetailCatalogEntry(
    string Kind,
    string EntityId,
    string VisibilityBasis);

internal sealed record HumanBoundActionProjectionResult(
    HumanEnvironmentBoundActionProjection Projection,
    IReadOnlyDictionary<string, HumanEnvironmentNativeBinding> Bindings);

/// <summary>
/// Human Environment observation and delivery runtime. It owns the HE wire,
/// admission and receipt lifecycle and shares only bounded native UI
/// infrastructure with the explicit legacy comparison endpoint.
/// </summary>
internal static partial class HumanEnvironmentRuntime
{
    private const int MaxBoundActions = 512;
    private static NativeEntityRegistry Entities => NativeUiRuntime.Entities;
    private static readonly SnapshotIdentityTracker HumanStateIdentity = new();
    private static readonly ConcurrentDictionary<string, string> HumanRequestFingerprints =
        new(StringComparer.Ordinal);
    private static readonly ConcurrentDictionary<string, HumanEnvironmentActionReceipt> HumanReceipts =
        new(StringComparer.Ordinal);
    private static readonly object HumanSubmissionGate = new();
    private static readonly Lazy<HumanEnvironmentNativePageSession> NativePageEvidenceLazy =
        new(() => new HumanEnvironmentNativePageSession(
            new LiveNativePageEvidenceHost(
                () => BuildHumanEnvironmentSnapshot(suppressNativePageEvidence: false),
                Entities)));
    private static HumanEnvironmentNativePageSession NativePageEvidence =>
        NativePageEvidenceLazy.Value;

    public static HumanEnvironmentCapabilitiesResponse GetHumanEnvironmentCapabilities()
    {
        GameBuildIdentity game = GatewayAuthorityRuntime.ReadCurrentGameIdentity();
        GatewayHostIdentity host = GatewayAuthorityRuntime.HostIdentity();
        return new HumanEnvironmentCapabilitiesResponse(
            HumanEnvironmentContract.ProtocolVersion,
            HumanEnvironmentContract.ObservationSchema,
            HumanEnvironmentContract.ActionSchema,
            HumanEnvironmentContract.ReceiptSchema,
            HumanEnvironmentContract.ControlSchema,
            "implemented",
            HumanHostIdentity(host),
            HumanGameIdentity(game),
            HumanSession(host, game).EnvironmentFingerprint,
            new[]
            {
                "activate", "select", "deselect", "confirm", "cancel", "play",
                "target", "use", "end_turn", "skip", "open", "close"
            },
            SnapshotBound: true,
            SingleController: true,
            ExecutionAvailable: game.Compatibility.ActionExecutionAllowed,
            new HumanEnvironmentControlPolicy(
                MutationControlRuntime.Capability().RecommendedRenewalMs),
            new[] { NativePageEvidence.Capability() },
            new[]
            {
                "Applied means native UI input was delivered, not that a business transaction settled.",
                "D annotations are outside the C observation and never authorize bound actions.",
                "Build or install does not prove this artifact is loaded or Live-exercised."
            });
    }

    public static HumanEnvironmentObservationResponse ObserveHumanEnvironment() =>
        BuildHumanEnvironmentSnapshot().Observation;

}
