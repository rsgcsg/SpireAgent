using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal sealed record BridgeInspectionDraft(
    string Kind,
    string VisibilityClass,
    string OrderingSemantics,
    IBridgeInspectionContent Content,
    InspectionCompleteness Completeness);

internal sealed record BridgeInspectionBuildResult(
    BridgeInspectionDraft? Draft,
    string? ErrorCode,
    string? Detail)
{
    public static BridgeInspectionBuildResult Success(BridgeInspectionDraft draft) =>
        new(draft, null, null);

    public static BridgeInspectionBuildResult Failure(string code, string detail) =>
        new(null, code, detail);
}

internal static class BridgeInspectionBuilder
{
    public const string RunDeckKind = "run_deck";
    public const string CombatPilesKind = "combat_piles";

    public static BridgeInspectionBuildResult Build(
        string kind,
        BridgeStateEnvelope current,
        BridgeEntityRegistry entities)
    {
        try
        {
            return kind switch
            {
                RunDeckKind => BuildRunDeck(entities),
                CombatPilesKind => BuildCombatPiles(current, entities),
                _ => BridgeInspectionBuildResult.Failure(
                    "inspection_kind_not_implemented",
                    $"Inspection kind '{kind}' is not implemented by this bridge revision.")
            };
        }
        catch (Exception ex)
        {
            return BridgeInspectionBuildResult.Failure(
                "inspection_binding_failed",
                $"Inspection binding failed closed with {ex.GetType().Name}.");
        }
    }

    private static BridgeInspectionBuildResult BuildRunDeck(BridgeEntityRegistry entities)
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        Player? player = runState == null ? null : LocalContext.GetMe(runState);
        if (player == null)
        {
            return BridgeInspectionBuildResult.Failure(
                "inspection_not_available",
                "Run deck inspection requires a current local singleplayer run.");
        }

        VisibleCard[] cards = BuildCards(player.Deck.Cards, PileType.Deck, entities);
        var content = new RunDeckInspectionContent(RunDeckKind, cards.Length, cards);
        return BridgeInspectionBuildResult.Success(new BridgeInspectionDraft(
            RunDeckKind,
            "normal_inspection",
            "unordered_multiset",
            content,
            new InspectionCompleteness(
                "complete_for_player_run_deck_contents_without_semantic_order",
                new[]
                {
                    "NDeckViewScreen.ShowScreen(Player)",
                    "PileType.Deck.GetPile(Player).Cards",
                    "NDeckViewScreen player-selectable sorting controls",
                    "CardModel player-visible card and enchantment semantics"
                },
                Array.Empty<string>())));
    }

    private static BridgeInspectionBuildResult BuildCombatPiles(
        BridgeStateEnvelope current,
        BridgeEntityRegistry entities)
    {
        if (current.Context is not CombatBridgeContext)
        {
            return BridgeInspectionBuildResult.Failure(
                "inspection_scope_mismatch",
                "Combat pile inspection is available only for a current qualified combat context.");
        }

        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        Player? player = runState == null ? null : LocalContext.GetMe(runState);
        PlayerCombatState? combat = player?.PlayerCombatState;
        if (combat == null)
        {
            return BridgeInspectionBuildResult.Failure(
                "inspection_not_available",
                "Combat pile inspection requires a current local player combat state.");
        }

        CombatPileInspectionZone[] zones =
        {
            BuildZone("draw", combat.DrawPile, PileType.Draw, entities),
            BuildZone("discard", combat.DiscardPile, PileType.Discard, entities),
            BuildZone("exhaust", combat.ExhaustPile, PileType.Exhaust, entities)
        };
        var content = new CombatPilesInspectionContent(CombatPilesKind, zones);
        return BridgeInspectionBuildResult.Success(new BridgeInspectionDraft(
            CombatPilesKind,
            "normal_inspection",
            "unordered_multiset",
            content,
            new InspectionCompleteness(
                "complete_for_player_visible_combat_pile_contents_without_draw_order",
                new[]
                {
                    "NDrawPileButton/NDiscardPileButton/NExhaustPileButton",
                    "NCardPileScreen.Pile.Cards",
                    "NCardPileScreen player-visible card grid",
                    "CardModel.GetDescriptionForPile"
                },
                new[] { "draw_pile_order_hidden_by_policy" })));
    }

    private static CombatPileInspectionZone BuildZone(
        string zone,
        CardPile pile,
        PileType pileType,
        BridgeEntityRegistry entities)
    {
        VisibleCard[] cards = BuildCards(pile.Cards, pileType, entities);
        return new CombatPileInspectionZone(
            zone,
            cards.Length,
            "unordered_multiset",
            cards);
    }

    private static VisibleCard[] BuildCards(
        IEnumerable<CardModel> source,
        PileType displayPile,
        BridgeEntityRegistry entities) =>
        source
            .Select(card => BridgeContextBuilder.BuildCard(
                card,
                entities.GetId(card, "card"),
                displayPile: displayPile))
            // Serialization order is deterministic only. The protocol declares
            // the collection unordered and never exposes the model's draw order.
            .OrderBy(card => card.DefinitionId, StringComparer.Ordinal)
            .ThenBy(card => card.EntityId, StringComparer.Ordinal)
            .ToArray();
}
