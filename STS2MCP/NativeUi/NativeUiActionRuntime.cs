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
using STS2_MCP.LiveHost;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.Authority;
using STS2_MCP.NativeUi;


namespace STS2_MCP.NativeUi;

internal static class NativeUiActionRuntime
{
    private static NativeEntityRegistry Entities => NativeUiRuntime.Entities;
    internal static IEnumerable<VisibleCard> SurfaceCards(ILiveSurface surface) =>
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

    internal static bool TryDescribeDirectAuthorityCommands(
        ILiveSurface surface,
        out IReadOnlyList<NativeUiActionDescriptor> commands)
    {
        commands = surface switch
        {
            CombatTurnSurface value => DescribeCombatCommands(value),
            ShopRoomSurface value => DescribeShopRoomCommands(value),
            MapNavigationSurface value => DescribeMapCommands(value),
            DeckEnchantSelectionSurface value => DescribeDeckEnchantCommands(value),
            EventDialogueSurface value => DescribeEventDialogueCommands(value),
            EventOptionSurface value => DescribeEventOptionCommands(value),
            TreasureRoomSurface value => DescribeTreasureRoomCommands(value),
            RewardClaimSurface value => DescribeRewardClaimCommands(value),
            CardRewardSelectionSurface value => DescribeCardRewardCommands(value),
            ShopInventorySurface value => DescribeShopInventoryCommands(value),
            MainMenuSurface value => DescribeMainMenuCommands(value),
            SingleplayerMenuSurface value => DescribeSingleplayerMenuCommands(value),
            CharacterSelectSurface value => DescribeCharacterSelectCommands(value),
            GameOverSurface value => DescribeGameOverCommands(value),
            RestSiteSurface value => DescribeRestSiteCommands(value),
            GeneratedCardChoiceSurface value => DescribeGeneratedCardChoiceCommands(value),
            EventCardAcquisitionSurface value => DescribeEventCardAcquisitionCommands(value),
            CombatHandCardSelectionSurface value => DescribeCombatHandCommands(value),
            DeckUpgradeSelectionSurface value => DescribeDeckUpgradeCommands(value),
            DeckRemovalSelectionSurface value when value.Kind is
                "deck_removal_selection" or
                "relic_deck_removal_selection" or
                "reward_deck_removal_selection" => DescribeDeckRemovalCommands(value),
            EventDeckRemovalSelectionSurface value => EventDeckRemovalSelection.DescribeCommands(value),
            CardBundleSelectionSurface value => DescribeCardBundleCommands(value),
            DeckTransformSelectionSurface value => DescribeDeckTransformCommands(value),
            WoodCarvingsReplacementSelectionSurface value => DescribeWoodCarvingsCommands(value),
            CombatPileCardSelectionSurface value => DescribeCombatPileCommands(value),
            _ => Array.Empty<NativeUiActionDescriptor>()
        };
        return surface is
            CombatTurnSurface or
            ShopRoomSurface or
            MapNavigationSurface or
            DeckEnchantSelectionSurface or
            EventDialogueSurface or
            EventOptionSurface or
            TreasureRoomSurface or
            RewardClaimSurface or
            CardRewardSelectionSurface or
            ShopInventorySurface or
            MainMenuSurface or
            SingleplayerMenuSurface or
            CharacterSelectSurface or
            GameOverSurface or
            RestSiteSurface or
            GeneratedCardChoiceSurface or
            EventCardAcquisitionSurface or
            CombatHandCardSelectionSurface or
            DeckUpgradeSelectionSurface or
            DeckRemovalSelectionSurface or
            EventDeckRemovalSelectionSurface or
            CardBundleSelectionSurface or
            DeckTransformSelectionSurface or
            WoodCarvingsReplacementSelectionSurface or
            CombatPileCardSelectionSurface;
    }

