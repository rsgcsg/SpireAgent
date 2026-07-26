# Bridge v2 Current Status

This is the canonical current status for the Gateway/Re connector boundary.
Historical preview reports do not grant current authority.

## Source Truth

- Gateway/Re protocol: `2.0-preview.65`.
- Re normalized schema: `26`.
- Gateway v1 namespace: retired, `410 Gone`.
- Current game: `v0.109.1|c8c577f6|-820620422`.
- Current game assembly SHA:
  `2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f`.
- Current game assembly MVID:
  `208f08b8-d5f5-47f8-9e96-d3a4299ee709`.
- Installed and loaded Gateway SHA:
  `4c6c1309c4ac3c0e97eccb084312769595485e21f499b9a1d07040a8e744419e`.
- Installed and loaded Gateway MVID:
  `60d4c2ce-44ad-46b4-99f7-0479e75b5741`.

Gate 1 is closed only as the bounded ordinary-single-player v2 connector
baseline documented by the operation inventory. Unsupported variants remain
explicit fail-closed rows.

## v0.109.1 Requalification

The update from reviewed `v0.109.0` no longer leaves the whole environment
diagnostic-only. Preview.65 performed a narrow operation-by-operation
requalification:

| Operation | Binding audit | Runtime evidence | Current authority |
|---|---|---|---|
| `main_menu/open_singleplayer` | match | 2 ordinary runs, 2 epochs | persistent `qualified` |
| `main_menu/continue_run` | match | 2 ordinary runs, 2 epochs | persistent `qualified` |
| `map_navigation/choose_map_node` | match | no legal route action in available save | candidate only |
| `shop_room/open_shop_inventory` | match | not run on v0.109.1 | none from this cycle |
| `deck_enchant_selection/confirm_selection` | match | not run on v0.109.1 | none from this cycle |

The exact binding audit is non-authorizing. It verifies reviewed private
bindings and emits operation digests, then requires targeted runtime
requalification. Unknown operations or owner/Commit/completion changes remain
`code_required`.

Real Re decision evidence:

```text
open_singleplayer
  run-20260726075353-pqoc6a
  run-20260726075427-8d8wb7
  witness singleplayer_or_character_select_owner_became_active

continue_run
  run-20260726082338-ooz634
  run-20260726082439-kjmwoi
  witness saved_singleplayer_run_became_active
```

Both qualified packages are active in the local append-only store and survive
cold restart with `runtime_epoch=not_session_bound`. The Gateway rechecks exact
game/Gateway/Modset/Patch/environment/operation identity at startup.

Final cold-load identity:

```text
runtime     56f748fdf9c041e7a10815152dd5a14c
Modset      803245f3df16e1d07f88c9c922f068d34b582edd6c3f09d2e98a11e36337ae49
Patch       ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
environment 218ff0b309dd3e1e110bb401d8fc40ca86b53ac7adea331ec68c3d71c7e9feb4
store       13fbc389b3ed9f0eb1ba4bfdc5b8615bd059ffda5fc7ac2596d1b53a42244826
mode        balanced_gray
```

The map candidate package remains visible in qualification audit state, but
balanced mode issued no map grant and advertised no map canary Surface.

## Architecture Correction

A Surface may legitimately contain operations at different permission tiers.
For example, `main_menu/open_singleplayer` can be persistent-qualified while
`main_menu/continue_run` is still a session canary. Surface support is only a
coarse highest-tier projection; each operation scope and advertised action is
authoritative. Re now accepts this mixed state while still requiring every
action to match exactly one current operation grant or package.

This does not allow a package for one operation to authorize a sibling on the
same Surface.

## Lifecycle And Failure Evidence

The qualification lifecycle was exercised on isolated store copies for:

- wrong Modset, Patch and Gateway MVID rejection;
- expired package rejection;
- corrupt JSON store fail-closed;
- revoke and rollback;
- live supersede and cold-restart recovery.

Gateway tests also cover semantic Witness mismatch, timeout/unknown outcome,
first-failure quarantine, Patch drift and invalid ledger sequences. An unknown
outcome is never retried.

The available saved run contained a pre-existing non-ordinary Neow state. A
map overlay could be opened, but native travel was disabled and no next node
was legal. The Gateway correctly published no map action. This is not map
canary or Organic evidence.

## Explicit Non-Claims

- Two menu qualifications do not qualify all of `v0.109.1`.
- Static binding similarity is not runtime qualification.
- Candidate, session canary, Organic evidence and persistent qualification are
  separate states.
- Current evidence does not establish cross-Mod or generic future-version
  compatibility.
- Gate 1 closure is not complete-game or full-visible-information closure.

See the
[full v0.109.1 closeout](PREVIEW_65_V01091_REQUALIFICATION_CLOSEOUT_2026-07-26.md),
[Preview.65 architecture closeout](PREVIEW_65_PERSISTENT_QUALIFICATION_AND_ADAPTATION_CLOSEOUT_2026-07-25.md),
and [operation inventory](OPERATION_RETIREMENT_INVENTORY.json).

## Next Step

Obtain a fresh ordinary saved run with a legal map choice and apply the same
bounded candidate, Witness, second-epoch and persistent-package process to
`map_navigation/choose_map_node`. Do not broaden wildcard, Surface-wide, or
build-wide authority.
