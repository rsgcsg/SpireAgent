# Re-SpireAgent RE-P1

Re-SpireAgent is a small, independent Slay the Spire 2 agent runtime. It reads the current state from the external STS2 MCP REST adapter, negotiates Bridge v2 when available, normalizes untrusted JSON into a strongly typed current-state contract with separate semantic context and interaction surface, asks DeepSeek to select one allowed action ID, validates the selection, executes it only if the state is unchanged, waits for settlement, and records the complete evidence.

RE-P1 deliberately does not contain memory, learning, scoring, CandidateFuture, shadow/live modes, policy promotion, or the old project's phase machinery. Its job is to make one decision path correct and auditable.

The current strict client contract is Bridge `2.0-preview.35` on the
source-qualified exact game identity `v0.109.0|c12f634d|-840572606`. A local
game with the same version/commit but another assembly hash remains separately
scoped. Current local hash `1833084275` has only explicit `event_option`,
`event_card_acquisition`, and `map_navigation` canaries, no qualified Surface,
and no Inspection authority. Bridge v2 remains incremental:
bounded Surface completeness and opaque action safety are real, but root menu,
several selection variants, and total player-visible coverage are
not complete. See [MCP state coverage](docs/MCP_STATE_COVERAGE.md).

```text
MCP raw state
  -> NormalizedCurrentState { context + surface + actionAuthority }
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
- Unknown semantic contexts or unverified interaction surfaces become structured `unknown`/`unsupported` state components and stop safely.
- A Bridge v2-owned surface imports only state-bound opaque actions advertised by the bridge. Top-level shared state is read-only; v1 fallback cannot add or execute actions there.
- `failed`, `timed_out`, transport-uncertain, or identity-mismatched v2 command results stop as unknown outcomes and are never automatically retried.
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
curl -sS http://localhost:15526/api/v2/capabilities
```

If the adapter uses another address, set `STS2_API_URL` in `.env.local`.

The first command should return an adapter health response. The second should return a JSON object with a `state_type`. A current Bridge v2 mod should also return capabilities from the third command. In default `auto` mode, a missing v2 endpoint falls back to v1; malformed or exact-build-incompatible v2 does not silently regain action authority.

## Configuration

All values are optional except the API key for real model decisions.

| Variable | Default | Meaning |
|---|---:|---|
| `STS2_API_URL` | `http://localhost:15526` | MCP REST base URL |
| `STS2_MCP_TIMEOUT_MS` | `5000` | State/action request timeout |
| `STS2_MCP_PROTOCOL` | `auto` | `auto`, compatibility-only `v1`, or strict `v2` |
| `STS2_MCP_V2_COMMAND_POLL_MS` | `75` | v2 command lifecycle poll interval |
| `STS2_MCP_V2_COMMAND_TIMEOUT_MS` | `12000` | client guard for a submitted v2 command; timeout is unknown, never retryable |
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

The output includes the negotiated adapter/protocol/build descriptor and the
normalized `context.kind`, `surface.kind`, and `actionAuthority`, so an `auto`
fallback cannot be confused with a v2-owned surface.

Build and record one prompt without calling DeepSeek or executing an action:

```bash
npm run agent:tick -- --dry-run
```

`npm run agent:tick -- --help` is non-actionable and prints usage. Unknown
command options are rejected before the runtime, provider, or game adapter is
created.

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

Prompt files preserve the full system prompt, context and surface guides, user payload, hashes, and byte counts. Response files preserve all provider attempts, redacted raw provider response, raw content, parsed decision, finish reason, usage, and safe error classification. `decisions.jsonl` links those artifacts to pre/post normalized state, full-raw stale-guard hashes, normalized projection hashes, allowed actions, validation, execution, and settlement.

## Supported State Coverage

`context` answers where the run is semantically (`combat`, `event`, `map`, and so on); `surface` answers what interaction protocol is active (`combat_turn`, `card_selection`, `option_choice`, and so on). A combat card-selection overlay therefore retains combat enemies and turn facts while exposing only selection actions. A new event ID with ordinary indexed options is data, not a new TypeScript type. A new interaction protocol needs a fixture, normalizer support, action mapping, serializer verification, tests, and a real smoke.

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

Bridge v2 source `preview.35` uses exact-build capabilities. On the
source-qualified v0.109 target, merchant
removal, event/rest upgrade, ordinary combat turn, combat hand selection, and
ordinary single-player rest plus read-only run deck are scoped-qualified; event
card acquisition, reward, card reward, map, shop, treasure, game over, card
bundles, character select, event dialogue, and event option are action canaries.
Every unlisted contract is disabled even if it has historical v0.108 evidence.
Qualification is per observed shape, not broad surface or game coverage. See
[BRIDGE_V2_INTEGRATION.md](docs/BRIDGE_V2_INTEGRATION.md).

