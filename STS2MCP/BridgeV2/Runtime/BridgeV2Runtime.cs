using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal sealed record BridgeInspectionReadResult(
    BridgeInspectionResponse? Inspection,
    string? ErrorCode,
    string? Detail);

internal sealed record BridgeObservationBundleReadResult(
    BridgeObservationBundleResponse? Bundle,
    string? ErrorCode,
    string? Detail);

internal static class BridgeV2Runtime
{
    public const int CommandOutcomeTimeoutMs = 10_000;

    private static readonly object Gate = new();
    private static readonly BridgeEntityRegistry EntityRegistry = new();
    private static readonly BridgeStateIdentityTracker StateIdentity = new();
    private static readonly BridgeCommandLedger CommandLedger = new(CommandOutcomeTimeoutMs);
    private static readonly Dictionary<string, RegisteredBridgeAction> Actions = new(StringComparer.Ordinal);
    private static readonly string RuntimeInstanceId = Guid.NewGuid().ToString("N");

    internal static GameBuildIdentity ReadCurrentGameIdentity()
    {
        GameBuildIdentity game = BridgeGameIdentity.Read();
        CompatibilityAssessment compatibility = BridgeContractManifest.WithExplicitActionScopes(
            game.Compatibility);
        if (BridgeAssemblyIdentity.LoadedAssemblySha256 == null)
        {
            compatibility = compatibility with
            {
                Status = "bridge_artifact_identity_unavailable",
                ActionExecutionAllowed = false,
                InspectionAllowed = false,
                ActionExecutionSurfaceKinds = Array.Empty<string>(),
                ActionCanarySurfaceKinds = Array.Empty<string>(),
                InspectionAllowedKinds = Array.Empty<string>(),
                InspectionCanaryKinds = Array.Empty<string>(),
                ActionPermissionScopes = Array.Empty<ActionPermissionScope>(),
                Detail = $"{compatibility.Detail} The loaded Gateway assembly digest is unavailable; action and Inspection authority fail closed."
            };
        }

        return game with { Compatibility = compatibility };
    }

