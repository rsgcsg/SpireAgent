using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace STS2_MCP.BridgeV2.Protocol;

public static class BridgeV2Contract
{
    public const string ProtocolVersion = "2.0-preview.18";
    public const string ObservationPolicyId = "player_visible_ui_v1";
}

public sealed record BridgeServerIdentity(
    string Id,
    string Name,
    string Version,
    string UpstreamCommit);

public sealed record CompatibilityAssessment(
    string Status,
    IReadOnlyList<string> TestedGameVersions,
    IReadOnlyList<string> TestedBuildFingerprints,
    bool ActionExecutionAllowed,
    bool StateObservationAllowed,
    bool InspectionAllowed,
    IReadOnlyList<string> ActionExecutionSurfaceKinds,
    IReadOnlyList<string> InspectionAllowedKinds,
    IReadOnlyList<string> ObservationOnlySurfaceKinds,
    IReadOnlyList<string> ObservationCandidateBuildFingerprints,
    string Detail);

public sealed record GameBuildIdentity(
    string? Version,
    string? Commit,
    string? Branch,
    int? MainAssemblyHash,
    CompatibilityAssessment Compatibility);

public sealed record ObservationPolicyInfo(
    string Id,
    string Scope,
    bool IncludesHiddenInformation,
    string UnknownFieldBehavior);

public sealed record SurfaceCapability(
    string Kind,
    string Support,
    IReadOnlyList<string> Operations,
    string Evidence);

public sealed record CommandContractCapability(
    bool OpaqueActionsOnly,
    bool StateBound,
    bool IdempotentRequestIds,
    IReadOnlyList<string> LifecycleStates,
    int OutcomeTimeoutMs);

public sealed record InspectionContractCapability(
    string Status,
    bool StateBound,
    bool ArbitraryQueriesAllowed,
    bool EntersCommandLedger,
    IReadOnlyList<string> VisibilityClasses,
    IReadOnlyList<string> OrderingSemantics,
    IReadOnlyList<string> ImplementedKinds);

public sealed record BridgeDiagnostic(
    string Code,
    string Severity,
    string Category,
    string Effect,
    string Recoverability,
    string? Path = null,
    string? VisibilityClass = null,
    bool? RequiredForAction = null,
    string? SafeDetail = null);

public sealed record BridgeCapabilitiesResponse(
    string ProtocolVersion,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    IReadOnlyList<SurfaceCapability> Surfaces,
    CommandContractCapability Commands,
    InspectionContractCapability Inspections,
    IReadOnlyList<BridgeDiagnostic> Diagnostics,
    IReadOnlyList<string> Warnings);

public sealed record InspectionCompleteness(
    string PlayerVisibleSemantics,
    IReadOnlyList<string> Sources,
    IReadOnlyList<string> Missing);

[JsonConverter(typeof(BridgeInspectionContentJsonConverter))]
public interface IBridgeInspectionContent
{
    string Kind { get; }
}

public sealed class BridgeInspectionContentJsonConverter : JsonConverter<IBridgeInspectionContent>
{
    public override IBridgeInspectionContent Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options) =>
        throw new JsonException("Bridge inspection content is response-only.");

    public override void Write(
        Utf8JsonWriter writer,
        IBridgeInspectionContent value,
        JsonSerializerOptions options) =>
        JsonSerializer.Serialize(writer, value, value.GetType(), options);
}

public sealed record RunDeckInspectionContent(
    string Kind,
    int CardCount,
    IReadOnlyList<VisibleCard> Cards) : IBridgeInspectionContent;

public sealed record CombatPileInspectionZone(
    string Zone,
    int CardCount,
    string OrderingSemantics,
    IReadOnlyList<VisibleCard> Cards);

public sealed record CombatPilesInspectionContent(
    string Kind,
    IReadOnlyList<CombatPileInspectionZone> Zones) : IBridgeInspectionContent;

public sealed record BridgeInspectionResponse(
    string ProtocolVersion,
    string InspectionId,
    string ExpectedStateId,
    string ObservedStateId,
    DateTimeOffset ObservedAt,
    string Kind,
    string VisibilityClass,
    string OrderingSemantics,
    IBridgeInspectionContent Content,
    InspectionCompleteness Completeness,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    IReadOnlyList<BridgeDiagnostic> Diagnostics);

