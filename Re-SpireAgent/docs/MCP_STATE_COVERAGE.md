# Connector V3 State Coverage

This file records the current Re consumer boundary. Gateway implementation and
exact-runtime evidence status are canonical in
[Connector V3 Coverage](../../STS2MCP/docs/connector-v3/COVERAGE.md).

## Current Contract

Re strictly accepts `3.0-preview.1` observations and receipts. It preserves:

- exact Gateway, game, Modset and runtime identity;
- the state token and active interaction ID;
- semantic context, visible surface and shared player facts;
- visible unsupported interactions with no executable candidates;
- exact candidate operands and Gateway-provided operand domains;
- `completed`, `not_executed`, `pending` and `unknown` receipts.

Re emits executable choices only from the current V3 candidate set. A local
choice is bound to the current state token, interaction, command and exact
operands.

## Evidence Status

| Area | Re implementation | Automated evidence | Exact V3 runtime |
|---|---|---|---|
| strict observation and receipt decoding | implemented | tests | v0.110.0 journey completed after explicit-null repair |
| candidate and operand-domain projection | implemented | tests | exercised |
| stale local choice rejection | implemented | tests plus Gateway ledger tests | two safe pre-execution refusals observed |
| unknown-no-retry supervision | implemented | tests | one rest Outcome became unknown and terminated without retry |
| combat commands | direct V3 resolver | Gateway/Re tests | play, potion and end-turn receipts completed |
| shop-room commands | direct V3 resolver | Gateway tests | exercised on v0.110.0 |
| map/rest/deck-enchant commands | direct V3 resolvers in repaired source | Gateway and Re tests | old map/rest paths exposed defects; repaired artifact pending |
| other non-combat commands | migration adapter | inherited Provider and V3 tests | event/reward/shop inventory/treasure/selection exercised |
| visible unsupported interaction | implemented | tests | Crystal Sphere, unknown deck selector and pre-repair Symbiote exercised |
| V3-native Inspection/detail | pending | none | pending |

The temporary same-runtime v2 capabilities sidecar contributes mature
environment and semantic projection only. It contributes no legal action,
operand, execution route or completion claim.

## Fail-Closed Rules

- Unknown protocol, identity mismatch, malformed candidate, stale state,
  duplicate entity identity or unsupported interaction produces no action.
- `unknown`, transport uncertainty and inconsistent receipt identity stop the
  run without mutation retry.
- Hidden RNG, real draw order, future rewards/events/enemy moves and private
  game state are never normalized.
- A fixture or predecessor V2 journey cannot qualify V3.
