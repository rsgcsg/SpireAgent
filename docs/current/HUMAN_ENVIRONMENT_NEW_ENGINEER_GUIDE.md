# Human Environment: New Engineer Guide

## What C Is

C is the fair-player environment boundary between real STS2 and any external
consumer. It answers three questions:

1. **Observe:** what can a normal player currently see, and who owns input?
2. **Read:** what additional normal-player information can be opened or
   inspected without authorizing mutation?
3. **Interact:** which exact current native choices can be selected safely?

C is not Re, an LLM prompt, a rules engine or a simulator.

## Read This Code In Order

1. `STS2MCP/HumanEnvironment/Protocol/HumanEnvironmentContracts.cs`
2. `STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentRuntime.cs`
3. `STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentObservationRuntime.cs`
4. `STS2MCP/LiveHost/LiveObservationReader.cs`
5. `STS2MCP/NativeUi/NativeUiActionRuntime.cs`
6. `STS2MCP/Authority/GatewayAuthorityRuntime.cs`
7. `STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentActionRuntime.cs`
8. `STS2MCP/HumanEnvironment/Transport/McpMod.HumanEnvironment.cs`
9. `Re-SpireAgent/src/integrations/sts2mcp/humanEnvironmentProtocol.ts`
10. `Re-SpireAgent/src/integrations/sts2mcp/humanEnvironmentAdapter.ts`
11. `Re-SpireAgent/src/normalization/normalizeHumanEnvironmentCurrentState.ts`
12. `Re-SpireAgent/src/domain/actions/buildHumanEnvironmentAllowedActions.ts`
13. `Re-SpireAgent/src/domain/actions/action.ts`

Do not read Bridge v2 or Connector V3 audits first. They explain history, not
the current production path.

## One Action End To End

```text
LiveHost observes one owner and visible state
-> NativeUi discovers exact current candidates and keeps native operands local
-> HumanEnvironment publishes referents, capabilities and bound actions
-> Re strictly decodes and gives the model finite local choices
-> Re submits request_id + snapshot_id + bound_action_id + controller lease
-> Authority rejects duplicate/stale/wrong-controller requests
-> NativeUi rebuilds and revalidates the exact native binding
-> STS2 receives its native input/Commit
-> HumanEnvironment returns attributed delivery receipt + successor
-> Re waits for stable progress without reconstructing rules
```

## Terms

- **snapshot:** one state-bound fair-player world.
- **interaction:** the one current input protocol and its stage.
- **referent:** a visible entity or control identity in that snapshot.
- **read:** a read-only, state-bound information opportunity.
- **bound action:** an opaque current execution handle whose public subject and
  arguments reference current referents.
- **native binding:** Host-local controls, objects and operands behind a bound
  action. It never crosses the wire.
- **receipt:** action-local delivery evidence: applied, not applied or unknown.
- **successor:** the immediate post-delivery observation when available.

## Failure Rules

Zero or multiple owners, incomplete projection, stale snapshot, missing native
target, identity drift, controller mismatch and unknown delivery all fail
closed. Reads never enter mutation authority. Unknown delivery is never retried.

## Consumer Examples

An LLM can request reads lazily and select from finite labelled choices. A
memoryless RL adapter can eagerly aggregate selected reads for one coherent
snapshot. Search/Replay can build their own views. None may add an action or
replace the C-local binding table.

## Where Truth Lives

- Machine-readable wire inventory: `contracts/human-environment-contract.json`
- Protocol: `STS2MCP/docs/human-environment/PROTOCOL.md`
- Information/interaction coverage: `STS2MCP/docs/human-environment/COVERAGE.md`
- Cross-component architecture: `docs/current/ARCHITECTURE.md`
- Exact runtime evidence: dated closeouts only
