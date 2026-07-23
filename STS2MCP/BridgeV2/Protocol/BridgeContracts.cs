using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace STS2_MCP.BridgeV2.Protocol;

public static class BridgeV2Contract
{
    public const string ProtocolVersion = "2.0-preview.59";
    public const string ObservationPolicyId = "player_visible_ui_v1";
}

public sealed record BridgeServerIdentity(
    string Id,
    string Name,
    string Version,
    string UpstreamCommit,
    string ModuleVersionId,
    string RuntimeInstanceId)
{
    // The file digest identifies the loaded Gateway artifact without exposing its path.
    public string AssemblyFileSha256 { get; init; } = string.Empty;
}

public sealed record ActionPermissionScope(
    string SurfaceKind,
    string Operation,
    string Tier);

public sealed record CompatibilityAssessment(
    string Status,
    IReadOnlyList<string> TestedGameVersions,
    IReadOnlyList<string> TestedBuildFingerprints,
    bool ActionExecutionAllowed,
    bool StateObservationAllowed,
    bool InspectionAllowed,
    IReadOnlyList<string> ActionExecutionSurfaceKinds,
    IReadOnlyList<string> ActionCanarySurfaceKinds,
    IReadOnlyList<string> InspectionAllowedKinds,
    IReadOnlyList<string> InspectionCanaryKinds,
    IReadOnlyList<string> ObservationOnlySurfaceKinds,
    IReadOnlyList<string> ObservationCandidateBuildFingerprints,
    string Detail)
{
    // Exact operation scopes are the sole action-authority source for strict clients.
    public IReadOnlyList<ActionPermissionScope> ActionPermissionScopes { get; init; } =
        Array.Empty<ActionPermissionScope>();
}

public sealed record GameBuildIdentity(
    string? Version,
    string? Commit,
    string? Branch,
    int? MainAssemblyHash,
    CompatibilityAssessment Compatibility,
    ModsetIdentity? Modset = null)
{
    // release_info.json is useful provenance, but only the runtime-computed
    // main assembly hash participates in exact permission decisions.
    public int? ReleaseDeclaredMainAssemblyHash { get; init; }
}

public sealed record LoadedModAssemblyIdentity(
    string Name,
    string? Version,
    string ModuleVersionId);

public sealed record LoadedModIdentity(
    string Id,
    string? Version,
    string Source,
    string LoadState,
    bool AffectsGameplay,
    string? WorkshopId,
    IReadOnlyList<LoadedModAssemblyIdentity> Assemblies);

public sealed record ModsetIdentity(
    string Status,
    string Fingerprint,
    string FingerprintScope,
    bool ExactPermissionEligible,
    IReadOnlyList<LoadedModIdentity> Mods,
    string Detail);

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

public sealed record BridgeInspectionCatalogEntry(
    string Kind,
    string Scope,
    string Availability,
    string VisibilityBasis,
    bool StateBound,
    bool CreatesActionAuthority,
    string OrderingSemantics,
    string EstimatedCost,
    IReadOnlyList<string> RecommendedFor,
    IReadOnlyList<string> HiddenByPolicy);

public sealed record BridgeVisibilityState(
    string ProfileId,
    string CoreStatus,
    string PlayerVisibleClosureStatus,
    IReadOnlyList<string> AvailableInspections,
    IReadOnlyList<string> LinkedDetailKinds,
    IReadOnlyList<string> HiddenByPolicy,
    IReadOnlyList<string> Missing,
    string UnknownCriticalFieldBehavior);

public sealed record BridgeContractOperationShadow(
    string Operation,
    string EvidenceStatus,
    bool Published);

public sealed record BridgeContractInstanceShadow(
    string Status,
    string InstanceId,
    string SurfaceKind,
    string? SemanticContractId,
    string? DeclaredBinding,
    IReadOnlyList<BridgeContractOperationShadow> Operations,
    string CurrentAuthorityTier,
    string CurrentAuthorityBasis,
    bool Authorizing,
    IReadOnlyList<string> Limitations);

