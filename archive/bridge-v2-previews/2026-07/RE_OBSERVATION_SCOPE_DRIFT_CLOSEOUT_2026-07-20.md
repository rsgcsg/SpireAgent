# Re Observation Scope Drift Closeout

Status date: 2026-07-20

## Defect

Strict-v2 run `run-20260719233653-zsgua8`, decision
`decision-000054-mrsftkqc-u5zacb`, selected a current Bridge-advertised map
node leading to a shop. The Bridge command completed as `confirmed` with
`map_closed_or_current_map_coordinate_reached`, and the game reached the shop,
but Re recorded `executed_unsettled` after its first post-command coherent
observation returned `inspection_scope_mismatch` for `shop_catalog`.

This was not a map action, permission, or Completion defect. The merchant
Surface advanced between the state read and capture of its state-bound
Inspection sidecars. Re treated that lifecycle race as a permanent read error.

## Bounded Fix

Re now handles `inspection_scope_mismatch` from a coherent observation bundle
with one non-authorizing fresh state read:

- if the fresh `state_id` changed, the failed composite read is classified as
  transient lifecycle drift and callers may retry observation;
- if the fresh `state_id` is unchanged, the mismatch remains a hard Bridge
  contract error;
- no partial state or Inspection is consumed;
- no action is retried and no new authority is created.

`stale_state` behavior is unchanged. Other Inspection failures remain hard
errors. Bridge protocol, DLL, permission lists, action contracts, and semantic
Completion witnesses are unchanged.

## Verification

- Re typecheck: pass.
- Re tests: `149/149` pass, including changed-state and same-state mismatch
  branches.
- Re production build: pass.
- `git diff --check`: pass before the runtime window.
- Strict-v2 run `run-20260719234320-ze6fp0`: `15/15`
  `executed_and_settled`, all `bridge_advertised`, no errors and no v1 action.
  The window crossed closed shop inspection, opened inventory, three inventory
  actions, shop exit, two map choices, event options, event card acquisition,
  and combat.

This evidence proves the client-side drift handling on the currently loaded
preview.52 identity. It does not upgrade `shop_catalog` or any action Surface
from canary to qualified.

## Rollback

Revert the `inspection_scope_mismatch` fresh-state comparison and its fixture
test. The Bridge preview.52 artifact requires no rollback.
