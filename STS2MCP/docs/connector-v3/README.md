# Connector V3

Connector V3 is the current STS2 Semantic Gateway contract. The canonical
architecture is [ADR-0007](../../../docs/current/decisions/ADR-0007-connector-v3-canonical-architecture.md).

```text
GET  /api/v3/capabilities
GET  /api/v3/observation
GET  /api/v3/inspections/{kind}?expected_state_token={state_token}
GET  /api/v3/linked-details/{entity_id}?expected_state_token={state_token}
POST /api/v3/commands
GET  /api/v3/commands/{request_id}
```

Client registration and the single-controller lease are also available under
`/api/v3/clients/*` and `/api/v3/controller/*`.

See [Protocol](PROTOCOL.md), [Coverage](COVERAGE.md), and the latest reviewed
[v0.110.1 Preview.5 selector/Inspection evidence](LIVE_EVIDENCE_V0_110_1_PREVIEW_5_SELECTOR_INSPECTION_2026-08-02.md).
That evidence proves direct Smith, `run_deck` Inspection, linked detail and
stale refusal for its exact loaded artifact. The
[Preview.6 cutover](PREVIEW_6_LUMINOUS_CHOIR_EVENT_REMOVAL_CUTOVER_2026-08-02.md)
implements the next Organic blocker and is built/installed but not loaded.
Merchant removal, combat-hand and the new event transaction still require
current exact-runtime exercise.
Bridge v2 documentation is retained as migration and runtime evidence, not
current Agent protocol.
