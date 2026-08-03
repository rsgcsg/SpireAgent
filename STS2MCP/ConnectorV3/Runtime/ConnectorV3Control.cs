using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;
using STS2_MCP.ConnectorV3.Protocol;

namespace STS2_MCP.ConnectorV3.Runtime;

internal static partial class ConnectorV3Runtime
{
    public static ConnectorV3ClientRegistrationResponse RegisterClient(
        ConnectorV3ClientRegistrationRequest request)
    {
        BridgeClientRegistrationResponse response = BridgeV2Runtime.RegisterClient(
            new BridgeClientRegistrationRequest(
                request.ClientInstanceId,
                request.ProductId,
                request.ProductName,
                request.ProductVersion));
        return new ConnectorV3ClientRegistrationResponse(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.ControlSchema,
            response.RuntimeInstanceId,
            response.Client,
            response.Controller);
    }

    public static ConnectorV3ControlSnapshot GetControlSnapshot()
    {
        BridgeControlSnapshot snapshot = BridgeV2Runtime.GetControlSnapshot();
        return new ConnectorV3ControlSnapshot(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.ControlSchema,
            snapshot.RuntimeInstanceId,
            snapshot.Clients,
            snapshot.Controller);
    }

    public static ConnectorV3ControllerLeaseResponse AcquireController(
        ConnectorV3ControllerLeaseRequest request) =>
        ToConnectorV3ControlResponse(BridgeV2Runtime.AcquireController(
            ToBridgeRequest(request)));

    public static ConnectorV3ControllerLeaseResponse RenewController(
        ConnectorV3ControllerLeaseRequest request) =>
        ToConnectorV3ControlResponse(BridgeV2Runtime.RenewController(
            ToBridgeRequest(request)));

    public static ConnectorV3ControllerLeaseResponse ReleaseController(
        ConnectorV3ControllerLeaseRequest request) =>
        ToConnectorV3ControlResponse(BridgeV2Runtime.ReleaseController(
            ToBridgeRequest(request)));

    private static BridgeControllerLeaseRequest ToBridgeRequest(
        ConnectorV3ControllerLeaseRequest request) => new(
            request.ClientSessionId,
            request.ControllerLeaseId,
            request.ControllerGeneration);

    private static ConnectorV3ControllerLeaseResponse ToConnectorV3ControlResponse(
        BridgeControllerLeaseResponse response) => new(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.ControlSchema,
            response.RuntimeInstanceId,
            response.Status,
            response.Detail,
            response.Client,
            response.Controller);
}
