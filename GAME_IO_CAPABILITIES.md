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

## Current STS2MCP REST Capability Assessment

Based on local source inspection and live endpoint shape:

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
