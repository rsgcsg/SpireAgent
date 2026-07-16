using System;
using System.IO;
using System.Net;
using System.Text.Json;
using Godot;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP;

public static partial class McpMod
{
    private const int MaxBridgeV2CommandBodyBytes = 16 * 1024;

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
            || !IsSafeBridgeIdentifier(command.ActionId, 128))
        {
            SendBridgeV2Error(
                response,
                400,
                "invalid_command_contract",
                "request_id, expected_state_id, and action_id are required opaque identifiers.");
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
