using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.Tests;

public sealed class BridgeCommandLedgerTests
{
    [Fact]
    public void StaleStateIsRejectedBeforeActionStarts()
    {
        int starts = 0;
        var ledger = new BridgeCommandLedger(10_000);
        RegisteredBridgeAction action = Action("state-old", "action-a", () =>
        {
            starts++;
            return BridgeActionStartResult.Started();
        });

        BridgeCommandResponse result = ledger.Submit(
            new BridgeCommandRequest("request-a", "state-old", "action-a"),
            "state-current",
            action);

        Assert.Equal("rejected", result.Status);
        Assert.Equal("stale_state", result.Events[^1].ErrorCode);
        Assert.Equal(0, starts);
    }

    [Fact]
    public void DuplicateRequestIsIdempotent()
    {
        int starts = 0;
        var ledger = new BridgeCommandLedger(10_000);
        RegisteredBridgeAction action = Action("state-a", "action-a", () =>
        {
            starts++;
            return BridgeActionStartResult.Started();
        });
        var request = new BridgeCommandRequest("request-a", "state-a", "action-a");

        BridgeCommandResponse first = ledger.Submit(request, "state-a", action);
        BridgeCommandResponse duplicate = ledger.Submit(request, "state-a", action);

        Assert.Equal("started", first.Status);
        Assert.Equal(first.RequestId, duplicate.RequestId);
        Assert.Equal(first.ExpectedStateId, duplicate.ExpectedStateId);
        Assert.Equal(first.ActionId, duplicate.ActionId);
        Assert.Equal(first.Status, duplicate.Status);
        Assert.Equal(first.Outcome, duplicate.Outcome);
        Assert.Equal(first.Events, duplicate.Events);
        Assert.Equal(1, starts);
    }

    [Fact]
    public void StateTransitionCompletesStartedCommand()
    {
        var ledger = new BridgeCommandLedger(10_000);
        RegisteredBridgeAction action = Action(
            "state-a",
            "action-a",
            () => BridgeActionStartResult.Started());

        ledger.Submit(
            new BridgeCommandRequest("request-a", "state-a", "action-a"),
            "state-a",
            action);
        BridgeCommandResponse? completed = ledger.Poll("request-a", "state-b");

        Assert.NotNull(completed);
        Assert.Equal("completed", completed.Status);
        Assert.Equal("confirmed", completed.Outcome);
        Assert.Equal("state_changed_after_action_start", completed.Events[^1].Evidence);
    }

    [Fact]
    public void NoObservedTransitionTimesOutWithUnknownOutcome()
    {
        DateTimeOffset now = new(2026, 7, 16, 0, 0, 0, TimeSpan.Zero);
        var ledger = new BridgeCommandLedger(1_000, () => now);
        RegisteredBridgeAction action = Action(
            "state-a",
            "action-a",
            () => BridgeActionStartResult.Started());

        ledger.Submit(
            new BridgeCommandRequest("request-a", "state-a", "action-a"),
            "state-a",
            action);
        now = now.AddMilliseconds(1_001);
        BridgeCommandResponse? timedOut = ledger.Poll("request-a", "state-a");

        Assert.NotNull(timedOut);
        Assert.Equal("timed_out", timedOut.Status);
        Assert.Equal("unknown", timedOut.Outcome);
        Assert.Equal("outcome_not_observed", timedOut.Events[^1].ErrorCode);
    }

    [Fact]
    public void ActionSpecificProbeCanCompleteWithoutGenericStateGuessing()
    {
        bool completed = false;
        var ledger = new BridgeCommandLedger(10_000);
        RegisteredBridgeAction action = Action(
            "state-a",
            "action-a",
            () => BridgeActionStartResult.Started(
                () => completed,
                "fixture_predicate_passed"));

        ledger.Submit(
            new BridgeCommandRequest("request-a", "state-a", "action-a"),
            "state-a",
            action);
        completed = true;
        BridgeCommandResponse? result = ledger.Poll("request-a", "state-a");

        Assert.NotNull(result);
        Assert.Equal("completed", result.Status);
        Assert.Equal("fixture_predicate_passed", result.Events[^1].Evidence);
    }

    [Fact]
    public void UnexplainedStateChangeDoesNotMasqueradeAsCompletion()
    {
        var ledger = new BridgeCommandLedger(10_000);
        RegisteredBridgeAction action = Action(
            "state-a",
            "action-a",
            () => BridgeActionStartResult.Started(() => false, "never"));

        ledger.Submit(
            new BridgeCommandRequest("request-a", "state-a", "action-a"),
            "state-a",
            action);
        BridgeCommandResponse? result = ledger.Poll("request-a", "state-b");

        Assert.NotNull(result);
        Assert.Equal("failed", result.Status);
        Assert.Equal("unknown", result.Outcome);
        Assert.Equal("unexpected_state_transition", result.Events[^1].ErrorCode);
    }

    [Fact]
    public void ExplicitAsyncProbeMayCrossIntermediateStatesBeforeExactCompletion()
    {
        bool completed = false;
        var ledger = new BridgeCommandLedger(10_000);
        RegisteredBridgeAction action = Action(
            "state-a",
            "action-a",
            () => BridgeActionStartResult.Started(
                () => completed,
                "exact_async_completion",
                allowIntermediateStateChanges: true));

        ledger.Submit(
            new BridgeCommandRequest("request-a", "state-a", "action-a"),
            "state-a",
            action);
        BridgeCommandResponse? intermediate = ledger.Poll("request-a", "state-traveling");

        Assert.NotNull(intermediate);
        Assert.Equal("started", intermediate.Status);
        Assert.Equal("pending", intermediate.Outcome);

        completed = true;
        BridgeCommandResponse? result = ledger.Poll("request-a", "state-room-entered");
        Assert.NotNull(result);
        Assert.Equal("completed", result.Status);
        Assert.Equal("confirmed", result.Outcome);
        Assert.Equal("exact_async_completion", result.Events[^1].Evidence);
    }

    [Fact]
    public void ReusedRequestIdWithDifferentPayloadIsRejected()
    {
        var ledger = new BridgeCommandLedger(10_000);
        RegisteredBridgeAction action = Action(
            "state-a",
            "action-a",
            () => BridgeActionStartResult.Started());
        ledger.Submit(
            new BridgeCommandRequest("request-a", "state-a", "action-a"),
            "state-a",
            action);

        BridgeCommandResponse conflict = ledger.Submit(
            new BridgeCommandRequest("request-a", "state-a", "action-b"),
            "state-a",
            null);

        Assert.Equal("rejected", conflict.Status);
        Assert.Equal("request_id_conflict", conflict.Events[^1].ErrorCode);
    }

    private static RegisteredBridgeAction Action(
        string stateId,
        string actionId,
        Func<BridgeActionStartResult> start)
    {
        return new RegisteredBridgeAction(
            new LegalAction(
                actionId,
                stateId,
                "test",
                "test",
                "Test action",
                "game_ui",
                "fixture",
                Array.Empty<ActionEntityBinding>()),
            start);
    }
}
