# Preview.50 Event Async Transition Closeout

Status: natural defect observed, minimal fix tested/built/installed/cold-loaded,
same exact event reproduced, and strict-v2 regression journey completed.

## Defect

Strict-v2 run `run-20260719224136-9a48po` selected `Nab the Map` in
`THE_LEGENDS_WERE_TRUE`. The UI action applied and the event later showed
Proceed, but the first state change occurred before replacement options were
attached. The command ledger therefore failed immediately with
`unexpected_state_transition`; Re correctly recorded `executed_unsettled` and
did not retry the unknown command.

## Fix Boundary

The ledger default is unchanged: a state change before a non-opted-in action's
completion probe passes is still an unknown failure. Only the known
asynchronous event option and event Proceed transitions explicitly allow
intermediate state changes. Their completion predicates are unchanged and
still require one of:

- replacement event options;
- a newly opened required overlay;
- combat entry;
- map opening;
- event room departure.

If none appears before the command timeout, outcome remains unknown. No generic
"state changed means success" fallback was introduced.

## Exact Identity

- protocol: `2.0-preview.50`
- game: `v0.109.0|c12f634d|-840572606`
- Release/installed SHA-256:
  `f5511300c798ffa6f150059a3ce61bd0accec015181a92cfe4a79c16a456e147`
- loaded MVID: `f8cb2c05-4177-4dbc-b4ae-29843f40a25a`
- runtime: `e9240003a1bb46c19fba27a0da35ef40`
- Modset: `exact_bridge_only`
- Modset fingerprint:
  `3e135a5e5f044d222150591aa8660021356a376d0d1352b94355b7ca8020ee67`

## Runtime Reproduction

The saved run restored the exact pre-choice `Nab the Map` state on the new
MVID. The same Bridge-advertised action crossed the intermediate state, stayed
pending, and completed with
`event_option_replaced_or_required_subsurface_opened` after Proceed appeared.
This directly reproduces the old failure and verifies the narrow fix.

Follow-up `run-20260719224802-jpyv00` recorded 33 Bridge-owned decisions: 32
confirmed actions and one non-actionable run boundary. It covered event
Proceed, map, combat, a combat-hand selection child, game over, and main menu.
There was no v1 transport, stale dispatch, failed command, timeout, or unknown
outcome.

## Verification

- Bridge tests: `96/96` pass.
- Re typecheck/tests/build: `147/147` tests pass.
- Bridge Release build: zero warnings and zero errors.
- Release and installed DLL SHA match.
- Loaded protocol/MVID/runtime/game/Modset match this report.
- `git diff --check` passes.

## Architecture Review

Decision: **B - preserve the independent semantic event contract and use the
existing explicit async-lifecycle mechanism**. No new Surface, universal event
engine, or global ledger relaxation is justified. The defect was a Provider
failing to declare a known lifecycle property, not a failure of the one-active-
Surface architecture.
