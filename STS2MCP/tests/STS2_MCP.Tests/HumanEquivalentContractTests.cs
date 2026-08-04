using STS2_MCP.ConnectorV3.Runtime;
using STS2_MCP.HumanEquivalent.Protocol;

namespace STS2_MCP.Tests;

public sealed class HumanEquivalentContractTests
{
    [Fact]
    public void ModesAreExplicitAndPureCannotSilentlyBecomeAssisted()
    {
        Assert.Equal(
            HumanEquivalentContract.AssistedMode,
            ConnectorV3Runtime.NormalizeHumanMode(null));
        Assert.Equal(
            HumanEquivalentContract.PureMode,
            ConnectorV3Runtime.NormalizeHumanMode(HumanEquivalentContract.PureMode));
        Assert.Throws<ArgumentException>(() =>
            ConnectorV3Runtime.NormalizeHumanMode("semantic_auto"));
    }

    [Theory]
    [InlineData("play_card", "play_card", "play")]
    [InlineData("select_entity", "unknown_source_select", "select")]
    [InlineData("confirm_interaction", "confirm_selection", "confirm")]
    [InlineData("activate_control", "open_shop", "open")]
    [InlineData("activate_control", "leave_shop", "close")]
    public void GenericUiActionsDoNotExposeBusinessOperationAsTheWireVerb(
        string command,
        string operation,
        string expected)
    {
        Assert.Equal(expected, ConnectorV3Runtime.GenericAction(command, operation));
    }

    [Fact]
    public void ExactParametersRejectReplacementAndUnexpectedOperands()
    {
        var expected = new Dictionary<string, string>
        {
            ["screen_id"] = "screen-a",
            ["card_id"] = "card-a"
        };
        Assert.True(ConnectorV3Runtime.DictionaryEqual(
            expected,
            new Dictionary<string, string>
            {
                ["card_id"] = "card-a",
                ["screen_id"] = "screen-a"
            }));
        Assert.False(ConnectorV3Runtime.DictionaryEqual(
            expected,
            new Dictionary<string, string>
            {
                ["screen_id"] = "screen-a",
                ["card_id"] = "card-replacement"
            }));
        Assert.False(ConnectorV3Runtime.DictionaryEqual(
            expected,
            new Dictionary<string, string>
            {
                ["screen_id"] = "screen-a",
                ["card_id"] = "card-a",
                ["extra"] = "not-advertised"
            }));
    }

    [Fact]
    public void UnknownDeliveryContractNeverPermitsRetry()
    {
        var receipt = new HumanEquivalentActionReceipt(
            HumanEquivalentContract.ProtocolVersion,
            HumanEquivalentContract.ReceiptSchema,
            "request-a",
            "unknown",
            "unknown",
            new HumanEquivalentActionSummary(
                "affordance-a",
                "activate",
                "control-a",
                new Dictionary<string, string>()),
            "input_delivery_unknown",
            "Delivery may have occurred.",
            new HumanEquivalentRetryPolicy(false, "unknown_delivery_never_retry"),
            null);

        Assert.False(receipt.Retry.Allowed);
        Assert.Equal("unknown", receipt.Delivery);
    }

    [Fact]
    public void ReadOnlyDetailContractsAreHumanEquivalentAndStateBound()
    {
        Assert.Equal(
            "sts2.connector.human-ui/inspection-1",
            HumanEquivalentContract.InspectionSchema);
        Assert.Equal(
            "sts2.connector.human-ui/linked-detail-1",
            HumanEquivalentContract.LinkedDetailSchema);

        var entry = new HumanEquivalentLinkedDetailCatalogEntry(
            "surface_card",
            "card-a",
            "normal_player_visible_surface_card",
            StateBound: true,
            CreatesActionAuthority: false);
        Assert.True(entry.StateBound);
        Assert.False(entry.CreatesActionAuthority);
    }
}
