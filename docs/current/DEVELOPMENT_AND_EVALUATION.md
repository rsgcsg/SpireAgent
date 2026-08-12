# Internal Development And Evaluation

D is the non-authorizing engineering lane for fixtures, evidence, replay and
evaluation. It consumes C and A records; it never changes Player Environment
facts, BoundActions, controller state or native input delivery.

## Ownership

| D owns | D never owns |
|---|---|
| schema and boundary checks | player-visible truth |
| deterministic negative fixtures | native binding or game legality |
| read-only run/evidence inspection | controller leases or input delivery |
| prompt/provider comparisons | A strategy policy |
| regression reports and limitations | permission, qualification or rollout authority |

## Current Tools

- `npm run check` verifies Re plus current contracts, docs, CLI and identity
  tooling.
- `npm run connector -- test` adds exact-assembly Host tests and Python syntax.
- `agent:replay` reads append-only records; it is not deterministic game replay.
- `agent:baseline-report` produces a redacted, non-authorizing per-run summary.
- prompt audit/shadow commands compare consumer representations without
  executing a game action.
- `audit-run-identity` checks recorded identity and stale-refusal evidence.

Historical V2/V3 compatibility graders, operation inventories, permission
transitions, qualification ledgers and migration orchestrators were deleted
from the current toolchain when their production authority graph was removed.
Git history retains them as historical evidence; they are not C1 checks.

## Evidence Rules

Recorded evidence must preserve source revision/digest, protocol, artifact
SHA/MVID, runtime, game and Modset when available. Fixture, build, install,
loaded identity, Live mutation and journey are different claims. Old runs that
lack current identity fields remain readable but identity-incomplete.

Provider output and full local run directories remain private local data.
Reviewed reports include only the minimum non-secret facts needed for a claim.

## Deferred Work

A general scenario corpus, deterministic game replay host, Headless conformance,
training evaluation and product SDK are separate later projects. They must not
create a second C truth or legality authority merely to improve evaluation.
