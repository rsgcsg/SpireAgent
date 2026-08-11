using STS2_MCP.Authority;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using STS2_MCP.LiveHost;
using STS2_MCP.LiveHost.Contracts;
using STS2_MCP.HumanEnvironment.Protocol;
using STS2_MCP.NativeUi;

namespace STS2_MCP.HumanEnvironment.Runtime;

internal static partial class HumanEnvironmentRuntime
{
    private static IReadOnlyList<NativeUiBoundAction> BuildHumanEnvironmentBindings(
        LiveObservation draft)
    {
        IReadOnlyList<NativeUiActionDescriptor>? descriptors = draft.Surface switch
        {
            HumanDeckCardSelectionSurface deckSelection =>
                HumanDeckCardSelectionAdapter.DescribeCommands(deckSelection),
            HumanCombatPileSelectionSurface combatPileSelection =>
                HumanCombatPileSelectionAdapter.DescribeCommands(combatPileSelection),
            RestSiteSurface restSite =>
                HumanRestSiteAdapter.DescribeCommands(restSite),
            _ => null
        };
        if (descriptors == null)
            return NativeUiActionRuntime.BuildBindings(draft);

        return descriptors
            .Select(descriptor => NativeUiActionRuntime.BindActionToCurrentObservation(draft, descriptor))
            .Where(binding => binding != null)
            .Cast<NativeUiBoundAction>()
            .ToArray();
    }

    private static IEnumerable<VisibleCard> HumanSurfaceCards(ILiveSurface surface) =>
        surface switch
        {
            HumanDeckCardSelectionSurface deckSelection => deckSelection.Cards,
            HumanCombatPileSelectionSurface combatPileSelection => combatPileSelection.Cards,
            DeckEnchantSelectionSurface value => value.Cards,
            DeckRemovalSelectionSurface value => value.Cards,
            EventDeckRemovalSelectionSurface value => value.Cards,
            DeckUpgradeSelectionSurface value => value.Cards.Concat(value.PreviewCards),
            DeckTransformSelectionSurface value => value.Cards,
            WoodCarvingsReplacementSelectionSurface value => value.Cards,
            CombatPileCardSelectionSurface value => value.Cards,
            CombatHandCardSelectionSurface value => value.Cards,
            EventCardAcquisitionSurface value => value.Cards,
            CardRewardSelectionSurface value => value.Cards,
            GeneratedCardChoiceSurface value => value.Cards,
            _ => Array.Empty<VisibleCard>()
        };

    internal static HumanBoundActionProjectionResult ProjectBoundActions(
            IReadOnlyList<NativeUiBoundAction> bindings,
            string interactionId,
            IReadOnlyDictionary<string, HumanEnvironmentReferent> visibleReferents)
    {
        var actions = new List<HumanEnvironmentBoundAction>();
        var exactBindings = new Dictionary<string, HumanEnvironmentNativeBinding>(StringComparer.Ordinal);
        long totalCount = 0;
        foreach (NativeUiBoundAction binding in bindings
            .OrderBy(item => item.Candidate.CandidateId, StringComparer.Ordinal))
        {
            totalCount = SaturatingAdd(totalCount, CountParameterCombinations(binding.Candidate));
            int remaining = MaxBoundActions - actions.Count;
            if (remaining <= 0)
                continue;
            foreach (IReadOnlyDictionary<string, string> parameters in ExpandParameters(binding.Candidate, remaining))
            {
                IReadOnlyList<HumanEnvironmentBoundActionArgument> publicBindings =
                    PublicBoundActionBindings(binding.Candidate, parameters, visibleReferents);
                int subjectIndex = SubjectBindingIndex(binding.Candidate.Command, publicBindings);
                string? subjectRef = subjectIndex < 0
                    ? null
                    : publicBindings[subjectIndex].ReferentId;
                HumanEnvironmentBoundActionArgument[] arguments = publicBindings
                    .Where((_, index) => index != subjectIndex)
                    .ToArray();
                string action = GenericAction(binding.Candidate.Command, binding.Candidate.Operation);
                string boundActionId = "bound_action_" + StableIdentityHash.Object(new
                {
                    binding.Candidate.CandidateId,
                    binding.Candidate.Command,
                    action,
                    interactionId,
                    subjectRef,
                    arguments,
                    parameters = parameters.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray()
                })[..20];
                string label = BoundActionLabel(binding.Candidate.Label, arguments, visibleReferents);
                var projected = new HumanEnvironmentBoundAction(
                        boundActionId,
                        action,
                        interactionId,
                        subjectRef,
                        arguments,
                        label);
                if (exactBindings.TryAdd(
                    boundActionId,
                    new HumanEnvironmentNativeBinding(binding, parameters)))
                {
                    actions.Add(projected);
                }
            }
        }
        string status = totalCount == actions.Count ? "complete" : "truncated";
        return new HumanBoundActionProjectionResult(
            new HumanEnvironmentBoundActionProjection(
                "sts2.human-environment/bound-actions-1",
                status,
                actions.Count,
                totalCount,
                MaxBoundActions,
                "candidate_id_then_operand_name_then_referent_id",
                actions),
            exactBindings);
    }

