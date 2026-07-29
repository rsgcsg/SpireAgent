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
    DeveloperGray,
    MigrationExploration
}

internal sealed record BridgeMigrationRiskRule(
    string RiskClass,
    IReadOnlyList<string> EligibleModes,
    int MinimumSuccesses,
    int SessionTtlSeconds);

internal sealed record BridgeMigrationPermissionCandidate(
    string SurfaceKind,
    string Operation,
    string RiskClass,
    IReadOnlyList<string> EligibleModes,
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
    string OperationFingerprint,
    string AdmissionBasis = "reviewed_or_persisted_scope");

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
            "migration_exploration" => BridgePermissionMode.MigrationExploration,
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
                BridgeMigrationPermissionCandidate? candidate =
                    BridgeMigrationPermissionPolicy.Find(
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
                    OperationFingerprint = grant.OperationFingerprint,
                    AdmissionBasis = grant.AdmissionBasis
                });
            }

            AppendActiveEncounterScopes(scopes, environmentDigest, patchInventory.Digest);

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
                Status = scopes.Count > 0 && !game.Compatibility.ActionExecutionAllowed
                    ? "provisional_trial_scoped"
                    : game.Compatibility.Status,
                ActionExecutionAllowed = scopes.Count > 0,
                ActionPermissionScopes = scopes
                    .OrderBy(scope => scope.SurfaceKind, StringComparer.Ordinal)
                    .ThenBy(scope => scope.Operation, StringComparer.Ordinal)
                    .ToArray(),
                ActionExecutionSurfaceKinds = qualifiedSurfaces,
                ActionCanarySurfaceKinds = canarySurfaces,
                AdaptationLevel = scopes.Any(scope =>
                        scope.AdmissionBasis == "encounter_source_resolved")
                    ? "encounter_provisional_trial"
                    : game.Compatibility.AdaptationLevel,
                Detail = detail
            };
        }
    }

    public BridgeObservationDraft AdmitEncounter(
        BridgeObservationDraft draft,
        BridgeServerIdentity bridge)
    {
        lock (_gate)
        {
            if (_mode != BridgePermissionMode.MigrationExploration
                || !draft.Game.Compatibility.StateObservationAllowed
                || draft.Actions.Count == 0
                || draft.Surface.Kind is "unsupported" or "no_action"
                || !EncounterEnvironmentEligible(draft.Game, bridge))
            {
                return draft;
            }

            string environmentDigest = EnvironmentDigest(
                draft.Game,
                bridge,
                _lastPatchInventory);
            foreach (BridgeActionDraft action in draft.Actions)
            {
                string key = Key(draft.Surface.Kind, action.Kind);
                if (_blockedKeys.Contains(key)
                    || HasApplicableScope(
                        draft.Game.Compatibility,
                        draft.Surface.Kind,
                        action.Kind)
                    || _currentGrants.TryGetValue(key, out BridgePermissionGrantRecord? existing)
                       && existing.Status == "active"
                       && existing.ExpiresAt > _clock()
                       && existing.EnvironmentDigest == environmentDigest
                       && existing.PatchDigest == _lastPatchInventory.Digest)
                {
                    continue;
                }

                BridgeMigrationPermissionCandidate? candidate =
                    BridgeMigrationPermissionPolicy.Find(draft.Surface.Kind, action.Kind);
                if (candidate == null
                    || !candidate.EligibleModes.Contains(
                        ModeName(_mode),
                        StringComparer.Ordinal))
                {
                    continue;
                }

                string operationFingerprint = OperationFingerprint(
                    draft.Surface.Kind,
                    action.Kind);
                if (operationFingerprint == "unavailable")
                    continue;

                BridgeMigrationPermissionCandidate encountered = candidate with
                {
                    EvidenceIds = candidate.EvidenceIds
                        .Append("admission:encounter_source_resolved")
                        .Append($"surface-signature:{draft.Signature}")
                        .Distinct(StringComparer.Ordinal)
                        .ToArray()
                };
                EnsureSessionCanary(
                    encountered,
                    draft.Game,
                    bridge,
                    _lastPatchInventory,
                    environmentDigest,
                    operationFingerprint,
                    "encounter_source_resolved");
            }

            CompatibilityAssessment compatibility = Apply(
                draft.Game,
                bridge,
                _lastPatchInventory);
            bool encounterTrialActive = compatibility.ActionPermissionScopes.Any(scope =>
                string.Equals(
                    scope.AdmissionBasis,
                    "encounter_source_resolved",
                    StringComparison.Ordinal));
            return draft with
            {
                Game = draft.Game with { Compatibility = compatibility },
                Warnings = encounterTrialActive
                    ? draft.Warnings
                        .Append("encounter_provisional_trial: current source-resolved actions may execute session-only; no persistent compatibility claim was inherited or created.")
                        .ToArray()
                    : draft.Warnings
            };
        }
    }

    public bool AuthorizeExecution(
        BridgeActionPermissionBinding expected,
        CompatibilityAssessment current,
        BridgeBoundActionContract? contract = null)
    {
        lock (_gate)
        {
            ActionPermissionScope? scope = current.ActionPermissionScopes.SingleOrDefault(value =>
                string.Equals(value.SurfaceKind, expected.SurfaceKind, StringComparison.Ordinal)
                && (contract?.ExplicitContract == true
                    ? string.Equals(
                        value.OperationFingerprint,
                        contract.ContractDigest,
                        StringComparison.Ordinal)
                    : string.Equals(value.Operation, expected.Operation, StringComparison.Ordinal)));
            return scope != null
                && (contract == null || contract.Matches(scope))
                && string.Equals(scope.Tier, expected.Tier, StringComparison.Ordinal)
                && string.Equals(scope.GrantId, expected.GrantId, StringComparison.Ordinal)
                && scope.GrantVersion == expected.GrantVersion
                && string.Equals(scope.RuntimeEpoch, expected.RuntimeEpoch, StringComparison.Ordinal)
                && string.Equals(scope.EnvironmentDigest, expected.EnvironmentDigest, StringComparison.Ordinal)
                && string.Equals(scope.PatchDigest, expected.PatchDigest, StringComparison.Ordinal)
                && string.Equals(
                    scope.OperationFingerprint,
                    expected.OperationFingerprint,
                    StringComparison.Ordinal)
                && string.Equals(
                    scope.AdmissionBasis,
                    expected.AdmissionBasis,
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
                    BridgeMigrationPermissionCandidate? candidate =
                        BridgeMigrationPermissionPolicy.Find(
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
                    else if (!BridgeOperationQualificationCatalog.WitnessMatches(
                                 candidate.WitnessId,
                                 observedWitness))
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
            bool candidatePolicyReady = BridgeMigrationPermissionPolicy.LoadError == null;
            var currentGrantIds = _currentGrants.Values
                .Select(record => record.GrantId)
                .ToHashSet(StringComparer.Ordinal);
            var recentHistoricalGrantIds = _grantLedger
                .Where(record => !currentGrantIds.Contains(record.GrantId))
                .TakeLast(64)
                .Select(record => record.GrantId)
                .ToHashSet(StringComparer.Ordinal);
            return new BridgePermissionSystemInfo(
                1,
                candidatePolicyReady ? "active_session_scoped" : "candidate_policy_invalid_fail_closed",
                ModeName(_mode),
                _runtimeEpoch,
                BridgeMigrationPermissionPolicy.PolicyId,
                BridgeMigrationPermissionPolicy.PolicyDigest,
                DynamicSessionPromotionEnabled:
                    _mode != BridgePermissionMode.Strict
                    && candidatePolicyReady
                    && _lastPatchInventory.Status == "clean_known_owners",
                _lastPatchInventory,
                _grantLedger
                    .Where(record =>
                        currentGrantIds.Contains(record.GrantId)
                        || recentHistoricalGrantIds.Contains(record.GrantId))
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
                    "Persistent qualification never transfers to a different exact environment.",
                    "Encounter provisional trials are volatile and cannot create persistent qualification.",
                    "D evidence recommends eligibility; Gateway runtime checks remain authoritative.",
                    "Migration exploration never bypasses exact identity, unique ownership, native legality, semantic completion, or quarantine."
                });
        }
    }

    private void AppendActiveEncounterScopes(
        ICollection<ActionPermissionScope> scopes,
        string environmentDigest,
        string patchDigest)
    {
        var existing = scopes
            .Select(scope => Key(scope.SurfaceKind, scope.Operation))
            .ToHashSet(StringComparer.Ordinal);
        foreach (BridgePermissionGrantRecord grant in _currentGrants.Values)
        {
            string key = Key(grant.SurfaceKind, grant.Operation);
            if (existing.Contains(key)
                || grant.Status != "active"
                || grant.ExpiresAt <= _clock()
                || grant.EnvironmentDigest != environmentDigest
                || grant.PatchDigest != patchDigest
                || grant.Tier is not ("session_canary" or "session_trial_confirmed"))
            {
                continue;
            }

            scopes.Add(new ActionPermissionScope(
                grant.SurfaceKind,
                grant.Operation,
                "canary")
            {
                GrantId = grant.GrantId,
                GrantVersion = grant.GrantVersion,
                RuntimeEpoch = grant.RuntimeEpoch,
                EnvironmentDigest = grant.EnvironmentDigest,
                PatchDigest = grant.PatchDigest,
                OperationFingerprint = grant.OperationFingerprint,
                AdmissionBasis = grant.AdmissionBasis
            });
            existing.Add(key);
        }
    }

    private bool EncounterEnvironmentEligible(
        GameBuildIdentity game,
        BridgeServerIdentity bridge) =>
        BridgeMigrationPermissionPolicy.LoadError == null
        && !string.IsNullOrWhiteSpace(game.Version)
        && !string.IsNullOrWhiteSpace(game.Commit)
        && game.MainAssemblyHash.HasValue
        && game.Modset is
        {
            ExactPermissionEligible: true
        } or
        {
            QualificationCandidateEligible: true
        }
        && !string.IsNullOrWhiteSpace(bridge.AssemblyFileSha256)
        && !string.IsNullOrWhiteSpace(bridge.ModuleVersionId)
        && _lastPatchInventory.Status == "clean_known_owners";

    private static bool HasApplicableScope(
        CompatibilityAssessment compatibility,
        string surfaceKind,
        string operation) =>
        compatibility.ActionPermissionScopes.Any(scope =>
            string.Equals(scope.SurfaceKind, surfaceKind, StringComparison.Ordinal)
            && string.Equals(scope.Operation, operation, StringComparison.Ordinal));

    private BridgePermissionGrantRecord EnsureSessionCanary(
        BridgeMigrationPermissionCandidate candidate,
        GameBuildIdentity game,
        BridgeServerIdentity bridge,
        BridgeRuntimePatchInventoryInfo patchInventory,
        string environmentDigest,
        string operationFingerprint,
        string admissionBasis = "installed_candidate_package")
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
            revocationReason: null,
            admissionBasis: admissionBasis);
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
            Tier = "session_trial_confirmed",
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
        BridgeMigrationPermissionCandidate candidate,
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
        string? revocationReason,
        string admissionBasis)
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
            BridgeMigrationPermissionPolicy.PolicyDigest,
            issuedAt,
            expiresAt,
            supersedes,
            revocationReason,
            candidate.EvidenceIds)
        {
            AdmissionBasis = admissionBasis
        };
        _currentGrants[Key(candidate.SurfaceKind, candidate.Operation)] = grant;
        _grantLedger.Add(grant);
        return grant;
    }

    private bool CandidateEligible(
        BridgeMigrationPermissionCandidate candidate,
        ActionPermissionScope staticScope,
        GameBuildIdentity game,
        BridgeServerIdentity bridge,
        BridgeRuntimePatchInventoryInfo patchInventory,
        string operationFingerprint)
    {
        string mode = ModeName(_mode);
        return BridgeMigrationPermissionPolicy.LoadError == null
            && candidate.EligibleModes.Contains(mode, StringComparer.Ordinal)
            && string.Equals("canary", staticScope.Tier, StringComparison.Ordinal)
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
        BridgePermissionMode.MigrationExploration => "migration_exploration",
        _ => "balanced_gray"
    };

}

