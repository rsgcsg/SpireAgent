# ADR-0006: Explicit Native Contract And Durable Authority Convergence

> Superseded as current Connector architecture by
> [ADR-0007](ADR-0007-connector-v3-canonical-architecture.md). Its prohibition
> on durable fallback authority remains retained.

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

## Preview.80 Implementation Note

Preview.80 applies the decision to five complete standard-run boundary
Surfaces: single-player submenu, character select, event options, card rewards
and game over. Their 13 operations now have distinct explicit owner, source,
operand, native Commit, completion boundary and Witness revisions. Provider
Witness constants are mechanically compared with the catalog.

The cutover leaves `35` explicit contracts, `52` volatile fallbacks and zero
supported mixed Surfaces. It deliberately excludes `reward_claim`, Rest and
combat selectors. Reward subtype identity remains incomplete, while Rest and
CombatPile operations span distinct source or condition partitions. The
current `surface + operation` volatile key is insufficient for durable
authority over those partitions. Preview.79 runtime coverage does not
authorize Preview.80. See the
[Preview.80 closeout](../audits/WORKFLOW_C_PREVIEW80_STANDARD_RUN_BOUNDARY_CONTRACT_WAVE_CLOSEOUT_2026-07-30.md).

## Preview.81 Implementation Note

Preview.81 applies the same decision to four complete source-closed Surfaces:
merchant removal, `CardRemovalReward`, Scroll Boxes bundle selection and
ancient event dialogue. Their 14 operations now have distinct explicit
contracts, and Provider Witness constants are mechanically compared with the
catalog.

The cutover leaves `49` explicit contracts, `38` volatile fallbacks and zero
supported mixed Surfaces. It deliberately does not transfer merchant removal
evidence to Precise Scissors, selector mechanics to generic Deck Upgrade, or
one source/condition result to Deck Transform/New Leaf or Wood Carvings.
Those families remain fallback until their contract/evidence partition can be
represented without sibling authorization. See the
[Preview.81 closeout](../audits/WORKFLOW_C_PREVIEW81_SOURCE_CLOSED_SELECTOR_CONTRACT_WAVE_CLOSEOUT_2026-07-30.md).

## Preview.82 Implementation Note

Preview.82 validates the architecture against a native input mode that is not a
route choice. `map_navigation/exit_map_annotation` is an explicit contract
with its own exact source binding, native `StopDrawing` Commit and
annotation-closure Outcome. It reuses map observation mechanics but does not
reuse the route operand or completion contract.

This leaves `50` explicit contracts, `38` volatile fallbacks and one
publication/authority path. The private drawing input remains inside the
Gateway's state-bound action and execution revalidation; Re imports only the
opaque action and visible map-screen binding. The related Re stale-rejection
repair also preserves the ADR boundary: an exact non-mutating stale receipt
causes fresh observation, while unknown mutation remains terminal. P81 defect
evidence does not authorize P82. See the
[Preview.82 closeout](../audits/WORKFLOW_C_PREVIEW82_RUNTIME_RECOVERY_CLOSEOUT_2026-07-30.md).
