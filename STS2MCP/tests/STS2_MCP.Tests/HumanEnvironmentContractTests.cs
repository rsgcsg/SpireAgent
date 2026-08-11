using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.HumanEnvironment.Protocol;
using STS2_MCP.HumanEnvironment.Runtime;
using STS2_MCP.NativeUi;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace STS2_MCP.Tests;

public sealed class HumanEnvironmentContractTests
{
    [Fact]
    public void CWireExcludesModeFrameAnnotationsAndNativeBindingOperands()
    {
        string[] observationProperties = typeof(HumanEnvironmentObservationResponse)
            .GetProperties()
            .Select(property => property.Name)
            .ToArray();
        string[] requestProperties = typeof(HumanEnvironmentActionRequest)
            .GetProperties()
            .Select(property => property.Name)
            .ToArray();
        string[] boundActionProperties = typeof(HumanEnvironmentBoundAction)
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
        Assert.DoesNotContain("Parameters", boundActionProperties);
        Assert.DoesNotContain("ParameterDomains", boundActionProperties);
        Assert.DoesNotContain("EntityBindings", boundActionProperties);
        Assert.Contains("SnapshotId", observationProperties);
        Assert.Contains("Referents", observationProperties);
        Assert.Contains("Interaction", observationProperties);
        Assert.Contains("Reads", observationProperties);
        Assert.DoesNotContain("Bridge", observationProperties);
        Assert.DoesNotContain("Game", observationProperties);
        Assert.DoesNotContain("Entities", observationProperties);
        Assert.DoesNotContain("Controls", observationProperties);

        string[] capabilityProperties = typeof(HumanEnvironmentCapabilitiesResponse)
            .GetProperties()
            .Select(property => property.Name)
            .ToArray();
        Assert.DoesNotContain("BusinessSourceRequired", capabilityProperties);
        Assert.DoesNotContain("BusinessOutcomeRequired", capabilityProperties);
        Assert.Contains("EnvironmentFingerprint", capabilityProperties);
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
        Assert.Equal(expected, HumanEnvironmentRuntime.GenericAction(command, operation));
    }

    [Fact]
    public void BreakingWireCleanupUsesRevisionedSchemas()
    {
        Assert.Equal("1.0-preview.6", HumanEnvironmentContract.ProtocolVersion);
        Assert.Equal("sts2.human-environment/observation-3", HumanEnvironmentContract.ObservationSchema);
        Assert.Equal("sts2.human-environment/action-2", HumanEnvironmentContract.ActionSchema);
        Assert.Equal("sts2.human-environment/receipt-3", HumanEnvironmentContract.ReceiptSchema);
    }

    [Fact]
    public void UnknownDeliveryContractNeverPermitsRetry()
    {
        var receipt = new HumanEnvironmentActionReceipt(
            HumanEnvironmentContract.ProtocolVersion,
            HumanEnvironmentContract.ReceiptSchema,
            "request-a",
            "unknown",
            new HumanEnvironmentActionSummary(
                "bound-action-a",
                "activate",
                "control-a",
                Array.Empty<HumanEnvironmentBoundActionArgument>()),
            "input_delivery_unknown",
            "Delivery may have occurred.",
            new HumanEnvironmentRetryPolicy(false, "unknown_delivery_never_retry"),
            null);

        Assert.False(receipt.Retry.Allowed);
        Assert.Equal("unknown", receipt.Delivery);
    }

