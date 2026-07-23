using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal enum BridgeOperationEvidenceStatus
{
    SurfaceLevelOnly,
    SourceAudited,
    OrganicCanaryExercised,
    OrganicQualified
}

internal sealed record BridgeOperationManifest(
    string Operation,
    BridgeOperationEvidenceStatus EvidenceStatus,
    IReadOnlyList<string> EvidenceIds);

internal sealed record BridgeContractManifestEntry(
    string Kind,
    string ProtocolRevision,
    string Mechanism,
    string SourceBindingId,
    string ReSupport,
    IReadOnlyList<string> VisibleFactGroups,
    IReadOnlyList<BridgeOperationManifest> Operations,
    IReadOnlyList<string> TestReferences,
    IReadOnlyList<string> DocumentationReferences)
{
    public SurfaceCapability ToCapability(
        string support,
        IReadOnlyList<string> permittedOperations) => new(
        Kind,
        support,
        permittedOperations,
        SourceBindingId);
}

internal sealed record BridgeInspectionManifestEntry(
    string Kind,
    string ProtocolRevision,
    string SourceBindingId,
    string ReSupport,
    string VisibilityClass,
    string OrderingSemantics,
    IReadOnlyList<string> VisibleFactGroups,
    IReadOnlyList<string> HiddenByPolicy,
    BridgeOperationEvidenceStatus EvidenceStatus,
    IReadOnlyList<string> TestReferences,
    IReadOnlyList<string> DocumentationReferences);

/// <summary>
/// Non-authorizing inventory of implemented semantic contracts.
/// Presence here never grants observation, inspection, canary, or qualified authority.
/// Exact-environment permission remains exclusively owned by BridgeSurfacePermission.
/// </summary>
internal static class BridgeContractManifest
{
    private const string ContractTest = "tests/STS2_MCP.Tests/BridgeContractTests.cs";
    private const string CoverageDoc = "docs/bridge-v2/PLAYER_VISIBLE_COVERAGE.md";

