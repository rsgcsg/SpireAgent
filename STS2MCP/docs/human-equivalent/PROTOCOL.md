# Human Environment Protocol

Source protocol: `1.0-preview.3`

## Endpoints

```text
GET  /api/he/capabilities
GET  /api/he/observation
GET  /api/he/inspections/{kind}?expected_snapshot_id=...
GET  /api/he/linked-details/{element_id}?expected_snapshot_id=...
POST /api/he/clients/register
GET  /api/he/controller
POST /api/he/controller/acquire|renew|release
POST /api/he/actions
GET  /api/he/actions/{request_id}
```

## Capabilities And Observation

Capabilities contain host/game/Modset identity, an exact environment
fingerprint, supported verbs, and optional host implementation provenance such
as Live DLL SHA/MVID. A hot observation contains:

```text
snapshot_id, sequence, status, owner, persistent,
surface { kind, stage, prompt, content_schema, content },
elements[], affordances[], reads[], completeness,
session { runtime_instance_id, environment_fingerprint }, observation_policy
```

Elements are the only public target ontology. They carry role/category,
visible/enabled/selected/focused state, observation basis, available actions
and optional schema-versioned player-visible properties. Every affordance and
targeted read must reference a current element.

Persistent content, `surface.content`, element properties and read content each
carry a schema identifier. `reads[]` unifies
Inspection and linked detail as non-authorizing snapshot-bound opportunities;
the bounded endpoints remain separate implementation routes.

## Action And Receipt

An action request contains request ID, expected snapshot ID, opaque affordance
ID and controller lease identity. C rebuilds the UI and exact host-local native
binding before delivery.

Receipts are `applied`, `not_applied` or `unknown`. Applied means native input
delivery, not business completion. A null immediate successor never changes a
known delivery into unknown. Unknown delivery never permits automatic retry.

## Exclusions

C contains no source authority, business Outcome, reward, reset/seed/fork,
hidden state, arbitrary reflection, coordinate or model-generated operand.
D annotations and Training/Headless lifecycle are separate contracts.

## Evidence Boundary

`preview.3` is a breaking contract correction. Source/tests/build/install/load/
Live/qualification are separate, and no `preview.2` Live evidence transfers.