    private static IReadOnlyList<HumanEnvironmentInteractionCapability>
        ProjectInteractionCapabilities(IReadOnlyList<NativeUiBoundAction> bindings) =>
        bindings
            .Where(binding => CountParameterCombinations(binding.Candidate) > 0)
            .Select(binding =>
            {
                string[] roles = PublicParameterRoles(binding.Candidate).ToArray();
                int subjectIndex = SubjectRoleIndex(binding.Candidate.Command, roles);
                return new HumanEnvironmentInteractionCapability(
                    GenericAction(binding.Candidate.Command, binding.Candidate.Operation),
                    subjectIndex < 0 ? null : roles[subjectIndex],
                    roles.Where((_, index) => index != subjectIndex)
                        .Select(role => new HumanEnvironmentCapabilityArgument(role, Required: true))
                        .ToArray(),
                    "current_native_interaction");
            })
            .GroupBy(value => StableIdentityHash.Object(value), StringComparer.Ordinal)
            .Select(group => group.First())
            .OrderBy(value => value.Action, StringComparer.Ordinal)
            .ThenBy(value => value.SubjectRole, StringComparer.Ordinal)
            .ToArray();

    private static IEnumerable<string> PublicParameterRoles(NativeUiActionCandidate candidate)
    {
        IEnumerable<string> names = candidate.Operands.Keys.Concat(candidate.OperandDomains.Keys)
            .Where(name => name.EndsWith("_id", StringComparison.Ordinal)
                && !IsPrivateBindingParameter(name))
            .Distinct(StringComparer.Ordinal);
        foreach (string name in names.OrderBy(value => value, StringComparer.Ordinal))
        {
            IEnumerable<string> values = candidate.Operands.TryGetValue(name, out string? fixedValue)
                ? new[] { fixedValue }
                : candidate.OperandDomains.TryGetValue(name, out NativeUiOperandDomain? domain)
                    ? domain.EntityIds
                    : Array.Empty<string>();
            ActionEntityBinding? entityBinding = candidate.EntityBindings.FirstOrDefault(item =>
                values.Contains(item.EntityId, StringComparer.Ordinal)
                && !IsOwnerRole(item.Role)
                && !IsPrivateBindingRole(item.Role));
            yield return PublicRole(entityBinding?.Role ?? name);
        }
    }

    internal static long CountParameterCombinations(NativeUiActionCandidate candidate)
    {
        long count = 1;
        foreach (NativeUiOperandDomain domain in candidate.OperandDomains.Values)
        {
            if (domain.EntityIds.Count == 0)
                return 0;
            if (count > long.MaxValue / domain.EntityIds.Count)
                return long.MaxValue;
            count *= domain.EntityIds.Count;
        }
        return count;
    }

