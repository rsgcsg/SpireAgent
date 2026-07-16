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
}
