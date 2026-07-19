# Bridge v2 Architecture Evolution Plan

This plan is subordinate to the current exact-build permission matrix. It is a
sequence of verifiable reductions in duplication, not a proposal to broaden
runtime authority.

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
through `BridgeSurfacePermission`. The two implemented Inspection contracts
are inventoried separately and remain read-only/non-authorizing. Visible fact
groups and test/doc references are present. This is not yet a complete external
manifest: loaded-environment identity, per-origin qualification, field
criticality, and full visibility completeness still require explicit evidence
records. Preview.36 exposes an exact, deterministic loaded Modset identity and
fails action/Inspection scopes closed unless only the negotiated Bridge module
is loaded. This supplies the environment portion of the future manifest; it
does not qualify any additional Mod or operation.

Preview.47 records the current legacy authority basis and published operations
on each state. This makes the Surface-kind permission debt visible, but the
shadow remains `authorizing=false`: manifest declarations and operation
evidence still cannot grant or suppress an action.

As the first permission-governance pilot, represent the currently documented
`treasure_room` operation split: choose/proceed have Organic canary evidence
while open/skip are source-audited only. The implemented pilot records that
split without changing Surface-level authority. A later permission change may
only preserve or narrow current canary authority; it must not promote any
operation or origin.

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

## Phase 2: Mechanism, Source Binding, And Shared Validator

Status: proposed; begin with two repeated bounded card-selection flows.

Extract only structural mechanics first: visible candidates, exact references,
selection membership, bounds, controls, and stage. Add a deterministic Source
Binding that identifies the task/command/owner relationship. Keep purpose,
eligibility, commit, and Completion in separate Semantic Contracts.

Then move repeated legality into a pure validator used by both publication and
execution. The execution path may add stale identity, current-owner, and timing
checks, but must consume the same core legality result.

Exit condition: less duplicated legality code, unchanged opaque wire actions,
unchanged authority boundary, and tests proving publication/execution parity.

The first implementation must run as a shadow comparison against existing
Providers. It may only reproduce or narrow actions. Automatic provisional
execution is outside this phase and requires a separate authority decision.

## Phase 3: Observable Witnesses And Field Criticality

Status: proposed.

Extract a small finite set of visible witness primitives such as exact entity
presence/absence, collection count delta, currency delta, attribute change,
control consumption, owner change, and room change. Compose them only into
purpose-specific contracts.

In parallel, classify fields as identity-critical, legality-critical,
Completion-critical, strategy-critical, or decorative. A field may become
optional only after current-source and organic evidence proves that omission
cannot make an advertised action unsafe.

Exit condition: no Completion is weakened to a page-close predicate, and no
unknown critical field is silently omitted.

## Phase 4: Protocol And Compatibility Cost

Status: proposed, after repeated Phase 2 evidence.

- Generate or golden-test structural C#/TypeScript protocol fixtures.
- Keep semantic discriminators, authority rules, and hidden-information checks
  hand-reviewed.
- Add game, mechanism, source-binding, and contract fingerprints as diagnostic
  layers.
- Use targeted current-build canaries to identify affected contracts.

Layered fingerprints may reduce work after a pure data update, but final action
permission remains exact-build and explicit. No fingerprint may inherit an old
qualified list automatically.

## Phase 5: Organic Qualification And v1 Retirement

Status: ongoing operational work.

For each contract, record source audit, fixture tests, strict Re tests,
Release/build, install, loaded identity, observation, canary, semantic
post-state, and Organic Qualification separately. Retire a v1 action family
only when the exact current MVID and the rebuilt client agree on the same
contract and no hidden-information or ownership gap remains.

The success metric is not Surface count. It is the number of ordinary player
journeys whose semantic contracts are independently evidenced and whose v1
fallback has been retired without ambiguity.

## Non-Goals

- no universal selector, menu, purchase, or Effect DSL;
- no low-level click language in the wire protocol;
- no automatic permission from source reflection, class-name matching, or
  implementation presence;
- no expansion of current local hash `1833084275` authority by this plan;
- no use of old MVID Organic evidence for a new DLL.
