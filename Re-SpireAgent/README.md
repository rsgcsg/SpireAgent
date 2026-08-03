# Re-SpireAgent

Re-SpireAgent is the strict LLM consumer for Connector V3. It normalizes the
current observation, projects bounded choices from Gateway command candidates,
asks the configured model to choose one local opaque ID, submits the exact
parameterized command and supervises its receipt and successor observation.

Re does not own STS2 legality, native Commit, authority or completion.

Current component details:

- [V3 integration contract](docs/CONNECTOR_V3_INTEGRATION.md)
- [V3 state coverage](docs/MCP_STATE_COVERAGE.md)

## Setup

From the repository root (preferred):

```bash
npm run bootstrap
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
npm run doctor
```

Put the real provider key only in `.env.local`. `STS2_MCP_PROTOCOL` may only be
`v3`. See the root [local deployment guide](../docs/current/LOCAL_SETUP.md) for
custom Steam paths and multi-machine setup.

## Checks

```bash
npm run check
```

This runs typecheck, tests and the production build.

## Live Run

With STS2 closed, run `npm run deploy` from the repository root. Cold-start the
game and run `npm run verify:loaded`, then:

```bash
cd Re-SpireAgent
npm run agent:run
```

The command delegates to the repository Connector CLI. It verifies loaded V3
protocol, exact SHA/MVID/runtime, game, Modset and permission before starting.

## V3 Consumer Contract

- Re accepts only `connector_v3_command` choices projected from the latest
  state token and interaction.
- Operand domains come from the Gateway; Re does not add legal targets.
- A stale local choice is rejected before submission.
- `pending` polls the same request ID.
- `unknown` terminates and is never retried.
- Gateway `completed` is native Outcome authority; Re separately waits for a
  stable successor before the next model decision.

Menu, event, map, game-over, reward/card-reward, shop, rest, treasure,
combat-hand, combat-pile, deck-upgrade, deck-transform, Wood Carvings,
generated-card choice and all current removal/bundle selectors use a direct V3
consumer. Re does not request Bridge v2 capabilities/state, import v2 actions
or execute a v2 action ID.

The V3 client also exposes typed, state-token-bound read-only Inspection for
run deck, combat piles and shop catalog plus bounded `surface_card` linked
detail. Neither read path grants mutation; stale reads require a fresh
observation.

The production Prompt uses deterministic compact projection v1: one exact
action menu, decision-relevant visible facts and the necessary information
boundary. Full normalized evidence remains recorded. The optional
`native_pages.v1` Human profile is Gateway operator evidence and is never
invoked by normal Re decision flow.

## Evidence

Local runs are written under `data/runs/` by default. They may contain provider
outputs and must not be committed. Source, tests, build, install, load, canary,
journey and durable qualification are separate evidence levels.

## Current Limits

Preview.12 is a conditional freeze candidate. Preview.11 supplied an exact
203-decision completed Journey and exposed Quasar consumer drift, rest witness
drift, a combat-hand unknown boundary and interrupted controller cleanup.
Preview.12 repairs those paths and removes Re's generated-source whitelist;
its cold-load and changed-path Live evidence remain pending. Unknown
interactions remain visible and fail closed, and no session result is durable
qualification.
