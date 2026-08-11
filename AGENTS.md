# SpireAgent Engineering Guide

## Read Order

Before editing current behavior, read:

1. `README.md`
2. `docs/current/HUMAN_ENVIRONMENT_NEW_ENGINEER_GUIDE.md`
3. `docs/current/STATUS.md`
4. the component guide: `STS2MCP/AGENTS.md` or `Re-SpireAgent/AGENT.md`
5. the current HE protocol, coverage and integration documents

`docs/current/` is repository-level current truth. Dated audits and the
Bridge/Connector archives are evidence and history, not current instructions.

## Current Ownership

- `LiveHost` reads real player-visible state and identifies one input owner.
- `NativeUi` binds current native controls, objects and operands.
- `Authority` owns exact-environment admission, one controller and idempotency.
- `HumanEnvironment` owns canonical Observe/Read/Interact wire semantics.
- `Transport` exposes REST; `STS2MCP/mcp/` is an optional thin adapter.
- Re strictly decodes HE and projects finite model choices. It does not infer
  legality, effects, native operands or completion.

## Hard Shell

- STS2 owns rules, RNG, effects and native Commit paths.
- Exactly one current input owner and one mutation controller may act.
- Actions bind the exact snapshot, interaction, native target and operands.
- Execute-time revalidation happens before native mutation.
- Requests are idempotent; unknown delivery is terminal for automatic retry.
- Receipts preserve attribution and may include a successor snapshot.
- Reads are state-bound, read-only and non-authorizing.
- Hidden RNG, draw order and future content are never projected.
- Unknown owner, identity, target, authority or result fails closed.

## Evidence

Always separate source, tests, build, install, loaded identity, Live exercise,
journey and qualification. Never use an old artifact's Live evidence for a new
DLL. Mutable per-machine identity belongs in dated evidence or local deployment
records, not global current status.

## Validation

```bash
npm --prefix Re-SpireAgent run check
npm run check:docs
python -m py_compile STS2MCP/mcp/server.py
```

Run Gateway tests and Release build with the exact `STS2GameDir` described in
`STS2MCP/README.md`. Use `npm run deploy` only while the game is closed.
