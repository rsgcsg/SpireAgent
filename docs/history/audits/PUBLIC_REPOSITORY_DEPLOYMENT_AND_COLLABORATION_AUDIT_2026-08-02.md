# Public Repository Deployment And Collaboration Audit

Date: 2026-08-02

## Baseline

- repository: `rsgcsg/SpireAgent`;
- branch: `connectorV3`;
- audited commit: `b4fc517df9cc8feef746739a17a6889914024f03`;
- upstream: exact match at audit start;
- default branch: `main`;
- branch relation at audit start: `connectorV3` was 22 commits ahead and two
  commits behind `origin/main` from their merge base;
- worktree: clean before this audit.

This is a dated audit baseline, not a permanently current HEAD.

## Evidence Reviewed

- the full `b4fc517` diff and its Luminous Choir Gateway/Re/tests/docs slice;
- Gateway 260-test and Re 267-test suites plus repository checks;
- local built, installed and loaded artifact identity;
- `run-20260802104257-2ljjp3` metadata and all 81 decision records;
- current root, component, setup, status, roadmap, CI and operator files.

No secret value or provider response was copied into this report.

## Findings

### Critical: source and loaded artifact were different revisions

Current C# and Re source declared `3.0-preview.6`, while built, installed and
loaded artifacts were still `3.0-preview.5`, SHA
`dda1e348d7972f42c75768bdde9db5242f332c08bfb739c26fceef96385babcd`,
MVID `7446a1a2-4a7f-44c0-8c5c-ad95651a7ebd`. The running process correctly
reported `source_loaded_protocol_mismatch` and disabled mutation.

This was a deployment-provenance defect, not evidence that Re or the new event
transaction executed incorrectly. The repository previously compared DLL
hashes but could not prove that an existing `out/` DLL came from current source
while the game was offline.

Decision: build writes ignored provenance containing source revision/digest,
protocol and artifact SHA/MVID; install refuses missing or stale provenance.
Installed records are keyed by game directory so parallel local versions do
not overwrite one another.

### High: mutable local claims were committed as global current truth

`STATUS.md` fixed itself to parent commit `a53159b...`, then commit `b4fc517`
made the statement false. It also declared a different Preview.6 build/install
tuple and “game stopped”, while the audited machine actually had a running
Preview.5 process.

Decision: mutable status contains source architecture and links to immutable
evidence only. Per-machine built/installed/loaded truth comes from `doctor` and
`verify:loaded`. A machine check rejects future hard-coded “Fixed repository
HEAD” status text.

### High: the public setup path mixed three generations

The fresh-clone guide forced `develop` even though GitHub defaults to `main`
and active V3 work is on `connectorV3`; it first recommended safe CLI install,
then gave raw copy commands; loaded verification still used V2 routes and said
Re negotiated Bridge V2.

Decision: one root workflow now owns bootstrap, diagnosis, verified deploy,
cold-load verification and Re start. Manual copies are no longer the normal
path.

### Medium: collaboration controls did not match active development

CI ran on pushes to `develop`, not `main` or the shared `connectorV3` branch.
There was no PR or issue template requiring authority ownership, evidence
levels, non-claims or rollback. Branch roles and Agent handoff format were not
canonical.

Decision: CI covers current shared branches and more repository contract
checks. A development model and GitHub templates now define the handoff.

## Review Of `b4fc517` (`v3 closed`)

The commit is not a complete V3 closure despite its message. Its substantive
change is one bounded Preview.6 vertical slice for
`LuminousChoir.ReachIntoTheFlesh`:

- task-local source binding;
- exact two-card, non-cancelable selector facts;
- direct V3 select/deselect/preview-return/confirm;
- execute-time screen/card/source revalidation;
- native control Commit;
- exact removal, Spore Mind and event-finished Outcome;
- strict Re protocol/projection and negative tests.

The large source-specific adapter is justified by a unique parent event
transaction and effect witness; merging it with merchant or generic deck
selection by UI shape would be less correct. Existing automated tests pass and
no V2 action-ID lookup was found in this slice.

However, the slice is not exact-runtime proven. It was committed after the
latest reviewed Preview.5 run, and the machine had not built or loaded it.
Unknown event deck selectors remain correctly unsupported. The separate
Explosive Ampoule publication defect is acknowledged but not fixed by this
commit.

## Latest Run Attribution

`run-20260802104257-2ljjp3` used source `a53159b...` and exact loaded Preview.5
identity. It executed 80 settled V3 commands across combat, event, generated
replacement, map, reward, shop, game-over and menu, then stopped at the
completed-run menu rather than starting another game. There was no stale,
unknown or unsupported mutation in this run.

This proves a bounded Preview.5 journey for its exact tuple. It proves neither
Preview.6 behavior nor Organic qualification because provenance is
`unrecorded`.

## Public Project Decision

The public project remains source-buildable rather than a finished Workshop
release. The canonical user path is:

```text
bootstrap -> doctor -> verified deploy -> cold start -> verify loaded -> run
```

The canonical development path is topic branch -> vertical owner-scoped change
-> targeted/full checks -> current docs -> PR evidence matrix -> reviewed merge.
`connectorV3` remains temporary and must eventually be integrated into the
normal branch flow rather than becoming a permanent alternate release channel.

## Verified Local Deployment From This Audit

After the game exited normally, the new canonical `npm run deploy` path reran
all checks, built and installed:

- source revision: `b4fc517df9cc8feef746739a17a6889914024f03`;
- Gateway source digest:
  `658a5d53791cf4661bb6b81c5e9beeb1a91463567564b20f49d0895aac9531e5`;
- protocol: `3.0-preview.6`;
- built/installed SHA:
  `682b1bd647e795c9932648770bd266f010a9e5d7d4ad389eb540d3a6d8160ff7`;
- built/installed MVID: `717c7f91-1e6c-425d-8836-1581dd7562c0`;
- rollback snapshot:
  `STS2MCP/.local/deployments/2026-08-02T13-46-57-517Z`;
- cold-loaded SHA/MVID/protocol: exact match;
- loaded runtime: `4e5708f7126a4a7590f9835fe9d34b9d`;
- loaded game: `v0.110.1`, commit `db5d3552`;
- loaded Modset: `exact_bridge_only`, one canonical manifest.

The rollback snapshot contains the prior Preview.5 SHA/MVID. Local build,
installed provenance and deployment records are ignored and were not added to
Git.

This was read-only loaded-identity verification. Normal observation was
available and the Gateway reported bounded provisional-trial eligibility, but
Inspection/mutation were not yet enabled. No Preview.6 command, Luminous Choir
transaction, canary, journey, Organic evidence or durable qualification was
claimed.

## Non-Claims

- This audit does not qualify Preview.6.
- Passing CI cannot replace Gateway tests against proprietary exact-game
  assemblies.
- A verified install is not a loaded process.
- The repository still has V3 migration debt and is not yet a packaged public
  release.
