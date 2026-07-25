# Preview.47 Linked Rewards, Coherent Observation, And Authority Shadow

Date: 2026-07-19

## Scope

Preview.47 closes three defects found by real `agent:run` evidence without
adding a Surface or widening action/Inspection permission:

1. linked reward continuations after a shop purchase;
2. inconsistent multi-read state plus Inspection composition;
3. inability to inspect the gap between semantic contracts and coarse
   Surface-kind authority.

It also adds Re-only evidence provenance for future runs. No historical run is
rewritten.

## Implementation

- Orrery-style shop relic purchase may complete while the purchase parent task
  remains pending only when exact relic ownership, exact gold delta, offer
  advance, and the visible linked `NRewardsScreen` all agree. A completed failed
  parent task can never be washed into success.
- `proceed_rewards` accepts known intermediate state movement while preserving
  its existing semantic witness.
- `visibility` and `inspection_catalog` declare the bounded player-visible
  closure and currently available typed reads.
- Existing keyword/card-preview details remain embedded in visible entities;
  `linked_detail_kinds` is empty until a real state-bound linked-detail
  contract exists. The missing catalog is reported explicitly.
- `POST /api/v2/observation-bundles` returns one state plus requested
  Inspections under one exact state/environment identity. Drift rejects the
  whole bundle.
- Python MCP publishes the same bounded read through
  `get_agent_observation_bundle_v2`; fixed booleans select only the two
  registered Inspection kinds and cannot form an arbitrary query.
- Re uses the coherent bundle instead of per-Inspection parallel reads plus a
  final state re-read.
- `contract_instance_shadow` reports manifest/operation/evidence/legacy-tier
  facts with `authorizing=false`. Current permission remains exact environment
  plus Surface kind.
- Re run metadata may declare evidence provenance. The default is
  `unrecorded`, and every label remains coverage-only unless independently
  reviewed.

## Runtime Evidence

### Historical preview.46 runs

- Orrery purchase actually changed relic ownership, gold, and offer position,
  then opened exactly five linked card rewards. The old command timed out
  because it waited for the parent task to finish before allowing the child
  transaction to proceed.
- A reward Proceed action reached a valid intermediate state but the old action
  rejected any intermediate state movement.
- Pael's Tooth exposed an exact five-card selector. Bridge correctly stopped
  because this transaction has no purpose-specific v2 contract.
- A 100-tick run produced one `run_deck stale_state` during eager sidecar
  composition. The other 99 actions settled.
- Another 98-tick run settled 96 actions and safely rejected two stale
  pre-execution actions.

All five run metadata records are `provenance=unrecorded` because they predate
the new field. They are coverage/debug evidence for exact preview.46 MVID, not
standalone Organic qualification.

### Loaded preview.47

```text
game: v0.109.0|c12f634d|-840572606
Release/installed SHA-256: afb7c35eeda3f728553b6107d1dffdc362c4fac7e8e0aa6587608c094e7325fb
loaded MVID: 784bbdc5-e7b3-40e7-872f-3c8ba538f9b0
runtime instance: 0533bb421a334245b64cfde35394d64a
Modset: exact_bridge_only
Modset fingerprint: 3c3875309c60d02f18befd1e7a38ed3c51c0ca74ace16b48eb1b99911ecbd739
```

Intermediate preview.47 MVID `eb96741b-42ce-43e1-86b3-6d71a1caea4e`:

- exposed preview.47 capabilities with the unchanged qualified/canary lists;
- returned `main_menu` with only the existing Continue canary action;
- confirmed `continue_run` and reached the saved-run shop;
- returned one coherent shop + run-deck bundle under the same `state_id`;
- passed strict Re normalization and inspection projection.

Final loaded MVID `784bbdc5-e7b3-40e7-872f-3c8ba538f9b0`:

- exposed the same unchanged qualified/canary lists;
- returned a coherent main-menu state and empty requested-Inspection bundle;
- passed the Python MCP helper and strict Re inspection path;
- settled a separate `continue_run` under explicit `operator_positioned`
  provenance;
- completed run `run-20260719150346-ptpq0a`: 40 strict-v2 decisions, 39
  settled, one safe pre-execution stale rejection, no unknown outcome,
  unsupported stop, v1 fallback, or command failure;
- retained coherent observation and `authorizing=false` shadow fields on all
  40 decisions.

The final-MVID run is coverage/canary evidence, not automatic qualification.
Intermediate-MVID evidence is still not transferred.

The first Re settlement after Continue was mislabeled `executed_unsettled`
despite Bridge `completed/confirmed`. The cause was a client decoder requiring
nullable shadow-contract fields that JSON correctly omitted for an unresolved
intermediate state. The decoder now accepts only those fields as optional while
retaining `authorizing=false`, exact authority basis, and all normal state
validation. This was a telemetry/settlement read defect, not a failed command.

## Verification

- Bridge tests: `92/92`.
- Re tests: `145/145`; typecheck and
  production build passed.
- Bridge Release build: zero warnings and zero errors.
- Release and installed DLL hashes match.
- Live capabilities, state, observation bundle, and Re inspect agree on exact
  protocol, game, MVID, runtime, and Modset identity.
- Final-MVID operator-positioned run: 40/40 valid DeepSeek selections, 39
  settled actions, one safe stale non-execution, 40/40 coherent observations.

## Permission And Qualification

- No Surface or Inspection permission changed.
- No automatic compatibility or provisional authority exists.
- `contract_instance_shadow` cannot publish or suppress actions.
- The coherent bundle does not enter the command ledger.
- Linked Orrery completion is implemented and fixture-tested; it is not newly
  claimed as current-MVID Organic qualification because preview.47 has not yet
  repeated the full purchase-child lifecycle.
- Pael's Tooth remains unsupported/fail-closed.
- Historical preview.46 evidence remains attached to preview.46 MVID.

## Rollback

The pre-preview.47 installed DLL is saved locally as
`/tmp/STS2_MCP-preview46-rollback.dll`. It is not a repository artifact. Revert
the preview.47 code and restore that DLL only if the coherent bundle or shadow
fields create an unexplained runtime regression.

## Next Highest-Value Work

Validate the non-authorizing contract-instance inventory over repeated real
Surface families, then add one shadow semantic-binding/commit/witness profile.
The migration must first prove it can reproduce or narrow current actions. It
must not broaden permission. Pael's Tooth is a useful negative/candidate
transaction, not the first authority-expansion target.
