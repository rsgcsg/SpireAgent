using System.Collections.Concurrent;
using System.Text.Json;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.Tests;

public sealed class BridgePersistentQualificationStoreTests
{
    private static readonly DateTimeOffset Now =
        DateTimeOffset.Parse("2026-07-25T00:00:00Z");

    [Fact]
    public void OperationCatalogProvidesComponentIdentityAndDistinctCompletionModes()
    {
        Assert.Null(BridgeOperationQualificationCatalog.LoadError);
        Assert.Matches("^[a-f0-9]{64}$", BridgeOperationQualificationCatalog.CatalogDigest);
        int manifestOperationCount = BridgeContractManifest.Entries.Sum(
            entry => entry.Operations.Count);
        IReadOnlyList<BridgeOperationQualificationIdentityInfo> catalog =
            BridgeOperationQualificationCatalog.Snapshot();
        Assert.Equal(manifestOperationCount, catalog.Count);
        Assert.Equal(
            catalog.Count,
            catalog
                .Select(identity => (identity.SurfaceKind, identity.Operation))
                .Distinct()
                .Count());

        BridgeOperationQualificationIdentity menu = Assert.IsType<
            BridgeOperationQualificationIdentity>(
                BridgeOperationQualificationCatalog.Describe(
                    "main_menu",
                    "continue_run"));
        BridgeOperationQualificationIdentity map = Assert.IsType<
            BridgeOperationQualificationIdentity>(
                BridgeOperationQualificationCatalog.Describe(
                    "map_navigation",
                    "choose_map_node"));
        BridgeOperationQualificationIdentity fallback = Assert.IsType<
            BridgeOperationQualificationIdentity>(
                BridgeOperationQualificationCatalog.Describe(
                    "reward_claim",
                    "claim_reward"));

        Assert.Equal("continuation_handoff_observed", menu.CompletionBoundary);
        Assert.Equal(
            BridgeOperationQualificationCatalog.ExplicitNativeContract,
            menu.ContractKind);
        Assert.Equal(
            "saved_singleplayer_run_became_active",
            menu.WitnessId);
        Assert.Equal("immediate_postcondition_observed", map.CompletionBoundary);
        Assert.Equal(
            BridgeOperationQualificationCatalog.ExplicitNativeContract,
            map.ContractKind);
        Assert.Equal(
            BridgeOperationQualificationCatalog.GatewayCompletionBoundary,
            fallback.CompletionBoundary);
        Assert.Equal(
            BridgeOperationQualificationCatalog.RuntimeReportedWitness,
            fallback.WitnessId);
        Assert.Equal(
            BridgeOperationQualificationCatalog.ManifestMigrationFallback,
            fallback.ContractKind);
        Assert.Equal("persistent_run_mutation", fallback.RiskClass);
        Assert.NotEqual(menu.ContractDigest, map.ContractDigest);
        Assert.All(
            catalog,
            identity => Assert.Matches("^[a-f0-9]{64}$", identity.ContractDigest));
    }

    [Fact]
    public void MissingStoreIsVisibleButDoesNotGrantAuthority()
    {
        string path = Path.Combine(
            Path.GetTempPath(),
            $"missing-qualification-{Guid.NewGuid():N}.json");
        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(path, () => Now);
        GameBuildIdentity applied = store.Apply(Game(), Bridge(), Patch());
        BridgeQualificationSystemInfo snapshot = store.Snapshot();

        Assert.Equal("empty", snapshot.Status);
        Assert.False(snapshot.PersistentAuthorityEnabled);
        Assert.Empty(snapshot.Qualifications);
        Assert.NotEqual("not_observed", snapshot.CurrentEnvironmentDigest);
        Assert.Empty(applied.Compatibility.ActionPermissionScopes);
    }

