# Human Environment Protocol

Source protocol: `1.0-preview.4`

## Endpoints

```text
GET  /api/he/capabilities
GET  /api/he/observation
GET  /api/he/reads/{read_id}?expected_snapshot_id=...
POST /api/he/clients/register
GET  /api/he/controller
POST /api/he/controller/acquire|renew|release
POST /api/he/actions
GET  /api/he/actions/{request_id}
```

## Observation

Capabilities carry Host/game/Modset identity, environment fingerprint and
optional Host implementation provenance. The hot observation carries:

```text
snapshot_id, sequence, status, persistent,
interaction { interaction_id, kind, stage, prompt, content_schema, content },
referents[], affordances[], reads[], completeness,
session { runtime_instance_id, environment_fingerprint }, observation_policy
```

A referent is a player-visible object or control identity. Facts create
referents independently of action publication. An affordance has one optional
`subject_ref` plus role-labelled `arguments[]`; each reference must exist in
the current snapshot. Exact native operands stay inside the Host.

`reads[]` advertises all bounded, non-authorizing information reads. Consumers
send the opaque `read_id`; C rejects stale snapshots and arbitrary fields.

## Action And Receipt

An action request contains request ID, expected snapshot ID, opaque affordance
ID and controller lease identity. C rebuilds the interaction, referents and
exact native binding immediately before delivery.

Receipts are `applied`, `not_applied` or `unknown`. Applied proves native input
delivery, not business completion. Unknown delivery never permits automatic
retry. The receipt repeats the public subject/arguments and may include an
immediate successor.

## Host Neutrality

Live and future Headless Hosts implement the same fair-player semantics. A
Headless Host need not fabricate UI nodes or .NET MVIDs; it must provide stable
interaction/referent identity, current affordances, exact environment identity
and equivalent stale/idempotency behavior. Reset, seed, save/load, clone/fork,
fast-step, scenario mutation, rewards and tensors are separate APIs.

## Exclusions

C contains no source authority, SourceContract, business Outcome, hidden state,
arbitrary reflection, coordinate input, model-generated native operand,
strategy, reward or privileged simulator control.
