# Bridge v2 Architecture Evolution Plan

This plan is subordinate to the current exact-build permission matrix. It is a
sequence of verifiable reductions in duplication, not a proposal to broaden
runtime authority.

## Mandatory Precondition: Source Truth Repair

Status: source contract complete; loaded-artifact qualification remains highest
priority as of 2026-07-22.

C# and Re now share `2.0-preview.55`, with explicit operation scopes and a
Gateway assembly digest. Independent green suites still do not prove a loaded
game connector. Before any later phase or new Surface proceeds:

- keep C#, Re, examples, installed artifact, and capability declarations on the
  same revision;
- build, install, load, and record exact SHA/MVID/runtime/game/Modset identity;
- exercise read-only negotiation and one existing low-risk canary without
  expanding permission.

See the [2026-07-22 real connector audit and migration plan](REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md).
The phases below describe retained architecture work, but Phase 2 and later are
not authorized until this loaded-artifact precondition and a current reliability
baseline pass.

## Product Release Safety Precondition

Status: required before public Workshop control or a consumer Companion; not an
authorization to change runtime behavior in this document.

Source truth repair alone is insufficient for a public local-control product.
Before a release profile can accept mutations, it must also provide:

- authenticated local client sessions and a user-private runtime descriptor;
- read-only observers plus one Gateway-enforced mutation-controller lease;
- a runtime epoch binding state, actions, and Commands across restart;
- explicit unknown-after-restart behavior with no automatic resubmission;
- a release-default policy that prevents v1 mutation from bypassing v2;
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

## Phase 2: Transaction Correlation And DecisionFrame Shadow

Status: deferred behind source-truth repair and a measured current reliability
baseline. The 2026-07-20 design remains evidence input, not an implementation
authorization. Do not begin with a protocol or authority migration, and do not
introduce broad Transaction IR merely to preserve the old phase order.

First add a minimal, non-authorizing transaction-correlation record beside the
existing command ledger. Seed it only from already-audited native Task scopes
for generated-card and combat-pile choices. It should record source task token,
owner, exact operands, current child decision, lifecycle phase, and outstanding
Witness obligations. A separate production `TransactionLedger` class is one
possible implementation, not a fundamental invariant; transaction ownership
and obligation correlation are the required properties.

Then extract a typed, permissionless mechanism snapshot containing visible
candidates, exact references, selection membership, bounds, controls, and
stage. Bind it to a `DecisionFrame` that also records:

- the one current input owner;
- a game-owned task, command, or continuation token;
- exact operands and legality constraints;
- transaction phase (`already_applied`, `awaiting_choice`, `commit_pending`, or
  `settling`);
- explicit hidden and unavailable facts;
- a closed mutation domain and completion obligations.

Source/provenance is not automatically the semantic contract. A source literal
may be optional when a qualified extractor can attest a complete current game
transaction, but a trustworthy task/transaction binding is never optional.
Registry data, UI shape, prompt text, or a Mod's own declaration cannot attest
itself or grant authority.

Move repeated legality into a pure validation result consumed by publication
and execute-time revalidation. Execution may add liveness and timing checks but
must not reinterpret the business predicate. The first implementation is a
non-authorizing shadow beside existing Providers and must reproduce or narrow
actions, operands, hidden policy, and failure behavior.

Exit condition: two repeated families shadow-match existing command actions
and full native Task lifecycles; negative fixtures reject incomplete,
ambiguous, orphaned, or concurrently owned frames; and no permission or wire
action authority changes.

## Phase 3: Closed Transaction IR And Witness Obligation Plans

Status: proposed after Phase 2 shadow evidence.

Introduce a closed, versioned Transaction IR only as a declaration of the
game-owned transaction and its proof obligations. It is not an executable
Effect DSL: Bridge must still invoke one qualified game-owned Commit adapter
and must never replay damage, block, movement, rewards, hooks, or scripts from
the IR.

The IR may compose known, bounded primitives such as exact-card movement,
enchantment application, transformation, currency delta, resource delta, and
bounded child decisions. Each primitive must declare its Mutation Domain,
operand types, hidden-information policy, and required witness rules. Unknown
primitives, unbound operands, unbounded control flow, incomplete domains, and
missing witnesses fail closed.

