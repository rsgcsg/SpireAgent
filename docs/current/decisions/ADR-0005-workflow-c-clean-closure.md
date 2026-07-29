# ADR-0005: Workflow C Clean Closure And Vertical Native-Contract Migration

**Status:** Accepted  
**Date:** 2026-07-29

## Context

ADR-0002 remains the accepted two-plane Semantic Gateway architecture. ADR-0003
correctly rejects operation names as the final compatibility identity, but its
shadow/dual-read-first wording allowed a permanent half-migrated state. The
current repository had reached that state: two non-authorizing shadow DTOs were
on the live state wire, permission and qualification histories influenced the
composite state identity, and most operation contracts were synthesized from a
manifest rather than proved from native source and runtime outcomes.

At the same time, exact Preview.73 run `run-20260729061142-32o3xz` completed a
95-decision saved-run boundary with 94 settled mutations and no unsupported,
stale, invalid, observation, provider, unsettled, or unknown outcome. This is
strong bounded coverage evidence, but its provenance is `unrecorded`, it did
not exercise Inspection or the shop relic/Kifuda family, and it is not
qualification evidence.

The Connector therefore needs a clean closure rather than either a big-bang
rewrite or indefinite migration scaffolding.

## Decision

Workflow C Clean Closure is the current repository priority before additional
feature tracks. The accepted destination remains one Semantic Gateway with:

```text
Native STS2
  -> coherent player-visible observation
  -> one active semantic owner
  -> exact bound action
  -> execute-time native revalidation and commit
  -> action-local outcome receipt
  -> fresh successor observation

Compatibility/evidence control plane
  -> exact environment identity
  -> session trial
  -> evidence and quarantine
  -> persistent scoped claim
  -> revoke/supersede/rollback
```

The migration method is a vertical family strangler:

1. audit one real family from source, UI, owner, operands, Commit and Outcome;
2. define the smallest explicit native contract justified by that evidence;
3. bind each advertised action to that contract plus exact source evidence and
   operand identity;
4. use contract digest, not the operation label, for publication and execution
   admission for that migrated family;
5. retain generic Re command polling and successor supervision;
6. obtain negative and exact-runtime evidence;
7. remove the family's operation-authority dependency, synthesized fallback,
   duplicate Provider/Outcome path and temporary instrumentation;
8. repeat by family.

`operation` remains useful as a wire/log/Prompt label and as temporary ledger
metadata. It is not the final authority key for a migrated explicit contract.

## Current-State Identity

The live state contract has two explicit identities:

- `semantic_state_id`: current semantic observation facts;
- `authority_projection_id`: current executable/read-only authority relevant
  to that observation.

`state_id` binds both for stale-action safety. Append-only grant history,
qualification history, contract shadows and identity shadows are not semantic
state. They remain available through capabilities/operator control responses,
not the model-facing state envelope.

This is a direct cutover, not a permanent dual-read. Tests prove unrelated
historical scopes do not change either identity, while a current relevant grant
changes only the authority projection and composite `state_id`.

## First Pilot

The first pilot is `shop_inventory/purchase_shop_relic`, including the Kifuda
child handoff.

- The purchase command completes when native purchase success, exact gold
  delta, exact relic acquisition, and entry advancement or the exact Kifuda
  child owner are proved.
- The receipt remains
  `shop_relic_purchase_committed_with_exact_relic_gold_and_entry_witness` with
  boundary `native_commit_observed`.
- Kifuda enchantment is a new `deck_enchant_selection` observation. It is not
  hidden inside a universal transaction or treated as an unresolved purchase.
- The enchant actions bind their exact Self-Help Book or Kifuda source evidence
  into the bound-action digest.

Preview.74 implements and fixture-tests this pilot. It is not Live-qualified
until ordinary relic and Kifuda positive/negative journeys execute on the exact
installed/loaded Preview.74 identity.

## New-Environment Trial Semantics

“If it can run, let it run first” means:

- source-safe diagnostic observation may remain available in a new complete
  environment;
- no prior environment grant transfers;
- a mutation is published only when owner, source, operands, native contract,
  current environment/Patch/Modset and a runtime-scoped trial all match;
- one success may confirm only the current session scope;
- persistent qualification still requires its own evidence and installable
  claim lifecycle;
- drift, timeout, unknown outcome or witness mismatch quarantines the minimum
  exact scope.

It never means speculative mutation, wildcard permission, static-similarity
authorization, or retry after an unknown outcome.

## Closure Metrics

Final Clean Closure requires:

```text
connector contract/identity shadow count = 0
permanent dual-read paths = 0
production action-authority source count = 1
fallback authority contracts in supported envelope = 0
bulk candidate startup paths = 0
Re native-completion reconstruction = 0
control-history inputs in semantic state identity = 0
```

Operation-authority retirement is measured by family. Unknown and out-of-scope
rows may remain explicit `unsupported` or `code_required`; they must not be
fabricated into contracts to make a counter reach zero.

## Consequences

- C-first Clean Closure temporarily supersedes the program-plan wording that C
  closure proceeds only opportunistically alongside A/D M1.
- ADR-0002 and ADR-0004 remain accepted.
- ADR-0003 remains directionally accepted but its permanent shadow/dual-read
  interpretation is replaced by bounded experiments with mandatory deletion.
- Re transition supervision remains; Re native legality/completion inference
  remains forbidden.
- No new permission mode, fallback authority path, universal selector,
  transaction DSL, workflow engine or second game state is introduced.
- A family cannot be declared migrated from compilation, fixtures, an old MVID,
  or one canary alone.

## Rollback

Preview.74 is installed but not loaded. The last loaded Preview.73 whole-DLL
rollback is `STS2MCP/.local/deployments/2026-07-29T07-08-28-094Z`; the latest
installer backup contains the intermediate Preview.74 build. A rollback
restores a complete prior DLL; it does not selectively re-enable the deleted
shadow wire contract.
