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

internal sealed record ConnectorV3InspectionReadResult(
    ConnectorV3InspectionResponse? Inspection,
    string? ErrorCode,
    string? Detail);

internal sealed record ConnectorV3LinkedDetailReadResult(
    ConnectorV3LinkedDetailResponse? LinkedDetail,
    string? ErrorCode,
    string? Detail);

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
            ConnectorV3Contract.InspectionSchema,
            ConnectorV3Contract.LinkedDetailSchema,
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

    public static ConnectorV3InspectionReadResult Inspect(
        string kind,
        string expectedStateToken)
    {
        ConnectorV3Snapshot snapshot = BuildSnapshot();
        ConnectorV3ObservationResponse observation = snapshot.Observation;
        if (!string.Equals(
                observation.StateToken,
                expectedStateToken,
                StringComparison.Ordinal))
        {
            return new ConnectorV3InspectionReadResult(
                null,
                "stale_state",
                "The expected state token is no longer current; obtain a fresh observation before inspecting.");
        }
        if (!observation.InspectionCatalog.Any(entry =>
                string.Equals(entry.Kind, kind, StringComparison.Ordinal)))
        {
            return new ConnectorV3InspectionReadResult(
                null,
                "inspection_not_available",
                "This inspection kind is not in the current state-bound visibility catalog.");
        }

        BridgeInspectionBuildResult built = BridgeInspectionBuilder.Build(
            kind,
            snapshot.Draft.Context,
            Entities);
        if (built.Draft == null)
        {
            return new ConnectorV3InspectionReadResult(
                null,
                built.ErrorCode,
                built.Detail);
        }

        BridgeInspectionDraft draft = built.Draft;
        string inspectionId = "v3inspection_" + BridgeHash.Object(new
        {
            observation.StateToken,
            draft.Kind,
            draft.Content,
            draft.Completeness
        })[..20];
        return new ConnectorV3InspectionReadResult(
            new ConnectorV3InspectionResponse(
                ConnectorV3Contract.ProtocolVersion,
                ConnectorV3Contract.InspectionSchema,
                inspectionId,
                expectedStateToken,
                observation.StateToken,
                DateTimeOffset.UtcNow,
                draft.Kind,
                draft.VisibilityClass,
                draft.OrderingSemantics,
                draft.Content,
                draft.Completeness,
                observation.Bridge,
                observation.Game,
                observation.ObservationPolicy,
                Array.Empty<BridgeDiagnostic>()),
            null,
            null);
    }

    public static ConnectorV3LinkedDetailReadResult ReadLinkedDetail(
        string entityId,
        string expectedStateToken)
    {
        ConnectorV3Snapshot snapshot = BuildSnapshot();
        ConnectorV3ObservationResponse observation = snapshot.Observation;
        if (!string.Equals(
                observation.StateToken,
                expectedStateToken,
                StringComparison.Ordinal))
        {
            return new ConnectorV3LinkedDetailReadResult(
                null,
                "stale_state",
                "The expected state token is no longer current; obtain a fresh observation before reading linked detail.");
        }
        if (!observation.LinkedDetailCatalog.Any(entry =>
                string.Equals(entry.Kind, "surface_card", StringComparison.Ordinal)
                && string.Equals(entry.EntityId, entityId, StringComparison.Ordinal)))
        {
            return new ConnectorV3LinkedDetailReadResult(
                null,
                "linked_detail_not_available",
                "This entity is not in the current state-bound linked-detail catalog.");
        }
        VisibleCard? card = SurfaceCards(snapshot.Draft.Surface)
            .FirstOrDefault(value => string.Equals(
                value.EntityId,
                entityId,
                StringComparison.Ordinal));
        if (card == null)
        {
            return new ConnectorV3LinkedDetailReadResult(
                null,
                "linked_detail_binding_failed",
                "The current linked card detail could not be rebuilt from the same Surface.");
        }
        string detailId = "v3detail_" + BridgeHash.Object(new
        {
            observation.StateToken,
            kind = "surface_card",
            card
        })[..20];
        return new ConnectorV3LinkedDetailReadResult(
            new ConnectorV3LinkedDetailResponse(
                ConnectorV3Contract.ProtocolVersion,
                ConnectorV3Contract.LinkedDetailSchema,
                detailId,
                expectedStateToken,
                observation.StateToken,
                DateTimeOffset.UtcNow,
                "surface_card",
                entityId,
                card,
                observation.Bridge,
                observation.Game,
                observation.ObservationPolicy,
                Array.Empty<BridgeDiagnostic>()),
            null,
            null);
    }

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
        try
        {
            draft = EventDeckRemovalSelection.TryBuild(Entities, game) ?? draft;
        }
        catch (Exception exception)
        {
            string failure = $"v3_event_deck_removal_discovery_failed:{exception.GetType().Name}";
            BridgeObservationDraft failed = BridgeFailClosedObservation.BindingUnavailable(
                game,
                draft.Context,
                "NDeckCardSelectScreen",
                "Connector V3 event-removal discovery failed before exact ownership could be proven.",
                new[] { "LuminousChoir.ReachIntoTheFlesh exact task scope" },
                new[] { "source_binding", "selection_constraints", "legal_actions" },
                failure,
                "connector.v3.event_deck_removal.discovery_failed",
                "A V3-native discovery error suppresses all mutation authority.");
            draft = failed with
            {
                Signature = BridgeHash.Object(new { failed.Signature, failure })
            };
        }
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
        IReadOnlyList<ConnectorV3LinkedDetailCatalogEntry> linkedDetails =
            BuildLinkedDetailCatalog(draft.Surface);
        BridgeVisibilityState v3Visibility = visibility.Visibility with
        {
            LinkedDetailKinds = linkedDetails.Count > 0
                ? new[] { "surface_card" }
                : Array.Empty<string>(),
            Missing = linkedDetails.Count > 0
                ? visibility.Visibility.Missing
                    .Where(item => item != "linked_entity_detail_catalog_not_implemented")
                    .ToArray()
                : visibility.Visibility.Missing
        };
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
            v3Visibility,
            visibility.InspectionCatalog,
            linkedDetails
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
            v3Visibility.CoreStatus == "complete"
                ? "complete_for_declared_contract"
                : "partial_for_declared_contract",
            draft.Surface.Kind == "unsupported" ? "partial" : "complete",
            executionSupport,
            draft.Surface.Kind == "unsupported"
                ? new[] { draft.Surface.Kind }
                : Array.Empty<string>(),
            v3Visibility.HiddenByPolicy);
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
            v3Visibility,
            visibility.InspectionCatalog,
            linkedDetails,
            BridgeDiagnostics.ForObservation(draft),
            draft.Warnings,
            coverage);
        return new ConnectorV3Snapshot(observation, draft, bindings);
    }

    private static IReadOnlyList<ConnectorV3LinkedDetailCatalogEntry>
        BuildLinkedDetailCatalog(IBridgeSurface surface) =>
        SurfaceCards(surface)
            .GroupBy(card => card.EntityId, StringComparer.Ordinal)
            .Select(group => new ConnectorV3LinkedDetailCatalogEntry(
                "surface_card",
                group.Key,
                "normal_player_visible_surface_card",
                StateBound: true,
                CreatesActionAuthority: false))
            .OrderBy(entry => entry.EntityId, StringComparer.Ordinal)
            .ToArray();

    private static IEnumerable<VisibleCard> SurfaceCards(IBridgeSurface surface) =>
        surface switch
        {
            DeckEnchantSelectionSurface value => value.Cards,
            DeckRemovalSelectionSurface value => value.Cards,
            EventDeckRemovalSelectionSurface value => value.Cards,
            DeckUpgradeSelectionSurface value => value.Cards.Concat(value.PreviewCards),
            DeckTransformSelectionSurface value => value.Cards,
            WoodCarvingsReplacementSelectionSurface value => value.Cards,
            CombatPileCardSelectionSurface value => value.Cards,
            CombatHandCardSelectionSurface value => value.Cards,
            EventCardAcquisitionSurface value => value.Cards,
            CardRewardSelectionSurface value => value.Cards,
            GeneratedCardChoiceSurface value => value.Cards,
            _ => Array.Empty<VisibleCard>()
        };

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildBindings(
        BridgeObservationDraft draft)
    {
        if (draft.Surface is EventOptionSurface eventOptions)
            return BuildEventOptionBindings(draft, eventOptions);
        if (draft.Surface is TreasureRoomSurface treasureRoom)
            return BuildTreasureRoomBindings(draft, treasureRoom);
        if (draft.Surface is RewardClaimSurface rewards)
            return BuildRewardClaimBindings(draft, rewards);
        if (draft.Surface is CardRewardSelectionSurface cardRewards)
            return BuildCardRewardBindings(draft, cardRewards);
        if (draft.Surface is ShopInventorySurface shopInventory)
            return BuildShopInventoryBindings(draft, shopInventory);
        if (draft.Surface is MainMenuSurface mainMenu)
            return BuildMainMenuBindings(draft, mainMenu);
        if (draft.Surface is SingleplayerMenuSurface singleplayerMenu)
            return BuildSingleplayerMenuBindings(draft, singleplayerMenu);
        if (draft.Surface is CharacterSelectSurface characterSelect)
            return BuildCharacterSelectBindings(draft, characterSelect);
        if (draft.Surface is GeneratedCardChoiceSurface generatedCardChoice)
            return BuildGeneratedCardChoiceBindings(draft, generatedCardChoice);
        if (draft.Surface is GameOverSurface gameOver)
            return BuildGameOverBindings(draft, gameOver);
        if (draft.Surface is CombatHandCardSelectionSurface combatHand)
            return BuildCombatHandBindings(draft, combatHand);
        if (draft.Surface is DeckUpgradeSelectionSurface deckUpgrade)
            return BuildDeckUpgradeBindings(draft, deckUpgrade);
        if (draft.Surface is DeckRemovalSelectionSurface removal
            && removal.Kind is
                "deck_removal_selection" or
                "relic_deck_removal_selection" or
                "reward_deck_removal_selection")
            return BuildDeckRemovalBindings(draft, removal);
        if (draft.Surface is EventDeckRemovalSelectionSurface eventRemoval)
            return BuildEventRemovalBindings(draft, eventRemoval);
        if (draft.Surface is CardBundleSelectionSurface cardBundle)
            return BuildCardBundleBindings(draft, cardBundle);

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
        if (draft.Surface.Kind is
            "shop_room" or
            "map_navigation" or
            "rest_site" or
            "deck_enchant_selection")
            return BuildNativeBindings(allowed);

        return allowed
            .Select(item => new ConnectorV3BoundCommand(
                BuildCandidate(item.Action, item.Scope, "provider_native_binding_adapter"),
                item.Action,
                PermissionBinding(item.Scope),
                item.Contract))
            .ToArray();
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildEventOptionBindings(
        BridgeObservationDraft draft,
        EventOptionSurface surface)
    {
        var result = new List<ConnectorV3BoundCommand>();
        foreach (BridgeActionDraft action in DescribeEventOptionCommands(surface))
        {
            if (BuildNativeBinding(draft, action) is { } binding)
                result.Add(binding);
        }
        return result;
    }

    internal static IReadOnlyList<BridgeActionDraft> DescribeEventOptionCommands(
        EventOptionSurface surface) =>
        surface.Options
            .Where(option => option.IsEnabled && !option.IsLocked)
            .Select(option => NativeDescriptor(
                $"event_option:{surface.ScreenEntityId}:{option.EntityId}",
                option.IsProceed ? "proceed_event" : "choose_event_option",
                option.IsProceed ? "navigation" : "selection",
                option.Title
                ?? option.Description
                ?? (option.IsProceed ? "Proceed" : "Choose event option"),
                "NEventRoom.OptionButtonClicked+NEventOptionButton",
                new[]
                {
                    new ActionEntityBinding("screen", surface.ScreenEntityId),
                    new ActionEntityBinding("option", option.EntityId)
                }))
            .ToArray();

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildGameOverBindings(
        BridgeObservationDraft draft,
        GameOverSurface surface)
        => DescribeGameOverCommands(surface)
            .Select(action => BuildNativeBinding(draft, action))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();

    internal static IReadOnlyList<BridgeActionDraft> DescribeGameOverCommands(
        GameOverSurface surface)
    {
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("game_over_screen", surface.ScreenEntityId);
        if (surface.CanAdvanceSummary && surface.Stage == "intro")
        {
            actions.Add(NativeDescriptor(
                $"game_over:advance:{surface.ScreenEntityId}",
                "advance_game_over_summary",
                "navigation",
                "Continue to the run summary",
                "NGameOverScreen.%ContinueButton+_isAnimatingSummary",
                new[] { screen }));
        }
        if (surface.CanReturn && surface.Stage == "summary")
        {
            actions.Add(NativeDescriptor(
                $"game_over:return:{surface.ScreenEntityId}:{surface.ReturnDestination}",
                "return_game_over",
                "navigation",
                surface.ReturnDestination == "timeline"
                    ? "Continue to newly discovered Timeline content"
                    : "Return to the main menu",
                "NGameOverScreen.%MainMenuButton+NGame.MainMenu-loaded",
                new[] { screen }));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildTreasureRoomBindings(
        BridgeObservationDraft draft,
        TreasureRoomSurface surface)
        => DescribeTreasureRoomCommands(surface)
            .Select(action => BuildNativeBinding(draft, action))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();

    internal static IReadOnlyList<BridgeActionDraft> DescribeTreasureRoomCommands(
        TreasureRoomSurface surface)
    {
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding room = new("treasure_room", surface.RoomEntityId);
        if (surface.Stage == "closed")
        {
            actions.Add(NativeDescriptor(
                $"treasure:open:{surface.RoomEntityId}",
                "open_treasure_chest",
                "reveal",
                "Open the treasure chest",
                "NTreasureRoom.OnChestButtonReleased+OpenChest+native-result-stage",
                new[] { room }));
        }
        if (surface.Stage == "relic_choice" && surface.Relics.Count == 1)
        {
            VisibleTreasureRelic relic = surface.Relics[0];
            actions.Add(NativeDescriptor(
                $"treasure:relic:{surface.RoomEntityId}:{relic.EntityId}",
                "choose_treasure_relic",
                "claim",
                $"Take {relic.Name ?? relic.DefinitionId}",
                "NTreasureRoomRelicCollection.PickRelic+RelicCmd.Obtain+player-relic-post-state",
                new[]
                {
                    room,
                    new ActionEntityBinding("relic", relic.EntityId)
                }));
        }
        if (surface.CanSkip)
        {
            actions.Add(NativeDescriptor(
                $"treasure:skip:{surface.RoomEntityId}",
                "skip_treasure_relic",
                "skip",
                "Skip the visible treasure relic",
                "NTreasureRoom.ProceedButton.IsSkip+SkipRelicLocally+room-exit-post-state",
                new[] { room }));
        }
        if (surface.CanProceed)
        {
            actions.Add(NativeDescriptor(
                $"treasure:proceed:{surface.RoomEntityId}",
                "proceed_treasure_room",
                "navigation",
                "Continue from the treasure room",
                "NTreasureRoom.ProceedButton+room-exit-or-map-open",
                new[] { room }));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildRewardClaimBindings(
        BridgeObservationDraft draft,
        RewardClaimSurface surface)
        => DescribeRewardClaimCommands(surface)
            .Select(action => BuildNativeBinding(draft, action))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();

    internal static IReadOnlyList<BridgeActionDraft> DescribeRewardClaimCommands(
        RewardClaimSurface surface)
    {
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        foreach (VisibleReward reward in surface.Rewards.Where(value => value.Enabled))
        {
            actions.Add(NativeDescriptor(
                $"reward:claim:{surface.ScreenEntityId}:{reward.EntityId}",
                "claim_reward",
                "claim",
                $"Claim {reward.Label}",
                "NRewardButton.Reward+NRewardButton.ForceClick+reward-set-post-state",
                new[]
                {
                    screen,
                    new ActionEntityBinding("reward", reward.EntityId)
                }));
        }

        foreach (VisibleCombatPotion potion in surface.DiscardablePotions)
        {
            actions.Add(NativeDescriptor(
                $"reward:discard-potion:{surface.ScreenEntityId}:{potion.EntityId}",
                "discard_potion_for_reward",
                "capacity",
                $"Discard {potion.Name ?? potion.DefinitionId} from slot {potion.Slot + 1} to make room",
                "DiscardPotionGameAction+exact-potion-slot-post-state",
                new[]
                {
                    screen,
                    new ActionEntityBinding("potion", potion.EntityId)
                }));
        }

        if (surface.CanProceed)
        {
            actions.Add(NativeDescriptor(
                $"reward:proceed:{surface.ScreenEntityId}",
                "proceed_rewards",
                "navigation",
                surface.ProceedSkipsRemainingRewards
                    ? "Skip remaining rewards and continue"
                    : "Continue from rewards",
                "NRewardsScreen.ProceedButton+visible-map-or-owner-handoff",
                new[] { screen }));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildCardRewardBindings(
        BridgeObservationDraft draft,
        CardRewardSelectionSurface surface)
        => DescribeCardRewardCommands(surface)
            .Select(action => BuildNativeBinding(draft, action))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();

    internal static IReadOnlyList<BridgeActionDraft> DescribeCardRewardCommands(
        CardRewardSelectionSurface surface)
    {
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        var selectableCardIds = surface.SelectableCardEntityIds.ToHashSet(StringComparer.Ordinal);
        foreach (VisibleCard card in surface.Cards.Where(value =>
                     selectableCardIds.Contains(value.EntityId)))
        {
            actions.Add(NativeDescriptor(
                $"card-reward:select:{surface.ScreenEntityId}:{card.EntityId}",
                "select_card_reward",
                "selection",
                $"Take {card.Name ?? card.DefinitionId}",
                "NGridCardHolder.CardModel+NCardHolder._isClickable+Pressed+option-set-post-state",
                new[]
                {
                    screen,
                    new ActionEntityBinding("card", card.EntityId)
                }));
        }
        foreach (VisibleCardRewardAlternative alternative in surface.Alternatives.Where(
                     value => value.Enabled))
        {
            actions.Add(NativeDescriptor(
                $"card-reward:alternative:{surface.ScreenEntityId}:{alternative.EntityId}",
                "choose_card_reward_alternative",
                "alternative",
                alternative.Label,
                "NCardRewardAlternativeButton.visible_label+ForceClick+option-set-post-state",
                new[]
                {
                    screen,
                    new ActionEntityBinding("alternative", alternative.EntityId)
                }));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildShopInventoryBindings(
        BridgeObservationDraft draft,
        ShopInventorySurface surface)
        => DescribeShopInventoryCommands(surface)
            .Select(action => BuildNativeBinding(draft, action))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();

    internal static IReadOnlyList<BridgeActionDraft> DescribeShopInventoryCommands(
        ShopInventorySurface surface)
    {
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        foreach (VisibleShopCardOffer offer in surface.Cards.Where(value =>
                     value.CanPurchase && value.Card != null))
        {
            actions.Add(NativeDescriptor(
                $"shop:card:{surface.ScreenEntityId}:{offer.EntityId}",
                "purchase_shop_card",
                "purchase",
                $"Buy {offer.Card!.Name ?? offer.Card.DefinitionId} for {offer.Price} gold",
                "MerchantCardEntry.OnTryPurchaseWrapper+exact-card-deck-gold-entry-witness",
                new[]
                {
                    screen,
                    new ActionEntityBinding("shop_offer", offer.EntityId)
                }));
        }
        foreach (VisibleShopRelicOffer offer in surface.Relics.Where(value =>
                     value.CanPurchase && value.Relic != null))
        {
            actions.Add(NativeDescriptor(
                $"shop:relic:{surface.ScreenEntityId}:{offer.EntityId}",
                "purchase_shop_relic",
                "purchase",
                $"Buy {offer.Relic!.Name ?? offer.Relic.DefinitionId} for {offer.Price} gold",
                "MerchantRelicEntry.OnTryPurchaseWrapper+exact-relic-gold-entry-witness",
                new[]
                {
                    screen,
                    new ActionEntityBinding("shop_offer", offer.EntityId)
                }));
        }
        foreach (VisibleShopPotionOffer offer in surface.Potions.Where(value =>
                     value.CanPurchase && value.DefinitionId != null))
        {
            actions.Add(NativeDescriptor(
                $"shop:potion:{surface.ScreenEntityId}:{offer.EntityId}",
                "purchase_shop_potion",
                "purchase",
                $"Buy {offer.Name ?? offer.DefinitionId} for {offer.Price} gold",
                "MerchantPotionEntry.OnTryPurchaseWrapper+exact-potion-slot-gold-entry-witness",
                new[]
                {
                    screen,
                    new ActionEntityBinding("shop_offer", offer.EntityId)
                }));
        }
        if (surface.CardRemoval is { CanPurchase: true } removal)
        {
            actions.Add(NativeDescriptor(
                $"shop:removal:{surface.ScreenEntityId}:{removal.EntityId}",
                "open_shop_card_removal",
                "selection",
                $"Choose a card to remove for {removal.Price} gold",
                "MerchantCardRemovalEntry.OnTryPurchaseWrapper+CardSelectCmd.FromDeckForRemoval",
                new[]
                {
                    screen,
                    new ActionEntityBinding("shop_card_removal", removal.EntityId)
                }));
        }
        if (surface.CanClose)
        {
            actions.Add(NativeDescriptor(
                $"shop:close:{surface.ScreenEntityId}",
                "close_shop_inventory",
                "navigation",
                "Close shop inventory",
                "NMerchantInventory.BackButton+NBackButton.ForceClick",
                new[] { screen }));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildMainMenuBindings(
        BridgeObservationDraft draft,
        MainMenuSurface surface)
        => DescribeMainMenuCommands(surface)
            .Select(action => BuildNativeBinding(draft, action))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();

    internal static IReadOnlyList<BridgeActionDraft> DescribeMainMenuCommands(
        MainMenuSurface surface)
    {
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("menu_screen", surface.ScreenEntityId);
        if (surface.ContinueRun != null && IsActionableMenuOption(surface.Options, "continue"))
        {
            actions.Add(NativeDescriptor(
                $"continue_run:{surface.ScreenEntityId}",
                "continue_run",
                "navigation",
                "Continue the saved run",
                "NMainMenu.ContinueButton+active-run-witness",
                new[] { screen }));
        }
        if (IsActionableMenuOption(surface.Options, "singleplayer"))
        {
            actions.Add(NativeDescriptor(
                $"open_singleplayer:{surface.ScreenEntityId}",
                "open_singleplayer",
                "navigation",
                "Open Single Player",
                "NMainMenu.SingleplayerButton+submenu-owner-witness",
                new[] { screen }));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildSingleplayerMenuBindings(
        BridgeObservationDraft draft,
        SingleplayerMenuSurface surface)
        => DescribeSingleplayerMenuCommands(surface)
            .Select(action => BuildNativeBinding(draft, action))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();

    internal static IReadOnlyList<BridgeActionDraft> DescribeSingleplayerMenuCommands(
        SingleplayerMenuSurface surface)
    {
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("menu_screen", surface.ScreenEntityId);
        if (IsActionableMenuOption(surface.Options, "standard"))
        {
            actions.Add(NativeDescriptor(
                $"open_standard_run_setup:{surface.ScreenEntityId}",
                "open_standard_run_setup",
                "navigation",
                "Open Standard run setup",
                "NSingleplayerSubmenu.StandardButton+character-select-owner-witness",
                new[] { screen }));
        }
        if (IsActionableMenuOption(surface.Options, "back"))
        {
            actions.Add(NativeDescriptor(
                $"back_from_singleplayer_menu:{surface.ScreenEntityId}",
                "back_from_singleplayer_menu",
                "navigation",
                "Back to main menu",
                "NSingleplayerSubmenu.BackButton+root-owner-witness",
                new[] { screen }));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildCharacterSelectBindings(
        BridgeObservationDraft draft,
        CharacterSelectSurface surface)
        => DescribeCharacterSelectCommands(surface)
            .Select(action => BuildNativeBinding(draft, action))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();

    internal static IReadOnlyList<BridgeActionDraft> DescribeCharacterSelectCommands(
        CharacterSelectSurface surface)
    {
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        foreach (VisibleCharacterChoice character in surface.Characters.Where(value =>
                     !value.IsLocked && !value.IsSelected))
        {
            actions.Add(NativeDescriptor(
                $"select_character:{surface.ScreenEntityId}:{character.EntityId}",
                "select_character",
                "selection",
                $"Select {character.Name}",
                "NCharacterSelectButton.Select+exact-selected-button-witness",
                new[]
                {
                    screen,
                    new ActionEntityBinding("character_choice", character.EntityId)
                }));
        }
        if (surface.CanDecreaseAscension)
        {
            actions.Add(NativeDescriptor(
                $"decrease_ascension:{surface.ScreenEntityId}:{surface.Ascension}",
                "decrease_ascension",
                "configuration",
                "Decrease Ascension",
                "NAscensionPanel.LeftArrow+exact-level-witness",
                new[] { screen }));
        }
        if (surface.CanIncreaseAscension)
        {
            actions.Add(NativeDescriptor(
                $"increase_ascension:{surface.ScreenEntityId}:{surface.Ascension}",
                "increase_ascension",
                "configuration",
                "Increase Ascension",
                "NAscensionPanel.RightArrow+exact-level-witness",
                new[] { screen }));
        }
        VisibleCharacterChoice? selected = surface.Characters.SingleOrDefault(value => value.IsSelected);
        if (surface.CanEmbark && selected != null)
        {
            actions.Add(NativeDescriptor(
                $"embark_standard_run:{surface.ScreenEntityId}:{selected.EntityId}:{surface.Ascension ?? 0}",
                "embark_standard_run",
                "commit",
                "Embark",
                "NCharacterSelectScreen.ConfirmButton+RunManager-active-run-witness",
                new[]
                {
                    screen,
                    new ActionEntityBinding("character_choice", selected.EntityId)
                }));
        }
        if (surface.CanGoBack)
        {
            actions.Add(NativeDescriptor(
                $"back_from_character_select:{surface.ScreenEntityId}",
                "back_from_character_select",
                "navigation",
                "Back",
                "NCharacterSelectScreen.BackButton+submenu-owner-change-witness",
                new[] { screen }));
        }
        return actions;
    }

    private static bool IsActionableMenuOption(
        IReadOnlyList<VisibleMenuOption> options,
        string semanticId) =>
        options.Any(option =>
            string.Equals(option.SemanticId, semanticId, StringComparison.Ordinal)
            && option.Enabled
            && string.Equals(option.BridgeSupport, "actionable", StringComparison.Ordinal));

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildGeneratedCardChoiceBindings(
        BridgeObservationDraft draft,
        GeneratedCardChoiceSurface surface)
        => GeneratedCardChoiceSurfaceProvider.DescribeNativeCommands(surface)
            .Select(action => BuildNativeBinding(draft, action))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildCombatHandBindings(
        BridgeObservationDraft draft,
        CombatHandCardSelectionSurface surface)
    {
        var result = new List<ConnectorV3BoundCommand>();
        foreach (BridgeActionDraft action in DescribeCombatHandCommands(surface))
        {
            if (BuildNativeBinding(draft, action) is not { } binding)
                continue;
            var operands = binding.Candidate.Operands.ToDictionary(
                pair => pair.Key,
                pair => pair.Value,
                StringComparer.Ordinal);
            operands["hand_id"] = surface.HandEntityId;
            ActionEntityBinding[] entityBindings = binding.Candidate.EntityBindings
                .Append(new ActionEntityBinding("hand", surface.HandEntityId))
                .Distinct()
                .ToArray();
            result.Add(binding with
            {
                Candidate = binding.Candidate with
                {
                    Operands = operands,
                    EntityBindings = entityBindings
                }
            });
        }
        return result;
    }

    internal static IReadOnlyList<BridgeActionDraft> DescribeCombatHandCommands(
        CombatHandCardSelectionSurface surface)
    {
        var cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        var actions = new List<BridgeActionDraft>();
        foreach (string cardId in surface.SelectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            string cardName = card.Name ?? card.DefinitionId;
            bool replaces = surface.SelectionMode == "upgrade_select"
                ? surface.SelectedCount > 0
                : surface.SelectedCount >= surface.MaxSelect;
            actions.Add(NativeDescriptor(
                $"select_combat_hand_card:{cardId}",
                "select_combat_hand_card",
                "selection",
                replaces ? $"Replace current selection with {cardName}" : $"Select {cardName}",
                "NPlayerHand.OnHolderPressed+SelectCardInSimpleMode/SelectCardInUpgradeMode",
                new[] { new ActionEntityBinding("card", cardId) }));
        }
        foreach (string cardId in surface.DeselectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"deselect_combat_hand_card:{cardId}",
                "deselect_combat_hand_card",
                "selection",
                $"Deselect {card.Name ?? card.DefinitionId}",
                "NSelectedHandCardContainer.DeselectHolder",
                new[] { new ActionEntityBinding("card", cardId) }));
        }
        if (surface.CanConfirm)
        {
            actions.Add(NativeDescriptor(
                "confirm_combat_hand_selection",
                "confirm_combat_hand_selection",
                "commit",
                "Confirm selected cards",
                "NPlayerHand.%SelectModeConfirmButton",
                Array.Empty<ActionEntityBinding>()));
        }
        if (surface.CanClosePeek)
        {
            actions.Add(NativeDescriptor(
                "close_combat_hand_peek",
                "close_combat_hand_peek",
                "navigation",
                "Return to card selection",
                "NPeekButton.OnRelease+SetPeeking(false)",
                Array.Empty<ActionEntityBinding>()));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildDeckUpgradeBindings(
        BridgeObservationDraft draft,
        DeckUpgradeSelectionSurface surface)
    {
        var result = new List<ConnectorV3BoundCommand>();
        foreach (BridgeActionDraft action in DescribeDeckUpgradeCommands(surface))
        {
            if (BuildNativeBinding(draft, action) is not { } binding)
                continue;
            ConnectorV3CommandCandidate candidate = binding.Candidate;
            if (action.Kind == "toggle_deck_upgrade_card")
            {
                string? cardId = action.EntityBindings?
                    .FirstOrDefault(entity => entity.Role == "card")?.EntityId;
                if (cardId == null)
                    continue;
                string command = surface.DeselectableCardEntityIds.Contains(
                    cardId,
                    StringComparer.Ordinal)
                    ? "deselect_entity"
                    : "select_entity";
                candidate = candidate with
                {
                    Command = command,
                    CandidateId = BuildCandidateId(command, candidate.Operation, candidate.Operands)
                };
            }
            else if (action.Kind == "confirm_deck_upgrade")
            {
                var operands = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["screen_id"] = surface.ScreenEntityId,
                    ["control_id"] = action.Kind
                };
                candidate = candidate with
                {
                    Operands = operands,
                    CandidateId = BuildCandidateId(candidate.Command, candidate.Operation, operands)
                };
            }
            result.Add(binding with { Candidate = candidate });
        }
        return result;
    }

    internal static IReadOnlyList<BridgeActionDraft> DescribeDeckUpgradeCommands(
        DeckUpgradeSelectionSurface surface)
    {
        var cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        foreach (string cardId in surface.SelectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"select_deck_upgrade_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_deck_upgrade_card",
                "selection",
                $"Select {card.Name ?? card.DefinitionId} for upgrade",
                "NDeckUpgradeSelectScreen.OnCardClicked+exact-unselected-card",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        foreach (string cardId in surface.DeselectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"deselect_deck_upgrade_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_deck_upgrade_card",
                "selection",
                $"Deselect {card.Name ?? card.DefinitionId}",
                "NDeckUpgradeSelectScreen.OnCardClicked+exact-selected-card",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        if (surface.CanCancelSelection)
        {
            actions.Add(NativeDescriptor(
                $"cancel_deck_upgrade_selection:{surface.ScreenEntityId}",
                "cancel_deck_upgrade_selection",
                "cancel",
                "Cancel deck upgrade selection",
                "NDeckUpgradeSelectScreen.CloseSelection+exact-selection-owner",
                new[] { screen }));
        }
        if (surface.CanCancelPreview)
        {
            actions.Add(NativeDescriptor(
                $"cancel_deck_upgrade_preview:{surface.ScreenEntityId}",
                "cancel_deck_upgrade_preview",
                "cancel",
                "Return to upgrade selection",
                "NDeckUpgradeSelectScreen.CancelSelection+exact-preview-owner",
                new[] { screen }));
        }
        if (surface.CanConfirm)
        {
            actions.Add(NativeDescriptor(
                $"confirm_deck_upgrade:{surface.ScreenEntityId}",
                "confirm_deck_upgrade",
                "commit",
                "Confirm the visible card upgrade",
                "NDeckUpgradeSelectScreen.ConfirmSelection+exact-selected-membership",
                new[] { screen }.Concat(
                    surface.SelectedCardEntityIds.Select(id => new ActionEntityBinding("card", id)))
                    .ToArray()));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildDeckRemovalBindings(
        BridgeObservationDraft draft,
        DeckRemovalSelectionSurface surface)
    {
        var result = new List<ConnectorV3BoundCommand>();
        foreach (BridgeActionDraft action in DescribeDeckRemovalCommands(surface))
        {
            if (BuildNativeBinding(draft, action) is not { } binding)
                continue;
            ConnectorV3CommandCandidate candidate = binding.Candidate;
            if (action.Kind == "toggle_deck_removal_card")
            {
                string? cardId = action.EntityBindings?
                    .FirstOrDefault(entity => entity.Role == "card")?.EntityId;
                if (cardId == null)
                    continue;
                string command = surface.DeselectableCardEntityIds.Contains(
                    cardId,
                    StringComparer.Ordinal)
                    ? "deselect_entity"
                    : "select_entity";
                candidate = candidate with
                {
                    Command = command,
                    CandidateId = BuildCandidateId(command, candidate.Operation, candidate.Operands)
                };
            }
            else if (action.Kind is "preview_deck_removal" or "confirm_deck_removal")
            {
                var operands = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["screen_id"] = surface.ScreenEntityId,
                    ["control_id"] = action.Kind
                };
                candidate = candidate with
                {
                    Operands = operands,
                    CandidateId = BuildCandidateId(candidate.Command, candidate.Operation, operands)
                };
            }
            result.Add(binding with { Candidate = candidate });
        }
        return result;
    }

    internal static IReadOnlyList<BridgeActionDraft> DescribeDeckRemovalCommands(
        DeckRemovalSelectionSurface surface)
    {
        if (surface.Kind is not (
            "deck_removal_selection" or
            "relic_deck_removal_selection" or
            "reward_deck_removal_selection"))
            return Array.Empty<BridgeActionDraft>();
        string sourceLabel = surface.Kind switch
        {
            "deck_removal_selection" => "merchant",
            "relic_deck_removal_selection" => "precise_scissors",
            _ => "card_removal_reward"
        };
        string sourceEvidence = surface.Kind switch
        {
            "deck_removal_selection" => "MerchantCardRemovalEntry",
            "relic_deck_removal_selection" => "PreciseScissors.AfterObtained task-local binding",
            _ => "CardRemovalReward.OnSelect task-local binding"
        };
        var cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        foreach (string cardId in surface.SelectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"select_{sourceLabel}_removal_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_deck_removal_card",
                "selection",
                $"Select {card.Name ?? card.DefinitionId} to remove",
                $"{sourceEvidence}+NCardGrid.HolderPressed+exact-unselected-card",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        foreach (string cardId in surface.DeselectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"deselect_{sourceLabel}_removal_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_deck_removal_card",
                "selection",
                $"Deselect {card.Name ?? card.DefinitionId}",
                $"{sourceEvidence}+NCardGrid.HolderPressed+exact-selected-card",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        ActionEntityBinding[] selected = new[] { screen }.Concat(
            surface.SelectedCardEntityIds.Select(id => new ActionEntityBinding("card", id)))
            .ToArray();
        if (surface.CanPreview)
        {
            actions.Add(NativeDescriptor(
                $"preview_{sourceLabel}_removal:{surface.ScreenEntityId}",
                "preview_deck_removal",
                "preview",
                "Preview removal of the selected card",
                "NDeckCardSelectScreen._confirmButton+exact-selected-membership",
                selected));
        }
        if (surface.CanCancelSelection && surface.Kind != "relic_deck_removal_selection")
        {
            actions.Add(NativeDescriptor(
                $"cancel_{sourceLabel}_removal_selection:{surface.ScreenEntityId}",
                "cancel_deck_removal_selection",
                "cancel",
                "Cancel card removal",
                $"NDeckCardSelectScreen._closeButton+exact-{sourceLabel}-source",
                new[] { screen }));
        }
        if (surface.CanCancelPreview)
        {
            actions.Add(NativeDescriptor(
                $"cancel_{sourceLabel}_removal_preview:{surface.ScreenEntityId}",
                "cancel_deck_removal_preview",
                "cancel",
                "Return to removal selection",
                $"NDeckCardSelectScreen._previewCancelButton+exact-{sourceLabel}-source",
                new[] { screen }));
        }
        if (surface.CanConfirm)
        {
            actions.Add(NativeDescriptor(
                $"confirm_{sourceLabel}_removal:{surface.ScreenEntityId}",
                "confirm_deck_removal",
                "commit",
                "Confirm removal of the selected card",
                $"{sourceEvidence}+source-specific-exact-card-completion",
                selected));
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildCardBundleBindings(
        BridgeObservationDraft draft,
        CardBundleSelectionSurface surface)
    {
        var result = new List<ConnectorV3BoundCommand>();
        foreach (BridgeActionDraft action in DescribeCardBundleCommands(surface))
        {
            if (BuildNativeBinding(draft, action) is not { } binding)
                continue;
            ConnectorV3CommandCandidate candidate = binding.Candidate;
            string? bundleId = action.EntityBindings?
                .FirstOrDefault(entity => entity.Role == "bundle")?.EntityId;
            if (bundleId == null)
                continue;
            var exactOperands = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["screen_id"] = surface.ScreenEntityId,
                ["bundle_id"] = bundleId
            };
            string command = candidate.Command;
            if (action.Kind == "preview_card_bundle")
            {
                command = "select_entity";
            }
            else if (action.Kind is "confirm_card_bundle" or "cancel_card_bundle_preview")
            {
                exactOperands["control_id"] = action.Kind;
            }
            candidate = candidate with
            {
                Command = command,
                Operands = exactOperands,
                CandidateId = BuildCandidateId(command, candidate.Operation, exactOperands)
            };
            result.Add(binding with { Candidate = candidate });
        }
        return result;
    }

    internal static IReadOnlyList<BridgeActionDraft> DescribeCardBundleCommands(
        CardBundleSelectionSurface surface)
    {
        var actions = new List<BridgeActionDraft>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        if (surface.Stage == "choosing")
        {
            HashSet<string> selectable = surface.SelectableBundleEntityIds.ToHashSet(
                StringComparer.Ordinal);
            foreach (VisibleCardBundle bundle in surface.Bundles.Where(value =>
                         selectable.Contains(value.EntityId)))
            {
                string names = string.Join(", ", bundle.Cards.Select(card =>
                    card.Name ?? card.DefinitionId));
                actions.Add(NativeDescriptor(
                    $"preview_card_bundle:{surface.ScreenEntityId}:{bundle.EntityId}",
                    "preview_card_bundle",
                    "selection",
                    $"Preview bundle: {names}",
                    "ScrollBoxes+NCardBundle.Hitbox+exact-bundle-membership",
                    new[] { screen, new ActionEntityBinding("bundle", bundle.EntityId) }));
            }
        }
        else if (surface.Stage == "preview" && surface.SelectedBundleEntityId is { } bundleId)
        {
            ActionEntityBinding bundle = new("bundle", bundleId);
            if (surface.CanConfirm)
            {
                actions.Add(NativeDescriptor(
                    $"confirm_card_bundle:{surface.ScreenEntityId}:{bundleId}",
                    "confirm_card_bundle",
                    "commit",
                    "Add the previewed bundle to the run deck",
                    "ScrollBoxes+NChooseABundleSelectionScreen.%Confirm+exact-deck-post-state",
                    new[] { screen, bundle }));
            }
            if (surface.CanCancelPreview)
            {
                actions.Add(NativeDescriptor(
                    $"cancel_card_bundle_preview:{surface.ScreenEntityId}:{bundleId}",
                    "cancel_card_bundle_preview",
                    "cancel",
                    "Return to bundle choices",
                    "ScrollBoxes+NChooseABundleSelectionScreen.%Cancel+exact-preview-close",
                    new[] { screen, bundle }));
            }
        }
        return actions;
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildEventRemovalBindings(
        BridgeObservationDraft draft,
        EventDeckRemovalSelectionSurface surface)
    {
        var result = new List<ConnectorV3BoundCommand>();
        foreach (BridgeActionDraft action in EventDeckRemovalSelection.DescribeCommands(surface))
        {
            if (BuildNativeBinding(draft, action) is not { } binding)
                continue;
            ConnectorV3CommandCandidate candidate = binding.Candidate;
            if (action.Kind == "toggle_event_deck_removal_card")
            {
                string? cardId = action.EntityBindings?
                    .FirstOrDefault(entity => entity.Role == "card")?.EntityId;
                if (cardId == null)
                    continue;
                string command = surface.DeselectableCardEntityIds.Contains(
                    cardId,
                    StringComparer.Ordinal)
                    ? "deselect_entity"
                    : "select_entity";
                candidate = candidate with
                {
                    Command = command,
                    CandidateId = BuildCandidateId(command, candidate.Operation, candidate.Operands)
                };
            }
            else if (action.Kind is
                     "cancel_event_deck_removal_preview" or
                     "confirm_event_deck_removal")
            {
                var operands = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["screen_id"] = surface.ScreenEntityId,
                    ["control_id"] = action.Kind
                };
                candidate = candidate with
                {
                    Operands = operands,
                    CandidateId = BuildCandidateId(candidate.Command, candidate.Operation, operands)
                };
            }
            result.Add(binding with { Candidate = candidate });
        }
        return result;
    }

    private static BridgeActionDraft NativeDescriptor(
        string key,
        string operation,
        string category,
        string label,
        string evidenceCode,
        IReadOnlyList<ActionEntityBinding> entityBindings) =>
        new(
            key,
            operation,
            category,
            label,
            evidenceCode,
            static () => BridgeActionStartResult.Rejected(
                "v3_native_binding_required",
                "Connector V3 native commands cannot execute through a draft action."),
            entityBindings);

    private static ConnectorV3BoundCommand? BuildNativeBinding(
        BridgeObservationDraft draft,
        BridgeActionDraft action)
    {
        ActionPermissionScope? scope = BridgeSurfacePermission.FindActionScope(
            draft.Game.Compatibility,
            draft.Surface.Kind,
            action.Kind);
        BridgeBoundActionContract? contract =
            BridgeBoundActionContract.Build(draft.Surface.Kind, action);
        if (scope == null || contract == null || !contract.Matches(scope))
            return null;
        return new ConnectorV3BoundCommand(
            BuildCandidate(action, scope, "native_direct_resolver"),
            null,
            PermissionBinding(scope),
            contract);
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildNativeBindings(
        IReadOnlyList<(
            BridgeActionDraft Action,
            ActionPermissionScope Scope,
            BridgeBoundActionContract Contract)> allowed) =>
        allowed
            .Select(item => new ConnectorV3BoundCommand(
                BuildCandidate(item.Action, item.Scope, "native_direct_resolver"),
                null,
                PermissionBinding(item.Scope),
                item.Contract))
            .ToArray();

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
        Dictionary<string, string> operands = BuildCommandOperands(
            action.Kind,
            command,
            action.EntityBindings ?? Array.Empty<ActionEntityBinding>());
        if (operands.Count == 0 && command != "end_turn")
            operands["control_id"] = action.Kind;
        string candidateId = BuildCandidateId(command, action.Kind, operands);
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

    private static string BuildCandidateId(
        string command,
        string operation,
        IReadOnlyDictionary<string, string> operands) =>
        "candidate_" + BridgeHash.Object(new
        {
            command,
            operation,
            operands = operands.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray()
        })[..20];

    internal static Dictionary<string, string> BuildCommandOperands(
        string operation,
        string command,
        IReadOnlyList<ActionEntityBinding> entityBindings)
    {
        var operands = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (ActionEntityBinding binding in entityBindings)
            operands[OperandName(binding.Role)] = binding.EntityId;

        // Generic controls can coexist on the same owner entity. The semantic
        // control identity distinguishes both activation and cancellation
        // controls without exposing a V2 action id.
        if (command is "activate_control" or "cancel_interaction")
            operands["control_id"] = operation;
        return operands;
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
        {
            return snapshot.Draft.Surface.Kind switch
            {
                "combat_turn" => StartCombatCommand(snapshot, request),
                "shop_room" => StartShopRoomCommand(snapshot, request),
                "shop_inventory" => StartShopInventoryCommand(
                    snapshot,
                    request,
                    binding),
                "map_navigation" => StartMapCommand(snapshot, request),
                "rest_site" => StartRestCommand(snapshot, request),
                "event_option" => StartEventOptionCommand(
                    snapshot,
                    request,
                    binding),
                "reward_claim" => StartRewardClaimCommand(
                    snapshot,
                    request,
                    binding),
                "card_reward_selection" => StartCardRewardCommand(
                    snapshot,
                    request,
                    binding),
                "treasure_room" => StartTreasureRoomCommand(
                    snapshot,
                    request,
                    binding),
                "deck_enchant_selection" => StartDeckEnchantCommand(
                    snapshot,
                    request,
                    binding),
                "main_menu" => StartMainMenuCommand(snapshot, request, binding),
                "singleplayer_menu" => StartSingleplayerMenuCommand(snapshot, request, binding),
                "character_select" => StartCharacterSelectCommand(snapshot, request, binding),
                "generated_card_choice" => StartGeneratedCardChoiceCommand(snapshot, request, binding),
                "combat_hand_card_selection" => StartCombatHandCommand(snapshot, request, binding),
                "deck_upgrade_selection" => StartDeckUpgradeCommand(snapshot, request, binding),
                "deck_removal_selection" or
                "relic_deck_removal_selection" or
                "reward_deck_removal_selection" => StartDeckRemovalCommand(
                    snapshot,
                    request,
                    binding),
                "event_deck_removal_selection" => EventDeckRemovalSelection.Start(
                    Entities,
                    snapshot,
                    request,
                    binding),
                "card_bundle_selection" => StartCardBundleCommand(snapshot, request, binding),
                "game_over" => StartGameOverCommand(snapshot, request, binding),
                _ => BridgeActionStartResult.Rejected(
                    "native_command_owner_unsupported",
                    "The current owner has no Connector V3 native command resolver.")
            };
        }
        return binding.LegacyBinding?.Start()
               ?? BridgeActionStartResult.Rejected(
                   "command_binding_unavailable",
                   "The exact native command binding is no longer available.");
    }

    private static BridgeActionStartResult StartMainMenuCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not MainMenuSurface surface
            || !HasExactOperand(request, "menu_screen_id", surface.ScreenEntityId))
        {
            return BridgeActionStartResult.Rejected(
                "main_menu_owner_changed",
                "The exact main-menu owner is no longer current.");
        }
        return binding.Candidate.Operation switch
        {
            "continue_run" => MainMenuSurfaceProvider.StartContinue(Entities, surface.ScreenEntityId),
            "open_singleplayer" => MainMenuSurfaceProvider.StartOpenSingleplayer(Entities, surface.ScreenEntityId),
            _ => BridgeActionStartResult.Rejected(
                "main_menu_command_unsupported",
                "The requested main-menu command is not supported for this exact interaction.")
        };
    }

    private static BridgeActionStartResult StartSingleplayerMenuCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not SingleplayerMenuSurface surface
            || !HasExactOperand(request, "menu_screen_id", surface.ScreenEntityId))
        {
            return BridgeActionStartResult.Rejected(
                "singleplayer_menu_owner_changed",
                "The exact single-player submenu owner is no longer current.");
        }
        return binding.Candidate.Operation switch
        {
            "open_standard_run_setup" => SingleplayerMenuSurfaceProvider.StartStandard(Entities, surface.ScreenEntityId),
            "back_from_singleplayer_menu" => SingleplayerMenuSurfaceProvider.StartBack(Entities, surface.ScreenEntityId),
            _ => BridgeActionStartResult.Rejected(
                "singleplayer_menu_command_unsupported",
                "The requested single-player menu command is not supported for this exact interaction.")
        };
    }

    private static BridgeActionStartResult StartCharacterSelectCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not CharacterSelectSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return BridgeActionStartResult.Rejected(
                "character_select_owner_changed",
                "The exact character-select owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        return binding.Candidate.Operation switch
        {
            "select_character" when operands.TryGetValue("character_choice_id", out string? choiceId) =>
                CharacterSelectSurfaceProvider.StartSelect(Entities, surface.ScreenEntityId, choiceId),
            "decrease_ascension" =>
                CharacterSelectSurfaceProvider.StartAscensionChange(Entities, surface.ScreenEntityId, -1),
            "increase_ascension" =>
                CharacterSelectSurfaceProvider.StartAscensionChange(Entities, surface.ScreenEntityId, 1),
            "embark_standard_run" when operands.TryGetValue("character_choice_id", out string? selectedId) =>
                CharacterSelectSurfaceProvider.StartEmbark(Entities, surface.ScreenEntityId, selectedId),
            "back_from_character_select" =>
                CharacterSelectSurfaceProvider.StartBack(Entities, surface.ScreenEntityId),
            _ => BridgeActionStartResult.Rejected(
                "character_select_command_unsupported",
                "The requested character-select command is not supported for this exact interaction.")
        };
    }

    private static bool HasExactOperand(
        ConnectorV3CommandRequest request,
        string name,
        string expected) =>
        request.Operands != null
        && request.Operands.TryGetValue(name, out string? actual)
        && string.Equals(actual, expected, StringComparison.Ordinal);

    private static BridgeActionStartResult StartGeneratedCardChoiceCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not GeneratedCardChoiceSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return BridgeActionStartResult.Rejected(
                "generated_choice_owner_changed",
                "The exact generated-card choice owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Command == "select_entity"
            && operands.TryGetValue("card_id", out string? cardId))
        {
            return GeneratedCardChoiceSurfaceProvider.StartSelect(
                Entities,
                surface.ScreenEntityId,
                cardId);
        }
        if (binding.Candidate.Operation.StartsWith("skip_", StringComparison.Ordinal))
        {
            return GeneratedCardChoiceSurfaceProvider.StartSkip(
                Entities,
                surface.ScreenEntityId);
        }
        return BridgeActionStartResult.Rejected(
            "generated_choice_command_unsupported",
            "The requested generated-card command is not supported for this exact source.");
    }

    private static BridgeActionStartResult StartCombatHandCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not CombatHandCardSelectionSurface surface
            || !HasExactOperand(request, "hand_id", surface.HandEntityId))
        {
            return BridgeActionStartResult.Rejected(
                "combat_hand_owner_changed",
                "The exact combat-hand selection owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Operation == "select_combat_hand_card"
            && request.Command == "select_entity"
            && operands.TryGetValue("card_id", out string? selectedCardId))
        {
            return CombatHandCardSelectionSurfaceProvider.StartSelect(
                Entities,
                surface.HandEntityId,
                selectedCardId);
        }
        if (binding.Candidate.Operation == "deselect_combat_hand_card"
            && request.Command == "deselect_entity"
            && operands.TryGetValue("card_id", out string? deselectedCardId))
        {
            return CombatHandCardSelectionSurfaceProvider.StartDeselect(
                Entities,
                surface.HandEntityId,
                deselectedCardId);
        }
        if (binding.Candidate.Operation == "confirm_combat_hand_selection"
            && request.Command == "confirm_interaction"
            && HasExactOperand(request, "control_id", "confirm_combat_hand_selection"))
        {
            return CombatHandCardSelectionSurfaceProvider.StartConfirm(
                Entities,
                surface.HandEntityId);
        }
        if (binding.Candidate.Operation == "close_combat_hand_peek"
            && request.Command == "cancel_interaction"
            && HasExactOperand(request, "control_id", "close_combat_hand_peek"))
        {
            return CombatHandCardSelectionSurfaceProvider.StartClosePeek(
                Entities,
                surface.HandEntityId);
        }
        return BridgeActionStartResult.Rejected(
            "combat_hand_command_unsupported",
            "The command does not match the exact current combat-hand interaction.");
    }

    private static BridgeActionStartResult StartDeckUpgradeCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not DeckUpgradeSelectionSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return BridgeActionStartResult.Rejected(
                "deck_upgrade_owner_changed",
                "The exact deck-upgrade owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Operation == "toggle_deck_upgrade_card"
            && operands.TryGetValue("card_id", out string? cardId))
        {
            if (request.Command == "select_entity"
                && surface.SelectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return DeckUpgradeSelectionSurfaceProvider.StartToggle(
                    Entities,
                    surface.ScreenEntityId,
                    cardId,
                    expectedSelected: false);
            }
            if (request.Command == "deselect_entity"
                && surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return DeckUpgradeSelectionSurfaceProvider.StartToggle(
                    Entities,
                    surface.ScreenEntityId,
                    cardId,
                    expectedSelected: true);
            }
        }
        if (binding.Candidate.Operation == "cancel_deck_upgrade_selection"
            && surface.Stage == "selecting"
            && surface.CanCancelSelection
            && request.Command == "cancel_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return DeckUpgradeSelectionSurfaceProvider.StartClose(
                Entities,
                surface.ScreenEntityId);
        }
        if (binding.Candidate.Operation == "cancel_deck_upgrade_preview"
            && surface.Stage == "preview"
            && surface.CanCancelPreview
            && request.Command == "cancel_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return DeckUpgradeSelectionSurfaceProvider.StartPreviewCancel(
                Entities,
                surface.ScreenEntityId);
        }
        if (binding.Candidate.Operation == "confirm_deck_upgrade"
            && surface.Stage == "preview"
            && surface.CanConfirm
            && request.Command == "confirm_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return DeckUpgradeSelectionSurfaceProvider.StartConfirm(
                Entities,
                surface.ScreenEntityId,
                surface.SelectedCardEntityIds);
        }
        return BridgeActionStartResult.Rejected(
            "deck_upgrade_command_unsupported",
            "The command does not match the exact current deck-upgrade stage and membership.");
    }

    private static BridgeActionStartResult StartDeckRemovalCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not DeckRemovalSelectionSurface surface
            || surface.Kind is not (
                "deck_removal_selection" or
                "relic_deck_removal_selection" or
                "reward_deck_removal_selection")
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return BridgeActionStartResult.Rejected(
                "deck_removal_owner_changed",
                "The exact source-bound deck-removal owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Operation == "toggle_deck_removal_card"
            && operands.TryGetValue("card_id", out string? cardId))
        {
            if (request.Command == "select_entity"
                && surface.SelectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return DeckRemovalSelectionSurfaceProvider.StartDirectToggle(
                    Entities,
                    surface.Kind,
                    surface.ScreenEntityId,
                    cardId,
                    expectedSelected: false);
            }
            if (request.Command == "deselect_entity"
                && surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return DeckRemovalSelectionSurfaceProvider.StartDirectToggle(
                    Entities,
                    surface.Kind,
                    surface.ScreenEntityId,
                    cardId,
                    expectedSelected: true);
            }
        }
        if (binding.Candidate.Operation == "preview_deck_removal"
            && surface.Stage == "selecting"
            && surface.CanPreview
            && request.Command == "confirm_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return DeckRemovalSelectionSurfaceProvider.StartDirectPreview(
                Entities,
                surface.Kind,
                surface.ScreenEntityId);
        }
        if (binding.Candidate.Operation == "cancel_deck_removal_selection"
            && surface.Stage == "selecting"
            && surface.CanCancelSelection
            && request.Command == "cancel_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return DeckRemovalSelectionSurfaceProvider.StartDirectClose(
                Entities,
                surface.Kind,
                surface.ScreenEntityId);
        }
        if (binding.Candidate.Operation == "cancel_deck_removal_preview"
            && surface.Stage == "preview"
            && surface.CanCancelPreview
            && request.Command == "cancel_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return DeckRemovalSelectionSurfaceProvider.StartDirectPreviewCancel(
                Entities,
                surface.Kind,
                surface.ScreenEntityId);
        }
        if (binding.Candidate.Operation == "confirm_deck_removal"
            && surface.Stage == "preview"
            && surface.CanConfirm
            && request.Command == "confirm_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return DeckRemovalSelectionSurfaceProvider.StartDirectConfirm(
                Entities,
                surface.Kind,
                surface.ScreenEntityId,
                surface.SelectedCardEntityIds);
        }
        return BridgeActionStartResult.Rejected(
            "deck_removal_command_unsupported",
            "The command does not match the exact current source-bound removal stage and membership.");
    }

    private static BridgeActionStartResult StartCardBundleCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not CardBundleSelectionSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return BridgeActionStartResult.Rejected(
                "card_bundle_owner_changed",
                "The exact card-bundle owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("bundle_id", out string? bundleId))
        {
            return BridgeActionStartResult.Rejected(
                "card_bundle_binding_changed",
                "The exact card-bundle operand is missing.");
        }
        if (binding.Candidate.Operation == "preview_card_bundle"
            && surface.Stage == "choosing"
            && request.Command == "select_entity")
        {
            return CardBundleSelectionSurfaceProvider.StartDirectPreview(
                Entities,
                surface.ScreenEntityId,
                bundleId);
        }
        if (binding.Candidate.Operation == "confirm_card_bundle"
            && surface.Stage == "preview"
            && string.Equals(surface.SelectedBundleEntityId, bundleId, StringComparison.Ordinal)
            && request.Command == "confirm_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return CardBundleSelectionSurfaceProvider.StartDirectConfirm(
                Entities,
                surface.ScreenEntityId,
                bundleId);
        }
        if (binding.Candidate.Operation == "cancel_card_bundle_preview"
            && surface.Stage == "preview"
            && string.Equals(surface.SelectedBundleEntityId, bundleId, StringComparison.Ordinal)
            && request.Command == "cancel_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return CardBundleSelectionSurfaceProvider.StartDirectCancel(
                Entities,
                surface.ScreenEntityId,
                bundleId);
        }
        return BridgeActionStartResult.Rejected(
            "card_bundle_command_unsupported",
            "The command does not match the exact current card-bundle stage and source.");
    }

    private static BridgeActionStartResult StartGameOverCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not GameOverSurface surface
            || !HasExactOperand(
                request,
                "game_over_screen_id",
                surface.ScreenEntityId)
            || !HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return BridgeActionStartResult.Rejected(
                "game_over_owner_changed",
                "The exact game-over owner or semantic control is no longer current.");
        }
        if (binding.Candidate.Operation == "advance_game_over_summary"
            && surface.Stage == "intro"
            && surface.CanAdvanceSummary)
        {
            return GameOverSurfaceProvider.StartAdvance(
                Entities,
                surface.ScreenEntityId);
        }
        if (binding.Candidate.Operation == "return_game_over"
            && surface.Stage == "summary"
            && surface.CanReturn)
        {
            return GameOverSurfaceProvider.StartReturn(
                Entities,
                surface.ScreenEntityId);
        }
        return BridgeActionStartResult.Rejected(
            "game_over_command_unsupported",
            "The requested game-over command does not match the current exact stage.");
    }

    private static BridgeActionStartResult StartMapCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request)
    {
        if (snapshot.Draft.Surface is not MapNavigationSurface surface)
        {
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The map-navigation owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("map_screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "map_owner_changed",
                "The exact map screen is no longer current.");
        }

        if (request.Command == "navigate"
            && operands.TryGetValue("map_node_id", out string? nodeId))
        {
            return MapNavigationSurfaceProvider.StartTravel(
                Entities,
                screenId,
                nodeId);
        }
        if (request.Command == "activate_control"
            && operands.TryGetValue("control_id", out string? controlId)
            && string.Equals(controlId, "exit_map_annotation", StringComparison.Ordinal)
            && operands.TryGetValue(
                "map_annotation_input_id",
                out string? annotationInputId))
        {
            return MapNavigationSurfaceProvider.StopAnnotation(
                Entities,
                screenId,
                annotationInputId);
        }

        return BridgeActionStartResult.Rejected(
            "map_command_unsupported",
            "The requested map command is not supported for this exact interaction.");
    }

    private static BridgeActionStartResult StartRestCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request)
    {
        if (snapshot.Draft.Surface is not RestSiteSurface surface)
        {
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The rest-site owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "rest_owner_changed",
                "The exact rest-site screen is no longer current.");
        }

        if (request.Command == "choose"
            && operands.TryGetValue("rest_option_id", out string? optionId))
        {
            return RestSiteSurfaceProvider.StartOption(
                Entities,
                screenId,
                optionId);
        }
        if (request.Command == "activate_control"
            && operands.TryGetValue("control_id", out string? controlId)
            && string.Equals(controlId, "proceed_rest_site", StringComparison.Ordinal))
        {
            return RestSiteSurfaceProvider.StartProceed(Entities, screenId);
        }

        return BridgeActionStartResult.Rejected(
            "rest_command_unsupported",
            "The requested rest-site command is not supported for this exact interaction.");
    }

    private static BridgeActionStartResult StartEventOptionCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not EventOptionSurface surface)
        {
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The event-option owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(
                screenId,
                surface.ScreenEntityId,
                StringComparison.Ordinal)
            || !operands.TryGetValue("choice_id", out string? optionId))
        {
            return BridgeActionStartResult.Rejected(
                "event_option_changed",
                "The exact event room and option binding are no longer current.");
        }

        bool expectedProceed = binding.Candidate.Operation == "proceed_event";
        if (expectedProceed
            && (!operands.TryGetValue("control_id", out string? controlId)
                || !string.Equals(
                    controlId,
                    "proceed_event",
                    StringComparison.Ordinal)))
        {
            return BridgeActionStartResult.Rejected(
                "event_option_command_unsupported",
                "The requested event continuation control is not exact.");
        }

        return EventOptionSurfaceProvider.StartOption(
            Entities,
            screenId,
            optionId,
            expectedProceed);
    }

    private static BridgeActionStartResult StartRewardClaimCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not RewardClaimSurface surface)
        {
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The rewards-screen owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(
                screenId,
                surface.ScreenEntityId,
                StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "reward_owner_changed",
                "The exact rewards screen is no longer current.");
        }

        return binding.Candidate.Operation switch
        {
            "claim_reward"
                when operands.TryGetValue("choice_id", out string? rewardId) =>
                RewardClaimSurfaceProvider.StartClaim(
                    Entities,
                    screenId,
                    rewardId),
            "discard_potion_for_reward"
                when operands.TryGetValue("potion_id", out string? potionId)
                     && operands.TryGetValue(
                         "control_id",
                         out string? discardControl)
                     && string.Equals(
                         discardControl,
                         "discard_potion_for_reward",
                         StringComparison.Ordinal) =>
                RewardClaimSurfaceProvider.StartDiscardPotion(
                    Entities,
                    screenId,
                    potionId),
            "proceed_rewards"
                when operands.TryGetValue(
                         "control_id",
                         out string? proceedControl)
                     && string.Equals(
                         proceedControl,
                         "proceed_rewards",
                         StringComparison.Ordinal) =>
                RewardClaimSurfaceProvider.StartProceed(
                    Entities,
                    screenId),
            _ => BridgeActionStartResult.Rejected(
                "reward_command_unsupported",
                "The requested command is not supported for this exact rewards state.")
        };
    }

    private static BridgeActionStartResult StartCardRewardCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not CardRewardSelectionSurface surface)
        {
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The card reward owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "card_reward_owner_changed",
                "The exact card reward screen is no longer current.");
        }

        if (binding.Candidate.Operation == "select_card_reward"
            && operands.TryGetValue("card_id", out string? cardId)
            && surface.SelectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
        {
            return CardRewardSurfaceProvider.StartCardSelection(
                Entities,
                screenId,
                cardId);
        }
        if (binding.Candidate.Operation == "choose_card_reward_alternative"
            && operands.TryGetValue("choice_id", out string? alternativeId)
            && surface.Alternatives.SingleOrDefault(alternative =>
                alternative.Enabled
                && string.Equals(
                    alternative.EntityId,
                    alternativeId,
                    StringComparison.Ordinal)) is { } alternative)
        {
            return CardRewardSurfaceProvider.StartAlternative(
                Entities,
                screenId,
                alternativeId,
                alternative.Label);
        }
        return BridgeActionStartResult.Rejected(
            "card_reward_command_unsupported",
            "The requested command is not supported for this exact card reward state.");
    }

    private static BridgeActionStartResult StartTreasureRoomCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not TreasureRoomSurface surface)
        {
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The treasure-room owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue(
                "treasure_room_id",
                out string? roomId)
            || !string.Equals(
                roomId,
                surface.RoomEntityId,
                StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "treasure_owner_changed",
                "The exact treasure-room owner is no longer current.");
        }

        return binding.Candidate.Operation switch
        {
            "open_treasure_chest" =>
                TreasureRoomSurfaceProvider.StartOpen(Entities, roomId),
            "choose_treasure_relic"
                when operands.TryGetValue("choice_id", out string? relicId) =>
                TreasureRoomSurfaceProvider.StartChoose(
                    Entities,
                    roomId,
                    relicId),
            "skip_treasure_relic" =>
                TreasureRoomSurfaceProvider.StartSkip(Entities, roomId),
            "proceed_treasure_room" =>
                TreasureRoomSurfaceProvider.StartProceed(Entities, roomId),
            _ => BridgeActionStartResult.Rejected(
                "treasure_command_unsupported",
                "The requested command is not supported for this exact treasure stage.")
        };
    }

    private static BridgeActionStartResult StartDeckEnchantCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not DeckEnchantSelectionSurface surface)
        {
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The deck-enchant owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "enchantment_owner_changed",
                "The exact deck-enchant screen is no longer current.");
        }

        return binding.Candidate.Operation switch
        {
            "toggle_card" when operands.TryGetValue("card_id", out string? cardId) =>
                DeckEnchantSurfaceProvider.StartToggleCard(
                    Entities,
                    screenId,
                    cardId),
            "preview_selection" =>
                DeckEnchantSurfaceProvider.StartMainPreview(Entities, screenId),
            "confirm_selection" =>
                DeckEnchantSurfaceProvider.StartPreviewConfirm(Entities, screenId),
            "cancel_preview" =>
                DeckEnchantSurfaceProvider.StartPreviewCancel(Entities, screenId),
            "close_selection" =>
                DeckEnchantSurfaceProvider.StartClose(Entities, screenId),
            _ => BridgeActionStartResult.Rejected(
                "deck_enchant_command_unsupported",
                "The requested command is not supported for this exact deck-enchant stage.")
        };
    }

    private static BridgeActionStartResult StartShopRoomCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request)
    {
        if (snapshot.Draft.Surface is not ShopRoomSurface surface)
        {
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The merchant-room owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("room_id", out string? roomId)
            || !string.Equals(roomId, surface.RoomEntityId, StringComparison.Ordinal)
            || !operands.TryGetValue("control_id", out string? controlId))
        {
            return BridgeActionStartResult.Rejected(
                "shop_room_binding_changed",
                "The exact merchant room and control binding are no longer current.");
        }

        return controlId switch
        {
            "open_shop_inventory" =>
                ShopRoomSurfaceProvider.StartOpenInventory(Entities, roomId),
            "proceed_shop" =>
                ShopRoomSurfaceProvider.StartProceed(Entities, roomId),
            _ => BridgeActionStartResult.Rejected(
                "shop_room_control_unsupported",
                "The requested merchant-room control is not supported.")
        };
    }

    private static BridgeActionStartResult StartShopInventoryCommand(
        ConnectorV3Snapshot snapshot,
        ConnectorV3CommandRequest request,
        ConnectorV3BoundCommand binding)
    {
        if (snapshot.Draft.Surface is not ShopInventorySurface surface)
        {
            return BridgeActionStartResult.Rejected(
                "owner_changed",
                "The merchant-inventory owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return BridgeActionStartResult.Rejected(
                "shop_inventory_binding_changed",
                "The exact merchant inventory is no longer current.");
        }

        if (binding.Candidate.Operation == "close_shop_inventory")
        {
            return operands.TryGetValue("control_id", out string? closeControl)
                   && string.Equals(
                       closeControl,
                       "close_shop_inventory",
                       StringComparison.Ordinal)
                ? ShopInventorySurfaceProvider.StartCloseInventory(Entities, screenId)
                : BridgeActionStartResult.Rejected(
                    "shop_inventory_command_unsupported",
                    "The requested merchant-inventory close control is not exact.");
        }
        if (binding.Candidate.Operation == "open_shop_card_removal")
        {
            if (!operands.TryGetValue(
                    "shop_card_removal_id",
                    out string? removalId)
                || !operands.TryGetValue("control_id", out string? removalControl)
                || !string.Equals(
                    removalControl,
                    "open_shop_card_removal",
                    StringComparison.Ordinal)
                || surface.CardRemoval is not { CanPurchase: true } removal
                || !string.Equals(
                    removal.EntityId,
                    removalId,
                    StringComparison.Ordinal))
            {
                return BridgeActionStartResult.Rejected(
                    "shop_card_removal_changed",
                    "The exact card-removal service is no longer current.");
            }
            return ShopInventorySurfaceProvider.StartCardRemoval(
                Entities,
                screenId,
                removalId,
                removal.Price);
        }
        if (!operands.TryGetValue("shop_offer_id", out string? offerId))
        {
            return BridgeActionStartResult.Rejected(
                "shop_offer_changed",
                "The exact merchant offer operand is missing.");
        }

        return binding.Candidate.Operation switch
        {
            "purchase_shop_card"
                when surface.Cards.SingleOrDefault(offer =>
                    offer.CanPurchase
                    && string.Equals(
                        offer.EntityId,
                        offerId,
                        StringComparison.Ordinal)) is { } card =>
                ShopInventorySurfaceProvider.StartCardPurchase(
                    Entities,
                    screenId,
                    offerId,
                    card.Price),
            "purchase_shop_relic"
                when surface.Relics.SingleOrDefault(offer =>
                    offer.CanPurchase
                    && string.Equals(
                        offer.EntityId,
                        offerId,
                        StringComparison.Ordinal)) is { } relic =>
                ShopInventorySurfaceProvider.StartRelicPurchase(
                    Entities,
                    screenId,
                    offerId,
                    relic.Price),
            "purchase_shop_potion"
                when surface.Potions.SingleOrDefault(offer =>
                    offer.CanPurchase
                    && string.Equals(
                        offer.EntityId,
                        offerId,
                        StringComparison.Ordinal)) is { } potion =>
                ShopInventorySurfaceProvider.StartPotionPurchase(
                    Entities,
                    screenId,
                    offerId,
                    potion.Price),
            _ => BridgeActionStartResult.Rejected(
                "shop_inventory_command_unsupported",
                "The requested command is not supported for this exact merchant inventory.")
        };
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
        return ClassifyExecutionSupport(
            draft.Game.Compatibility.ActionExecutionAllowed,
            draft.Readiness,
            draft.Surface.Kind,
            bindings.Count,
            bindings.Any(binding => binding.Candidate.AuthorityState == "trial"));
    }

    internal static string ClassifyExecutionSupport(
        bool actionExecutionAllowed,
        string readiness,
        string surfaceKind,
        int bindingCount,
        bool hasTrialBinding)
    {
        if (!actionExecutionAllowed || surfaceKind == "unsupported")
            return "unsupported";
        // A known native interaction can be settling without any command being
        // legal now. Empty candidates during that phase are not an unsupported
        // family and must not terminate a supervising consumer.
        if (readiness != "ready")
            return "supported";
        if (bindingCount == 0)
            return "unsupported";
        return hasTrialBinding ? "trial" : "supported";
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
        "option" or "reward" or "relic" or "bundle" or "alternative" => "choice_id",
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
