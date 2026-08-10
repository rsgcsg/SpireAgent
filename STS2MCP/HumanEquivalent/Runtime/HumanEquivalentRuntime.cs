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

internal sealed record HumanEnvironmentReadResult(
    HumanEnvironmentReadResponse? Read,
    string? ErrorCode,
    string? Detail);

internal sealed record HumanEquivalentLinkedDetailCatalogEntry(
    string Kind,
    string EntityId,
    string VisibilityBasis);

internal sealed record HumanBoundActionProjectionResult(
    HumanEnvironmentBoundActionProjection Projection,
    IReadOnlyDictionary<string, HumanEquivalentNativeBinding> Bindings);

/// <summary>
/// Human-Equivalent observation and delivery runtime. It owns the HE wire,
/// admission and receipt lifecycle and shares only bounded native UI
/// infrastructure with the explicit legacy comparison endpoint.
/// </summary>
internal static partial class HumanEquivalentRuntime
{
    private const int MaxBoundActions = 512;
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
            HumanHostIdentity(bridge.Bridge),
            HumanGameIdentity(bridge.Game),
            HumanSession(bridge.Bridge, bridge.Game).EnvironmentFingerprint,
            new[]
            {
                "activate", "select", "deselect", "confirm", "cancel", "play",
                "target", "use", "end_turn", "skip", "open", "close"
            },
            SnapshotBound: true,
            SingleController: true,
            ExecutionAvailable: bridge.Game.Compatibility.StateObservationAllowed,
            new HumanEnvironmentControlPolicy(bridge.ControlCoordination.RecommendedRenewalMs),
            new[]
            {
                "Applied means native UI input was delivered, not that a business transaction settled.",
                "D annotations are outside the C observation and never authorize bound actions.",
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
                request.BoundActionId ?? "invalid",
                "activate",
                null,
                Array.Empty<HumanEnvironmentBoundActionArgument>(),
                "not_applied",
                "not_applied",
                "invalid_request_id",
                "A bounded non-empty request_id is required.",
                null,
                null);
        }
        string fingerprint = BridgeHash.Object(new
        {
            request.ExpectedSnapshotId,
            request.BoundActionId,
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
                    request.BoundActionId ?? "invalid",
                    "activate",
                    null,
                    Array.Empty<HumanEnvironmentBoundActionArgument>(),
                    "not_applied",
                    "not_applied",
                    "request_id_conflict",
                    "request_id was already used with a different exact action.",
                    null,
                    null);
            }

            HumanEquivalentRuntimeSnapshot snapshot = BuildHumanEquivalentSnapshot();
            string boundActionId = request.BoundActionId ?? string.Empty;
            HumanEnvironmentBoundAction? boundAction = snapshot.Observation.BoundActions.Actions
                .SingleOrDefault(candidate => string.Equals(
                    candidate.BoundActionId,
                    boundActionId,
                    StringComparison.Ordinal));
            HumanEquivalentNativeBinding? binding = boundAction == null
                || !snapshot.Bindings.TryGetValue(boundActionId, out HumanEquivalentNativeBinding? found)
                    ? null
                    : found;
            parameters = binding?.Parameters
                ?? new Dictionary<string, string>(StringComparer.Ordinal);
            string action = boundAction?.Action ?? "activate";
            string? subjectRef = boundAction?.SubjectRef;
            IReadOnlyList<HumanEnvironmentBoundActionArgument> arguments =
                boundAction?.Arguments ?? Array.Empty<HumanEnvironmentBoundActionArgument>();

            HumanRequestFingerprints[requestId] = fingerprint;
            HumanEquivalentActionReceipt Fail(string code, string detail)
            {
                HumanEquivalentActionReceipt failed = HumanReceipt(
                    requestId,
                    boundActionId,
                    action,
                    subjectRef,
                    arguments,
                    "not_applied",
                    "not_applied",
                    code,
                    detail,
                    snapshot.Observation,
                    null);
                HumanReceipts[requestId] = failed;
                return failed;
            }

            if (!string.Equals(snapshot.Observation.SnapshotId, request.ExpectedSnapshotId, StringComparison.Ordinal))
            {
                return Fail(
                    "stale_snapshot",
                    "The exact Human-Equivalent snapshot changed; obtain a fresh observation.");
            }
            if (snapshot.Observation.BoundActions.Status != "complete")
                return Fail("bound_action_projection_incomplete", "The finite bound-action projection is not complete and cannot authorize input.");
            if (boundAction == null || binding == null)
                return Fail("bound_action_not_current", "The exact advertised bound action is no longer current.");
            var bridgeRequest = new BridgeCommandRequest(requestId, request.ExpectedSnapshotId, boundActionId)
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
                    boundActionId,
                    action,
                    subjectRef,
                    arguments,
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
                boundActionId,
                action,
                subjectRef,
                arguments,
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

    public static HumanEnvironmentReadResult ReadHumanEquivalent(
        string readId,
        string expectedSnapshotId)
    {
        HumanEquivalentRuntimeSnapshot snapshot =
            BuildHumanEquivalentSnapshot();
        HumanEquivalentObservationResponse observation = snapshot.Observation;
        if (!string.Equals(observation.SnapshotId, expectedSnapshotId, StringComparison.Ordinal))
        {
            return new HumanEnvironmentReadResult(
                null,
                "stale_state",
                "The expected snapshot is no longer current; obtain a fresh Human Environment observation.");
        }
        HumanEnvironmentReadOpportunity? opportunity = observation.Reads.SingleOrDefault(entry =>
            string.Equals(entry.ReadId, readId, StringComparison.Ordinal));
        if (opportunity == null)
        {
            return new HumanEnvironmentReadResult(
                null,
                "read_not_available",
                "This read is not in the current player-visible read catalog.");
        }

        if (opportunity.TargetReferentId != null)
            return ReadLinkedHumanDetail(snapshot, opportunity, expectedSnapshotId);

        BridgeInspectionBuildResult built = BridgeInspectionBuilder.Build(
            opportunity.Kind,
            snapshot.Draft.Context,
            Entities);
        if (built.Draft == null)
            return new HumanEnvironmentReadResult(null, built.ErrorCode, built.Detail);

        BridgeInspectionDraft draft = built.Draft;
        return new HumanEnvironmentReadResult(
            new HumanEnvironmentReadResponse(
                HumanEquivalentContract.ProtocolVersion,
                HumanEquivalentContract.ReadSchema,
                readId,
                expectedSnapshotId,
                observation.SnapshotId,
                DateTimeOffset.UtcNow,
                draft.Kind,
                null,
                opportunity.VisibilityBasis,
                draft.OrderingSemantics,
                ReadContentSchema(draft.Kind),
                JsonSerializer.SerializeToNode(draft.Content, draft.Content.GetType(), McpMod._jsonOptions) ?? new JsonObject(),
                HumanCompleteness(draft.Completeness, Array.Empty<string>()),
                observation.Session,
                observation.ObservationPolicy),
            null,
            null);
    }

    private static HumanEnvironmentReadResult ReadLinkedHumanDetail(
        HumanEquivalentRuntimeSnapshot snapshot,
        HumanEnvironmentReadOpportunity opportunity,
        string expectedSnapshotId)
    {
        HumanEquivalentObservationResponse observation = snapshot.Observation;
        if (!string.Equals(opportunity.Kind, "surface_card", StringComparison.Ordinal)
            || opportunity.TargetReferentId == null)
        {
            return new HumanEnvironmentReadResult(
                null,
                "read_kind_not_implemented",
                "This current read kind has no bounded Live host implementation.");
        }
        string referentId = opportunity.TargetReferentId;
        VisibleCard? card = HumanSurfaceCards(snapshot.Draft.Surface)
            .FirstOrDefault(value => string.Equals(
                value.EntityId,
                referentId,
                StringComparison.Ordinal));
        if (card == null)
        {
            return new HumanEnvironmentReadResult(
                null,
                "read_binding_failed",
                "The current card detail could not be rebuilt from the same UI Surface.");
        }

        return new HumanEnvironmentReadResult(
            new HumanEnvironmentReadResponse(
                HumanEquivalentContract.ProtocolVersion,
                HumanEquivalentContract.ReadSchema,
                opportunity.ReadId,
                expectedSnapshotId,
                observation.SnapshotId,
                DateTimeOffset.UtcNow,
                opportunity.Kind,
                referentId,
                opportunity.VisibilityBasis,
                opportunity.OrderingSemantics,
                opportunity.ContentSchema,
                JsonSerializer.SerializeToNode(card, McpMod._jsonOptions) ?? new JsonObject(),
                new HumanEnvironmentCompleteness(
                    "complete",
                    "complete_current_player_visible_card_detail",
                    "read_only",
                    Array.Empty<string>(),
                    Array.Empty<string>()),
                observation.Session,
                observation.ObservationPolicy),
            null,
            null);
    }

    private static HumanEquivalentRuntimeSnapshot BuildHumanEquivalentSnapshot()
    {
        GameBuildIdentity game = BridgeV2Runtime.ReadCurrentGameIdentity();
        BridgeObservationDraft? sourceFreeSurface =
            HumanGeneratedCardChoiceAdapter.TryBuild(Entities, game)
            ?? HumanCombatPileSelectionAdapter.TryBuild(Entities, game)
            ?? HumanDeckCardSelectionAdapter.TryBuild(Entities, game)
            ?? HumanRestSiteAdapter.TryBuild(Entities, game);
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
        JsonNode surfaceContent = ProjectHumanFacts(draft.Surface, draft.Context);
        IReadOnlyList<ConnectorV3BoundCommand> nativeBindings =
            BuildHumanEquivalentBindings(draft);
        string interactionId = ReadFirstString(
            rawSurface,
            "screen_entity_id",
            "room_entity_id",
            "hand_entity_id",
            "map_screen_entity_id")
            ?? nativeBindings.SelectMany(item => item.Candidate.EntityBindings)
                .FirstOrDefault(entity => IsOwnerRole(entity.Role))?.EntityId
            ?? "interaction_" + BridgeHash.Object(new { draft.Surface.Kind, draft.Signature })[..20];
        Dictionary<string, HumanEnvironmentReferent> referents = BuildHumanReferents(
            surfaceContent,
            draft.Surface,
            nativeBindings,
            rawSurface);
        IReadOnlyList<HumanEnvironmentInteractionCapability> capabilities =
            ProjectInteractionCapabilities(nativeBindings);
        HumanBoundActionProjectionResult projected =
            ProjectBoundActions(nativeBindings, interactionId, referents);
        string stage = ReadFirstString(rawSurface, "stage") ?? draft.Readiness;
        string? prompt = ReadFirstString(rawSurface, "prompt", "body", "message");
        IReadOnlyList<HumanEnvironmentReadOpportunity> reads = inspections
            .Select(entry => new HumanEnvironmentReadOpportunity(
                $"read:{entry.Kind}",
                entry.Kind,
                null,
                ReadContentSchema(entry.Kind),
                entry.VisibilityBasis,
                SnapshotBound: true,
                entry.OrderingSemantics,
                entry.HiddenByPolicy))
            .Concat(linkedDetails.Select(entry => new HumanEnvironmentReadOpportunity(
                $"read:{entry.Kind}:{entry.EntityId}",
                entry.Kind,
                entry.EntityId,
                ReadContentSchema(entry.Kind),
                entry.VisibilityBasis,
                SnapshotBound: true,
                "single_entity",
                Array.Empty<string>())))
            .OrderBy(read => read.ReadId, StringComparer.Ordinal)
            .ToArray();
        string signature = BridgeHash.Object(new
        {
            game.Version,
            game.Commit,
            shared.State,
            draft.Readiness,
            surface = surfaceContent,
            interactionId,
            referents = referents.Values.OrderBy(item => item.ReferentId, StringComparer.Ordinal).ToArray(),
            authority = CanonicalAuthoritySignature(nativeBindings),
            reads,
            visibility.HiddenByPolicy
        });
        (string snapshotId, long sequence) = HumanStateIdentity.Observe(signature);
        bool visibleUnsupported = draft.Surface is UnsupportedSurface;
        string status = projected.Projection.TotalCount > 0
            ? "interactive"
            : visibleUnsupported ? "visible_unsupported" : draft.Readiness == "settling" ? "settling" : "observed";
        var observation = new HumanEquivalentObservationResponse(
            HumanEquivalentContract.ProtocolVersion,
            HumanEquivalentContract.ObservationSchema,
            snapshotId,
            sequence,
            DateTimeOffset.UtcNow,
            status,
            shared.State == null
                ? null
                : new HumanEnvironmentContent(
                    "sts2.human-environment/persistent/run-player-1",
                    JsonSerializer.SerializeToNode(shared.State, McpMod._jsonOptions) ?? new JsonObject()),
            new HumanEnvironmentInteraction(
                interactionId,
                draft.Surface.Kind,
                stage,
                prompt,
                SurfaceContentSchema(draft.Surface.Kind),
                surfaceContent,
                capabilities),
            referents.Values.OrderBy(item => item.ReferentId, StringComparer.Ordinal).ToArray(),
            projected.Projection,
            reads,
            HumanCompleteness(
                draft.Completeness,
                visibility.HiddenByPolicy,
                visibleUnsupported ? "visible_unmapped" : null),
            HumanSession(BridgeV2Runtime.ReadBridgeIdentity(), game),
            HumanObservationPolicy(BridgeV2Runtime.ReadObservationPolicy()));
        return new HumanEquivalentRuntimeSnapshot(
            observation,
            draft,
            projected.Bindings);
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
                "normal_player_visible_surface_card"))
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
        if (snapshot.Draft.Surface is RestSiteSurface restSite)
        {
            return HumanRestSiteAdapter.Start(
                Entities,
                restSite,
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
            RestSiteSurface restSite =>
                HumanRestSiteAdapter.DescribeCommands(restSite),
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

    internal static HumanBoundActionProjectionResult ProjectBoundActions(
            IReadOnlyList<ConnectorV3BoundCommand> bindings,
            string interactionId,
            IReadOnlyDictionary<string, HumanEnvironmentReferent> visibleReferents)
    {
        var actions = new List<HumanEnvironmentBoundAction>();
        var exactBindings = new Dictionary<string, HumanEquivalentNativeBinding>(StringComparer.Ordinal);
        long totalCount = 0;
        foreach (ConnectorV3BoundCommand binding in bindings
            .OrderBy(item => item.Candidate.CandidateId, StringComparer.Ordinal))
        {
            totalCount = SaturatingAdd(totalCount, CountParameterCombinations(binding.Candidate));
            int remaining = MaxBoundActions - actions.Count;
            if (remaining <= 0)
                continue;
            foreach (IReadOnlyDictionary<string, string> parameters in ExpandParameters(binding.Candidate, remaining))
            {
                IReadOnlyList<HumanEnvironmentBoundActionArgument> publicBindings =
                    PublicBoundActionBindings(binding.Candidate, parameters, visibleReferents);
                int subjectIndex = SubjectBindingIndex(binding.Candidate.Command, publicBindings);
                string? subjectRef = subjectIndex < 0
                    ? null
                    : publicBindings[subjectIndex].ReferentId;
                HumanEnvironmentBoundActionArgument[] arguments = publicBindings
                    .Where((_, index) => index != subjectIndex)
                    .ToArray();
                string action = GenericAction(binding.Candidate.Command, binding.Candidate.Operation);
                string boundActionId = "bound_action_" + BridgeHash.Object(new
                {
                    binding.Candidate.CandidateId,
                    binding.Candidate.Command,
                    action,
                    interactionId,
                    subjectRef,
                    arguments,
                    parameters = parameters.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray()
                })[..20];
                string label = BoundActionLabel(binding.Candidate.Label, arguments, visibleReferents);
                var projected = new HumanEnvironmentBoundAction(
                        boundActionId,
                        action,
                        interactionId,
                        subjectRef,
                        arguments,
                        label);
                if (exactBindings.TryAdd(
                    boundActionId,
                    new HumanEquivalentNativeBinding(binding, parameters)))
                {
                    actions.Add(projected);
                }
            }
        }
        string status = totalCount == actions.Count ? "complete" : "truncated";
        return new HumanBoundActionProjectionResult(
            new HumanEnvironmentBoundActionProjection(
                "sts2.human-environment/bound-actions-1",
                status,
                actions.Count,
                totalCount,
                MaxBoundActions,
                "candidate_id_then_operand_name_then_referent_id",
                actions),
            exactBindings);
    }

    private static IReadOnlyList<HumanEnvironmentInteractionCapability>
        ProjectInteractionCapabilities(IReadOnlyList<ConnectorV3BoundCommand> bindings) =>
        bindings
            .Where(binding => CountParameterCombinations(binding.Candidate) > 0)
            .Select(binding =>
            {
                string[] roles = PublicParameterRoles(binding.Candidate).ToArray();
                int subjectIndex = SubjectRoleIndex(binding.Candidate.Command, roles);
                return new HumanEnvironmentInteractionCapability(
                    GenericAction(binding.Candidate.Command, binding.Candidate.Operation),
                    subjectIndex < 0 ? null : roles[subjectIndex],
                    roles.Where((_, index) => index != subjectIndex)
                        .Select(role => new HumanEnvironmentCapabilityArgument(role, Required: true))
                        .ToArray(),
                    "current_native_interaction");
            })
            .GroupBy(value => BridgeHash.Object(value), StringComparer.Ordinal)
            .Select(group => group.First())
            .OrderBy(value => value.Action, StringComparer.Ordinal)
            .ThenBy(value => value.SubjectRole, StringComparer.Ordinal)
            .ToArray();

    private static IEnumerable<string> PublicParameterRoles(ConnectorV3CommandCandidate candidate)
    {
        IEnumerable<string> names = candidate.Operands.Keys.Concat(candidate.OperandDomains.Keys)
            .Where(name => name.EndsWith("_id", StringComparison.Ordinal)
                && !IsPrivateBindingParameter(name))
            .Distinct(StringComparer.Ordinal);
        foreach (string name in names.OrderBy(value => value, StringComparer.Ordinal))
        {
            IEnumerable<string> values = candidate.Operands.TryGetValue(name, out string? fixedValue)
                ? new[] { fixedValue }
                : candidate.OperandDomains.TryGetValue(name, out ConnectorV3OperandDomain? domain)
                    ? domain.EntityIds
                    : Array.Empty<string>();
            ActionEntityBinding? entityBinding = candidate.EntityBindings.FirstOrDefault(item =>
                values.Contains(item.EntityId, StringComparer.Ordinal)
                && !IsOwnerRole(item.Role)
                && !IsPrivateBindingRole(item.Role));
            yield return PublicRole(entityBinding?.Role ?? name);
        }
    }

    internal static long CountParameterCombinations(ConnectorV3CommandCandidate candidate)
    {
        long count = 1;
        foreach (ConnectorV3OperandDomain domain in candidate.OperandDomains.Values)
        {
            if (domain.EntityIds.Count == 0)
                return 0;
            if (count > long.MaxValue / domain.EntityIds.Count)
                return long.MaxValue;
            count *= domain.EntityIds.Count;
        }
        return count;
    }

    private static long SaturatingAdd(long left, long right) =>
        left > long.MaxValue - right ? long.MaxValue : left + right;

    internal static string CanonicalAuthoritySignature(
        IReadOnlyList<ConnectorV3BoundCommand> bindings) => BridgeHash.Object(
        bindings.Select(binding => new
        {
            binding.Candidate.CandidateId,
            binding.Candidate.Command,
            binding.Candidate.Operation,
            Operands = binding.Candidate.Operands.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray(),
            Domains = binding.Candidate.OperandDomains
                .OrderBy(pair => pair.Key, StringComparer.Ordinal)
                .Select(pair => new
                {
                    pair.Key,
                    pair.Value.Kind,
                    EntityIds = pair.Value.EntityIds.OrderBy(value => value, StringComparer.Ordinal).ToArray()
                }).ToArray(),
            EntityBindings = binding.Candidate.EntityBindings
                .OrderBy(value => value.Role, StringComparer.Ordinal)
                .ThenBy(value => value.EntityId, StringComparer.Ordinal)
                .Select(value => new { value.Role, value.EntityId })
                .ToArray(),
            binding.Candidate.BindingKind,
            binding.Candidate.AuthorityState
        }).OrderBy(value => value.CandidateId, StringComparer.Ordinal).ToArray());

    private static Dictionary<string, HumanEnvironmentReferent> BuildHumanReferents(
        JsonNode surfaceContent,
        IBridgeSurface surface,
        IReadOnlyList<ConnectorV3BoundCommand> bindings,
        JsonNode rawSurface)
    {
        var referents = ProjectFactReferents(surfaceContent);
        foreach (VisibleCard card in HumanSurfaceCards(surface))
        {
            AddHumanReferent(
                referents,
                card.EntityId,
                "card",
                "entity",
                card.Name ?? card.DefinitionId,
                IsSelected(rawSurface, card.EntityId),
                JsonSerializer.SerializeToNode(card, McpMod._jsonOptions));
        }
        foreach (ActionEntityBinding binding in bindings.SelectMany(item => item.Candidate.EntityBindings))
        {
            if (IsOwnerRole(binding.Role) || IsPrivateBindingRole(binding.Role))
                continue;
            AddHumanReferent(
                referents,
                binding.EntityId,
                PublicRole(binding.Role),
                "control",
                null,
                null,
                null,
                enabled: true,
                observationBasis: "native_ui_actionability");
        }
        return referents;
    }

    internal static Dictionary<string, HumanEnvironmentReferent> ProjectFactReferents(
        JsonNode surfaceContent)
    {
        var referents = new Dictionary<string, HumanEnvironmentReferent>(StringComparer.Ordinal);
        CollectHumanReferents(surfaceContent, null, referents);
        return referents;
    }

    private static void CollectHumanReferents(
        JsonNode? node,
        string? parentKey,
        Dictionary<string, HumanEnvironmentReferent> referents)
    {
        if (node is JsonObject obj)
        {
            foreach ((string key, JsonNode? value) in obj)
            {
                if (value?.GetValueKind() == JsonValueKind.String
                    && IsVisibleReferentField(key))
                {
                    AddHumanReferent(
                        referents,
                        value.GetValue<string>(),
                        ReferentRole(key, parentKey),
                        "entity",
                        ReadFirstString(obj, "name", "label", "title", "definition_id"),
                        ReadOptionalBool(obj, "is_selected", "selected"),
                        obj.DeepClone(),
                        ReadOptionalBool(obj, "enabled", "is_enabled"));
                }
                else if (value is JsonArray ids && IsVisibleReferentArray(key))
                {
                    foreach (JsonNode? id in ids)
                    {
                        if (id?.GetValueKind() == JsonValueKind.String)
                        {
                            AddHumanReferent(
                                referents,
                                id.GetValue<string>(),
                                ReferentRole(key, parentKey),
                                "entity",
                                null,
                                null,
                                null);
                        }
                    }
                }
                CollectHumanReferents(value, key, referents);
            }
        }
        else if (node is JsonArray array)
        {
            foreach (JsonNode? value in array)
                CollectHumanReferents(value, parentKey, referents);
        }
    }

    private static void AddHumanReferent(
        Dictionary<string, HumanEnvironmentReferent> referents,
        string referentId,
        string role,
        string kind,
        string? label,
        bool? selected,
        JsonNode? properties,
        bool? enabled = null,
        string observationBasis = "native_visible_fact")
    {
        if (string.IsNullOrWhiteSpace(referentId))
            return;
        bool hasProperties = properties is JsonObject { Count: > 1 };
        if (referents.TryGetValue(referentId, out HumanEnvironmentReferent? existing)
            && (!hasProperties || existing.Properties != null))
            return;
        string safeRole = SchemaToken(role);
        referents[referentId] = new HumanEnvironmentReferent(
            referentId,
            safeRole,
            kind,
            label ?? existing?.Label,
            new HumanEnvironmentReferentState(
                Visible: true,
                Enabled: enabled ?? existing?.State.Enabled,
                Selected: selected ?? existing?.State.Selected,
                Focused: existing?.State.Focused,
                ObservationBasis: observationBasis),
            hasProperties ? ReferentPropertiesSchema(safeRole) : null,
            hasProperties ? properties : null);
    }

    private static IReadOnlyList<HumanEnvironmentBoundActionArgument> PublicBoundActionBindings(
        ConnectorV3CommandCandidate candidate,
        IReadOnlyDictionary<string, string> parameters,
        IReadOnlyDictionary<string, HumanEnvironmentReferent> visibleReferents)
    {
        var result = new List<HumanEnvironmentBoundActionArgument>();
        foreach ((string name, string value) in parameters)
        {
            if (!name.EndsWith("_id", StringComparison.Ordinal) || IsPrivateBindingParameter(name))
                continue;
            ActionEntityBinding? entityBinding = candidate.EntityBindings.FirstOrDefault(item =>
                string.Equals(item.EntityId, value, StringComparison.Ordinal)
                && !IsOwnerRole(item.Role)
                && !IsPrivateBindingRole(item.Role));
            if (entityBinding == null && !visibleReferents.ContainsKey(value))
                continue;
            string role = PublicRole(entityBinding?.Role ?? name);
            if (!result.Any(item => string.Equals(item.Role, role, StringComparison.Ordinal)
                && string.Equals(item.ReferentId, value, StringComparison.Ordinal)))
            {
                result.Add(new HumanEnvironmentBoundActionArgument(role, value));
            }
        }
        return result;
    }

    private static int SubjectBindingIndex(
        string command,
        IReadOnlyList<HumanEnvironmentBoundActionArgument> bindings)
    {
        return SubjectRoleIndex(command, bindings.Select(item => item.Role).ToArray());
    }

    private static int SubjectRoleIndex(string command, IReadOnlyList<string> roles)
    {
        if (roles.Count == 0)
            return -1;
        string[] preferred = command switch
        {
            "play_card" => new[] { "card" },
            "use_potion" => new[] { "potion" },
            "select_entity" or "deselect_entity" => new[] { "card", "option", "item", "entity" },
            "purchase" => new[] { "item", "card", "relic", "potion" },
            "navigate" => new[] { "map_choice", "node" },
            "choose" => new[] { "option", "choice", "card", "reward" },
            _ => Array.Empty<string>()
        };
        foreach (string role in preferred)
        {
            int index = roles.ToList().FindIndex(item => item.Contains(role, StringComparison.Ordinal));
            if (index >= 0)
                return index;
        }
        int nonTarget = roles.ToList().FindIndex(item => item != "target");
        return nonTarget >= 0 ? nonTarget : 0;
    }

    private static string BoundActionLabel(
        string label,
        IReadOnlyList<HumanEnvironmentBoundActionArgument> arguments,
        IReadOnlyDictionary<string, HumanEnvironmentReferent> referents)
    {
        HumanEnvironmentBoundActionArgument? target = arguments.FirstOrDefault(item => item.Role == "target");
        if (target == null
            || !referents.TryGetValue(target.ReferentId, out HumanEnvironmentReferent? referent)
            || string.IsNullOrWhiteSpace(referent.Label)
            || label.Contains(referent.Label, StringComparison.Ordinal))
            return label;
        return $"{label} -> {referent.Label}";
    }

    private static IEnumerable<IReadOnlyDictionary<string, string>> ExpandParameters(
        ConnectorV3CommandCandidate candidate,
        int limit)
    {
        var current = new List<Dictionary<string, string>>
        {
            new(candidate.Operands, StringComparer.Ordinal)
        };
        foreach ((string name, ConnectorV3OperandDomain domain) in candidate.OperandDomains
            .OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            current = current.SelectMany(parameters => domain.EntityIds
                .OrderBy(entityId => entityId, StringComparer.Ordinal)
                .Select(entityId =>
            {
                var expanded = new Dictionary<string, string>(parameters, StringComparer.Ordinal)
                {
                    [name] = entityId
                };
                return expanded;
            })).Take(limit).ToList();
        }
        return current;
    }

    private static HumanEquivalentActionReceipt HumanReceipt(
        string requestId,
        string boundActionId,
        string action,
        string? subjectRef,
        IReadOnlyList<HumanEnvironmentBoundActionArgument> arguments,
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
            delivery,
            new HumanEquivalentActionSummary(boundActionId, action, subjectRef, arguments),
            reasonCode,
            detail,
            new HumanEquivalentRetryPolicy(
                status == "not_applied",
                status == "unknown" ? "unknown_delivery_never_retry" : "fresh_snapshot_required"),
            successor)
        {
            Attribution = attribution == null ? null : HumanAttribution(attribution)
        };

    private static HumanEnvironmentHostIdentity HumanHostIdentity(BridgeServerIdentity identity) => new(
        HumanEquivalentContract.GatewayId,
        HumanEquivalentContract.GatewayName,
        identity.Version,
        identity.RuntimeInstanceId,
        "live_ui",
        new HumanEnvironmentImplementationIdentity(
            identity.UpstreamCommit,
            identity.ModuleVersionId,
            identity.AssemblyFileSha256));

    private static HumanEnvironmentGameIdentity HumanGameIdentity(GameBuildIdentity game)
    {
        ModsetIdentity? modset = game.Modset;
        return new HumanEnvironmentGameIdentity(
            game.Version,
            game.Commit,
            game.Branch,
            game.MainAssemblyHash,
            new HumanEnvironmentCompatibility(
                game.Compatibility.Status,
                game.Compatibility.StateObservationAllowed,
                game.Compatibility.Detail),
            new HumanEnvironmentModset(
                modset?.Status ?? "unavailable",
                modset?.Fingerprint ?? "unavailable",
                modset?.FingerprintScope ?? "unavailable",
                modset?.Mods.Select(item => item.Id)
                    .OrderBy(id => id, StringComparer.Ordinal)
                    .ToArray() ?? Array.Empty<string>(),
                modset?.Detail ?? "No loaded Modset identity was available."));
    }

    private static HumanEnvironmentSessionReference HumanSession(
        BridgeServerIdentity identity,
        GameBuildIdentity game) => new(
            identity.RuntimeInstanceId,
            BridgeHash.Object(new
            {
                identity.AssemblyFileSha256,
                identity.ModuleVersionId,
                game.Version,
                game.Commit,
                game.MainAssemblyHash,
                Modset = game.Modset?.Fingerprint
            }));

    private static HumanEnvironmentObservationPolicy HumanObservationPolicy(
        ObservationPolicyInfo policy) => new(
            policy.Id,
            policy.Scope,
            policy.IncludesHiddenInformation,
            policy.UnknownFieldBehavior);

    private static HumanEnvironmentAttribution HumanAttribution(
        BridgeCommandAttribution value) => new(
            value.RuntimeInstanceId,
            value.ClientSessionId,
            value.ClientInstanceId,
            value.ProductId,
            value.ProductName,
            value.ProductVersion,
            value.ControllerLeaseId,
            value.ControllerGeneration);

    private static HumanEnvironmentCompleteness HumanCompleteness(
        StateCompleteness completeness,
        IReadOnlyList<string> hiddenByPolicy,
        string? forcedStatus = null) => new(
            forcedStatus ?? (completeness.Missing.Count == 0 ? "complete" : "partial"),
            completeness.PlayerVisibleSemantics,
            completeness.LegalActions,
            completeness.Missing,
            hiddenByPolicy);

    private static HumanEnvironmentCompleteness HumanCompleteness(
        InspectionCompleteness completeness,
        IReadOnlyList<string> hiddenByPolicy) => new(
            completeness.Missing.Count == 0 ? "complete" : "partial",
            completeness.PlayerVisibleSemantics,
            "read_only",
            completeness.Missing,
            hiddenByPolicy);

    private static string SurfaceContentSchema(string surfaceKind) =>
        $"sts2.human-environment/surface/{surfaceKind}-1";

    private static string ReferentPropertiesSchema(string role) =>
        $"sts2.human-environment/referent/{role}-1";

    private static string ReadContentSchema(string kind) =>
        $"sts2.human-environment/read/{kind}-1";

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

    private static bool IsPrivateBindingRole(string role) =>
        IsOwnerRole(role)
        || role.Contains("source", StringComparison.Ordinal)
        || role.Contains("annotation_input", StringComparison.Ordinal)
        || role is "dialogue_line";

    private static bool IsPrivateBindingParameter(string name) =>
        name is "screen_id" or "room_id" or "hand_id" or "source_id" or "control_id"
            or "menu_screen_id" or "game_over_screen_id" or "map_screen_id"
            or "map_annotation_input_id" or "dialogue_line_id"
        || name.EndsWith("_screen_id", StringComparison.Ordinal)
        || name.EndsWith("_room_id", StringComparison.Ordinal);

    private static string PublicRole(string role)
    {
        string normalized = role.EndsWith("_id", StringComparison.Ordinal)
            ? role[..^3]
            : role;
        return normalized switch
        {
            "map_node" or "destination" => "destination",
            "character_choice" => "character",
            "rest_option" or "option" or "choice" or "alternative" => "option",
            "shop_offer" => "offer",
            "shop_card_removal" => "service",
            _ => SchemaToken(normalized)
        };
    }

    private static bool IsVisibleReferentField(string key) =>
        (key == "entity_id" || key.EndsWith("_entity_id", StringComparison.Ordinal))
        && !key.Contains("screen", StringComparison.Ordinal)
        && !key.Contains("room", StringComparison.Ordinal)
        && !key.Contains("source", StringComparison.Ordinal)
        && !key.Contains("owner", StringComparison.Ordinal)
        && !key.Contains("hand", StringComparison.Ordinal);

    private static bool IsVisibleReferentArray(string key) =>
        key.EndsWith("_entity_ids", StringComparison.Ordinal)
        && !key.Contains("screen", StringComparison.Ordinal)
        && !key.Contains("source", StringComparison.Ordinal)
        && !key.Contains("owner", StringComparison.Ordinal);

    private static string ReferentRole(string key, string? parentKey)
    {
        string role = key == "entity_id"
            ? "entity"
            : key.EndsWith("_entity_ids", StringComparison.Ordinal)
            ? key[..^11]
            : key.EndsWith("_entity_id", StringComparison.Ordinal)
                ? key[..^10]
                : key;
        if (role is "selectable_card" or "deselectable_card" or "selected_card")
            return "card";
        if (role is "target" or "targetable_enemy")
            return "target";
        if (role is "entity" && !string.IsNullOrWhiteSpace(parentKey))
            role = SingularRole(parentKey);
        return PublicRole(role);
    }

    private static string SingularRole(string value) => value switch
    {
        "enemies" => "enemy",
        "characters" => "character",
        "cards" => "card",
        "options" or "choices" or "next_options" => "option",
        "nodes" => "node",
        "rewards" => "reward",
        "offers" => "offer",
        "potions" => "potion",
        "relics" => "relic",
        _ => value.EndsWith('s') ? value[..^1] : value
    };

    private static string SchemaToken(string value)
    {
        char[] token = value
            .ToLowerInvariant()
            .Select(character => char.IsLetterOrDigit(character) || character == '_'
                ? character
                : '_')
            .ToArray();
        string normalized = new string(token).Trim('_');
        return string.IsNullOrWhiteSpace(normalized) ? "entity" : normalized;
    }

    private static bool? ReadOptionalBool(JsonObject obj, params string[] keys)
    {
        foreach (string key in keys)
        {
            if (obj[key]?.GetValueKind() == JsonValueKind.True)
                return true;
            if (obj[key]?.GetValueKind() == JsonValueKind.False)
                return false;
        }
        return null;
    }

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
