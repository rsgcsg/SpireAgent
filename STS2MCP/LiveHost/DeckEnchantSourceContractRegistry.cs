using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Enchantments;
using MegaCrit.Sts2.Core.Models.Events;
using MegaCrit.Sts2.Core.Models.Relics;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.LiveHost.Contracts;

namespace STS2_MCP.LiveHost;

internal sealed record DeckEnchantSourceContract(
    string SourceKind,
    string DefinitionId,
    string OwnerKind,
    string SourceType,
    string SourceMethod,
    IReadOnlyList<string> EnchantmentTypes,
    int EnchantmentAmount,
    int MinSelect,
    int MaxSelect,
    bool RequireManualConfirmation,
    bool Cancelable,
    string ParticipantPolicy,
    string CommitRef,
    string WitnessRef,
    string RiskClass,
    string BindingEvidence);

internal static class DeckEnchantSourceContractRegistry
{
    internal const string RegistryId = "deck_enchant_source_contracts_v1";
    private const string ResourceName =
        "STS2_MCP.LiveHost.deck-enchant-source-contracts.json";
    private const string ParticipantPolicy = "local_single_player_owner";
    private const string CommitRef =
        "source_parent_applies_card_cmd_enchant_after_selector_completion";
    private const string WitnessRef =
        "screen_closed_and_exact_selected_cards_have_expected_enchantment";
    private static readonly Lazy<RegistryLoadResult> Loaded = new(Load);

    public static IReadOnlyList<DeckEnchantSourceContract> Contracts => Loaded.Value.Contracts;

    public static string? LoadError => Loaded.Value.Error;

    public static bool TryResolve(
        RunState? runState,
        EnchantmentModel enchantment,
        int enchantmentAmount,
        int minSelect,
        int maxSelect,
        bool requireManualConfirmation,
        bool cancelable,
        out DeckEnchantSource? source,
        out string? error)
    {
        source = null;
        error = LoadError;
        if (error != null)
            return false;
        if (runState == null)
        {
            error = "The current run is unavailable while resolving the deck-enchant source.";
            return false;
        }

        var contexts = new List<SourceContext>();
        EventModel? currentEvent = (runState.CurrentRoom as EventRoom)?.LocalMutableEvent
                                   ?? (runState.CurrentRoom as EventRoom)?.CanonicalEvent;
        if (currentEvent != null)
        {
            contexts.Add(new SourceContext(
                "current_event",
                currentEvent.GetType().FullName ?? string.Empty,
                currentEvent.Id.Entry));
        }

        var player = LocalContext.GetMe(runState);
        if (player != null)
        {
            contexts.AddRange(player.Relics.Select(relic => new SourceContext(
                "owned_relic",
                relic.GetType().FullName ?? string.Empty,
                relic.Id.Entry)));
        }

        string enchantmentType = enchantment.GetType().FullName ?? string.Empty;
        DeckEnchantSourceContract[] matches = Contracts.Where(contract =>
                contexts.Any(context => MatchesSourceShape(
                    contract,
                    context.OwnerKind,
                    context.SourceType,
                    context.DefinitionId,
                    enchantmentType,
                    enchantmentAmount,
                    minSelect,
                    maxSelect,
                    requireManualConfirmation,
                    cancelable)))
            .ToArray();

        if (matches.Length != 1)
        {
            error = matches.Length == 0
                ? "The active enchant screen does not match any reviewed embedded source contract."
                : "The active enchant screen ambiguously matches multiple reviewed source contracts.";
            return false;
        }

        DeckEnchantSourceContract match = matches[0];
        source = new DeckEnchantSource(
            match.SourceKind,
            match.DefinitionId,
            $"{RegistryId}+{match.BindingEvidence}");
        error = null;
        return true;
    }

    internal static bool MatchesSourceShape(
        DeckEnchantSourceContract contract,
        string ownerKind,
        string sourceType,
        string definitionId,
        string enchantmentType,
        int enchantmentAmount,
        int minSelect,
        int maxSelect,
        bool requireManualConfirmation,
        bool cancelable) =>
        string.Equals(contract.OwnerKind, ownerKind, StringComparison.Ordinal)
        && string.Equals(contract.SourceType, sourceType, StringComparison.Ordinal)
        && string.Equals(contract.DefinitionId, definitionId, StringComparison.Ordinal)
        && contract.EnchantmentTypes.Contains(enchantmentType, StringComparer.Ordinal)
        && contract.EnchantmentAmount == enchantmentAmount
        && contract.MinSelect == minSelect
        && contract.MaxSelect == maxSelect
        && contract.RequireManualConfirmation == requireManualConfirmation
        && contract.Cancelable == cancelable;

