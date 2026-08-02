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

    private static void HandlePostConnectorV3Command(
        HttpListenerRequest request,
        HttpListenerResponse response)
    {
        if (request.ContentLength64 > MaxConnectorV3CommandBodyBytes)
        {
            SendConnectorV3Error(
                response,
                413,
                "request_too_large",
                "Command request exceeds 16 KiB.");
            return;
        }

        string body;
        using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            body = reader.ReadToEnd();

        ConnectorV3CommandRequest? command;
        try
        {
            command = JsonSerializer.Deserialize<ConnectorV3CommandRequest>(body, _jsonOptions);
        }
        catch (JsonException)
        {
            SendConnectorV3Error(
                response,
                400,
                "invalid_json",
                "Request body must be valid JSON.");
            return;
        }

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
