using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using MegaCrit.Sts2.Core.Modding;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

internal static class BridgeModsetIdentity
{
    internal const string BridgeModId = "STS2_MCP";
    private const string FingerprintScope =
        "manager_state+ordered_manifest_identity+load_state+source+workshop_id+loaded_assembly_name_version_mvid";

    public static ModsetIdentity Read()
    {
        try
        {
            string managerState = ModManager.State.ToString();
            LoadedModIdentity[] mods = ModManager.Mods
                .Select(BuildMod)
                .ToArray();
            return Evaluate(
                managerState,
                mods,
                typeof(McpMod).Assembly.ManifestModule.ModuleVersionId.ToString("D"),
                McpMod.Version);
        }
        catch (Exception ex)
        {
            return new ModsetIdentity(
                "unavailable",
                BridgeHash.Object(new { state = "unavailable", error = ex.GetType().Name }),
                FingerprintScope,
                ExactPermissionEligible: false,
                Array.Empty<LoadedModIdentity>(),
                $"Loaded Modset identity failed closed with {ex.GetType().Name}.");
        }
    }

    internal static ModsetIdentity Evaluate(
        string managerState,
        IReadOnlyList<LoadedModIdentity> mods,
        string bridgeModuleVersionId,
        string bridgeVersion)
    {
        string fingerprint = BridgeHash.Object(new
        {
            managerState,
            mods
        });
        LoadedModIdentity[] loaded = mods
            .Where(mod => string.Equals(mod.LoadState, "Loaded", StringComparison.Ordinal))
            .ToArray();
        bool hazardousDetectedState = mods.Any(mod =>
            string.Equals(mod.LoadState, "Failed", StringComparison.Ordinal)
            || string.Equals(mod.LoadState, "AddedAtRuntime", StringComparison.Ordinal));
        LoadedModIdentity? bridge = loaded.FirstOrDefault(mod =>
            string.Equals(mod.Id, BridgeModId, StringComparison.Ordinal));
        bool exactBridgeAssembly = bridge?.Assemblies.Any(assembly =>
            string.Equals(assembly.ModuleVersionId, bridgeModuleVersionId, StringComparison.OrdinalIgnoreCase)) == true;
        bool exactBridgeVersion = string.Equals(bridge?.Version, bridgeVersion, StringComparison.Ordinal);
        bool exact = string.Equals(managerState, "Initialized", StringComparison.Ordinal)
                     && loaded.Length == 1
                     && bridge != null
                     && exactBridgeAssembly
                     && exactBridgeVersion
                     && !hazardousDetectedState;

        if (exact)
        {
            return new ModsetIdentity(
                "exact_bridge_only",
                fingerprint,
                FingerprintScope,
                ExactPermissionEligible: true,
                mods,
                "ModManager is initialized and the only loaded Mod is this exact STS2_MCP assembly.");
        }

        string status = !string.Equals(managerState, "Initialized", StringComparison.Ordinal)
            ? "manager_not_initialized"
            : hazardousDetectedState
                ? "hazardous_mod_state_detected"
                : loaded.Length == 0
                    ? "bridge_not_loaded"
                    : loaded.Length > 1
                        ? "additional_loaded_mods"
                        : bridge == null
                            ? "bridge_identity_missing"
                            : "bridge_identity_mismatch";
        return new ModsetIdentity(
            status,
            fingerprint,
            FingerprintScope,
            ExactPermissionEligible: false,
            mods,
            "This Modset has no explicit Bridge v2 action or Inspection permission. Observation remains diagnostic only.");
    }

    private static LoadedModIdentity BuildMod(Mod mod)
    {
        LoadedModAssemblyIdentity[] assemblies = mod.assemblies
            .Select(BuildAssembly)
            .OrderBy(assembly => assembly.Name, StringComparer.Ordinal)
            .ThenBy(assembly => assembly.ModuleVersionId, StringComparer.Ordinal)
            .ToArray();
        return new LoadedModIdentity(
            mod.manifest?.id ?? "unknown",
            mod.manifest?.version,
            mod.modSource.ToString(),
            mod.state.ToString(),
            mod.manifest?.affectsGameplay ?? true,
            mod.workshopId?.ToString(CultureInfo.InvariantCulture),
            assemblies);
    }

    private static LoadedModAssemblyIdentity BuildAssembly(Assembly assembly)
    {
        AssemblyName name = assembly.GetName();
        return new LoadedModAssemblyIdentity(
            name.Name ?? "unknown",
            name.Version?.ToString(),
            assembly.ManifestModule.ModuleVersionId.ToString("D"));
    }
}
