using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Runtime;
using STS2_MCP.ConnectorV3.Protocol;
using STS2_MCP.ConnectorV3.Runtime;
using System.Text.Json;
using System.Text.Json.Serialization;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models.Potions;

namespace STS2_MCP.Tests;

public sealed class ConnectorV3ContractTests
{
    [Fact]
    public void BoundedTransportBodyDoesNotTrustContentLength()
    {
        Assert.Equal(
            new byte[] { 1, 2, 3, 4 },
            McpMod.ReadConnectorV3BoundedBodyBytes(
                new MemoryStream(new byte[] { 1, 2, 3, 4 }),
                4));
        Assert.Null(McpMod.ReadConnectorV3BoundedBodyBytes(
            new MemoryStream(new byte[] { 1, 2, 3, 4, 5 }),
            4));
    }

    [Theory]
    [InlineData(true, "settling", "combat_turn", 0, false, "supported")]
    [InlineData(true, "settling", "treasure_room", 0, false, "supported")]
    [InlineData(true, "ready", "combat_turn", 0, false, "unsupported")]
    [InlineData(true, "ready", "combat_turn", 1, true, "trial")]
    [InlineData(true, "ready", "combat_turn", 1, false, "supported")]
    [InlineData(true, "settling", "unsupported", 0, false, "unsupported")]
    [InlineData(false, "settling", "combat_turn", 0, false, "unsupported")]
    public void ExecutionSupportKeepsKnownSettlingInteractionsDistinctFromUnsupported(
        bool actionExecutionAllowed,
        string readiness,
        string surfaceKind,
        int bindingCount,
        bool hasTrialBinding,
        string expected)
    {
        Assert.Equal(
            expected,
            ConnectorV3Runtime.ClassifyExecutionSupport(
                actionExecutionAllowed,
                readiness,
                surfaceKind,
                bindingCount,
                hasTrialBinding));
    }

    [Fact]
    public void SourceUnresolvedSurfaceIsVisibleButUnsupportedEvenWhileDegraded()
    {
        Assert.Equal(
            "unsupported",
            ConnectorV3Runtime.ClassifyExecutionSupport(
                actionExecutionAllowed: true,
                readiness: "degraded",
                surfaceKind: "deck_enchant_selection",
                bindingCount: 0,
                hasTrialBinding: false,
                visibleUnsupported: true));
    }

    [Theory]
    [InlineData(true, true, true, false)]
    [InlineData(false, true, true, true)]
    [InlineData(true, false, true, true)]
    [InlineData(true, true, false, true)]
    public void CombatHandConfirmAcceptsControlConsumptionOrOwnerHandoff(
        bool ownerIsCurrent,
        bool confirmIsEnabled,
        bool confirmIsVisible,
        bool expected)
    {
        Assert.Equal(
            expected,
            CombatHandCardSelectionSurfaceProvider.ConfirmCompletionObserved(
                ownerIsCurrent,
                confirmIsEnabled,
                confirmIsVisible));
    }

    [Theory]
    [InlineData(false, false, false, false, true)]
    [InlineData(true, false, false, true, true)]
    [InlineData(true, true, true, false, true)]
    [InlineData(true, true, false, false, false)]
    [InlineData(true, false, true, false, false)]
    public void CombatMutationCompletionWaitsForNativeQueueSettlement(
        bool combatInProgress,
        bool sourceMutationObserved,
        bool actionQueueEmpty,
        bool requiredSubsurfaceOpened,
        bool expected)
    {
        Assert.Equal(
            expected,
            CombatTurnSurfaceProvider.HasQueuedMutationCompletionBoundary(
                combatInProgress,
                sourceMutationObserved,
                actionQueueEmpty,
                requiredSubsurfaceOpened));
    }

