using System;
using System.Collections.Generic;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal static class BridgeV2Runtime
{
    public const int CommandOutcomeTimeoutMs = 10_000;

    private static readonly object Gate = new();
    private static readonly BridgeEntityRegistry EntityRegistry = new();
    private static readonly BridgeStateIdentityTracker StateIdentity = new();
    private static readonly BridgeCommandLedger CommandLedger = new(CommandOutcomeTimeoutMs);
    private static readonly Dictionary<string, RegisteredBridgeAction> Actions = new(StringComparer.Ordinal);

    public static BridgeCapabilitiesResponse GetCapabilities()
    {
        GameBuildIdentity game = BridgeGameIdentity.Read();
        var warnings = new List<string>
        {
            "Bridge v2 is an incremental preview. Unlisted surfaces fail closed with no legal actions.",
            "Singleplayer deck enchant, ordinary event option, player-phase combat turn, card reward selection, and room reward claim are the only game-bound v2 vertical slices in this revision."
        };

        if (!game.Compatibility.ActionExecutionAllowed)
            warnings.Add(game.Compatibility.Detail);

        return new BridgeCapabilitiesResponse(
            BridgeV2Contract.ProtocolVersion,
            BridgeIdentity(),
            game,
            ObservationPolicy(),
            new[]
            {
                new SurfaceCapability(
                    "deck_enchant_selection",
                    "implemented_exact_game_version",
                    new[] { "toggle_card", "preview_selection", "confirm_selection", "cancel_preview", "close_selection" },
                    "sts2-v0.108.0:NDeckEnchantSelectScreen+DeckEnchantScreenHandler"),
                new SurfaceCapability(
                    "event_option",
                    "implemented_exact_game_version",
                    new[] { "choose_event_option", "proceed_event" },
                    "sts2-v0.108.0:NEventRoom+NEventOptionButton+EventOption"),
                new SurfaceCapability(
                    "combat_turn",
                    "implemented_exact_game_version",
                    new[] { "play_card", "use_potion", "end_turn" },
                    "sts2-v0.108.0:CombatManager+PlayerCombatState+CardModel+NPlayerHand"),
                new SurfaceCapability(
                    "card_reward_selection",
                    "implemented_exact_game_version",
                    new[] { "select_card_reward", "choose_card_reward_alternative" },
                    "sts2-v0.108.0:NCardRewardSelectionScreen+NGridCardHolder+NCardRewardAlternativeButton"),
                new SurfaceCapability(
                    "reward_claim",
                    "implemented_exact_game_version",
                    new[] { "claim_reward", "proceed_rewards" },
                    "sts2-v0.108.0:NRewardsScreen+NRewardButton+NProceedButton")
            },
            new CommandContractCapability(
                OpaqueActionsOnly: true,
                StateBound: true,
                IdempotentRequestIds: true,
                LifecycleStates: new[]
                {
                    "received", "validated", "started", "completed", "rejected", "failed", "timed_out"
                },
                OutcomeTimeoutMs: CommandOutcomeTimeoutMs),
            new InspectionContractCapability(
                Status: "disabled_not_implemented",
                StateBound: true,
                ArbitraryQueriesAllowed: false,
                EntersCommandLedger: false,
                VisibilityClasses: new[] { "on_screen", "normal_inspection", "count_only" },
                OrderingSemantics: new[] { "unordered_multiset", "player_sorted" },
                ImplementedKinds: Array.Empty<string>()),
            new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.protocol.incremental_preview",
                    "info",
                    "compatibility",
                    "none",
                    "unknown"),
                BridgeDiagnostics.Create(
                    "bridge.inspection.disabled",
                    "info",
                    "visibility",
                    "none",
                    "unknown",
                    "Read-only inspection has a contract boundary but no enabled endpoint or kind.")
            },
            warnings);
    }

    public static BridgeStateEnvelope Observe()
    {
        BridgeObservationDraft draft = BridgeSnapshotBuilder.Build(EntityRegistry);

        lock (Gate)
        {
            (string stateId, long stateSequence) = StateIdentity.Observe(draft.Signature);

            Actions.Clear();
            var descriptors = new List<LegalAction>(draft.Actions.Count);
            foreach (BridgeActionDraft action in draft.Actions)
            {
                string actionId = "action_" + BridgeHash.Text($"{stateId}|{action.Key}")[..20];
                var descriptor = new LegalAction(
                    actionId,
                    stateId,
                    action.Kind,
                    action.Category,
                    action.Label,
                    "game_ui",
                    action.EvidenceCode);
                Actions[actionId] = new RegisteredBridgeAction(descriptor, action.Start);
                descriptors.Add(descriptor);
            }

            return new BridgeStateEnvelope(
                BridgeV2Contract.ProtocolVersion,
                stateId,
                stateSequence,
                DateTimeOffset.UtcNow,
                draft.Readiness,
                draft.Context,
                draft.Surface,
                descriptors,
                draft.Completeness,
                BridgeIdentity(),
                draft.Game,
                ObservationPolicy(),
                BridgeDiagnostics.ForObservation(draft),
                draft.Warnings);
        }
    }

    public static BridgeCommandResponse Submit(BridgeCommandRequest request)
    {
        BridgeStateEnvelope current = Observe();
        RegisteredBridgeAction? action;
        lock (Gate)
            Actions.TryGetValue(request.ActionId ?? string.Empty, out action);

        return CommandLedger.Submit(request, current.StateId, action);
    }

    public static BridgeCommandResponse? Poll(string requestId)
    {
        BridgeStateEnvelope current = Observe();
        return CommandLedger.Poll(requestId, current.StateId);
    }

    private static BridgeServerIdentity BridgeIdentity() => new(
        "sts2_mcp_bridge_v2",
        "STS2 Agent Bridge",
        McpMod.Version,
        "20eadebde358a37cca41f8b38728099e6d0d19db");

    private static ObservationPolicyInfo ObservationPolicy() => new(
        BridgeV2Contract.ObservationPolicyId,
        "Information currently rendered by or directly available through the local player's game UI.",
        IncludesHiddenInformation: false,
        UnknownFieldBehavior: "omit_and_mark_incomplete");

}
