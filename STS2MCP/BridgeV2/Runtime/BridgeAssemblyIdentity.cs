using System;
using System.IO;
using System.Reflection;
using System.Security.Cryptography;

namespace STS2_MCP.BridgeV2.Runtime;

/// <summary>
/// Identifies the loaded Gateway artifact without ever disclosing its local path.
/// A missing or unreadable digest is an identity failure, not a compatibility hint.
/// </summary>
internal static class BridgeAssemblyIdentity
{
    private static readonly Lazy<string?> LoadedDigest = new(ReadLoadedAssemblySha256);

    public static string? LoadedAssemblySha256 => LoadedDigest.Value;

    internal static string? HashFile(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            return null;

        try
        {
            byte[] digest = SHA256.HashData(File.ReadAllBytes(path));
            return Convert.ToHexString(digest).ToLowerInvariant();
        }
        catch (IOException)
        {
            return null;
        }
        catch (UnauthorizedAccessException)
        {
            return null;
        }
    }

    private static string? ReadLoadedAssemblySha256() =>
        HashFile(typeof(McpMod).Assembly.Location);
}
