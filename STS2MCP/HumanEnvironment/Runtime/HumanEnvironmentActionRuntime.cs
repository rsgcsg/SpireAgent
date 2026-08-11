using STS2_MCP.Authority;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using STS2_MCP.LiveHost;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.HumanEnvironment.Protocol;
using STS2_MCP.NativeUi;

namespace STS2_MCP.HumanEnvironment.Runtime;

internal static partial class HumanEnvironmentRuntime
{
    public static HumanEnvironmentActionReceipt SubmitHumanEnvironment(
        HumanEnvironmentActionRequest request)
    {
        string requestId = request.RequestId ?? string.Empty;
        IReadOnlyDictionary<string, string> parameters =
            new Dictionary<string, string>(StringComparer.Ordinal);
        if (string.IsNullOrWhiteSpace(requestId))
        {
            return HumanReceipt(
                requestId,
                request.BoundActionId ?? "invalid",
                "activate",
                null,
                Array.Empty<HumanEnvironmentBoundActionArgument>(),
                "not_applied",
                "not_applied",
                "invalid_request_id",
                "A bounded non-empty request_id is required.",
                null,
                null);
        }
        string fingerprint = StableIdentityHash.Object(new
        {
            request.ExpectedSnapshotId,
            request.BoundActionId,
            request.ClientSessionId,
            request.ControllerLeaseId,
            request.ControllerGeneration
        });

        lock (HumanSubmissionGate)
        {
            if (HumanRequestFingerprints.TryGetValue(requestId, out string? previousFingerprint))
            {
                if (string.Equals(previousFingerprint, fingerprint, StringComparison.Ordinal)
                    && HumanReceipts.TryGetValue(requestId, out HumanEnvironmentActionReceipt? replay))
                    return replay;
                return HumanReceipt(
                    requestId,
                    request.BoundActionId ?? "invalid",
                    "activate",
                    null,
                    Array.Empty<HumanEnvironmentBoundActionArgument>(),
                    "not_applied",
                    "not_applied",
                    "request_id_conflict",
                    "request_id was already used with a different exact action.",
                    null,
                    null);
            }

            HumanEnvironmentRuntimeSnapshot snapshot = BuildHumanEnvironmentSnapshot();
            string boundActionId = request.BoundActionId ?? string.Empty;
            HumanEnvironmentBoundAction? boundAction = snapshot.Observation.BoundActions.Actions
                .SingleOrDefault(candidate => string.Equals(
                    candidate.BoundActionId,
                    boundActionId,
                    StringComparison.Ordinal));
            HumanEnvironmentNativeBinding? binding = boundAction == null
                || !snapshot.Bindings.TryGetValue(boundActionId, out HumanEnvironmentNativeBinding? found)
                    ? null
                    : found;
            parameters = binding?.Parameters
                ?? new Dictionary<string, string>(StringComparer.Ordinal);
            string action = boundAction?.Action ?? "activate";
            string? subjectRef = boundAction?.SubjectRef;
            IReadOnlyList<HumanEnvironmentBoundActionArgument> arguments =
                boundAction?.Arguments ?? Array.Empty<HumanEnvironmentBoundActionArgument>();

            HumanRequestFingerprints[requestId] = fingerprint;
            HumanEnvironmentActionReceipt Fail(string code, string detail)
            {
                HumanEnvironmentActionReceipt failed = HumanReceipt(
                    requestId,
                    boundActionId,
                    action,
                    subjectRef,
                    arguments,
                    "not_applied",
                    "not_applied",
                    code,
                    detail,
                    snapshot.Observation,
                    null);
                HumanReceipts[requestId] = failed;
                return failed;
            }

            if (!string.Equals(snapshot.Observation.SnapshotId, request.ExpectedSnapshotId, StringComparison.Ordinal))
            {
                return Fail(
                    "stale_snapshot",
                    "The exact Human Environment snapshot changed; obtain a fresh observation.");
            }
            if (snapshot.Observation.BoundActions.Status != "complete")
                return Fail("bound_action_projection_incomplete", "The finite bound-action projection is not complete and cannot authorize input.");
            if (boundAction == null || binding == null)
                return Fail("bound_action_not_current", "The exact advertised bound action is no longer current.");
            var mutationRequest = new MutationAuthorizationRequest(
                request.ClientSessionId,
                request.ControllerLeaseId,
                request.ControllerGeneration);
            MutationAdmission admission = MutationControlRuntime.Authorize(mutationRequest);
            if (!admission.Accepted)
                return Fail(admission.ErrorCode ?? "controller_rejected", admission.Detail ?? "Mutation control was rejected.");

            NativeInputResult started;
            try
            {
                started = StartHumanEnvironmentInput(
                    snapshot,
                    binding.Command,
                    parameters);
            }
            catch (Exception exception)
            {
                HumanEnvironmentActionReceipt unknown = HumanReceipt(
                    requestId,
                    boundActionId,
                    action,
                    subjectRef,
                    arguments,
                    "unknown",
                    "unknown",
                    "input_delivery_unknown",
                    $"Native input may have been delivered before {exception.GetType().Name}; do not retry.",
                    null,
                    admission.Attribution);
                HumanReceipts[requestId] = unknown;
                return unknown;
            }
            if (!started.Accepted)
                return Fail(
                    started.ErrorCode ?? "native_input_rejected",
                    started.Detail ?? "The native UI rejected this exact input.");

            HumanEnvironmentObservationResponse? successor = null;
            string detail = "Native UI input was delivered; inspect successor for game progress.";
            try
            {
                successor = ObserveHumanEnvironment();
            }
            catch (Exception exception)
            {
                // Delivery is already known. A failed read must not be relabelled
                // as uncertain mutation; Re can safely obtain a fresh snapshot.
                detail = $"Native UI input was delivered; immediate successor read failed with {exception.GetType().Name}.";
            }
            HumanEnvironmentActionReceipt applied = HumanReceipt(
                requestId,
                boundActionId,
                action,
                subjectRef,
                arguments,
                "applied",
                "applied",
                successor == null ? "successor_observation_unavailable" : null,
                detail,
                successor,
                admission.Attribution);
            HumanReceipts[requestId] = applied;
            return applied;
        }
    }