    public static BridgeCapabilitiesResponse GetCapabilities()
    {
        GameBuildIdentity game = ReadCurrentGameIdentity();
        var warnings = new List<string>
        {
            "Bridge v2 is an incremental preview. Unlisted surfaces fail closed with no legal actions.",
            "Capabilities distinguish historically implemented surfaces from the exact current-build qualified and canary lists. Only the explicit current-build lists may own actions.",
            "Run-deck and combat-pile inspections are read-only evidence. They do not grant action authority or enter the command ledger."
        };

        if (!game.Compatibility.ActionExecutionAllowed || !game.Compatibility.InspectionAllowed)
            warnings.Add(game.Compatibility.Detail);

        IReadOnlyList<SurfaceCapability> surfaces = BridgeContractManifest.Capabilities(game.Compatibility);

        return new BridgeCapabilitiesResponse(
            BridgeV2Contract.ProtocolVersion,
            BridgeIdentity(),
            game,
            ObservationPolicy(),
            new SharedStateContractCapability(
                "implemented_read_only_current_build",
                "active_single_player_run_hud",
                CreatesActionAuthority: false,
                IncludedInStateIdentity: true,
                IncludedFacts: new[]
                {
                    "act_floor_ascension", "visible_bosses", "run_modifiers",
                    "local_player_identity_hp_gold", "relics", "potions_and_capacity"
                },
                ExcludedFacts: new[]
                {
                    "deck_contents_use_inspection", "hidden_rng", "draw_order",
                    "future_events", "future_rewards", "run_timer"
                }),
            surfaces,
            new CommandContractCapability(
                OpaqueActionsOnly: true,
                StateBound: true,
                IdempotentRequestIds: true,
                LifecycleStates: new[]
                {
                    "received", "validated", "started", "completed", "rejected", "failed", "timed_out"
                },
                OutcomeTimeoutMs: CommandOutcomeTimeoutMs),
            new InspectionContractCapability(
                Status: BridgeSurfacePermission.InspectionSupportLevel(
                    game.Compatibility,
                    BridgeContractManifest.ImplementedInspectionKinds),
                StateBound: true,
                ArbitraryQueriesAllowed: false,
                EntersCommandLedger: false,
                VisibilityClasses: new[] { "on_screen", "normal_inspection", "count_only" },
                OrderingSemantics: new[] { "unordered_multiset", "player_sorted", "fixed_ui_slots" },
                ImplementedKinds: AllowedInspectionKinds(game.Compatibility)),
            new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.protocol.incremental_preview",
                    "info",
                    "compatibility",
                    "none",
                    "unknown"),
                BridgeDiagnostics.Create(
                    game.Compatibility.InspectionAllowed
                        ? "bridge.inspection.read_only_enabled"
                        : "bridge.inspection.disabled_for_current_build",
                    "info",
                    "visibility",
                    "none",
                    "unknown",
                    game.Compatibility.InspectionAllowed
                        ? "Advertised inspection kinds are state-bound reads with no command authority."
                        : "Inspection bindings are disabled for the current game build.")
            },
            warnings);
    }

    public static BridgeStateEnvelope Observe()
    {
        GameBuildIdentity game = ReadCurrentGameIdentity();
        BridgeObservationDraft draft = BridgeSnapshotBuilder.Build(EntityRegistry, game);
        BridgeSharedVisibleStateBuildResult shared = draft.Game.Compatibility.StateObservationAllowed
            ? BridgeSharedVisibleStateBuilder.Build(EntityRegistry)
            : new BridgeSharedVisibleStateBuildResult(false, null, null);
        if (shared.RunActive && shared.State == null)
            draft = FailClosedForMissingSharedState(draft, shared.Failure);
        string compositeSignature = BridgeHash.Object(new
        {
            draft.Signature,
            shared.State
        });
        BridgeVisibilityProjection visibility = BridgeVisibilityCatalog.Build(
            draft,
            shared.State != null,
            ShopSurfaceFacts.TryGetCurrent(out _, out _, out _));
        BridgeContractInstanceShadow contractInstanceShadow =
            BridgeContractInstanceShadowBuilder.Build(draft);
        compositeSignature = BridgeHash.Object(new
        {
            compositeSignature,
            visibility.Visibility,
            visibility.InspectionCatalog,
            contractInstanceShadow
        });

        lock (Gate)
        {
            (string stateId, long stateSequence) = StateIdentity.Observe(compositeSignature);

            Actions.Clear();
            var descriptors = new List<LegalAction>(draft.Actions.Count);
            foreach (BridgeActionDraft action in draft.Actions)
            {
                string actionId = "action_" + BridgeHash.Text($"{stateId}|{action.Key}")[..20];
                var descriptor = new LegalAction(
                    actionId,
                    stateId,
                    action.Kind,
                    action.Category,
                    action.Label,
                    "game_ui",
                    action.EvidenceCode,
                    action.EntityBindings ?? Array.Empty<ActionEntityBinding>());
                Actions[actionId] = new RegisteredBridgeAction(descriptor, action.Start);
                descriptors.Add(descriptor);
            }

            return new BridgeStateEnvelope(
                BridgeV2Contract.ProtocolVersion,
                stateId,
                stateSequence,
                DateTimeOffset.UtcNow,
                draft.Readiness,
                shared.State,
                draft.Context,
                draft.Surface,
                draft.AuthorityHandoff,
                descriptors,
                draft.Completeness,
                BridgeIdentity(),
                draft.Game,
                ObservationPolicy(),
                visibility.Visibility,
                visibility.InspectionCatalog,
                contractInstanceShadow,
                BridgeDiagnostics.ForObservation(draft),
                draft.Warnings);
        }
    }

    private static BridgeObservationDraft FailClosedForMissingSharedState(
        BridgeObservationDraft draft,
        BridgeDiagnostic? failure)
    {
        var surface = new UnsupportedSurface(
            "unsupported",
            "shared_visible_state",
            "The active run HUD could not be projected completely; actions are suppressed.");
        var completeness = new StateCompleteness(
            "incomplete_active_run_shared_state",
            "empty_fail_closed",
            draft.Completeness.Sources,
            draft.Completeness.Missing.Append("shared_visible_state").Distinct().ToArray());
        return new BridgeObservationDraft(
            BridgeHash.Object(new { draft.Signature, sharedStateFailure = true }),
            "unsupported",
            draft.Context,
            surface,
            completeness,
            draft.Game,
            draft.Warnings.Append("active_run_shared_visible_state_unavailable").ToArray(),
            Array.Empty<BridgeActionDraft>())
        {
            AuthorityHandoff = new AuthorityHandoff(
                "none_fail_closed",
                null,
                "Bridge v2 cannot grant action authority without the strategy-relevant persistent run HUD."),
            Diagnostics = failure == null
                ? draft.Diagnostics
                : draft.Diagnostics.Append(failure).ToArray()
        };
    }

    public static BridgeCommandResponse Submit(BridgeCommandRequest request)
    {
        BridgeStateEnvelope current = Observe();
        RegisteredBridgeAction? action;
        lock (Gate)
            Actions.TryGetValue(request.ActionId ?? string.Empty, out action);

        return CommandLedger.Submit(request, current.StateId, action);
    }

    public static BridgeCommandResponse? Poll(string requestId)
    {
        BridgeStateEnvelope current = Observe();
        return CommandLedger.Poll(requestId, current.StateId);
    }

    public static BridgeInspectionReadResult Inspect(string kind, string expectedStateId)
    {
        BridgeStateEnvelope current = Observe();
        if (!string.Equals(current.StateId, expectedStateId, StringComparison.Ordinal))
        {
            return new BridgeInspectionReadResult(
                null,
                "stale_state",
                "The expected state is no longer current; obtain a fresh state before inspecting.");
        }
        return BuildInspection(current, kind, expectedStateId);
    }

    public static BridgeObservationBundleReadResult ObserveBundle(BridgeObservationBundleRequest request)
    {
        BridgeStateEnvelope current = Observe();
        if (!string.Equals(current.StateId, request.ExpectedStateId, StringComparison.Ordinal))
        {
            return new BridgeObservationBundleReadResult(
                null,
                "stale_state",
                "The expected state is no longer current; obtain a fresh state before requesting a coherent observation.");
        }

        var inspections = new Dictionary<string, BridgeInspectionResponse>(StringComparer.Ordinal);
        foreach (BridgeObservationBundleInspectionRequest inspectionRequest in request.Inspections ?? Array.Empty<BridgeObservationBundleInspectionRequest>())
        {
            string kind = inspectionRequest.Kind ?? string.Empty;
            BridgeInspectionReadResult result = BuildInspection(current, kind, current.StateId);
            if (result.Inspection == null)
            {
                return new BridgeObservationBundleReadResult(
                    null,
                    result.ErrorCode,
                    result.Detail);
            }
            inspections[kind] = result.Inspection;
        }

        string observationId = "observation_" + BridgeHash.Object(new
        {
            current.StateId,
            inspectionIds = inspections.Values.Select(value => value.InspectionId).OrderBy(value => value, StringComparer.Ordinal).ToArray(),
            current.Bridge.RuntimeInstanceId
        })[..20];
        return new BridgeObservationBundleReadResult(
            new BridgeObservationBundleResponse(
                BridgeV2Contract.ProtocolVersion,
                observationId,
                Coherent: true,
                current,
                inspections,
                BridgeIdentity(),
                current.Game,
                Array.Empty<BridgeDiagnostic>()),
            null,
            null);
    }

    private static BridgeInspectionReadResult BuildInspection(
        BridgeStateEnvelope current,
        string kind,
        string expectedStateId)
    {
        if (!IsInspectionAllowed(current.Game.Compatibility, kind)
            || !current.InspectionCatalog.Any(entry => string.Equals(entry.Kind, kind, StringComparison.Ordinal)))
        {
            return new BridgeInspectionReadResult(
                null,
                "inspection_not_available",
                "This inspection kind is not currently available under the state-bound visibility catalog.");
        }

        BridgeInspectionBuildResult built = BridgeInspectionBuilder.Build(kind, current, EntityRegistry);
        if (built.Draft == null)
            return new BridgeInspectionReadResult(null, built.ErrorCode, built.Detail);

        BridgeInspectionDraft draft = built.Draft;
        string inspectionId = "inspection_" + BridgeHash.Object(new
        {
            current.StateId,
            draft.Kind,
            draft.Content,
            draft.Completeness
        })[..20];
        var response = new BridgeInspectionResponse(
            BridgeV2Contract.ProtocolVersion,
            inspectionId,
            expectedStateId,
            current.StateId,
            DateTimeOffset.UtcNow,
            draft.Kind,
            draft.VisibilityClass,
            draft.OrderingSemantics,
            draft.Content,
            draft.Completeness,
            BridgeIdentity(),
            current.Game,
            ObservationPolicy(),
            Array.Empty<BridgeDiagnostic>());
        return new BridgeInspectionReadResult(response, null, null);
    }

    private static BridgeServerIdentity BridgeIdentity() => new(
        "sts2_mcp_bridge_v2",
        "STS2 Agent Bridge",
        McpMod.Version,
        "20eadebde358a37cca41f8b38728099e6d0d19db",
        typeof(McpMod).Assembly.ManifestModule.ModuleVersionId.ToString("D"),
        RuntimeInstanceId)
    {
        AssemblyFileSha256 = BridgeAssemblyIdentity.LoadedAssemblySha256 ?? string.Empty
    };

    private static IReadOnlyList<string> AllowedInspectionKinds(CompatibilityAssessment compatibility)
        => BridgeSurfacePermission.PermittedInspectionKinds(
            compatibility,
            BridgeContractManifest.ImplementedInspectionKinds);

    private static bool IsInspectionAllowed(CompatibilityAssessment compatibility, string kind) =>
        BridgeSurfacePermission.IsInspectionPermitted(compatibility, kind);

    private static ObservationPolicyInfo ObservationPolicy() => new(
        BridgeV2Contract.ObservationPolicyId,
        "Information currently rendered by or directly available through the local player's game UI.",
        IncludesHiddenInformation: false,
        UnknownFieldBehavior: "omit_and_mark_incomplete");

}
