using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.Authority;
using STS2_MCP.HumanEnvironment.Protocol;
using STS2_MCP.HumanEnvironment.Runtime;
using System.Text.Json;

namespace STS2_MCP.Tests;

public sealed class HumanEnvironmentNativePageEvidenceTests
{
    [Fact]
    public void GatewayAuthorityOwnsTheProtocolNeutralHostIdentity()
    {
        GatewayHostIdentity identity = GatewayAuthorityRuntime.HostIdentity();

        Assert.Equal("sts2_human_environment_gateway", identity.Id);
        Assert.Equal("STS2 Human Environment Gateway", identity.Name);
        Assert.False(string.IsNullOrWhiteSpace(identity.ModuleVersionId));
        Assert.False(string.IsNullOrWhiteSpace(identity.RuntimeInstanceId));
    }

    [Fact]
    public void MutationControlUsesTheProtocolNeutralAuthorityContract()
    {
        MutationControlSnapshot snapshot = MutationControlRuntime.Snapshot();

        Assert.Equal(GatewayAuthorityContract.ControlProtocol, snapshot.ProtocolVersion);
        Assert.Equal(
            GatewayAuthorityRuntime.HostIdentity().RuntimeInstanceId,
            snapshot.RuntimeInstanceId);
        Assert.False(string.IsNullOrWhiteSpace(snapshot.RuntimeInstanceId));
    }

    [Fact]
    public void DisabledAndStaleProfilesFailClosedBeforeOpeningNativeUi()
    {
        var environment = new FakeHumanEnvironment();
        var machine = new HumanEnvironmentNativePageSession(environment);
        HumanEnvironmentNativePageOpenRequest request = Request();

        HumanEnvironmentNativePageOperationResult disabled = machine.Open(request);
        Assert.Equal("native_page_evidence_disabled", disabled.ErrorCode);
        Assert.Equal(0, environment.OpenCount);

        machine.Configure(enabled: true);
        HumanEnvironmentNativePageOperationResult stale = machine.Open(
            request with { ExpectedSnapshotId = "state-stale" });
        Assert.Equal("stale_state", stale.ErrorCode);
        Assert.Equal(0, environment.OpenCount);

        HumanEnvironmentNativePageOperationResult runtime = machine.Open(
            request with { ExpectedRuntimeInstanceId = "runtime-stale" });
        Assert.Equal("runtime_instance_changed", runtime.ErrorCode);
        Assert.Equal(0, environment.OpenCount);
    }

