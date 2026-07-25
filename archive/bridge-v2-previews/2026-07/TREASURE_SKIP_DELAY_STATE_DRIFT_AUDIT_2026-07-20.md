# Treasure Skip-Delay State Drift Audit

Status: exact-source and repeated-runtime explanation complete. No protocol,
permission, action, or execution change is justified.

## Repeated Evidence

Two independent preview.54 strict-v2 treasure journeys produced the same safe
refusal:

- `run-20260720000955-3zg1o9`, decision 72: state `..._125` advertised the
  exact visible relic; state `..._126` added `skip_treasure_relic` before
  dispatch. Decision 73 selected the same relic successfully.
- `run-20260720001351-ogghci`, decision 5: state `..._13b` advertised the
  exact visible relic; state `..._13c` added `skip_treasure_relic` before
  dispatch. Decision 6 selected the same relic successfully.

Both old actions were rejected before Bridge dispatch with
`not_executed_stale_state`. There was no command failure, unknown outcome,
wrong relic, or v1 fallback.

## Exact v0.109 Lifecycle

`NTreasureRoom.OpenChest()` initializes and animates the relic collection,
sets `_isRelicCollectionOpen`, and then starts
`EnableSkipAfterDelay(2.5f, ...)`. `NTreasureRoomRelicCollection.AnimIn()`
independently restores the relic holder's mouse input after its shorter entry
animation. Therefore a valid interval exists where:

- the relic is visible and its exact holder is enabled/clickable;
- taking the relic is a real player action;
- Skip is visible in purpose but not yet enabled;
- enabling Skip legitimately changes the complete legal-action set.

The observed state transition is native UI timing, not an unstable relic
identity or Bridge ownership conflict.

## Decision

Retain the current state-bound contract and Re execution-time stale guard.
Do not:

- freeze the state ID while Skip authority changes;
- execute the old opaque action against the successor state;
- hide an already clickable relic until Skip becomes enabled;
- treat the second model call as qualification evidence for a new contract.

This is a bounded efficiency cost: a model response that crosses the native
2.5-second Skip boundary can be discarded and recomputed. It is preferable to
weakening action-set truth or state binding. If the frequency becomes material,
future work may add non-authorizing lifecycle telemetry or deliberation
cancellation, but it must not merge two distinct authority states.

Architecture result: **A - keep the independent treasure semantic Surface and
existing state-bound lifecycle**. No shared mechanism, Wire change, or new
permission is supported by this evidence.

## Qualification Impact

None. Existing treasure action canaries and Organic journeys remain valid for
their exact actions. The two refusals are visible regression evidence for the
guard itself, not successful action evidence and not a reason to promote the
whole Surface.
