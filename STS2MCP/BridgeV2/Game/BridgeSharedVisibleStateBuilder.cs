using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal sealed record BridgeSharedVisibleStateBuildResult(
    bool RunActive,
    SharedVisibleState? State,
    BridgeDiagnostic? Failure);

/// <summary>
/// Projects strategy-relevant facts rendered by the persistent single-player
/// run HUD. It does not inspect optional overlays and cannot publish actions.
/// </summary>
internal static class BridgeSharedVisibleStateBuilder
{
    public static BridgeSharedVisibleStateBuildResult Build(BridgeEntityRegistry entities)
    {
        bool runActive;
        try
        {
            runActive = RunManager.Instance.IsInProgress;
        }
        catch (Exception ex)
        {
            return Failed(true, "run_activity_read_failed", ex);
        }

        if (!runActive)
            return new BridgeSharedVisibleStateBuildResult(false, null, null);
        if (McpMod.IsMultiplayerRun())
            return Failed(true, "multiplayer_shared_state_not_implemented", new NotSupportedException());

        try
        {
            RunState run = RunManager.Instance.DebugOnlyGetState()
                ?? throw new InvalidOperationException("Run state is unavailable while a run is active.");
            Player player = LocalContext.GetMe(run)
                ?? throw new InvalidOperationException("Local player is unavailable while a run is active.");

            VisibleBoss[] bosses = new[] { run.Act.BossEncounter, run.Act.SecondBossEncounter }
                .Where(boss => boss != null)
                .Select((boss, index) => new VisibleBoss(
                    boss!.Id.Entry,
                    McpMod.SafeGetText(() => boss.Title),
                    index))
                .ToArray();
            VisibleRunModifier[] modifiers = run.Modifiers.Select(modifier =>
            {
                string ownerEntityId = entities.GetId(modifier, "run_modifier");
                BridgeVisibleEntityFacts.HoverFacts hover =
                    BridgeVisibleEntityFacts.BuildHoverFacts(modifier.HoverTips, ownerEntityId);
                return new VisibleRunModifier(
                    modifier.Id.Entry,
                    McpMod.SafeGetText(() => modifier.Title),
                    McpMod.SafeGetText(() => modifier.Description),
                    hover.Keywords,
                    hover.CardPreviews);
            }).ToArray();
            VisibleRelic[] relics = player.Relics
                .Select(relic => BridgeVisibleEntityFacts.BuildRelic(relic, entities))
                .ToArray();
            var potions = new List<VisibleOwnedPotion>();
            for (int slot = 0; slot < player.PotionSlots.Count; slot++)
            {
                PotionModel? potion = player.GetPotionAtSlotIndex(slot);
                if (potion != null)
                    potions.Add(BridgeVisibleEntityFacts.BuildOwnedPotion(potion, slot, entities));
            }

            var state = new SharedVisibleState(
                "active_single_player_run",
                new VisibleRunHud(
                    run.CurrentActIndex + 1,
                    run.Act.Id.Entry,
                    McpMod.SafeGetText(() => run.Act.Title),
                    run.TotalFloor,
                    run.AscensionLevel,
                    bosses,
                    modifiers),
                new VisiblePlayerHud(
                    entities.GetId(player.Creature, "player"),
                    player.Character.Id.Entry,
                    McpMod.SafeGetText(() => player.Character.Title),
                    player.Creature.CurrentHp,
                    player.Creature.MaxHp,
                    player.Gold,
                    relics,
                    potions,
                    player.MaxPotionCount),
                new SharedStateCompleteness(
                    "complete_for_strategy_relevant_persistent_single_player_hud",
                    new[]
                    {
                        "RunState.CurrentActIndex+Act+TotalFloor+AscensionLevel+Modifiers",
                        "NTopBar+NTopBarBossIcon+NTopBarFloorIcon+NTopBarHp+NTopBarGold",
                        "NRelicInventory+NPotionContainer+LocalContext.GetMe"
                    },
                    Array.Empty<string>()));
            return new BridgeSharedVisibleStateBuildResult(true, state, null);
        }
        catch (Exception ex)
        {
            return Failed(true, "shared_visible_state_build_failed", ex);
        }
    }

    private static BridgeSharedVisibleStateBuildResult Failed(
        bool runActive,
        string code,
        Exception exception) => new(
            runActive,
            null,
            BridgeDiagnostics.Create(
                $"bridge.shared_state.{code}",
                "error",
                "visibility",
                "actions_suppressed",
                "restart",
                exception.GetType().Name));
}
