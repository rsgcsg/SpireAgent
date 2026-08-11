using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.NativeUi;

namespace STS2_MCP.Authority;

internal sealed record OperationQualificationContract(
    string SurfaceKind,
    string Operation,
    string InteractionKind,
    string OwnerBinding,
    string SourceBinding,
    string OperandContract,
    string CommitContract,
    string CompletionBoundary,
    string WitnessId,
    string RiskClass);

internal sealed record OperationQualificationIdentity(
    string SurfaceKind,
    string Operation,
    string ContractKind,
    string InteractionDigest,
    string OwnerDigest,
    string SourceDigest,
    string OperandDigest,
    string CommitDigest,
    string CompletionDigest,
    string WitnessDigest,
    string ContractDigest,
    string CompletionBoundary,
    string WitnessId,
    string RiskClass);

internal static class OperationQualificationCatalog
{
    internal const string ExplicitNativeContract =
        "explicit_native_contract";
    internal const string ManifestMigrationFallback =
        "manifest_migration_fallback";
    internal const string RuntimeReportedWitness =
        "gateway_reported_operation_witness";
    internal const string GatewayCompletionBoundary =
        NativeUiCompletionBoundary.SemanticObserved;
    private const string ResourceName =
        "STS2_MCP.Authority.operation-qualification-contracts.json";
    private static readonly Lazy<LoadResult> Loaded = new(Load);

    public static string CatalogId => Loaded.Value.CatalogId;

    public static string CatalogDigest => Loaded.Value.CatalogDigest;

    public static string? LoadError => Loaded.Value.Error;

    public static IReadOnlyList<OperationQualificationContract> Contracts =>
        Loaded.Value.Contracts;

    public static bool IsExplicitContract(string surfaceKind, string operation) =>
        Loaded.Value.ExplicitContracts.Any(value =>
            string.Equals(value.SurfaceKind, surfaceKind, StringComparison.Ordinal)
            && string.Equals(value.Operation, operation, StringComparison.Ordinal));

    public static OperationQualificationIdentity? Describe(
        string surfaceKind,
        string operation)
    {
        OperationQualificationContract? contract =
            Loaded.Value.Contracts.SingleOrDefault(value =>
                string.Equals(value.SurfaceKind, surfaceKind, StringComparison.Ordinal)
                && string.Equals(value.Operation, operation, StringComparison.Ordinal));
        if (contract == null)
            return null;

        string contractKind = IsExplicitContract(surfaceKind, operation)
            ? ExplicitNativeContract
            : ManifestMigrationFallback;
        string interaction = StableIdentityHash.Text(contract.InteractionKind);
        string owner = StableIdentityHash.Text(contract.OwnerBinding);
        string source = StableIdentityHash.Text(contract.SourceBinding);
        string operand = StableIdentityHash.Text(contract.OperandContract);
        string commit = StableIdentityHash.Text(contract.CommitContract);
        string completion = StableIdentityHash.Text(contract.CompletionBoundary);
        string witness = StableIdentityHash.Text(contract.WitnessId);
        return new OperationQualificationIdentity(
            contract.SurfaceKind,
            contract.Operation,
            contractKind,
            interaction,
            owner,
            source,
            operand,
            commit,
            completion,
            witness,
            StableIdentityHash.Object(new
            {
                contract.SurfaceKind,
                contract.Operation,
                contractKind,
                interaction,
                owner,
                source,
                operand,
                commit,
                completion,
                witness,
                contract.RiskClass
            }),
            contract.CompletionBoundary,
            contract.WitnessId,
            contract.RiskClass);
    }

    public static bool WitnessMatches(
        string expectedWitness,
        string? observedWitness) =>
        string.Equals(
            expectedWitness,
            RuntimeReportedWitness,
            StringComparison.Ordinal)
            ? !string.IsNullOrWhiteSpace(observedWitness)
            : string.Equals(
                observedWitness,
                expectedWitness,
                StringComparison.Ordinal);

    public static IReadOnlyList<OperationQualificationIdentityInfo> Snapshot() =>
        Loaded.Value.Contracts
            .Select(contract => Describe(contract.SurfaceKind, contract.Operation))
            .Where(identity => identity != null)
            .Select(identity => new OperationQualificationIdentityInfo(
                identity!.SurfaceKind,
                identity.Operation,
                identity.ContractKind,
                identity.InteractionDigest,
                identity.OwnerDigest,
                identity.SourceDigest,
                identity.OperandDigest,
                identity.CommitDigest,
                identity.CompletionDigest,
                identity.WitnessDigest,
                identity.ContractDigest,
                identity.CompletionBoundary,
                identity.WitnessId,
                identity.RiskClass))
            .OrderBy(identity => identity.SurfaceKind, StringComparer.Ordinal)
            .ThenBy(identity => identity.Operation, StringComparer.Ordinal)
            .ToArray();