    [Fact]
    public void OpenReadReturnIsRuntimeBoundAndNeverAuthorizesMutation()
    {
        var environment = new FakeHumanEnvironment();
        var machine = new HumanEnvironmentNativePageSession(environment);
        machine.Configure(enabled: true);

        HumanEnvironmentNativePageResponse opened =
            Assert.IsType<HumanEnvironmentNativePageResponse>(
                machine.Open(Request()).Response);
        Assert.Equal("open", opened.Phase);
        Assert.False(opened.CreatesMutationAuthority);
        Assert.False(opened.EntersActionLedger);
        Assert.True(machine.ReservesInputOwner);
        Assert.Equal("run_deck", opened.Page?.ReadKind);

        HumanEnvironmentNativePageOperationResult wrongRuntime = machine.Read(
            opened.SessionId,
            "runtime-other");
        Assert.Equal("runtime_instance_changed", wrongRuntime.ErrorCode);

        HumanEnvironmentNativePageResponse read =
            Assert.IsType<HumanEnvironmentNativePageResponse>(
                machine.Read(opened.SessionId, "runtime-a").Response);
        Assert.Equal("open", read.Phase);
        Assert.Equal(1, environment.ReadCount);

        HumanEnvironmentNativePageResponse returned =
            Assert.IsType<HumanEnvironmentNativePageResponse>(
                machine.Return(
                    opened.SessionId,
                    new HumanEnvironmentNativePageReturnRequest(
                        HumanEnvironmentContract.NativePageEvidenceProfile,
                        "runtime-a")).Response);
        Assert.Equal("returned", returned.Phase);
        Assert.Equal("state-a", returned.PostSnapshotId);
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
        var machine = new HumanEnvironmentNativePageSession(environment);
        machine.Configure(enabled: true);
        HumanEnvironmentNativePageResponse opened = machine.Open(Request()).Response!;
        var request = new HumanEnvironmentNativePageReturnRequest(
            HumanEnvironmentContract.NativePageEvidenceProfile,
            "runtime-a");

        HumanEnvironmentNativePageResponse blocked =
            machine.Return(opened.SessionId, request).Response!;
        Assert.Equal("recovery_required", blocked.Phase);
        Assert.Equal("native_return_control_unavailable", blocked.ErrorCode);
        Assert.True(machine.ReservesInputOwner);

        HumanEnvironmentNativePageResponse recovered =
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
        var machine = new HumanEnvironmentNativePageSession(environment);
        machine.Configure(enabled: true);

        HumanEnvironmentNativePageResponse blocked = machine.Open(Request()).Response!;
        Assert.Equal("recovery_required", blocked.Phase);
        Assert.Equal("native_page_recovery_required", blocked.ErrorCode);
        Assert.True(machine.ReservesInputOwner);

        HumanEnvironmentNativePageResponse recovered = machine.Return(
            blocked.SessionId,
            new HumanEnvironmentNativePageReturnRequest(
                HumanEnvironmentContract.NativePageEvidenceProfile,
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
        var machine = new HumanEnvironmentNativePageSession(environment);
        machine.Configure(enabled: true);

        HumanEnvironmentNativePageResponse blocked = machine.Open(Request()).Response!;
        Assert.Equal("recovery_required", blocked.Phase);
        Assert.True(machine.ReservesInputOwner);
        Assert.Equal(1, environment.ReturnCount);

        HumanEnvironmentNativePageResponse recovered = machine.Read(
            blocked.SessionId,
            "runtime-a").Response!;
        Assert.Equal("returned", recovered.Phase);
        Assert.False(machine.ReservesInputOwner);
    }

    private static HumanEnvironmentNativePageOpenRequest Request() => new(
        HumanEnvironmentContract.NativePageEvidenceProfile,
        HumanEnvironmentNativePageSession.RunDeckKind,
        "state-a",
        "runtime-a");

    private sealed class FakeHumanEnvironment :
        IHumanEnvironmentNativePageHost
    {
        private static readonly HumanEnvironmentNativePageOwner PreOwner =
            new("map", "map_navigation", "semantic:map:map_navigation");
        private static readonly HumanEnvironmentNativePageOwner PageOwner =
            new("map", "unsupported", "capstone:deck:page-a");
        private HumanEnvironmentNativePageRuntimeSnapshot _snapshot =
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

        public HumanEnvironmentNativePageRuntimeSnapshot Capture()
        {
            if (_throwNextCapture)
            {
                _throwNextCapture = false;
                throw new InvalidOperationException("fixture post-open capture failure");
            }
            return _snapshot;
        }

        public HumanEnvironmentNativePageResult Open(
            string kind,
            HumanEnvironmentNativePageRuntimeSnapshot pre)
        {
            OpenCount++;
            HasOwnedPage = true;
            _snapshot = Snapshot("state-page", PageOwner);
            _throwNextCapture = ThrowOnPostOpenCapture;
            if (FailOpenWithOwnedPage)
            {
                return HumanEnvironmentNativePageResult.Failure(
                    "native_page_recovery_required",
                    "fixture partial open failure");
            }
            return HumanEnvironmentNativePageResult.Success(Page());
        }

        public HumanEnvironmentNativePageResult Read(string kind)
        {
            ReadCount++;
            return HumanEnvironmentNativePageResult.Success(Page());
        }

        public HumanEnvironmentNativePageResult Return(string kind)
        {
            ReturnCount++;
            if (FailFirstReturn && ReturnCount == 1)
            {
                return HumanEnvironmentNativePageResult.Failure(
                    "native_return_control_unavailable",
                    "fixture failure");
            }
            HasOwnedPage = false;
            _snapshot = Snapshot("state-a", PreOwner);
            return new HumanEnvironmentNativePageResult(null, null, null);
        }

        public void Reset()
        {
            HasOwnedPage = false;
            ResetCount++;
        }

        private static HumanEnvironmentNativePageRuntimeSnapshot Snapshot(
            string state,
            HumanEnvironmentNativePageOwner owner) => new(
                state,
                "runtime-a",
                owner,
                null!,
                null!,
                new[] { STS2_MCP.LiveHost.PlayerVisibleReadBuilder.RunDeckKind });

        private static HumanEnvironmentNativePageRead Page() => new(
            "fixture.deck.page",
            "run_deck",
            0,
            Array.Empty<string>(),
            "sts2.he/read.run-deck-1",
            JsonSerializer.SerializeToNode(
                new RunDeckInspectionContent(
                    "run_deck",
                    0,
                    Array.Empty<VisibleCard>()))!,
            new HumanEnvironmentCompleteness(
                "complete",
                "fixture visible information",
                "fixture discovery",
                Array.Empty<string>(),
                Array.Empty<string>()),
            new[] { "fixture" });
    }
}