    [Fact]
    public void ExactPackagePersistsQualifiedOperationAcrossStoreReload()
    {
        using var file = new TemporaryLedger();
        BridgePersistentQualificationPackage package = Package(
            "qualification-a",
            "main_menu",
            "continue_run");
        file.Write(Install(1, package));

        BridgePersistentQualificationStore first =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity applied = first.Apply(Game(), Bridge(), Patch());
        ActionPermissionScope scope = Assert.Single(
            applied.Compatibility.ActionPermissionScopes);
        Assert.Equal("qualification_qualification-a", scope.GrantId);
        Assert.Equal("not_session_bound", scope.RuntimeEpoch);
        Assert.True(applied.Modset!.PersistentQualificationEligible);

        BridgePersistentQualificationStore reloaded =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity reloadedApplied = reloaded.Apply(
            Game(),
            Bridge(runtimeEpoch: "runtime-b"),
            Patch());
        Assert.Single(reloadedApplied.Compatibility.ActionPermissionScopes);
        Assert.True(reloaded.Snapshot().PersistentAuthorityEnabled);
        Assert.True(Assert.Single(
            reloaded.Snapshot().Qualifications).ApplicableToCurrentEnvironment);
    }

    [Fact]
    public void ManifestFallbackQualificationIsRejectedBeforeItCanGrantDurableAuthority()
    {
        using var file = new TemporaryLedger();
        BridgePersistentQualificationPackage package = Package(
            "qualification-reward-claim",
            "reward_claim",
            "claim_reward") with
        {
            RuntimeEvidence = new[]
            {
                Evidence(
                    "runtime-a",
                    "request-a",
                    "reward_claimed_and_surface_updated"),
                Evidence(
                    "runtime-b",
                    "request-b",
                    "reward_claimed_and_map_opened")
            }
        };
        file.Write(Install(1, package));

        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity applied = store.Apply(Game(), Bridge(), Patch());

        Assert.Empty(applied.Compatibility.ActionPermissionScopes);
        Assert.Equal("invalid_fail_closed", store.Snapshot().Status);
        Assert.False(store.Snapshot().PersistentAuthorityEnabled);
    }

    [Fact]
    public void SameOperationCanRemainActiveInMultipleExactEnvironments()
    {
        using var file = new TemporaryLedger();
        BridgePersistentQualificationPackage current = Package(
            "qualification-current-environment",
            "main_menu",
            "continue_run");
        BridgePersistentQualificationPackage other = current with
        {
            QualificationId = "qualification-other-environment",
            GameVersion = "v0.110.0",
            GameCommit = "other-commit",
            GameMainAssemblyHash = 42,
            ModsetFingerprint = "other-modset",
            PatchDigest = "other-patch",
            EnvironmentDigest = "other-environment"
        };
        file.Write(
            Install(1, current),
            Install(2, other));

        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity applied = store.Apply(Game(), Bridge(), Patch());
        BridgeQualificationSystemInfo snapshot = store.Snapshot();

        Assert.Equal(
            "qualification_qualification-current-environment",
            Assert.Single(
                applied.Compatibility.ActionPermissionScopes).GrantId);
        Assert.Equal(2, snapshot.Qualifications.Count);
        Assert.All(
            snapshot.Qualifications,
            qualification => Assert.Equal("active", qualification.Status));
        Assert.Single(
            snapshot.Qualifications,
            qualification => qualification.ApplicableToCurrentEnvironment);
    }

    [Fact]
    public void HistoricalProtocolPackageRemainsReadableButCannotAuthorize()
    {
        using var file = new TemporaryLedger();
        BridgePersistentQualificationPackage historical = Package(
            "qualification-preview65",
            "main_menu",
            "continue_run") with
        {
            GatewayProtocol = "2.0-preview.65"
        };
        file.Write(Install(1, historical));

        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity applied = store.Apply(Game(), Bridge(), Patch());
        BridgePersistentQualificationInfo package = Assert.Single(
            store.Snapshot().Qualifications);

        Assert.Equal("active", store.Snapshot().Status);
        Assert.Equal("active", package.Status);
        Assert.False(package.ApplicableToCurrentEnvironment);
        Assert.Empty(applied.Compatibility.ActionPermissionScopes);
    }

