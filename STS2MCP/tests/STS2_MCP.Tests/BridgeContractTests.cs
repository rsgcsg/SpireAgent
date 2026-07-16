using System.Text.Json;
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
