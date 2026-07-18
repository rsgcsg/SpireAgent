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

Status: proposed, no permission change.

Create a machine-readable inventory for each semantic contract containing:

- Surface or Inspection kind and protocol revision;
- mechanism kind and source binding ID;
- exact game identity and Bridge MVID;
- supported operations and Re support;
- permission state: disabled, canary, or qualified;
- evidence IDs and lifecycle states;
- documentation and test references.

Use it to detect duplicate kinds, missing Re cases, stale evidence links, and
permission/documentation drift. The inventory must validate declarations; it
must not be able to authorize an action by existing in the repository.

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

