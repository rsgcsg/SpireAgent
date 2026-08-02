using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Godot;
using HarmonyLib;
using MegaCrit.Sts2.Core.Modding;
using MegaCrit.Sts2.Core.Multiplayer.Game;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP;

[ModInitializer("Initialize")]
public static partial class McpMod
{
    public const string Version = "0.6.0-dev";
    public const int DefaultPort = 15526;
    private const string ConfigFileName = "STS2_MCP.conf";
    private const string QualificationStoreFileName =
        "STS2_MCP.qualifications.json";

    private static HttpListener? _listener;
    private static Thread? _serverThread;
    private static readonly ConcurrentQueue<Action> _mainThreadQueue = new();
    internal static readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private sealed record RuntimeConfig(
        int Port,
        BridgePermissionMode PermissionMode,
        string? QualificationStorePath);

    private static RuntimeConfig LoadRuntimeConfig()
    {
        try
        {
            string? modDir = Path.GetDirectoryName(
                System.Reflection.Assembly.GetExecutingAssembly().Location);
            if (modDir == null)
                return new RuntimeConfig(
                    DefaultPort,
                    BridgePermissionMode.BalancedGray,
                    null);

            string configPath = Path.Combine(modDir, ConfigFileName);
            if (!File.Exists(configPath))
            {
                try
                {
                    var defaultConfig = new Dictionary<string, object>
                    {
                        ["port"] = DefaultPort,
                        ["permission_mode"] = "balanced_gray",
                        ["qualification_store"] = QualificationStoreFileName
                    };
                    string json = JsonSerializer.Serialize(defaultConfig, _jsonOptions);
                    File.WriteAllText(configPath, json);
                    GD.Print($"[STS2 MCP] Created default config at {configPath}");
                }
                catch (Exception ex) when (ex is UnauthorizedAccessException or IOException)
                {
                    GD.Print($"[STS2 MCP] No config found at {configPath}; using default port {DefaultPort}");
                }
                return new RuntimeConfig(
                    DefaultPort,
                    BridgePermissionMode.BalancedGray,
                    Path.Combine(modDir, QualificationStoreFileName));
            }

            string content = File.ReadAllText(configPath);
            using var doc = JsonDocument.Parse(content);
            int configuredPort = DefaultPort;
            if (doc.RootElement.TryGetProperty("port", out var portElem)
                && portElem.TryGetInt32(out int port)
                && port is > 0 and <= 65535)
            {
                configuredPort = port;
            }
            else
            {
                GD.PrintErr(
                    $"[STS2 MCP] Invalid or missing 'port' in {configPath}, using default {DefaultPort}");
            }

            string? permissionMode = doc.RootElement.TryGetProperty(
                "permission_mode",
                out JsonElement modeElement)
                ? modeElement.GetString()
                : null;
            if (permissionMode is not null
                && permissionMode is not (
                    "strict"
                    or "balanced_gray"
                    or "developer_gray"
                    or "migration_exploration"))
            {
                GD.PrintErr(
                    $"[STS2 MCP] Invalid permission_mode '{permissionMode}' in {configPath}; failing closed to strict");
                permissionMode = "strict";
            }
            string? qualificationStore = QualificationStoreFileName;
            if (doc.RootElement.TryGetProperty(
                    "qualification_store",
                    out JsonElement qualificationElement))
            {
                qualificationStore = qualificationElement.ValueKind switch
                {
                    JsonValueKind.Null => null,
                    JsonValueKind.String
                        when string.Equals(
                            qualificationElement.GetString(),
                            "disabled",
                            StringComparison.OrdinalIgnoreCase) => null,
                    JsonValueKind.String
                        when !string.IsNullOrWhiteSpace(
                            qualificationElement.GetString()) =>
                        qualificationElement.GetString(),
                    _ => QualificationStoreFileName
                };
            }
            string? qualificationStorePath = qualificationStore == null
                ? null
                : Path.IsPathRooted(qualificationStore)
                    ? qualificationStore
                    : Path.Combine(modDir, qualificationStore);
            return new RuntimeConfig(
                configuredPort,
                BridgePermissionManager.ParseMode(permissionMode),
                qualificationStorePath);
        }
        catch (Exception ex)
        {
            GD.PrintErr(
                $"[STS2 MCP] Failed to load config: {ex.Message}; using default port and strict permission mode");
            return new RuntimeConfig(
                DefaultPort,
                BridgePermissionMode.Strict,
                null);
        }
    }

