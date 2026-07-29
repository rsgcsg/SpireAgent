# Bridge v2 Current Status

This is the canonical component-level Gateway/Re boundary. Repository priority
and architecture are in [Current Status](../../../docs/current/STATUS.md) and
[ADR-0005](../../../docs/current/decisions/ADR-0005-workflow-c-clean-closure.md).

## Exact Truth

```text
Gateway/Re source      2.0-preview.75
Re normalized schema  30
source status          tested/built/installed; cold-load pending

built/installed        2.0-preview.75
game                   v0.109.1|c8c577f6|-820620422
built/installed SHA    ddce17cf4121bf009a371cbfd102b1174732eafc1cf7fafd8e226f3ec12f6334
built/installed MVID   23ac5aad-443b-47aa-9cb0-a55197d83cb4
last loaded contract   2.0-preview.74
last loaded SHA        42eb22b6cc0ee95679d4347bba2f319c1d02b06ae8bbfdebc9c48c6c85aaea7e
last loaded MVID       13d4dd05-61c3-470c-ba03-5af14dd9cf5b
last runtime epoch     5ed719fd1c6c43b0bff62866c96f4142
rollback               STS2MCP/.local/deployments/2026-07-29T09-13-35-338Z
```

Preview.75 build and installation are verified. No Preview.75 load,
Inspection/mutation canary, Organic journey or qualification is claimed yet.

## Current Contract

- `state.semantic_state_id` identifies semantic observation facts.
- `state.authority_projection_id` identifies current relevant authority.
- composite `state_id` binds both for stale-action protection.
- state no longer carries contract/identity shadows or full permission and
  qualification histories; those remain control-plane capabilities.
- every advertised action is internally bound to a catalog contract, source
  evidence, exact operands and state.
- explicit contracts admit publication/execution by contract digest. Remaining
  fallback rows temporarily retain operation-gated admission and are tracked as
  deletion debt.
- Re chooses only advertised action IDs and retains generic command polling and
  successor supervision. It does not reconstruct native legality or Outcome.

## Latest Evidence

Preview.74 run `run-20260729081310-529z79` completed a bounded run with 197
settled mutations in 202 decisions and four safe stale refusals. Adjacent runs
add 260 settled mutations and prove Self-Help Book enchantment, but not Kifuda
or shop relic purchase. Four runs stopped only because valid JSON contained a
`reasonBrief` longer than 240 characters. There was no latest-run unsupported,
unknown mutation, unsettled mutation, observation failure or Gateway failure.
All evidence is `unrecorded` coverage-only evidence; see the
[runtime audit](../../../docs/current/audits/WORKFLOW_C_PREVIEW74_RUNTIME_AND_PREVIEW75_PRELIVE_CLOSEOUT_2026-07-29.md).

## Clean Closure Inventory

```text
connector contract/identity shadows       0
production action publication paths       1
explicit native contracts                 7
explicit contract-digest admissions       7
fallback operation-gated contracts       80
control-history semantic identity inputs  0
Re native-completion reconstruction       0
```

The source-of-truth machine inventory is
[`CLEAN_CLOSURE_DELETION_INVENTORY.json`](CLEAN_CLOSURE_DELETION_INVENTORY.json).
Unknown rows may become typed unsupported or `code_required`; they must not be
fabricated into explicit contracts.

## First Pilot

`shop_inventory/purchase_shop_relic` now has an explicit contract and exact
BoundAction. Its command completes at native purchase commit after exact
gold/relic/entry-or-Kifuda-child evidence. Kifuda's enchant selector becomes the
next fresh Surface, whose action bindings include exact Kifuda source evidence.
No universal transaction or PendingObligation was added.

The pilot is implemented and fixture-tested only. Exact current-build ordinary
relic, Kifuda, wrong-source, stale-offer and child-owner evidence remains
required before Live qualification or old-family closeout.

## Preview.75 Reliability Boundary

- Re auditably bounds only an overlong non-authoritative `reasonBrief`; raw
  provider output remains recorded and all action-ID/schema checks remain.
- `migration_exploration` may expose `run_deck`, `combat_piles` and
  `shop_catalog` as volatile read-only canaries only after the same runtime has
  a source-resolved action scope and clean exact identity/Patch/Modset.
- Inspection remains state-bound, outside the command ledger and incapable of
  creating mutation authority or persistent qualification.

## Remaining Boundary

Current unsupported or evidence-limited scope includes Crystal Sphere,
standalone manual potion discard, Tutor ownership, unknown generated sources,
non-standard profile/menu paths, multiplayer and incomplete Inspection/detail
families. Next runtime action is Preview.75 cold-load identity verification,
then one Inspection-enabled bounded journey. Relic/Kifuda remains a separate
natural-evidence pilot.
