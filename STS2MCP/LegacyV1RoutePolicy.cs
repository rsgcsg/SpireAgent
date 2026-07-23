using System;

namespace STS2_MCP;

/// <summary>
/// Identifies the fully retired v1 HTTP namespace. No method under this path
/// may restore state reconstruction or index-based mutation.
/// </summary>
internal static class LegacyV1RoutePolicy
{
    internal static bool IsRetiredPath(string path) =>
        string.Equals(path, "/api/v1", StringComparison.Ordinal)
        || path.StartsWith("/api/v1/", StringComparison.Ordinal);
}
