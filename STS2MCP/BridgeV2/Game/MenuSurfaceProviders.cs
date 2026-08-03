using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Acts;
using MegaCrit.Sts2.Core.Models.Characters;
using MegaCrit.Sts2.Core.Nodes;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.GodotExtensions;
using MegaCrit.Sts2.Core.Nodes.Screens.CharacterSelect;
using MegaCrit.Sts2.Core.Nodes.Screens.MainMenu;
using MegaCrit.Sts2.Core.Runs;
using MegaCrit.Sts2.Core.Saves;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal sealed class MainMenuSurfaceProvider : IBridgeSurfaceProvider
{
    private const BindingFlags PrivateInstance = BindingFlags.Instance | BindingFlags.NonPublic;
    private static readonly FieldInfo? ReadRunSaveResultField =
        typeof(NMainMenu).GetField("_readRunSaveResult", PrivateInstance);

    public string Kind => "main_menu";

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Menu;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.MenuRoot is not { } root || snapshot.MenuSubmenu != null || snapshot.OpenModal != null)
            return null;

        NMainMenuTextButton continueButton;
        NMainMenuTextButton abandonButton;
        NMainMenuTextButton singleplayerButton;
        NMainMenuTextButton multiplayerButton;
        NMainMenuTextButton timelineButton;
        NMainMenuTextButton settingsButton;
        NMainMenuTextButton compendiumButton;
        NMainMenuTextButton quitButton;
        NButton profileButton;
        NButton patchNotesButton;
        try
        {
            continueButton = root.GetNode<NMainMenuTextButton>("MainMenuTextButtons/ContinueButton");
            abandonButton = root.GetNode<NMainMenuTextButton>("MainMenuTextButtons/AbandonRunButton");
            singleplayerButton = root.GetNode<NMainMenuTextButton>("MainMenuTextButtons/SingleplayerButton");
            multiplayerButton = root.GetNode<NMainMenuTextButton>("MainMenuTextButtons/MultiplayerButton");
            timelineButton = root.GetNode<NMainMenuTextButton>("MainMenuTextButtons/TimelineButton");
            settingsButton = root.GetNode<NMainMenuTextButton>("MainMenuTextButtons/SettingsButton");
            compendiumButton = root.GetNode<NMainMenuTextButton>("MainMenuTextButtons/CompendiumButton");
            quitButton = root.GetNode<NMainMenuTextButton>("MainMenuTextButtons/QuitButton");
            profileButton = root.GetNode<NButton>("%ChangeProfileButton");
            patchNotesButton = root.GetNode<NButton>("%PatchNotesButton");
        }
        catch (Exception ex)
        {
            return BindingUnavailable(game, $"Root main-menu control binding failed: {ex.GetType().Name}.");
        }

        ReadSaveResult<SerializableRun>? runResult =
            ReadRunSaveResultField?.GetValue(root) as ReadSaveResult<SerializableRun>;
        VisibleContinueRunSummary? continueSummary = BuildContinueSummary(runResult);
        bool canContinue = IsUsable(continueButton)
                           && runResult is { Success: true, SaveData: not null }
                           && continueSummary != null;
        bool canOpenSingleplayer = IsUsable(singleplayerButton);
        string rootId = entities.GetId(root, "menu_screen");
        VisibleMenuOption[] options = new[]
        {
            Option(entities, continueButton, "continue", Label(continueButton, "Continue"),
                canContinue ? "actionable" : "visible_unsupported",
                canContinue ? null : "No exact valid saved-run binding is currently actionable."),
            Option(entities, abandonButton, "abandon_run", Label(abandonButton, "Abandon Run"),
                "visible_unsupported", "Destructive run abandonment is outside this bounded contract."),
            Option(entities, singleplayerButton, "singleplayer", Label(singleplayerButton, "Single Player"),
                canOpenSingleplayer ? "actionable" : "visible_unsupported",
                canOpenSingleplayer ? null : "The exact Single Player control is not currently enabled."),
            Option(entities, multiplayerButton, "multiplayer", Label(multiplayerButton, "Multiplayer"),
                "visible_unsupported", "Multiplayer is outside the current single-player Gateway scope."),
            Option(entities, timelineButton, "timeline", Label(timelineButton, "Timeline"),
                "visible_unsupported", "Timeline navigation is not implemented."),
            Option(entities, settingsButton, "settings", Label(settingsButton, "Settings"),
                "visible_unsupported", "Settings navigation is not implemented."),
            Option(entities, compendiumButton, "compendium", Label(compendiumButton, "Compendium"),
                "visible_unsupported", "Compendium navigation is not implemented."),
            Option(entities, quitButton, "quit", Label(quitButton, "Quit"),
                "visible_unsupported", "Process termination is not an Agent action."),
            Option(entities, profileButton, "profile", "Profile", "visible_unsupported",
                "Profile switching is not implemented."),
            Option(entities, patchNotesButton, "patch_notes", "Patch Notes", "visible_unsupported",
                "Patch-note navigation is not implemented.")
        }.Where(option => option != null).Cast<VisibleMenuOption>().ToArray();

        var surface = new MainMenuSurface(
            Kind,
            canContinue || canOpenSingleplayer ? "choosing" : "blocked",
            rootId,
            options,
            continueSummary);
        string signature = BridgeHash.Object(new
        {
            game.Version,
            surface,
            commandKeys = new[]
            {
                canContinue ? $"continue_run:{rootId}" : null,
                canOpenSingleplayer ? $"open_singleplayer:{rootId}" : null
            }.Where(key => key != null).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            canContinue || canOpenSingleplayer ? "ready" : "blocked",
            new MenuBridgeContext("menu", "root_navigation"),
            surface,
            new StateCompleteness(
                "contract_complete_for_visible_root_choices_and_standard_run_entry",
                "derived_from_exact_visible_root_controls_and_saved_run_binding",
                new[]
                {
                    "NMainMenu exact current owner",
                    "visible and enabled root controls",
                    "NModalContainer.OpenModal exclusion",
                    "exact ReadSaveResult<SerializableRun>"
                },
                new[] { "profile_and_patch_notes_hover_detail_not_exposed" }),
            game,
            new[] { "unsupported_root_choices_are_visible_facts_only" },
            Array.Empty<BridgeActionDraft>());
    }

    private static BridgeActionStartResult StartContinue(
        NMainMenu expectedRoot,
        NMainMenuTextButton expectedButton,
        ReadSaveResult<SerializableRun> expectedResult)
    {
        ReadSaveResult<SerializableRun>? current =
            ReadRunSaveResultField?.GetValue(expectedRoot) as ReadSaveResult<SerializableRun>;
        if (!IsCurrentRoot(expectedRoot)
            || !IsUsable(expectedButton)
            || !ReferenceEquals(current, expectedResult)
            || current is not { Success: true, SaveData: not null })
        {
            return BridgeActionStartResult.Rejected(
                "main_menu_continue_changed",
                "The exact saved-run binding or Continue control is no longer current and valid.");
        }

        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => RunManager.Instance.IsInProgress,
            "saved_singleplayer_run_became_active",
            allowIntermediateStateChanges: true);
    }

    internal static BridgeActionStartResult StartContinue(
        BridgeEntityRegistry entities,
        string screenEntityId)
    {
        if (!entities.TryResolve(screenEntityId, out NMainMenu? root) || root == null)
        {
            return BridgeActionStartResult.Rejected(
                "main_menu_not_found",
                "The exact main-menu owner is no longer available.");
        }

        try
        {
            NMainMenuTextButton button = root.GetNode<NMainMenuTextButton>(
                "MainMenuTextButtons/ContinueButton");
            ReadSaveResult<SerializableRun>? runResult =
                ReadRunSaveResultField?.GetValue(root) as ReadSaveResult<SerializableRun>;
            if (runResult is not { Success: true, SaveData: not null })
            {
                return BridgeActionStartResult.Rejected(
                    "main_menu_continue_changed",
                    "The exact saved-run binding is no longer current and valid.");
            }
            return StartContinue(root, button, runResult);
        }
        catch (Exception ex)
        {
            return BridgeActionStartResult.Rejected(
                "main_menu_continue_binding_failed",
                $"The exact Continue control could not be resolved: {ex.GetType().Name}.");
        }
    }

    private static BridgeActionStartResult StartOpenSingleplayer(
        NMainMenu expectedRoot,
        NMainMenuTextButton expectedButton)
    {
        if (!IsCurrentRoot(expectedRoot) || !IsUsable(expectedButton))
        {
            return BridgeActionStartResult.Rejected(
                "main_menu_singleplayer_changed",
                "The exact Single Player control is no longer current and enabled.");
        }

        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => NGame.Instance?.MainMenu?.SubmenuStack?.Peek() is NSingleplayerSubmenu or NCharacterSelectScreen,
            "singleplayer_or_character_select_owner_became_active",
            allowIntermediateStateChanges: true);
    }

    internal static BridgeActionStartResult StartOpenSingleplayer(
        BridgeEntityRegistry entities,
        string screenEntityId)
    {
        if (!entities.TryResolve(screenEntityId, out NMainMenu? root) || root == null)
        {
            return BridgeActionStartResult.Rejected(
                "main_menu_not_found",
                "The exact main-menu owner is no longer available.");
        }

        try
        {
            NMainMenuTextButton button = root.GetNode<NMainMenuTextButton>(
                "MainMenuTextButtons/SingleplayerButton");
            return StartOpenSingleplayer(root, button);
        }
        catch (Exception ex)
        {
            return BridgeActionStartResult.Rejected(
                "main_menu_singleplayer_binding_failed",
                $"The exact Single Player control could not be resolved: {ex.GetType().Name}.");
        }
    }

    private static bool IsCurrentRoot(NMainMenu expectedRoot) =>
        !RunManager.Instance.IsInProgress
        && ReferenceEquals(NGame.Instance?.MainMenu, expectedRoot)
        && McpMod.IsLiveNode(expectedRoot)
        && McpMod.IsNodeVisible(expectedRoot)
        && expectedRoot.SubmenuStack.Peek() == null
        && NModalContainer.Instance?.OpenModal == null;

    private static VisibleContinueRunSummary? BuildContinueSummary(ReadSaveResult<SerializableRun>? result)
    {
        if (result is not { Success: true, SaveData: { } run }
            || run.Players.Count == 0
            || run.CurrentActIndex < 0
            || run.CurrentActIndex >= run.Acts.Count)
            return null;
        var player = run.Players[0];
        var actId = run.Acts[run.CurrentActIndex].Id;
        var characterId = player.CharacterId;
        if (actId == null || characterId == null)
            return null;
        ActModel act = ModelDb.GetById<ActModel>(actId);
        CharacterModel character = ModelDb.GetById<CharacterModel>(characterId);
        int floor = run.VisitedMapCoords.Count;
        for (int i = 0; i < run.CurrentActIndex; i++)
        {
            var previousActId = run.Acts[i].Id;
            if (previousActId == null)
                return null;
            floor += ModelDb.GetById<ActModel>(previousActId).GetNumberOfFloors(run.Players.Count > 1);
        }
        return new VisibleContinueRunSummary(
            characterId.Entry,
            character.Title.GetFormattedText(),
            actId.Entry,
            act.Title.GetFormattedText(),
            floor,
            player.CurrentHp,
            player.MaxHp,
            player.Gold,
            run.Ascension);
    }

    private static VisibleMenuOption? Option(
        BridgeEntityRegistry entities,
        NButton button,
        string semanticId,
        string label,
        string bridgeSupport,
        string? blockedReason)
    {
        if (!McpMod.IsNodeVisible(button))
            return null;
        return new VisibleMenuOption(
            entities.GetId(button, "menu_option"),
            semanticId,
            label,
            null,
            button.IsEnabled,
            bridgeSupport,
            blockedReason);
    }

    private static string Label(NMainMenuTextButton button, string fallback) =>
        string.IsNullOrWhiteSpace(button.label?.Text) ? fallback : button.label.Text;

    private static bool IsUsable(NButton button) => button.IsEnabled && McpMod.IsNodeVisible(button);

    private static BridgeObservationDraft BindingUnavailable(GameBuildIdentity game, string reason) =>
        MenuSurfaceSupport.BindingUnavailable(game, nameof(NMainMenu), "root_navigation", reason);
}

