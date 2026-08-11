using System;
using System.Net;
using STS2_MCP.HumanEnvironment.Protocol;
using STS2_MCP.HumanEnvironment.Runtime;

namespace STS2_MCP;

public static partial class McpMod
{
    private const int MaxHumanEnvironmentActionBodyBytes = 16 * 1024;
    private const int MaxHumanEnvironmentNativePageEvidenceBodyBytes = 4 * 1024;

    private static void HandleGetHumanEnvironmentCapabilities(HttpListenerResponse response)
    {
        try
        {
            var task = RunOnMainThread(HumanEnvironmentRuntime.GetHumanEnvironmentCapabilities);
            SendJson(response, task.GetAwaiter().GetResult());
        }
        catch (Exception exception)
        {
            SendApiInternalError(response, "human_capabilities_failed", exception);
        }
    }

    private static void HandleGetHumanEnvironmentObservation(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        try
        {
            var task = RunOnMainThread(HumanEnvironmentRuntime.ObserveHumanEnvironment);
            SendJson(response, task.GetAwaiter().GetResult());
        }
        catch (Exception exception)
        {
            SendApiInternalError(response, "human_observation_failed", exception);
        }
    }

    private static void HandleGetHumanEnvironmentRead(
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
            SendApiError(response, 400, "invalid_read_id", "Read id is not valid URI data.");
            return;
        }
        string? expectedSnapshotId = request.QueryString["expected_snapshot_id"];
        if (!IsSafeHumanEnvironmentReadIdentifier(readId)
            || !IsSafeProtocolIdentifier(expectedSnapshotId, 128))
        {
            SendApiError(response, 400, "invalid_read_contract", "A current advertised read id and snapshot ID are required.");
            return;
        }
        try
        {
            var task = RunOnMainThread(() => HumanEnvironmentRuntime.ReadHumanEnvironment(readId, expectedSnapshotId!));
            HumanEnvironmentReadResult result = task.GetAwaiter().GetResult();
            if (result.Read != null)
            {
                SendJson(response, result.Read);
                return;
            }
            SendApiError(
                response,
                result.ErrorCode is "read_not_available" or "read_kind_not_implemented" ? 404 : 409,
                result.ErrorCode ?? "read_failed",
                result.Detail ?? "Read failed closed.");
        }
        catch (Exception exception)
        {
            SendApiInternalError(response, "human_read_failed", exception);
        }
    }

    internal static bool IsSafeHumanEnvironmentReadIdentifier(string? readId)
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
            if (!IsSafeProtocolIdentifier(segments[index], 128))
                return false;
        }
        return true;
    }

    private static void HandlePostHumanEnvironmentAction(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        HumanEnvironmentActionRequest? action =
            ReadBoundedJsonBody<HumanEnvironmentActionRequest>(
                request,
                response,
                MaxHumanEnvironmentActionBodyBytes,
                "Human action");
        if (action == null)
            return;
        if (!IsSafeProtocolIdentifier(action.RequestId, 128)
            || !IsSafeProtocolIdentifier(action.ExpectedSnapshotId, 128)
            || !IsSafeProtocolIdentifier(action.BoundActionId, 128))
        {
            SendApiError(
                response,
                400,
                "invalid_human_action",
                "Exact request, snapshot and advertised bound-action identifiers are required.");
            return;
        }
        try
        {
            var task = RunOnMainThread(() => HumanEnvironmentRuntime.SubmitHumanEnvironment(action));
            HumanEnvironmentActionReceipt receipt = task.GetAwaiter().GetResult();
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
            SendApiInternalError(response, "human_action_failed", exception);
        }
    }

    private static void HandlePostHumanEnvironmentClientRegistration(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        HumanEnvironmentClientRegistrationRequest? registration =
            ReadBoundedJsonBody<HumanEnvironmentClientRegistrationRequest>(
                request,
                response,
                MaxHumanEnvironmentActionBodyBytes,
                "Human Environment control");
        if (registration == null)
            return;
        if (!IsSafeProtocolIdentifier(registration.ClientInstanceId, 128)
            || !IsSafeProtocolIdentifier(registration.ProductId, 64)
            || !IsSafeProtocolLabel(registration.ProductName, 128)
            || !IsSafeProtocolIdentifier(registration.ProductVersion, 64))
        {
            SendApiError(
                response,
                400,
                "invalid_client_registration",
                "Client instance, product id, product name and product version are required and bounded.");
            return;
        }

        try
        {
            HumanEnvironmentClientRegistrationResponse result =
                HumanEnvironmentRuntime.RegisterHumanEnvironmentClient(registration);
            response.StatusCode = 201;
            SendJson(response, result);
        }
        catch (Exception exception)
        {
            SendApiInternalError(response, "human_client_registration_failed", exception);
        }
    }

    private static void HandleGetHumanEnvironmentControl(HttpListenerResponse response)
    {
        try
        {
            SendJson(response, HumanEnvironmentRuntime.GetHumanEnvironmentControlSnapshot());
        }
        catch (Exception exception)
        {
            SendApiInternalError(response, "human_controller_status_read_failed", exception);
        }
    }

    private static void HandlePostHumanEnvironmentController(
        string operation,
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        HumanEnvironmentControllerLeaseRequest? lease =
            ReadBoundedJsonBody<HumanEnvironmentControllerLeaseRequest>(
                request,
                response,
                MaxHumanEnvironmentActionBodyBytes,
                "Human Environment control");
        if (lease == null)
            return;
        bool acquire = string.Equals(operation, "acquire", StringComparison.Ordinal);
        if (!IsSafeProtocolIdentifier(lease.ClientSessionId, 128)
            || (!acquire && !IsSafeProtocolIdentifier(lease.ControllerLeaseId, 128))
            || (!acquire && lease.ControllerGeneration is null or <= 0))
        {
            SendApiError(
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
            HumanEnvironmentControllerLeaseResponse result = operation switch
            {
                "acquire" => HumanEnvironmentRuntime.AcquireHumanEnvironmentController(lease),
                "renew" => HumanEnvironmentRuntime.RenewHumanEnvironmentController(lease),
                _ => HumanEnvironmentRuntime.ReleaseHumanEnvironmentController(lease)
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
            SendApiInternalError(response, "human_controller_operation_failed", exception);
        }
    }

    private static void HandleGetHumanEnvironmentAction(
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
            SendApiError(response, 400, "invalid_request_id", "request_id is not valid URI data.");
            return;
        }
        if (!IsSafeProtocolIdentifier(requestId, 128))
        {
            SendApiError(response, 400, "invalid_request_id", "A bounded request_id is required.");
            return;
        }
        HumanEnvironmentActionReceipt? receipt = HumanEnvironmentRuntime.PollHumanEnvironment(requestId);
        if (receipt == null)
        {
            SendApiError(response, 404, "request_not_found", "No Human Environment receipt exists for request_id.");
            return;
        }
        SendJson(response, receipt);
    }

    private static void HandlePostHumanEnvironmentNativePageEvidenceOpen(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        HumanEnvironmentNativePageOpenRequest? open =
            ReadBoundedJsonBody<HumanEnvironmentNativePageOpenRequest>(
                request,
                response,
                MaxHumanEnvironmentNativePageEvidenceBodyBytes,
                "Human Environment native-page evidence");
        if (open == null)
            return;
        if (!IsSafeProtocolIdentifier(open.Profile, 64)
            || !IsSafeProtocolIdentifier(open.Kind, 64)
            || !IsSafeProtocolIdentifier(open.ExpectedSnapshotId, 128)
            || !IsSafeProtocolIdentifier(open.ExpectedRuntimeInstanceId, 128))
        {
            SendApiError(
                response,
                400,
                "invalid_native_page_evidence_contract",
                "Profile, fixed page kind, expected_snapshot_id and expected_runtime_instance_id are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() =>
                HumanEnvironmentRuntime.OpenNativePageEvidence(open));
            SendHumanEnvironmentNativePageEvidenceResult(
                response,
                task.GetAwaiter().GetResult(),
                201);
        }
        catch (Exception exception)
        {
            SendApiInternalError(
                response,
                "native_page_evidence_open_failed",
                exception);
        }
    }

    private static void HandleGetHumanEnvironmentNativePageEvidence(
        string encodedSessionId,
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        string sessionId;
        try
        {
            sessionId = Uri.UnescapeDataString(encodedSessionId);
        }
        catch (UriFormatException)
        {
            SendApiError(
                response,
                400,
                "invalid_native_page_evidence_session",
                "Session id is not valid URI data.");
            return;
        }

        string? expectedRuntime = request.QueryString["expected_runtime_instance_id"];
        if (!IsSafeProtocolIdentifier(sessionId, 128)
            || !IsSafeProtocolIdentifier(expectedRuntime, 128))
        {
            SendApiError(
                response,
                400,
                "invalid_native_page_evidence_session",
                "A bounded session id and expected_runtime_instance_id are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() =>
                HumanEnvironmentRuntime.ReadNativePageEvidence(
                    sessionId,
                    expectedRuntime!));
            SendHumanEnvironmentNativePageEvidenceResult(
                response,
                task.GetAwaiter().GetResult(),
                200);
        }
        catch (Exception exception)
        {
            SendApiInternalError(
                response,
                "native_page_evidence_read_failed",
                exception);
        }
    }

    private static void HandlePostHumanEnvironmentNativePageEvidenceReturn(
        string encodedSessionId,
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        string sessionId;
        try
        {
            sessionId = Uri.UnescapeDataString(encodedSessionId);
        }
        catch (UriFormatException)
        {
            SendApiError(
                response,
                400,
                "invalid_native_page_evidence_session",
                "Session id is not valid URI data.");
            return;
        }

        HumanEnvironmentNativePageReturnRequest? returned =
            ReadBoundedJsonBody<HumanEnvironmentNativePageReturnRequest>(
                request,
                response,
                MaxHumanEnvironmentNativePageEvidenceBodyBytes,
                "Human Environment native-page evidence");
        if (returned == null)
            return;
        if (!IsSafeProtocolIdentifier(sessionId, 128)
            || !IsSafeProtocolIdentifier(returned.Profile, 64)
            || !IsSafeProtocolIdentifier(returned.ExpectedRuntimeInstanceId, 128))
        {
            SendApiError(
                response,
                400,
                "invalid_native_page_evidence_return",
                "A bounded session, profile and expected runtime identity are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() =>
                HumanEnvironmentRuntime.ReturnNativePageEvidence(sessionId, returned));
            SendHumanEnvironmentNativePageEvidenceResult(
                response,
                task.GetAwaiter().GetResult(),
                200);
        }
        catch (Exception exception)
        {
            SendApiInternalError(
                response,
                "native_page_evidence_return_failed",
                exception);
        }
    }

    private static void SendHumanEnvironmentNativePageEvidenceResult(
        HttpListenerResponse response,
        HumanEnvironmentNativePageOperationResult result,
        int successStatus)
    {
        if (result.Response != null)
        {
            response.StatusCode = result.Response.Phase == "recovery_required"
                ? 409
                : successStatus;
            SendJson(response, result.Response);
            return;
        }

        int statusCode = result.ErrorCode switch
        {
            "native_page_evidence_session_not_found" => 404,
            "native_page_evidence_kind_not_supported" => 400,
            _ => 409
        };
        SendApiError(
            response,
            statusCode,
            result.ErrorCode ?? "native_page_evidence_failed",
            result.Detail ?? "Native-page evidence operation failed closed.");
    }
}
