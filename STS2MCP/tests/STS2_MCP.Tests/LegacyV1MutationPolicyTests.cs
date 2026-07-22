namespace STS2_MCP.Tests;

public sealed class LegacyV1MutationPolicyTests
{
    [Theory]
    [InlineData("/api/v1/singleplayer")]
    [InlineData("/api/v1/multiplayer")]
    [InlineData("/api/v1/profiles")]
    [InlineData("/api/v1/future-mutation")]
    public void V1PostsAreDeniedByDefault(string path)
    {
        Assert.False(LegacyV1MutationPolicy.IsAllowed("POST", path, mutationsEnabled: false));
    }

    [Fact]
    public void ExplicitCompatibilitySettingAllowsV1Posts()
    {
        Assert.True(LegacyV1MutationPolicy.IsAllowed(
            "POST",
            "/api/v1/singleplayer",
            mutationsEnabled: true));
    }

    [Theory]
    [InlineData("GET", "/api/v1/singleplayer")]
    [InlineData("POST", "/api/v2/commands")]
    [InlineData("OPTIONS", "/api/v1/singleplayer")]
    public void ReadsAndV2CommandsAreUnaffected(string method, string path)
    {
        Assert.True(LegacyV1MutationPolicy.IsAllowed(method, path, mutationsEnabled: false));
    }
}
