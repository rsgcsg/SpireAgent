# Player Environment: New Engineer Guide

## What C Is

C is the fair-player environment boundary between STS2 and an external
consumer. It answers three questions without modeling game strategy or
business transactions:

1. **Observe:** what stable information can a normal player currently obtain?
2. **Read:** what additional normal-player detail is currently inspectable?
3. **Interact:** which exact current UI inputs can the player deliver?

The normal path has one truth source and one executor:

```text
STS2
-> LiveHost visible facts and current owner
-> NativeUi private exact bindings
-> PlayerEnvironment Snapshot / Read / BoundAction / Receipt
-> REST or optional MCP bytes
-> Re or another consumer projection
```

## Read This Code In Order

1. `STS2MCP/PlayerEnvironment/Protocol/PlayerEnvironmentContracts.cs`
2. `STS2MCP/PlayerEnvironment/Core/PlayerEnvironmentService.cs`
3. `STS2MCP/PlayerEnvironment/Observation/SnapshotBuilder.cs`
4. `STS2MCP/PlayerEnvironment/Observation/VisibleInteractionProjection.cs`
5. `STS2MCP/LiveHost/LiveObservationReader.cs`
6. `STS2MCP/NativeUi/NativeUiActionContracts.cs`
7. `STS2MCP/PlayerEnvironment/Projection/BoundActionProjection.cs`
8. `STS2MCP/PlayerEnvironment/Execution/ActionSubmission.cs`
9. `STS2MCP/PlayerEnvironment/Reads/ReadService.cs`
10. `STS2MCP/PlayerEnvironment/Transport/McpMod.PlayerEnvironment.cs`
11. `Re-SpireAgent/src/integrations/sts2mcp/playerEnvironmentProtocol.ts`
12. `Re-SpireAgent/src/integrations/sts2mcp/playerEnvironmentClient.ts`
13. `Re-SpireAgent/src/integrations/sts2mcp/playerEnvironmentAdapter.ts`
14. `Re-SpireAgent/src/normalization/normalizePlayerEnvironmentCurrentState.ts`
15. `Re-SpireAgent/src/domain/actions/buildPlayerEnvironmentAllowedActions.ts`
16. `Re-SpireAgent/src/runtime/advertisedActionExecutor.ts`

Do not read Bridge v2 or Connector V3 audits first. They explain deleted
designs and old evidence, not current behavior.

## One Action End To End

```text
LiveHost extracts visible facts and one current input owner
-> NativeUi discovers current controls and keeps native operands private
-> VisibleInteractionProjection publishes an explicit Host-private-field-free view
-> SnapshotBuilder derives referents and reads from those visible facts
-> BoundActionProjection materializes every finite current binding
-> Re gives the model local opaque choices
-> Re submits request_id + snapshot_id + bound_action_id + controller lease
-> ActionSubmission rejects duplicate, stale or wrong-controller requests
-> NativeUi rebuilds and revalidates the private native binding
-> STS2 receives the native UI callback
-> C returns delivered / not_delivered / unknown plus a successor when readable
-> Re interprets progress without reconstructing native legality
```

## Terms And Owners

- **Snapshot:** one state-bound fair-player view.
- **Interaction:** the one current player input scope and stage.
- **Referent:** a public player-visible entity or explicitly observed control
  identity derived from Snapshot facts, never from the action catalog.
- **Read:** an advertised, read-only, state-bound information opportunity.
- **BoundAction:** an opaque finite projection of one current private binding.
- **Native binding:** Host-local control, objects and operands; never wire data.
- **Receipt:** input-delivery evidence, not business completion.
- **Successor:** the immediate post-delivery Snapshot when one can be read.
- **Identity/Control:** provenance, one writer and idempotency; not game legality.

To add an interaction, put visible extraction in `LiveHost`, list its public
fields in `VisibleInteractionProjection`, and keep exact control resolution in
`NativeUi`. Add its finite projection in `BoundActionProjection`. To add a Read,
advertise it in the Snapshot and implement it in `ReadService`. Never teach Re
a second source whitelist or native legality rule.

## Failure Rules

Zero or multiple owners, a public operand absent from visible facts, incomplete
finite projection, stale Snapshot, missing
native target, incomplete artifact identity, controller mismatch and unknown
delivery fail closed. Reads never authorize mutation. Unknown delivery is never
retried automatically.

## Current Truth

- Machine contract: `contracts/player-environment-contract.json`
- Protocol: `STS2MCP/docs/player-environment/PROTOCOL.md`
- Coverage: `STS2MCP/docs/player-environment/COVERAGE.md`
- Architecture: `docs/current/ARCHITECTURE.md`
- Runtime evidence: dated closeouts for one exact artifact only