    internal static IReadOnlyList<NativeUiBoundAction> BuildBindings(
        LiveObservation draft)
    {
        if (draft.Surface is CombatTurnSurface combatTurn)
            return BuildCombatBindings(draft, combatTurn);
        if (draft.Surface is ShopRoomSurface shopRoom)
            return BuildShopRoomBindings(draft, shopRoom);
        if (draft.Surface is MapNavigationSurface map)
            return BuildMapBindings(draft, map);
        if (draft.Surface is DeckEnchantSelectionSurface deckEnchant)
            return BuildDeckEnchantBindings(draft, deckEnchant);
        if (draft.Surface is EventDialogueSurface eventDialogue)
            return BuildEventDialogueBindings(draft, eventDialogue);
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
        if (draft.Surface is EventCardAcquisitionSurface eventCardAcquisition)
            return BuildEventCardAcquisitionBindings(draft, eventCardAcquisition);
        if (draft.Surface is GameOverSurface gameOver)
            return BuildGameOverBindings(draft, gameOver);
        if (draft.Surface is RestSiteSurface restSite)
            return BuildRestSiteBindings(draft, restSite);
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
        if (draft.Surface is DeckTransformSelectionSurface deckTransform)
            return BuildDeckTransformBindings(draft, deckTransform);
        if (draft.Surface is WoodCarvingsReplacementSelectionSurface woodCarvings)
            return BuildWoodCarvingsBindings(draft, woodCarvings);
        if (draft.Surface is CombatPileCardSelectionSurface combatPile)
            return BuildCombatPileBindings(draft, combatPile);

        return Array.Empty<NativeUiBoundAction>();
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildCombatBindings(
        LiveObservation draft,
        CombatTurnSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor descriptor in DescribeCombatCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, descriptor) is not { } binding)
                continue;
            string role = descriptor.Kind == "play_card" ? "card" : "potion";
            string operandName = descriptor.Kind == "play_card" ? "card_id" : "potion_id";
            ActionEntityBinding? primary = descriptor.EntityBindings?
                .FirstOrDefault(entity => entity.Role == role);
            if (descriptor.Kind is "play_card" or "use_potion" && primary != null)
            {
                string[] targets = descriptor.EntityBindings?
                    .Where(entity => entity.Role == "target")
                    .Select(entity => entity.EntityId)
                    .Distinct(StringComparer.Ordinal)
                    .ToArray() ?? Array.Empty<string>();
                var operands = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    [operandName] = primary.EntityId
                };
                var domains = new Dictionary<string, NativeUiOperandDomain>(StringComparer.Ordinal);
                if (targets.Length > 0)
                    domains["target_id"] = new NativeUiOperandDomain("entity_ids", targets);
                NativeUiActionCandidate candidate = binding.Candidate with
                {
                    Operands = operands,
                    OperandDomains = domains,
                    CandidateId = BuildCandidateId(
                        binding.Candidate.Command,
                        binding.Candidate.Operation,
                        operands.Concat(domains.Select(pair =>
                            new KeyValuePair<string, string>(pair.Key, string.Join("|", pair.Value.EntityIds))))
                            .ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal))
                };
                result.Add(binding with { Candidate = candidate });
            }
            else
            {
                result.Add(binding);
            }
        }
        return result;
    }

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeCombatCommands(
        CombatTurnSurface surface)
    {
        var commands = new List<NativeUiActionDescriptor>();
        foreach (VisibleCombatCommandOption card in surface.PlayableCards)
        {
            commands.Add(NativeDescriptor(
                $"play_card:{surface.RoomEntityId}:{card.EntityId}",
                "play_card",
                "combat",
                $"Play {card.Name ?? card.EntityId}",
                "CardModel.CanPlay+exact-current-target-domain+CardModel.TryManualPlay",
                new[] { new ActionEntityBinding("card", card.EntityId) }
                    .Concat(card.TargetEntityIds.Select(id => new ActionEntityBinding("target", id)))
                    .ToArray()));
        }
        foreach (VisibleCombatCommandOption potion in surface.UsablePotions)
        {
            commands.Add(NativeDescriptor(
                $"use_potion:{surface.RoomEntityId}:{potion.EntityId}",
                "use_potion",
                "combat",
                $"Use {potion.Name ?? potion.EntityId}",
                "PotionModel.PassesCustomUsabilityCheck+PotionModel.IsValidTarget+exact-current-target-domain",
                new[] { new ActionEntityBinding("potion", potion.EntityId) }
                    .Concat(potion.TargetEntityIds.Select(id => new ActionEntityBinding("target", id)))
                    .ToArray()));
        }
        if (surface.CanEndTurn)
        {
            commands.Add(NativeDescriptor(
                $"end_turn:{surface.RoomEntityId}",
                "end_turn",
                "commit",
                "End turn",
                "PlayerCmd.EndTurn+NEndTurnButton.CanTurnBeEnded guards",
                Array.Empty<ActionEntityBinding>()));
        }
        return commands;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildShopRoomBindings(
        LiveObservation draft,
        ShopRoomSurface surface) => DescribeShopRoomCommands(surface)
        .Select(command => BindActionToCurrentObservation(draft, command))
        .Where(binding => binding != null)
        .Cast<NativeUiBoundAction>()
        .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeShopRoomCommands(
        ShopRoomSurface surface)
    {
        var commands = new List<NativeUiActionDescriptor>();
        ActionEntityBinding room = new("room", surface.RoomEntityId);
        if (surface.CanOpenInventory)
            commands.Add(NativeDescriptor("open_shop_inventory", "open_shop_inventory", "navigation", "Open shop inventory", "NMerchantButton.ForceClick+NMerchantRoom.OpenInventory", new[] { room }));
        if (surface.CanProceed)
            commands.Add(NativeDescriptor("proceed_shop", "proceed_shop", "navigation", "Leave shop and open map", "NMerchantRoom.ProceedButton+NMapScreen.Open", new[] { room }));
        return commands;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildMapBindings(
        LiveObservation draft,
        MapNavigationSurface surface) => DescribeMapCommands(surface)
        .Select(command => BindActionToCurrentObservation(draft, command))
        .Where(binding => binding != null)
        .Cast<NativeUiBoundAction>()
        .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeMapCommands(
        MapNavigationSurface surface)
    {
        var commands = surface.NextOptions.Select(option => NativeDescriptor(
            $"choose_map_node:{surface.ScreenEntityId}:{option.EntityId}",
            "choose_map_node",
            "navigation",
            $"Choose {option.PointType} at ({option.Col},{option.Row})",
            "NMapPoint.OnRelease+NMapScreen.OnMapPointSelectedLocally",
            new[]
            {
                new ActionEntityBinding("map_screen", surface.ScreenEntityId),
                new ActionEntityBinding("map_node", option.EntityId)
            })).ToList();
        if (surface.CanExitAnnotation
            && surface.AnnotationInputEntityId != null
            && surface.DrawingMode != "none")
        {
            commands.Add(NativeDescriptor(
                $"exit_map_annotation:{surface.ScreenEntityId}:{surface.AnnotationInputEntityId}",
                "exit_map_annotation",
                "navigation",
                "Exit map annotation mode",
                "NMapDrawingInput.StopDrawing",
                new[]
                {
                    new ActionEntityBinding("map_screen", surface.ScreenEntityId),
                    new ActionEntityBinding("map_annotation_input", surface.AnnotationInputEntityId)
                }));
        }
        return commands;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildDeckEnchantBindings(
        LiveObservation draft,
        DeckEnchantSelectionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor descriptor in DescribeDeckEnchantCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, descriptor) is not { } binding)
                continue;
            string? cardId = descriptor.EntityBindings?
                .FirstOrDefault(entity => entity.Role == "card")?.EntityId;
            if (descriptor.Kind == "toggle_card" && cardId != null)
            {
                string command = surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal)
                    ? "deselect_entity"
                    : "select_entity";
                binding = binding with
                {
                    Candidate = binding.Candidate with
                    {
                        Command = command,
                        CandidateId = BuildCandidateId(command, descriptor.Kind, binding.Candidate.Operands)
                    }
                };
            }
            else
            {
                var operands = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["screen_id"] = surface.ScreenEntityId,
                    ["control_id"] = descriptor.Kind
                };
                binding = binding with
                {
                    Candidate = binding.Candidate with
                    {
                        Operands = operands,
                        CandidateId = BuildCandidateId(
                            binding.Candidate.Command,
                            descriptor.Kind,
                            operands)
                    }
                };
            }
            result.Add(binding);
        }
        return result;
    }

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeDeckEnchantCommands(
        DeckEnchantSelectionSurface surface)
    {
        var commands = new List<NativeUiActionDescriptor>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        Dictionary<string, VisibleCard> cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        foreach (string cardId in surface.SelectableCardEntityIds.Concat(surface.DeselectableCardEntityIds))
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            bool selected = surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal);
            commands.Add(NativeDescriptor(
                $"{(selected ? "deselect" : "select")}_enchantment_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_card",
                "selection",
                $"{(selected ? "Deselect" : "Select")} {card.Name ?? card.DefinitionId}",
                $"{surface.Source.BindingEvidence}|NCardGrid.HolderPressed",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        if (surface.CanPreview)
            commands.Add(NativeDescriptor("preview_enchantment", "preview_selection", "preview", "Preview selected cards with the enchantment", $"{surface.Source.BindingEvidence}|NDeckEnchantSelectScreen.main_confirm", new[] { screen }));
        if (surface.CanCloseSelection)
            commands.Add(NativeDescriptor("close_enchantment", "close_selection", "cancel", "Close enchant selection", $"{surface.Source.BindingEvidence}|NDeckEnchantSelectScreen.close", new[] { screen }));
        if (surface.CanConfirm)
            commands.Add(NativeDescriptor("confirm_enchantment", "confirm_selection", "commit", "Apply the displayed enchantment", $"{surface.Source.BindingEvidence}|NDeckEnchantSelectScreen.preview_confirm", new[] { screen }.Concat(surface.SelectedCardEntityIds.Select(id => new ActionEntityBinding("card", id))).ToArray()));
        if (surface.CanCancelPreview)
            commands.Add(NativeDescriptor("cancel_enchantment_preview", "cancel_preview", "cancel", "Return to enchantment selection", $"{surface.Source.BindingEvidence}|NDeckEnchantSelectScreen.preview_cancel", new[] { screen }));
        return commands;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildEventDialogueBindings(
        LiveObservation draft,
        EventDialogueSurface surface) => DescribeEventDialogueCommands(surface)
        .Select(command => BindActionToCurrentObservation(draft, command))
        .Where(binding => binding != null)
        .Cast<NativeUiBoundAction>()
        .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeEventDialogueCommands(
        EventDialogueSurface surface)
    {
        VisibleDialogueLine? current = surface.RevealedLines.SingleOrDefault(line => line.IsCurrent);
        return surface.CanAdvance && current != null
            ? new[]
            {
                NativeDescriptor(
                    $"advance_event_dialogue:{surface.ScreenEntityId}:{current.EntityId}",
                    "advance_event_dialogue",
                    "navigation",
                    surface.AdvanceLabel,
                    "NAncientEventLayout.%DialogueHitbox+_currentDialogueLine",
                    new[]
                    {
                        new ActionEntityBinding("screen", surface.ScreenEntityId),
                        new ActionEntityBinding("dialogue_line", current.EntityId)
                    })
            }
            : Array.Empty<NativeUiActionDescriptor>();
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildEventOptionBindings(
        LiveObservation draft,
        EventOptionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor action in DescribeEventOptionCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, action) is { } binding)
                result.Add(binding);
        }
        return result;
    }

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeEventOptionCommands(
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

    private static IReadOnlyList<NativeUiBoundAction> BuildRestSiteBindings(
        LiveObservation draft,
        RestSiteSurface surface) =>
        DescribeRestSiteCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeRestSiteCommands(
        RestSiteSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        foreach (VisibleRestOption option in surface.Options.Where(value => value.Enabled))
        {
            actions.Add(NativeDescriptor(
                $"rest:option:{surface.ScreenEntityId}:{option.EntityId}",
                "choose_rest_option",
                "selection",
                option.Name ?? option.OptionId,
                "RestSiteRoom.Options+NRestSiteButton.ForceClick+source-specific-outcome",
                new[]
                {
                    screen,
                    new ActionEntityBinding("rest_option", option.EntityId)
                }));
        }
        if (surface.CanProceed)
        {
            actions.Add(NativeDescriptor(
                $"rest:proceed:{surface.ScreenEntityId}",
                "proceed_rest_site",
                "navigation",
                "Proceed to map",
                "NRestSiteRoom.ProceedButton+NMapScreen.Open",
                new[] { screen }));
        }
        return actions;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildEventCardAcquisitionBindings(
        LiveObservation draft,
        EventCardAcquisitionSurface surface) =>
        DescribeEventCardAcquisitionCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeEventCardAcquisitionCommands(
        EventCardAcquisitionSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        IReadOnlyDictionary<string, VisibleCard> cards = surface.Cards.ToDictionary(
            card => card.EntityId,
            StringComparer.Ordinal);
        foreach (string cardId in surface.SelectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"event-acquisition:select:{surface.ScreenEntityId}:{cardId}",
                "select_event_card_acquisition",
                "selection",
                $"Choose {card.Name ?? card.DefinitionId} to add to the run deck",
                "NSimpleCardSelectScreen.NCardGrid.HolderPressed+exact-event-source",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        foreach (string cardId in surface.DeselectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"event-acquisition:deselect:{surface.ScreenEntityId}:{cardId}",
                "deselect_event_card_acquisition",
                "selection",
                $"Deselect {card.Name ?? card.DefinitionId}",
                "NSimpleCardSelectScreen.NCardGrid.HolderPressed+exact-event-source",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        return actions;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildGameOverBindings(
        LiveObservation draft,
        GameOverSurface surface)
        => DescribeGameOverCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeGameOverCommands(
        GameOverSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildTreasureRoomBindings(
        LiveObservation draft,
        TreasureRoomSurface surface)
        => DescribeTreasureRoomCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeTreasureRoomCommands(
        TreasureRoomSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildRewardClaimBindings(
        LiveObservation draft,
        RewardClaimSurface surface)
        => DescribeRewardClaimCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeRewardClaimCommands(
        RewardClaimSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildCardRewardBindings(
        LiveObservation draft,
        CardRewardSelectionSurface surface)
        => DescribeCardRewardCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeCardRewardCommands(
        CardRewardSelectionSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildShopInventoryBindings(
        LiveObservation draft,
        ShopInventorySurface surface)
        => DescribeShopInventoryCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeShopInventoryCommands(
        ShopInventorySurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildMainMenuBindings(
        LiveObservation draft,
        MainMenuSurface surface)
        => DescribeMainMenuCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeMainMenuCommands(
        MainMenuSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildSingleplayerMenuBindings(
        LiveObservation draft,
        SingleplayerMenuSurface surface)
        => DescribeSingleplayerMenuCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeSingleplayerMenuCommands(
        SingleplayerMenuSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildCharacterSelectBindings(
        LiveObservation draft,
        CharacterSelectSurface surface)
        => DescribeCharacterSelectCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeCharacterSelectCommands(
        CharacterSelectSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        foreach (VisibleCharacterChoice character in surface.Characters.Where(value =>
                     value.IsEnabled && !value.IsLocked && !value.IsSelected))
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
            && string.Equals(option.ActionSupport, "actionable", StringComparison.Ordinal));

    private static IReadOnlyList<NativeUiBoundAction> BuildGeneratedCardChoiceBindings(
        LiveObservation draft,
        GeneratedCardChoiceSurface surface)
        => DescribeGeneratedCardChoiceCommands(surface)
            .Select(action => BindActionToCurrentObservation(draft, action))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeGeneratedCardChoiceCommands(
        GeneratedCardChoiceSurface surface)
    {
        if (surface.IsPeeking
            || string.IsNullOrWhiteSpace(surface.SelectOperation)
            || string.IsNullOrWhiteSpace(surface.SelectCompletionEvidence))
        {
            return Array.Empty<NativeUiActionDescriptor>();
        }

        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        HashSet<string> selectable = surface.SelectableCardEntityIds.ToHashSet(StringComparer.Ordinal);
        var actions = surface.Cards
            .Where(card => selectable.Contains(card.EntityId))
            .Select(card => NativeDescriptor(
                $"{surface.SelectOperation}:{surface.ScreenEntityId}:{card.EntityId}",
                surface.SelectOperation,
                "selection",
                $"Choose {card.Name ?? card.DefinitionId}",
                surface.SelectCompletionEvidence,
                new[]
                {
                    screen,
                    new ActionEntityBinding("card", card.EntityId)
                }))
            .ToList();
        if (surface.SkipAvailable
            && !string.IsNullOrWhiteSpace(surface.SkipOperation)
            && !string.IsNullOrWhiteSpace(surface.SkipCompletionEvidence))
        {
            actions.Add(NativeDescriptor(
                $"{surface.SkipOperation}:{surface.ScreenEntityId}",
                surface.SkipOperation,
                "alternative",
                "Skip",
                surface.SkipCompletionEvidence,
                new[] { screen }));
        }
        return actions;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildCombatHandBindings(
        LiveObservation draft,
        CombatHandCardSelectionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor action in DescribeCombatHandCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, action) is not { } binding)
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

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeCombatHandCommands(
        CombatHandCardSelectionSurface surface)
    {
        var cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildDeckUpgradeBindings(
        LiveObservation draft,
        DeckUpgradeSelectionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor action in DescribeDeckUpgradeCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, action) is not { } binding)
                continue;
            NativeUiActionCandidate candidate = binding.Candidate;
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

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeDeckUpgradeCommands(
        DeckUpgradeSelectionSurface surface)
    {
        var cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildDeckRemovalBindings(
        LiveObservation draft,
        DeckRemovalSelectionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor action in DescribeDeckRemovalCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, action) is not { } binding)
                continue;
            NativeUiActionCandidate candidate = binding.Candidate;
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

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeDeckRemovalCommands(
        DeckRemovalSelectionSurface surface)
    {
        if (surface.Kind is not (
            "deck_removal_selection" or
            "relic_deck_removal_selection" or
            "reward_deck_removal_selection"))
            return Array.Empty<NativeUiActionDescriptor>();
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
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildCardBundleBindings(
        LiveObservation draft,
        CardBundleSelectionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor action in DescribeCardBundleCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, action) is not { } binding)
                continue;
            NativeUiActionCandidate candidate = binding.Candidate;
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

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeCardBundleCommands(
        CardBundleSelectionSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
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

    private static IReadOnlyList<NativeUiBoundAction> BuildDeckTransformBindings(
        LiveObservation draft,
        DeckTransformSelectionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor action in DescribeDeckTransformCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, action) is not { } binding)
                continue;
            NativeUiActionCandidate candidate = binding.Candidate;
            string? cardId = action.EntityBindings?
                .FirstOrDefault(entity => entity.Role == "card")?.EntityId;
            if (action.Kind == "toggle_deck_transform_card" && cardId != null)
            {
                string command = surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal)
                    ? "deselect_entity"
                    : "select_entity";
                candidate = candidate with
                {
                    Command = command,
                    CandidateId = BuildCandidateId(command, candidate.Operation, candidate.Operands)
                };
            }
            else if (action.Kind == "toggle_deck_transform_upgrade_view")
            {
                var operands = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["screen_id"] = surface.ScreenEntityId,
                    ["control_id"] = action.Kind
                };
                candidate = candidate with
                {
                    Command = "activate_control",
                    Operands = operands,
                    CandidateId = BuildCandidateId("activate_control", candidate.Operation, operands)
                };
            }
            else if (action.Kind is
                     "preview_deck_transform" or
                     "cancel_deck_transform_selection" or
                     "cancel_deck_transform_preview" or
                     "confirm_deck_transform")
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

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeDeckTransformCommands(
        DeckTransformSelectionSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        Dictionary<string, VisibleCard> cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        foreach (string cardId in surface.SelectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"select_deck_transform_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_deck_transform_card",
                "selection",
                $"Select {card.Name ?? card.DefinitionId} for random transformation",
                $"{surface.Source.BindingEvidence}|exact-unselected-card+NCardGrid.HolderPressed",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        foreach (string cardId in surface.DeselectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"deselect_deck_transform_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_deck_transform_card",
                "selection",
                $"Deselect {card.Name ?? card.DefinitionId}",
                $"{surface.Source.BindingEvidence}|exact-selected-card+NCardGrid.HolderPressed",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        ActionEntityBinding[] selected = new[] { screen }.Concat(
            surface.SelectedCardEntityIds.Select(id => new ActionEntityBinding("card", id)))
            .ToArray();
        if (surface.CanPreview)
            actions.Add(NativeDescriptor("preview_deck_transform", "preview_deck_transform", "preview", "Preview the selected random transformation", $"{surface.Source.BindingEvidence}|NDeckTransformSelectScreen.ConfirmSelection", selected));
        if (surface.CanCancelSelection)
            actions.Add(NativeDescriptor("cancel_deck_transform_selection", "cancel_deck_transform_selection", "cancel", "Cancel random card transformation", $"{surface.Source.BindingEvidence}|NDeckTransformSelectScreen.CloseSelection", new[] { screen }));
        if (surface.CanToggleUpgradeView)
            actions.Add(NativeDescriptor("toggle_deck_transform_upgrade_view", "toggle_deck_transform_upgrade_view", "presentation", surface.ShowingUpgradePreviews ? "Show current card versions" : "Show upgraded card previews", $"{surface.Source.BindingEvidence}|NDeckTransformSelectScreen.ToggleShowUpgrades", new[] { screen }));
        if (surface.CanCancelPreview)
            actions.Add(NativeDescriptor("cancel_deck_transform_preview", "cancel_deck_transform_preview", "cancel", "Return to random transformation selection", $"{surface.Source.BindingEvidence}|NDeckTransformSelectScreen.CancelSelection", selected));
        if (surface.CanConfirm)
            actions.Add(NativeDescriptor("confirm_deck_transform", "confirm_deck_transform", "commit", "Confirm the random transformation", $"{surface.Source.BindingEvidence}|CardCmd.TransformToRandom+exact-instance-witness", selected));
        return actions;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildWoodCarvingsBindings(
        LiveObservation draft,
        WoodCarvingsReplacementSelectionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor action in DescribeWoodCarvingsCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, action) is not { } binding)
                continue;
            NativeUiActionCandidate candidate = binding.Candidate;
            if (action.Kind is
                "confirm_wood_carvings_replacement" or
                "cancel_wood_carvings_replacement_preview")
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

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeWoodCarvingsCommands(
        WoodCarvingsReplacementSelectionSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        Dictionary<string, VisibleCard> cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        foreach (string cardId in surface.SelectableCardEntityIds)
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            actions.Add(NativeDescriptor(
                $"select_wood_carvings_replacement_card:{surface.ScreenEntityId}:{cardId}",
                "select_wood_carvings_replacement_card",
                "selection",
                $"Replace {card.Name ?? card.DefinitionId} with {surface.ReplacementDefinitionId}",
                "WoodCarvings exact branch+NCardGrid.HolderPressed",
                new[] { screen, new ActionEntityBinding("card", cardId) }));
        }
        ActionEntityBinding[] selected = new[] { screen }.Concat(
            surface.SelectedCardEntityIds.Select(id => new ActionEntityBinding("card", id)))
            .ToArray();
        if (surface.CanConfirm)
            actions.Add(NativeDescriptor("confirm_wood_carvings_replacement", "confirm_wood_carvings_replacement", "commit", $"Confirm replacement with {surface.ReplacementDefinitionId}", "WoodCarvings exact branch+CardCmd.TransformTo+deterministic-witness", selected));
        if (surface.CanCancelPreview)
            actions.Add(NativeDescriptor("cancel_wood_carvings_replacement_preview", "cancel_wood_carvings_replacement_preview", "cancel", "Return to Wood Carvings card selection", "WoodCarvings exact branch+NDeckCardSelectScreen._previewCancelButton", selected));
        return actions;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildCombatPileBindings(
        LiveObservation draft,
        CombatPileCardSelectionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor action in DescribeCombatPileCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, action) is not { } binding)
                continue;
            NativeUiActionCandidate candidate = binding.Candidate;
            string? cardId = action.EntityBindings?
                .FirstOrDefault(entity => entity.Role == "card")?.EntityId;
            if (action.Kind == "toggle_combat_pile_card" && cardId != null)
            {
                string command = surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal)
                    ? "deselect_entity"
                    : "select_entity";
                candidate = candidate with
                {
                    Command = command,
                    CandidateId = BuildCandidateId(command, candidate.Operation, candidate.Operands)
                };
            }
            else if (action.Kind == "confirm_combat_pile_selection")
            {
                var operands = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["screen_id"] = surface.ScreenEntityId,
                    ["source_id"] = surface.SourceEntityId,
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

    internal static IReadOnlyList<NativeUiActionDescriptor> DescribeCombatPileCommands(
        CombatPileCardSelectionSurface surface)
    {
        var actions = new List<NativeUiActionDescriptor>();
        ActionEntityBinding screen = new("screen", surface.ScreenEntityId);
        ActionEntityBinding source = new("source", surface.SourceEntityId);
        Dictionary<string, VisibleCard> cards = surface.Cards.ToDictionary(card => card.EntityId, StringComparer.Ordinal);
        foreach (string cardId in surface.SelectableCardEntityIds.Concat(surface.DeselectableCardEntityIds))
        {
            if (!cards.TryGetValue(cardId, out VisibleCard? card))
                continue;
            bool selected = surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal);
            actions.Add(NativeDescriptor(
                $"{(selected ? "deselect" : "select")}_combat_pile_card:{surface.ScreenEntityId}:{cardId}",
                "toggle_combat_pile_card",
                "selection",
                $"{(selected ? "Deselect" : "Select")} {card.Name ?? card.DefinitionId}",
                $"{surface.SourceKind}+{surface.MutationKind}+exact-card-membership",
                new[] { screen, source, new ActionEntityBinding("card", cardId) }));
        }
        if (surface.CanConfirm)
        {
            ActionEntityBinding[] selected = new[] { screen, source }.Concat(
                surface.SelectedCardEntityIds.Select(id => new ActionEntityBinding("card", id)))
                .ToArray();
            actions.Add(NativeDescriptor("confirm_combat_pile_selection", "confirm_combat_pile_selection", "commit", "Confirm selected cards", $"{surface.SourceKind}+{surface.MutationKind}+purpose-specific-witness", selected));
        }
        return actions;
    }

    private static IReadOnlyList<NativeUiBoundAction> BuildEventRemovalBindings(
        LiveObservation draft,
        EventDeckRemovalSelectionSurface surface)
    {
        var result = new List<NativeUiBoundAction>();
        foreach (NativeUiActionDescriptor action in EventDeckRemovalSelection.DescribeCommands(surface))
        {
            if (BindActionToCurrentObservation(draft, action) is not { } binding)
                continue;
            NativeUiActionCandidate candidate = binding.Candidate;
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

    private static NativeUiActionDescriptor NativeDescriptor(
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
            entityBindings);

    internal static NativeUiBoundAction? BindActionToCurrentObservation(
        LiveObservation draft,
        NativeUiActionDescriptor action)
    {
        if (string.Equals(
                draft.CandidateAdmission,
                "human_ui",
                StringComparison.Ordinal))
        {
            return new NativeUiBoundAction(
                BuildCandidate(
                    action,
                    scope: null,
                    "human_environment_native_binding"),
                null,
                null);
        }

        ActionPermissionScope? scope = EnvironmentPermissionScopes.FindActionScope(
            draft.Game.Compatibility,
            draft.Surface.Kind,
            action.Kind,
            action.EvidenceCode);
        BoundOperationContract? contract =
            BoundOperationContract.Build(
                draft.Surface.Kind,
                action.Key,
                action.Kind,
                action.EvidenceCode,
                action.EntityBindings);
        if (scope == null || contract == null || !contract.Matches(scope))
            return null;
        return new NativeUiBoundAction(
            BuildCandidate(action, scope, "native_ui_binding"),
            PermissionBinding(scope),
            contract);
    }

    private static NativeUiActionCandidate BuildCandidate(
        NativeUiActionDescriptor action,
        ActionPermissionScope? scope,
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
        return new NativeUiActionCandidate(
            candidateId,
            command,
            action.Kind,
            action.Label,
            operands,
            new Dictionary<string, NativeUiOperandDomain>(),
            action.EntityBindings ?? Array.Empty<ActionEntityBinding>(),
            bindingKind,
            scope == null
                ? "human_operable"
                : scope.Tier == "canary" ? "trial" : "supported");
    }

    private static string BuildCandidateId(
        string command,
        string operation,
        IReadOnlyDictionary<string, string> operands) =>
        "candidate_" + StableIdentityHash.Object(new
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

    internal static bool OperandsMatch(
        NativeUiActionCandidate candidate,
        IReadOnlyDictionary<string, string> actual)
    {
        foreach ((string key, string expected) in candidate.Operands)
        {
            if (!actual.TryGetValue(key, out string? value)
                || !string.Equals(expected, value, StringComparison.Ordinal))
                return false;
        }
        foreach ((string key, NativeUiOperandDomain domain) in candidate.OperandDomains)
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
        return "nativecmd_" + StableIdentityHash.Object(new
        {
            interactionId,
            command,
            operands = operands.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray()
        })[..20];
    }

    internal static NativeInputResult StartNativeUiInput(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (binding.Candidate.BindingKind is
            "native_ui_binding" or "human_environment_native_binding")
        {
            return draft.Surface.Kind switch
            {
                "combat_turn" => StartCombatCommand(draft, request),
                "shop_room" => StartShopRoomCommand(draft, request),
                "shop_inventory" => StartShopInventoryCommand(
                    draft,
                    request,
                    binding),
                "map_navigation" => StartMapCommand(draft, request),
                "rest_site" => StartRestCommand(draft, request),
                "event_option" => StartEventOptionCommand(
                    draft,
                    request,
                    binding),
                "event_dialogue" => StartEventDialogueCommand(draft, request, binding),
                "reward_claim" => StartRewardClaimCommand(
                    draft,
                    request,
                    binding),
                "card_reward_selection" => StartCardRewardCommand(
                    draft,
                    request,
                    binding),
                "treasure_room" => StartTreasureRoomCommand(
                    draft,
                    request,
                    binding),
                "deck_enchant_selection" => StartDeckEnchantCommand(
                    draft,
                    request,
                    binding),
                "main_menu" => StartMainMenuCommand(draft, request, binding),
                "singleplayer_menu" => StartSingleplayerMenuCommand(draft, request, binding),
                "character_select" => StartCharacterSelectCommand(draft, request, binding),
                "generated_card_choice" => StartGeneratedCardChoiceCommand(draft, request, binding),
                "event_card_acquisition" => StartEventCardAcquisitionCommand(draft, request, binding),
                "combat_hand_card_selection" => StartCombatHandCommand(draft, request, binding),
                "deck_upgrade_selection" => StartDeckUpgradeCommand(draft, request, binding),
                "deck_removal_selection" or
                "relic_deck_removal_selection" or
                "reward_deck_removal_selection" => StartDeckRemovalCommand(
                    draft,
                    request,
                    binding),
                "event_deck_removal_selection" => EventDeckRemovalSelection.Start(
                    Entities,
                    draft,
                    request,
                    binding),
                "card_bundle_selection" => StartCardBundleCommand(draft, request, binding),
                "deck_transform_selection" => StartDeckTransformCommand(draft, request, binding),
                "wood_carvings_replacement_selection" => StartWoodCarvingsCommand(draft, request, binding),
                "combat_pile_card_selection" => StartCombatPileCommand(draft, request, binding),
                "game_over" => StartGameOverCommand(draft, request, binding),
                _ => NativeInputResult.Rejected(
                    "native_command_owner_unsupported",
                    "The current owner has no native UI command resolver.")
            };
        }
        return NativeInputResult.Rejected(
            "native_command_binding_required",
            "The command has no current native UI binding.");
    }

    private static NativeInputResult StartMainMenuCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not MainMenuSurface surface
            || !HasExactOperand(request, "menu_screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
                "main_menu_owner_changed",
                "The exact main-menu owner is no longer current.");
        }
        return binding.Candidate.Operation switch
        {
            "continue_run" => MainMenuSurfaceReader.StartContinue(Entities, surface.ScreenEntityId),
            "open_singleplayer" => MainMenuSurfaceReader.StartOpenSingleplayer(Entities, surface.ScreenEntityId),
            _ => NativeInputResult.Rejected(
                "main_menu_command_unsupported",
                "The requested main-menu command is not supported for this exact interaction.")
        };
    }

    private static NativeInputResult StartSingleplayerMenuCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not SingleplayerMenuSurface surface
            || !HasExactOperand(request, "menu_screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
                "singleplayer_menu_owner_changed",
                "The exact single-player submenu owner is no longer current.");
        }
        return binding.Candidate.Operation switch
        {
            "open_standard_run_setup" => SingleplayerMenuSurfaceReader.StartStandard(Entities, surface.ScreenEntityId),
            "back_from_singleplayer_menu" => SingleplayerMenuSurfaceReader.StartBack(Entities, surface.ScreenEntityId),
            _ => NativeInputResult.Rejected(
                "singleplayer_menu_command_unsupported",
                "The requested single-player menu command is not supported for this exact interaction.")
        };
    }

    private static NativeInputResult StartCharacterSelectCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not CharacterSelectSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
                "character_select_owner_changed",
                "The exact character-select owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        return binding.Candidate.Operation switch
        {
            "select_character" when operands.TryGetValue("character_choice_id", out string? choiceId) =>
                CharacterSelectSurfaceReader.StartSelect(Entities, surface.ScreenEntityId, choiceId),
            "decrease_ascension" =>
                CharacterSelectSurfaceReader.StartAscensionChange(Entities, surface.ScreenEntityId, -1),
            "increase_ascension" =>
                CharacterSelectSurfaceReader.StartAscensionChange(Entities, surface.ScreenEntityId, 1),
            "embark_standard_run" when operands.TryGetValue("character_choice_id", out string? selectedId) =>
                CharacterSelectSurfaceReader.StartEmbark(Entities, surface.ScreenEntityId, selectedId),
            "back_from_character_select" =>
                CharacterSelectSurfaceReader.StartBack(Entities, surface.ScreenEntityId),
            _ => NativeInputResult.Rejected(
                "character_select_command_unsupported",
                "The requested character-select command is not supported for this exact interaction.")
        };
    }

    private static bool HasExactOperand(
        NativeUiInput request,
        string name,
        string expected) =>
        request.Operands != null
        && request.Operands.TryGetValue(name, out string? actual)
        && string.Equals(actual, expected, StringComparison.Ordinal);

    private static NativeInputResult StartGeneratedCardChoiceCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not GeneratedCardChoiceSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
                "generated_choice_owner_changed",
                "The exact generated-card choice owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Command == "select_entity"
            && operands.TryGetValue("card_id", out string? cardId))
        {
            return GeneratedCardChoiceSurfaceReader.StartSelect(
                Entities,
                surface.ScreenEntityId,
                cardId);
        }
        if (binding.Candidate.Operation.StartsWith("skip_", StringComparison.Ordinal))
        {
            return GeneratedCardChoiceSurfaceReader.StartSkip(
                Entities,
                surface.ScreenEntityId);
        }
        return NativeInputResult.Rejected(
            "generated_choice_command_unsupported",
            "The requested generated-card command is not supported for this exact source.");
    }

    private static NativeInputResult StartEventCardAcquisitionCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not EventCardAcquisitionSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
                "event_acquisition_owner_changed",
                "The exact audited event card-acquisition owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("card_id", out string? cardId))
        {
            return NativeInputResult.Rejected(
                "event_acquisition_binding_changed",
                "The exact event card operand is missing.");
        }
        if (binding.Candidate.Operation == "select_event_card_acquisition"
            && request.Command == "select_entity"
            && surface.SelectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
        {
            return EventCardAcquisitionSurfaceReader.StartDirectToggle(
                Entities,
                surface.ScreenEntityId,
                cardId,
                expectedSelected: false);
        }
        if (binding.Candidate.Operation == "deselect_event_card_acquisition"
            && request.Command == "deselect_entity"
            && surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
        {
            return EventCardAcquisitionSurfaceReader.StartDirectToggle(
                Entities,
                surface.ScreenEntityId,
                cardId,
                expectedSelected: true);
        }
        return NativeInputResult.Rejected(
            "event_acquisition_command_unsupported",
            "The command does not match the exact current event card selection state.");
    }

    private static NativeInputResult StartCombatHandCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not CombatHandCardSelectionSurface surface
            || !HasExactOperand(request, "hand_id", surface.HandEntityId))
        {
            return NativeInputResult.Rejected(
                "combat_hand_owner_changed",
                "The exact combat-hand selection owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Operation == "select_combat_hand_card"
            && request.Command == "select_entity"
            && operands.TryGetValue("card_id", out string? selectedCardId))
        {
            return CombatHandCardSelectionSurfaceReader.StartSelect(
                Entities,
                surface.HandEntityId,
                selectedCardId);
        }
        if (binding.Candidate.Operation == "deselect_combat_hand_card"
            && request.Command == "deselect_entity"
            && operands.TryGetValue("card_id", out string? deselectedCardId))
        {
            return CombatHandCardSelectionSurfaceReader.StartDeselect(
                Entities,
                surface.HandEntityId,
                deselectedCardId);
        }
        if (binding.Candidate.Operation == "confirm_combat_hand_selection"
            && request.Command == "confirm_interaction"
            && HasExactOperand(request, "control_id", "confirm_combat_hand_selection"))
        {
            return CombatHandCardSelectionSurfaceReader.StartConfirm(
                Entities,
                surface.HandEntityId);
        }
        if (binding.Candidate.Operation == "close_combat_hand_peek"
            && request.Command == "cancel_interaction"
            && HasExactOperand(request, "control_id", "close_combat_hand_peek"))
        {
            return CombatHandCardSelectionSurfaceReader.StartClosePeek(
                Entities,
                surface.HandEntityId);
        }
        return NativeInputResult.Rejected(
            "combat_hand_command_unsupported",
            "The command does not match the exact current combat-hand interaction.");
    }

    private static NativeInputResult StartDeckUpgradeCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not DeckUpgradeSelectionSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
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
                return DeckUpgradeSelectionSurfaceReader.StartToggle(
                    Entities,
                    surface.ScreenEntityId,
                    cardId,
                    expectedSelected: false);
            }
            if (request.Command == "deselect_entity"
                && surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return DeckUpgradeSelectionSurfaceReader.StartToggle(
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
            return DeckUpgradeSelectionSurfaceReader.StartClose(
                Entities,
                surface.ScreenEntityId);
        }
        if (binding.Candidate.Operation == "cancel_deck_upgrade_preview"
            && surface.Stage == "preview"
            && surface.CanCancelPreview
            && request.Command == "cancel_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return DeckUpgradeSelectionSurfaceReader.StartPreviewCancel(
                Entities,
                surface.ScreenEntityId);
        }
        if (binding.Candidate.Operation == "confirm_deck_upgrade"
            && surface.Stage == "preview"
            && surface.CanConfirm
            && request.Command == "confirm_interaction"
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return DeckUpgradeSelectionSurfaceReader.StartConfirm(
                Entities,
                surface.ScreenEntityId,
                surface.SelectedCardEntityIds);
        }
        return NativeInputResult.Rejected(
            "deck_upgrade_command_unsupported",
            "The command does not match the exact current deck-upgrade stage and membership.");
    }

    private static NativeInputResult StartDeckRemovalCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not DeckRemovalSelectionSurface surface
            || surface.Kind is not (
                "deck_removal_selection" or
                "relic_deck_removal_selection" or
                "reward_deck_removal_selection")
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
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
                return DeckRemovalSelectionSurfaceReader.StartDirectToggle(
                    Entities,
                    surface.Kind,
                    surface.ScreenEntityId,
                    cardId,
                    expectedSelected: false);
            }
            if (request.Command == "deselect_entity"
                && surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return DeckRemovalSelectionSurfaceReader.StartDirectToggle(
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
            return DeckRemovalSelectionSurfaceReader.StartDirectPreview(
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
            return DeckRemovalSelectionSurfaceReader.StartDirectClose(
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
            return DeckRemovalSelectionSurfaceReader.StartDirectPreviewCancel(
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
            return DeckRemovalSelectionSurfaceReader.StartDirectConfirm(
                Entities,
                surface.Kind,
                surface.ScreenEntityId,
                surface.SelectedCardEntityIds);
        }
        return NativeInputResult.Rejected(
            "deck_removal_command_unsupported",
            "The command does not match the exact current source-bound removal stage and membership.");
    }

    private static NativeInputResult StartCardBundleCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not CardBundleSelectionSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
                "card_bundle_owner_changed",
                "The exact card-bundle owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("bundle_id", out string? bundleId))
        {
            return NativeInputResult.Rejected(
                "card_bundle_binding_changed",
                "The exact card-bundle operand is missing.");
        }
        if (binding.Candidate.Operation == "preview_card_bundle"
            && surface.Stage == "choosing"
            && request.Command == "select_entity")
        {
            return CardBundleSelectionSurfaceReader.StartDirectPreview(
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
            return CardBundleSelectionSurfaceReader.StartDirectConfirm(
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
            return CardBundleSelectionSurfaceReader.StartDirectCancel(
                Entities,
                surface.ScreenEntityId,
                bundleId);
        }
        return NativeInputResult.Rejected(
            "card_bundle_command_unsupported",
            "The command does not match the exact current card-bundle stage and source.");
    }

    private static NativeInputResult StartDeckTransformCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not DeckTransformSelectionSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
                "deck_transform_owner_changed",
                "The exact source-bound random-transform owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Operation == "toggle_deck_transform_card"
            && operands.TryGetValue("card_id", out string? cardId))
        {
            if (request.Command == "select_entity"
                && surface.SelectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return DeckTransformSelectionSurfaceReader.StartDirectToggle(
                    Entities, surface.ScreenEntityId, cardId, false, surface.Source);
            }
            if (request.Command == "deselect_entity"
                && surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return DeckTransformSelectionSurfaceReader.StartDirectToggle(
                    Entities, surface.ScreenEntityId, cardId, true, surface.Source);
            }
        }
        if (!HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return NativeInputResult.Rejected(
                "deck_transform_control_changed",
                "The exact random-transform control operand is missing.");
        }
        return binding.Candidate.Operation switch
        {
            "preview_deck_transform" when surface.Stage == "selecting" && surface.CanPreview =>
                DeckTransformSelectionSurfaceReader.StartDirectPreview(Entities, surface.ScreenEntityId, surface.Source),
            "cancel_deck_transform_selection" when surface.Stage == "selecting" && surface.CanCancelSelection =>
                DeckTransformSelectionSurfaceReader.StartDirectCancelSelection(Entities, surface.ScreenEntityId, surface.Source),
            "toggle_deck_transform_upgrade_view" when surface.Stage == "selecting" && surface.CanToggleUpgradeView =>
                DeckTransformSelectionSurfaceReader.StartDirectToggleUpgradeView(Entities, surface.ScreenEntityId, surface.ShowingUpgradePreviews, surface.Source),
            "cancel_deck_transform_preview" when surface.Stage == "preview" && surface.CanCancelPreview =>
                DeckTransformSelectionSurfaceReader.StartDirectCancelPreview(Entities, surface.ScreenEntityId, surface.Source),
            "confirm_deck_transform" when surface.Stage == "preview" && surface.CanConfirm =>
                DeckTransformSelectionSurfaceReader.StartDirectConfirm(Entities, surface.ScreenEntityId, surface.SelectedCardEntityIds, surface.Source),
            _ => NativeInputResult.Rejected(
                "deck_transform_command_unsupported",
                "The command does not match the exact current random-transform stage and membership.")
        };
    }

    private static NativeInputResult StartWoodCarvingsCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not WoodCarvingsReplacementSelectionSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
                "wood_carvings_owner_changed",
                "The exact Wood Carvings replacement owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Operation == "select_wood_carvings_replacement_card"
            && surface.Stage == "selecting"
            && request.Command == "select_entity"
            && operands.TryGetValue("card_id", out string? cardId)
            && surface.SelectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
        {
            return WoodCarvingsReplacementSurfaceReader.StartDirectSelect(
                Entities,
                surface.ScreenEntityId,
                cardId,
                surface.Branch,
                surface.ReplacementDefinitionId);
        }
        if (!HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return NativeInputResult.Rejected(
                "wood_carvings_control_changed",
                "The exact Wood Carvings control operand is missing.");
        }
        return binding.Candidate.Operation switch
        {
            "confirm_wood_carvings_replacement" when surface.Stage == "preview" && surface.CanConfirm =>
                WoodCarvingsReplacementSurfaceReader.StartDirectConfirm(
                    Entities,
                    surface.ScreenEntityId,
                    surface.SelectedCardEntityIds,
                    surface.Branch,
                    surface.ReplacementDefinitionId),
            "cancel_wood_carvings_replacement_preview" when surface.Stage == "preview" && surface.CanCancelPreview =>
                WoodCarvingsReplacementSurfaceReader.StartDirectCancelPreview(
                    Entities,
                    surface.ScreenEntityId,
                    surface.Branch,
                    surface.ReplacementDefinitionId),
            _ => NativeInputResult.Rejected(
                "wood_carvings_command_unsupported",
                "The command does not match the exact current Wood Carvings stage and branch.")
        };
    }

    private static NativeInputResult StartCombatPileCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not CombatPileCardSelectionSurface surface
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId))
        {
            return NativeInputResult.Rejected(
                "combat_pile_owner_changed",
                "The exact source-bound combat-pile owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (binding.Candidate.Operation == "toggle_combat_pile_card"
            && operands.TryGetValue("card_id", out string? cardId))
        {
            if (request.Command == "select_entity"
                && surface.SelectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return CombatPileCardSelectionSurfaceReader.StartDirectToggle(
                    Entities, surface, cardId, false);
            }
            if (request.Command == "deselect_entity"
                && surface.DeselectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
            {
                return CombatPileCardSelectionSurfaceReader.StartDirectToggle(
                    Entities, surface, cardId, true);
            }
        }
        if (binding.Candidate.Operation == "confirm_combat_pile_selection"
            && surface.CanConfirm
            && request.Command == "confirm_interaction"
            && HasExactOperand(request, "source_id", surface.SourceEntityId)
            && HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return CombatPileCardSelectionSurfaceReader.StartDirectConfirm(Entities, surface);
        }
        return NativeInputResult.Rejected(
            "combat_pile_command_unsupported",
            "The command does not match the exact current combat-pile source and membership.");
    }

    private static NativeInputResult StartGameOverCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not GameOverSurface surface
            || !HasExactOperand(
                request,
                "game_over_screen_id",
                surface.ScreenEntityId)
            || !HasExactOperand(request, "control_id", binding.Candidate.Operation))
        {
            return NativeInputResult.Rejected(
                "game_over_owner_changed",
                "The exact game-over owner or semantic control is no longer current.");
        }
        if (binding.Candidate.Operation == "advance_game_over_summary"
            && surface.Stage == "intro"
            && surface.CanAdvanceSummary)
        {
            return GameOverSurfaceReader.StartAdvance(
                Entities,
                surface.ScreenEntityId);
        }
        if (binding.Candidate.Operation == "return_game_over"
            && surface.Stage == "summary"
            && surface.CanReturn)
        {
            return GameOverSurfaceReader.StartReturn(
                Entities,
                surface.ScreenEntityId);
        }
        return NativeInputResult.Rejected(
            "game_over_command_unsupported",
            "The requested game-over command does not match the current exact stage.");
    }

    private static NativeInputResult StartMapCommand(
        LiveObservation draft,
        NativeUiInput request)
    {
        if (draft.Surface is not MapNavigationSurface surface)
        {
            return NativeInputResult.Rejected(
                "owner_changed",
                "The map-navigation owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("map_screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return NativeInputResult.Rejected(
                "map_owner_changed",
                "The exact map screen is no longer current.");
        }

        if (request.Command == "navigate"
            && operands.TryGetValue("map_node_id", out string? nodeId))
        {
            return MapNavigationSurfaceReader.StartTravel(
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
            return MapNavigationSurfaceReader.StopAnnotation(
                Entities,
                screenId,
                annotationInputId);
        }

        return NativeInputResult.Rejected(
            "map_command_unsupported",
            "The requested map command is not supported for this exact interaction.");
    }

    private static NativeInputResult StartRestCommand(
        LiveObservation draft,
        NativeUiInput request)
    {
        if (draft.Surface is not RestSiteSurface surface)
        {
            return NativeInputResult.Rejected(
                "owner_changed",
                "The rest-site owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return NativeInputResult.Rejected(
                "rest_owner_changed",
                "The exact rest-site screen is no longer current.");
        }

        if (request.Command == "choose"
            && operands.TryGetValue("rest_option_id", out string? optionId))
        {
            return RestSiteSurfaceReader.StartOption(
                Entities,
                screenId,
                optionId);
        }
        if (request.Command == "activate_control"
            && operands.TryGetValue("control_id", out string? controlId)
            && string.Equals(controlId, "proceed_rest_site", StringComparison.Ordinal))
        {
            return RestSiteSurfaceReader.StartProceed(Entities, screenId);
        }

        return NativeInputResult.Rejected(
            "rest_command_unsupported",
            "The requested rest-site command is not supported for this exact interaction.");
    }

    private static NativeInputResult StartEventOptionCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not EventOptionSurface surface)
        {
            return NativeInputResult.Rejected(
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
            return NativeInputResult.Rejected(
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
            return NativeInputResult.Rejected(
                "event_option_command_unsupported",
                "The requested event continuation control is not exact.");
        }

        return EventOptionSurfaceReader.StartOption(
            Entities,
            screenId,
            optionId,
            expectedProceed);
    }

    private static NativeInputResult StartEventDialogueCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not EventDialogueSurface surface
            || binding.Candidate.Operation != "advance_event_dialogue")
        {
            return NativeInputResult.Rejected(
                "owner_changed",
                "The ancient event-dialogue owner is no longer current.");
        }
        VisibleDialogueLine? current = surface.RevealedLines
            .SingleOrDefault(line => line.IsCurrent);
        if (!surface.CanAdvance
            || current == null
            || !HasExactOperand(request, "screen_id", surface.ScreenEntityId)
            || !HasExactOperand(request, "dialogue_line_id", current.EntityId)
            || !HasExactOperand(request, "control_id", "advance_event_dialogue"))
        {
            return NativeInputResult.Rejected(
                "event_dialogue_changed",
                "The exact current dialogue line and advance control are no longer advertised.");
        }
        return EventDialogueSurfaceReader.StartDirectAdvance(
            Entities,
            surface.ScreenEntityId,
            current.EntityId,
            surface.CurrentLineIndex);
    }

    private static NativeInputResult StartRewardClaimCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not RewardClaimSurface surface)
        {
            return NativeInputResult.Rejected(
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
            return NativeInputResult.Rejected(
                "reward_owner_changed",
                "The exact rewards screen is no longer current.");
        }

        return binding.Candidate.Operation switch
        {
            "claim_reward"
                when operands.TryGetValue("choice_id", out string? rewardId) =>
                RewardClaimSurfaceReader.StartClaim(
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
                RewardClaimSurfaceReader.StartDiscardPotion(
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
                RewardClaimSurfaceReader.StartProceed(
                    Entities,
                    screenId),
            _ => NativeInputResult.Rejected(
                "reward_command_unsupported",
                "The requested command is not supported for this exact rewards state.")
        };
    }

    private static NativeInputResult StartCardRewardCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not CardRewardSelectionSurface surface)
        {
            return NativeInputResult.Rejected(
                "owner_changed",
                "The card reward owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return NativeInputResult.Rejected(
                "card_reward_owner_changed",
                "The exact card reward screen is no longer current.");
        }

        if (binding.Candidate.Operation == "select_card_reward"
            && operands.TryGetValue("card_id", out string? cardId)
            && surface.SelectableCardEntityIds.Contains(cardId, StringComparer.Ordinal))
        {
            return CardRewardSurfaceReader.StartCardSelection(
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
            return CardRewardSurfaceReader.StartAlternative(
                Entities,
                screenId,
                alternativeId,
                alternative.Label);
        }
        return NativeInputResult.Rejected(
            "card_reward_command_unsupported",
            "The requested command is not supported for this exact card reward state.");
    }

    private static NativeInputResult StartTreasureRoomCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not TreasureRoomSurface surface)
        {
            return NativeInputResult.Rejected(
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
            return NativeInputResult.Rejected(
                "treasure_owner_changed",
                "The exact treasure-room owner is no longer current.");
        }

        return binding.Candidate.Operation switch
        {
            "open_treasure_chest" =>
                TreasureRoomSurfaceReader.StartOpen(Entities, roomId),
            "choose_treasure_relic"
                when operands.TryGetValue("choice_id", out string? relicId) =>
                TreasureRoomSurfaceReader.StartChoose(
                    Entities,
                    roomId,
                    relicId),
            "skip_treasure_relic" =>
                TreasureRoomSurfaceReader.StartSkip(Entities, roomId),
            "proceed_treasure_room" =>
                TreasureRoomSurfaceReader.StartProceed(Entities, roomId),
            _ => NativeInputResult.Rejected(
                "treasure_command_unsupported",
                "The requested command is not supported for this exact treasure stage.")
        };
    }

    private static NativeInputResult StartDeckEnchantCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not DeckEnchantSelectionSurface surface)
        {
            return NativeInputResult.Rejected(
                "owner_changed",
                "The deck-enchant owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return NativeInputResult.Rejected(
                "enchantment_owner_changed",
                "The exact deck-enchant screen is no longer current.");
        }

        return binding.Candidate.Operation switch
        {
            "toggle_card" when operands.TryGetValue("card_id", out string? cardId) =>
                DeckEnchantSurfaceReader.StartToggleCard(
                    Entities,
                    screenId,
                    cardId),
            "preview_selection" =>
                DeckEnchantSurfaceReader.StartMainPreview(Entities, screenId),
            "confirm_selection" =>
                DeckEnchantSurfaceReader.StartPreviewConfirm(Entities, screenId),
            "cancel_preview" =>
                DeckEnchantSurfaceReader.StartPreviewCancel(Entities, screenId),
            "close_selection" =>
                DeckEnchantSurfaceReader.StartClose(Entities, screenId),
            _ => NativeInputResult.Rejected(
                "deck_enchant_command_unsupported",
                "The requested command is not supported for this exact deck-enchant stage.")
        };
    }

    private static NativeInputResult StartShopRoomCommand(
        LiveObservation draft,
        NativeUiInput request)
    {
        if (draft.Surface is not ShopRoomSurface surface)
        {
            return NativeInputResult.Rejected(
                "owner_changed",
                "The merchant-room owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("room_id", out string? roomId)
            || !string.Equals(roomId, surface.RoomEntityId, StringComparison.Ordinal)
            || !operands.TryGetValue("control_id", out string? controlId))
        {
            return NativeInputResult.Rejected(
                "shop_room_binding_changed",
                "The exact merchant room and control binding are no longer current.");
        }

        return controlId switch
        {
            "open_shop_inventory" =>
                ShopRoomSurfaceReader.StartOpenInventory(Entities, roomId),
            "proceed_shop" =>
                ShopRoomSurfaceReader.StartProceed(Entities, roomId),
            _ => NativeInputResult.Rejected(
                "shop_room_control_unsupported",
                "The requested merchant-room control is not supported.")
        };
    }

    private static NativeInputResult StartShopInventoryCommand(
        LiveObservation draft,
        NativeUiInput request,
        NativeUiBoundAction binding)
    {
        if (draft.Surface is not ShopInventorySurface surface)
        {
            return NativeInputResult.Rejected(
                "owner_changed",
                "The merchant-inventory owner is no longer current.");
        }
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();
        if (!operands.TryGetValue("screen_id", out string? screenId)
            || !string.Equals(screenId, surface.ScreenEntityId, StringComparison.Ordinal))
        {
            return NativeInputResult.Rejected(
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
                ? ShopInventorySurfaceReader.StartCloseInventory(Entities, screenId)
                : NativeInputResult.Rejected(
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
                return NativeInputResult.Rejected(
                    "shop_card_removal_changed",
                    "The exact card-removal service is no longer current.");
            }
            return ShopInventorySurfaceReader.StartCardRemoval(
                Entities,
                screenId,
                removalId,
                removal.Price);
        }
        if (!operands.TryGetValue("shop_offer_id", out string? offerId))
        {
            return NativeInputResult.Rejected(
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
                ShopInventorySurfaceReader.StartCardPurchase(
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
                ShopInventorySurfaceReader.StartRelicPurchase(
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
                ShopInventorySurfaceReader.StartPotionPurchase(
                    Entities,
                    screenId,
                    offerId,
                    potion.Price),
            _ => NativeInputResult.Rejected(
                "shop_inventory_command_unsupported",
                "The requested command is not supported for this exact merchant inventory.")
        };
    }

    private static NativeInputResult StartCombatCommand(
        LiveObservation draft,
        NativeUiInput request)
    {
        if (draft.Surface is not CombatTurnSurface surface)
            return NativeInputResult.Rejected(
                "owner_changed",
                "The combat-turn owner is no longer current.");
        IReadOnlyDictionary<string, string> operands =
            request.Operands ?? new Dictionary<string, string>();

        return request.Command switch
        {
            "play_card" when operands.TryGetValue("card_id", out string? cardId) =>
                CombatTurnSurfaceReader.StartDirectPlayCard(
                    Entities,
                    surface.RoomEntityId,
                    cardId,
                    operands.GetValueOrDefault("target_id")),
            "use_potion" when operands.TryGetValue("potion_id", out string? potionId) =>
                CombatTurnSurfaceReader.StartDirectUsePotion(
                    Entities,
                    surface.RoomEntityId,
                    potionId,
                    operands.GetValueOrDefault("target_id")),
            "end_turn" => CombatTurnSurfaceReader.StartDirectEndTurn(
                Entities,
                surface.RoomEntityId),
            _ => NativeInputResult.Rejected(
                "command_not_supported",
                "This command is not supported by the combat direct resolver.")
        };
    }

    internal static string DetermineExecutionSupport(
        LiveObservation draft,
        IReadOnlyList<NativeUiBoundAction> bindings)
    {
        return ClassifyExecutionSupport(
            draft.Game.Compatibility.ActionExecutionAllowed,
            draft.Readiness,
            draft.Surface.Kind,
            bindings.Count,
            bindings.Any(binding => binding.Candidate.AuthorityState == "trial"),
            draft.Surface is UnsupportedSurface);
    }

    internal static string ClassifyExecutionSupport(
        bool actionExecutionAllowed,
        string readiness,
        string surfaceKind,
        int bindingCount,
        bool hasTrialBinding,
        bool visibleUnsupported = false)
    {
        if (!actionExecutionAllowed || surfaceKind == "unsupported" || visibleUnsupported)
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

    private static OperationPermissionBinding PermissionBinding(
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

}
