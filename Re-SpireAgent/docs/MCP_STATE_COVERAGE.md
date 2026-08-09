# Human-Equivalent State Coverage

Gateway implementation and exact-runtime evidence are canonical in
[Human-Equivalent Coverage](../../STS2MCP/docs/human-equivalent/COVERAGE.md).

## Current Contract

Re strictly accepts the current `1.0-preview.3` Human Environment snapshot, finite
affordances and delivery receipts. It preserves exact Gateway/game/Modset/
runtime identity, state/owner binding, persistent visible state and visible
unsupported UI. C contains no D mode or annotations.

Re emits choices only from the current affordance set. It does not read V2/V3
state sidecars, add operands, infer native legality, wait for a business
Outcome or retry unknown delivery.

## Source And Test Coverage

| Area | Current path | Evidence boundary |
|---|---|---|
| menus, map, event, game over | HE projection over bounded native elements | source/automated plus loaded read-only main-menu; preview.3 mutation pending |
| combat hand, targets, potion, end turn | HE projection over exact native adapters | source and automated tests; preview.3 Live pending |
| reward, shop, rest, treasure | HE projection over current UI elements | source and automated tests; preview.3 Live pending |
| card selectors | source-independent generated choice plus inherited bounded UI mechanics | unknown generated source tested; other unknown owners remain explicit unsupported |
| Inspection | `/api/he/inspections/*`, snapshot-bound and read-only | source/build tests; preview.3 Live pending |
| linked detail | `/api/he/linked-details/*`, catalogued current card only | source/build tests; preview.3 Live pending |

## Fail-Closed Rules

- malformed HE schema, identity drift, stale state, replacement target or
  missing current control produces no input;
- unknown delivery and transport uncertainty stop without retry;
- hidden RNG, true draw order, future rewards/events/moves and arbitrary game
  object reads are unavailable;
- optional D input is composed outside C and cannot create, remove or authorize
  an affordance;
- build/install and historical V3 journeys do not prove current HE Live use.
