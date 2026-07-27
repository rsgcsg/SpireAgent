# ADR-0002: Semantic Gateway Two-Plane Target Architecture

## Status

Accepted as the single target architecture, 2026-07-27.

This ADR chooses the destination and migration constraints. It does not claim
that every target component is implemented, loaded, or qualified. Current
runtime truth remains in [Status](../STATUS.md) and Bridge evidence remains in
[`STS2MCP/docs/bridge-v2/`](../../../STS2MCP/docs/bridge-v2/).

## Decision

SpireAgent will evolve the existing `STS2MCP` Semantic Gateway into one
**Semantic Gateway Two-Plane Architecture**:

```text
Native STS2 runtime
  SceneTree / RunState / Tasks / Commands / loaded Mods
                         |
                         v
STS2MCP Semantic Gateway
  Live Semantic Decision Plane
    coherent Observation Envelope
    one Active Decision Owner
    bounded native Transaction Adapter
    exact state-bound BoundAction
    Gateway admission + execute-time revalidation
    native Commit
    action-local Outcome Oracle
    minimal PendingObligation only when a native parent remains open
    Command Receipt and successor observation

  Compatibility & Evidence Control Plane
    exact environment provenance
    source / participant / adapter / oracle revisions
    impact analysis and negative evidence
    fixture / replay / static / headless / Live evidence classes
    risk-bounded trial recommendations
    scoped CompatibilityClaims
    quarantine / revoke / rollback
                         |
                         v
Versioned REST Connector Contract
                         |
                         v
Re-SpireAgent
  strict decode + complete EvidenceRecord
  deterministic, evidence-tested DecisionProjection
  model chooses one advertised action_id
  transition-aware Runtime Supervisor
  complete decision / receipt / replay record
```

The two planes are responsibility boundaries inside the existing Gateway and
tooling, not two independently authoritative services. The Native STS2 runtime
remains the sole authority for game rules and side effects. The Gateway remains
the sole authority for current visible facts, legal action publication,
execution admission, native Commit invocation, and completion truth.

## Required Boundaries

### Live Semantic Decision Plane

The Live plane must be sufficient for an Agent to execute this loop without
reading qualification history or reconstructing game rules:

```text
observe coherent current decision
  -> choose one advertised action_id
  -> submit against its exact binding
  -> receive rejected / failed / completed / unknown
  -> observe a coherent successor or typed transition state
```

Its authoritative contracts are:

- **Observation Envelope:** complete player-visible current evidence, typed
  availability/completeness, active owner, current legal actions, Inspection
  catalog, transient stability, and exact runtime provenance. It is not a raw
  object dump and excludes hidden RNG, draw order, future rewards/events, and
  other non-player-visible facts.
- **Active Decision Owner:** exactly one current mutation owner. `Context` is
  semantic game background; `Surface` is the active interaction projection;
  neither alone is a permanent compatibility or permission identity.
- **Bounded Native Transaction Adapter:** purpose-bounded source/UI/task
  binding, visible operands, native legality, Commit entry, and immediate
  result boundary. Shared mechanics may be extracted internally, but no
  universal click, selector, purchase, effect, or transaction DSL is allowed.
- **BoundAction:** one opaque action instance bound to current semantic state,
  current authority projection, exact operands, and relevant adapter/oracle
  revisions. The only client mutation parameter is `action_id` plus the
  required current binding.
- **Outcome Oracle:** action-local evidence for the result the current action
  owns. UI disappearance, method existence, non-empty witness text, or HTTP
  success alone is insufficient.
- **Command Receipt:** preserves started, rejected, failed, completed, timeout,
  unknown, semantic witness, and successor attribution. Unknown mutation is
  terminal and is never automatically retried.

### Minimal PendingObligation

Fresh observations compose ordinary sequences of already-closed actions. A
new ordering of map, reward, shop, selector, or combat actions does not require
a workflow registration.

A `PendingObligation` may be introduced only when exact source/runtime evidence
shows that a native parent transaction remains unresolved across more than one
decision boundary and a child action can close, cancel, or invalidate it. The
record must be minimal and non-executable: parent identity, allowed child
owner, open/closed/unknown state, and closure evidence. It must not grow into a
general workflow engine, transaction graph, or Effect DSL.

