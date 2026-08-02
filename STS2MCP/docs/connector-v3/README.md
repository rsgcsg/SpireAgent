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
[v0.110.1 Preview.4 complete-run evidence](LIVE_EVIDENCE_V0_110_1_PREVIEW_4_COMPLETE_JOURNEY_2026-08-02.md).
That evidence exercises direct combat, generated choice and ordinary
non-combat consumption for its exact loaded artifact. Preview.5's direct Smith
upgrade, merchant removal and linked detail, plus combat-hand and Inspection,
remain pending exact-runtime exercise.
Bridge v2 documentation is retained as migration and runtime evidence, not
current Agent protocol.
