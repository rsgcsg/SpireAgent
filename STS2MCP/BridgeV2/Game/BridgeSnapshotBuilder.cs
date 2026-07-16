using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeSnapshotBuilder
{
    private static readonly IBridgeSurfaceProvider[] Providers =
    {
        new DeckEnchantSurfaceProvider(),
        new CombatTurnSurfaceProvider(),
        new EventOptionSurfaceProvider()
    };

    public static BridgeObservationDraft Build(BridgeEntityRegistry entities)
    {
        GameBuildIdentity game = BridgeGameIdentity.Read();
        if (!game.Compatibility.ActionExecutionAllowed)
        {
            return Unsupported(
                game,
                DetectSourceType(),
                game.Compatibility.Detail,
                new[] { "game_build_identity_not_exact" },
                context: null);
        }

        if (McpMod.IsMultiplayerRun())
        {
            return Unsupported(
                game,
                "multiplayer_run",
                "Bridge v2 multiplayer semantics are not implemented in this revision.",
                new[] { "multiplayer_v2_not_implemented" },
                context: null);
        }

        var matches = new List<(string Kind, BridgeObservationDraft Draft)>();
        foreach (IBridgeSurfaceProvider provider in Providers)
        {
            try
            {
                BridgeObservationDraft? draft = provider.TryBuild(entities, game);
                if (draft != null)
                    matches.Add((provider.Kind, draft));
            }
            catch (Exception ex)
            {
                return Unsupported(
                    game,
                    DetectSourceType(),
                    $"The {provider.Kind} provider failed closed: {ex.GetType().Name}.",
                    new[] { $"surface_provider_failed:{provider.Kind}:{ex.GetType().Name}" },
                    BridgeContextBuilder.Build(entities));
            }
        }

        if (matches.Count == 1)
            return matches[0].Draft;
        if (matches.Count > 1)
        {
            return Unsupported(
                game,
                DetectSourceType(),
                $"Multiple Bridge v2 surface providers matched: {string.Join(", ", matches.Select(match => match.Kind))}.",
                new[] { "ambiguous_surface_provider_match" },
                BridgeContextBuilder.Build(entities));
        }

        return Unsupported(
            game,
            DetectSourceType(),
            "This surface has not yet received a game-fact-audited v2 adapter.",
            new[] { "surface_not_implemented" },
            BridgeContextBuilder.Build(entities));
    }

    private static BridgeObservationDraft Unsupported(
        GameBuildIdentity game,
        string sourceType,
        string reason,
        IReadOnlyList<string> warnings,
        IBridgeContext? context)
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
            Array.Empty<BridgeActionDraft>());
    }

    private static string DetectSourceType()
    {
        try
        {
            var overlay = MegaCrit.Sts2.Core.Nodes.Screens.Overlays.NOverlayStack.Instance?.Peek();
            if (overlay != null)
                return overlay.GetType().Name;

            return RunManager.Instance.IsInProgress ? "run_without_overlay" : "menu_or_no_run";
        }
        catch (Exception ex)
        {
            return "unknown:" + ex.GetType().Name;
        }
    }
}
