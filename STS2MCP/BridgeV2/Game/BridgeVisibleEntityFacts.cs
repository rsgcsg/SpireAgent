using System;
using System.Collections.Generic;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Models;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Shared, read-only projection mechanics for entities that the normal UI
/// renders in more than one semantic surface. This helper grants no authority.
/// </summary>
internal static class BridgeVisibleEntityFacts
{
    public static VisibleRelic BuildRelic(RelicModel relic, BridgeEntityRegistry entities) => new(
        entities.GetId(relic, "relic"),
        relic.Id.Entry,
        McpMod.SafeGetText(() => relic.Title),
        McpMod.SafeGetText(() => relic.DynamicDescription),
        relic.ShowCounter ? relic.DisplayAmount : null,
        BuildKeywords(relic.HoverTipsExcludingRelic));

    public static VisibleOwnedPotion BuildOwnedPotion(
        PotionModel potion,
        int slot,
        BridgeEntityRegistry entities) => new(
            entities.GetId(potion, "potion"),
            potion.Id.Entry,
            McpMod.SafeGetText(() => potion.Title),
            McpMod.SafeGetText(() => potion.DynamicDescription),
            slot,
            BuildKeywords(potion.ExtraHoverTips));

    public static IReadOnlyList<VisibleKeyword> BuildKeywords(IEnumerable<IHoverTip> tips)
    {
        var result = new List<VisibleKeyword>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (IHoverTip tip in IHoverTip.RemoveDupes(tips))
        {
            if (tip is not HoverTip hoverTip)
                throw new NotSupportedException($"Unsupported visible hover-tip type: {tip.GetType().Name}");
            string? name = hoverTip.Title == null
                ? null
                : McpMod.StripRichTextTags(hoverTip.Title);
            string? description = McpMod.StripRichTextTags(hoverTip.Description);
            string? key = name ?? description;
            if (key == null || !seen.Add(key))
                continue;
            result.Add(new VisibleKeyword(name ?? "Unnamed", description));
        }
        return result;
    }
}