    [Fact]
    public void ReadOnlyDetailContractsAreHumanEnvironmentAndStateBound()
    {
        Assert.Equal(
            "sts2.human-environment/read-2",
            HumanEnvironmentContract.ReadSchema);

        var entry = new HumanEnvironmentReadOpportunity(
            "read:surface_card:card-a",
            "surface_card",
            "card-a",
            "sts2.human-environment/read/surface_card-1",
            "normal_player_visible_surface_card",
            SnapshotBound: true,
            "single_entity",
            Array.Empty<string>());
        Assert.True(entry.SnapshotBound);
        Assert.True(McpMod.IsSafeHumanEnvironmentReadIdentifier("read:run_deck"));
        Assert.True(McpMod.IsSafeHumanEnvironmentReadIdentifier("read:surface_card:card-a"));
        Assert.False(McpMod.IsSafeHumanEnvironmentReadIdentifier("run_deck"));
        Assert.False(McpMod.IsSafeHumanEnvironmentReadIdentifier("read:../hidden"));
        Assert.False(McpMod.IsSafeHumanEnvironmentReadIdentifier("read:"));
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

        NativeUiActionDescriptor[] commands =
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

        NativeUiActionDescriptor[] commands =
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

        NativeUiActionDescriptor[] commands =
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
    public void RestCommandsDependOnCurrentButtonsNotPurposeSpecificWitnesses()
    {
        var surface = new RestSiteSurface(
            HumanRestSiteAdapter.SurfaceKind,
            "screen-rest",
            new[]
            {
                new VisibleRestOption("option-rest", 0, "REST", "Rest", "Heal", false),
                new VisibleRestOption("option-dig", 1, "DIG", "Dig", "Find a relic", true)
            },
            CanProceed: true);

        NativeUiActionDescriptor[] commands =
            HumanRestSiteAdapter.DescribeCommands(surface).ToArray();

        Assert.Equal(2, commands.Length);
        Assert.Contains(commands, command =>
            command.Kind == "choose_rest_option"
            && command.EntityBindings?.Any(binding => binding.EntityId == "option-dig") == true);
        Assert.Contains(commands, command => command.Kind == "proceed_rest_site");
        Assert.All(commands, command =>
        {
            Assert.DoesNotContain("source", command.EvidenceCode, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("witness", command.EvidenceCode, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("outcome", command.EvidenceCode, StringComparison.OrdinalIgnoreCase);
        });
    }

    [Theory]
    [InlineData(true, true, true, true)]
    [InlineData(false, true, true, false)]
    [InlineData(true, false, true, false)]
    [InlineData(true, true, false, false)]
    public void RestActionabilityRequiresTheExactVisibleEnabledNativeControl(
        bool optionEnabled,
        bool buttonEnabled,
        bool buttonVisible,
        bool expected)
    {
        Assert.Equal(
            expected,
            HumanRestSiteAdapter.IsOptionActionable(
                optionEnabled,
                buttonEnabled,
                buttonVisible));
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

        string facts = JsonSerializer.Serialize(
            HumanEnvironmentRuntime.ProjectHumanFacts(
                surface,
                new UnknownLiveContext(
                    "unknown",
                    "PrivateOwnerType",
                    "Visible UI owner is not classified.")));

        Assert.Contains("pile_type", facts);
        Assert.Contains("card-a", facts);
        Assert.Contains("Visible UI owner is not classified.", facts);
        Assert.DoesNotContain("source_kind", facts);
        Assert.DoesNotContain("source_type", facts);
        Assert.DoesNotContain("destination_pile", facts);
        Assert.DoesNotContain("mutation_kind", facts);
        Assert.DoesNotContain("commit_mode", facts);
    }

    [Fact]
    public void VisibleEntityFactsExistWithoutActionMaterialization()
    {
        JsonNode facts = JsonNode.Parse("""
        {"context":{"enemies":[{"entity_id":"enemy-a","name":"Visible enemy","hp":12}]}}
        """)!;

        IReadOnlyDictionary<string, HumanEnvironmentReferent> referents =
            HumanEnvironmentRuntime.ProjectFactReferents(facts);

        HumanEnvironmentReferent enemy = Assert.Contains("enemy-a", referents);
        Assert.Equal("enemy", enemy.Role);
        Assert.Equal("Visible enemy", enemy.Label);
        Assert.Null(enemy.State.Enabled);
        Assert.Equal("native_visible_fact", enemy.State.ObservationBasis);
    }

    [Fact]
    public void FiniteProjectionCountExposesRatherThanHidesExpansionOverflow()
    {
        string[] cards = Enumerable.Range(0, 24).Select(i => $"card-{i}").ToArray();
        string[] targets = Enumerable.Range(0, 24).Select(i => $"target-{i}").ToArray();
        var candidate = Candidate(
            "candidate-many",
            "Choose",
            new Dictionary<string, NativeUiOperandDomain>
            {
                ["card_id"] = new("entity_id", cards),
                ["target_id"] = new("entity_id", targets)
            }) with
        {
            EntityBindings = cards.Select(id => new ActionEntityBinding("card", id))
                .Concat(targets.Select(id => new ActionEntityBinding("target", id)))
                .ToArray()
        };

        Assert.Equal(576, HumanEnvironmentRuntime.CountParameterCombinations(candidate));
        HumanBoundActionProjectionResult projection = HumanEnvironmentRuntime.ProjectBoundActions(
            new[] { new NativeUiBoundAction(candidate, null, null) },
            "interaction-a",
            new Dictionary<string, HumanEnvironmentReferent>());
        Assert.Equal("truncated", projection.Projection.Status);
        Assert.Equal(512, projection.Projection.MaterializedCount);
        Assert.Equal(576, projection.Projection.TotalCount);
        Assert.Equal(512, projection.Bindings.Count);
    }

    [Fact]
    public void ConsumerLabelsDoNotChangeCanonicalActionAuthorityIdentity()
    {
        NativeUiActionCandidate left = Candidate("candidate-a", "Old label");
        NativeUiActionCandidate right = left with { Label = "Consumer-friendly new label" };

        string leftSignature = HumanEnvironmentRuntime.CanonicalAuthoritySignature(
            new[] { new NativeUiBoundAction(left, null, null) });
        string rightSignature = HumanEnvironmentRuntime.CanonicalAuthoritySignature(
            new[] { new NativeUiBoundAction(right, null, null) });

        Assert.Equal(leftSignature, rightSignature);
    }

    private static NativeUiActionCandidate Candidate(
        string id,
        string label,
        IReadOnlyDictionary<string, NativeUiOperandDomain>? domains = null) => new(
        id,
        "choose",
        "test_choose",
        label,
        new Dictionary<string, string>(),
        domains ?? new Dictionary<string, NativeUiOperandDomain>(),
        Array.Empty<ActionEntityBinding>(),
        "native_ui",
        "current");

    private static STS2_MCP.LiveHost.Contracts.VisibleCard TestCard(
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
