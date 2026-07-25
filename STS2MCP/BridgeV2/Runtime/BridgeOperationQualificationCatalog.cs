using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using STS2_MCP.BridgeV2.Protocol;

namespace STS2_MCP.BridgeV2.Runtime;

internal sealed record BridgeOperationQualificationContract(
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

internal sealed record BridgeOperationQualificationIdentity(
    string SurfaceKind,
    string Operation,
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

internal static class BridgeOperationQualificationCatalog
{
    private const string ResourceName =
        "STS2_MCP.BridgeV2.Runtime.operation-qualification-contracts.json";
    private static readonly Lazy<LoadResult> Loaded = new(Load);

    public static string CatalogId => Loaded.Value.CatalogId;

    public static string CatalogDigest => Loaded.Value.CatalogDigest;

    public static string? LoadError => Loaded.Value.Error;

    public static IReadOnlyList<BridgeOperationQualificationContract> Contracts =>
        Loaded.Value.Contracts;

    public static BridgeOperationQualificationIdentity? Describe(
        string surfaceKind,
        string operation)
    {
        BridgeOperationQualificationContract? contract =
            Loaded.Value.Contracts.SingleOrDefault(value =>
                string.Equals(value.SurfaceKind, surfaceKind, StringComparison.Ordinal)
                && string.Equals(value.Operation, operation, StringComparison.Ordinal));
        if (contract == null)
            return null;

        string interaction = BridgeHash.Text(contract.InteractionKind);
        string owner = BridgeHash.Text(contract.OwnerBinding);
        string source = BridgeHash.Text(contract.SourceBinding);
        string operand = BridgeHash.Text(contract.OperandContract);
        string commit = BridgeHash.Text(contract.CommitContract);
        string completion = BridgeHash.Text(contract.CompletionBoundary);
        string witness = BridgeHash.Text(contract.WitnessId);
        return new BridgeOperationQualificationIdentity(
            contract.SurfaceKind,
            contract.Operation,
            interaction,
            owner,
            source,
            operand,
            commit,
            completion,
            witness,
            BridgeHash.Object(new
            {
                contract.SurfaceKind,
                contract.Operation,
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

    public static IReadOnlyList<BridgeOperationQualificationIdentityInfo> Snapshot() =>
        Loaded.Value.Contracts
            .Select(contract => Describe(contract.SurfaceKind, contract.Operation))
            .Where(identity => identity != null)
            .Select(identity => new BridgeOperationQualificationIdentityInfo(
                identity!.SurfaceKind,
                identity.Operation,
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
            using Stream? stream = typeof(BridgeOperationQualificationCatalog)
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
                || document.SchemaVersion != 1
                || string.IsNullOrWhiteSpace(document.CatalogId)
                || document.AuthorityEffect != "qualification_identity_only")
            {
                return LoadResult.Failed(
                    "Operation qualification catalog metadata is unsupported.");
            }

            string? error = Validate(document.Contracts);
            return error == null
                ? new LoadResult(
                    document.CatalogId,
                    BridgeHash.Text(json),
                    document.Contracts,
                    null)
                : LoadResult.Failed(error, document.CatalogId, BridgeHash.Text(json));
        }
        catch (Exception ex) when (ex is IOException or JsonException)
        {
            return LoadResult.Failed(
                $"Operation qualification catalog failed closed with {ex.GetType().Name}.");
        }
    }

    private static string? Validate(
        IReadOnlyList<BridgeOperationQualificationContract> contracts)
    {
        if (contracts.Count == 0)
            return "Operation qualification catalog is empty.";
        if (contracts.GroupBy(value => (value.SurfaceKind, value.Operation))
            .Any(group => group.Count() != 1))
        {
            return "Operation qualification catalog contains duplicate operations.";
        }

        foreach (BridgeOperationQualificationContract contract in contracts)
        {
            BridgeContractManifestEntry? manifest =
                BridgeContractManifest.Find(contract.SurfaceKind);
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
                    or "transaction_settled")
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
        IReadOnlyList<BridgeOperationQualificationContract> Contracts);

    private sealed record LoadResult(
        string CatalogId,
        string CatalogDigest,
        IReadOnlyList<BridgeOperationQualificationContract> Contracts,
        string? Error)
    {
        public static LoadResult Failed(
            string error,
            string catalogId = "unavailable",
            string catalogDigest = "unavailable") =>
            new(
                catalogId,
                catalogDigest,
                Array.Empty<BridgeOperationQualificationContract>(),
                error);
    }
}
