# Contributing

SpireAgent is a public multi-developer project. Start with
[the development model](docs/current/DEVELOPMENT_MODEL.md), [AGENTS.md](AGENTS.md)
and the owning component guide.

## Before Editing

```bash
git fetch origin
git status --short --branch
git rev-parse HEAD
npm run bootstrap
npm run doctor
```

Use a topic branch for independent work. Do not force-push a shared test branch
or overwrite another developer's dirty worktree. Keep behavior changes,
protocol/schema updates, tests and current documentation in one reviewable
vertical slice.

## Ownership

- `Re-SpireAgent/`: provider calls, strict decode, projection, supervision and
  recording.
- `STS2MCP/`: player-visible facts, current owner, finite bound actions,
  execute-time native validation, native input delivery, REST and optional MCP.
- `tools/` and `docs/current/`: non-authorizing operator workflow and current
  cross-component truth.

Do not move Host legality or delivery truth into Re or grant additional authority
through REST, MCP, fixtures, manifests or documentation.

## Validation

At minimum:

```bash
npm run check
npm run check:docs
npm run check:connector-cli
git diff --check
```

Player Environment Host changes also require the exact local STS2 assemblies:

```bash
npm run connector -- test
npm run connector -- build
```

GitHub Actions cannot access proprietary game assemblies, so local Host test
and build evidence must be reported honestly. Use `npm run deploy` for a safe
local install and `npm run verify:loaded` only after a cold start.

## Pull Requests

Use the repository PR template. Report source, test, build, installed, loaded
and Live evidence separately. Include exact SHA/MVID/runtime only when actually
observed, list non-claims, and provide rollback for production or deployment
changes.

Never commit `.env.local`, keys, game DLLs, `data/runs/`, `out/`, `.local/`,
installed artifacts, mutable qualification stores or unreviewed provider
output. Historical material under `archive/` is not active source.
