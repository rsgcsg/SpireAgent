using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using Godot;
using STS2_MCP.ConnectorV3.Protocol;
using STS2_MCP.ConnectorV3.Runtime;

namespace STS2_MCP;

public static partial class McpMod
{
    private const int MaxConnectorV3CommandBodyBytes = 16 * 1024;
    private const int MaxConnectorV3ControlBodyBytes = 4 * 1024;
    private const int MaxConnectorV3HumanEquivalenceBodyBytes = 4 * 1024;

    private static void HandleGetConnectorV3Capabilities(HttpListenerResponse response)
    {
        try
        {
            var task = RunOnMainThread(ConnectorV3Runtime.GetCapabilities);
            SendJson(response, task.GetAwaiter().GetResult());
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(response, "capabilities_failed", ex);
        }
    }

    private static void HandleGetConnectorV3Observation(HttpListenerResponse response)
    {
        try
        {
            var task = RunOnMainThread(ConnectorV3Runtime.Observe);
            SendJson(response, task.GetAwaiter().GetResult());
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(response, "observation_failed", ex);
        }
    }

    private static void HandleGetConnectorV3Inspection(
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
            SendConnectorV3Error(
                response,
                400,
                "invalid_inspection_kind",
                "Inspection kind is not valid URI data.");
            return;
        }