### Compatibility And Evidence Control Plane

The Control plane may discover, compare, test, recommend, quarantine, revoke,
and roll back. It may produce a scoped candidate or CompatibilityClaim. It may
not publish an action or mutate STS2 directly.

The Gateway validates all control-plane inputs and remains the only permission
decision and enforcement owner. A claim is evidence-scoped and revocable, not
a proof that every branch of an operation is semantically correct.

Long-term compatibility identity is narrower than `surface + operation`:

```text
exact environment provenance
+ adapter revision
+ outcome-oracle revision
+ source / participant contract revision
+ covered condition partition
```

`operation` remains a human-readable intent, log, inventory, and Prompt label.
It is not by itself a transaction identity or compatibility proof. Current
permission keys must remain authoritative until a shadow-first migration
proves the replacement across representative menu, navigation, shop, and
selector/combat families.

Full evidence remains available for audit and replay, but complete permission,
qualification, Patch, and package history must not be part of model input or
future game-semantic identity. Hot-path summaries and on-demand details must
be dual-read and equality-checked before any current field is removed.

### Re-SpireAgent Consumer Boundary

Re owns strict decoding, complete evidence recording, model invocation,
advertised-action choice, and transition supervision. It does not own game
legality, native Commit, completion truth, compatibility approval, or action
creation.

The model-facing `DecisionProjection` is a deterministic consumer view derived
from the complete envelope. It must retain provenance, be replayable against
the same evidence, and pass scope-specific paired/counterexample evaluation.
It is not a second Gateway state, public SDK, or authority contract. The first
generic compact projection already failed on reward scopes and remains
rejected; target architecture does not authorize another generic rollout.

The Runtime Supervisor may poll, classify stability, wait within bounded
limits, and request fresh observations. It may not infer semantic completion,
retry an unknown mutation, or reconstruct unsupported actions.

### Environment Lifecycle Boundary

Environment Profiles, migration workspaces, build/install verification,
artifact backup, and rollback are external operational tooling around the
Gateway. Profiles are non-authorizing indexes. They do not form a third
Gateway plane and do not enter the Agent Prompt.

A pre-launch Artifact Router is conditional, not part of the required core.
It may be implemented only after a real game-version/ABI experiment proves
that one Gateway artifact cannot safely load across supported environments.
Until then, the thin `npm run connector -- ...` workflow is the accepted
operator boundary.

## Current Implementation Mapping

| Target responsibility | Current evidence | Decision |
|---|---|---|
| one owner, opaque actions, execute-time revalidation | implemented and exercised in bounded Gate 1 journeys | retain |
| native Commit, command lifecycle, semantic completion | implemented with purpose-specific Providers/probes | retain and strengthen by family |
| complete Observation Envelope | implemented but visible-information closure remains partial | retain; add explicit availability only from evidence |
| semantic-state vs authority identity | Preview.67 non-authorizing shadow only | continue measurement; no authority switch |
| adapter/oracle revisions and covered partitions | partly implicit in Providers, registries, and package identity | introduce shadow metadata before key migration |
| Compatibility/Evidence Control Plane | partially implemented through D audits, Profiles, grants, packages, and migration tooling | separate from hot identity/payload; do not expand qualification by count |
| deterministic DecisionProjection | generic experiment rejected | design only through bounded paired experiments |
| minimal PendingObligation | not generally implemented or yet proven necessary as a common abstraction | defer until an exact parent/child topology demands it |
| transition-aware product supervisor | bounded Re orchestration only | improve from measured transition failures |
| Artifact Router | not implemented and no demonstrated ABI need | deferred by default |

## Alternatives Rejected

- **Keep the current qualification-centric architecture as the final model.**
  Exact packages and rollback are useful, but operation counts and generic
  fallbacks do not measure decision coverage or semantic correctness.
- **Universal `ResolvedInteractionContract`, Transaction IR, workflow graph,
  or Effect DSL.** These create a second game model, overstate provider self-
  description, and make new UI shape look safer than it is.
