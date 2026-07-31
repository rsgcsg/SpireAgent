using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;
using STS2_MCP.ConnectorV3.Protocol;

namespace STS2_MCP.ConnectorV3.Runtime;

internal sealed record ConnectorV3Snapshot(
    ConnectorV3ObservationResponse Observation,
    BridgeObservationDraft Draft,
    IReadOnlyList<ConnectorV3BoundCommand> Bindings);

internal sealed record ConnectorV3BoundCommand(
    ConnectorV3CommandCandidate Candidate,
    BridgeActionDraft? LegacyBinding,
    BridgeActionPermissionBinding PermissionBinding,
    BridgeBoundActionContract ContractBinding);

internal static class ConnectorV3Runtime
{
    private static readonly BridgeEntityRegistry Entities = new();
    private static readonly BridgeStateIdentityTracker StateIdentity = new();
    private static readonly BridgeCommandLedger CommandLedger =
        new(BridgeV2Runtime.CommandOutcomeTimeoutMs);
    private static readonly ConcurrentDictionary<string, ConnectorV3CommandRequest> Requests =
        new(StringComparer.Ordinal);
    private static readonly ConcurrentDictionary<string, BridgeActionPermissionBinding>
        PermissionBindings = new(StringComparer.Ordinal);

    public static ConnectorV3CapabilitiesResponse GetCapabilities()
    {
        BridgeCapabilitiesResponse v2 = BridgeV2Runtime.GetCapabilities();
        return new ConnectorV3CapabilitiesResponse(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.ObservationSchema,
            ConnectorV3Contract.CommandSchema,
            "experimental_cutover",
            v2.Bridge,
            v2.Game,
            new[]
            {
                "play_card",
                "use_potion",
                "end_turn",
                "choose",
                "purchase",
                "navigate",
                "select_entity",
                "deselect_entity",
                "confirm_interaction",
                "cancel_interaction",
                "activate_control"
            },
            v2.ControlCoordination,
            new[]
            {
                "V3 source/build/install is not loaded or Live evidence until exact runtime identity is observed.",
                "Non-combat families still use a bounded native-binding migration adapter; they do not call V2 action endpoints.",
                "A successful fixture or build is not compatibility qualification."
            });
    }

    public static ConnectorV3ObservationResponse Observe() => BuildSnapshot().Observation;

    public static ConnectorV3CommandReceipt Submit(ConnectorV3CommandRequest request)
    {
        ConnectorV3Snapshot snapshot = BuildSnapshot();
        string requestId = request.RequestId ?? string.Empty;
        string expectedStateToken = request.ExpectedStateToken ?? string.Empty;
        string command = request.Command ?? string.Empty;
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>(StringComparer.Ordinal);
        string syntheticActionId = BuildCommandIdentity(
            request.InteractionId ?? string.Empty,
            command,
            operands);

        ConnectorV3BoundCommand? binding = ResolveBinding(snapshot, request);
        var descriptor = new LegalAction(
            syntheticActionId,
            expectedStateToken,
            binding?.Candidate.Operation ?? command,
            "connector_v3",
            binding?.Candidate.Label ?? command,
            "connector_v3_parameterized_command",
            binding?.Candidate.BindingKind ?? "command_not_resolved",
            binding?.Candidate.EntityBindings ?? Array.Empty<ActionEntityBinding>());
        RegisteredBridgeAction? action = binding == null
            ? null
            : new RegisteredBridgeAction(
                descriptor,
                () =>
                {
                    if (!BridgeV2Runtime.AuthorizeBoundExecution(
                            binding.PermissionBinding,
                            binding.ContractBinding))
                    {
                        return BridgeActionStartResult.Rejected(
                            "permission_or_contract_changed",
                            "The exact command authority changed before native Commit.");
                    }
                    return StartResolvedCommand(snapshot, request, binding);
                },
                binding.PermissionBinding,
                binding.ContractBinding);
        var bridgeRequest = new BridgeCommandRequest(
            requestId,
            expectedStateToken,
            syntheticActionId)
        {
            ClientSessionId = request.ClientSessionId,
            ControllerLeaseId = request.ControllerLeaseId,
            ControllerGeneration = request.ControllerGeneration
        };

        Requests.TryAdd(requestId, request);
        BridgeCommandResponse response = CommandLedger.Submit(
            bridgeRequest,
            snapshot.Observation.StateToken,
            action,
            () => BridgeV2Runtime.AuthorizeController(bridgeRequest));
        if (binding != null && response.Attribution != null)
        {
            PermissionBindings[requestId] = binding.PermissionBinding;
            BridgeV2Runtime.ObserveBoundCommand(
                requestId,
                binding.PermissionBinding,
                response);
        }
        return ToReceipt(request, response);
    }

