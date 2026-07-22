# Live STS2 Connection Boundary

Status: canonical architecture boundary for the current real-game connection.

Current compatibility warning: the C# Bridge source is `2.0-preview.54` while
Re-SpireAgent currently requires `2.0-preview.56`. Until the
[source-truth repair](REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md)
closes, this document defines the intended ownership boundary, not proof that a
clean checkout currently negotiates end to end.

This document defines component names and ownership for the visible STS2
runtime. Root [ARCHITECTURE.md](../../../ARCHITECTURE.md) remains authoritative
for the whole SpireAgent system. Historical closeouts retain their original
evidence; when their use of "MCP", "Bridge", or "headless" is ambiguous, use
the terms below.

## Canonical Names

| Name | Meaning |
|---|---|
| STS2 live runtime | The real, visible game process and its game-owned rules, objects, Tasks, hooks, RNG, and Commit paths |
| Live Semantic Gateway | The protocol-neutral game-side domain runtime currently implemented by `STS2MCP/BridgeV2` |
| REST adapter | The current HTTP serialization of the gateway contract and Re-SpireAgent's primary connection |
| MCP adapter | The optional Python MCP server that maps focused tools to gateway REST operations |
| Re game connector | The strict decoder, REST client, structural projection, action submission, and settlement consumer in Re-SpireAgent |
| Headless host | A future, separate runtime project; none is implemented or qualified in SpireAgent today |

`STS2MCP` and `STS2_MCP` remain repository and installed-artifact names. They
must not be used as shorthand for all of the gateway, REST API, MCP adapter,
Re connector, or a future Headless host. "Bridge v2" remains the current
protocol/revision family; "Live Semantic Gateway" names the durable domain
boundary.

## Current Live Path

```text
STS2 live runtime
  -> game-owned objects, Tasks, hooks, and Commit paths
  -> Live Semantic Gateway
       - visible observation and exactly one input owner
       - exact-environment permission enforcement
       - state-bound opaque actions and exact operands
       - execute-time revalidation
       - Command lifecycle and semantic completion
       - read-only Inspections and environment evidence
  -> REST adapter
  -> Re game connector
  -> normalized strategic state and advertised actions
  -> Re/LLM deliberation
```

The optional MCP route is parallel to REST at the transport edge:

```text
Live Semantic Gateway -> REST adapter -> Python MCP adapter -> MCP client
```

Re-SpireAgent does not use the Python MCP server in its strict Bridge v2 path.
MCP tool discovery proves only adapter availability. It does not grant game
legality, exact-build permission, qualification, or strategic authority.

## Target Product Deployment Boundary

The preferred product shape is a minimal in-game Gateway Mod plus an external
Companion Runtime:

```text
Workshop-installed Gateway Mod
  -> local versioned connector contract over REST/IPC
  -> external Companion Runtime
       - strict connector decoder and controller session
       - model providers and BYOK secrets
       - agent loop, records, diagnostics, and optional MCP adapter
```

The Gateway remains authoritative for native observation, input ownership,
legality, commit, completion, and exact-environment permission. The Companion
owns provider dependencies, API keys, orchestration, and product operations.
Secrets and full Agent execution should not be embedded in the game process.
This is a target deployment boundary, not a claim that a packaged Companion is
already implemented.

## Ownership

| Component | Owns | Must not own |
|---|---|---|
| STS2 live runtime | actual rules, state, native Tasks, hooks, RNG, and business Commit | agent strategy or Bridge qualification |
| Live Semantic Gateway | player-visible projection, unique input ownership, action and operand binding, runtime permission enforcement, shared publication/execution validation, native Commit adapters, Command lifecycle, transaction correlation, semantic Witness evaluation, environment/evidence binding | prompts, memory, scoring, learning, hidden strategy truth, arbitrary reflection or scripts |
| REST adapter | HTTP routes, request limits, serialization, main-thread dispatch, typed transport errors | independent legality, source semantics, authority, or completion |
| MCP adapter | focused discovery/read/submit/poll tools over fixed gateway operations | content-specific game rules, arbitrary queries, permission, or strategy |
| Re game connector | strict decode, identity agreement, coherent structural projection, advertised-action import, submit/poll, unknown-outcome preservation | strict-v2 legality reconstruction, new action synthesis, game permission, native transaction inference, or semantic completion |
| Re strategy and LLM scaffold | salience, candidates, deliberation, selection, memory, review, and learning under project authority policy | direct native object access, hidden state, or bypass of advertised actions |

