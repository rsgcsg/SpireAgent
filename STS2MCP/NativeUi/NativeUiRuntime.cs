using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.NativeUi;

/// <summary>
/// Process-local native UI identity shared by HE and explicit legacy
/// comparison endpoints. It publishes no affordances and grants no authority.
/// </summary>
internal static class NativeUiRuntime
{
    internal static BridgeEntityRegistry Entities { get; } = new();
}
