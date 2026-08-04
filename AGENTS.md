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

For any shared-branch, deployment or handoff task, also read
`docs/current/DEVELOPMENT_MODEL.md`. Record branch, exact HEAD, upstream and
worktree before editing. Do not overwrite unexplained changes or force-push a
shared branch.

Use `docs/current/` for repository-level current truth. Human-Equivalent
protocol and coverage belong in `STS2MCP/docs/human-equivalent/`. Connector V3
and Bridge v2 documents are rollback, migration and evidence history.

## Hard Boundaries

- The Gateway is authority for player-visible UI facts, current owner,
  affordance admission, execute-time target validation and input delivery.
- Re-SpireAgent chooses only current HE opaque affordance IDs. It interprets
  successors but must not reconstruct native legality or input delivery.
- Exactly one active interaction owns mutation commands at a time.
- Commands bind exact state, interaction and entity identities, are revalidated
  before execution, and do not retry unknown outcomes.
- Inspection is state-bound, read-only, independently authorized, and never
  grants mutation authority.
- Do not expose hidden RNG, draw order, future rewards/events, or other facts
  unavailable to a normal player.
- Unknown business source is not an input gate when the exact current UI target
  is observable and actionable. Unknown owner/target/delivery still fails
  closed; unknown delivery is never retried.
- Do not add API keys, installed game assemblies, DLLs, local run artifacts,
  `.env.local`, or mutable runtime data to Git.

## Documentation Rules

- Current repository status: `docs/current/STATUS.md`.
- Current cross-component architecture: `docs/current/ARCHITECTURE.md`.
- Current roadmap and gates: `docs/current/ROADMAP.md`.
- Product, Companion, Workshop, BYOK, SDK, and Headless direction:
  `docs/current/PRODUCT.md` and its linked audit.
- Connector protocol and coverage: `STS2MCP/docs/human-equivalent/`.
- Re decision/runtime contract: `Re-SpireAgent/docs/`.
- Historical source/runtime material: `archive/`; never make it the only
  source for a current claim.

When a current behavior, permission, or support status changes, update the
relevant component document and `docs/current/STATUS.md` in the same change.
Run `npm run check:docs` after moving current Markdown files.

Do not hard-code a mutable repository HEAD or one machine's current
built/installed/loaded tuple as global current truth. Put exact runtime tuples
in dated evidence records; use `npm run doctor` and `npm run verify:loaded` for
per-machine truth. A handoff must separate source, tests, build, install, load,
Live exercise and qualification.

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

For a coherent local deployment, prefer `npm run deploy` over manual copies.
It records source-to-artifact provenance, backs up the old Gateway and refuses
to install while the game is running.