- **A separate ALDG/DecisionFrame as another Gateway truth.** The Agent-oriented
  goal is accepted; a second incomplete state protocol is not. The complete
  envelope remains the evidence source and Re derives consumer views.
- **Environment-aware migration OS as the Connector core.** Profiles and trials
  are useful support tooling, but automatic enrollment, artifact routing, or
  migration state does not replace current decision coverage and runtime
  continuity.
- **Raw object dump or low-level click/index API.** The first leaks or confuses
  hidden/internal state; the second loses exact operand, owner, stale-action,
  and semantic completion protection.
- **REST, MCP, Re, D, or a future Companion as a second authority.** Transport,
  evaluation, strategy, and product lifecycle remain outside game authority.

## Migration Order

1. Cold-load and bound the Preview.67 identity shadow; collect paired game-
   state and control-history evidence without changing authority.
2. Separate semantic-state and current-authority identities only after ADR-0005
   promotion gates pass; retain immediate rollback to the composite identity.
3. Dual-read capabilities summary/on-demand details and prove current-scope
   equality before reducing hot payloads.
4. Add shadow adapter/oracle/source/partition revisions for representative
   menu, navigation, shop, and selector/combat families.
5. Improve transition stability and Re supervision from measured unsupported,
   stale, settling, timeout, and unknown-outcome cases.
6. Evaluate bounded Re-side DecisionProjections with same-evidence pairs and
   counterexamples; never optimize reason length or token count as truth.
7. Replace generic evidence thresholds with family-specific policies and call
   promoted artifacts scoped CompatibilityClaims.
8. Run real cross-version and bounded Mod experiments before changing
   authority keys or compatibility claims.
9. Introduce PendingObligation or an Artifact Router only when their explicit
   admission conditions are observed.

Each migration is shadow/dual-read first, independently rollbackable, and must
keep current publication/execution parity, unknown-no-retry, and fail-closed
behavior.

## Completion Boundary

The Connector may be called complete only for a declared support envelope. For
bounded vanilla ordinary single-player that requires:

- no live v1 or silent reconstruction path;
- coherent coverage of supported decision boundaries and typed unsupported
  rows for everything else;
- explicit visible/inspectable/unobserved/unavailable/hidden/error/stale fact
  semantics where decision-relevant;
- exact advertised actions, execution revalidation, native Commit, semantic
  receipts, and unknown-no-retry;
- measured transition recovery and long-run continuity;
- reproducible build/install/load identity and rollback;
- exact evidence scope for version and bounded Mod claims; and
- complete evidence retained independently from any model projection.

This definition does not claim arbitrary Mods, multiplayer, complete hidden
game internals, or automatic support for new owners/Commits/oracles.

## Consequences

- Existing Gateway safety behavior remains the migration baseline, not sunk
  cost that forces the target design.
- Architecture progress is measured by reliable decision coverage, semantic
  receipts, recovery, and evidence quality rather than operation/package
  count.
- Some duplicate purpose-specific adapters are acceptable until multiple exact
  flows prove a shared non-authorizing mechanic.
- Unsupported or code-required classifications remain valid outcomes.
- Control-plane and operational tooling may continue evolving, but cannot
  outrank Live-plane correctness or enter strategy input by default.

## Supersession And Related Decisions

- This ADR is subordinate only to ADR-0001's current-mainline/archive boundary.
- Bridge ADR-0003 remains authoritative for semantic Surface/shared-mechanics
  boundaries where it does not imply a universal transaction model.
- Bridge ADR-0005 remains authoritative for the current shadow-only identity
  experiment and promotion gate.
- Proposed broad Transaction IR/DecisionFrame phases in older evolution plans
  are superseded by this ADR's bounded adapter, Re-side projection, and
  evidence-triggered PendingObligation decisions.

## Rollback

This ADR changes architecture authority and migration sequencing, not runtime
behavior. A future implementation that violates its evidence gates must be
rolled back independently to the last exact loaded Gateway/Re contract. If
real runtime evidence falsifies the two-plane separation or shows a simpler
model preserves every required boundary with lower cost, replace this ADR with
a new decision rather than silently drifting current documents.
