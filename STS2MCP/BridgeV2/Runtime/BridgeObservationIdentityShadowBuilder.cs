using System;
using System.Linq;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

/// <summary>
/// Produces non-authorizing candidate identities for evaluating a future split
/// between game-semantic state and the current operation authority projection.
/// The live state id and action bindings deliberately remain unchanged.
/// </summary>
internal static class BridgeObservationIdentityShadowBuilder
{
    public static BridgeObservationIdentityShadow Build(
        BridgeObservationDraft draft,
        SharedVisibleState? sharedState)
    {
        string semanticStateId = "semantic_state_candidate_" + BridgeHash.Object(new
        {
            draft.Signature,
            sharedState
        });

        var operations = draft.Actions
            .Select(action => new { action.Kind, action.Key })
            .Distinct()
            .OrderBy(action => action.Kind, StringComparer.Ordinal)
            .ThenBy(action => action.Key, StringComparer.Ordinal)
            .ToArray();
        string[] operationKinds = operations
            .Select(action => action.Kind)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        var relevantScopes = draft.Game.Compatibility.ActionPermissionScopes
            .Where(scope =>
                string.Equals(scope.SurfaceKind, draft.Surface.Kind, StringComparison.Ordinal)
                && operationKinds.Contains(scope.Operation, StringComparer.Ordinal))
            .Select(scope => new
            {
                scope.SurfaceKind,
                scope.Operation,
                scope.Tier,
                scope.GrantId,
                scope.GrantVersion,
                scope.RuntimeEpoch,
                scope.EnvironmentDigest,
                scope.PatchDigest,
                scope.OperationFingerprint
            })
            .OrderBy(scope => scope.Operation, StringComparer.Ordinal)
            .ThenBy(scope => scope.Tier, StringComparer.Ordinal)
            .ThenBy(scope => scope.GrantId, StringComparer.Ordinal)
            .ThenBy(scope => scope.GrantVersion)
            .ToArray();
        string authorityProjectionId = "authority_projection_candidate_" + BridgeHash.Object(new
        {
            surfaceKind = draft.Surface.Kind,
            draft.Readiness,
            authorityHandoff = draft.AuthorityHandoff,
            draft.Game.Compatibility.ActionExecutionAllowed,
            operations,
            relevantScopes
        });

        return new BridgeObservationIdentityShadow(
            1,
            "candidate_non_authorizing",
            semanticStateId,
            authorityProjectionId,
            "legacy_authoritative_composite",
            ActionBindingUsesCurrentStateId: true,
            Authorizing: false,
            new[]
            {
                "surface_provider_signature",
                "shared_player_visible_state"
            },
            new[]
            {
                "active_surface_kind",
                "current_opaque_action_keys_and_operations",
                "current_matching_operation_permission_scopes",
                "authority_handoff",
                "action_execution_allowed"
            },
            new[]
            {
                "shadow_only_not_used_for_state_or_action_identity",
                "not_a_compatibility_or_qualification_claim",
                "semantic_candidate_inherits_provider_signature_inputs",
                "authority_candidate_does_not_replace_execute_time_revalidation"
            });
    }
}
