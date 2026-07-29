# Bridge v2 Current Status

This is the canonical component-level Gateway/Re boundary. Repository priority
and architecture are in [Current Status](../../../docs/current/STATUS.md) and
[ADR-0005](../../../docs/current/decisions/ADR-0005-workflow-c-clean-closure.md).

## Exact Truth

```text
Gateway/Re source      2.0-preview.74
Re normalized schema  30
source status          tested/built/installed; cold-load pending

built/installed        2.0-preview.74
game                   v0.109.1|c8c577f6|-820620422
built/installed SHA    42eb22b6cc0ee95679d4347bba2f319c1d02b06ae8bbfdebc9c48c6c85aaea7e
built/installed MVID   13d4dd05-61c3-470c-ba03-5af14dd9cf5b
last loaded contract   2.0-preview.73
last loaded SHA        f6b2d2687add4719e7d04f6b3beb8b5b386f43208d7af1cc0b12e2d89a151b18
last loaded MVID       f67e272a-ca3f-4eac-8d41-6e287b144c8a
last runtime epoch     2123fefaf9434f34a86ae8533e3322a5
rollback               STS2MCP/.local/deployments/2026-07-29T07-08-28-094Z
```

Preview.74 build and installation are verified. No Preview.74 load, mutation
canary, Organic journey or qualification is claimed yet.

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

Preview.73 run `run-20260729061142-32o3xz` completed a saved-run boundary with
94 settled mutations in 95 decisions and no Connector failure. It is
`unrecorded` coverage evidence and did not exercise Inspection or shop
relic/Kifuda. The preceding `run-20260729060301-mlwq4k` settled 143 mutations
and safely rejected three stale decisions before its terminal decision hit an
LLM output-contract failure. An earlier run without a summary remains
incomplete.

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

The pilot is implemented and fixture-tested only. Exact Preview.74 ordinary
relic, Kifuda, wrong-source, stale-offer and child-owner evidence remains
required before Live qualification or old-family closeout.

## Remaining Boundary

Current unsupported or evidence-limited scope includes Crystal Sphere,
standalone manual potion discard, Tutor ownership, unknown generated sources,
non-standard profile/menu paths, multiplayer and incomplete Inspection/detail
families. Next runtime action is cold-load identity verification followed by
bounded pilot and Inspection journeys.