public sealed record SharedStateContractCapability(
    string Status,
    string Scope,
    bool CreatesActionAuthority,
    bool IncludedInStateIdentity,
    IReadOnlyList<string> IncludedFacts,
    IReadOnlyList<string> ExcludedFacts);

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
    SharedStateContractCapability SharedState,
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

/// <summary>
/// Read-only projection of the current merchant catalog. The entries describe
/// facts a player can inspect by opening the merchant UI; they do not publish
/// purchase authority when the inventory is closed.
/// </summary>
public sealed record ShopCatalogInspectionContent(
    string Kind,
    string AccessState,
    IReadOnlyList<VisibleShopCardOffer> Cards,
    IReadOnlyList<VisibleShopRelicOffer> Relics,
    IReadOnlyList<VisibleShopPotionOffer> Potions,
    VisibleShopCardRemovalOffer? CardRemoval) : IBridgeInspectionContent;

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

public sealed record BridgeObservationBundleInspectionRequest(string? Kind);

public sealed record BridgeObservationBundleRequest(
    string? ExpectedStateId,
    IReadOnlyList<BridgeObservationBundleInspectionRequest>? Inspections);

public sealed record BridgeObservationBundleResponse(
    string ProtocolVersion,
    string ObservationId,
    bool Coherent,
    BridgeStateEnvelope State,
    IReadOnlyDictionary<string, BridgeInspectionResponse> Inspections,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    IReadOnlyList<BridgeDiagnostic> Diagnostics);

public sealed record StateCompleteness(
    string PlayerVisibleSemantics,
    string LegalActions,
    IReadOnlyList<string> Sources,
    IReadOnlyList<string> Missing);

public sealed record AuthorityHandoff(
    string Status,
    string? SurfaceKind,
    string Reason);

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
    string PlayerEntityId,
    decimal Block,
    int Energy,
    int MaxEnergy,
    int? Stars,
    IReadOnlyList<VisibleCard> Hand,
    int DrawPileCount,
    int DiscardPileCount,
    int ExhaustPileCount,
    IReadOnlyList<VisibleStatus> Statuses,
    IReadOnlyList<VisibleCombatCompanion> Companions,
    IReadOnlyList<VisibleCombatPotionState> PotionStates,
    IReadOnlyList<VisibleOrb> Orbs,
    int? OrbSlots);

public sealed record VisibleCombatCompanion(
    string EntityId,
    string DefinitionId,
    string? Name,
    bool IsAlive,
    bool HealthBarVisible,
    decimal? Hp,
    decimal? MaxHp,
    decimal Block,
    IReadOnlyList<VisibleStatus> Statuses);

public sealed record VisibleCombatPotionState(
    string EntityId,
    string TargetType,
    bool CanUse,
    bool Automatic);

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
    decimal? Counter,
    IReadOnlyList<VisibleKeyword> Keywords,
    IReadOnlyList<VisibleCard> CardPreviews);

public sealed record VisibleKeyword(
    string Name,
    string? Description);

public sealed record VisibleBoss(
    string DefinitionId,
    string? Name,
    int Order);

public sealed record VisibleRunModifier(
    string DefinitionId,
    string? Name,
    string? Description,
    IReadOnlyList<VisibleKeyword> Keywords,
    IReadOnlyList<VisibleCard> CardPreviews);

public sealed record VisibleRunHud(
    int Act,
    string ActDefinitionId,
    string? ActName,
    int Floor,
    int Ascension,
    IReadOnlyList<VisibleBoss> Bosses,
    IReadOnlyList<VisibleRunModifier> Modifiers);

public sealed record VisiblePlayerHud(
    string EntityId,
    string CharacterDefinitionId,
    string? CharacterName,
    decimal Hp,
    decimal MaxHp,
    int Gold,
    IReadOnlyList<VisibleRelic> Relics,
    IReadOnlyList<VisibleOwnedPotion> Potions,
    int MaxPotionSlots);