    [Fact]
    public void ObservationAlwaysSerializesNullSharedState()
    {
        var observation = new ConnectorV3ObservationResponse(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.ObservationSchema,
            "test",
            "state-a",
            1,
            DateTimeOffset.UnixEpoch,
            "observed",
            null,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            Array.Empty<BridgeInspectionCatalogEntry>(),
            Array.Empty<ConnectorV3LinkedDetailCatalogEntry>(),
            Array.Empty<BridgeDiagnostic>(),
            Array.Empty<string>(),
            null!);
        string json = JsonSerializer.Serialize(observation, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        Assert.Contains("\"shared_state\":null", json);
    }

    [Fact]
    public void InspectionSerializesV3StateBoundTypedContract()
    {
        var inspection = new ConnectorV3InspectionResponse(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.InspectionSchema,
            "v3inspection-a",
            "state-a",
            "state-a",
            DateTimeOffset.UnixEpoch,
            BridgeInspectionBuilder.RunDeckKind,
            "normal_inspection",
            "unordered_multiset",
            new RunDeckInspectionContent(
                BridgeInspectionBuilder.RunDeckKind,
                0,
                Array.Empty<VisibleCard>()),
            new InspectionCompleteness(
                "complete_for_player_run_deck_contents_without_semantic_order",
                Array.Empty<string>(),
                Array.Empty<string>()),
            null!,
            null!,
            null!,
            Array.Empty<BridgeDiagnostic>());
        string json = JsonSerializer.Serialize(inspection, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        Assert.Contains("\"schema\":\"sts2.connector.v3/inspection-1\"", json);
        Assert.Contains("\"expected_state_token\":\"state-a\"", json);
        Assert.Contains("\"observed_state_token\":\"state-a\"", json);
        Assert.Contains("\"kind\":\"run_deck\"", json);
    }

    [Fact]
    public void LinkedDetailSerializesStateBoundVisibleCardWithoutAuthority()
    {
        var card = new VisibleCard(
            "surface-card-a", "STRIKE", "Strike", "Attack", "1", null,
            "Deal 6 damage.", "Basic", false, false, null);
        var detail = new ConnectorV3LinkedDetailResponse(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.LinkedDetailSchema,
            "detail-a",
            "state-a",
            "state-a",
            DateTimeOffset.UnixEpoch,
            "surface_card",
            card.EntityId,
            card,
            null!,
            null!,
            null!,
            Array.Empty<BridgeDiagnostic>());
        string json = JsonSerializer.Serialize(detail, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });

        Assert.Contains("\"schema\":\"sts2.connector.v3/linked-detail-1\"", json);
        Assert.Contains("\"expected_state_token\":\"state-a\"", json);
        Assert.Contains("\"entity_id\":\"surface-card-a\"", json);
        Assert.Contains("\"definition_id\":\"STRIKE\"", json);
    }

    [Fact]
    public void GenericControlsOnOneOwnerHaveDistinctSemanticOperands()
    {
        var owner = new[] { new ActionEntityBinding("room", "room-a") };
        Dictionary<string, string> open = ConnectorV3Runtime.BuildCommandOperands(
            "open_shop_inventory",
            "activate_control",
            owner);
        Dictionary<string, string> proceed = ConnectorV3Runtime.BuildCommandOperands(
            "proceed_shop",
            "activate_control",
            owner);
        Dictionary<string, string> close = ConnectorV3Runtime.BuildCommandOperands(
            "close_shop_inventory",
            "cancel_interaction",
            new[] { new ActionEntityBinding("screen", "screen-a") });

        Assert.Equal("room-a", open["room_id"]);
        Assert.Equal("open_shop_inventory", open["control_id"]);
        Assert.Equal("proceed_shop", proceed["control_id"]);
        Assert.NotEqual(open["control_id"], proceed["control_id"]);
        Assert.Equal("screen-a", close["screen_id"]);
        Assert.Equal("close_shop_inventory", close["control_id"]);
    }

    [Fact]
    public void MapAnnotationExitRequiresTheTypedCurrentControlFact()
    {
        var blocked = new MapNavigationSurface(
            "map_navigation",
            "map-screen",
            false,
            false,
            "drawing",
            Array.Empty<VisibleMapChoice>())
        {
            AnnotationInputEntityId = "annotation-input",
            CanExitAnnotation = false
        };
        Assert.Empty(ConnectorV3Runtime.DescribeMapCommands(blocked));

        var ready = blocked with { CanExitAnnotation = true };
        ConnectorV3CommandDescriptor command = Assert.Single(
            ConnectorV3Runtime.DescribeMapCommands(ready));

        Assert.Equal("exit_map_annotation", command.Kind);
        Assert.Contains(command.EntityBindings!, binding =>
            binding.Role == "map_annotation_input"
            && binding.EntityId == "annotation-input");
    }

    [Fact]
    public void DeckUpgradeNativeDiscoveryKeepsStageAndExactMembership()
    {
        var card = new VisibleCard(
            "deck-card-a", "STRIKE", "Strike", "Attack", "1", null,
            "Deal 6 damage.", "Basic", false, true, null);
        var selecting = new DeckUpgradeSelectionSurface(
            "deck_upgrade_selection",
            "selecting",
            "upgrade-screen",
            "Choose a card to Upgrade.",
            1,
            1,
            0,
            Array.Empty<string>(),
            true,
            new[] { card.EntityId },
            Array.Empty<string>(),
            true,
            false,
            false,
            new[] { card },
            Array.Empty<VisibleCard>());
        ConnectorV3CommandDescriptor[] selectingCommands =
            ConnectorV3Runtime.DescribeDeckUpgradeCommands(selecting).ToArray();

        Assert.Contains(selectingCommands, command =>
            command.Kind == "toggle_deck_upgrade_card"
            && command.EntityBindings!.Any(binding =>
                binding.Role == "screen" && binding.EntityId == "upgrade-screen")
            && command.EntityBindings!.Any(binding =>
                binding.Role == "card" && binding.EntityId == card.EntityId));
        Assert.Contains(selectingCommands, command =>
            command.Kind == "cancel_deck_upgrade_selection");
        Assert.DoesNotContain(selectingCommands, command =>
            command.Kind is "confirm_deck_upgrade" or "cancel_deck_upgrade_preview");

        var preview = selecting with
        {
            Stage = "preview",
            SelectedCount = 1,
            SelectedCardEntityIds = new[] { card.EntityId },
            SelectableCardEntityIds = Array.Empty<string>(),
            CanCancelSelection = false,
            CanCancelPreview = true,
            CanConfirm = true
        };
        ConnectorV3CommandDescriptor[] previewCommands =
            ConnectorV3Runtime.DescribeDeckUpgradeCommands(preview).ToArray();

        Assert.Contains(previewCommands, command =>
            command.Kind == "cancel_deck_upgrade_preview");
        ConnectorV3CommandDescriptor confirm = Assert.Single(previewCommands, command =>
            command.Kind == "confirm_deck_upgrade");
        Assert.Contains(confirm.EntityBindings!, binding =>
            binding.Role == "card" && binding.EntityId == card.EntityId);
        Assert.DoesNotContain(previewCommands, command =>
            command.Kind is "toggle_deck_upgrade_card" or "cancel_deck_upgrade_selection");
    }

    [Fact]
    public void DeckRemovalNativeDiscoveryKeepsSourceSpecificContractsSeparate()
    {
        var card = new VisibleCard(
            "deck-card-a", "STRIKE", "Strike", "Attack", "1", null,
            "Deal 6 damage.", "Basic", false, true, null);
        var merchant = new DeckRemovalSelectionSurface(
            "deck_removal_selection",
            "selecting",
            "removal-screen",
            "Choose a card to remove.",
            1,
            1,
            1,
            new[] { card.EntityId },
            true,
            Array.Empty<string>(),
            new[] { card.EntityId },
            true,
            true,
            false,
            false,
            new[] { card });

        ConnectorV3CommandDescriptor[] commands =
            ConnectorV3Runtime.DescribeDeckRemovalCommands(merchant).ToArray();

        Assert.Contains(commands, command => command.Kind == "toggle_deck_removal_card");
        Assert.Contains(commands, command => command.Kind == "preview_deck_removal");
        Assert.Contains(commands, command => command.Kind == "cancel_deck_removal_selection");
        Assert.All(commands, command => Assert.Contains(
            command.EntityBindings!,
            binding => binding.Role == "screen" && binding.EntityId == "removal-screen"));

        ConnectorV3CommandDescriptor[] relic = ConnectorV3Runtime.DescribeDeckRemovalCommands(
            merchant with { Kind = "relic_deck_removal_selection" }).ToArray();
        Assert.Contains(relic, command => command.Key.StartsWith(
            "deselect_precise_scissors_removal_card",
            StringComparison.Ordinal));
        Assert.DoesNotContain(relic, command =>
            command.Kind == "cancel_deck_removal_selection");

        ConnectorV3CommandDescriptor[] reward = ConnectorV3Runtime.DescribeDeckRemovalCommands(
            merchant with { Kind = "reward_deck_removal_selection" }).ToArray();
        Assert.Contains(reward, command => command.Key.StartsWith(
            "deselect_card_removal_reward_removal_card",
            StringComparison.Ordinal));
        Assert.Contains(reward, command =>
            command.Kind == "cancel_deck_removal_selection");
    }

    [Fact]
    public void DeckEnchantNativeDiscoveryKeepsPurposeStageAndMembership()
    {
        var card = new VisibleCard(
            "deck-card-a", "STRIKE", "Strike", "Attack", "1", null,
            "Deal 6 damage.", "Basic", false, false, null);
        var selecting = new DeckEnchantSelectionSurface(
            "deck_enchant_selection",
            "selecting",
            "enchant-screen",
            new DeckEnchantSource(
                "symbiote_event",
                "SYMBIOTE",
                "Symbiote+exact_task"),
            "Choose a card.",
            1,
            1,
            0,
            Array.Empty<string>(),
            true,
            new VisibleEnchantment(
                "FIXTURE_ENCHANTMENT",
                "Fixture",
                "Fixture enchantment.",
                1,
                "current_screen"),
            new[] { card })
        {
            SelectableCardEntityIds = new[] { card.EntityId },
            CanCloseSelection = true
        };

        ConnectorV3CommandDescriptor[] selectingCommands =
            ConnectorV3Runtime.DescribeDeckEnchantCommands(selecting).ToArray();

        ConnectorV3CommandDescriptor toggle = Assert.Single(selectingCommands, command =>
            command.Kind == "toggle_card");
        Assert.Contains(toggle.EntityBindings!, binding =>
            binding.Role == "screen" && binding.EntityId == "enchant-screen");
        Assert.Contains(toggle.EntityBindings!, binding =>
            binding.Role == "card" && binding.EntityId == card.EntityId);
        Assert.Contains(selectingCommands, command => command.Kind == "close_selection");
        Assert.DoesNotContain(selectingCommands, command =>
            command.Kind is "confirm_selection" or "cancel_preview");

        var preview = selecting with
        {
            Stage = "preview",
            SelectedCount = 1,
            SelectedCardEntityIds = new[] { card.EntityId },
            SelectableCardEntityIds = Array.Empty<string>(),
            CanCloseSelection = false,
            CanConfirm = true,
            CanCancelPreview = true
        };
        ConnectorV3CommandDescriptor[] previewCommands =
            ConnectorV3Runtime.DescribeDeckEnchantCommands(preview).ToArray();

        ConnectorV3CommandDescriptor confirm = Assert.Single(previewCommands, command =>
            command.Kind == "confirm_selection");
        Assert.Contains(confirm.EntityBindings!, binding =>
            binding.Role == "card" && binding.EntityId == card.EntityId);
        Assert.Contains(previewCommands, command => command.Kind == "cancel_preview");
    }

    [Fact]
    public void EventDialogueNativeDiscoveryBindsOnlyTheCurrentRevealedLine()
    {
        var surface = new EventDialogueSurface(
            "event_dialogue",
            "dialogue-screen",
            1,
            new[]
            {
                new VisibleDialogueLine("line-0", 0, "First", "ancient", false),
                new VisibleDialogueLine("line-1", 1, "Current", "character", true)
            },
            "Continue")
        {
            CanAdvance = true
        };

        ConnectorV3CommandDescriptor command = Assert.Single(
            ConnectorV3Runtime.DescribeEventDialogueCommands(surface));

        Assert.Equal("advance_event_dialogue", command.Kind);
        Assert.Contains(command.EntityBindings!, binding =>
            binding.Role == "screen" && binding.EntityId == "dialogue-screen");
        Assert.Contains(command.EntityBindings!, binding =>
            binding.Role == "dialogue_line" && binding.EntityId == "line-1");
        Assert.DoesNotContain(command.EntityBindings!, binding =>
            binding.EntityId == "line-0");
    }

    [Fact]
    public void AllEnemiesPotionPublishesWithoutInventingCreatureTarget()
    {
        var potion = new ExplosiveAmpoule();

        Assert.Equal(TargetType.AllEnemies, potion.TargetType);
        Assert.True(CombatTurnSurfaceProvider.IsAdvertisablePotionTarget(potion, null));
    }

    [Fact]
    public void RemainingSelectorDiscoveryUsesDirectTypedSurfaceFacts()
    {
        var card = new VisibleCard(
            "card-a", "STRIKE", "Strike", "Attack", "1", null,
            "Deal 6 damage.", "Basic", false, true, null);
        var transform = new DeckTransformSelectionSurface(
            "deck_transform_selection",
            "selecting",
            "transform-screen",
            new DeckTransformSource(
                "whispering_hollow_event",
                "WHISPERING_HOLLOW",
                "WhisperingHollow.Hug+CardSelectCmd.FromDeckForTransformation"),
            "Choose a card to transform.",
            1,
            1,
            0,
            Array.Empty<string>(),
            true,
            true,
            false,
            "none",
            false,
            new[] { card })
        {
            SelectableCardEntityIds = new[] { card.EntityId },
            CanCancelSelection = true,
            CanToggleUpgradeView = true
        };
        ConnectorV3CommandDescriptor[] transformCommands =
            ConnectorV3Runtime.DescribeDeckTransformCommands(transform).ToArray();
        Assert.Contains(transformCommands, command => command.Kind == "toggle_deck_transform_card");
        Assert.Contains(transformCommands, command => command.Kind == "cancel_deck_transform_selection");
        Assert.Contains(transformCommands, command => command.Kind == "toggle_deck_transform_upgrade_view");
        Assert.All(transformCommands, command => Assert.Contains(
            command.EntityBindings!,
            binding => binding.Role == "screen" && binding.EntityId == "transform-screen"));

        var wood = new WoodCarvingsReplacementSelectionSurface(
            "wood_carvings_replacement_selection",
            "preview",
            "wood-screen",
            "Choose a card.",
            "bird",
            "PECK",
            "Peck",
            "Replacement",
            1,
            1,
            1,
            new[] { card.EntityId },
            new[] { card })
        {
            CanConfirm = true,
            CanCancelPreview = true
        };
        ConnectorV3CommandDescriptor[] woodCommands =
            ConnectorV3Runtime.DescribeWoodCarvingsCommands(wood).ToArray();
        Assert.Contains(woodCommands, command => command.Kind == "confirm_wood_carvings_replacement");
        Assert.Contains(woodCommands, command => command.Kind == "cancel_wood_carvings_replacement_preview");

        var pile = new CombatPileCardSelectionSurface(
            "combat_pile_card_selection",
            "pile-screen",
            "Choose a card.",
            "move cards",
            "move_selected_cards",
            "manual_confirm",
            "cleanse",
            "card",
            "source-card",
            "CLEANSE",
            "source-card",
            "CLEANSE",
            "discard",
            "draw",
            "top",
            null,
            null,
            0,
            1,
            1,
            new[] { card.EntityId },
            true,
            false,
            new[] { card })
        {
            DeselectableCardEntityIds = new[] { card.EntityId },
            CanConfirm = true
        };
        ConnectorV3CommandDescriptor[] pileCommands =
            ConnectorV3Runtime.DescribeCombatPileCommands(pile).ToArray();
        Assert.Contains(pileCommands, command => command.Kind == "toggle_combat_pile_card");
        ConnectorV3CommandDescriptor pileConfirm = Assert.Single(
            pileCommands,
            command => command.Kind == "confirm_combat_pile_selection");
        Assert.Contains(pileConfirm.EntityBindings!, binding =>
            binding.Role == "source" && binding.EntityId == "source-card");
    }

    [Fact]
    public void CardBundleNativeDiscoveryKeepsBundlesAtomicAcrossStages()
    {
        var card = new VisibleCard(
            "bundle-card-a", "STRIKE", "Strike", "Attack", "1", null,
            "Deal 6 damage.", "Basic", false, false, null);
        var bundle = new VisibleCardBundle("bundle-a", new[] { card });
        var choosing = new CardBundleSelectionSurface(
            "card_bundle_selection",
            "choosing",
            "bundle-screen",
            "Choose a bundle.",
            null,
            new[] { "bundle-a" },
            false,
            false,
            new[] { bundle });

        ConnectorV3CommandDescriptor preview = Assert.Single(
            ConnectorV3Runtime.DescribeCardBundleCommands(choosing));
        Assert.Equal("preview_card_bundle", preview.Kind);
        Assert.Contains(preview.EntityBindings!, binding =>
            binding.Role == "screen" && binding.EntityId == "bundle-screen");
        Assert.Contains(preview.EntityBindings!, binding =>
            binding.Role == "bundle" && binding.EntityId == "bundle-a");

        ConnectorV3CommandDescriptor[] previewStage = ConnectorV3Runtime.DescribeCardBundleCommands(
            choosing with
            {
                Stage = "preview",
                SelectedBundleEntityId = "bundle-a",
                SelectableBundleEntityIds = Array.Empty<string>(),
                CanConfirm = true,
                CanCancelPreview = true
            })
            .ToArray();
        Assert.Contains(previewStage, command => command.Kind == "confirm_card_bundle");
        Assert.Contains(previewStage, command => command.Kind == "cancel_card_bundle_preview");
        Assert.DoesNotContain(previewStage, command => command.Kind == "preview_card_bundle");
    }

    [Fact]
    public void EventRemovalNativeDiscoveryRequiresExactSourceStageAndMembership()
    {
        var first = new VisibleCard(
            "deck-card-a", "STRIKE", "Strike", "Attack", "1", null,
            "Deal 6 damage.", "Basic", false, true, null);
        var second = first with
        {
            EntityId = "deck-card-b",
            DefinitionId = "DEFEND",
            Name = "Defend"
        };
        var selecting = new EventDeckRemovalSelectionSurface(
            EventDeckRemovalSelection.SurfaceKind,
            "selecting",
            "event-removal-screen",
            EventDeckRemovalSelection.SourceKind,
            "remove_two_cards_then_gain_spore_mind",
            "Choose 2 cards to remove.",
            2,
            2,
            1,
            new[] { first.EntityId },
            new[] { second.EntityId },
            new[] { first.EntityId },
            false,
            false,
            new[] { "remove_selected_cards", "add_spore_mind", "finish_event" },
            new[] { first, second });

        ConnectorV3CommandDescriptor[] selectingCommands =
            EventDeckRemovalSelection.DescribeCommands(selecting).ToArray();
        Assert.Contains(selectingCommands, command =>
            command.Kind == "toggle_event_deck_removal_card"
            && command.EntityBindings!.Any(binding =>
                binding.Role == "card" && binding.EntityId == second.EntityId));
        Assert.DoesNotContain(selectingCommands, command =>
            command.Kind == "confirm_event_deck_removal");

        var preview = selecting with
        {
            Stage = "preview",
            SelectedCount = 2,
            SelectedCardEntityIds = new[] { first.EntityId, second.EntityId },
            SelectableCardEntityIds = Array.Empty<string>(),
            DeselectableCardEntityIds = Array.Empty<string>(),
            CanCancelPreview = true,
            CanConfirm = true
        };
        ConnectorV3CommandDescriptor[] previewCommands =
            EventDeckRemovalSelection.DescribeCommands(preview).ToArray();
        Assert.Contains(previewCommands, command =>
            command.Kind == "cancel_event_deck_removal_preview");
        ConnectorV3CommandDescriptor confirm = Assert.Single(previewCommands, command =>
            command.Kind == "confirm_event_deck_removal");
        Assert.Equal(2, confirm.EntityBindings!.Count(binding => binding.Role == "card"));

        Assert.Empty(EventDeckRemovalSelection.DescribeCommands(
            selecting with { SourceKind = "unknown" }));
        Assert.Equal(
            "ReachIntoTheFlesh",
            LuminousChoirDeckRemovalSourcePatch.ResolveTargetMethod().Name);
        Assert.Equal(
            EventDeckRemovalSourceBinding.Resolution.None,
            EventDeckRemovalSourceBinding.Read(out EventDeckRemovalSourceBinding.ActiveBinding? binding));
        Assert.Null(binding);
    }

    [Fact]
    public void EventRemovalWitnessRequiresWholeNativeTransaction()
    {
        var removedA = new object();
        var removedB = new object();
        var retained = new object();
        var sporeMind = new object();
        object[] baseline = { removedA, removedB, retained };
        object[] selected = { removedA, removedB };
        object[] completed = { retained, sporeMind };

        Assert.True(EventDeckRemovalSelection.CompletionSatisfied(
            true, true, true, baseline, completed, selected, 0, 1));
        Assert.False(EventDeckRemovalSelection.CompletionSatisfied(
            true, true, false, baseline, completed, selected, 0, 1));
        Assert.False(EventDeckRemovalSelection.CompletionSatisfied(
            true, true, true, baseline, new[] { removedA, retained, sporeMind }, selected, 0, 1));
        Assert.False(EventDeckRemovalSelection.CompletionSatisfied(
            true, true, true, baseline, completed, selected, 0, 0));

        Assert.True(EventDeckRemovalSelection.ToggleCompletionSatisfied(
            isCurrent: true,
            isSelected: true,
            expectedSelected: false));
        Assert.True(EventDeckRemovalSelection.ToggleCompletionSatisfied(
            isCurrent: true,
            isSelected: false,
            expectedSelected: true));
        Assert.False(EventDeckRemovalSelection.ToggleCompletionSatisfied(
            isCurrent: false,
            isSelected: true,
            expectedSelected: false));
        Assert.False(EventDeckRemovalSelection.ToggleCompletionSatisfied(
            isCurrent: true,
            isSelected: false,
            expectedSelected: false));
    }

    [Fact]
    public void MenuNativeDiscoveryUsesTypedSurfaceFactsAndExactOwners()
    {
        var main = new MainMenuSurface(
            "main_menu",
            "choosing",
            "menu-root",
            new[]
            {
                new VisibleMenuOption(
                    "continue-button",
                    "continue",
                    "Continue",
                    null,
                    true,
                    "actionable",
                    null),
                new VisibleMenuOption(
                    "singleplayer-button",
                    "singleplayer",
                    "Single Player",
                    null,
                    true,
                    "actionable",
                    null),
                new VisibleMenuOption(
                    "settings-button",
                    "settings",
                    "Settings",
                    null,
                    true,
                    "visible_unsupported",
                    "Not in the bounded contract.")
            },
            new VisibleContinueRunSummary(
                "IRONCLAD",
                "Ironclad",
                "ACT_1",
                "Act 1",
                3,
                70,
                80,
                99,
                0));
        var singleplayer = new SingleplayerMenuSurface(
            "singleplayer_menu",
            "choosing",
            "singleplayer-root",
            new[]
            {
                new VisibleMenuOption(
                    "standard-button",
                    "standard",
                    "Standard",
                    null,
                    true,
                    "actionable",
                    null),
                new VisibleMenuOption(
                    "back-button",
                    "back",
                    "Back",
                    null,
                    false,
                    "visible_unsupported",
                    "Disabled.")
            });

        ConnectorV3CommandDescriptor[] mainCommands =
            ConnectorV3Runtime.DescribeMainMenuCommands(main).ToArray();
        ConnectorV3CommandDescriptor singleplayerCommand = Assert.Single(
            ConnectorV3Runtime.DescribeSingleplayerMenuCommands(singleplayer));

        Assert.Equal(2, mainCommands.Length);
        Assert.Contains(mainCommands, command => command.Kind == "continue_run");
        Assert.Contains(mainCommands, command => command.Kind == "open_singleplayer");
        Assert.All(mainCommands, command => Assert.Contains(
            command.EntityBindings!,
            binding => binding.Role == "menu_screen"
                       && binding.EntityId == "menu-root"));
        Assert.Equal("open_standard_run_setup", singleplayerCommand.Kind);
        Assert.Contains(
            singleplayerCommand.EntityBindings!,
            binding => binding.Role == "menu_screen"
                       && binding.EntityId == "singleplayer-root");
    }

    [Fact]
    public void CharacterSelectNativeDiscoveryBindsOwnerAndExactCharacter()
    {
        var surface = new CharacterSelectSurface(
            "character_select",
            "choosing",
            "character-screen",
            new[]
            {
                new VisibleCharacterChoice(
                    "choice-selected",
                    0,
                    "IRONCLAD",
                    "Ironclad",
                    false,
                    true,
                    false,
                    true),
                new VisibleCharacterChoice(
                    "choice-available",
                    1,
                    "SILENT",
                    "Silent",
                    false,
                    false,
                    false,
                    true),
                new VisibleCharacterChoice(
                    "choice-locked",
                    2,
                    "DEFECT",
                    "Defect",
                    true,
                    false,
                    false,
                    true)
            },
            null,
            3,
            "Ascension 3",
            "Harder enemies.",
            true,
            true,
            true,
            true);

        ConnectorV3CommandDescriptor[] commands =
            ConnectorV3Runtime.DescribeCharacterSelectCommands(surface).ToArray();

        Assert.Equal(5, commands.Length);
        Assert.All(commands, command => Assert.Contains(
            command.EntityBindings!,
            binding => binding.Role == "screen"
                       && binding.EntityId == "character-screen"));
        ConnectorV3CommandDescriptor select = Assert.Single(commands, command =>
            command.Kind == "select_character");
        Assert.Contains(select.EntityBindings!, binding =>
            binding.Role == "character_choice"
            && binding.EntityId == "choice-available");
        Assert.DoesNotContain(commands, command => command.EntityBindings!.Any(binding =>
            binding.EntityId == "choice-locked"));
        ConnectorV3CommandDescriptor embark = Assert.Single(commands, command =>
            command.Kind == "embark_standard_run");
        Assert.Contains(embark.EntityBindings!, binding =>
            binding.Role == "character_choice"
            && binding.EntityId == "choice-selected");

        Dictionary<string, string> operands = ConnectorV3Runtime.BuildCommandOperands(
            select.Kind,
            "select_entity",
            select.EntityBindings!);
        Assert.Equal("character-screen", operands["screen_id"]);
        Assert.Equal("choice-available", operands["character_choice_id"]);
        Assert.DoesNotContain("action_id", operands.Keys);
    }

    [Fact]
    public void GeneratedChoiceNativeOperandsBindOwnerAndExactCard()
    {
        var surface = new GeneratedCardChoiceSurface(
            "generated_card_choice",
            "generated-screen",
            "Choose a Card",
            "choose_one_generated_combat_card",
            "skill_potion",
            "combat_hand",
            "free_this_turn",
            "combat_discard_if_hand_full",
            CanSkip: true,
            IsPeeking: false,
            Cards: new[]
            {
                new VisibleCard(
                    "generated-card", "TRUE_GRIT", "True Grit", "Skill", "1", null,
                    "Gain Block.", "Common", false, false, null),
                new VisibleCard(
                    "blocked-card", "BATTLE_TRANCE", "Battle Trance", "Skill", "0", null,
                    "Draw cards.", "Uncommon", false, false, null)
            })
        {
            SelectableCardEntityIds = new[] { "generated-card" },
            SkipAvailable = true,
            SelectOperation = "select_generated_combat_card",
            SkipOperation = "skip_generated_combat_card_choice",
            SelectCompletionEvidence = "exact-generated-combat-card-witness",
            SkipCompletionEvidence = "unchanged-combat-piles-witness"
        };
        ConnectorV3CommandDescriptor[] commands =
            ConnectorV3Runtime.DescribeGeneratedCardChoiceCommands(surface).ToArray();

        Assert.Equal(2, commands.Length);
        Assert.Contains(commands, command => command.Kind == "select_generated_combat_card"
            && command.EntityBindings!.Any(binding => binding.EntityId == "generated-card"));
        Assert.DoesNotContain(commands, command => command.EntityBindings!.Any(binding =>
            binding.EntityId == "blocked-card"));
        Assert.Contains(commands, command => command.Kind == "skip_generated_combat_card_choice");

        Dictionary<string, string> select = ConnectorV3Runtime.BuildCommandOperands(
            "select_generated_combat_card",
            "select_entity",
            new[]
            {
                new ActionEntityBinding("screen", "generated-screen"),
                new ActionEntityBinding("card", "generated-card")
            });
        Dictionary<string, string> skip = ConnectorV3Runtime.BuildCommandOperands(
            "skip_generated_combat_card_choice",
            "activate_control",
            new[] { new ActionEntityBinding("screen", "generated-screen") });

        Assert.Equal("generated-screen", select["screen_id"]);
        Assert.Equal("generated-card", select["card_id"]);
        Assert.Equal("generated-screen", skip["screen_id"]);
        Assert.Equal("skip_generated_combat_card_choice", skip["control_id"]);
        Assert.DoesNotContain("action_id", select.Keys);
        Assert.DoesNotContain("action_id", skip.Keys);
    }

    [Fact]
    public void EventCardAcquisitionNativeDiscoveryKeepsExactSelectionState()
    {
        static VisibleCard Card(string entityId, string name, bool selected) =>
            new(entityId, name.ToUpperInvariant(), name, "Skill", "1", null, null,
                "Common", false, selected, null);
        var surface = new EventCardAcquisitionSurface(
            "event_card_acquisition",
            "event-grid",
            "Choose cards",
            "run_deck",
            1,
            2,
            1,
            new[] { "card-selected" },
            RequireManualConfirmation: false,
            new[]
            {
                Card("card-option", "Option", selected: false),
                Card("card-selected", "Selected", selected: true),
                Card("card-blocked", "Blocked", selected: false)
            })
        {
            SelectableCardEntityIds = new[] { "card-option" },
            DeselectableCardEntityIds = new[] { "card-selected" }
        };

        ConnectorV3CommandDescriptor[] commands =
            ConnectorV3Runtime.DescribeEventCardAcquisitionCommands(surface).ToArray();

        Assert.Equal(2, commands.Length);
        Assert.Contains(commands, command =>
            command.Kind == "select_event_card_acquisition"
            && command.EntityBindings!.Any(binding => binding.EntityId == "card-option"));
        Assert.Contains(commands, command =>
            command.Kind == "deselect_event_card_acquisition"
            && command.EntityBindings!.Any(binding => binding.EntityId == "card-selected"));
        Assert.DoesNotContain(commands.SelectMany(command => command.EntityBindings!),
            binding => binding.EntityId == "card-blocked");
    }

    [Fact]
    public void MapDrawingModeBindingAcceptsOnlyAuditedVersionShapes()
    {
        Assert.True(MapNavigationSurfaceProvider.IsCompatibleLocalDrawingModeSignature(
            Array.Empty<Type>()));
        Assert.True(MapNavigationSurfaceProvider.IsCompatibleLocalDrawingModeSignature(
            new[] { typeof(bool) }));
        Assert.False(MapNavigationSurfaceProvider.IsCompatibleLocalDrawingModeSignature(
            new[] { typeof(string) }));
        Assert.False(MapNavigationSurfaceProvider.IsCompatibleLocalDrawingModeSignature(
            new[] { typeof(bool), typeof(bool) }));
        Assert.True(MapNavigationSurfaceProvider.HasCompatibleLocalDrawingModeBinding);
        Assert.Contains(
            MapNavigationSurfaceProvider.ControllerInputModeBindingName,
            new[] { "IsUsingDirectionalNavigation", "IsUsingController" });
    }

    [Fact]
    public void RestHealCompletionAcceptsExactRewardChildHandoff()
    {
        Assert.True(RestSiteSurfaceProvider.HasHealCompletionBoundary(
            currentHpReached: true,
            optionProgressed: false,
            rewardChildOpened: true));
        Assert.True(RestSiteSurfaceProvider.HasHealCompletionBoundary(
            currentHpReached: true,
            optionProgressed: true,
            rewardChildOpened: false));
        Assert.False(RestSiteSurfaceProvider.HasHealCompletionBoundary(
            currentHpReached: false,
            optionProgressed: true,
            rewardChildOpened: true));
        Assert.False(RestSiteSurfaceProvider.HasHealCompletionBoundary(
            currentHpReached: true,
            optionProgressed: false,
            rewardChildOpened: false));
    }

    [Fact]
    public void RestNativeDescriptorsBindOnlyEnabledOptionsAndCurrentProceedControl()
    {
        var surface = new RestSiteSurface(
            "rest_site",
            "rest-screen",
            new[]
            {
                new VisibleRestOption("rest-heal", 0, "heal", "Rest", "Heal", Enabled: true),
                new VisibleRestOption("rest-smith", 1, "smith", "Smith", "Upgrade", Enabled: false)
            },
            CanProceed: true);

        ConnectorV3CommandDescriptor[] commands = ConnectorV3Runtime.DescribeRestSiteCommands(surface).ToArray();

        Assert.Equal(2, commands.Length);
        ConnectorV3CommandDescriptor choose = Assert.Single(commands, command => command.Kind == "choose_rest_option");
        Assert.Contains(choose.EntityBindings!, binding =>
            binding.Role == "screen" && binding.EntityId == "rest-screen");
        Assert.Contains(choose.EntityBindings!, binding =>
            binding.Role == "rest_option" && binding.EntityId == "rest-heal");
        Assert.DoesNotContain(commands.SelectMany(command => command.EntityBindings ?? Array.Empty<ActionEntityBinding>()),
            binding => binding.EntityId == "rest-smith");
        Assert.Single(commands, command => command.Kind == "proceed_rest_site");
    }

    [Fact]
    public void NativeMapAndRestOperandsBindOwnerAndExactEntity()
    {
        Dictionary<string, string> map = ConnectorV3Runtime.BuildCommandOperands(
            "choose_map_node",
            "navigate",
            new[]
            {
                new ActionEntityBinding("map_screen", "screen-a"),
                new ActionEntityBinding("map_node", "node-b")
            });
        Dictionary<string, string> rest = ConnectorV3Runtime.BuildCommandOperands(
            "choose_rest_option",
            "choose",
            new[]
            {
                new ActionEntityBinding("screen", "screen-c"),
                new ActionEntityBinding("rest_option", "option-d")
            });

        Assert.Equal("screen-a", map["map_screen_id"]);
        Assert.Equal("node-b", map["map_node_id"]);
        Assert.Equal("screen-c", rest["screen_id"]);
        Assert.Equal("option-d", rest["rest_option_id"]);
    }

    [Fact]
    public void SymbioteEnchantSourceRequiresExactNativeContract()
    {
        Assert.True(DeckEnchantSurfaceProvider.IsSymbioteSourceContract(
            exactEventType: true,
            exactEnchantmentType: true,
            enchantmentAmount: 1,
            minSelect: 1,
            maxSelect: 1,
            requireManualConfirmation: false,
            cancelable: false));
        Assert.False(DeckEnchantSurfaceProvider.IsSymbioteSourceContract(
            exactEventType: true,
            exactEnchantmentType: true,
            enchantmentAmount: 2,
            minSelect: 1,
            maxSelect: 1,
            requireManualConfirmation: false,
            cancelable: false));
        Assert.False(DeckEnchantSurfaceProvider.IsSymbioteSourceContract(
            exactEventType: false,
            exactEnchantmentType: true,
            enchantmentAmount: 1,
            minSelect: 1,
            maxSelect: 1,
            requireManualConfirmation: false,
            cancelable: false));
    }

    [Fact]
    public void NativeDeckEnchantOperandsBindOwnerAndExactCard()
    {
        Dictionary<string, string> operands = ConnectorV3Runtime.BuildCommandOperands(
            "toggle_card",
            "select_entity",
            new[]
            {
                new ActionEntityBinding("screen", "screen-enchant"),
                new ActionEntityBinding("card", "card-target")
            });

        Assert.Equal("screen-enchant", operands["screen_id"]);
        Assert.Equal("card-target", operands["card_id"]);
    }

    [Fact]
    public void EventNativeDiscoveryUsesVisibleControlFactsWithoutDraftActions()
    {
        var surface = new EventOptionSurface(
            "event_option",
            "screen-event",
            new[]
            {
                new VisibleEventOption(
                    "option-enabled",
                    0,
                    "Choose",
                    null,
                    true,
                    false,
                    false,
                    false,
                    false,
                    null,
                    null,
                    Array.Empty<VisibleEventOptionTooltip>()),
                new VisibleEventOption(
                    "option-disabled",
                    1,
                    "Unavailable",
                    null,
                    false,
                    false,
                    false,
                    false,
                    false,
                    null,
                    null,
                    Array.Empty<VisibleEventOptionTooltip>())
            });

        ConnectorV3CommandDescriptor command = Assert.Single(
            ConnectorV3Runtime.DescribeEventOptionCommands(surface));

        Assert.Equal("choose_event_option", command.Kind);
        Assert.Contains(command.EntityBindings!, binding =>
            binding.Role == "screen" && binding.EntityId == "screen-event");
        Assert.Contains(command.EntityBindings!, binding =>
            binding.Role == "option" && binding.EntityId == "option-enabled");
    }

    [Fact]
    public void GameOverNativeDiscoveryKeepsStageAndOwnerExact()
    {
        var intro = new GameOverSurface(
            "game_over",
            "intro",
            "game-over-screen",
            null,
            true,
            false);
        var summary = new GameOverSurface(
            "game_over",
            "summary",
            "game-over-screen",
            "main_menu",
            false,
            true);

        ConnectorV3CommandDescriptor advance = Assert.Single(
            ConnectorV3Runtime.DescribeGameOverCommands(intro));
        ConnectorV3CommandDescriptor exit = Assert.Single(
            ConnectorV3Runtime.DescribeGameOverCommands(summary));

        Assert.Equal("advance_game_over_summary", advance.Kind);
        Assert.Equal("return_game_over", exit.Kind);
        Assert.Contains(advance.EntityBindings!, binding =>
            binding.Role == "game_over_screen"
            && binding.EntityId == "game-over-screen");
        Assert.Contains(exit.EntityBindings!, binding =>
            binding.Role == "game_over_screen"
            && binding.EntityId == "game-over-screen");
        Assert.Equal(
            "advance_game_over_summary",
            ConnectorV3Runtime.BuildCommandOperands(
                advance.Kind,
                "activate_control",
                advance.EntityBindings!)["control_id"]);
        Assert.Equal(
            "return_game_over",
            ConnectorV3Runtime.BuildCommandOperands(
                exit.Kind,
                "activate_control",
                exit.EntityBindings!)["control_id"]);
    }

    [Fact]
    public void TreasureNativeDiscoveryKeepsStageSpecificContractsSeparate()
    {
        var closed = new TreasureRoomSurface(
            "treasure_room",
            "closed",
            "treasure-room",
            false,
            Array.Empty<VisibleTreasureRelic>(),
            false,
            false);
        var choice = new TreasureRoomSurface(
            "treasure_room",
            "relic_choice",
            "treasure-room",
            true,
            new[]
            {
                new VisibleTreasureRelic(
                    "relic-choice",
                    "RELIC_A",
                    "Relic A",
                    "Visible relic",
                    "Common",
                    Array.Empty<VisibleKeyword>(),
                    Array.Empty<VisibleCard>())
            },
            true,
            false);

        ConnectorV3CommandDescriptor open = Assert.Single(
            ConnectorV3Runtime.DescribeTreasureRoomCommands(closed));
        ConnectorV3CommandDescriptor[] choices =
            ConnectorV3Runtime.DescribeTreasureRoomCommands(choice).ToArray();

        Assert.Equal("open_treasure_chest", open.Kind);
        Assert.Contains(choices, action => action.Kind == "choose_treasure_relic");
        Assert.Contains(choices, action => action.Kind == "skip_treasure_relic");
        Assert.All(choices, action => Assert.Contains(
            action.EntityBindings!,
            binding => binding.Role == "treasure_room"
                       && binding.EntityId == "treasure-room"));
    }

    [Fact]
    public void RewardNativeDiscoveryUsesSurfaceFactsWithoutDraftActions()
    {
        var surface = new RewardClaimSurface(
            "reward_claim",
            "screen-reward",
            new[]
            {
                new VisibleReward(
                    "reward-gold",
                    "gold",
                    "25 Gold",
                    "Gain 25 Gold.",
                    true),
                new VisibleReward(
                    "reward-blocked",
                    "potion",
                    "Potion",
                    "Potion slots are full.",
                    false)
            },
            true,
            new[]
            {
                new VisibleCombatPotion(
                    "potion-old",
                    "OLD_POTION",
                    "Old Potion",
                    "Discardable.",
                    1,
                    "AnyPlayer",
                    false,
                    false)
            },
            true,
            false);

        ConnectorV3CommandDescriptor[] commands =
            ConnectorV3Runtime.DescribeRewardClaimCommands(surface).ToArray();

        Assert.Contains(commands, command =>
            command.Kind == "claim_reward"
            && command.EntityBindings!.Any(binding =>
                binding.Role == "reward"
                && binding.EntityId == "reward-gold"));
        Assert.DoesNotContain(commands, command =>
            command.EntityBindings!.Any(binding =>
                binding.EntityId == "reward-blocked"));
        Assert.Contains(commands, command =>
            command.Kind == "discard_potion_for_reward"
            && command.EntityBindings!.Any(binding =>
                binding.Role == "potion"
                && binding.EntityId == "potion-old"));
        Assert.Contains(commands, command =>
            command.Kind == "proceed_rewards"
            && command.EntityBindings!.Any(binding =>
                binding.Role == "screen"
                && binding.EntityId == "screen-reward"));
    }

    [Fact]
    public void CardRewardNativeDiscoveryUsesTypedEligibilityAndExactOwnerOperands()
    {
        static VisibleCard Card(string entityId, string definitionId, string name) =>
            new(
                entityId,
                definitionId,
                name,
                "Attack",
                "1",
                null,
                null,
                "Common",
                false,
                false,
                null);

        var surface = new CardRewardSelectionSurface(
            "card_reward_selection",
            "screen-card-reward",
            new[]
            {
                Card("card-selectable", "STRIKE", "Strike"),
                Card("card-disabled", "DEFEND", "Defend")
            },
            new[]
            {
                new VisibleCardRewardAlternative("alternative-enabled", 0, "Reroll", true),
                new VisibleCardRewardAlternative("alternative-disabled", 1, "Locked", false)
            })
        {
            SelectableCardEntityIds = new[] { "card-selectable", "unknown-card" }
        };

        ConnectorV3CommandDescriptor[] commands =
            ConnectorV3Runtime.DescribeCardRewardCommands(surface).ToArray();

        Assert.Collection(
            commands.OrderBy(command => command.Kind, StringComparer.Ordinal),
            alternative =>
            {
                Assert.Equal("choose_card_reward_alternative", alternative.Kind);
                Assert.Contains(alternative.EntityBindings!, binding =>
                    binding.Role == "screen" && binding.EntityId == "screen-card-reward");
                Assert.Contains(alternative.EntityBindings!, binding =>
                    binding.Role == "alternative" && binding.EntityId == "alternative-enabled");
            },
            card =>
            {
                Assert.Equal("select_card_reward", card.Kind);
                Assert.Contains(card.EntityBindings!, binding =>
                    binding.Role == "screen" && binding.EntityId == "screen-card-reward");
                Assert.Contains(card.EntityBindings!, binding =>
                    binding.Role == "card" && binding.EntityId == "card-selectable");
            });
        Assert.DoesNotContain(commands, command => command.EntityBindings!.Any(binding =>
            binding.EntityId is "card-disabled" or "alternative-disabled" or "unknown-card"));

        ConnectorV3CommandDescriptor enabledAlternative = Assert.Single(commands, command =>
            command.Kind == "choose_card_reward_alternative");
        Dictionary<string, string> alternativeOperands =
            ConnectorV3Runtime.BuildCommandOperands(
                enabledAlternative.Kind,
                "choose",
                enabledAlternative.EntityBindings!);
        Assert.Equal("screen-card-reward", alternativeOperands["screen_id"]);
        Assert.Equal("alternative-enabled", alternativeOperands["choice_id"]);
        Assert.DoesNotContain("alternative_id", alternativeOperands.Keys);
    }

    [Fact]
    public void ShopInventoryNativeDiscoveryUsesTypedOffersAndExactOwnerOperands()
    {
        static VisibleCard Card(string entityId, string definitionId, string name) =>
            new(
                entityId,
                definitionId,
                name,
                "Attack",
                "1",
                null,
                null,
                "Common",
                false,
                false,
                null);

        var surface = new ShopInventorySurface(
            "shop_inventory",
            "shop-screen",
            new[]
            {
                new VisibleShopCardOffer(
                    "offer-card",
                    "slot-card",
                    0,
                    45,
                    true,
                    true,
                    true,
                    true,
                    null,
                    false,
                    Card("card-offer", "POMMEL_STRIKE", "Pommel Strike")),
                new VisibleShopCardOffer(
                    "offer-blocked",
                    "slot-blocked",
                    1,
                    70,
                    true,
                    true,
                    false,
                    false,
                    "insufficient_gold",
                    false,
                    Card("card-blocked", "SHRUG_IT_OFF", "Shrug It Off"))
            },
            new[]
            {
                new VisibleShopRelicOffer(
                    "offer-relic",
                    "slot-relic",
                    2,
                    100,
                    true,
                    true,
                    true,
                    true,
                    null,
                    new VisibleRelic(
                        "relic-offer",
                        "BAG_OF_PREPARATION",
                        "Bag of Preparation",
                        "Draw more cards.",
                        null,
                        Array.Empty<VisibleKeyword>(),
                        Array.Empty<VisibleCard>()))
            },
            new[]
            {
                new VisibleShopPotionOffer(
                    "offer-potion",
                    "slot-potion",
                    3,
                    50,
                    true,
                    true,
                    true,
                    true,
                    null,
                    "BLOCK_POTION",
                    "Block Potion",
                    "Gain Block.",
                    "Common")
            },
            new VisibleShopCardRemovalOffer(
                "offer-removal",
                "slot-removal",
                4,
                75,
                25,
                true,
                true,
                true,
                true,
                null),
            true);

        ConnectorV3CommandDescriptor[] commands =
            ConnectorV3Runtime.DescribeShopInventoryCommands(surface).ToArray();

        Assert.Equal(5, commands.Length);
        Assert.DoesNotContain(commands, command => command.EntityBindings!.Any(binding =>
            binding.EntityId == "offer-blocked"));
        Assert.All(commands, command => Assert.Contains(
            command.EntityBindings!,
            binding => binding.Role == "screen"
                       && binding.EntityId == "shop-screen"));
        Assert.Contains(commands, command => command.Kind == "purchase_shop_card");
        Assert.Contains(commands, command => command.Kind == "purchase_shop_relic");
        Assert.Contains(commands, command => command.Kind == "purchase_shop_potion");
        Assert.Contains(commands, command => command.Kind == "open_shop_card_removal");
        Assert.Contains(commands, command => command.Kind == "close_shop_inventory");

        ConnectorV3CommandDescriptor purchase = Assert.Single(commands, command =>
            command.Kind == "purchase_shop_card");
        Dictionary<string, string> operands =
            ConnectorV3Runtime.BuildCommandOperands(
                purchase.Kind,
                "purchase",
                purchase.EntityBindings!);
        Assert.Equal("shop-screen", operands["screen_id"]);
        Assert.Equal("offer-card", operands["shop_offer_id"]);
        Assert.DoesNotContain("action_id", operands.Keys);

        ConnectorV3CommandDescriptor close = Assert.Single(commands, command =>
            command.Kind == "close_shop_inventory");
        Dictionary<string, string> closeOperands =
            ConnectorV3Runtime.BuildCommandOperands(
                close.Kind,
                "cancel_interaction",
                close.EntityBindings!);
        Assert.Equal("shop-screen", closeOperands["screen_id"]);
        Assert.Equal("close_shop_inventory", closeOperands["control_id"]);
    }

    [Fact]
    public void CombatHandDescriptorsUseExplicitActionableCardAndControlFacts()
    {
        var surface = new CombatHandCardSelectionSurface(
            "combat_hand_card_selection",
            "hand-current",
            "Choose cards",
            "simple_select",
            1,
            2,
            1,
            new[] { "card-selected" },
            RequireManualConfirmation: true,
            IsPeeking: false,
            SelectableCardEntityIds: new[] { "card-option" },
            DeselectableCardEntityIds: new[] { "card-selected" },
            CanConfirm: true,
            CanClosePeek: false,
            new[]
            {
                new VisibleCard(
                    "card-option", "STRIKE", "Strike", "Attack", "1", null,
                    "Deal 6 damage.", "Basic", false, false, null),
                new VisibleCard(
                    "card-selected", "DEFEND", "Defend", "Skill", "1", null,
                    "Gain 5 Block.", "Basic", false, true, null)
            });

        ConnectorV3CommandDescriptor[] commands =
            ConnectorV3Runtime.DescribeCombatHandCommands(surface).ToArray();

        Assert.Equal(3, commands.Length);
        Assert.Contains(commands, command =>
            command.Kind == "select_combat_hand_card"
            && command.EntityBindings!.Single().EntityId == "card-option");
        Assert.Contains(commands, command =>
            command.Kind == "deselect_combat_hand_card"
            && command.EntityBindings!.Single().EntityId == "card-selected");
        Assert.Contains(commands, command =>
            command.Kind == "confirm_combat_hand_selection"
            && command.EntityBindings!.Count == 0);
        Assert.DoesNotContain(commands, command => command.Kind == "close_combat_hand_peek");
    }

    [Fact]
    public void ParameterizedBindingRequiresEveryExactOperandAndNoExtras()
    {
        var candidate = new ConnectorV3CommandCandidate(
            "candidate-a",
            "play_card",
            "play_card",
            "Play",
            new Dictionary<string, string>
            {
                ["card_id"] = "card-session-1"
            },
            new Dictionary<string, ConnectorV3OperandDomain>
            {
                ["target_id"] = new(
                    "entity_ids",
                    new[] { "creature-session-2", "creature-session-3" })
            },
            Array.Empty<ActionEntityBinding>(),
            "native_direct_resolver",
            "supported");

        Assert.True(ConnectorV3Runtime.OperandsMatch(
            candidate,
            new Dictionary<string, string>
            {
                ["card_id"] = "card-session-1",
                ["target_id"] = "creature-session-3"
            }));
        Assert.False(ConnectorV3Runtime.OperandsMatch(
            candidate,
            new Dictionary<string, string>
            {
                ["card_id"] = "card-session-1",
                ["target_id"] = "creature-replacement-3"
            }));
        Assert.False(ConnectorV3Runtime.OperandsMatch(
            candidate,
            new Dictionary<string, string>
            {
                ["card_id"] = "card-session-1",
                ["target_id"] = "creature-session-3",
                ["unexpected"] = "entity-session-4"
            }));
    }

    [Fact]
    public void UnknownOutcomeNeverAdvertisesRetry()
    {
        var request = new ConnectorV3CommandRequest(
            "request-a",
            "state-a",
            "interaction-a",
            "play_card",
            new Dictionary<string, string> { ["card_id"] = "card-a" });
        var response = new BridgeCommandResponse(
            "request-a",
            "state-a",
            "v3cmd-a",
            "timed_out",
            "unknown",
            null,
            new[]
            {
                new BridgeCommandEvent(
                    "timed_out",
                    DateTimeOffset.UtcNow,
                    null,
                    "outcome_timeout",
                    "Completion was not observed before the deadline.")
            });

        ConnectorV3CommandReceipt receipt =
            ConnectorV3Runtime.ToReceipt(request, response);

        Assert.Equal("unknown", receipt.Status);
        Assert.Equal("unknown", receipt.Application);
        Assert.False(receipt.Retry.Allowed);
        Assert.Equal("mutation_may_have_occurred", receipt.Retry.Reason);
        Assert.Null(receipt.Completion);
    }

    [Fact]
    public void IdempotencyIdentityBindsInteractionCommandAndCanonicalOperands()
    {
        var operands = new Dictionary<string, string>
        {
            ["target_id"] = "creature-a",
            ["card_id"] = "card-a"
        };
        var reordered = new Dictionary<string, string>
        {
            ["card_id"] = "card-a",
            ["target_id"] = "creature-a"
        };

        string identity = ConnectorV3Runtime.BuildCommandIdentity(
            "interaction-a",
            "play_card",
            operands);

        Assert.Equal(
            identity,
            ConnectorV3Runtime.BuildCommandIdentity(
                "interaction-a",
                "play_card",
                reordered));
        Assert.NotEqual(
            identity,
            ConnectorV3Runtime.BuildCommandIdentity(
                "interaction-b",
                "play_card",
                operands));
        Assert.NotEqual(
            identity,
            ConnectorV3Runtime.BuildCommandIdentity(
                "interaction-a",
                "use_potion",
                operands));
    }
}
