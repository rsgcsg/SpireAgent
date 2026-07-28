# Current Architecture

## Architecture Authority

The single accepted destination is the
[Semantic Gateway Two-Plane Target Architecture](decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
Its live-kernel identity migration is refined by
[ADR-0003](decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md).
Its risk-calibrated trial/claim boundary is refined by
[ADR-0004](decisions/ADR-0004-risk-calibrated-encounter-trial-and-scoped-claims.md).
This document describes both the current implementation and its constrained
migration toward that target. Historical ALDG, universal contract/Transaction
IR, qualification-centric, and environment-migration proposals are evidence
inputs, not alternative active architectures.

## Product Boundary

```text
Slay the Spire 2 process
  -> STS2MCP Semantic Gateway Mod
       -> versioned local REST Connector Contract
       -> optional MCP adapter
  -> Re-SpireAgent Connector and Agent Runtime
       -> LLM provider selected by local configuration
```

The current direct Re-to-Gateway path is a developer integration, not a
consumer security boundary. The intended future product adds an external
Companion between the Gateway and Agent/provider layers; it is not implemented
yet.

## Accepted Target Architecture

```text
Native STS2 runtime
  -> STS2MCP Semantic Gateway
       Live Semantic Decision Plane
         complete coherent observation evidence
         one active decision owner
         bounded native transaction adapters
         exact state-bound actions
         execute-time revalidation + native commit
         action-local outcome + command receipt
       Compatibility & Evidence Control Plane
         exact provenance and revision inventory
         impact/evidence/trial/claim lifecycle
         quarantine/revoke/rollback
  -> versioned REST contract
  -> Re-SpireAgent
       strict complete evidence record
       evidenced deterministic DecisionProjection
       advertised action-id choice
       transition-aware supervision and replay
```

This is one Connector with two responsibility planes, not two authorities.
The Live plane is the only path to current facts and mutations. The Control
plane may produce non-authorizing evidence and scoped claims, but the Gateway
must validate them before publishing or executing any action. Re's future
`DecisionProjection` is a consumer view, not a second game state. Environment
Profiles and install/rollback tooling sit outside the Gateway as a non-
authorizing operational boundary; an Artifact Router remains conditional on a
demonstrated ABI or load split.

That operational boundary is now a required thin Operator Shell. It reports
disk identity, loaded identity, environment/observation/Inspection/mutation
readiness separately; performs bounded read-only startup waiting; diagnoses
duplicate scanned manifests; collects partial read-only evidence; and keeps
install repair rollbackable. It does not publish actions, acquire the mutation
lease, or bypass Gateway package revalidation.

Ordinary sequences compose from fresh observations and closed advertised
actions. A cross-action `PendingObligation` is allowed only when exact native
evidence proves that a parent transaction remains unresolved across decision
boundaries. No universal workflow, selector, transaction, or Effect DSL is a
target component.

## Ownership

| Owner | Responsibilities | Must not own |
|---|---|---|
| `STS2MCP` Gateway | exact game identity, player-visible facts, active input ownership, local mutation-controller coordination, opaque actions, execute-time validation, main-thread commit, semantic completion, command lifecycle | strategy, provider keys, long-term memory, arbitrary client game calls |
| REST contract | transport of Gateway-owned observation, capabilities, action submission, and outcome state | independent legality or completion rules |
| Optional MCP adapter | ergonomic read/action adaptation over the Gateway contract | a second game-rule engine or a bypass around Gateway permission |
| `Re-SpireAgent` | strict decoding, normalized current state, prompt construction, model invocation, allowed-action selection, run recording, local settlement observation | strict-v2 legality reconstruction, native semantic completion, arbitrary mutation |
| Future Companion | client lifecycle UX, secret storage, provider brokerage, diagnostics, recovery, optional external Agent boundary | sole mutation-lease enforcement, direct game-object access, or independent action execution |

## Connector Safety Kernel

- One resolved Active Surface has mutation authority.
- Every mutation is an opaque, exact-state action; clients cannot submit game
  indices, target paths, or arbitrary payloads.
- Publication and execution use the same Gateway legality; execution adds fresh
  identity and temporal revalidation.
- Completion proves the specific semantic result. An unknown outcome is
  terminal and is never automatically retried.
- Inspection is separately authorized, read-only, state-bound, and outside the
  command ledger.
- Player-visible information is modeled by shared state, context, active
  surface, preview/tooltip, inspection, and transient lifecycle facts rather
  than a raw object dump.
- Version, module, Modset, source binding, ownership, visibility, permission,
  or outcome uncertainty fails closed.
- Local mutation coordination is deliberately smaller than authentication:
  read-only clients remain open, one runtime-bound controller generation may
  submit writes, and descriptive client identity is audit metadata rather than
  a security credential.
- Embedded adaptation data is validated before scope publication. Invalid
  source registries suppress their affected Surface only; invalid environment
  policy suppresses all authority and both cases emit typed diagnostics.
- Diagnostic observation, volatile trial admission, and persistent
  compatibility claims are separate decisions. In `migration_exploration`, a
  complete exact identity may admit only the current uniquely source-resolved
  native action as a runtime-bound trial without preinstalling broad candidate
  packages. This path still requires clean Patch identity, current legality,
  native Commit, semantic completion and immediate local quarantine on
  failure. It cannot write persistent qualification. Persistent packages keep
  their exact-environment evidence, version, revoke and rollback gates.

## Rule-Aware Adaptation Boundary

The Gateway may model a finite native interaction contract: owner references,
visible candidates, selector, bounds, native Commit and semantic post-state
Witness. This is required for safe adaptation and does not make the Gateway a
replacement game engine. It must never calculate or apply native card effects,
Power, Relic, RNG or arbitrary Mod behavior itself.

The closed combat-pile contract catalog is the current single machine source
for seven proven transaction topologies. Runtime validation, offline checks
and compatibility audit consume it; source identity and reviewed permission
remain separate. D-lane fingerprints, classifications, scenarios and graders
have no action authority. Static structure, fixture success and a matching
catalog entry cannot bypass exact runtime identity, execute-time validation,
native Commit or Organic evidence.

Build and Modset claims remain intentionally conservative. Preview.66 adds
non-authorizing Environment Profiles, exact package applicability,
component-level impact comparison, and a risk-based migration policy. A
Profile, static similarity, or package candidate never proves semantic
compatibility. See the
[automatic-adaptation audit](audits/CONNECTOR_AUTOMATIC_ADAPTATION_AND_D_WORKFLOW_AUDIT_2026-07-24.md).

## Permission Decision And Enforcement

```text
D evidence/recommendation (non-authorizing)
  -> Gateway Permission Manager (policy decision)
  -> Gateway action publication/execution (policy enforcement)
  -> native STS2 commit and semantic witness
```

`strict`, `balanced_gray`, `developer_gray`, and `migration_exploration` are
Gateway modes. All retain exact game/Gateway/Modset identity, explicit
operation scope, opaque state-bound actions, execute-time revalidation, native
commit, semantic completion and unknown-no-retry. Migration mode admits either
an installed exact candidate or the current source-resolved encounter under a
bounded risk rule; it is not wildcard authority.
Fallback identities require a non-empty witness emitted by the current
Gateway and remain unqualified until full evidence and package promotion.

Current dynamic grants bind runtime epoch, exact environment, Gateway SHA/MVID,
Modset, Patch digest, operation fingerprint, evidence policy, expiry and
supersession. `encounter_source_resolved` grants are created only for actions
on the current resolved Surface; confirmed completion yields
`session_trial_confirmed`, not durable approval. They are volatile: restart is
a complete rollback. Persistent
packages are a separate append-only local store and are revalidated at startup
and on atomic file reload. The migration orchestrator may assemble and append
packages outside the live API, but D and Re cannot activate either path through
the Gateway API. Only a unique current operation scope authorizes an action;
historical versions remain audit evidence. Sibling operations on one Surface may
legitimately occupy different tiers, so Surface support is only a coarse
highest-tier projection and never the permission decision itself. See the
[D3 permission closeout](../../STS2MCP/docs/bridge-v2/D3_PERMISSION_GRAY_ROLLOUT_CLOSEOUT_2026-07-25.md)
and the
[Preview.66 migration closeout](../../STS2MCP/docs/bridge-v2/PREVIEW_66_MULTI_ENVIRONMENT_MIGRATION_CLOSEOUT_2026-07-26.md).

## Current Architectural Constraint

The Gateway and Re share the mechanically checked `2.0-preview.69` source
contract. Gate 1 establishes a bounded v2 connector baseline: Re and the
default MCP adapter are v2-only, Gateway v1 is retired, and historical v1 data
is replay-only. Preview.69 has substantial real-runtime coverage on exact loaded
SHA `8e7a...` / MVID `0e3d...`, but the final rebuilt and installed
`4ac4...` / `ae84...` artifact must still be cold-loaded before it has runtime
authority or evidence. Authority never transfers between those MVIDs.

Four inspected Preview.69 runs settled 258 actions under one exact runtime,
preserved six safe pre-execution stale rejections, completed one mid-run-to-menu
boundary, and exposed one pre-mutation provider transport failure plus one
ambiguous 100-tick limit. Their provenance is `unrecorded`, so they remain
defect/coverage evidence rather than Organic qualification. New immutable run
summaries distinguish run boundary, runtime guard/failure, and decision-limit
termination; a decision limit is no longer reported as success.

Active-run shared HUD remains required. The only exception is a typed omission
during exact new/resumed-run mount
`run_transition/setup/awaiting_run_state + no_action + settling`,
where no action owner exists and the Gateway explicitly marks shared state as
pending and non-required for action. This is a transient mount lifecycle contract,
not a general nullable shared-state abstraction. Re refreshes dynamic
capabilities with coherent observations because session grants may change after
completion; startup negotiation is not an authority snapshot.

Current grants still use `surface_kind + operation` and the composite
`state_id`. Preview.69 removes bulk installed candidates from the target
startup path but does not make operation the final compatibility identity.
ADR-0003 still requires shadow/dual-read migration to native source/adapter/
outcome/partition claims. The 82 manifest fallback identities remain rollback
inventory and test-confirm hypotheses, not semantic equivalence.

Kifuda is the first exact case satisfying ADR-0002's continuation admission
rule. The shop action may complete at a typed continuation handoff only after
gold/relic Commit and exact child ownership are proven; the child then composes
from a fresh observation. This does not add a workflow engine or claim the
parent transaction is settled.

Combat-pile choice remains the first production structural transaction contract.
Re reads closed mutation and commit semantics rather than a union of source
card names. The Gateway still proves the exact native source task, publishes
only opaque actions, resumes the game-owned continuation, and checks a semantic
post-state witness. This reduces consumer coupling without creating a universal
effect API or automatic authority for unknown sources.

Preview.62 made the proven source/transaction repetition explicit:

- a reviewed embedded source registry maps exact native source tasks onto a
  closed interaction/witness topology;
- one generic binding and provider path consumes that registry;
- a reviewed embedded exact-environment policy owns build-level Surface and
  Inspection tiers;
- a non-authorizing exact-assembly audit discovers callers and verifies
  selector/commit structure.

Discovery, verification, authorization and qualification remain separate.
Registry or policy presence cannot bypass exact runtime identity, operation
scope, current legality, execute-time revalidation or runtime evidence.

Preview.63 adds a typed session-grant state machine without changing that
boundary. D candidate data still has no authorization effect; the Gateway is
the only decision and enforcement owner, and no session result writes the
embedded qualification policy.

Preview.64 adds a separate local-control admission boundary. It reuses the
Gateway runtime instance as restart epoch, requires one controller lease for
new mutation commands, and records client/lease attribution. Lease loss never
cancels or retries a command already in the Ledger. This is coordination for
correctness and diagnostics, not account security.

## Observation And Strategy Projection Boundary

The Gateway's complete evidence contract is not the same thing as an Agent's
strategy input, and neither grants action authority. Today Re serializes the
complete `NormalizedCurrentState` into every model Prompt and eagerly reads all
advertised Inspections. That is current behavior, not a settled long-term
architecture. It preserves evidence but duplicates some Inspection/action data
and sends governance metadata to the model.

The first generic strategy projection failed its cross-Surface evidence gate
and is not a runtime candidate. This does not make today's
`NormalizedCurrentState` a permanent public SDK or reject all future
consumer-specific views. Retain complete evidence for validation/replay,
investigate another projection only within an evidenced scope, and introduce
fact-group availability only when real ambiguity justifies it. See the
[visibility and observation audit](audits/VISIBILITY_AND_OBSERVATION_ARCHITECTURE_AUDIT_2026-07-22.md)
and the
[future program audit](audits/FUTURE_PROGRAM_AND_CONSUMER_ARCHITECTURE_AUDIT_2026-07-23.md).
