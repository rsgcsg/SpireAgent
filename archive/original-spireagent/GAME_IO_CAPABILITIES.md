# Game I/O Capabilities

Game I/O must be expressed as capabilities. The agent should adapt to what the current game adapter can really provide.

Phase 1 code paths:

- `src/domain/types.ts`: `AdapterCapabilities`.
- `src/game-io/types.ts`: `StateReader`, `RawStateReader`, `ActionExecutor`, `GameEventReader`, `CapabilityProvider`, `GameIO`.
- `src/adapters/sts2mcp/capabilities.ts`: current STS2MCP REST capability object.
- `src/agent/client.ts`: current REST client exposes `capabilities()`.

## Target Capability Shape

```ts
interface AdapterCapabilities {
  canReadState: boolean;
  canReadRawState: boolean;
  canReadScreen: boolean;
  canExecuteActions: boolean;
  canReadAgentActionResults: boolean | "partial";
  canListLegalActions: boolean;
  canReadEventLog: boolean;
  canReadHumanEvents: boolean;
  canProvideFactData: boolean;
  canProvideVersionedFacts: boolean;
}
```

## Legacy STS2MCP v1 REST Capability Assessment

The original assessment below describes the legacy v1 adapter path. It must
not be used as the capability truth for a negotiated strict Bridge v2 session:

```json
{
  "canReadState": true,
  "canReadRawState": true,
  "canReadScreen": true,
  "canExecuteActions": true,
  "canReadAgentActionResults": "partial",
  "canListLegalActions": false,
  "canReadEventLog": false,
  "canReadHumanEvents": false,
  "canProvideFactData": false,
  "canProvideVersionedFacts": false
}
```

Notes:

- Agent actions are ground truth because this project selects and sends them through the executor.
- REST responses can report action success or error, but detailed post-action effects are obtained by re-reading state.
- Human UI actions are not ground truth with the current adapter.
- Legal actions are generated locally from normalized visible state, not listed directly by MCP.
- The current runtime capability object is `STS2MCP_REST_CAPABILITIES`.

## Bridge v2 Negotiated Capability Assessment

Terminology and component ownership follow the [Live STS2 Connection
Boundary](STS2MCP/docs/bridge-v2/LIVE_GAME_CONNECTION_BOUNDARY.md): the
game-side Bridge is the Live Semantic Gateway, REST is Re-SpireAgent's current
primary adapter, and MCP is optional transport. Capability vocabulary does not
move legality, permission, Command, transaction, Witness, or evidence authority
into a transport or client.

Bridge v2 does not map cleanly onto one static `AdapterCapabilities` constant.
Its capabilities are exact-environment, protocol, Surface, operation, and
Inspection scoped. In a strict-v2 state with `bridge_advertised` authority:

```json
{
  "canReadState": true,
  "canReadRawState": true,
  "canReadScreen": true,
  "canExecuteActions": true,
  "canReadAgentActionResults": true,
  "canListLegalActions": true,
  "canReadEventLog": false,
  "canReadHumanEvents": false,
  "canProvideFactData": true,
  "canProvideVersionedFacts": true
}
```

Important distinctions:

- `legal_actions` are server-advertised opaque action IDs bound to one exact
  `state_id`. Re does not reconstruct strict-v2 legality from visible fields.
- Read-screen and fact-data capability means typed player-visible projection,
  not raw scene-tree access. Execute capability means only the current exact
  qualified/canary scopes, never a global action right.
- A command result has an idempotent lifecycle and may settle only after an
  action-specific semantic completion probe. Unknown outcomes are not retried.
- Capability implementation is not authority. Empty qualified/canary scopes
  are empty and fail closed.
- Inspection is read-only, state-bound, outside the command ledger, and does
  not grant action authority.
- Re-SpireAgent currently calls `/api/v2/*` through `BridgeV2RestClient`; it
  does not use the Python MCP server for strict Bridge v2 operation.
- The Python MCP v2 adapter currently exposes explicit helpers for `run_deck`
  and `combat_piles`, while the Bridge/Re catalog also includes
  `shop_catalog`. This is adapter drift, not absence of the Bridge contract.
  A future adapter should request only fixed catalog-advertised Inspection
  kinds and must not add an arbitrary query language.

The durable capability source is the live Bridge v2 handshake plus exact
environment identity, not this prose summary.

## Future Environment Handshake

`AdapterCapabilities` describes what the adapter says it can do. It is not enough to establish environment compatibility.

P9.5E/P14 should add a separate handshake that can report, when available:

