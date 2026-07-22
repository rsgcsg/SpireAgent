# Re-SpireAgent RE-P1

> Compatibility status, 2026-07-22: Re and C# now share
> `2.0-preview.56`, including explicit operation scopes and the Gateway
> assembly digest. Connector Gate 0 is closed on the exact loaded artifact; see
> the [Gate 0 closeout](../STS2MCP/docs/bridge-v2/CONNECTOR_G0_CLOSEOUT_2026-07-22.md).

> Product-boundary warning: direct Re-to-Gateway REST and `.env.local` provider
> keys are developer workflows, not the target consumer architecture. The
> planned product places Gateway authentication/lease use, OS-backed secrets,
> model brokering, Agent supervision, diagnostics, and recovery in a trusted
> external Companion. None of that is implemented by this README. See the
> [productization architecture audit](../docs/current/audits/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md).

Re-SpireAgent is a small, independent Slay the Spire 2 agent runtime. It reads
strict Bridge v2 state from the Live Semantic Gateway REST adapter, normalizes
untrusted JSON into a strongly typed current-state contract with separate
semantic context and interaction Surface, asks DeepSeek to select one allowed
action ID, validates the selection, executes it only if the state is unchanged,
waits for the Bridge command lifecycle, and records the complete evidence.

RE-P1 deliberately does not contain memory, learning, scoring, CandidateFuture, shadow/live modes, policy promotion, or the old project's phase machinery. Its job is to make one decision path correct and auditable.

Re's current strict client contract is Bridge `2.0-preview.56` on exact game
identity `v0.109.0|c12f634d|-840572606`. Re requires capabilities and every
state/bundle/Inspection to agree on protocol, game identity, exact Modset
fingerprint, Bridge assembly SHA-256, module MVID, and runtime instance. An
additional, failed, runtime-added, or mismatched Mod cannot import action or
Inspection authority.

Re imports only explicit operation scopes emitted by the Gateway's exact-build
manifest; empty permission lists never mean wildcard. It rejects legal actions
outside the matching capability operation inventory.
Historical qualification on another game hash or Bridge MVID remains
historical evidence only. See [MCP state coverage](docs/MCP_STATE_COVERAGE.md).

Preview.55 makes strict v2 the sole connector path. Re rejects legacy `v1` and
the former `auto` mode; it cannot probe or fall back to v1. Bridge-confirmed
command completion is the semantic authority, while Re captures the first
coherent successor checkpoint without trying to re-prove game business
completion. A post-command read failure is recorded as checkpoint-pending, not
as permission to retry an already confirmed action.

Preview.46 strictly decodes typed read-only `card_previews` on visible relic,
modifier, potion, shop-relic, and treasure-relic hover facts. These previews
are normalized for reasoning but never create allowed actions. Ephemeral UI
preview models have stable owner-scoped identities so repeated reads do not
fabricate state changes.

Preview.47 additionally decodes a bounded visibility declaration, the current
typed Inspection catalog, and a non-authorizing contract-instance shadow. Re
uses one coherent observation bundle for the catalogued Inspections it elects
to read, so state and sidecars cannot be assembled from different checkpoints.
The shadow is telemetry only and never changes `actionAuthority` or allowed
actions. Unresolved shadow contracts may omit nullable contract/binding fields
without invalidating an otherwise valid transitional state.

Preview.48 adds strict decoding and normalized read-only projection for the
current merchant `shop_catalog`. It preserves fixed visible UI slots, prices,
stock, affordability, potion-capacity blocks, and removal-service state while
publishing no actions. The catalog is a current-build canary and remains
separate from `shop_room` / `shop_inventory` action authority. The progress
guard also excludes regenerated coherent-observation IDs from semantic cycle
identity while preserving all business facts and entity bindings.

