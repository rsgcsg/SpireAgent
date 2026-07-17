using System;
using System.Collections.Generic;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal sealed class BridgeCommandLedger
{
    private const int MaxCommandsPerBridgeSession = 4096;
    private readonly object _gate = new();
    private readonly Dictionary<string, MutableCommand> _commands = new(StringComparer.Ordinal);
    private readonly TimeSpan _outcomeTimeout;
    private readonly Func<DateTimeOffset> _clock;

    public BridgeCommandLedger(int outcomeTimeoutMs, Func<DateTimeOffset>? clock = null)
    {
        _outcomeTimeout = TimeSpan.FromMilliseconds(outcomeTimeoutMs);
        _clock = clock ?? (() => DateTimeOffset.UtcNow);
    }

    public BridgeCommandResponse Submit(
        BridgeCommandRequest request,
        string currentStateId,
        RegisteredBridgeAction? action)
    {
        string requestId = request.RequestId ?? string.Empty;
        string expectedStateId = request.ExpectedStateId ?? string.Empty;
        string actionId = request.ActionId ?? string.Empty;

        lock (_gate)
        {
            if (_commands.TryGetValue(requestId, out MutableCommand? existing))
            {
                return existing.ExpectedStateId == expectedStateId && existing.ActionId == actionId
                    ? existing.ToResponse()
                    : ConflictResponse(requestId, expectedStateId, actionId);
            }

            if (_commands.Count >= MaxCommandsPerBridgeSession)
            {
                return RejectedResponse(
                    requestId,
                    expectedStateId,
                    actionId,
                    "command_capacity_exhausted",
                    "The bridge session command ledger is full. Restart the game bridge before submitting more actions.");
            }

            var command = new MutableCommand(requestId, expectedStateId, actionId, _clock());
            _commands[requestId] = command;

            if (!string.Equals(expectedStateId, currentStateId, StringComparison.Ordinal))
            {
                command.Reject(
                    "stale_state",
                    $"Expected state '{expectedStateId}' but current state is '{currentStateId}'.",
                    currentStateId,
                    _clock());
                return command.ToResponse();
            }

            if (action == null || action.Descriptor.StateId != expectedStateId)
            {
                command.Reject(
                    "unknown_or_stale_action",
                    "The action is not registered for the expected state.",
                    currentStateId,
                    _clock());
                return command.ToResponse();
            }

            command.Validate(currentStateId, _clock());

            try
            {
                BridgeActionStartResult start = action.Start();
                if (start.Accepted)
                    command.Start(
                        currentStateId,
                        _clock(),
                        start.CompletionProbe,
                        start.CompletionEvidence,
                        start.AllowIntermediateStateChanges);
                else
                    command.Reject(
                        start.ErrorCode ?? "action_rejected",
                        start.Detail ?? "Action rejected.",
                        currentStateId,
                        _clock());
            }
            catch (Exception ex)
            {
                command.Fail(
                    "action_start_exception",
                    $"{ex.GetType().Name}: {ex.Message}",
                    currentStateId,
                    _clock());
            }

            return command.ToResponse();
        }
    }

    public BridgeCommandResponse? Poll(string requestId, string currentStateId)
    {
        lock (_gate)
        {
            if (!_commands.TryGetValue(requestId, out MutableCommand? command))
                return null;

            DateTimeOffset now = _clock();
            if (command.Status == "started")
            {
                try
                {
                    if (command.CompletionProbe?.Invoke() == true)
                    {
                        command.Complete(
                            command.CompletionEvidence ?? "action_specific_completion_probe",
                            currentStateId,
                            now);
                    }
                    else if (command.CompletionProbe == null
                             && !string.Equals(command.ExpectedStateId, currentStateId, StringComparison.Ordinal))
                    {
                        command.Complete("state_changed_after_action_start", currentStateId, now);
                    }
                    else if (command.CompletionProbe != null
                             && !command.AllowIntermediateStateChanges
                             && !string.Equals(command.ExpectedStateId, currentStateId, StringComparison.Ordinal))
                    {
                        command.Fail(
                            "unexpected_state_transition",
                            "State changed, but the action-specific completion predicate did not pass.",
                            currentStateId,
                            now);
                    }
                    else if (command.StartedAt is { } startedAt && now - startedAt > _outcomeTimeout)
                    {
                        command.Timeout(
                            "No action-specific completion evidence was observed before the command timeout.",
                            currentStateId,
                            now);
                    }
                }
                catch (Exception ex)
                {
                    command.Fail(
                        "completion_probe_failed",
                        $"{ex.GetType().Name}: {ex.Message}",
                        currentStateId,
                        now);
                }
            }

            return command.ToResponse();
        }
    }

    private BridgeCommandResponse ConflictResponse(
        string requestId,
        string expectedStateId,
        string actionId)
    {
        return RejectedResponse(
            requestId,
            expectedStateId,
            actionId,
            "request_id_conflict",
            "This request_id was already used with different command parameters.");
    }

    private BridgeCommandResponse RejectedResponse(
        string requestId,
        string expectedStateId,
        string actionId,
        string errorCode,
        string detail)
    {
        return new BridgeCommandResponse(
            requestId,
            expectedStateId,
            actionId,
            "rejected",
            "not_applied",
            null,
            new[] { new BridgeCommandEvent("rejected", _clock(), null, errorCode, detail) });
    }

    private sealed class MutableCommand
    {
        private readonly List<BridgeCommandEvent> _events = new();

        public MutableCommand(string requestId, string expectedStateId, string actionId, DateTimeOffset now)
        {
            RequestId = requestId;
            ExpectedStateId = expectedStateId;
            ActionId = actionId;
            Status = "received";
            Outcome = "pending";
            _events.Add(new BridgeCommandEvent("received", now, "request_recorded", null, null));
        }

        public string RequestId { get; }
        public string ExpectedStateId { get; }
        public string ActionId { get; }
        public string Status { get; private set; }
        public string Outcome { get; private set; }
        public string? ObservedStateId { get; private set; }
        public DateTimeOffset? StartedAt { get; private set; }
        public Func<bool>? CompletionProbe { get; private set; }
        public string? CompletionEvidence { get; private set; }
        public bool AllowIntermediateStateChanges { get; private set; }

        public void Validate(string observedStateId, DateTimeOffset now)
        {
            Status = "validated";
            ObservedStateId = observedStateId;
            _events.Add(new BridgeCommandEvent("validated", now, "state_and_action_revalidated", null, null));
        }

        public void Start(
            string observedStateId,
            DateTimeOffset now,
            Func<bool>? completionProbe,
            string? completionEvidence,
            bool allowIntermediateStateChanges)
        {
            Status = "started";
            Outcome = "pending";
            ObservedStateId = observedStateId;
            StartedAt = now;
            CompletionProbe = completionProbe;
            CompletionEvidence = completionEvidence;
            AllowIntermediateStateChanges = allowIntermediateStateChanges;
            _events.Add(new BridgeCommandEvent("started", now, "ui_interaction_started", null, null));
        }

        public void Complete(string evidence, string observedStateId, DateTimeOffset now)
        {
            Status = "completed";
            Outcome = "confirmed";
            ObservedStateId = observedStateId;
            _events.Add(new BridgeCommandEvent("completed", now, evidence, null, null));
        }

        public void Reject(string code, string detail, string? observedStateId, DateTimeOffset now)
        {
            Status = "rejected";
            Outcome = "not_applied";
            ObservedStateId = observedStateId;
            _events.Add(new BridgeCommandEvent("rejected", now, null, code, detail));
        }

        public void Fail(string code, string detail, string? observedStateId, DateTimeOffset now)
        {
            Status = "failed";
            Outcome = "unknown";
            ObservedStateId = observedStateId;
            _events.Add(new BridgeCommandEvent("failed", now, null, code, detail));
        }

        public void Timeout(string detail, string observedStateId, DateTimeOffset now)
        {
            Status = "timed_out";
            Outcome = "unknown";
            ObservedStateId = observedStateId;
            _events.Add(new BridgeCommandEvent("timed_out", now, null, "outcome_not_observed", detail));
        }

        public BridgeCommandResponse ToResponse() => new(
            RequestId,
            ExpectedStateId,
            ActionId,
            Status,
            Outcome,
            ObservedStateId,
            _events.ToArray());
    }
}