public sealed record SharedStateCompleteness(
    string PlayerVisibleSemantics,
    IReadOnlyList<string> Sources,
    IReadOnlyList<string> Missing);

/// <summary>
/// Persistent facts rendered by the normal single-player run HUD. This is
/// read-only state, not a Surface, Inspection, or source of action authority.
/// </summary>
public sealed record SharedVisibleState(
    string Scope,
    VisibleRunHud Run,
    VisiblePlayerHud Player,
    SharedStateCompleteness Completeness);

/// <summary>
/// A relic currently rendered by the treasure-room holder. Rarity and keyword
/// hover tips belong to this surface because the normal UI exposes both.
/// </summary>
public sealed record VisibleTreasureRelic(
    string EntityId,
    string DefinitionId,
    string? Name,
    string? Description,
    string Rarity,
    IReadOnlyList<VisibleKeyword> Keywords,
    IReadOnlyList<VisibleCard> CardPreviews);

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
    bool WillKillPlayer,
    string? RelicName,
    string? RelicDescription,
    IReadOnlyList<VisibleEventOptionTooltip> Tooltips);

public sealed record VisibleEventOptionTooltip(
    string Kind,
    string? Name,
    string? Description,
    VisibleCard? Card);

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

public sealed record TreasureBridgeContext(
    string Kind) : IBridgeContext;

public sealed record GameOverBridgeContext(
    string Kind,
    string Result,
    string GameMode,
    int? Score,
    int? FloorReached,
    int? Ascension) : IBridgeContext;

public sealed record MenuBridgeContext(
    string Kind,
    string Flow) : IBridgeContext;

public sealed record VisibleOwnedPotion(
    string EntityId,
    string DefinitionId,
    string? Name,
    string? Description,
    int Slot,
    IReadOnlyList<VisibleKeyword> Keywords,
    IReadOnlyList<VisibleCard> CardPreviews);

public sealed record ShopBridgeContext(
    string Kind) : IBridgeContext;

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

public sealed record CombatTransitionBridgeContext(
    string Kind,
    string Phase,
    string Transition) : IBridgeContext;

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
/// The single-player treasure-room lifecycle. Chest opening, relic choice,
/// skip, and room departure are distinct semantic commits.
/// </summary>
public sealed record TreasureRoomSurface(
    string Kind,
    string Stage,
    string RoomEntityId,
    bool ChestOpened,
    IReadOnlyList<VisibleTreasureRelic> Relics,
    bool CanSkip,
    bool CanProceed) : IBridgeSurface;

/// <summary>
/// The ordinary single-player game-over lifecycle. The intro and summary are
/// separate stages; returning to the main menu is not legal before the actual
/// summary control becomes visible and enabled.
/// </summary>
public sealed record GameOverSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string? ReturnDestination,
    bool CanAdvanceSummary,
    bool CanReturn) : IBridgeSurface;

public sealed record VisibleCharacterChoice(
    string EntityId,
    int Index,
    string CharacterId,
    string Name,
    bool IsLocked,
    bool IsSelected,
    bool IsRandom);

public sealed record VisibleStartingRelic(
    string DefinitionId,
    string? Name,
    string? Description);

public sealed record VisibleSelectedCharacterDetails(
    string CharacterId,
    string Title,
    string? Description,
    int? StartingHp,
    int? StartingGold,
    VisibleStartingRelic? StartingRelic);

/// <summary>
/// Ordinary single-player character selection. This contract intentionally
/// exposes only facts rendered by the current screen; it does not leak the
/// starting deck or collection totals exposed by the legacy reconstruction.
/// </summary>
public sealed record CharacterSelectSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    IReadOnlyList<VisibleCharacterChoice> Characters,
    VisibleSelectedCharacterDetails? SelectedDetails,
    int? Ascension,
    string? AscensionTitle,
    string? AscensionDescription,
    bool CanDecreaseAscension,
    bool CanIncreaseAscension,
    bool CanEmbark,
    bool CanGoBack) : IBridgeSurface;

