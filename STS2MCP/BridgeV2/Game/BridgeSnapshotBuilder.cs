using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeSnapshotBuilder
{
    private sealed record ProviderRegistration(string Kind, Func<IBridgeSurfaceProvider> Create);

    private static readonly ProviderRegistration[] ProviderRegistrations =
    {
        new("deck_enchant_selection", static () => new DeckEnchantSurfaceProvider()),
        new("deck_removal_selection", static () => new DeckRemovalSelectionSurfaceProvider()),
        new("deck_upgrade_selection", static () => new DeckUpgradeSelectionSurfaceProvider()),
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
        IReadOnlyList<IBridgeSurfaceProvider> providers = CreateProviders();
        GameBuildIdentity game = BridgeGameIdentity.Read();
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

        IReadOnlyList<IBridgeSurfaceProvider> eligibleProviders = game.Compatibility.ActionExecutionAllowed
            ? providers.Where(provider =>
                BridgeSurfacePermission.IsActionPermitted(game.Compatibility, provider.Kind)).ToArray()
            : providers.Where(provider => game.Compatibility.ObservationOnlySurfaceKinds.Contains(provider.Kind, StringComparer.Ordinal)).ToArray();
        ActiveSurfaceResolution resolution = ActiveSurfaceResolver.Resolve(
            snapshot,
            eligibleProviders,
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
            return game.Compatibility.ActionExecutionAllowed
                ? resolution.Draft
                : SuppressActionsForCandidateObservation(resolution.Draft);
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

        if (game.Compatibility.Status == "qualified_scoped")
        {
            IReadOnlyList<IBridgeSurfaceProvider> unqualifiedProviders = providers
                .Where(provider =>
                    !game.Compatibility.ActionExecutionSurfaceKinds.Contains(provider.Kind, StringComparer.Ordinal)
                    && !game.Compatibility.ActionCanarySurfaceKinds.Contains(provider.Kind, StringComparer.Ordinal))
                .ToArray();
            ActiveSurfaceResolution legacyResolution = ActiveSurfaceResolver.Resolve(
                snapshot,
                unqualifiedProviders,
                entities,
                game);
            if (legacyResolution.Failure != null || legacyResolution.MatchedKinds.Count > 1)
            {
                return Unsupported(
                    game,
                    snapshot.SourceType,
                    "Bridge v2 could not establish a unique unqualified semantic surface owner; legacy fallback is forbidden.",
                    new[] { "legacy_fallback_owner_ambiguous" },
                    BridgeContextBuilder.Build(entities),
                    BridgeDiagnostics.Create(
                        "bridge.authority.legacy_fallback_ambiguous",
                        "error",
                        "authority",
                        "actions_suppressed",
                        "change_surface"));
            }
            if (legacyResolution.Draft != null)
            {
                string legacySurfaceKind = legacyResolution.MatchedKinds[0];
                return Unsupported(
                    game,
                    snapshot.SourceType,
                    $"The current {legacySurfaceKind} surface is source-resolved but not qualified for Bridge v2 on this exact build.",
                    new[] { $"surface_not_qualified_for_current_build:{legacySurfaceKind}" },
                    BridgeContextBuilder.Build(entities),
                    BridgeDiagnostics.Create(
                        "bridge.authority.legacy_fallback_allowed",
                        "info",
                        "authority",
                        "surface_unsupported",
                        "legacy_adapter"),
                    new AuthorityHandoff(
                        "legacy_fallback_allowed",
                        legacySurfaceKind,
                        "Exactly one known semantic surface matched outside the current build's Bridge v2 qualification scope."));
            }
        }

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
            game.Compatibility.Status == "supported_exact"
                ? new AuthorityHandoff(
                    "legacy_fallback_allowed",
                    null,
                    "This fully tested legacy build preserves the previous explicit unsupported-surface fallback contract.")
                : null);
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
}
