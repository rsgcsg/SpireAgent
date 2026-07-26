using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal enum BridgePermissionMode
{
    Strict,
    BalancedGray,
    DeveloperGray
}

internal sealed record BridgeGrayPermissionCandidate(
    string SurfaceKind,
    string Operation,
    string RiskClass,
    IReadOnlyList<string> EligibleModes,
    string RequiredStaticTier,
    string MinimumEvidenceStatus,
    int MinimumSuccesses,
    int SessionTtlSeconds,
    string WitnessId,
    IReadOnlyList<string> EvidenceIds);

internal sealed record BridgeActionPermissionBinding(
    string SurfaceKind,
    string Operation,
    string Tier,
    string GrantId,
    int GrantVersion,
    string RuntimeEpoch,
    string EnvironmentDigest,
    string PatchDigest,
    string OperationFingerprint);

internal sealed class BridgePermissionManager
{
    private readonly object _gate = new();
    private readonly string _runtimeEpoch;
    private readonly Func<DateTimeOffset> _clock;
    private readonly List<BridgePermissionGrantRecord> _grantLedger = new();
    private readonly Dictionary<string, BridgePermissionGrantRecord> _currentGrants =
        new(StringComparer.Ordinal);
    private readonly HashSet<string> _terminalRequests = new(StringComparer.Ordinal);
    private readonly HashSet<string> _blockedKeys = new(StringComparer.Ordinal);
    private BridgePermissionMode _mode;
    private string? _activeEnvironmentDigest;
    private BridgeRuntimePatchInventoryInfo _lastPatchInventory =
        BridgeRuntimePatchInventoryInfo.Unavailable("Patch inventory has not been read.");

    public BridgePermissionManager(
        string runtimeEpoch,
        BridgePermissionMode mode = BridgePermissionMode.BalancedGray,
        Func<DateTimeOffset>? clock = null)
    {
        _runtimeEpoch = runtimeEpoch;
        _mode = mode;
        _clock = clock ?? (() => DateTimeOffset.UtcNow);
    }

