using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace STS2_MCP.BridgeV2.Game;

internal sealed record CombatPileClosedVocabularies(
    IReadOnlyList<string> HookModes,
    IReadOnlyList<string> Piles,
    IReadOnlyList<string> MutationKinds,
    IReadOnlyList<string> CommitModes,
    IReadOnlyList<string> SelectionBounds);

internal sealed record CombatPileWitnessTopology(
    string WitnessKind,
    string MutationKind,
    string CommitMode,
    string SelectionBounds,
    string SelectionCountRule,
    string SourceDestinationRelation,
    string? RequiredDestinationPile,
    string RequiredDestinationPosition,
    string OverflowPolicy,
    string ReplacementPolicy,
    string ExpectedCommitPrimitive);

internal static class CombatPileContractCatalog
{
    private const string ResourceName =
        "STS2_MCP.BridgeV2.Game.combat-pile-contract-catalog.json";
    private static readonly Lazy<CatalogLoadResult> Loaded = new(Load);

    public static string CatalogId => Loaded.Value.CatalogId;
    public static string? LoadError => Loaded.Value.Error;
    public static IReadOnlyList<CombatPileWitnessTopology> WitnessTopologies =>
        Loaded.Value.WitnessTopologies;

    public static bool TryFindWitness(
        string witnessKind,
        out CombatPileWitnessTopology? topology)
    {
        topology = WitnessTopologies.SingleOrDefault(candidate =>
            string.Equals(candidate.WitnessKind, witnessKind, StringComparison.Ordinal));
        return topology != null;
    }

    public static string? Validate(CombatPileSourceContract contract)
    {
        CatalogLoadResult loaded = Loaded.Value;
        if (loaded.Error != null)
            return loaded.Error;

        CombatPileClosedVocabularies vocabularies = loaded.Vocabularies!;
        if (!vocabularies.HookModes.Contains(contract.HookMode, StringComparer.Ordinal)
            || !vocabularies.Piles.Contains(contract.SourcePile, StringComparer.Ordinal)
            || !vocabularies.Piles.Contains(contract.DestinationPile, StringComparer.Ordinal)
            || !vocabularies.MutationKinds.Contains(contract.MutationKind, StringComparer.Ordinal)
            || !vocabularies.CommitModes.Contains(contract.CommitMode, StringComparer.Ordinal)
            || !vocabularies.SelectionBounds.Contains(contract.SelectionBounds, StringComparer.Ordinal)
            || contract.SelectionCount < 0)
        {
            return $"Combat-pile source contract {contract.SourceKind} uses an unknown closed vocabulary value.";
        }

        if (!TryFindWitness(contract.WitnessKind, out CombatPileWitnessTopology? topology))
        {
            return $"Combat-pile source contract {contract.SourceKind} uses unknown witness {contract.WitnessKind}.";
        }

        bool valid = topology!.MutationKind == contract.MutationKind
                     && topology.CommitMode == contract.CommitMode
                     && topology.SelectionBounds == contract.SelectionBounds
                     && MatchesCount(topology.SelectionCountRule, contract.SelectionCount)
                     && MatchesRelation(
                         topology.SourceDestinationRelation,
                         contract.SourcePile,
                         contract.DestinationPile)
                     && (topology.RequiredDestinationPile == null
                         || topology.RequiredDestinationPile == contract.DestinationPile)
                     && topology.RequiredDestinationPosition == contract.DestinationPosition
                     && MatchesPresence(
                         topology.OverflowPolicy,
                         contract.OverflowDestination)
                     && MatchesPresence(
                         topology.ReplacementPolicy,
                         contract.ReplacementCardDefinitionId);

        return valid
            ? null
            : $"Combat-pile source contract {contract.SourceKind} has an inconsistent witness/mutation topology.";
    }

    private static bool MatchesCount(string rule, int count) => rule switch
    {
        "equals_zero" => count == 0,
        "equals_one" => count == 1,
        "positive" => count > 0,
        "greater_than_one" => count > 1,
        _ => false
    };

    private static bool MatchesRelation(string relation, string source, string destination) =>
        relation switch
        {
            "same" => source == destination,
            "different" => source != destination,
            _ => false
        };

    private static bool MatchesPresence(string policy, string? value) => policy switch
    {
        "required" => !string.IsNullOrWhiteSpace(value),
        "forbidden" => string.IsNullOrWhiteSpace(value),
        _ => false
    };

