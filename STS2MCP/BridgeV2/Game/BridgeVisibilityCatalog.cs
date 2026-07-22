using System;
using System.Collections.Generic;
using System.Linq;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal sealed record BridgeVisibilityProjection(
    BridgeVisibilityState Visibility,
    IReadOnlyList<BridgeInspectionCatalogEntry> InspectionCatalog);

/// <summary>
/// Read-only visibility inventory. It describes what the current player may
/// inspect; it never grants action or Inspection authority by itself.
/// </summary>
internal static class BridgeVisibilityCatalog
{
    public static BridgeVisibilityProjection Build(
        BridgeObservationDraft draft,
        bool activeRunSharedStateAvailable,
        bool shopCatalogSourceAvailable)
    {
        var entries = new List<BridgeInspectionCatalogEntry>();
        foreach (string kind in BridgeSurfacePermission.PermittedInspectionKinds(
                     draft.Game.Compatibility,
                     BridgeContractManifest.ImplementedInspectionKinds))
        {
            if (kind == BridgeInspectionBuilder.RunDeckKind && activeRunSharedStateAvailable)
            {
                entries.Add(new BridgeInspectionCatalogEntry(
                    kind,
                    "active_run",
                    Availability(draft.Game.Compatibility, kind),
                    "player_openable_run_deck_view",
                    StateBound: true,
                    CreatesActionAuthority: false,
                    "unordered_multiset",
                    "medium",
                    new[] { "card_acquisition", "deck_upgrade", "deck_removal", "deck_transform", "shop" },
                    Array.Empty<string>()));
            }
            else if (kind == BridgeInspectionBuilder.CombatPilesKind && draft.Context.Kind == "combat")
            {
                entries.Add(new BridgeInspectionCatalogEntry(
                    kind,
                    "current_combat",
                    Availability(draft.Game.Compatibility, kind),
                    "player_openable_draw_discard_exhaust_pile_views",
                    StateBound: true,
                    CreatesActionAuthority: false,
                    "unordered_multiset",
                    "medium",
                    new[] { "combat_planning", "discard_sensitive_effect", "exhaust_sensitive_effect" },
                    new[] { "draw_pile_true_order" }));
            }
            else if (kind == BridgeInspectionBuilder.ShopCatalogKind
                     && draft.Context.Kind == "shop"
                     && shopCatalogSourceAvailable)
            {
                entries.Add(new BridgeInspectionCatalogEntry(
                    kind,
                    "current_shop",
                    Availability(draft.Game.Compatibility, kind),
                    "player_openable_current_merchant_inventory",
                    StateBound: true,
                    CreatesActionAuthority: false,
                    "fixed_ui_slots",
                    "low",
                    new[] { "shop_planning", "purchase_comparison", "leave_shop_decision" },
                    Array.Empty<string>()));
            }
        }

        string[] hidden = draft.Context.Kind == "combat"
            ? new[] { "hidden_rng", "draw_pile_true_order", "future_enemy_moves", "future_rewards", "future_events" }
            : new[] { "hidden_rng", "future_rewards", "future_events" };
        string[] missing = draft.Completeness.Missing
            .Append("player_visible_closure_catalog_is_incremental")
            .Append("linked_entity_detail_catalog_not_implemented")
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        var visibility = new BridgeVisibilityState(
            $"{draft.Context.Kind}.{draft.Surface.Kind}.v1",
            draft.Completeness.Missing.Count == 0 ? "complete" : "partial",
            "partial_catalog",
            entries.Select(entry => entry.Kind).ToArray(),
            Array.Empty<string>(),
            hidden,
            missing,
            "fail_closed");
        return new BridgeVisibilityProjection(visibility, entries);
    }

    private static string Availability(CompatibilityAssessment compatibility, string kind) =>
        compatibility.InspectionAllowedKinds.Contains(kind, StringComparer.Ordinal)
            ? "qualified"
            : compatibility.InspectionCanaryKinds.Contains(kind, StringComparer.Ordinal)
                ? "canary"
                : "unavailable";
}