public sealed record StateCompleteness(
    string PlayerVisibleSemantics,
    string LegalActions,
    IReadOnlyList<string> Sources,
    IReadOnlyList<string> Missing);

public sealed record LegalAction(
    string ActionId,
    string StateId,
    string Kind,
    string Category,
    string Label,
    string Authority,
    string EvidenceCode,
    IReadOnlyList<ActionEntityBinding> EntityBindings);

public sealed record ActionEntityBinding(
    string Role,
    string EntityId);

public sealed record VisibleEnchantment(
    string DefinitionId,
    string? Name,
    string? Description,
    int Amount,
    string ObservationSource);

public sealed record VisibleCard(
    string EntityId,
    string DefinitionId,
    string? Name,
    string Type,
    string Cost,
    string? StarCost,
    string? Description,
    string Rarity,
    bool IsUpgraded,
    bool IsSelected,
    VisibleEnchantment? ExistingEnchantment,
    string? TargetType = null,
    bool? CanPlay = null,
    string? UnplayableReason = null);

public sealed record VisibleStatus(
    string DefinitionId,
    string? Name,
    decimal Amount,
    string Type,
    string? Description);

public sealed record VisibleIntent(
    string Type,
    string? Label,
    string? Title,
    string? Description);

public sealed record VisibleEnemy(
    string EntityId,
    uint? CombatId,
    string DefinitionId,
    string? Name,
    decimal Hp,
    decimal MaxHp,
    decimal Block,
    IReadOnlyList<VisibleStatus> Statuses,
    IReadOnlyList<VisibleIntent> Intents);

public sealed record VisibleCombatPlayer(
    string EntityId,
    string? Character,
    decimal Hp,
    decimal MaxHp,
    decimal Block,
    int Energy,
    int MaxEnergy,
    int? Stars,
    int Gold,
    IReadOnlyList<VisibleCard> Hand,
    int DrawPileCount,
    int DiscardPileCount,
    int ExhaustPileCount,
    IReadOnlyList<VisibleStatus> Statuses,
    IReadOnlyList<VisibleRelic> Relics,
    IReadOnlyList<VisibleCombatPotion> Potions,
    int MaxPotionSlots,
    IReadOnlyList<VisibleOrb> Orbs,
    int? OrbSlots);

public sealed record VisibleCombatPotion(
    string EntityId,
    string DefinitionId,
    string? Name,
    string? Description,
    int Slot,
    string TargetType,
    bool CanUse,
    bool Automatic);

public sealed record VisibleRelic(
    string EntityId,
    string DefinitionId,
    string? Name,
    string? Description,
    decimal? Counter);

public sealed record VisibleOrb(
    string EntityId,
    string DefinitionId,
    string? Name,
    string? Description,
    decimal PassiveValue,
    decimal EvokeValue);

public sealed record VisibleEventOption(
    string EntityId,
    int Index,
    string? Title,
    string? Description,
    bool IsLocked,
    bool IsProceed,
    bool WasChosen,
    string? RelicName,
    string? RelicDescription);

[JsonConverter(typeof(BridgeContextJsonConverter))]
public interface IBridgeContext
{
    string Kind { get; }
}

public sealed class BridgeContextJsonConverter : JsonConverter<IBridgeContext>
{
    public override IBridgeContext Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options) =>
        throw new JsonException("Bridge contexts are response-only protocol objects.");

    public override void Write(
        Utf8JsonWriter writer,
        IBridgeContext value,
        JsonSerializerOptions options) =>
        JsonSerializer.Serialize(writer, value, value.GetType(), options);
}

public sealed record EventBridgeContext(
    string Kind,
    string EventId,
    string? Name,
    bool Ancient,
    bool InDialogue,
    string? Body) : IBridgeContext;

public sealed record CombatBridgeContext(
    string Kind,
    string EncounterType,
    int Round,
    string TurnOwner,
    bool IsPlayPhase,
    VisibleCombatPlayer Player,
    IReadOnlyList<VisibleEnemy> Enemies) : IBridgeContext;

public sealed record RewardFlowBridgeContext(
    string Kind,
    string RewardKind) : IBridgeContext;

