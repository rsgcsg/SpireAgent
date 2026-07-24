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
        Assert.Equal("session_auto_approved", current.Tier);
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
    public void ReviewedNonCandidateCanaryRemainsStaticInBalancedMode()
    {
        var manager = new BridgePermissionManager("runtime-a");
        CompatibilityAssessment applied = manager.Apply(
            GameWithScopes(Scope("event_option", "choose_event_option", "canary")),
            Bridge("runtime-a"),
            CleanPatchInventory());

        ActionPermissionScope scope = Assert.Single(applied.ActionPermissionScopes);
        Assert.Equal("canary", scope.Tier);
        Assert.Equal("not_session_bound", scope.RuntimeEpoch);
        Assert.StartsWith("grant_static_", scope.GrantId);
        Assert.Empty(manager.Snapshot().Grants);
    }

    [Fact]
    public void CandidateCatalogIsReviewedNonAuthorizingData()
    {
        Assert.Null(BridgeGrayPermissionCandidateCatalog.LoadError);
        Assert.Matches("^[a-f0-9]{64}$", BridgeGrayPermissionCandidateCatalog.PolicyDigest);
        BridgeGrayPermissionCandidate candidate = Assert.IsType<BridgeGrayPermissionCandidate>(
            BridgeGrayPermissionCandidateCatalog.Find("main_menu", "open_singleplayer"));
        Assert.Equal("reversible_navigation", candidate.RiskClass);
        Assert.Equal("source_audited", candidate.MinimumEvidenceStatus);
        BridgeGrayPermissionCandidate continueRun =
            Assert.IsType<BridgeGrayPermissionCandidate>(
                BridgeGrayPermissionCandidateCatalog.Find("main_menu", "continue_run"));
        Assert.Equal("organic_canary_exercised", continueRun.MinimumEvidenceStatus);
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
        scope.OperationFingerprint);

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
