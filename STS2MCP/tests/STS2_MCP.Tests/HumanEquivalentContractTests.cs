using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.ConnectorV3.Runtime;
using STS2_MCP.HumanEquivalent.Protocol;
using STS2_MCP.HumanEquivalent.Runtime;

namespace STS2_MCP.Tests;

public sealed class HumanEquivalentContractTests
{
    [Fact]
    public void CWireExcludesModeFrameAnnotationsAndNativeBindingOperands()
    {
        string[] observationProperties = typeof(HumanEquivalentObservationResponse)
            .GetProperties()
            .Select(property => property.Name)
            .ToArray();
        string[] requestProperties = typeof(HumanEquivalentActionRequest)
            .GetProperties()
            .Select(property => property.Name)
            .ToArray();
        string[] affordanceProperties = typeof(HumanEquivalentAffordance)
            .GetProperties()
            .Select(property => property.Name)
            .ToArray();

        Assert.DoesNotContain("Mode", observationProperties);
        Assert.DoesNotContain("Frame", observationProperties);
        Assert.DoesNotContain("OptionalAnnotations", observationProperties);
        Assert.DoesNotContain("Mode", requestProperties);
        Assert.DoesNotContain("ExpectedFrameId", requestProperties);
        Assert.DoesNotContain("ExpectedOwnerId", requestProperties);
        Assert.DoesNotContain("Parameters", requestProperties);
        Assert.DoesNotContain("Parameters", affordanceProperties);
        Assert.DoesNotContain("ParameterDomains", affordanceProperties);
        Assert.DoesNotContain("EntityBindings", affordanceProperties);
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
        Assert.Equal(expected, HumanEquivalentRuntime.GenericAction(command, operation));
    }

    [Fact]
    public void BreakingWireCleanupUsesRevisionedSchemas()
    {
        Assert.Equal("1.0-preview.2", HumanEquivalentContract.ProtocolVersion);
        Assert.EndsWith("/observation-2", HumanEquivalentContract.ObservationSchema);
        Assert.EndsWith("/action-2", HumanEquivalentContract.ActionSchema);
        Assert.EndsWith("/receipt-2", HumanEquivalentContract.ReceiptSchema);
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
                "control-a"),
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

