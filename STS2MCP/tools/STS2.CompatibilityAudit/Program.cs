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
    || !arguments.TryGetValue("--environment-policy", out string? policyPath))
{
    Console.Error.WriteLine(
        "Usage: dotnet run --project STS2.CompatibilityAudit -- " +
        "--game-assembly <sts2.dll> --registry <combat-pile-source-contracts.json> " +
        "--environment-policy <exact-environment-policy.json> [--output <report.json>]");
    return 64;
}

if (!File.Exists(gameAssembly)
    || !File.Exists(registryPath)
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
EnvironmentPolicy policy = ReadJson<EnvironmentPolicy>(policyPath, jsonOptions);
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
    string expectedCommitPrimitive = ExpectedCommitPrimitive(contract.WitnessKind);
    bool callsCommitPrimitive = analyzedMethod != null
                                && CallsMethod(analyzedMethod, expectedCommitPrimitive);
    registeredReports.Add(new SourceMethodReport(
        contract.SourceKind,
        contract.SourceType,
        contract.HookMode,
        sourceMethod?.FullName,
        analyzedMethod?.FullName,
        callsSink,
        expectedCommitPrimitive,
        callsCommitPrimitive,
        analyzedMethod == null ? null : FingerprintMethod(analyzedMethod)));
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
        discovered.Add(new DiscoveredCaller(
            type.FullName,
            sourceMethod.FullName,
            analyzed.FullName,
            registeredTypes.Contains(type.FullName),
            FingerprintMethod(analyzed)));
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
string policySha = HashFile(policyPath);
string status = registeredReports.All(report =>
        report.CallsExpectedSink && report.CallsExpectedCommitPrimitive)
    ? discovered.Any(caller => !caller.Registered)
        ? "review_required_unregistered_callers"
        : "registered_family_exact_source_match"
    : "failed_registered_binding";

var report = new CompatibilityAuditReport(
    SchemaVersion: 1,
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
    Policy: new InputIdentity(
        policy.PolicyId,
        policy.AuthorizationMode,
        policySha),
    ReleasePolicyCandidates: releaseCandidates,
    RegisteredSources: registeredReports,
    UnregisteredCallers: discovered.Where(caller => !caller.Registered).ToArray(),
    Limitations: new[]
    {
        "static_il_call_discovery_is_non_authorizing",
        "runtime_harmony_patch_closure_is_not_proven",
        "native_owner_and_ui_lifecycle_are_not_proven",
        "semantic_completion_is_not_proven",
        "exact_source_destination_operands_are_reviewed_but_not_fully_proven_by_static_il",
        "runtime_main_assembly_hash_is_not_computed_offline",
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

static string ExpectedCommitPrimitive(string witnessKind) => witnessKind switch
{
    "move_one_to_top" => "MegaCrit.Sts2.Core.Commands.CardPileCmd::Add",
    "move_one_to_hand_or_source_if_full" => "MegaCrit.Sts2.Core.Commands.CardPileCmd::Add",
    "move_one_between_piles" => "MegaCrit.Sts2.Core.Commands.CardCmd::Exhaust",
    "replace_one_same_index" => "MegaCrit.Sts2.Core.Commands.CardCmd::TransformTo",
    "move_exact_batch_between_piles" => "MegaCrit.Sts2.Core.Commands.CardPileCmd::Add",
    "replace_exact_batch_same_index" => "MegaCrit.Sts2.Core.Commands.CardCmd::TransformTo",
    "move_optional_batch_between_piles" => "MegaCrit.Sts2.Core.Commands.CardPileCmd::Add",
    _ => throw new InvalidDataException($"Unsupported witness kind {witnessKind}.")
};

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
    string WitnessKind);

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
    string? MethodFingerprint);

internal sealed record DiscoveredCaller(
    string SourceType,
    string SourceMethod,
    string AnalyzedMethod,
    bool Registered,
    string MethodFingerprint);

internal sealed record CompatibilityAuditReport(
    int SchemaVersion,
    DateTimeOffset GeneratedAt,
    string Status,
    string AuthorizationEffect,
    string QualificationEffect,
    AssemblyIdentity GameAssembly,
    ReleaseIdentity? Release,
    InputIdentity Registry,
    InputIdentity Policy,
    IReadOnlyList<EnvironmentEntry> ReleasePolicyCandidates,
    IReadOnlyList<SourceMethodReport> RegisteredSources,
    IReadOnlyList<DiscoveredCaller> UnregisteredCallers,
    IReadOnlyList<string> Limitations);