    private static LoadResult Load()
    {
        try
        {
            using Stream? stream = typeof(OperationQualificationCatalog)
                .Assembly.GetManifestResourceStream(ResourceName);
            if (stream == null)
                return LoadResult.Failed("Operation qualification catalog is missing.");
            using var reader = new StreamReader(stream);
            string json = reader.ReadToEnd();
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            };
            CatalogDocument? document = JsonSerializer.Deserialize<CatalogDocument>(
                json,
                options);
            if (document == null
                || document.SchemaVersion != 3
                || string.IsNullOrWhiteSpace(document.CatalogId)
                || document.AuthorityEffect
                    != "explicit_native_contracts_only")
            {
                return LoadResult.Failed(
                    "Operation qualification catalog metadata is unsupported.");
            }

            IReadOnlyList<OperationQualificationContract> contracts =
                document.Contracts;
            string? error = Validate(contracts);
            return error == null
                ? new LoadResult(
                    document.CatalogId,
                    StableIdentityHash.Object(new
                    {
                        document.CatalogId,
                        contracts
                    }),
                    contracts,
                    document.Contracts,
                    null)
                : LoadResult.Failed(error, document.CatalogId, StableIdentityHash.Text(json));
        }
        catch (Exception ex) when (ex is IOException or JsonException)
        {
            return LoadResult.Failed(
                $"Operation qualification catalog failed closed with {ex.GetType().Name}.");
        }
    }

    private static string? Validate(
        IReadOnlyList<OperationQualificationContract> contracts)
    {
        if (contracts.Count == 0)
            return "Operation qualification catalog is empty.";
        if (contracts.GroupBy(value => (value.SurfaceKind, value.Operation))
            .Any(group => group.Count() != 1))
        {
            return "Operation qualification catalog contains duplicate operations.";
        }
        int manifestOperationCount = NativeOperationManifest.Entries
            .Sum(entry => entry.Operations.Count);
        if (contracts.Count != manifestOperationCount)
            return "Operation qualification catalog does not exactly cover the manifest.";

        foreach (OperationQualificationContract contract in contracts)
        {
            NativeOperationManifestEntry? manifest =
                NativeOperationManifest.Find(contract.SurfaceKind);
            if (manifest == null
                || !manifest.Operations.Any(value =>
                    string.Equals(
                        value.Operation,
                        contract.Operation,
                        StringComparison.Ordinal))
                || contract.CompletionBoundary is not (
                    "native_commit_observed"
                    or "immediate_postcondition_observed"
                    or "continuation_handoff_observed"
                    or "transaction_settled"
                    or GatewayCompletionBoundary)
                || string.IsNullOrWhiteSpace(contract.InteractionKind)
                || string.IsNullOrWhiteSpace(contract.OwnerBinding)
                || string.IsNullOrWhiteSpace(contract.SourceBinding)
                || string.IsNullOrWhiteSpace(contract.OperandContract)
                || string.IsNullOrWhiteSpace(contract.CommitContract)
                || string.IsNullOrWhiteSpace(contract.WitnessId)
                || string.IsNullOrWhiteSpace(contract.RiskClass))
            {
                return $"Operation qualification contract {contract.SurfaceKind}/{contract.Operation} is invalid.";
            }
        }
        return null;
    }

    private sealed record CatalogDocument(
        int SchemaVersion,
        string CatalogId,
        string AuthorityEffect,
        IReadOnlyList<OperationQualificationContract> Contracts);

    private sealed record LoadResult(
        string CatalogId,
        string CatalogDigest,
        IReadOnlyList<OperationQualificationContract> Contracts,
        IReadOnlyList<OperationQualificationContract> ExplicitContracts,
        string? Error)
    {
        public static LoadResult Failed(
            string error,
            string catalogId = "unavailable",
            string catalogDigest = "unavailable") =>
            new(
                catalogId,
                catalogDigest,
                Array.Empty<OperationQualificationContract>(),
                Array.Empty<OperationQualificationContract>(),
                error);
}
}
