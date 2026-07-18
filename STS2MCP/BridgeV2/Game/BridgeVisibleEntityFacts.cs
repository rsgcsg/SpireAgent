using System;
using System.Collections.Generic;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Entities.Cards;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Shared, read-only projection mechanics for entities that the normal UI
/// renders in more than one semantic surface. This helper grants no authority.
/// </summary>
internal static class BridgeVisibleEntityFacts
{
    internal sealed record HoverFacts(
        IReadOnlyList<VisibleKeyword> Keywords,
        IReadOnlyList<VisibleCard> CardPreviews);

    public static VisibleRelic BuildRelic(RelicModel relic, BridgeEntityRegistry entities)
    {
        string entityId = entities.GetId(relic, "relic");
        HoverFacts hover = BuildHoverFacts(relic.HoverTipsExcludingRelic, entityId);
        return new VisibleRelic(
            entityId,
            relic.Id.Entry,
            McpMod.SafeGetText(() => relic.Title),
            McpMod.SafeGetText(() => relic.DynamicDescription),
            relic.ShowCounter ? relic.DisplayAmount : null,
            hover.Keywords,
            hover.CardPreviews);
    }

    public static VisibleOwnedPotion BuildOwnedPotion(
        PotionModel potion,
        int slot,
        BridgeEntityRegistry entities)
    {
        string entityId = entities.GetId(potion, "potion");
        HoverFacts hover = BuildHoverFacts(potion.ExtraHoverTips, entityId);
        return new VisibleOwnedPotion(
            entityId,
            potion.Id.Entry,
            McpMod.SafeGetText(() => potion.Title),
            McpMod.SafeGetText(() => potion.DynamicDescription),
            slot,
            hover.Keywords,
            hover.CardPreviews);
    }

    public static HoverFacts BuildHoverFacts(
        IEnumerable<IHoverTip> tips,
        string ownerEntityId)
    {
        var keywords = new List<VisibleKeyword>();
        var cardPreviews = new List<VisibleCard>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        int cardOrdinal = 0;
        foreach (IHoverTip tip in IHoverTip.RemoveDupes(tips))
        {
            switch (tip)
            {
                case HoverTip hoverTip:
                {
                    string? name = hoverTip.Title == null
                        ? null
                        : McpMod.StripRichTextTags(hoverTip.Title);
                    string? description = McpMod.StripRichTextTags(hoverTip.Description);
                    string? key = name ?? description;
                    if (key != null && seen.Add($"text:{key}"))
                        keywords.Add(new VisibleKeyword(name ?? "Unnamed", description));
                    break;
                }
                case CardHoverTip cardTip:
                {
                    CardModel card = cardTip.Card;
                    if (seen.Add($"card:{cardTip.Id}"))
                    {
                        cardPreviews.Add(BridgeContextBuilder.BuildCard(
                            card,
                            BuildTooltipCardEntityId(ownerEntityId, card.Id.Entry, cardOrdinal++),
                            displayPile: PileType.None));
                    }
                    break;
                }
                default:
                    throw new NotSupportedException($"Unsupported visible hover-tip type: {tip.GetType().Name}");
            }
        }
        return new HoverFacts(keywords, cardPreviews);
    }

    public static IReadOnlyList<VisibleKeyword> BuildKeywords(
        IEnumerable<IHoverTip> tips,
        string ownerEntityId) => BuildHoverFacts(tips, ownerEntityId).Keywords;

    internal static string BuildTooltipCardEntityId(
        string ownerEntityId,
        string cardDefinitionId,
        int ordinal)
    {
        string digest = BridgeHash.Text($"{ownerEntityId}|{cardDefinitionId}|{ordinal}")[..20];
        return $"tooltip_card_{digest}";
    }
}
