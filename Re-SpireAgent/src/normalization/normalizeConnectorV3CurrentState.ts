import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type BridgeLegalActionSnapshot,
  type BridgeRewardClaimSurface,
  type CardRewardSelectionSurface,
  type CharacterSelectSurface,
  type EventOptionSurface,
  type GameOverSurface,
  type MainMenuSurface,
  type MapNavigationSurface,
  type NormalizedCurrentState,
  type SemanticContext,
  type SingleplayerMenuSurface,
  type StateEnvelope
} from "../domain/state/index.js";
import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  gatewayEventContextSchema,
  gatewayEventOptionSurfaceSchema,
  gatewayGameOverContextSchema,
  gatewayGameOverSurfaceSchema,
  gatewayMapContextSchema,
  gatewayMapNavigationSurfaceSchema,
  type GatewayEventContext,
  type GatewayGameOverContext,
  type GatewayJourneySurface,
  type GatewayMapContext
} from "../integrations/sts2mcp/gatewayJourneyProtocol.js";
import {
  gatewayMenuContextSchema,
  gatewayMenuSurfaceSchema,
  type GatewayMenuContext,
  type GatewayMenuSurface
} from "../integrations/sts2mcp/gatewayMenuProtocol.js";
import {
  gatewayCardRewardSelectionSurfaceSchema,
  gatewayRewardClaimSurfaceSchema,
  gatewayRewardFlowContextSchema,
  type GatewayRewardFlowContext,
  type GatewayRewardSurface
} from "../integrations/sts2mcp/gatewayRewardProtocol.js";
import {
  decodeConnectorV3Observation,
  type ConnectorV3Observation
} from "../integrations/sts2mcp/connectorV3Protocol.js";
import {
  expandConnectorV3Commands,
  usesDirectConnectorV3Consumer,
  type ConnectorV3ConsumerCommand
} from "../integrations/sts2mcp/connectorV3Projection.js";
import {
  sharedVisibleStateSchema,
  type GatewaySharedVisibleState
} from "../integrations/sts2mcp/gatewayVisibleStateProtocol.js";
import type { Sts2McpRawState } from "../integrations/sts2mcp/rawState.js";
import { stateHash } from "../runtime/stateHash.js";
import { isJsonObject } from "../shared/json.js";
import { DiagnosticsBuilder } from "./diagnostics.js";
import {
  projectGatewayVisibleCard,
  projectGatewayVisibleState
} from "./gatewayVisibleStateProjection.js";

type DirectSurface = GatewayMenuSurface | GatewayJourneySurface | GatewayRewardSurface;
type DirectContext = GatewayMenuContext | GatewayEventContext | GatewayMapContext
  | GatewayGameOverContext | GatewayRewardFlowContext;

export function isDirectConnectorV3ConsumerState(rawState: Sts2McpRawState): boolean {
  const observation = rawState.connector_v3_observation;
  return isJsonObject(observation)
    && isJsonObject(observation.context)
    && isJsonObject(observation.surface)
    && isDirectPair(String(observation.context.kind), String(observation.surface.kind));
}

