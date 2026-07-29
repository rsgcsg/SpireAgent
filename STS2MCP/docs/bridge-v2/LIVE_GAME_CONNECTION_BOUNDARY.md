# Live STS2 Connection Boundary

Status: canonical architecture boundary for the current real-game connection.

Current source compatibility status: C# and Re share `2.0-preview.75`, including
operation scopes, a Gateway artifact digest, separate actual-loaded versus
release-declared game assembly hashes, reviewed exact-environment policy
provenance, structural combat-pile transaction semantics, minimal local
mutation coordination, and exact operation qualification projection. Preview.61
supplied the exact Neow's Fury lifecycle that closed bounded Gate 1. Preview.62
source/build/audit evidence does not inherit that Organic qualification.
Preview.66 is built, installed, cold-loaded, and strictly decoded by Re. Its
final `v0.109.1` identity inherited no older action scope. One exact operation
completed automatic two-epoch requalification. The other 86 current manifest
operations remain session canaries: five use explicit high-precision contracts
and 81 use conservative identity/test-confirm fallbacks. Fallback identity is
not semantic equivalence or persistent qualification. Multi-environment
Profiles are non-authorizing, and the append-only ledger hot-reloads only after
exact revalidation. The loaded identity and precise evidence boundary are
recorded in [Current Status](CURRENT_STATUS.md). Preview.69 adds exact
new/resumed-run mount settling and Gateway-owned encounter provisional trials
while retaining current operation authority. One prior Preview.69 MVID has
broad session-trial coverage. The final built/installed/loaded MVID completed a
saved-run mount and bounded game-over-to-menu journey under a fresh runtime
epoch; its unrecorded evidence and runtime grants are not Organic or persistent
qualification and do not transfer across restart.

Preview.70 later loaded and completed a 124-decision bounded run. It also
exposed the native Silver Crucible empty-chest outcome that the old treasure
Oracle failed to settle. Preview.71 reuses one lifecycle classifier for
treasure projection/completion and later loaded. Preview.72 repairs the next
Hefty/actionless-settling defects and is built/installed/loaded without action
evidence. It does not inherit Preview.71 runtime authority or broaden any
operation.

Consumer distribution, local trust, Companion, BYOK, SDK, and release gates are
defined in the [productization architecture audit](../../../docs/current/audits/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md).

This document defines component names and ownership for the visible STS2
runtime. The repository-level [current architecture](../../../docs/current/ARCHITECTURE.md)
defines the whole-project boundary. Historical closeouts retain their original
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
| Companion Core | The future trusted external supervisor for Gateway sessions, Agent/model processes, secrets, diagnostics, and recovery; not currently implemented |
| Agent Runtime Contract | The future bounded observation/action-choice contract between Companion and an Agent; it is not the native Connector Contract |
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
       - one runtime-bound external mutation-controller lease
       - exact operation qualification and local quarantine
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

The current loopback REST path is unauthenticated. Preview.64 adds one
Gateway-enforced runtime-bound mutation-controller lease, generation fencing
and command attribution. Localhost binding, Origin filtering, descriptive
client registration and lease IDs are coordination layers, not authenticated
client identity. This remains a developer connector path, not a completed
consumer security boundary.

## Target Product Deployment Boundary

The preferred product shape is a minimal in-game Gateway Mod plus an external
Companion Runtime:

```text
Workshop-installed Gateway Mod
  -> authenticated local versioned Connector Contract
  -> external Companion Runtime
       - strict connector decoder, runtime epoch, and controller session
       - provider broker and OS-backed BYOK secrets
       - official Agent supervision, records, diagnostics, and recovery
       - optional MCP and external Agent adapters
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
| Companion Core | authenticated discovery/session/lease use, strict Connector decode, Agent/model supervision, secrets, health, diagnostics, recovery, and product UX | game legality, native completion, new game actions, direct native objects, or hidden state |
| Re game connector | strict decode, identity agreement, coherent structural projection, advertised-action import, submit/poll, unknown-outcome preservation | strict-v2 legality reconstruction, new action synthesis, game permission, native transaction inference, or semantic completion |
| Re strategy and LLM scaffold | salience, candidates, deliberation, selection, memory, review, and learning under project authority policy | Gateway credentials, provider secrets from the broker, direct native object access, hidden state, or bypass of advertised actions |

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
restart. The existing `runtime_instance_id` is the coordination epoch:
registrations and leases disappear on restart, and an unresolved pre-restart
request remains unknown and is never replayed automatically. Preview.64's short
external mutation-controller lease serializes new external submissions;
state binding remains independently necessary for game-state freshness.

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
- descriptive mutation-client registration, one runtime-bound controller
  lease, generation fencing and command attribution;
- an optional Python MCP adapter over the REST routes.

These are source implementation statements. C# and Re agree on Preview.64, but
source agreement is not a loaded-runtime or Organic qualification claim.

Not implemented in the current product path:

- Gateway client authentication or a user-private runtime descriptor;
- authenticated client identity or a user-private runtime descriptor;
- a packaged Companion, consumer secret store/model broker, installer, updater,
  recovery UI, Agent SDK, plugin sandbox, or Headless host;
- a consumer release profile with authentication and controller-session
  policy. The Gateway v1 namespace is already fully retired.

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
not because HTTP is part of the domain model. A future product may authenticate
loopback REST and distribute a user-private runtime descriptor if a concrete
threat model requires it; Preview.64 coordination must not be misrepresented
as that security boundary. A cross-platform IPC rewrite should wait for
measured need.
The eventual product MCP adapter belongs behind Companion policy, defaults to
stdio where practical, receives no Gateway credential, and must remain thin:

- expose the fixed capability/state/Inspection/bundle/submit/poll operations;
- derive bounded Inspection requests from the advertised fixed catalog;
- preserve exact request, state, action, and error identity;
- never add arbitrary scene, reflection, method, script, or content tools.

The default Python MCP adapter is now v2-only and exposes all three fixed
Inspection kinds: `run_deck`, `combat_piles`, and `shop_catalog`. Tool
availability remains transport completeness, not game authority.

## Headless Boundary

Headless is deferred to the separate [Headless documentation
area](../../../docs/current/headless/README.md). No Headless host, shared runtime
kernel, permission profile, or equivalence claim is implemented by this
boundary.

Headless implementation may start only after the live admission gate in the
[Headless target architecture](../../../docs/current/headless/TARGET_ARCHITECTURE.md)
is explicitly met. Until then, all game integration engineering should close
the live gateway's transaction, source-binding, adapter-consistency, and exact
runtime evidence gaps.
