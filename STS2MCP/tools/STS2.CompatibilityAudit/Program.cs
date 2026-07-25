using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Mono.Cecil;
using Mono.Cecil.Cil;

const string SinkType = "MegaCrit.Sts2.Core.Commands.CardSelectCmd";
const string SinkMethod = "FromCombatPile";

Dictionary<string, string> arguments = ParseArguments(args);
if (!arguments.TryGetValue("--game-assembly", out string? gameAssembly)
    || !arguments.TryGetValue("--registry", out string? registryPath)
    || !arguments.TryGetValue("--catalog", out string? catalogPath)
    || !arguments.TryGetValue("--environment-policy", out string? policyPath))
{
    Console.Error.WriteLine(
        "Usage: dotnet run --project STS2.CompatibilityAudit -- " +
        "--game-assembly <sts2.dll> --registry <combat-pile-source-contracts.json> " +
        "--catalog <combat-pile-contract-catalog.json> " +
        "--environment-policy <exact-environment-policy.json> [--output <report.json>]");
    return 64;
}

if (!File.Exists(gameAssembly)
    || !File.Exists(registryPath)
    || !File.Exists(catalogPath)
    || !File.Exists(policyPath))
{
    Console.Error.WriteLine("One or more required input files do not exist.");
    return 66;
}

JsonSerializerOptions jsonOptions = new()
{
    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    PropertyNameCaseInsensitive = true,
    WriteIndented = true
};
CombatPileRegistry registry = ReadJson<CombatPileRegistry>(registryPath, jsonOptions);
ContractCatalog catalog = ReadJson<ContractCatalog>(catalogPath, jsonOptions);
EnvironmentPolicy policy = ReadJson<EnvironmentPolicy>(policyPath, jsonOptions);
if (catalog.AuthorizationEffect != "none"
    || catalog.QualificationEffect != "none"
    || catalog.WitnessTopologies.Count == 0)
{
    throw new InvalidDataException("Contract catalog must be non-authorizing and non-empty.");
}
using var resolver = new DefaultAssemblyResolver();
resolver.AddSearchDirectory(Path.GetDirectoryName(gameAssembly)!);
using AssemblyDefinition assembly = AssemblyDefinition.ReadAssembly(
    gameAssembly,
    new ReaderParameters
    {
        AssemblyResolver = resolver,
        InMemory = true,
        ReadingMode = ReadingMode.Immediate
    });

List<SourceMethodReport> registeredReports = new();
HashSet<string> registeredTypes = registry.Contracts
    .Select(contract => contract.SourceType)
    .ToHashSet(StringComparer.Ordinal);
foreach (CombatPileContract contract in registry.Contracts)
{
    TypeDefinition? sourceType = AllTypes(assembly.MainModule)
        .SingleOrDefault(type => type.FullName == contract.SourceType);
    MethodDefinition? sourceMethod = sourceType?.Methods
        .SingleOrDefault(method => method.Name == "OnPlay");
    MethodDefinition? analyzedMethod = sourceMethod == null
        ? null
        : ResolveAsyncBody(sourceMethod);
    bool callsSink = analyzedMethod != null && CallsSink(analyzedMethod);
    WitnessTopology? topology = catalog.WitnessTopologies.SingleOrDefault(candidate =>
        candidate.WitnessKind == contract.WitnessKind);
    string expectedCommitPrimitive = topology?.ExpectedCommitPrimitive ?? "unresolved";
    bool callsCommitPrimitive = analyzedMethod != null
                                && topology != null
                                && CallsMethod(analyzedMethod, expectedCommitPrimitive);
    IReadOnlyList<string> observedCommitPrimitives = analyzedMethod == null
        ? Array.Empty<string>()
        : ObservedCommitPrimitives(analyzedMethod, catalog);
    IReadOnlyList<string> ownerBindingSignals = analyzedMethod == null
        ? Array.Empty<string>()
        : OwnerBindingSignals(analyzedMethod);
    string? implementationFingerprint =
        analyzedMethod == null ? null : FingerprintMethod(analyzedMethod);
    string declaredSemanticFingerprint = DeclaredSemanticFingerprint(contract, topology);
    string staticStructureFingerprint = StaticStructureFingerprint(
        callsSink,
        observedCommitPrimitives,
        ownerBindingSignals);
    string? operationFingerprint = implementationFingerprint == null
        ? null
        : HashText(
            $"{declaredSemanticFingerprint}\n" +
            $"{staticStructureFingerprint}\n" +
            $"{implementationFingerprint}");
    bool staticMatch = callsSink && callsCommitPrimitive && topology != null;
    registeredReports.Add(new SourceMethodReport(
        contract.SourceKind,
        contract.SourceType,
        contract.HookMode,
        sourceMethod?.FullName,
        analyzedMethod?.FullName,
        callsSink,
        expectedCommitPrimitive,
        callsCommitPrimitive,
        observedCommitPrimitives,
        ownerBindingSignals,
        declaredSemanticFingerprint,
        staticStructureFingerprint,
        implementationFingerprint,
        operationFingerprint,
        staticMatch ? "registered_static_match" : "registered_static_mismatch",
        staticMatch ? "no_change_existing_reviewed_policy" : "quarantine_existing_contract",
        new[]
        {
            "runtime_owner_and_ui_lifecycle",
            "runtime_patch_closure",
            "semantic_completion",
            "organic_operation_evidence"
        }));
}

