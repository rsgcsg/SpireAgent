using STS2_MCP.Authority;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using STS2_MCP.LiveHost;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.HumanEnvironment.Protocol;
using STS2_MCP.NativeUi;

namespace STS2_MCP.HumanEnvironment.Runtime;

internal static partial class HumanEnvironmentRuntime
{
    public static HumanEnvironmentReadResult ReadHumanEnvironment(
        string readId,
        string expectedSnapshotId)
    {
        HumanEnvironmentRuntimeSnapshot snapshot =
            BuildHumanEnvironmentSnapshot();
        HumanEnvironmentObservationResponse observation = snapshot.Observation;
        if (!string.Equals(observation.SnapshotId, expectedSnapshotId, StringComparison.Ordinal))
        {
            return new HumanEnvironmentReadResult(
                null,
                "stale_state",
                "The expected snapshot is no longer current; obtain a fresh Human Environment observation.");
        }
        HumanEnvironmentReadOpportunity? opportunity = observation.Reads.SingleOrDefault(entry =>
            string.Equals(entry.ReadId, readId, StringComparison.Ordinal));
        if (opportunity == null)
        {
            return new HumanEnvironmentReadResult(
                null,
                "read_not_available",
                "This read is not in the current player-visible read catalog.");
        }

        if (opportunity.TargetReferentId != null)
            return ReadLinkedHumanDetail(snapshot, opportunity, expectedSnapshotId);

        PlayerReadBuildResult built = PlayerVisibleReadBuilder.Build(
            opportunity.Kind,
            snapshot.Draft.Context,
            Entities);
        if (built.Draft == null)
            return new HumanEnvironmentReadResult(null, built.ErrorCode, built.Detail);

        PlayerReadDraft draft = built.Draft;
        return new HumanEnvironmentReadResult(
            new HumanEnvironmentReadResponse(
                HumanEnvironmentContract.ProtocolVersion,
                HumanEnvironmentContract.ReadSchema,
                readId,
                expectedSnapshotId,
                observation.SnapshotId,
                DateTimeOffset.UtcNow,
                draft.Kind,
                null,
                opportunity.VisibilityBasis,
                draft.OrderingSemantics,
                ReadContentSchema(draft.Kind),
                JsonSerializer.SerializeToNode(draft.Content, draft.Content.GetType(), McpMod._jsonOptions) ?? new JsonObject(),
                HumanCompleteness(draft.Completeness, Array.Empty<string>()),
                observation.Session,
                observation.ObservationPolicy),
            null,
            null);
    }

    private static HumanEnvironmentReadResult ReadLinkedHumanDetail(
        HumanEnvironmentRuntimeSnapshot snapshot,
        HumanEnvironmentReadOpportunity opportunity,
        string expectedSnapshotId)
    {
        HumanEnvironmentObservationResponse observation = snapshot.Observation;
        if (!string.Equals(opportunity.Kind, "surface_card", StringComparison.Ordinal)
            || opportunity.TargetReferentId == null)
        {
            return new HumanEnvironmentReadResult(
                null,
                "read_kind_not_implemented",
                "This current read kind has no bounded Live host implementation.");
        }
        string referentId = opportunity.TargetReferentId;
        VisibleCard? card = HumanSurfaceCards(snapshot.Draft.Surface)
            .FirstOrDefault(value => string.Equals(
                value.EntityId,
                referentId,
                StringComparison.Ordinal));
        if (card == null)
        {
            return new HumanEnvironmentReadResult(
                null,
                "read_binding_failed",
                "The current card detail could not be rebuilt from the same UI Surface.");
        }

        return new HumanEnvironmentReadResult(
            new HumanEnvironmentReadResponse(
                HumanEnvironmentContract.ProtocolVersion,
                HumanEnvironmentContract.ReadSchema,
                opportunity.ReadId,
                expectedSnapshotId,
                observation.SnapshotId,
                DateTimeOffset.UtcNow,
                opportunity.Kind,
                referentId,
                opportunity.VisibilityBasis,
                opportunity.OrderingSemantics,
                opportunity.ContentSchema,
                JsonSerializer.SerializeToNode(card, McpMod._jsonOptions) ?? new JsonObject(),
                new HumanEnvironmentCompleteness(
                    "complete",
                    "complete_current_player_visible_card_detail",
                    "read_only",
                    Array.Empty<string>(),
                    Array.Empty<string>()),
                observation.Session,
                observation.ObservationPolicy),
            null,
            null);
    }

    private static IReadOnlyList<PlayerReadCatalogEntry> BuildHumanInspectionCatalog(
        LiveObservation draft,
        bool runStateAvailable,
        bool shopCatalogAvailable)
    {
        var entries = new List<PlayerReadCatalogEntry>();
        if (runStateAvailable)
        {
            entries.Add(new PlayerReadCatalogEntry(
                PlayerVisibleReadBuilder.RunDeckKind,
                "active_run",
                "human_visible",
                "player_openable_run_deck_view",
                StateBound: true,
                CreatesActionAuthority: false,
                "unordered_multiset",
                "medium",
                new[] { "deck_planning" },
                Array.Empty<string>()));
        }
        if (draft.Context.Kind == "combat")
        {
            entries.Add(new PlayerReadCatalogEntry(
                PlayerVisibleReadBuilder.CombatPilesKind,
                "current_combat",
                "human_visible",
                "player_openable_draw_discard_exhaust_pile_views",
                StateBound: true,
                CreatesActionAuthority: false,
                "unordered_multiset",
                "medium",
                new[] { "combat_planning" },
                new[] { "draw_pile_true_order" }));
        }
        if (draft.Context.Kind == "shop" && shopCatalogAvailable)
        {
            entries.Add(new PlayerReadCatalogEntry(
                PlayerVisibleReadBuilder.ShopCatalogKind,
                "current_shop",
                "human_visible",
                "player_openable_current_merchant_inventory",
                StateBound: true,
                CreatesActionAuthority: false,
                "fixed_ui_slots",
                "low",
                new[] { "shop_planning" },
                Array.Empty<string>()));
        }
        return entries;
    }

    private static IReadOnlyList<HumanEnvironmentLinkedDetailCatalogEntry>
        BuildHumanLinkedDetailCatalog(ILiveSurface surface) =>
        HumanSurfaceCards(surface)
            .GroupBy(card => card.EntityId, StringComparer.Ordinal)
            .Select(group => new HumanEnvironmentLinkedDetailCatalogEntry(
                "surface_card",
                group.Key,
                "normal_player_visible_surface_card"))
            .OrderBy(entry => entry.EntityId, StringComparer.Ordinal)
            .ToArray();

    private static HumanEnvironmentCompleteness HumanCompleteness(
        StateCompleteness completeness,
        IReadOnlyList<string> hiddenByPolicy,
        string? forcedStatus = null) => new(
            forcedStatus ?? (completeness.Missing.Count == 0 ? "complete" : "partial"),
            completeness.PlayerVisibleSemantics,
            completeness.LegalActions,
            completeness.Missing,
            hiddenByPolicy);

    internal static HumanEnvironmentCompleteness HumanCompleteness(
        PlayerReadCompleteness completeness,
        IReadOnlyList<string> hiddenByPolicy) => new(
            completeness.Missing.Count == 0 ? "complete" : "partial",
            completeness.PlayerVisibleSemantics,
            "read_only",
            completeness.Missing,
            hiddenByPolicy);

}
