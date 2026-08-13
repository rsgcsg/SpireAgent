# Workflow C Preview.78 Combat And Shop Explicit-Contract Wave Closeout

**Date:** 2026-07-30  
**Repository baseline:** `develop@913c057a4ca1f5300345c70c07ca4e2ff4c6e132`  
**Source protocol/schema:** `2.0-preview.78` / Re normalized schema `31`  
**Decision:** retain ADR-0006 and migrate two runtime-proven families from
manifest fallback identity to explicit native-contract identity.

This closeout records source, test, build and install truth. Preview.78 has not
yet been cold-loaded, so it contains no Preview.78 Live mutation, journey,
Organic or persistent-qualification claim.

## Latest Runtime Evidence And Attribution

`run-20260729145711-kh8d6k` used repository revision `913c057a...`, Prompt/guide
baseline `4/5`, loaded Preview.77 SHA
`9d6737b1e34e15b59f4d2d2bad8a239f21d771b0eef25ffedccb8048417edf8d`, MVID
`0a945d2d-0787-4f6d-a820-4947936aa6be`, runtime
`8dbfab27b2e5474d92fd0d9dfb197083`, exact `v0.109.1` bridge-only Modset and
`provenance=unrecorded`.

The exact predecessor environment used Modset fingerprint
`60c919e5ef850d6ea33abeaad840bdca7a6aecac169e8f5fed67b98b5419f5fb`,
clean-known-owner Patch digest
`ba7852fbfe6f940c4795b365646e4ae4f3fb4ee888a06c237fd61f6f018da70b`,
`migration_exploration` permission and `provisional_trial_scoped`
compatibility. Its schema-1 qualification projection was
`invalid_fail_closed`; the run used Gateway-owned encounter trials, not a
durable claim.

```text
decisions                    94
executed_and_settled         91
safe pre-execution stale      2
normal completed boundary     1
unsupported/unknown/unsettled 0
provider/parse failures       0
```

Both stale outcomes occurred while a reward claim changed before submit. Re
made no stale Gateway call, refreshed observation and continued. The final
non-actionable main-menu observation followed a completed-run boundary. These
are expected supervision boundaries, not Gateway failures.

The run exercised 37 `play_card`, 12 `end_turn`, one `use_potion`, one
`open_shop_inventory`, two `purchase_shop_card`, one `close_shop_inventory`
and one `proceed_shop` completion. It also exercised state-bound `run_deck` and
`combat_piles` Inspection. It did not exercise CombatPile selection, Kifuda or
New Leaf. The evidence is useful for choosing migration targets, but belongs
to Preview.77 and is not transferred to Preview.78.

## Migration Wave

### Ordinary combat

`combat_turn/play_card`, `combat_turn/use_potion` and
`combat_turn/end_turn` now have independent explicit contract revisions.
They share player-play-phase observation and binding mechanics but retain
different operands, native Commit paths and Outcome witnesses:

| Operation | Native Commit | Completion boundary |
|---|---|---|
| `play_card` | exact card `TryManualPlay` | `immediate_postcondition_observed` |
| `use_potion` | exact potion `EnqueueManualUse` | `immediate_postcondition_observed` |
| `end_turn` | native `PlayerCmd.EndTurn` | `immediate_postcondition_observed` |

### Ordinary shop

`shop_room/open_shop_inventory` was already explicit. Preview.78 adds explicit
contracts for `shop_room/proceed_shop`, `shop_inventory/close_shop_inventory`
and `shop_inventory/purchase_shop_card`. Shop card purchase keeps exact stock,
price, affordability and entity operands plus the native card-purchase Commit;
close/proceed remain continuation handoffs.

`purchase_shop_relic` remains its existing explicit contract. Potion purchase
and merchant removal remain migration fallbacks pending their own source and
Outcome review. Kifuda is not inferred from ordinary relic purchase.

This is option **C** from the architecture review vocabulary: shared typed
mechanics where native evidence repeats, while semantic operations retain
independent contracts. No universal combat transaction, purchase contract,
selector or second rules engine was introduced.

## Authority Cutover And Deletion

The six migrated operations now enter publication and execute-time admission
through their explicit contract digest. Their generated manifest fallback
identities are gone. Durable fallback packages remain impossible. No second
publication path, authority resolver, Provider or Re completion path was
added.

```text
explicit native contracts                    13 (was 7)
manifest session fallback identities         74 (was 80)
mixed explicit/fallback Surfaces               3 (was 4)
publication paths                              1
authority resolvers                            1
persistent fallback claim admission paths      0
operation-authority fallback branches          3
```

The three generic fallback branches are migration debt for the remaining 74
identities; they are not alternate authority for the six migrated operations.
Machine truth is in
`STS2MCP/docs/bridge-v2/CLEAN_CLOSURE_DELETION_INVENTORY.json`.

## Verification

```text
Gateway targeted tests       155/155 pass after correcting two obsolete tests
Gateway complete tests       199/199 pass
Re tests                     212/212 pass; typecheck/build pass
CLI/run identity             pass
docs/inventory/adaptation    pass
compatibility fixtures       6 pass, non-authorizing
permission fixtures          4 pass, non-authorizing
qualification/profiles/
migration fixtures           pass
Release build                0 warnings, 0 errors
```

The two initial targeted-test failures were test-expectation drift: a helper
constructed the pre-Preview.78 operation fingerprint, and a fallback-package
negative test selected newly explicit `play_card`. Production admission was
not loosened; the helper now uses the catalog fingerprint and the negative
test uses a genuine fallback operation.

## Build, Install And Rollback

```text
source/built/installed protocol 2.0-preview.78
built/installed SHA             2f3f6141a8dbc2e286b6a496aa9ed16bb2bee2784fadb585914ef1b73702b948
built/installed MVID            be29a156-4746-4e97-9334-c144e42b1462
deployment rollback             STS2MCP/.local/deployments/2026-07-29T15-40-32-760Z
loaded Preview.78               non-claim; game is closed
```

The old schema-1 local qualification ledger was already rejected as
`invalid_fail_closed`. It was preserved without migration at:

```text
mods/backups/qualification-ledgers/
STS2_MCP.qualifications.preview77-incompatible-2026-07-30T01-40-13.json
```

It is historical local evidence, not a Preview.78 permission source.

## Non-Claims And Next Gate

- Preview.78 combat/shop mutation and complete journey: `pending exact-runtime evidence`.
- Kifuda, New Leaf and CombatPile in the latest run: `not exercised`.
- durable qualification and persistent claim for these families: `non-claim`.
- cross-version or cross-Mod semantic equivalence: `non-claim`.

The next gate is a full game cold start followed by
`cd Re-SpireAgent && npm run agent:run`. Loaded SHA/MVID must match the installed
Preview.78 artifact before any new runtime claim is accepted.
