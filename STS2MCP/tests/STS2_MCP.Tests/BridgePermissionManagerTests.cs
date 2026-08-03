using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.Tests;

public sealed class BridgePermissionManagerTests
{
    [Fact]
    public void BalancedGrayCreatesSessionCanaryOnlyInsideStaticCeiling()
    {
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment applied = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        ActionPermissionScope scope = Assert.Single(applied.ActionPermissionScopes);
        Assert.Equal("canary", scope.Tier);
        Assert.Equal("runtime-a", scope.RuntimeEpoch);
        Assert.StartsWith("grant_", scope.GrantId);
        BridgePermissionGrantRecord grant = Assert.Single(manager.Snapshot().Grants);
        Assert.Equal("session_canary", grant.Tier);
        Assert.Equal("active", grant.Status);
        Assert.Equal(scope.GrantId, grant.GrantId);
    }

    [Fact]
    public void ConfirmedSemanticCompletionPromotesWithinSessionOnly()
    {
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment first = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());
        BridgeActionPermissionBinding binding = Binding(Assert.Single(first.ActionPermissionScopes));

        manager.ObserveCommand(
            "request-a",
            binding,
            Command(
                "request-a",
                "completed",
                "confirmed",
                "completed",
                null,
                "singleplayer_or_character_select_owner_became_active"));
        CompatibilityAssessment promoted = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        ActionPermissionScope currentScope = Assert.Single(promoted.ActionPermissionScopes);
        Assert.NotEqual(binding.GrantId, currentScope.GrantId);
        Assert.Equal(2, currentScope.GrantVersion);
        BridgePermissionGrantRecord current = manager.Snapshot().Grants[^1];
        Assert.Equal("session_trial_confirmed", current.Tier);
        Assert.Equal("active", current.Status);
        Assert.Equal(binding.GrantId, current.SupersedesGrantId);
    }

    [Fact]
    public void CompletionWitnessMismatchQuarantinesInsteadOfPromoting()
    {
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment first = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());
        BridgeActionPermissionBinding binding = Binding(Assert.Single(first.ActionPermissionScopes));

        manager.ObserveCommand(
            "request-a",
            binding,
            Command(
                "request-a",
                "completed",
                "confirmed",
                "completed",
                null,
                "wrong_completion_witness"));
        CompatibilityAssessment after = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        Assert.Empty(after.ActionPermissionScopes);
        BridgePermissionGrantRecord quarantined = manager.Snapshot().Grants[^1];
        Assert.Equal("quarantined", quarantined.Status);
        Assert.Equal("none", quarantined.Tier);
        Assert.Equal(
            "semantic_completion_witness_mismatch",
            quarantined.RevocationReason);
    }

    [Fact]
    public void FirstValidatedFailureQuarantinesAndRevokesPublication()
    {
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment first = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());
        BridgeActionPermissionBinding binding = Binding(Assert.Single(first.ActionPermissionScopes));

        manager.ObserveCommand(
            "request-a",
            binding,
            Command(
                "request-a",
                "failed",
                "unknown",
                "failed",
                "completion_probe_failed"));
        CompatibilityAssessment after = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        Assert.Empty(after.ActionPermissionScopes);
        BridgePermissionGrantRecord quarantined = manager.Snapshot().Grants[^1];
        Assert.Equal("quarantined", quarantined.Status);
        Assert.Equal("none", quarantined.Tier);
        Assert.Equal("completion_probe_failed", quarantined.RevocationReason);
        Assert.False(manager.AuthorizeExecution(binding, after));
    }

    [Fact]
    public void StaleRequestDoesNotPunishOperation()
    {
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment first = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());
        BridgeActionPermissionBinding binding = Binding(Assert.Single(first.ActionPermissionScopes));

        manager.ObserveCommand(
            "request-a",
            binding,
            new BridgeCommandResponse(
                "request-a",
                "state-a",
                "action-a",
                "rejected",
                "not_applied",
                "state-b",
                new[]
                {
                    new BridgeCommandEvent(
                        "rejected",
                        DateTimeOffset.UtcNow,
                        null,
                        "stale_state",
                        null)
                }));
        CompatibilityAssessment after = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        Assert.Single(after.ActionPermissionScopes);
        Assert.Single(manager.Snapshot().Grants);
    }

    [Fact]
    public void StrictModeSuppressesEveryCanaryButRetainsQualifiedScope()
    {
        var manager = new BridgePermissionManager(
            "runtime-a",
            BridgePermissionMode.Strict);
        CompatibilityAssessment applied = manager.Apply(
            GameWithScopes(
                Scope("main_menu", "open_singleplayer", "canary"),
                Scope("combat_turn", "end_turn", "qualified")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        ActionPermissionScope scope = Assert.Single(applied.ActionPermissionScopes);
        Assert.Equal("combat_turn", scope.SurfaceKind);
        Assert.Equal("qualified", scope.Tier);
        Assert.Empty(manager.Snapshot().Grants);
    }

    [Fact]
    public void DynamicCandidateCannotEscapeStaticPolicyCeiling()
    {
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment applied = manager.Apply(
            GameWithScopes(),
            Bridge("runtime-a"),
            CleanPatchInventory());

        Assert.Empty(applied.ActionPermissionScopes);
        Assert.Empty(manager.Snapshot().Grants);
    }

    [Fact]
    public void UnknownHarmonyOwnerSuppressesDynamicCandidate()
    {
        BridgeRuntimePatchInventoryInfo patch = BridgeRuntimePatchInventory.Classify(
            new[]
            {
                new BridgeRuntimePatchDescriptor(
                    "Game.Method()",
                    "prefix",
                    "unknown.mod",
                    "Unknown.Patch()")
            });
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment applied = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            patch);

        Assert.Empty(applied.ActionPermissionScopes);
        Assert.False(manager.Snapshot().DynamicSessionPromotionEnabled);
        Assert.Equal(new[] { "unknown.mod" }, patch.UnknownOwners);
    }

    [Fact]
    public void MissingGatewayPatchOwnerSuppressesDynamicCandidate()
    {
        BridgeRuntimePatchInventoryInfo patch =
            BridgeRuntimePatchInventory.Classify(
                Array.Empty<BridgeRuntimePatchDescriptor>());
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment applied = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            patch);

        Assert.Empty(applied.ActionPermissionScopes);
        Assert.False(manager.Snapshot().DynamicSessionPromotionEnabled);
        Assert.Equal("gateway_patch_owner_missing", patch.Status);
    }

    [Fact]
    public void ExpiredSessionGrantIsRevokedAndCannotBeRepublished()
    {
        DateTimeOffset now = new(2026, 7, 25, 0, 0, 0, TimeSpan.Zero);
        var manager = new BridgePermissionManager(
            "runtime-a",
            BridgePermissionMode.BalancedGray,
            () => now);
        CompatibilityAssessment first = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        Assert.Single(first.ActionPermissionScopes);
        now = now.AddHours(5);
        CompatibilityAssessment expired = manager.Apply(
            GameWithScopes(Scope("main_menu", "open_singleplayer", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        Assert.Empty(expired.ActionPermissionScopes);
        BridgePermissionGrantRecord current = Assert.Single(
            manager.Snapshot().Grants,
            grant => grant.Current);
        Assert.Equal("expired", current.Status);
        Assert.Equal("none", current.Tier);
        Assert.Equal("session_grant_expired", current.RevocationReason);
    }

    [Fact]
    public void MigrationOnlyFallbackCanaryIsSuppressedInBalancedMode()
    {
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment applied = manager.Apply(
            GameWithScopes(Scope("reward_claim", "claim_reward", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        Assert.Empty(applied.ActionPermissionScopes);
        Assert.Empty(manager.Snapshot().Grants);
    }

    [Fact]
    public void MigrationPolicyDerivesCandidatesFromReviewedContractsAndRisk()
    {
        Assert.Null(BridgeMigrationPermissionPolicy.LoadError);
        Assert.Matches("^[a-f0-9]{64}$", BridgeMigrationPermissionPolicy.PolicyDigest);
        BridgeMigrationPermissionCandidate candidate =
            Assert.IsType<BridgeMigrationPermissionCandidate>(
                BridgeMigrationPermissionPolicy.Find(
                    "main_menu",
                    "open_singleplayer"));
        Assert.Equal("reversible_navigation", candidate.RiskClass);
        Assert.Contains("migration_exploration", candidate.EligibleModes);
        BridgeMigrationPermissionCandidate openShop =
            Assert.IsType<BridgeMigrationPermissionCandidate>(
                BridgeMigrationPermissionPolicy.Find(
                    "shop_room",
                    "open_shop_inventory"));
        Assert.Equal("shop_inventory_opened", openShop.WitnessId);
        BridgeMigrationPermissionCandidate map =
            Assert.IsType<BridgeMigrationPermissionCandidate>(
                BridgeMigrationPermissionPolicy.Find(
                    "map_navigation",
                    "choose_map_node"));
        Assert.Equal("progression", map.RiskClass);
        Assert.Equal(
            new[] { "developer_gray", "migration_exploration" },
            map.EligibleModes);
        BridgeMigrationPermissionCandidate enchant =
            Assert.IsType<BridgeMigrationPermissionCandidate>(
                BridgeMigrationPermissionPolicy.Find(
                    "deck_enchant_selection",
                    "confirm_selection"));
        Assert.Equal("persistent_run_mutation", enchant.RiskClass);
        Assert.Equal(new[] { "migration_exploration" }, enchant.EligibleModes);
        BridgeMigrationPermissionCandidate transform =
            Assert.IsType<BridgeMigrationPermissionCandidate>(
                BridgeMigrationPermissionPolicy.Find(
                    "deck_transform_selection",
                    "confirm_deck_transform"));
        Assert.Equal("persistent_run_mutation", transform.RiskClass);
        Assert.Equal(new[] { "migration_exploration" }, transform.EligibleModes);
        Assert.Equal(
            "transform_screen_closed_original_instances_absent_and_deck_count_preserved",
            transform.WitnessId);
    }

    [Fact]
    public void ProgressionCandidateRequiresDeveloperOrMigrationMode()
    {
        GameBuildIdentity game = GameWithScopes(
            Scope("map_navigation", "choose_map_node", "canary"));
        CompatibilityAssessment balanced = new BridgePermissionManager(
            "runtime-balanced",
            BridgePermissionMode.BalancedGray).Apply(
                game,
                Bridge("runtime-balanced"),
                CleanPatchInventory());
        CompatibilityAssessment developer = new BridgePermissionManager(
            "runtime-developer",
            BridgePermissionMode.DeveloperGray).Apply(
                game,
                Bridge("runtime-developer"),
                CleanPatchInventory());

        Assert.Empty(balanced.ActionPermissionScopes);
        ActionPermissionScope scope = Assert.Single(
            developer.ActionPermissionScopes);
        Assert.Equal("runtime-developer", scope.RuntimeEpoch);
        Assert.Equal("canary", scope.Tier);
    }

    [Fact]
    public void PersistentMutationCandidateRequiresMigrationExploration()
    {
        GameBuildIdentity game = GameWithScopes(
            Scope(
                "deck_enchant_selection",
                "confirm_selection",
                "canary"));
        CompatibilityAssessment developer = new BridgePermissionManager(
            "runtime-developer",
            BridgePermissionMode.DeveloperGray).Apply(
                game,
                Bridge("runtime-developer"),
                CleanPatchInventory());
        CompatibilityAssessment migration = new BridgePermissionManager(
            "runtime-migration",
            BridgePermissionMode.MigrationExploration).Apply(
                game,
                Bridge("runtime-migration"),
                CleanPatchInventory());

        Assert.Empty(developer.ActionPermissionScopes);
        ActionPermissionScope scope = Assert.Single(
            migration.ActionPermissionScopes);
        Assert.Equal("runtime-migration", scope.RuntimeEpoch);
        Assert.Equal("canary", scope.Tier);
    }

    [Fact]
    public void DynamicWitnessContractPromotesOnlyAfterGatewayReportsSemanticCompletion()
    {
        var manager = new BridgePermissionManager(
            "runtime-migration",
            BridgePermissionMode.MigrationExploration);
        CompatibilityAssessment first = manager.Apply(
            GameWithScopes(
                Scope("combat_pile_card_selection", "confirm_combat_pile_selection", "canary")),
            Bridge("runtime-migration"),
            CleanPatchInventory());
        BridgeActionPermissionBinding binding = Binding(
            Assert.Single(first.ActionPermissionScopes));

        manager.ObserveCommand(
            "request-reward",
            binding,
            Command(
                "request-reward",
                "completed",
                "confirmed",
                "completed",
                null,
                "reward_claimed_and_surface_updated"));
        CompatibilityAssessment promoted = manager.Apply(
            GameWithScopes(
                Scope("combat_pile_card_selection", "confirm_combat_pile_selection", "canary")),
            Bridge("runtime-migration"),
            CleanPatchInventory());

        Assert.Single(promoted.ActionPermissionScopes);
        Assert.Equal(
            "session_trial_confirmed",
            manager.Snapshot().Grants[^1].Tier);
    }

    [Fact]
    public void DynamicWitnessContractWithoutGatewayWitnessIsQuarantined()
    {
        var manager = new BridgePermissionManager(
            "runtime-migration",
            BridgePermissionMode.MigrationExploration);
        CompatibilityAssessment first = manager.Apply(
            GameWithScopes(
                Scope("combat_pile_card_selection", "confirm_combat_pile_selection", "canary")),
            Bridge("runtime-migration"),
            CleanPatchInventory());
        BridgeActionPermissionBinding binding = Binding(
            Assert.Single(first.ActionPermissionScopes));

        manager.ObserveCommand(
            "request-reward",
            binding,
            Command(
                "request-reward",
                "completed",
                "confirmed",
                "completed",
                null));
        CompatibilityAssessment after = manager.Apply(
            GameWithScopes(
                Scope("combat_pile_card_selection", "confirm_combat_pile_selection", "canary")),
            Bridge("runtime-migration"),
            CleanPatchInventory());

        Assert.Empty(after.ActionPermissionScopes);
        BridgePermissionGrantRecord quarantined = manager.Snapshot().Grants[^1];
        Assert.Equal("quarantined", quarantined.Status);
        Assert.Equal(
            "semantic_completion_witness_mismatch",
            quarantined.RevocationReason);
    }

    [Fact]
    public void SnapshotNeverDropsCurrentGrantsBeyondHistoryWindow()
    {
        ActionPermissionScope[] scopes =
            BridgeOperationQualificationCatalog.Snapshot()
                .Select(identity =>
                    Scope(identity.SurfaceKind, identity.Operation, "canary"))
                .ToArray();
        var manager = new BridgePermissionManager(
            "runtime-migration",
            BridgePermissionMode.MigrationExploration);

        CompatibilityAssessment applied = manager.Apply(
            GameWithScopes(scopes),
            Bridge("runtime-migration"),
            CleanPatchInventory());
        BridgePermissionSystemInfo snapshot = manager.Snapshot();
        int expectedDynamicGrants = scopes.Count(scope =>
            BridgeMigrationPermissionPolicy.Find(scope.SurfaceKind, scope.Operation) != null);

        Assert.Equal(scopes.Length, applied.ActionPermissionScopes.Count);
        Assert.Equal(expectedDynamicGrants, snapshot.Grants.Count);
        Assert.True(expectedDynamicGrants > 64);
        Assert.All(snapshot.Grants, grant =>
        {
            Assert.True(grant.Current);
            Assert.Equal("active", grant.Status);
        });
    }

    [Fact]
    public void NonMenuNavigationCandidateUsesTheSameSessionStateMachine()
    {
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment first = manager.Apply(
            GameWithScopes(Scope("shop_room", "open_shop_inventory", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());
        BridgeActionPermissionBinding binding = Binding(Assert.Single(
            first.ActionPermissionScopes));

        manager.ObserveCommand(
            "request-shop",
            binding,
            Command(
                "request-shop",
                "completed",
                "confirmed",
                "completed",
                null,
                "shop_inventory_opened"));
        CompatibilityAssessment promoted = manager.Apply(
            GameWithScopes(Scope("shop_room", "open_shop_inventory", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        ActionPermissionScope scope = Assert.Single(
            promoted.ActionPermissionScopes);
        Assert.Equal("shop_room", scope.SurfaceKind);
        Assert.Equal(2, scope.GrantVersion);
        Assert.Equal(
            "session_trial_confirmed",
            manager.Snapshot().Grants[^1].Tier);
    }

    [Fact]
    public void InvalidPermissionModeFailsClosedWhileMissingModeUsesLocalDefault()
    {
        Assert.Equal(
            BridgePermissionMode.BalancedGray,
            BridgePermissionManager.ParseMode(null));
        Assert.Equal(
            BridgePermissionMode.Strict,
            BridgePermissionManager.ParseMode("unexpected_mode"));
        Assert.Equal(
            BridgePermissionMode.MigrationExploration,
            BridgePermissionManager.ParseMode("migration_exploration"));
    }

    [Fact]
    public void EncounterSourceResolvedActionGetsOnlyRuntimeScopedTrialAuthority()
    {
        var manager = new BridgePermissionManager(
            "runtime-migration",
            BridgePermissionMode.MigrationExploration);
        BridgeServerIdentity bridge = Bridge("runtime-migration");
        GameBuildIdentity diagnostic = DiagnosticGame();
        CompatibilityAssessment initial = manager.Apply(
            diagnostic,
            bridge,
            CleanPatchInventory());
        Assert.False(initial.InspectionAllowed);
        Assert.Empty(initial.InspectionCanaryKinds);
        var draft = EncounterDraft(
            diagnostic with { Compatibility = initial },
            "open_shop_inventory");

        BridgeObservationDraft admitted = manager.AdmitEncounter(draft, bridge);

        ActionPermissionScope scope = Assert.Single(
            admitted.Game.Compatibility.ActionPermissionScopes);
        Assert.Equal("canary", scope.Tier);
        Assert.Equal("runtime-migration", scope.RuntimeEpoch);
        Assert.Equal("encounter_source_resolved", scope.AdmissionBasis);
        Assert.Equal(
            "encounter_provisional_trial",
            admitted.Game.Compatibility.AdaptationLevel);
        Assert.True(admitted.Game.Compatibility.InspectionAllowed);
        Assert.Empty(admitted.Game.Compatibility.InspectionAllowedKinds);
        Assert.Equal(
            BridgeContractManifest.ImplementedInspectionKinds.OrderBy(value => value),
            admitted.Game.Compatibility.InspectionCanaryKinds);
        BridgePermissionGrantRecord grant = Assert.Single(manager.Snapshot().Grants);
        Assert.Equal("session_canary", grant.Tier);
        Assert.Equal("encounter_source_resolved", grant.AdmissionBasis);
        Assert.Contains(
            "admission:encounter_source_resolved",
            grant.EvidenceIds);
        Assert.Contains(
            admitted.Warnings,
            warning => warning.StartsWith(
                "encounter_provisional_trial:",
                StringComparison.Ordinal));
    }

    [Fact]
    public void ExplicitV3NativeCandidateGetsTrialWithoutProviderActionDraft()
    {
        var manager = new BridgePermissionManager(
            "runtime-v3-native",
            BridgePermissionMode.MigrationExploration);
        BridgeServerIdentity bridge = Bridge("runtime-v3-native");
        GameBuildIdentity diagnostic = DiagnosticGame();
        CompatibilityAssessment initial = manager.Apply(
            diagnostic,
            bridge,
            CleanPatchInventory());
        BridgeObservationDraft draft = EncounterDraft(
            diagnostic with { Compatibility = initial },
            "unused_provider_action") with
        {
            Surface = new DeckRemovalSelectionSurface(
                "deck_removal_selection",
                "selecting",
                "screen-a",
                "Choose a card to Remove.",
                1,
                1,
                0,
                Array.Empty<string>(),
                true,
                new[] { "card-a" },
                Array.Empty<string>(),
                false,
                true,
                false,
                false,
                Array.Empty<VisibleCard>()),
            Actions = Array.Empty<BridgeActionDraft>()
        };

        BridgeObservationDraft admitted = manager.AdmitEncounter(
            draft,
            bridge,
            new[]
            {
                new BridgeEncounterAuthorityCandidate(
                    "deck_removal_selection",
                    "toggle_deck_removal_card",
                    "MerchantCardRemovalEntry+exact-current-card",
                    RequiresExplicitNativeContract: true)
            });

        ActionPermissionScope scope = Assert.Single(
            admitted.Game.Compatibility.ActionPermissionScopes);
        Assert.Equal("deck_removal_selection", scope.SurfaceKind);
        Assert.Equal("toggle_deck_removal_card", scope.Operation);
        Assert.Equal("encounter_source_resolved", scope.AdmissionBasis);
        Assert.Empty(admitted.Actions);
        Assert.Contains(
            Assert.Single(manager.Snapshot().Grants).EvidenceIds,
            value => value.StartsWith("source-evidence-digest:", StringComparison.Ordinal));
    }

    [Fact]
    public void EncounterTrialDoesNotTransferAcrossSourceEvidencePartitions()
    {
        var manager = new BridgePermissionManager(
            "runtime-source-partitions",
            BridgePermissionMode.MigrationExploration);
        BridgeServerIdentity bridge = Bridge("runtime-source-partitions");
        GameBuildIdentity diagnostic = DiagnosticGame();
        CompatibilityAssessment initial = manager.Apply(
            diagnostic,
            bridge,
            CleanPatchInventory());
        BridgeObservationDraft firstDraft = EncounterDraft(
            diagnostic with { Compatibility = initial },
            "open_shop_inventory");

        BridgeObservationDraft first = manager.AdmitEncounter(
            firstDraft,
            bridge,
            new[]
            {
                new BridgeEncounterAuthorityCandidate(
                    "shop_room",
                    "open_shop_inventory",
                    "source-contract-a",
                    RequiresExplicitNativeContract: true)
            });
        ActionPermissionScope firstScope = Assert.Single(
            first.Game.Compatibility.ActionPermissionScopes);

        CompatibilityAssessment withFirst = manager.Apply(
            diagnostic,
            bridge,
            CleanPatchInventory());
        BridgeObservationDraft second = manager.AdmitEncounter(
            EncounterDraft(
                diagnostic with { Compatibility = withFirst },
                "open_shop_inventory"),
            bridge,
            new[]
            {
                new BridgeEncounterAuthorityCandidate(
                    "shop_room",
                    "open_shop_inventory",
                    "source-contract-b",
                    RequiresExplicitNativeContract: true)
            });
        ActionPermissionScope secondScope = Assert.Single(
            second.Game.Compatibility.ActionPermissionScopes);

        Assert.NotEqual(
            firstScope.OperationFingerprint,
            secondScope.OperationFingerprint);
        Assert.NotEqual(firstScope.GrantId, secondScope.GrantId);
        Assert.Equal(firstScope.GrantVersion + 1, secondScope.GrantVersion);
        Assert.Equal(firstScope.GrantId, Assert.Single(
            manager.Snapshot().Grants,
            grant => grant.Current).SupersedesGrantId);
        Assert.Contains(
            Assert.Single(manager.Snapshot().Grants, grant => grant.Current).EvidenceIds,
            value => value == $"source-partition-supersedes:{firstScope.GrantId}");
    }

    [Fact]
    public void V3NativeCandidateCannotAdmitUnknownContract()
    {
        var manager = new BridgePermissionManager(
            "runtime-v3-fallback",
            BridgePermissionMode.MigrationExploration);
        BridgeServerIdentity bridge = Bridge("runtime-v3-fallback");
        GameBuildIdentity diagnostic = DiagnosticGame();
        CompatibilityAssessment initial = manager.Apply(
            diagnostic,
            bridge,
            CleanPatchInventory());
        BridgeObservationDraft draft = EncounterDraft(
            diagnostic with { Compatibility = initial },
            "unused_provider_action") with
        {
            Surface = new UnsupportedSurface(
                "deck_transform_selection",
                "fixture",
                "fixture"),
            Actions = Array.Empty<BridgeActionDraft>()
        };

        BridgeObservationDraft admitted = manager.AdmitEncounter(
            draft,
            bridge,
            new[]
            {
                new BridgeEncounterAuthorityCandidate(
                    "deck_transform_selection",
                    "unknown_selector_operation",
                    "fixture-source",
                    RequiresExplicitNativeContract: true)
            });

        Assert.Empty(admitted.Game.Compatibility.ActionPermissionScopes);
        Assert.Empty(manager.Snapshot().Grants);
    }

    [Fact]
    public void EncounterAdmissionRemainsDisabledOutsideMigrationExploration()
    {
        var manager = new BridgePermissionManager(
            "runtime-strict",
            BridgePermissionMode.Strict);
        BridgeServerIdentity bridge = Bridge("runtime-strict");
        GameBuildIdentity diagnostic = DiagnosticGame();
        CompatibilityAssessment initial = manager.Apply(
            diagnostic,
            bridge,
            CleanPatchInventory());

        BridgeObservationDraft admitted = manager.AdmitEncounter(
            EncounterDraft(
                diagnostic with { Compatibility = initial },
                "open_shop_inventory"),
            bridge);

        Assert.Empty(admitted.Game.Compatibility.ActionPermissionScopes);
        Assert.False(admitted.Game.Compatibility.InspectionAllowed);
        Assert.Empty(admitted.Game.Compatibility.InspectionCanaryKinds);
        Assert.Empty(manager.Snapshot().Grants);
    }

    [Fact]
    public void ReadOnlyInspectionTrialFailsClosedForUnknownPatchOwner()
    {
        var manager = new BridgePermissionManager(
            "runtime-migration",
            BridgePermissionMode.MigrationExploration);
        BridgeServerIdentity bridge = Bridge("runtime-migration");
        GameBuildIdentity diagnostic = DiagnosticGame();
        BridgeRuntimePatchInventoryInfo unknownPatch = BridgeRuntimePatchInventory.Classify(
            new[]
            {
                new BridgeRuntimePatchDescriptor(
                    "Game.Method()",
                    "prefix",
                    "unknown.mod",
                    "Unknown.Patch()")
            });
        CompatibilityAssessment initial = manager.Apply(
            diagnostic,
            bridge,
            unknownPatch);

        BridgeObservationDraft admitted = manager.AdmitEncounter(
            EncounterDraft(
                diagnostic with { Compatibility = initial },
                "open_shop_inventory"),
            bridge);

        Assert.Empty(admitted.Game.Compatibility.ActionPermissionScopes);
        Assert.False(admitted.Game.Compatibility.InspectionAllowed);
        Assert.Empty(admitted.Game.Compatibility.InspectionCanaryKinds);
    }

    [Fact]
    public void UnknownEncounterOperationStaysDiagnosticWithoutTrialWarning()
    {
        var manager = new BridgePermissionManager(
            "runtime-migration",
            BridgePermissionMode.MigrationExploration);
        BridgeServerIdentity bridge = Bridge("runtime-migration");
        GameBuildIdentity diagnostic = DiagnosticGame();
        CompatibilityAssessment initial = manager.Apply(
            diagnostic,
            bridge,
            CleanPatchInventory());

        BridgeObservationDraft admitted = manager.AdmitEncounter(
            EncounterDraft(
                diagnostic with { Compatibility = initial },
                "unknown_operation"),
            bridge);

        Assert.Empty(admitted.Game.Compatibility.ActionPermissionScopes);
        Assert.Empty(manager.Snapshot().Grants);
        Assert.DoesNotContain(
            admitted.Warnings,
            warning => warning.StartsWith(
                "encounter_provisional_trial:",
                StringComparison.Ordinal));
    }

    private static ActionPermissionScope Scope(
        string surface,
        string operation,
        string tier) => new(surface, operation, tier);

    private static GameBuildIdentity GameWithScopes(params ActionPermissionScope[] scopes)
    {
        string[] qualified = scopes
            .Where(scope => scope.Tier == "qualified")
            .Select(scope => scope.SurfaceKind)
            .Distinct()
            .ToArray();
        string[] canary = scopes
            .Where(scope => scope.Tier == "canary")
            .Select(scope => scope.SurfaceKind)
            .Distinct()
            .ToArray();
        var compatibility = new CompatibilityAssessment(
            "qualified_scoped",
            new[] { "0.109.0" },
            new[] { "v0.109.0|c12f634d|-1639417500" },
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: false,
            qualified,
            canary,
            Array.Empty<string>(),
            Array.Empty<string>(),
            Array.Empty<string>(),
            Array.Empty<string>(),
            "fixture exact policy")
        {
            ActionPermissionScopes = scopes,
            CompatibilityPolicyId = "fixture-policy",
            CompatibilityPolicyDigest = new string('b', 64),
            AdaptationLevel = "reviewed_exact_environment"
        };
        var modset = new ModsetIdentity(
            "exact_bridge_only",
            "fixture-modset",
            "fixture-scope",
            ExactPermissionEligible: true,
            Array.Empty<LoadedModIdentity>(),
            "fixture");
        return new GameBuildIdentity(
            "v0.109.0",
            "c12f634d",
            "v0.109.0",
            -1639417500,
            compatibility,
            modset);
    }

    private static GameBuildIdentity DiagnosticGame()
    {
        GameBuildIdentity game = GameWithScopes();
        return game with
        {
            Compatibility = game.Compatibility with
            {
                Status = "unreviewed_diagnostic_candidate",
                ActionExecutionAllowed = false,
                ActionExecutionSurfaceKinds = Array.Empty<string>(),
                ActionCanarySurfaceKinds = Array.Empty<string>(),
                ActionPermissionScopes = Array.Empty<ActionPermissionScope>(),
                AdaptationLevel = "diagnostic_candidate"
            }
        };
    }

    private static BridgeObservationDraft EncounterDraft(
        GameBuildIdentity game,
        string operation) => new(
        "fixture-signature",
        "ready",
        new ShopBridgeContext("shop"),
        new ShopRoomSurface("shop_room", "shop-room", true, true),
        new StateCompleteness(
            "complete",
            "source_resolved",
            new[] { "fixture" },
            Array.Empty<string>()),
        game,
        Array.Empty<string>(),
        new[]
        {
            new BridgeActionDraft(
                "fixture-action",
                operation,
                "navigation",
                "Open shop",
                "fixture-source-resolved",
                () => BridgeActionStartResult.Rejected("fixture", "not executed"))
        });

    private static BridgeServerIdentity Bridge(string runtimeEpoch) => new(
        "sts2_mcp_bridge_v2",
        "fixture",
        "0.5.0-dev",
        "upstream",
        "11111111-1111-1111-1111-111111111111",
        runtimeEpoch)
    {
        AssemblyFileSha256 = new string('a', 64)
    };

    private static BridgeRuntimePatchInventoryInfo CleanPatchInventory() =>
        BridgeRuntimePatchInventory.Classify(
            new[]
            {
                new BridgeRuntimePatchDescriptor(
                    "Game.Method()",
                    "prefix",
                    BridgeRuntimePatchInventory.GatewayHarmonyOwner,
                    "Gateway.Patch()")
            });

    private static BridgeActionPermissionBinding Binding(ActionPermissionScope scope) => new(
        scope.SurfaceKind,
        scope.Operation,
        scope.Tier,
        scope.GrantId,
        scope.GrantVersion,
        scope.RuntimeEpoch,
        scope.EnvironmentDigest,
        scope.PatchDigest,
        scope.OperationFingerprint,
        scope.AdmissionBasis);

    private static BridgeCommandResponse Command(
        string requestId,
        string status,
        string outcome,
        string terminalEvent,
        string? errorCode,
        string? completionEvidence = null) => new(
        requestId,
        "state-a",
        "action-a",
        status,
        outcome,
        "state-b",
        new[]
        {
            new BridgeCommandEvent(
                "validated",
                DateTimeOffset.UtcNow,
                "state_and_action_revalidated",
                null,
                null),
            new BridgeCommandEvent(
                terminalEvent,
                DateTimeOffset.UtcNow,
                terminalEvent == "completed" ? completionEvidence : null,
                errorCode,
                null)
        });
}
