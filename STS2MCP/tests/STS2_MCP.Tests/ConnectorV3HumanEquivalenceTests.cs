using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.ConnectorV3.Protocol;
using STS2_MCP.ConnectorV3.Runtime;

namespace STS2_MCP.Tests;

public sealed class ConnectorV3HumanEquivalenceTests
{
    [Fact]
    public void V3ProjectsAProtocolNeutralGatewayIdentity()
    {
        var internalIdentity = new BridgeServerIdentity(
            "internal",
            "Internal",
            "test",
            "upstream",
            "mvid",
            "runtime");

        BridgeServerIdentity projected =
            ConnectorV3Runtime.GatewayIdentity(internalIdentity);

        Assert.Equal(ConnectorV3Contract.GatewayId, projected.Id);
        Assert.Equal(ConnectorV3Contract.GatewayName, projected.Name);
        Assert.Equal(internalIdentity.ModuleVersionId, projected.ModuleVersionId);
        Assert.Equal(internalIdentity.RuntimeInstanceId, projected.RuntimeInstanceId);
    }

    [Fact]
    public void V3ControlSnapshotUsesOnlyTheV3WireContract()
    {
        ConnectorV3ControlSnapshot snapshot =
            ConnectorV3Runtime.GetControlSnapshot();

        Assert.Equal(ConnectorV3Contract.ProtocolVersion, snapshot.ProtocolVersion);
        Assert.Equal(ConnectorV3Contract.ControlSchema, snapshot.Schema);
        Assert.False(string.IsNullOrWhiteSpace(snapshot.RuntimeInstanceId));
    }

    [Fact]
    public void DisabledAndStaleProfilesFailClosedBeforeOpeningNativeUi()
    {
        var environment = new FakeHumanEnvironment();
        var machine = new ConnectorV3HumanEquivalenceSessionMachine(environment);
        ConnectorV3HumanEquivalenceOpenRequest request = Request();

        ConnectorV3HumanEquivalenceOperationResult disabled = machine.Open(request);
        Assert.Equal("human_equivalence_disabled", disabled.ErrorCode);
        Assert.Equal(0, environment.OpenCount);

        machine.Configure(enabled: true);
        ConnectorV3HumanEquivalenceOperationResult stale = machine.Open(
            request with { ExpectedStateToken = "state-stale" });
        Assert.Equal("stale_state", stale.ErrorCode);
        Assert.Equal(0, environment.OpenCount);

        ConnectorV3HumanEquivalenceOperationResult runtime = machine.Open(
            request with { ExpectedRuntimeInstanceId = "runtime-stale" });
        Assert.Equal("runtime_instance_changed", runtime.ErrorCode);
        Assert.Equal(0, environment.OpenCount);
    }

    [Fact]
    public void OpenReadReturnIsRuntimeBoundAndNeverAuthorizesMutation()
    {
        var environment = new FakeHumanEnvironment();
        var machine = new ConnectorV3HumanEquivalenceSessionMachine(environment);
        machine.Configure(enabled: true);

        ConnectorV3HumanEquivalenceResponse opened =
            Assert.IsType<ConnectorV3HumanEquivalenceResponse>(
                machine.Open(Request()).Response);
        Assert.Equal("open", opened.Phase);
        Assert.False(opened.CreatesActionAuthority);
        Assert.False(opened.EntersCommandLedger);
        Assert.True(machine.ReservesInputOwner);
        Assert.Equal("run_deck", opened.Page?.InspectionKind);

        ConnectorV3HumanEquivalenceOperationResult wrongRuntime = machine.Read(
            opened.SessionId,
            "runtime-other");
        Assert.Equal("runtime_instance_changed", wrongRuntime.ErrorCode);

        ConnectorV3HumanEquivalenceResponse read =
            Assert.IsType<ConnectorV3HumanEquivalenceResponse>(
                machine.Read(opened.SessionId, "runtime-a").Response);
        Assert.Equal("open", read.Phase);
        Assert.Equal(1, environment.ReadCount);

        ConnectorV3HumanEquivalenceResponse returned =
            Assert.IsType<ConnectorV3HumanEquivalenceResponse>(
                machine.Return(
                    opened.SessionId,
                    new ConnectorV3HumanEquivalenceReturnRequest(
                        ConnectorV3Contract.HumanEquivalenceProfile,
                        "runtime-a")).Response);
        Assert.Equal("returned", returned.Phase);
        Assert.Equal("state-a", returned.PostStateToken);
        Assert.Equal(returned.PreOwner, returned.PostOwner);
        Assert.False(machine.ReservesInputOwner);
        Assert.Equal(1, environment.ResetCount);
    }

    [Fact]
    public void FailedReturnKeepsInputReservedUntilExactRecoverySucceeds()
    {
        var environment = new FakeHumanEnvironment
        {
            FailFirstReturn = true
        };
        var machine = new ConnectorV3HumanEquivalenceSessionMachine(environment);
        machine.Configure(enabled: true);
        ConnectorV3HumanEquivalenceResponse opened = machine.Open(Request()).Response!;
        var request = new ConnectorV3HumanEquivalenceReturnRequest(
            ConnectorV3Contract.HumanEquivalenceProfile,
            "runtime-a");

        ConnectorV3HumanEquivalenceResponse blocked =
            machine.Return(opened.SessionId, request).Response!;
        Assert.Equal("recovery_required", blocked.Phase);
        Assert.Equal("native_return_control_unavailable", blocked.ErrorCode);
        Assert.True(machine.ReservesInputOwner);

        ConnectorV3HumanEquivalenceResponse recovered =
            machine.Return(opened.SessionId, request).Response!;
        Assert.Equal("returned", recovered.Phase);
        Assert.False(machine.ReservesInputOwner);
        Assert.Equal(2, environment.ReturnCount);
    }

