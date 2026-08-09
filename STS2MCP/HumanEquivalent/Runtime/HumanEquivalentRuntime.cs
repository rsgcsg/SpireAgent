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
using STS2_MCP.HumanEquivalent.Protocol;
using STS2_MCP.HumanEquivalent.Runtime;

namespace STS2_MCP.ConnectorV3.Runtime;

internal sealed record HumanEquivalentRuntimeSnapshot(
    HumanEquivalentObservationResponse Observation,
    BridgeObservationDraft Draft,
    IReadOnlyDictionary<string, ConnectorV3BoundCommand> Bindings);

internal sealed record HumanEquivalentInspectionReadResult(
    HumanEquivalentInspectionResponse? Inspection,
    string? ErrorCode,
    string? Detail);

internal sealed record HumanEquivalentLinkedDetailReadResult(
    HumanEquivalentLinkedDetailResponse? LinkedDetail,
    string? ErrorCode,
    string? Detail);

/// <summary>
/// Human-Equivalent observation and delivery facade. It is a partial of the
/// inherited runtime only to reach its bounded native UI adapter library; HE
/// owns separate wire contracts, admission and receipts and does not invoke
/// the V3 HTTP or permission path.
/// </summary>
internal static partial class ConnectorV3Runtime
{
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
            new[] { HumanEquivalentContract.AssistedMode, HumanEquivalentContract.PureMode },
            new[]
            {
                "activate", "select", "deselect", "confirm", "cancel", "play",
                "target", "use", "end_turn", "skip", "open", "close"
            },
            StateBound: true,
            FrameBound: true,
            SingleController: true,
            BusinessSourceRequired: false,
            BusinessOutcomeRequired: false,
            ExecutionAvailable: bridge.Game.Compatibility.StateObservationAllowed,
            bridge.ControlCoordination,
            new[]
            {
                "Applied means native UI input was delivered, not that a business transaction settled.",
                "Optional annotations never create, remove or authorize affordances.",
                "Build or install does not prove this artifact is loaded or Live-exercised."
            });
    }

    public static HumanEquivalentObservationResponse ObserveHumanEquivalent(string? mode) =>
        BuildHumanEquivalentSnapshot(NormalizeHumanMode(mode)).Observation;

    public static HumanEquivalentActionReceipt SubmitHumanEquivalent(
        HumanEquivalentActionRequest request)
    {
        string requestId = request.RequestId ?? string.Empty;
        string mode = NormalizeHumanMode(request.Mode);
        IReadOnlyDictionary<string, string> parameters = request.Parameters
            ?? new Dictionary<string, string>(StringComparer.Ordinal);
        if (string.IsNullOrWhiteSpace(requestId))
        {
            return HumanReceipt(
                requestId,
                request.AffordanceId ?? "invalid",
                "activate",
                "invalid",
                parameters,
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
            request.ExpectedFrameId,
            request.ExpectedOwnerId,
            request.AffordanceId,
            parameters = parameters.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray(),
            mode,
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
                    parameters,
                    "not_applied",
                    "not_applied",
                    "request_id_conflict",
                    "request_id was already used with a different exact action.",
                    null,
                    null);
            }

            HumanEquivalentRuntimeSnapshot snapshot = BuildHumanEquivalentSnapshot(mode);
            string affordanceId = request.AffordanceId ?? string.Empty;
            HumanEquivalentAffordance? affordance = snapshot.Observation.Affordances
                .SingleOrDefault(candidate => string.Equals(
                    candidate.AffordanceId,
                    affordanceId,
                    StringComparison.Ordinal));
            ConnectorV3BoundCommand? binding = affordance == null
                || !snapshot.Bindings.TryGetValue(affordanceId, out ConnectorV3BoundCommand? found)
                    ? null
                    : found;
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
                    parameters,
                    "not_applied",
                    "not_applied",
                    code,
                    detail,
                    snapshot.Observation,
                    null);
                HumanReceipts[requestId] = failed;
                return failed;
            }

            if (!string.Equals(snapshot.Observation.StateToken, request.ExpectedStateToken, StringComparison.Ordinal)
                || !string.Equals(snapshot.Observation.Frame.FrameId, request.ExpectedFrameId, StringComparison.Ordinal)
                || !string.Equals(snapshot.Observation.Owner.OwnerId, request.ExpectedOwnerId, StringComparison.Ordinal))
            {
                return Fail(
                    "stale_snapshot",
                    "The exact state, frame or current UI owner changed; obtain a fresh snapshot.");
            }
            if (affordance == null || binding == null || !DictionaryEqual(affordance.Parameters, parameters))
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
                    binding,
                    parameters);
            }
            catch (Exception exception)
            {
                HumanEquivalentActionReceipt unknown = HumanReceipt(
                    requestId,
                    affordanceId,
                    action,
                    targetId,
                    parameters,
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
                successor = ObserveHumanEquivalent(mode);
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
                parameters,
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
        string expectedStateToken,
        string? mode)
    {
        HumanEquivalentRuntimeSnapshot snapshot =
            BuildHumanEquivalentSnapshot(NormalizeHumanMode(mode));
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
        string expectedStateToken,
        string? mode)
    {
        HumanEquivalentRuntimeSnapshot snapshot =
            BuildHumanEquivalentSnapshot(NormalizeHumanMode(mode));
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

    private static HumanEquivalentRuntimeSnapshot BuildHumanEquivalentSnapshot(string mode)
    {
        GameBuildIdentity game = BridgeV2Runtime.ReadCurrentGameIdentity();
        BridgeObservationDraft? sourceFreeSurface =
            HumanGeneratedCardChoiceAdapter.TryBuild(Entities, game)
            ?? HumanDeckCardSelectionAdapter.TryBuild(Entities, game);
        BridgeObservationDraft draft = sourceFreeSurface
            ?? BridgeSnapshotBuilder.Build(Entities, game);
        draft = HumanEquivalence.SuppressMutation(draft) with
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
        IReadOnlyList<(HumanEquivalentAffordance Affordance, ConnectorV3BoundCommand Binding)> projected =
            ProjectHumanAffordances(nativeBindings, ownerId);
        string stage = ReadFirstString(rawSurface, "stage") ?? draft.Readiness;
        string? prompt = ReadFirstString(rawSurface, "prompt", "body", "message");
        HumanEquivalentAnnotationEnvelope? annotations = mode == HumanEquivalentContract.AssistedMode
            ? BuildOptionalAnnotations(rawSurface, stage)
            : null;
        JsonNode rawContext = JsonSerializer.SerializeToNode(
            draft.Context,
            draft.Context.GetType(),
            McpMod._jsonOptions) ?? new JsonObject();
        var surfaceFacts = new JsonObject
        {
            ["surface"] = rawSurface.DeepClone(),
            ["context"] = rawContext
        };
        RemoveBusinessKeys(surfaceFacts);

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
                Selected: false,
                Focused: false,
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
        string frameId = "frame_" + BridgeHash.Text($"{stateToken}|{ownerId}|{draft.Surface.Kind}")[..20];
        bool visibleUnsupported = draft.Surface is UnsupportedSurface;
        string status = projected.Count > 0
            ? "actionable"
            : visibleUnsupported ? "visible_unsupported" : draft.Readiness == "settling" ? "settling" : "observed";
        var observation = new HumanEquivalentObservationResponse(
            HumanEquivalentContract.ProtocolVersion,
            HumanEquivalentContract.ObservationSchema,
            mode,
            stateToken,
            sequence,
            DateTimeOffset.UtcNow,
            status,
            new HumanEquivalentFrame(frameId, 0, 0, "native_structured_ui"),
            new HumanEquivalentOwner(ownerId, draft.Surface.Kind),
            shared.State,
            new HumanEquivalentUiSurface(draft.Surface.Kind, stage, prompt, surfaceFacts),
            entities,
            controls,
            projected.Select(item => item.Affordance).ToArray(),
            annotations,
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

        ConnectorV3Snapshot carrier = BuildSnapshot(
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
        return StartNativeUiInput(carrier, request, binding);
    }

    private static IReadOnlyList<ConnectorV3BoundCommand> BuildHumanEquivalentBindings(
        BridgeObservationDraft draft)
    {
        if (draft.Surface is not HumanDeckCardSelectionSurface deckSelection)
            return BuildBindings(draft);

        return HumanDeckCardSelectionAdapter.DescribeCommands(deckSelection)
            .Select(descriptor => BuildNativeBinding(draft, descriptor))
            .Where(binding => binding != null)
            .Cast<ConnectorV3BoundCommand>()
            .ToArray();
    }

    private static IEnumerable<VisibleCard> HumanSurfaceCards(IBridgeSurface surface) =>
        surface is HumanDeckCardSelectionSurface deckSelection
            ? deckSelection.Cards
            : SurfaceCards(surface);

    private static IReadOnlyList<(HumanEquivalentAffordance, ConnectorV3BoundCommand)>
        ProjectHumanAffordances(
            IReadOnlyList<ConnectorV3BoundCommand> bindings,
            string ownerId)
    {
        var result = new List<(HumanEquivalentAffordance, ConnectorV3BoundCommand)>();
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
                        parameters,
                        new Dictionary<string, HumanEquivalentParameterDomain>(),
                        binding.Candidate.EntityBindings,
                        "native_ui_adapter"),
                    binding));
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
        IReadOnlyDictionary<string, string> parameters,
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
            new HumanEquivalentActionSummary(affordanceId, action, targetId, parameters),
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

    internal static string NormalizeHumanMode(string? mode) => mode switch
    {
        null or "" or HumanEquivalentContract.AssistedMode => HumanEquivalentContract.AssistedMode,
        HumanEquivalentContract.PureMode => HumanEquivalentContract.PureMode,
        _ => throw new ArgumentException("mode must be he_assisted or he_pure", nameof(mode))
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

    internal static bool DictionaryEqual(
        IReadOnlyDictionary<string, string> left,
        IReadOnlyDictionary<string, string> right) =>
        left.Count == right.Count && left.All(pair =>
            right.TryGetValue(pair.Key, out string? value)
            && string.Equals(pair.Value, value, StringComparison.Ordinal));

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

    private static HumanEquivalentAnnotationEnvelope BuildOptionalAnnotations(
        JsonNode rawSurface,
        string stage) => new(
            ReadFirstString(rawSurface, "source_kind", "event_id"),
            ReadFirstString(rawSurface, "purpose"),
            stage,
            ReadFirstString(rawSurface, "destination", "commit_mode"),
            TeacherGenerated: false,
            AuthorizationEffect: "none");

    private static void RemoveBusinessKeys(JsonNode? node)
    {
        if (node is JsonObject obj)
        {
            foreach (string key in new[]
            {
                "source_kind", "source_entity_kind", "source_entity_id",
                "source_definition_id", "source_card_entity_id", "source_card_definition_id",
                "purpose", "destination", "destination_pile", "destination_position",
                "overflow_destination", "replacement_card_definition_id", "mutation_kind",
                "commit_mode", "expected_effects", "select_operation", "skip_operation",
                "select_completion_evidence", "skip_completion_evidence", "binding_evidence"
            })
            {
                obj.Remove(key);
            }
            foreach (JsonNode? child in obj.Select(pair => pair.Value).ToArray())
                RemoveBusinessKeys(child);
        }
        else if (node is JsonArray array)
        {
            foreach (JsonNode? child in array)
                RemoveBusinessKeys(child);
        }
    }
}
