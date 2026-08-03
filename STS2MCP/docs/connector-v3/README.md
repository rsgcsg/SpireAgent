# Connector V3

Connector V3 is the current STS2 Semantic Gateway contract. The canonical
architecture is
[ADR-0007](../../../docs/current/decisions/ADR-0007-connector-v3-canonical-architecture.md).
Current status is **CONDITIONAL FREEZE CANDIDATE** at `3.0-preview.12`.

```text
GET  /api/v3/capabilities
GET  /api/v3/observation
POST /api/v3/clients/register
GET  /api/v3/controller
POST /api/v3/controller/{acquire|renew|release}
GET  /api/v3/inspections/{kind}?expected_state_token=...
GET  /api/v3/linked-details/{entity_id}?expected_state_token=...
POST /api/v3/commands
GET  /api/v3/commands/{request_id}
```

The optional default-off Human evidence routes are documented in
[Human-equivalence profile](HUMAN_EQUIVALENCE_PROFILE.md).

Current source closure:

- 94 explicit native operation contracts and 0 fallback authority;
- 0 Provider action publication;
- V3-native command descriptors and control wire;
- no active Re V2 state/action sidecar;
- REST/MCP transport only;
- state-bound, non-authorizing Inspection and linked detail.

See [Protocol](PROTOCOL.md), [Coverage](COVERAGE.md),
[Support and compatibility](SUPPORT_AND_COMPATIBILITY.md), and the
[Preview.12 conditional-freeze closeout](PREVIEW_12_CONDITIONAL_FREEZE_CLOSEOUT_2026-08-03.md).
The current adaptation and failure analysis is in the
[freeze re-audit](../../../docs/current/audits/CONNECTOR_V3_FREEZE_READINESS_AND_ADAPTATION_REAUDIT_2026-08-03.md).

Historical Preview evidence remains tied to its exact SHA/MVID/runtime and
cannot qualify the current artifact. Bridge v2 documents are migration and
rollback history, not the current Agent protocol.
