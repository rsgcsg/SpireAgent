# Re Player Environment Coverage

Host coverage is canonical in
[Player Environment Coverage](../../STS2MCP/docs/player-environment/COVERAGE.md).

Re strictly accepts protocol `1.0-rc.1`, preserves persistent facts,
current interaction, referents and read opportunities, and imports choices only
from a complete current bound-action projection. It does not add native
operands, infer legality/effects or retry unknown delivery.

| Area | Re path | Current evidence |
|---|---|---|
| menu/combat/map/event/reward/shop/rest/selectors | tagged interaction and referents | source/automated; new-artifact Live pending |
| finite actions | complete bound-action catalog | source/automated; new-artifact Live pending |
| information | advertised reads | source/automated; new-artifact Live pending |
| native-page evidence | not in normal Re flow | Host source/tests; Live pending |

Malformed schema, identity drift, stale snapshot, replacement referent or
missing current action produces no input.
