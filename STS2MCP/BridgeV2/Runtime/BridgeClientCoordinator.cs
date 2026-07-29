using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal sealed record BridgeCommandAdmission(
    bool Accepted,
    string? ErrorCode,
    string? Detail,
    BridgeCommandAttribution? Attribution)
{
    public static BridgeCommandAdmission Allow(BridgeCommandAttribution attribution) =>
        new(true, null, null, attribution);

    public static BridgeCommandAdmission Reject(string code, string detail) =>
        new(false, code, detail, null);
}

internal sealed class BridgeClientCoordinator
{
    public const int DefaultLeaseTtlMs = 30_000;
    public const int RecommendedRenewalMs = 10_000;
    // Registrations live only for one game runtime. Keep a generous runaway
    // bound without making normal repeated CLI/Agent launches exhaust control.
    private const int MaxRegisteredClients = 4_096;

    private readonly object _gate = new();
    private readonly string _runtimeInstanceId;
    private readonly TimeSpan _leaseTtl;
    private readonly Func<DateTimeOffset> _clock;
    private readonly Dictionary<string, MutableClient> _clientsBySession = new(StringComparer.Ordinal);
    private readonly Dictionary<string, string> _sessionByInstance = new(StringComparer.Ordinal);
    private MutableLease? _controller;
    private long _nextGeneration;

    public BridgeClientCoordinator(
        string runtimeInstanceId,
        int leaseTtlMs = DefaultLeaseTtlMs,
        Func<DateTimeOffset>? clock = null)
    {
        if (string.IsNullOrWhiteSpace(runtimeInstanceId))
            throw new ArgumentException("A runtime instance id is required.", nameof(runtimeInstanceId));
        if (leaseTtlMs <= 0)
            throw new ArgumentOutOfRangeException(nameof(leaseTtlMs));

        _runtimeInstanceId = runtimeInstanceId;
        _leaseTtl = TimeSpan.FromMilliseconds(leaseTtlMs);
        _clock = clock ?? (() => DateTimeOffset.UtcNow);
    }

    public BridgeClientRegistrationResponse Register(BridgeClientRegistrationRequest request)
    {
        lock (_gate)
        {
            DateTimeOffset now = _clock();
            ExpireController(now);
            string instanceId = request.ClientInstanceId!;
            if (_sessionByInstance.TryGetValue(instanceId, out string? existingSession))
            {
                MutableClient existing = _clientsBySession[existingSession];
                if (!existing.Matches(request))
                    throw new InvalidOperationException(
                        "client_instance_id is already registered with different product metadata.");

                existing.Touch(now);
                return new BridgeClientRegistrationResponse(
                    BridgeV2Contract.ProtocolVersion,
                    _runtimeInstanceId,
                    existing.ToRecord(),
                    _controller?.ToInfo());
            }

            if (_clientsBySession.Count >= MaxRegisteredClients)
                throw new InvalidOperationException(
                    "The runtime client registry is full. Restart the Gateway to clear local sessions.");

            string sessionId = "client_" + Guid.NewGuid().ToString("N");
            var client = new MutableClient(
                sessionId,
                instanceId,
                request.ProductId!,
                request.ProductName!,
                request.ProductVersion!,
                now);
            _clientsBySession[sessionId] = client;
            _sessionByInstance[instanceId] = sessionId;
            return new BridgeClientRegistrationResponse(
                BridgeV2Contract.ProtocolVersion,
                _runtimeInstanceId,
                client.ToRecord(),
                _controller?.ToInfo());
        }
    }

    public BridgeControlSnapshot Snapshot()
    {
        lock (_gate)
        {
            ExpireController(_clock());
            return new BridgeControlSnapshot(
                BridgeV2Contract.ProtocolVersion,
                _runtimeInstanceId,
                _clientsBySession.Values
                    .Select(client => client.ToRecord())
                    .OrderBy(client => client.RegisteredAt)
                    .ToArray(),
                _controller?.ToInfo());
        }
    }