    private static long SaturatingAdd(long left, long right) =>
        left > long.MaxValue - right ? long.MaxValue : left + right;

    internal static string CanonicalAuthoritySignature(
        IReadOnlyList<NativeUiBoundAction> bindings) => StableIdentityHash.Object(
        bindings.Select(binding => new
        {
            binding.Candidate.CandidateId,
            binding.Candidate.Command,
            binding.Candidate.Operation,
            Operands = binding.Candidate.Operands.OrderBy(pair => pair.Key, StringComparer.Ordinal).ToArray(),
            Domains = binding.Candidate.OperandDomains
                .OrderBy(pair => pair.Key, StringComparer.Ordinal)
                .Select(pair => new
                {
                    pair.Key,
                    pair.Value.Kind,
                    EntityIds = pair.Value.EntityIds.OrderBy(value => value, StringComparer.Ordinal).ToArray()
                }).ToArray(),
            EntityBindings = binding.Candidate.EntityBindings
                .OrderBy(value => value.Role, StringComparer.Ordinal)
                .ThenBy(value => value.EntityId, StringComparer.Ordinal)
                .Select(value => new { value.Role, value.EntityId })
                .ToArray(),
            binding.Candidate.BindingKind,
            binding.Candidate.AuthorityState
        }).OrderBy(value => value.CandidateId, StringComparer.Ordinal).ToArray());

    private static Dictionary<string, HumanEnvironmentReferent> BuildHumanReferents(
        JsonNode surfaceContent,
        ILiveSurface surface,
        IReadOnlyList<NativeUiBoundAction> bindings,
        JsonNode rawSurface)
    {
        var referents = ProjectFactReferents(surfaceContent);
        foreach (VisibleCard card in HumanSurfaceCards(surface))
        {
            AddHumanReferent(
                referents,
                card.EntityId,
                "card",
                "entity",
                card.Name ?? card.DefinitionId,
                IsSelected(rawSurface, card.EntityId),
                JsonSerializer.SerializeToNode(card, McpMod._jsonOptions));
        }
        foreach (ActionEntityBinding binding in bindings.SelectMany(item => item.Candidate.EntityBindings))
        {
            if (IsOwnerRole(binding.Role) || IsPrivateBindingRole(binding.Role))
                continue;
            AddHumanReferent(
                referents,
                binding.EntityId,
                PublicRole(binding.Role),
                "control",
                null,
                null,
                null,
                enabled: true,
                observationBasis: "native_ui_actionability");
        }
        return referents;
    }

    internal static Dictionary<string, HumanEnvironmentReferent> ProjectFactReferents(
        JsonNode surfaceContent)
    {
        var referents = new Dictionary<string, HumanEnvironmentReferent>(StringComparer.Ordinal);
        CollectHumanReferents(surfaceContent, null, referents);
        return referents;
    }

    private static void CollectHumanReferents(
        JsonNode? node,
        string? parentKey,
        Dictionary<string, HumanEnvironmentReferent> referents)
    {
        if (node is JsonObject obj)
        {
            foreach ((string key, JsonNode? value) in obj)
            {
                if (value?.GetValueKind() == JsonValueKind.String
                    && IsVisibleReferentField(key))
                {
                    AddHumanReferent(
                        referents,
                        value.GetValue<string>(),
                        ReferentRole(key, parentKey),
                        "entity",
                        ReadFirstString(obj, "name", "label", "title", "definition_id"),
                        ReadOptionalBool(obj, "is_selected", "selected"),
                        obj.DeepClone(),
                        ReadOptionalBool(obj, "enabled", "is_enabled"));
                }
                else if (value is JsonArray ids && IsVisibleReferentArray(key))
                {
                    foreach (JsonNode? id in ids)
                    {
                        if (id?.GetValueKind() == JsonValueKind.String)
                        {
                            AddHumanReferent(
                                referents,
                                id.GetValue<string>(),
                                ReferentRole(key, parentKey),
                                "entity",
                                null,
                                null,
                                null);
                        }
                    }
                }
                CollectHumanReferents(value, key, referents);
            }
        }
        else if (node is JsonArray array)
        {
            foreach (JsonNode? value in array)
                CollectHumanReferents(value, parentKey, referents);
        }
    }

