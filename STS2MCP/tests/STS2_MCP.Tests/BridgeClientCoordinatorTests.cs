using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.Tests;

public sealed class BridgeClientCoordinatorTests
{
    [Fact]
    public void OnlyOneClientMayHoldMutationControl()
    {
        var coordinator = new BridgeClientCoordinator("runtime-a");
        BridgeClientRegistrationResponse first = coordinator.Register(Client("instance-a", "Agent A"));
        BridgeClientRegistrationResponse second = coordinator.Register(Client("instance-b", "Agent B"));

        BridgeControllerLeaseResponse acquired = coordinator.Acquire(
            new BridgeControllerLeaseRequest(first.Client.ClientSessionId, null, null));
        BridgeControllerLeaseResponse blocked = coordinator.Acquire(
            new BridgeControllerLeaseRequest(second.Client.ClientSessionId, null, null));

        Assert.Equal("controller_acquired", acquired.Status);
        Assert.Equal("controller_lease_held", blocked.Status);
        Assert.Equal(first.Client.ClientSessionId, blocked.Controller?.ClientSessionId);
    }

    [Fact]
    public void ReleaseAllowsTakeoverWithHigherGeneration()
    {
        var coordinator = new BridgeClientCoordinator("runtime-a");
        BridgeClientRegistrationResponse first = coordinator.Register(Client("instance-a", "Agent A"));
        BridgeClientRegistrationResponse second = coordinator.Register(Client("instance-b", "Agent B"));
        BridgeControllerLeaseInfo firstLease = Assert.IsType<BridgeControllerLeaseInfo>(
            coordinator.Acquire(new BridgeControllerLeaseRequest(
                first.Client.ClientSessionId,
                null,
                null)).Controller);

        BridgeControllerLeaseResponse released = coordinator.Release(new BridgeControllerLeaseRequest(
            first.Client.ClientSessionId,
            firstLease.ControllerLeaseId,
            firstLease.ControllerGeneration));
        BridgeControllerLeaseInfo secondLease = Assert.IsType<BridgeControllerLeaseInfo>(
            coordinator.Acquire(new BridgeControllerLeaseRequest(
                second.Client.ClientSessionId,
                null,
                null)).Controller);

        Assert.Equal("controller_released", released.Status);
        Assert.True(secondLease.ControllerGeneration > firstLease.ControllerGeneration);
        Assert.NotEqual(firstLease.ControllerLeaseId, secondLease.ControllerLeaseId);
    }

    [Fact]
    public void ExpiredLeaseRejectsOldGenerationAndAllowsNewAcquire()
    {
        DateTimeOffset now = new(2026, 7, 25, 0, 0, 0, TimeSpan.Zero);
        var coordinator = new BridgeClientCoordinator("runtime-a", 1_000, () => now);
        BridgeClientRegistrationResponse client = coordinator.Register(Client("instance-a", "Agent A"));
        BridgeControllerLeaseInfo firstLease = Assert.IsType<BridgeControllerLeaseInfo>(
            coordinator.Acquire(new BridgeControllerLeaseRequest(
                client.Client.ClientSessionId,
                null,
                null)).Controller);
        now = now.AddMilliseconds(1_001);

        BridgeCommandAdmission stale = coordinator.Authorize(Command(client, firstLease));
        BridgeControllerLeaseInfo nextLease = Assert.IsType<BridgeControllerLeaseInfo>(
            coordinator.Acquire(new BridgeControllerLeaseRequest(
                client.Client.ClientSessionId,
                null,
                null)).Controller);

        Assert.False(stale.Accepted);
        Assert.Equal("controller_lease_stale", stale.ErrorCode);
        Assert.True(nextLease.ControllerGeneration > firstLease.ControllerGeneration);
    }

    [Fact]
    public void CommandAttributionIsBoundToRuntimeClientAndGeneration()
    {
        var coordinator = new BridgeClientCoordinator("runtime-a");
        BridgeClientRegistrationResponse client = coordinator.Register(Client("instance-a", "Agent A"));
        BridgeControllerLeaseInfo lease = Assert.IsType<BridgeControllerLeaseInfo>(
            coordinator.Acquire(new BridgeControllerLeaseRequest(
                client.Client.ClientSessionId,
                null,
                null)).Controller);

        BridgeCommandAdmission admission = coordinator.Authorize(Command(client, lease));

        Assert.True(admission.Accepted);
        Assert.Equal("runtime-a", admission.Attribution?.RuntimeInstanceId);
        Assert.Equal("instance-a", admission.Attribution?.ClientInstanceId);
        Assert.Equal(lease.ControllerGeneration, admission.Attribution?.ControllerGeneration);
    }

    [Fact]
    public void RegistrationIdentityIsIdempotentButMetadataCannotDrift()
    {
        var coordinator = new BridgeClientCoordinator("runtime-a");
        BridgeClientRegistrationResponse first = coordinator.Register(Client("instance-a", "Agent A"));
        BridgeClientRegistrationResponse duplicate = coordinator.Register(Client("instance-a", "Agent A"));

        Assert.Equal(first.Client.ClientSessionId, duplicate.Client.ClientSessionId);
        Assert.Throws<InvalidOperationException>(() =>
            coordinator.Register(Client("instance-a", "Different Agent")));
    }

    private static BridgeClientRegistrationRequest Client(string instanceId, string name) =>
        new(instanceId, "test-agent", name, "1.0.0");

    private static BridgeCommandRequest Command(
        BridgeClientRegistrationResponse client,
        BridgeControllerLeaseInfo lease) =>
        new("request-a", "state-a", "action-a")
        {
            ClientSessionId = client.Client.ClientSessionId,
            ControllerLeaseId = lease.ControllerLeaseId,
            ControllerGeneration = lease.ControllerGeneration
        };
}