    [Fact]
    public void QualifiedStoreKeepsDistinctContinuationAndPostconditionContracts()
    {
        using var file = new TemporaryLedger();
        file.Write(
            Install(
                1,
                Package(
                    "qualification-menu",
                    "main_menu",
                    "continue_run")),
            Install(
                2,
                Package(
                    "qualification-map",
                    "map_navigation",
                    "choose_map_node")));

        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity applied = store.Apply(Game(), Bridge(), Patch());
        BridgeQualificationSystemInfo snapshot = store.Snapshot();

        Assert.Equal(2, applied.Compatibility.ActionPermissionScopes.Count);
        Assert.Contains(
            snapshot.Qualifications,
            value => value.Operation == "continue_run"
                && value.CompletionBoundary == "continuation_handoff_observed");
        Assert.Contains(
            snapshot.Qualifications,
            value => value.Operation == "choose_map_node"
                && value.CompletionBoundary == "immediate_postcondition_observed");
    }

    [Fact]
    public void LowRiskCandidatePackageEntersGatewayOwnedSessionCanary()
    {
        using var file = new TemporaryLedger();
        BridgePersistentQualificationPackage candidate = Package(
            "candidate-shop-open",
            "shop_room",
            "open_shop_inventory") with
        {
            AuthorityTier = "session_canary",
            RuntimeEvidence = Array.Empty<BridgeQualificationRuntimeEvidence>(),
            ExpiresAt = Now.AddDays(3)
        };
        file.Write(Install(1, candidate));

        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity candidateGame = store.Apply(Game(), Bridge(), Patch());
        ActionPermissionScope installedScope = Assert.Single(
            candidateGame.Compatibility.ActionPermissionScopes);
        Assert.Equal("canary", installedScope.Tier);
        Assert.True(candidateGame.Modset!.QualificationCandidateEligible);
        Assert.False(candidateGame.Modset.PersistentQualificationEligible);
        Assert.False(store.Snapshot().PersistentAuthorityEnabled);
        Assert.True(store.Snapshot().SessionCanaryCandidateEnabled);

        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment session = manager.Apply(
            candidateGame,
            Bridge(),
            Patch());
        ActionPermissionScope runtimeScope = Assert.Single(
            session.ActionPermissionScopes);
        Assert.Equal("runtime-a", runtimeScope.RuntimeEpoch);
        Assert.StartsWith("grant_", runtimeScope.GrantId);
        Assert.Equal(
            "session_canary",
            Assert.Single(manager.Snapshot().Grants).Tier);
    }

    [Fact]
    public void WrongEnvironmentLeavesPackageVisibleAndInapplicable()
    {
        using var file = new TemporaryLedger();
        file.Write(Install(
            1,
            Package("qualification-a", "main_menu", "continue_run")));

        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity wrong = Game(modsetFingerprint: "other-modset");
        GameBuildIdentity applied = store.Apply(wrong, Bridge(), Patch());
        BridgePersistentQualificationInfo qualification = Assert.Single(
            store.Snapshot().Qualifications);

        Assert.Empty(applied.Compatibility.ActionPermissionScopes);
        Assert.False(store.Snapshot().PersistentAuthorityEnabled);
        Assert.False(qualification.ApplicableToCurrentEnvironment);
    }

    [Fact]
    public void OneRuntimeEpochOrCorruptLedgerFailsClosed()
    {
        using var insufficient = new TemporaryLedger();
        BridgePersistentQualificationPackage package = Package(
            "qualification-a",
            "main_menu",
            "continue_run") with
        {
            RuntimeEvidence = new[]
            {
                Evidence("runtime-a", "request-a", "saved_singleplayer_run_became_active")
            }
        };
        insufficient.Write(Install(1, package));
        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(insufficient.Path, () => Now);
        store.Apply(Game(), Bridge(), Patch());
        Assert.Equal("invalid_fail_closed", store.Snapshot().Status);
        Assert.False(store.Snapshot().PersistentAuthorityEnabled);

        using var corrupt = new TemporaryLedger();
        corrupt.Write(
            Install(2, Package("qualification-b", "main_menu", "continue_run")));
        BridgePersistentQualificationStore corruptStore =
            BridgePersistentQualificationStore.Load(corrupt.Path, () => Now);
        corruptStore.Apply(Game(), Bridge(), Patch());
        Assert.Equal("invalid_fail_closed", corruptStore.Snapshot().Status);
    }

