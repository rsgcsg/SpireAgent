# Preview.53 Graveblast Combat-Pile Source Binding Canary

Status: exact v0.109 source audited; bounded Bridge/Re contract, tests, Release
build, install, and cold load completed. The final preview.53 MVID did not
naturally execute Graveblast, so the branch is canary-permitted, not qualified.

## Natural Defect And Source Audit

A strict-v2 organic combat reached `NCombatPileCardSelectScreen` after native
Graveblast. Preview.52 correctly returned `unsupported + authority=none`: only
Headbutt had an exact source contract. Exact v0.109 source shows Graveblast
selects exactly one discard card, then adds that same instance to combat hand;
native `CardPileCmd.Add` redirects it back to discard when the hand is full.

## Architecture Decision

Decision: **C - share exact-one discard-selection mechanics while retaining
source-discriminated semantic contracts and witnesses**.

Headbutt and Graveblast share the active Surface kind, visible selector, state
binding, and execute-time holder revalidation. They do not share purpose,
destination, overflow policy, action kind, or Completion. Every other caller,
including Mod-derived behavior, remains fail closed. No universal selector or
effect language was introduced.

## Completion

Graveblast completes only when the source task finished, the child closed, the
selected exact reference came from baseline discard and not baseline hand, and:

- it appears in hand and leaves discard when baseline hand had capacity; or
- it remains in discard and is absent from hand when baseline hand was full.

Combined hand/discard cardinality must be unchanged. Screen closure alone is
never success.

## Verification And Evidence Limit

- Bridge tests: `98/98` pass.
- Re tests: `149/149` pass.
- Re typecheck and production build: pass.
- Bridge Release build: zero warnings/errors.
- Preview.53 Release/installed SHA:
  `89a817a9d73d985a672b844ecca8573ee90b59b7d8ba0c4303f525781fb0fb62`.
- Loaded MVID: `5e88a4ff-3b4e-429e-af54-be263be10b25`.
- Loaded runtime: `dcc4548f1b4c4a8fa44233d36898a6b8`.
- Exact Modset fingerprint:
  `5849e66bd8d1fa1667aa640c03395d3772f2d3be39b3b68e8d10292bee1730b5`.

The saved combat did not replay Graveblast on this MVID. It naturally played
Splash instead and exposed the next missing source contract. Therefore this
document records implementation/load evidence, not Organic qualification.

Rollback is preview.52 plus Re normalized schema 23. Rollback must restore the
safe unsupported outcome for Graveblast.
