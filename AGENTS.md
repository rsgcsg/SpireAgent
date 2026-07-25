# SpireAgent Engineering Guide

## Current Mainline

This repository has two active implementations:

- `Re-SpireAgent/` is the rebuilt Agent runtime.
- `STS2MCP/` is the real-game Semantic Gateway, REST connector, and optional
  MCP adapter.

The original root-level SpireAgent runtime, its P8--P15 route, and the related
learning/rollout documents are archived under `archive/original-spireagent/`.
They are historical evidence, not current architecture or work instructions.
Do not revive, modify, or run that runtime unless a task explicitly names the
archive for historical investigation.

## Read Order

Before changing current behavior or documentation, read:

1. `README.md`
2. `docs/current/DOCUMENT_MAP.md`
3. `docs/current/STATUS.md`
4. the component guide: `Re-SpireAgent/AGENT.md` or `STS2MCP/AGENTS.md`
5. the component's current protocol, coverage, and integration documents

Use `docs/current/` for repository-level current truth. The current Bridge
source-truth and compatibility blocker belongs in
`STS2MCP/docs/bridge-v2/CURRENT_STATUS.md`.

## Hard Boundaries

- The Gateway is the authority for player-visible facts, legal action
  publication, execution-time validation, and completion truth.
- Re-SpireAgent chooses only from advertised actions. It must not reconstruct
  strict-v2 legality, native commits, or completion witnesses.
- Exactly one active Surface owns mutation actions at a time.
- Actions are opaque, state-bound, revalidated before execution, and do not
  retry unknown outcomes.
- Inspection is state-bound, read-only, independently authorized, and never
  grants mutation authority.
- Do not expose hidden RNG, draw order, future rewards/events, or other facts
  unavailable to a normal player.
- Unknown source identity, Modset, ownership, semantic binding, permission, or
  completion must fail closed.
- Do not add API keys, installed game assemblies, DLLs, local run artifacts,
  `.env.local`, or mutable runtime data to Git.

## Documentation Rules

- Current repository status: `docs/current/STATUS.md`.
- Current cross-component architecture: `docs/current/ARCHITECTURE.md`.
- Current roadmap and gates: `docs/current/ROADMAP.md`.
- Product, Companion, Workshop, BYOK, SDK, and Headless direction:
  `docs/current/PRODUCT.md` and its linked audit.
- Bridge protocol, coverage, permission, and live evidence:
  `STS2MCP/docs/bridge-v2/`.
- Re decision/runtime contract: `Re-SpireAgent/docs/`.
- Historical source/runtime material: `archive/`; never make it the only
  source for a current claim.

When a current behavior, permission, or support status changes, update the
relevant component document and `docs/current/STATUS.md` in the same change.
Run `npm run check:docs` after moving current Markdown files.

## Validation

For Re changes:

```bash
npm --prefix Re-SpireAgent run typecheck
npm --prefix Re-SpireAgent test
npm --prefix Re-SpireAgent run build
```

For Gateway changes, follow the environment-scoped commands in
`STS2MCP/README.md`, including C# tests, Python syntax checking, and a Release
build against the exact game installation. A fixture or build is not Organic
Qualification; record loaded identity and bounded real-game evidence separately.