    public BridgeControllerLeaseResponse Acquire(BridgeControllerLeaseRequest request)
    {
        lock (_gate)
        {
            DateTimeOffset now = _clock();
            ExpireController(now);
            if (!TryGetClient(request.ClientSessionId, now, out MutableClient? client))
                return Rejected("client_session_not_found", "Register this client in the current Gateway runtime before acquiring control.");
            MutableClient activeClient = client!;

            if (_controller != null)
            {
                if (string.Equals(_controller.ClientSessionId, activeClient.ClientSessionId, StringComparison.Ordinal))
                    return Accepted("controller_already_held", "This client already holds the controller lease.", activeClient);
                return Rejected(
                    "controller_lease_held",
                    $"Mutation control is currently held by {_clientsBySession[_controller.ClientSessionId].ProductName}.");
            }

            _nextGeneration++;
            _controller = new MutableLease(
                "lease_" + Guid.NewGuid().ToString("N"),
                _nextGeneration,
                activeClient.ClientSessionId,
                now,
                now + _leaseTtl);
            return Accepted("controller_acquired", "Mutation control was acquired for this Gateway runtime.", activeClient);
        }
    }

    public BridgeControllerLeaseResponse Renew(BridgeControllerLeaseRequest request)
    {
        lock (_gate)
        {
            DateTimeOffset now = _clock();
            ExpireController(now);
            if (!TryGetClient(request.ClientSessionId, now, out MutableClient? client))
                return Rejected("client_session_not_found", "The client session does not belong to this Gateway runtime.");
            MutableClient activeClient = client!;
            if (!MatchesCurrentLease(request))
                return Rejected("controller_lease_stale", "The controller lease id or generation is no longer current.");

            _controller!.ExpiresAt = now + _leaseTtl;
            return Accepted("controller_renewed", "Mutation control was renewed.", activeClient);
        }
    }

    public BridgeControllerLeaseResponse Release(BridgeControllerLeaseRequest request)
    {
        lock (_gate)
        {
            DateTimeOffset now = _clock();
            ExpireController(now);
            if (!TryGetClient(request.ClientSessionId, now, out MutableClient? client))
                return Rejected("client_session_not_found", "The client session does not belong to this Gateway runtime.");
            MutableClient activeClient = client!;
            if (!MatchesCurrentLease(request))
                return Rejected("controller_lease_stale", "The controller lease id or generation is no longer current.");

            _controller = null;
            return new BridgeControllerLeaseResponse(
                BridgeV2Contract.ProtocolVersion,
                _runtimeInstanceId,
                "controller_released",
                "Mutation control was released.",
                activeClient.ToRecord(),
                null);
        }
    }

    public BridgeCommandAdmission Authorize(BridgeCommandRequest request)
    {
        lock (_gate)
        {
            DateTimeOffset now = _clock();
            ExpireController(now);
            if (!TryGetClient(request.ClientSessionId, now, out MutableClient? client))
            {
                return BridgeCommandAdmission.Reject(
                    "client_session_not_found",
                    "Mutation commands require a client session registered in the current Gateway runtime.");
            }
            MutableClient activeClient = client!;
            if (!MatchesCurrentLease(new BridgeControllerLeaseRequest(
                    request.ClientSessionId,
                    request.ControllerLeaseId,
                    request.ControllerGeneration)))
            {
                return BridgeCommandAdmission.Reject(
                    "controller_lease_stale",
                    "Mutation commands require the current controller lease id and generation.");
            }

            MutableLease activeController = _controller!;
            return BridgeCommandAdmission.Allow(new BridgeCommandAttribution(
                _runtimeInstanceId,
                activeClient.ClientSessionId,
                activeClient.ClientInstanceId,
                activeClient.ProductId,
                activeClient.ProductName,
                activeClient.ProductVersion,
                activeController.LeaseId,
                activeController.Generation));
        }
    }

