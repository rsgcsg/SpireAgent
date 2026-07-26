using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Mono.Cecil;
using Mono.Cecil.Cil;

Dictionary<string, string> arguments = ParseArguments(args);
if (!arguments.TryGetValue("--game-assembly", out string? gameAssembly)
    || !arguments.TryGetValue("--manifest", out string? manifestPath)
    || !arguments.TryGetValue("--release-info", out string? releaseInfoPath))
{
    Console.Error.WriteLine(
        "Usage: STS2.OperationBindingAudit --game-assembly <sts2.dll> " +
        "--manifest <operation-binding-probes.json> --release-info <release_info.json> " +
        "[--output <report.json>]");
    return 64;
}
if (!File.Exists(gameAssembly)
    || !File.Exists(manifestPath)
    || !File.Exists(releaseInfoPath))
{
    Console.Error.WriteLine("The game assembly or operation binding manifest does not exist.");
    return 66;
}

JsonSerializerOptions jsonOptions = new()
{
    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    PropertyNameCaseInsensitive = true,
    WriteIndented = true
};
BindingManifest manifest = JsonSerializer.Deserialize<BindingManifest>(
    File.ReadAllText(manifestPath),
    jsonOptions) ?? throw new InvalidDataException("Could not decode the binding manifest.");
if (manifest.SchemaVersion != 1
    || manifest.AuthorizationEffect != "none"
    || manifest.QualificationEffect != "none"
    || manifest.Operations.Count == 0)
{
    throw new InvalidDataException("Binding manifest must be non-authorizing and non-empty.");
}
ReleaseIdentity release = JsonSerializer.Deserialize<ReleaseIdentity>(
    File.ReadAllText(releaseInfoPath),
    jsonOptions) ?? throw new InvalidDataException("Could not decode release_info.json.");

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
Dictionary<string, TypeDefinition> types = AllTypes(assembly.MainModule)
    .ToDictionary(type => type.FullName, StringComparer.Ordinal);

OperationReport[] operations = manifest.Operations.Select(operation =>
{
    ProbeReport[] probes = operation.Probes.Select(probe =>
        InspectProbe(types, probe)).ToArray();
    string status = probes.All(probe => probe.Status == "matched")
        ? "reviewed_binding_match"
        : "binding_mismatch_code_required";
    return new OperationReport(
        operation.SurfaceKind,
        operation.Operation,
        status,
        HashObject(probes.Select(probe => new
        {
            probe.Type,
            probe.MemberKind,
            probe.Member,
            probe.ParameterCount,
            probe.Status,
            probe.Signature,
            probe.ImplementationFingerprint
        }).ToArray(), jsonOptions),
        probes,
        status == "reviewed_binding_match"
            ? "targeted_runtime_requalification_required"
            : "code_required",
        new[]
        {
            "runtime_owner_and_visibility",
            "execute_time_legality",
            "semantic_completion",
            "organic_operation_evidence"
        });
}).ToArray();

