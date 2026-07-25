# Preview.35 Typed Contract Inventory Closeout

Date: 2026-07-18  
Remote baseline: `develop@efcb5c42f21e72d0f904535712773121168d44fb`  
Protocol: `2.0-preview.35` (unchanged)

## Scope And Verdict

This slice starts the non-authorizing Typed Contract / Evidence / Visibility
Inventory. It removes the duplicated capability declaration from
`BridgeV2Runtime`, makes the Provider registry inspectable without loading the
game runtime, and records operation-level treasure evidence without changing
any runtime permission.

The inventory is infrastructure, not authority. A contract's presence in the
inventory cannot authorize observation, canary execution, qualification, or
Inspection. Exact-environment permission remains exclusively controlled by
`BridgeGameIdentity` and `BridgeSurfacePermission`.

## Implemented Boundary

- twenty unique semantic Surface entries now record protocol revision,
  mechanism, source binding, Re support, visible fact groups, operations, and
  test/document references;
- `run_deck` and `combat_piles` Inspection entries record source binding,
  visibility/order semantics, visible fact groups, hidden-by-policy facts, and
  evidence status without creating command authority;
- the runtime capability response is generated from that inventory, then each
  support value is derived from the explicit exact-environment permission;
- Provider registration is `kind + lazy factory`, so offline inventory tests
  do not instantiate Godot-bound Providers;
- tests require the inventory and Provider registry to contain exactly the
  same unique kinds;
- tests prove that a declared `combat_turn` or `treasure_room` remains disabled
  when the supplied permission scope omits it.

This is not yet a complete external Contract/Evidence Manifest. Exact loaded
MVID, runtime instance, per-origin qualification, field criticality, and
visibility completeness remain deployment/evidence concerns rather than
authorization inputs.

## Treasure Operation Evidence Pilot

The existing `treasure_room` Surface-level canary permission is unchanged.
The inventory now records the narrower evidence truth:

| Operation | Evidence status | Authority consequence |
|---|---|---|
| `open_treasure_chest` | source-audited | none |
| `choose_treasure_relic` | organic canary exercised | none |
| `skip_treasure_relic` | source-audited | none |
| `proceed_treasure_room` | organic canary exercised | none |

No operation is marked Organic Qualified. The next permission-governance step
may narrow a Surface canary into operation/origin scopes, but this report does
not authorize that change.

The exact installed v0.109 source was rechecked for `TreasureRoom`,
`NTreasureRoom`, and `NTreasureRoomRelicCollection`. It confirms separate
game-owned paths for chest opening, single-player relic picking, skip, and
terminal proceed. The current Provider also retains separate publication,
execution revalidation, and semantic witnesses for all four operations. This
supports the evidence split; it does not supply the missing Organic open/skip
journeys. Narrowing the current canary to choose/proceed alone would block the
normal unopened-chest lifecycle, so no permission change is justified here.

## Verification And Loaded Identity

- Bridge tests: `68/68` passed;
- Re-SpireAgent: strict typecheck, `128/128` tests, and production build passed;
- tracked Python server compilation passed;
- Release build passed with zero warnings and zero errors;
- Release and installed DLL SHA-256:
  `533e7db0ab7f6fdf04cc9ff0143133d6ba3ace2af5ef26a088ed379335366216`;
- loaded module MVID: `8842875a-c0e0-4381-a473-2b06d2d6fc9d`;
- loaded runtime instance: `4dab44137dec4350bad358cf5cc508a5`;
- loaded game identity: `v0.109.0|c12f634d|-840572606`;
- compatibility: `qualified_scoped`.

After removing only MVID and runtime-instance identity, the capability JSON
before and after this slice was byte-for-byte equivalent: twenty Surfaces,
five qualified, twelve canary, three disabled, and only `run_deck` qualified
for read-only Inspection.

The game was observed at the root main menu. Bridge correctly returned
`unknown + unsupported`, no action authority, and zero legal actions. No
command was executed, so this slice creates no Organic action evidence and
does not qualify any Surface.

## Architecture Decision

Selected: **B**, extract non-authorizing internal inventory/registry mechanics
while preserving independent semantic Surfaces and the current wire protocol.

Rejected:

- manifest-driven automatic permission;
- operation evidence being treated as qualification;
- a universal menu or selector abstraction;
- a protocol bump for an internal behavior-preserving refactor.

## Remaining Boundary

The next runtime slice is an Organic current-MVID `treasure_room` open/skip
journey, using the inventory as diagnostics only. Any narrowing must preserve
current legal paths and requires bounded runtime evidence. No treasure state
was naturally available in this closeout, so manufacturing one would not make
the operation qualified. Root main-menu coverage is higher product value but
is not yet a safe narrow implementation slice: the exact UI includes Continue,
Abandon, Singleplayer,
Multiplayer, Timeline, Settings, Compendium, Quit, profile/patch-note controls,
submenu ownership, and modal interruption. A partial standard-run navigation
contract must not claim whole-menu completeness.