    public static void Initialize()
    {
        try
        {
            // Optional settings UI patches should not block the HTTP bridge itself.
            TryApplyHarmonyPatches();

            // Connect to main thread process frame for action execution
            var tree = (SceneTree)Engine.GetMainLoop();
            tree.Connect(SceneTree.SignalName.ProcessFrame, Callable.From(ProcessMainThreadQueue));

            RuntimeConfig config = LoadRuntimeConfig();
            BridgeV2Runtime.ConfigurePermissionMode(config.PermissionMode);
            BridgeV2Runtime.ConfigureQualificationStore(
                config.QualificationStorePath);
            int port = config.Port;

            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://localhost:{port}/");
            _listener.Prefixes.Add($"http://127.0.0.1:{port}/");
            _listener.Start();

            _serverThread = new Thread(ServerLoop)
            {
                IsBackground = true,
                Name = "STS2_MCP_Server"
            };
            _serverThread.Start();

            GD.Print($"[STS2 MCP] v{Version} server started on http://localhost:{port}/");
            GD.Print(
                $"[STS2 MCP] Permission mode: {BridgePermissionManager.ModeName(config.PermissionMode)}");
            GD.Print("[STS2 MCP] Legacy v1 HTTP namespace: retired");
        }
        catch (Exception ex)
        {
            GD.PrintErr($"[STS2 MCP] Failed to start: {ex}");
        }
    }

    private static void TryApplyHarmonyPatches()
    {
        try
        {
            new Harmony("com.sts2mcp").PatchAll();
        }
        catch (Exception ex)
        {
            GD.Print(
                $"[STS2 MCP] Optional Harmony settings UI injection skipped: {ex.GetType().Name}: {ex.Message}");
        }
    }

    private static void ProcessMainThreadQueue()
    {
        int processed = 0;
        while (_mainThreadQueue.TryDequeue(out var action) && processed < 10)
        {
            try { action(); }
            catch (Exception ex) { GD.PrintErr($"[STS2 MCP] Main thread action error: {ex}"); }
            processed++;
        }
    }

    internal static Task<T> RunOnMainThread<T>(Func<T> func)
    {
        var tcs = new TaskCompletionSource<T>();
        _mainThreadQueue.Enqueue(() =>
        {
            try { tcs.SetResult(func()); }
            catch (Exception ex) { tcs.SetException(ex); }
        });
        return tcs.Task;
    }

    internal static Task RunOnMainThread(Action action)
    {
        var tcs = new TaskCompletionSource<bool>();
        _mainThreadQueue.Enqueue(() =>
        {
            try { action(); tcs.SetResult(true); }
            catch (Exception ex) { tcs.SetException(ex); }
        });
        return tcs.Task;
    }

    private static void ServerLoop()
    {
        while (_listener?.IsListening == true)
        {
            try
            {
                var context = _listener.GetContext();
                // Handle each request asynchronously so we don't block the listener
                ThreadPool.QueueUserWorkItem(_ => HandleRequest(context));
            }
            catch (HttpListenerException) { break; }
            catch (ObjectDisposedException) { break; }
        }
    }