export function normalizeConnectorV3CurrentState(
  rawState: Sts2McpRawState,
  source: AdapterDescriptor,
  capturedAt: string
): StateEnvelope {
  const diagnostics = new DiagnosticsBuilder();
  const rawObservation = rawState.connector_v3_observation;
  let observation: ConnectorV3Observation | undefined;
  let context: DirectContext | undefined;
  let surface: DirectSurface | undefined;
  let shared: GatewaySharedVisibleState | undefined;
  let commands: ConnectorV3ConsumerCommand[] = [];

  try {
    observation = decodeConnectorV3Observation(rawObservation).data;
  } catch (error) {
    diagnostics.invalid("connector_v3_observation", rawObservation, safeMessage(error));
  }
  if (observation) {
    if (!usesDirectConnectorV3Consumer(observation)) {
      diagnostics.invalid(
        "connector_v3_observation.surface",
        observation.surface,
        "surface is not assigned to the direct Connector V3 consumer"
      );
    } else {
      context = parseContext(observation, diagnostics);
      surface = parseSurface(observation, diagnostics);
      shared = parseSharedState(observation, diagnostics);
      try {
        commands = expandConnectorV3Commands(observation);
      } catch (error) {
        diagnostics.invalid(
          "connector_v3_observation.interaction.command_candidates",
          observation.interaction.command_candidates,
          safeMessage(error)
        );
      }
    }
  }
  if (observation && context && surface) {
    if (!contextMatchesSurface(context, surface)) {
      diagnostics.invalid(
        "connector_v3_observation.context",
        observation.context,
        "semantic context does not match the current direct V3 surface"
      );
    }
    for (const error of validateCommands(surface, commands)) {
      diagnostics.invalid(
        "connector_v3_observation.interaction.command_candidates",
        observation.interaction.command_candidates,
        error
      );
    }
  }
  if (observation && observation.interaction.phase !== "ready" && commands.length > 0) {
    diagnostics.invalid(
      "connector_v3_observation.interaction.command_candidates",
      observation.interaction.command_candidates,
      "non-ready interaction must not publish executable commands"
    );
  }

  const builtDiagnostics = diagnostics.build();
  const legalActions = observation && builtDiagnostics.status !== "invalid"
    ? projectCommands(commands)
    : [];
  const actionable = observation?.interaction.phase === "ready"
    && observation.interaction.execution_support !== "unsupported"
    && legalActions.length > 0
    && builtDiagnostics.status !== "invalid";
  const projectedPersistent = shared ? projectGatewayVisibleState(shared) : undefined;
  const normalizedContext: NormalizedCurrentState["context"] = context
    ? projectContext(context, surface)
    : invalidContext(rawState);
  const normalizedSurface: NormalizedCurrentState["surface"] = observation && surface
    && builtDiagnostics.status !== "invalid"
    ? projectSurface(surface, observation, legalActions)
    : {
        kind: "unsupported",
        reason: "Connector V3 direct semantic contract validation failed",
        classification: "malformed_known_state",
        observedTopLevelKeys: Object.keys(rawState).sort()
      };
  const currentState: NormalizedCurrentState = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType: observation
      ? `connector_v3:${observation.context.kind}:${observation.surface.kind}:direct`
      : "connector_v3:invalid:direct",
    ...(projectedPersistent?.run ? { run: projectedPersistent.run } : {}),
    ...(projectedPersistent?.player ? { player: projectedPersistent.player } : {}),
    ...(shared ? {
      bridgeSharedStateEvidence: {
        scope: shared.scope,
        playerVisibleSemantics: shared.completeness.player_visible_semantics,
        sources: [...shared.completeness.sources],
        missing: [...shared.completeness.missing]
      }
    } : {}),
    stability: builtDiagnostics.status === "invalid"
      ? "invalid"
      : actionable
        ? "actionable"
        : observation?.interaction.phase === "settling"
          ? "settling"
          : "non_actionable",
    actionAuthority: actionable ? "bridge_advertised" : "none",
    bridgeLegacyWarnings: observation
      ? [
          ...observation.warnings,
          "Connector V3 facts and commands were consumed directly without a V2 state or capabilities projection."
        ]
      : [],
    ...(observation ? {
      bridgeVisibility: {
        profileId: observation.visibility.profile_id,
        coreStatus: observation.visibility.core_status,
        playerVisibleClosureStatus: observation.visibility.player_visible_closure_status,
        availableInspections: [...observation.visibility.available_inspections],
        linkedDetailKinds: [...observation.visibility.linked_detail_kinds],
        hiddenByPolicy: [...observation.visibility.hidden_by_policy],
        missing: [...observation.visibility.missing],
        unknownCriticalFieldBehavior: observation.visibility.unknown_critical_field_behavior
      },
      bridgeInspectionCatalog: observation.inspection_catalog.map((entry) => ({
        kind: entry.kind,
        scope: entry.scope,
        availability: entry.availability,
        visibilityBasis: entry.visibility_basis,
        stateBound: entry.state_bound,
        createsActionAuthority: entry.creates_action_authority,
        orderingSemantics: entry.ordering_semantics,
        estimatedCost: entry.estimated_cost,
        recommendedFor: [...entry.recommended_for],
        hiddenByPolicy: [...entry.hidden_by_policy]
      }))
    } : {}),
    context: normalizedContext,
    surface: normalizedSurface
  };

  return {
    envelopeSchemaVersion: 2,
    capturedAt,
    source,
    rawState,
    currentState,
    diagnostics: builtDiagnostics,
    stateHash: stateHash({
      stateToken: observation?.state_token ?? null,
      interactionId: observation?.interaction.id ?? null,
      commands: legalActions.map((action) => ({
        actionId: action.actionId,
        kind: action.kind,
        entityBindings: action.entityBindings
      }))
    }),
    normalizedStateHash: stateHash(currentState)
  };
}