    public static HumanEnvironmentActionReceipt? PollHumanEnvironment(string requestId) =>
        HumanReceipts.TryGetValue(requestId, out HumanEnvironmentActionReceipt? receipt)
            ? receipt
            : null;

    private static NativeInputResult StartHumanEnvironmentInput(
        HumanEnvironmentRuntimeSnapshot snapshot,
        NativeUiBoundAction binding,
        IReadOnlyDictionary<string, string> parameters)
    {
        string operation = binding.Candidate.Operation;
        if (operation == "human_select_visible_card"
            && parameters.TryGetValue("card_id", out string? cardId)
            && parameters.TryGetValue("screen_id", out string? screenId))
        {
            return HumanGeneratedCardChoiceAdapter.StartSelect(Entities, screenId, cardId);
        }
        if (operation == "human_skip_visible_choice"
            && parameters.TryGetValue("screen_id", out screenId))
            return HumanGeneratedCardChoiceAdapter.StartSkip(Entities, screenId);
        if (snapshot.Draft.Surface is HumanDeckCardSelectionSurface deckSelection)
        {
            return HumanDeckCardSelectionAdapter.Start(
                Entities,
                deckSelection,
                binding,
                parameters);
        }
        if (snapshot.Draft.Surface is HumanCombatPileSelectionSurface combatPileSelection)
        {
            return HumanCombatPileSelectionAdapter.Start(
                Entities,
                combatPileSelection,
                binding,
                parameters);
        }
        if (snapshot.Draft.Surface is RestSiteSurface restSite)
        {
            return HumanRestSiteAdapter.Start(
                Entities,
                restSite,
                binding,
                parameters);
        }

        return NativeUiActionRuntime.StartNativeUiInput(
            snapshot.Draft,
            new NativeUiInput(binding.Candidate.Command, parameters),
            binding);
    }

    private static HumanEnvironmentActionReceipt HumanReceipt(
        string requestId,
        string boundActionId,
        string action,
        string? subjectRef,
        IReadOnlyList<HumanEnvironmentBoundActionArgument> arguments,
        string status,
        string delivery,
        string? reasonCode,
        string? detail,
        HumanEnvironmentObservationResponse? successor,
        MutationAttribution? attribution) =>
        new(
            HumanEnvironmentContract.ProtocolVersion,
            HumanEnvironmentContract.ReceiptSchema,
            requestId,
            delivery,
            new HumanEnvironmentActionSummary(boundActionId, action, subjectRef, arguments),
            reasonCode,
            detail,
            new HumanEnvironmentRetryPolicy(
                status == "not_applied",
                status == "unknown" ? "unknown_delivery_never_retry" : "fresh_snapshot_required"),
            successor)
        {
            Attribution = attribution == null ? null : HumanAttribution(attribution)
        };

}
