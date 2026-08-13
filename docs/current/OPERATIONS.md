# Operations

## Agent

```bash
npm run doctor
npm run check
cd Re-SpireAgent
npm run agent:inspect
npm run agent:run
```

`agent:run` records the current Re source revision, digest and worktree status,
then starts the bounded run. A stale or not-delivered action requires a fresh
Snapshot. An ambiguous submit response may be looked up once by the same
request ID; unknown delivery is never retried.

## Connector

Build, install, rollback and `verify:loaded` are Connector operations. Use the
versioned release or the commands documented by the standalone repository.
SpireAgent deliberately contains no Host build/deploy implementation.

Do not expose the local REST endpoint outside the machine. Controller leases
coordinate cooperative consumers; they are not authentication against a
malicious local process.