    public static ConnectorV3CommandReceipt? Poll(string requestId)
    {
        ConnectorV3Snapshot snapshot = BuildSnapshot();
        BridgeCommandResponse? response =
            CommandLedger.Poll(requestId, snapshot.Observation.StateToken);
        if (response == null)
            return null;
        PermissionBindings.TryGetValue(
            requestId,
            out BridgeActionPermissionBinding? permissionBinding);
        BridgeV2Runtime.ObserveBoundCommand(
            requestId,
            permissionBinding,
            response);
        ConnectorV3CommandRequest request = Requests.TryGetValue(requestId, out ConnectorV3CommandRequest? found)
            ? found
            : new ConnectorV3CommandRequest(
                requestId,
                response.ExpectedStateId,
                null,
                "unknown",
                new Dictionary<string, string>());
        return ToReceipt(request, response);
    }

    private static ConnectorV3Snapshot BuildSnapshot()
    {
        GameBuildIdentity game = BridgeV2Runtime.ReadCurrentGameIdentity();
        BridgeObservationDraft draft = BridgeSnapshotBuilder.Build(Entities, game);
        draft = BridgeV2Runtime.AdmitEncounter(draft);
        draft = BridgeSnapshotBuilder.ApplyCurrentAuthority(draft);
        BridgeSharedVisibleStateBuildResult shared = draft.Game.Compatibility.StateObservationAllowed
            ? BridgeSharedVisibleStateBuilder.Build(Entities)
            : new BridgeSharedVisibleStateBuildResult(false, null, null);
        draft = BridgeV2Runtime.ApplyMissingSharedStatePolicy(draft, shared);
        BridgeVisibilityProjection visibility = BridgeVisibilityCatalog.Build(
            draft,
            shared.State != null,
            ShopSurfaceFacts.TryGetCurrent(out _, out _, out _));
        IReadOnlyList<ConnectorV3BoundCommand> bindings = BuildBindings(draft);
        string signature = BridgeHash.Object(new
        {
            game.Version,
            game.Commit,
            shared.State,
            draft.Readiness,
            draft.Context,
            draft.Surface,
            draft.Completeness,
            candidates = bindings.Select(binding => binding.Candidate).ToArray(),
            visibility.Visibility,
            visibility.InspectionCatalog
        });
        (string stateToken, long sequence) = StateIdentity.Observe(signature);
        string interactionId = "interaction_" + BridgeHash.Text(
            $"{stateToken}|{draft.Surface.Kind}|{draft.Readiness}")[..20];
        string executionSupport = DetermineExecutionSupport(draft, bindings);
        string status = draft.Readiness == "ready" && bindings.Count > 0
            ? "actionable_complete"
            : draft.Surface.Kind == "unsupported"
                ? "actionable_partial"
                : "observed";
        var interaction = new ConnectorV3Interaction(
            interactionId,
            draft.Surface.Kind,
            draft.Readiness,
            executionSupport,
            executionSupport == "unsupported"
                ? "No exact current command binding is authorized for this visible interaction."
                : null,
            bindings.Select(binding => binding.Candidate.Command)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(value => value, StringComparer.Ordinal)
                .ToArray(),
            bindings.Select(binding => binding.Candidate).ToArray());
        var coverage = new ConnectorV3Coverage(
            visibility.Visibility.CoreStatus == "complete"
                ? "complete_for_declared_contract"
                : "partial_for_declared_contract",
            draft.Surface.Kind == "unsupported" ? "partial" : "complete",
            executionSupport,
            draft.Surface.Kind == "unsupported"
                ? new[] { draft.Surface.Kind }
                : Array.Empty<string>(),
            visibility.Visibility.HiddenByPolicy);
        var observation = new ConnectorV3ObservationResponse(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.ObservationSchema,
            "semantic_accessibility.tools.v1",
            stateToken,
            sequence,
            DateTimeOffset.UtcNow,
            status,
            shared.State,
            draft.Context,
            draft.Surface,
            interaction,
            draft.Completeness,
            BridgeV2Runtime.ReadBridgeIdentity(),
            draft.Game,
            BridgeV2Runtime.ReadObservationPolicy(),
            visibility.Visibility,
            visibility.InspectionCatalog,
            BridgeDiagnostics.ForObservation(draft),
            draft.Warnings,
            coverage);
        return new ConnectorV3Snapshot(observation, draft, bindings);
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildBindings(
        BridgeObservationDraft draft)
    {
        var allowed = new List<(
            BridgeActionDraft Action,
            ActionPermissionScope Scope,
            BridgeBoundActionContract Contract)>();
        foreach (BridgeActionDraft action in draft.Actions)
        {
            ActionPermissionScope? scope = BridgeSurfacePermission.FindActionScope(
                draft.Game.Compatibility,
                draft.Surface.Kind,
                action.Kind);
            BridgeBoundActionContract? contract =
                BridgeBoundActionContract.Build(draft.Surface.Kind, action);
            if (scope != null && contract != null && contract.Matches(scope))
                allowed.Add((action, scope, contract));
        }

        if (draft.Surface.Kind == "combat_turn")
            return BuildCombatBindings(allowed);

        return allowed
            .Select(item => new ConnectorV3BoundCommand(
                BuildCandidate(item.Action, item.Scope, "provider_native_binding_adapter"),
                item.Action,
                PermissionBinding(item.Scope),
                item.Contract))
            .ToArray();
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildCombatBindings(
        IReadOnlyList<(
            BridgeActionDraft Action,
            ActionPermissionScope Scope,
            BridgeBoundActionContract Contract)> allowed)
    {
        var result = new List<ConnectorV3BoundCommand>();
        foreach (IGrouping<string, (
                     BridgeActionDraft Action,
                     ActionPermissionScope Scope,
                     BridgeBoundActionContract Contract)> group
                 in allowed.GroupBy(item =>
                 {
                     ActionEntityBinding? primary = item.Action.EntityBindings?
                         .FirstOrDefault(binding => binding.Role is "card" or "potion");
                     return $"{item.Action.Kind}|{primary?.EntityId ?? item.Action.Key}";
                 }, StringComparer.Ordinal))
        {
            (BridgeActionDraft action, ActionPermissionScope scope, BridgeBoundActionContract contract) =
                group.First();
            ConnectorV3CommandCandidate candidate = BuildCandidate(
                action,
                scope,
                "native_direct_resolver");
            if (action.Kind is "play_card" or "use_potion")
            {
                string operandName = action.Kind == "play_card" ? "card_id" : "potion_id";
                ActionEntityBinding? primary = action.EntityBindings?
                    .FirstOrDefault(binding => binding.Role == (action.Kind == "play_card" ? "card" : "potion"));
                IReadOnlyList<string> targets = group
                    .SelectMany(item => item.Action.EntityBindings ?? Array.Empty<ActionEntityBinding>())
                    .Where(binding => binding.Role == "target")
                    .Select(binding => binding.EntityId)
                    .Distinct(StringComparer.Ordinal)
                    .ToArray();
                var operands = primary == null
                    ? candidate.Operands
                    : new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [operandName] = primary.EntityId
                    };
                var domains = candidate.OperandDomains.ToDictionary(
                    pair => pair.Key,
                    pair => pair.Value,
                    StringComparer.Ordinal);
                if (targets.Count > 0)
                    domains["target_id"] = new ConnectorV3OperandDomain("entity_ids", targets);
                candidate = candidate with
                {
                    Operands = operands,
                    OperandDomains = domains,
                    EntityBindings = group
                        .SelectMany(item => item.Action.EntityBindings ?? Array.Empty<ActionEntityBinding>())
                        .Distinct()
                        .ToArray()
                };
            }
            result.Add(new ConnectorV3BoundCommand(
                candidate,
                null,
                PermissionBinding(scope),
                contract));
        }
        return result;
    }

    private static ConnectorV3CommandCandidate BuildCandidate(
        BridgeActionDraft action,
        ActionPermissionScope scope,
        string bindingKind)
    {
        string command = PublicCommand(action.Kind);
        var operands = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (ActionEntityBinding binding in action.EntityBindings ?? Array.Empty<ActionEntityBinding>())
            operands[OperandName(binding.Role)] = binding.EntityId;
        if (operands.Count == 0 && command != "end_turn")
            operands["control_id"] = action.Kind;
        string candidateId = "candidate_" + BridgeHash.Object(new
        {
            command,
            action.Kind,
            operands = operands.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray()
        })[..20];
        return new ConnectorV3CommandCandidate(
            candidateId,
            command,
            action.Kind,
            action.Label,
            operands,
            new Dictionary<string, ConnectorV3OperandDomain>(),
            action.EntityBindings ?? Array.Empty<ActionEntityBinding>(),
            bindingKind,
            scope.Tier == "canary" ? "trial" : "supported");
    }

    private static ConnectorV3BoundCommand? ResolveBinding(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request)
    {
        if (!string.Equals(
                snapshot.Observation.StateToken,
                request.ExpectedStateToken,
                StringComparison.Ordinal)
            || !string.Equals(
                snapshot.Observation.Interaction.Id,
                request.InteractionId,
                StringComparison.Ordinal))
        {
            return null;
        }

        string command = request.Command ?? string.Empty;
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        ConnectorV3BoundCommand[] matches = snapshot.Bindings
            .Where(binding =>
                string.Equals(binding.Candidate.Command, command, StringComparison.Ordinal)
                && OperandsMatch(binding.Candidate, operands))
            .ToArray();
        return matches.Length == 1 ? matches[0] : null;
    }

    internal static bool OperandsMatch(
        ConnectorV3CommandCandidate candidate,
        IReadOnlyDictionary<string, string> actual)
    {
        foreach ((string key, string expected) in candidate.Operands)
        {
            if (!actual.TryGetValue(key, out string? value)
                || !string.Equals(expected, value, StringComparison.Ordinal))
                return false;
        }
        foreach ((string key, ConnectorV3OperandDomain domain) in candidate.OperandDomains)
        {
            if (!actual.TryGetValue(key, out string? value)
                || !domain.EntityIds.Contains(value, StringComparer.Ordinal))
                return false;
        }
        return actual.Count == candidate.Operands.Count + candidate.OperandDomains.Count;
    }

    internal static string BuildCommandIdentity(
        string interactionId,
        string command,
        IReadOnlyDictionary<string, string> operands)
    {
        return "v3cmd_" + BridgeHash.Object(new
        {
            interactionId,
            command,
            operands = operands.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray()
        })[..20];
    }

    private static BridgeActionStartResult StartResolvedCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (binding.Candidate.BindingKind == "native_direct_resolver")
            return StartCombatCommand(snapshot, request);
        return binding.LegacyBinding?.Start()
               ?? BridgeActionStartResult.Rejected(
                   "command_binding_unavailable",
                   "The exact native command binding is no longer available.");
    }

