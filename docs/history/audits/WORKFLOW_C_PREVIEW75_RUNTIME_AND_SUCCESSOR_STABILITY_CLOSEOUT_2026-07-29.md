# Workflow C Preview.75 Runtime And Successor Stability Closeout

**Baseline:** `develop` at `364f4543b23a82c7868d9a0d395ca590726ec454`  
**Status:** exact-runtime evidence audited; engineering/build/install complete; cold-load and post-change Live comparison pending  
**Architecture authority:** ADR-0002 plus ADR-0005

## Verdict

Retain the Semantic Gateway two-plane architecture and the vertical family
migration. Correct one supervision boundary: Gateway command completion proves
an action-local native outcome, but it does not guarantee that the first
actionable successor is quiet enough to justify another paid model decision.

Re therefore observes a repeatable actionable successor before returning from
post-command settlement. This is transition supervision, not native completion
reconstruction. Gateway authority, action IDs, execute-time revalidation,
native Commit, Witness, permissions and unknown-no-retry are unchanged.

Rejected alternatives:

- weakening state binding or retrying a stale action;
- remapping an old semantic choice onto a fresh action ID in Re;
- waiting for every future native side effect inside each Gateway Outcome;
- introducing a universal transaction, selector or PendingObligation;
- treating a fixed sleep as game truth.

## Exact Runtime Evidence

All three new records declare clean Re source revision `364f454...`, Prompt v4,
guide v5 and `unrecorded` provenance. The first two share this exact loaded
environment:

```text
protocol     2.0-preview.75
Gateway SHA  ddce17cf4121bf009a371cbfd102b1174732eafc1cf7fafd8e226f3ec12f6334
Gateway MVID 23ac5aad-443b-47aa-9cb0-a55197d83cb4
runtime      fc2ea037f66846d39e7eb826d6df7220
game         v0.109.1|c8c577f6|-820620422
Modset       cb71a1d1f6dda83d212b4ffb3d07231f27b23c90dfc9389b35bdafda4b512d4f
Patch        ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
```

| Run | Decisions | Settled | Safe stale | Termination |
|---|---:|---:|---:|---|
| `run-20260729094605-ycbsur` | 175 | 171 | 2 | completed run boundary |
| `run-20260729112408-jltj8f` | 282 | 258 | 23 | completed run boundary |
| `run-20260729115445-1rhnwe` | 2 recorded | 2 | 0 | no summary; process stopped during decision 3 |

Neither completed run contains unsupported, invalid, provider failure,
observation failure, unsettled mutation or unknown mutation. The incomplete run
proves two settled menu operations only; the absent response and summary do not
prove a Connector or provider failure.

Preview.75 Inspection is exercised, not merely decoded:

- the 175-decision run captured `run_deck` 171 times and `combat_piles` 123 times;
- the 282-decision run captured `run_deck` 281 times, `combat_piles` 195 times
  and `shop_catalog` 10 times;
- every capture remained state-bound and non-authorizing.

Because provenance is `unrecorded`, this is exact-runtime coverage evidence,
not Organic Qualification or a persistent compatibility claim.

## Root Cause Of Stale Decisions

The 282-decision run contains 23 pre-commit stale refusals: 22 in
`combat_turn`, one in `treasure_room`. Formal identity audit reports 17
semantic-plus-authority changes and six semantic-only changes. No stale record
is composite-only or missing formal identity.

The combat records show a concrete sequence rather than an abstract race. At
ticks 2 and 3, `play_card` reached its exact action-local Gateway Witness and
Re accepted the first actionable successor after one poll. During the next
model call, native queued effects continued changing visible enemy HP/status
and hand contents. The selected state-bound action was then correctly rejected
before submission. Thirteen stale records still had the same kind and exact
operands on the fresh state; ten did not. Neither set may be auto-remapped or
retried.

This proves two things:

1. stale rejection is required and worked;
2. first-actionable-checkpoint supervision wastes model calls during ordinary
   native state evolution.

## Implemented Correction

`SettlementWatcher` now distinguishes:

- Gateway-confirmed command outcome;
- coherent unsupported or non-actionable successor, which can be returned
  immediately because no model action follows;
- actionable successor, which must repeat with the same full `stateHash` on a
  consecutive observation before the next decision.

Changing actionable successors reset the candidate. Transient coherent-read
drift still resets it. A timeout or read failure after a confirmed command
remains `executed_checkpoint_pending`, preserves the last changed successor,
and never retries the mutation.

Fixtures cover an intermediate actionable state changing into a final stable
state, an action-preceding confirmed token, a transitional timeout, a coherent
unsupported successor and generic read failure.

## First Family Pilot Evidence

Run `run-20260729112408-jltj8f`, tick 56, exercised exact
`shop_inventory/purchase_shop_relic`:

- selected Bronze Scales at the advertised exact shop entry for 137 gold;
- native command evidence was
  `shop_relic_purchase_committed_with_exact_relic_gold_and_entry_witness`;
- completion boundary was `native_commit_observed`;
- gold changed from 193 to 56 and exact `BRONZE_SCALES` entered owned relics;
- The Courier replaced the same inventory slot with Tiny Mailbox, exercising
  the explicit entry-replacement Outcome branch;
- the successor retained coherent `run_deck` and `shop_catalog` Inspections.

This closes the current-build ordinary relic positive half of the pilot. No
Kifuda source or enchant child occurred, so child handoff, Kifuda negative
cases, durable qualification and family old-path deletion remain open.

## Validation And Non-Claims

Completed before the final deployment pass:

- targeted Re runtime tests: 29/29;
- Re typecheck;
- recorded-run formal identity audit;
- current loaded environment inspection.

Final validation completed:

- Re typecheck, 212/212 tests and production build;
- Gateway 195/195 tests and zero-warning Release build;
- Connector CLI, run-identity, compatibility, binding, permission,
  qualification, profile, migration, documentation and clean-closure checks;
- new built/installed SHA
  `f9819b6b24ed71245cee711a2844c32fa2c1b666fce6b3f412f1bd71efc721ee`;
- new built/installed MVID `34d6deb3-f4b7-43bf-89ad-a9e596380410`;
- single canonical Mod manifest and rollback snapshot
  `STS2MCP/.local/deployments/2026-07-29T12-26-37-794Z`.

The Gateway source and protocol did not change, but rebuilding produced a new
whole-DLL identity. The game is closed and the new MVID is not loaded. The
runtime evidence above remains scoped to `ddce17cf...` / `23ac5aad...` and
grants no authority to the installed artifact.

Not claimed:

- post-change stale-rate improvement before another exact-runtime run;
- loaded identity or any action on installed MVID `34d6deb3...`;
- Organic or persistent qualification;
- Kifuda or complete shop family migration;
- full vanilla, Mod, cross-version or multiplayer coverage;
- transaction-settled semantics for ordinary card play.