    [Fact]
    public void RevokeAndRollbackAreAppendOnlyAndOperationScoped()
    {
        using var file = new TemporaryLedger();
        BridgePersistentQualificationPackage first = Package(
            "qualification-a",
            "main_menu",
            "continue_run");
        BridgePersistentQualificationPackage replacement = Package(
            "qualification-b",
            "main_menu",
            "continue_run") with
        {
            Version = 2,
            SupersedesQualificationId = first.QualificationId
        };
        file.Write(
            Install(1, first),
            Install(2, replacement),
            new BridgeQualificationLedgerEvent(
                3,
                "event-3",
                "rollback",
                Now,
                null,
                first.QualificationId,
                "regression_detected"));

        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity applied = store.Apply(Game(), Bridge(), Patch());

        ActionPermissionScope scope = Assert.Single(
            applied.Compatibility.ActionPermissionScopes);
        Assert.Equal("qualification_qualification-a", scope.GrantId);
        Assert.Contains(
            store.Snapshot().Qualifications,
            qualification => qualification.QualificationId == "qualification-b"
                && qualification.Status == "rolled_back");

        using var revokedFile = new TemporaryLedger();
        revokedFile.Write(
            Install(1, first),
            new BridgeQualificationLedgerEvent(
                2,
                "event-2",
                "revoke",
                Now,
                null,
                first.QualificationId,
                "operator_revoked"));
        BridgePersistentQualificationStore revoked =
            BridgePersistentQualificationStore.Load(revokedFile.Path, () => Now);
        Assert.Empty(revoked.Apply(
            Game(),
            Bridge(),
            Patch()).Compatibility.ActionPermissionScopes);
    }

    [Fact]
    public void FirstValidatedFailureQuarantinesPersistentOperationForSession()
    {
        using var file = new TemporaryLedger();
        file.Write(Install(
            1,
            Package("qualification-a", "main_menu", "continue_run")));
        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        ActionPermissionScope scope = Assert.Single(store.Apply(
            Game(),
            Bridge(),
            Patch()).Compatibility.ActionPermissionScopes);
        var binding = new BridgeActionPermissionBinding(
            scope.SurfaceKind,
            scope.Operation,
            scope.Tier,
            scope.GrantId,
            scope.GrantVersion,
            scope.RuntimeEpoch,
            scope.EnvironmentDigest,
            scope.PatchDigest,
            scope.OperationFingerprint);
        store.ObserveCommand(
            "request-timeout",
            binding,
            new BridgeCommandResponse(
                "request-timeout",
                "state-a",
                "action-a",
                "timed_out",
                "unknown",
                "state-b",
                new[]
                {
                    new BridgeCommandEvent(
                        "validated",
                        Now,
                        "state_and_action_revalidated",
                        null,
                        null),
                    new BridgeCommandEvent(
                        "timed_out",
                        Now,
                        null,
                        "completion_timeout",
                        null)
                }));

        Assert.Empty(store.Apply(
            Game(),
            Bridge(),
            Patch()).Compatibility.ActionPermissionScopes);
        BridgePersistentQualificationInfo qualification = Assert.Single(
            store.Snapshot().Qualifications);
        Assert.Equal("session_quarantined", qualification.Status);
        Assert.Equal("session_quarantined", qualification.Applicability);
        Assert.Equal("completion_timeout", qualification.StatusReason);
        Assert.False(store.Snapshot().PersistentAuthorityEnabled);
    }

