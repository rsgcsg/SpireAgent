using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Models;

namespace STS2_MCP.BridgeV2.Game;

internal sealed record CombatPileSourceContract(
    string SourceType,
    string HookMode,
    string SourceKind,
    string SourceDisplayName,
    string Purpose,
    string MutationKind,
    string CommitMode,
    string SourcePile,
    string DestinationPile,
    string DestinationPosition,
    string? OverflowDestination,
    string? ReplacementCardDefinitionId,
    string? ReplacementUpgradePolicy,
    string SelectionBounds,
    int SelectionCount,
    string WitnessKind,
    string Completeness,
    string CommitEvidence,
    string SelectLabel,
    string DeselectLabel,
    string CompletionEvidence)
{
    public string Label(string cardName, bool selected) =>
        (selected ? DeselectLabel : SelectLabel).Replace("{card}", cardName, StringComparison.Ordinal);
}

internal static class CombatPileSourceContractRegistry
{
    private const string ResourceName =
        "STS2_MCP.BridgeV2.Game.combat-pile-source-contracts.json";
    private static readonly Lazy<RegistryLoadResult> Loaded = new(Load);

    public static IReadOnlyList<CombatPileSourceContract> Contracts => Loaded.Value.Contracts;

    public static string? LoadError => Loaded.Value.Error;

    public static bool TryFind(
        Type sourceType,
        string hookMode,
        out CombatPileSourceContract? contract)
    {
        contract = Contracts.SingleOrDefault(candidate =>
            string.Equals(candidate.SourceType, sourceType.FullName, StringComparison.Ordinal)
            && string.Equals(candidate.HookMode, hookMode, StringComparison.Ordinal));
        return contract != null;
    }

    public static IReadOnlyList<MethodBase> ResolveDeclaredOnPlayTargets()
    {
        var result = new List<MethodBase>();
        foreach (CombatPileSourceContract contract in Contracts.Where(candidate =>
                     candidate.HookMode == "declared_on_play"))
        {
            MethodInfo? method = ResolveDeclaredOnPlayMethod(contract.SourceType);
            if (method == null)
                return Array.Empty<MethodBase>();
            result.Add(method);
        }
        return result;
    }

    private static Type? AccessType(string fullName) =>
        typeof(CardModel).Assembly.GetType(fullName, throwOnError: false, ignoreCase: false);

    private static MethodInfo? ResolveDeclaredOnPlayMethod(string sourceType)
    {
        Type? type = AccessType(sourceType);
        MethodInfo? method = type?.GetMethod(
            "OnPlay",
            BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.DeclaredOnly,
            binder: null,
            new[] { typeof(PlayerChoiceContext), typeof(CardPlay) },
            modifiers: null);
        return method?.ReturnType == typeof(System.Threading.Tasks.Task) ? method : null;
    }

