using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.LiveHost;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.Authority;

namespace STS2_MCP.NativeUi;

internal enum OperationEvidenceStatus
{
    SurfaceLevelOnly,
    SourceAudited,
    OrganicCanaryExercised,
    OrganicQualified
}

internal sealed record NativeOperationManifestItem(
    string Operation,
    OperationEvidenceStatus EvidenceStatus,
    IReadOnlyList<string> EvidenceIds);

internal sealed record NativeOperationManifestEntry(
    string Kind,
    string Mechanism,
    string SourceBindingId,
    string ReSupport,
    IReadOnlyList<string> VisibleFactGroups,
    IReadOnlyList<NativeOperationManifestItem> Operations,
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

internal sealed record PlayerReadManifestEntry(
    string Kind,
    string SourceBindingId,
    string ReSupport,
    string VisibilityClass,
    string OrderingSemantics,
    IReadOnlyList<string> VisibleFactGroups,
    IReadOnlyList<string> HiddenByPolicy,
    OperationEvidenceStatus EvidenceStatus,
    IReadOnlyList<string> TestReferences,
    IReadOnlyList<string> DocumentationReferences);

/// <summary>
/// Non-authorizing inventory of implemented semantic contracts.
/// Presence here never grants observation, inspection, canary, or qualified authority.
/// Exact-environment permission remains exclusively owned by EnvironmentPermissionScopes.
/// </summary>
internal static class NativeOperationManifest
{
    internal const string Revision = "native-operation-manifest-1";

    private const string ContractTest = "tests/STS2_MCP.Tests/LiveHostContractTests.cs";
    private const string CoverageDoc = "docs/bridge-v2/PLAYER_VISIBLE_COVERAGE.md";
    private const string Preview80Closeout =
        "../docs/current/audits/WORKFLOW_C_PREVIEW80_STANDARD_RUN_BOUNDARY_CONTRACT_WAVE_CLOSEOUT_2026-07-30.md";
    private const string Preview81Closeout =
        "../docs/current/audits/WORKFLOW_C_PREVIEW81_SOURCE_CLOSED_SELECTOR_CONTRACT_WAVE_CLOSEOUT_2026-07-30.md";
    private const string Preview82Closeout =
        "../docs/current/audits/WORKFLOW_C_PREVIEW82_RUNTIME_RECOVERY_CLOSEOUT_2026-07-30.md";
    private const string ConnectorPreview6Closeout =
        "docs/connector-v3/PREVIEW_6_LUMINOUS_CHOIR_EVENT_REMOVAL_CUTOVER_2026-08-02.md";
    private const string ConnectorPreview7Closeout =
        "docs/connector-v3/PREVIEW_7_SOURCE_BOUND_SELECTOR_CUTOVER_2026-08-03.md";
    private const string ConnectorPreview8Closeout =
        "docs/connector-v3/PREVIEW_8_DIRECT_AUTHORITY_AND_SELECTOR_CUTOVER_2026-08-03.md";
    private const string ConnectorPreview9Closeout =
        "docs/connector-v3/PREVIEW_9_FINAL_SELECTOR_CUTOVER_2026-08-03.md";

    public static readonly IReadOnlyList<NativeOperationManifestEntry> Entries = new[]
    {
        Entry(
            "deck_enchant_selection",
            new[] { "toggle_card", "preview_selection", "confirm_selection", "cancel_preview", "close_selection" },
            "sts2-v0.110.1:deck_enchant_source_contracts_v1+CardSelectCmd.FromDeckForEnchantment+NDeckEnchantSelectScreen+exact-owner-source-binding+exact-card-enchantment-post-state-witness",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "selection", "preview", "controls" }),
        DirectEntry(
            "deck_removal_selection",
            new[]
            {
                Operation("toggle_deck_removal_card", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("preview_deck_removal", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("confirm_deck_removal", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("cancel_deck_removal_preview", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("cancel_deck_removal_selection", OperationEvidenceStatus.SourceAudited, Preview81Closeout)
            },
            "sts2-v0.109.0:MerchantCardRemovalEntry+CardSelectCmd.FromDeckForRemoval+NDeckCardSelectScreen+semantic-post-state-witness",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "selection", "service_cost", "preview", "controls" }),
        DirectEntry(
            "relic_deck_removal_selection",
            new[]
            {
                Operation("toggle_deck_removal_card", OperationEvidenceStatus.SourceAudited, ConnectorPreview7Closeout),
                Operation("preview_deck_removal", OperationEvidenceStatus.SourceAudited, ConnectorPreview7Closeout),
                Operation("confirm_deck_removal", OperationEvidenceStatus.SourceAudited, ConnectorPreview7Closeout),
                Operation("cancel_deck_removal_preview", OperationEvidenceStatus.SourceAudited, ConnectorPreview7Closeout)
            },
            "sts2-v0.109.0:PreciseScissors.AfterObtained+CardSelectCmd.FromDeckForRemoval+CardPileCmd.RemoveFromDeck+task-local-source-binding+exact-card-post-state-witness",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "selection", "preview", "controls" }),
        DirectEntry(
            "reward_deck_removal_selection",
            new[]
            {
                Operation("toggle_deck_removal_card", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("preview_deck_removal", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("confirm_deck_removal", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("cancel_deck_removal_preview", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("cancel_deck_removal_selection", OperationEvidenceStatus.SourceAudited, Preview81Closeout)
            },
            "sts2-v0.109.0:CardRemovalReward.OnSelect+RewardSynchronizer.DoUnsyncedCardRemoval+CardSelectCmd.FromDeckForRemoval+CardPileCmd.RemoveFromDeck+task-local-source-binding+exact-card-post-state-witness",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "selection", "preview", "cancel", "controls" }),
        DirectEntry(
            "event_deck_removal_selection",
            new[]
            {
                Operation("toggle_event_deck_removal_card", OperationEvidenceStatus.SourceAudited, ConnectorPreview6Closeout),
                Operation("cancel_event_deck_removal_preview", OperationEvidenceStatus.SourceAudited, ConnectorPreview6Closeout),
                Operation("confirm_event_deck_removal", OperationEvidenceStatus.SourceAudited, ConnectorPreview6Closeout)
            },
            "sts2-v0.110.1:LuminousChoir.ReachIntoTheFlesh+CardSelectCmd.FromDeckForRemoval(2)+CardPileCmd.RemoveFromDeck+AddCurseToDeck<SporeMind>+SetEventFinished+task-local-source-binding+exact-transaction-witness",
            "v3_native_source_bound_event_deck_removal",
            new[] { "visible_deck_cards", "selection", "preview", "expected_effects", "controls" },
            ConnectorPreview6Closeout),
        DirectEntry(
            "deck_upgrade_selection",
            new[]
            {
                Operation("toggle_deck_upgrade_card", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout),
                Operation("confirm_deck_upgrade", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout),
                Operation("cancel_deck_upgrade_preview", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout),
                Operation("cancel_deck_upgrade_selection", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout)
            },
            "sts2-v0.109.0:CardSelectCmd.FromDeckForUpgrade+NDeckUpgradeSelectScreen+semantic-post-state-canary",
            "purpose_specific_deck_selection",
            new[] { "visible_deck_cards", "upgrade_preview", "selection", "controls" },
            ConnectorPreview8Closeout),
        DirectEntry(
            "deck_transform_selection",
            new[]
            {
                Operation("toggle_deck_transform_card", OperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#organic-canary"),
                Operation("preview_deck_transform", OperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#source-audit"),
                Operation("confirm_deck_transform", OperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#organic-canary"),
                Operation("cancel_deck_transform_preview", OperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#source-audit"),
                Operation("cancel_deck_transform_selection", OperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#source-audit"),
                Operation("toggle_deck_transform_upgrade_view", OperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md#organic-canary")
            },
            "sts2-v0.109.1:source-discriminated(WhisperingHollow.Hug|NewLeaf.AfterObtained+task-local-binding)+CardSelectCmd.FromDeckForTransformation+NDeckTransformSelectScreen+exact-instance-post-state-witness",
            "purpose_specific_random_deck_transform",
            new[] { "visible_deck_cards", "selection", "random_uncommitted_preview", "upgrade_view", "controls" },
            ConnectorPreview9Closeout),
        DirectEntry(
            "wood_carvings_replacement_selection",
            new[]
            {
                Operation("select_wood_carvings_replacement_card", OperationEvidenceStatus.OrganicCanaryExercised,
                    "docs/bridge-v2/GATE1_WOOD_CARVINGS_CLOSEOUT_2026-07-22.md"),
                Operation("confirm_wood_carvings_replacement", OperationEvidenceStatus.OrganicCanaryExercised,
                    "docs/bridge-v2/GATE1_WOOD_CARVINGS_CLOSEOUT_2026-07-22.md"),
                Operation("cancel_wood_carvings_replacement_preview", OperationEvidenceStatus.OrganicCanaryExercised,
                    "docs/bridge-v2/GATE1_WOOD_CARVINGS_CLOSEOUT_2026-07-22.md")
            },
            "sts2-v0.109.0:WoodCarvings.Bird/Torus+CardSelectCmd.FromDeckGeneric+NDeckCardSelectScreen+exact-source-task-binding+deterministic-replacement-witness",
            "purpose_specific_deterministic_deck_replacement",
            new[] { "visible_deck_cards", "selection", "event_branch", "known_replacement", "preview", "controls" },
            ConnectorPreview9Closeout),
        Entry(
            "event_dialogue",
            new[]
            {
                Operation("advance_event_dialogue", OperationEvidenceStatus.SourceAudited, Preview81Closeout)
            },
            "sts2-v0.109.0:NAncientEventLayout+revealed-prefix-only+exact-dialogue-index-witness",
            "event_dialogue_progression",
            new[] { "revealed_dialogue_prefix", "speaker", "advance_control" }),
        DirectEntry(
            "rest_site",
            new[]
            {
                Operation("choose_rest_option", OperationEvidenceStatus.OrganicCanaryExercised,
                    ConnectorPreview8Closeout),
                Operation("proceed_rest_site", OperationEvidenceStatus.OrganicCanaryExercised,
                    ConnectorPreview8Closeout)
            },
            "sts2-v0.109.1:RestSiteRoom.Options+NRestSiteButton+HealRestSiteOption native base-heal minimum plus option-progression witness+Smith exact upgrade-child witness+NProceedButton+NMapScreen",
            "rest_site_semantic_options",
            new[] { "visible_rest_options", "availability", "effects", "proceed_control" },
            ConnectorPreview8Closeout),
        Entry(
            "event_option",
            new[]
            {
                Operation("choose_event_option", OperationEvidenceStatus.SourceAudited, Preview80Closeout),
                Operation("proceed_event", OperationEvidenceStatus.SourceAudited, Preview80Closeout)
            },
            "sts2-v0.109.0:NEventRoom+NEventOptionButton+EventOption+visible-hover-tips+semantic-transition-witness",
            "event_semantic_options",
            new[] { "visible_event_text", "options", "hover_tips", "proceed_control" }),
        Entry(
            "combat_turn",
            new[] { "play_card", "use_potion", "end_turn" },
            "sts2-v0.109.0:CombatManager+PlayerCombatState+CardModel+NPlayerHand+organic-action-lifecycles",
            "combat_turn_controls",
            new[] { "hand", "energy", "combatants", "intents", "potions", "end_turn_control" }),
        DirectEntry(
            "combat_pile_card_selection",
            new[]
            {
                Operation("toggle_combat_pile_card", OperationEvidenceStatus.SourceAudited,
                    ConnectorPreview9Closeout),
                Operation("confirm_combat_pile_selection", OperationEvidenceStatus.SourceAudited,
                    ConnectorPreview9Closeout)
            },
            "sts2-v0.109.0:qualified-card-task+CardSelectCmd.FromCombatPile(exact-pile,bounds,commit-mode)+NCombatPileCardSelectScreen+structural-mutation-contract+purpose-specific-witness",
            "source_qualified_structural_combat_pile_transaction",
            new[] { "source_card_provenance", "mutation_kind", "commit_mode", "visible_pile_cards", "selection", "source_and_destination_piles", "destination_position", "replacement", "overflow_destination", "controls" },
            ConnectorPreview9Closeout),
        DirectEntry(
            "combat_hand_card_selection",
            new[]
            {
                Operation("select_combat_hand_card", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout),
                Operation("deselect_combat_hand_card", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout),
                Operation("confirm_combat_hand_selection", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout),
                Operation("close_combat_hand_peek", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout)
            },
            "sts2-v0.109.0:NPlayerHand._prefs+_selectedCards+ActiveHolders+NSelectedHandCardContainer+NUpgradePreview+NConfirmButton exact-source revalidation",
            "purpose_specific_combat_hand_selection",
            new[] { "visible_hand", "selection", "bounds", "preview", "controls" },
            ConnectorPreview8Closeout),
        DirectEntry(
            "event_card_acquisition",
            new[]
            {
                Operation("select_event_card_acquisition", OperationEvidenceStatus.OrganicCanaryExercised,
                    ConnectorPreview8Closeout),
                Operation("deselect_event_card_acquisition", OperationEvidenceStatus.SourceAudited,
                    ConnectorPreview8Closeout)
            },
            "sts2-v0.109.0:BrainLeech+RoomFullOfCheese+EventModel.SelectCardsToAddToDeckFromGrid+NSimpleCardSelectScreen+semantic-run-deck-witness",
            "source_bound_event_card_selection",
            new[] { "visible_card_choices", "selection", "selection_bounds" },
            ConnectorPreview8Closeout),
        DirectEntry(
            "generated_card_choice",
            new[]
            {
                Operation("select_lead_paperweight_card", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout),
                Operation("skip_lead_paperweight_choice", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout),
                Operation("select_hefty_tablet_card", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout),
                Operation("skip_hefty_tablet_choice", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout),
                Operation("select_generated_combat_card", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout),
                Operation("skip_generated_combat_card_choice", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout),
                Operation("select_splash_generated_card", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout),
                Operation("skip_splash_generated_card_choice", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout),
                Operation("choose_quasar_card", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout),
                Operation("skip_quasar_choice", OperationEvidenceStatus.SourceAudited, ConnectorPreview8Closeout),
                Operation("choose_knowledge_demon_curse", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout)
            },
            "sts2-v0.109.1:source-bound LeadPaperweight/HeftyTablet/native-generated-combat-card-potion/Splash/Quasar/KnowledgeDemon.ChooseCurse+NChooseACardSelectionScreen+purpose-specific exact post-state witnesses",
            "source_discriminated_generated_card_choice",
            new[] { "visible_card_choices", "choice_purpose", "source_kind", "destination", "selected_card_cost_policy", "overflow_destination", "skip_control" },
            ConnectorPreview8Closeout),
        DirectEntry(
            "card_bundle_selection",
            new[]
            {
                Operation("preview_card_bundle", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("confirm_card_bundle", OperationEvidenceStatus.SourceAudited, Preview81Closeout),
                Operation("cancel_card_bundle_preview", OperationEvidenceStatus.SourceAudited, Preview81Closeout)
            },
            "sts2-v0.109.0:ScrollBoxes.AfterObtained+NChooseABundleSelectionScreen+exact-deck-post-state-canary",
            "source_bound_card_bundle",
            new[] { "visible_bundles", "bundle_cards", "selection", "preview", "controls" }),
        Entry(
            "card_reward_selection",
            new[]
            {
                Operation("select_card_reward", OperationEvidenceStatus.SourceAudited, Preview80Closeout),
                Operation(
                    "choose_card_reward_alternative",
                    OperationEvidenceStatus.SourceAudited,
                    Preview80Closeout)
            },
            "sts2-v0.109.0:NCardRewardSelectionScreen+NGridCardHolder+NCardRewardAlternativeButton+exact-source-canary",
            "card_reward_selection",
            new[] { "visible_card_rewards", "alternatives", "skip_or_close_controls" }),
        DirectEntry(
            "reward_claim",
            new[]
            {
                Operation("claim_reward", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout),
                Operation("discard_potion_for_reward", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout),
                Operation("proceed_rewards", OperationEvidenceStatus.OrganicCanaryExercised, ConnectorPreview8Closeout)
            },
            "sts2-v0.109.0:NRewardsScreen+NRewardButton+PotionReward+DiscardPotionGameAction+NProceedButton+exact-source-canary",
            "reward_claim_flow",
            new[] { "visible_rewards", "claimability", "potion_capacity", "proceed_control" },
            ConnectorPreview8Closeout),
        Entry(
            "map_navigation",
            new[]
            {
                Operation(
                    "choose_map_node",
                    OperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_35_MAP_CONTROLLER_GATE_CLOSEOUT_2026-07-18.md",
                    "docs/bridge-v2/PLAYER_VISIBLE_COVERAGE.md"),
                Operation(
                    "exit_map_annotation",
                    OperationEvidenceStatus.SourceAudited,
                    Preview82Closeout)
            },
            "sts2-v0.109.1:NMapScreen+NMapPoint+RunState.Map+OnMapPointSelectedLocally+NMapDrawingInput.StopDrawing+exact-source-canary",
            "map_navigation",
            new[] { "visible_map_topology", "current_node", "reachable_nodes", "node_types", "annotation_mode" }),
        Entry(
            "shop_inventory",
            new[]
            {
                "purchase_shop_card", "purchase_shop_relic", "purchase_shop_potion",
                "open_shop_card_removal", "close_shop_inventory"
            },
            "sts2-v0.109.1:MerchantInventory+typed MerchantEntry+NMerchantSlot+NMerchantInventory+semantic-category-witnesses+Kifuda-native-continuation-handoff",
            "merchant_inventory",
            new[] { "inventory", "prices", "sold_state", "gold", "potion_capacity", "removal_service" }),
        Entry(
            "shop_room",
            new[]
            {
                Operation(
                    "open_shop_inventory",
                    OperationEvidenceStatus.SourceAudited,
                    "LiveHost/ShopSurfaceReaders.cs#ShopRoomSurfaceReader.StartOpenInventory",
                    "tests/STS2_MCP.Tests/LiveHostContractTests.cs"),
                Operation(
                    "proceed_shop",
                    OperationEvidenceStatus.SurfaceLevelOnly)
            },
            "sts2-v0.109.0:NMerchantRoom+NMerchantButton+NProceedButton+exact-navigation-witnesses",
            "merchant_room_navigation",
            new[] { "merchant_control", "proceed_control" }),
        Entry(
            "treasure_room",
            new[]
            {
                Operation("open_treasure_chest", OperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_23_UPGRADE_TREASURE_CLOSEOUT_2026-07-17.md#source-audit"),
                Operation("choose_treasure_relic", OperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_23_UPGRADE_TREASURE_CLOSEOUT_2026-07-17.md#organic-canary"),
                Operation("skip_treasure_relic", OperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_23_UPGRADE_TREASURE_CLOSEOUT_2026-07-17.md#source-audit"),
                Operation("proceed_treasure_room", OperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_23_UPGRADE_TREASURE_CLOSEOUT_2026-07-17.md#organic-canary")
            },
            "sts2-v0.109.0:TreasureRoom+NTreasureRoom+NTreasureRoomRelicCollection+semantic-post-state-canary",
            "treasure_room_flow",
            new[] { "chest_state", "visible_relic_choices", "selection_controls", "proceed_control" }),
        Entry(
            "game_over",
            new[]
            {
                Operation(
                    "advance_game_over_summary",
                    OperationEvidenceStatus.SourceAudited,
                    Preview80Closeout),
                Operation("return_game_over", OperationEvidenceStatus.SourceAudited, Preview80Closeout)
            },
            "sts2-v0.109.0:NGameOverScreen+exact-current-controls+summary-and-main-menu-witnesses",
            "game_over_flow",
            new[] { "visible_summary_stage", "advance_control", "return_control" }),
        Entry(
            "character_select",
            new[]
            {
                Operation("select_character", OperationEvidenceStatus.SourceAudited, Preview80Closeout),
                Operation("decrease_ascension", OperationEvidenceStatus.SourceAudited, Preview80Closeout),
                Operation("increase_ascension", OperationEvidenceStatus.SourceAudited, Preview80Closeout),
                Operation("embark_standard_run", OperationEvidenceStatus.SourceAudited, Preview80Closeout),
                Operation(
                    "back_from_character_select",
                    OperationEvidenceStatus.SourceAudited,
                    Preview80Closeout)
            },
            "sts2-v0.109.0:NCharacterSelectScreen+singleplayer-StartRunLobby+visible-controls+active-run-witness",
            "standard_run_character_select",
            new[] { "visible_characters", "selected_character", "ascension", "embark_and_back_controls" }),
        Entry(
            "main_menu",
            new[]
            {
                Operation("continue_run", OperationEvidenceStatus.OrganicCanaryExercised,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md#continue-organic-canary"),
                Operation("open_singleplayer", OperationEvidenceStatus.SourceAudited,
                    "../archive/bridge-v2-previews/2026-07/PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md#source-audit")
            },
            "sts2-v0.109.0:NMainMenu+exact-root-controls+modal-exclusion+run-or-submenu-witness",
            "standard_run_root_navigation",
            new[] { "visible_root_choices", "enabled_state", "continue_run_summary", "unsupported_choice_boundaries" }),
        Entry(
            "singleplayer_menu",
            new[]
            {
                Operation(
                    "open_standard_run_setup",
                    OperationEvidenceStatus.SourceAudited,
                    Preview80Closeout),
                Operation(
                    "back_from_singleplayer_menu",
                    OperationEvidenceStatus.SourceAudited,
                    Preview80Closeout)
            },
            "sts2-v0.109.0:NSingleplayerSubmenu+exact-controls+submenu-stack-witness",
            "standard_run_singleplayer_navigation",
            new[] { "visible_run_mode_choices", "enabled_state", "descriptions", "unsupported_mode_boundaries" })
    };

    public static readonly IReadOnlyList<PlayerReadManifestEntry> InspectionEntries = new[]
    {
        new PlayerReadManifestEntry(
            PlayerVisibleReadBuilder.RunDeckKind,
            "sts2-v0.109.0:NDeckViewScreen+Player.Deck.Cards+player-visible-sort-controls",
            "strict_human_environment_read_decoder",
            "normal_inspection",
            "unordered_multiset",
            new[] { "run_deck_cards", "card_semantics", "enchantments", "deck_count" },
            Array.Empty<string>(),
            OperationEvidenceStatus.OrganicQualified,
            new[] { ContractTest },
            new[] { CoverageDoc, "../archive/bridge-v2-previews/2026-07/RUN_DECK_PILE_INSPECTION_AUDIT_2026-07-16.md" }),
        new PlayerReadManifestEntry(
            PlayerVisibleReadBuilder.CombatPilesKind,
            "sts2-v0.109.0:NDrawPileButton+NDiscardPileButton+NExhaustPileButton+NCardPileScreen+PlayerCombatState",
            "strict_human_environment_read_decoder",
            "normal_inspection",
            "unordered_multiset",
            new[] { "draw_pile_cards", "discard_pile_cards", "exhaust_pile_cards", "pile_counts" },
            new[] { "draw_pile_order" },
            OperationEvidenceStatus.SurfaceLevelOnly,
            new[] { ContractTest },
            new[] { CoverageDoc, "../archive/bridge-v2-previews/2026-07/RUN_DECK_PILE_INSPECTION_AUDIT_2026-07-16.md" }),
        new PlayerReadManifestEntry(
            PlayerVisibleReadBuilder.ShopCatalogKind,
            "sts2-v0.109.0:MerchantRoom.GetLocalInventory+typed MerchantEntry+NMerchantSlot+player-openable inventory",
            "strict_human_environment_read_decoder",
            "normal_inspection",
            "fixed_ui_slots",
            new[] { "shop_cards", "shop_relics", "shop_potions", "card_removal", "prices", "availability" },
            Array.Empty<string>(),
            OperationEvidenceStatus.SourceAudited,
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
                return new ActionPermissionScope(entry.Kind, operation.Operation, tier)
                {
                    OperationFingerprint =
                        EnvironmentPermissionManager.OperationFingerprint(
                            entry.Kind,
                            operation.Operation)
                };
            }))
            .Where(scope => scope.Tier.Length > 0)
            .OrderBy(scope => scope.SurfaceKind, StringComparer.Ordinal)
            .ThenBy(scope => scope.Operation, StringComparer.Ordinal)
            .ToArray();

        return compatibility with { ActionPermissionScopes = scopes };
    }

    public static IReadOnlyList<SurfaceCapability> Capabilities(CompatibilityAssessment compatibility) =>
        Entries.Select(entry => entry.ToCapability(
            EnvironmentPermissionScopes.SupportLevel(compatibility, entry.Kind),
            entry.Operations
                .Select(operation => operation.Operation)
                .Where(operation => EnvironmentPermissionScopes.IsActionPermitted(
                    compatibility,
                    entry.Kind,
                    operation))
                .ToArray())).ToArray();

    public static NativeOperationManifestEntry? Find(string surfaceKind) =>
        Entries.SingleOrDefault(entry => string.Equals(entry.Kind, surfaceKind, StringComparison.Ordinal));

    private static NativeOperationManifestEntry Entry(
        string kind,
        IReadOnlyList<string> operations,
        string sourceBindingId,
        string mechanism,
        IReadOnlyList<string> visibleFactGroups) => Entry(
            kind,
            operations.Select(operation => Operation(operation, OperationEvidenceStatus.SurfaceLevelOnly)).ToArray(),
            sourceBindingId,
            mechanism,
            visibleFactGroups);

    private static NativeOperationManifestEntry Entry(
        string kind,
        IReadOnlyList<NativeOperationManifestItem> operations,
        string sourceBindingId,
        string mechanism,
        IReadOnlyList<string> visibleFactGroups) => new(
            kind,
            mechanism,
            sourceBindingId,
            "strict_human_environment_bound_action_projection",
            visibleFactGroups,
            operations,
            new[] { ContractTest },
            new[] { CoverageDoc });

    private static NativeOperationManifestItem Operation(
        string operation,
        OperationEvidenceStatus evidenceStatus,
        params string[] evidenceIds) => new(operation, evidenceStatus, evidenceIds);

    private static NativeOperationManifestEntry DirectEntry(
        string kind,
        IReadOnlyList<NativeOperationManifestItem> operations,
        string sourceBindingId,
        string mechanism,
        IReadOnlyList<string> visibleFactGroups,
        string documentationReference = ConnectorPreview7Closeout) => new(
        kind,
        mechanism,
        sourceBindingId,
        "strict_human_environment_bound_action_projection",
        visibleFactGroups,
        operations,
        new[] { "tests/STS2_MCP.Tests/HumanEnvironmentContractTests.cs" },
        new[] { documentationReference });
}
