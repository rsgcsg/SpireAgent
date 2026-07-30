# ADR-0006: Explicit Native Contract And Durable Authority Convergence

**Status:** Accepted  
**Date:** 2026-07-30

## Context

ADR-0002's Semantic Gateway two-plane boundary remains correct. ADR-0003 and
ADR-0005 also correctly require `operation` to leave final authority identity.
The implementation nevertheless combined two meanings in one
`BridgeOperationQualificationIdentity`:

- seven reviewed explicit native contracts; and
- eighty identities synthesized from the non-authorizing operation manifest.

Both had a contract-shaped digest, completion boundary, Witness and risk class.
The package assembler and Gateway store consequently allowed a manifest
fallback to become durable authority after runtime evidence. This contradicted
the stated architecture: a generic Gateway-reported receipt can quarantine a
volatile trial, but does not prove a stable owner/source/Commit/Outcome
contract across restart or environment migration.

The exact Preview.76 run `run-20260729140216-qi8r24` completed one bounded
172-decision journey with 170 settled mutations, one safe pre-execution stale
refusal and a normal run boundary. It proves useful continuity of the current
session fallback, not semantic equivalence of the eighty fallback families.

## Decision

Retain the Semantic Gateway two-plane macro architecture and vertical family
migration. Replace the mixed durable-admission core with a typed boundary:

```text
explicit_native_contract
  reviewed owner + source + operands + native Commit + Outcome revision
  eligible for exact session candidate and durable qualification lifecycle

manifest_migration_fallback
  operation inventory plus runtime-local provider receipt
  eligible only for volatile encounter trial and quarantine
  never eligible for durable package, reload, supersede or rollback authority
```

Every contract projection and evidence environment carries `contract_kind`.
Every current durable package must carry
`contract_kind=explicit_native_contract`. The Gateway and operator ledger both
fail closed on missing, legacy or fallback kinds. Old package data remains
readable only as invalid/inapplicable evidence.

`operation` remains a stable human-readable action label, telemetry/replay key
and temporary runtime fallback key. It must leave final publication/execution
admission, durable claim identity, compatibility equivalence and completion
identity as each supported family migrates.

## Authority Lifecycle

```text
current native owner/source/operands
  -> explicit contract revision or typed migration fallback
  -> exact runtime-bound session scope
  -> publication and execute-time revalidation
  -> native Commit and action-local Outcome
  -> session confirmation or minimum-scope quarantine

explicit contract only:
  typed evidence -> candidate package -> exact session canary
  -> multi-epoch evidence -> durable qualification
  -> reload/revoke/supersede/rollback with exact environment validation
```

D tooling may collect fallback evidence and recommend `code_required`, but may
not assemble or install a fallback qualification. The Gateway remains the only
live authority in both branches.

## Consequences

- Protocol becomes `2.0-preview.77`; qualification-system schema becomes `2`.
- Contract digests change because contract kind is part of identity.
- Existing current-protocol packages without explicit kind fail closed.
- Session encounter trials remain available for bounded ordinary continuity;
  no new permission mode or authority path is added.
- Four mixed-generation Surfaces remain migration debt: shop room, shop
  inventory, treasure and deck enchant.
- Unknown families remain typed fallback, `code_required`, unsupported or
  out-of-scope. They are not fabricated into explicit contracts to reduce a
  counter.

## Supersession

- ADR-0002 remains the macro architecture.
- ADR-0004's separation of observation, session trial and durable claim remains.
- ADR-0005's vertical migration and mandatory deletion remain.
- This ADR supersedes ADR-0003/0004/0005 wording that allowed manifest-derived
  identities to become installable candidate or durable qualification packages.

## Verification And Rollback

Required source checks prove:

- explicit packages still assemble, reload, revoke, supersede and roll back;
- fallback packages are rejected by both C# store and operator CLI;
- fallback encounter trial remains runtime-bound;
- Re records kind but never derives authority from it;
- protocol/schema mismatch fails closed.

Rollback is whole-artifact restore. Rolling back may restore the previous
Preview.76 behavior, but no Preview.77 runtime or qualification evidence may be
attributed to that artifact.

## Preview.78 Implementation Note

The first post-decision batch confirms the intended migration shape rather
than changing this ADR. Three ordinary combat operations and three ordinary
shop operations moved from generated manifest fallback identity to explicit
native-contract identity. Shared mechanics were retained only where source
and runtime evidence repeat; card play, potion use, end turn, shop card
purchase and navigation still have independent operands, native Commit and
Outcome revisions.

The catalog now has 13 explicit contracts and 74 volatile fallbacks. Shop room
is no longer mixed-generation; shop inventory remains mixed because potion
purchase and merchant removal have not yet received the same family review.
Preview.78 does not add a publication path, authority resolver, durable
fallback or universal transaction abstraction. Exact-runtime evidence remains
required after its new DLL identity is loaded.

## Preview.79 Implementation Note

Preview.79 validates the same decision against the three remaining mixed
supported Surfaces. Shop potion/removal handoff, the remaining treasure
lifecycle, and reversible deck-enchant controls now use explicit catalog
digests while retaining independent native Commit and Outcome contracts.
`deck_enchant_selection/confirm_selection` also tightens its reviewed source
set to the exact Self-Help Book and Kifuda bindings.

This cutover leaves `22` explicit contracts, `65` volatile manifest fallbacks
and zero supported Surface mixing. It does not claim Preview.79 Live evidence,
Kifuda, New Leaf, CombatPile, shop-potion or treasure-skip qualification. See
the [Preview.79 closeout](../audits/WORKFLOW_C_PREVIEW79_MIXED_SURFACE_CONVERGENCE_CLOSEOUT_2026-07-30.md).
