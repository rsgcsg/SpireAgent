using System;
using System.Net;
using STS2_MCP.ConnectorV3.Runtime;
using STS2_MCP.HumanEquivalent.Protocol;

namespace STS2_MCP;

public static partial class McpMod
{
    private const int MaxHumanEquivalentActionBodyBytes = 16 * 1024;

    private static void HandleGetHumanEquivalentCapabilities(HttpListenerResponse response)
    {
        try
        {
            var task = RunOnMainThread(ConnectorV3Runtime.GetHumanEquivalentCapabilities);
            SendJson(response, task.GetAwaiter().GetResult());
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_capabilities_failed", exception);
        }
    }

    private static void HandleGetHumanEquivalentObservation(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        string? mode = request.QueryString["mode"];
        if (mode is not null
            && mode is not HumanEquivalentContract.AssistedMode
                and not HumanEquivalentContract.PureMode)
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_human_mode",
                "mode must be he_assisted or he_pure.");
            return;
        }
        try
        {
            var task = RunOnMainThread(() => ConnectorV3Runtime.ObserveHumanEquivalent(mode));
            SendJson(response, task.GetAwaiter().GetResult());
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_observation_failed", exception);
        }
    }

    private static void HandleGetHumanEquivalentInspection(
        string encodedKind,
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        string kind;
        try
        {
            kind = Uri.UnescapeDataString(encodedKind);
        }
        catch (UriFormatException)
        {
            SendConnectorV3Error(response, 400, "invalid_inspection_kind", "Inspection kind is not valid URI data.");
            return;
        }
        string? expectedStateToken = request.QueryString["expected_state_token"];
        string? mode = request.QueryString["mode"];
        if (!IsSafeBridgeIdentifier(kind, 64)
            || !IsSafeBridgeIdentifier(expectedStateToken, 128)
            || mode is not null and not HumanEquivalentContract.AssistedMode and not HumanEquivalentContract.PureMode)
        {
            SendConnectorV3Error(response, 400, "invalid_inspection_contract", "A current catalog kind, state token and valid HE mode are required.");
            return;
        }
        try
        {
            var task = RunOnMainThread(() => ConnectorV3Runtime.InspectHumanEquivalent(kind, expectedStateToken!, mode));
            HumanEquivalentInspectionReadResult result = task.GetAwaiter().GetResult();
            if (result.Inspection != null)
            {
                SendJson(response, result.Inspection);
                return;
            }
            SendConnectorV3Error(
                response,
                result.ErrorCode == "inspection_kind_not_implemented" ? 404 : 409,
                result.ErrorCode ?? "inspection_failed",
                result.Detail ?? "Inspection failed closed.");
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_inspection_failed", exception);
        }
    }

    private static void HandleGetHumanEquivalentLinkedDetail(
        string encodedEntityId,
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        string entityId;
        try
        {
            entityId = Uri.UnescapeDataString(encodedEntityId);
        }
        catch (UriFormatException)
        {
            SendConnectorV3Error(response, 400, "invalid_linked_detail_entity", "Entity id is not valid URI data.");
            return;
        }
        string? expectedStateToken = request.QueryString["expected_state_token"];
        string? mode = request.QueryString["mode"];
        if (!IsSafeBridgeIdentifier(entityId, 128)
            || !IsSafeBridgeIdentifier(expectedStateToken, 128)
            || mode is not null and not HumanEquivalentContract.AssistedMode and not HumanEquivalentContract.PureMode)
        {
            SendConnectorV3Error(response, 400, "invalid_linked_detail_contract", "A current catalog entity, state token and valid HE mode are required.");
            return;
        }
        try
        {
            var task = RunOnMainThread(() => ConnectorV3Runtime.ReadHumanEquivalentLinkedDetail(entityId, expectedStateToken!, mode));
            HumanEquivalentLinkedDetailReadResult result = task.GetAwaiter().GetResult();
            if (result.LinkedDetail != null)
            {
                SendJson(response, result.LinkedDetail);
                return;
            }
            SendConnectorV3Error(
                response,
                result.ErrorCode == "linked_detail_binding_failed" ? 500 : 409,
                result.ErrorCode ?? "linked_detail_failed",
                result.Detail ?? "Linked-detail read failed closed.");
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_linked_detail_failed", exception);
        }
    }

    private static void HandlePostHumanEquivalentAction(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        HumanEquivalentActionRequest? action =
            ReadConnectorV3BoundedBody<HumanEquivalentActionRequest>(
                request,
                response,
                MaxHumanEquivalentActionBodyBytes,
                "Human action");
        if (action == null)
            return;
        if (!IsSafeBridgeIdentifier(action.RequestId, 128)
            || !IsSafeBridgeIdentifier(action.ExpectedStateToken, 128)
            || !IsSafeBridgeIdentifier(action.ExpectedFrameId, 128)
            || !IsSafeBridgeIdentifier(action.ExpectedOwnerId, 128)
            || !IsSafeBridgeIdentifier(action.AffordanceId, 128)
            || action.Parameters?.Count > 16)
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_human_action",
                "Exact request, state, frame, owner and advertised affordance identifiers are required.");
            return;
        }
        try
        {
            var task = RunOnMainThread(() => ConnectorV3Runtime.SubmitHumanEquivalent(action));
            HumanEquivalentActionReceipt receipt = task.GetAwaiter().GetResult();
            response.StatusCode = receipt.Status switch
            {
                "applied" => 200,
                "unknown" => 202,
                _ => 409
            };
            SendJson(response, receipt);
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_action_failed", exception);
        }
    }

    private static void HandleGetHumanEquivalentAction(
        string encodedRequestId,
        HttpListenerResponse response)
    {
        string requestId;
        try
        {
            requestId = Uri.UnescapeDataString(encodedRequestId);
        }
        catch (UriFormatException)
        {
            SendConnectorV3Error(response, 400, "invalid_request_id", "request_id is not valid URI data.");
            return;
        }
        if (!IsSafeBridgeIdentifier(requestId, 128))
        {
            SendConnectorV3Error(response, 400, "invalid_request_id", "A bounded request_id is required.");
            return;
        }
        HumanEquivalentActionReceipt? receipt = ConnectorV3Runtime.PollHumanEquivalent(requestId);
        if (receipt == null)
        {
            SendConnectorV3Error(response, 404, "request_not_found", "No Human-Equivalent receipt exists for request_id.");
            return;
        }
        SendJson(response, receipt);
    }
}
