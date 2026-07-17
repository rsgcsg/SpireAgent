using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Godot;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Helpers;
using MegaCrit.Sts2.Core.Localization;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Characters;
using MegaCrit.Sts2.Core.Multiplayer;
using MegaCrit.Sts2.Core.Multiplayer.Game;
using MegaCrit.Sts2.Core.Multiplayer.Game.Lobby;
using MegaCrit.Sts2.Core.Nodes;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.GodotExtensions;
using MegaCrit.Sts2.Core.Nodes.Screens.CharacterSelect;
using MegaCrit.Sts2.Core.Runs;
using MegaCrit.Sts2.Core.Saves;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal sealed class CharacterSelectSurfaceProvider : IBridgeSurfaceProvider
{
    public string Kind => "character_select";

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Menu;

    private const BindingFlags PrivateInstance = BindingFlags.Instance | BindingFlags.NonPublic;
    private static readonly FieldInfo? LobbyField =
        typeof(NCharacterSelectScreen).GetField("_lobby", PrivateInstance);

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.MenuSubmenu is not NCharacterSelectScreen screen)
            return null;
        if (!TryGetSingleplayerLobby(screen, out StartRunLobby? lobby))
            return BindingUnavailable(game, "The visible character-select screen is not an exact single-player lobby binding.");

        Control container;
        NAscensionPanel ascensionPanel;
        NButton leftArrow;
        NButton rightArrow;
        NConfirmButton embark;
        NBackButton back;
        try
        {
            container = screen.GetNode<Control>("CharSelectButtons/ButtonContainer");
            ascensionPanel = screen.GetNode<NAscensionPanel>("%AscensionPanel");
            leftArrow = ascensionPanel.GetNode<NButton>("HBoxContainer/LeftArrowContainer/LeftArrow");
            rightArrow = ascensionPanel.GetNode<NButton>("HBoxContainer/RightArrowContainer/RightArrow");
            embark = screen.GetNode<NConfirmButton>("ConfirmButton");
            back = screen.GetNode<NBackButton>("BackButton");
        }
        catch (Exception ex)
        {
            return BindingUnavailable(game, $"Character-select control binding failed: {ex.GetType().Name}.");
        }

        NCharacterSelectButton[] buttons = container.GetChildren()
            .OfType<NCharacterSelectButton>()
            .Where(McpMod.IsNodeVisible)
            .ToArray();
        if (buttons.Length == 0 || buttons.Count(button => button.IsSelected) != 1)
            return BindingUnavailable(game, "Character-select must expose exactly one selected visible character button.");

        NCharacterSelectButton selected = buttons.Single(button => button.IsSelected);
        string screenId = entities.GetId(screen, "screen");
        VisibleCharacterChoice[] visibleCharacters = buttons.Select((button, index) =>
        {
            CharacterModel character = button.Character;
            return new VisibleCharacterChoice(
                entities.GetId(button, "character_choice"),
                index,
                character.Id.Entry,
                CharacterTitle(character),
                button.IsLocked,
                button.IsSelected,
                button.IsRandom);
        }).ToArray();

        VisibleSelectedCharacterDetails selectedDetails = BuildSelectedDetails(selected);
        bool ascensionVisible = McpMod.IsNodeVisible(ascensionPanel);
        int? ascension = ascensionVisible ? ascensionPanel.Ascension : null;
        bool tutorialGateClear = SaveManager.Instance.SeenFtue("accept_tutorials_ftue");
        bool canEmbark = tutorialGateClear
                         && embark.IsEnabled
                         && McpMod.IsNodeVisible(embark)
                         && !selected.IsLocked;
        bool canGoBack = back.IsEnabled && McpMod.IsNodeVisible(back);
        bool canDecreaseAscension = ascensionVisible
                                    && leftArrow.IsEnabled
                                    && McpMod.IsNodeVisible(leftArrow);
        bool canIncreaseAscension = ascensionVisible
                                    && rightArrow.IsEnabled
                                    && McpMod.IsNodeVisible(rightArrow);

        var actions = new List<BridgeActionDraft>();
        foreach (NCharacterSelectButton button in buttons.Where(button =>
                     !button.IsLocked && !button.IsSelected && button.IsEnabled))
        {
            string choiceId = entities.GetId(button, "character_choice");
            actions.Add(new BridgeActionDraft(
                $"select_character:{choiceId}",
                "select_character",
                "selection",
                $"Select {CharacterTitle(button.Character)}",
                "NCharacterSelectButton.Select+exact-selected-button-witness",
                () => StartSelect(screen, lobby!, button),
                new[] { new ActionEntityBinding("character_choice", choiceId) }));
        }
        if (canDecreaseAscension)
        {
            actions.Add(new BridgeActionDraft(
                $"decrease_ascension:{screenId}:{ascension}",
                "decrease_ascension",
                "configuration",
                "Decrease Ascension",
                "NAscensionPanel.LeftArrow+exact-level-witness",
                () => StartAscensionChange(screen, lobby!, ascensionPanel, leftArrow, -1),
                new[] { new ActionEntityBinding("screen", screenId) }));
        }
        if (canIncreaseAscension)
        {
            actions.Add(new BridgeActionDraft(
                $"increase_ascension:{screenId}:{ascension}",
                "increase_ascension",
                "configuration",
                "Increase Ascension",
                "NAscensionPanel.RightArrow+exact-level-witness",
                () => StartAscensionChange(screen, lobby!, ascensionPanel, rightArrow, 1),
                new[] { new ActionEntityBinding("screen", screenId) }));
        }
        if (canEmbark)
        {
            actions.Add(new BridgeActionDraft(
                $"embark_standard_run:{screenId}:{selected.Character.Id.Entry}:{ascension ?? 0}",
                "embark_standard_run",
                "commit",
                "Embark",
                "NCharacterSelectScreen.ConfirmButton+RunManager-active-run-witness",
                () => StartEmbark(screen, lobby!, selected, embark),
                new[]
                {
                    new ActionEntityBinding("screen", screenId),
                    new ActionEntityBinding("character_choice", entities.GetId(selected, "character_choice"))
                }));
        }
        if (canGoBack)
        {
            actions.Add(new BridgeActionDraft(
                $"back_from_character_select:{screenId}",
                "back_from_character_select",
                "navigation",
                "Back",
                "NCharacterSelectScreen.BackButton+submenu-owner-change-witness",
                () => StartBack(screen, lobby!, back),
                new[] { new ActionEntityBinding("screen", screenId) }));
        }

        string stage = actions.Count == 0 ? "transitioning" : "choosing";
        var surface = new CharacterSelectSurface(
            Kind,
            stage,
            screenId,
            visibleCharacters,
            selectedDetails,
            ascension,
            ascensionVisible ? AscensionHelper.GetTitle(ascensionPanel.Ascension).GetFormattedText() : null,
            ascensionVisible ? AscensionHelper.GetDescription(ascensionPanel.Ascension).GetFormattedText() : null,
            canDecreaseAscension,
            canIncreaseAscension,
            canEmbark,
            canGoBack);
        string[] missing = tutorialGateClear
            ? Array.Empty<string>()
            : new[] { "accept_tutorials_ftue_child_surface" };
        var completeness = new StateCompleteness(
            tutorialGateClear
                ? "contract_complete_for_singleplayer_character_select"
                : "contract_incomplete_for_first_run_tutorial_child",
            actions.Count > 0
                ? "derived_from_exact_visible_character_and_menu_controls"
                : "temporarily_empty_during_character_select_transition",
            new[]
            {
                "NCharacterSelectScreen single-player StartRunLobby",
                "visible NCharacterSelectButton controls",
                "selected character info-panel source fields",
                "visible NAscensionPanel controls",
                "ConfirmButton and BackButton"
            },
            missing);
        string signature = BridgeHash.Object(new
        {
            game.Version,
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            actions.Count > 0 ? "ready" : "settling",
            new MenuBridgeContext("menu", "standard_run_setup"),
            surface,
            completeness,
            game,
            missing.Length == 0
                ? Array.Empty<string>()
                : new[] { "first_run_tutorial_child_not_implemented" },
            actions);
    }

    private static VisibleSelectedCharacterDetails BuildSelectedDetails(NCharacterSelectButton selected)
    {
        CharacterModel character = selected.Character;
        if (selected.IsRandom)
        {
            return new VisibleSelectedCharacterDetails(
                character.Id.Entry,
                CharacterTitle(character),
                CharacterDescription(character),
                null,
                null,
                null);
        }

        var relic = character.StartingRelics[0];
        return new VisibleSelectedCharacterDetails(
            character.Id.Entry,
            CharacterTitle(character),
            CharacterDescription(character),
            character.StartingHp,
            character.StartingGold,
            new VisibleStartingRelic(
                relic.Id.Entry,
                McpMod.SafeGetText(() => relic.Title.GetFormattedText()),
                McpMod.SafeGetText(() => relic.DynamicDescription.GetFormattedText())));
    }

    private static string CharacterTitle(CharacterModel character) =>
        McpMod.SafeGetText(() => new LocString("characters", character.CharacterSelectTitle).GetFormattedText())
        ?? character.Id.Entry;

    private static string? CharacterDescription(CharacterModel character) =>
        McpMod.SafeGetText(() => new LocString("characters", character.CharacterSelectDesc).GetFormattedText());

    private static BridgeActionStartResult StartSelect(
        NCharacterSelectScreen expectedScreen,
        StartRunLobby expectedLobby,
        NCharacterSelectButton expectedButton)
    {
        if (!IsCurrentSingleplayerScreen(expectedScreen, expectedLobby)
            || !McpMod.IsLiveNode(expectedButton)
            || !McpMod.IsNodeVisible(expectedButton)
            || !expectedButton.IsEnabled
            || expectedButton.IsLocked
            || expectedButton.IsSelected)
        {
            return BridgeActionStartResult.Rejected(
                "character_choice_changed",
                "The advertised character is no longer current and selectable.");
        }

        expectedButton.Select();
        return BridgeActionStartResult.Started(
            () => IsCurrentSingleplayerScreen(expectedScreen, expectedLobby)
                  && expectedButton.IsSelected,
            "exact_character_button_selected");
    }

    private static BridgeActionStartResult StartAscensionChange(
        NCharacterSelectScreen expectedScreen,
        StartRunLobby expectedLobby,
        NAscensionPanel expectedPanel,
        NButton expectedArrow,
        int delta)
    {
        int before = expectedPanel.Ascension;
        if (!IsCurrentSingleplayerScreen(expectedScreen, expectedLobby)
            || !McpMod.IsLiveNode(expectedPanel)
            || !McpMod.IsNodeVisible(expectedPanel)
            || !McpMod.IsLiveNode(expectedArrow)
            || !McpMod.IsNodeVisible(expectedArrow)
            || !expectedArrow.IsEnabled)
        {
            return BridgeActionStartResult.Rejected(
                "ascension_control_changed",
                "The advertised Ascension control is no longer current and enabled.");
        }

        expectedArrow.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrentSingleplayerScreen(expectedScreen, expectedLobby)
                  && expectedPanel.Ascension == before + delta,
            "exact_ascension_level_changed");
    }

    private static BridgeActionStartResult StartEmbark(
        NCharacterSelectScreen expectedScreen,
        StartRunLobby expectedLobby,
        NCharacterSelectButton expectedSelected,
        NConfirmButton expectedEmbark)
    {
        if (!IsCurrentSingleplayerScreen(expectedScreen, expectedLobby)
            || !SaveManager.Instance.SeenFtue("accept_tutorials_ftue")
            || !expectedSelected.IsSelected
            || expectedSelected.IsLocked
            || !expectedEmbark.IsEnabled
            || !McpMod.IsNodeVisible(expectedEmbark))
        {
            return BridgeActionStartResult.Rejected(
                "character_embark_changed",
                "The advertised character-select commit is no longer current and enabled.");
        }

        bool random = expectedSelected.IsRandom;
        string selectedCharacterId = expectedSelected.Character.Id.Entry;
        expectedEmbark.ForceClick();
        return BridgeActionStartResult.Started(
            () => RunManager.Instance.IsInProgress
                  && RunManager.Instance.DebugOnlyGetState() is { } run
                  && (random || string.Equals(
                      LocalContext.GetMe(run)?.Character.Id.Entry,
                      selectedCharacterId,
                      StringComparison.Ordinal)),
            "singleplayer_run_active_with_selected_character",
            allowIntermediateStateChanges: true);
    }

    private static BridgeActionStartResult StartBack(
        NCharacterSelectScreen expectedScreen,
        StartRunLobby expectedLobby,
        NBackButton expectedBack)
    {
        if (!IsCurrentSingleplayerScreen(expectedScreen, expectedLobby)
            || !expectedBack.IsEnabled
            || !McpMod.IsNodeVisible(expectedBack))
        {
            return BridgeActionStartResult.Rejected(
                "character_select_back_changed",
                "The advertised character-select Back control is no longer current and enabled.");
        }

        expectedBack.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrentSingleplayerScreen(expectedScreen, expectedLobby),
            "character_select_submenu_owner_changed",
            allowIntermediateStateChanges: true);
    }

    private static bool IsCurrentSingleplayerScreen(
        NCharacterSelectScreen expectedScreen,
        StartRunLobby expectedLobby) =>
        !RunManager.Instance.IsInProgress
        && McpMod.IsLiveNode(expectedScreen)
        && McpMod.IsNodeVisible(expectedScreen)
        && TryGetSingleplayerLobby(expectedScreen, out StartRunLobby? currentLobby)
        && ReferenceEquals(currentLobby, expectedLobby);

    private static bool TryGetSingleplayerLobby(
        NCharacterSelectScreen screen,
        out StartRunLobby? lobby)
    {
        lobby = LobbyField?.GetValue(screen) as StartRunLobby;
        return lobby?.NetService.Type == NetGameType.Singleplayer;
    }

    private static BridgeObservationDraft BindingUnavailable(GameBuildIdentity game, string reason)
    {
        var context = new MenuBridgeContext("menu", "standard_run_setup");
        var surface = new UnsupportedSurface("unsupported", nameof(NCharacterSelectScreen), reason);
        var completeness = new StateCompleteness(
            "binding_unavailable",
            "empty_fail_closed",
            new[] { "NCharacterSelectScreen exact current-build binding" },
            new[] { "player_visible_semantics", "legal_actions" });
        return new BridgeObservationDraft(
            BridgeHash.Object(new { game.Version, context, surface, reason }),
            "unsupported",
            context,
            surface,
            completeness,
            game,
            new[] { "character_select_binding_unavailable" },
            Array.Empty<BridgeActionDraft>());
    }
}
