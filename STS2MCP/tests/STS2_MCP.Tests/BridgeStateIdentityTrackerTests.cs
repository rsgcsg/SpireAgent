using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.Tests;

public sealed class BridgeStateIdentityTrackerTests
{
    [Fact]
    public void StableSignatureKeepsStateIdentity()
    {
        var tracker = new BridgeStateIdentityTracker("testsession");

        var first = tracker.Observe("signature-a");
        var second = tracker.Observe("signature-a");

        Assert.Equal("state_testsession_1", first.StateId);
        Assert.Equal(first, second);
    }

    [Fact]
    public void SemanticChangeAdvancesStateIdentity()
    {
        var tracker = new BridgeStateIdentityTracker("testsession");

        var first = tracker.Observe("signature-a");
        var second = tracker.Observe("signature-b");

        Assert.Equal(1, first.Sequence);
        Assert.Equal(2, second.Sequence);
        Assert.NotEqual(first.StateId, second.StateId);
    }
}
