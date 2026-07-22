import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { DOMAIN_SCHEMA_VERSION, type JsonRecord } from "../domain/types.js";
import type { NormalizedState, ScoredCandidate } from "./types.js";
import { agentRoot, isRecord } from "./utils.js";

export interface DerivedRetrievalInput {
  state: NormalizedState;
  candidates: ScoredCandidate[];
  tags: string[];
}

export function buildDerivedSnapshot(input: DerivedRetrievalInput): JsonRecord {
  const cardTags = readJsonFile(path.join(agentRoot, "derived", "card-tags.json"));
  const relicTags = readJsonFile(path.join(agentRoot, "derived", "relic-tags.json"));
  const synergyRules = readJsonFile(path.join(agentRoot, "derived", "synergy-rules.json"));
  const draftRulesPath = path.join(agentRoot, "derived", "draft-rules.md");

  const relevantFacts = [
    ...matchTagRecords("card_tag", cardTags, cardNames(input)),
    ...matchTagRecords("relic_tag", relicTags, relicNames(input.state))
  ].slice(0, 12);
  const relevantRules = [
    ...matchSynergyRules(synergyRules, input.state),
    ...draftPolicyFacts(draftRulesPath)
  ].slice(0, 12);

  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    relevantFacts,
    relevantRules,
    query: {
      character: input.state.player.character,
      screen: input.state.screen,
      tags: input.tags.slice(0, 24),
      hand: input.state.player.hand.map((card) => card.name).slice(0, 12),
      candidates: input.candidates.map((candidate) => candidate.label).slice(0, 12)
    },
    ref: "derived/"
  };
}

function readJsonFile(filePath: string): JsonRecord | undefined {
  if (!existsSync(filePath)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function cardNames(input: DerivedRetrievalInput): Set<string> {
  const names = new Set<string>();
  for (const card of input.state.player.hand) addName(names, card.id, card.name);
  for (const reward of input.state.rewards) addName(names, reward.id, reward.name, reward.cardName);
  for (const candidate of input.candidates) {
    addName(names, candidate.label, candidate.action.kind);
    if ("cardName" in candidate.action) addName(names, candidate.action.cardName);
  }
  return names;
}

function relicNames(state: NormalizedState): Set<string> {
  const names = new Set<string>();
  for (const relic of state.player.relics) addName(names, relic.id, relic.name);
  return names;
}

function addName(names: Set<string>, ...values: unknown[]): void {
  for (const value of values) {
    const normalized = normalizeKey(value);
    if (normalized) names.add(normalized);
  }
}

function matchTagRecords(kind: string, source: JsonRecord | undefined, names: Set<string>): JsonRecord[] {
  const tags = isRecord(source?.tags) ? source.tags : {};
  return Object.entries(tags)
    .filter(([key]) => names.has(normalizeKey(key)))
    .map(([key, value]) => ({ kind, id: key, tags: value }));
}

function matchSynergyRules(source: JsonRecord | undefined, state: NormalizedState): JsonRecord[] {
  const rules = Array.isArray(source?.rules) ? source.rules : [];
  const character = normalizeKey(state.player.character);
  return rules
    .filter((rule): rule is JsonRecord => isRecord(rule))
    .filter((rule) => {
      const appliesTo = isRecord(rule.applies_to) ? rule.applies_to : {};
      const ruleCharacter = normalizeKey(appliesTo.character);
      return !ruleCharacter || character.includes(ruleCharacter) || ruleCharacter.includes(character);
    })
    .map((rule) => ({
      kind: "synergy_rule",
      id: rule.id,
      when: rule.when,
      prefer: rule.prefer,
      avoid: rule.avoid,
      source: "derived/synergy-rules.json"
    }));
}

function draftPolicyFacts(filePath: string): JsonRecord[] {
  if (!existsSync(filePath)) return [];
  const text = readFileSync(filePath, "utf8");
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .slice(0, 6);
  return lines.map((line, index) => ({
    kind: "draft_policy",
    id: `draft-policy-${index + 1}`,
    claim: line.replace(/^- /, ""),
    source: "derived/draft-rules.md"
  }));
}

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
