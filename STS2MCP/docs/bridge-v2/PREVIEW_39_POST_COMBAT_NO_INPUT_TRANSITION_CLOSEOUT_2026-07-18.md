# Preview.39 Post-Combat No-Input Transition Closeout

Status: source audited, tested, built, installed, loaded, and organically observed on 2026-07-18.

## Problem

After the final combat action, `CombatRoom.OnCombatEnded` asynchronously runs
room-finalization and reward offering. For a short interval the run remains in
the exact `CombatRoom`, combat is no longer in progress, and no overlay, map,
menu, modal, or room control owns player input. Preview.38 classified that
valid no-input interval as `unknown + unsupported`, which could stop a strict
v2 run even though no decision was available.

## Contract

Preview.39 adds a bounded observation-only lifecycle state:

```text
context = post_combat / awaiting_room_resolution
surface = no_action / settling
readiness = settling
authority_handoff = none_fail_closed
legal_actions = []
```

The predicate requires an active single-player run, exact current room
`CombatRoom`, `CombatManager.IsInProgress == false`, a live `NCombatRoom`, and
no blocking Active Surface. It is evaluated only after every semantic Surface
provider fails to match. It does not appear in the provider registry,
capability manifest, or permission lists and cannot fall back to v1.

This is not a universal "missing overlay means loading" rule. Unknown rooms,
ambiguous owners, map-to-room travel gaps, and new interaction shapes still
fail closed.

## Verification

- Bridge contract tests: `77/77`.
- Re-SpireAgent tests: `135/135`; typecheck and production build passed.
- Bridge Release: zero warnings and zero errors.
- Release and installed DLL SHA-256:
  `21c247005f68076a1531db6f5e0727152a61b4aded37190baf1aa539a804e102`.
- Loaded protocol: `2.0-preview.39`.
- Loaded MVID: `4f1113cf-206b-4782-ab93-19a6d5080b22`.
- Loaded runtime: `7cd5d373f8a14c3f9eb3d04311f63d8c`.
- Exact game identity: `v0.109.0|c12f634d|-840572606`.
- Loaded Modset: `exact_bridge_only`, fingerprint
  `9b9948028b8acbd609a40012bb20045c6a9a5c19360284256eb63646faac4e69`.

An organic strict-v2 run produced the directly observed sequence:

```text
state_f8d5a2449f_1a9 combat / combat_turn / bridge_owned
state_f8d5a2449f_1ab post_combat / no_action / none_fail_closed / 0 actions
state_f8d5a2449f_1ac reward_flow / reward_claim / bridge_owned
```

The middle state carried diagnostic
`bridge.lifecycle.no_input_transition`, readiness `settling`, and no command
authority. The run continued into reward actions without v1 transport.

## Architecture Decision

Classification: **B - internal bounded lifecycle helper, no new semantic action
Surface**. Context and Surface remain independently typed on the wire because
Re must understand stability, but no provider, action protocol, permission, or
universal transition abstraction was created.

## Newly Observed Separate Debt

- A map-to-room load briefly emitted `unknown + unsupported`; only a summary
  was captured, so its exact source state must be collected before modeling it.
- A long enemy phase caused Re settlement polling to time out after the Bridge
  had already confirmed `end_turn`; command completion and next-decision
  checkpoint waiting need separate audit.
- A shop run alternated `shop_room <-> shop_inventory` after purchases were
  exhausted. This is a strategy/runtime no-progress cycle, not a Bridge
  legality or completion failure.

None of these observations expands current authority.