internal static class BridgeMigrationPermissionPolicy
{
    private const string ResourceName =
        "STS2_MCP.BridgeV2.Runtime.migration-permission-policy.json";
    private static readonly Lazy<LoadResult> Loaded = new(Load);

    public static string PolicyId => Loaded.Value.PolicyId;

    public static string PolicyDigest => Loaded.Value.PolicyDigest;

    public static string? LoadError => Loaded.Value.Error;

    public static BridgeMigrationPermissionCandidate? Find(
        string surfaceKind,
        string operation)
    {
        BridgeOperationQualificationIdentity? identity =
            BridgeOperationQualificationCatalog.Describe(surfaceKind, operation);
        BridgeContractManifestEntry? entry = BridgeContractManifest.Find(surfaceKind);
        BridgeOperationManifest? manifest = entry?.Operations.SingleOrDefault(value =>
            string.Equals(value.Operation, operation, StringComparison.Ordinal));
        BridgeMigrationRiskRule? rule = identity == null
            ? null
            : Loaded.Value.Rules.SingleOrDefault(value =>
                string.Equals(
                    value.RiskClass,
                    identity.RiskClass,
                    StringComparison.Ordinal));
        if (identity == null || manifest == null || rule == null)
            return null;

        return new BridgeMigrationPermissionCandidate(
            surfaceKind,
            operation,
            identity.RiskClass,
            rule.EligibleModes,
            rule.MinimumSuccesses,
            rule.SessionTtlSeconds,
            identity.WitnessId,
            new[]
            {
                $"operation-contract:{BridgeOperationQualificationCatalog.CatalogId}:{identity.ContractDigest}",
                $"migration-policy:{PolicyId}:{PolicyDigest}"
            }.Concat(manifest.EvidenceIds).Distinct(StringComparer.Ordinal).ToArray());
    }

