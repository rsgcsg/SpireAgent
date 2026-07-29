using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal enum CombatNoInputPhase
{
    None,
    Setup,
    Resolution
}

internal static class BridgeSnapshotBuilder
{
    private sealed record ProviderRegistration(string Kind, Func<IBridgeSurfaceProvider> Create);

    private static readonly ProviderRegistration[] ProviderRegistrations =
    {
        new("deck_enchant_selection", static () => new DeckEnchantSurfaceProvider()),
        new("deck_removal_selection", static () => new DeckRemovalSelectionSurfaceProvider()),
        new("relic_deck_removal_selection", static () => new PreciseScissorsRemovalSurfaceProvider()),
        new("reward_deck_removal_selection", static () => new RewardCardRemovalSurfaceProvider()),
        new("deck_upgrade_selection", static () => new DeckUpgradeSelectionSurfaceProvider()),
        new("deck_transform_selection", static () => new DeckTransformSelectionSurfaceProvider()),
        new("wood_carvings_replacement_selection", static () => new WoodCarvingsReplacementSurfaceProvider()),
        new("combat_pile_card_selection", static () => new CombatPileCardSelectionSurfaceProvider()),
        new("combat_hand_card_selection", static () => new CombatHandCardSelectionSurfaceProvider()),
        new("event_card_acquisition", static () => new EventCardAcquisitionSurfaceProvider()),
        new("generated_card_choice", static () => new GeneratedCardChoiceSurfaceProvider()),
        new("card_bundle_selection", static () => new CardBundleSelectionSurfaceProvider()),
        new("card_reward_selection", static () => new CardRewardSurfaceProvider()),
        new("reward_claim", static () => new RewardClaimSurfaceProvider()),
        new("map_navigation", static () => new MapNavigationSurfaceProvider()),
        new("combat_turn", static () => new CombatTurnSurfaceProvider()),
        new("shop_inventory", static () => new ShopInventorySurfaceProvider()),
        new("shop_room", static () => new ShopRoomSurfaceProvider()),
        new("treasure_room", static () => new TreasureRoomSurfaceProvider()),
        new("game_over", static () => new GameOverSurfaceProvider()),
        new("character_select", static () => new CharacterSelectSurfaceProvider()),
        new("main_menu", static () => new MainMenuSurfaceProvider()),
        new("singleplayer_menu", static () => new SingleplayerMenuSurfaceProvider()),
        new("rest_site", static () => new RestSiteSurfaceProvider()),
        new("event_dialogue", static () => new EventDialogueSurfaceProvider()),
        new("event_option", static () => new EventOptionSurfaceProvider())
    };

    internal static IReadOnlyList<string> DeclaredProviderKinds =>
        ProviderRegistrations.Select(provider => provider.Kind).ToArray();

    private static IReadOnlyList<IBridgeSurfaceProvider> CreateProviders() =>
        ProviderRegistrations.Select(registration => registration.Create()).ToArray();

    public static BridgeObservationDraft Build(BridgeEntityRegistry entities)
    {
        return Build(entities, BridgeV2Runtime.ReadCurrentGameIdentity());
    }

