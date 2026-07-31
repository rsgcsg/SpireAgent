using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.ConnectorV3.Protocol;
using STS2_MCP.ConnectorV3.Runtime;

namespace STS2_MCP.Tests;

public sealed class ConnectorV3ContractTests
{
    [Fact]
    public void ParameterizedBindingRequiresEveryExactOperandAndNoExtras()
    {
        var candidate = new ConnectorV3CommandCandidate(
            "candidate-a",
            "play_card",
            "play_card",
            "Play",
            new Dictionary<string, string>
            {
                ["card_id"] = "card-session-1"
            },
            new Dictionary<string, ConnectorV3OperandDomain>
            {
                ["target_id"] = new(
                    "entity_ids",
                    new[] { "creature-session-2", "creature-session-3" })
            },
            Array.Empty<ActionEntityBinding>(),
            "native_direct_resolver",
            "supported");

        Assert.True(ConnectorV3Runtime.OperandsMatch(
            candidate,
            new Dictionary<string, string>
            {
                ["card_id"] = "card-session-1",
                ["target_id"] = "creature-session-3"
            }));
        Assert.False(ConnectorV3Runtime.OperandsMatch(
            candidate,
            new Dictionary<string, string>
            {
                ["card_id"] = "card-session-1",
                ["target_id"] = "creature-replacement-3"
            }));
        Assert.False(ConnectorV3Runtime.OperandsMatch(
            candidate,
            new Dictionary<string, string>
            {
                ["card_id"] = "card-session-1",
                ["target_id"] = "creature-session-3",
                ["unexpected"] = "entity-session-4"
            }));
    }

    [Fact]
    public void UnknownOutcomeNeverAdvertisesRetry()
    {
        var request = new ConnectorV3CommandRequest(
            "request-a",
            "state-a",
            "interaction-a",
            "play_card",
            new Dictionary<string, string> { ["card_id"] = "card-a" });
        var response = new BridgeCommandResponse(
            "request-a",
            "state-a",
            "v3cmd-a",
            "timed_out",
            "unknown",
            null,
            new[]
            {
                new BridgeCommandEvent(
                    "timed_out",
                    DateTimeOffset.UtcNow,
                    null,
                    "outcome_timeout",
                    "Completion was not observed before the deadline.")
            });

        ConnectorV3CommandReceipt receipt =
            ConnectorV3Runtime.ToReceipt(request, response);

        Assert.Equal("unknown", receipt.Status);
        Assert.Equal("unknown", receipt.Application);
        Assert.False(receipt.Retry.Allowed);
        Assert.Equal("mutation_may_have_occurred", receipt.Retry.Reason);
        Assert.Null(receipt.Completion);
    }

    [Fact]
    public void IdempotencyIdentityBindsInteractionCommandAndCanonicalOperands()
    {
        var operands = new Dictionary<string, string>
        {
            ["target_id"] = "creature-a",
            ["card_id"] = "card-a"
        };
        var reordered = new Dictionary<string, string>
        {
            ["card_id"] = "card-a",
            ["target_id"] = "creature-a"
        };

        string identity = ConnectorV3Runtime.BuildCommandIdentity(
            "interaction-a",
            "play_card",
            operands);

        Assert.Equal(
            identity,
            ConnectorV3Runtime.BuildCommandIdentity(
                "interaction-a",
                "play_card",
                reordered));
        Assert.NotEqual(
            identity,
            ConnectorV3Runtime.BuildCommandIdentity(
                "interaction-b",
                "play_card",
                operands));
        Assert.NotEqual(
            identity,
            ConnectorV3Runtime.BuildCommandIdentity(
                "interaction-a",
                "use_potion",
                operands));
    }
}
