using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal sealed record BridgeInspectionReadResult(
    BridgeInspectionResponse? Inspection,
    string? ErrorCode,
    string? Detail);

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
            "Singleplayer deck enchant, merchant deck removal, combat-pile, combat-hand, generated-card, and card-bundle selection, ancient event dialogue, ordinary event option, rest site, player-phase combat turn, card reward selection, room reward claim, map navigation, and normal merchant shop controls are the only game-bound v2 action slices in this revision.",
            "Run-deck and combat-pile inspections are read-only evidence. They do not grant action authority or enter the command ledger."
        };

        if (!game.Compatibility.ActionExecutionAllowed)
            warnings.Add(game.Compatibility.Detail);

        SurfaceCapability[] declaredSurfaces =
        {
            new SurfaceCapability(
                "deck_enchant_selection",
                "implemented_exact_game_version",
                new[] { "toggle_card", "preview_selection", "confirm_selection", "cancel_preview", "close_selection" },
                "sts2-v0.108.0:NDeckEnchantSelectScreen+DeckEnchantScreenHandler"),
            new SurfaceCapability(
                "deck_removal_selection",
                "implemented_exact_game_version",
                new[]
                {
                    "toggle_deck_removal_card", "preview_deck_removal", "confirm_deck_removal",
                    "cancel_deck_removal_preview", "cancel_deck_removal_selection"
                },
                "sts2-v0.108.0:MerchantCardRemovalEntry+CardSelectCmd.FromDeckForRemoval+NDeckCardSelectScreen"),
            new SurfaceCapability(
                "event_dialogue",
                "implemented_exact_game_version",
                new[] { "advance_event_dialogue" },
                "sts2-v0.108.0:NAncientEventLayout+NAncientDialogueLine+NAncientDialogueHitbox"),
            new SurfaceCapability(
                "rest_site",
                "implemented_exact_game_version",
                new[] { "choose_rest_option", "proceed_rest_site" },
                "sts2-v0.108.0:RestSiteRoom.Options+NRestSiteButton+NProceedButton+NMapScreen"),
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
                "combat_pile_card_selection",
                "implemented_exact_game_version",
                new[] { "toggle_combat_pile_card", "confirm_combat_pile_selection", "cancel_combat_pile_selection" },
                "sts2-v0.108.0:NCombatPileCardSelectScreen+CardSelectorPrefs+CardPile+NCardGrid"),
            new SurfaceCapability(
                "combat_hand_card_selection",
                "implemented_exact_game_version",
                new[] { "select_combat_hand_card", "deselect_combat_hand_card", "confirm_combat_hand_selection", "close_combat_hand_peek" },
                "sts2-v0.108.0:NPlayerHand+CardSelectorPrefs+NSelectedHandCardContainer+NUpgradePreview"),
            new SurfaceCapability(
                "generated_card_choice",
                "implemented_exact_game_version",
                new[] { "select_generated_card", "skip_generated_card_choice", "close_generated_card_choice_peek" },
                "sts2-v0.108.0:NChooseACardSelectionScreen+NGridCardHolder+NChoiceSelectionSkipButton+NPeekButton"),
            new SurfaceCapability(
                "card_bundle_selection",
                "implemented_exact_game_version",
                new[] { "preview_card_bundle", "confirm_card_bundle", "cancel_card_bundle_preview" },
                "sts2-v0.108.0:NChooseABundleSelectionScreen+NCardBundle+NConfirmButton+NBackButton"),
            new SurfaceCapability(
                "card_reward_selection",
                "implemented_exact_game_version",
                new[] { "select_card_reward", "choose_card_reward_alternative" },
                "sts2-v0.108.0:NCardRewardSelectionScreen+NGridCardHolder+NCardRewardAlternativeButton"),
            new SurfaceCapability(
                "reward_claim",
                "implemented_exact_game_version",
                new[] { "claim_reward", "discard_potion_for_reward", "proceed_rewards" },
                "sts2-v0.108.0:NRewardsScreen+NRewardButton+PotionReward+DiscardPotionGameAction+NProceedButton"),
            new SurfaceCapability(
                "map_navigation",
                "implemented_exact_game_version",
                new[] { "choose_map_node" },
                "sts2-v0.108.0:NMapScreen+NMapPoint+RunState.Map+OnMapPointSelectedLocally"),
            new SurfaceCapability(
                "shop_inventory",
                "implemented_exact_game_version",
                new[]
                {
                    "purchase_shop_card", "purchase_shop_relic", "purchase_shop_potion",
                    "open_shop_card_removal", "close_shop_inventory"
                },
                "sts2-v0.108.0:MerchantInventory+typed MerchantEntry+NMerchantSlot+NMerchantInventory"),
            new SurfaceCapability(
                "shop_room",
                "implemented_exact_game_version",
                new[] { "open_shop_inventory", "proceed_shop" },
                "sts2-v0.108.0:NMerchantRoom+NMerchantButton+NProceedButton")
        };
        IReadOnlyList<SurfaceCapability> surfaces = game.Compatibility.ActionExecutionAllowed
            ? declaredSurfaces
            : declaredSurfaces.Select(surface => new SurfaceCapability(
                surface.Kind,
                game.Compatibility.ObservationOnlySurfaceKinds.Contains(surface.Kind, StringComparer.Ordinal)
                    ? "candidate_observation_only"
                    : "not_qualified_for_current_build",
                surface.Operations,
                surface.Evidence)).ToArray();

        return new BridgeCapabilitiesResponse(
            BridgeV2Contract.ProtocolVersion,
            BridgeIdentity(),
            game,
            ObservationPolicy(),
            surfaces,
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
                Status: "implemented_read_only",
                StateBound: true,
                ArbitraryQueriesAllowed: false,
                EntersCommandLedger: false,
                VisibilityClasses: new[] { "on_screen", "normal_inspection", "count_only" },
                OrderingSemantics: new[] { "unordered_multiset", "player_sorted" },
                ImplementedKinds: new[]
                {
                    BridgeInspectionBuilder.RunDeckKind,
                    BridgeInspectionBuilder.CombatPilesKind
                }),
            new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.protocol.incremental_preview",
                    "info",
                    "compatibility",
                    "none",
                    "unknown"),
                BridgeDiagnostics.Create(
                    "bridge.inspection.read_only_enabled",
                    "info",
                    "visibility",
                    "none",
                    "unknown",
                    "Run-deck and combat-pile inspection are state-bound reads with no command authority.")
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
                    action.EvidenceCode,
                    action.EntityBindings ?? Array.Empty<ActionEntityBinding>());
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

    public static BridgeInspectionReadResult Inspect(string kind, string expectedStateId)
    {
        BridgeStateEnvelope current = Observe();
        if (!string.Equals(current.StateId, expectedStateId, StringComparison.Ordinal))
        {
            return new BridgeInspectionReadResult(
                null,
                "stale_state",
                "The expected state is no longer current; obtain a fresh state before inspecting.");
        }
        if (!current.Game.Compatibility.ActionExecutionAllowed)
        {
            return new BridgeInspectionReadResult(
                null,
                "inspection_identity_not_exact",
                "Inspection requires the exact supported game build even though it is read-only.");
        }

        BridgeInspectionBuildResult built = BridgeInspectionBuilder.Build(kind, current, EntityRegistry);
        if (built.Draft == null)
            return new BridgeInspectionReadResult(null, built.ErrorCode, built.Detail);

        BridgeInspectionDraft draft = built.Draft;
        string inspectionId = "inspection_" + BridgeHash.Object(new
        {
            current.StateId,
            draft.Kind,
            draft.Content,
            draft.Completeness
        })[..20];
        var response = new BridgeInspectionResponse(
            BridgeV2Contract.ProtocolVersion,
            inspectionId,
            expectedStateId,
            current.StateId,
            DateTimeOffset.UtcNow,
            draft.Kind,
            draft.VisibilityClass,
            draft.OrderingSemantics,
            draft.Content,
            draft.Completeness,
            BridgeIdentity(),
            current.Game,
            ObservationPolicy(),
            Array.Empty<BridgeDiagnostic>());
        return new BridgeInspectionReadResult(response, null, null);
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