- game build and main/beta channel;
- content/model manifest identity;
- enabled mod ids, versions, and gameplay-affecting status;
- adapter id/version and capability hash;
- fact snapshot/schema version;
- compatible/degraded/quarantined/unsupported status.

Unknown values must remain unknown. A successful state read or action is not proof that all mechanics, stable identifiers, serialization, or learned policies remain compatible.

This is particularly important while the official game and mod framework continue to evolve. Official current update information is available at <https://steamcommunity.com/app/2868840/allnews/>.

Observed Phase 2.5 REST/candidate caveats:

- Some screens briefly expose loading or post-choice states where buttons are not enabled yet. The controller uses settlement/backoff instead of immediately treating those states as stable.
- Event screens with no visible options should not emit a generic proceed action. Rest screens can require a short delay after choosing a rest option before proceed is valid.
- Menu screens can retain disabled character-select options after `embark` while the run is already starting. Disabled menu options should not become candidates, and run-start transition states should wait for the next real screen.
- Potion arrays can be sparse. Use the potion's raw `slot` identity when present, not the array index.
- Potions should only include an enemy target when raw target metadata says the potion targets an enemy.
- Automatic potions such as `Fairy in a Bottle` cannot be manually used even though they may appear in the potion list.
- Reward potion entries can remain visible when potion slots are full. The local generator should avoid direct `claim_reward` for blocked potion rewards and prefer proceed/skip or discard choices when available.

## STS2 Console As Debug Capability

The STS2 developer console is not part of the normal GameIO adapter and is not an agent capability. It is a debug/fixture tool that can dramatically reduce the cost of reproducing states for MCP debugging, adapter mismatch investigation, P8 workspace readiness sampling, P9 guarded-learning validation, and replay/eval fixture construction.

Console commands are version-dependent and may require `full_console` config or a console-enabler mod. Current public/community sources include:

- STS2 Mods command list: https://sts2mods.com/slay-the-spire-2-console-commands/
- Nexus Dev Console Enabler: https://www.nexusmods.com/slaythespire2/mods/245
- The Escapist command guide: https://www.escapistmagazine.com/news-slay-the-spire-2-console-commands/

Useful debug command groups:

- Speed/logs: `instant`, `log`, `getlogs`, `open`, `log-history`.
- ID/fact alignment: `unlock`, `dump`.
- Scene construction: `travel`, `act`, `room`, `fight`, `event`.
- State construction: `card`, `draw`, `energy`, `gold`, `relic`, `potion`, `block`, `damage`, `heal`.
- Boundary testing: `kill all`, `win`, `die`.

Rules:

- Console-modified runs must be tagged as debug/fixture data.
- Console-modified runs must not be used as real strategy baselines, win-rate evidence, or stable memory/derived/strategy evidence.
- Console commands must not replace candidate generation, validation, execution, or normal live strategy.
- Risky commands such as save deletion, leaderboard changes, achievement mutation, or crash/sentry tests are debug-only and should not be routine workflow.

Detailed workflows live in `STS2_CONSOLE_DEBUG_RUNBOOK.md`.

## Human Capture Levels

`snapshot`

- Only records state at a time.
- No selected action.
- `isGroundTruth=false`.

`diff_inferred`

- Compares pre/post states and legal candidates.
- May infer an action with confidence.
- Must include `candidateActions`, `uncertainty`, and `inferenceReason`.
- `isGroundTruth=false`.

`event_logged`

- Reads a real MCP/mod event, such as `CARD_PLAYED`.
- Can be ground truth if the event includes enough identity and timing data.
- Not available in the current STS2MCP adapter.

`executor_logged`

- Agent selected an action and sent it through the executor.
- `isGroundTruth=true` for selected action.
- Effects are still verified from post-state and checkpoint.

## Future Event API

Preferred endpoint:

```http
GET /api/v1/events?since=<eventId>
```

Required event types:

- `CARD_PLAYED`
- `TURN_ENDED`
- `REWARD_SELECTED`
- `MAP_NODE_SELECTED`
- `SHOP_PURCHASED`
- `POTION_USED`
- `EVENT_CHOICE_SELECTED`
- `REST_OPTION_SELECTED`
- `CARD_PURGED`
- `CARD_UPGRADED`
- `COMBAT_STARTED`
- `COMBAT_ENDED`
- `SCREEN_CHANGED`

Required fields:

- `eventId`
- `type`
- `source`
- `screen`
- `floor`
- `timestamp`
- `cardName`
- `cardInstanceId`
- `cardIndex`
- `targetId`
- `energyCost`
- `optionId`
- `preStateHash` or `preStateRef`
- `postStateHash` or `postStateRef`
- `rawEvent`
