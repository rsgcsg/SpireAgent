using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;
using STS2_MCP.ConnectorV3.Protocol;
using STS2_MCP.ConnectorV3.Runtime;
using STS2_MCP.HumanEquivalent.Protocol;
using STS2_MCP.NativeUi;

namespace STS2_MCP.HumanEquivalent.Runtime;

internal sealed record HumanEquivalentRuntimeSnapshot(
    HumanEquivalentObservationResponse Observation,
    BridgeObservationDraft Draft,
    IReadOnlyDictionary<string, HumanEquivalentNativeBinding> Bindings);

internal sealed record HumanEquivalentNativeBinding(
    ConnectorV3BoundCommand Command,
    IReadOnlyDictionary<string, string> Parameters);

internal sealed record HumanEquivalentInspectionReadResult(
    HumanEquivalentInspectionResponse? Inspection,
    string? ErrorCode,
    string? Detail);

internal sealed record HumanEquivalentLinkedDetailReadResult(
    HumanEquivalentLinkedDetailResponse? LinkedDetail,
    string? ErrorCode,
    string? Detail);

/// <summary>
/// Human-Equivalent observation and delivery runtime. It owns the HE wire,
/// admission and receipt lifecycle and shares only bounded native UI
/// infrastructure with the explicit legacy comparison endpoint.
/// </summary>
internal static partial class HumanEquivalentRuntime
{
    private static BridgeEntityRegistry Entities => NativeUiRuntime.Entities;
    private static readonly BridgeStateIdentityTracker HumanStateIdentity = new();
    private static readonly ConcurrentDictionary<string, string> HumanRequestFingerprints =
        new(StringComparer.Ordinal);
    private static readonly ConcurrentDictionary<string, HumanEquivalentActionReceipt> HumanReceipts =
        new(StringComparer.Ordinal);
    private static readonly object HumanSubmissionGate = new();

    public static HumanEquivalentCapabilitiesResponse GetHumanEquivalentCapabilities()
    {
        BridgeCapabilitiesResponse bridge = BridgeV2Runtime.GetCapabilities();
        return new HumanEquivalentCapabilitiesResponse(
            HumanEquivalentContract.ProtocolVersion,
            HumanEquivalentContract.ObservationSchema,
            HumanEquivalentContract.ActionSchema,
            HumanEquivalentContract.ReceiptSchema,
            HumanEquivalentContract.ControlSchema,
            "implemented",
            HumanGatewayIdentity(bridge.Bridge),
            bridge.Game,
            new[]
            {
                "activate", "select", "deselect", "confirm", "cancel", "play",
                "target", "use", "end_turn", "skip", "open", "close"
            },
            StateBound: true,
            SingleController: true,
            BusinessSourceRequired: false,
            BusinessOutcomeRequired: false,
            ExecutionAvailable: bridge.Game.Compatibility.StateObservationAllowed,
            bridge.ControlCoordination,
            new[]
            {
                "Applied means native UI input was delivered, not that a business transaction settled.",
                "D annotations are outside the C observation and never authorize affordances.",
                "Build or install does not prove this artifact is loaded or Live-exercised."
            });
    }

    public static HumanEquivalentObservationResponse ObserveHumanEquivalent() =>
        BuildHumanEquivalentSnapshot().Observation;