    public static bool SupportsRiskClass(string riskClass) =>
        Loaded.Value.Rules.Any(rule =>
            string.Equals(rule.RiskClass, riskClass, StringComparison.Ordinal));

    private static LoadResult Load()
    {
        try
        {
            using Stream? stream = typeof(BridgeMigrationPermissionPolicy)
                .Assembly.GetManifestResourceStream(ResourceName);
            if (stream == null)
                return LoadResult.Failed("Migration permission policy resource is missing.");
            using var reader = new StreamReader(stream);
            string json = reader.ReadToEnd();
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            };
            PolicyDocument? document = JsonSerializer.Deserialize<PolicyDocument>(json, options);
            if (document == null
                || document.SchemaVersion != 2
                || string.IsNullOrWhiteSpace(document.PolicyId)
                || document.AuthorizationEffect != "none"
                || document.RecommendationEffect
                    != "gateway_session_candidate_by_reviewed_contract_and_risk")
            {
                return LoadResult.Failed("Migration permission policy metadata is unsupported.");
            }

            string? error = Validate(document.Rules);
            return error == null
                ? new LoadResult(
                    document.PolicyId,
                    BridgeHash.Text(json),
                    document.Rules,
                    null)
                : LoadResult.Failed(error, document.PolicyId, BridgeHash.Text(json));
        }
        catch (Exception ex) when (ex is IOException or JsonException)
        {
            return LoadResult.Failed(
                $"Migration permission policy failed closed with {ex.GetType().Name}.");
        }
    }

    private static string? Validate(IReadOnlyList<BridgeMigrationRiskRule> rules)
    {
        if (rules.Count == 0)
            return "Migration permission policy is empty.";
        if (rules.GroupBy(rule => rule.RiskClass, StringComparer.Ordinal)
            .Any(group => group.Count() != 1))
        {
            return "Migration permission policy contains duplicate risk classes.";
        }

        foreach (BridgeMigrationRiskRule rule in rules)
        {
            if (rule.RiskClass is not (
                    "reversible_navigation"
                    or "progression"
                    or "persistent_run_mutation")
                || rule.MinimumSuccesses != 1
                || rule.SessionTtlSeconds is < 60 or > 604_800
                || rule.EligibleModes.Count == 0
                || rule.EligibleModes.Any(mode => mode is not (
                    "balanced_gray"
                    or "developer_gray"
                    or "migration_exploration"))
                || rule.RiskClass == "progression"
                   && rule.EligibleModes.Any(mode =>
                       mode is not ("developer_gray" or "migration_exploration"))
                || rule.RiskClass == "persistent_run_mutation"
                   && rule.EligibleModes.Any(mode =>
                       mode != "migration_exploration"))
            {
                return $"Migration permission risk rule {rule.RiskClass} is invalid or unsupported.";
            }
        }
        return null;
    }

    private sealed record PolicyDocument(
        int SchemaVersion,
        string PolicyId,
        string AuthorizationEffect,
        string RecommendationEffect,
        IReadOnlyList<BridgeMigrationRiskRule> Rules);

    private sealed record LoadResult(
        string PolicyId,
        string PolicyDigest,
        IReadOnlyList<BridgeMigrationRiskRule> Rules,
        string? Error)
    {
        public static LoadResult Failed(
            string error,
            string policyId = "unavailable",
            string policyDigest = "unavailable") =>
            new(policyId, policyDigest, Array.Empty<BridgeMigrationRiskRule>(), error);
    }
}