`bundle_select` and future state types are intentionally unsupported until a real raw fixture and verified action protocol are available. They fail closed instead of inheriting guessed fields from the old project. See [MCP_STATE_COVERAGE.md](docs/MCP_STATE_COVERAGE.md).

## Architecture And Development

- [RE_P1_ARCHITECTURE.md](docs/RE_P1_ARCHITECTURE.md)
- [MCP_STATE_COVERAGE.md](docs/MCP_STATE_COVERAGE.md)
- [PROMPT_CONTRACT.md](docs/PROMPT_CONTRACT.md)
- [DECISION_RECORD_SCHEMA.md](docs/DECISION_RECORD_SCHEMA.md)
- [BRIDGE_V2_INTEGRATION.md](docs/BRIDGE_V2_INTEGRATION.md)
- [AGENT.md](AGENT.md)
- [agent_handoff.md](agent_handoff.md)

The only supported public TypeScript entrypoint is `src/index.ts`. Integration raw types are not part of the planning API.

## Current Limitations

- Real v1 MCP windows have exercised event, combat, rewards, card reward, map, rest, shop, treasure, and a boss fight. This proves protocol integration, not strategic quality or universal MCP coverage. The legacy v1 `NDeckEnchantSelectScreen` confirmation endpoint acknowledged the request without advancing state; Bridge v2 now has a separate qualified opaque-action contract for that surface.
- Bridge v2 source `preview.35` is current. Source-target exact v0.109 capabilities qualify
  merchant removal, event/rest deck upgrade, ordinary combat turn, combat hand
  selection, ordinary single-player rest, and read-only run deck; event card
  acquisition, reward, card reward, map, shop, treasure, game over, card
  bundles, character select, event dialogue, and event option are explicit
  action canaries. Every unlisted surface remains disabled or explicitly v1-owned in
  `auto` mode. The distinct local hash `1833084275` imports only event option,
  event card acquisition, and map-navigation canaries; everything else remains
  fail closed.
- Organic evidence covers the current scoped permissions only. It does not
  qualify every selector mode, event origin, card target, treasure variant, or
  game UI.
- Bridge v2 exposes one action-owning surface at a time through a centralized
  overlay-vs-room resolver. Typed diagnostics are implemented; legacy warning
  text must not be mistaken for an action-authority decision.
- Read-only `run_deck` and `combat_piles` inspection code is state-bound,
  non-executable, and excluded from the command ledger. Only `run_deck` is
  currently permitted on v0.109; historical combat-pile evidence grants no
  current authority. Draw order remains hidden.
- A full potion belt now makes a visible potion reward non-claimable and
  exposes only exact, state-bound discard operands until capacity exists. The
  discard-then-claim lifecycle passed against an organic full-belt screen.
- Pile, hand, generated, reward, removal, upgrade, enchantment, and run-deck
  card selection are not one generic
  protocol. Their object ownership, timing guard, legal actions, and completion
  semantics remain distinct. Preview.23 qualifies the purpose-specific
  event/rest upgrade child without generalizing it; shared visible-card fields
  do not justify a universal selector.
- Ordinary card reward and outer reward claim are distinct, organically
  qualified protocols; neither is flattened into the other.
- Normal merchant inventory and room controls are distinct Bridge-owned
  protocols. Organic evidence covers open, close/reopen, typed card/relic/potion
  purchases, removal launch, and Proceed to map. Each category retains its own
  completion witness; the removal child deck selector remains separate.
- Run-deck inspection supplies complete typed deck evidence when a local run
  exists, including on legacy-fallback map/shop states. It does not fabricate
  a deck at menu/no-run states.
- Treasure is a separate staged Surface, not a reward alias. Current-build
  evidence confirms one relic choice and Proceed-to-map; chest open and skip
  remain canary-only variants.
- Top-level read-only v2 `shared_state` now supplies persistent run/player HUD
  facts on Bridge-owned states and participates in state identity. It creates no
  actions; semantic Bridge states no longer merge a v1 shared sidecar.
- The documented shop-leave inference remains only in the legacy v1 fallback.
  A preview.14 shop state instead executes exact Bridge-advertised room actions;
  v1 `shop.can_proceed` cannot add or authorize an action there.
- A changed state hash proves visible state drift, not perfect semantic settlement. The watcher waits for two consecutive, identical, non-transitional observations after an action, but animation/UI edge cases still require real-game verification.
- RE-P1 is an auditable baseline, not a strong strategic player yet.

The latest exact-build organic long runs are summarized in
[`STS2MCP/docs/bridge-v2/ORGANIC_LONG_RUN_AUDIT_2026-07-17.md`](../STS2MCP/docs/bridge-v2/ORGANIC_LONG_RUN_AUDIT_2026-07-17.md).