    private static BridgeActionStartResult StartCombatCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request)
    {
        if (snapshot.Draft.Surface.Kind != "combat_turn")
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The combat-turn owner is no longer current.");
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        Player? player = runState == null ? null : LocalContext.GetMe(runState);
        if (player == null)
            return BridgeActionStartResult.Rejected(
                "player_unavailable",
                "The local combat player is unavailable.");
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();

        return request.Command switch
        {
            "play_card" => ResolvePlayCard(player, operands),
            "use_potion" => ResolvePotion(player, operands),
            "end_turn" => CombatTurnSurfaceProvider.StartEndTurn(player),
            _ => BridgeActionStartResult.Rejected(
                "command_not_supported",
                "This command is not supported by the combat direct resolver.")
        };
    }

    private static BridgeActionStartResult ResolvePlayCard(
        Player player,
        IReadOnlyDictionary<string, string> operands)
    {
        if (!operands.TryGetValue("card_id", out string? cardId)
            || !Entities.TryResolve(cardId, out CardModel? card)
            || card == null)
        {
            return BridgeActionStartResult.Rejected(
                "card_not_found",
                "The exact card entity is no longer available.");
        }
        Creature? target = null;
        if (operands.TryGetValue("target_id", out string? targetId)
            && !Entities.TryResolve(targetId, out target))
        {
            return BridgeActionStartResult.Rejected(
                "target_not_found",
                "The exact target entity is no longer available.");
        }
        return CombatTurnSurfaceProvider.StartPlayCard(player, card, target);
    }

    private static BridgeActionStartResult ResolvePotion(
        Player player,
        IReadOnlyDictionary<string, string> operands)
    {
        if (!operands.TryGetValue("potion_id", out string? potionId)
            || !Entities.TryResolve(potionId, out PotionModel? potion)
            || potion == null)
        {
            return BridgeActionStartResult.Rejected(
                "potion_not_found",
                "The exact potion entity is no longer available.");
        }
        int slot = Enumerable.Range(0, player.PotionSlots.Count)
            .FirstOrDefault(index => ReferenceEquals(player.GetPotionAtSlotIndex(index), potion), -1);
        if (slot < 0)
            return BridgeActionStartResult.Rejected(
                "potion_slot_changed",
                "The exact potion is no longer in the player's belt.");
        Creature? target = null;
        if (operands.TryGetValue("target_id", out string? targetId)
            && !Entities.TryResolve(targetId, out target))
        {
            return BridgeActionStartResult.Rejected(
                "target_not_found",
                "The exact target entity is no longer available.");
        }
        return CombatTurnSurfaceProvider.StartUsePotion(player, potion, slot, target);
    }

    private static string DetermineExecutionSupport(
        BridgeObservationDraft draft,
        IReadOnlyList<ConnectorV3BoundCommand> bindings)
    {
        if (!draft.Game.Compatibility.ActionExecutionAllowed || bindings.Count == 0)
            return "unsupported";
        return bindings.Any(binding => binding.Candidate.AuthorityState == "trial")
            ? "trial"
            : "supported";
    }

    private static string PublicCommand(string operation)
    {
        if (operation is "play_card" or "use_potion" or "end_turn")
            return operation;
        if (operation.StartsWith("purchase_", StringComparison.Ordinal))
            return "purchase";
        if (operation == "choose_map_node")
            return "navigate";
        if (operation.StartsWith("deselect_", StringComparison.Ordinal))
            return "deselect_entity";
        if (operation.StartsWith("toggle_", StringComparison.Ordinal)
            || operation.StartsWith("select_", StringComparison.Ordinal)
            || operation.StartsWith("choose_", StringComparison.Ordinal)
            || operation.StartsWith("claim_", StringComparison.Ordinal))
            return operation.StartsWith("toggle_", StringComparison.Ordinal)
                || operation.StartsWith("select_", StringComparison.Ordinal)
                ? "select_entity"
                : "choose";
        if (operation.StartsWith("confirm_", StringComparison.Ordinal)
            || operation.StartsWith("preview_", StringComparison.Ordinal))
            return "confirm_interaction";
        if (operation.StartsWith("cancel_", StringComparison.Ordinal)
            || operation.StartsWith("close_", StringComparison.Ordinal))
            return "cancel_interaction";
        return "activate_control";
    }

    private static string OperandName(string role) => role switch
    {
        "option" or "reward" or "relic" or "bundle" => "choice_id",
        "node" => "destination_id",
        "offer" or "service" => "offer_id",
        _ => role.EndsWith("_id", StringComparison.Ordinal) ? role : $"{role}_id"
    };

    private static BridgeActionPermissionBinding PermissionBinding(
        ActionPermissionScope scope) =>
        new(
            scope.SurfaceKind,
            scope.Operation,
            scope.Tier,
            scope.GrantId,
            scope.GrantVersion,
            scope.RuntimeEpoch,
            scope.EnvironmentDigest,
            scope.PatchDigest,
            scope.OperationFingerprint,
            scope.AdmissionBasis);

    internal static ConnectorV3CommandReceipt ToReceipt(
        ConnectorV3CommandRequest request,
        BridgeCommandResponse response)
    {
        string status = response.Status switch
        {
            "completed" => "completed",
            "rejected" => "not_executed",
            "failed" or "timed_out" => "unknown",
            _ => "pending"
        };
        string application = response.Status switch
        {
            "completed" => "confirmed",
            "rejected" => "not_applied",
            "failed" or "timed_out" => "unknown",
            _ => "started"
        };
        BridgeCommandEvent? terminal = response.Events.LastOrDefault();
        string? reasonCode = status is "not_executed" or "unknown"
            ? terminal?.ErrorCode ?? response.Status
            : null;
        string retryReason = status switch
        {
            "not_executed" => "obtain_fresh_observation_and_redecide",
            "unknown" => "mutation_may_have_occurred",
            "pending" => "poll_same_request_id",
            _ => "command_already_applied"
        };
        return new ConnectorV3CommandReceipt(
            ConnectorV3Contract.ProtocolVersion,
            response.RequestId,
            status,
            application,
            new ConnectorV3CommandSummary(
                request.Command ?? "unknown",
                request.Operands ?? new Dictionary<string, string>()),
            reasonCode,
            terminal?.Detail,
            status == "completed"
                ? new ConnectorV3Completion(
                    response.CompletionBoundary ?? "action_specific_completion_observed",
                    terminal?.Evidence ?? "action_specific_completion_observed")
                : null,
            new ConnectorV3RetryPolicy(false, retryReason),
            new ConnectorV3Successor(
                response.ObservedStateId == null ? "pending" : "available",
                response.ObservedStateId),
            response.Events)
        {
            Attribution = response.Attribution
        };
    }
}
