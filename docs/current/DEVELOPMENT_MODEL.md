# Development Model

This document defines how humans and coding agents share the public repository
without confusing source, deployment and runtime truth.

## Branch Roles

| Branch | Role |
|---|---|
| `main` | Public default and reviewed distribution source |
| `develop` | Integration target for coherent changes before promotion |
| `human_equivalent_connector` | Current shared HE migration and exact-runtime validation branch |
| `connectorV3` | Superseded V3 history and explicit rollback comparison |
| topic branch | Preferred location for one developer or Agent's PR-sized change |

The default branch is what a fresh clone receives. A feature branch must never
be described as a public release merely because it is newer. The HE branch must
be reviewed into `develop` and then `main`; neither HE nor `connectorV3` is a
permanent third release channel.

Before work:

```bash
git fetch origin
git status --short --branch
git rev-parse HEAD
git rev-parse '@{upstream}'
```

Do not pull over unexplained local edits. Shared branches use fast-forward-only
pulls; never force-push a branch other people are actively testing.

## One Change, One Owner, One Handoff

Each change identifies the component that owns the behavior:

- Gateway/C: player-visible UI observation, active owner/entity/control
  binding, affordance admission, execute-time validation, native input delivery
  and delivery uncertainty;
- Re: strict decode, decision projection, provider invocation, receipt polling,
  successor supervision and run recording;
- REST/MCP: transport only;
- D tooling: optional non-authorizing source/business annotations, audit and evidence;
- docs/operator shell: reproducible setup, diagnosis and rollback.

A Connector family change should be vertically complete rather than scattered
across unrelated commits: source/owner, operands, publication, execution,
Outcome, Re consumption, tests, protocol/coverage and evidence boundary.

Every handoff and PR states:

```text
branch and exact HEAD
working-tree status
scope and authority owner
files changed
tests actually run
source protocol/schema impact
built and installed SHA/MVID, if performed
loaded SHA/MVID/runtime, if observed
Live surfaces actually exercised
non-claims and rollback
next exact task
```

Never use “works”, “deployed” or “qualified” without naming the evidence level.

## Truth And Evidence

Truth is ordered by scope, not optimism:

1. current source and canonical contracts;
2. automated tests/fixtures;
3. Release build provenance;
4. installed artifact identity;
5. loaded process identity;
6. exact-runtime canary or bounded journey;
7. independently reviewed Organic evidence;
8. persistent qualification bound to its exact environment.

One level does not imply the next. Runtime identity belongs in a dated evidence
record or local CLI output, not as mutable global truth in `STATUS.md`. The
repository status may cite an immutable run, but current per-machine truth is
always obtained with `npm run doctor` and `npm run verify:loaded`.

## Required Workflow

1. Read `AGENTS.md`, `docs/current/DOCUMENT_MAP.md`, `STATUS.md` and the owning
   component guide.
2. Confirm the target branch/upstream and protect existing work.
3. Prove the defect or contract gap before changing production behavior.
4. Keep each authority decision in its owning layer; do not add silent fallback.
5. Run targeted tests, then the complete relevant checks.
6. Update current protocol/coverage/status in the same change.
7. Run `npm run check:docs` and `git diff --check`.
8. For a local deploy, use `npm run deploy`; do not hand-copy the DLL.
9. Record loaded/Live evidence only after a cold start reports the exact tuple.

CI cannot compile the Gateway without proprietary STS2 assemblies. A green PR
therefore proves Re and repository contracts only. The PR author remains
responsible for exact local C# tests/build evidence when Gateway code changes.

## Current Delivery Direction

Short term:

- cold-load and exercise the current Human Environment artifact in both
  `he_assisted` and `he_pure` without transferring V3 evidence;
- close exact-runtime UI coverage defects as bounded native mechanics, not new
  business source gates;
- complete player-visible Inspection, linked detail and reveal opportunities;
- keep fresh-clone deployment and rollback reproducible across machines.

Medium term:

- establish a reviewed ordinary-vanilla support envelope with typed stops;
- keep exact target binding, single-writer delivery and unknown-no-retry while
  validating the current neutral `LiveHost`/`NativeUi` ownership;
- promote the coherent Human Environment branch through normal review after
  new-artifact Live evidence.

Later, separately gated work includes Workshop packaging, Companion, public
Agent SDK, Headless and learning. None may move game legality, Commit or
completion out of the Gateway.

## Repository Hygiene

Never commit API keys, `.env.local`, proprietary assemblies, built/installed
DLLs, local deployment metadata, mutable qualifications, full run directories
or secret provider output. Generated outputs are rebuilt locally. Reviewed
evidence documents contain only the minimum non-secret facts needed to support
their claims.