    public static HumanEquivalentActionReceipt SubmitHumanEquivalent(
        HumanEquivalentActionRequest request)
    {
        string requestId = request.RequestId ?? string.Empty;
        IReadOnlyDictionary<string, string> parameters =
            new Dictionary<string, string>(StringComparer.Ordinal);
        if (string.IsNullOrWhiteSpace(requestId))
        {
            return HumanReceipt(
                requestId,
                request.AffordanceId ?? "invalid",
                "activate",
                "invalid",
                "not_applied",
                "not_applied",
                "invalid_request_id",
                "A bounded non-empty request_id is required.",
                null,
                null);
        }
        string fingerprint = BridgeHash.Object(new
        {
            request.ExpectedStateToken,
            request.AffordanceId,
            request.ClientSessionId,
            request.ControllerLeaseId,
            request.ControllerGeneration
        });

        lock (HumanSubmissionGate)
        {
            if (HumanRequestFingerprints.TryGetValue(requestId, out string? previousFingerprint))
            {
                if (string.Equals(previousFingerprint, fingerprint, StringComparison.Ordinal)
                    && HumanReceipts.TryGetValue(requestId, out HumanEquivalentActionReceipt? replay))
                    return replay;
                return HumanReceipt(
                    requestId,
                    request.AffordanceId ?? "invalid",
                    "activate",
                    "invalid",
                    "not_applied",
                    "not_applied",
                    "request_id_conflict",
                    "request_id was already used with a different exact action.",
                    null,
                    null);
            }

            HumanEquivalentRuntimeSnapshot snapshot = BuildHumanEquivalentSnapshot();
            string affordanceId = request.AffordanceId ?? string.Empty;
            HumanEquivalentAffordance? affordance = snapshot.Observation.Affordances
                .SingleOrDefault(candidate => string.Equals(
                    candidate.AffordanceId,
                    affordanceId,
                    StringComparison.Ordinal));
            HumanEquivalentNativeBinding? binding = affordance == null
                || !snapshot.Bindings.TryGetValue(affordanceId, out HumanEquivalentNativeBinding? found)
                    ? null
                    : found;
            parameters = binding?.Parameters
                ?? new Dictionary<string, string>(StringComparer.Ordinal);
            string action = affordance?.Action ?? "activate";
            string targetId = affordance?.TargetId ?? "invalid";

            HumanRequestFingerprints[requestId] = fingerprint;
            HumanEquivalentActionReceipt Fail(string code, string detail)
            {
                HumanEquivalentActionReceipt failed = HumanReceipt(
                    requestId,
                    affordanceId,
                    action,
                    targetId,
                    "not_applied",
                    "not_applied",
                    code,
                    detail,
                    snapshot.Observation,
                    null);
                HumanReceipts[requestId] = failed;
                return failed;
            }

            if (!string.Equals(snapshot.Observation.StateToken, request.ExpectedStateToken, StringComparison.Ordinal))
            {
                return Fail(
                    "stale_snapshot",
                    "The exact Human-Equivalent snapshot changed; obtain a fresh observation.");
            }
            if (affordance == null || binding == null)
                return Fail("affordance_not_current", "The exact advertised affordance is no longer current.");
            if (!snapshot.Observation.Game.Compatibility.StateObservationAllowed)
                return Fail("observation_unavailable", "The current UI cannot be observed exactly enough to deliver input.");

            var bridgeRequest = new BridgeCommandRequest(requestId, request.ExpectedStateToken, affordanceId)
            {
                ClientSessionId = request.ClientSessionId,
                ControllerLeaseId = request.ControllerLeaseId,
                ControllerGeneration = request.ControllerGeneration
            };
            BridgeCommandAdmission admission = BridgeV2Runtime.AuthorizeController(bridgeRequest);
            if (!admission.Accepted)
                return Fail(admission.ErrorCode ?? "controller_rejected", admission.Detail ?? "Mutation control was rejected.");

            BridgeActionStartResult started;
            try
            {
                started = StartHumanEquivalentInput(
                    snapshot,
                    binding.Command,
                    parameters);
            }
            catch (Exception exception)
            {
                HumanEquivalentActionReceipt unknown = HumanReceipt(
                    requestId,
                    affordanceId,
                    action,
                    targetId,
                    "unknown",
                    "unknown",
                    "input_delivery_unknown",
                    $"Native input may have been delivered before {exception.GetType().Name}; do not retry.",
                    null,
                    admission.Attribution);
                HumanReceipts[requestId] = unknown;
                return unknown;
            }
            if (!started.Accepted)
                return Fail(
                    started.ErrorCode ?? "native_input_rejected",
                    started.Detail ?? "The native UI rejected this exact input.");

            HumanEquivalentObservationResponse? successor = null;
            string detail = "Native UI input was delivered; inspect successor for game progress.";
            try
            {
                successor = ObserveHumanEquivalent();
            }
            catch (Exception exception)
            {
                // Delivery is already known. A failed read must not be relabelled
                // as uncertain mutation; Re can safely obtain a fresh snapshot.
                detail = $"Native UI input was delivered; immediate successor read failed with {exception.GetType().Name}.";
            }
            HumanEquivalentActionReceipt applied = HumanReceipt(
                requestId,
                affordanceId,
                action,
                targetId,
                "applied",
                "applied",
                successor == null ? "successor_observation_unavailable" : null,
                detail,
                successor,
                admission.Attribution);
            HumanReceipts[requestId] = applied;
            return applied;
        }
    }

