using System.Linq;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;
using STS2_MCP.HumanEquivalent.Protocol;

namespace STS2_MCP.HumanEquivalent.Runtime;

/// <summary>
/// Human-Equivalent wire projection over the shared single-controller
/// coordinator. It owns HE DTOs but does not create UI affordances or action
/// authority.
/// </summary>
internal static partial class HumanEquivalentRuntime
{
    public static HumanEquivalentClientRegistrationResponse RegisterHumanEquivalentClient(
        HumanEquivalentClientRegistrationRequest request)
    {
        BridgeClientRegistrationResponse response = BridgeV2Runtime.RegisterClient(
            new BridgeClientRegistrationRequest(
                request.ClientInstanceId,
                request.ProductId,
                request.ProductName,
                request.ProductVersion));
        return new HumanEquivalentClientRegistrationResponse(
            HumanEquivalentContract.ProtocolVersion,
            HumanEquivalentContract.ControlSchema,
            response.RuntimeInstanceId,
            HumanClient(response.Client),
            response.Controller == null ? null : HumanController(response.Controller));
    }

    public static HumanEquivalentControlSnapshot GetHumanEquivalentControlSnapshot()
    {
        BridgeControlSnapshot snapshot = BridgeV2Runtime.GetControlSnapshot();
        return new HumanEquivalentControlSnapshot(
            HumanEquivalentContract.ProtocolVersion,
            HumanEquivalentContract.ControlSchema,
            snapshot.RuntimeInstanceId,
            snapshot.Clients.Select(HumanClient).ToArray(),
            snapshot.Controller == null ? null : HumanController(snapshot.Controller));
    }

    public static HumanEquivalentControllerLeaseResponse AcquireHumanEquivalentController(
        HumanEquivalentControllerLeaseRequest request) =>
        ToHumanEquivalentControlResponse(BridgeV2Runtime.AcquireController(
            ToBridgeControllerRequest(request)));

    public static HumanEquivalentControllerLeaseResponse RenewHumanEquivalentController(
        HumanEquivalentControllerLeaseRequest request) =>
        ToHumanEquivalentControlResponse(BridgeV2Runtime.RenewController(
            ToBridgeControllerRequest(request)));

    public static HumanEquivalentControllerLeaseResponse ReleaseHumanEquivalentController(
        HumanEquivalentControllerLeaseRequest request) =>
        ToHumanEquivalentControlResponse(BridgeV2Runtime.ReleaseController(
            ToBridgeControllerRequest(request)));

    private static BridgeControllerLeaseRequest ToBridgeControllerRequest(
        HumanEquivalentControllerLeaseRequest request) => new(
            request.ClientSessionId,
            request.ControllerLeaseId,
            request.ControllerGeneration);

    private static HumanEquivalentControllerLeaseResponse ToHumanEquivalentControlResponse(
        BridgeControllerLeaseResponse response) => new(
            HumanEquivalentContract.ProtocolVersion,
            HumanEquivalentContract.ControlSchema,
            response.RuntimeInstanceId,
            response.Status,
            response.Detail,
            response.Client == null ? null : HumanClient(response.Client),
            response.Controller == null ? null : HumanController(response.Controller));

    private static HumanEnvironmentClient HumanClient(BridgeClientRecord value) => new(
        value.ClientSessionId,
        value.ClientInstanceId,
        value.ProductId,
        value.ProductName,
        value.ProductVersion,
        value.RegisteredAt,
        value.LastSeenAt);

    private static HumanEnvironmentControllerLease HumanController(
        BridgeControllerLeaseInfo value) => new(
            value.Status,
            value.ControllerLeaseId,
            value.ControllerGeneration,
            value.ClientSessionId,
            value.AcquiredAt,
            value.ExpiresAt);
}