    [Fact]
    public void PartialOpenFailureKeepsInputReservedUntilExactRecoverySucceeds()
    {
        var environment = new FakeHumanEnvironment
        {
            FailOpenWithOwnedPage = true
        };
        var machine = new ConnectorV3HumanEquivalenceSessionMachine(environment);
        machine.Configure(enabled: true);

        ConnectorV3HumanEquivalenceResponse blocked = machine.Open(Request()).Response!;
        Assert.Equal("recovery_required", blocked.Phase);
        Assert.Equal("native_page_recovery_required", blocked.ErrorCode);
        Assert.True(machine.ReservesInputOwner);

        ConnectorV3HumanEquivalenceResponse recovered = machine.Return(
            blocked.SessionId,
            new ConnectorV3HumanEquivalenceReturnRequest(
                ConnectorV3Contract.HumanEquivalenceProfile,
                "runtime-a")).Response!;
        Assert.Equal("returned", recovered.Phase);
        Assert.False(machine.ReservesInputOwner);
    }

    [Fact]
    public void PostOpenVerificationFailureRequiresRestorationPollBeforeRelease()
    {
        var environment = new FakeHumanEnvironment
        {
            ThrowOnPostOpenCapture = true
        };
        var machine = new ConnectorV3HumanEquivalenceSessionMachine(environment);
        machine.Configure(enabled: true);

        ConnectorV3HumanEquivalenceResponse blocked = machine.Open(Request()).Response!;
        Assert.Equal("recovery_required", blocked.Phase);
        Assert.True(machine.ReservesInputOwner);
        Assert.Equal(1, environment.ReturnCount);

        ConnectorV3HumanEquivalenceResponse recovered = machine.Read(
            blocked.SessionId,
            "runtime-a").Response!;
        Assert.Equal("returned", recovered.Phase);
        Assert.False(machine.ReservesInputOwner);
    }

    private static ConnectorV3HumanEquivalenceOpenRequest Request() => new(
        ConnectorV3Contract.HumanEquivalenceProfile,
        ConnectorV3HumanEquivalenceSessionMachine.RunDeckKind,
        "state-a",
        "runtime-a");

    private sealed class FakeHumanEnvironment :
        IConnectorV3HumanEquivalenceEnvironment
    {
        private static readonly ConnectorV3HumanEquivalenceOwner PreOwner =
            new("map", "map_navigation", "semantic:map:map_navigation");
        private static readonly ConnectorV3HumanEquivalenceOwner PageOwner =
            new("map", "unsupported", "capstone:deck:page-a");
        private ConnectorV3HumanEquivalenceRuntimeSnapshot _snapshot =
            Snapshot("state-a", PreOwner);

        public int OpenCount { get; private set; }
        public int ReadCount { get; private set; }
        public int ReturnCount { get; private set; }
        public int ResetCount { get; private set; }
        public bool FailFirstReturn { get; init; }
        public bool FailOpenWithOwnedPage { get; init; }
        public bool ThrowOnPostOpenCapture { get; init; }
        public bool HasOwnedPage { get; private set; }
        private bool _throwNextCapture;

        public ConnectorV3HumanEquivalenceRuntimeSnapshot Capture()
        {
            if (_throwNextCapture)
            {
                _throwNextCapture = false;
                throw new InvalidOperationException("fixture post-open capture failure");
            }
            return _snapshot;
        }

        public ConnectorV3HumanEquivalencePageResult Open(
            string kind,
            ConnectorV3HumanEquivalenceRuntimeSnapshot pre)
        {
            OpenCount++;
            HasOwnedPage = true;
            _snapshot = Snapshot("state-page", PageOwner);
            _throwNextCapture = ThrowOnPostOpenCapture;
            if (FailOpenWithOwnedPage)
            {
                return ConnectorV3HumanEquivalencePageResult.Failure(
                    "native_page_recovery_required",
                    "fixture partial open failure");
            }
            return ConnectorV3HumanEquivalencePageResult.Success(Page());
        }

        public ConnectorV3HumanEquivalencePageResult Read(string kind)
        {
            ReadCount++;
            return ConnectorV3HumanEquivalencePageResult.Success(Page());
        }

        public ConnectorV3HumanEquivalencePageResult Return(string kind)
        {
            ReturnCount++;
            if (FailFirstReturn && ReturnCount == 1)
            {
                return ConnectorV3HumanEquivalencePageResult.Failure(
                    "native_return_control_unavailable",
                    "fixture failure");
            }
            HasOwnedPage = false;
            _snapshot = Snapshot("state-a", PreOwner);
            return new ConnectorV3HumanEquivalencePageResult(null, null, null);
        }

        public void Reset()
        {
            HasOwnedPage = false;
            ResetCount++;
        }

        private static ConnectorV3HumanEquivalenceRuntimeSnapshot Snapshot(
            string state,
            ConnectorV3HumanEquivalenceOwner owner) => new(
                state,
                "runtime-a",
                owner,
                null!,
                null!,
                new[] { STS2_MCP.BridgeV2.Game.BridgeInspectionBuilder.RunDeckKind });

        private static ConnectorV3HumanEquivalencePageRead Page() => new(
            "fixture.deck.page",
            "run_deck",
            0,
            Array.Empty<string>(),
            new RunDeckInspectionContent("run_deck", 0, Array.Empty<VisibleCard>()),
            new InspectionCompleteness(
                "complete",
                Array.Empty<string>(),
                Array.Empty<string>()),
            new[] { "fixture" });
    }
}
