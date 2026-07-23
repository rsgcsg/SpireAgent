using System.Text.Json;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.Tests;

public sealed class BridgeContractTests
{
    [Fact]
    public void NonAuthorizingContractManifestMatchesProviderRegistry()
    {
        string[] manifestKinds = BridgeContractManifest.Entries
            .Select(entry => entry.Kind)
            .OrderBy(kind => kind, StringComparer.Ordinal)
            .ToArray();
        string[] providerKinds = BridgeSnapshotBuilder.DeclaredProviderKinds
            .OrderBy(kind => kind, StringComparer.Ordinal)
            .ToArray();

        Assert.Equal(24, manifestKinds.Length);
        Assert.Equal(manifestKinds.Length, manifestKinds.Distinct(StringComparer.Ordinal).Count());
        Assert.Equal(providerKinds, manifestKinds);
        Assert.All(BridgeContractManifest.Entries, entry =>
        {
            Assert.Equal(BridgeV2Contract.ProtocolVersion, entry.ProtocolRevision);
            Assert.False(string.IsNullOrWhiteSpace(entry.Mechanism));
            Assert.False(string.IsNullOrWhiteSpace(entry.SourceBindingId));
            Assert.False(string.IsNullOrWhiteSpace(entry.ReSupport));
            Assert.NotEmpty(entry.VisibleFactGroups);
            Assert.NotEmpty(entry.Operations);
            Assert.NotEmpty(entry.TestReferences);
            Assert.NotEmpty(entry.DocumentationReferences);
        });
    }

    [Fact]
    public void ContractManifestNeverOverridesExplicitPermissionScopes()
    {
        var compatibility = new CompatibilityAssessment(
            "qualified_scoped",
            new[] { "0.109.0" },
            new[] { "v0.109.0|commit|1" },
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: false,
            ActionExecutionSurfaceKinds: Array.Empty<string>(),
            ActionCanarySurfaceKinds: new[] { "event_option" },
            InspectionAllowedKinds: Array.Empty<string>(),
            InspectionCanaryKinds: Array.Empty<string>(),
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: "explicit event-only scope");

        IReadOnlyDictionary<string, SurfaceCapability> capabilities = BridgeContractManifest
            .Capabilities(compatibility)
            .ToDictionary(capability => capability.Kind, StringComparer.Ordinal);

        Assert.Equal("candidate_action_canary", capabilities["event_option"].Support);
        Assert.Empty(capabilities["event_option"].Operations);
        Assert.Equal("not_qualified_for_current_build", capabilities["combat_turn"].Support);
        Assert.Equal("not_qualified_for_current_build", capabilities["treasure_room"].Support);
    }

    [Fact]
    public void ExplicitActionScopesAreTheExactManifestProjectionForTheCurrentBuild()
    {
        CompatibilityAssessment compatibility = BridgeContractManifest.WithExplicitActionScopes(
            BridgeGameIdentity.Assess("v0.109.0", "c12f634d", -840572606));
        IReadOnlyDictionary<string, SurfaceCapability> capabilities = BridgeContractManifest
            .Capabilities(compatibility)
            .ToDictionary(capability => capability.Kind, StringComparer.Ordinal);

        Assert.NotEmpty(compatibility.ActionPermissionScopes);
        Assert.Equal(
            compatibility.ActionPermissionScopes.Count,
            compatibility.ActionPermissionScopes
                .Select(scope => (scope.SurfaceKind, scope.Operation))
                .Distinct()
                .Count());
        Assert.All(compatibility.ActionPermissionScopes, scope =>
        {
            Assert.Contains(scope.Tier, new[] { "qualified", "canary" });
            Assert.True(BridgeSurfacePermission.IsActionPermitted(
                compatibility,
                scope.SurfaceKind,
                scope.Operation));
        });

        foreach (SurfaceCapability capability in capabilities.Values)
        {
            string[] expected = compatibility.ActionPermissionScopes
                .Where(scope => scope.SurfaceKind == capability.Kind)
                .Select(scope => scope.Operation)
                .OrderBy(operation => operation, StringComparer.Ordinal)
                .ToArray();
            Assert.Equal(expected, capability.Operations.OrderBy(operation => operation, StringComparer.Ordinal));
        }
        Assert.Contains(
            compatibility.ActionPermissionScopes,
            scope => scope.SurfaceKind == "deck_enchant_selection" && scope.Tier == "canary");
    }

