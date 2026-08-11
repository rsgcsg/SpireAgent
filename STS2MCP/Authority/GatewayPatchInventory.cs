using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using HarmonyLib;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.NativeUi;

namespace STS2_MCP.Authority;

internal sealed record GatewayPatchDescriptor(
    string OriginalMethod,
    string PatchKind,
    string Owner,
    string PatchMethod);

internal static class GatewayPatchInventory
{
    internal const string GatewayHarmonyOwner = "com.sts2mcp";

    public static GatewayPatchInventoryInfo Read()
    {
        try
        {
            GatewayPatchDescriptor[] descriptors = Harmony.GetAllPatchedMethods()
                .SelectMany(ReadMethod)
                .OrderBy(value => value.OriginalMethod, StringComparer.Ordinal)
                .ThenBy(value => value.PatchKind, StringComparer.Ordinal)
                .ThenBy(value => value.Owner, StringComparer.Ordinal)
                .ThenBy(value => value.PatchMethod, StringComparer.Ordinal)
                .ToArray();
            return Classify(descriptors);
        }
        catch (Exception ex)
        {
            return GatewayPatchInventoryInfo.Unavailable(
                $"Harmony patch inventory failed closed with {ex.GetType().Name}.");
        }
    }

    internal static GatewayPatchInventoryInfo Classify(
        IReadOnlyList<GatewayPatchDescriptor> descriptors)
    {
        string[] owners = descriptors
            .Select(value => value.Owner)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(value => value, StringComparer.Ordinal)
            .ToArray();
        string[] unknownOwners = owners
            .Where(owner => !string.Equals(owner, GatewayHarmonyOwner, StringComparison.Ordinal))
            .ToArray();
        bool gatewayOwnerPresent = owners.Contains(
            GatewayHarmonyOwner,
            StringComparer.Ordinal);
        string status = unknownOwners.Length > 0
            ? "unknown_patch_owner"
            : gatewayOwnerPresent
                ? "clean_known_owners"
                : "gateway_patch_owner_missing";
        return new GatewayPatchInventoryInfo(
            status,
            StableIdentityHash.Object(descriptors),
            "loaded_harmony_patch_metadata_global_conservative",
            descriptors.Select(value => value.OriginalMethod).Distinct(StringComparer.Ordinal).Count(),
            owners,
            unknownOwners,
            new[]
            {
                "Dynamic grants require the loaded Gateway Harmony owner to be present; an empty inventory fails closed.",
                "Harmony metadata cannot prove the absence of native hooks or non-Harmony runtime mutation.",
                "The inventory is a conservative session evidence input, not semantic compatibility proof."
            });
    }

    private static IEnumerable<GatewayPatchDescriptor> ReadMethod(MethodBase method)
    {
        Patches? patches = Harmony.GetPatchInfo(method);
        if (patches == null)
            return Array.Empty<GatewayPatchDescriptor>();

        string original = MethodIdentity(method);
        return Describe(original, "prefix", patches.Prefixes)
            .Concat(Describe(original, "postfix", patches.Postfixes))
            .Concat(Describe(original, "transpiler", patches.Transpilers))
            .Concat(Describe(original, "finalizer", patches.Finalizers));
    }

    private static IEnumerable<GatewayPatchDescriptor> Describe(
        string original,
        string kind,
        IEnumerable<Patch> patches) =>
        patches.Select(patch => new GatewayPatchDescriptor(
            original,
            kind,
            patch.owner ?? string.Empty,
            MethodIdentity(patch.PatchMethod)));

    private static string MethodIdentity(MethodBase? method)
    {
        if (method == null)
            return "unknown";
        string type = method.DeclaringType?.FullName ?? "unknown_type";
        string parameters = string.Join(
            ",",
            method.GetParameters().Select(parameter =>
                parameter.ParameterType.FullName ?? parameter.ParameterType.Name));
        return $"{type}.{method.Name}({parameters})";
    }
}