public sealed record RestBridgeContext(
    string Kind) : IBridgeContext;

public sealed record VisibleOwnedPotion(
    string EntityId,
    string DefinitionId,
    string? Name,
    string? Description,
    int Slot);

public sealed record ShopBridgeContext(
    string Kind,
    int Gold,
    int MaxPotionSlots,
    IReadOnlyList<VisibleOwnedPotion> Potions) : IBridgeContext;

public sealed record VisibleMapCoordinate(
    int Col,
    int Row,
    string? PointType = null);

public sealed record VisibleMapNode(
    string EntityId,
    int Col,
    int Row,
    string PointType,
    string State,
    IReadOnlyList<VisibleMapCoordinate> Children);

public sealed record MapBridgeContext(
    string Kind,
    int ActIndex,
    VisibleMapCoordinate? CurrentPosition,
    IReadOnlyList<VisibleMapCoordinate> Visited,
    IReadOnlyList<VisibleMapNode> Nodes) : IBridgeContext;

public sealed record UnknownBridgeContext(
    string Kind,
    string SourceType,
    string Reason) : IBridgeContext;

[JsonConverter(typeof(BridgeSurfaceJsonConverter))]
public interface IBridgeSurface
{
    string Kind { get; }
}

public sealed class BridgeSurfaceJsonConverter : JsonConverter<IBridgeSurface>
{
    public override IBridgeSurface Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options) =>
        throw new JsonException("Bridge surfaces are response-only protocol objects.");

    public override void Write(
        Utf8JsonWriter writer,
        IBridgeSurface value,
        JsonSerializerOptions options) =>
        JsonSerializer.Serialize(writer, value, value.GetType(), options);
}

public sealed record DeckEnchantSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string? Prompt,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    bool Cancelable,
    VisibleEnchantment Enchantment,
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

public sealed record EventOptionSurface(
    string Kind,
    string ScreenEntityId,
    IReadOnlyList<VisibleEventOption> Options) : IBridgeSurface;

public sealed record VisibleDialogueLine(
    string EntityId,
    int Index,
    string Text,
    string Speaker,
    bool IsCurrent);

public sealed record EventDialogueSurface(
    string Kind,
    string ScreenEntityId,
    int CurrentLineIndex,
    IReadOnlyList<VisibleDialogueLine> RevealedLines,
    string AdvanceLabel) : IBridgeSurface;

public sealed record VisibleRestOption(
    string EntityId,
    int Index,
    string OptionId,
    string? Name,
    string? Description,
    bool Enabled);

public sealed record RestSiteSurface(
    string Kind,
    string ScreenEntityId,
    IReadOnlyList<VisibleRestOption> Options,
    bool CanProceed) : IBridgeSurface;

public sealed record VisibleShopCardOffer(
    string EntityId,
    string SlotEntityId,
    int InventoryIndex,
    int Price,
    bool Stocked,
    bool Visible,
    bool Affordable,
    bool CanPurchase,
    string? BlockedReason,
    bool OnSale,
    VisibleCard? Card);

public sealed record VisibleShopRelicOffer(
    string EntityId,
    string SlotEntityId,
    int InventoryIndex,
    int Price,
    bool Stocked,
    bool Visible,
    bool Affordable,
    bool CanPurchase,
    string? BlockedReason,
    VisibleRelic? Relic);

public sealed record VisibleShopPotionOffer(
    string EntityId,
    string SlotEntityId,
    int InventoryIndex,
    int Price,
    bool Stocked,
    bool Visible,
    bool Affordable,
    bool CanPurchase,
    string? BlockedReason,
    string? DefinitionId,
    string? Name,
    string? Description,
    string? Rarity);

public sealed record VisibleShopCardRemovalOffer(
    string EntityId,
    string SlotEntityId,
    int InventoryIndex,
    int Price,
    int NextPriceIncrease,
    bool Stocked,
    bool Visible,
    bool Affordable,
    bool CanPurchase,
    string? BlockedReason);

public sealed record ShopInventorySurface(
    string Kind,
    string ScreenEntityId,
    IReadOnlyList<VisibleShopCardOffer> Cards,
    IReadOnlyList<VisibleShopRelicOffer> Relics,
    IReadOnlyList<VisibleShopPotionOffer> Potions,
    VisibleShopCardRemovalOffer? CardRemoval,
    bool CanClose) : IBridgeSurface;