    private static void AddHumanReferent(
        Dictionary<string, HumanEnvironmentReferent> referents,
        string referentId,
        string role,
        string kind,
        string? label,
        bool? selected,
        JsonNode? properties,
        bool? enabled = null,
        string observationBasis = "native_visible_fact")
    {
        if (string.IsNullOrWhiteSpace(referentId))
            return;
        bool hasProperties = properties is JsonObject { Count: > 1 };
        if (referents.TryGetValue(referentId, out HumanEnvironmentReferent? existing)
            && (!hasProperties || existing.Properties != null))
            return;
        string safeRole = SchemaToken(role);
        referents[referentId] = new HumanEnvironmentReferent(
            referentId,
            safeRole,
            kind,
            label ?? existing?.Label,
            new HumanEnvironmentReferentState(
                Visible: true,
                Enabled: enabled ?? existing?.State.Enabled,
                Selected: selected ?? existing?.State.Selected,
                Focused: existing?.State.Focused,
                ObservationBasis: observationBasis),
            hasProperties ? ReferentPropertiesSchema(safeRole) : null,
            hasProperties ? properties : null);
    }

    private static IReadOnlyList<HumanEnvironmentBoundActionArgument> PublicBoundActionBindings(
        NativeUiActionCandidate candidate,
        IReadOnlyDictionary<string, string> parameters,
        IReadOnlyDictionary<string, HumanEnvironmentReferent> visibleReferents)
    {
        var result = new List<HumanEnvironmentBoundActionArgument>();
        foreach ((string name, string value) in parameters)
        {
            if (!name.EndsWith("_id", StringComparison.Ordinal) || IsPrivateBindingParameter(name))
                continue;
            ActionEntityBinding? entityBinding = candidate.EntityBindings.FirstOrDefault(item =>
                string.Equals(item.EntityId, value, StringComparison.Ordinal)
                && !IsOwnerRole(item.Role)
                && !IsPrivateBindingRole(item.Role));
            if (entityBinding == null && !visibleReferents.ContainsKey(value))
                continue;
            string role = PublicRole(entityBinding?.Role ?? name);
            if (!result.Any(item => string.Equals(item.Role, role, StringComparison.Ordinal)
                && string.Equals(item.ReferentId, value, StringComparison.Ordinal)))
            {
                result.Add(new HumanEnvironmentBoundActionArgument(role, value));
            }
        }
        return result;
    }

    private static int SubjectBindingIndex(
        string command,
        IReadOnlyList<HumanEnvironmentBoundActionArgument> bindings)
    {
        return SubjectRoleIndex(command, bindings.Select(item => item.Role).ToArray());
    }

    private static int SubjectRoleIndex(string command, IReadOnlyList<string> roles)
    {
        if (roles.Count == 0)
            return -1;
        string[] preferred = command switch
        {
            "play_card" => new[] { "card" },
            "use_potion" => new[] { "potion" },
            "select_entity" or "deselect_entity" => new[] { "card", "option", "item", "entity" },
            "purchase" => new[] { "item", "card", "relic", "potion" },
            "navigate" => new[] { "map_choice", "node" },
            "choose" => new[] { "option", "choice", "card", "reward" },
            _ => Array.Empty<string>()
        };
        foreach (string role in preferred)
        {
            int index = roles.ToList().FindIndex(item => item.Contains(role, StringComparison.Ordinal));
            if (index >= 0)
                return index;
        }
        int nonTarget = roles.ToList().FindIndex(item => item != "target");
        return nonTarget >= 0 ? nonTarget : 0;
    }

