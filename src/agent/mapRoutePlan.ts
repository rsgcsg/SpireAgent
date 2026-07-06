import type { CandidateAction, MapRouteNodeSummary, MapRoutePlan, NormalizedState, RunMemory, ScoredCandidate } from "./types.js";
import { asNumber, asString, isRecord, nowIso, stableId } from "./utils.js";

const ROUTE_PLAN_SCHEMA_VERSION = 1;
const MAX_ROUTE_LINE = 7;

export function enrichMapCandidatesWithRoutePlan(state: NormalizedState, candidates: CandidateAction[]): CandidateAction[] {
  if (state.screen !== "map") return candidates;
  return candidates.map((candidate) => {
    if (candidate.action.kind !== "choose_map_node") return candidate;
    const line = deriveRouteLine(state, candidate);
    return {
      ...candidate,
      facts: {
        ...(candidate.facts ?? {}),
        routeLine: line,
        routeCheckpointPreview: routeCheckpointPreview(line),
        routePlanSummary: summarizeRouteLine(line)
      }
    };
  });
}

export function buildMapRoutePlanFromChoice(input: {
  state: NormalizedState;
  candidate: ScoredCandidate;
  run: RunMemory;
}): MapRoutePlan | undefined {
  if (input.state.screen !== "map" || input.candidate.action.kind !== "choose_map_node") return undefined;
  const line = deriveRouteLine(input.state, input.candidate);
  const now = nowIso();
  const nextNode = line[1] ?? line[0];
  return {
    schemaVersion: ROUTE_PLAN_SCHEMA_VERSION,
    id: stableId("map-plan"),
    status: "active",
    createdAt: now,
    updatedAt: now,
    act: input.state.act,
    originFloor: input.state.floor,
    originNode: currentMapNode(input.state),
    nextNode,
    routeLine: line,
    checkpoints: routeCheckpointPreview(line),
    replanTriggers: mapReplanTriggers(input.run),
    rationale: [
      ...input.candidate.reasons,
      ...input.candidate.risks.map((risk) => `risk: ${risk}`),
      `route pressure: ${mapPressureSummary(input.state, input.run)}`
    ].slice(0, 8)
  };
}

export function planFitForCandidate(
  plan: MapRoutePlan | undefined,
  state: NormalizedState,
  candidate: CandidateAction
): "none" | "matches_next_checkpoint" | "diverges_from_plan" | "needs_replan" {
  if (state.screen !== "map" || candidate.action.kind !== "choose_map_node") return "none";
  if (!plan || plan.status !== "active") return "needs_replan";
  if (plan.act !== undefined && state.act !== undefined && plan.act !== state.act) return "needs_replan";
  const node = mapNodeSummary(candidate, candidate.action.index);
  if (!plan.nextNode) return "needs_replan";
  if (sameMapNode(plan.nextNode, node)) return "matches_next_checkpoint";
  return "diverges_from_plan";
}

export function mapPlanNeedsReplan(
  plan: MapRoutePlan | undefined,
  state: NormalizedState,
  candidates: ScoredCandidate[] | CandidateAction[]
): boolean {
  if (state.screen !== "map") return false;
  const mapCandidates = candidates.filter((candidate) => candidate.action.kind === "choose_map_node");
  if (mapCandidates.length === 0) return false;
  if (!plan || plan.status !== "active") return true;
  if (plan.act !== undefined && state.act !== undefined && plan.act !== state.act) return true;
  return !mapCandidates.some((candidate) => planFitForCandidate(plan, state, candidate) === "matches_next_checkpoint");
}

export function mapPlanCheckpointReason(plan: MapRoutePlan | undefined): string | undefined {
  if (!plan?.nextNode) return undefined;
  const checkpoints = plan.checkpoints.length ? ` checkpoints=${plan.checkpoints.join(" -> ")}` : "";
  return `follow route plan ${plan.nextNode.type}${checkpoints}`;
}

function deriveRouteLine(state: NormalizedState, candidate: CandidateAction): MapRouteNodeSummary[] {
  const first = mapNodeSummary(candidate, candidate.action.kind === "choose_map_node" ? candidate.action.index : undefined);
  const rawNode = isRecord(candidate.facts?.node) ? candidate.facts.node : {};
  const line = [first];
  const fromLeadsTo = Array.isArray(rawNode.leads_to) ? rawNode.leads_to.filter(isRecord) : [];
  if (fromLeadsTo.length > 0) {
    const next = chooseBestNextNode(fromLeadsTo, state, undefined);
    line.push(mapRawNodeSummary(next));
    appendFutureLine(line, next, state);
    return line.slice(0, MAX_ROUTE_LINE);
  }
  appendFutureLine(line, rawNode, state);
  return line.slice(0, MAX_ROUTE_LINE);
}

function appendFutureLine(line: MapRouteNodeSummary[], node: Record<string, unknown>, state: NormalizedState): void {
  const nodesByKey = allMapNodes(state);
  let current = node;
  const seen = new Set<string>();
  for (let depth = 0; depth < MAX_ROUTE_LINE - 1; depth += 1) {
    const key = nodeKey(current);
    if (!key || seen.has(key)) return;
    seen.add(key);
    const fullNode = nodesByKey.get(key) ?? current;
    const children = childNodes(fullNode, nodesByKey);
    if (children.length === 0) return;
    const next = chooseBestNextNode(children, state, line[line.length - 1]);
    line.push(mapRawNodeSummary(next));
    current = next;
  }
}

