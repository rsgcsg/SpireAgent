# Human-Equivalent State Coverage

Gateway implementation and exact-runtime evidence are canonical in
[Human-Equivalent Coverage](../../STS2MCP/docs/human-equivalent/COVERAGE.md).

## Current Contract

Re strictly accepts the current `1.0-preview.1` HumanSnapshot, finite
affordances and delivery receipts. It preserves exact Gateway/game/Modset/
runtime identity, state/frame/owner bindings, persistent visible state,
visible unsupported UI, `he_assisted` annotations and annotation-free
`he_pure`.

Re emits choices only from the current affordance set. It does not read V2/V3
state sidecars, add operands, infer native legality, wait for a business
Outcome or retry unknown delivery.

## Source And Test Coverage

| Area | Current path | Evidence boundary |
|---|---|---|
| menus, map, event, game over | HE projection over bounded native controls | source and automated tests; current HE Live pending |
| combat hand, targets, potion, end turn | HE projection over exact native adapters | source and automated tests; current HE Live pending |
| reward, shop, rest, treasure | HE projection over current UI controls | source and automated tests; current HE Live pending |
| card selectors | source-independent generated choice plus inherited bounded UI mechanics | unknown generated source tested; other unknown owners remain explicit unsupported |
| Inspection | `/api/he/inspections/*`, state-bound and read-only | source/build tests; current HE Live pending |
| linked detail | `/api/he/linked-details/*`, catalogued current card only | source/build tests; current HE Live pending |

## Fail-Closed Rules

- malformed HE schema, identity drift, stale state/frame/owner, replacement
  target, missing control or exact parameter mismatch produces no input;
- unknown delivery and transport uncertainty stop without retry;
- hidden RNG, true draw order, future rewards/events/moves and arbitrary game
  object reads are unavailable;
- D annotations cannot create, remove or authorize an affordance;
- build/install and historical V3 journeys do not prove current HE Live use.
