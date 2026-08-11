using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.NativeUi;

namespace STS2_MCP.Authority;

internal sealed record QualificationRuntimeEvidence(
    string RuntimeEpoch,
    string RequestId,
    string Outcome,
    string WitnessId,
    string EvidenceClass);

internal sealed record EnvironmentQualificationPackage(
    string QualificationId,
    int Version,
    string AuthorityTier,
    string SurfaceKind,
    string Operation,
    string ContractKind,
    string RiskClass,
    string GameVersion,
    string GameCommit,
    int GameMainAssemblyHash,
    string GatewayProtocol,
    string GatewayAssemblySha256,
    string GatewayModuleVersionId,
    string ModsetFingerprint,
    string PatchDigest,
    string EnvironmentDigest,
    string OperationFingerprint,
    string CompletionBoundary,
    string WitnessId,
    string EvidenceBundleDigest,
    IReadOnlyList<string> EvidenceIds,
    IReadOnlyList<string> NegativeEvidenceIds,
    IReadOnlyList<QualificationRuntimeEvidence> RuntimeEvidence,
    DateTimeOffset IssuedAt,
    DateTimeOffset ExpiresAt,
    string? SupersedesQualificationId);

internal sealed record QualificationLedgerEvent(
    int Sequence,
    string EventId,
    string Type,
    DateTimeOffset At,
    EnvironmentQualificationPackage? Qualification,
    string? TargetQualificationId,
    string? Reason);

internal sealed class EnvironmentQualificationStore
{
    private readonly Func<DateTimeOffset> _clock;
    private readonly object _gate = new();
    private readonly string _status;
    private readonly string _storeId;
    private readonly string _storeDigest;
    private readonly string? _loadError;
    private readonly IReadOnlyDictionary<string, EnvironmentQualificationPackage> _packages;
    private readonly IReadOnlyDictionary<string, string> _activeByOperation;
    private readonly IReadOnlyDictionary<string, string> _statusById;
    private readonly IReadOnlyDictionary<string, string?> _reasonById;
    private HashSet<string> _currentApplicableIds = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, string> _sessionQuarantineReasons;
    private readonly HashSet<string> _terminalRequests = new(StringComparer.Ordinal);
    private string _currentEnvironmentDigest = "not_observed";

    private EnvironmentQualificationStore(
        Func<DateTimeOffset> clock,
        string status,
        string storeId,
        string storeDigest,
        string? loadError,
        IReadOnlyDictionary<string, EnvironmentQualificationPackage> packages,
        IReadOnlyDictionary<string, string> activeByOperation,
        IReadOnlyDictionary<string, string> statusById,
        IReadOnlyDictionary<string, string?> reasonById,
        ConcurrentDictionary<string, string>? sessionQuarantineReasons = null)
    {
        _clock = clock;
        _status = status;
        _storeId = storeId;
        _storeDigest = storeDigest;
        _loadError = loadError;
        _packages = packages;
        _activeByOperation = activeByOperation;
        _statusById = statusById;
        _reasonById = reasonById;
        _sessionQuarantineReasons = sessionQuarantineReasons
            ?? new ConcurrentDictionary<string, string>(StringComparer.Ordinal);
    }

    public static EnvironmentQualificationStore Disabled(
        Func<DateTimeOffset>? clock = null,
        ConcurrentDictionary<string, string>? sessionQuarantineReasons = null) =>
        new(
            clock ?? (() => DateTimeOffset.UtcNow),
            "not_configured",
            "unavailable",
            "unavailable",
            null,
            new Dictionary<string, EnvironmentQualificationPackage>(),
            new Dictionary<string, string>(),
            new Dictionary<string, string>(),
            new Dictionary<string, string?>(),
            sessionQuarantineReasons);

