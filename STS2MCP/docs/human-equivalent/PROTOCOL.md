# Human-Equivalent Protocol

Source protocol: `1.0-preview.1`

## Endpoints

```text
GET  /api/he/capabilities
GET  /api/he/observation?mode=he_assisted|he_pure
GET  /api/he/inspections/{kind}?expected_state_token=...&mode=...
GET  /api/he/linked-details/{entity_id}?expected_state_token=...&mode=...
POST /api/he/clients/register
GET  /api/he/controller
POST /api/he/controller/acquire|renew|release
POST /api/he/actions
GET  /api/he/actions/{request_id}
```

## Observation

`HumanSnapshot` contains exact state/frame/current owner, persistent visible
run facts, current surface/context facts, entities, controls, affordances,
visibility metadata and optional annotations. `he_pure` requires annotations
to be null. An annotation always has `authorization_effect=none`.

Affordances use generic UI verbs and bind exact target, owner and parameters.
No V2/V3 action ID, index, coordinate, node path or method name is accepted.

Inspection and linked detail are separate state-bound, read-only contracts.
Only catalogued kinds/entities are accepted; they never create action authority
and stale tokens fail closed.

## Action And Receipt

Requests bind request ID, mode, expected state/frame/owner, affordance ID,
exact parameters and controller lease generation. The Gateway re-observes and
calls one bounded native UI adapter.

Receipts use `applied`, `not_applied` or `unknown`. Applied means input was
delivered; successor is the game fact channel. If its immediate read fails,
delivery stays `applied` with a null successor and Re performs a fresh read.
Unknown is reserved for uncertain input delivery and never permits retry.

Controller registration and lease responses use the HE control schema. The HE
client does not decode V3 control payloads even though the in-process
single-writer coordinator is shared infrastructure.

## Evidence Boundary

Protocol/source/test/build/install/load/Live are distinct. This wire contract
does not itself claim compatibility with a game version or Mod.
