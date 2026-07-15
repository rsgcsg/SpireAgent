# Re-SpireAgent RE-P1

Re-SpireAgent is a small, independent Slay the Spire 2 agent runtime. It reads the current state from the external STS2 MCP REST adapter, normalizes that untrusted JSON into a strongly typed current-state union, builds deterministic legal action choices, asks DeepSeek to select one action ID, validates the selection against the in-memory whitelist, executes it only if the state is unchanged, waits for settlement, and records the complete evidence.

RE-P1 deliberately does not contain memory, learning, scoring, CandidateFuture, shadow/live modes, policy promotion, or the old project's phase machinery. Its job is to make one decision path correct and auditable.

```text
MCP raw state
  -> NormalizedCurrentState
  -> allowed actions
  -> versioned prompt
  -> DeepSeek strict JSON
  -> whitelist + stale-state validation
  -> MCP action
  -> settlement polling
  -> full decision record
```

## Safety Contract

- DeepSeek returns only `selectedActionId`, `reasonBrief`, and optional `confidence`.
- The executable MCP payload never comes from the model.
- Unknown action IDs, invalid JSON, invalid schema, truncation, timeout, state drift, MCP rejection, and uncertain settlement are not executed or retried as actions.
- Action-capable `tick` and `run` commands take an exclusive local runtime lock. This prevents two RE-P1 processes from driving one MCP session; it cannot prevent a human or a different program from acting in the game.
- Raw MCP data is visible only to the adapter, normalizer, recorder, and diagnostic tooling. Planning code imports only the normalized state API.
- Unknown or unverified MCP states become `UnknownCurrentState` and stop safely.
- `.env.local`, API keys, and `data/runs/` are ignored by Git.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Slay the Spire 2
- An external STS2 MCP mod exposing the REST API on `http://localhost:15526` by default
- A DeepSeek API key

This repository does not contain the game, the STS2 MCP C# mod, or a Python MCP server. The game-side mod is an external sensor/actuator dependency. There is no MCP launch command in this package: launch the game with the STS2 MCP mod enabled, then verify its REST endpoint.

## Fresh Clone Setup

From a fresh clone of the parent repository:

```bash
git clone <your-repository-url> SpireAgent
cd SpireAgent/Re-SpireAgent
npm ci
cp .env.example .env.local
chmod 600 .env.local
```

Edit `.env.local` locally and set:

```dotenv
DEEPSEEK_API_KEY=your-local-key
```

Do not commit `.env.local`. The runtime loads it at process startup without printing the key.

Run all offline verification:

```bash
npm run check
```

## Start And Verify MCP

1. Start Slay the Spire 2 with the external STS2 MCP mod loaded.
2. Verify the service:

```bash
curl -sS http://localhost:15526/
curl -sS 'http://localhost:15526/api/v1/singleplayer?format=json'
```

If the adapter uses another address, set `STS2_API_URL` in `.env.local`.

The first command should return an adapter health response. The second should return a JSON object with a `state_type`. If either command fails, fix the game/mod connection before running the agent.

## Configuration

All values are optional except the API key for real model decisions.

