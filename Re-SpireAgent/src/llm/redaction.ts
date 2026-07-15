import type { JsonValue } from "../shared/json.js";

// Token counts are telemetry, not credentials. Only redact a key when it names a credential value.
const SECRET_KEY_PATTERN = /^(?:api[-_]?key|authorization|bearer|token|access[-_]?token|refresh[-_]?token|secret|password)$/iu;

export function redactText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9._~+/=-]+/gu, "sk-[REDACTED]");
}

export function redactJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(redactJson);
  if (value === null || typeof value !== "object") return typeof value === "string" ? redactText(value) : value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, SECRET_KEY_PATTERN.test(key) ? "[REDACTED]" : redactJson(child)])
  );
}
