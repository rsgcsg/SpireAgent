import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { agentRoot } from "./utils.js";

export function loadLocalEnv(): void {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(agentRoot, fileName);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      const [key, value] = parsed;
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function parseEnvLine(line: string): [string, string] | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;
  const separator = trimmed.indexOf("=");
  if (separator <= 0) return undefined;
  const key = trimmed.slice(0, separator).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return undefined;
  const rawValue = trimmed.slice(separator + 1).trim();
  return [key, unquoteEnvValue(rawValue)];
}

function unquoteEnvValue(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
