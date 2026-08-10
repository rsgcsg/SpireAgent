using System;
using System.Net;
using STS2_MCP.HumanEquivalent.Protocol;
using STS2_MCP.HumanEquivalent.Runtime;

namespace STS2_MCP;

public static partial class McpMod
{
    private const int MaxHumanEquivalentActionBodyBytes = 16 * 1024;

    private static void HandleGetHumanEquivalentCapabilities(HttpListenerResponse response)
    {
        try
        {
            var task = RunOnMainThread(HumanEquivalentRuntime.GetHumanEquivalentCapabilities);
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
        try
        {
            var task = RunOnMainThread(HumanEquivalentRuntime.ObserveHumanEquivalent);
            SendJson(response, task.GetAwaiter().GetResult());
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_observation_failed", exception);
        }
    }

    private static void HandleGetHumanEquivalentRead(
        string encodedReadId,
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        string readId;
        try
        {
            readId = Uri.UnescapeDataString(encodedReadId);
        }
        catch (UriFormatException)
        {
            SendConnectorV3Error(response, 400, "invalid_read_id", "Read id is not valid URI data.");
            return;
        }
        string? expectedSnapshotId = request.QueryString["expected_snapshot_id"];
        if (!IsSafeHumanEquivalentReadIdentifier(readId)
            || !IsSafeBridgeIdentifier(expectedSnapshotId, 128))
        {
            SendConnectorV3Error(response, 400, "invalid_read_contract", "A current advertised read id and snapshot ID are required.");
            return;
        }
        try
        {
            var task = RunOnMainThread(() => HumanEquivalentRuntime.ReadHumanEquivalent(readId, expectedSnapshotId!));
            HumanEnvironmentReadResult result = task.GetAwaiter().GetResult();
            if (result.Read != null)
            {
                SendJson(response, result.Read);
                return;
            }
            SendConnectorV3Error(
                response,
                result.ErrorCode is "read_not_available" or "read_kind_not_implemented" ? 404 : 409,
                result.ErrorCode ?? "read_failed",
                result.Detail ?? "Read failed closed.");
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_read_failed", exception);
        }
    }

    internal static bool IsSafeHumanEquivalentReadIdentifier(string? readId)
    {
        const string prefix = "read:";
        if (readId?.StartsWith(prefix, StringComparison.Ordinal) != true
            || readId.Length > 256)
            return false;
        string[] segments = readId.Split(':');
        if (segments.Length < 2 || !string.Equals(segments[0], "read", StringComparison.Ordinal))
            return false;
        for (int index = 1; index < segments.Length; index++)
        {
            if (!IsSafeBridgeIdentifier(segments[index], 128))
                return false;
        }
        return true;
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
            || !IsSafeBridgeIdentifier(action.ExpectedSnapshotId, 128)
            || !IsSafeBridgeIdentifier(action.BoundActionId, 128))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_human_action",
                "Exact request, snapshot and advertised bound-action identifiers are required.");
            return;
        }
        try
        {
            var task = RunOnMainThread(() => HumanEquivalentRuntime.SubmitHumanEquivalent(action));
            HumanEquivalentActionReceipt receipt = task.GetAwaiter().GetResult();
            response.StatusCode = receipt.Delivery switch
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

    private static void HandlePostHumanEquivalentClientRegistration(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        HumanEquivalentClientRegistrationRequest? registration =
            ReadConnectorV3BoundedBody<HumanEquivalentClientRegistrationRequest>(
                request,
                response,
                MaxHumanEquivalentActionBodyBytes,
                "Human-Equivalent control");
        if (registration == null)
            return;
        if (!IsSafeBridgeIdentifier(registration.ClientInstanceId, 128)
            || !IsSafeBridgeIdentifier(registration.ProductId, 64)
            || !IsSafeBridgeLabel(registration.ProductName, 128)
            || !IsSafeBridgeIdentifier(registration.ProductVersion, 64))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_client_registration",
                "Client instance, product id, product name and product version are required and bounded.");
            return;
        }

        try
        {
            HumanEquivalentClientRegistrationResponse result =
                HumanEquivalentRuntime.RegisterHumanEquivalentClient(registration);
            response.StatusCode = 201;
            SendJson(response, result);
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_client_registration_failed", exception);
        }
    }

    private static void HandleGetHumanEquivalentControl(HttpListenerResponse response)
    {
        try
        {
            SendJson(response, HumanEquivalentRuntime.GetHumanEquivalentControlSnapshot());
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_controller_status_read_failed", exception);
        }
    }

    private static void HandlePostHumanEquivalentController(
        string operation,
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        HumanEquivalentControllerLeaseRequest? lease =
            ReadConnectorV3BoundedBody<HumanEquivalentControllerLeaseRequest>(
                request,
                response,
                MaxHumanEquivalentActionBodyBytes,
                "Human-Equivalent control");
        if (lease == null)
            return;
        bool acquire = string.Equals(operation, "acquire", StringComparison.Ordinal);
        if (!IsSafeBridgeIdentifier(lease.ClientSessionId, 128)
            || (!acquire && !IsSafeBridgeIdentifier(lease.ControllerLeaseId, 128))
            || (!acquire && lease.ControllerGeneration is null or <= 0))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_controller_contract",
                acquire
                    ? "client_session_id is required to acquire mutation control."
                    : "client_session_id, controller_lease_id and a positive controller_generation are required.");
            return;
        }

        try
        {
            HumanEquivalentControllerLeaseResponse result = operation switch
            {
                "acquire" => HumanEquivalentRuntime.AcquireHumanEquivalentController(lease),
                "renew" => HumanEquivalentRuntime.RenewHumanEquivalentController(lease),
                _ => HumanEquivalentRuntime.ReleaseHumanEquivalentController(lease)
            };
            response.StatusCode = result.Status switch
            {
                "controller_acquired" or "controller_already_held"
                    or "controller_renewed" or "controller_released" => 200,
                "controller_lease_held" or "controller_lease_stale" => 409,
                "client_session_not_found" => 404,
                _ => 409
            };
            SendJson(response, result);
        }
        catch (Exception exception)
        {
            SendConnectorV3InternalError(response, "human_controller_operation_failed", exception);
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
        HumanEquivalentActionReceipt? receipt = HumanEquivalentRuntime.PollHumanEquivalent(requestId);
        if (receipt == null)
        {
            SendConnectorV3Error(response, 404, "request_not_found", "No Human-Equivalent receipt exists for request_id.");
            return;
        }
        SendJson(response, receipt);
    }
}
