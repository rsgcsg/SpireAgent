# Connector V3 State Coverage

This file records the current Re consumer boundary. Gateway implementation and
exact-runtime evidence status are canonical in
[Connector V3 Coverage](../../STS2MCP/docs/connector-v3/COVERAGE.md).

## Current Contract

Re strictly accepts `3.0-preview.4` observations and receipts. It preserves:

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
| combat commands | direct V3 resolver and direct Re consumer | Gateway/Re tests plus 11 protocol-rewritten saved-snapshot checks | direct consumer repeatedly exercised under Preview.3 |
| combat-hand selection | exact hand/card/control discovery, direct V3 resolver and direct Re consumer | Gateway descriptors plus Re owner/card/no-sidecar positives and wrong-owner negative | Provider/sidecar predecessor exercised under Preview.3; direct Preview.4 path pending cold load |
| shop-room commands | direct V3 resolver | Gateway tests | exercised on v0.110.0 |
| map/rest/deck-enchant commands | direct V3 resolvers | Gateway and Re tests | map/deck-enchant exercised; Dream Catcher handoff remains pending |
| menu/run setup | direct V3 normalization and native resolver | direct normalization, descriptor and no-sidecar tests | direct consumer and resolver completed a 95-decision run |
| event/map/game over consumer | direct V3 normalization and game-over direct native resolver | strict decode, exact binding negatives and recorded replay | exact runtime exercised all three direct consumers and both game-over controls |
| reward/card-reward consumer | direct V3 normalization | strict screen/entity/control negatives | exact-runtime exercised in a completed 175-decision run |
| shop/rest/treasure consumer | direct V3 normalization | exact offer/option/stage negatives | direct consumer exercised under Preview.2 |
| generated card choice | source-discriminated native resolver and direct Re consumer | source/owner/screen/card/control tests | direct Attack Potion choice exercised under Preview.3 |
| other non-combat selectors | migration adapter | inherited Provider and V3 tests | selected families exercised |
| visible unsupported interaction | implemented | tests | Crystal Sphere, unknown deck selector and pre-repair Symbiote exercised |
| typed V3 visible-state projection | shared persistent summary plus visibility and Inspection-catalog metadata for direct contexts | strict schema, projection and saved-snapshot replay | direct menu exercised; expanded contexts pending cold load |
| V3-native Inspection content | typed state-token-bound run deck/combat piles/shop catalog client | strict content decode and stale-token negative | pending cold load |

Ordinary combat, combat-hand selection, generated-card choice,
main/singleplayer/character menus,
event options, map navigation, game over, reward/card-reward, shop, rest,
treasure, lifecycle-settling and visible unsupported no longer
request the v2 capabilities sidecar.
For remaining Surfaces, the
temporary same-runtime sidecar contributes mature environment and semantic
projection only. It contributes no legal action, operand, execution route or
completion claim.

## Fail-Closed Rules

- Unknown protocol, identity mismatch, malformed candidate, stale state,
  duplicate entity identity or unsupported interaction produces no action.
- `unknown`, transport uncertainty and inconsistent receipt identity stop the
  run without mutation retry.
- Hidden RNG, real draw order, future rewards/events/enemy moves and private
  game state are never normalized.
- A fixture or predecessor V2 journey cannot qualify V3.
