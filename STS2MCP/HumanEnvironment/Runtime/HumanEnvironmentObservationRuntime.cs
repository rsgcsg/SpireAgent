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
    internal static HumanEnvironmentRuntimeSnapshot BuildHumanEnvironmentSnapshot(
        bool suppressNativePageEvidence = true)
    {
        GameBuildIdentity game = GatewayAuthorityRuntime.ReadCurrentGameIdentity();
        LiveObservation? sourceFreeSurface =
            HumanGeneratedCardChoiceAdapter.TryBuild(Entities, game)
            ?? HumanCombatPileSelectionAdapter.TryBuild(Entities, game)
            ?? HumanDeckCardSelectionAdapter.TryBuild(Entities, game)
            ?? HumanRestSiteAdapter.TryBuild(Entities, game);
        LiveObservation draft = sourceFreeSurface
            ?? LiveObservationReader.Build(Entities, game);
        if (suppressNativePageEvidence)
            draft = NativePageEvidence.SuppressMutation(draft);
        draft = draft with
        {
            CandidateAdmission = "human_ui",
            AuthorityHandoff = new AuthorityHandoff(
                "human_ui_owned",
                draft.Surface.Kind,
                "The exact current native UI owns input; business source is not action authority.")
        };

        PersistentVisibleStateBuildResult shared = game.Compatibility.StateObservationAllowed
            ? PersistentVisibleStateReader.Build(Entities)
            : new PersistentVisibleStateBuildResult(false, null, null);
        draft = LiveObservationReader.ApplyMissingPersistentStatePolicy(draft, shared);
        bool shopCatalogAvailable = ShopSurfaceFacts.TryGetCurrent(out _, out _, out _);
        PlayerVisibilityProjection inheritedVisibility = PlayerVisibilityCatalog.Build(
            draft,
            shared.State != null,
            shopCatalogAvailable);
        IReadOnlyList<PlayerReadCatalogEntry> inspections =
            BuildHumanInspectionCatalog(draft, shared.State != null, shopCatalogAvailable);
        IReadOnlyList<HumanEnvironmentLinkedDetailCatalogEntry> linkedDetails =
            BuildHumanLinkedDetailCatalog(draft.Surface);
        PlayerVisibilityState visibility = inheritedVisibility.Visibility with
        {
            AvailableInspections = inspections.Select(entry => entry.Kind).ToArray(),
            LinkedDetailKinds = linkedDetails.Select(entry => entry.Kind)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(kind => kind, StringComparer.Ordinal)
                .ToArray(),
            Missing = inheritedVisibility.Visibility.Missing
                .Where(value => value != "linked_entity_detail_catalog_not_implemented")
                .ToArray()
        };
        JsonNode rawSurface = JsonSerializer.SerializeToNode(
            draft.Surface,
            draft.Surface.GetType(),
            McpMod._jsonOptions) ?? new JsonObject();
        HumanEnvironmentInteractionContent surfaceContent =
            ProjectHumanFacts(draft.Surface, draft.Context);
        IReadOnlyList<NativeUiBoundAction> nativeBindings =
            BuildHumanEnvironmentBindings(draft);
        string interactionId = ReadFirstString(
            rawSurface,
            "screen_entity_id",
            "room_entity_id",
            "hand_entity_id",
            "map_screen_entity_id")
            ?? nativeBindings.SelectMany(item => item.Candidate.EntityBindings)
                .FirstOrDefault(entity => IsOwnerRole(entity.Role))?.EntityId
            ?? "interaction_" + StableIdentityHash.Object(new { draft.Surface.Kind, draft.Signature })[..20];
        Dictionary<string, HumanEnvironmentReferent> referents = BuildHumanReferents(
            surfaceContent.Surface,
            draft.Surface,
            nativeBindings,
            rawSurface);
        IReadOnlyList<HumanEnvironmentInteractionCapability> capabilities =
            ProjectInteractionCapabilities(nativeBindings);
        HumanBoundActionProjectionResult projected =
            ProjectBoundActions(nativeBindings, interactionId, referents);
        string stage = ReadFirstString(rawSurface, "stage") ?? draft.Readiness;
        string? prompt = ReadFirstString(rawSurface, "prompt", "body", "message");
        IReadOnlyList<HumanEnvironmentReadOpportunity> reads = inspections
            .Select(entry => new HumanEnvironmentReadOpportunity(
                $"read:{entry.Kind}",
                entry.Kind,
                null,
                ReadContentSchema(entry.Kind),
                entry.VisibilityBasis,
                SnapshotBound: true,
                entry.OrderingSemantics,
                entry.HiddenByPolicy))
            .Concat(linkedDetails.Select(entry => new HumanEnvironmentReadOpportunity(
                $"read:{entry.Kind}:{entry.EntityId}",
                entry.Kind,
                entry.EntityId,
                ReadContentSchema(entry.Kind),
                entry.VisibilityBasis,
                SnapshotBound: true,
                "single_entity",
                Array.Empty<string>())))
            .OrderBy(read => read.ReadId, StringComparer.Ordinal)
            .ToArray();
        string signature = StableIdentityHash.Object(new
        {
            game.Version,
            game.Commit,
            shared.State,
            draft.Readiness,
            surface = surfaceContent,
            interactionId,
            referents = referents.Values.OrderBy(item => item.ReferentId, StringComparer.Ordinal).ToArray(),
            authority = CanonicalAuthoritySignature(nativeBindings),
            reads,
            visibility.HiddenByPolicy
        });
        (string snapshotId, long sequence) = HumanStateIdentity.Observe(signature);
        bool visibleUnsupported = draft.Surface is UnsupportedSurface;
        string status = projected.Projection.TotalCount > 0
            ? "interactive"
            : visibleUnsupported ? "visible_unsupported" : draft.Readiness == "settling" ? "settling" : "observed";
        var observation = new HumanEnvironmentObservationResponse(
            HumanEnvironmentContract.ProtocolVersion,
            HumanEnvironmentContract.ObservationSchema,
            snapshotId,
            sequence,
            DateTimeOffset.UtcNow,
            status,
            shared.State == null
                ? null
                : new HumanEnvironmentContent(
                    "sts2.human-environment/persistent/run-player-1",
                    JsonSerializer.SerializeToNode(shared.State, McpMod._jsonOptions) ?? new JsonObject()),
            new HumanEnvironmentInteraction(
                interactionId,
                draft.Surface.Kind,
                stage,
                prompt,
                SurfaceContentSchema(draft.Surface.Kind),
                surfaceContent,
                capabilities),
            referents.Values.OrderBy(item => item.ReferentId, StringComparer.Ordinal).ToArray(),
            projected.Projection,
            reads,
            HumanCompleteness(
                draft.Completeness,
                visibility.HiddenByPolicy,
                visibleUnsupported ? "visible_unmapped" : null),
            HumanSession(GatewayAuthorityRuntime.HostIdentity(), game),
            HumanObservationPolicy(GatewayAuthorityRuntime.ObservationPolicy()));
        return new HumanEnvironmentRuntimeSnapshot(
            observation,
            draft,
            projected.Bindings);
    }

    internal static HumanEnvironmentHostIdentity HumanHostIdentity(GatewayHostIdentity identity) => new(
        HumanEnvironmentContract.GatewayId,
        HumanEnvironmentContract.GatewayName,
        identity.Version,
        identity.RuntimeInstanceId,
        "live_ui",
        new HumanEnvironmentImplementationIdentity(
            identity.UpstreamCommit,
            identity.ModuleVersionId,
            identity.AssemblyFileSha256));

    internal static HumanEnvironmentGameIdentity HumanGameIdentity(GameBuildIdentity game)
    {
        ModsetIdentity? modset = game.Modset;
        return new HumanEnvironmentGameIdentity(
            game.Version,
            game.Commit,
            game.Branch,
            game.MainAssemblyHash,
            new HumanEnvironmentCompatibility(
                game.Compatibility.Status,
                game.Compatibility.StateObservationAllowed,
                game.Compatibility.Detail),
            new HumanEnvironmentModset(
                modset?.Status ?? "unavailable",
                modset?.Fingerprint ?? "unavailable",
                modset?.FingerprintScope ?? "unavailable",
                modset?.Mods.Select(item => item.Id)
                    .OrderBy(id => id, StringComparer.Ordinal)
                    .ToArray() ?? Array.Empty<string>(),
                modset?.Detail ?? "No loaded Modset identity was available."));
    }

    private static HumanEnvironmentSessionReference HumanSession(
        GatewayHostIdentity identity,
        GameBuildIdentity game) => new(
            identity.RuntimeInstanceId,
            StableIdentityHash.Object(new
            {
                identity.AssemblyFileSha256,
                identity.ModuleVersionId,
                game.Version,
                game.Commit,
                game.MainAssemblyHash,
                Modset = game.Modset?.Fingerprint
            }));

    private static HumanEnvironmentObservationPolicy HumanObservationPolicy(
        ObservationPolicyInfo policy) => new(
            policy.Id,
            policy.Scope,
            policy.IncludesHiddenInformation,
            policy.UnknownFieldBehavior);

    private static HumanEnvironmentAttribution HumanAttribution(
        MutationAttribution value) => new(
            value.RuntimeInstanceId,
            value.ClientSessionId,
            value.ClientInstanceId,
            value.ProductId,
            value.ProductName,
            value.ProductVersion,
            value.ControllerLeaseId,
            value.ControllerGeneration);

}
