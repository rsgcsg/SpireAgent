using STS2_MCP.Authority;
using System.Linq;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.HumanEnvironment.Protocol;

namespace STS2_MCP.HumanEnvironment.Runtime;

/// <summary>
/// Human Environment wire projection over the shared single-controller
/// coordinator. It owns HE DTOs but does not create UI affordances or action
/// authority.
/// </summary>
internal static partial class HumanEnvironmentRuntime
{
    public static HumanEnvironmentClientRegistrationResponse RegisterHumanEnvironmentClient(
        HumanEnvironmentClientRegistrationRequest request)
    {
        MutationClientRegistrationResult response = MutationControlRuntime.Register(
            new MutationClientRegistrationRequest(
                request.ClientInstanceId,
                request.ProductId,
                request.ProductName,
                request.ProductVersion));
        return new HumanEnvironmentClientRegistrationResponse(
            HumanEnvironmentContract.ProtocolVersion,
            HumanEnvironmentContract.ControlSchema,
            response.RuntimeInstanceId,
            HumanClient(response.Client),
            response.Controller == null ? null : HumanController(response.Controller));
    }

    public static HumanEnvironmentControlSnapshot GetHumanEnvironmentControlSnapshot()
    {
        MutationControlSnapshot snapshot = MutationControlRuntime.Snapshot();
        return new HumanEnvironmentControlSnapshot(
            HumanEnvironmentContract.ProtocolVersion,
            HumanEnvironmentContract.ControlSchema,
            snapshot.RuntimeInstanceId,
            snapshot.Clients.Select(HumanClient).ToArray(),
            snapshot.Controller == null ? null : HumanController(snapshot.Controller));
    }

    public static HumanEnvironmentControllerLeaseResponse AcquireHumanEnvironmentController(
        HumanEnvironmentControllerLeaseRequest request) =>
        ToHumanEnvironmentControlResponse(MutationControlRuntime.Acquire(
            ToMutationLeaseRequest(request)));

    public static HumanEnvironmentControllerLeaseResponse RenewHumanEnvironmentController(
        HumanEnvironmentControllerLeaseRequest request) =>
        ToHumanEnvironmentControlResponse(MutationControlRuntime.Renew(
            ToMutationLeaseRequest(request)));

    public static HumanEnvironmentControllerLeaseResponse ReleaseHumanEnvironmentController(
        HumanEnvironmentControllerLeaseRequest request) =>
        ToHumanEnvironmentControlResponse(MutationControlRuntime.Release(
            ToMutationLeaseRequest(request)));

    private static MutationLeaseRequest ToMutationLeaseRequest(
        HumanEnvironmentControllerLeaseRequest request) => new(
            request.ClientSessionId,
            request.ControllerLeaseId,
            request.ControllerGeneration);

    private static HumanEnvironmentControllerLeaseResponse ToHumanEnvironmentControlResponse(
        MutationLeaseResult response) => new(
            HumanEnvironmentContract.ProtocolVersion,
            HumanEnvironmentContract.ControlSchema,
            response.RuntimeInstanceId,
            response.Status,
            response.Detail,
            response.Client == null ? null : HumanClient(response.Client),
            response.Controller == null ? null : HumanController(response.Controller));

    private static HumanEnvironmentClient HumanClient(MutationClient value) => new(
        value.ClientSessionId,
        value.ClientInstanceId,
        value.ProductId,
        value.ProductName,
        value.ProductVersion,
        value.RegisteredAt,
        value.LastSeenAt);

    private static HumanEnvironmentControllerLease HumanController(
        MutationLease value) => new(
            value.Status,
            value.ControllerLeaseId,
            value.ControllerGeneration,
            value.ClientSessionId,
            value.AcquiredAt,
            value.ExpiresAt);
}