List<DiscoveredCaller> discovered = new();
foreach (TypeDefinition type in AllTypes(assembly.MainModule))
{
    foreach (MethodDefinition sourceMethod in type.Methods.Where(method =>
                 method.Name == "OnPlay"))
    {
        MethodDefinition analyzed = ResolveAsyncBody(sourceMethod);
        if (!CallsSink(analyzed))
            continue;
        IReadOnlyList<string> observedCommitPrimitives =
            ObservedCommitPrimitives(analyzed, catalog);
        IReadOnlyList<string> ownerBindingSignals = OwnerBindingSignals(analyzed);
        bool targetPlayerReferenced = ownerBindingSignals.Contains(
            "references_cardplay_target",
            StringComparer.Ordinal);
        bool sourceOwnerReferenced = ownerBindingSignals.Contains(
            "references_source_card_owner",
            StringComparer.Ordinal);
        string classification = targetPlayerReferenced && !sourceOwnerReferenced
            ? "code_required_new_owner_binding"
            : observedCommitPrimitives.Count == 1
                ? "review_required_unresolved_operands"
                : "code_required_unknown_commit_topology";
        IReadOnlyList<string> commitOnlyCandidateFamilies = catalog.WitnessTopologies
            .Where(topology => observedCommitPrimitives.Contains(
                topology.ExpectedCommitPrimitive,
                StringComparer.Ordinal))
            .Select(topology => topology.WitnessKind)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(value => value, StringComparer.Ordinal)
            .ToArray();
        string implementationFingerprint = FingerprintMethod(analyzed);
        string staticStructureFingerprint = StaticStructureFingerprint(
            callsSink: true,
            observedCommitPrimitives,
            ownerBindingSignals);
        discovered.Add(new DiscoveredCaller(
            type.FullName,
            sourceMethod.FullName,
            analyzed.FullName,
            registeredTypes.Contains(type.FullName),
            observedCommitPrimitives,
            ownerBindingSignals,
            commitOnlyCandidateFamilies,
            staticStructureFingerprint,
            implementationFingerprint,
            HashText($"{staticStructureFingerprint}\n{implementationFingerprint}"),
            classification,
            "diagnostic_only",
            targetPlayerReferenced && !sourceOwnerReferenced
                ? new[]
                {
                    "new_owner_contract",
                    "target_player_visibility_and_authority",
                    "selector_operand_flow",
                    "semantic_completion",
                    "runtime_patch_closure",
                    "organic_operation_evidence"
                }
                : new[]
                {
                    "source_owner_flow",
                    "selector_operand_flow",
                    "selection_bounds",
                    "semantic_completion",
                    "runtime_patch_closure",
                    "organic_operation_evidence"
                }));
    }
}

ReleaseIdentity? release = TryReadReleaseIdentity(gameAssembly, jsonOptions);
EnvironmentEntry[] releaseCandidates = release == null
    ? Array.Empty<EnvironmentEntry>()
    : policy.Environments.Where(environment =>
            NormalizeVersion(environment.Version) == NormalizeVersion(release.Version)
            && string.Equals(environment.Commit, release.Commit, StringComparison.OrdinalIgnoreCase))
        .ToArray();
