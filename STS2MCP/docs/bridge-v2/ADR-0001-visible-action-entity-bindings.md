# ADR-0001: Visible Action Entity Bindings

Status: accepted; organically requalified under `2.0-preview.9`  
Date: 2026-07-17

## Decision

Bridge legal actions retain an opaque, exact-state `action_id` as their only
executable handle. They additionally expose `entity_bindings`, a list of
role-to-entity references whose entity IDs must already occur in the current
player-visible Context or Surface.

Examples include `card -> card_x`, `target -> enemy_y`, `potion -> potion_z`,
`reward -> reward_q`, and `option -> event_option_r`. Actions with no visible
entity subject use an empty list.

## Evidence

Organic combat on the exact supported build produced two living `Corpse Slug`
enemies and duplicate `Strike`/`Defend` cards. Multiple legal actions had the
same label but different opaque IDs. Execution remained safe, yet neither a
human auditor nor the LLM could map each action ID to the corresponding visible
card and target. The same structural ambiguity can occur in existing card
reward, reward claim, event option, and enchant surfaces.

## Why Not Labels Alone

Adding HP, ordinal, or internal IDs to prose labels would create a formatting
contract and still fail when visible values collide. Bindings preserve the
actual relationship between an action and already-exposed semantic entities.
They do not attempt to generalize action arguments or UI geometry.

## Safety Boundary

- command submission remains `request_id + expected_state_id + action_id`;
- bindings are not accepted from clients and never drive execution;
- mutable game objects, indices, nodes, and call paths stay in the registry;
- Re fails closed if a binding points outside visible Context/Surface evidence;
- execution still revalidates exact state and game objects;
- no hidden entity, RNG, draw order, or future result is exposed.

## Migration

The following records the original preview.4-to-preview.5 migration. The
binding contract is unchanged in current preview.9; newer protocol increments
added separate Surface semantics rather than changing command authority.

- protocol version advances from `2.0-preview.4` to `2.0-preview.5`;
- Bridge emits a non-null binding array for every legal action;
- Re strictly requires `preview.5`, validates references, and forwards bindings
  to the allowed-action prompt/evidence model;
- old installed DLLs fail protocol negotiation rather than silently dropping
  semantics.

## Qualification

Fixture and contract tests prove serialization, strict decode, reference
integrity, and unchanged opaque commands. Fresh preview.9 organic runs then
executed 165 Bridge-authorized actions across combat, pile selection, event,
card reward, reward claim, and deck enchant surfaces. Duplicate combat cards
and enemies remained distinguishable through visible bindings. This qualifies
the binding mechanism for observed shapes; it does not qualify every future
entity role or Surface.

## Rollback

Revert this protocol increment and reinstall the prior DLL. Because bindings
never enter command execution, rollback does not require state migration.
