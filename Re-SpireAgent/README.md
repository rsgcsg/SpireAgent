# Re-SpireAgent

Re is the current LLM consumer of the STS2 Connector Player Environment. It
strictly decodes one Snapshot, imports its complete finite BoundActions, asks
the model to select one local choice and submits that exact opaque handle once.

Re owns strategy and progress supervision. It does not own STS2 legality,
native operands, input delivery, hidden information or effects.

## Setup And Check

From the SpireAgent root:

```bash
npm run bootstrap
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
npm run check
```

Keep provider keys in `.env.local` or the process environment. Install and
start a compatible standalone Connector, then:

```bash
cd Re-SpireAgent
npm run agent:run
```

`not_delivered` requires a fresh Snapshot. `unknown` stops without retry.
Memoryless consumers may use the Connector SDK's coherent decision-bundle
helper; it creates no facts or authority.

See [Player Environment integration](docs/PLAYER_ENVIRONMENT_INTEGRATION.md).