        string? expectedStateToken = request.QueryString["expected_state_token"];
        if (!IsSafeBridgeIdentifier(kind, 64)
            || !IsSafeBridgeIdentifier(expectedStateToken, 128))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_inspection_contract",
                "A fixed inspection kind and expected_state_token are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() => ConnectorV3Runtime.Inspect(
                kind,
                expectedStateToken!));
            ConnectorV3InspectionReadResult result = task.GetAwaiter().GetResult();
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
            SendConnectorV3Error(
                response,
                statusCode,
                result.ErrorCode ?? "inspection_failed",
                result.Detail ?? "Inspection failed closed.");
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(response, "inspection_failed", ex);
        }
    }

    private static void HandleGetConnectorV3LinkedDetail(
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
            SendConnectorV3Error(
                response,
                400,
                "invalid_linked_detail_entity",
                "Linked-detail entity id is not valid URI data.");
            return;
        }

        string? expectedStateToken = request.QueryString["expected_state_token"];
        if (!IsSafeBridgeIdentifier(entityId, 128)
            || !IsSafeBridgeIdentifier(expectedStateToken, 128))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_linked_detail_contract",
                "A catalogued entity_id and expected_state_token are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() => ConnectorV3Runtime.ReadLinkedDetail(
                entityId,
                expectedStateToken!));
            ConnectorV3LinkedDetailReadResult result = task.GetAwaiter().GetResult();
            if (result.LinkedDetail != null)
            {
                SendJson(response, result.LinkedDetail);
                return;
            }
            int statusCode = result.ErrorCode == "linked_detail_binding_failed" ? 500 : 409;
            SendConnectorV3Error(
                response,
                statusCode,
                result.ErrorCode ?? "linked_detail_failed",
                result.Detail ?? "Linked-detail read failed closed.");
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(response, "linked_detail_failed", ex);
        }
    }

    private static void HandlePostConnectorV3ClientRegistration(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        ConnectorV3ClientRegistrationRequest? registration =
            ReadConnectorV3BoundedBody<ConnectorV3ClientRegistrationRequest>(
                request,
                response,
                MaxConnectorV3ControlBodyBytes,
                "Control");
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
            ConnectorV3ClientRegistrationResponse result =
                ConnectorV3Runtime.RegisterClient(registration);
            response.StatusCode = 201;
            SendJson(response, result);
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(
                response,
                "client_registration_failed",
                ex);
        }
    }

    private static void HandleGetConnectorV3Control(
        HttpListenerResponse response)
    {
        try
        {
            SendJson(response, ConnectorV3Runtime.GetControlSnapshot());
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(
                response,
                "controller_status_read_failed",
                ex);
        }
    }

    private static void HandlePostConnectorV3Controller(
        string operation,
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        ConnectorV3ControllerLeaseRequest? lease =
            ReadConnectorV3BoundedBody<ConnectorV3ControllerLeaseRequest>(
                request,
                response,
                MaxConnectorV3ControlBodyBytes,
                "Control");
        if (lease == null)
            return;
        bool acquire = string.Equals(
            operation,
            "acquire",
            StringComparison.Ordinal);
        if (!IsSafeBridgeIdentifier(lease.ClientSessionId, 128)
            || (!acquire
                && !IsSafeBridgeIdentifier(lease.ControllerLeaseId, 128))
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
            ConnectorV3ControllerLeaseResponse result = operation switch
            {
                "acquire" => ConnectorV3Runtime.AcquireController(lease),
                "renew" => ConnectorV3Runtime.RenewController(lease),
                _ => ConnectorV3Runtime.ReleaseController(lease)
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
        catch (Exception ex)
        {
            SendConnectorV3InternalError(
                response,
                "controller_operation_failed",
                ex);
        }
    }

    private static void HandlePostConnectorV3HumanEquivalenceOpen(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        ConnectorV3HumanEquivalenceOpenRequest? open =
            ReadConnectorV3BoundedBody<ConnectorV3HumanEquivalenceOpenRequest>(
                request,
                response,
                MaxConnectorV3HumanEquivalenceBodyBytes,
                "Human-equivalence");
        if (open == null)
            return;
        if (!IsSafeBridgeIdentifier(open.Profile, 64)
            || !IsSafeBridgeIdentifier(open.Kind, 64)
            || !IsSafeBridgeIdentifier(open.ExpectedStateToken, 128)
            || !IsSafeBridgeIdentifier(open.ExpectedRuntimeInstanceId, 128))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_human_equivalence_contract",
                "Profile, fixed page kind, expected_state_token and expected_runtime_instance_id are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() =>
                ConnectorV3Runtime.OpenHumanEquivalence(open));
            ConnectorV3HumanEquivalenceOperationResult result =
                task.GetAwaiter().GetResult();
            SendConnectorV3HumanEquivalenceResult(response, result, 201);
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(
                response,
                "human_equivalence_open_failed",
                ex);
        }
    }

    private static void HandleGetConnectorV3HumanEquivalence(
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
            SendConnectorV3Error(
                response,
                400,
                "invalid_human_equivalence_session",
                "Session id is not valid URI data.");
            return;
        }
        string? expectedRuntime =
            request.QueryString["expected_runtime_instance_id"];
        if (!IsSafeBridgeIdentifier(sessionId, 128)
            || !IsSafeBridgeIdentifier(expectedRuntime, 128))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_human_equivalence_session",
                "A bounded session id and expected_runtime_instance_id are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() =>
                ConnectorV3Runtime.ReadHumanEquivalence(
                    sessionId,
                    expectedRuntime!));
            ConnectorV3HumanEquivalenceOperationResult result =
                task.GetAwaiter().GetResult();
            SendConnectorV3HumanEquivalenceResult(response, result, 200);
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(
                response,
                "human_equivalence_read_failed",
                ex);
        }
    }

    private static void HandlePostConnectorV3HumanEquivalenceReturn(
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
            SendConnectorV3Error(
                response,
                400,
                "invalid_human_equivalence_session",
                "Session id is not valid URI data.");
            return;
        }
        ConnectorV3HumanEquivalenceReturnRequest? returned =
            ReadConnectorV3BoundedBody<ConnectorV3HumanEquivalenceReturnRequest>(
                request,
                response,
                MaxConnectorV3HumanEquivalenceBodyBytes,
                "Human-equivalence");
        if (returned == null)
            return;
        if (!IsSafeBridgeIdentifier(sessionId, 128)
            || !IsSafeBridgeIdentifier(returned.Profile, 64)
            || !IsSafeBridgeIdentifier(
                returned.ExpectedRuntimeInstanceId,
                128))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_human_equivalence_return",
                "A bounded session, profile and expected runtime identity are required.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() =>
                ConnectorV3Runtime.ReturnHumanEquivalence(
                    sessionId,
                    returned));
            ConnectorV3HumanEquivalenceOperationResult result =
                task.GetAwaiter().GetResult();
            SendConnectorV3HumanEquivalenceResult(response, result, 200);
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(
                response,
                "human_equivalence_return_failed",
                ex);
        }
    }

    private static T? ReadConnectorV3BoundedBody<T>(
        HttpListenerRequest request,
        HttpListenerResponse response,
        int maxBodyBytes,
        string contractLabel)
    {
        if (request.ContentLength64 > maxBodyBytes)
        {
            SendConnectorV3Error(
                response,
                413,
                "request_too_large",
                $"{contractLabel} request exceeds {maxBodyBytes / 1024} KiB.");
            return default;
        }

        byte[]? bytes = ReadConnectorV3BoundedBodyBytes(
            request.InputStream,
            maxBodyBytes);
        if (bytes == null)
        {
            SendConnectorV3Error(
                response,
                413,
                "request_too_large",
                $"{contractLabel} request exceeds {maxBodyBytes / 1024} KiB.");
            return default;
        }

        string body = request.ContentEncoding.GetString(bytes);
        try
        {
            return JsonSerializer.Deserialize<T>(body, _jsonOptions);
        }
        catch (JsonException)
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_json",
                "Request body must be valid JSON.");
            return default;
        }
    }

    internal static byte[]? ReadConnectorV3BoundedBodyBytes(
        Stream inputStream,
        int maxBodyBytes)
    {
        byte[] bytes = new byte[maxBodyBytes + 1];
        int count = 0;
        while (count < bytes.Length)
        {
            int read = inputStream.Read(
                bytes,
                count,
                bytes.Length - count);
            if (read == 0)
                break;
            count += read;
        }
        if (count > maxBodyBytes)
            return null;
        return bytes[..count];
    }

    private static void SendConnectorV3HumanEquivalenceResult(
        HttpListenerResponse response,
        ConnectorV3HumanEquivalenceOperationResult result,
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
            "human_equivalence_session_not_found" => 404,
            "human_equivalence_kind_not_supported" => 400,
            _ => 409
        };
        SendConnectorV3Error(
            response,
            statusCode,
            result.ErrorCode ?? "human_equivalence_failed",
            result.Detail ?? "Human-equivalence evidence operation failed closed.");
    }

    private static void HandlePostConnectorV3Command(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        ConnectorV3CommandRequest? command =
            ReadConnectorV3BoundedBody<ConnectorV3CommandRequest>(
                request,
                response,
                MaxConnectorV3CommandBodyBytes,
                "Command");
        if (command == null)
            return;

        if (!IsValidConnectorV3Command(command))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_command_contract",
                "The command requires bounded request, state, interaction, command, operand, and controller identities.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() => ConnectorV3Runtime.Submit(command!));
            ConnectorV3CommandReceipt result = task.GetAwaiter().GetResult();
            response.StatusCode = result.Status switch
            {
                "pending" => 202,
                "not_executed" => 409,
                _ => 200
            };
            SendJson(response, result);
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(response, "command_submission_failed", ex);
        }
    }

    private static void HandleGetConnectorV3Command(
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
            SendConnectorV3Error(
                response,
                400,
                "invalid_request_id",
                "Request id is not valid URI data.");
            return;
        }

        if (!IsSafeBridgeIdentifier(requestId, 128))
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_request_id",
                "Request id is not a valid opaque identifier.");
            return;
        }

        try
        {
            var task = RunOnMainThread(() => ConnectorV3Runtime.Poll(requestId));
            ConnectorV3CommandReceipt? result = task.GetAwaiter().GetResult();
            if (result == null)
            {
                SendConnectorV3Error(
                    response,
                    404,
                    "command_not_found",
                    "No command exists for this request id.");
                return;
            }

            SendJson(response, result);
        }
        catch (Exception ex)
        {
            SendConnectorV3InternalError(response, "command_poll_failed", ex);
        }
    }

    private static bool IsValidConnectorV3Command(ConnectorV3CommandRequest? command)
    {
        if (command == null
            || !IsSafeBridgeIdentifier(command.RequestId, 128)
            || !IsSafeBridgeIdentifier(command.ExpectedStateToken, 128)
            || !IsSafeBridgeIdentifier(command.InteractionId, 128)
            || !IsSafeBridgeIdentifier(command.Command, 64)
            || !IsSafeBridgeIdentifier(command.ClientSessionId, 128)
            || !IsSafeBridgeIdentifier(command.ControllerLeaseId, 128)
            || command.ControllerGeneration is null or <= 0)
        {
            return false;
        }

        IReadOnlyDictionary<string, string> operands =
            command.Operands ?? new Dictionary<string, string>();
        if (operands.Count > 8
            || operands.Any(pair =>
                !IsSafeBridgeIdentifier(pair.Key, 64)
                || !IsSafeBridgeIdentifier(pair.Value, 128)))
        {
            return false;
        }

        return command.Consumer == null
               || (IsSafeBridgeIdentifier(command.Consumer.Profile, 64)
                   && (command.Consumer.AgentId == null
                       || IsSafeBridgeIdentifier(command.Consumer.AgentId, 64))
                   && (command.Consumer.AgentVersion == null
                       || IsSafeBridgeIdentifier(command.Consumer.AgentVersion, 64)));
    }

    private static void SendConnectorV3InternalError(
        HttpListenerResponse response,
        string code,
        Exception exception)
    {
        GD.PrintErr($"[STS2 Connector v3] {code}: {exception}");
        SendConnectorV3Error(
            response,
            500,
            code,
            $"Connector operation failed with {exception.GetType().Name}. See local game log for details.");
    }

    private static void SendConnectorV3Error(
        HttpListenerResponse response,
        int statusCode,
        string code,
        string detail)
    {
        response.StatusCode = statusCode;
        SendJson(response, new { error = new { code, detail } });
    }
}
