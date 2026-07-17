using System;
using System.Collections.Generic;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeSnapshotBuilder
{
    private static readonly IBridgeSurfaceProvider[] Providers =
    {
        new DeckEnchantSurfaceProvider(),
        new CombatPileCardSelectionSurfaceProvider(),
        new CombatHandCardSelectionSurfaceProvider(),
        new GeneratedCardChoiceSurfaceProvider(),
        new CardBundleSelectionSurfaceProvider(),
        new CardRewardSurfaceProvider(),
        new RewardClaimSurfaceProvider(),
        new MapNavigationSurfaceProvider(),
        new CombatTurnSurfaceProvider(),
        new RestSiteSurfaceProvider(),
        new EventDialogueSurfaceProvider(),
        new EventOptionSurfaceProvider()
    };

    public static BridgeObservationDraft Build(BridgeEntityRegistry entities)
    {
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
        if (!game.Compatibility.ActionExecutionAllowed)
        {
            return Unsupported(
                game,
                snapshot.SourceType,
                game.Compatibility.Detail,
                new[] { "game_build_identity_not_exact" },
                context: null,
                BridgeDiagnostics.Create(
                    "bridge.identity.exact_build_required",
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
            Providers,
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
                "change_surface"));
    }

    private static BridgeObservationDraft Unsupported(
        GameBuildIdentity game,
        string sourceType,
        string reason,
        IReadOnlyList<string> warnings,
        IBridgeContext? context,
        BridgeDiagnostic diagnostic)
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
            Diagnostics = new[] { diagnostic }
        };
    }
}