    private static void HandleRequest(HttpListenerContext context)
    {
        try
        {
            var request = context.Request;
            var response = context.Response;
            string? origin = request.Headers["Origin"];
            if (!LoopbackOriginPolicy.IsAllowed(origin))
            {
                SendError(response, 403, "Browser origin is not allowed");
                return;
            }

            if (!string.IsNullOrWhiteSpace(origin))
            {
                response.Headers.Add("Access-Control-Allow-Origin", origin);
                response.Headers.Add("Vary", "Origin");
                response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
            }

            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = 204;
                response.Close();
                return;
            }

            string path = request.Url?.AbsolutePath ?? "/";

            if (LegacyV1RoutePolicy.IsRetiredPath(path))
            {
                SendError(
                    response,
                    410,
                    "Legacy v1 is retired. Use the Connector v3 contract.");
                return;
            }

            if (path == "/")
            {
                SendJson(response, new { message = $"Hello from STS2 MCP v{Version}", status = "ok" });
            }
            else if (path == "/api/v3/capabilities")
            {
                if (request.HttpMethod == "GET")
                    HandleGetConnectorV3Capabilities(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v3/observation")
            {
                if (request.HttpMethod == "GET")
                    HandleGetConnectorV3Observation(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v3/clients/register")
            {
                if (request.HttpMethod == "POST")
                    HandlePostBridgeV2ClientRegistration(request, response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v3/controller")
            {
                if (request.HttpMethod == "GET")
                    HandleGetBridgeV2Controller(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v3/clients")
            {
                if (request.HttpMethod == "GET")
                    HandleGetBridgeV2Clients(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith("/api/v3/controller/", StringComparison.Ordinal))
            {
                string operation = path["/api/v3/controller/".Length..];
                if (request.HttpMethod == "POST"
                    && operation is "acquire" or "renew" or "release")
                    HandlePostBridgeV2Controller(
                        operation,
                        request,
                        response);
                else if (request.HttpMethod == "POST")
                    SendError(response, 404, "Unknown controller operation");
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v3/commands")
            {
                if (request.HttpMethod == "POST")
                    HandlePostConnectorV3Command(request, response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith("/api/v3/commands/", StringComparison.Ordinal))
            {
                if (request.HttpMethod == "GET")
                    HandleGetConnectorV3Command(
                        path["/api/v3/commands/".Length..],
                        response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith("/api/v3/inspections/", StringComparison.Ordinal))
            {
                if (request.HttpMethod == "GET")
                    HandleGetConnectorV3Inspection(
                        path["/api/v3/inspections/".Length..],
                        request,
                        response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v2/capabilities")
            {
                if (request.HttpMethod == "GET")
                    HandleGetBridgeV2Capabilities(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v2/state")
            {
                if (request.HttpMethod == "GET")
                    HandleGetBridgeV2State(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith("/api/v2/inspections/", StringComparison.Ordinal))
            {
                if (request.HttpMethod == "GET")
                    HandleGetBridgeV2Inspection(
                        path["/api/v2/inspections/".Length..],
                        request,
                        response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v2/observation-bundles")
            {
                if (request.HttpMethod == "POST")
                    HandlePostBridgeV2ObservationBundle(request, response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v2/clients/register")
            {
                if (request.HttpMethod == "POST")
                    HandlePostBridgeV2ClientRegistration(request, response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v2/clients")
            {
                if (request.HttpMethod == "GET")
                    HandleGetBridgeV2Clients(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v2/controller")
            {
                if (request.HttpMethod == "GET")
                    HandleGetBridgeV2Controller(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith("/api/v2/controller/", StringComparison.Ordinal))
            {
                string operation = path["/api/v2/controller/".Length..];
                if (request.HttpMethod == "POST"
                    && operation is "acquire" or "renew" or "release")
                    HandlePostBridgeV2Controller(
                        operation,
                        request,
                        response);
                else if (request.HttpMethod == "POST")
                    SendError(response, 404, "Unknown controller operation");
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/v2/commands")
            {
                if (request.HttpMethod == "POST")
                    HandlePostBridgeV2Command(request, response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith("/api/v2/commands/", StringComparison.Ordinal))
            {
                if (request.HttpMethod == "GET")
                    HandleGetBridgeV2Command(path["/api/v2/commands/".Length..], response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else
            {
                SendError(response, 404, "Not found");
            }
        }
        catch (Exception ex)
        {
            try
            {
                SendError(context.Response, 500, $"Internal error: {ex.Message}");
            }
            catch { /* response may already be closed */ }
        }
    }

    // Called on HTTP thread (not main thread) as a best-effort guard.
    // The try/catch handles race conditions during run transitions.
    // Authoritative checks happen inside RunOnMainThread lambdas.
    internal static bool IsMultiplayerRun()
    {
        try
        {
            return MegaCrit.Sts2.Core.Runs.RunManager.Instance.IsInProgress
                && MegaCrit.Sts2.Core.Runs.RunManager.Instance.NetService.Type.IsMultiplayer();
        }
        catch { return false; }
    }

}