    public ControlCoordinationContractCapability Capability() => new(
        "local_coordination_active",
        RegistrationRequiredForMutation: true,
        SingleController: true,
        ReadsRequireRegistration: false,
        LeaseTtlMs: (int)_leaseTtl.TotalMilliseconds,
        RecommendedRenewalMs,
        _runtimeInstanceId,
        new[]
        {
            "Client metadata is diagnostic attribution, not authentication.",
            "The lease coordinates local mutation clients; it does not defend against a malicious local process.",
            "Lease expiry blocks new commands but never cancels or retries a command already admitted to the ledger."
        });

    private bool TryGetClient(string? sessionId, DateTimeOffset now, out MutableClient? client)
    {
        if (sessionId != null && _clientsBySession.TryGetValue(sessionId, out client))
        {
            client.Touch(now);
            return true;
        }
        client = null;
        return false;
    }

    private bool MatchesCurrentLease(BridgeControllerLeaseRequest request) =>
        _controller != null
        && string.Equals(_controller.ClientSessionId, request.ClientSessionId, StringComparison.Ordinal)
        && string.Equals(_controller.LeaseId, request.ControllerLeaseId, StringComparison.Ordinal)
        && _controller.Generation == request.ControllerGeneration;

    private void ExpireController(DateTimeOffset now)
    {
        if (_controller != null && now >= _controller.ExpiresAt)
            _controller = null;
    }

    private BridgeControllerLeaseResponse Accepted(
        string status,
        string detail,
        MutableClient client) =>
        new(
            BridgeV2Contract.ProtocolVersion,
            _runtimeInstanceId,
            status,
            detail,
            client.ToRecord(),
            _controller?.ToInfo());

    private BridgeControllerLeaseResponse Rejected(string status, string detail) =>
        new(
            BridgeV2Contract.ProtocolVersion,
            _runtimeInstanceId,
            status,
            detail,
            null,
            _controller?.ToInfo());

    private sealed class MutableClient
    {
        public MutableClient(
            string clientSessionId,
            string clientInstanceId,
            string productId,
            string productName,
            string productVersion,
            DateTimeOffset registeredAt)
        {
            ClientSessionId = clientSessionId;
            ClientInstanceId = clientInstanceId;
            ProductId = productId;
            ProductName = productName;
            ProductVersion = productVersion;
            RegisteredAt = registeredAt;
            LastSeenAt = registeredAt;
        }

        public string ClientSessionId { get; }
        public string ClientInstanceId { get; }
        public string ProductId { get; }
        public string ProductName { get; }
        public string ProductVersion { get; }
        public DateTimeOffset RegisteredAt { get; }
        public DateTimeOffset LastSeenAt { get; private set; }

        public bool Matches(BridgeClientRegistrationRequest request) =>
            string.Equals(ProductId, request.ProductId, StringComparison.Ordinal)
            && string.Equals(ProductName, request.ProductName, StringComparison.Ordinal)
            && string.Equals(ProductVersion, request.ProductVersion, StringComparison.Ordinal);

        public void Touch(DateTimeOffset now) => LastSeenAt = now;

        public BridgeClientRecord ToRecord() => new(
            ClientSessionId,
            ClientInstanceId,
            ProductId,
            ProductName,
            ProductVersion,
            RegisteredAt,
            LastSeenAt);
    }

    private sealed class MutableLease
    {
        public MutableLease(
            string leaseId,
            long generation,
            string clientSessionId,
            DateTimeOffset acquiredAt,
            DateTimeOffset expiresAt)
        {
            LeaseId = leaseId;
            Generation = generation;
            ClientSessionId = clientSessionId;
            AcquiredAt = acquiredAt;
            ExpiresAt = expiresAt;
        }

        public string LeaseId { get; }
        public long Generation { get; }
        public string ClientSessionId { get; }
        public DateTimeOffset AcquiredAt { get; }
        public DateTimeOffset ExpiresAt { get; set; }

        public BridgeControllerLeaseInfo ToInfo() => new(
            "active",
            LeaseId,
            Generation,
            ClientSessionId,
            AcquiredAt,
            ExpiresAt);
    }
}