    public static BridgePermissionMode ParseMode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return BridgePermissionMode.BalancedGray;
        return value.Trim().ToLowerInvariant() switch
        {
            "strict" => BridgePermissionMode.Strict,
            "balanced_gray" => BridgePermissionMode.BalancedGray,
            "developer_gray" => BridgePermissionMode.DeveloperGray,
            _ => BridgePermissionMode.Strict
        };
    }

    public void ConfigureMode(BridgePermissionMode mode)
    {
        lock (_gate)
        {
            if (_mode == mode)
                return;

            QuarantineActiveGrants("permission_mode_changed");
            _mode = mode;
        }
    }

    public CompatibilityAssessment Apply(
        GameBuildIdentity game,
        BridgeServerIdentity bridge,
        BridgeRuntimePatchInventoryInfo patchInventory)
    {
        lock (_gate)
        {
            _lastPatchInventory = patchInventory;
            string environmentDigest = EnvironmentDigest(game, bridge, patchInventory);
            if (_activeEnvironmentDigest != null
                && !string.Equals(_activeEnvironmentDigest, environmentDigest, StringComparison.Ordinal))
            {
                QuarantineActiveGrants("exact_environment_or_patch_identity_changed");
            }
            _activeEnvironmentDigest = environmentDigest;

            var scopes = new List<ActionPermissionScope>();
            foreach (ActionPermissionScope staticScope in game.Compatibility.ActionPermissionScopes)
            {
                string operationFingerprint = OperationFingerprint(
                    staticScope.SurfaceKind,
                    staticScope.Operation);
                BridgeGrayPermissionCandidate? candidate =
                    BridgeGrayPermissionCandidateCatalog.Find(
                        staticScope.SurfaceKind,
                        staticScope.Operation);

                if (string.Equals(staticScope.Tier, "qualified", StringComparison.Ordinal))
                {
                    if (staticScope.GrantId.StartsWith(
                            "qualification_",
                            StringComparison.Ordinal))
                    {
                        if (staticScope.EnvironmentDigest == environmentDigest
                            && staticScope.PatchDigest == patchInventory.Digest
                            && staticScope.OperationFingerprint == operationFingerprint)
                        {
                            scopes.Add(staticScope);
                        }
                        continue;
                    }
                    scopes.Add(StaticScope(
                        staticScope,
                        "qualified",
                        bridge,
                        patchInventory,
                        environmentDigest,
                        operationFingerprint));
                    continue;
                }

                if (_mode == BridgePermissionMode.Strict)
                    continue;

                if (candidate == null)
                {
                    scopes.Add(StaticScope(
                        staticScope,
                        "canary",
                        bridge,
                        patchInventory,
                        environmentDigest,
                        operationFingerprint));
                    continue;
                }

                string key = Key(candidate.SurfaceKind, candidate.Operation);
                if (!CandidateEligible(
                        candidate,
                        staticScope,
                        game,
                        bridge,
                        patchInventory,
                        operationFingerprint)
                    || _blockedKeys.Contains(key))
                {
                    continue;
                }

                BridgePermissionGrantRecord grant = EnsureSessionCanary(
                    candidate,
                    game,
                    bridge,
                    patchInventory,
                    environmentDigest,
                    operationFingerprint);
                if (grant.Status != "active" || grant.ExpiresAt <= _clock())
                {
                    if (grant.Status == "active")
                        Quarantine(key, grant, "session_grant_expired", "expired");
                    continue;
                }

                scopes.Add(new ActionPermissionScope(
                    staticScope.SurfaceKind,
                    staticScope.Operation,
                    "canary")
                {
                    GrantId = grant.GrantId,
                    GrantVersion = grant.GrantVersion,
                    RuntimeEpoch = grant.RuntimeEpoch,
                    EnvironmentDigest = grant.EnvironmentDigest,
                    PatchDigest = grant.PatchDigest,
                    OperationFingerprint = grant.OperationFingerprint
                });
            }

            string[] qualifiedSurfaces = scopes
                .Where(scope => scope.Tier == "qualified")
                .Select(scope => scope.SurfaceKind)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(value => value, StringComparer.Ordinal)
                .ToArray();
            string[] canarySurfaces = scopes
                .Where(scope => scope.Tier == "canary")
                .Select(scope => scope.SurfaceKind)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(value => value, StringComparer.Ordinal)
                .ToArray();
            string detail =
                $"{game.Compatibility.Detail} Permission mode={ModeName(_mode)} runtime_epoch={_runtimeEpoch} "
                + $"patch_status={patchInventory.Status} patch_digest={patchInventory.Digest}.";
            return game.Compatibility with
            {
                ActionPermissionScopes = scopes
                    .OrderBy(scope => scope.SurfaceKind, StringComparer.Ordinal)
                    .ThenBy(scope => scope.Operation, StringComparer.Ordinal)
                    .ToArray(),
                ActionExecutionSurfaceKinds = qualifiedSurfaces,
                ActionCanarySurfaceKinds = canarySurfaces,
                Detail = detail
            };
        }
    }

    public bool AuthorizeExecution(
        BridgeActionPermissionBinding expected,
        CompatibilityAssessment current)
    {
        lock (_gate)
        {
            ActionPermissionScope? scope = current.ActionPermissionScopes.SingleOrDefault(value =>
                string.Equals(value.SurfaceKind, expected.SurfaceKind, StringComparison.Ordinal)
                && string.Equals(value.Operation, expected.Operation, StringComparison.Ordinal));
            return scope != null
                && string.Equals(scope.Tier, expected.Tier, StringComparison.Ordinal)
                && string.Equals(scope.GrantId, expected.GrantId, StringComparison.Ordinal)
                && scope.GrantVersion == expected.GrantVersion
                && string.Equals(scope.RuntimeEpoch, expected.RuntimeEpoch, StringComparison.Ordinal)
                && string.Equals(scope.EnvironmentDigest, expected.EnvironmentDigest, StringComparison.Ordinal)
                && string.Equals(scope.PatchDigest, expected.PatchDigest, StringComparison.Ordinal)
                && string.Equals(
                    scope.OperationFingerprint,
                    expected.OperationFingerprint,
                    StringComparison.Ordinal);
        }
    }

    public void ObserveCommand(
        string requestId,
        BridgeActionPermissionBinding? binding,
        BridgeCommandResponse response)
    {
        if (binding == null
            || response.Status is "received" or "validated" or "started")
        {
            return;
        }

        lock (_gate)
        {
            if (!_terminalRequests.Add(requestId))
                return;

            string key = Key(binding.SurfaceKind, binding.Operation);
            if (!_currentGrants.TryGetValue(key, out BridgePermissionGrantRecord? current)
                || !string.Equals(current.GrantId, binding.GrantId, StringComparison.Ordinal)
                || current.GrantVersion != binding.GrantVersion)
            {
                return;
            }

            if (response.Status == "completed" && response.Outcome == "confirmed")
            {
                if (current.Tier == "session_canary")
                {
                    BridgeGrayPermissionCandidate? candidate =
                        BridgeGrayPermissionCandidateCatalog.Find(
                            current.SurfaceKind,
                            current.Operation);
                    string? observedWitness = response.Events
                        .LastOrDefault(value => value.Status == "completed")
                        ?.Evidence;
                    if (candidate == null)
                    {
                        Quarantine(
                            key,
                            current,
                            "candidate_policy_disappeared",
                            "quarantined");
                    }
                    else if (!string.Equals(
                                 observedWitness,
                                 candidate.WitnessId,
                                 StringComparison.Ordinal))
                    {
                        Quarantine(
                            key,
                            current,
                            "semantic_completion_witness_mismatch",
                            "quarantined");
                    }
                    else
                    {
                        Promote(current);
                    }
                }
                return;
            }

            bool validated = response.Events.Any(value => value.Status == "validated");
            if (response.Status is "failed" or "timed_out"
                || (response.Status == "rejected" && validated))
            {
                string reason = response.Events.LastOrDefault()?.ErrorCode
                    ?? $"command_{response.Status}";
                Quarantine(key, current, reason, "quarantined");
            }
        }
    }

    public BridgePermissionSystemInfo Snapshot()
    {
        lock (_gate)
        {
            bool candidatePolicyReady = BridgeGrayPermissionCandidateCatalog.LoadError == null;
            return new BridgePermissionSystemInfo(
                1,
                candidatePolicyReady ? "active_session_scoped" : "candidate_policy_invalid_fail_closed",
                ModeName(_mode),
                _runtimeEpoch,
                BridgeGrayPermissionCandidateCatalog.PolicyId,
                BridgeGrayPermissionCandidateCatalog.PolicyDigest,
                DynamicSessionPromotionEnabled:
                    _mode != BridgePermissionMode.Strict
                    && candidatePolicyReady
                    && _lastPatchInventory.Status == "clean_known_owners",
                _lastPatchInventory,
                _grantLedger
                    .TakeLast(64)
                    .Select(record => record with
                    {
                        Current = _currentGrants.TryGetValue(
                            Key(record.SurfaceKind, record.Operation),
                            out BridgePermissionGrantRecord? current)
                            && string.Equals(
                                current.GrantId,
                                record.GrantId,
                                StringComparison.Ordinal)
                    })
                    .ToArray(),
                new[]
                {
                    "The reviewed exact-environment policy is an absolute permission ceiling.",
                    "Session auto-approval is volatile and cannot create persistent qualification.",
                    "D evidence recommends eligibility; Gateway runtime checks remain authoritative.",
                    "Developer gray never bypasses exact identity, native legality, semantic completion, or quarantine."
                });
        }
    }

    private BridgePermissionGrantRecord EnsureSessionCanary(
        BridgeGrayPermissionCandidate candidate,
        GameBuildIdentity game,
        BridgeServerIdentity bridge,
        BridgeRuntimePatchInventoryInfo patchInventory,
        string environmentDigest,
        string operationFingerprint)
    {
        string key = Key(candidate.SurfaceKind, candidate.Operation);
        if (_currentGrants.TryGetValue(key, out BridgePermissionGrantRecord? current))
            return current;

        DateTimeOffset now = _clock();
        return AppendGrant(
            candidate,
            game,
            bridge,
            patchInventory,
            environmentDigest,
            operationFingerprint,
            tier: "session_canary",
            status: "active",
            version: 1,
            issuedAt: now,
            expiresAt: now.AddSeconds(candidate.SessionTtlSeconds),
            supersedes: null,
            revocationReason: null);
    }

    private void Promote(BridgePermissionGrantRecord current)
    {
        DateTimeOffset now = _clock();
        var promoted = current with
        {
            GrantId = GrantId(
                current.SurfaceKind,
                current.Operation,
                current.EnvironmentDigest,
                current.PatchDigest,
                current.GrantVersion + 1,
                now),
            GrantVersion = current.GrantVersion + 1,
            Status = "active",
            Tier = "session_auto_approved",
            IssuedAt = now,
            ExpiresAt = current.ExpiresAt,
            SupersedesGrantId = current.GrantId,
            RevocationReason = null
        };
        _currentGrants[Key(current.SurfaceKind, current.Operation)] = promoted;
        _grantLedger.Add(promoted);
    }

    private void QuarantineActiveGrants(string reason)
    {
        foreach ((string key, BridgePermissionGrantRecord grant) in
                 _currentGrants.ToArray())
        {
            if (grant.Status == "active")
                Quarantine(key, grant, reason, "quarantined");
        }
    }

    private void Quarantine(
        string key,
        BridgePermissionGrantRecord current,
        string reason,
        string status)
    {
        DateTimeOffset now = _clock();
        var revoked = current with
        {
            GrantId = GrantId(
                current.SurfaceKind,
                current.Operation,
                current.EnvironmentDigest,
                current.PatchDigest,
                current.GrantVersion + 1,
                now),
            GrantVersion = current.GrantVersion + 1,
            Status = status,
            Tier = "none",
            IssuedAt = now,
            ExpiresAt = now,
            SupersedesGrantId = current.GrantId,
            RevocationReason = reason
        };
        _currentGrants[key] = revoked;
        _grantLedger.Add(revoked);
        _blockedKeys.Add(key);
    }

    private BridgePermissionGrantRecord AppendGrant(
        BridgeGrayPermissionCandidate candidate,
        GameBuildIdentity game,
        BridgeServerIdentity bridge,
        BridgeRuntimePatchInventoryInfo patchInventory,
        string environmentDigest,
        string operationFingerprint,
        string tier,
        string status,
        int version,
        DateTimeOffset issuedAt,
        DateTimeOffset expiresAt,
        string? supersedes,
        string? revocationReason)
    {
        var grant = new BridgePermissionGrantRecord(
            1,
            GrantId(
                candidate.SurfaceKind,
                candidate.Operation,
                environmentDigest,
                patchInventory.Digest,
                version,
                issuedAt),
            version,
            Current: true,
            status,
            ModeName(_mode),
            candidate.SurfaceKind,
            candidate.Operation,
            tier,
            candidate.RiskClass,
            _runtimeEpoch,
            environmentDigest,
            bridge.AssemblyFileSha256,
            bridge.ModuleVersionId,
            game.Modset?.Fingerprint ?? "unavailable",
            patchInventory.Digest,
            operationFingerprint,
            BridgeGrayPermissionCandidateCatalog.PolicyDigest,
            issuedAt,
            expiresAt,
            supersedes,
            revocationReason,
            candidate.EvidenceIds);
        _currentGrants[Key(candidate.SurfaceKind, candidate.Operation)] = grant;
        _grantLedger.Add(grant);
        return grant;
    }

    private bool CandidateEligible(
        BridgeGrayPermissionCandidate candidate,
        ActionPermissionScope staticScope,
        GameBuildIdentity game,
        BridgeServerIdentity bridge,
        BridgeRuntimePatchInventoryInfo patchInventory,
        string operationFingerprint)
    {
        string mode = ModeName(_mode);
        return BridgeGrayPermissionCandidateCatalog.LoadError == null
            && candidate.EligibleModes.Contains(mode, StringComparer.Ordinal)
            && string.Equals(
                candidate.RequiredStaticTier,
                staticScope.Tier,
                StringComparison.Ordinal)
            && game.Compatibility.ActionExecutionAllowed
            && game.Modset is
            {
                ExactPermissionEligible: true
            } or
            {
                QualificationCandidateEligible: true
            }
            && !string.IsNullOrWhiteSpace(bridge.AssemblyFileSha256)
            && !string.IsNullOrWhiteSpace(bridge.ModuleVersionId)
            && patchInventory.Status == "clean_known_owners"
            && operationFingerprint != "unavailable";
    }

    private static ActionPermissionScope StaticScope(
        ActionPermissionScope source,
        string tier,
        BridgeServerIdentity bridge,
        BridgeRuntimePatchInventoryInfo patchInventory,
        string environmentDigest,
        string operationFingerprint)
    {
        string grantId = "grant_static_" + BridgeHash.Text(
            $"{source.SurfaceKind}|{source.Operation}|{tier}|{environmentDigest}")[..20];
        return new ActionPermissionScope(source.SurfaceKind, source.Operation, tier)
        {
            GrantId = grantId,
            GrantVersion = 1,
            RuntimeEpoch = "not_session_bound",
            EnvironmentDigest = environmentDigest,
            PatchDigest = patchInventory.Digest,
            OperationFingerprint = operationFingerprint
        };
    }

    internal static string EnvironmentDigest(
        GameBuildIdentity game,
        BridgeServerIdentity bridge,
        BridgeRuntimePatchInventoryInfo patchInventory) =>
        BridgeHash.Object(new
        {
            game.Version,
            game.Commit,
            game.MainAssemblyHash,
            bridge.AssemblyFileSha256,
            bridge.ModuleVersionId,
            modset = game.Modset?.Fingerprint,
            patchInventory.Digest,
            game.Compatibility.CompatibilityPolicyDigest
        });

    internal static string OperationFingerprint(string surfaceKind, string operation)
    {
        BridgeOperationQualificationIdentity? qualification =
            BridgeOperationQualificationCatalog.Describe(surfaceKind, operation);
        if (qualification != null)
            return qualification.ContractDigest;

        BridgeContractManifestEntry? entry = BridgeContractManifest.Find(surfaceKind);
        BridgeOperationManifest? declared = entry?.Operations.SingleOrDefault(value =>
            string.Equals(value.Operation, operation, StringComparison.Ordinal));
        if (entry == null || declared == null)
            return "unavailable";
        return BridgeHash.Object(new
        {
            entry.ProtocolRevision,
            entry.Kind,
            declared.Operation,
            entry.Mechanism,
            entry.SourceBindingId,
            evidenceStatus = declared.EvidenceStatus.ToString(),
            declared.EvidenceIds
        });
    }

    private static string GrantId(
        string surfaceKind,
        string operation,
        string environmentDigest,
        string patchDigest,
        int version,
        DateTimeOffset issuedAt) =>
        "grant_" + BridgeHash.Text(
            $"{surfaceKind}|{operation}|{environmentDigest}|{patchDigest}|{version}|{issuedAt:O}")[..24];

    private static string Key(string surfaceKind, string operation) =>
        $"{surfaceKind}\n{operation}";

    internal static string ModeName(BridgePermissionMode mode) => mode switch
    {
        BridgePermissionMode.Strict => "strict",
        BridgePermissionMode.DeveloperGray => "developer_gray",
        _ => "balanced_gray"
    };
}