Preview.49 enables only the source-bound Self-Help Book
`deck_enchant_selection` as a current-build canary. Re already models its
selecting/preview stages and imports only Bridge-advertised opaque actions;
Bridge confirmation now requires the exact selected card instances to contain
the expected enchantment ID and amount after the overlay closes.

Preview.50 keeps global unknown-transition handling fail-closed while allowing
only event option/Proceed commands to wait across a known asynchronous
intermediate state for their existing semantic completion witness. Re still
records a timeout or failed command as unknown and never retries it.

Preview.51 adds strict combat companion decoding and normalized schema 22.
The player snapshot carries exact player-visible pet identity, alive state,
block, statuses, and health only while the native health bar is visible. A
fresh Necrobinder run confirmed Osty facts reached the model prompt and were
used in an `Unleash` damage decision; no new action or permission exists.

Preview.52 expands only the exact native generated-combat-card potion family:
Colorless, Attack, Skill, and Power Potion. Re requires their distinct
`sourceKind`, combat Context, free-this-turn hand destination, discard overflow,
and source-specific Bridge actions. Normalized schema 23 records the expanded
discriminated union. Attack Potion has current-MVID Organic selection evidence;
unknown generators and Mod-derived potion types remain fail closed.

Preview.53 adds a source-discriminated Graveblast branch to
`combat_pile_card_selection`; Re requires exact hand destination and native
full-hand discard overflow rather than reusing Headbutt draw-top semantics.
Preview.54 adds exact native Splash to `generated_card_choice` with
`sourceKind=splash`. Normalized schema 25 preserves that source while retaining
the existing free-this-turn hand/discard contract. Both branches remain
current-build canaries until their final-MVID actions naturally recur.

The abandoned `.56` Discovery experiment is not part of the current contract:
the C# Gateway has no current source binding for Discovery, so Re rejects that
unknown generated-card source rather than inferring shared mechanics.

Exact no-input combat setup and post-combat resolution intervals normalize as
`combat_transition(setup|resolution) + no_action + settling +
actionAuthority=none`. They are polling states, not model decisions or legacy
fallbacks. A generic missing overlay remains unsupported.

```text
Bridge REST state
  -> NormalizedCurrentState { context + surface + actionAuthority }
  -> allowed actions
  -> versioned prompt
  -> DeepSeek strict JSON
  -> whitelist + stale-state validation
  -> Bridge action submission and command poll
  -> settlement polling
  -> full decision record
```

## Safety Contract

- DeepSeek returns only `selectedActionId`, `reasonBrief`, and optional `confidence`.
- The executable MCP payload never comes from the model.
- Unknown action IDs, invalid JSON, invalid schema, truncation, timeout, state drift, MCP rejection, and uncertain settlement are not executed or retried as actions.
- Action-capable `tick` and `run` commands take an exclusive local runtime lock. This prevents two RE-P1 processes from driving one MCP session; it cannot prevent a human or a different program from acting in the game.
- A bounded-run progress guard compares semantic state/action transitions rather than regenerated Bridge transport IDs. The second identical semantic transition stops as `repeated_semantic_transition`; business facts and entity bindings are never stripped from progress identity.
- Raw MCP data is visible only to the adapter, normalizer, recorder, and diagnostic tooling. Planning code imports only the normalized state API.
- Unknown semantic contexts or unverified interaction surfaces become structured `unknown`/`unsupported` state components and stop safely.
- A Bridge v2-owned surface imports only state-bound opaque actions advertised by the bridge. Top-level shared state is read-only; v1 fallback cannot add or execute actions there.
- `failed`, `timed_out`, transport-uncertain, or identity-mismatched v2 command results stop as unknown outcomes and are never automatically retried.
- A Bridge-confirmed command and availability of the next stable decision checkpoint are recorded separately. If a changed valid state is still transitional at the checkpoint timeout, the record is `executed_checkpoint_pending`; the next tick re-reads state and never retries the action. v1 acknowledgement and unknown Bridge outcomes do not receive this treatment.
- Map navigation, `continue_run`, and `embark_standard_run` use the bounded long-transition settlement budget rather than the ordinary action budget.
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