    public static BridgeObservationDraft Build(
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        IReadOnlyList<IBridgeSurfaceProvider> providers = CreateProviders();
        ActiveSurfaceSnapshot snapshot;
        try
        {
            snapshot = ActiveSurfaceResolver.Capture();
        }
        catch (Exception ex)
        {
            return Unsupported(
                game,
                "surface_capture_failed",
                $"Active surface capture failed closed: {ex.GetType().Name}.",
                new[] { $"active_surface_capture_failed:{ex.GetType().Name}" },
                context: null,
                BridgeDiagnostics.Create(
                    "bridge.surface.capture_failed",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "restart",
                    ex.GetType().Name));
        }
        if (!game.Compatibility.StateObservationAllowed)
        {
            return Unsupported(
                game,
                snapshot.SourceType,
                game.Compatibility.Detail,
                new[] { "game_build_identity_not_exact" },
                context: null,
                BridgeDiagnostics.Create(
                    "bridge.identity.observation_not_allowed",
                    "error",
                    "identity",
                    "actions_suppressed",
                    "update_bridge",
                    game.Compatibility.Detail));
        }

        if (McpMod.IsMultiplayerRun())
        {
            return Unsupported(
                game,
                "multiplayer_run",
                "Bridge v2 multiplayer semantics are not implemented in this revision.",
                new[] { "multiplayer_v2_not_implemented" },
                context: null,
                BridgeDiagnostics.Create(
                    "bridge.compatibility.multiplayer_not_implemented",
                    "error",
                    "compatibility",
                    "surface_unsupported",
                    "unknown"));
        }

        ActiveSurfaceResolution resolution = ActiveSurfaceResolver.Resolve(
            snapshot,
            providers,
            entities,
            game);
        if (resolution.Failure != null)
        {
            string provider = resolution.FailedProvider ?? "unknown";
            return Unsupported(
                game,
                snapshot.SourceType,
                $"The {provider} provider failed closed: {resolution.Failure.GetType().Name}.",
                new[] { $"surface_provider_failed:{provider}:{resolution.Failure.GetType().Name}" },
                BridgeContextBuilder.Build(entities),
                BridgeDiagnostics.Create(
                    "bridge.surface.provider_failed",
                    "error",
                    "runtime",
                    "surface_unsupported",
                    "restart",
                    $"{provider}:{resolution.Failure.GetType().Name}"));
        }

        if (resolution.Draft != null)
            return resolution.Draft;
        if (resolution.MatchedKinds.Count > 1)
        {
            return Unsupported(
                game,
                snapshot.SourceType,
                $"Multiple Bridge v2 surface providers matched: {string.Join(", ", resolution.MatchedKinds)}.",
                new[] { "ambiguous_surface_provider_match" },
                BridgeContextBuilder.Build(entities),
                BridgeDiagnostics.Create(
                    "bridge.surface.ambiguous_owner",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "restart"));
        }

        if (TryBuildCombatNoInputTransition(snapshot, entities, game) is { } transition)
            return transition;

        if (TryBuildRunMountNoInputTransition(snapshot, entities, game) is { } runTransition)
            return runTransition;

        return Unsupported(
            game,
            snapshot.SourceType,
            "This surface has not yet received a game-fact-audited v2 adapter.",
            new[] { "surface_not_implemented" },
            BridgeContextBuilder.Build(entities),
            BridgeDiagnostics.Create(
                "bridge.surface.not_implemented",
                "warning",
                "surface",
                "surface_unsupported",
                "change_surface"),
            new AuthorityHandoff(
                "none_fail_closed",
                null,
                "No Bridge v2 semantic surface owns the current input state."));
    }