    public static HumanEquivalentActionReceipt? PollHumanEquivalent(string requestId) =>
        HumanReceipts.TryGetValue(requestId, out HumanEquivalentActionReceipt? receipt)
            ? receipt
            : null;

    public static HumanEquivalentInspectionReadResult InspectHumanEquivalent(
        string kind,
        string expectedStateToken)
    {
        HumanEquivalentRuntimeSnapshot snapshot =
            BuildHumanEquivalentSnapshot();
        HumanEquivalentObservationResponse observation = snapshot.Observation;
        if (!string.Equals(observation.StateToken, expectedStateToken, StringComparison.Ordinal))
        {
            return new HumanEquivalentInspectionReadResult(
                null,
                "stale_state",
                "The expected state token is no longer current; obtain a fresh HumanSnapshot.");
        }
        if (!observation.InspectionCatalog.Any(entry =>
                string.Equals(entry.Kind, kind, StringComparison.Ordinal)))
        {
            return new HumanEquivalentInspectionReadResult(
                null,
                "inspection_not_available",
                "This read is not in the current player-visible inspection catalog.");
        }

        BridgeInspectionBuildResult built = BridgeInspectionBuilder.Build(
            kind,
            snapshot.Draft.Context,
            Entities);
        if (built.Draft == null)
            return new HumanEquivalentInspectionReadResult(null, built.ErrorCode, built.Detail);

        BridgeInspectionDraft draft = built.Draft;
        string inspectionId = "heinspection_" + BridgeHash.Object(new
        {
            observation.StateToken,
            draft.Kind,
            draft.Content,
            draft.Completeness
        })[..20];
        return new HumanEquivalentInspectionReadResult(
            new HumanEquivalentInspectionResponse(
                HumanEquivalentContract.ProtocolVersion,
                HumanEquivalentContract.InspectionSchema,
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

    public static HumanEquivalentLinkedDetailReadResult ReadHumanEquivalentLinkedDetail(
        string entityId,
        string expectedStateToken)
    {
        HumanEquivalentRuntimeSnapshot snapshot =
            BuildHumanEquivalentSnapshot();
        HumanEquivalentObservationResponse observation = snapshot.Observation;
        if (!string.Equals(observation.StateToken, expectedStateToken, StringComparison.Ordinal))
        {
            return new HumanEquivalentLinkedDetailReadResult(
                null,
                "stale_state",
                "The expected state token is no longer current; obtain a fresh HumanSnapshot.");
        }
        if (!observation.LinkedDetailCatalog.Any(entry =>
                string.Equals(entry.Kind, "surface_card", StringComparison.Ordinal)
                && string.Equals(entry.EntityId, entityId, StringComparison.Ordinal)))
        {
            return new HumanEquivalentLinkedDetailReadResult(
                null,
                "linked_detail_not_available",
                "This entity is not in the current state-bound linked-detail catalog.");
        }
        VisibleCard? card = HumanSurfaceCards(snapshot.Draft.Surface)
            .FirstOrDefault(value => string.Equals(
                value.EntityId,
                entityId,
                StringComparison.Ordinal));
        if (card == null)
        {
            return new HumanEquivalentLinkedDetailReadResult(
                null,
                "linked_detail_binding_failed",
                "The current card detail could not be rebuilt from the same UI Surface.");
        }

        string detailId = "hedetail_" + BridgeHash.Object(new
        {
            observation.StateToken,
            kind = "surface_card",
            card
        })[..20];
        return new HumanEquivalentLinkedDetailReadResult(
            new HumanEquivalentLinkedDetailResponse(
                HumanEquivalentContract.ProtocolVersion,
                HumanEquivalentContract.LinkedDetailSchema,
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

    private static HumanEquivalentRuntimeSnapshot BuildHumanEquivalentSnapshot()
    {
        GameBuildIdentity game = BridgeV2Runtime.ReadCurrentGameIdentity();
        BridgeObservationDraft? sourceFreeSurface =
            HumanGeneratedCardChoiceAdapter.TryBuild(Entities, game)
            ?? HumanCombatPileSelectionAdapter.TryBuild(Entities, game)
            ?? HumanDeckCardSelectionAdapter.TryBuild(Entities, game);
        BridgeObservationDraft draft = sourceFreeSurface
            ?? BridgeSnapshotBuilder.Build(Entities, game);
        draft = ConnectorV3Runtime.SuppressForNativePageEvidence(draft) with
        {
            CandidateAdmission = "human_ui",
            AuthorityHandoff = new AuthorityHandoff(
                "human_ui_owned",
                draft.Surface.Kind,
                "The exact current native UI owns input; business source is not action authority.")
        };

        BridgeSharedVisibleStateBuildResult shared = game.Compatibility.StateObservationAllowed
            ? BridgeSharedVisibleStateBuilder.Build(Entities)
            : new BridgeSharedVisibleStateBuildResult(false, null, null);
        draft = BridgeV2Runtime.ApplyMissingSharedStatePolicy(draft, shared);
        bool shopCatalogAvailable = ShopSurfaceFacts.TryGetCurrent(out _, out _, out _);
        BridgeVisibilityProjection inheritedVisibility = BridgeVisibilityCatalog.Build(
            draft,
            shared.State != null,
            shopCatalogAvailable);
        IReadOnlyList<BridgeInspectionCatalogEntry> inspections =
            BuildHumanInspectionCatalog(draft, shared.State != null, shopCatalogAvailable);
        IReadOnlyList<HumanEquivalentLinkedDetailCatalogEntry> linkedDetails =
            BuildHumanLinkedDetailCatalog(draft.Surface);
        BridgeVisibilityState visibility = inheritedVisibility.Visibility with
        {
            AvailableInspections = inspections.Select(entry => entry.Kind).ToArray(),
            LinkedDetailKinds = linkedDetails.Select(entry => entry.Kind)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(kind => kind, StringComparer.Ordinal)
                .ToArray(),
            Missing = inheritedVisibility.Visibility.Missing
                .Where(value => value != "linked_entity_detail_catalog_not_implemented")
                .ToArray()
        };
        JsonNode rawSurface = JsonSerializer.SerializeToNode(
            draft.Surface,
            draft.Surface.GetType(),
            McpMod._jsonOptions) ?? new JsonObject();
        IReadOnlyList<ConnectorV3BoundCommand> nativeBindings =
            BuildHumanEquivalentBindings(draft);
        string ownerId = ReadFirstString(
            rawSurface,
            "screen_entity_id",
            "room_entity_id",
            "hand_entity_id",
            "map_screen_entity_id")
            ?? nativeBindings.SelectMany(item => item.Candidate.EntityBindings)
                .FirstOrDefault(entity => IsOwnerRole(entity.Role))?.EntityId
            ?? "owner_" + BridgeHash.Object(new { draft.Surface.Kind, draft.Signature })[..20];
        IReadOnlyList<(HumanEquivalentAffordance Affordance, HumanEquivalentNativeBinding Binding)> projected =
            ProjectHumanAffordances(nativeBindings, ownerId);
        string stage = ReadFirstString(rawSurface, "stage") ?? draft.Readiness;
        string? prompt = ReadFirstString(rawSurface, "prompt", "body", "message");
        JsonNode surfaceFacts = ProjectHumanFacts(draft.Surface, draft.Context);

        IReadOnlyList<HumanEquivalentUiEntity> entities = HumanSurfaceCards(draft.Surface)
            .GroupBy(card => card.EntityId, StringComparer.Ordinal)
            .Select(group => new HumanEquivalentUiEntity(
                group.Key,
                "card",
                group.First().Name ?? group.First().DefinitionId,
                Visible: true,
                Enabled: projected.Any(item => string.Equals(item.Affordance.TargetId, group.Key, StringComparison.Ordinal)),
                Selected: IsSelected(rawSurface, group.Key),
                JsonSerializer.SerializeToNode(group.First(), McpMod._jsonOptions) ?? new JsonObject()))
            .OrderBy(entity => entity.EntityId, StringComparer.Ordinal)
            .ToArray();
        IReadOnlyList<HumanEquivalentUiControl> controls = projected
            .Select(item => new HumanEquivalentUiControl(
                item.Affordance.TargetId,
                item.Affordance.OwnerId,
                item.Affordance.Action,
                item.Affordance.Label,
                Visible: true,
                Enabled: true,
                Selected: null,
                Focused: null,
                Actions: new[] { item.Affordance.Action }))
            .GroupBy(control => control.ControlId, StringComparer.Ordinal)
            .Select(group => group.First())
            .OrderBy(control => control.ControlId, StringComparer.Ordinal)
            .ToArray();
        string signature = BridgeHash.Object(new
        {
            game.Version,
            game.Commit,
            shared.State,
            draft.Readiness,
            surface = surfaceFacts,
            ownerId,
            entities,
            controls,
            affordances = projected.Select(item => item.Affordance).ToArray(),
            visibility
        });
        (string stateToken, long sequence) = HumanStateIdentity.Observe(signature);
        bool visibleUnsupported = draft.Surface is UnsupportedSurface;
        string status = projected.Count > 0
            ? "actionable"
            : visibleUnsupported ? "visible_unsupported" : draft.Readiness == "settling" ? "settling" : "observed";
        var observation = new HumanEquivalentObservationResponse(
            HumanEquivalentContract.ProtocolVersion,
            HumanEquivalentContract.ObservationSchema,
            stateToken,
            sequence,
            DateTimeOffset.UtcNow,
            status,
            new HumanEquivalentOwner(ownerId, draft.Surface.Kind),
            shared.State,
            new HumanEquivalentUiSurface(draft.Surface.Kind, stage, prompt, surfaceFacts),
            entities,
            controls,
            projected.Select(item => item.Affordance).ToArray(),
            draft.Completeness,
            HumanGatewayIdentity(BridgeV2Runtime.ReadBridgeIdentity()),
            game,
            BridgeV2Runtime.ReadObservationPolicy(),
            visibility,
            inspections,
            linkedDetails,
            BridgeDiagnostics.ForObservation(draft),
            draft.Warnings,
            new HumanEquivalentCoverage(
                draft.Completeness.PlayerVisibleSemantics,
                visibleUnsupported ? "visible_unmapped_ui" : "current_native_ui",
                projected.Count > 0 ? "human_operable" : visibleUnsupported ? "unsupported" : "no_current_input",
                visibleUnsupported ? new[] { draft.Surface.Kind } : Array.Empty<string>(),
                visibility.HiddenByPolicy));
        return new HumanEquivalentRuntimeSnapshot(
            observation,
            draft,
            projected.ToDictionary(item => item.Affordance.AffordanceId, item => item.Binding, StringComparer.Ordinal));
    }

    private static IReadOnlyList<BridgeInspectionCatalogEntry> BuildHumanInspectionCatalog(
        BridgeObservationDraft draft,
        bool runStateAvailable,
        bool shopCatalogAvailable)
    {
        var entries = new List<BridgeInspectionCatalogEntry>();
        if (runStateAvailable)
        {
            entries.Add(new BridgeInspectionCatalogEntry(
                BridgeInspectionBuilder.RunDeckKind,
                "active_run",
                "human_visible",
                "player_openable_run_deck_view",
                StateBound: true,
                CreatesActionAuthority: false,
                "unordered_multiset",
                "medium",
                new[] { "deck_planning" },
                Array.Empty<string>()));
        }
        if (draft.Context.Kind == "combat")
        {
            entries.Add(new BridgeInspectionCatalogEntry(
                BridgeInspectionBuilder.CombatPilesKind,
                "current_combat",
                "human_visible",
                "player_openable_draw_discard_exhaust_pile_views",
                StateBound: true,
                CreatesActionAuthority: false,
                "unordered_multiset",
                "medium",
                new[] { "combat_planning" },
                new[] { "draw_pile_true_order" }));
        }
        if (draft.Context.Kind == "shop" && shopCatalogAvailable)
        {
            entries.Add(new BridgeInspectionCatalogEntry(
                BridgeInspectionBuilder.ShopCatalogKind,
                "current_shop",
                "human_visible",
                "player_openable_current_merchant_inventory",
                StateBound: true,
                CreatesActionAuthority: false,
                "fixed_ui_slots",
                "low",
                new[] { "shop_planning" },
                Array.Empty<string>()));
        }
        return entries;
    }

    private static IReadOnlyList<HumanEquivalentLinkedDetailCatalogEntry>
        BuildHumanLinkedDetailCatalog(IBridgeSurface surface) =>
        HumanSurfaceCards(surface)
            .GroupBy(card => card.EntityId, StringComparer.Ordinal)
            .Select(group => new HumanEquivalentLinkedDetailCatalogEntry(
                "surface_card",
                group.Key,
                "normal_player_visible_surface_card",
                StateBound: true,
                CreatesActionAuthority: false))
            .OrderBy(entry => entry.EntityId, StringComparer.Ordinal)
            .ToArray();

    private static BridgeActionStartResult StartHumanEquivalentInput(
        HumanEquivalentRuntimeSnapshot snapshot,
        ConnectorV3BoundCommand binding,
        IReadOnlyDictionary<string, string> parameters)
    {
        string operation = binding.Candidate.Operation;
        if (operation == "human_select_visible_card"
            && parameters.TryGetValue("card_id", out string? cardId)
            && parameters.TryGetValue("screen_id", out string? screenId))
        {
            return HumanGeneratedCardChoiceAdapter.StartSelect(Entities, screenId, cardId);
        }
        if (operation == "human_skip_visible_choice"
            && parameters.TryGetValue("screen_id", out screenId))
            return HumanGeneratedCardChoiceAdapter.StartSkip(Entities, screenId);
        if (snapshot.Draft.Surface is HumanDeckCardSelectionSurface deckSelection)
        {
            return HumanDeckCardSelectionAdapter.Start(
                Entities,
                deckSelection,
                binding,
                parameters);
        }
        if (snapshot.Draft.Surface is HumanCombatPileSelectionSurface combatPileSelection)
        {
            return HumanCombatPileSelectionAdapter.Start(
                Entities,
                combatPileSelection,
                binding,
                parameters);
        }

        ConnectorV3Snapshot carrier = ConnectorV3Runtime.BuildSnapshot(
            suppressHumanEquivalence: false,
            admitEncounter: false) with
        {
            Draft = snapshot.Draft,
            Bindings = new[] { binding }
        };
        var request = new ConnectorV3CommandRequest(
            null,
            null,
            null,
            binding.Candidate.Command,
            parameters);
        return ConnectorV3Runtime.StartNativeUiInput(carrier, request, binding);
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildHumanEquivalentBindings(
        BridgeObservationDraft draft)
    {
        IReadOnlyList<ConnectorV3CommandDescriptor>? descriptors = draft.Surface switch
        {
            HumanDeckCardSelectionSurface deckSelection =>
                HumanDeckCardSelectionAdapter.DescribeCommands(deckSelection),
            HumanCombatPileSelectionSurface combatPileSelection =>
                HumanCombatPileSelectionAdapter.DescribeCommands(combatPileSelection),
            _ => null
        };
        if (descriptors == null)
            return ConnectorV3Runtime.BuildBindings(draft);

        return descriptors
            .Select(descriptor => ConnectorV3Runtime.BuildNativeBinding(draft, descriptor))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();
    }

    private static IEnumerable<VisibleCard> HumanSurfaceCards(IBridgeSurface surface) =>
        surface switch
        {
            HumanDeckCardSelectionSurface deckSelection => deckSelection.Cards,
            HumanCombatPileSelectionSurface combatPileSelection => combatPileSelection.Cards,
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

    private static IReadOnlyList<(HumanEquivalentAffordance, HumanEquivalentNativeBinding)>
        ProjectHumanAffordances(
            IReadOnlyList<ConnectorV3BoundCommand> bindings,
            string ownerId)
    {
        var result = new List<(HumanEquivalentAffordance, HumanEquivalentNativeBinding)>();
        foreach (ConnectorV3BoundCommand binding in bindings)
        {
            foreach (IReadOnlyDictionary<string, string> parameters in ExpandParameters(binding.Candidate))
            {
                string targetId = parameters
                    .Where(pair => pair.Key.EndsWith("_id", StringComparison.Ordinal)
                        && pair.Key is not "screen_id" and not "room_id" and not "hand_id" and not "map_screen_id")
                    .Select(pair => pair.Value)
                    .FirstOrDefault()
                    ?? parameters.Values.FirstOrDefault()
                    ?? "control_" + BridgeHash.Text(binding.Candidate.Operation)[..20];
                string action = GenericAction(binding.Candidate.Command, binding.Candidate.Operation);
                string affordanceId = "affordance_" + BridgeHash.Object(new
                {
                    action,
                    targetId,
                    parameters = parameters.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray()
                })[..20];
                result.Add((
                    new HumanEquivalentAffordance(
                        affordanceId,
                        action,
                        targetId,
                        ownerId,
                        binding.Candidate.Label,
                        "native_ui_adapter"),
                    new HumanEquivalentNativeBinding(binding, parameters)));
            }
        }
        return result;
    }

    private static IEnumerable<IReadOnlyDictionary<string, string>> ExpandParameters(
        ConnectorV3CommandCandidate candidate)
    {
        var current = new List<Dictionary<string, string>>
        {
            new(candidate.Operands, StringComparer.Ordinal)
        };
        foreach ((string name, ConnectorV3OperandDomain domain) in candidate.OperandDomains)
        {
            current = current.SelectMany(parameters => domain.EntityIds.Select(entityId =>
            {
                var expanded = new Dictionary<string, string>(parameters, StringComparer.Ordinal)
                {
                    [name] = entityId
                };
                return expanded;
            })).Take(512).ToList();
        }
        return current;
    }

    private static HumanEquivalentActionReceipt HumanReceipt(
        string requestId,
        string affordanceId,
        string action,
        string targetId,
        string status,
        string delivery,
        string? reasonCode,
        string? detail,
        HumanEquivalentObservationResponse? successor,
        BridgeCommandAttribution? attribution) =>
        new(
            HumanEquivalentContract.ProtocolVersion,
            HumanEquivalentContract.ReceiptSchema,
            requestId,
            status,
            delivery,
            new HumanEquivalentActionSummary(affordanceId, action, targetId),
            reasonCode,
            detail,
            new HumanEquivalentRetryPolicy(
                status == "not_applied",
                status == "unknown" ? "unknown_delivery_never_retry" : "fresh_snapshot_required"),
            successor)
        {
            Attribution = attribution
        };

    private static BridgeServerIdentity HumanGatewayIdentity(BridgeServerIdentity identity) => identity with
    {
        Id = HumanEquivalentContract.GatewayId,
        Name = HumanEquivalentContract.GatewayName
    };

    internal static string GenericAction(string command, string operation) => command switch
    {
        "play_card" => "play",
        "use_potion" => "use",
        "end_turn" => "end_turn",
        "select_entity" => "select",
        "deselect_entity" => "deselect",
        "confirm_interaction" => "confirm",
        "cancel_interaction" => "cancel",
        "purchase" or "choose" or "navigate" or "activate_control" =>
            operation.Contains("skip", StringComparison.Ordinal) ? "skip" :
            operation.Contains("close", StringComparison.Ordinal) || operation.Contains("leave", StringComparison.Ordinal) ? "close" :
            operation.Contains("open", StringComparison.Ordinal) ? "open" : "activate",
        _ => "activate"
    };

    private static bool IsOwnerRole(string role) =>
        role.Contains("screen", StringComparison.Ordinal)
        || role.Contains("room", StringComparison.Ordinal)
        || role is "hand" or "owner";

    private static string? ReadFirstString(JsonNode node, params string[] keys)
    {
        if (node is not JsonObject obj)
            return null;
        foreach (string key in keys)
        {
            if (obj[key]?.GetValueKind() == JsonValueKind.String)
                return obj[key]!.GetValue<string>();
        }
        return null;
    }

    private static bool IsSelected(JsonNode rawSurface, string entityId)
    {
        if (rawSurface is not JsonObject obj
            || obj["selected_card_entity_ids"] is not JsonArray selected)
            return false;
        return selected.Any(value => value?.GetValueKind() == JsonValueKind.String
            && string.Equals(value.GetValue<string>(), entityId, StringComparison.Ordinal));
    }

    internal static JsonNode ProjectHumanFacts(IBridgeSurface surface, IBridgeContext context)
    {
        JsonNode visibleSurface = surface switch
        {
            DeckEnchantSelectionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Stage, value.ScreenEntityId, value.Prompt,
                value.MinSelect, value.MaxSelect, value.SelectedCount,
                value.SelectedCardEntityIds, value.SelectableCardEntityIds,
                value.DeselectableCardEntityIds, value.Cancelable,
                value.Enchantment, value.Cards, value.CanPreview,
                value.CanCloseSelection, value.CanConfirm, value.CanCancelPreview
            }, McpMod._jsonOptions)!,
            DeckTransformSelectionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Stage, value.ScreenEntityId, value.Prompt,
                value.MinSelect, value.MaxSelect, value.SelectedCount,
                value.SelectedCardEntityIds, value.SelectableCardEntityIds,
                value.DeselectableCardEntityIds, value.Cancelable,
                value.UpgradeToggleVisible, value.ShowingUpgradePreviews,
                value.PreviewKind, value.ReplacementKnown, value.Cards,
                value.CanPreview, value.CanCancelSelection,
                value.CanCancelPreview, value.CanConfirm, value.CanToggleUpgradeView
            }, McpMod._jsonOptions)!,
            CombatPileCardSelectionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.ScreenEntityId, value.Prompt, value.PileType,
                value.MinSelect, value.MaxSelect, value.SelectedCount,
                value.SelectedCardEntityIds, value.SelectableCardEntityIds,
                value.DeselectableCardEntityIds, value.RequireManualConfirmation,
                value.Cancelable, value.CanConfirm, value.Cards
            }, McpMod._jsonOptions)!,
            EventCardAcquisitionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.ScreenEntityId, value.Prompt, value.MinSelect,
                value.MaxSelect, value.SelectedCount, value.SelectedCardEntityIds,
                value.SelectableCardEntityIds, value.DeselectableCardEntityIds,
                value.RequireManualConfirmation, value.Cards
            }, McpMod._jsonOptions)!,
            EventDeckRemovalSelectionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Stage, value.ScreenEntityId, value.Prompt,
                value.MinSelect, value.MaxSelect, value.SelectedCount,
                value.SelectedCardEntityIds, value.SelectableCardEntityIds,
                value.DeselectableCardEntityIds, value.CanCancelPreview,
                value.CanConfirm, value.Cards
            }, McpMod._jsonOptions)!,
            GeneratedCardChoiceSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.ScreenEntityId, value.Prompt, value.CanSkip,
                value.IsPeeking, value.Cards, value.SelectableCardEntityIds,
                value.SkipAvailable
            }, McpMod._jsonOptions)!,
            UnsupportedSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Reason
            }, McpMod._jsonOptions)!,
            HumanDeckCardSelectionSurface or HumanCombatPileSelectionSurface
                or EventOptionSurface or EventDialogueSurface or RestSiteSurface
                or ShopInventorySurface or ShopRoomSurface or TreasureRoomSurface
                or GameOverSurface or CharacterSelectSurface or MainMenuSurface
                or SingleplayerMenuSurface or DeckRemovalSelectionSurface
                or DeckUpgradeSelectionSurface or WoodCarvingsReplacementSelectionSurface
                or CombatTurnSurface or CombatHandCardSelectionSurface
                or CardRewardSelectionSurface or CardBundleSelectionSurface
                or RewardClaimSurface or MapNavigationSurface or NoActionSurface =>
                SerializeKnownUiValue(surface),
            _ => new JsonObject
            {
                ["kind"] = surface.Kind,
                ["projection_status"] = "visible_surface_shape_not_projected"
            }
        };
        JsonNode visibleContext = context switch
        {
            UnknownBridgeContext value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Reason
            }, McpMod._jsonOptions)!,
            EventBridgeContext or CombatBridgeContext or RewardFlowBridgeContext
                or RestBridgeContext or TreasureBridgeContext or GameOverBridgeContext
                or MenuBridgeContext or ShopBridgeContext or MapBridgeContext
                or CombatTransitionBridgeContext or RunTransitionBridgeContext =>
                SerializeKnownUiValue(context),
            _ => new JsonObject { ["kind"] = context.Kind }
        };
        return new JsonObject
        {
            ["surface"] = visibleSurface,
            ["context"] = visibleContext
        };
    }

    private static JsonNode SerializeKnownUiValue(object value) =>
        JsonSerializer.SerializeToNode(value, value.GetType(), McpMod._jsonOptions)
        ?? new JsonObject();
}