public sealed record VisibleMenuOption(
    string EntityId,
    string SemanticId,
    string Label,
    string? Description,
    bool Enabled,
    string BridgeSupport,
    string? BlockedReason);

public sealed record VisibleContinueRunSummary(
    string CharacterId,
    string? CharacterName,
    string ActId,
    string? ActName,
    int Floor,
    int Hp,
    int MaxHp,
    int Gold,
    int Ascension);

public sealed record MainMenuSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    IReadOnlyList<VisibleMenuOption> Options,
    VisibleContinueRunSummary? ContinueRun) : IBridgeSurface;

public sealed record SingleplayerMenuSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    IReadOnlyList<VisibleMenuOption> Options) : IBridgeSurface;

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

/// <summary>
/// Purpose-specific deck upgrade selection. Preview cards are the exact
/// upgraded card representations currently visible in the confirmation stage.
/// </summary>
public sealed record DeckUpgradeSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string Prompt,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    bool Cancelable,
    IReadOnlyList<VisibleCard> Cards,
    IReadOnlyList<VisibleCard> PreviewCards) : IBridgeSurface;

/// <summary>
/// Purpose-specific random deck transformation. PreviewKind describes the
/// visible presentation, not a future outcome; ReplacementKnown must remain
/// false for random transforms until after commit.
/// </summary>
public sealed record DeckTransformSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string Prompt,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    bool Cancelable,
    bool UpgradeToggleVisible,
    bool ShowingUpgradePreviews,
    string PreviewKind,
    bool ReplacementKnown,
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

/// <summary>
/// Native Wood Carvings Bird/Torus selector. The replacement is deterministic
/// and player-visible before commit, unlike a random transform.
/// </summary>
public sealed record WoodCarvingsReplacementSelectionSurface(
    string Kind,
    string Stage,
    string ScreenEntityId,
    string Prompt,
    string Branch,
    string ReplacementDefinitionId,
    string? ReplacementName,
    string? ReplacementDescription,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    IReadOnlyList<VisibleCard> Cards) : IBridgeSurface;

public sealed record CombatTurnSurface(
    string Kind,
    string RoomEntityId,
    bool CanEndTurn) : IBridgeSurface;

public sealed record CombatPileCardSelectionSurface(
    string Kind,
    string ScreenEntityId,
    string Prompt,
    string Purpose,
    string SourceKind,
    string SourceCardEntityId,
    string SourceCardDefinitionId,
    string PileType,
    string DestinationPile,
    string DestinationPosition,
    string? OverflowDestination,
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

/// <summary>
/// Audited event choice whose visible temporary cards are committed as exact
/// instances to the persistent run deck. This is not a universal simple-grid
/// selector; source qualification belongs to the provider.
/// </summary>
public sealed record EventCardAcquisitionSurface(
    string Kind,
    string ScreenEntityId,
    string Prompt,
    string Destination,
    int MinSelect,
    int MaxSelect,
    int SelectedCount,
    IReadOnlyList<string> SelectedCardEntityIds,
    bool RequireManualConfirmation,
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
    string Purpose,
    string SourceKind,
    string Destination,
    string SelectedCardCostPolicy,
    string? OverflowDestination,
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

public sealed record NoActionSurface(
    string Kind,
    string Reason,
    string? Message) : IBridgeSurface;

public sealed record BridgeStateEnvelope(
    string ProtocolVersion,
    string StateId,
    long StateSequence,
    DateTimeOffset ObservedAt,
    string Readiness,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] SharedVisibleState? SharedState,
    IBridgeContext Context,
    IBridgeSurface Surface,
    AuthorityHandoff AuthorityHandoff,
    IReadOnlyList<LegalAction> LegalActions,
    StateCompleteness Completeness,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    ObservationPolicyInfo ObservationPolicy,
    BridgeVisibilityState Visibility,
    IReadOnlyList<BridgeInspectionCatalogEntry> InspectionCatalog,
    BridgeContractInstanceShadow ContractInstanceShadow,
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
