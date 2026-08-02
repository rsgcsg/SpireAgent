using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Runtime;
using STS2_MCP.ConnectorV3.Protocol;
using STS2_MCP.ConnectorV3.Runtime;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace STS2_MCP.Tests;

public sealed class ConnectorV3ContractTests
{
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

        BridgeActionDraft[] mainCommands =
            ConnectorV3Runtime.DescribeMainMenuCommands(main).ToArray();
        BridgeActionDraft singleplayerCommand = Assert.Single(
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
                    false),
                new VisibleCharacterChoice(
                    "choice-available",
                    1,
                    "SILENT",
                    "Silent",
                    false,
                    false,
                    false),
                new VisibleCharacterChoice(
                    "choice-locked",
                    2,
                    "DEFECT",
                    "Defect",
                    true,
                    false,
                    false)
            },
            null,
            3,
            "Ascension 3",
            "Harder enemies.",
            true,
            true,
            true,
            true);

        BridgeActionDraft[] commands =
            ConnectorV3Runtime.DescribeCharacterSelectCommands(surface).ToArray();

        Assert.Equal(5, commands.Length);
        Assert.All(commands, command => Assert.Contains(
            command.EntityBindings!,
            binding => binding.Role == "screen"
                       && binding.EntityId == "character-screen"));
        BridgeActionDraft select = Assert.Single(commands, command =>
            command.Kind == "select_character");
        Assert.Contains(select.EntityBindings!, binding =>
            binding.Role == "character_choice"
            && binding.EntityId == "choice-available");
        Assert.DoesNotContain(commands, command => command.EntityBindings!.Any(binding =>
            binding.EntityId == "choice-locked"));
        BridgeActionDraft embark = Assert.Single(commands, command =>
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

        BridgeActionDraft command = Assert.Single(
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

        BridgeActionDraft advance = Assert.Single(
            ConnectorV3Runtime.DescribeGameOverCommands(intro));
        BridgeActionDraft exit = Assert.Single(
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

        BridgeActionDraft open = Assert.Single(
            ConnectorV3Runtime.DescribeTreasureRoomCommands(closed));
        BridgeActionDraft[] choices =
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

        BridgeActionDraft[] commands =
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

        BridgeActionDraft[] commands =
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

        BridgeActionDraft enabledAlternative = Assert.Single(commands, command =>
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

        BridgeActionDraft[] commands =
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

        BridgeActionDraft purchase = Assert.Single(commands, command =>
            command.Kind == "purchase_shop_card");
        Dictionary<string, string> operands =
            ConnectorV3Runtime.BuildCommandOperands(
                purchase.Kind,
                "purchase",
                purchase.EntityBindings!);
        Assert.Equal("shop-screen", operands["screen_id"]);
        Assert.Equal("offer-card", operands["shop_offer_id"]);
        Assert.DoesNotContain("action_id", operands.Keys);

        BridgeActionDraft close = Assert.Single(commands, command =>
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
