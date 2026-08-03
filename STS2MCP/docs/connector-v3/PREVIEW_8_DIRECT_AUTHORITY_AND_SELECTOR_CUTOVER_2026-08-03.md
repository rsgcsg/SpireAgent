# Connector V3 Preview.8 Direct Authority And Selector Cutover

Status: source, test, Release build and install verified; loaded and Live are
non-claims until a cold start reports the new artifact.

## Reviewed Preview.7 Runtime Evidence

All three reviewed runs used source revision
`95bb5602804a8f6e56eb94908e5017a570562377`, protocol `3.0-preview.7`, SHA
`b57f5a1625d40960afa0d65295ed63c77ddad62c374919e67df856eb681682a6`,
MVID `06a1b410-3655-474a-bc53-14d688698155`, runtime
`d3720aad7bdb408e8a4a613e5a04a52c`, game `v0.110.1` commit `db5d3552` and
the exact-bridge-only Modset. Re negotiated direct Connector V3 with
`v2_consumer_projection_sidecar=false`.

- `run-20260803002010-j047xf` reached Merchant deck removal after 100
  completed commands, one lifecycle wait and one safely recovered stale
  refusal, then stopped with no admitted candidate.
- `run-20260803003126-vodpdt` reproduced that same Merchant boundary in one
  decision.
- `run-20260803003138-awi3r5` completed an ordinary single-player journey:
  202 commands were completed with Gateway receipts and successors, then Re
  stopped at the expected completed-run main-menu boundary.

The evidence provenance is `unrecorded`. It is exact-runtime journey coverage,
not Organic evidence, persistent qualification or a durable claim.

## Root Cause

Direct V3 selector candidates had become independent of Provider
`draft.Actions`, but encounter authority was still synthesized only from those
draft actions. Merchant removal therefore required authority before publishing
the candidate while authority required the missing Provider candidate. This
was a Gateway admission defect, not a native game failure, Re failure or Agent
strategy error.

Preview.8 admits exact, non-executing direct command descriptors as encounter
candidates. Only descriptors that resolve to an explicit native contract may
create a runtime-epoch-bound trial scope. Manifest fallback, static similarity,
fixtures and D tooling remain non-authorizing. Publication and execution still
share exact state, interaction, owner, source, operand and contract identity,
and execution performs native revalidation before Commit.

## Cutover Scope

The source now removes Provider action publication for these additional V3
families while retaining their audited native Commit and Outcome code:

- combat-hand selection;
- Smith deck upgrade;
- reward claim;
- rest-site options and proceed;
- Precise Scissors relic removal;
- event card acquisition;
- generated-card choices split into source-specific operation contracts.

Generated-card choices no longer share one result contract merely because
their screens look alike. Lead Paperweight, Hefty Tablet, combat potion,
Splash, Quasar and Knowledge Demon keep distinct source and completion
identities.

## Machine-Checked Boundary

The native contract catalog contains 83 explicit contracts and 11 fallback
contracts. The remaining fallback set is intentionally limited to:

- two combat-pile contracts;
- six deck-transform contracts;
- three Wood Carvings contracts.

Those are three different native transaction models. They remain typed
migration debt rather than being bulk-promoted without source and runtime
evidence. Persistent qualification of fallback contracts remains impossible.

## Verification And Non-Claims

- targeted Gateway tests: passed;
- complete Gateway tests: 265/265 passed;
- Re check: 16 test files and 272 tests passed, with typecheck and build;
- Clean Closure inventory: 83 explicit, 11 fallback;
- Release build/install protocol: `3.0-preview.8`;
- built and installed SHA:
  `26c5baaeaa24cfe6e8665693c4e7e45486df45f8cab65a2d74ebc2d6bac2e529`;
- built and installed MVID: `d1476ec1-4da8-4658-b594-6fea40de3ca0`;
- source digest:
  `f5f15621488f16e586408e67daedd5d2a31d2bb5cd2309a09043e3e8facd09c8`;
- rollback snapshot:
  `STS2MCP/.local/deployments/2026-08-03T01-28-07-244Z` (local, ignored);
- Preview.8 loaded identity and exact-runtime mutation: non-claim;
- Kifuda, New Leaf, remaining combat-pile/deck-transform and Wood Carvings
  behavior under Preview.8: not exercised.

Preview.7 evidence does not transfer authority to Preview.8. The next evidence
gate is a cold load followed by one ordinary journey, with particular attention
to Merchant removal and at least one newly direct rest/generated/event source.

The local artifact rollback command is:

```bash
npm run connector -- restore-known-environment \
  --backup STS2MCP/.local/deployments/2026-08-03T01-28-07-244Z
```
