# Current Architecture

Authority: [ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md)

## Live Path

```text
Native STS2
-> Observation and one input owner
-> V3-native command catalog
-> exact environment/operation authority
-> execute-time resolver and native Commit
-> action-local Outcome, receipt and successor
-> REST or thin MCP
-> Re-SpireAgent
```

STS2 owns rules, RNG, Tasks, Commands and effects. The Gateway owns
player-visible facts, the current input owner, command admission, execute-time
native validation, native Commit invocation and action-local Outcome. Re
selects only from candidates in the current interaction.

## Hard Shell

A command binds:

```text
request_id
state_token
interaction_id
command
exact entity/control operands
client session and controller generation
```

The Gateway resolves the same objects and native legality again immediately
before Commit. Receipts are `completed`, `not_executed`, `pending` or
`unknown`; an unknown mutation is never resubmitted.

Visible unsupported, known settling, stale, quarantine and revoke are distinct.
Empty/absent permission scope, unknown source, ambiguous owner, identity drift
or incomplete Outcome fails closed.

## Authority And Evidence Plane

Capabilities expose exact Gateway SHA/MVID/runtime, game, Modset, runtime
Patch, permission policy and qualification identities. Session trial is bound
to one runtime and operation contract. Canary, qualified and durable states
never inherit across protocol, SHA, MVID, runtime, game, Modset or Patch.
Evidence tooling records and recommends; it cannot grant live authority.

## Consumer And Transport

Re owns strict V3 decode, deterministic compact model projection, model choice,
request submission, polling, successor readiness and append-only local
evidence. It cannot add operands, reconstruct native legality/effects or infer
completion. Its active V3 client and control session do not import V2 wire
types or routes.

REST and MCP serialize the same Gateway contracts. They cannot add commands,
legality, authority or retry policy.

## Information Contract

Player-visible information has four semantic layers:

1. persistent summary;
2. complete current Surface;
3. state-bound linked detail;
4. state-bound read-only Inspection.

Inspection and linked detail never enter the Command Ledger or grant mutation.
Hidden RNG, true draw order and future rewards/events remain excluded.

The production Prompt applies deterministic projection v1 to the complete
recorded state. It keeps decision facts, exact actions, identities and a small
information boundary while removing governance-only metadata and duplicate
representations. Full evidence remains recorded for replay and audit.

`native_pages.v1` is a separate optional human-equivalence evidence profile.
It is disabled by default and outside normal Agent flow. Operator-invoked
sessions bind runtime and state, verify pre/post owner, open only fixed native
pages, read through the same visible contract, restore the owner or enter an
explicit recovery-required state, suppress mutation while active, and never
create ledger or action authority.

## Source Closure

All cataloged operation families have direct V3 discovery/execution and direct
Re consumption. This does not mean every possible source variant is
supported: unknown source/owner/Commit/Outcome combinations remain typed
unsupported. The operation catalog is 94 explicit contracts and zero fallback
authority. Connector V3 has its own
non-executing command descriptor and consumes no Provider action draft or V2
state/action sidecar.

Historically named Bridge/Provider files may still implement exact game
reflection, source binding, native Commit and Outcome mechanics. This is
internal library reuse, not a second external protocol, publication authority
or executor. V2 routes remain migration/rollback diagnostics only and are
unreachable from the active Re V3 entrypoint.

Generated choices demonstrate the intended orthogonal composition. Gateway
code audits the exact source, owner, visible semantics, Commit and Outcome;
shared card-grid/entity mechanics produce parameterized commands; Re validates
the current advertised source-local operation and operands without enumerating
all source kinds. New owners or completion semantics still require Gateway
code and evidence. Similar UI alone never grants reuse.

## Freeze Boundary

The macro architecture is retained at `3.0-preview.12`, but the artifact is
only a conditional freeze candidate. Preview.11 completed an exact-artifact
ordinary Journey and exposed four defects corrected by Preview.12. Final
freeze still requires Preview.12 cold-load and changed-path canaries,
remaining rare-family reads, Human profile Live lifecycle and loaded
rollback/revoke.

## Non-Goals

- arbitrary UI tree, coordinates, method names or reflection mutation;
- universal selector, transaction or Effect DSL;
- a second STS2 rules engine;
- hidden information exposure;
- strategy, memory or learning inside the Gateway;
- silent V2 fallback or automatic authority inheritance.