function parseContext(
  observation: ConnectorV3Observation,
  diagnostics: DiagnosticsBuilder
): DirectContext | undefined {
  const schema = observation.context.kind === "menu"
    ? gatewayMenuContextSchema
    : observation.context.kind === "event"
      ? gatewayEventContextSchema
      : observation.context.kind === "map"
        ? gatewayMapContextSchema
        : observation.context.kind === "reward_flow"
          ? gatewayRewardFlowContextSchema
        : observation.context.kind === "game_over"
          ? gatewayGameOverContextSchema
          : undefined;
  if (!schema) return undefined;
  const parsed = schema.safeParse(observation.context);
  if (parsed.success) return parsed.data;
  diagnostics.invalid(
    "connector_v3_observation.context",
    observation.context,
    parsed.error.issues.map((issue) => issue.message).join("; ")
  );
  return undefined;
}

function parseSurface(
  observation: ConnectorV3Observation,
  diagnostics: DiagnosticsBuilder
): DirectSurface | undefined {
  const schema = ["main_menu", "singleplayer_menu", "character_select"]
    .includes(observation.surface.kind)
    ? gatewayMenuSurfaceSchema
    : observation.surface.kind === "event_option"
      ? gatewayEventOptionSurfaceSchema
      : observation.surface.kind === "map_navigation"
        ? gatewayMapNavigationSurfaceSchema
        : observation.surface.kind === "reward_claim"
          ? gatewayRewardClaimSurfaceSchema
          : observation.surface.kind === "card_reward_selection"
            ? gatewayCardRewardSelectionSurfaceSchema
        : observation.surface.kind === "game_over"
          ? gatewayGameOverSurfaceSchema
          : undefined;
  if (!schema) return undefined;
  const parsed = schema.safeParse(observation.surface);
  if (parsed.success) return parsed.data;
  diagnostics.invalid(
    "connector_v3_observation.surface",
    observation.surface,
    parsed.error.issues.map((issue) => issue.message).join("; ")
  );
  return undefined;
}

function parseSharedState(
  observation: ConnectorV3Observation,
  diagnostics: DiagnosticsBuilder
): GatewaySharedVisibleState | undefined {
  if (observation.context.kind === "menu") return undefined;
  const parsed = sharedVisibleStateSchema.safeParse(observation.shared_state);
  if (parsed.success) return parsed.data;
  diagnostics.invalid(
    "connector_v3_observation.shared_state",
    observation.shared_state,
    parsed.error.issues.map((issue) => issue.message).join("; ")
  );
  return undefined;
}

