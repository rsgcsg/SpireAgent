using System.Text.Json;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.Tests;

public sealed class BridgeContractTests
{
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
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        IBridgeSurface surface = new UnsupportedSurface("unsupported", "test", "not implemented");
        var envelope = new BridgeStateEnvelope(
            BridgeV2Contract.ProtocolVersion,
            "state-a",
            1,
            DateTimeOffset.UnixEpoch,
            "unsupported",
            new UnknownBridgeContext("unknown", "test", "not implemented"),
            surface,
            Array.Empty<LegalAction>(),
            new StateCompleteness("not_implemented", "empty_fail_closed", Array.Empty<string>(), Array.Empty<string>()),
            new BridgeServerIdentity("bridge", "Bridge", "test", "commit"),
            new GameBuildIdentity(null, null, null, null, new CompatibilityAssessment("unknown", Array.Empty<string>(), Array.Empty<string>(), false, "unknown")),
            new ObservationPolicyInfo("policy", "visible", false, "omit"),
            Array.Empty<BridgeDiagnostic>(),
            Array.Empty<string>());

        string json = JsonSerializer.Serialize(envelope, options);

        Assert.Equal(surface.Kind, envelope.SurfaceKind);
        Assert.Contains("\"surface_kind\":\"unsupported\"", json);
        Assert.Contains("\"context\":{\"kind\":\"unknown\"", json);
        Assert.Contains("\"surface\":{\"kind\":\"unsupported\"", json);
        Assert.Contains("\"source_type\":\"test\"", json);
        Assert.Contains("\"reason\":\"not implemented\"", json);
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
            new BridgeServerIdentity("bridge", "Bridge", "test", "commit"),
            new GameBuildIdentity(
                "v0.108.0",
                "commit",
                "branch",
                1,
                new CompatibilityAssessment("supported_exact", new[] { "v0.108.0" }, new[] { "fingerprint" }, true, "exact")),
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
    public void ActiveSurfaceResolverGivesBlockingOverlayExclusivePrecedence()
    {
        Assert.Equal(BridgeSurfaceLayer.Overlay, ActiveSurfaceResolver.SelectLayer(true));
        Assert.Equal(BridgeSurfaceLayer.Room, ActiveSurfaceResolver.SelectLayer(false));
        Assert.True(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Overlay, true));
        Assert.False(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Room, true));
        Assert.True(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Room, false));
        Assert.False(ActiveSurfaceResolver.IsActiveLayer(BridgeSurfaceLayer.Overlay, false));
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
    public void RewardClaimContractKeepsVisibleRewardsAndProceedSemanticsSeparate()
    {
        IBridgeContext context = new RewardFlowBridgeContext("reward_flow", "room_rewards");
        IBridgeSurface surface = new RewardClaimSurface(
            "reward_claim",
            "screen-a",
            new[] { new VisibleReward("reward-a", "gold", "25 Gold", "25 Gold", true) },
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
        Assert.Contains("\"proceed_skips_remaining_rewards\":true", json);
        Assert.DoesNotContain("index", json, StringComparison.OrdinalIgnoreCase);
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
                new VisibleEventOption("option-a", 0, "Choose", "Visible result", false, false, false, null, null)
            });

        string json = JsonSerializer.Serialize(new { context, surface }, options);

        Assert.Contains("\"context\":{\"kind\":\"event\"", json);
        Assert.Contains("\"surface\":{\"kind\":\"event_option\"", json);
        Assert.DoesNotContain("surface_kind", json);
    }

}
