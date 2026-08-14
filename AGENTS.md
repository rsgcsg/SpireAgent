# SpireAgent Engineering Guide

## Read Order

1. `README.md`
2. `docs/current/STATUS.md`
3. `docs/current/ARCHITECTURE.md`
4. `docs/current/DEVELOPMENT_MODEL.md`
5. `Re-SpireAgent/AGENT.md`
6. `Re-SpireAgent/docs/PLAYER_ENVIRONMENT_INTEGRATION.md`

`docs/current/` is current SpireAgent truth. `docs/history/` and `archive/`
are non-production evidence.

## Ownership

- Re owns normalization, prompts, providers, model-choice projection,
  supervision and recording.
- D reads run records and cannot grant live authority.
- Product integration declares Connector requirements and coordinates releases.
- `STS2-Connector` exclusively owns the Host, protocol, SDK, transports,
  native execution and Connector evidence.

Do not copy wire validators or Connector source back into this repository.
Changes to the game contract belong in the standalone Connector first.

## Hard Shell

- Consume only a complete finite current BoundAction projection.
- Never invent legality, native operands, hidden facts or game effects.
- Preserve exact snapshot/action/controller binding.
- Submit a request once; unknown delivery is terminal for automatic retry.
- Treat Reads as snapshot-bound, read-only and non-authorizing.
- Do not turn a Receipt into business-effect proof.

## Validation

```bash
npm run check
git diff --check
```

Report source, tests and recorded-run evidence separately from Connector build,
install, loaded runtime and Live evidence.