string assemblySha = HashFile(gameAssembly);
string registrySha = HashFile(registryPath);
string catalogSha = HashFile(catalogPath);
string policySha = HashFile(policyPath);
string status = registeredReports.All(report =>
        report.CallsExpectedSink && report.CallsExpectedCommitPrimitive)
    ? discovered.Any(caller => !caller.Registered)
        ? "review_required_unregistered_callers"
        : "registered_family_exact_source_match"
    : "failed_registered_binding";

var report = new CompatibilityAuditReport(
    SchemaVersion: 2,
    GeneratedAt: DateTimeOffset.UtcNow,
    Status: status,
    AuthorizationEffect: "none",
    QualificationEffect: "none",
    GameAssembly: new AssemblyIdentity(
        Path.GetFileName(gameAssembly),
        assemblySha,
        assembly.MainModule.Mvid.ToString("D")),
    Release: release,
    Registry: new InputIdentity(
        registry.RegistryId,
        registry.AuthorizationMode,
        registrySha),
    Catalog: new InputIdentity(
        catalog.CatalogId,
        catalog.AuthorizationEffect,
        catalogSha),
    Policy: new InputIdentity(
        policy.PolicyId,
        policy.AuthorizationMode,
        policySha),
    DiagnosticVersionCommitPolicyEntries: releaseCandidates,
    RegisteredSources: registeredReports,
    UnregisteredCallers: discovered.Where(caller => !caller.Registered).ToArray(),
    Limitations: new[]
    {
        "static_il_call_discovery_is_non_authorizing",
        "operation_fingerprints_are_structural_evidence_not_semantic_equivalence_proofs",
        "candidate_classification_never_writes_registry_or_policy",
        "runtime_harmony_patch_closure_is_not_proven",
        "native_owner_and_ui_lifecycle_are_not_proven",
        "semantic_completion_is_not_proven",
        "exact_source_destination_operands_are_reviewed_but_not_fully_proven_by_static_il",
        "runtime_main_assembly_hash_is_not_computed_offline",
        "release_policy_entries_are_version_commit_diagnostics_not_exact_runtime_matches",
        "modset_identity_requires_loaded_runtime_evidence"
    });
string output = JsonSerializer.Serialize(report, jsonOptions);
if (arguments.TryGetValue("--output", out string? outputPath))
{
    string? directory = Path.GetDirectoryName(outputPath);
    if (!string.IsNullOrWhiteSpace(directory))
        Directory.CreateDirectory(directory);
    File.WriteAllText(outputPath, output + Environment.NewLine);
}
Console.WriteLine(output);
return status == "failed_registered_binding" ? 2 : 0;

static T ReadJson<T>(string path, JsonSerializerOptions options) =>
    JsonSerializer.Deserialize<T>(File.ReadAllText(path), options)
    ?? throw new InvalidDataException($"Could not decode {path}.");

static Dictionary<string, string> ParseArguments(string[] values)
{
    var result = new Dictionary<string, string>(StringComparer.Ordinal);
    for (int index = 0; index < values.Length; index += 2)
    {
        if (index + 1 >= values.Length || !values[index].StartsWith("--", StringComparison.Ordinal))
            throw new ArgumentException($"Invalid argument near {values[index]}.");
        result[values[index]] = values[index + 1];
    }
    return result;
}

static IEnumerable<TypeDefinition> AllTypes(ModuleDefinition module)
{
    foreach (TypeDefinition type in module.Types)
    {
        foreach (TypeDefinition nested in SelfAndNested(type))
            yield return nested;
    }
}

static IEnumerable<TypeDefinition> SelfAndNested(TypeDefinition type)
{
    yield return type;
    foreach (TypeDefinition nested in type.NestedTypes)
    {
        foreach (TypeDefinition descendant in SelfAndNested(nested))
            yield return descendant;
    }
}

static MethodDefinition ResolveAsyncBody(MethodDefinition method)
{
    CustomAttribute? attribute = method.CustomAttributes.SingleOrDefault(candidate =>
        candidate.AttributeType.FullName ==
        "System.Runtime.CompilerServices.AsyncStateMachineAttribute");
    TypeReference? stateMachineReference =
        attribute?.ConstructorArguments.SingleOrDefault().Value as TypeReference;
    TypeDefinition? stateMachine = stateMachineReference?.Resolve();
    return stateMachine?.Methods.SingleOrDefault(candidate => candidate.Name == "MoveNext")
           ?? method;
}