function contextMatchesSurface(context: DirectContext, surface: DirectSurface): boolean {
  if (context.kind === "menu") {
    return surface.kind === "main_menu"
      ? context.flow === "root_navigation"
      : (surface.kind === "singleplayer_menu" || surface.kind === "character_select")
        && context.flow === "standard_run_setup";
  }
  if (context.kind === "reward_flow") {
    return (context.reward_kind === "room_rewards" && surface.kind === "reward_claim")
      || (context.reward_kind === "card_reward" && surface.kind === "card_reward_selection");
  }
  return (context.kind === "event" && surface.kind === "event_option")
    || (context.kind === "map" && surface.kind === "map_navigation")
    || (context.kind === "game_over" && surface.kind === "game_over");
}

function validateCommands(
  surface: DirectSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  return commands.flatMap((command) => {
    if (surface.kind === "event_option") return validateEventCommand(surface, command);
    if (surface.kind === "map_navigation") return validateMapCommand(surface, command);
    if (surface.kind === "reward_claim") return validateRewardCommand(surface, command);
    if (surface.kind === "card_reward_selection") {
      return validateCardRewardCommand(surface, command);
    }
    if (surface.kind === "game_over") return validateGameOverCommand(surface, command);
    return validateMenuCommand(surface, command);
  });
}

function validateRewardCommand(
  surface: Extract<GatewayRewardSurface, { kind: "reward_claim" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "reward command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "reward command is missing its exact screen binding"
  ];
  if (command.operation === "claim_reward") {
    const reward = surface.rewards.find(
      (value) => value.entity_id === command.operands.choice_id
    );
    return collectErrors([
      ...base,
      command.command === "choose" || "reward claim must use choose",
      Boolean(reward?.enabled) || "reward claim must bind one current enabled reward",
      Boolean(reward && hasBinding(command, "reward", reward.entity_id))
        || "reward claim is missing its exact reward binding"
    ]);
  }
  if (command.operation === "discard_potion_for_reward") {
    const potion = surface.discardable_potions.find(
      (value) => value.entity_id === command.operands.potion_id
    );
    return collectErrors([
      ...base,
      command.command === "activate_control" || "reward potion discard must activate a control",
      command.operands.control_id === "discard_potion_for_reward"
        || "reward potion discard control is not exact",
      Boolean(potion) || "reward potion discard must bind one current discardable potion",
      Boolean(potion && hasBinding(command, "potion", potion.entity_id))
        || "reward potion discard is missing its exact potion binding"
    ]);
  }
  if (command.operation === "proceed_rewards") {
    return collectErrors([
      ...base,
      command.command === "activate_control" || "reward proceed must activate a control",
      command.operands.control_id === "proceed_rewards"
        || "reward proceed control is not exact",
      surface.can_proceed || "reward proceed was published while the control is unavailable"
    ]);
  }
  return [`unsupported direct reward operation ${command.operation}`];
}

function validateCardRewardCommand(
  surface: Extract<GatewayRewardSurface, { kind: "card_reward_selection" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "card reward command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "card reward command is missing its exact screen binding"
  ];
  if (command.operation === "select_card_reward") {
    const card = surface.cards.find((value) => value.entity_id === command.operands.card_id);
    const selectable = card && (surface.selectable_card_entity_ids === undefined
      || surface.selectable_card_entity_ids.includes(card.entity_id));
    return collectErrors([
      ...base,
      command.command === "select_entity" || "card reward selection must use select_entity",
      Boolean(selectable) || "card reward selection must bind one current selectable card",
      Boolean(card && hasBinding(command, "card", card.entity_id))
        || "card reward selection is missing its exact card binding"
    ]);
  }
  if (command.operation === "choose_card_reward_alternative") {
    const alternative = surface.alternatives.find(
      (value) => value.entity_id === command.operands.choice_id
    );
    return collectErrors([
      ...base,
      command.command === "choose" || "card reward alternative must use choose",
      Boolean(alternative?.enabled)
        || "card reward alternative must bind one current enabled alternative",
      Boolean(alternative && hasBinding(command, "alternative", alternative.entity_id))
        || "card reward alternative is missing its exact alternative binding"
    ]);
  }
  return [`unsupported direct card reward operation ${command.operation}`];
}