    private static RegistryLoadResult Load()
    {
        try
        {
            using Stream? stream = typeof(DeckEnchantSourceContractRegistry).Assembly
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
                return RegistryLoadResult.Failed("Deck-enchant source registry is empty.");
            if (document.SchemaVersion != 1
                || document.RegistryId != RegistryId
                || document.AuthorizationMode != "reviewed_embedded_policy_only")
            {
                return RegistryLoadResult.Failed(
                    "Deck-enchant source registry metadata is unsupported.");
            }

            string? validationError = Validate(document.Contracts);
            return validationError == null
                ? new RegistryLoadResult(document.Contracts, null)
                : RegistryLoadResult.Failed(validationError);
        }
        catch (Exception ex) when (ex is IOException or JsonException)
        {
            return RegistryLoadResult.Failed(
                $"Deck-enchant source registry failed closed with {ex.GetType().Name}.");
        }
    }

    private static string? Validate(IReadOnlyList<DeckEnchantSourceContract> contracts)
    {
        if (contracts.Count == 0)
            return "Deck-enchant source registry has no contracts.";
        if (contracts.GroupBy(contract => contract.SourceKind, StringComparer.Ordinal)
            .Any(group => group.Count() != 1))
        {
            return "Deck-enchant source registry contains duplicate source kinds.";
        }
        if (contracts.GroupBy(contract =>
                (contract.OwnerKind, contract.SourceType, contract.DefinitionId))
            .Any(group => group.Count() != 1))
        {
            return "Deck-enchant source registry contains duplicate source owners.";
        }

        foreach (DeckEnchantSourceContract contract in contracts)
        {
            if (string.IsNullOrWhiteSpace(contract.SourceKind)
                || string.IsNullOrWhiteSpace(contract.DefinitionId)
                || contract.EnchantmentTypes.Count == 0
                || contract.MinSelect < 0
                || contract.MaxSelect < contract.MinSelect
                || contract.EnchantmentAmount <= 0
                || contract.ParticipantPolicy != ParticipantPolicy
                || contract.CommitRef != CommitRef
                || contract.WitnessRef != WitnessRef
                || contract.RiskClass != "persistent_run_mutation")
            {
                return $"Deck-enchant source contract {contract.SourceKind} is incomplete or uses an unsupported closed vocabulary.";
            }

            Type? sourceType = AccessType(contract.SourceType);
            if (sourceType == null)
                return $"Deck-enchant source contract {contract.SourceKind} cannot resolve {contract.SourceType}.";
            if (contract.OwnerKind == "current_event" && !typeof(EventModel).IsAssignableFrom(sourceType)
                || contract.OwnerKind == "owned_relic" && !typeof(RelicModel).IsAssignableFrom(sourceType)
                || contract.OwnerKind is not ("current_event" or "owned_relic"))
            {
                return $"Deck-enchant source contract {contract.SourceKind} has an incompatible owner type.";
            }
            if (!ResolveSourceMethods(sourceType, contract.SourceMethod).Any())
                return $"Deck-enchant source contract {contract.SourceKind} cannot resolve its native source task.";
            if (contract.EnchantmentTypes.Any(typeName =>
                    AccessType(typeName) is not { } type
                    || !typeof(EnchantmentModel).IsAssignableFrom(type)))
            {
                return $"Deck-enchant source contract {contract.SourceKind} cannot resolve an enchantment type.";
            }
        }
        return null;
    }

    private static Type? AccessType(string fullName) =>
        typeof(EnchantmentModel).Assembly.GetType(fullName, throwOnError: false, ignoreCase: false);

    private static IEnumerable<MethodInfo> ResolveSourceMethods(Type sourceType, string methodName) =>
        sourceType.GetMethods(
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly)
            .Where(method => string.Equals(method.Name, methodName, StringComparison.Ordinal)
                             && typeof(Task).IsAssignableFrom(method.ReturnType));

    private sealed record SourceContext(
        string OwnerKind,
        string SourceType,
        string DefinitionId);

    private sealed record RegistryDocument(
        int SchemaVersion,
        string RegistryId,
        string AuthorizationMode,
        IReadOnlyList<DeckEnchantSourceContract> Contracts);

    private sealed record RegistryLoadResult(
        IReadOnlyList<DeckEnchantSourceContract> Contracts,
        string? Error)
    {
        public static RegistryLoadResult Failed(string error) =>
            new(Array.Empty<DeckEnchantSourceContract>(), error);
    }
}
