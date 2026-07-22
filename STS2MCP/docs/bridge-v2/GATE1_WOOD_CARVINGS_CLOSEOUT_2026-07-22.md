# Gate 1 Wood Carvings Replacement Closeout

Status: implemented, loaded, and organically canary-exercised on the exact
environment below. This is not Organic Qualification.

## Why This Slice Existed

The exact Gate 1 journey selected Wood Carvings Bird from an ordinary event.
The Gateway correctly returned `unsupported + none_fail_closed` for the child
`NDeckCardSelectScreen`; Re did not retry or use v1. Source audit showed that
Bird and Torus both use `CardSelectCmd.FromDeckGeneric`, but deterministically
replace the selected Basic card with `Peck` or `ToricToughness`. The existing
merchant removal and Whispering Hollow random-transform contracts could not
represent that business meaning safely.

## Architecture Decision

Choice: **B/C boundary**. Keep a purpose-specific semantic Surface while
reusing only bounded, non-authorizing card-grid selection facts and native UI
mechanics.

- New Surface: `wood_carvings_replacement_selection`.
- Exact source evidence: Harmony scope around the private async
  `WoodCarvings.Bird` and `WoodCarvings.Torus` tasks.
- The source token alone grants no authority. Provider resolution also requires
  the exact event instance, `WOOD_CARVINGS` context, active overlay, exactly-one
  non-cancelable constraints, visible holders, and current controls.
- Bird and Torus expose their known replacement semantics. This is not the
  random/uncommitted preview used by `deck_transform_selection`.
- All other `NDeckCardSelectScreen` callers remain fail closed.

A universal selector was rejected because it would erase source purpose,
replacement identity, commit behavior, and completion truth.

## Completion Witness

Confirm succeeds only when all conditions hold:

1. the exact Wood Carvings source task completed;
2. the selector closed;
3. the selected original card instance existed in the baseline deck and no
   longer exists in the current deck;
4. deck count is unchanged;
5. the exact expected replacement type count increased by one.

Overlay closure alone is insufficient. Unknown outcomes remain non-retryable.

## Exact Environment And Evidence

| Identity | Value |
|---|---|
| Protocol | `2.0-preview.56` |
| Game | `v0.109.0|c12f634d|-840572606` |
| Modset | `exact_bridge_only` |
| Organic-canary SHA-256 | `8ad08daabf073bd04a394a819740f3f7b25a282bbd42f018dc0c399e28be36a0` |
| Organic-canary MVID | `00124a4c-6046-45dd-b77a-8e83e80faece` |
| Organic-canary runtime | `f881814b6b7a4492849d069d3236261e` |

Organic Bird journey:

```text
event_option Bird
-> wood_carvings_replacement_selection selecting
-> select exact Strike
-> preview
-> cancel preview
-> selecting with zero selected cards
-> reselect same exact Strike
-> preview
-> confirm
-> event Proceed
-> map_navigation
```

Player-visible replacement text was checked after a runtime defect was found
and fixed: the first build exposed an unexpanded localization template; the
loaded build instead exposed `Deal 2 damage 3 times.`.

Run-deck Inspection before/after confirm proved:

- total cards `12 -> 12`;
- `PECK` count `0 -> 1`;
- selected original entity `card_28a5093c_13` present -> absent;
- replacement entity `card_28a5093c_21` present with formatted description.

Re reported the confirm command `executed_and_settled`, one settlement poll,
about 213 ms, with an actionable `event_option` successor. Proceed then reached
an actionable map.

## Verification

- Re typecheck passed.
- Re tests passed: `155/155`.
- Bridge tests passed: `110/110`.
- Release build passed with zero warnings/errors.
- Installed SHA matched the built DLL before launch.
- Steam-loaded protocol/SHA/MVID/runtime identity matched the evidence above.

After the Organic canary, replacement definition IDs were changed from local
literals to the exact `ModelDb` definitions without changing protocol behavior.
The resulting final source artifact was separately built, installed, and
Steam-loaded as SHA
`c9127d63c224f354d28baf88c5e9ba62bb36313e00054f7bbc411cd62facb117`,
MVID `d5ae09de-cea9-4faf-818c-919f828c7eed`, runtime
`aa43cb8b6bff4aa6871962caacd53802`. That proves installation and load identity,
not transfer of the prior Organic action evidence to the new artifact.

The same cold start exposed a Re supervision defect: native `continue_run`
loading could outlive the ordinary settlement budget. Re now classifies
`continue_run` and `embark_standard_run` with map navigation as bounded long
transitions. A real Re canary on the final artifact settled `continue_run` in
11 polls / 2333 ms and reached an actionable `event_option`; the command was
submitted once and no unknown outcome was retried.

## Remaining Boundary

The Surface remains `candidate_action_canary`. Torus has source and fixture
coverage but no Organic action lifecycle in this artifact. Repeated Bird/Torus
diversity is required before any qualification discussion. Crystal Sphere,
manual potion discard outside reward handling, and every unrelated generic
deck selector remain unsupported or independently scoped.
