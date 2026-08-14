# Standalone Connector Cutover Closeout

Date: 2026-08-13

Status: source ownership cut over; public Connector/package publication still
pending

## Baseline And Evidence

The cutover began from SpireAgent
`4bc448f1fbfa034232b88587faf9a51ea2a15581` on
`human_equivalent_connector`. The history-preserving extraction and all Host
product work moved to the sibling `STS2-Connector` repository. This document is
historical migration evidence, not a second copy of the Connector contract.

The current local loaded Connector Host is source
`f104e16b6585599e6acf5481c255fa74ea1d221e`, protocol `1.0-rc.2`, DLL
SHA-256
`8540a7ff54b26a1d34e9565636815272a0ad7a13b75cca4439a2d09d611a3157`,
MVID `a4b5cdac-3b9b-444a-8def-9d7a2f58f4a4`, runtime
`91ebf7a4c1e9415d874c6985cc3cfe2c`, game `v0.110.1/db5d3552`, and the exact
Connector-only Modset. Standalone evidence and release verdicts remain owned by
that repository.

## Ownership Removed From SpireAgent

- the entire active `STS2MCP/` Host/build/test/transport tree;
- the duplicate machine-readable Player Environment contract;
- C-owned deploy, identity, CLI, boundary and protocol tools;
- duplicate TypeScript wire schemas, REST client, controller session and Read
  decision-bundle implementation;
- current Bridge/V2/V3/C architecture and audit documents.

Historical records were moved under `docs/history/`. They cannot be used as
current build or runtime instructions.

## Remaining Consumer Boundary

Re imports `@rsgcsg/sts2-connector-client@1.0.0-rc.1`, accepts protocol
`1.0-rc.2`, and retains only a thin adapter, raw transport wrapper and combat
presentation parser. It owns normalization, model-choice presentation,
provider calls, progress supervision and recording. It does not own native
operands, legality, Commit, controller authority or Receipt truth.

An ambiguous submit response is looked up once through the Connector's
idempotent ledger using the same request ID. Re never re-submits it and stops on
an unresolved or explicit `unknown` outcome.

## Defects Found During Cutover

| Finding | Owner | Resolution |
|---|---|---|
| stale 409 Receipt was discarded by the old local client | Connector SDK | fixed in standalone client and tested |
| transport loss immediately became unknown despite a durable request ledger | Re transport consumer | poll same request once; never re-submit; fixture-tested |
| cycle guard retained changing `choiceId` as semantic progress | Re supervision | strip transport identity; fixture-tested |
| retired Connector keys prevented local inspect | operator configuration | removed locally; secrets and current settings preserved |

The final Host runtime also found and fixed a combat-pile hidden/missing
classification defect in the standalone repository. It was not reclassified as
an Agent defect.

## Validation

- Re strict typecheck, 69 tests and production build passed;
- active documentation, current-truth, requirements and run-identity checks
  passed;
- production and full npm dependency audits passed after patch-level lockfile
  remediation;
- `agent:inspect` consumed the standalone SDK and current loaded runtime without
  acquiring mutation authority;
- `git diff --check` passed before the cutover commit.

## Remaining Publication Boundary

The local sibling dependency is a coordinated-development source, not an
ordinary-user channel. Public GitHub source/tag, binary release and SDK package
publication remain external release gates. SpireAgent must switch from the
explicit sibling source to the exact published package without restoring any
Host or schema ownership.
