#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

const bridgeDir = process.env.STS2_LLM_BRIDGE_DIR ?? "/tmp/sts2-llm-bridge";
const timeoutMs = Number(process.env.STS2_LLM_BRIDGE_TIMEOUT_MS ?? "240000");
const pollMs = Number(process.env.STS2_LLM_BRIDGE_POLL_MS ?? "500");

const prompt = await readStdin();
const id = `llm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const parsedPrompt = parsePrompt(prompt);
const request = {
  id,
  at: new Date().toISOString(),
  responsePath: path.join(bridgeDir, `response-${id}.json`),
  prompt,
  parsedPrompt
};

mkdirSync(bridgeDir, { recursive: true });
writeJsonAtomic(path.join(bridgeDir, `request-${id}.json`), request);
writeJsonAtomic(path.join(bridgeDir, "latest-request.json"), request);
writeFileSync(path.join(bridgeDir, "pending-id.txt"), `${id}\n`, "utf8");

const responsePath = request.responsePath;
const deadline = Date.now() + timeoutMs;
while (Date.now() < deadline) {
  if (existsSync(responsePath)) {
    const responseText = readFileSync(responsePath, "utf8");
    const response = JSON.parse(responseText);
    if (!response.candidateId || typeof response.candidateId !== "string") {
      throw new Error(`Bridge response for ${id} missing candidateId`);
    }
    writeFileSync(path.join(bridgeDir, "pending-id.txt"), "", "utf8");
    process.stdout.write(`${JSON.stringify(response)}\n`);
    process.exit(0);
  }
  await sleep(pollMs);
}

throw new Error(`Timed out waiting for ${responsePath}`);

function parsePrompt(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("error", reject);
    process.stdin.on("end", () => resolve(input));
  });
}

function writeJsonAtomic(filePath, value) {
  const tmpPath = `${filePath}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(tmpPath, filePath);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
