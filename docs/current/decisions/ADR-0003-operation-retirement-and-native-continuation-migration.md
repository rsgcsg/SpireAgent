# ADR-0003: Operation Retirement And Native Continuation Migration

## Status

Accepted on 2026-07-27 as a refinement of
[ADR-0002](ADR-0002-semantic-gateway-two-plane-target-architecture.md).
ADR-0002 remains the single macro architecture. This decision defines the
clean live-kernel migration and does not grant new runtime authority.

Repository ADR-0005 (2026-07-29) retains this destination but supersedes the
open-ended shadow/dual-read sequence below: experiments are bounded and deleted
on acceptance or rejection, formal identity has cut over directly, and family
migration is now mandatory for Clean Closure.

ADR-0006 (2026-07-30) supersedes this ADR's remaining mixed-identity admission:
`operation` may remain a temporary session fallback/telemetry key, but a
manifest-derived identity cannot become an installable or durable claim.

## Problem

The current `surface_kind + operation` key is simultaneously used for Prompt
intent, logging, manifest inventory, permission, qualification, quarantine,
settlement policy, and migration progress. Real evidence shows that these are
not one identity:

- `purchase_shop_relic` normally settles inside the merchant inventory, but
  Kifuda commits the purchase and then keeps the native parent task open while
  `NDeckEnchantSelectScreen` owns a child decision;
- one deck-enchant UI supports at least Self-Help Book and Kifuda with
  different source, bounds, eligibility, and parent continuation;
- eighty-two manifest fallback operation identities record intended coverage
  but do not prove owner, source, Commit, or Outcome equivalence;
- permission-history changes currently participate in composite state identity
  even when player-visible game semantics do not change.

Keeping `operation` as the final compatibility key would either over-authorize
new sources or force source-specific behavior back into Re and settlement
watchers.

## Decision

Retain the Semantic Gateway two-plane architecture, but migrate its live plane
toward a **Lean Native-Contract Semantic Kernel**:

```text
coherent decision snapshot
  + one native input owner
  + exact runtime source binding
  + bounded native adapter revision
  + exact operands and legality
  + native Commit
  + action-local outcome revision and completion boundary
  + optional minimal continuation handoff
  -> opaque BoundAction and CommandReceipt
```

`operation` remains optional, non-authorizing intent metadata for logs, Prompt
labels, replay search, and migration inventory. It is not the destination
permission, compatibility, quarantine, or semantic-completion identity.

The destination claim key is scoped by facts that can change independently:

```text
exact environment provenance
+ active owner / interaction family
+ runtime source binding
+ adapter revision
+ outcome revision and completion boundary
+ covered condition partition
```

The Compatibility/Evidence plane may compare and recommend claims over those
dimensions. The Gateway alone validates a claim and publishes an action.

## Continuation Boundary

Ordinary closed actions continue to compose from fresh observations. A
continuation handoff is admitted only when exact native evidence proves all of
the following:

1. the parent mutation has committed;
2. the native parent task remains open;
3. one exact child owner now controls input;
4. the child is source-bound to that parent;
5. completing or cancelling the child determines the parent continuation.

The receipt may then complete at
`continuation_handoff_observed`. This is not `transaction_settled`. The fresh
child observation publishes its own state-bound actions. No executable
workflow graph or Effect DSL is introduced.

Kifuda is the first accepted instance. The shop purchase owns gold deduction
and relic acquisition; the exact Kifuda/Adroit selector is a separately owned
child. Self-Help Book uses the same native selector class but a different
source contract. Unknown deck-enchant sources remain fail closed.

## Migration

1. Emit non-authorizing runtime contract/source shadow metadata from exact
   providers. Do not infer it from operation names or localized text.
2. Preserve current operation-scoped permission as authority while C# and Re
   fixtures compare shadow identity against representative menu, map, shop,
   combat, reward, and selector families.
3. Move action-local completion boundary and evidence into CommandReceipt.
4. Remove Re settlement branches that reconstruct operation-specific semantic
   completion after Gateway receipts provide sufficient evidence.
5. Introduce scoped claim keys only after dual-read evidence proves publication
   and execute-time enforcement parity. Keep an immediate operation-key
   rollback until that migration closes.
6. Retire generic fallback operation identities from authority; retain them as
   inventory/test-confirm hypotheses.
7. Remove `operation` from permission and qualification identity only after all
   currently supported families have an exact native-contract mapping or an
   explicit fail-closed row.

Preview.70 completes a non-authorizing inventory distinction within steps 1
and 2: five explicit contracts expose component digests and expected
completion boundaries, while 82 manifest-derived rows are labeled hypotheses
and expose no contract digest. This does not satisfy runtime-source coverage,
publication/execute parity, or the claim-key migration gate.

Preview.71 applies the migration rule to one evidence-backed failure rather
than expanding the abstraction speculatively. `treasure_room/open_treasure_chest`
becomes the sixth explicit candidate, and one shared lifecycle classifier now
drives both treasure projection and its action-local completion predicate. The
remaining 81 rows stay manifest hypotheses. This is still non-authorizing and
does not permit operation-key retirement.

## Rejected Alternatives

- **Immediate global operation deletion:** unsafe because current Gateway
  permissions still depend on it and no equivalent claim path is qualified.
- **Universal selector/purchase/workflow/transaction DSL:** it would create a
  second game model and erase source, Commit, and completion differences.
- **Source names in Re:** this would move game semantics out of the Gateway.
- **Treating handoff as full settlement:** this would make downstream evidence
  unable to distinguish committed parent work from a closed native transaction.
- **Keeping the qualification OS as the final live model:** exact packages and
  rollback remain useful migration tooling, but package/operation counts are
  not semantic coverage.

## Safety And Rollback

This ADR changes the destination and migration order, not current authority.
Unknown source, owner, identity, completion, or child binding still fails
closed. Unknown mutation outcome remains non-retryable. If shadow metadata or
handoff logic disagrees with native runtime evidence, suppress only the
affected contract and return to the last exact operation-scoped behavior.
