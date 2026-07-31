using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.Tests;

public sealed class BridgeEntityRegistryTests
{
    [Fact]
    public void ExactObjectCanBeResolvedByItsStableEntityId()
    {
        var registry = new BridgeEntityRegistry();
        var entity = new object();

        string id = registry.GetId(entity, "card");

        Assert.True(registry.TryResolve<object>(id, out object? resolved));
        Assert.Same(entity, resolved);
        Assert.Equal(id, registry.GetId(entity, "card"));
    }

    [Fact]
    public void UnknownOrWrongTypedEntityFailsClosed()
    {
        var registry = new BridgeEntityRegistry();
        var entity = new object();
        string id = registry.GetId(entity, "card");

        Assert.False(registry.TryResolve<string>(id, out _));
        Assert.True(registry.TryResolve<object>(id, out object? resolved));
        Assert.Same(entity, resolved);
        Assert.False(registry.TryResolve<object>("card_missing_1", out _));
    }
}
