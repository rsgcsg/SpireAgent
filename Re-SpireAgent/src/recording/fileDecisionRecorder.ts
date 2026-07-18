import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { PromptBundle } from "../prompting/promptBuilder.js";
import type { JsonValue } from "../shared/json.js";
import type { DecisionRecord, DecisionRecorder, PreparedEvidence, RunMetadata } from "./types.js";

export class FileDecisionRecorder implements DecisionRecorder {
  readonly runId: string;
  private readonly runDir: string;

  constructor(
    private readonly dataRoot: string,
    private readonly metadata: RunMetadata
  ) {
    this.runId = metadata.runId;
    this.runDir = join(dataRoot, safeSegment(metadata.runId));
  }

  async initialize(): Promise<void> {
    await Promise.all([
      mkdir(join(this.runDir, "snapshots"), { recursive: true }),
      mkdir(join(this.runDir, "prompts"), { recursive: true }),
      mkdir(join(this.runDir, "responses"), { recursive: true })
    ]);
    await writeFile(join(this.runDir, "metadata.json"), `${JSON.stringify(this.metadata, null, 2)}\n`, { flag: "wx" }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== "EEXIST") throw error;
      }
    );
  }

  async prepare(input: {
    decisionId: string;
    preRawState: JsonValue;
    normalizedState: PreparedEvidence["preState"]["normalizedState"];
    stateHash: string;
    normalizedStateHash: string;
    diagnostics: PreparedEvidence["preState"]["diagnostics"];
    prompt?: PromptBundle;
  }): Promise<PreparedEvidence> {
    const id = safeSegment(input.decisionId);
    const rawPath = join(this.runDir, "snapshots", `${id}-pre.raw.json`);
    await writeJson(rawPath, input.preRawState);
    const preState: PreparedEvidence["preState"] = {
      rawStateRef: this.relativeRef(rawPath),
      normalizedState: input.normalizedState,
      stateHash: input.stateHash,
      normalizedStateHash: input.normalizedStateHash,
      diagnostics: input.diagnostics
    };
    if (!input.prompt) return { preState };
    const promptPath = join(this.runDir, "prompts", `${id}.prompt.json`);
    await writeJson(promptPath, input.prompt);
    return { preState, prompt: promptRecord(input.prompt, this.relativeRef(promptPath)) };
  }

  async append(record: DecisionRecord, evidence?: { postRawState?: JsonValue }): Promise<void> {
    const id = safeSegment(record.decisionId);
    if (record.llm) {
      const responsePath = join(this.runDir, "responses", `${id}.response.json`);
      await writeJson(responsePath, record.llm.session);
      record.llm.responseRef = this.relativeRef(responsePath);
    }
    if (record.postState) {
      const rawPath = join(this.runDir, "snapshots", `${id}-post.raw.json`);
      if (evidence?.postRawState !== undefined) await writeJson(rawPath, evidence.postRawState);
      record.postState.rawStateRef = this.relativeRef(rawPath);
    }
    await appendFile(join(this.runDir, "decisions.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
  }

  private relativeRef(path: string): string {
    return relative(this.runDir, path).replaceAll("\\", "/");
  }
}

export function createRunId(now = new Date()): string {
  return `run-${now.toISOString().replace(/[-:.TZ]/gu, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listRunIds(dataRoot: string): Promise<string[]> {
  return readdir(dataRoot, { withFileTypes: true })
    .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort())
    .catch(() => []);
}

export async function readRunRecords(dataRoot: string, runId: string): Promise<DecisionRecord[]> {
  const path = join(resolve(dataRoot), safeSegment(runId), "decisions.jsonl");
  const text = await readFile(path, "utf8");
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as DecisionRecord);
}

export async function readRunMetadata(dataRoot: string, runId: string): Promise<RunMetadata> {
  const path = join(resolve(dataRoot), safeSegment(runId), "metadata.json");
  return JSON.parse(await readFile(path, "utf8")) as RunMetadata;
}

function promptRecord(prompt: PromptBundle, promptRef: string): NonNullable<DecisionRecord["prompt"]> {
  return {
    promptRef,
    globalPromptId: prompt.globalPromptId,
    globalPromptVersion: prompt.globalPromptVersion,
    stateGuideId: prompt.stateGuideId,
    stateGuideVersion: prompt.stateGuideVersion,
    systemPromptHash: prompt.systemPromptHash,
    userPromptHash: prompt.userPromptHash,
    systemPromptBytes: prompt.systemPromptBytes,
    userPromptBytes: prompt.userPromptBytes
  };
}

function safeSegment(value: string): string {
  if (!/^[A-Za-z0-9._-]+$/u.test(value)) throw new Error(`Unsafe path segment: ${value}`);
  return value;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
