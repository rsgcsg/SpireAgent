using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.ConnectorV3.Protocol;
using STS2_MCP.ConnectorV3.Runtime;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace STS2_MCP.Tests;

public sealed class ConnectorV3ContractTests
{
    [Fact]
    public void ObservationAlwaysSerializesNullSharedState()
    {
        var observation = new ConnectorV3ObservationResponse(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.ObservationSchema,
            "test",
            "state-a",
            1,
            DateTimeOffset.UnixEpoch,
            "observed",
            null,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            Array.Empty<BridgeInspectionCatalogEntry>(),
            Array.Empty<BridgeDiagnostic>(),
            Array.Empty<string>(),
            null!);
        string json = JsonSerializer.Serialize(observation, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        Assert.Contains("\"shared_state\":null", json);
    }

    [Fact]
    public void GenericControlsOnOneOwnerHaveDistinctSemanticOperands()
    {
        var owner = new[] { new ActionEntityBinding("room", "room-a") };
        Dictionary<string, string> open = ConnectorV3Runtime.BuildCommandOperands(
            "open_shop_inventory",
            "activate_control",
            owner);
        Dictionary<string, string> proceed = ConnectorV3Runtime.BuildCommandOperands(
            "proceed_shop",
            "activate_control",
            owner);

        Assert.Equal("room-a", open["room_id"]);
        Assert.Equal("open_shop_inventory", open["control_id"]);
        Assert.Equal("proceed_shop", proceed["control_id"]);
        Assert.NotEqual(open["control_id"], proceed["control_id"]);
    }

    [Fact]
    public void MapDrawingModeBindingAcceptsOnlyAuditedVersionShapes()
    {
        Assert.True(MapNavigationSurfaceProvider.IsCompatibleLocalDrawingModeSignature(
            Array.Empty<Type>()));
        Assert.True(MapNavigationSurfaceProvider.IsCompatibleLocalDrawingModeSignature(
            new[] { typeof(bool) }));
        Assert.False(MapNavigationSurfaceProvider.IsCompatibleLocalDrawingModeSignature(
            new[] { typeof(string) }));
        Assert.False(MapNavigationSurfaceProvider.IsCompatibleLocalDrawingModeSignature(
            new[] { typeof(bool), typeof(bool) }));
        Assert.True(MapNavigationSurfaceProvider.HasCompatibleLocalDrawingModeBinding);
    }

    [Fact]
    public void RestHealCompletionAcceptsExactRewardChildHandoff()
    {
        Assert.True(RestSiteSurfaceProvider.HasHealCompletionBoundary(
            currentHpReached: true,
            optionProgressed: false,
            rewardChildOpened: true));
        Assert.True(RestSiteSurfaceProvider.HasHealCompletionBoundary(
            currentHpReached: true,
            optionProgressed: true,
            rewardChildOpened: false));
        Assert.False(RestSiteSurfaceProvider.HasHealCompletionBoundary(
            currentHpReached: false,
            optionProgressed: true,
            rewardChildOpened: true));
        Assert.False(RestSiteSurfaceProvider.HasHealCompletionBoundary(
            currentHpReached: true,
            optionProgressed: false,
            rewardChildOpened: false));
    }

    [Fact]
    public void NativeMapAndRestOperandsBindOwnerAndExactEntity()
    {
        Dictionary<string, string> map = ConnectorV3Runtime.BuildCommandOperands(
            "choose_map_node",
            "navigate",
            new[]
            {
                new ActionEntityBinding("map_screen", "screen-a"),
                new ActionEntityBinding("map_node", "node-b")
            });
        Dictionary<string, string> rest = ConnectorV3Runtime.BuildCommandOperands(
            "choose_rest_option",
            "choose",
            new[]
            {
                new ActionEntityBinding("screen", "screen-c"),
                new ActionEntityBinding("rest_option", "option-d")
            });

        Assert.Equal("screen-a", map["map_screen_id"]);
        Assert.Equal("node-b", map["map_node_id"]);
        Assert.Equal("screen-c", rest["screen_id"]);
        Assert.Equal("option-d", rest["rest_option_id"]);
    }

    [Fact]
    public void SymbioteEnchantSourceRequiresExactNativeContract()
    {
        Assert.True(DeckEnchantSurfaceProvider.IsSymbioteSourceContract(
            exactEventType: true,
            exactEnchantmentType: true,
            enchantmentAmount: 1,
            minSelect: 1,
            maxSelect: 1,
            requireManualConfirmation: false,
            cancelable: false));
        Assert.False(DeckEnchantSurfaceProvider.IsSymbioteSourceContract(
            exactEventType: true,
            exactEnchantmentType: true,
            enchantmentAmount: 2,
            minSelect: 1,
            maxSelect: 1,
            requireManualConfirmation: false,
            cancelable: false));
        Assert.False(DeckEnchantSurfaceProvider.IsSymbioteSourceContract(
            exactEventType: false,
            exactEnchantmentType: true,
            enchantmentAmount: 1,
            minSelect: 1,
            maxSelect: 1,
            requireManualConfirmation: false,
            cancelable: false));
    }

    [Fact]
    public void NativeDeckEnchantOperandsBindOwnerAndExactCard()
    {
        Dictionary<string, string> operands = ConnectorV3Runtime.BuildCommandOperands(
            "toggle_card",
            "select_entity",
            new[]
            {
                new ActionEntityBinding("screen", "screen-enchant"),
                new ActionEntityBinding("card", "card-target")
            });

        Assert.Equal("screen-enchant", operands["screen_id"]);
        Assert.Equal("card-target", operands["card_id"]);
    }

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
