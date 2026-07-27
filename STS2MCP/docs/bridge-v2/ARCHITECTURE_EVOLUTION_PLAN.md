# Bridge v2 Architecture Evolution Plan

This plan is subordinate to the current exact-build permission matrix. It is a
sequence of verifiable reductions in duplication, not a proposal to broaden
runtime authority.

The cross-component target is fixed by
[ADR-0002](../../../docs/current/decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
That decision supersedes this plan's former broad Transaction IR and Gateway-
owned DecisionFrame proposals. The Gateway keeps complete observation evidence
and bounded purpose-specific adapters; Re derives any model-facing projection.

## Mandatory Precondition: Source Truth Repair

Status: Gate 1 closed as a bounded ordinary-single-player v2 connector
baseline on 2026-07-24. Preview.61 supplied the exact Neow's Fury Organic
runtime seal, strict Re decode, and loaded-v1 retirement evidence.

C# and Re source now share `2.0-preview.67`. Preview.62 moved exact-environment
authorization and reviewed combat-pile source contracts into validated
embedded policy, and added a non-authorizing exact-assembly audit. Preview.63
adds an operation-scoped Gateway session-grant state machine under that
embedded ceiling. Preview.64 adds minimal local mutation coordination without
authentication or a second permission engine. Preview.65 adds an exact,
operation-scoped persistent qualification input and non-authorizing impact
tooling; it does not infer qualification from static similarity. Preview.66
adds non-authorizing Environment Profiles, risk-class migration planning,
multi-environment ledger slots, evidence orchestration, and atomic store
reload. It also replaces per-operation candidate enumeration with five
explicit high-precision qualification contracts plus conservative identities
derived from the current operation manifest. The fallback path is
identity/test-confirm only and available solely in migration mode; it does not
self-authorize discovered mechanics, Mods, or new builds. These changes reduce
content-literal code edits, but independent green suites still do not prove a
loaded game connector. The following deployment conditions remain required
for every artifact:

- keep C#, Re, examples, installed artifact, and capability declarations on the
  same revision;
- build, install, load, and record exact SHA/MVID/runtime/game/Modset identity;
- exercise read-only negotiation and one existing low-risk canary without
  expanding permission.

Preview.67 starts the next source-only reliability slice: it dual-writes
non-authorizing semantic-state and current-authority identity candidates while
retaining the legacy composite as the sole state/action identity. It has
contract/build/install evidence but no loaded or Organic evidence yet. See
[ADR-0005](ADR-0005-semantic-state-and-authority-identity-separation.md).

See the [2026-07-22 real connector audit and migration plan](REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md).
The phases below describe retained architecture work, but Phase 2 and later are
not authorized until this loaded-artifact precondition and a current reliability
baseline pass.

## Product Release Safety Precondition

Status: required before public Workshop control or a consumer Companion; not an
authorization to change runtime behavior in this document.

Source truth repair alone is insufficient for a public local-control product.
Before a release profile can accept mutations, it must also provide:

- authenticated local client identity and a user-private runtime descriptor
  only if the product threat model requires them;
- the already implemented read-open, single-controller coordination contract
  must be product-qualified rather than replaced by a second policy engine;
- explicit user-facing restart and unresolved-command diagnostics;
- explicit unknown-after-restart behavior with no automatic resubmission;
- permanent retirement of the complete v1 HTTP namespace, already implemented,
  plus a
  consumer-authenticated release policy for remaining v2 mutation;
- an explicit `affects_gameplay`, co-op, duplicate-install, licensing, and
  package-content decision;
- loaded Gateway/Modset identity verification rather than disk-file discovery;
- provider secrets and third-party Agent code outside the game process.

The [productization architecture audit](../../../docs/current/audits/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md)
defines the conditional product sequence. These requirements do not promote a
Surface, grant authority, or prove that a Companion currently exists.

## Phase 0: Governance Guardrails

Status: completed in preview.31 and this audit.

- Interpret empty action and Inspection scopes as empty, never wildcard.
- Derive capability status from permitted declared kinds.
- Reject contradictory Inspection capability declarations in Re.
- Keep current-build MVID and Runtime Instance ID in closeout evidence.

Exit condition: source, wire, Re, runtime capabilities, and current status agree
that an empty scope has no authority.

## Phase 1: Typed Contract And Evidence Inventory

Status: started in preview.35 infrastructure; preview.36 adds loaded Modset
identity and preview.37 adds operation-evidence distinction for menu canaries,
while preview.38 applies the same distinction to a source-bound random
transform. Preview.47 adds a runtime `contract_instance_shadow` over this
inventory, without qualification promotion.

Create a machine-readable inventory for each semantic contract containing:

- Surface or Inspection kind and protocol revision;
- operation and source-origin identifiers where canary evidence is narrower
  than the whole Surface;
- mechanism kind and source binding ID;
- exact game identity and Bridge MVID;
- supported operations and Re support;
- permission state: disabled, canary, or qualified;
- evidence IDs and lifecycle states;
- documentation and test references.

Use it to detect duplicate kinds, missing Re cases, stale evidence links, and
permission/documentation drift. The inventory must validate declarations; it
must not be able to authorize an action by existing in the repository.

Implemented foundation: twenty-three typed Surface entries now own capability
metadata, match the lazy Provider registry one-to-one, and derive support only
through `BridgeSurfacePermission`. The three implemented Inspection contracts
are inventoried separately and remain read-only/non-authorizing. Visible fact
groups and test/doc references are present. This is not yet a complete external
manifest: loaded-environment identity, per-origin qualification, field
criticality, and full visibility completeness still require explicit evidence
records. Preview.36 exposes an exact, deterministic loaded Modset identity and
fails action/Inspection scopes closed unless only the negotiated Bridge module
is loaded. This supplies the environment portion of the future manifest; it
does not qualify any additional Mod or operation.

Preview.47 recorded the legacy authority basis and published operations on each
state. Preview.63 replaces the current execution projection with exact
operation scopes and versioned grant bindings. The contract-instance shadow
remains `authorizing=false`: manifest declarations and operation evidence
still cannot grant or suppress an action by themselves.

The first real permission-governance pilot is intentionally narrower than
treasure: reversible `main_menu/continue_run` entered `session_canary`, executed
through Re, satisfied the Gateway semantic witness, and became
`session_auto_approved` for one runtime epoch. `open_singleplayer` remains an
unexercised session canary. The embedded canary scope was the Preview.63
ceiling. Preview.65 can additionally admit one exact `qualified` package or
seed a low-risk `session_canary` package, but only after full exact
applicability checks. The dynamic session grant still cannot write or promote
persistent qualification. Preview.66 generalizes candidate admission from a
literal operation list to reviewed risk classes, but still requires an exact
installed candidate package and a current explicit or manifest-derived
operation identity. The final binary qualified only
`main_menu/continue_run`; four other explicit contracts and 82 conservative
manifest-derived fallback identities remain session canaries.

## Phase 1.5: Player-Visible Closure And Coherent Read

Status: started in preview.47.

- State declares a bounded visibility profile and current typed Inspection
  catalog.
- A coherent observation bundle returns one state plus requested typed,
  read-only Inspections under one state/environment identity.
- Re no longer needs per-Inspection reads followed by a final state re-read for
  its current configured Inspection set.
- Closure remains partial until linked detail families and normal
  player-openable views are inventoried.

Exit condition: action-critical facts are always in the default state; each
Inspection is complete for its declared view; every other player-visible fact
is linked, catalogued, or explicitly missing; hidden facts remain excluded.
This phase cannot grant action authority.

## Phase 2: Semantic-State And Current-Authority Separation

Status: Preview.67 shadow implementation complete; loaded and Organic evidence
pending.

Measure the non-authorizing semantic-state and authority-projection candidates
under real game-state, operand, permission, qualification-history and
transition changes. Keep the legacy composite `state_id` and action binding as
the only authority until ADR-0005's promotion gate passes.

In parallel, dual-read a current-scope capabilities summary against on-demand
full control-plane detail. Complete evidence remains available for replay and
audit; historical control data must not become strategy input or future game-
semantic identity.

Exit condition: fresh evidence attributes every candidate identity change,
irrelevant history does not invalidate actions, relevant owner/operand/grant
changes do, strict C#/Re reads agree, and rollback is immediate.

## Phase 3: Bounded Adapter And Outcome-Oracle Revision Shadow

Status: proposed after Phase 2 evidence.

For representative menu, navigation, shop, and selector/combat families,
record non-authorizing adapter revision, source/participant contract revision,
outcome-oracle revision, and covered condition partition. These describe the
current bounded implementation and evidence scope; they do not form a
universal contract or grant authority.

Move only genuinely repeated, permissionless mechanics into shared helpers.
Publication and execution must consume the same legality result; execution may
add current identity and timing checks but cannot reinterpret the business
predicate. Purpose-specific native Commit and outcome code remains valid where
semantic differences are real.

Exit condition: representative shadows reproduce or narrow current actions,
operands, hidden-information policy and action-local completion; negative
fixtures reject wrong owner, source, participant, branch, outcome and Patch
scope; no authority key changes.

## Phase 3.5: Non-Authorizing Source Audit Workbench

Status: proposed after Phase 3 has frozen the minimum facts that a bounded
adapter and action-local outcome oracle need.

Build an offline, exact-assembly audit tool that can propose:

- content and call indexes;
- async Task ownership and continuation candidates;
- known Commit paths and relevant Harmony patch surfaces;
- candidate mutation domains, hidden-information hazards, and Witness
  obligations;
- structural diffs and compatibility-impact reports across exact builds.

The workbench is an audit accelerator, not a runtime rules engine. Its output
is open-domain and non-authorizing: unknown dispatch, hooks, reflection,
unbounded control flow, or incomplete dataflow remain explicit. Runtime
mutation tracing is restricted to debug/canary evidence and is never exposed
as hidden strategy truth. Patch attestation should cover the action-relevant
loaded Commit closure; a claim to have globally proved all patches or all Mod
semantics is not required and must not be fabricated.

Exit condition: the tool reproduces reviewed facts for at least two holdout
families, reports known omissions instead of silently closing the domain, and
cannot change permissions, capability tiers, or command execution.

## Phase 4: Decision Coverage, Consumer Projection, And Runtime Continuity

Status: active measurement; no compact runtime projection accepted.

Keep complete Gateway evidence separate from model strategy input. Re may
derive a deterministic, provenance-preserving `DecisionProjection` only for a
bounded scope with same-evidence baseline/overlay comparisons and semantic
counterexamples. The first generic projection failed on reward scopes and is
not a reusable candidate.

Measure and repair actionable-with-no-action states, unsupported decision
families, settling/loading transitions, stale precommit attribution, timeouts,
unknown outcomes and successor coherence. Re may supervise polling and request
fresh observations, but cannot infer native completion or retry unknown
mutations.

Ordinary sequences compose from fresh closed actions. Introduce a minimal
`PendingObligation` only when exact native evidence proves a parent transaction
remains open across decision boundaries. It records correlation and closure
evidence only; no workflow engine or executable Transaction IR is permitted.

MCP remains a thin transport adapter. Headless remains an independent research
host and cannot grant or inherit Live authority.

Exit condition: supported journeys continue through typed transitions without
rule reconstruction; complete evidence and any model projection remain
replay-comparable; operation-local completion and unknown-no-retry remain
Gateway-owned.

## Deferred Headless Subproject Gate

Status: documentation only; blocked on live-gateway admission criteria.

Physical Headless STS2 is no longer part of the active Bridge phase sequence.
It is a separate future subproject documented under
[docs/current/headless](../../../docs/current/headless/README.md). Do not create a Headless
runtime, shared-kernel package, permission profile, or adapter skeleton merely
because the protocol is transport-neutral.

The live path must first close its identity separation, source/participant
binding, shared-validation, adapter/oracle revision, outcome, and exact loaded-
evidence gates.
The full admission criteria, candidate host comparison, phases, acceptance,
and rollback rules are in [the Headless target
architecture](../../../docs/current/headless/TARGET_ARCHITECTURE.md). Passing that gate
permits an isolated experiment only; it grants no Headless or live authority.

## Phase 5: Scoped Compatibility Evidence After v1 Retirement

Status: the complete v1 HTTP namespace was retired at the bounded Gate 1
closeout; scoped Organic compatibility evidence remains ongoing per bounded
decision family and exact environment.

For each bounded decision family, record source audit, fixture tests, strict Re
tests, Release/build, install, loaded identity, observation, canary, semantic
post-state, and Organic compatibility evidence separately. Existing package
status may still use `qualification` during migration, but its durable meaning
is a scoped, revocable CompatibilityClaim. Unsupported contracts remain
explicitly fail closed; they never regain authority through a v1 fallback.
Historical v1 operation mappings remain audit evidence only.

The success metric is not Surface count. It is the number of ordinary player
journeys whose semantic contracts are independently evidenced and whose v1
fallback has been retired without ambiguity.

## Non-Goals

- no universal selector, menu, purchase, or Effect DSL;
- no Bridge execution of Transaction IR primitives or replay of game effects;
- no low-level click language in the wire protocol;
- no automatic permission from source reflection, class-name matching,
  implementation presence, static grader success, or D recommendation alone;
- no self-authorizing registry or Mod-declared contract;
- no source literal whitelist as a substitute for complete transaction binding;
- no expansion of authority from a version, build hash, MVID, or Mod manifest
  alone;
- no use of old MVID Organic evidence for a new DLL.

The active naming and ownership source is
[the Live STS2 connection boundary](LIVE_GAME_CONNECTION_BOUNDARY.md). Dated
DecisionFrame, source/headless, and boundary closeouts remain available in the
[Bridge preview archive](../../../archive/bridge-v2-previews/) as historical
rationale and evidence, not current architecture authority.