    public static EnvironmentQualificationStore Load(
        string? path,
        Func<DateTimeOffset>? clock = null,
        ConcurrentDictionary<string, string>? sessionQuarantineReasons = null)
    {
        Func<DateTimeOffset> effectiveClock = clock ?? (() => DateTimeOffset.UtcNow);
        if (string.IsNullOrWhiteSpace(path))
            return Disabled(effectiveClock, sessionQuarantineReasons);
        if (!File.Exists(path))
        {
            return new EnvironmentQualificationStore(
                effectiveClock,
                "empty",
                "local_qualification_store",
                StableIdentityHash.Text("empty"),
                null,
                new Dictionary<string, EnvironmentQualificationPackage>(),
                new Dictionary<string, string>(),
                new Dictionary<string, string>(),
                new Dictionary<string, string?>(),
                sessionQuarantineReasons);
        }

        try
        {
            string json = File.ReadAllText(path);
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            };
            LedgerDocument? document = JsonSerializer.Deserialize<LedgerDocument>(
                json,
                options);
            string? metadataError = document == null
                || document.SchemaVersion != 1
                || string.IsNullOrWhiteSpace(document.StoreId)
                ? "Qualification ledger metadata is unsupported."
                : null;
            if (metadataError != null)
                return Failed(
                    effectiveClock,
                    metadataError,
                    StableIdentityHash.Text(json),
                    sessionQuarantineReasons: sessionQuarantineReasons);

            ProcessResult processed = Process(document!.Events, effectiveClock());
            if (processed.Error != null)
            {
                return Failed(
                    effectiveClock,
                    processed.Error,
                    StableIdentityHash.Text(json),
                    document.StoreId,
                    sessionQuarantineReasons);
            }
            return new EnvironmentQualificationStore(
                effectiveClock,
                processed.ActiveByOperation.Count == 0 ? "loaded_no_active" : "active",
                document.StoreId,
                StableIdentityHash.Text(json),
                null,
                processed.Packages,
                processed.ActiveByOperation,
                processed.StatusById,
                processed.ReasonById,
                sessionQuarantineReasons);
        }
        catch (Exception ex) when (
            ex is IOException or UnauthorizedAccessException or JsonException)
        {
            return Failed(
                effectiveClock,
                $"Qualification ledger failed closed with {ex.GetType().Name}.",
                "unavailable",
                sessionQuarantineReasons: sessionQuarantineReasons);
        }
    }

    public GameBuildIdentity Apply(
        GameBuildIdentity game,
        GatewayHostIdentity bridge,
        GatewayPatchInventoryInfo patchInventory)
    {
        string environmentDigest = EnvironmentPermissionManager.EnvironmentDigest(
            game,
            bridge,
            patchInventory);
        lock (_gate)
            _currentEnvironmentDigest = environmentDigest;

        if (_loadError != null || _activeByOperation.Count == 0 || game.Modset == null)
        {
            lock (_gate)
                _currentApplicableIds = new HashSet<string>(StringComparer.Ordinal);
            return game;
        }

        DateTimeOffset now = _clock();
        EnvironmentQualificationPackage[] applicable = _activeByOperation.Values
            .Select(id => _packages[id])
            .Where(package => !_sessionQuarantineReasons.ContainsKey(
                package.QualificationId))
            .Where(package => IsApplicable(
                package,
                game,
                bridge,
                patchInventory,
                now))
            .ToArray();
        lock (_gate)
        {
            _currentApplicableIds = applicable
                .Select(package => package.QualificationId)
                .ToHashSet(StringComparer.Ordinal);
        }
        if (applicable.Length == 0)
            return game;

        var scopes = game.Compatibility.ActionPermissionScopes.ToList();
        foreach (EnvironmentQualificationPackage package in applicable)
        {
            scopes.RemoveAll(scope =>
                string.Equals(
                    scope.SurfaceKind,
                    package.SurfaceKind,
                    StringComparison.Ordinal)
                && string.Equals(
                    scope.Operation,
                    package.Operation,
                    StringComparison.Ordinal));
            scopes.Add(new ActionPermissionScope(
                package.SurfaceKind,
                package.Operation,
                package.AuthorityTier == "qualified" ? "qualified" : "canary")
            {
                GrantId = package.AuthorityTier == "qualified"
                    ? "qualification_" + package.QualificationId
                    : "qualification_candidate_" + package.QualificationId,
                GrantVersion = package.Version,
                RuntimeEpoch = "not_session_bound",
                EnvironmentDigest = package.EnvironmentDigest,
                PatchDigest = package.PatchDigest,
                OperationFingerprint = package.OperationFingerprint
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
        CompatibilityAssessment compatibility = game.Compatibility with
        {
            Status = applicable.Any(package =>
                package.AuthorityTier == "qualified")
                ? "persistent_qualification_scoped"
                : "qualification_candidate_scoped",
            ActionExecutionAllowed = true,
            StateObservationAllowed = true,
            ActionPermissionScopes = scopes
                .OrderBy(scope => scope.SurfaceKind, StringComparer.Ordinal)
                .ThenBy(scope => scope.Operation, StringComparer.Ordinal)
                .ToArray(),
            ActionExecutionSurfaceKinds = qualifiedSurfaces,
            ActionCanarySurfaceKinds = canarySurfaces,
            AdaptationLevel = applicable.Any(package =>
                package.AuthorityTier == "qualified")
                ? "installed_persistent_qualification"
                : "installed_qualification_candidate",
            Detail =
                $"{game.Compatibility.Detail} Applied {applicable.Length} exact installed operation qualification package(s) from {_storeId}."
        };
        ModsetIdentity modset = game.Modset with
        {
            QualificationCandidateEligible = applicable.Any(package =>
                package.AuthorityTier == "session_canary"),
            PersistentQualificationEligible = applicable.Any(package =>
                package.AuthorityTier == "qualified"),
            Detail =
                $"{game.Modset.Detail} Exact installed qualification matches this Modset fingerprint."
        };
        return game with { Compatibility = compatibility, Modset = modset };
    }

    public void ObserveCommand(
        string requestId,
        OperationPermissionBinding? binding,
        GatewayCommandOutcomeEvidence response)
    {
        if (binding == null
            || !binding.GrantId.StartsWith("qualification_", StringComparison.Ordinal)
            || binding.GrantId.StartsWith(
                "qualification_candidate_",
                StringComparison.Ordinal)
            || response.Status is "received" or "validated" or "started")
        {
            return;
        }

        lock (_gate)
        {
            if (!_terminalRequests.Add(requestId))
                return;
            string qualificationId =
                binding.GrantId["qualification_".Length..];
            if (!_packages.TryGetValue(
                    qualificationId,
                    out EnvironmentQualificationPackage? package)
                || _activeByOperation.GetValueOrDefault(
                    Key(
                        package.EnvironmentDigest,
                        package.SurfaceKind,
                        package.Operation))
                    != qualificationId)
            {
                return;
            }

            if (response.Status == "completed" && response.Outcome == "confirmed")
            {
                string? observedWitness = response.Events
                    .LastOrDefault(value => value.Status == "completed")
                    ?.Evidence;
                if (!OperationQualificationCatalog.WitnessMatches(
                        package.WitnessId,
                        observedWitness))
                {
                    _sessionQuarantineReasons[qualificationId] =
                        "semantic_completion_witness_mismatch";
                    _currentApplicableIds.Remove(qualificationId);
                }
                return;
            }

            bool validated = response.Events.Any(value => value.Status == "validated");
            if (response.Status is "failed" or "timed_out"
                || (response.Status == "rejected" && validated))
            {
                _sessionQuarantineReasons[qualificationId] =
                    response.Events.LastOrDefault()?.ErrorCode
                    ?? $"command_{response.Status}";
                _currentApplicableIds.Remove(qualificationId);
            }
        }
    }

    public QualificationSystemInfo Snapshot()
    {
        HashSet<string> applicable;
        lock (_gate)
            applicable = new HashSet<string>(_currentApplicableIds, StringComparer.Ordinal);
        bool catalogReady =
            OperationQualificationCatalog.LoadError == null;
        return new QualificationSystemInfo(
            2,
            !catalogReady
                ? "operation_catalog_invalid_fail_closed"
                : _loadError == null
                    ? _status
                    : "invalid_fail_closed",
            _storeId,
            _storeDigest,
            CurrentEnvironmentDigest(),
            OperationQualificationCatalog.CatalogId,
            OperationQualificationCatalog.CatalogDigest,
            PersistentAuthorityEnabled: catalogReady && _loadError == null
                && _packages.Values.Any(package =>
                    applicable.Contains(package.QualificationId)
                    && package.AuthorityTier == "qualified"),
            SessionCanaryCandidateEnabled: catalogReady && _loadError == null
                && _packages.Values.Any(package =>
                    applicable.Contains(package.QualificationId)
                    && package.AuthorityTier == "session_canary"),
            OperationQualificationCatalog.Snapshot(),
            _packages.Values
            .OrderBy(package => package.IssuedAt)
            .Select(package => new PersistentQualificationInfo(
                package.QualificationId,
                package.Version,
                CurrentStatus(package),
                package.AuthorityTier,
                package.SurfaceKind,
                package.Operation,
                package.ContractKind,
                package.RiskClass,
                package.EnvironmentDigest,
                package.ModsetFingerprint,
                package.PatchDigest,
                package.OperationFingerprint,
                package.CompletionBoundary,
                package.WitnessId,
                package.EvidenceBundleDigest,
                applicable.Contains(package.QualificationId),
                applicable.Contains(package.QualificationId)
                    ? "exact_match"
                    : _sessionQuarantineReasons.ContainsKey(
                        package.QualificationId)
                        ? "session_quarantined"
                        : "inactive_or_exact_identity_mismatch",
                package.IssuedAt,
                package.ExpiresAt,
                package.SupersedesQualificationId,
                _sessionQuarantineReasons.GetValueOrDefault(
                    package.QualificationId)
                    ?? _reasonById.GetValueOrDefault(package.QualificationId),
                package.EvidenceIds))
            .ToArray(),
            new[]
            {
                OperationQualificationCatalog.LoadError
                    ?? _loadError
                    ?? "Qualification ledger changes are atomically reloaded and every package is revalidated before scope publication.",
                "A package is exact-operation authority, not evidence inheritance to another environment.",
                "D and Re may produce evidence but cannot write or activate this store through the live API.",
                "Unknown, expired, revoked, drifted or corrupt packages fail closed per operation."
            });
    }

    private string CurrentEnvironmentDigest()
    {
        lock (_gate)
            return _currentEnvironmentDigest;
    }

    private string CurrentStatus(EnvironmentQualificationPackage package)
    {
        if (_sessionQuarantineReasons.ContainsKey(package.QualificationId))
            return "session_quarantined";
        string status = _statusById.GetValueOrDefault(
            package.QualificationId,
            "superseded");
        return status == "active" && package.ExpiresAt <= _clock()
            ? "expired"
            : status;
    }

    private static bool IsApplicable(
        EnvironmentQualificationPackage package,
        GameBuildIdentity game,
        GatewayHostIdentity bridge,
        GatewayPatchInventoryInfo patchInventory,
        DateTimeOffset now)
    {
        OperationQualificationIdentity? identity =
            OperationQualificationCatalog.Describe(
                package.SurfaceKind,
                package.Operation);
        return package.ExpiresAt > now
            && string.Equals(package.GameVersion, game.Version, StringComparison.Ordinal)
            && string.Equals(package.GameCommit, game.Commit, StringComparison.OrdinalIgnoreCase)
            && package.GameMainAssemblyHash == game.MainAssemblyHash
            && package.GatewayProtocol == GatewayAuthorityContract.QualificationProtocol
            && string.Equals(
                package.GatewayAssemblySha256,
                bridge.AssemblyFileSha256,
                StringComparison.OrdinalIgnoreCase)
            && string.Equals(
                package.GatewayModuleVersionId,
                bridge.ModuleVersionId,
                StringComparison.OrdinalIgnoreCase)
            && package.ModsetFingerprint == game.Modset?.Fingerprint
            && package.PatchDigest == patchInventory.Digest
            && package.EnvironmentDigest == EnvironmentPermissionManager.EnvironmentDigest(
                game,
                bridge,
                patchInventory)
            && identity != null
            && identity.ContractKind
                == OperationQualificationCatalog.ExplicitNativeContract
            && package.ContractKind
                == OperationQualificationCatalog.ExplicitNativeContract
            && package.OperationFingerprint == identity.ContractDigest
            && package.CompletionBoundary == identity.CompletionBoundary
            && package.WitnessId == identity.WitnessId;
    }

    private static ProcessResult Process(
        IReadOnlyList<QualificationLedgerEvent> events,
        DateTimeOffset now)
    {
        var packages = new Dictionary<string, EnvironmentQualificationPackage>(
            StringComparer.Ordinal);
        var activeByOperation = new Dictionary<string, string>(StringComparer.Ordinal);
        var statusById = new Dictionary<string, string>(StringComparer.Ordinal);
        var reasonById = new Dictionary<string, string?>(StringComparer.Ordinal);
        int expectedSequence = 1;
        var eventIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (QualificationLedgerEvent entry in events)
        {
            if (entry.Sequence != expectedSequence++
                || string.IsNullOrWhiteSpace(entry.EventId)
                || !eventIds.Add(entry.EventId))
            {
                return ProcessResult.Failed(
                    "Qualification ledger sequence or event identity is invalid.");
            }

            switch (entry.Type)
            {
                case "install":
                {
                    EnvironmentQualificationPackage? package =
                        entry.Qualification;
                    string? error = package == null
                        ? "Install event has no qualification package."
                        : ValidatePackage(package, entry.At);
                    if (error != null)
                        return ProcessResult.Failed(error);
                    if (!packages.TryAdd(package!.QualificationId, package))
                        return ProcessResult.Failed("Qualification ID is duplicated.");
                    string key = Key(
                        package.EnvironmentDigest,
                        package.SurfaceKind,
                        package.Operation);
                    if (activeByOperation.TryGetValue(key, out string? previous))
                    {
                        if (package.SupersedesQualificationId != previous)
                        {
                            return ProcessResult.Failed(
                                "Qualification replacement does not explicitly supersede the current package.");
                        }
                        statusById[previous] = "superseded";
                        reasonById[previous] = $"superseded_by:{package.QualificationId}";
                    }
                    else if (package.SupersedesQualificationId != null)
                    {
                        return ProcessResult.Failed(
                            "Qualification supersedes a package that is not current.");
                    }
                    activeByOperation[key] = package.QualificationId;
                    statusById[package.QualificationId] = "active";
                    reasonById[package.QualificationId] = null;
                    break;
                }
                case "revoke":
                {
                    if (entry.TargetQualificationId == null
                        || !packages.TryGetValue(
                            entry.TargetQualificationId,
                            out EnvironmentQualificationPackage? package))
                    {
                        return ProcessResult.Failed(
                            "Revoke event targets an unknown qualification.");
                    }
                    string key = Key(
                        package.EnvironmentDigest,
                        package.SurfaceKind,
                        package.Operation);
                    if (activeByOperation.GetValueOrDefault(key)
                        == package.QualificationId)
                    {
                        activeByOperation.Remove(key);
                    }
                    statusById[package.QualificationId] = "revoked";
                    reasonById[package.QualificationId] =
                        entry.Reason ?? "operator_revoked";
                    break;
                }
                case "rollback":
                {
                    if (entry.TargetQualificationId == null
                        || !packages.TryGetValue(
                            entry.TargetQualificationId,
                            out EnvironmentQualificationPackage? target)
                        || target.ExpiresAt <= now)
                    {
                        return ProcessResult.Failed(
                            "Rollback event targets an unknown or expired qualification.");
                    }
                    string key = Key(
                        target.EnvironmentDigest,
                        target.SurfaceKind,
                        target.Operation);
                    if (activeByOperation.TryGetValue(key, out string? current)
                        && current != target.QualificationId)
                    {
                        statusById[current] = "rolled_back";
                        reasonById[current] =
                            $"rolled_back_to:{target.QualificationId}";
                    }
                    activeByOperation[key] = target.QualificationId;
                    statusById[target.QualificationId] = "active";
                    reasonById[target.QualificationId] =
                        entry.Reason ?? "operator_rollback";
                    break;
                }
                default:
                    return ProcessResult.Failed(
                        $"Qualification ledger event type '{entry.Type}' is unsupported.");
            }
        }
        return new ProcessResult(
            packages,
            activeByOperation,
            statusById,
            reasonById,
            null);
    }

    private static string? ValidatePackage(
        EnvironmentQualificationPackage package,
        DateTimeOffset installedAt)
    {
        OperationQualificationIdentity? identity =
            OperationQualificationCatalog.Describe(
                package.SurfaceKind,
                package.Operation);
        bool currentProtocol = string.Equals(
            package.GatewayProtocol,
            GatewayAuthorityContract.QualificationProtocol,
            StringComparison.Ordinal);
        bool readableHistoricalProtocol = package.GatewayProtocol.StartsWith(
            "2.0-preview.",
            StringComparison.Ordinal);
        if (package.ContractKind
            != OperationQualificationCatalog.ExplicitNativeContract)
        {
            return "Manifest migration fallbacks cannot become durable qualifications.";
        }
        if (string.IsNullOrWhiteSpace(package.QualificationId)
            || package.Version <= 0
            || package.AuthorityTier is not ("session_canary" or "qualified")
            || (!currentProtocol && !readableHistoricalProtocol)
            || package.GatewayAssemblySha256.Length != 64
            || string.IsNullOrWhiteSpace(package.GatewayModuleVersionId)
            || string.IsNullOrWhiteSpace(package.ModsetFingerprint)
            || string.IsNullOrWhiteSpace(package.PatchDigest)
            || string.IsNullOrWhiteSpace(package.EnvironmentDigest)
            || package.EvidenceBundleDigest.Length != 64
            || package.EvidenceIds.Count == 0
            || package.NegativeEvidenceIds.Count == 0
            || package.IssuedAt > installedAt
            || package.IssuedAt >= package.ExpiresAt
            || package.ExpiresAt <= installedAt)
        {
            return $"Qualification {package.QualificationId} is incomplete, drifted or expired.";
        }
        if (currentProtocol
            && (identity == null
                || identity.ContractKind
                    != OperationQualificationCatalog.ExplicitNativeContract
                || package.OperationFingerprint != identity.ContractDigest
                || package.CompletionBoundary != identity.CompletionBoundary
                || package.WitnessId != identity.WitnessId
                || package.RiskClass != identity.RiskClass))
        {
            return $"Qualification {package.QualificationId} lacks current reviewed operation contract metadata.";
        }

        if (package.AuthorityTier == "session_canary")
        {
            if (package.ExpiresAt - package.IssuedAt > TimeSpan.FromDays(7))
            {
                return $"Qualification candidate {package.QualificationId} is not an eligible bounded migration operation.";
            }
            if (currentProtocol)
            {
                MigrationPermissionCandidate? candidate =
                    EnvironmentMigrationPermissionPolicy.Find(
                        package.SurfaceKind,
                        package.Operation);
                if (candidate == null
                    || candidate.RiskClass != package.RiskClass
                    || candidate.WitnessId != package.WitnessId)
                {
                    return $"Qualification candidate {package.QualificationId} is not an eligible current migration operation.";
                }
            }
            return null;
        }

        QualificationRuntimeEvidence[] confirmed = package.RuntimeEvidence
            .Where(evidence =>
                evidence.Outcome == "confirmed"
                && evidence.EvidenceClass == "organic"
                && OperationQualificationCatalog.WitnessMatches(
                    package.WitnessId,
                    evidence.WitnessId)
                && !string.IsNullOrWhiteSpace(evidence.RequestId))
            .ToArray();
        if (confirmed.Select(evidence => evidence.RuntimeEpoch)
                .Distinct(StringComparer.Ordinal)
                .Count() < 2)
        {
            return $"Qualification {package.QualificationId} requires confirmed Organic evidence from two runtime epochs.";
        }
        return null;
    }

    private static EnvironmentQualificationStore Failed(
        Func<DateTimeOffset> clock,
        string error,
        string digest,
        string storeId = "unavailable",
        ConcurrentDictionary<string, string>? sessionQuarantineReasons = null) =>
        new(
            clock,
            "invalid_fail_closed",
            storeId,
            digest,
            error,
            new Dictionary<string, EnvironmentQualificationPackage>(),
            new Dictionary<string, string>(),
            new Dictionary<string, string>(),
            new Dictionary<string, string?>(),
            sessionQuarantineReasons);

    private static string Key(
        string environmentDigest,
        string surfaceKind,
        string operation) =>
        $"{environmentDigest}\n{surfaceKind}\n{operation}";

    private sealed record LedgerDocument(
        int SchemaVersion,
        string StoreId,
        IReadOnlyList<QualificationLedgerEvent> Events);

    private sealed record ProcessResult(
        IReadOnlyDictionary<string, EnvironmentQualificationPackage> Packages,
        IReadOnlyDictionary<string, string> ActiveByOperation,
        IReadOnlyDictionary<string, string> StatusById,
        IReadOnlyDictionary<string, string?> ReasonById,
        string? Error)
    {
        public static ProcessResult Failed(string error) => new(
            new Dictionary<string, EnvironmentQualificationPackage>(),
            new Dictionary<string, string>(),
            new Dictionary<string, string>(),
            new Dictionary<string, string?>(),
            error);
    }
}