    private static string BoundActionLabel(
        string label,
        IReadOnlyList<HumanEnvironmentBoundActionArgument> arguments,
        IReadOnlyDictionary<string, HumanEnvironmentReferent> referents)
    {
        HumanEnvironmentBoundActionArgument? target = arguments.FirstOrDefault(item => item.Role == "target");
        if (target == null
            || !referents.TryGetValue(target.ReferentId, out HumanEnvironmentReferent? referent)
            || string.IsNullOrWhiteSpace(referent.Label)
            || label.Contains(referent.Label, StringComparison.Ordinal))
            return label;
        return $"{label} -> {referent.Label}";
    }

    private static IEnumerable<IReadOnlyDictionary<string, string>> ExpandParameters(
        NativeUiActionCandidate candidate,
        int limit)
    {
        var current = new List<Dictionary<string, string>>
        {
            new(candidate.Operands, StringComparer.Ordinal)
        };
        foreach ((string name, NativeUiOperandDomain domain) in candidate.OperandDomains
            .OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            current = current.SelectMany(parameters => domain.EntityIds
                .OrderBy(entityId => entityId, StringComparer.Ordinal)
                .Select(entityId =>
            {
                var expanded = new Dictionary<string, string>(parameters, StringComparer.Ordinal)
                {
                    [name] = entityId
                };
                return expanded;
            })).Take(limit).ToList();
        }
        return current;
    }

    private static string SurfaceContentSchema(string surfaceKind) =>
        $"sts2.human-environment/surface/{surfaceKind}-1";

    private static string ReferentPropertiesSchema(string role) =>
        $"sts2.human-environment/referent/{role}-1";

    internal static string ReadContentSchema(string kind) =>
        $"sts2.human-environment/read/{kind}-1";

    internal static string GenericAction(string command, string operation) => command switch
    {
        "play_card" => "play",
        "use_potion" => "use",
        "end_turn" => "end_turn",
        "select_entity" => "select",
        "deselect_entity" => "deselect",
        "confirm_interaction" => "confirm",
        "cancel_interaction" => "cancel",
        "purchase" or "choose" or "navigate" or "activate_control" =>
            operation.Contains("skip", StringComparison.Ordinal) ? "skip" :
            operation.Contains("close", StringComparison.Ordinal) || operation.Contains("leave", StringComparison.Ordinal) ? "close" :
            operation.Contains("open", StringComparison.Ordinal) ? "open" : "activate",
        _ => "activate"
    };

    private static bool IsOwnerRole(string role) =>
        role.Contains("screen", StringComparison.Ordinal)
        || role.Contains("room", StringComparison.Ordinal)
        || role is "hand" or "owner";

    private static bool IsPrivateBindingRole(string role) =>
        IsOwnerRole(role)
        || role.Contains("source", StringComparison.Ordinal)
        || role.Contains("annotation_input", StringComparison.Ordinal)
        || role is "dialogue_line";

    private static bool IsPrivateBindingParameter(string name) =>
        name is "screen_id" or "room_id" or "hand_id" or "source_id" or "control_id"
            or "menu_screen_id" or "game_over_screen_id" or "map_screen_id"
            or "map_annotation_input_id" or "dialogue_line_id"
        || name.EndsWith("_screen_id", StringComparison.Ordinal)
        || name.EndsWith("_room_id", StringComparison.Ordinal);

    private static string PublicRole(string role)
    {
        string normalized = role.EndsWith("_id", StringComparison.Ordinal)
            ? role[..^3]
            : role;
        return normalized switch
        {
            "map_node" or "destination" => "destination",
            "character_choice" => "character",
            "rest_option" or "option" or "choice" or "alternative" => "option",
            "shop_offer" => "offer",
            "shop_card_removal" => "service",
            _ => SchemaToken(normalized)
        };
    }