static bool CallsSink(MethodDefinition method) =>
    method.HasBody && method.Body.Instructions.Any(instruction =>
        instruction.OpCode.Code is Code.Call or Code.Callvirt
        && instruction.Operand is MethodReference called
        && called.DeclaringType.FullName == SinkType
        && called.Name == SinkMethod);

static bool CallsMethod(MethodDefinition method, string expected)
{
    int separator = expected.LastIndexOf("::", StringComparison.Ordinal);
    string declaringType = expected[..separator];
    string methodName = expected[(separator + 2)..];
    return method.HasBody && method.Body.Instructions.Any(instruction =>
        instruction.OpCode.Code is Code.Call or Code.Callvirt
        && instruction.Operand is MethodReference called
        && called.DeclaringType.FullName == declaringType
        && called.Name == methodName);
}

static IReadOnlyList<string> ObservedCommitPrimitives(
    MethodDefinition method,
    ContractCatalog catalog) =>
    catalog.WitnessTopologies
        .Select(topology => topology.ExpectedCommitPrimitive)
        .Distinct(StringComparer.Ordinal)
        .Where(expected => CallsMethod(method, expected))
        .OrderBy(value => value, StringComparer.Ordinal)
        .ToArray();

static IReadOnlyList<string> OwnerBindingSignals(MethodDefinition method)
{
    var signals = new HashSet<string>(StringComparer.Ordinal);
    foreach (Instruction instruction in method.Body.Instructions)
    {
        string member = instruction.Operand switch
        {
            MethodReference value => $"{value.DeclaringType.FullName}::{value.Name}",
            FieldReference value => $"{value.DeclaringType.FullName}::{value.Name}",
            _ => string.Empty
        };
        if (member.Contains("CardPlay::get_Target", StringComparison.Ordinal)
            || member.Contains("CardPlay::Target", StringComparison.Ordinal))
        {
            signals.Add("references_cardplay_target");
        }
        if (member.Contains("CardModel::get_Owner", StringComparison.Ordinal)
            || member.Contains("CardModel::Owner", StringComparison.Ordinal))
        {
            signals.Add("references_source_card_owner");
        }
    }
    if (signals.Count == 0)
        signals.Add("no_known_owner_reference");
    return signals.OrderBy(value => value, StringComparer.Ordinal).ToArray();
}

static string DeclaredSemanticFingerprint(
    CombatPileContract contract,
    WitnessTopology? topology) =>
    HashText(string.Join(
        "\n",
        contract.HookMode,
        contract.Purpose,
        contract.MutationKind,
        contract.CommitMode,
        contract.SourcePile,
        contract.DestinationPile,
        contract.DestinationPosition,
        contract.OverflowDestination ?? string.Empty,
        contract.ReplacementCardDefinitionId ?? string.Empty,
        contract.ReplacementUpgradePolicy ?? string.Empty,
        contract.SelectionBounds,
        contract.SelectionCount.ToString(System.Globalization.CultureInfo.InvariantCulture),
        contract.WitnessKind,
        topology?.ExpectedCommitPrimitive ?? "unresolved"));

static string StaticStructureFingerprint(
    bool callsSink,
    IReadOnlyList<string> observedCommitPrimitives,
    IReadOnlyList<string> ownerBindingSignals) =>
    HashText(string.Join(
        "\n",
        callsSink ? $"{SinkType}::{SinkMethod}" : "sink_missing",
        string.Join("|", observedCommitPrimitives),
        string.Join("|", ownerBindingSignals)));

static string FingerprintMethod(MethodDefinition method)
{
    var canonical = new StringBuilder();
    foreach (Instruction instruction in method.Body.Instructions)
    {
        canonical.Append(instruction.OpCode.Code).Append(':');
        canonical.Append(instruction.Operand switch
        {
            MethodReference value => value.FullName,
            FieldReference value => value.FullName,
            TypeReference value => value.FullName,
            ParameterDefinition value => $"arg:{value.Index}:{value.ParameterType.FullName}",
            VariableDefinition value => $"local:{value.Index}:{value.VariableType.FullName}",
            Instruction value => $"target:{value.Offset}",
            Instruction[] value => string.Join(',', value.Select(target => target.Offset)),
            null => string.Empty,
            _ => instruction.Operand.ToString()
        });
        canonical.AppendLine();
    }
    return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical.ToString())))
        .ToLowerInvariant();
}

