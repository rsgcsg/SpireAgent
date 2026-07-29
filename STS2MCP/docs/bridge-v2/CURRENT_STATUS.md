# Bridge v2 Current Status

This is the canonical component-level Gateway/Re boundary. Repository priority
and architecture are in [Current Status](../../../docs/current/STATUS.md) and
[ADR-0005](../../../docs/current/decisions/ADR-0005-workflow-c-clean-closure.md).

## Exact Truth

```text
Gateway/Re source      2.0-preview.75
Re normalized schema  30
source status          tested/built/installed; new MVID cold-load pending

built/installed        2.0-preview.75
game                   v0.109.1|c8c577f6|-820620422
built/installed SHA    f9819b6b24ed71245cee711a2844c32fa2c1b666fce6b3f412f1bd71efc721ee
built/installed MVID   34d6deb3-f4b7-43bf-89ad-a9e596380410
last loaded contract   2.0-preview.75
last loaded SHA        ddce17cf4121bf009a371cbfd102b1174732eafc1cf7fafd8e226f3ec12f6334
last loaded MVID       23ac5aad-443b-47aa-9cb0-a55197d83cb4
last runtime epoch     fc2ea037f66846d39e7eb826d6df7220
rollback               STS2MCP/.local/deployments/2026-07-29T12-26-37-794Z
```

The prior Preview.75 DLL load and broad bounded mutation/Inspection coverage
are verified. A same-source rebuild is installed with a new MVID; it is not
loaded and inherits no runtime grant. No Organic journey or persistent
qualification is claimed.

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
- Gateway command completion remains action-local. Re requires a repeatable
  actionable successor before another model call; coherent unsupported and
  non-actionable successors do not gain action authority.

## Latest Evidence

Preview.75 runs `run-20260729094605-ycbsur` and
`run-20260729112408-jltj8f` completed bounded runs with 429 settled mutations
in 457 decisions and 25 safe stale refusals. They had no unsupported, unknown
mutation, unsettled mutation, observation failure or provider failure. Exact
Inspection captured `run_deck`, `combat_piles` and `shop_catalog`. All evidence
is `unrecorded` coverage-only evidence; see the
[runtime audit](../../../docs/current/audits/WORKFLOW_C_PREVIEW75_RUNTIME_AND_SUCCESSOR_STABILITY_CLOSEOUT_2026-07-29.md).

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

Exact current-build ordinary relic purchase is now exercised with Bronze
Scales, gold `193 -> 56`, exact relic ownership and Courier replacement of the
same slot with Tiny Mailbox. Kifuda, wrong-source, stale-offer and child-owner
evidence remains required before qualification or old-family closeout.

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
families. Next runtime action is one post-Re-supervision bounded journey to
measure actionable-successor stabilization. Kifuda remains a natural-evidence
pilot gate.