    [Fact]
    public void ManifestFallbackQualificationCannotBeActivatedByConcreteGatewayWitness()
    {
        using var file = new TemporaryLedger();
        file.Write(Install(
            1,
            Package("qualification-a", "reward_claim", "claim_reward")));
        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        Assert.Empty(store.Apply(
            Game(),
            Bridge(),
            Patch()).Compatibility.ActionPermissionScopes);
        Assert.Equal("invalid_fail_closed", store.Snapshot().Status);
        Assert.False(store.Snapshot().PersistentAuthorityEnabled);
    }

    [Fact]
    public void StoreReloadCannotClearSessionQuarantine()
    {
        using var file = new TemporaryLedger();
        file.Write(Install(
            1,
            Package("qualification-a", "main_menu", "continue_run")));
        var quarantine = new ConcurrentDictionary<string, string>(
            StringComparer.Ordinal);
        BridgePersistentQualificationStore first =
            BridgePersistentQualificationStore.Load(
                file.Path,
                () => Now,
                quarantine);
        ActionPermissionScope scope = Assert.Single(first.Apply(
            Game(),
            Bridge(),
            Patch()).Compatibility.ActionPermissionScopes);
        var binding = new BridgeActionPermissionBinding(
            scope.SurfaceKind,
            scope.Operation,
            scope.Tier,
            scope.GrantId,
            scope.GrantVersion,
            scope.RuntimeEpoch,
            scope.EnvironmentDigest,
            scope.PatchDigest,
            scope.OperationFingerprint);
        first.ObserveCommand(
            "request-timeout",
            binding,
            new BridgeCommandResponse(
                "request-timeout",
                "state-a",
                "action-a",
                "timed_out",
                "unknown",
                "state-b",
                new[]
                {
                    new BridgeCommandEvent(
                        "validated",
                        Now,
                        "state_and_action_revalidated",
                        null,
                        null),
                    new BridgeCommandEvent(
                        "timed_out",
                        Now,
                        null,
                        "completion_timeout",
                        null)
                }));

        BridgePersistentQualificationStore reloaded =
            BridgePersistentQualificationStore.Load(
                file.Path,
                () => Now,
                quarantine);
        Assert.Empty(reloaded.Apply(
            Game(),
            Bridge(),
            Patch()).Compatibility.ActionPermissionScopes);
        Assert.Equal(
            "session_quarantined",
            Assert.Single(reloaded.Snapshot().Qualifications).Status);
    }

    [Fact]
    public void ExpiredHistoricalPackageDoesNotCorruptNewerActivePackage()
    {
        using var file = new TemporaryLedger();
        BridgePersistentQualificationPackage expired = Package(
            "qualification-old",
            "main_menu",
            "continue_run") with
        {
            IssuedAt = Now.AddDays(-30),
            ExpiresAt = Now.AddDays(-1)
        };
        BridgePersistentQualificationPackage current = Package(
            "qualification-current",
            "main_menu",
            "continue_run") with
        {
            Version = 2,
            SupersedesQualificationId = expired.QualificationId
        };
        file.Write(
            Install(1, expired, Now.AddDays(-29)),
            Install(2, current));

        BridgePersistentQualificationStore store =
            BridgePersistentQualificationStore.Load(file.Path, () => Now);
        GameBuildIdentity applied = store.Apply(Game(), Bridge(), Patch());

        Assert.Equal("active", store.Snapshot().Status);
        Assert.Equal(
            "qualification_qualification-current",
            Assert.Single(applied.Compatibility.ActionPermissionScopes).GrantId);
    }

    private static BridgeQualificationLedgerEvent Install(
        int sequence,
        BridgePersistentQualificationPackage package,
        DateTimeOffset? at = null) => new(
            sequence,
            $"event-{sequence}",
            "install",
            at ?? Now,
            package,
            null,
            null);

