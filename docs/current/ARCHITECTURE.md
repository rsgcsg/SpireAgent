# Current Architecture

## Architecture Authority

The single accepted destination is the
[Semantic Gateway Two-Plane Target Architecture](decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
Its live-kernel identity migration is refined by
[ADR-0003](decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md).
Its risk-calibrated trial/claim boundary is refined by
[ADR-0004](decisions/ADR-0004-risk-calibrated-encounter-trial-and-scoped-claims.md).
Its mandatory clean-closure sequencing, identity cutover and vertical family
migration are defined by
[ADR-0005](decisions/ADR-0005-workflow-c-clean-closure.md) and the
[Clean Closure audit](audits/WORKFLOW_C_CLEAN_CLOSURE_AUDIT_AND_EXECUTION_CONTRACT_2026-07-29.md).
[ADR-0006](decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md)
is the current contract/authority convergence decision: it retains the macro
architecture while replacing mixed explicit/fallback durable admission. The
[2026-07-30 reaudit](audits/WORKFLOW_C_ARCHITECTURE_CLEANLINESS_REAUDIT_AND_CLOSURE_TARGET_2026-07-30.md)
owns the current closure target where older audits differ.
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

## Program Relationship

`Re-SpireAgent` is the project's primary value runtime: it is the component
that plays, is evaluated, and may later improve. The Gateway exists to make the
Agent's observations and actions trustworthy; it is not the final product and
must not absorb strategy. This value priority does not change authority:

- STS2 and the Gateway remain the only game-fact, legality, execution and
  completion authorities;
- D independently evaluates Connector correctness and Agent capability but
  never grants actions;
- P manages future player lifecycle and recovery but never bypasses the
  Gateway;
- X research inherits no Live identity or permission.

The program milestones and readiness tracks are defined in
[Program Plan](PROGRAM_PLAN.md). Functional Gates in
[Roadmap](ROADMAP.md) are technical checklists, not a competing product route.

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
         typed explicit-contract evidence/trial/claim lifecycle
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

The target is explicitly Workflow A first. Engineering priority is current
decision truth, inspectable player context, execution integrity, and action-
local outcome reconciliation; compatibility/evidence supports those goals but
does not replace them. The target taxonomy keeps six concerns distinct:

```text
World/Run Context    current world and run background
Decision Purpose     why the current decision exists
Interaction Surface how the player currently interacts
Native Binding       exact owner/source/participant/commit inside the Gateway
Outcome              what the current action has actually established
Inspection           bounded player-accessible read-only information
```

The current wire still combines some purpose with `context` or `surface`; the
taxonomy is a migration target, not a claim that a new protocol already exists.
Agent memory and external knowledge remain outside all six. Preview.72's Lead
Paperweight/Hefty Tablet split is the reference example: one card-choice
mechanic, distinct purpose/source and deck postconditions, no universal
selector or room-name inference. Shared interaction never implies shared
permission, Commit or Witness. An actionless settling Surface may be observable
without mutation scope and projects `actionAuthority=none`; no client action
exists until the Gateway publishes one.

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

Gateway command completion and Re decision readiness are deliberately
different facts. The Gateway alone proves action-local native Commit and
Outcome. Re may wait for the resulting actionable state to repeat before
spending another model call; it may not reinterpret the Witness, remap a stale
choice, or extend action-local completion into broad transaction settlement.
This transition supervision exists because exact Preview.75 combat records
show visible hand and enemy facts continuing to evolve after card Commit.

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
  failure. It cannot write persistent qualification. Only an
  `explicit_native_contract` may enter the package lifecycle; a
  `manifest_migration_fallback` remains volatile. Persistent packages keep
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
scope, opaque state-bound actions, execute-time revalidation, native commit,
semantic completion and unknown-no-retry. Migration mode admits either an
installed exact explicit-contract candidate or the current source-resolved
encounter under a bounded risk rule; it is not wildcard authority.
Fallback identities require a non-empty witness emitted by the current
Gateway and may confirm/quarantine only their runtime-local trial. They cannot
be assembled, installed, reloaded or promoted as durable packages.

Current dynamic grants bind runtime epoch, exact environment, Gateway SHA/MVID,
Modset, Patch digest, operation fingerprint, evidence policy, expiry and
supersession. `encounter_source_resolved` grants are created only for actions
on the current resolved Surface; confirmed completion yields
`session_trial_confirmed`, not durable approval. They are volatile: restart is
a complete rollback. Persistent packages are a separate append-only local store
and are revalidated at startup and on atomic file reload. The migration
orchestrator may assemble and append explicit-contract packages outside the
live API, but D and Re cannot activate either path through the Gateway API.
Only a unique current scope authorizes an action;
historical versions remain audit evidence. Sibling operations on one Surface may
legitimately occupy different tiers, so Surface support is only a coarse
highest-tier projection and never the permission decision itself. See the
[D3 permission closeout](../../STS2MCP/docs/bridge-v2/D3_PERMISSION_GRAY_ROLLOUT_CLOSEOUT_2026-07-25.md)
and the
[Preview.66 migration closeout](../../STS2MCP/docs/bridge-v2/PREVIEW_66_MULTI_ENVIRONMENT_MIGRATION_CLOSEOUT_2026-07-26.md).

## Current Architectural Constraint

The Gateway and Re source share the mechanically checked `2.0-preview.82`
contract and normalized schema 31. Preview.81 loaded as SHA `411f8cf5...` /
MVID `c09e8569...` / runtime `4955bd9e...` and completed a 188-decision game
boundary with 185 settled actions and one safe stale refusal. Later P81 runs
reproduced exact native map annotation ownership and non-mutating stale
receipts that Re made fatal. Preview.82 has a new source identity and inherits
none of that runtime authority. Gate 1 remains a bounded v2 baseline: Re and
the default MCP adapter are v2-only, Gateway v1 is retired, and historical v1
data is replay-only. The run's provenance is `unrecorded`, so it is
defect/coverage evidence rather than Organic qualification.

Active-run shared HUD remains required. The only exception is a typed omission
during exact new/resumed-run mount
`run_transition/setup/awaiting_run_state + no_action + settling`,
where no action owner exists and the Gateway explicitly marks shared state as
pending and non-required for action. This is a transient mount lifecycle contract,
not a general nullable shared-state abstraction. Re refreshes dynamic
capabilities with coherent observations because session grants may change after
completion; startup negotiation is not an authority snapshot.

Preview.74 made semantic and authority identities formal wire fields and
removes the old shadows and control histories from state. Composite `state_id`
still binds both for stale-action safety. One production publication path binds
every action to contract/source/operands/state. Fifty explicit contracts use
contract-digest admission; 38 typed manifest fallback identities temporarily
retain runtime-only operation admission and must receive a family disposition
before Clean Closure. Operation remains metadata for migrated families, not
their execution or durable-claim key.

Preview.77 closes durable fallback admission in both the Gateway and operator
ledger. Preview.78 migrates ordinary combat and ordinary shop
navigation/card-purchase operations without adding an authority path.
Preview.79 migrates the remaining shop-inventory, treasure and deck-enchant
siblings; Preview.80 migrates five standard-run boundary Surfaces; Preview.81
migrates source-closed merchant/reward removal, Scroll Boxes bundle and event
dialogue Surfaces; Preview.82 adds the source-audited native map annotation
exit and repairs Re stale-rejection supervision. Supported mixed
explicit/fallback Surfaces remain zero. The 38 unmigrated
fallback identities still require vertical review or typed
unsupported/`code_required`; that debt does not justify a universal selector,
transaction layer or second rule engine.

The remaining operation-scoped fallback key is not a valid final identity for
source- or condition-partitioned families. CombatPile uses one operation label
for Headbutt, Seance, Dredge and other sources with different Commit/Outcome
semantics; Rest `choose_rest_option` spans Heal and Smith handoff. These
families need an explicit source/condition partition before migration. Success
for one source must not authorize a sibling merely because both share a
Surface and operation label.

Preview.75 does not add another authority plane. It allows the existing
state-bound Inspection plane to operate as a volatile read-only canary only
after the same clean runtime has a source-resolved mutation session scope.
Inspection remains non-authorizing and non-persistent. Re also treats an
overlong rationale as bounded audit-data normalization rather than discarding
an otherwise valid advertised action.

Preview.76 confirms a required family boundary: shared native UI mechanics do
not imply shared business-source authority. `NDeckTransformSelectScreen` is
used by both Whispering Hollow and New Leaf. One provider shares exact selector
reading and commit mechanics, while typed source contracts separately prove
the active event owner or task-local relic acquisition, exact operands and
settlement. Unknown or concurrent callers fail closed. This is the preferred
`shared mechanism + explicit source contract` pattern, not a universal
selector. A central projection invariant also strips every unsupported draft
of actions and forces `none_fail_closed`.

The Silver Crucible empty-chest defect also confirms the intended Oracle
boundary: operation completion must recognize every native outcome branch that
reaches a proven current UI stage. It must not assume that a reward exists or
encode a relic-specific exception. `TreasureLifecycleFacts` now supplies the
stage and open-result predicates used by observation and the action-local
Oracle; STS2 still owns reward generation and all side effects.

Kifuda is the first Clean Closure pilot. The shop action completes at its native
purchase Commit after exact gold/relic and entry-or-child-owner evidence; the
enchantment child then composes from a fresh observation with source-bound
actions. This does not add a workflow engine or claim the child decision was
completed by the purchase command.

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
fact-group availability only when real ambiguity justifies it. The current
Preview.72 full-run sample carried about 1.69 MB of user Prompt payload over
145 calls; that makes duplication measurable but does not prove a compact view
will preserve strategy. See the
[visibility and observation audit](audits/VISIBILITY_AND_OBSERVATION_ARCHITECTURE_AUDIT_2026-07-22.md)
and the
[A-primary program correction audit](audits/A_PRIMARY_WORKFLOW_AND_PROGRAM_CORRECTION_AUDIT_2026-07-28.md).