    private static bool IsVisibleReferentField(string key) =>
        (key == "entity_id" || key.EndsWith("_entity_id", StringComparison.Ordinal))
        && !key.Contains("screen", StringComparison.Ordinal)
        && !key.Contains("room", StringComparison.Ordinal)
        && !key.Contains("source", StringComparison.Ordinal)
        && !key.Contains("owner", StringComparison.Ordinal)
        && !key.Contains("hand", StringComparison.Ordinal);

    private static bool IsVisibleReferentArray(string key) =>
        key.EndsWith("_entity_ids", StringComparison.Ordinal)
        && !key.Contains("screen", StringComparison.Ordinal)
        && !key.Contains("source", StringComparison.Ordinal)
        && !key.Contains("owner", StringComparison.Ordinal);

    private static string ReferentRole(string key, string? parentKey)
    {
        string role = key == "entity_id"
            ? "entity"
            : key.EndsWith("_entity_ids", StringComparison.Ordinal)
            ? key[..^11]
            : key.EndsWith("_entity_id", StringComparison.Ordinal)
                ? key[..^10]
                : key;
        if (role is "selectable_card" or "deselectable_card" or "selected_card")
            return "card";
        if (role is "target" or "targetable_enemy")
            return "target";
        if (role is "entity" && !string.IsNullOrWhiteSpace(parentKey))
            role = SingularRole(parentKey);
        return PublicRole(role);
    }

    private static string SingularRole(string value) => value switch
    {
        "enemies" => "enemy",
        "characters" => "character",
        "cards" => "card",
        "options" or "choices" or "next_options" => "option",
        "nodes" => "node",
        "rewards" => "reward",
        "offers" => "offer",
        "potions" => "potion",
        "relics" => "relic",
        _ => value.EndsWith('s') ? value[..^1] : value
    };

    private static string SchemaToken(string value)
    {
        char[] token = value
            .ToLowerInvariant()
            .Select(character => char.IsLetterOrDigit(character) || character == '_'
                ? character
                : '_')
            .ToArray();
        string normalized = new string(token).Trim('_');
        return string.IsNullOrWhiteSpace(normalized) ? "entity" : normalized;
    }

    private static bool? ReadOptionalBool(JsonObject obj, params string[] keys)
    {
        foreach (string key in keys)
        {
            if (obj[key]?.GetValueKind() == JsonValueKind.True)
                return true;
            if (obj[key]?.GetValueKind() == JsonValueKind.False)
                return false;
        }
        return null;
    }

    private static string? ReadFirstString(JsonNode node, params string[] keys)
    {
        if (node is not JsonObject obj)
            return null;
        foreach (string key in keys)
        {
            if (obj[key]?.GetValueKind() == JsonValueKind.String)
                return obj[key]!.GetValue<string>();
        }
        return null;
    }

    private static bool IsSelected(JsonNode rawSurface, string entityId)
    {
        if (rawSurface is not JsonObject obj
            || obj["selected_card_entity_ids"] is not JsonArray selected)
            return false;
        return selected.Any(value => value?.GetValueKind() == JsonValueKind.String
            && string.Equals(value.GetValue<string>(), entityId, StringComparison.Ordinal));
    }