    [Fact]
    public void DeckSelectorCommandsDependOnCurrentUiStateNotBusinessSource()
    {
        var cardA = TestCard("card-a", "Alpha");
        var cardB = TestCard("card-b", "Beta");
        var selecting = new HumanDeckCardSelectionSurface(
            HumanDeckCardSelectionAdapter.SurfaceKind,
            "selecting",
            "screen-a",
            "Choose cards",
            1,
            2,
            1,
            new[] { "card-b" },
            new[] { "card-a" },
            new[] { "card-b" },
            Cancelable: true,
            CanPreview: true,
            CanCancelSelection: true,
            CanCancelPreview: false,
            CanConfirm: false,
            new[] { cardA, cardB });

        ConnectorV3CommandDescriptor[] commands =
            HumanDeckCardSelectionAdapter.DescribeCommands(selecting).ToArray();

        Assert.Contains(commands, command =>
            command.Kind == HumanDeckCardSelectionAdapter.SelectOperation);
        Assert.Contains(commands, command =>
            command.Kind == HumanDeckCardSelectionAdapter.DeselectOperation);
        Assert.Contains(commands, command =>
            command.Kind == HumanDeckCardSelectionAdapter.PreviewOperation);
        Assert.Contains(commands, command =>
            command.Kind == HumanDeckCardSelectionAdapter.CancelSelectionOperation);
        Assert.DoesNotContain(commands, command =>
            command.EvidenceCode.Contains("source", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void DeckSelectorPreviewOnlyPublishesCurrentPreviewControls()
    {
        var surface = new HumanDeckCardSelectionSurface(
            HumanDeckCardSelectionAdapter.SurfaceKind,
            "preview",
            "screen-a",
            "Confirm cards",
            1,
            1,
            1,
            new[] { "card-a" },
            Array.Empty<string>(),
            Array.Empty<string>(),
            Cancelable: false,
            CanPreview: false,
            CanCancelSelection: false,
            CanCancelPreview: true,
            CanConfirm: true,
            new[] { TestCard("card-a", "Alpha") });

        ConnectorV3CommandDescriptor[] commands =
            HumanDeckCardSelectionAdapter.DescribeCommands(surface).ToArray();

        Assert.Equal(2, commands.Length);
        Assert.Contains(commands, command =>
            command.Kind == HumanDeckCardSelectionAdapter.CancelPreviewOperation);
        Assert.Contains(commands, command =>
            command.Kind == HumanDeckCardSelectionAdapter.ConfirmOperation);
    }

    [Fact]
    public void CombatPileCommandsDependOnVisibleSelectionMechanicsNotBusinessSource()
    {
        var cardA = TestCard("card-a", "Alpha");
        var cardB = TestCard("card-b", "Beta");
        var surface = new HumanCombatPileSelectionSurface(
            HumanCombatPileSelectionAdapter.SurfaceKind,
            "selecting",
            "screen-a",
            "Choose from discard pile",
            "discard",
            1,
            2,
            1,
            new[] { "card-b" },
            new[] { "card-a" },
            new[] { "card-b" },
            Cancelable: true,
            CanCancel: true,
            CanConfirm: true,
            new[] { cardA, cardB });

        ConnectorV3CommandDescriptor[] commands =
            HumanCombatPileSelectionAdapter.DescribeCommands(surface).ToArray();

        Assert.Equal(4, commands.Length);
        Assert.Contains(commands, command =>
            command.Kind == HumanCombatPileSelectionAdapter.SelectOperation);
        Assert.Contains(commands, command =>
            command.Kind == HumanCombatPileSelectionAdapter.DeselectOperation);
        Assert.Contains(commands, command =>
            command.Kind == HumanCombatPileSelectionAdapter.CancelOperation);
        Assert.Contains(commands, command =>
            command.Kind == HumanCombatPileSelectionAdapter.ConfirmOperation);
        Assert.All(commands, command =>
        {
            Assert.DoesNotContain("source", command.EvidenceCode, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("contract", command.EvidenceCode, StringComparison.OrdinalIgnoreCase);
        });
    }

    [Fact]
    public void HumanFactsUsePositiveProjectionRatherThanBusinessKeyDeletion()
    {
        var surface = new CombatPileCardSelectionSurface(
            "combat_pile_card_selection",
            "screen-a",
            "Choose from discard pile",
            "return_card",
            "move",
            "native_callback",
            "new_mod_card",
            "card",
            "source-a",
            "NEW_MOD_CARD",
            "source-card-a",
            "NEW_MOD_CARD",
            "discard",
            "hand",
            "top",
            null,
            null,
            1,
            1,
            0,
            Array.Empty<string>(),
            RequireManualConfirmation: true,
            Cancelable: true,
            new[] { TestCard("card-a", "Alpha") })
        {
            SelectableCardEntityIds = new[] { "card-a" },
            CanConfirm = false
        };

        string facts = HumanEquivalentRuntime.ProjectHumanFacts(
            surface,
            new UnknownBridgeContext("unknown", "PrivateOwnerType", "Visible UI owner is not classified."))
            .ToJsonString();

        Assert.Contains("pile_type", facts);
        Assert.Contains("card-a", facts);
        Assert.Contains("Visible UI owner is not classified.", facts);
        Assert.DoesNotContain("source_kind", facts);
        Assert.DoesNotContain("source_type", facts);
        Assert.DoesNotContain("destination_pile", facts);
        Assert.DoesNotContain("mutation_kind", facts);
        Assert.DoesNotContain("commit_mode", facts);
    }

    private static STS2_MCP.BridgeV2.Protocol.VisibleCard TestCard(
        string entityId,
        string name) => new(
            entityId,
            "test_card",
            name,
            "skill",
            "1",
            null,
            "Test description",
            "common",
            IsUpgraded: false,
            IsSelected: false,
            ExistingEnchantment: null);
}