internal static class BridgeGrayPermissionCandidateCatalog
{
    private const string ResourceName =
        "STS2_MCP.BridgeV2.Runtime.gray-permission-candidates.json";
    private static readonly Lazy<LoadResult> Loaded = new(Load);

    public static string PolicyId => Loaded.Value.PolicyId;

    public static string PolicyDigest => Loaded.Value.PolicyDigest;

    public static string? LoadError => Loaded.Value.Error;

    public static BridgeGrayPermissionCandidate? Find(string surfaceKind, string operation) =>
        Loaded.Value.Candidates.SingleOrDefault(candidate =>
            string.Equals(candidate.SurfaceKind, surfaceKind, StringComparison.Ordinal)
            && string.Equals(candidate.Operation, operation, StringComparison.Ordinal));

    private static LoadResult Load()
    {
        try
        {
            using Stream? stream = typeof(BridgeGrayPermissionCandidateCatalog)
                .Assembly.GetManifestResourceStream(ResourceName);
            if (stream == null)
                return LoadResult.Failed("Gray permission candidate resource is missing.");
            using var reader = new StreamReader(stream);
            string json = reader.ReadToEnd();
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            };
            PolicyDocument? document = JsonSerializer.Deserialize<PolicyDocument>(json, options);
            if (document == null
                || document.SchemaVersion != 1
                || string.IsNullOrWhiteSpace(document.PolicyId)
                || document.AuthorizationEffect != "none"
                || document.RecommendationEffect != "gateway_session_candidate_only")
            {
                return LoadResult.Failed("Gray permission candidate metadata is unsupported.");
            }

            string? error = Validate(document.Candidates);
            return error == null
                ? new LoadResult(
                    document.PolicyId,
                    BridgeHash.Text(json),
                    document.Candidates,
                    null)
                : LoadResult.Failed(error, document.PolicyId, BridgeHash.Text(json));
        }
        catch (Exception ex) when (ex is IOException or JsonException)
        {
            return LoadResult.Failed(
                $"Gray permission candidates failed closed with {ex.GetType().Name}.");
        }
    }

    private static string? Validate(IReadOnlyList<BridgeGrayPermissionCandidate> candidates)
    {
        if (candidates.Count == 0)
            return "Gray permission candidate policy is empty.";
        if (candidates.GroupBy(
                candidate => (candidate.SurfaceKind, candidate.Operation))
            .Any(group => group.Count() != 1))
        {
            return "Gray permission candidate policy contains duplicate operations.";
        }

        foreach (BridgeGrayPermissionCandidate candidate in candidates)
        {
            BridgeContractManifestEntry? entry = BridgeContractManifest.Find(candidate.SurfaceKind);
            BridgeOperationManifest? operation = entry?.Operations.SingleOrDefault(value =>
                string.Equals(value.Operation, candidate.Operation, StringComparison.Ordinal));
            if (entry == null
                || operation == null
                || candidate.RiskClass is not ("reversible_navigation" or "progression")
                || candidate.RiskClass == "progression"
                   && candidate.EligibleModes.Any(mode => mode != "developer_gray")
                || candidate.RequiredStaticTier != "canary"
                || candidate.MinimumSuccesses != 1
                || candidate.SessionTtlSeconds is < 60 or > 86_400
                || string.IsNullOrWhiteSpace(candidate.WitnessId)
                || candidate.EligibleModes.Count == 0
                || candidate.EligibleModes.Any(mode =>
                    mode is not ("balanced_gray" or "developer_gray"))
                || candidate.EvidenceIds.Count == 0
                || EvidenceRank(operation.EvidenceStatus)
                    < EvidenceRank(candidate.MinimumEvidenceStatus))
            {
                return $"Gray permission candidate {candidate.SurfaceKind}/{candidate.Operation} is invalid or unsupported.";
            }
        }
        return null;
    }

    private static int EvidenceRank(BridgeOperationEvidenceStatus status) => status switch
    {
        BridgeOperationEvidenceStatus.OrganicQualified => 4,
        BridgeOperationEvidenceStatus.OrganicCanaryExercised => 3,
        BridgeOperationEvidenceStatus.SourceAudited => 2,
        _ => 1
    };

    private static int EvidenceRank(string status) => status switch
    {
        "organic_qualified" => 4,
        "organic_canary_exercised" => 3,
        "source_audited" => 2,
        "surface_level_only" => 1,
        _ => int.MaxValue
    };

    private sealed record PolicyDocument(
        int SchemaVersion,
        string PolicyId,
        string AuthorizationEffect,
        string RecommendationEffect,
        IReadOnlyList<BridgeGrayPermissionCandidate> Candidates);

    private sealed record LoadResult(
        string PolicyId,
        string PolicyDigest,
        IReadOnlyList<BridgeGrayPermissionCandidate> Candidates,
        string? Error)
    {
        public static LoadResult Failed(
            string error,
            string policyId = "unavailable",
            string policyDigest = "unavailable") =>
            new(policyId, policyDigest, Array.Empty<BridgeGrayPermissionCandidate>(), error);
    }
}
