using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Nodes;
using MegaCrit.Sts2.Core.Nodes.GodotExtensions;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using MegaCrit.Sts2.Core.Nodes.Screens.GameOverScreen;
using MegaCrit.Sts2.Core.Nodes.Screens.ScreenContext;
using MegaCrit.Sts2.Core.Runs;
using MegaCrit.Sts2.Core.Runs.History;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact-build ordinary single-player game-over lifecycle. The intro Continue
/// and the later return button are distinct UI commits; unlike v1 this never
/// invokes a hidden fallback method to skip the current visible stage.
/// </summary>
internal sealed class GameOverSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "game_over";
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;
    private static readonly FieldInfo? ScoreField = typeof(NGameOverScreen).GetField("_score", Flags);
    private static readonly FieldInfo? AnimatingSummaryField =
        typeof(NGameOverScreen).GetField("_isAnimatingSummary", Flags);

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NGameOverScreen screen)
            return null;

        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        Player? player = runState == null ? null : LocalContext.GetMe(runState);
        RunHistory? history = RunManager.Instance.History;
        if (runState == null
            || player == null
            || history == null
            || runState.GameMode != GameMode.Standard
            || !McpMod.IsLiveNode(screen)
            || !McpMod.IsNodeVisible(screen)
            || !ActiveScreenContext.Instance.IsCurrent(screen))
        {
            return BindingUnavailable(
                game,
                "Only the exact current ordinary single-player standard game-over screen is supported.");
        }

        NGameOverContinueButton? continueButton =
            screen.GetNodeOrNull<NGameOverContinueButton>("%ContinueButton");
        NReturnToMainMenuButton? mainMenuButton =
            screen.GetNodeOrNull<NReturnToMainMenuButton>("%MainMenuButton");
        NViewRunButton? viewRunButton = screen.GetNodeOrNull<NViewRunButton>("%ViewRunButton");
        NGameOverContinueButton? leaderboardButton =
            screen.GetNodeOrNull<NGameOverContinueButton>("%LeaderboardButton");
        Control? summary = screen.GetNodeOrNull<Control>("%RunSummaryContainer");
        if (continueButton == null
            || mainMenuButton == null
            || viewRunButton == null
            || leaderboardButton == null
            || summary == null
            || ScoreField?.GetValue(screen) is not int score
            || AnimatingSummaryField?.GetValue(screen) is not bool animatingSummary)
        {
            return BindingUnavailable(game, "Exact game-over controls or lifecycle bindings are unavailable.");
        }

        bool continueReady = IsAdvanceable(screen, continueButton);
        bool returnReady = IsActionable(mainMenuButton);
        bool unsupportedControlReady = IsActionable(viewRunButton) || IsActionable(leaderboardButton);
        if (unsupportedControlReady)
        {
            return BindingUnavailable(
                game,
                "An enabled game-over control without a qualified semantic contract is visible.");
        }
        if (continueReady && returnReady)
            return BindingUnavailable(game, "Game-over intro and return controls are simultaneously actionable.");

        string stage = continueReady
            ? "intro"
            : returnReady
                ? "summary"
                : animatingSummary
                    ? "summary_animating"
                    : "intro_animating";
        string? destination = returnReady
            ? player.DiscoveredEpochs.Count > 0 ? "timeline" : "main_menu"
            : null;
        var context = new GameOverBridgeContext(
            "game_over",
            history.Win ? "win" : "loss",
            "standard",
            returnReady ? score : null,
            returnReady ? runState.TotalFloor : null,
            returnReady ? runState.AscensionLevel : null);
        string screenId = entities.GetId(screen, "screen");
        var actions = new List<BridgeActionDraft>();
        if (continueReady)
        {
            actions.Add(new BridgeActionDraft(
                $"advance_game_over_summary:{screenId}",
                "advance_game_over_summary",
                "navigation",
                "Continue to the run summary",
                "NGameOverScreen.%ContinueButton+_isAnimatingSummary",
                () => StartAdvance(screen, continueButton),
                new[] { new ActionEntityBinding("game_over_screen", screenId) }));
        }
        if (returnReady)
        {
            actions.Add(new BridgeActionDraft(
                $"return_game_over:{screenId}:{destination}",
                "return_game_over",
                "navigation",
                destination == "timeline" ? "Continue to newly discovered Timeline content" : "Return to the main menu",
                "NGameOverScreen.%MainMenuButton+NGame.MainMenu-loaded",
                () => StartReturn(screen, mainMenuButton),
                new[] { new ActionEntityBinding("game_over_screen", screenId) }));
        }

        var surface = new GameOverSurface(
            SurfaceKind,
            stage,
            screenId,
            destination,
            continueReady,
            returnReady);
        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_ordinary_single_player_game_over_navigation_and_summary",
            actions.Count > 0
                ? "derived_from_exact_current_enabled_game_over_controls"
                : "temporarily_empty_while_game_over_intro_or_summary_animation_settles",
            new[]
            {
                "NOverlayStack.Peek+ActiveScreenContext exact input ownership",
                "NGameOverScreen.%ContinueButton+%MainMenuButton",
                "NGameOverScreen._isAnimatingSummary+%RunSummaryContainer",
                "RunManager.History.Win+RunState.GameMode+TotalFloor+AscensionLevel",
                "NGameOverScreen._score exact-version binding",
                "NGame.ReturnToMainMenuAfterRun+GoToTimelineAfterRun"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            context,
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            context,
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            actions);
    }

    private static bool IsActionable(NButton button) =>
        McpMod.IsLiveNode(button)
        && McpMod.IsNodeVisible(button)
        && button.IsEnabled
        && button.MouseFilter != Control.MouseFilterEnum.Ignore;

    private static bool IsAdvanceable(
        NGameOverScreen screen,
        NGameOverContinueButton button) =>
        IsActionable(button)
        && AnimatingSummaryField?.GetValue(screen) is bool animatingSummary
        && !animatingSummary;

    private static BridgeActionStartResult StartAdvance(
        NGameOverScreen expectedScreen,
        NGameOverContinueButton expectedButton)
    {
        if (NOverlayStack.Instance?.Peek() is not NGameOverScreen current
            || !ReferenceEquals(current, expectedScreen)
            || !ActiveScreenContext.Instance.IsCurrent(expectedScreen)
            || !IsAdvanceable(expectedScreen, expectedButton))
        {
            return BridgeActionStartResult.Rejected(
                "game_over_intro_changed",
                "The game-over intro is no longer the exact current advanceable stage.");
        }

        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => ReferenceEquals(NOverlayStack.Instance?.Peek(), expectedScreen)
                  && AnimatingSummaryField?.GetValue(expectedScreen) is bool isAnimating
                  && isAnimating
                  && !expectedButton.IsEnabled,
            "game_over_summary_animation_started",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartReturn(
        NGameOverScreen expectedScreen,
        NReturnToMainMenuButton expectedButton)
    {
        if (NOverlayStack.Instance?.Peek() is not NGameOverScreen current
            || !ReferenceEquals(current, expectedScreen)
            || !ActiveScreenContext.Instance.IsCurrent(expectedScreen)
            || !IsActionable(expectedButton))
        {
            return BridgeActionStartResult.Rejected(
                "game_over_summary_changed",
                "The game-over summary is no longer the exact current returnable stage.");
        }

        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => NGame.Instance?.MainMenu != null
                  && !RunManager.Instance.IsInProgress
                  && (!McpMod.IsLiveNode(expectedScreen) || !McpMod.IsNodeVisible(expectedScreen)),
            "game_over_closed_and_main_menu_loaded",
            allowIntermediateStateChanges: true);
    }

    private static BridgeObservationDraft BindingUnavailable(GameBuildIdentity game, string detail)
    {
        var context = new UnknownBridgeContext("unknown", nameof(NGameOverScreen), detail);
        var surface = new UnsupportedSurface("unsupported", nameof(NGameOverScreen), detail);
        return new BridgeObservationDraft(
            BridgeHash.Object(new { game.Version, detail }),
            "unsupported",
            context,
            surface,
            new StateCompleteness(
                "incomplete_fail_closed",
                "empty_fail_closed",
                new[] { "NGameOverScreen exact-current standard single-player contract" },
                new[] { "game_over_exact_controls_or_semantics" }),
            game,
            new[] { "game_over_binding_unavailable" },
            Array.Empty<BridgeActionDraft>());
    }
}
