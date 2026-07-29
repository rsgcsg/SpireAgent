using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using Godot;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP;

public static partial class McpMod
{
    private const int MaxBridgeV2CommandBodyBytes = 16 * 1024;
    private const int MaxBridgeV2ObservationBundleBodyBytes = 8 * 1024;
    private const int MaxBridgeV2ControlBodyBytes = 4 * 1024;

    private static void HandleGetBridgeV2Capabilities(HttpListenerResponse response)
    {
        try
        {
            var task = RunOnMainThread(BridgeV2Runtime.GetCapabilities);
            SendJson(response, task.GetAwaiter().GetResult());
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "capabilities_failed", ex);
        }
    }

    private static void HandleGetBridgeV2State(HttpListenerResponse response)
    {
        try
        {
            var task = RunOnMainThread(BridgeV2Runtime.Observe);
            SendJson(response, task.GetAwaiter().GetResult());
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "state_observation_failed", ex);
        }
    }

    private static void HandleGetBridgeV2Inspection(
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
            SendBridgeV2Error(response, 400, "invalid_inspection_kind", "Inspection kind is not valid URI data.");
            return;
        }

        string? expectedStateId = request.QueryString["expected_state_id"];
        if (!IsSafeBridgeIdentifier(kind, 64) || !IsSafeBridgeIdentifier(expectedStateId, 128))
        {
            SendBridgeV2Error(
                response,
                400,
                "invalid_inspection_contract",
                "A fixed inspection kind and expected_state_id are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() => BridgeV2Runtime.Inspect(kind, expectedStateId!));
            BridgeInspectionReadResult result = task.GetAwaiter().GetResult();
            if (result.Inspection != null)
            {
                SendJson(response, result.Inspection);
                return;
            }

            int statusCode = result.ErrorCode switch
            {
                "inspection_kind_not_implemented" => 404,
                "inspection_binding_failed" => 500,
                _ => 409
            };
            SendBridgeV2Error(
                response,
                statusCode,
                result.ErrorCode ?? "inspection_failed",
                result.Detail ?? "Inspection failed closed.");
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "inspection_failed", ex);
        }
    }

    private static void HandlePostBridgeV2ObservationBundle(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        if (request.ContentLength64 > MaxBridgeV2ObservationBundleBodyBytes)
        {
            SendBridgeV2Error(response, 413, "request_too_large", "Observation bundle request exceeds 8 KiB.");
            return;
        }

        string body;
        using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            body = reader.ReadToEnd();

        BridgeObservationBundleRequest? bundleRequest;
        try
        {
            bundleRequest = JsonSerializer.Deserialize<BridgeObservationBundleRequest>(body, _jsonOptions);
        }
        catch (JsonException)
        {
            SendBridgeV2Error(response, 400, "invalid_json", "Request body must be valid JSON.");
            return;
        }

        BridgeObservationBundleInspectionRequest[] inspections = bundleRequest?.Inspections?.ToArray()
            ?? Array.Empty<BridgeObservationBundleInspectionRequest>();
        if (bundleRequest == null
            || !IsSafeBridgeIdentifier(bundleRequest.ExpectedStateId, 128)
            || inspections.Length > 8
            || inspections.Any(item => !IsSafeBridgeIdentifier(item.Kind, 64))
            || inspections.Select(item => item.Kind).Distinct(StringComparer.Ordinal).Count() != inspections.Length)
        {
            SendBridgeV2Error(
                response,
                400,
                "invalid_observation_bundle_contract",
                "expected_state_id and at most eight distinct fixed inspection kinds are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() => BridgeV2Runtime.ObserveBundle(bundleRequest));
            BridgeObservationBundleReadResult result = task.GetAwaiter().GetResult();
            if (result.Bundle != null)
            {
                SendJson(response, result.Bundle);
                return;
            }

            int statusCode = result.ErrorCode == "inspection_kind_not_implemented" ? 404 : 409;
            SendBridgeV2Error(
                response,
                statusCode,
                result.ErrorCode ?? "observation_bundle_failed",
                result.Detail ?? "Observation bundle failed closed.");
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "observation_bundle_failed", ex);
        }
    }

    private static void HandlePostBridgeV2Command(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        if (request.ContentLength64 > MaxBridgeV2CommandBodyBytes)
        {
            SendBridgeV2Error(response, 413, "request_too_large", "Command request exceeds 16 KiB.");
            return;
        }

        string body;
        using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            body = reader.ReadToEnd();

        BridgeCommandRequest? command;
        try
        {
            command = JsonSerializer.Deserialize<BridgeCommandRequest>(body, _jsonOptions);
        }
        catch (JsonException)
        {
            SendBridgeV2Error(response, 400, "invalid_json", "Request body must be valid JSON.");
            return;
        }

        if (command == null
            || !IsSafeBridgeIdentifier(command.RequestId, 128)
            || !IsSafeBridgeIdentifier(command.ExpectedStateId, 128)
            || !IsSafeBridgeIdentifier(command.ActionId, 128)
            || !IsSafeBridgeIdentifier(command.ClientSessionId, 128)
            || !IsSafeBridgeIdentifier(command.ControllerLeaseId, 128)
            || command.ControllerGeneration is null or <= 0)
        {
            SendBridgeV2Error(
                response,
                400,
                "invalid_command_contract",
                "request_id, expected_state_id, action_id, client_session_id, controller_lease_id, and a positive controller_generation are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() => BridgeV2Runtime.Submit(command));
            BridgeCommandResponse result = task.GetAwaiter().GetResult();
            response.StatusCode = result.Status switch
            {
                "started" => 202,
                "rejected" => 409,
                "failed" => 500,
                _ => 200
            };
            SendJson(response, result);
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "command_submission_failed", ex);
        }
    }

    private static void HandlePostBridgeV2ClientRegistration(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        BridgeClientRegistrationRequest? registration = ReadBridgeV2JsonBody<BridgeClientRegistrationRequest>(
            request,
            response,
            MaxBridgeV2ControlBodyBytes);
        if (registration == null)
            return;

        if (!IsSafeBridgeIdentifier(registration.ClientInstanceId, 128)
            || !IsSafeBridgeIdentifier(registration.ProductId, 64)
            || !IsSafeBridgeLabel(registration.ProductName, 128)
            || !IsSafeBridgeIdentifier(registration.ProductVersion, 64))
        {
            SendBridgeV2Error(
                response,
                400,
                "invalid_client_registration",
                "client_instance_id, product_id, product_name, and product_version are required bounded local attribution fields.");
            return;
        }

        try
        {
            BridgeClientRegistrationResponse result = BridgeV2Runtime.RegisterClient(registration);
            SendJson(response, result);
        }
        catch (InvalidOperationException ex)
        {
            SendBridgeV2Error(response, 409, "client_registration_conflict", ex.Message);
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "client_registration_failed", ex);
        }
    }

    private static void HandleGetBridgeV2Clients(HttpListenerResponse response)
    {
        try
        {
            SendJson(response, BridgeV2Runtime.GetControlSnapshot());
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "client_registry_read_failed", ex);
        }
    }

    private static void HandleGetBridgeV2Controller(HttpListenerResponse response)
    {
        try
        {
            SendJson(response, BridgeV2Runtime.GetControlSnapshot());
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "controller_status_read_failed", ex);
        }
    }

    private static void HandlePostBridgeV2Controller(
        string operation,
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        BridgeControllerLeaseRequest? leaseRequest = ReadBridgeV2JsonBody<BridgeControllerLeaseRequest>(
            request,
            response,
            MaxBridgeV2ControlBodyBytes);
        if (leaseRequest == null)
            return;

        bool acquire = string.Equals(operation, "acquire", StringComparison.Ordinal);
        if (!IsSafeBridgeIdentifier(leaseRequest.ClientSessionId, 128)
            || (!acquire && !IsSafeBridgeIdentifier(leaseRequest.ControllerLeaseId, 128))
            || (!acquire && leaseRequest.ControllerGeneration is null or <= 0))
        {
            SendBridgeV2Error(
                response,
                400,
                "invalid_controller_contract",
                acquire
                    ? "client_session_id is required to acquire mutation control."
                    : "client_session_id, controller_lease_id, and a positive controller_generation are required.");
            return;
        }

        try
        {
            BridgeControllerLeaseResponse result = operation switch
            {
                "acquire" => BridgeV2Runtime.AcquireController(leaseRequest),
                "renew" => BridgeV2Runtime.RenewController(leaseRequest),
                "release" => BridgeV2Runtime.ReleaseController(leaseRequest),
                _ => throw new InvalidOperationException("Unknown controller operation.")
            };
            response.StatusCode = result.Status switch
            {
                "controller_acquired" or "controller_already_held" or "controller_renewed"
                    or "controller_released" => 200,
                "controller_lease_held" or "controller_lease_stale" => 409,
                "client_session_not_found" => 404,
                _ => 409
            };
            SendJson(response, result);
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "controller_operation_failed", ex);
        }
    }

    private static T? ReadBridgeV2JsonBody<T>(
        HttpListenerRequest request,
        HttpListenerResponse response,
        int maxBytes)
    {
        if (request.ContentLength64 > maxBytes)
        {
            SendBridgeV2Error(response, 413, "request_too_large", $"Request exceeds {maxBytes} bytes.");
            return default;
        }

        string body;
        using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            body = reader.ReadToEnd();

        try
        {
            T? result = JsonSerializer.Deserialize<T>(body, _jsonOptions);
            if (result == null)
                SendBridgeV2Error(response, 400, "invalid_json", "Request body must be a JSON object.");
            return result;
        }
        catch (JsonException)
        {
            SendBridgeV2Error(response, 400, "invalid_json", "Request body must be valid JSON.");
            return default;
        }
    }

    private static void HandleGetBridgeV2Command(string encodedRequestId, HttpListenerResponse response)
    {
        string requestId;
        try
        {
            requestId = Uri.UnescapeDataString(encodedRequestId);
        }
        catch (UriFormatException)
        {
            SendBridgeV2Error(response, 400, "invalid_request_id", "Request id is not valid URI data.");
            return;
        }

        if (!IsSafeBridgeIdentifier(requestId, 128))
        {
            SendBridgeV2Error(response, 400, "invalid_request_id", "Request id is not a valid opaque identifier.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() => BridgeV2Runtime.Poll(requestId));
            BridgeCommandResponse? result = task.GetAwaiter().GetResult();
            if (result == null)
            {
                SendBridgeV2Error(response, 404, "command_not_found", "No command exists for this request id.");
                return;
            }

            response.StatusCode = result.Status == "timed_out" ? 504 : 200;
            SendJson(response, result);
        }
        catch (Exception ex)
        {
            SendBridgeV2InternalError(response, "command_poll_failed", ex);
        }
    }

    private static bool IsSafeBridgeIdentifier(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maxLength)
            return false;

        foreach (char character in value)
        {
            if (!(char.IsAsciiLetterOrDigit(character) || character is '-' or '_' or '.'))
                return false;
        }
        return true;
    }

    private static bool IsSafeBridgeLabel(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maxLength)
            return false;
        return value.All(character => !char.IsControl(character));
    }

    private static void SendBridgeV2InternalError(
        HttpListenerResponse response,
        string code,
        Exception exception)
    {
        GD.PrintErr($"[STS2 MCP v2] {code}: {exception}");
        SendBridgeV2Error(
            response,
            500,
            code,
            $"Bridge operation failed with {exception.GetType().Name}. See local game log for details.");
    }

    private static void SendBridgeV2Error(
        HttpListenerResponse response,
        int statusCode,
        string code,
        string detail)
    {
        response.StatusCode = statusCode;
        SendJson(response, new { error = new { code, detail } });
    }
}
