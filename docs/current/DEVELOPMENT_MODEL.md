# Development Model

This document keeps a multi-developer public repository from confusing source,
deployment and runtime truth.

## Branch Roles

| Branch | Role |
|---|---|
| `main` | public default and reviewed distribution source |
| `develop` | integration target before promotion |
| `human_equivalent_connector` | current Player Environment C1 migration and runtime-seal branch |
| `connectorV3` | superseded implementation history |
| topic branch | preferred scope for one reviewable change |

A feature branch is not a public release merely because it is newer. Shared
branches use fast-forward-only pulls and must never be force-pushed while other
people are testing them.

Before work:

```bash
git fetch origin
git status --short --branch
git rev-parse HEAD
git rev-parse '@{upstream}'
```

Do not pull over unexplained local edits.

## One Change, One Owner

- **LiveHost:** player-visible extraction and current owner/readiness.
- **NativeUi:** private native controls, exact operands and delivery callback.
- **Identity/Control:** artifact/runtime identity, one writer and idempotency.
- **PlayerEnvironment:** Snapshot, Read, BoundAction, stale submission, Receipt
  and successor.
- **Re:** strict decode, model projection, provider invocation, progress
  supervision and local run recording.
- **REST/MCP:** transport only.
- **D/P:** non-authorizing evaluation and deployment/rollback.

A vertical interaction change includes visible extraction, exact binding,
public projection, execute-time revalidation, Receipt, tests, coverage and its
evidence boundary. It must not introduce a source whitelist in Re or a second
executor.

Every handoff states:

```text
branch and exact HEAD
working-tree status
scope and owning layer
files changed
tests actually run
protocol/schema impact
built and installed SHA/MVID, if performed
loaded SHA/MVID/runtime, if observed
Live interactions actually exercised
non-claims and rollback
next exact task
```

## Evidence Levels

1. current source and canonical contract;
2. automated tests and deterministic fixtures;
3. Release build provenance;
4. installed artifact identity;
5. loaded process identity;
6. exact-runtime mutation or bounded journey;
7. reviewed same-artifact conformance evidence.

One level never implies the next. Per-machine identity comes from
`npm run doctor` and `npm run verify:loaded`; dated evidence may cite immutable
runs, but mutable local state does not belong in current architecture docs.

## Required Workflow

1. Read `AGENTS.md`, `DOCUMENT_MAP.md`, `STATUS.md` and the component guide.
2. Confirm branch/upstream and protect existing work.
3. Prove the defect or contract gap before changing production behavior.
4. Keep every authority decision in its owning layer; add no silent fallback.
5. Run targeted tests, then complete relevant checks.
6. Update protocol, coverage and current status in the same change.
7. Run `npm run check` and `git diff --check`.
8. Use `npm run deploy` while STS2 is closed; never hand-copy the DLL.
9. Record loaded/Live evidence only after a cold start reports the exact tuple.

CI cannot compile the Host without proprietary STS2 assemblies. Green public
CI therefore proves Re and repository contracts only; a Host change requires
explicit local C# test/build evidence.

## Current Direction

Short term: finish one rc1 source/build/install/load tuple, exercise ordinary
Player Environment-only journeys, stale Read/Action refusal, source-free
selectors and optional native-page recovery, then decide C1 freeze.

After C1, strategy work moves to A. Headless, Training, Search, learning and
transient PlayerCue remain separate programs unless exact evidence reopens a C
fact/read/action/delivery defect.

## Repository Hygiene

Never commit API keys, `.env.local`, proprietary assemblies, built/installed
DLLs, local deployment metadata, full run directories or provider output.
Generated outputs are rebuilt locally. Reviewed evidence contains only the
minimum non-secret facts needed for its claim.