function chooseBestNextNode(
  nodes: Record<string, unknown>[],
  state: NormalizedState,
  previous: MapRouteNodeSummary | undefined
): Record<string, unknown> {
  return [...nodes].sort((a, b) => routeNodeScore(b, state, previous) - routeNodeScore(a, state, previous))[0] ?? nodes[0];
}

function routeNodeScore(node: Record<string, unknown>, state: NormalizedState, previous: MapRouteNodeSummary | undefined): number {
  const type = mapRawNodeSummary(node).type.toLowerCase();
  const hpRatio = state.player.hp / Math.max(1, state.player.maxHp);
  let score = 0;
  if (/rest|campfire/.test(type)) score += hpRatio < 0.55 ? 28 : 8;
  if (/shop/.test(type)) score += state.player.gold >= 100 ? 24 : 6;
  if (/elite/.test(type)) score += hpRatio > 0.7 ? 16 : -14;
  if (/monster|enemy/.test(type)) score += 10;
  if (/unknown|event|\?/.test(type)) score += hpRatio < 0.45 ? 10 : 6;
  if (/treasure/.test(type)) score += 18;
  if (previous && previous.type.toLowerCase() === type) score -= 2;
  return score;
}

function allMapNodes(state: NormalizedState): Map<string, Record<string, unknown>> {
  const map = rawMap(state);
  const nodes = Array.isArray(map.nodes) ? map.nodes.filter(isRecord) : [];
  return new Map(nodes.map((node) => [nodeKey(node), node]).filter(([key]) => Boolean(key)) as Array<[string, Record<string, unknown>]>);
}

function childNodes(node: Record<string, unknown>, nodesByKey: Map<string, Record<string, unknown>>): Record<string, unknown>[] {
  const children = Array.isArray(node.children) ? node.children : [];
  return children
    .map((child) => {
      if (Array.isArray(child) && child.length >= 2) return nodesByKey.get(`${Number(child[0])}:${Number(child[1])}`);
      if (isRecord(child)) return nodesByKey.get(nodeKey(child)) ?? child;
      return undefined;
    })
    .filter(isRecord);
}

function rawMap(state: NormalizedState): Record<string, unknown> {
  if (isRecord(state.raw.map)) return state.raw.map;
  return state.raw;
}

function currentMapNode(state: NormalizedState): MapRouteNodeSummary | undefined {
  const current = rawMap(state).current_position;
  return isRecord(current) ? mapRawNodeSummary(current) : undefined;
}

function mapNodeSummary(candidate: CandidateAction, index?: number): MapRouteNodeSummary {
  const node = isRecord(candidate.facts?.node) ? candidate.facts.node : {};
  return {
    index,
    col: numberOrUndefined(node.col),
    row: numberOrUndefined(node.row),
    type: mapNodeTypeFromRaw(node, candidate.label)
  };
}

function mapRawNodeSummary(node: Record<string, unknown>): MapRouteNodeSummary {
  return {
    index: numberOrUndefined(node.index),
    col: numberOrUndefined(node.col),
    row: numberOrUndefined(node.row),
    type: mapNodeTypeFromRaw(node)
  };
}

function mapNodeTypeFromRaw(node: Record<string, unknown>, fallback = "Unknown"): string {
  return asString(node.type ?? node.node_type ?? node.symbol ?? node.name, fallback).trim() || "Unknown";
}

function numberOrUndefined(value: unknown): number | undefined {
  const number = asNumber(value, Number.NaN);
  return Number.isFinite(number) ? number : undefined;
}

function nodeKey(node: Record<string, unknown>): string {
  const col = numberOrUndefined(node.col);
  const row = numberOrUndefined(node.row);
  return col === undefined || row === undefined ? "" : `${col}:${row}`;
}

function sameMapNode(left: MapRouteNodeSummary, right: MapRouteNodeSummary): boolean {
  if (left.col !== undefined && left.row !== undefined && right.col !== undefined && right.row !== undefined) {
    return left.col === right.col && left.row === right.row;
  }
  return left.index !== undefined && right.index !== undefined && left.index === right.index && left.type === right.type;
}

function routeCheckpointPreview(line: MapRouteNodeSummary[]): string[] {
  return line.slice(0, MAX_ROUTE_LINE).map((node) => {
    const position = node.row !== undefined ? `r${node.row}` : node.index !== undefined ? `i${node.index}` : "?";
    return `${position}:${node.type}`;
  });
}

function summarizeRouteLine(line: MapRouteNodeSummary[]): string {
  return routeCheckpointPreview(line).join(" -> ");
}

function mapReplanTriggers(run: RunMemory): string[] {
  return [
    "next planned node is unavailable at a branch",
    "HP drops below safe route threshold",
    "potion or shop resource assumptions change materially",
    `deck pressure changes away from ${primaryRoutePressure(run)}`
  ];
}

function mapPressureSummary(state: NormalizedState, run: RunMemory): string {
  const hpRatio = state.player.hp / Math.max(1, state.player.maxHp);
  if (hpRatio <= 0.35) return "low HP recovery pressure before the next hard fight";
  if (run.deficits.block > 0.65 || run.deficits.potions > 0.6) return "block and resource pressure before the next hard fight";
  if (run.deficits.damage > 0.65 || run.deficits.scaling > 0.65) return "damage and scaling pressure before the next elite or boss";
  if (state.player.gold >= 100) return "shop conversion pressure while gold is still valuable";
  return "balanced HP and route reward pressure";
}

function primaryRoutePressure(run: RunMemory): string {
  if (run.deficits.block > 0.65) return "block";
  if (run.deficits.damage > 0.65) return "damage";
  if (run.deficits.scaling > 0.65) return "scaling";
  if (run.deficits.draw > 0.65) return "draw";
  return "balanced route pressure";
}