    private static CatalogLoadResult Load()
    {
        try
        {
            using Stream? stream = typeof(CombatPileContractCatalog).Assembly
                .GetManifestResourceStream(ResourceName);
            if (stream == null)
                return CatalogLoadResult.Failed($"Missing embedded resource {ResourceName}.");

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                PropertyNameCaseInsensitive = true
            };
            CatalogDocument? document = JsonSerializer.Deserialize<CatalogDocument>(stream, options);
            if (document == null
                || document.SchemaVersion != 1
                || document.CatalogId != "combat_pile_closed_contract_catalog_v1"
                || document.AuthorizationEffect != "none"
                || document.QualificationEffect != "none"
                || document.ClosedVocabularies == null
                || document.WitnessTopologies == null)
            {
                return CatalogLoadResult.Failed("Combat-pile contract catalog metadata is unsupported.");
            }
            string? validationError = ValidateDocument(document);
            if (validationError != null)
                return CatalogLoadResult.Failed(validationError);
            return new CatalogLoadResult(
                document.CatalogId,
                document.ClosedVocabularies,
                document.WitnessTopologies,
                null);
        }
        catch (Exception ex) when (ex is IOException or JsonException)
        {
            return CatalogLoadResult.Failed(
                $"Combat-pile contract catalog failed closed with {ex.GetType().Name}.");
        }
    }

    private static string? ValidateDocument(CatalogDocument document)
    {
        CombatPileClosedVocabularies vocabularies = document.ClosedVocabularies;
        IReadOnlyList<IReadOnlyList<string>> closedLists = new IReadOnlyList<string>[]
        {
            vocabularies.HookModes,
            vocabularies.Piles,
            vocabularies.MutationKinds,
            vocabularies.CommitModes,
            vocabularies.SelectionBounds
        };
        if (closedLists.Any(values =>
                values == null
                || values.Count == 0
                || values.Any(string.IsNullOrWhiteSpace)
                || values.Distinct(StringComparer.Ordinal).Count() != values.Count))
        {
            return "Combat-pile contract catalog has an invalid closed vocabulary.";
        }
        if (document.WitnessTopologies.Count == 0
            || document.WitnessTopologies.GroupBy(topology => topology.WitnessKind)
                .Any(group => group.Count() != 1))
        {
            return "Combat-pile contract catalog has missing or duplicate witness topologies.";
        }

        string[] countRules = { "equals_zero", "equals_one", "positive", "greater_than_one" };
        string[] relations = { "same", "different" };
        string[] presencePolicies = { "required", "forbidden" };
        foreach (CombatPileWitnessTopology topology in document.WitnessTopologies)
        {
            if (string.IsNullOrWhiteSpace(topology.WitnessKind)
                || !vocabularies.MutationKinds.Contains(topology.MutationKind, StringComparer.Ordinal)
                || !vocabularies.CommitModes.Contains(topology.CommitMode, StringComparer.Ordinal)
                || !vocabularies.SelectionBounds.Contains(topology.SelectionBounds, StringComparer.Ordinal)
                || !countRules.Contains(topology.SelectionCountRule, StringComparer.Ordinal)
                || !relations.Contains(topology.SourceDestinationRelation, StringComparer.Ordinal)
                || !presencePolicies.Contains(topology.OverflowPolicy, StringComparer.Ordinal)
                || !presencePolicies.Contains(topology.ReplacementPolicy, StringComparer.Ordinal)
                || string.IsNullOrWhiteSpace(topology.RequiredDestinationPosition)
                || string.IsNullOrWhiteSpace(topology.ExpectedCommitPrimitive)
                || (topology.RequiredDestinationPile != null
                    && !vocabularies.Piles.Contains(
                        topology.RequiredDestinationPile,
                        StringComparer.Ordinal)))
            {
                return $"Combat-pile contract catalog witness {topology.WitnessKind} is invalid.";
            }
        }
        return null;
    }

    private sealed record CatalogDocument(
        int SchemaVersion,
        string CatalogId,
        string AuthorizationEffect,
        string QualificationEffect,
        CombatPileClosedVocabularies ClosedVocabularies,
        IReadOnlyList<CombatPileWitnessTopology> WitnessTopologies);

    private sealed record CatalogLoadResult(
        string CatalogId,
        CombatPileClosedVocabularies? Vocabularies,
        IReadOnlyList<CombatPileWitnessTopology> WitnessTopologies,
        string? Error)
    {
        public static CatalogLoadResult Failed(string error) =>
            new("unavailable", null, Array.Empty<CombatPileWitnessTopology>(), error);
    }
}
