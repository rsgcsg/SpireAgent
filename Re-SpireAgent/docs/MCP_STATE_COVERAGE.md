# Connector V3 State Coverage

This file records the Re consumer boundary. Gateway implementation and
exact-runtime evidence are canonical in
[Connector V3 Coverage](../../STS2MCP/docs/connector-v3/COVERAGE.md).

## Current Contract

Re strictly accepts `3.0-preview.9` observations and receipts. It preserves:

- exact Gateway, game, Modset and runtime identity;
- state token, active interaction and exact entity/control operands;
- semantic context, visible Surface and persistent player facts;
- visible unsupported and known settling interactions without commands;
- `completed`, `not_executed`, `pending` and `unknown` receipts.

Re emits choices only from the current V3 candidate set. It does not request a
V2 capability/state sidecar, execute a V2 action ID, add operand domains,
rebuild STS2 legality or reconstruct native completion.

## Source Coverage

| Area | Re implementation | Automated evidence | Exact Preview.9 runtime |
|---|---|---|---|
| observation/receipt/identity | strict direct V3 | schema, identity and receipt tests | pending cold load |
| combat | direct typed commands | card/potion/target/end-turn tests | targetless potion pending |
| combat-hand/combat-pile | direct typed selectors | stage, membership and command-set tests | pending final lifecycle |
| menus/map/events/game-over | direct typed facts/candidates | owner/control/entity negatives | earlier artifacts exercised |
| shops/rest/treasure/rewards | direct typed facts/candidates | offer/source/capacity/stage tests | earlier artifacts exercised |
| generated choices | source-operation and selectable-set parity | mismatch, extra-command, skip and binding tests | earlier Attack Potion only |
| upgrade/removal/enchant | independent direct selectors | full stage/source/Outcome tests | selected earlier sources |
| transform/Wood Carvings | independent direct selectors | source/effect/stage/command-set tests | pending |
| bundle/event removal | independent direct transactions | atomic/whole-Outcome tests | source-specific evidence pending |
| Inspection | typed state-token reads | strict decode and stale negatives | Preview.5 run deck only |
| linked detail | bounded current-Surface card | strict entity/token tests | Preview.5 current/stale |

## Fail-Closed Rules

- Unknown protocol, malformed candidate, identity drift, stale state,
  replacement entity, missing native control or command-set mismatch produces
  no action.
- `unknown` and transport uncertainty stop without mutation retry.
- Hidden RNG, draw order, future rewards/events/enemy moves and private game
  state are never normalized.
- Empty permission scope grants nothing. Fixture, build, install and historical
  journeys cannot qualify the current artifact.
