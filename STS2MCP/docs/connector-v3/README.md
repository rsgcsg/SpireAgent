# Connector V3

Connector V3 is the current STS2 Semantic Gateway contract. The canonical
architecture is [ADR-0007](../../../docs/current/decisions/ADR-0007-connector-v3-canonical-architecture.md).

```text
GET  /api/v3/capabilities
GET  /api/v3/observation
GET  /api/v3/inspections/{kind}?expected_state_token={state_token}
POST /api/v3/commands
GET  /api/v3/commands/{request_id}
```

Client registration and the single-controller lease are also available under
`/api/v3/clients/*` and `/api/v3/controller/*`.

See [Protocol](PROTOCOL.md), [Coverage](COVERAGE.md), and the latest reviewed
[v0.110.1 complete-run evidence](LIVE_EVIDENCE_V0_110_1_DIRECT_REWARD_COMPLETE_RUN_2026-08-02.md).
That evidence closes direct reward/card-reward consumption for its exact
loaded artifact. The current direct shop/rest/treasure and Inspection
replacement is built and installed but remains pending cold-load.
Bridge v2 documentation is retained as migration and runtime evidence, not
current Agent protocol.