Compile the declared obligations into a `WitnessPlan` using a finite set of
observations: exact entity presence/absence, collection/cardinality delta,
currency/resource delta, attribute change, control consumption, owner change,
room change, and bounded child completion. A purpose-specific manual witness
remains valid when hooks, asynchronous behavior, or a domain cannot be proved
closed. Compilation must never weaken completion to page closure.

In parallel, classify fields as identity-critical, legality-critical,
completion-critical, strategy-critical, or decorative. Unknown action-critical
facts suppress authority; an independently missing strategy field may degrade
strategy projection without invalidating an otherwise proven transaction.

Exit condition: every shadow transaction owns all completion obligations across
parent/child Surface boundaries, and no declared side effect lacks a witness or
an explicit fail-closed reason.

## Phase 3.5: Non-Authorizing Source Audit Workbench

Status: proposed after the Phase 2 record has frozen the minimum facts that a
real transaction needs.

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

## Phase 4: Strategy Semantics And Structural Protocol

Status: proposed after repeated Phase 2/3 evidence.

Keep application semantics separate from future strategic semantics. For
example, applying enchantment `X` amount `N` to exact card `C` is an executable
transaction; explaining how `X` later modifies damage, block, triggers, or
card-play count is a read-only strategy projection. Unknown future behavior
must not grant or revoke execution authority unless it also makes current
legality, visibility, or completion incomplete.

After the shadow model is stable:

- introduce a structural DecisionFrame/Transaction/Witness schema rather than
  new Surface/source literals for each content item;
- generate or golden-test structural C#/TypeScript fixtures and exhaustiveness;
- keep primitive semantics, Commit adapters, authority, and hidden-information
  checks hand-reviewed;
- require a zero-core-code holdout gate for new content composed entirely from
  existing mechanisms, primitives, adapters, and witness rules;
- allow registry data, fixtures, and exact-build evidence to change without
  handwritten Bridge/Re core changes;
- add game, mechanism, adapter, transaction, and witness fingerprints only as
  diagnostics and targeted requalification inputs.

New UI mechanics, new primitive semantics, or a new game-owned Commit path may
legitimately require code. New card/relic/potion/enchantment IDs and new bounded
compositions of existing primitives must not.

Layered fingerprints may reduce work after a pure data update, but final action
permission remains exact-environment and explicit. No fingerprint, registry,
Mod contract, or old evidence may inherit authority automatically.

MCP remains one transport adapter over this protocol-neutral gateway. Re may
continue to use REST directly. A compact MCP adapter should derive its fixed
Inspection requests from the advertised catalog and should not grow one
content-specific tool per card, relic, potion, event, or transaction source.

Protocol and renderer neutrality are current gateway properties, not a
Headless deployment. Running the real Godot engine without a display may be
evaluated only after owner, visibility, Commit, timing, and Witness behavior
shadow-match the visible runtime. It does not change action authority and it is
not a reason to reimplement STS2 rules.

## Deferred Headless Subproject Gate

Status: documentation only; blocked on live-gateway admission criteria.

Physical Headless STS2 is no longer part of the active Bridge phase sequence.
It is a separate future subproject documented under
[docs/current/headless](../../../docs/current/headless/README.md). Do not create a Headless
runtime, shared-kernel package, permission profile, or adapter skeleton merely
because the protocol is transport-neutral.

The live path must first close its source-binding, transaction-correlation,
shared-validation, Witness, adapter-catalog, and exact loaded-evidence gates.
The full admission criteria, candidate host comparison, phases, acceptance,
and rollback rules are in [the Headless target
architecture](../../../docs/current/headless/TARGET_ARCHITECTURE.md). Passing that gate
permits an isolated experiment only; it grants no Headless or live authority.

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
- no Bridge execution of Transaction IR primitives or replay of game effects;
- no low-level click language in the wire protocol;
- no automatic permission from source reflection, class-name matching, or
  implementation presence;
- no self-authorizing registry or Mod-declared contract;
- no source literal whitelist as a substitute for complete transaction binding;
- no expansion of current local hash `1833084275` authority by this plan;
- no use of old MVID Organic evidence for a new DLL.

The active naming and ownership source is
[the Live STS2 connection boundary](LIVE_GAME_CONNECTION_BOUNDARY.md). Dated
DecisionFrame, source/headless, and boundary closeouts remain available in the
[Bridge preview archive](../../../archive/bridge-v2-previews/) as historical
rationale and evidence, not current architecture authority.
