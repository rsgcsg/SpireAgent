using System;

namespace STS2_MCP;

/// <summary>
/// Keeps legacy read compatibility separate from mutation authority. New v1
/// POST routes are denied by default as well, so adding a route cannot silently
/// bypass the Bridge v2 command contract.
/// </summary>
internal static class LegacyV1MutationPolicy
{
    internal static bool IsAllowed(string httpMethod, string path, bool mutationsEnabled)
    {
        if (!string.Equals(httpMethod, "POST", StringComparison.OrdinalIgnoreCase))
            return true;
        if (!path.StartsWith("/api/v1/", StringComparison.Ordinal))
            return true;
        return mutationsEnabled;
    }
}