| Variable | Default | Meaning |
|---|---:|---|
| `STS2_API_URL` | `http://localhost:15526` | MCP REST base URL |
| `STS2_MCP_TIMEOUT_MS` | `5000` | State/action request timeout |
| `DEEPSEEK_API_KEY` | none | Secret, loaded from environment only |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/chat/completions` | Chat Completions endpoint |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | Provider model |
| `DEEPSEEK_TIMEOUT_MS` | `30000` | Model request timeout |
| `DEEPSEEK_MAX_OUTPUT_TOKENS` | `320` | Short JSON output guard |
| `DEEPSEEK_THINKING_MODE` | `disabled` | Explicit provider thinking mode |
| `AGENT_DATA_DIR` | `data/runs` | Local evidence directory |
| `AGENT_MAX_TICKS` | `100` | Default run limit |
| `AGENT_TICK_DELAY_MS` | `250` | Delay between decisions |
| `AGENT_SETTLEMENT_POLL_MS` | `150` | Post-action poll interval |
| `AGENT_SETTLEMENT_TIMEOUT_MS` | `3000` | Normal settlement timeout |
| `AGENT_END_TURN_SETTLEMENT_TIMEOUT_MS` | `8000` | End-turn settlement timeout |

DeepSeek's current API documentation lists `deepseek-v4-flash` and `deepseek-v4-pro`, makes thinking enabled by default, and requires both `response_format: {"type":"json_object"}` and an explicit JSON instruction. RE-P1 therefore explicitly selects a thinking mode and still validates the returned object locally. See the official [Chat Completions API](https://api-docs.deepseek.com/api/create-chat-completion) and [JSON Output guide](https://api-docs.deepseek.com/guides/json_mode).

## Commands

Read and normalize the current state without creating a run or calling DeepSeek:

```bash
npm run agent:inspect
```

Build and record one prompt without calling DeepSeek or executing an action:

```bash
npm run agent:tick -- --dry-run
```

Run one real decision:

```bash
npm run agent:tick
```

Run a bounded autonomous loop:

```bash
npm run agent:run -- --max-ticks 20 --delay-ms 250
```

`agent:run` is deliberately bounded to one game. When it observes `game_over` or a top-level `menu`, it records the boundary and stops before asking the model to select a restart or menu action. Use the explicit single-tick command only when deliberately testing a supported menu flow.

The loop stops on invalid state, missing actions on an actionable screen, provider/decision failure, MCP rejection, or unsettled execution. Transitional/loading states are polled without calling DeepSeek.

Replay the latest local run or one decision:

```bash
npm run agent:replay
npm run agent:replay -- --run-id <run-id>
npm run agent:replay -- --run-id <run-id> --decision-id <decision-id>
```

Development checks:

```bash
npm run typecheck
npm test
npm run build
npm run check
```

## Evidence Layout

Each run is local and append-only:

```text
data/runs/<run-id>/
  metadata.json
  decisions.jsonl
  snapshots/<decision-id>-pre.raw.json
  snapshots/<decision-id>-post.raw.json
  prompts/<decision-id>.prompt.json
  responses/<decision-id>.response.json
```

Prompt files preserve the full system prompt, state guide, user payload, hashes, and byte counts. Response files preserve all provider attempts, redacted raw provider response, raw content, parsed decision, finish reason, usage, and safe error classification. `decisions.jsonl` links those artifacts to pre/post normalized state, full-raw stale-guard hashes, normalized projection hashes, allowed actions, validation, execution, and settlement.

## Supported State Coverage

RE-P1 has fixture-backed support for:

- `monster` / `boss` combat
- `card_reward`
- `rewards`
- `map`
- `rest_site`
- `event`
- `shop`
- `treasure`
- `card_select`
- `hand_select`
- `crystal_sphere`
- `menu`
- `game_over`

`bundle_select` and future state types are intentionally unsupported until a real raw fixture and verified action protocol are available. They fail closed instead of inheriting guessed fields from the old project. See [MCP_STATE_COVERAGE.md](docs/MCP_STATE_COVERAGE.md).

## Architecture And Development

- [RE_P1_ARCHITECTURE.md](docs/RE_P1_ARCHITECTURE.md)
- [MCP_STATE_COVERAGE.md](docs/MCP_STATE_COVERAGE.md)
- [PROMPT_CONTRACT.md](docs/PROMPT_CONTRACT.md)
- [DECISION_RECORD_SCHEMA.md](docs/DECISION_RECORD_SCHEMA.md)
- [AGENT.md](AGENT.md)
- [agent_handoff.md](agent_handoff.md)

The only supported public TypeScript entrypoint is `src/index.ts`. Integration raw types are not part of the planning API.

## Current Limitations

- The external MCP service was not available during the final offline build, so a fresh real-game read/execute smoke remains required.
- MCP does not list legal actions. The local allowed-action builder reconstructs them from observed normalized state and therefore needs a new fixture whenever the adapter adds or changes a state/action protocol.
- Current MCP non-combat snapshots do not expose a complete deck on every screen. RE-P1 does not invent missing deck context, so card-reward and shop strategy is limited by what the current state actually contains.
- Shop leaving is the one explicit protocol inference retained from verified legacy live behavior: the MCP `proceed` action leaves a shop even when `shop.can_proceed` is false. It is recorded in normalization diagnostics.
- A changed state hash proves visible state drift, not perfect semantic settlement. The watcher waits for two consecutive, identical, non-transitional observations after an action, but animation/UI edge cases still require real-game verification.
- RE-P1 is an auditable baseline, not a strong strategic player yet.
