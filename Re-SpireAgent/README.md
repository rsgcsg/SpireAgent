# Re-SpireAgent

Re is the current LLM consumer for Player Environment C. It strictly decodes one
snapshot, imports its complete finite bound actions, asks the model to select
one local choice, submits that exact opaque handle once and observes progress.

Re owns strategy and flow supervision. It does not own STS2 legality, native
operands, input delivery, hidden information or game effects.

## Setup

From the repository root:

```bash
npm run bootstrap
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
npm run doctor
```

Keep provider keys in `.env.local` or the process environment. The only current
protocol mode is `player_environment`.

## Check And Run

```bash
npm --prefix Re-SpireAgent run check
npm run deploy
```

Cold-start STS2, then:

```bash
npm run verify:loaded
cd Re-SpireAgent
npm run agent:run
```

The runtime accepts only `bound_action`. `delivered` means native input
delivery; Re then waits for a stable successor. `not_delivered` requires a fresh
snapshot and `unknown` stops without retry.

Memoryless consumers may use `prefetchPlayerEnvironmentDecisionBundle` to
aggregate advertised reads from one coherent snapshot. This creates no facts or
authority. See [integration](docs/PLAYER_ENVIRONMENT_INTEGRATION.md).