    public static readonly IReadOnlyList<BridgeContractManifestEntry> Entries = new[]
    {
        Entry(
            "deck_enchant_selection",
            new[] { "toggle_card", "preview_selection", "confirm_selection", "cancel_preview", "close_selection" },
            "sts2-v0.109.0:SelfHelpBook.ReadEntireBook+CardSelectCmd.FromDeckForEnchantment+NDeckEnchantSelectScreen+exact-card-enchantment-post-state-witness",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "selection", "preview", "controls" }),
        Entry(
            "deck_removal_selection",
            new[]
            {
                "toggle_deck_removal_card", "preview_deck_removal", "confirm_deck_removal",
                "cancel_deck_removal_preview", "cancel_deck_removal_selection"
            },
            "sts2-v0.109.0:MerchantCardRemovalEntry+CardSelectCmd.FromDeckForRemoval+NDeckCardSelectScreen+semantic-post-state-witness",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "selection", "service_cost", "preview", "controls" }),
        Entry(
            "relic_deck_removal_selection",
            new[]
            {
                "toggle_deck_removal_card", "preview_deck_removal", "confirm_deck_removal",
                "cancel_deck_removal_preview", "cancel_deck_removal_selection"
            },
            "sts2-v0.109.0:PreciseScissors.AfterObtained+CardSelectCmd.FromDeckForRemoval+CardPileCmd.RemoveFromDeck+task-local-source-binding+exact-card-post-state-witness",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "selection", "preview", "controls" }),
        Entry(
            "reward_deck_removal_selection",
            new[]
            {
                "toggle_deck_removal_card", "preview_deck_removal", "confirm_deck_removal",
                "cancel_deck_removal_preview", "cancel_deck_removal_selection"
            },
            "sts2-v0.109.0:CardRemovalReward.OnSelect+RewardSynchronizer.DoUnsyncedCardRemoval+CardSelectCmd.FromDeckForRemoval+CardPileCmd.RemoveFromDeck+task-local-source-binding+exact-card-post-state-witness",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "selection", "preview", "cancel", "controls" }),
        Entry(
            "deck_upgrade_selection",
            new[]
            {
                "toggle_deck_upgrade_card", "confirm_deck_upgrade",
                "cancel_deck_upgrade_preview", "cancel_deck_upgrade_selection"
            },
            "sts2-v0.109.0:CardSelectCmd.FromDeckForUpgrade+NDeckUpgradeSelectScreen+semantic-post-state-canary",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "upgrade_preview", "selection", "controls" }),
        Entry(
            "deck_transform_selection",
            new[]
            {
                Operation("toggle_deck_transform_card", BridgeOperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#organic-canary"),
                Operation("preview_deck_transform", BridgeOperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#source-audit"),
                Operation("confirm_deck_transform", BridgeOperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#organic-canary"),
                Operation("cancel_deck_transform_preview", BridgeOperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#source-audit"),
                Operation("cancel_deck_transform_selection", BridgeOperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#source-audit"),
                Operation("toggle_deck_transform_upgrade_view", BridgeOperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#organic-canary")
            },
            "sts2-v0.109.0:WhisperingHollow.Hug+CardSelectCmd.FromDeckForTransformation+NDeckTransformSelectScreen+exact-instance-post-state-witness",
            "purpose_specific_random_deck_transform",
            new[] { "visible_deck_cards", "selection", "random_uncommitted_preview", "upgrade_view", "controls" }),
        Entry(
            "wood_carvings_replacement_selection",
            new[]
            {
                Operation("select_wood_carvings_replacement_card", BridgeOperationEvidenceStatus.OrganicCanaryExercised,
                    "docs/bridge-v2/GATE1_WOOD_CARVINGS_CLOSEOUT_2026-07-22.md"),
                Operation("confirm_wood_carvings_replacement", BridgeOperationEvidenceStatus.OrganicCanaryExercised,
                    "docs/bridge-v2/GATE1_WOOD_CARVINGS_CLOSEOUT_2026-07-22.md"),
                Operation("cancel_wood_carvings_replacement_preview", BridgeOperationEvidenceStatus.OrganicCanaryExercised,
                    "docs/bridge-v2/GATE1_WOOD_CARVINGS_CLOSEOUT_2026-07-22.md")
            },
            "sts2-v0.109.0:WoodCarvings.Bird/Torus+CardSelectCmd.FromDeckGeneric+NDeckCardSelectScreen+exact-source-task-binding+deterministic-replacement-witness",
            "purpose_specific_deterministic_deck_replacement",
            new[] { "visible_deck_cards", "selection", "event_branch", "known_replacement", "preview", "controls" }),
        Entry(
            "event_dialogue",
            new[] { "advance_event_dialogue" },
            "sts2-v0.109.0:NAncientEventLayout+revealed-prefix-only+exact-dialogue-index-witness",
            "event_dialogue_progression",
            new[] { "revealed_dialogue_prefix", "speaker", "advance_control" }),
        Entry(
            "rest_site",
            new[] { "choose_rest_option", "proceed_rest_site" },
            "sts2-v0.109.0:RestSiteRoom.Options+NRestSiteButton+HealRestSiteOption exact HP witness+Smith exact upgrade-child witness+NProceedButton+NMapScreen",
            "rest_site_semantic_options",
            new[] { "visible_rest_options", "availability", "effects", "proceed_control" }),
        Entry(
            "event_option",
            new[] { "choose_event_option", "proceed_event" },
            "sts2-v0.109.0:NEventRoom+NEventOptionButton+EventOption+visible-hover-tips+semantic-transition-witness",
            "event_semantic_options",
            new[] { "visible_event_text", "options", "hover_tips", "proceed_control" }),
        Entry(
            "combat_turn",
            new[] { "play_card", "use_potion", "end_turn" },
            "sts2-v0.109.0:CombatManager+PlayerCombatState+CardModel+NPlayerHand+organic-action-lifecycles",
            "combat_turn_controls",
            new[] { "hand", "energy", "combatants", "intents", "potions", "end_turn_control" }),
        Entry(
            "combat_pile_card_selection",
            new[] { "select_discard_card_for_draw_top", "select_discard_card_for_hand", "select_draw_card_for_exhaust", "select_draw_card_for_soul_transform", "toggle_discard_card_for_dredge", "toggle_draw_card_for_charge" },
            "sts2-v0.109.0:Headbutt/Graveblast/Cleanse/Seance/Dredge/Charge.OnPlay+CardSelectCmd.FromCombatPile(exact-pile,source-specific-bounds)+NCombatPileCardSelectScreen+purpose-specific-intermediate-or-commit-witness",
            "source_discriminated_combat_pile_selection",
            new[] { "source_card", "purpose", "visible_pile_cards", "selection", "source_and_destination_piles", "destination_position", "overflow_destination", "controls" }),
        Entry(
            "combat_hand_card_selection",
            new[] { "select_combat_hand_card", "deselect_combat_hand_card", "confirm_combat_hand_selection", "close_combat_hand_peek" },
            "sts2-v0.109.0:NPlayerHand._prefs+_selectedCards+ActiveHolders+NSelectedHandCardContainer+NUpgradePreview+NConfirmButton exact-source revalidation",
            "purpose_specific_combat_hand_selection",
            new[] { "visible_hand", "selection", "bounds", "preview", "controls" }),
        Entry(
            "event_card_acquisition",
            new[] { "select_event_card_acquisition", "deselect_event_card_acquisition" },
            "sts2-v0.109.0:BrainLeech+RoomFullOfCheese+EventModel.SelectCardsToAddToDeckFromGrid+NSimpleCardSelectScreen+semantic-run-deck-witness",
            "source_bound_event_card_selection",
            new[] { "visible_card_choices", "selection", "selection_bounds" }),
        Entry(
            "generated_card_choice",
            new[] { "select_generated_run_card", "skip_generated_run_card_choice", "select_generated_combat_card", "skip_generated_combat_card_choice", "choose_quasar_card", "skip_quasar_choice", "choose_knowledge_demon_curse" },
            "sts2-v0.109.0:source-bound LeadPaperweight/native-generated-combat-card-potion/Splash/Quasar/KnowledgeDemon.ChooseCurse+NChooseACardSelectionScreen+purpose-specific exact post-state witnesses",
            "source_discriminated_generated_card_choice",
            new[] { "visible_card_choices", "choice_purpose", "source_kind", "destination", "selected_card_cost_policy", "overflow_destination", "skip_control" }),
        Entry(
            "card_bundle_selection",
            new[] { "preview_card_bundle", "confirm_card_bundle", "cancel_card_bundle_preview" },
            "sts2-v0.109.0:ScrollBoxes.AfterObtained+NChooseABundleSelectionScreen+exact-deck-post-state-canary",
            "source_bound_card_bundle",
            new[] { "visible_bundles", "bundle_cards", "selection", "preview", "controls" }),
        Entry(
            "card_reward_selection",
            new[] { "select_card_reward", "choose_card_reward_alternative" },
            "sts2-v0.109.0:NCardRewardSelectionScreen+NGridCardHolder+NCardRewardAlternativeButton+exact-source-canary",
            "card_reward_selection",
            new[] { "visible_card_rewards", "alternatives", "skip_or_close_controls" }),
        Entry(
            "reward_claim",
            new[] { "claim_reward", "discard_potion_for_reward", "proceed_rewards" },
            "sts2-v0.109.0:NRewardsScreen+NRewardButton+PotionReward+DiscardPotionGameAction+NProceedButton+exact-source-canary",
            "reward_claim_flow",
            new[] { "visible_rewards", "claimability", "potion_capacity", "proceed_control" }),
        Entry(
            "map_navigation",
            new[] { "choose_map_node" },
            "sts2-v0.109.0:NMapScreen+NMapPoint+RunState.Map+OnMapPointSelectedLocally+exact-source-canary",
            "map_navigation",
            new[] { "visible_map_topology", "current_node", "reachable_nodes", "node_types" }),
        Entry(
            "shop_inventory",
            new[]
            {
                "purchase_shop_card", "purchase_shop_relic", "purchase_shop_potion",
                "open_shop_card_removal", "close_shop_inventory"
            },
            "sts2-v0.109.0:MerchantInventory+typed MerchantEntry+NMerchantSlot+NMerchantInventory+semantic-category-witnesses",
            "merchant_inventory",
            new[] { "inventory", "prices", "sold_state", "gold", "potion_capacity", "removal_service" }),
        Entry(
            "shop_room",
            new[] { "open_shop_inventory", "proceed_shop" },
            "sts2-v0.109.0:NMerchantRoom+NMerchantButton+NProceedButton+exact-navigation-witnesses",
            "merchant_room_navigation",
            new[] { "merchant_control", "proceed_control" }),
        Entry(
            "treasure_room",
            new[]
            {
                Operation("open_treasure_chest", BridgeOperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_23_UPGRADE_TREASURE_CLOSEOUT_2026-07-17.md#source-audit"),
                Operation("choose_treasure_relic", BridgeOperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_23_UPGRADE_TREASURE_CLOSEOUT_2026-07-17.md#organic-canary"),
                Operation("skip_treasure_relic", BridgeOperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_23_UPGRADE_TREASURE_CLOSEOUT_2026-07-17.md#source-audit"),
                Operation("proceed_treasure_room", BridgeOperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_23_UPGRADE_TREASURE_CLOSEOUT_2026-07-17.md#organic-canary")
            },
            "sts2-v0.109.0:TreasureRoom+NTreasureRoom+NTreasureRoomRelicCollection+semantic-post-state-canary",
            "treasure_room_flow",
            new[] { "chest_state", "visible_relic_choices", "selection_controls", "proceed_control" }),
        Entry(
            "game_over",
            new[] { "advance_game_over_summary", "return_game_over" },
            "sts2-v0.109.0:NGameOverScreen+exact-current-controls+summary-and-main-menu-witnesses",
            "game_over_flow",
            new[] { "visible_summary_stage", "advance_control", "return_control" }),
        Entry(
            "character_select",
            new[]
            {
                "select_character", "decrease_ascension", "increase_ascension",
                "embark_standard_run", "back_from_character_select"
            },
            "sts2-v0.109.0:NCharacterSelectScreen+singleplayer-StartRunLobby+visible-controls+active-run-witness",
            "standard_run_character_select",
            new[] { "visible_characters", "selected_character", "ascension", "embark_and_back_controls" }),
        Entry(
            "main_menu",
            new[]
            {
                Operation("continue_run", BridgeOperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md#continue-organic-canary"),
                Operation("open_singleplayer", BridgeOperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md#source-audit")
            },
            "sts2-v0.109.0:NMainMenu+exact-root-controls+modal-exclusion+run-or-submenu-witness",
            "standard_run_root_navigation",
            new[] { "visible_root_choices", "enabled_state", "continue_run_summary", "unsupported_choice_boundaries" }),
        Entry(
            "singleplayer_menu",
            new[] { "open_standard_run_setup", "back_from_singleplayer_menu" },
            "sts2-v0.109.0:NSingleplayerSubmenu+exact-controls+submenu-stack-witness",
            "standard_run_singleplayer_navigation",
            new[] { "visible_run_mode_choices", "enabled_state", "descriptions", "unsupported_mode_boundaries" })
    };

    public static readonly IReadOnlyList<BridgeInspectionManifestEntry> InspectionEntries = new[]
    {
        new BridgeInspectionManifestEntry(
            BridgeInspectionBuilder.RunDeckKind,
            BridgeV2Contract.ProtocolVersion,
            "sts2-v0.109.0:NDeckViewScreen+Player.Deck.Cards+player-visible-sort-controls",
            "strict_bridge_v2_inspection_decoder",
            "normal_inspection",
            "unordered_multiset",
            new[] { "run_deck_cards", "card_semantics", "enchantments", "deck_count" },
            Array.Empty<string>(),
            BridgeOperationEvidenceStatus.OrganicQualified,
            new[] { ContractTest },
            new[] { CoverageDoc, "../archive/bridge-v2-previews/2026-07/RUN_DECK_PILE_INSPECTION_AUDIT_2026-07-16.md" }),
        new BridgeInspectionManifestEntry(
            BridgeInspectionBuilder.CombatPilesKind,
            BridgeV2Contract.ProtocolVersion,
            "sts2-v0.109.0:NDrawPileButton+NDiscardPileButton+NExhaustPileButton+NCardPileScreen+PlayerCombatState",
            "strict_bridge_v2_inspection_decoder",
            "normal_inspection",
            "unordered_multiset",
            new[] { "draw_pile_cards", "discard_pile_cards", "exhaust_pile_cards", "pile_counts" },
            new[] { "draw_pile_order" },
            BridgeOperationEvidenceStatus.SurfaceLevelOnly,
            new[] { ContractTest },
            new[] { CoverageDoc, "../archive/bridge-v2-previews/2026-07/RUN_DECK_PILE_INSPECTION_AUDIT_2026-07-16.md" }),
        new BridgeInspectionManifestEntry(
            BridgeInspectionBuilder.ShopCatalogKind,
            BridgeV2Contract.ProtocolVersion,
            "sts2-v0.109.0:MerchantRoom.GetLocalInventory+typed MerchantEntry+NMerchantSlot+player-openable inventory",
            "strict_bridge_v2_inspection_decoder",
            "normal_inspection",
            "fixed_ui_slots",
            new[] { "shop_cards", "shop_relics", "shop_potions", "card_removal", "prices", "availability" },
            Array.Empty<string>(),
            BridgeOperationEvidenceStatus.SourceAudited,
            new[] { ContractTest },
            new[] { CoverageDoc, "../archive/bridge-v2-previews/2026-07/PREVIEW_14_SHOP_SURFACE_AUDIT_2026-07-17.md" })
    };

    public static IReadOnlyList<string> ImplementedInspectionKinds =>
        InspectionEntries.Select(entry => entry.Kind).ToArray();

    /// <summary>
    /// Projects the exact-build surface tier into explicit operation scopes. The
    /// manifest is inventory only; this method is the one place where current
    /// compatibility may turn an implemented operation into advertised authority.
    /// </summary>
    public static CompatibilityAssessment WithExplicitActionScopes(
        CompatibilityAssessment compatibility)
    {
        if (!compatibility.ActionExecutionAllowed)
            return compatibility with { ActionPermissionScopes = Array.Empty<ActionPermissionScope>() };

        IReadOnlyList<ActionPermissionScope> scopes = Entries
            .SelectMany(entry => entry.Operations.Select(operation =>
            {
                string tier = compatibility.ActionExecutionSurfaceKinds.Contains(entry.Kind, StringComparer.Ordinal)
                    ? "qualified"
                    : compatibility.ActionCanarySurfaceKinds.Contains(entry.Kind, StringComparer.Ordinal)
                        ? "canary"
                        : string.Empty;
                return new ActionPermissionScope(entry.Kind, operation.Operation, tier);
            }))
            .Where(scope => scope.Tier.Length > 0)
            .OrderBy(scope => scope.SurfaceKind, StringComparer.Ordinal)
            .ThenBy(scope => scope.Operation, StringComparer.Ordinal)
            .ToArray();

        return compatibility with { ActionPermissionScopes = scopes };
    }

    public static IReadOnlyList<SurfaceCapability> Capabilities(CompatibilityAssessment compatibility) =>
        Entries.Select(entry => entry.ToCapability(
            BridgeSurfacePermission.SupportLevel(compatibility, entry.Kind),
            entry.Operations
                .Select(operation => operation.Operation)
                .Where(operation => BridgeSurfacePermission.IsActionPermitted(
                    compatibility,
                    entry.Kind,
                    operation))
                .ToArray())).ToArray();

    public static BridgeContractManifestEntry? Find(string surfaceKind) =>
        Entries.SingleOrDefault(entry => string.Equals(entry.Kind, surfaceKind, StringComparison.Ordinal));

    private static BridgeContractManifestEntry Entry(
        string kind,
        IReadOnlyList<string> operations,
        string sourceBindingId,
        string mechanism,
        IReadOnlyList<string> visibleFactGroups) => Entry(
            kind,
            operations.Select(operation => Operation(operation, BridgeOperationEvidenceStatus.SurfaceLevelOnly)).ToArray(),
            sourceBindingId,
            mechanism,
            visibleFactGroups);

    private static BridgeContractManifestEntry Entry(
        string kind,
        IReadOnlyList<BridgeOperationManifest> operations,
        string sourceBindingId,
        string mechanism,
        IReadOnlyList<string> visibleFactGroups) => new(
            kind,
            BridgeV2Contract.ProtocolVersion,
            mechanism,
            sourceBindingId,
            "strict_bridge_v2_decoder_normalizer",
            visibleFactGroups,
            operations,
            new[] { ContractTest },
            new[] { CoverageDoc });

    private static BridgeOperationManifest Operation(
        string operation,
        BridgeOperationEvidenceStatus evidenceStatus,
        params string[] evidenceIds) => new(operation, evidenceStatus, evidenceIds);
}