    private static BridgeObservationDraft? TryBuildCombatNoInputTransition(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        CombatState? combatState = CombatManager.Instance.DebugOnlyGetState();
        NCombatRoom? room = NCombatRoom.Instance;
        CombatNoInputPhase phase = ClassifyCombatNoInputTransition(
            RunManager.Instance.IsInProgress,
            runState?.CurrentRoom is CombatRoom,
            CombatManager.Instance.IsStarting,
            CombatManager.Instance.IsInProgress,
            combatState != null,
            snapshot.HasBlockingSurface,
            room != null && McpMod.IsLiveNode(room));
        if (phase == CombatNoInputPhase.None)
            return null;

        bool isSetup = phase == CombatNoInputPhase.Setup;
        var context = new CombatTransitionBridgeContext(
            "combat_transition",
            isSetup ? "setup" : "resolution",
            isSetup ? "awaiting_combat_start" : "awaiting_room_resolution");
        var surface = new NoActionSurface(
            "no_action",
            "settling",
            isSetup
                ? "The combat room is initializing; no player input owner exists yet."
                : "Combat has ended; the game is resolving room rewards or the next player-visible surface.");
        var completeness = new StateCompleteness(
            "complete_for_bounded_no_input_transition",
            "none_no_input_owner",
            new[]
            {
                "RunState.CurrentRoom",
                "CombatManager.IsStarting",
                "CombatManager.IsInProgress",
                "CombatManager.DebugOnlyGetState",
                "NCombatRoom",
                "ActiveSurfaceResolver"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            game.Commit,
            context,
            surface,
            runState!.CurrentActIndex,
            runState.TotalFloor
        });

        return new BridgeObservationDraft(
            signature,
            "settling",
            context,
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            Array.Empty<BridgeActionDraft>())
        {
            AuthorityHandoff = new AuthorityHandoff(
                "none_fail_closed",
                null,
                "The exact combat transition has no player input owner; Bridge v2 will only observe and poll."),
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.lifecycle.no_input_transition",
                    "info",
                    "runtime",
                    "none",
                    "settle",
                    isSetup
                        ? "CombatRoom:combat_setup_before_input_surface"
                        : "CombatRoom:combat_ended_before_reward_surface")
            }
        };
    }

    private static BridgeObservationDraft? TryBuildRunMountNoInputTransition(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        if (!ClassifyRunMountNoInputTransition(
                RunManager.Instance.IsInProgress,
                runState != null,
                runState?.CurrentRoom != null,
                snapshot.HasBlockingSurface,
                snapshot.SourceType))
        {
            return null;
        }

        var context = new RunTransitionBridgeContext(
            "run_transition",
            "setup",
            "awaiting_run_state");
        var surface = new NoActionSurface(
            "no_action",
            "settling",
            "The standard run is starting or resuming, but its player-visible run state is still mounting.");
        var completeness = new StateCompleteness(
            "complete_for_bounded_run_mount_transition",
            "none_no_input_owner",
            new[]
            {
                "RunManager.IsInProgress",
                "RunManager.DebugOnlyGetState",
                "RunState.CurrentRoom",
                "RunState.TotalFloor",
                "ActiveSurfaceResolver"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            game.Commit,
            context,
            surface
        });

        return new BridgeObservationDraft(
            signature,
            "settling",
            context,
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            Array.Empty<BridgeActionDraft>())
        {
            AuthorityHandoff = new AuthorityHandoff(
                "none_fail_closed",
                null,
                "The native run-mount transition has no current input owner; Bridge v2 observes without publishing actions."),
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.lifecycle.run_mount_settling",
                    "info",
                    "runtime",
                    "none",
                    "settle")
            }
        };
    }

    internal static bool ClassifyRunMountNoInputTransition(
        bool runInProgress,
        bool runStatePresent,
        bool currentRoomPresent,
        bool hasBlockingSurface,
        string sourceType) =>
        runInProgress
        && (!runStatePresent || !currentRoomPresent)
        && !hasBlockingSurface
        && string.Equals(sourceType, "run_without_visible_overlay", StringComparison.Ordinal);

    internal static CombatNoInputPhase ClassifyCombatNoInputTransition(
        bool runInProgress,
        bool currentRoomIsCombat,
        bool combatIsStarting,
        bool combatInProgress,
        bool combatStatePresent,
        bool hasBlockingSurface,
        bool liveCombatRoomPresent)
    {
        if (!runInProgress || !currentRoomIsCombat || combatInProgress || hasBlockingSurface)
            return CombatNoInputPhase.None;
        if (combatIsStarting || !combatStatePresent)
            return CombatNoInputPhase.Setup;
        return liveCombatRoomPresent
            ? CombatNoInputPhase.Resolution
            : CombatNoInputPhase.None;
    }

    private static BridgeObservationDraft Unsupported(
        GameBuildIdentity game,
        string sourceType,
        string reason,
        IReadOnlyList<string> warnings,
        IBridgeContext? context,
        BridgeDiagnostic diagnostic,
        AuthorityHandoff? authorityHandoff = null)
    {
        var surface = new UnsupportedSurface("unsupported", sourceType, reason);
        context ??= new UnknownBridgeContext(
            "unknown",
            sourceType,
            "No qualified Bridge v2 context projection is safe for this unsupported surface.");
        var completeness = new StateCompleteness(
            "not_implemented",
            "empty_fail_closed",
            new[] { "scene_tree_surface_identity" },
            new[] { "player_visible_semantics", "legal_actions" });
        string signature = BridgeHash.Object(new { game.Version, context, surface, actionKeys = Array.Empty<string>() });

        return new BridgeObservationDraft(
            signature,
            "unsupported",
            context,
            surface,
            completeness,
            game,
            warnings,
            Array.Empty<BridgeActionDraft>())
        {
            AuthorityHandoff = authorityHandoff ?? new AuthorityHandoff(
                "none_fail_closed",
                null,
                "Bridge v2 could not prove a safe action-authority handoff for this state."),
            Diagnostics = new[] { diagnostic }
        };
    }

    internal static BridgeObservationDraft ApplyCurrentAuthority(BridgeObservationDraft draft) =>
        draft.Surface is UnsupportedSurface
            ? draft with
            {
                Actions = Array.Empty<BridgeActionDraft>(),
                AuthorityHandoff = new AuthorityHandoff(
                    "none_fail_closed",
                    null,
                    "An unsupported surface cannot own Bridge v2 mutation authority.")
            }
        : draft.Actions.Count == 0
            ? draft
            : draft.Game.Compatibility.ActionExecutionAllowed
            ? SuppressActionsOutsideCurrentOperationScope(draft)
            : SuppressActionsForCandidateObservation(draft);

    private static BridgeObservationDraft SuppressActionsForCandidateObservation(BridgeObservationDraft draft)
    {
        var completeness = draft.Completeness with
        {
            LegalActions = "suppressed_by_candidate_observation_gate"
        };
        IReadOnlyList<string> warnings = draft.Warnings
            .Append("candidate_observation_only: no Bridge v2 action or inspection is authorized for this build.")
            .ToArray();
        IReadOnlyList<BridgeDiagnostic> diagnostics = draft.Diagnostics
            .Append(BridgeDiagnostics.Create(
                "bridge.identity.candidate_observation_only",
                "warning",
                "identity",
                "actions_suppressed",
                "update_bridge",
                "Static bindings passed for this exact build, but UI lifecycle and completion evidence have not yet qualified action execution."))
            .ToArray();
        string signature = BridgeHash.Object(new
        {
            draft.Game.Version,
            draft.Game.Commit,
            draft.Game.MainAssemblyHash,
            draft.Context,
            draft.Surface,
            observationOnly = true
        });

        return draft with
        {
            Signature = signature,
            Readiness = "observation_only",
            Completeness = completeness,
            Warnings = warnings,
            Actions = Array.Empty<BridgeActionDraft>(),
            Diagnostics = diagnostics
        };
    }

    private static BridgeObservationDraft SuppressActionsOutsideCurrentOperationScope(
        BridgeObservationDraft draft)
    {
        IReadOnlyList<BridgeActionDraft> permitted = draft.Actions
            .Where(action => BridgeSurfacePermission.IsActionPermitted(
                draft.Game.Compatibility,
                draft.Surface.Kind,
                action.Kind))
            .ToArray();
        if (permitted.Count == draft.Actions.Count)
            return draft;

        if (permitted.Count > 0)
        {
            return draft with
            {
                Signature = BridgeHash.Object(new
                {
                    draft.Signature,
                    permitted = permitted.Select(action => action.Key)
                        .OrderBy(value => value, StringComparer.Ordinal)
                }),
                Actions = permitted,
                Completeness = draft.Completeness with
                {
                    LegalActions = "source_complete_with_unadmitted_actions_withheld"
                },
                Warnings = draft.Warnings
                    .Append("partial_action_admission: unadmitted actions remain visible as Surface facts but are not executable.")
                    .ToArray(),
                Diagnostics = draft.Diagnostics
                    .Append(BridgeDiagnostics.Create(
                        "bridge.authority.partial_action_admission",
                        "info",
                        "authority",
                        "none",
                        "unknown"))
                    .ToArray()
            };
        }

        var completeness = draft.Completeness with
        {
            LegalActions = "suppressed_by_explicit_operation_scope"
        };
        return draft with
        {
            Readiness = "blocked",
            Completeness = completeness,
            Actions = Array.Empty<BridgeActionDraft>(),
            Warnings = draft.Warnings
                .Append("operation_scope_blocked: the semantic Surface remains current, but no source-resolved action is authorized for this exact runtime scope.")
                .ToArray(),
            Diagnostics = draft.Diagnostics
                .Append(BridgeDiagnostics.Create(
                    "bridge.authority.operation_scope_blocked",
                    "warning",
                    "authority",
                    "actions_suppressed",
                    "restart"))
                .ToArray()
        };
    }
}
