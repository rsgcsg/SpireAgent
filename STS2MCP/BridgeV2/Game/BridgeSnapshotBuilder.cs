using System;
using System.Collections.Generic;
using System.Linq;
using Godot;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeSnapshotBuilder
{
    public static BridgeObservationDraft Build(BridgeEntityRegistry entities)
    {
        GameBuildIdentity game = BridgeGameIdentity.Read();
        if (!game.Compatibility.ActionExecutionAllowed)
        {
            return Unsupported(
                game,
                DetectSourceType(),
                game.Compatibility.Detail,
                new[] { "game_build_identity_not_exact" });
        }

        if (McpMod.IsMultiplayerRun())
        {
            return Unsupported(
                game,
                "multiplayer_run",
                "Bridge v2 multiplayer semantics are not implemented in this revision.",
                new[] { "multiplayer_v2_not_implemented" });
        }

        var overlay = NOverlayStack.Instance?.Peek();
        if (overlay is MegaCrit.Sts2.Core.Nodes.Screens.CardSelection.NDeckEnchantSelectScreen enchantScreen)
            return DeckEnchantSurfaceProvider.Build(enchantScreen, entities, game);

        return Unsupported(
            game,
            DetectSourceType(),
            "This surface has not yet received a game-fact-audited v2 adapter.",
            new[] { "surface_not_implemented" });
    }

    private static BridgeObservationDraft Unsupported(
        GameBuildIdentity game,
        string sourceType,
        string reason,
        IReadOnlyList<string> warnings)
    {
        var surface = new UnsupportedSurface("unsupported", sourceType, reason);
        var completeness = new StateCompleteness(
            "not_implemented",
            "empty_fail_closed",
            new[] { "scene_tree_surface_identity" },
            new[] { "player_visible_semantics", "legal_actions" });
        string signature = BridgeHash.Object(new { game.Version, surface, actionKeys = Array.Empty<string>() });

        return new BridgeObservationDraft(
            signature,
            "unsupported",
            "unsupported",
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
            var overlay = NOverlayStack.Instance?.Peek();
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
