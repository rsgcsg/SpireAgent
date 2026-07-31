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

```bash
npm install
cp .env.example .env.local
```

Put the real provider key only in `.env.local`. `STS2_MCP_PROTOCOL` may only be
`v3`.

## Checks

```bash
npm run check
```

This runs typecheck, tests and the production build.

## Live Run

Build and install the Gateway from the repository root, cold-start STS2, then:

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

During the first cutover, Re reads a same-runtime Bridge v2 capabilities
sidecar only to populate the mature semantic/environment projection. It never
imports v2 actions or executes a v2 action ID. This sidecar is explicit
migration debt.

## Evidence

Local runs are written under `data/runs/` by default. They may contain provider
outputs and must not be committed. Source, tests, build, install, load, canary,
journey and durable qualification are separate evidence levels.

## Current Limits

V3 read-only detail/Inspection is pending. Non-combat execution still uses
bounded internal Provider native bindings until each family moves to the V3
Native Command Catalog. Unknown interactions remain visible and fail closed.
