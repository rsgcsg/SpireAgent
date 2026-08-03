# Connector V3 State Coverage

This file records the Re consumer boundary. Gateway implementation and
exact-runtime evidence are canonical in
[Connector V3 Coverage](../../STS2MCP/docs/connector-v3/COVERAGE.md).

## Current Contract

Re strictly accepts `3.0-preview.12` capabilities, control, observations and
receipts. It preserves:

- exact Gateway, game, Modset, runtime and Patch identity;
- permission policy, exact operation scopes and qualification identity;
- state token, active interaction and exact entity/control operands;
- semantic context, current Surface and persistent player facts;
- visible unsupported and known settling without invented commands;
- `completed`, `not_executed`, `pending` and `unknown`.

Re emits choices only from the current V3 candidate set. It does not request a
V2 sidecar, add operand domains, rebuild legality/effects or reconstruct native
completion.

## Coverage

| Area | Re implementation | Automated evidence | Preview.11 Live baseline / Preview.12 pending |
|---|---|---|---|
| capability/control/identity | strict direct V3 | schema, scope and lease tests | observed |
| observation/receipt | strict direct V3 | identity/lifecycle tests | observed |
| combat | typed V3 commands | card/potion/target/end-turn tests | card/end-turn receipts observed; not every potion |
| combat hand/pile | typed selectors | stage/membership/command tests | reversible hand and pile actions observed; hand confirm repair pending |
| menus/map/events/game-over | typed facts/candidates | owner/control/entity tests | direct actions and completed boundary observed |
| shops/rest/treasure/rewards | typed facts/candidates | source/capacity/Outcome tests | direct receipts observed; rest repair pending |
| generated choice | Gateway source-local operation parity | mismatch/skip/binding/holdout tests | Quasar exposed Preview.11 Re drift; repair pending |
| upgrade/removal/enchant | independent selectors | stage/source/Outcome tests | supported sources observed; unknown source failed closed |
| transform/Wood Carvings | independent selectors | source/effect/stage tests | incomplete; one Wood action hit controller lease conflict |
| Inspection | typed state-token reads | current/stale tests | final reads pending |
| linked detail | bounded Surface card | entity/token tests | final reads pending |
| compact Prompt | projection v1 | payload/hash/dedup tests | provider boundary reached |

Preview.11 produced one exact-artifact 203-decision completed Journey and one
provider-only terminal among 44 runs. Preview.12 has no Live evidence until a
new cold load; historical MVID evidence never grants its authority.

## Fail-Closed Rules

- Unknown protocol/schema, malformed candidate, identity drift, stale state,
  replacement entity, missing control or command-set mismatch produces no
  action.
- `unknown` and transport uncertainty stop without mutation retry.
- Hidden RNG, draw order, future rewards/events/enemy moves and private game
  state are never normalized.
- Empty permission/qualification scope grants nothing.
- Human evidence, fixture, build, install and historical Journey cannot
  authorize a current command.