Permission policy records may be authored and reviewed by repository governance,
but the Live Semantic Gateway is the runtime enforcement point. A transport or
client may narrow or reject a request; it may never broaden the gateway's
explicit exact-environment scope.

## Hard Shell

The live connection retains:

- one current input owner;
- player-visible information boundaries;
- opaque actions bound to one exact `state_id`;
- exact entity and operand binding;
- one legality result shared by publication and execution where implemented;
- execute-time revalidation before mutation;
- game-owned Commit paths;
- idempotent Command lifecycle;
- unknown outcomes are not retried;
- semantic post-state Witnesses;
- read-only Inspection outside the Command Ledger;
- explicit game, Modset, Bridge MVID, runtime, and evidence scope;
- Fail Closed behavior for unknown identity, owner, semantics, permission, or
  outcome.

The current Command Ledger is in-memory. Its honest guarantee is at-most-once
handling within one gateway runtime, not durable exactly-once execution across
restart. The target contract must carry a runtime epoch, report an unresolved
post-restart request as unknown, and never replay it automatically. A short
external mutation-controller lease is also required before multiple clients
can be treated as safe; state binding alone does not serialize two controllers.

These are protocol-independent domain properties. REST and MCP must preserve
them rather than reimplement them.

## Current And Target State

Directly implemented at the current repository revision:

- the REST endpoint set for capabilities, state, bounded Inspections,
  observation bundles, action submission, and Command polling;
- exact-environment Surface and Inspection permission enforcement;
- unique active-Surface resolution;
- state-bound opaque action submission and execute-time revalidation;
- provider-specific semantic completion;
- strict Re REST decoding, normalization, advertised-action import, and
  Command polling;
- an optional Python MCP adapter over the REST routes.

These are source implementation statements. Because the current C# and Re
protocol revisions disagree, they are not a current end-to-end compatibility
or loaded-runtime claim.

Still incremental or proposed:

- a first-class native transaction record spanning parent and child decisions;
- shared validation results across more Provider families;
- typed, composable Witness obligation plans;
- generated structural schema consistency across C#, TypeScript, and adapters;
- finer operation/origin evidence scope than the current Surface permission
  gate;
- a protocol-neutral extracted kernel shared with another host.

The proposed items are not current authority. In particular, a Transaction IR,
DecisionFrame, registry, fingerprint, or future shared package cannot grant
permission merely by existing.

## Re-SpireAgent Change Boundary

Re may change for the real-game connection only when the change is directly
about:

- connector negotiation or transport;
- strict protocol decoding and compatibility rejection;
- coherent structural consumption of player-visible gateway state;
- preserving advertised action identity and Command settlement;
- recording exact environment and evidence identity.

Re must not acquire content-specific source switches, native Commit logic,
strict-v2 legality predicates, Witness reconstruction, headless-only game
rules, or a second permission system. Live and any future Headless host should
look like hosts of the same semantic contract, not two branches in strategy
code.

## Transport Conformance

REST is the primary Re transport because it is the current implemented path,
not because HTTP is part of the domain model. The MCP adapter is optional and
must remain thin:

- expose the fixed capability/state/Inspection/bundle/submit/poll operations;
- derive bounded Inspection requests from the advertised fixed catalog;
- preserve exact request, state, action, and error identity;
- never add arbitrary scene, reflection, method, script, or content tools.

Current known drift remains non-authorizing: the Python MCP helper exposes
`run_deck` and `combat_piles` but not the third fixed `shop_catalog` Inspection.
That is an adapter completeness issue, not a missing gateway contract and not
a reason to expand permission.

## Headless Boundary

Headless is deferred to the separate [Headless documentation
area](../../../docs/headless/README.md). No Headless host, shared runtime
kernel, permission profile, or equivalence claim is implemented by this
boundary.

Headless implementation may start only after the live admission gate in the
[Headless target architecture](../../../docs/headless/TARGET_ARCHITECTURE.md)
is explicitly met. Until then, all game integration engineering should close
the live gateway's transaction, source-binding, adapter-consistency, and exact
runtime evidence gaps.