    [Fact]
    public void GatewayArtifactDigestIsAPathFreeSha256()
    {
        string path = Path.GetTempFileName();
        try
        {
            File.WriteAllText(path, "bridge-contract-fixture");
            string? digest = BridgeAssemblyIdentity.HashFile(path);
            Assert.Matches("^[0-9a-f]{64}$", digest ?? string.Empty);
            Assert.DoesNotContain(path, digest ?? string.Empty, StringComparison.Ordinal);
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public void DeckEnchantManifestRequiresSemanticPostStateWithoutGrantingQualifiedAuthority()
    {
        BridgeContractManifestEntry enchant = Assert.Single(
            BridgeContractManifest.Entries,
            entry => entry.Kind == "deck_enchant_selection");
        CompatibilityAssessment compatibility = BridgeGameIdentity.Assess(
            "v0.109.0",
            "c12f634d",
            -840572606);

        Assert.Contains("exact-card-enchantment-post-state-witness", enchant.SourceBindingId);
        Assert.Contains("deck_enchant_selection", compatibility.ActionCanarySurfaceKinds);
        Assert.DoesNotContain("deck_enchant_selection", compatibility.ActionExecutionSurfaceKinds);
        Assert.Equal(
            "candidate_action_canary",
            BridgeSurfacePermission.SupportLevel(compatibility, "deck_enchant_selection"));
    }

    [Fact]
    public void WoodCarvingsReplacementIsCanaryOnlyAndRequiresExactSemanticWitness()
    {
        BridgeContractManifestEntry replacement = Assert.Single(
            BridgeContractManifest.Entries,
            entry => entry.Kind == "wood_carvings_replacement_selection");
        CompatibilityAssessment compatibility = BridgeGameIdentity.Assess(
            "v0.109.0",
            "c12f634d",
            -840572606);

        Assert.Contains("exact-source-task-binding", replacement.SourceBindingId);
        Assert.Contains("deterministic-replacement-witness", replacement.SourceBindingId);
        Assert.Contains(replacement.Operations, operation => operation.Operation == "confirm_wood_carvings_replacement");
        Assert.Contains("wood_carvings_replacement_selection", compatibility.ActionCanarySurfaceKinds);
        Assert.DoesNotContain("wood_carvings_replacement_selection", compatibility.ActionExecutionSurfaceKinds);
    }

    [Fact]
    public void DeterministicReplacementWitnessRejectsClosureWithoutExactDeckDelta()
    {
        object original = new();
        object unchanged = new();
        object replacement = new();
        object other = new();
        object[] baseline = { original, unchanged };

        Assert.True(DeterministicDeckReplacementWitness.IsSatisfied(
            sourceCompleted: true,
            selectorClosed: true,
            baseline,
            new[] { unchanged, replacement },
            original,
            card => ReferenceEquals(card, replacement)));
        Assert.False(DeterministicDeckReplacementWitness.IsSatisfied(
            sourceCompleted: false,
            selectorClosed: true,
            baseline,
            new[] { unchanged, replacement },
            original,
            card => ReferenceEquals(card, replacement)));
        Assert.False(DeterministicDeckReplacementWitness.IsSatisfied(
            sourceCompleted: true,
            selectorClosed: true,
            baseline,
            new[] { unchanged, other },
            original,
            card => ReferenceEquals(card, replacement)));
        Assert.False(DeterministicDeckReplacementWitness.IsSatisfied(
            sourceCompleted: true,
            selectorClosed: true,
            baseline,
            new[] { original, replacement },
            original,
            card => ReferenceEquals(card, replacement)));
    }

    [Fact]
    public void EventOptionsAllowOnlyExplicitAsyncIntermediateStatesBeforeTheirSemanticWitness()
    {
        BridgeActionStartResult result = EventOptionSurfaceProvider.StartAsyncEventTransition(
            () => false,
            "event_option_replaced_or_required_subsurface_opened");

        Assert.True(result.Accepted);
        Assert.True(result.AllowIntermediateStateChanges);
        Assert.NotNull(result.CompletionProbe);
        Assert.Equal(
            "event_option_replaced_or_required_subsurface_opened",
            result.CompletionEvidence);
    }

    [Fact]
    public void TreasureOperationEvidenceIsNarrowerThanSurfaceCanaryAuthority()
    {
        BridgeContractManifestEntry treasure = Assert.Single(
            BridgeContractManifest.Entries,
            entry => entry.Kind == "treasure_room");
        IReadOnlyDictionary<string, BridgeOperationManifest> operations = treasure.Operations
            .ToDictionary(operation => operation.Operation, StringComparer.Ordinal);

        Assert.Equal(BridgeOperationEvidenceStatus.SourceAudited, operations["open_treasure_chest"].EvidenceStatus);
        Assert.Equal(BridgeOperationEvidenceStatus.OrganicCanaryExercised, operations["choose_treasure_relic"].EvidenceStatus);
        Assert.Equal(BridgeOperationEvidenceStatus.SourceAudited, operations["skip_treasure_relic"].EvidenceStatus);
        Assert.Equal(BridgeOperationEvidenceStatus.OrganicCanaryExercised, operations["proceed_treasure_room"].EvidenceStatus);
        Assert.DoesNotContain(treasure.Operations, operation =>
            operation.EvidenceStatus == BridgeOperationEvidenceStatus.OrganicQualified);
    }

    [Fact]
    public void MenuOperationEvidenceDoesNotOverclaimUnexercisedNavigation()
    {
        BridgeContractManifestEntry root = Assert.Single(
            BridgeContractManifest.Entries,
            entry => entry.Kind == "main_menu");
        BridgeContractManifestEntry submenu = Assert.Single(
            BridgeContractManifest.Entries,
            entry => entry.Kind == "singleplayer_menu");
        IReadOnlyDictionary<string, BridgeOperationManifest> operations = root.Operations
            .ToDictionary(operation => operation.Operation, StringComparer.Ordinal);

        Assert.Equal(BridgeOperationEvidenceStatus.OrganicCanaryExercised, operations["continue_run"].EvidenceStatus);
        Assert.Equal(BridgeOperationEvidenceStatus.SourceAudited, operations["open_singleplayer"].EvidenceStatus);
        Assert.All(submenu.Operations, operation =>
            Assert.Equal(BridgeOperationEvidenceStatus.SurfaceLevelOnly, operation.EvidenceStatus));
    }

    [Fact]
    public void InspectionInventoryIsReadOnlyAndNonAuthorizing()
    {
        Assert.Equal(
            new[]
            {
                BridgeInspectionBuilder.RunDeckKind,
                BridgeInspectionBuilder.CombatPilesKind,
                BridgeInspectionBuilder.ShopCatalogKind
            },
            BridgeContractManifest.ImplementedInspectionKinds);
        Assert.All(BridgeContractManifest.InspectionEntries, entry =>
        {
            Assert.Equal(BridgeV2Contract.ProtocolVersion, entry.ProtocolRevision);
            Assert.False(string.IsNullOrWhiteSpace(entry.SourceBindingId));
            Assert.False(string.IsNullOrWhiteSpace(entry.ReSupport));
            Assert.NotEmpty(entry.VisibleFactGroups);
            Assert.NotEmpty(entry.TestReferences);
            Assert.NotEmpty(entry.DocumentationReferences);
        });

        CompatibilityAssessment alternateBuild = BridgeGameIdentity.Assess(
            "v0.109.0",
            "c12f634d",
            1833084275);

        Assert.False(alternateBuild.InspectionAllowed);
        Assert.Empty(BridgeSurfacePermission.PermittedInspectionKinds(
            alternateBuild,
            BridgeContractManifest.ImplementedInspectionKinds));
        Assert.Equal(
            "disabled_for_current_build",
            BridgeSurfacePermission.InspectionSupportLevel(
                alternateBuild,
                BridgeContractManifest.ImplementedInspectionKinds));
    }

    [Fact]
    public void EmptyCompatibilityScopeNeverMeansAllSurfaces()
    {
        var compatibility = new CompatibilityAssessment(
            "supported_exact",
            new[] { "0.108.0" },
            new[] { "v0.108.0|commit|1" },
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: true,
            ActionExecutionSurfaceKinds: Array.Empty<string>(),
            ActionCanarySurfaceKinds: Array.Empty<string>(),
            InspectionAllowedKinds: Array.Empty<string>(),
            InspectionCanaryKinds: Array.Empty<string>(),
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: "historical exact identity with no current explicit surface permission");

        Assert.False(BridgeSurfacePermission.IsActionPermitted(compatibility, "combat_turn"));
        Assert.False(BridgeSurfacePermission.IsInspectionPermitted(compatibility, "run_deck"));
        Assert.Empty(BridgeSurfacePermission.PermittedInspectionKinds(
            compatibility,
            new[] { "run_deck", "combat_piles" }));
        Assert.Equal(
            "disabled_for_current_build",
            BridgeSurfacePermission.InspectionSupportLevel(
                compatibility,
                new[] { "run_deck", "combat_piles" }));
        Assert.Equal(
            "not_qualified_for_current_build",
            BridgeSurfacePermission.SupportLevel(compatibility, "combat_turn"));
    }

    [Fact]
    public void ExplicitQualifiedAndCanaryScopesRemainDistinct()
    {
        var compatibility = BridgeContractManifest.WithExplicitActionScopes(new CompatibilityAssessment(
            "qualified_scoped",
            new[] { "0.109.0" },
            new[] { "v0.109.0|commit|1" },
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: true,
            ActionExecutionSurfaceKinds: new[] { "combat_turn" },
            ActionCanarySurfaceKinds: new[] { "event_option" },
            InspectionAllowedKinds: new[] { "run_deck" },
            InspectionCanaryKinds: new[] { "combat_piles" },
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: "explicit scopes"));

        Assert.True(BridgeSurfacePermission.IsActionPermitted(compatibility, "combat_turn"));
        Assert.True(BridgeSurfacePermission.IsActionPermitted(compatibility, "event_option"));
        Assert.False(BridgeSurfacePermission.IsActionPermitted(compatibility, "shop_room"));
        Assert.True(BridgeSurfacePermission.IsInspectionPermitted(compatibility, "run_deck"));
        Assert.True(BridgeSurfacePermission.IsInspectionPermitted(compatibility, "combat_piles"));
        Assert.False(BridgeSurfacePermission.IsInspectionPermitted(compatibility, "future_inspection"));
        Assert.Equal(
            new[] { "run_deck", "combat_piles" },
            BridgeSurfacePermission.PermittedInspectionKinds(
                compatibility,
                new[] { "run_deck", "combat_piles", "future_inspection" }));
        Assert.Equal(
            "mixed_scoped_read_only",
            BridgeSurfacePermission.InspectionSupportLevel(
                compatibility,
                new[] { "run_deck", "combat_piles" }));
        Assert.Equal("qualified_exact_build", BridgeSurfacePermission.SupportLevel(compatibility, "combat_turn"));
        Assert.Equal("candidate_action_canary", BridgeSurfacePermission.SupportLevel(compatibility, "event_option"));
        Assert.Equal("not_qualified_for_current_build", BridgeSurfacePermission.SupportLevel(compatibility, "shop_room"));
    }

    [Fact]
    public void CanaryOnlyScopePermitsOnlyExplicitSurfaceAndNoInspection()
    {
        var compatibility = BridgeContractManifest.WithExplicitActionScopes(new CompatibilityAssessment(
            "qualified_scoped",
            new[] { "0.109.0" },
            new[] { "v0.109.0|commit|1" },
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: false,
            ActionExecutionSurfaceKinds: Array.Empty<string>(),
            ActionCanarySurfaceKinds: new[] { "event_option" },
            InspectionAllowedKinds: Array.Empty<string>(),
            InspectionCanaryKinds: Array.Empty<string>(),
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: "current-build event option canary only"));

        Assert.True(BridgeSurfacePermission.IsActionPermitted(compatibility, "event_option"));
        Assert.False(BridgeSurfacePermission.IsActionPermitted(compatibility, "combat_turn"));
        Assert.False(BridgeSurfacePermission.IsInspectionPermitted(compatibility, "run_deck"));
        Assert.Equal("candidate_action_canary", BridgeSurfacePermission.SupportLevel(compatibility, "event_option"));
        Assert.Equal("not_qualified_for_current_build", BridgeSurfacePermission.SupportLevel(compatibility, "combat_turn"));
        Assert.Equal(
            "disabled_for_current_build",
            BridgeSurfacePermission.InspectionSupportLevel(compatibility, new[] { "run_deck", "combat_piles" }));
    }

    [Fact]
    public void CurrentGameIdentityGrantsOnlyExplicitAuditedCanaries()
    {
        CompatibilityAssessment compatibility = BridgeGameIdentity.Assess(
            "v0.109.0",
            "c12f634d",
            1833084275);

        Assert.Equal("qualified_scoped", compatibility.Status);
        Assert.True(compatibility.ActionExecutionAllowed);
        Assert.True(compatibility.StateObservationAllowed);
        Assert.False(compatibility.InspectionAllowed);
        Assert.Empty(compatibility.ActionExecutionSurfaceKinds);
        Assert.Equal(
            new[] { "event_option", "event_card_acquisition", "map_navigation" },
            compatibility.ActionCanarySurfaceKinds);
        Assert.Empty(compatibility.InspectionAllowedKinds);
        Assert.Empty(compatibility.InspectionCanaryKinds);
        Assert.Contains(
            "v0.109.0|c12f634d|1833084275",
            compatibility.TestedBuildFingerprints);
    }

    [Fact]
    public void SourceQualifiedIdentityKeepsCombatPileInspectionReadOnlyAndHeadbuttActionCanaryScoped()
    {
        CompatibilityAssessment compatibility = BridgeContractManifest.WithExplicitActionScopes(
            BridgeGameIdentity.Assess(
                "v0.109.0",
                "c12f634d",
                -840572606));

        Assert.Equal("qualified_scoped", compatibility.Status);
        Assert.True(compatibility.InspectionAllowed);
        Assert.Equal(new[] { "run_deck" }, compatibility.InspectionAllowedKinds);
        Assert.Equal(new[] { "combat_piles", "shop_catalog" }, compatibility.InspectionCanaryKinds);
        Assert.Equal(
            new[] { "run_deck", "combat_piles", "shop_catalog" },
            BridgeSurfacePermission.PermittedInspectionKinds(
                compatibility,
                BridgeContractManifest.ImplementedInspectionKinds));
        Assert.Equal(
            "mixed_scoped_read_only",
            BridgeSurfacePermission.InspectionSupportLevel(
                compatibility,
                BridgeContractManifest.ImplementedInspectionKinds));
        Assert.True(BridgeSurfacePermission.IsInspectionPermitted(compatibility, "combat_piles"));
        Assert.True(BridgeSurfacePermission.IsActionPermitted(compatibility, "combat_pile_card_selection"));
        Assert.DoesNotContain("combat_pile_card_selection", compatibility.ActionExecutionSurfaceKinds);
        Assert.Contains("combat_pile_card_selection", compatibility.ActionCanarySurfaceKinds);
    }

    [Fact]
    public void ExactBridgeOnlyModsetPreservesExplicitGamePermissions()
    {
        LoadedModIdentity bridge = ModIdentity(
            BridgeModsetIdentity.BridgeModId,
            "0.5.0-dev",
            "Loaded",
            "bridge-mvid");
        ModsetIdentity modset = BridgeModsetIdentity.Evaluate(
            "Initialized",
            new[] { bridge },
            "bridge-mvid",
            "0.5.0-dev");
        CompatibilityAssessment gameCompatibility = BridgeGameIdentity.Assess(
            "v0.109.0",
            "c12f634d",
            1833084275);

        CompatibilityAssessment result = BridgeGameIdentity.ApplyModset(gameCompatibility, modset);

        Assert.True(modset.ExactPermissionEligible);
        Assert.Equal("exact_bridge_only", modset.Status);
        Assert.Same(gameCompatibility, result);
    }

    [Fact]
    public void AdditionalLoadedModFailsClosedWithoutHidingItsIdentity()
    {
        LoadedModIdentity bridge = ModIdentity(
            BridgeModsetIdentity.BridgeModId,
            "0.5.0-dev",
            "Loaded",
            "bridge-mvid");
        LoadedModIdentity gameplayMod = ModIdentity(
            "EXTRA_GAMEPLAY_MOD",
            "1.0.0",
            "Loaded",
            "extra-mvid",
            affectsGameplay: true);

        ModsetIdentity modset = BridgeModsetIdentity.Evaluate(
            "Initialized",
            new[] { bridge, gameplayMod },
            "bridge-mvid",
            "0.5.0-dev");
        CompatibilityAssessment result = BridgeGameIdentity.ApplyModset(
            BridgeGameIdentity.Assess("v0.109.0", "c12f634d", 1833084275),
            modset);

        Assert.False(modset.ExactPermissionEligible);
        Assert.Equal("additional_loaded_mods", modset.Status);
        Assert.Equal(2, modset.Mods.Count);
        Assert.Equal("unqualified_modset", result.Status);
        Assert.True(result.StateObservationAllowed);
        Assert.False(result.ActionExecutionAllowed);
        Assert.False(result.InspectionAllowed);
        Assert.Empty(result.ActionExecutionSurfaceKinds);
        Assert.Empty(result.ActionCanarySurfaceKinds);
        Assert.Empty(result.InspectionAllowedKinds);
        Assert.Empty(result.InspectionCanaryKinds);
    }

    [Fact]
    public void FailedOrRuntimeAddedModStateFailsClosed()
    {
        LoadedModIdentity bridge = ModIdentity(
            BridgeModsetIdentity.BridgeModId,
            "0.5.0-dev",
            "Loaded",
            "bridge-mvid");

        foreach (string unsafeState in new[] { "Failed", "AddedAtRuntime" })
        {
            ModsetIdentity modset = BridgeModsetIdentity.Evaluate(
                "Initialized",
                new[]
                {
                    bridge,
                    ModIdentity("UNSAFE_MOD", "1.0.0", unsafeState, "unsafe-mvid")
                },
                "bridge-mvid",
                "0.5.0-dev");

            Assert.False(modset.ExactPermissionEligible);
            Assert.Equal("hazardous_mod_state_detected", modset.Status);
        }
    }

    [Fact]
    public void DisabledExtraModIsRecordedButDoesNotInventRuntimeEffects()
    {
        ModsetIdentity modset = BridgeModsetIdentity.Evaluate(
            "Initialized",
            new[]
            {
                ModIdentity(BridgeModsetIdentity.BridgeModId, "0.5.0-dev", "Loaded", "bridge-mvid"),
                ModIdentity("DISABLED_MOD", "1.0.0", "Disabled", "disabled-mvid", affectsGameplay: true)
            },
            "bridge-mvid",
            "0.5.0-dev");

        Assert.True(modset.ExactPermissionEligible);
        Assert.Equal("exact_bridge_only", modset.Status);
        Assert.Equal(2, modset.Mods.Count);
    }

    [Fact]
    public void DuplicateLoadedBridgeIdentityFailsClosedInsteadOfThrowing()
    {
        ModsetIdentity modset = BridgeModsetIdentity.Evaluate(
            "Initialized",
            new[]
            {
                ModIdentity(BridgeModsetIdentity.BridgeModId, "0.5.0-dev", "Loaded", "bridge-mvid"),
                ModIdentity(BridgeModsetIdentity.BridgeModId, "0.5.0-dev", "Loaded", "bridge-mvid")
            },
            "bridge-mvid",
            "0.5.0-dev");

        Assert.False(modset.ExactPermissionEligible);
        Assert.Equal("additional_loaded_mods", modset.Status);
    }

    [Fact]
    public void CommandContractUsesOpaqueSnakeCaseIdentifiers()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        string json = JsonSerializer.Serialize(
            new BridgeCommandRequest("request-a", "state-a", "action-a"),
            options);

        Assert.Contains("\"request_id\"", json);
        Assert.Contains("\"expected_state_id\"", json);
        Assert.Contains("\"action_id\"", json);
        Assert.DoesNotContain("index", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("target", json, StringComparison.OrdinalIgnoreCase);
    }

    private static LoadedModIdentity ModIdentity(
        string id,
        string version,
        string loadState,
        string moduleVersionId,
        bool affectsGameplay = false)
    {
        return new LoadedModIdentity(
            id,
            version,
            "ModsDirectory",
            loadState,
            affectsGameplay,
            null,
            new[] { new LoadedModAssemblyIdentity(id, version, moduleVersionId) });
    }

    [Fact]
    public void LegalActionBindingsReferenceVisibleEntitiesWithoutBecomingCommandArguments()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        var action = new LegalAction(
            "action-a",
            "state-a",
            "play_card",
            "combat",
            "Play Strike on Cultist",
            "game_ui",
            "validator",
            new[]
            {
                new ActionEntityBinding("card", "card-a"),
                new ActionEntityBinding("target", "enemy-a")
            });

        string json = JsonSerializer.Serialize(action, options);
        string commandJson = JsonSerializer.Serialize(
            new BridgeCommandRequest("request-a", "state-a", "action-a"),
            options);

        Assert.Contains("\"entity_bindings\"", json);
        Assert.Contains("\"role\":\"card\"", json);
        Assert.Contains("\"entity_id\":\"enemy-a\"", json);
        Assert.DoesNotContain("card-a", commandJson);
        Assert.DoesNotContain("enemy-a", commandJson);
    }

    [Fact]
    public void EntityIdsAreStablePerObjectAndDistinctAcrossObjects()
    {
        var registry = new BridgeEntityRegistry();
        var first = new object();
        var second = new object();

        string firstId = registry.GetId(first, "card");

        Assert.Equal(firstId, registry.GetId(first, "card"));
        Assert.NotEqual(firstId, registry.GetId(second, "card"));
    }

    [Fact]
    public void HashIsDeterministicAndSensitiveToSemanticContent()
    {
        Assert.Equal(BridgeHash.Object(new { value = 1 }), BridgeHash.Object(new { value = 1 }));
        Assert.NotEqual(BridgeHash.Object(new { value = 1 }), BridgeHash.Object(new { value = 2 }));
    }

    [Fact]
    public void SurfaceKindIsDerivedFromTheTypedSurface()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };
        IBridgeSurface surface = new UnsupportedSurface("unsupported", "test", "not implemented");
        var envelope = new BridgeStateEnvelope(
            BridgeV2Contract.ProtocolVersion,
            "state-a",
            1,
            DateTimeOffset.UnixEpoch,
            "unsupported",
            null,
            new UnknownBridgeContext("unknown", "test", "not implemented"),
            surface,
            new AuthorityHandoff("none_fail_closed", null, "test"),
            Array.Empty<LegalAction>(),
            new StateCompleteness("not_implemented", "empty_fail_closed", Array.Empty<string>(), Array.Empty<string>()),
            new BridgeServerIdentity("bridge", "Bridge", "test", "commit", "mvid", "runtime"),
            new GameBuildIdentity(null, null, null, null, new CompatibilityAssessment(
                "unknown",
                Array.Empty<string>(),
                Array.Empty<string>(),
                ActionExecutionAllowed: false,
                StateObservationAllowed: false,
                InspectionAllowed: false,
                ActionExecutionSurfaceKinds: Array.Empty<string>(),
                ActionCanarySurfaceKinds: Array.Empty<string>(),
                InspectionAllowedKinds: Array.Empty<string>(),
                InspectionCanaryKinds: Array.Empty<string>(),
                ObservationOnlySurfaceKinds: Array.Empty<string>(),
                ObservationCandidateBuildFingerprints: Array.Empty<string>(),
                Detail: "unknown")),
            new ObservationPolicyInfo("policy", "visible", false, "omit"),
            new BridgeVisibilityState(
                "unknown.unsupported.v1",
                "partial",
                "partial_catalog",
                Array.Empty<string>(),
                Array.Empty<string>(),
                Array.Empty<string>(),
                new[] { "not_implemented" },
                "fail_closed"),
            Array.Empty<BridgeInspectionCatalogEntry>(),
            new BridgeContractInstanceShadow(
                "unresolved",
                "contract-instance-test",
                "unsupported",
                null,
                null,
                Array.Empty<BridgeContractOperationShadow>(),
                "disabled",
                "exact_environment_surface_kind_gate",
                Authorizing: false,
                new[] { "shadow_inventory_only" }),
            Array.Empty<BridgeDiagnostic>(),
            Array.Empty<string>());

