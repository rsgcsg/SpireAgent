export type CliInvocation =
  | { readonly command: "help" }
  | { readonly command: "inspect" }
  | { readonly command: "connector-canary"; readonly actionId: string }
  | { readonly command: "tick"; readonly dryRun: boolean }
  | { readonly command: "run"; readonly dryRun: boolean; readonly maxTicks?: number; readonly delayMs?: number }
  | { readonly command: "replay"; readonly runId?: string; readonly decisionId?: string };

/** Parses CLI arguments before any provider, adapter, or action-capable runtime is created. */
export function parseCliInvocation(args: readonly string[]): CliInvocation {
  const [command = "help", ...flags] = args;
  if (command === "help" || command === "--help" || command === "-h" || flags.includes("--help") || flags.includes("-h")) {
    return { command: "help" };
  }

  switch (command) {
    case "inspect":
      requireNoFlags(command, flags);
      return { command };
    case "connector-canary": {
      const parsed = parseFlags(command, flags, new Set(["--action-id"]), new Set(["--action-id"]));
      const actionId = parsed.values.get("--action-id");
      if (!actionId) throw new Error("connector-canary requires --action-id");
      return { command, actionId };
    }
    case "tick":
      return { command, dryRun: parseBooleanFlagSet(command, flags, new Set(["--dry-run"])).has("--dry-run") };
    case "run": {
      const parsed = parseFlags(command, flags, new Set(["--dry-run", "--max-ticks", "--delay-ms"]), new Set(["--max-ticks", "--delay-ms"]));
      return {
        command,
        dryRun: parsed.booleans.has("--dry-run"),
        ...(parsed.values.get("--max-ticks") ? { maxTicks: parsePositiveInteger("--max-ticks", parsed.values.get("--max-ticks")!) } : {}),
        ...(parsed.values.get("--delay-ms") ? { delayMs: parsePositiveInteger("--delay-ms", parsed.values.get("--delay-ms")!) } : {})
      };
    }
    case "replay": {
      const parsed = parseFlags(command, flags, new Set(["--run-id", "--decision-id"]), new Set(["--run-id", "--decision-id"]));
      return {
        command,
        ...(parsed.values.get("--run-id") ? { runId: parsed.values.get("--run-id") } : {}),
        ...(parsed.values.get("--decision-id") ? { decisionId: parsed.values.get("--decision-id") } : {})
      };
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

function requireNoFlags(command: string, flags: readonly string[]): void {
  if (flags.length > 0) throw new Error(`${command} does not accept options`);
}

function parseBooleanFlagSet(command: string, flags: readonly string[], allowed: ReadonlySet<string>): ReadonlySet<string> {
  return parseFlags(command, flags, allowed, new Set()).booleans;
}

function parseFlags(
  command: string,
  flags: readonly string[],
  allowed: ReadonlySet<string>,
  requiresValue: ReadonlySet<string>
): { readonly booleans: ReadonlySet<string>; readonly values: ReadonlyMap<string, string> } {
  const booleans = new Set<string>();
  const values = new Map<string, string>();

  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    if (!flag || !allowed.has(flag)) throw new Error(`Unknown option for ${command}: ${flag ?? ""}`);
    if (booleans.has(flag) || values.has(flag)) throw new Error(`Duplicate option for ${command}: ${flag}`);

    if (requiresValue.has(flag)) {
      const value = flags[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
      values.set(flag, value);
      index += 1;
    } else {
      booleans.add(flag);
    }
  }

  return { booleans, values };
}

function parsePositiveInteger(name: string, raw: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}
