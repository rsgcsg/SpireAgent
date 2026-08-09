# Human-Equivalent Protocol

Source protocol: `1.0-preview.2`

## Endpoints

```text
GET  /api/he/capabilities
GET  /api/he/observation
GET  /api/he/inspections/{kind}?expected_state_token=...
GET  /api/he/linked-details/{entity_id}?expected_state_token=...
POST /api/he/clients/register
GET  /api/he/controller
POST /api/he/controller/acquire|renew|release
POST /api/he/actions
GET  /api/he/actions/{request_id}
```

## Observation

`HumanSnapshot` contains the exact state token, current owner, persistent
player-visible facts, current UI Surface facts, entities, controls,
affordances, visibility metadata and explicit coverage gaps. It contains no D
mode or annotation envelope. D may be composed by A as a separate optional
input but cannot alter this contract.

Affordances expose a generic UI verb, opaque affordance ID, current target,
owner and label. Exact native operands stay in a C-local, snapshot-bound
binding. Re submits only the opaque affordance ID and state token; it cannot
construct, replace or add native operands.

Inspection and linked detail are separate state-bound read-only contracts.
Only catalogued kinds/entities are accepted; they never create action
authority and stale tokens fail closed.

## Action And Receipt

An action request contains request ID, expected state token, affordance ID and
controller lease identity. C rebuilds the current UI, resolves the exact
C-local binding, revalidates current target/actionability and invokes one
bounded native UI adapter.

Receipts use `applied`, `not_applied` or `unknown`. Applied means input was
delivered; successor is the game-fact channel. If an immediate successor read
fails, delivery stays `applied` with a null successor and A performs a fresh
read. A transitional successor is checkpoint-pending, not an execution
failure. Unknown is reserved for uncertain input delivery and never permits
retry.

Controller registration and lease responses use the HE control schema. The HE
client does not decode V3 control payloads even though the process-local
single-writer coordinator is shared native infrastructure.

## Evidence Boundary

Protocol/source/test/build/install/load/Live are distinct. `preview.2` is a
breaking cleanup and inherits no `preview.1` loaded or Live evidence.