        string json = JsonSerializer.Serialize(envelope, options);

        Assert.Equal(surface.Kind, envelope.SurfaceKind);
        Assert.Contains("\"shared_state\":null", json);
        Assert.Contains("\"surface_kind\":\"unsupported\"", json);
        Assert.Contains("\"context\":{\"kind\":\"unknown\"", json);
        Assert.Contains("\"surface\":{\"kind\":\"unsupported\"", json);
        Assert.Contains("\"source_type\":\"test\"", json);
        Assert.Contains("\"reason\":\"not implemented\"", json);
    }

    [Fact]
    public void VisibilityCatalogIsReadOnlyStateScopedAndDoesNotGrantAuthority()
    {
        var compatibility = new CompatibilityAssessment(
            "qualified_scoped",
            new[] { "0.109.0" },
            new[] { "build" },
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: true,
            ActionExecutionSurfaceKinds: Array.Empty<string>(),
            ActionCanarySurfaceKinds: Array.Empty<string>(),
            InspectionAllowedKinds: new[] { "run_deck" },
            InspectionCanaryKinds: new[] { "combat_piles" },
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: "test");
        var draft = new BridgeObservationDraft(
            "sig",
            "ready",
            new UnknownBridgeContext("combat", "test", "test"),
            new NoActionSurface("no_action", "settling", "test"),
            new StateCompleteness("complete", "empty", Array.Empty<string>(), Array.Empty<string>()),
            new GameBuildIdentity("v0.109.0", "commit", "branch", 1, compatibility),
            Array.Empty<string>(),
            Array.Empty<BridgeActionDraft>());

        BridgeVisibilityProjection projection = BridgeVisibilityCatalog.Build(
            draft,
            activeRunSharedStateAvailable: true,
            shopCatalogSourceAvailable: false);

        Assert.Equal(new[] { "run_deck", "combat_piles" }, projection.Visibility.AvailableInspections);
        Assert.Equal("partial_catalog", projection.Visibility.PlayerVisibleClosureStatus);
        Assert.All(projection.InspectionCatalog, entry =>
        {
            Assert.True(entry.StateBound);
            Assert.False(entry.CreatesActionAuthority);
        });
        Assert.Equal("qualified", projection.InspectionCatalog.Single(entry => entry.Kind == "run_deck").Availability);
        Assert.Equal("canary", projection.InspectionCatalog.Single(entry => entry.Kind == "combat_piles").Availability);
        Assert.Contains("draw_pile_true_order", projection.Visibility.HiddenByPolicy);
        Assert.Empty(projection.Visibility.LinkedDetailKinds);
        Assert.Contains("linked_entity_detail_catalog_not_implemented", projection.Visibility.Missing);
    }

    [Fact]
    public void ShopVisibilityCatalogAdvertisesReadOnlyCatalogWithoutCreatingAuthority()
    {
        var compatibility = new CompatibilityAssessment(
            "qualified_scoped",
            new[] { "0.109.0" },
            new[] { "build" },
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: true,
            ActionExecutionSurfaceKinds: Array.Empty<string>(),
            ActionCanarySurfaceKinds: new[] { "shop_room" },
            InspectionAllowedKinds: new[] { "run_deck" },
            InspectionCanaryKinds: new[] { "shop_catalog" },
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: "test");
        var draft = new BridgeObservationDraft(
            "sig",
            "ready",
            new ShopBridgeContext("shop"),
            new ShopRoomSurface("shop_room", "room-a", CanOpenInventory: true, CanProceed: true),
            new StateCompleteness("complete", "derived", Array.Empty<string>(), Array.Empty<string>()),
            new GameBuildIdentity("v0.109.0", "commit", "branch", 1, compatibility),
            Array.Empty<string>(),
            Array.Empty<BridgeActionDraft>());

        BridgeVisibilityProjection projection = BridgeVisibilityCatalog.Build(
            draft,
            activeRunSharedStateAvailable: true,
            shopCatalogSourceAvailable: true);

        Assert.Equal(new[] { "run_deck", "shop_catalog" }, projection.Visibility.AvailableInspections);
        BridgeInspectionCatalogEntry catalog = projection.InspectionCatalog.Single(entry => entry.Kind == "shop_catalog");
        Assert.Equal("current_shop", catalog.Scope);
        Assert.Equal("canary", catalog.Availability);
        Assert.Equal("fixed_ui_slots", catalog.OrderingSemantics);
        Assert.False(catalog.CreatesActionAuthority);
    }

    [Fact]
    public void ShopVisibilityCatalogDoesNotAdvertiseWithoutExactMerchantBinding()
    {
        var compatibility = new CompatibilityAssessment(
            "qualified_scoped",
            new[] { "0.109.0" },
            new[] { "build" },
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: true,
            ActionExecutionSurfaceKinds: Array.Empty<string>(),
            ActionCanarySurfaceKinds: new[] { "shop_room" },
            InspectionAllowedKinds: new[] { "run_deck" },
            InspectionCanaryKinds: new[] { "shop_catalog" },
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: "test");
        var draft = new BridgeObservationDraft(
            "sig",
            "ready",
            new ShopBridgeContext("shop"),
            new ShopRoomSurface("shop_room", "room-a", CanOpenInventory: true, CanProceed: true),
            new StateCompleteness("complete", "derived", Array.Empty<string>(), Array.Empty<string>()),
            new GameBuildIdentity("v0.109.0", "commit", "branch", 1, compatibility),
            Array.Empty<string>(),
            Array.Empty<BridgeActionDraft>());

        BridgeVisibilityProjection projection = BridgeVisibilityCatalog.Build(
            draft,
            activeRunSharedStateAvailable: true,
            shopCatalogSourceAvailable: false);

        Assert.Equal(new[] { "run_deck" }, projection.Visibility.AvailableInspections);
        Assert.DoesNotContain(projection.InspectionCatalog, entry => entry.Kind == "shop_catalog");
    }

    [Fact]
    public void ContractInstanceShadowReportsButNeverGrantsAuthority()
    {
        var compatibility = BridgeContractManifest.WithExplicitActionScopes(new CompatibilityAssessment(
            "qualified_scoped",
            new[] { "0.109.0" },
            new[] { "build" },
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: false,
            ActionExecutionSurfaceKinds: new[] { "rest_site" },
            ActionCanarySurfaceKinds: Array.Empty<string>(),
            InspectionAllowedKinds: Array.Empty<string>(),
            InspectionCanaryKinds: Array.Empty<string>(),
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: "test"));
        var draft = new BridgeObservationDraft(
            "rest-sig",
            "ready",
            new UnknownBridgeContext("rest", "test", "test"),
            new RestSiteSurface("rest_site", "rest-screen", Array.Empty<VisibleRestOption>(), CanProceed: true),
            new StateCompleteness("complete", "derived", Array.Empty<string>(), Array.Empty<string>()),
            new GameBuildIdentity("v0.109.0", "commit", "branch", 1, compatibility),
            Array.Empty<string>(),
            new[]
            {
                new BridgeActionDraft(
                    "proceed",
                    "proceed_rest_site",
                    "navigation",
                    "Proceed",
                    "test",
                    () => BridgeActionStartResult.Started())
            });

        BridgeContractInstanceShadow shadow = BridgeContractInstanceShadowBuilder.Build(draft);

        Assert.Equal("resolved_manifest_contract", shadow.Status);
        Assert.Equal("qualified", shadow.CurrentAuthorityTier);
        Assert.Equal("exact_environment_surface_operation_gate", shadow.CurrentAuthorityBasis);
        Assert.False(shadow.Authorizing);
        Assert.Contains(shadow.Operations, operation =>
            operation.Operation == "proceed_rest_site" && operation.Published);
        Assert.Contains("authority_remains_explicit_operation_scoped", shadow.Limitations);
    }

    [Fact]
    public void BindingFailureFactoryAlwaysRemovesActionAuthority()
    {
        var game = new GameBuildIdentity(null, null, null, null, new CompatibilityAssessment(
            "qualified_scoped",
            Array.Empty<string>(),
            Array.Empty<string>(),
            ActionExecutionAllowed: true,
            StateObservationAllowed: true,
            InspectionAllowed: false,
            ActionExecutionSurfaceKinds: new[] { "combat_turn" },
            ActionCanarySurfaceKinds: Array.Empty<string>(),
            InspectionAllowedKinds: Array.Empty<string>(),
            InspectionCanaryKinds: Array.Empty<string>(),
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: "test"));
        BridgeObservationDraft draft = BridgeFailClosedObservation.BindingUnavailable(
            game,
            new UnknownBridgeContext("unknown", "test", "test"),
            "TestScreen",
            "binding missing",
            new[] { "exact binding" },
            new[] { "legal_actions" },
            "test_warning",
            "bridge.surface.test.binding_unavailable",
            "Test semantics are not exact.");

        UnsupportedSurface surface = Assert.IsType<UnsupportedSurface>(draft.Surface);
        Assert.Equal("unsupported", surface.Kind);
        Assert.Equal("degraded", draft.Readiness);
        Assert.Empty(draft.Actions);
        Assert.Equal("none_fail_closed", draft.AuthorityHandoff.Status);
        Assert.Null(draft.AuthorityHandoff.SurfaceKind);
        Assert.Equal("actions_suppressed", Assert.Single(draft.Diagnostics).Effect);
    }

    [Fact]
    public void DeckUpgradeContractKeepsVisiblePreviewSeparateFromCurrentDeckCard()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        var current = new VisibleCard(
            "deck-card-a", "STRIKE", "Strike", "Attack", "1", null,
            "Deal 6 damage.", "Basic", false, true, null);
        var preview = new VisibleCard(
            "upgrade-preview-a", "STRIKE", "Strike+", "Attack", "1", null,
            "Deal 9 damage.", "Basic", true, false, null);
        var surface = new DeckUpgradeSelectionSurface(
            "deck_upgrade_selection",
            "preview",
            "screen-a",
            "Choose a card to Upgrade.",
            1,
            1,
            1,
            new[] { current.EntityId },
            true,
            new[] { current },
            new[] { preview });

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"deck_upgrade_selection\"", json);
        Assert.Contains("\"selected_card_entity_ids\":[\"deck-card-a\"]", json);
        Assert.Contains("\"preview_cards\":[{\"entity_id\":\"upgrade-preview-a\"", json);
        Assert.Contains("\"is_upgraded\":true", json);
        Assert.DoesNotContain("index", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void DeckTransformContractDoesNotPresentRandomPreviewAsKnownOutcome()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        var selected = new VisibleCard(
            "deck-card-a", "STRIKE", "Strike", "Attack", "1", null,
            "Deal 6 damage.", "Basic", false, true, null);
        var surface = new DeckTransformSelectionSurface(
            "deck_transform_selection",
            "preview",
            "screen-a",
            "Choose a card to Transform.",
            1,
            1,
            1,
            new[] { selected.EntityId },
            false,
            false,
            false,
            "random_uncommitted_cycle",
            false,
            new[] { selected });

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"deck_transform_selection\"", json);
        Assert.Contains("\"preview_kind\":\"random_uncommitted_cycle\"", json);
        Assert.Contains("\"replacement_known\":false", json);
        Assert.DoesNotContain("replacement_card", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("rng", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void TreasureContractKeepsLifecycleStageAndVisibleRelicSemanticsExplicit()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        var relic = new VisibleTreasureRelic(
            "treasure-relic-a",
            "BAG_OF_MARBLES",
            "Bag of Marbles",
            "Apply 1 Vulnerable to all enemies at combat start.",
            "Common",
            new[] { new VisibleKeyword("Vulnerable", "Receives more attack damage.") },
            Array.Empty<VisibleCard>());
        var surface = new TreasureRoomSurface(
            "treasure_room",
            "relic_choice",
            "treasure-room-a",
            ChestOpened: true,
            new[] { relic },
            CanSkip: true,
            CanProceed: false);

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"treasure_room\"", json);
        Assert.Contains("\"stage\":\"relic_choice\"", json);
        Assert.Contains("\"rarity\":\"Common\"", json);
        Assert.Contains("\"keywords\":[{\"name\":\"Vulnerable\"", json);
        Assert.DoesNotContain("index", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("future", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void GameOverContractKeepsIntroAndSummaryAuthoritySeparate()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };
        var context = new GameOverBridgeContext(
            "game_over", "loss", "standard", Score: 321, FloorReached: 12, Ascension: 0);
        var surface = new GameOverSurface(
            "game_over", "summary", "game-over-screen-a", "main_menu",
            CanAdvanceSummary: false, CanReturn: true);

        string contextJson = JsonSerializer.Serialize(context, options);
        string surfaceJson = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"result\":\"loss\"", contextJson);
        Assert.Contains("\"floor_reached\":12", contextJson);
        Assert.Contains("\"stage\":\"summary\"", surfaceJson);
        Assert.Contains("\"return_destination\":\"main_menu\"", surfaceJson);
        Assert.Contains("\"can_advance_summary\":false", surfaceJson);
        Assert.Contains("\"can_return\":true", surfaceJson);
        Assert.DoesNotContain("restart", surfaceJson, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void InspectionContractIsReadOnlyAndLimitedToFixedKinds()
    {
        var contract = new InspectionContractCapability(
            "implemented_read_only",
            StateBound: true,
            ArbitraryQueriesAllowed: false,
            EntersCommandLedger: false,
            new[] { "on_screen", "normal_inspection", "count_only" },
            new[] { "unordered_multiset", "player_sorted" },
            new[] { "run_deck", "combat_piles" });

        Assert.True(contract.StateBound);
        Assert.False(contract.ArbitraryQueriesAllowed);
        Assert.False(contract.EntersCommandLedger);
        Assert.Equal(new[] { "run_deck", "combat_piles" }, contract.ImplementedKinds);
        Assert.DoesNotContain("hidden", contract.VisibilityClasses);
    }

    [Fact]
    public void InspectionResponseCarriesVisibleCardEvidenceWithoutCommandAuthority()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        var card = new VisibleCard(
            "card-a",
            "STRIKE",
            "Strike",
            "Attack",
            "1",
            null,
            "Deal damage.",
            "Basic",
            false,
            false,
            new VisibleEnchantment("SLITHER", "Slither", "Randomize cost when drawn.", 1, "visible_ui"));
        var response = new BridgeInspectionResponse(
            BridgeV2Contract.ProtocolVersion,
            "inspection-a",
            "state-a",
            "state-a",
            DateTimeOffset.UnixEpoch,
            "run_deck",
            "normal_inspection",
            "unordered_multiset",
            new RunDeckInspectionContent("run_deck", 1, new[] { card }),
            new InspectionCompleteness(
                "complete_for_player_run_deck_contents_without_semantic_order",
                new[] { "NDeckViewScreen" },
                Array.Empty<string>()),
            new BridgeServerIdentity("bridge", "Bridge", "test", "commit", "mvid", "runtime"),
            new GameBuildIdentity(
                "v0.108.0",
                "commit",
                "branch",
                1,
                new CompatibilityAssessment(
                    "supported_exact",
                    new[] { "v0.108.0" },
                    new[] { "fingerprint" },
                    ActionExecutionAllowed: true,
                    StateObservationAllowed: true,
                    InspectionAllowed: true,
                    ActionExecutionSurfaceKinds: Array.Empty<string>(),
                    ActionCanarySurfaceKinds: Array.Empty<string>(),
                    InspectionAllowedKinds: Array.Empty<string>(),
                    InspectionCanaryKinds: Array.Empty<string>(),
                    ObservationOnlySurfaceKinds: Array.Empty<string>(),
                    ObservationCandidateBuildFingerprints: Array.Empty<string>(),
                    Detail: "exact")),
            new ObservationPolicyInfo("player_visible_ui_v1", "visible", false, "omit"),
            Array.Empty<BridgeDiagnostic>());

        string json = JsonSerializer.Serialize(response, options);

        Assert.Contains("\"kind\":\"run_deck\"", json);
        Assert.Contains("\"existing_enchantment\"", json);
        Assert.Contains("\"definition_id\":\"SLITHER\"", json);
        Assert.Contains("\"ordering_semantics\":\"unordered_multiset\"", json);
        Assert.DoesNotContain("action_id", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("request_id", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ShopCatalogInspectionContentIsReadOnlyAndKeepsUiSlotOrderExplicit()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };
        var content = new ShopCatalogInspectionContent(
            "shop_catalog",
            "inventory_closed_open_to_inspect",
            Array.Empty<VisibleShopCardOffer>(),
            Array.Empty<VisibleShopRelicOffer>(),
            Array.Empty<VisibleShopPotionOffer>(),
            null);

        string json = JsonSerializer.Serialize<IBridgeInspectionContent>(content, options);

        Assert.Contains("\"kind\":\"shop_catalog\"", json);
        Assert.Contains("\"access_state\":\"inventory_closed_open_to_inspect\"", json);
        Assert.DoesNotContain("action_id", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("request_id", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void BridgeIdentityDistinguishesLoadedModuleFromRuntimeInstance()
    {
        var identity = new BridgeServerIdentity(
            "bridge",
            "Bridge",
            "test",
            "commit",
            "7d5e15dc-7ce1-49ba-b91f-fd9010904f22",
            "runtime-a");

        Assert.NotEmpty(identity.ModuleVersionId);
        Assert.NotEmpty(identity.RuntimeInstanceId);
        Assert.NotEqual(identity.ModuleVersionId, identity.RuntimeInstanceId);
    }

    [Fact]
    public void StructuredDiagnosticSeparatesSeverityFromOperationalEffect()
    {
        var diagnostic = new BridgeDiagnostic(
            "bridge.visibility.deferred_inspection",
            "warning",
            "visibility",
            "field_omitted",
            "unknown",
            Path: "context.player.draw_pile",
            VisibilityClass: "normal_inspection",
            RequiredForAction: false,
            SafeDetail: "Pile order is not exposed.");

        Assert.Equal("warning", diagnostic.Severity);
        Assert.Equal("field_omitted", diagnostic.Effect);
        Assert.False(diagnostic.RequiredForAction);
    }

    [Fact]
    public void ActiveSurfaceResolverGivesVisibleOverlayOrMapExclusivePrecedence()
    {
        Assert.Equal(BridgeSurfaceLayer.Overlay, ActiveSurfaceResolver.SelectLayer(true, false));
        Assert.Equal(BridgeSurfaceLayer.Overlay, ActiveSurfaceResolver.SelectLayer(false, true));
        Assert.Equal(BridgeSurfaceLayer.Room, ActiveSurfaceResolver.SelectLayer(false, false));
        Assert.Equal(BridgeSurfaceLayer.Menu, ActiveSurfaceResolver.SelectLayer(false, false, true));
        Assert.True(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Overlay, false, true));
        Assert.False(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Room, false, true));
        Assert.True(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Room, false, false));
        Assert.False(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Overlay, false, false));
        Assert.True(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Menu, false, false, true));
        Assert.False(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Room, false, false, true));
        Assert.True(ActiveSurfaceResolver.ShouldSuppressProviders(true));
        Assert.False(ActiveSurfaceResolver.ShouldSuppressProviders(false));
    }

    [Fact]
    public void MenuContractsKeepUnsupportedVisibleChoicesOutOfActionSemantics()
    {
        var main = new MainMenuSurface(
            "main_menu",
            "choosing",
            "menu-root-a",
            new[]
            {
                new VisibleMenuOption("choice-single", "singleplayer", "Single Player", null, true, "actionable", null),
                new VisibleMenuOption("choice-settings", "settings", "Settings", null, true, "visible_unsupported", "Not implemented."),
                new VisibleMenuOption("choice-quit", "quit", "Quit", null, true, "visible_unsupported", "Not an Agent action.")
            },
            null);
        var submenu = new SingleplayerMenuSurface(
            "singleplayer_menu",
            "choosing",
            "menu-single-a",
            new[]
            {
                new VisibleMenuOption("choice-standard", "standard", "Standard", "Play a standard run.", true, "actionable", null),
                new VisibleMenuOption("choice-daily", "daily", "Daily", "Daily Climb.", true, "visible_unsupported", "Outside this contract."),
                new VisibleMenuOption("choice-back", "back", "Back", null, true, "actionable", null)
            });
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        string rootJson = JsonSerializer.Serialize(main, options);
        string submenuJson = JsonSerializer.Serialize(submenu, options);

        Assert.Contains("\"kind\":\"main_menu\"", rootJson);
        Assert.Contains("\"semantic_id\":\"settings\"", rootJson);
        Assert.Contains("\"bridge_support\":\"visible_unsupported\"", rootJson);
        Assert.DoesNotContain("settings_action", rootJson, StringComparison.Ordinal);
        Assert.Contains("\"kind\":\"singleplayer_menu\"", submenuJson);
        Assert.Contains("\"semantic_id\":\"daily\"", submenuJson);
    }

    [Fact]
    public void CharacterSelectContractExposesVisiblePanelWithoutLegacyDeckLeakage()
    {
        var surface = new CharacterSelectSurface(
            "character_select",
            "choosing",
            "character-screen-a",
            new[]
            {
                new VisibleCharacterChoice("choice-ironclad", 0, "IRONCLAD", "The Ironclad", false, true, false),
                new VisibleCharacterChoice("choice-random", 1, "RANDOM_CHARACTER", "Random", false, false, true)
            },
            new VisibleSelectedCharacterDetails(
                "IRONCLAD",
                "The Ironclad",
                "A survivor with reliable strength.",
                80,
                99,
                new VisibleStartingRelic("BURNING_BLOOD", "Burning Blood", "Heal after combat.")),
            Ascension: 1,
            AscensionTitle: "Ascension 1",
            AscensionDescription: "Elites are deadlier.",
            CanDecreaseAscension: true,
            CanIncreaseAscension: true,
            CanEmbark: true,
            CanGoBack: true);
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"character_select\"", json);
        Assert.Contains("\"character_id\":\"IRONCLAD\"", json);
        Assert.Contains("\"starting_relic\":{\"definition_id\":\"BURNING_BLOOD\"", json);
        Assert.Contains("\"ascension\":1", json);
        Assert.DoesNotContain("starting_deck", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("total_cards", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("card_index", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void MapNavigationRequiresExclusiveRouteInputReadiness()
    {
        Assert.True(MapNavigationSurfaceProvider.CanAdvertiseRouteActions(
            isOpen: true,
            travelEnabled: true,
            traveling: false,
            inputDisabled: false,
            drawingModeNone: true));
        Assert.False(MapNavigationSurfaceProvider.CanAdvertiseRouteActions(true, true, true, false, true));
        Assert.False(MapNavigationSurfaceProvider.CanAdvertiseRouteActions(true, true, false, false, false));
        Assert.False(MapNavigationSurfaceProvider.CanAdvertiseRouteActions(true, false, false, false, true));
        Assert.False(MapNavigationSurfaceProvider.CanAdvertiseRouteActions(true, true, false, true, true));
    }

    [Fact]
    public void MapNavigationMatchesControllerScreenReachability()
    {
        Assert.True(MapNavigationSurfaceProvider.CanAdvertiseMapChoice(
            stateTravelable: true,
            enabled: true,
            ftueSatisfied: true,
            usingController: false,
            nodeOnScreen: false));
        Assert.True(MapNavigationSurfaceProvider.CanAdvertiseMapChoice(true, true, true, true, true));
        Assert.False(MapNavigationSurfaceProvider.CanAdvertiseMapChoice(true, true, true, true, false));
        Assert.False(MapNavigationSurfaceProvider.CanAdvertiseMapChoice(false, true, true, false, true));
        Assert.False(MapNavigationSurfaceProvider.CanAdvertiseMapChoice(true, false, true, false, true));
        Assert.False(MapNavigationSurfaceProvider.CanAdvertiseMapChoice(true, true, false, false, true));
    }

    [Fact]
    public void MapNavigationRejectsUiChoicesAlreadyVisitedByTheRun()
    {
        Assert.False(MapNavigationSurfaceProvider.CanAdvertiseMapChoice(
            stateTravelable: true,
            enabled: true,
            ftueSatisfied: true,
            usingController: false,
            nodeOnScreen: true,
            targetAlreadyVisited: true));
        Assert.True(MapNavigationSurfaceProvider.CanAdvertiseMapChoice(
            stateTravelable: true,
            enabled: true,
            ftueSatisfied: true,
            usingController: false,
            nodeOnScreen: true,
            targetAlreadyVisited: false));
    }

    [Fact]
    public void MapContractSeparatesVisibleTopologyFromCurrentChoices()
    {
        IBridgeContext context = new MapBridgeContext(
            "map",
            0,
            new VisibleMapCoordinate(3, 0, "ancient"),
            new[] { new VisibleMapCoordinate(3, 0, "ancient") },
            new[]
            {
                new VisibleMapNode(
                    "map-node-start", 3, 0, "ancient", "traveled",
                    new[] { new VisibleMapCoordinate(2, 1, "monster") }),
                new VisibleMapNode(
                    "map-node-next", 2, 1, "monster", "travelable",
                    Array.Empty<VisibleMapCoordinate>())
            });
        IBridgeSurface surface = new MapNavigationSurface(
            "map_navigation",
            "map-screen",
            TravelEnabled: true,
            Traveling: false,
            DrawingMode: "none",
            new[] { new VisibleMapChoice("map-node-next", 2, 1, "monster") });
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(new { context, surface }, options);

        Assert.Contains("\"kind\":\"map\"", json);
        Assert.Contains("\"kind\":\"map_navigation\"", json);
        Assert.Contains("\"children\":[{\"col\":2,\"row\":1", json);
        Assert.Contains("\"next_options\":[{\"entity_id\":\"map-node-next\"", json);
        Assert.Contains("\"drawing_mode\":\"none\"", json);
    }

    [Fact]
    public void KnownEventWithTemporarilyEmptyOptionsIsSettlingNotDegraded()
    {
        Assert.Equal("settling", EventOptionSurfaceProvider.ClassifyReadiness(true, 0, 0));
        Assert.Equal("ready", EventOptionSurfaceProvider.ClassifyReadiness(true, 2, 2));
        Assert.Equal("degraded", EventOptionSurfaceProvider.ClassifyReadiness(false, 0, 0));
    }

    [Fact]
    public void CardRewardContractPreservesAlternativesInsteadOfCanSkip()
    {
        IBridgeContext context = new RewardFlowBridgeContext("reward_flow", "card_reward");
        IBridgeSurface surface = new CardRewardSelectionSurface(
            "card_reward_selection",
            "screen-a",
            Array.Empty<VisibleCard>(),
            new[]
            {
                new VisibleCardRewardAlternative("alternative-a", 0, "Reroll", true),
                new VisibleCardRewardAlternative("alternative-b", 1, "Sacrifice", true)
            });
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(new { context, surface }, options);

        Assert.Contains("\"kind\":\"reward_flow\"", json);
        Assert.Contains("\"kind\":\"card_reward_selection\"", json);
        Assert.Contains("\"label\":\"Reroll\"", json);
        Assert.Contains("\"label\":\"Sacrifice\"", json);
        Assert.DoesNotContain("can_skip", json);
    }

    [Fact]
    public void CombatPileSelectionKeepsPileAndSelectionSemanticsExplicit()
    {
        IBridgeContext context = new CombatBridgeContext(
            "combat",
            "normal",
            2,
            "player",
            true,
            new VisibleCombatPlayer(
                "player-a", 0, 2, 3, null,
                Array.Empty<VisibleCard>(), 3, 6, 0,
                Array.Empty<VisibleStatus>(),
                new[]
                {
                    new VisibleCombatCompanion(
                        "companion-a", "OSTY", "Osty", true, true, 4, 6, 0,
                        Array.Empty<VisibleStatus>())
                },
                Array.Empty<VisibleCombatPotionState>(),
                Array.Empty<VisibleOrb>(), 3),
            Array.Empty<VisibleEnemy>());
        IBridgeSurface surface = new CombatPileCardSelectionSurface(
            "combat_pile_card_selection",
            "screen-a",
            "Choose a card to put on top of your Draw Pile.",
            "move_one_discard_card_to_draw_top",
            "headbutt",
            "source-card-a",
            "HEADBUTT",
            "discard",
            "draw",
            "top",
            null,
            1,
            1,
            0,
            Array.Empty<string>(),
            RequireManualConfirmation: false,
            Cancelable: false,
            new[]
            {
                new VisibleCard(
                    "card-a", "BALL_LIGHTNING", "Ball Lightning", "Attack", "1", null,
                    "Deal 7 damage. Channel 1 Lightning.", "Common", false, false, null)
            });
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(new { context, surface }, options);

        Assert.Contains("\"kind\":\"combat\"", json);
        Assert.Contains("\"kind\":\"combat_pile_card_selection\"", json);
        Assert.Contains("\"definition_id\":\"OSTY\"", json);
        Assert.Contains("\"health_bar_visible\":true", json);
        Assert.Contains("\"purpose\":\"move_one_discard_card_to_draw_top\"", json);
        Assert.Contains("\"source_kind\":\"headbutt\"", json);
        Assert.Contains("\"source_card_definition_id\":\"HEADBUTT\"", json);
        Assert.Contains("\"pile_type\":\"discard\"", json);
        Assert.Contains("\"destination_pile\":\"draw\"", json);
        Assert.Contains("\"destination_position\":\"top\"", json);
        Assert.Contains("\"require_manual_confirmation\":false", json);
        Assert.Contains("\"entity_id\":\"card-a\"", json);

        IBridgeSurface graveblastSurface = new CombatPileCardSelectionSurface(
            "combat_pile_card_selection",
            "screen-b",
            "Choose a card to put back in your Hand.",
            "move_one_discard_card_to_hand",
            "graveblast",
            "source-card-b",
            "GRAVEBLAST",
            "discard",
            "hand",
            "bottom",
            "discard_if_hand_full",
            1,
            1,
            0,
            Array.Empty<string>(),
            RequireManualConfirmation: false,
            Cancelable: false,
            Array.Empty<VisibleCard>());
        string graveblastJson = JsonSerializer.Serialize(
            new { context, surface = graveblastSurface },
            options);

        Assert.Contains("\"purpose\":\"move_one_discard_card_to_hand\"", graveblastJson);
        Assert.Contains("\"source_kind\":\"graveblast\"", graveblastJson);
        Assert.Contains("\"source_card_definition_id\":\"GRAVEBLAST\"", graveblastJson);
        Assert.Contains("\"destination_pile\":\"hand\"", graveblastJson);
        Assert.Contains("\"destination_position\":\"bottom\"", graveblastJson);
        Assert.Contains("\"overflow_destination\":\"discard_if_hand_full\"", graveblastJson);
    }

    [Fact]
    public void HeadbuttWitnessRequiresExactDiscardToDrawTopMove()
    {
        object selected = new();
        object otherDiscard = new();
        object oldDraw = new();
        object wrongTop = new();
        object playedHeadbutt = new();

        Assert.True(HeadbuttCombatPileWitness.Selected(
            sourceCompleted: true,
            surfaceClosed: true,
            new[] { selected, otherDiscard },
            new[] { oldDraw },
            new[] { otherDiscard, playedHeadbutt },
            new[] { selected, oldDraw },
            selected));
        Assert.False(HeadbuttCombatPileWitness.Selected(
            sourceCompleted: true,
            surfaceClosed: true,
            new[] { selected, otherDiscard },
            new[] { oldDraw },
            new[] { otherDiscard },
            new[] { wrongTop, selected, oldDraw },
            selected));
        Assert.False(HeadbuttCombatPileWitness.Selected(
            sourceCompleted: false,
            surfaceClosed: true,
            new[] { selected, otherDiscard },
            new[] { oldDraw },
            new[] { otherDiscard },
            new[] { selected, oldDraw },
            selected));
    }

    [Fact]
    public void GraveblastWitnessRequiresExactDiscardToHandMoveOrNativeFullHandRedirect()
    {
        object selected = new();
        object otherDiscard = new();
        object handCard = new();
        object playedGraveblast = new();

        Assert.True(GraveblastCombatPileWitness.Selected(
            sourceCompleted: true,
            surfaceClosed: true,
            new[] { selected, otherDiscard },
            new[] { handCard },
            new[] { otherDiscard, playedGraveblast },
            new[] { handCard, selected },
            selected,
            maxHandSize: 10));
        Assert.True(GraveblastCombatPileWitness.Selected(
            sourceCompleted: true,
            surfaceClosed: true,
            new[] { selected, otherDiscard },
            Enumerable.Range(0, 10).Select(_ => new object()).ToArray(),
            new[] { selected, otherDiscard },
            Enumerable.Range(0, 10).Select(_ => new object()).ToArray(),
            selected,
            maxHandSize: 10));
        Assert.False(GraveblastCombatPileWitness.Selected(
            sourceCompleted: false,
            surfaceClosed: true,
            new[] { selected, otherDiscard },
            new[] { handCard },
            new[] { otherDiscard },
            new[] { handCard, selected },
            selected,
            maxHandSize: 10));
    }

    [Fact]
    public void CombatHandSelectionKeepsInstanceSelectionAndReplacementSemanticsExplicit()
    {
        IBridgeSurface surface = new CombatHandCardSelectionSurface(
            "combat_hand_card_selection",
            "hand-a",
            "Confirm Card to Upgrade",
            "upgrade_select",
            1,
            1,
            1,
            new[] { "card-selected" },
            RequireManualConfirmation: true,
            IsPeeking: false,
            new[]
            {
                new VisibleCard(
                    "card-option", "STRIKE", "Strike", "Attack", "1", null,
                    "Deal 6 damage.", "Basic", false, false, null),
                new VisibleCard(
                    "card-selected", "STRIKE", "Strike", "Attack", "1", null,
                    "Deal 6 damage.", "Basic", false, true, null)
            });
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"combat_hand_card_selection\"", json);
        Assert.Contains("\"selection_mode\":\"upgrade_select\"", json);
        Assert.Contains("\"selected_card_entity_ids\":[\"card-selected\"]", json);
        Assert.Contains("\"require_manual_confirmation\":true", json);
        Assert.Contains("\"is_selected\":true", json);
    }

    [Fact]
    public void RewardClaimContractKeepsVisibleRewardsAndProceedSemanticsSeparate()
    {
        IBridgeContext context = new RewardFlowBridgeContext("reward_flow", "room_rewards");
        IBridgeSurface surface = new RewardClaimSurface(
            "reward_claim",
            "screen-a",
            new[] { new VisibleReward("reward-a", "gold", "25 Gold", "25 Gold", true) },
            PotionSlotsFull: false,
            DiscardablePotions: Array.Empty<VisibleCombatPotion>(),
            CanProceed: true,
            ProceedSkipsRemainingRewards: true);
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(new { context, surface }, options);

        Assert.Contains("\"reward_kind\":\"room_rewards\"", json);
        Assert.Contains("\"kind\":\"reward_claim\"", json);
        Assert.Contains("\"label\":\"25 Gold\"", json);
        Assert.Contains("\"potion_slots_full\":false", json);
        Assert.Contains("\"discardable_potions\":[]", json);
        Assert.Contains("\"proceed_skips_remaining_rewards\":true", json);
        Assert.DoesNotContain("index", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void GeneratedCardChoiceContractKeepsSourcePurposeDestinationAndSkipExplicit()
    {
        IBridgeSurface surface = new GeneratedCardChoiceSurface(
            "generated_card_choice",
            "screen-generated",
            "Choose a Card",
            "acquire_one_generated_card",
            "lead_paperweight",
            "run_deck",
            "unchanged",
            null,
            CanSkip: true,
            IsPeeking: false,
            Cards: new[]
            {
                new VisibleCard(
                    "generated-card", "PRIMAL_FORCE", "Primal Force", "Skill", "0", null,
                    "Transform all Attacks in your Hand into Giant Rock.", "Rare", false, false, null)
            });
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"generated_card_choice\"", json);
        Assert.Contains("\"prompt\":\"Choose a Card\"", json);
        Assert.Contains("\"purpose\":\"acquire_one_generated_card\"", json);
        Assert.Contains("\"source_kind\":\"lead_paperweight\"", json);
        Assert.Contains("\"destination\":\"run_deck\"", json);
        Assert.Contains("\"selected_card_cost_policy\":\"unchanged\"", json);
        Assert.Contains("\"can_skip\":true", json);
        Assert.Contains("\"is_peeking\":false", json);
        Assert.Contains("\"entity_id\":\"generated-card\"", json);
    }

    [Fact]
    public void GeneratedCombatPotionSourceCatalogIsExactAndPurposeBounded()
    {
        Assert.Equal(
            new[] { "colorless_potion", "attack_potion", "skill_potion", "power_potion" },
            GeneratedCardChoiceSourceBinding.SupportedCombatPotionSourceKinds);
        Assert.Equal(
            GeneratedCardChoiceSourceBinding.SupportedCombatPotionSourceKinds.Count,
            GeneratedCardChoiceSourceBinding.SupportedCombatPotionSourceKinds.Distinct(StringComparer.Ordinal).Count());
    }

    [Fact]
    public void GeneratedCombatCardWitnessRequiresExactPileDeltaAndFreeCostPolicy()
    {
        var handCard = new object();
        var discardCard = new object();
        var selectedCard = new object();
        object[] baselineHand = { handCard };
        object[] baselineDiscard = { discardCard };

        Assert.True(GeneratedCombatCardChoiceWitness.Selected(
            sourceCompleted: true,
            surfaceClosed: true,
            baselineHand,
            baselineDiscard,
            new[] { handCard, selectedCard },
            baselineDiscard,
            selectedCard,
            hasFreeThisTurnCostModifier: true));
        Assert.True(GeneratedCombatCardChoiceWitness.Selected(
            sourceCompleted: true,
            surfaceClosed: true,
            baselineHand,
            baselineDiscard,
            baselineHand,
            new[] { discardCard, selectedCard },
            selectedCard,
            hasFreeThisTurnCostModifier: true));
        Assert.False(GeneratedCombatCardChoiceWitness.Selected(
            sourceCompleted: true,
            surfaceClosed: true,
            baselineHand,
            baselineDiscard,
            new[] { handCard, selectedCard },
            baselineDiscard,
            selectedCard,
            hasFreeThisTurnCostModifier: false));
        Assert.True(GeneratedCombatCardChoiceWitness.Skipped(
            sourceCompleted: true,
            surfaceClosed: true,
            baselineHand,
            baselineDiscard,
            baselineHand,
            baselineDiscard,
            new[] { selectedCard }));
    }

    [Fact]
    public void GeneratedRunCardWitnessRequiresExactSemanticPostState()
    {
        var baselineCard = new object();
        var selectedCard = new object();
        var unselectedCard = new object();
        object[] baseline = { baselineCard };
        object[] selectedDeck = { baselineCard, selectedCard };

        Assert.True(GeneratedRunCardAcquisitionWitness.Selected(
            sourceCompleted: true,
            surfaceClosed: true,
            baseline,
            selectedDeck,
            selectedCard));
        Assert.False(GeneratedRunCardAcquisitionWitness.Selected(
            sourceCompleted: false,
            surfaceClosed: true,
            baseline,
            selectedDeck,
            selectedCard));
        Assert.False(GeneratedRunCardAcquisitionWitness.Selected(
            sourceCompleted: true,
            surfaceClosed: true,
            baseline,
            new[] { baselineCard, unselectedCard },
            selectedCard));

        Assert.True(GeneratedRunCardAcquisitionWitness.Skipped(
            sourceCompleted: true,
            surfaceClosed: true,
            baseline,
            new[] { baselineCard },
            new[] { selectedCard, unselectedCard }));
        Assert.False(GeneratedRunCardAcquisitionWitness.Skipped(
            sourceCompleted: true,
            surfaceClosed: true,
            baseline,
            selectedDeck,
            new[] { selectedCard, unselectedCard }));
    }

    [Fact]
    public void EventCardAcquisitionContractKeepsDestinationAndSelectedInstancesExplicit()
    {
        IBridgeSurface surface = new EventCardAcquisitionSurface(
            "event_card_acquisition",
            "screen-event-cards",
            "Choose a Card",
            "run_deck",
            MinSelect: 1,
            MaxSelect: 1,
            SelectedCount: 0,
            SelectedCardEntityIds: Array.Empty<string>(),
            RequireManualConfirmation: false,
            Cards: new[]
            {
                new VisibleCard(
                    "event-card", "TWIN_STRIKE", "Twin Strike", "Attack", "1", null,
                    "Deal damage twice.", "Common", false, false, null)
            });
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"event_card_acquisition\"", json);
        Assert.Contains("\"destination\":\"run_deck\"", json);
        Assert.Contains("\"require_manual_confirmation\":false", json);
        Assert.Contains("\"entity_id\":\"event-card\"", json);
        Assert.DoesNotContain("card_index", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CardBundleContractPreservesAtomicPackageAndPreviewStage()
    {
        IBridgeSurface surface = new CardBundleSelectionSurface(
            "card_bundle_selection",
            "preview",
            "screen-bundle",
            "Choose a bundle",
            "bundle-a",
            new[]
            {
                new VisibleCardBundle(
                    "bundle-a",
                    new[]
                    {
                        new VisibleCard(
                            "bundle-card-a", "BLOOD_WALL", "Blood Wall", "Skill", "1", null,
                            "Gain Block.", "Common", false, false, null),
                        new VisibleCard(
                            "bundle-card-b", "MOLTEN_FIST", "Molten Fist", "Attack", "2", null,
                            "Deal damage.", "Common", false, false, null)
                    })
            });
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"card_bundle_selection\"", json);
        Assert.Contains("\"stage\":\"preview\"", json);
        Assert.Contains("\"selected_bundle_entity_id\":\"bundle-a\"", json);
        Assert.Contains("\"entity_id\":\"bundle-a\"", json);
        Assert.Contains("\"entity_id\":\"bundle-card-a\"", json);
        Assert.DoesNotContain("card_index", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EventDialogueContractCarriesOnlyTheRevealedPrefixAndCurrentLine()
    {
        IBridgeSurface surface = new EventDialogueSurface(
            "event_dialogue",
            "screen-dialogue",
            CurrentLineIndex: 1,
            RevealedLines: new[]
            {
                new VisibleDialogueLine("line-0", 0, "Welcome back.", "ancient", false),
                new VisibleDialogueLine("line-1", 1, "Choose your beginning.", "ancient", true)
            },
            AdvanceLabel: "Continue");
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"event_dialogue\"", json);
        Assert.Contains("\"current_line_index\":1", json);
        Assert.Contains("\"entity_id\":\"line-1\"", json);
        Assert.Contains("\"is_current\":true", json);
        Assert.Contains("\"advance_label\":\"Continue\"", json);
        Assert.DoesNotContain("future", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void RestSiteContractKeepsOptionChoiceAndProceedDistinct()
    {
        IBridgeSurface surface = new RestSiteSurface(
            "rest_site",
            "rest-screen",
            new[]
            {
                new VisibleRestOption("rest-heal", 0, "HEAL", "Rest", "Heal HP.", true),
                new VisibleRestOption("rest-smith", 1, "SMITH", "Smith", "Upgrade a card.", false)
            },
            CanProceed: false);
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"kind\":\"rest_site\"", json);
        Assert.Contains("\"option_id\":\"HEAL\"", json);
        Assert.Contains("\"enabled\":false", json);
        Assert.Contains("\"can_proceed\":false", json);
    }

    [Fact]
    public void ShopContractSeparatesInventoryFromRoomControlsAndPurchaseKinds()
    {
        IBridgeContext context = new ShopBridgeContext("shop");
        IBridgeSurface inventory = new ShopInventorySurface(
            "shop_inventory",
            "shop-screen",
            Cards: new[]
            {
                new VisibleShopCardOffer(
                    "offer-card", "slot-card", 2, 26, Stocked: true, Visible: true,
                    Affordable: true, CanPurchase: true, BlockedReason: null, OnSale: true,
                    new VisibleCard(
                        "card-armaments", "ARMAMENTS", "Armaments", "Skill", "1", null,
                        "Gain Block. Upgrade a card in your Hand.", "Uncommon", false, false, null))
            },
            Relics: Array.Empty<VisibleShopRelicOffer>(),
            Potions: new[]
            {
                new VisibleShopPotionOffer(
                    "offer-potion", "slot-potion", 10, 50, Stocked: true, Visible: true,
                    Affordable: false, CanPurchase: false, BlockedReason: "insufficient_gold",
                    "FLEX_POTION", "Flex Potion", "Gain Strength.", "Common")
            },
            CardRemoval: new VisibleShopCardRemovalOffer(
                "offer-removal", "slot-removal", 13, 100, 25, Stocked: true, Visible: true,
                Affordable: false, CanPurchase: false, BlockedReason: "insufficient_gold"),
            CanClose: true);
        IBridgeSurface room = new ShopRoomSurface(
            "shop_room",
            "shop-room",
            CanOpenInventory: true,
            CanProceed: true);
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string inventoryJson = JsonSerializer.Serialize(new { context, surface = inventory }, options);
        string roomJson = JsonSerializer.Serialize(new { context, surface = room }, options);

        Assert.Contains("\"kind\":\"shop\"", inventoryJson);
        Assert.Contains("\"kind\":\"shop_inventory\"", inventoryJson);
        Assert.Contains("\"on_sale\":true", inventoryJson);
        Assert.Contains("\"blocked_reason\":\"insufficient_gold\"", inventoryJson);
        Assert.DoesNotContain("max_potion_slots", inventoryJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("can_proceed", inventoryJson, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("\"kind\":\"shop_room\"", roomJson);
        Assert.Contains("\"can_open_inventory\":true", roomJson);
        Assert.Contains("\"can_proceed\":true", roomJson);
        Assert.DoesNotContain("cards", roomJson, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SharedRunHudIsTopLevelReadOnlyStateRatherThanContextOrSurfaceAuthority()
    {
        var shared = new SharedVisibleState(
            "active_single_player_run",
            new VisibleRunHud(
                2,
                "OVERGROWTH",
                "The Overgrowth",
                18,
                5,
                new[] { new VisibleBoss("TEST_SUBJECTS", "Test Subjects", 0) },
                new[]
                {
                    new VisibleRunModifier(
                        "LETHAL_ENEMIES",
                        "Lethal Enemies",
                        "Enemies are more dangerous.",
                        Array.Empty<VisibleKeyword>(),
                        Array.Empty<VisibleCard>())
                }),
            new VisiblePlayerHud(
                "player-a",
                "DEFECT",
                "The Defect",
                40,
                75,
                126,
                new[]
                {
                    new VisibleRelic(
                        "relic-a", "BAG_OF_MARBLES", "Bag of Marbles", "Apply Vulnerable.",
                        null, Array.Empty<VisibleKeyword>(), Array.Empty<VisibleCard>())
                },
                new[]
                {
                    new VisibleOwnedPotion(
                        "potion-a", "POWER_POTION", "Power Potion", "Choose a Power.", 0,
                        Array.Empty<VisibleKeyword>(), Array.Empty<VisibleCard>())
                },
                3),
            new SharedStateCompleteness(
                "complete_for_strategy_relevant_persistent_single_player_hud",
                new[] { "NTopBar" },
                Array.Empty<string>()));
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(new
        {
            shared_state = shared,
            context = new ShopBridgeContext("shop"),
            surface = new ShopRoomSurface("shop_room", "room-a", true, true)
        }, options);

        Assert.Contains("\"scope\":\"active_single_player_run\"", json);
        Assert.Contains("\"bosses\"", json);
        Assert.Contains("\"modifiers\"", json);
        Assert.Contains("\"max_potion_slots\":3", json);
        Assert.DoesNotContain("legal_actions", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ShopBlockedReasonDoesNotTreatAffordabilityAsPurchaseAuthority()
    {
        Assert.Equal("sold_out", ShopSurfaceFacts.BlockedReason(false, false, false, false));
        Assert.Equal("not_visible", ShopSurfaceFacts.BlockedReason(true, false, true, false));
        Assert.Equal("insufficient_gold", ShopSurfaceFacts.BlockedReason(true, true, false, false));
        Assert.Equal("ui_control_disabled", ShopSurfaceFacts.BlockedReason(true, true, true, false));
        Assert.Null(ShopSurfaceFacts.BlockedReason(true, true, true, true));
    }

    [Fact]
    public void ShopPurchaseCompletionRequiresAsyncSuccessAndEverySemanticWitness()
    {
        Assert.True(ShopPurchaseCompletionWitness.IsComplete(
            taskCompleted: true,
            taskCompletedSuccessfully: true,
            purchaseSucceeded: true,
            goldBeforePurchase: 150,
            currentGold: 100,
            expectedPrice: 50,
            productAcquired: true,
            entryAdvanced: true,
            linkedRewardContinuationVisible: false));

        Assert.True(ShopPurchaseCompletionWitness.IsComplete(
            taskCompleted: false,
            taskCompletedSuccessfully: false,
            purchaseSucceeded: false,
            goldBeforePurchase: 150,
            currentGold: 100,
            expectedPrice: 50,
            productAcquired: true,
            entryAdvanced: true,
            linkedRewardContinuationVisible: true));

        Assert.False(ShopPurchaseCompletionWitness.IsComplete(
            taskCompleted: false,
            taskCompletedSuccessfully: false,
            purchaseSucceeded: false,
            goldBeforePurchase: 150,
            currentGold: 150,
            expectedPrice: 50,
            productAcquired: false,
            entryAdvanced: false,
            linkedRewardContinuationVisible: false));
        Assert.False(ShopPurchaseCompletionWitness.IsComplete(
            taskCompleted: true,
            taskCompletedSuccessfully: false,
            purchaseSucceeded: false,
            goldBeforePurchase: 150,
            currentGold: 100,
            expectedPrice: 50,
            productAcquired: true,
            entryAdvanced: true,
            linkedRewardContinuationVisible: true));
        Assert.False(ShopPurchaseCompletionWitness.IsComplete(
            taskCompleted: true,
            taskCompletedSuccessfully: true,
            purchaseSucceeded: true,
            goldBeforePurchase: 150,
            currentGold: 100,
            expectedPrice: 50,
            productAcquired: false,
            entryAdvanced: true,
            linkedRewardContinuationVisible: false));
        Assert.False(ShopPurchaseCompletionWitness.IsComplete(
            taskCompleted: true,
            taskCompletedSuccessfully: true,
            purchaseSucceeded: true,
            goldBeforePurchase: 150,
            currentGold: 100,
            expectedPrice: 50,
            productAcquired: true,
            entryAdvanced: false,
            linkedRewardContinuationVisible: false));
        Assert.False(ShopPurchaseCompletionWitness.IsComplete(
            taskCompleted: true,
            taskCompletedSuccessfully: true,
            purchaseSucceeded: true,
            goldBeforePurchase: 150,
            currentGold: 101,
            expectedPrice: 50,
            productAcquired: true,
            entryAdvanced: true,
            linkedRewardContinuationVisible: false));
    }

    [Fact]
    public void TreasureRelicIsNotPlayerVisibleBeforeCollectionOpens()
    {
        Assert.False(TreasureVisibilityFacts.CanReadSingleplayerRelic(
            collectionOpen: false,
            currentRelicCount: 1));
        Assert.False(TreasureVisibilityFacts.CanReadSingleplayerRelic(
            collectionOpen: true,
            currentRelicCount: 0));
        Assert.True(TreasureVisibilityFacts.CanReadSingleplayerRelic(
            collectionOpen: true,
            currentRelicCount: 1));
    }

    [Fact]
    public void RewardClaimContractCarriesVisibleFullPotionCapacityResolution()
    {
        IBridgeSurface surface = new RewardClaimSurface(
            "reward_claim",
            "screen-a",
            new[] { new VisibleReward("reward-potion", "potion", "Skill Potion", "Choose a Skill.", false) },
            PotionSlotsFull: true,
            DiscardablePotions: new[]
            {
                new VisibleCombatPotion(
                    "potion-power", "POWER_POTION", "Power Potion", "Choose a Power.",
                    Slot: 0, TargetType: "None", CanUse: false, Automatic: false)
            },
            CanProceed: true,
            ProceedSkipsRemainingRewards: true);
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        string json = JsonSerializer.Serialize(surface, options);

        Assert.Contains("\"potion_slots_full\":true", json);
        Assert.Contains("\"enabled\":false", json);
        Assert.Contains("\"entity_id\":\"potion-power\"", json);
        Assert.Contains("\"slot\":0", json);
    }

    [Fact]
    public void TypedContextsAndSurfacesKeepIndependentDiscriminators()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        IBridgeContext context = new EventBridgeContext(
            "event", "EVENT_A", "Event A", false, false, "Visible narrative");
        IBridgeSurface surface = new EventOptionSurface(
            "event_option", "screen-a", new[]
            {
                new VisibleEventOption(
                    "option-a", 0, "Choose", "Visible result", false, false, false,
                    true, null, null, new[]
                    {
                        new VisibleEventOptionTooltip("text", "Guilty", "Cannot be played.", null)
                    })
            });

        string json = JsonSerializer.Serialize(new { context, surface }, options);

        Assert.Contains("\"context\":{\"kind\":\"event\"", json);
        Assert.Contains("\"surface\":{\"kind\":\"event_option\"", json);
        Assert.Contains("\"will_kill_player\":true", json);
        Assert.Contains("\"tooltips\":[{\"kind\":\"text\",\"name\":\"Guilty\"", json);
        Assert.DoesNotContain("surface_kind", json);
    }

    [Fact]
    public void CombatTransitionNoActionContractIsTypedAndNonAuthorizing()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        IBridgeContext context = new CombatTransitionBridgeContext(
            "combat_transition", "resolution", "awaiting_room_resolution");
        IBridgeSurface surface = new NoActionSurface(
            "no_action", "settling", "Combat has ended; rewards are resolving.");

        string json = JsonSerializer.Serialize(new { context, surface }, options);

        Assert.Contains("\"context\":{\"kind\":\"combat_transition\"", json);
        Assert.Contains("\"phase\":\"resolution\"", json);
        Assert.Contains("\"transition\":\"awaiting_room_resolution\"", json);
        Assert.Contains("\"surface\":{\"kind\":\"no_action\"", json);
        Assert.Contains("\"reason\":\"settling\"", json);
        Assert.DoesNotContain("action_id", json);
    }

    [Fact]
    public void TooltipCardIdentityIsStableWithinItsVisibleOwnerScope()
    {
        string first = BridgeVisibleEntityFacts.BuildTooltipCardEntityId("relic-owner", "GREED", 0);
        string repeated = BridgeVisibleEntityFacts.BuildTooltipCardEntityId("relic-owner", "GREED", 0);
        string otherOwner = BridgeVisibleEntityFacts.BuildTooltipCardEntityId("other-relic", "GREED", 0);
        string otherSlot = BridgeVisibleEntityFacts.BuildTooltipCardEntityId("relic-owner", "GREED", 1);

        Assert.Equal(first, repeated);
        Assert.StartsWith("tooltip_card_", first, StringComparison.Ordinal);
        Assert.NotEqual(first, otherOwner);
        Assert.NotEqual(first, otherSlot);
    }

    [Theory]
    [InlineData(true, true, false, false, false, false, false, 1)]
    [InlineData(true, true, true, false, true, false, true, 1)]
    [InlineData(true, true, false, false, true, false, true, 2)]
    [InlineData(true, true, false, false, true, false, false, 0)]
    [InlineData(true, true, true, true, true, false, true, 0)]
    [InlineData(true, true, true, false, true, true, true, 0)]
    [InlineData(false, true, true, false, true, false, true, 0)]
    public void CombatNoInputClassificationKeepsSetupResolutionAndAuthoritySeparate(
        bool runInProgress,
        bool currentRoomIsCombat,
        bool combatIsStarting,
        bool combatInProgress,
        bool combatStatePresent,
        bool hasBlockingSurface,
        bool liveCombatRoomPresent,
        int expected)
    {
        Assert.Equal((CombatNoInputPhase)expected, BridgeSnapshotBuilder.ClassifyCombatNoInputTransition(
            runInProgress,
            currentRoomIsCombat,
            combatIsStarting,
            combatInProgress,
            combatStatePresent,
            hasBlockingSurface,
            liveCombatRoomPresent));
    }

}
