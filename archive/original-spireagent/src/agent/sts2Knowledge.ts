import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type Sts2Record = Record<string, unknown>;

export interface Sts2Knowledge {
  cards: Sts2Record[];
  relics: Sts2Record[];
  characters: Sts2Record[];
  keywords: Sts2Record[];
  potions: Sts2Record[];
  metadata: Sts2Record;
}

export interface AgentContextInput {
  characterName: string;
  deck?: Array<string | Sts2Record>;
  candidateCards?: Array<string | Sts2Record>;
  relics?: Array<string | Sts2Record>;
  recommendation?: string;
  limit?: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const defaultDataDir = path.join(projectRoot, "data", "spire-codex");
const defaultLang = "zhs";

let cachedKnowledge: Sts2Knowledge | null = null;

export function loadSts2Knowledge(dataDir = defaultDataDir): Sts2Knowledge {
  if (cachedKnowledge && dataDir === defaultDataDir) {
    return cachedKnowledge;
  }

  const knowledge: Sts2Knowledge = {
    cards: readEntity(dataDir, `cards-${defaultLang}.json`),
    relics: readEntity(dataDir, `relics-${defaultLang}.json`),
    characters: readEntity(dataDir, `characters-${defaultLang}.json`),
    keywords: readEntity(dataDir, `keywords-${defaultLang}.json`),
    potions: readEntity(dataDir, `potions-${defaultLang}.json`, true),
    metadata: (readJsonFile(path.join(dataDir, "metadata.json"), true) ?? {}) as Sts2Record
  };

  if (dataDir === defaultDataDir) {
    cachedKnowledge = knowledge;
  }

  return knowledge;
}

export function searchCards(query: string, limit = 10): Sts2Record[] {
  const { cards } = loadSts2Knowledge();
  return searchRecords(cards, query, limit, [
    "name",
    "title",
    "id",
    "description",
    "description_raw",
    "color",
    "color_key",
    "rarity",
    "rarity_key",
    "type",
    "type_key",
    "target",
    "keywords",
    "keywords_key",
    "tags"
  ]);
}

export function searchRelics(query: string, limit = 10): Sts2Record[] {
  const { relics } = loadSts2Knowledge();
  return searchRecords(relics, query, limit, [
    "name",
    "title",
    "id",
    "description",
    "description_raw",
    "flavor",
    "rarity",
    "rarity_key",
    "pool",
    "notes"
  ]);
}

export function getCharacterInfo(characterName: string): Sts2Record | null {
  const { characters } = loadSts2Knowledge();
  return findBestCharacterMatch(characters, characterName);
}

export function getStartingDeck(characterName: string): Sts2Record[] {
  const knowledge = loadSts2Knowledge();
  const character = findBestCharacterMatch(knowledge.characters, characterName);
  const deckIds = asStringArray(getField(character, ["starting_deck", "startingDeck", "deck"]));
  return resolveIds(deckIds, knowledge.cards);
}

export function getStartingRelics(characterName: string): Sts2Record[] {
  const knowledge = loadSts2Knowledge();
  const character = findBestCharacterMatch(knowledge.characters, characterName);
  const relicIds = asStringArray(getField(character, ["starting_relics", "startingRelics", "relics"]));
  return resolveIds(relicIds, knowledge.relics);
}

export function buildAgentContext(input: AgentContextInput): string {
  const limit = input.limit ?? 10;
  const character = getCharacterInfo(input.characterName);
  const startingDeck = getStartingDeck(input.characterName);
  const startingRelics = getStartingRelics(input.characterName);
  const deck = resolveMixedRecords(input.deck ?? [], "card", limit);
  const candidateCards = resolveMixedRecords(input.candidateCards ?? [], "card", limit);
  const relics = resolveMixedRecords(input.relics ?? [], "relic", limit);

  const lines = [
    `当前角色：${displayName(character) || input.characterName}`,
    `角色说明：${textField(character, "description") || "无"}`,
    `起始牌组：${formatRecordList(startingDeck) || "未知"}`,
    `初始遗物：${formatRecordList(startingRelics) || "未知"}`
  ];

  if (deck.length > 0) {
    lines.push(`当前牌组：${formatRecordList(deck)}`);
  }

  if (candidateCards.length > 0) {
    lines.push(`候选卡牌：${formatRecordList(candidateCards, true)}`);
  }

  if (relics.length > 0) {
    lines.push(`相关遗物：${formatRecordList(relics, true)}`);
  }

  if (input.recommendation) {
    lines.push(`推荐理由：${input.recommendation}`);
  }

  return lines.join("\n");
}

function readEntity(dataDir: string, filename: string, optional = false): Sts2Record[] {
  const payload = readJsonFile(path.join(dataDir, filename), optional);

  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    for (const key of ["items", "data", "results", "records"]) {
      const value = payload[key];
      if (Array.isArray(value)) {
        return value.filter(isRecord);
      }
    }
  }