The first command should return an adapter health response. The second is a
legacy read-only diagnostic and should return a JSON object with a `state_type`.
A current Bridge v2 mod should also return capabilities from the third command.
Re uses only v2; a missing, malformed, or exact-build-incompatible endpoint
fails closed.

## Configuration

All values are optional except the API key for real model decisions.

| Variable | Default | Meaning |
|---|---:|---|
| `STS2_API_URL` | `http://localhost:15526` | MCP REST base URL |
| `STS2_MCP_TIMEOUT_MS` | `5000` | State/action request timeout |
| `STS2_MCP_V2_COMMAND_POLL_MS` | `75` | v2 command lifecycle poll interval |
| `STS2_MCP_V2_COMMAND_TIMEOUT_MS` | `12000` | client guard for a submitted v2 command; timeout is unknown, never retryable |
| `DEEPSEEK_API_KEY` | none | Secret, loaded from environment only |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/chat/completions` | Chat Completions endpoint |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | Provider model |
| `DEEPSEEK_TIMEOUT_MS` | `30000` | Model request timeout |
| `DEEPSEEK_MAX_OUTPUT_TOKENS` | `320` | Short JSON output guard |
| `DEEPSEEK_THINKING_MODE` | `disabled` | Explicit provider thinking mode |
| `AGENT_DATA_DIR` | `data/runs` under `Re-SpireAgent/` | Local evidence directory; relative paths are project-root anchored |
| `AGENT_EVIDENCE_PROVENANCE` | `unrecorded` | `ordinary_gameplay`, `operator_positioned`, `console_assisted`, `fixture`, or `unrecorded`; metadata only, never qualification authority |
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
normalized `context.kind`, `surface.kind`, and `actionAuthority`.

Execute one operator-selected action only when its ID is present in that fresh
inspection:

```bash
npm run agent:connector-canary -- --action-id <advertised-id>
```

This diagnostic does not call DeepSeek. It uses the same strict observation,
stale-state guard, v2 submit/poll, unknown-no-retry, and successor settlement
implementation as a normal tick; it does not bypass Gateway legality.

Build and record one prompt without calling DeepSeek or executing an action:

```bash
npm run agent:tick -- --dry-run
```

`npm run agent:tick -- --help` is non-actionable and prints usage. Unknown
command options are rejected before the runtime, provider, or game adapter is
created.

Read aggregate Prompt size, Surface, state-component, and duplicated-fact
statistics from ignored local records without opening the Gateway, calling a
provider, or printing Prompt contents:

```bash
npm run agent:prompt-audit -- --limit-runs 5
npm run agent:prompt-audit -- --run-id <run-id>
```

This is an architecture diagnostic, not replay, qualification evidence, or a
compact-prompt runtime mode.

Run one **provider-costing but non-executing** comparison over an exact recorded
Prompt. It reads that artifact, calls DeepSeek once with the recorded full
Prompt and once with the deterministic shadow projection, then emits only
redacted outcome/latency/usage summaries. It never opens the Gateway, creates a
run, submits an action, or writes a comparison artifact:

```bash
npm run agent:prompt-shadow-compare -- --run-id <run-id> --decision-id <decision-id>
```

Action agreement is a diagnostic only. A paired sample cannot prove strategic
correctness or authorize a compact Prompt. The output's byte delta is signed,
because small Prompts can grow when projection metadata costs more than it
removes.

Before interpreting a disagreement, establish bounded full-Prompt provider
variation for the same recorded observation. This is also non-executing and
hard-limited to two through five calls:

```bash
npm run agent:prompt-repeat-baseline -- --run-id <run-id> --decision-id <decision-id> --samples 3 --variant full
npm run agent:prompt-repeat-baseline -- --run-id <run-id> --decision-id <decision-id> --samples 3 --variant shadow
```

Run one real decision:

```bash
npm run agent:tick
```

Run a bounded autonomous loop:

```bash
npm run agent:run -- --max-ticks 20 --delay-ms 250
```

`agent:run` is deliberately bounded to one game. It may finish that run's
Bridge-owned game-over intro, summary, and return lifecycle, then stops at the
top-level `menu` before asking the model to continue or start another run. Use
the explicit single-tick command only when deliberately testing a supported
menu flow.

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
Re-SpireAgent/data/runs/<run-id>/
  metadata.json
  decisions.jsonl
  snapshots/<decision-id>-pre.raw.json
  snapshots/<decision-id>-post.raw.json
  prompts/<decision-id>.prompt.json
  responses/<decision-id>.response.json
```

