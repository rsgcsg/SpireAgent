namespace STS2_MCP.Tests;

public sealed class LegacyV1RoutePolicyTests
{
    [Theory]
    [InlineData("/api/v1")]
    [InlineData("/api/v1/singleplayer")]
    [InlineData("/api/v1/multiplayer")]
    [InlineData("/api/v1/profiles")]
    [InlineData("/api/v1/future-mutation")]
    public void V1NamespaceIsPermanentlyRetired(string path)
    {
        Assert.True(LegacyV1RoutePolicy.IsRetiredPath(path));
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/api/v2/commands")]
    [InlineData("/api/v10/state")]
    public void NonV1RoutesAreUnaffected(string path)
    {
        Assert.False(LegacyV1RoutePolicy.IsRetiredPath(path));
    }
}
