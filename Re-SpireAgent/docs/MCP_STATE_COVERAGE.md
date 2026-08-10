# Human Environment State Coverage

Gateway implementation and exact-runtime evidence are canonical in
[Human Environment Coverage](../../STS2MCP/docs/human-equivalent/COVERAGE.md).

Re strictly accepts Preview.4 observations, finite affordances, reads and
delivery receipts. It verifies exact identity, preserves persistent visible
state, current interaction and referents, and emits choices only from current
affordances. It does not use V2/V3 state sidecars, add native operands, infer
native legality, wait for business Outcome or retry unknown delivery.

| Area | Current path | Evidence boundary |
|---|---|---|
| menu/map/event/game over | HE interaction and referents | source/automated; Preview.4 Live pending |
| combat/targets/potions/end turn | subject plus role-labelled argument referents | source/automated multi-target fixture; Live pending |
| reward/shop/rest/treasure | current HE affordances | source/automated; Live pending |
| selectors | source-free mechanics and exact referents | Preview.3 Live history; Preview.4 Live pending |
| information reads | `/api/he/reads/{read_id}`, snapshot-bound | source/automated; Live pending |

Malformed schema, identity drift, stale snapshot, replacement referent or
missing current affordance produces no input. D is outside C and cannot create,
remove or authorize an affordance.