function validateEventCommand(
  surface: Extract<GatewayJourneySurface, { kind: "event_option" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const option = surface.options.find((value) => value.entity_id === command.operands.choice_id);
  const expectedOperation = option?.is_proceed ? "proceed_event" : "choose_event_option";
  return collectErrors([
    command.command === (option?.is_proceed ? "activate_control" : "choose")
      || "event command kind does not match the exact option semantics",
    command.operands.screen_id === surface.screen_entity_id
      || "event command must bind the current screen",
    Boolean(option?.is_enabled && !option.is_locked)
      || "event command must bind one current enabled option",
    command.operation === expectedOperation
      || "event command operation does not match the exact option semantics",
    (!option?.is_proceed || command.operands.control_id === "proceed_event")
      || "event proceed command must bind the exact proceed control",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "event command is missing its exact screen binding",
    Boolean(option && hasBinding(command, "option", option.entity_id))
      || "event command is missing its exact option binding"
  ]);
}

function validateMapCommand(
  surface: Extract<GatewayJourneySurface, { kind: "map_navigation" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.map_screen_id === surface.screen_entity_id
      || "map command must bind the current screen",
    hasBinding(command, "map_screen", surface.screen_entity_id)
      || "map command is missing its exact screen binding"
  ];
  if (command.operation === "choose_map_node") {
    const node = surface.next_options.find(
      (value) => value.entity_id === command.operands.map_node_id
    );
    return collectErrors([
      ...base,
      command.command === "navigate" || "map node choice must use navigate",
      surface.travel_enabled && !surface.traveling
        || "map node choice was published while travel is unavailable",
      Boolean(node) || "map command must bind one current travelable node",
      Boolean(node && hasBinding(command, "map_node", node.entity_id))
        || "map command is missing its exact node binding"
    ]);
  }
  if (command.operation === "exit_map_annotation") {
    const inputId = command.operands.map_annotation_input_id;
    return collectErrors([
      ...base,
      command.command === "activate_control" || "map annotation exit must activate a control",
      command.operands.control_id === "exit_map_annotation"
        || "map annotation exit control is not exact",
      surface.drawing_mode !== "none" || "map annotation exit requires active drawing mode",
      Boolean(inputId && hasBinding(command, "map_annotation_input", inputId))
        || "map annotation exit is missing its exact input binding"
    ]);
  }
  return [`unsupported direct map operation ${command.operation}`];
}

function validateGameOverCommand(
  surface: Extract<GatewayJourneySurface, { kind: "game_over" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const expected = command.operation === "advance_game_over_summary"
    ? surface.can_advance_summary && surface.stage === "intro"
    : command.operation === "return_game_over"
      ? surface.can_return && surface.stage === "summary"
      : false;
  return collectErrors([
    command.command === "activate_control" || "game-over command must activate a control",
    command.operands.game_over_screen_id === surface.screen_entity_id
      || "game-over command must bind the current screen",
    command.operands.control_id === command.operation
      || "game-over command must bind its exact semantic control",
    expected || "game-over command does not match the current stage",
    hasBinding(command, "game_over_screen", surface.screen_entity_id)
      || "game-over command is missing its exact screen binding"
  ]);
}

function validateMenuCommand(
  surface: GatewayMenuSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const screenOperand = command.operands.menu_screen_id
    ?? command.operands.singleplayer_screen_id
    ?? command.operands.character_select_screen_id
    ?? command.operands.screen_id;
  const screenBinding = command.entityBindings.some(
    (binding) => binding.entityId === surface.screen_entity_id
      && binding.role.endsWith("screen")
  );
  return collectErrors([
    screenOperand === surface.screen_entity_id
      || "menu command must bind the current screen",
    screenBinding || "menu command is missing its exact screen binding"
  ]);
}

function hasBinding(
  command: ConnectorV3ConsumerCommand,
  role: string,
  entityId: string
): boolean {
  return command.entityBindings.some(
    (binding) => binding.role === role && binding.entityId === entityId
  );
}

function collectErrors(results: Array<true | string>): string[] {
  return results.flatMap((result) => result === true ? [] : [result]);
}

function projectCommands(commands: ConnectorV3ConsumerCommand[]): BridgeLegalActionSnapshot[] {
  return commands.map((command) => ({
    actionId: command.choiceId,
    stateId: command.expectedStateToken,
    kind: command.operation,
    label: command.label,
    authority: command.authorityState,
    evidenceCode: command.bindingKind,
    entityBindings: command.entityBindings,
    category: "connector_v3"
  }));
}

function projectContext(context: DirectContext, surface?: DirectSurface): SemanticContext {
  if (context.kind === "menu") {
    return {
      kind: "menu",
      screen: surface?.kind,
      message: surface?.kind === "main_menu"
        ? "Navigate the visible root menu."
        : "Choose a standard run setup action."
    };
  }
  if (context.kind === "event") {
    return {
      kind: "event",
      eventId: context.event_id,
      ...(context.name ? { name: context.name } : {}),
      ancient: context.ancient,
      inDialogue: context.in_dialogue,
      ...(context.body !== undefined ? { body: context.body } : {})
    };
  }
  if (context.kind === "map") return projectMapContext(context);
  if (context.kind === "reward_flow") {
    return { kind: "reward_flow", rewardKind: context.reward_kind };
  }
  return {
    kind: "run_ended",
    result: context.result,
    gameMode: context.game_mode,
    ...(context.score != null ? { score: context.score } : {}),
    ...(context.floor_reached != null ? { floorReached: context.floor_reached } : {}),
    ...(context.ascension != null ? { ascension: context.ascension } : {})
  };
}

function projectMapContext(context: GatewayMapContext): SemanticContext {
  const coordinate = (value: GatewayMapContext["visited"][number]) => ({
    col: value.col,
    row: value.row,
    type: value.point_type ?? "unknown",
    leadsTo: [],
    children: []
  });
  return {
    kind: "map",
    ...(context.current_position ? {
      currentPosition: {
        col: context.current_position.col,
        row: context.current_position.row,
        ...(context.current_position.point_type
          ? { type: context.current_position.point_type }
          : {})
      }
    } : {}),
    visited: context.visited.map(coordinate),
    nodes: context.nodes.map((node) => ({
      entityId: node.entity_id,
      col: node.col,
      row: node.row,
      type: node.point_type,
      state: node.state,
      leadsTo: node.children.map((child) => ({
        col: child.col,
        row: child.row,
        ...(child.point_type ? { type: child.point_type } : {})
      })),
      children: node.children.map((child) => ({ col: child.col, row: child.row }))
    }))
  };
}

function projectSurface(
  surface: DirectSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): NormalizedCurrentState["surface"] {
  if (surface.kind === "event_option") {
    return projectEventSurface(surface, observation, legalActions);
  }
  if (surface.kind === "map_navigation") {
    return projectMapSurface(surface, observation, legalActions);
  }
  if (surface.kind === "reward_claim") {
    return projectRewardSurface(surface, observation, legalActions);
  }
  if (surface.kind === "card_reward_selection") {
    return projectCardRewardSurface(surface, observation, legalActions);
  }
  if (surface.kind === "game_over") {
    return projectGameOverSurface(surface, observation, legalActions);
  }
  return projectMenuSurface(surface, observation, legalActions);
}

function projectRewardSurface(
  surface: Extract<GatewayRewardSurface, { kind: "reward_claim" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): BridgeRewardClaimSurface {
  return {
    kind: "reward_claim",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    rewards: surface.rewards.map((reward) => ({
      entityId: reward.entity_id,
      kind: reward.kind,
      label: reward.label,
      ...(reward.description ? { description: reward.description } : {}),
      enabled: reward.enabled
    })),
    potionSlotsFull: surface.potion_slots_full,
    discardablePotions: surface.discardable_potions.map((potion) => ({
      entityId: potion.entity_id,
      id: potion.definition_id,
      ...(potion.name ? { name: potion.name } : {}),
      ...(potion.description ? { description: potion.description } : {}),
      slot: potion.slot
    })),
    canProceed: surface.can_proceed,
    proceedSkipsRemainingRewards: surface.proceed_skips_remaining_rewards,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectCardRewardSurface(
  surface: Extract<GatewayRewardSurface, { kind: "card_reward_selection" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): CardRewardSelectionSurface {
  return {
    kind: "card_reward_selection",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    cards: surface.cards.map(projectGatewayVisibleCard),
    alternatives: surface.alternatives.map((alternative) => ({
      entityId: alternative.entity_id,
      index: alternative.index,
      label: alternative.label,
      enabled: alternative.enabled
    })),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectEventSurface(
  surface: Extract<GatewayJourneySurface, { kind: "event_option" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): EventOptionSurface {
  return {
    kind: "event_option",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    options: surface.options.map((option) => ({
      entityId: option.entity_id,
      index: option.index,
      title: option.title ?? option.description ?? `Event option ${option.index}`,
      ...(option.description ? { description: option.description } : {}),
      enabled: option.is_enabled && !option.is_locked,
      proceed: option.is_proceed,
      chosen: option.was_chosen,
      willKillPlayer: option.will_kill_player,
      tooltips: option.tooltips.map((tooltip) => tooltip.kind === "card"
        ? { kind: "card" as const, card: projectGatewayVisibleCard(tooltip.card) }
        : {
            kind: "text" as const,
            ...(tooltip.name ? { name: tooltip.name } : {}),
            ...(tooltip.description ? { description: tooltip.description } : {})
          }),
      ...(option.relic_name ? { relicName: option.relic_name } : {}),
      ...(option.relic_description ? { relicDescription: option.relic_description } : {})
    })),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectMapSurface(
  surface: Extract<GatewayJourneySurface, { kind: "map_navigation" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): MapNavigationSurface {
  const context = gatewayMapContextSchema.parse(observation.context);
  return {
    kind: "map_navigation",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    travelEnabled: surface.travel_enabled,
    traveling: surface.traveling,
    drawingMode: surface.drawing_mode,
    nextOptions: surface.next_options.map((option) => {
      const node = context.nodes.find((value) => value.entity_id === option.entity_id);
      return {
        entityId: option.entity_id,
        col: option.col,
        row: option.row,
        type: option.point_type,
        state: "travelable",
        leadsTo: (node?.children ?? []).map((child) => ({
          col: child.col,
          row: child.row,
          ...(child.point_type ? { type: child.point_type } : {})
        })),
        children: (node?.children ?? []).map((child) => ({ col: child.col, row: child.row }))
      };
    }),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectGameOverSurface(
  surface: Extract<GatewayJourneySurface, { kind: "game_over" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): GameOverSurface {
  return {
    kind: "game_over",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    ...(surface.return_destination ? { returnDestination: surface.return_destination } : {}),
    canAdvanceSummary: surface.can_advance_summary,
    canReturn: surface.can_return,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectMenuSurface(
  surface: GatewayMenuSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): MainMenuSurface | SingleplayerMenuSurface | CharacterSelectSurface {
  const completeness = projectCompleteness(observation);
  if (surface.kind === "main_menu") {
    return {
      kind: "main_menu",
      stage: surface.stage,
      bridgeStateId: observation.state_token,
      screenEntityId: surface.screen_entity_id,
      choices: projectMenuChoices(surface.options),
      ...(surface.continue_run ? {
        continueRun: {
          characterId: surface.continue_run.character_id,
          ...(surface.continue_run.character_name
            ? { characterName: surface.continue_run.character_name }
            : {}),
          actId: surface.continue_run.act_id,
          ...(surface.continue_run.act_name ? { actName: surface.continue_run.act_name } : {}),
          floor: surface.continue_run.floor,
          hp: surface.continue_run.hp,
          maxHp: surface.continue_run.max_hp,
          gold: surface.continue_run.gold,
          ascension: surface.continue_run.ascension
        }
      } : {}),
      legalActions,
      completeness
    };
  }
  if (surface.kind === "singleplayer_menu") {
    return {
      kind: "singleplayer_menu",
      stage: surface.stage,
      bridgeStateId: observation.state_token,
      screenEntityId: surface.screen_entity_id,
      choices: projectMenuChoices(surface.options),
      legalActions,
      completeness
    };
  }
  return {
    kind: "character_select",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    characters: surface.characters.map((character) => ({
      entityId: character.entity_id,
      index: character.index,
      characterId: character.character_id,
      name: character.name,
      locked: character.is_locked,
      selected: character.is_selected,
      random: character.is_random
    })),
    ...(surface.selected_details ? {
      selectedDetails: {
        characterId: surface.selected_details.character_id,
        title: surface.selected_details.title,
        ...(surface.selected_details.description
          ? { description: surface.selected_details.description }
          : {}),
        ...(surface.selected_details.starting_hp != null
          ? { startingHp: surface.selected_details.starting_hp }
          : {}),
        ...(surface.selected_details.starting_gold != null
          ? { startingGold: surface.selected_details.starting_gold }
          : {}),
        ...(surface.selected_details.starting_relic ? {
          startingRelic: {
            id: surface.selected_details.starting_relic.definition_id,
            ...(surface.selected_details.starting_relic.name
              ? { name: surface.selected_details.starting_relic.name }
              : {}),
            ...(surface.selected_details.starting_relic.description
              ? { description: surface.selected_details.starting_relic.description }
              : {})
          }
        } : {})
      }
    } : {}),
    ...(surface.ascension != null ? { ascension: surface.ascension } : {}),
    ...(surface.ascension_title ? { ascensionTitle: surface.ascension_title } : {}),
    ...(surface.ascension_description
      ? { ascensionDescription: surface.ascension_description }
      : {}),
    canDecreaseAscension: surface.can_decrease_ascension,
    canIncreaseAscension: surface.can_increase_ascension,
    canEmbark: surface.can_embark,
    canGoBack: surface.can_go_back,
    legalActions,
    completeness
  };
}

function projectMenuChoices(
  choices: Extract<GatewayMenuSurface, { kind: "main_menu" | "singleplayer_menu" }>["options"]
): MainMenuSurface["choices"] {
  return choices.map((choice) => ({
    entityId: choice.entity_id,
    semanticId: choice.semantic_id,
    label: choice.label,
    ...(choice.description ? { description: choice.description } : {}),
    enabled: choice.enabled,
    bridgeSupport: choice.bridge_support,
    ...(choice.blocked_reason ? { blockedReason: choice.blocked_reason } : {})
  }));
}

function projectCompleteness(observation: ConnectorV3Observation) {
  return {
    playerVisibleSemantics: observation.completeness.player_visible_semantics,
    legalActions: observation.completeness.legal_actions,
    sources: [...observation.completeness.sources],
    missing: [...observation.completeness.missing]
  };
}

function invalidContext(rawState: Sts2McpRawState): NormalizedCurrentState["context"] {
  return {
    kind: "unknown",
    reason: "Connector V3 direct context could not be decoded",
    observedTopLevelKeys: Object.keys(rawState).sort()
  };
}

function isDirectPair(contextKind: string, surfaceKind: string): boolean {
  return (contextKind === "menu"
      && ["main_menu", "singleplayer_menu", "character_select"].includes(surfaceKind))
    || (contextKind === "event" && surfaceKind === "event_option")
    || (contextKind === "map" && surfaceKind === "map_navigation")
    || (contextKind === "reward_flow"
      && ["reward_claim", "card_reward_selection"].includes(surfaceKind))
    || (contextKind === "game_over" && surfaceKind === "game_over");
}

function safeMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
}