static string HashFile(string path) =>
    Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path))).ToLowerInvariant();

static string HashText(string value) =>
    Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

static ReleaseIdentity? TryReadReleaseIdentity(
    string assemblyPath,
    JsonSerializerOptions options)
{
    DirectoryInfo? directory = Directory.GetParent(assemblyPath);
    for (int depth = 0; directory != null && depth < 4; depth++, directory = directory.Parent)
    {
        string candidate = Path.Combine(directory.FullName, "release_info.json");
        if (File.Exists(candidate))
            return ReadJson<ReleaseIdentity>(candidate, options);
    }
    return null;
}

static string NormalizeVersion(string value) => value.Trim().TrimStart('v', 'V');

internal sealed record CombatPileRegistry(
    int SchemaVersion,
    string RegistryId,
    string AuthorizationMode,
    IReadOnlyList<CombatPileContract> Contracts);

internal sealed record CombatPileContract(
    string SourceType,
    string HookMode,
    string SourceKind,
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
    string WitnessKind);

internal sealed record ContractCatalog(
    int SchemaVersion,
    string CatalogId,
    string AuthorizationEffect,
    string QualificationEffect,
    IReadOnlyList<WitnessTopology> WitnessTopologies);

internal sealed record WitnessTopology(
    string WitnessKind,
    string ExpectedCommitPrimitive);

internal sealed record EnvironmentPolicy(
    int SchemaVersion,
    string PolicyId,
    string AuthorizationMode,
    IReadOnlyList<EnvironmentEntry> Environments);

internal sealed record EnvironmentEntry(
    string Version,
    string Commit,
    int MainAssemblyHash,
    string Status,
    IReadOnlyList<string> QualifiedSurfaceKinds,
    IReadOnlyList<string> CanarySurfaceKinds);

internal sealed record ReleaseIdentity(
    string Commit,
    string Version,
    string? Date,
    string? Branch,
    int MainAssemblyHash);

internal sealed record AssemblyIdentity(
    string FileName,
    string Sha256,
    string ModuleVersionId);

internal sealed record InputIdentity(
    string Id,
    string AuthorizationMode,
    string Sha256);

internal sealed record SourceMethodReport(
    string SourceKind,
    string SourceType,
    string HookMode,
    string? SourceMethod,
    string? AnalyzedMethod,
    bool CallsExpectedSink,
    string ExpectedCommitPrimitive,
    bool CallsExpectedCommitPrimitive,
    IReadOnlyList<string> ObservedCommitPrimitives,
    IReadOnlyList<string> OwnerBindingSignals,
    string DeclaredSemanticFingerprint,
    string StaticStructureFingerprint,
    string? ImplementationFingerprint,
    string? OperationFingerprint,
    string CandidateClassification,
    string PermissionRecommendation,
    IReadOnlyList<string> MissingProofs);

internal sealed record DiscoveredCaller(
    string SourceType,
    string SourceMethod,
    string AnalyzedMethod,
    bool Registered,
    IReadOnlyList<string> ObservedCommitPrimitives,
    IReadOnlyList<string> OwnerBindingSignals,
    IReadOnlyList<string> CommitOnlyCandidateWitnessFamilies,
    string StaticStructureFingerprint,
    string ImplementationFingerprint,
    string OperationFingerprint,
    string CandidateClassification,
    string RecommendedCeiling,
    IReadOnlyList<string> RequiredProofs);

internal sealed record CompatibilityAuditReport(
    int SchemaVersion,
    DateTimeOffset GeneratedAt,
    string Status,
    string AuthorizationEffect,
    string QualificationEffect,
    AssemblyIdentity GameAssembly,
    ReleaseIdentity? Release,
    InputIdentity Registry,
    InputIdentity Catalog,
    InputIdentity Policy,
    IReadOnlyList<EnvironmentEntry> DiagnosticVersionCommitPolicyEntries,
    IReadOnlyList<SourceMethodReport> RegisteredSources,
    IReadOnlyList<DiscoveredCaller> UnregisteredCallers,
    IReadOnlyList<string> Limitations);