var report = new BindingAuditReport(
    1,
    DateTimeOffset.UtcNow,
    operations.All(operation => operation.Status == "reviewed_binding_match")
        ? "reviewed_bindings_match"
        : "binding_mismatch_code_required",
    "none",
    "none",
    manifest.ManifestId,
    HashFile(manifestPath),
    manifest.Baseline,
    release,
    new AssemblyIdentity(
        Path.GetFileName(gameAssembly),
        HashFile(gameAssembly),
        assembly.MainModule.Mvid.ToString("D")),
    operations,
    new[]
    {
        "member_and_il_fingerprints_are_change_detectors_not_semantic_equivalence_proofs",
        "matching_bindings_do_not_authorize_actions",
        "runtime_owner_visibility_legality_patch_closure_and_completion_remain_unproven",
        "a_new_game_environment_requires_operation_scoped_runtime_evidence"
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
return report.Status == "reviewed_bindings_match" ? 0 : 2;

static ProbeReport InspectProbe(
    IReadOnlyDictionary<string, TypeDefinition> types,
    BindingProbe probe)
{
    if (!types.TryGetValue(probe.Type, out TypeDefinition? type))
    {
        return new ProbeReport(
            probe.Type, probe.MemberKind, probe.Member, probe.ParameterCount,
            "missing_type", null, null);
    }

    return probe.MemberKind switch
    {
        "field" => InspectField(type, probe),
        "method" => InspectMethod(type, probe),
        "property" => InspectProperty(type, probe),
        _ => new ProbeReport(
            probe.Type, probe.MemberKind, probe.Member, probe.ParameterCount,
            "unsupported_probe_kind", null, null)
    };
}

static ProbeReport InspectField(TypeDefinition type, BindingProbe probe)
{
    FieldDefinition? field = type.Fields.SingleOrDefault(candidate =>
        candidate.Name == probe.Member);
    return field == null
        ? Missing(probe)
        : Matched(probe, field.FullName, null);
}

static ProbeReport InspectMethod(TypeDefinition type, BindingProbe probe)
{
    MethodDefinition[] methods = type.Methods.Where(candidate =>
            candidate.Name == probe.Member
            && (probe.ParameterCount == null
                || candidate.Parameters.Count == probe.ParameterCount))
        .ToArray();
    return methods.Length != 1
        ? Missing(probe, methods.Length == 0 ? "missing_member" : "ambiguous_member")
        : Matched(probe, methods[0].FullName, FingerprintMethod(methods[0]));
}

static ProbeReport InspectProperty(TypeDefinition type, BindingProbe probe)
{
    PropertyDefinition? property = type.Properties.SingleOrDefault(candidate =>
        candidate.Name == probe.Member);
    return property == null
        ? Missing(probe)
        : Matched(
            probe,
            property.FullName,
            property.GetMethod == null ? null : FingerprintMethod(property.GetMethod));
}

static ProbeReport Missing(BindingProbe probe, string status = "missing_member") =>
    new(probe.Type, probe.MemberKind, probe.Member, probe.ParameterCount,
        status, null, null);

static ProbeReport Matched(
    BindingProbe probe,
    string signature,
    string? implementationFingerprint) =>
    new(probe.Type, probe.MemberKind, probe.Member, probe.ParameterCount,
        "matched", signature, implementationFingerprint);

static string? FingerprintMethod(MethodDefinition method)
{
    if (!method.HasBody)
        return null;
    string canonical = string.Join(
        "\n",
        method.Body.Instructions.Select(instruction =>
            $"{instruction.OpCode.Code}:{Operand(instruction.Operand)}"));
    return HashText(canonical);
}

static string Operand(object? operand) => operand switch
{
    MethodReference method => method.FullName,
    FieldReference field => field.FullName,
    TypeReference type => type.FullName,
    ParameterDefinition parameter => $"parameter:{parameter.Index}:{parameter.ParameterType.FullName}",
    VariableDefinition variable => $"variable:{variable.Index}:{variable.VariableType.FullName}",
    Instruction instruction => $"target:{instruction.OpCode.Code}",
    Instruction[] instructions => $"targets:{instructions.Length}",
    null => string.Empty,
    _ => operand.ToString() ?? string.Empty
};

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

static Dictionary<string, string> ParseArguments(string[] values)
{
    var result = new Dictionary<string, string>(StringComparer.Ordinal);
    for (int index = 0; index < values.Length; index += 2)
    {
        if (index + 1 >= values.Length
            || !values[index].StartsWith("--", StringComparison.Ordinal))
            throw new ArgumentException($"Invalid argument near {values[index]}.");
        result[values[index]] = values[index + 1];
    }
    return result;
}

static string HashFile(string path)
{
    using FileStream stream = File.OpenRead(path);
    return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
}

static string HashText(string value) =>
    Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)))
        .ToLowerInvariant();

static string HashObject(object value, JsonSerializerOptions options) =>
    HashText(JsonSerializer.Serialize(value, options));

sealed record BindingManifest(
    int SchemaVersion,
    string ManifestId,
    string AuthorizationEffect,
    string QualificationEffect,
    BaselineIdentity Baseline,
    IReadOnlyList<OperationProbe> Operations);

sealed record BaselineIdentity(
    string GameVersion,
    string GameCommit,
    string Basis);

sealed record ReleaseIdentity(
    string Version,
    string Commit,
    string Branch,
    int MainAssemblyHash);

sealed record OperationProbe(
    string SurfaceKind,
    string Operation,
    IReadOnlyList<BindingProbe> Probes);

sealed record BindingProbe(
    string Type,
    string MemberKind,
    string Member,
    int? ParameterCount);

sealed record ProbeReport(
    string Type,
    string MemberKind,
    string Member,
    int? ParameterCount,
    string Status,
    string? Signature,
    string? ImplementationFingerprint);

sealed record OperationReport(
    string SurfaceKind,
    string Operation,
    string Status,
    string BindingDigest,
    IReadOnlyList<ProbeReport> Probes,
    string Recommendation,
    IReadOnlyList<string> RemainingEvidence);

sealed record AssemblyIdentity(
    string FileName,
    string Sha256,
    string ModuleVersionId);

sealed record BindingAuditReport(
    int SchemaVersion,
    DateTimeOffset GeneratedAt,
    string Status,
    string AuthorizationEffect,
    string QualificationEffect,
    string ManifestId,
    string ManifestDigest,
    BaselineIdentity Baseline,
    ReleaseIdentity Release,
    AssemblyIdentity GameAssembly,
    IReadOnlyList<OperationReport> Operations,
    IReadOnlyList<string> Limitations);