internal sealed class SingleplayerMenuSurfaceProvider : IBridgeSurfaceProvider
{
    internal const string OpenStandardCompletionWitness =
        "standard_character_select_owner_became_active";
    internal const string BackCompletionWitness =
        "singleplayer_submenu_owner_changed";

    public string Kind => "singleplayer_menu";

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Menu;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.MenuSubmenu is not NSingleplayerSubmenu screen || snapshot.OpenModal != null)
            return null;

        NSubmenuButton standard;
        NSubmenuButton daily;
        NSubmenuButton custom;
        NBackButton back;
        try
        {
            standard = screen.GetNode<NSubmenuButton>("StandardButton");
            daily = screen.GetNode<NSubmenuButton>("DailyButton");
            custom = screen.GetNode<NSubmenuButton>("CustomRunButton");
            back = screen.GetNode<NBackButton>("BackButton");
        }
        catch (Exception ex)
        {
            return MenuSurfaceSupport.BindingUnavailable(game, nameof(NSingleplayerSubmenu), "standard_run_setup",
                $"Single-player submenu control binding failed: {ex.GetType().Name}.");
        }

        string screenId = entities.GetId(screen, "menu_screen");
        bool canStandard = IsUsable(standard);
        bool canBack = IsUsable(back);
        VisibleMenuOption[] options = new[]
        {
            Option(entities, standard, "standard", "Standard", canStandard ? "actionable" : "visible_unsupported",
                canStandard ? null : "The Standard control is not currently enabled."),
            Option(entities, daily, "daily", "Daily", "visible_unsupported",
                "Daily runs are outside this bounded standard-run contract."),
            Option(entities, custom, "custom", "Custom", "visible_unsupported",
                "Custom and seeded runs are outside this bounded standard-run contract."),
            Option(entities, back, "back", "Back", canBack ? "actionable" : "visible_unsupported",
                canBack ? null : "The exact Back control is not currently enabled.")
        }.Where(option => option != null).Cast<VisibleMenuOption>().ToArray();
        var surface = new SingleplayerMenuSurface(
            Kind,
            canStandard || canBack ? "choosing" : "blocked",
            screenId,
            options);
        string signature = BridgeHash.Object(new
        {
            game.Version,
            surface,
            commandKeys = new[]
            {
                canStandard ? $"open_standard_run_setup:{screenId}" : null,
                canBack ? $"back_from_singleplayer_menu:{screenId}" : null
            }.Where(key => key != null).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            canStandard || canBack ? "ready" : "blocked",
            new MenuBridgeContext("menu", "standard_run_setup"),
            surface,
            new StateCompleteness(
                "contract_complete_for_visible_singleplayer_run_modes",
                "derived_from_exact_visible_submenu_controls",
                new[]
                {
                    "NSingleplayerSubmenu exact current owner",
                    "visible Standard/Daily/Custom controls",
                    "visible Back control",
                    "NModalContainer.OpenModal exclusion"
                },
                Array.Empty<string>()),
            game,
            new[] { "daily_and_custom_are_visible_facts_only" },
            Array.Empty<BridgeActionDraft>());
    }

    private static BridgeActionStartResult StartStandard(NSingleplayerSubmenu expectedScreen, NButton expectedButton)
    {
        if (!IsCurrent(expectedScreen) || !IsUsable(expectedButton))
            return BridgeActionStartResult.Rejected("singleplayer_standard_changed", "The Standard control is no longer current and enabled.");
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => NGame.Instance?.MainMenu?.SubmenuStack?.Peek() is NCharacterSelectScreen,
            OpenStandardCompletionWitness,
            allowIntermediateStateChanges: true);
    }

    internal static BridgeActionStartResult StartStandard(
        BridgeEntityRegistry entities,
        string screenEntityId)
    {
        if (!entities.TryResolve(screenEntityId, out NSingleplayerSubmenu? screen) || screen == null)
        {
            return BridgeActionStartResult.Rejected(
                "singleplayer_menu_not_found",
                "The exact single-player submenu owner is no longer available.");
        }

        try
        {
            return StartStandard(screen, screen.GetNode<NSubmenuButton>("StandardButton"));
        }
        catch (Exception ex)
        {
            return BridgeActionStartResult.Rejected(
                "singleplayer_standard_binding_failed",
                $"The exact Standard control could not be resolved: {ex.GetType().Name}.");
        }
    }

    private static BridgeActionStartResult StartBack(NSingleplayerSubmenu expectedScreen, NButton expectedButton)
    {
        if (!IsCurrent(expectedScreen) || !IsUsable(expectedButton))
            return BridgeActionStartResult.Rejected("singleplayer_back_changed", "The Back control is no longer current and enabled.");
        expectedButton.ForceClick();
        return BridgeActionStartResult.Started(
            () => !ReferenceEquals(NGame.Instance?.MainMenu?.SubmenuStack?.Peek(), expectedScreen),
            BackCompletionWitness,
            allowIntermediateStateChanges: true);
    }

    internal static BridgeActionStartResult StartBack(
        BridgeEntityRegistry entities,
        string screenEntityId)
    {
        if (!entities.TryResolve(screenEntityId, out NSingleplayerSubmenu? screen) || screen == null)
        {
            return BridgeActionStartResult.Rejected(
                "singleplayer_menu_not_found",
                "The exact single-player submenu owner is no longer available.");
        }

        try
        {
            return StartBack(screen, screen.GetNode<NBackButton>("BackButton"));
        }
        catch (Exception ex)
        {
            return BridgeActionStartResult.Rejected(
                "singleplayer_back_binding_failed",
                $"The exact Back control could not be resolved: {ex.GetType().Name}.");
        }
    }

    private static bool IsCurrent(NSingleplayerSubmenu expectedScreen) =>
        !RunManager.Instance.IsInProgress
        && ReferenceEquals(NGame.Instance?.MainMenu?.SubmenuStack?.Peek(), expectedScreen)
        && McpMod.IsLiveNode(expectedScreen)
        && McpMod.IsNodeVisible(expectedScreen)
        && NModalContainer.Instance?.OpenModal == null;

    private static VisibleMenuOption? Option(
        BridgeEntityRegistry entities,
        NButton button,
        string semanticId,
        string fallbackLabel,
        string bridgeSupport,
        string? blockedReason)
    {
        if (!McpMod.IsNodeVisible(button))
            return null;
        string title = button is NSubmenuButton
            ? ReadText<Label>(button, "%Title") ?? fallbackLabel
            : fallbackLabel;
        string? description = button is NSubmenuButton
            ? ReadText<RichTextLabel>(button, "%Description")
            : null;
        return new VisibleMenuOption(
            entities.GetId(button, "menu_option"),
            semanticId,
            title,
            description,
            button.IsEnabled,
            bridgeSupport,
            blockedReason);
    }

    private static string? ReadText<T>(Node root, string path) where T : Control
    {
        T node = root.GetNode<T>(path);
        return node switch
        {
            Label label => label.Text,
            RichTextLabel rich => rich.Text,
            _ => null
        };
    }

    private static bool IsUsable(NButton button) => button.IsEnabled && McpMod.IsNodeVisible(button);
}

internal static class MenuSurfaceSupport
{
    public static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        string sourceType,
        string flow,
        string reason)
    {
        var context = new MenuBridgeContext("menu", flow);
        var surface = new UnsupportedSurface("unsupported", sourceType, reason);
        return new BridgeObservationDraft(
            BridgeHash.Object(new { game.Version, sourceType, flow, reason }),
            "unsupported",
            context,
            surface,
            new StateCompleteness(
                "binding_unavailable",
                "empty_fail_closed",
                new[] { $"{sourceType} exact current-build binding" },
                new[] { "menu_binding_unavailable" }),
            game,
            new[] { "menu_binding_unavailable" },
            Array.Empty<BridgeActionDraft>());
    }
}
