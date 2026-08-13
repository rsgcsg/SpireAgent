# Contributing

Read [AGENTS.md](AGENTS.md), the
[development model](docs/current/DEVELOPMENT_MODEL.md), and the owning module's
guide before editing.

## Scope

SpireAgent owns Agent/provider behavior, consumer projection, supervision,
recording, evaluation and product integration. Host observation, protocol,
native delivery and Connector SDK changes belong in
[`rsgcsg/STS2-Connector`](https://github.com/rsgcsg/STS2-Connector).

Do not add a local wire schema, native legality reconstruction or fallback
connector to make a consumer change easier.

## Validation

```bash
npm run bootstrap
npm run check
git diff --check
```

When a change requires a new Connector contract, release and test the
Connector package first, then update `connector-requirements.json` and Re in one
consumer commit.

Never commit `.env.local`, keys, game DLLs, installed artifacts,
`Re-SpireAgent/data/runs/`, provider output or mutable local configuration.
