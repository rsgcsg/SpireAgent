# Headless STS2 Future Subproject

Status: documentation only; implementation deferred.

SpireAgent does not currently contain, run, qualify, or authorize a Headless
STS2 host. This directory records a future subproject boundary so Headless work
does not leak into the current live Bridge, Re-SpireAgent, permissions, or
evidence.

The current real-game connection is defined by
[Live STS2 Connection Boundary](../../STS2MCP/docs/bridge-v2/LIVE_GAME_CONNECTION_BOUNDARY.md).
The future design, admission gate, phases, and acceptance criteria are in
[TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md).

## Current Decision

- Headless is a separate future subproject, not `headless=true` inside a live
  Provider.
- It may eventually live in this monorepo, but it must have its own host
  identity, build, setup, tests, runtime process, patch inventory, evidence,
  permission scope, and release artifact.
- It may reuse reviewed protocol-neutral contracts and pure safety machinery;
  it must not inherit live bindings, evidence, qualification, or permission.
- No substantive Headless code should be added until the admission gate is
  explicitly passed.
- No game DLL, patched DLL, PCK, game asset, local run output, or proprietary
  fixture may be committed.

The `wuhao21/sts2-cli` project is a useful primary implementation reference,
not an adopted SpireAgent architecture or evidence source. Source review alone
does not qualify either project.