    internal static HumanEnvironmentInteractionContent ProjectHumanFacts(
        ILiveSurface surface,
        ILiveContext context)
    {
        JsonNode visibleSurface = surface switch
        {
            DeckEnchantSelectionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Stage, value.ScreenEntityId, value.Prompt,
                value.MinSelect, value.MaxSelect, value.SelectedCount,
                value.SelectedCardEntityIds, value.SelectableCardEntityIds,
                value.DeselectableCardEntityIds, value.Cancelable,
                value.Enchantment, value.Cards, value.CanPreview,
                value.CanCloseSelection, value.CanConfirm, value.CanCancelPreview
            }, McpMod._jsonOptions)!,
            DeckTransformSelectionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Stage, value.ScreenEntityId, value.Prompt,
                value.MinSelect, value.MaxSelect, value.SelectedCount,
                value.SelectedCardEntityIds, value.SelectableCardEntityIds,
                value.DeselectableCardEntityIds, value.Cancelable,
                value.UpgradeToggleVisible, value.ShowingUpgradePreviews,
                value.PreviewKind, value.ReplacementKnown, value.Cards,
                value.CanPreview, value.CanCancelSelection,
                value.CanCancelPreview, value.CanConfirm, value.CanToggleUpgradeView
            }, McpMod._jsonOptions)!,
            CombatPileCardSelectionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.ScreenEntityId, value.Prompt, value.PileType,
                value.MinSelect, value.MaxSelect, value.SelectedCount,
                value.SelectedCardEntityIds, value.SelectableCardEntityIds,
                value.DeselectableCardEntityIds, value.RequireManualConfirmation,
                value.Cancelable, value.CanConfirm, value.Cards
            }, McpMod._jsonOptions)!,
            EventCardAcquisitionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.ScreenEntityId, value.Prompt, value.MinSelect,
                value.MaxSelect, value.SelectedCount, value.SelectedCardEntityIds,
                value.SelectableCardEntityIds, value.DeselectableCardEntityIds,
                value.RequireManualConfirmation, value.Cards
            }, McpMod._jsonOptions)!,
            EventDeckRemovalSelectionSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Stage, value.ScreenEntityId, value.Prompt,
                value.MinSelect, value.MaxSelect, value.SelectedCount,
                value.SelectedCardEntityIds, value.SelectableCardEntityIds,
                value.DeselectableCardEntityIds, value.CanCancelPreview,
                value.CanConfirm, value.Cards
            }, McpMod._jsonOptions)!,
            GeneratedCardChoiceSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.ScreenEntityId, value.Prompt, value.CanSkip,
                value.IsPeeking, value.Cards, value.SelectableCardEntityIds,
                value.SkipAvailable
            }, McpMod._jsonOptions)!,
            UnsupportedSurface value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Reason
            }, McpMod._jsonOptions)!,
            HumanDeckCardSelectionSurface or HumanCombatPileSelectionSurface
                or EventOptionSurface or EventDialogueSurface or RestSiteSurface
                or ShopInventorySurface or ShopRoomSurface or TreasureRoomSurface
                or GameOverSurface or CharacterSelectSurface or MainMenuSurface
                or SingleplayerMenuSurface or DeckRemovalSelectionSurface
                or DeckUpgradeSelectionSurface or WoodCarvingsReplacementSelectionSurface
                or CombatTurnSurface or CombatHandCardSelectionSurface
                or CardRewardSelectionSurface or CardBundleSelectionSurface
                or RewardClaimSurface or MapNavigationSurface or NoActionSurface =>
                SerializeKnownUiValue(surface),
            _ => new JsonObject
            {
                ["kind"] = surface.Kind,
                ["projection_status"] = "visible_surface_shape_not_projected"
            }
        };
        JsonNode visibleContext = context switch
        {
            UnknownLiveContext value => JsonSerializer.SerializeToNode(new
            {
                value.Kind, value.Reason
            }, McpMod._jsonOptions)!,
            EventLiveContext or CombatLiveContext or RewardFlowLiveContext
                or RestLiveContext or TreasureLiveContext or GameOverLiveContext
                or MenuLiveContext or ShopLiveContext or MapLiveContext
                or CombatTransitionLiveContext or RunTransitionLiveContext =>
                SerializeKnownUiValue(context),
            _ => new JsonObject { ["kind"] = context.Kind }
        };
        return new HumanEnvironmentInteractionContent(visibleSurface, visibleContext);
    }

    private static JsonNode SerializeKnownUiValue(object value) =>
        JsonSerializer.SerializeToNode(value, value.GetType(), McpMod._jsonOptions)
        ?? new JsonObject();
}