    private static BridgePersistentQualificationPackage Package(
        string id,
        string surfaceKind,
        string operation)
    {
        BridgeOperationQualificationIdentity identity = Assert.IsType<
            BridgeOperationQualificationIdentity>(
                BridgeOperationQualificationCatalog.Describe(
                    surfaceKind,
                    operation));
        GameBuildIdentity game = Game();
        BridgeServerIdentity bridge = Bridge();
        BridgeRuntimePatchInventoryInfo patch = Patch();
        return new BridgePersistentQualificationPackage(
            id,
            1,
            "qualified",
            surfaceKind,
            operation,
            identity.ContractKind,
            identity.RiskClass,
            game.Version!,
            game.Commit!,
            game.MainAssemblyHash!.Value,
            BridgeV2Contract.ProtocolVersion,
            bridge.AssemblyFileSha256,
            bridge.ModuleVersionId,
            game.Modset!.Fingerprint,
            patch.Digest,
            BridgePermissionManager.EnvironmentDigest(game, bridge, patch),
            identity.ContractDigest,
            identity.CompletionBoundary,
            identity.WitnessId,
            new string('e', 64),
            new[] { "organic-run-a", "organic-run-b" },
            new[] { "stale-action-negative" },
            new[]
            {
                Evidence("runtime-a", "request-a", identity.WitnessId),
                Evidence("runtime-b", "request-b", identity.WitnessId)
            },
            Now.AddHours(-1),
            Now.AddDays(30),
            null);
    }

    private static BridgeQualificationRuntimeEvidence Evidence(
        string runtime,
        string request,
        string witness) => new(
            runtime,
            request,
            "confirmed",
            witness,
            "organic");

    private static GameBuildIdentity Game(
        string modsetFingerprint = "fixture-modset") => new(
        "v0.109.0",
        "c12f634d",
        "v0.109.0",
        -1639417500,
        new CompatibilityAssessment(
            "unsupported_environment",
            Array.Empty<string>(),
            Array.Empty<string>(),
            ActionExecutionAllowed: false,
            StateObservationAllowed: false,
            InspectionAllowed: false,
            Array.Empty<string>(),
            Array.Empty<string>(),
            Array.Empty<string>(),
            Array.Empty<string>(),
            Array.Empty<string>(),
            Array.Empty<string>(),
            "fixture fail-closed environment")
        {
            CompatibilityPolicyId = "fixture-policy",
            CompatibilityPolicyDigest = new string('b', 64),
            AdaptationLevel = "diagnostic_only"
        },
        new ModsetIdentity(
            "additional_mods_loaded",
            modsetFingerprint,
            "fixture-scope",
            ExactPermissionEligible: false,
            Array.Empty<LoadedModIdentity>(),
            "fixture"));

    private static BridgeServerIdentity Bridge(
        string runtimeEpoch = "runtime-a") => new(
        "sts2_mcp_bridge_v2",
        "fixture",
        "0.5.0-dev",
        "upstream",
        "11111111-1111-1111-1111-111111111111",
        runtimeEpoch)
    {
        AssemblyFileSha256 = new string('a', 64)
    };

    private static BridgeRuntimePatchInventoryInfo Patch() =>
        BridgeRuntimePatchInventory.Classify(
            new[]
            {
                new BridgeRuntimePatchDescriptor(
                    "Game.Method()",
                    "prefix",
                    BridgeRuntimePatchInventory.GatewayHarmonyOwner,
                    "Gateway.Patch()")
            });

    private sealed class TemporaryLedger : IDisposable
    {
        public TemporaryLedger()
        {
            Path = System.IO.Path.Combine(
                System.IO.Path.GetTempPath(),
                $"qualification-{Guid.NewGuid():N}.json");
        }

        public string Path { get; }

        public void Write(params BridgeQualificationLedgerEvent[] events)
        {
            string json = JsonSerializer.Serialize(
                new
                {
                    schema_version = 1,
                    store_id = "fixture-store",
                    events
                },
                new JsonSerializerOptions
                {
                    WriteIndented = true,
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                });
            File.WriteAllText(Path, json);
        }

        public void Dispose()
        {
            if (File.Exists(Path))
                File.Delete(Path);
        }
    }
}