  if (optional) {
    return [];
  }

  throw new Error(`Expected ${filename} to contain an array or array wrapper`);
}

function readJsonFile(filePath: string, optional = false): unknown {
  if (!existsSync(filePath)) {
    if (optional) {
      return null;
    }

    throw new Error(`Missing STS2 knowledge cache: ${filePath}. Run npm run sync:sts2-data first.`);
  }

  return JSON.parse(readFileSync(filePath, "utf8"));
}

function searchRecords(
  records: Sts2Record[],
  query: string,
  limit: number,
  fields: string[]
): Sts2Record[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return records.slice(0, limit);
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return records
    .map((record) => ({
      record,
      score: scoreRecord(record, normalizedQuery, terms, fields)
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.record);
}

function scoreRecord(
  record: Sts2Record,
  normalizedQuery: string,
  terms: string[],
  fields: string[]
): number {
  let score = 0;
  const name = normalizeSearchText(displayName(record));
  const id = normalizeSearchText(textField(record, "id"));

  if (name === normalizedQuery || id === normalizedQuery) {
    score += 200;
  }

  if (name.includes(normalizedQuery)) {
    score += 100;
  }

  if (id.includes(normalizedQuery)) {
    score += 80;
  }

  for (const field of fields) {
    const value = normalizeSearchText(flattenValue(record[field]));
    if (!value) {
      continue;
    }

    if (value.includes(normalizedQuery)) {
      score += field === "description" || field === "description_raw" ? 25 : 50;
    }

    for (const term of terms) {
      if (value.includes(term)) {
        score += field === "description" || field === "description_raw" ? 5 : 10;
      }
    }
  }

  return score;
}

function findBestCharacterMatch(characters: Sts2Record[], characterName: string): Sts2Record | null {
  return (
    searchRecords(characters, characterName, 1, [
      "name",
      "title",
      "id",
      "color",
      "color_key",
      "description"
    ])[0] ?? null
  );
}

function resolveIds(ids: string[], records: Sts2Record[]): Sts2Record[] {
  const byId = new Map<string, Sts2Record>();
  for (const record of records) {
    const id = textField(record, "id");
    if (id) {
      byId.set(normalizeId(id), record);
    }
  }

  return ids.map((id) => byId.get(normalizeId(id)) ?? { id, name: id });
}

function resolveMixedRecords(
  values: Array<string | Sts2Record>,
  type: "card" | "relic",
  limit: number
): Sts2Record[] {
  const results: Sts2Record[] = [];

  for (const value of values) {
    if (isRecord(value)) {
      results.push(value);
      continue;
    }

    const matches = type === "card" ? searchCards(value, 1) : searchRelics(value, 1);
    results.push(matches[0] ?? { id: value, name: value });
  }

  return results.slice(0, limit);
}

function getField(record: Sts2Record | null, fieldNames: string[]): unknown {
  if (!record) {
    return undefined;
  }

  for (const fieldName of fieldNames) {
    if (record[fieldName] !== undefined) {
      return record[fieldName];
    }
  }

  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item)).filter(Boolean);
}

function displayName(record: Sts2Record | null | undefined): string {
  return textField(record, "name") || textField(record, "title") || textField(record, "id");
}

function textField(record: Sts2Record | null | undefined, field: string): string {
  const value = record?.[field];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function formatRecordList(records: Sts2Record[], includeDescription = false): string {
  return records
    .map((record) => {
      const name = displayName(record);
      if (!includeDescription) {
        return name;
      }

      const description = textField(record, "description") || textField(record, "description_raw");
      const type = textField(record, "type") || textField(record, "rarity");
      const prefix = type ? `${name}（${type}）` : name;
      return description ? `${prefix}: ${description}` : prefix;
    })
    .filter(Boolean)
    .join("；");
}

function flattenValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(flattenValue).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(flattenValue).join(" ");
  }

  return "";
}

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Sts2Record {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
