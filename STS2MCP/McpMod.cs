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
using STS2_MCP.Authority;

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
        EnvironmentPermissionMode PermissionMode,
        string? QualificationStorePath,
        bool NativePageEvidenceEnabled);

    private static RuntimeConfig LoadRuntimeConfig()
    {
        try
        {
            string? modDir = Path.GetDirectoryName(
                System.Reflection.Assembly.GetExecutingAssembly().Location);
            if (modDir == null)
                return new RuntimeConfig(
                    DefaultPort,
                    EnvironmentPermissionMode.BalancedGray,
                    null,
                    NativePageEvidenceEnabled: false);

            string configPath = Path.Combine(modDir, ConfigFileName);
            if (!File.Exists(configPath))
            {
                try
                {
                    var defaultConfig = new Dictionary<string, object>
                    {
                        ["port"] = DefaultPort,
                        ["permission_mode"] = "balanced_gray",
                        ["qualification_store"] = QualificationStoreFileName,
                        ["human_environment_native_page_evidence_enabled"] = false
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
                    EnvironmentPermissionMode.BalancedGray,
                    Path.Combine(modDir, QualificationStoreFileName),
                    NativePageEvidenceEnabled: false);
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
            bool nativePageEvidenceEnabled = false;
            if (doc.RootElement.TryGetProperty(
                    "human_environment_native_page_evidence_enabled",
                    out JsonElement nativePageEvidenceElement))
            {
                if (nativePageEvidenceElement.ValueKind is JsonValueKind.True or JsonValueKind.False)
                {
                    nativePageEvidenceEnabled = nativePageEvidenceElement.GetBoolean();
                }
                else
                {
                    GD.PrintErr(
                        $"[STS2 MCP] Invalid human_environment_native_page_evidence_enabled in {configPath}; keeping the optional evidence profile disabled");
                }
            }
            return new RuntimeConfig(
                configuredPort,
                EnvironmentPermissionManager.ParseMode(permissionMode),
                qualificationStorePath,
                nativePageEvidenceEnabled);
        }
        catch (Exception ex)
        {
            GD.PrintErr(
                $"[STS2 MCP] Failed to load config: {ex.Message}; using default port and strict permission mode");
            return new RuntimeConfig(
                DefaultPort,
                EnvironmentPermissionMode.Strict,
                null,
                NativePageEvidenceEnabled: false);
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
            GatewayAuthorityRuntime.Configure(
                config.PermissionMode,
                config.QualificationStorePath);
            HumanEnvironment.Runtime.HumanEnvironmentRuntime.ConfigureNativePageEvidence(
                config.NativePageEvidenceEnabled);
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
                $"[STS2 MCP] Permission mode: {EnvironmentPermissionManager.ModeName(config.PermissionMode)}");
            GD.Print(
                $"[STS2 MCP] Human Environment native-page evidence: {(config.NativePageEvidenceEnabled ? "enabled" : "disabled")}");
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
                    "Legacy v1 is retired. Use the Human Environment contract at /api/he.");
                return;
            }

            if (path.StartsWith("/api/v2", StringComparison.Ordinal)
                || path.StartsWith("/api/v3", StringComparison.Ordinal))
            {
                SendError(
                    response,
                    410,
                    "Bridge v2 and Connector v3 transports are retired in this artifact. Use /api/he; rollback requires a prior artifact.");
                return;
            }

            if (path == "/")
            {
                SendJson(response, new { message = $"Hello from STS2 MCP v{Version}", status = "ok" });
            }
            else if (path == "/api/he/capabilities")
            {
                if (request.HttpMethod == "GET")
                    HandleGetHumanEnvironmentCapabilities(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/he/observation")
            {
                if (request.HttpMethod == "GET")
                    HandleGetHumanEnvironmentObservation(request, response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith("/api/he/reads/", StringComparison.Ordinal))
            {
                if (request.HttpMethod == "GET")
                    HandleGetHumanEnvironmentRead(
                        path["/api/he/reads/".Length..],
                        request,
                        response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/he/clients/register")
            {
                if (request.HttpMethod == "POST")
                    HandlePostHumanEnvironmentClientRegistration(request, response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/he/controller")
            {
                if (request.HttpMethod == "GET")
                    HandleGetHumanEnvironmentControl(response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith("/api/he/controller/", StringComparison.Ordinal))
            {
                string operation = path["/api/he/controller/".Length..];
                if (request.HttpMethod == "POST" && operation is "acquire" or "renew" or "release")
                    HandlePostHumanEnvironmentController(operation, request, response);
                else if (request.HttpMethod == "POST")
                    SendError(response, 404, "Unknown controller operation");
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/he/actions")
            {
                if (request.HttpMethod == "POST")
                    HandlePostHumanEnvironmentAction(request, response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith("/api/he/actions/", StringComparison.Ordinal))
            {
                if (request.HttpMethod == "GET")
                    HandleGetHumanEnvironmentAction(path["/api/he/actions/".Length..], response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path == "/api/he/evidence/native-pages/sessions")
            {
                if (request.HttpMethod == "POST")
                    HandlePostHumanEnvironmentNativePageEvidenceOpen(request, response);
                else
                    SendError(response, 405, "Method not allowed");
            }
            else if (path.StartsWith(
                         "/api/he/evidence/native-pages/sessions/",
                         StringComparison.Ordinal))
            {
                string operation = path[
                    "/api/he/evidence/native-pages/sessions/".Length..];
                if (request.HttpMethod == "POST"
                    && operation.EndsWith("/return", StringComparison.Ordinal))
                {
                    HandlePostHumanEnvironmentNativePageEvidenceReturn(
                        operation[..^"/return".Length],
                        request,
                        response);
                }
                else if (request.HttpMethod == "GET"
                         && !operation.Contains('/'))
                {
                    HandleGetHumanEnvironmentNativePageEvidence(
                        operation,
                        request,
                        response);
                }
                else if (request.HttpMethod is "GET" or "POST")
                    SendError(response, 404, "Unknown native-page evidence operation");
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