public sealed record ShopRoomSurface(
    string Kind,
    string RoomEntityId,
    bool CanOpenInventory,
    bool CanProceed) : IBridgeSurface;

/// <summary>
/// Exact merchant card-removal child surface. This intentionally does not
/// generalize other deck selectors whose effects and preview semantics differ.
/// </summary>
public sealed record DeckRemovalSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string Prompt,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    bool Cancelable,
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

public sealed record CombatTurnSurface(
    string Kind,
    string RoomEntityId,
    bool CanEndTurn) : IBridgeSurface;

public sealed record CombatPileCardSelectionSurface(
    string Kind,
    string ScreenEntityId,
    string Prompt,
    string PileType,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    bool RequireManualConfirmation,
    bool Cancelable,
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

public sealed record CombatHandCardSelectionSurface(
    string Kind,
    string HandEntityId,
    string Prompt,
    string SelectionMode,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    bool RequireManualConfirmation,
    bool IsPeeking,
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

public sealed record VisibleCardRewardAlternative(
    string EntityId,
    int Index,
    string Label,
    bool Enabled);

/// <summary>
/// A player-visible room reward. The bridge deliberately exposes only the
/// semantic kind and the text already rendered by the reward button.
/// </summary>
public sealed record VisibleReward(
    string EntityId,
    string Kind,
    string Label,
    string? Description,
    bool Enabled);

public sealed record CardRewardSelectionSurface(
    string Kind,
    string ScreenEntityId,
    IReadOnlyList<VisibleCard> Cards,
    IReadOnlyList<VisibleCardRewardAlternative> Alternatives) : IBridgeSurface;

public sealed record GeneratedCardChoiceSurface(
    string Kind,
    string ScreenEntityId,
    string? Prompt,
    bool CanSkip,
    bool IsPeeking,
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

public sealed record VisibleCardBundle(
    string EntityId,
    IReadOnlyList<VisibleCard> Cards);

public sealed record CardBundleSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string? Prompt,
    string? SelectedBundleEntityId,
    IReadOnlyList<VisibleCardBundle> Bundles) : IBridgeSurface;

public sealed record RewardClaimSurface(
    string Kind,
    string ScreenEntityId,
    IReadOnlyList<VisibleReward> Rewards,
    bool PotionSlotsFull,
    IReadOnlyList<VisibleCombatPotion> DiscardablePotions,
    bool CanProceed,
    bool ProceedSkipsRemainingRewards) : IBridgeSurface;

public sealed record VisibleMapChoice(
    string EntityId,
    int Col,
    int Row,
    string PointType);

public sealed record MapNavigationSurface(
    string Kind,
    string ScreenEntityId,
    bool TravelEnabled,
    bool Traveling,
    string DrawingMode,
    IReadOnlyList<VisibleMapChoice> NextOptions) : IBridgeSurface;

public sealed record UnsupportedSurface(
    string Kind,
    string SourceType,
    string Reason) : IBridgeSurface;

public sealed record BridgeStateEnvelope(
    string ProtocolVersion,
    string StateId,
    long StateSequence,
    DateTimeOffset ObservedAt,
    string Readiness,
    IBridgeContext Context,
    IBridgeSurface Surface,
    IReadOnlyList<LegalAction> LegalActions,
    StateCompleteness Completeness,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    IReadOnlyList<BridgeDiagnostic> Diagnostics,
    IReadOnlyList<string> Warnings)
{
    // Retain the preview.1 wire field while making surface.kind the sole source.
    public string SurfaceKind => Surface.Kind;
}

public sealed record BridgeCommandRequest(
    string? RequestId,
    string? ExpectedStateId,
    string? ActionId);

public sealed record BridgeCommandEvent(
    string Status,
    DateTimeOffset At,
    string? Evidence,
    string? ErrorCode,
    string? Detail);

public sealed record BridgeCommandResponse(
    string RequestId,
    string ExpectedStateId,
    string ActionId,
    string Status,
    string Outcome,
    string? ObservedStateId,
    IReadOnlyList<BridgeCommandEvent> Events);
