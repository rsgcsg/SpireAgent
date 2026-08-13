# Re Player Environment Coverage

Host coverage is canonical in the standalone
[STS2 Connector repository](https://github.com/rsgcsg/STS2-Connector).

Re strictly accepts protocol `1.0-rc.2`, preserves persistent facts,
current interaction, referents and read opportunities, and imports choices only
from a complete current bound-action projection. It does not add native
operands, infer legality/effects or retry unknown delivery.

| Area | Re path | Current evidence |
|---|---|---|
| menu/combat/map/event/reward/shop/rest/selectors | tagged interaction and referents | Connector-owned contract; Re fixtures |
| finite actions | complete bound-action catalog | SDK strict decode and Re projection tests |
| information | advertised Reads | SDK coherence and Re normalization tests |
| native-page evidence | not in normal Re flow | Connector-owned evidence profile |

Malformed schema, identity drift, stale snapshot, replacement referent or
missing current action produces no input.
