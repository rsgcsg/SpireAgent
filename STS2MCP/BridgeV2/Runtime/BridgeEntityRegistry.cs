using System;
using System.Runtime.CompilerServices;
using System.Threading;

namespace STS2_MCP.BridgeV2.Runtime;

internal sealed class BridgeEntityRegistry
{
    private sealed record Identity(string Value);

    private readonly string _sessionPrefix = Guid.NewGuid().ToString("N")[..8];
    private readonly ConditionalWeakTable<object, Identity> _identities = new();
    private long _nextIdentity;

    public string GetId(object entity, string kind)
    {
        return _identities.GetValue(entity, _ =>
        {
            long sequence = Interlocked.Increment(ref _nextIdentity);
            return new Identity($"{kind}_{_sessionPrefix}_{sequence:x}");
        }).Value;
    }
}
