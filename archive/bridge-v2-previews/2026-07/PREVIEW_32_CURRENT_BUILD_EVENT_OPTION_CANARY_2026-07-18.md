# Preview.32 Current-Build Event Option Canary

Status date: 2026-07-18  
Protocol: `2.0-preview.32`  
Source HEAD before local changes: `18de3bd9e457e9529cc92376754085d1413f8eb3`

## Scope

This slice independently revalidates only ordinary single-player
`event_option` on exact game identity
`v0.109.0|c12f634d|1833084275`. It grants no qualified Surface, no other action
canary, and no Inspection. Older `-840572606` qualification and Organic
evidence are not inherited.

## Source And UI Evidence

The installed `sts2.dll` was inspected directly. Current `NEventRoom` still
owns `Layout.OptionButtons` and routes enabled choices through
`OptionButtonClicked`; `NEventOptionButton` still binds exact `EventOption`
objects and index; `EventOption.Chosen` still sets `WasChosen` before awaiting
the asynchronous effect. The existing Provider therefore correctly requires a
replacement option set, a required child overlay, combat, map, or room exit
rather than treating `WasChosen` as completion.

The resumed A10 Defect run naturally exposed `BRAIN_LEECH` with two visible
options. Exact source showed `ShareKnowledge` opens a non-cancelable one-of-five
event card-acquisition child and `Rip` loses five HP before opening a colorless
card reward.

## Implementation

- Current fingerprint is listed as an exact scoped identity with an empty
  qualified Surface list and `action_canary_surface_kinds=[event_option]`.
- Both Inspection lists are empty and `inspection_allowed=false`.
- Re scoped-build checks now require the union of qualified and canary Surface
  lists to be non-empty. They no longer reject an honest canary-only scope.
- Protocol advanced to preview.32. No Provider predicate or completion code was
  changed.

## Validation

- Bridge tests: `63/63` passed.
- Re tests: `128/128` passed; strict typecheck and production build passed.
- Python MCP entry: `py_compile` passed.
- Release build: passed with zero warnings and zero errors.

Release and installed DLL SHA-256:
`7a0bb4801ad24d14d996c21690bb5ac8e555d4697efcf66db0a502a909fa7680`.
Loaded MVID: `e4902978-a8d2-4944-a59c-b8163f76eb0c`.  
Runtime instance: `def0812ea2c44928b84a6b50ca2365b4`.

`/api/v2/capabilities` reported the same protocol, exact game identity, MVID,
runtime instance, one `candidate_action_canary` row for `event_option`, and
`disabled_for_current_build` Inspection with no implemented kinds.

## Organic Canary

Re strict inspect accepted state `state_5a9e3ccc85_1` as actionable
`event + event_option`, with two exact option-entity bindings and no Inspection.
DeepSeek run `run-20260718074756-g49oav` failed before execution because the
provider connection reset before any HTTP response. It proves Re stopped safely;
it is not a game canary and does not diagnose an API-key rejection.

The bounded canary then explicitly submitted the advertised `Share Knowledge`
action using request `preview32-event-option-1784360996899`. Command events were:

```text
received(request_recorded)
-> validated(state_and_action_revalidated)
-> started(ui_interaction_started)
-> completed(event_option_replaced_or_required_subsurface_opened)
```

Outcome was `confirmed`; successor `state_5a9e3ccc85_2` exposed the exact
`event_card_acquisition` child as unsupported with no legal actions. Re retained
event Context, set action authority to none, and imported no v1 action.

## Verdict And Rollback

Status is Implemented, Fixture-tested, Compiled, Installed, Loaded, Observed,
Canary-permitted, and Canary-exercised. It is not Scoped-qualified. Rollback is
to remove the current fingerprint branch or empty its canary list; preview.31
scope hardening then suppresses every action and Inspection.

The next smallest natural slice is exact-source and live-UI revalidation of the
already visible Brain Leech `event_card_acquisition` child. No permission should
expand until that audit and its tests are complete.
