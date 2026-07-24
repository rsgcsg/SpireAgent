using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeExactEnvironmentPolicy
{
    private const string ResourceName =
        "STS2_MCP.BridgeV2.Game.exact-environment-policy.json";
    private static readonly Lazy<PolicyLoadResult> Loaded = new(Load);

    public static string PolicyId => Loaded.Value.PolicyId;

    public static string PolicyDigest => Loaded.Value.PolicyDigest;

    public static string? LoadError => Loaded.Value.Error;

    public static CompatibilityAssessment Assess(
        string? version,
        string? commit,
        int? mainAssemblyHash)
    {
        PolicyLoadResult loaded = Loaded.Value;
        string normalized = Normalize(version);
        string[] testedVersions = loaded.Environments
            .Select(environment => environment.Version)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(value => value, StringComparer.Ordinal)
            .ToArray();
        string[] testedFingerprints = loaded.Environments
            .Select(environment => Fingerprint(
                environment.Version,
                environment.Commit,
                environment.MainAssemblyHash))
            .ToArray();
        if (loaded.Error != null)
        {
            return Disabled(
                version == null ? "unknown" : "policy_unavailable",
                testedVersions,
                testedFingerprints,
                version == null
                    ? "Game build identity is unavailable; v2 action execution is disabled."
                    : $"Exact-environment policy failed closed: {loaded.Error}");
        }

        ExactEnvironmentPolicyEntry? exact = loaded.Environments.SingleOrDefault(environment =>
            environment.Version == normalized
            && string.Equals(environment.Commit, commit, StringComparison.OrdinalIgnoreCase)
            && environment.MainAssemblyHash == mainAssemblyHash);
        if (exact == null)
        {
            return Disabled(
                version == null ? "unknown" : "untested",
                testedVersions,
                testedFingerprints,
                version == null
                    ? "Game build identity is unavailable; v2 action execution is disabled."
                    : $"Game build {Fingerprint(version, commit, mainAssemblyHash)} has no reviewed exact-environment policy; action, Inspection, and normal state authority are disabled.");
        }

        return new CompatibilityAssessment(
            exact.Status,
            testedVersions,
            testedFingerprints,
            exact.ActionExecutionAllowed,
            exact.StateObservationAllowed,
            exact.InspectionAllowed,
            exact.QualifiedSurfaceKinds,
            exact.CanarySurfaceKinds,
            exact.QualifiedInspectionKinds,
            exact.CanaryInspectionKinds,
            exact.ObservationOnlySurfaceKinds,
            Array.Empty<string>(),
            $"{exact.Detail} Policy={loaded.PolicyId} digest={loaded.PolicyDigest}.")
        {
            CompatibilityPolicyId = loaded.PolicyId,
            CompatibilityPolicyDigest = loaded.PolicyDigest,
            AdaptationLevel = "reviewed_exact_environment"
        };
    }

    private static CompatibilityAssessment Disabled(
        string status,
        IReadOnlyList<string> testedVersions,
        IReadOnlyList<string> testedFingerprints,
        string detail) =>
        new(
            status,
            testedVersions,
            testedFingerprints,
            ActionExecutionAllowed: false,
            StateObservationAllowed: false,
            InspectionAllowed: false,
            ActionExecutionSurfaceKinds: Array.Empty<string>(),
            ActionCanarySurfaceKinds: Array.Empty<string>(),
            InspectionAllowedKinds: Array.Empty<string>(),
            InspectionCanaryKinds: Array.Empty<string>(),
            ObservationOnlySurfaceKinds: Array.Empty<string>(),
            ObservationCandidateBuildFingerprints: Array.Empty<string>(),
            Detail: detail)
        {
            CompatibilityPolicyId = Loaded.Value.PolicyId,
            CompatibilityPolicyDigest = Loaded.Value.PolicyDigest,
            AdaptationLevel = "diagnostic_only"
        };

    private static PolicyLoadResult Load()
    {
        try
        {
            using Stream? stream = typeof(BridgeExactEnvironmentPolicy).Assembly
                .GetManifestResourceStream(ResourceName);
            if (stream == null)
                return PolicyLoadResult.Failed($"Missing embedded resource {ResourceName}.");

            using var copy = new MemoryStream();
            stream.CopyTo(copy);
            string json = Encoding.UTF8.GetString(copy.ToArray());
            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                PropertyNameCaseInsensitive = true
            };
            PolicyDocument? document =
                JsonSerializer.Deserialize<PolicyDocument>(json, options);
            if (document == null)
                return PolicyLoadResult.Failed("Exact-environment policy is empty.");
            if (document.SchemaVersion != 1
                || string.IsNullOrWhiteSpace(document.PolicyId)
                || document.AuthorizationMode != "reviewed_embedded_policy_only")
            {
                return PolicyLoadResult.Failed(
                    "Exact-environment policy metadata is unsupported.");
            }

            string? validationError = Validate(document.Environments);
            return validationError == null
                ? new PolicyLoadResult(
                    document.PolicyId,
                    BridgeHash.Text(json),
                    document.Environments,
                    null)
                : PolicyLoadResult.Failed(validationError, document.PolicyId, BridgeHash.Text(json));
        }
        catch (Exception ex) when (ex is IOException or JsonException)
        {
            return PolicyLoadResult.Failed(
                $"Exact-environment policy failed closed with {ex.GetType().Name}.");
        }
    }

    private static string? Validate(IReadOnlyList<ExactEnvironmentPolicyEntry> environments)
    {
        if (environments.Count == 0)
            return "Exact-environment policy has no entries.";
        if (environments.GroupBy(environment =>
                (environment.Version, environment.Commit.ToLowerInvariant(), environment.MainAssemblyHash))
            .Any(group => group.Count() != 1))
        {
            return "Exact-environment policy contains duplicate identities.";
        }

        HashSet<string> knownSurfaces = BridgeContractManifest.Entries
            .Select(entry => entry.Kind)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> knownInspections = BridgeContractManifest.InspectionEntries
            .Select(entry => entry.Kind)
            .ToHashSet(StringComparer.Ordinal);
        foreach (ExactEnvironmentPolicyEntry environment in environments)
        {
            if (string.IsNullOrWhiteSpace(environment.Version)
                || string.IsNullOrWhiteSpace(environment.Commit)
                || string.IsNullOrWhiteSpace(environment.Status)
                || environment.QualifiedSurfaceKinds.Intersect(
                    environment.CanarySurfaceKinds,
                    StringComparer.Ordinal).Any()
                || environment.QualifiedInspectionKinds.Intersect(
                    environment.CanaryInspectionKinds,
                    StringComparer.Ordinal).Any())
            {
                return $"Exact-environment policy entry {environment.Version}|{environment.Commit}|{environment.MainAssemblyHash} is contradictory.";
            }
            if (environment.QualifiedSurfaceKinds
                    .Concat(environment.CanarySurfaceKinds)
                    .Concat(environment.ObservationOnlySurfaceKinds)
                    .Any(surface => !knownSurfaces.Contains(surface)))
            {
                return $"Exact-environment policy entry {environment.Version}|{environment.Commit}|{environment.MainAssemblyHash} names an unknown Surface.";
            }
            if (environment.QualifiedInspectionKinds
                    .Concat(environment.CanaryInspectionKinds)
                    .Any(inspection => !knownInspections.Contains(inspection)))
            {
                return $"Exact-environment policy entry {environment.Version}|{environment.Commit}|{environment.MainAssemblyHash} names an unknown Inspection.";
            }
            if (!environment.ActionExecutionAllowed
                && (environment.QualifiedSurfaceKinds.Count > 0
                    || environment.CanarySurfaceKinds.Count > 0))
            {
                return $"Exact-environment policy entry {environment.Version}|{environment.Commit}|{environment.MainAssemblyHash} grants Surface tiers while actions are disabled.";
            }
            if (!environment.InspectionAllowed
                && (environment.QualifiedInspectionKinds.Count > 0
                    || environment.CanaryInspectionKinds.Count > 0))
            {
                return $"Exact-environment policy entry {environment.Version}|{environment.Commit}|{environment.MainAssemblyHash} grants Inspection tiers while Inspection is disabled.";
            }
        }
        return null;
    }

    private static string Normalize(string? version) =>
        (version ?? string.Empty).Trim().TrimStart('v', 'V');

    private static string Fingerprint(
        string? version,
        string? commit,
        int? mainAssemblyHash) =>
        version == null
            ? "unknown"
            : $"v{Normalize(version)}|{commit}|{mainAssemblyHash}";

    private sealed record PolicyDocument(
        int SchemaVersion,
        string PolicyId,
        string AuthorizationMode,
        IReadOnlyList<ExactEnvironmentPolicyEntry> Environments);

    private sealed record ExactEnvironmentPolicyEntry(
        string Version,
        string Commit,
        int MainAssemblyHash,
        string Status,
        bool ActionExecutionAllowed,
        bool StateObservationAllowed,
        bool InspectionAllowed,
        IReadOnlyList<string> QualifiedSurfaceKinds,
        IReadOnlyList<string> CanarySurfaceKinds,
        IReadOnlyList<string> QualifiedInspectionKinds,
        IReadOnlyList<string> CanaryInspectionKinds,
        IReadOnlyList<string> ObservationOnlySurfaceKinds,
        string Detail);

    private sealed record PolicyLoadResult(
        string PolicyId,
        string PolicyDigest,
        IReadOnlyList<ExactEnvironmentPolicyEntry> Environments,
        string? Error)
    {
        public static PolicyLoadResult Failed(
            string error,
            string policyId = "unavailable",
            string policyDigest = "unavailable") =>
            new(policyId, policyDigest, Array.Empty<ExactEnvironmentPolicyEntry>(), error);
    }
}