Prompt files preserve the full system prompt, context and surface guides, user payload, hashes, and byte counts. Response files preserve all provider attempts, redacted raw provider response, raw content, parsed decision, finish reason, usage, and safe error classification. `decisions.jsonl` links those artifacts to pre/post normalized state, full-raw stale-guard hashes, normalized projection hashes, allowed actions, validation, execution, and settlement.

`metadata.json` also records declared evidence provenance. Historical or
default `unrecorded` runs remain useful coverage/debug evidence but cannot
independently be described as Organic qualification. The label never changes
Bridge permission or execution behavior.

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

Bridge v2 source `preview.56` uses exact-game, exact-Modset, exact Bridge
SHA/MVID/runtime, and per-operation capabilities. The current exact v0.109
profile has 74 explicit operation scopes, three read-only Inspection
canaries, and no qualified scope. Every unlisted operation, origin, owner, and
Inspection is disabled even if another build or MVID has historical evidence.
Qualification is per exact evidence scope, never broad Surface or game
coverage. See
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

- Historical v1 MCP windows exercised event, combat, rewards, card reward,
  map, rest, shop, treasure, and a boss fight. This is historical protocol
  evidence only. The game REST service and Re production defaults no longer
  route actions through v1.
- Bridge v2 source `preview.56` is current. The current exact v0.109 build has
  no qualified operation; all executable operation scopes are explicit
  canaries. Historical source-target qualifications do not transfer.
  Final-MVID real-game windows recorded 46 ticks and then 20/20 settled ticks;
  their metadata provenance remains `unrecorded`. A subsequent explicitly
  declared fixture window completed 10/10. Together they exercised combat,
  reward, map, shop, rest, and deck-upgrade flows without unknown outcome.
  This is coverage evidence, not DeepSeek Organic qualification.
- Historical Organic evidence remains attached to its recorded game hash,
  DLL SHA, MVID, runtime, and run. It does not qualify every selector mode,
  event origin, card target, treasure variant, or current build.
- Bridge v2 exposes one action-owning surface at a time through a centralized
  overlay-vs-room resolver. Typed diagnostics are implemented; legacy warning
  text must not be mistaken for an action-authority decision.
- Read-only `run_deck`, `combat_piles`, and `shop_catalog` Inspection code is
  state-bound, non-executable, excluded from the command ledger, and
  canary-only on the current build. None creates action authority and draw
  order remains hidden.
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
- Historical shop-leave inference remains only in the explicit diagnostics
  v1 adapter. It cannot add or authorize an action in strict v2.
- Bridge Command completion proves the business witness. Re then captures a
  coherent non-transitional checkpoint; it does not reinterpret arbitrary
  state-hash drift as semantic completion.
- RE-P1 is an auditable baseline, not a strong strategic player yet.

The latest exact-build organic long runs are summarized in
[`archive/bridge-v2-previews/2026-07/ORGANIC_LONG_RUN_AUDIT_2026-07-17.md`](../archive/bridge-v2-previews/2026-07/ORGANIC_LONG_RUN_AUDIT_2026-07-17.md).