    private static RegistryLoadResult Load()
    {
        try
        {
            using Stream? stream = typeof(CombatPileSourceContractRegistry).Assembly
                .GetManifestResourceStream(ResourceName);
            if (stream == null)
                return RegistryLoadResult.Failed($"Missing embedded resource {ResourceName}.");

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                PropertyNameCaseInsensitive = true
            };
            RegistryDocument? document =
                JsonSerializer.Deserialize<RegistryDocument>(stream, options);
            if (document == null)
                return RegistryLoadResult.Failed("Combat-pile source registry is empty.");
            if (document.SchemaVersion != 1
                || document.RegistryId != "combat_pile_source_contracts_v1"
                || document.AuthorizationMode != "reviewed_embedded_policy_only")
            {
                return RegistryLoadResult.Failed(
                    "Combat-pile source registry metadata is unsupported.");
            }

            string? validationError = Validate(document.Contracts);
            return validationError == null
                ? new RegistryLoadResult(document.Contracts, null)
                : RegistryLoadResult.Failed(validationError);
        }
        catch (Exception ex) when (ex is IOException or JsonException)
        {
            return RegistryLoadResult.Failed(
                $"Combat-pile source registry failed closed with {ex.GetType().Name}.");
        }
    }

    private static string? Validate(IReadOnlyList<CombatPileSourceContract> contracts)
    {
        if (contracts.Count == 0)
            return "Combat-pile source registry has no contracts.";
        if (contracts.Any(contract =>
                string.IsNullOrWhiteSpace(contract.SourceType)
                || string.IsNullOrWhiteSpace(contract.SourceKind)
                || string.IsNullOrWhiteSpace(contract.Purpose)
                || string.IsNullOrWhiteSpace(contract.CommitEvidence)
                || string.IsNullOrWhiteSpace(contract.CompletionEvidence)))
        {
            return "Combat-pile source registry contains an incomplete contract.";
        }
        if (contracts.GroupBy(contract => (contract.SourceType, contract.HookMode))
            .Any(group => group.Count() != 1))
        {
            return "Combat-pile source registry contains duplicate source bindings.";
        }
        if (contracts.GroupBy(contract => contract.SourceKind, StringComparer.Ordinal)
            .Any(group => group.Count() != 1))
        {
            return "Combat-pile source registry contains duplicate source kinds.";
        }

        string[] hookModes = { "card_on_play_wrapper", "declared_on_play" };
        string[] piles = { "draw", "discard", "hand", "exhaust" };
        string[] commitModes = { "automatic_at_max", "manual_confirm" };
        string[] bounds =
        {
            "fixed_exact",
            "fixed_exact_capped_by_hand_space",
            "dynamic_cards_optional_capped_by_hand_space"
        };
        string[] witnesses =
        {
            "move_one_to_top",
            "move_one_to_hand_or_source_if_full",
            "move_one_between_piles",
            "replace_one_same_index",
            "move_exact_batch_between_piles",
            "replace_exact_batch_same_index",
            "move_optional_batch_between_piles"
        };
        foreach (CombatPileSourceContract contract in contracts)
        {
            if (!hookModes.Contains(contract.HookMode, StringComparer.Ordinal)
                || !piles.Contains(contract.SourcePile, StringComparer.Ordinal)
                || !piles.Contains(contract.DestinationPile, StringComparer.Ordinal)
                || !commitModes.Contains(contract.CommitMode, StringComparer.Ordinal)
                || !bounds.Contains(contract.SelectionBounds, StringComparer.Ordinal)
                || !witnesses.Contains(contract.WitnessKind, StringComparer.Ordinal)
                || contract.SelectionCount < 0)
            {
                return $"Combat-pile source contract {contract.SourceKind} uses an unknown closed vocabulary value.";
            }
            if (contract.MutationKind == "replace_selected_cards_same_index"
                && string.IsNullOrWhiteSpace(contract.ReplacementCardDefinitionId))
            {
                return $"Combat-pile source contract {contract.SourceKind} lacks its exact replacement identity.";
            }
            if (AccessType(contract.SourceType) == null)
                return $"Combat-pile source contract {contract.SourceKind} cannot resolve {contract.SourceType}.";
            if (contract.HookMode == "declared_on_play"
                && ResolveDeclaredOnPlayMethod(contract.SourceType) == null)
            {
                return $"Combat-pile source contract {contract.SourceKind} cannot resolve its exact declared OnPlay task.";
            }
            string? topologyError = ValidateTopology(contract);
            if (topologyError != null)
                return topologyError;
        }
        return null;
    }

    private static string? ValidateTopology(CombatPileSourceContract contract)
    {
        bool IsMove() => contract.MutationKind == "move_selected_cards";
        bool IsReplace() =>
            contract.MutationKind == "replace_selected_cards_same_index"
            && contract.SourcePile == contract.DestinationPile
            && contract.DestinationPosition == "same_index"
            && !string.IsNullOrWhiteSpace(contract.ReplacementCardDefinitionId);
        bool IsFixed(int count) =>
            contract.SelectionBounds == "fixed_exact"
            && contract.SelectionCount == count;

        bool valid = contract.WitnessKind switch
        {
            "move_one_to_top" =>
                IsMove()
                && IsFixed(1)
                && contract.DestinationPosition == "top"
                && contract.CommitMode == "automatic_at_max",
            "move_one_to_hand_or_source_if_full" =>
                IsMove()
                && IsFixed(1)
                && contract.DestinationPile == "hand"
                && contract.DestinationPosition == "bottom"
                && !string.IsNullOrWhiteSpace(contract.OverflowDestination)
                && contract.CommitMode == "automatic_at_max",
            "move_one_between_piles" =>
                IsMove()
                && IsFixed(1)
                && contract.SourcePile != contract.DestinationPile
                && contract.CommitMode == "automatic_at_max",
            "replace_one_same_index" =>
                IsReplace()
                && IsFixed(1)
                && contract.CommitMode == "automatic_at_max",
            "move_exact_batch_between_piles" =>
                IsMove()
                && contract.SelectionBounds == "fixed_exact_capped_by_hand_space"
                && contract.SelectionCount > 0
                && contract.SourcePile != contract.DestinationPile
                && contract.CommitMode == "automatic_at_max",
            "replace_exact_batch_same_index" =>
                IsReplace()
                && contract.SelectionBounds == "fixed_exact"
                && contract.SelectionCount > 1
                && contract.CommitMode == "automatic_at_max",
            "move_optional_batch_between_piles" =>
                IsMove()
                && contract.SelectionBounds == "dynamic_cards_optional_capped_by_hand_space"
                && contract.SelectionCount == 0
                && contract.SourcePile != contract.DestinationPile
                && contract.CommitMode == "manual_confirm",
            _ => false
        };
        return valid
            ? null
            : $"Combat-pile source contract {contract.SourceKind} has an inconsistent witness/mutation topology.";
    }

    private sealed record RegistryDocument(
        int SchemaVersion,
        string RegistryId,
        string AuthorizationMode,
        IReadOnlyList<CombatPileSourceContract> Contracts);

    private sealed record RegistryLoadResult(
        IReadOnlyList<CombatPileSourceContract> Contracts,
        string? Error)
    {
        public static RegistryLoadResult Failed(string error) =>
            new(Array.Empty<CombatPileSourceContract>(), error);
    }
}
