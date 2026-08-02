# ADR-0007: Connector V3 Canonical Architecture

Status: Accepted

Date: 2026-07-31

## Decision

Connector V3 is the repository's only current Connector target and the default
Re-SpireAgent transport. It replaces Bridge v2 as the external Agent contract.
ADR-0002 through ADR-0006 remain decision history; their retained safety
invariants are restated here and their v2-specific target structures are
superseded.

The canonical live path is:

```text
Native STS2
-> Observation Engine
-> Interaction Engine
-> Native Command Catalog
-> Authority Policy
-> Action Runtime
-> Receipt and successor observation
-> Re-SpireAgent consumer projection
```

The side plane records exact environment identity, compatibility, evidence,
trial, quarantine, revocation and rollback. It cannot execute commands or grant
authority by itself.

## Why V3

Bridge v2 fixed real v1 defects: stale index mutation, weak entity identity,
submission-as-success, ambiguous timeout, multiple writers and client-side
legality reconstruction. Those fixes are retained.

Bridge v2 also made its internal `legal_actions[]` expansion the Agent's only
language. That coupled observation to execution support, expanded target
cartesian products, made visible unsupported interactions hard to represent,
and forced one Provider to combine observation, source binding, authority,
Commit and Outcome. These costs were repeatedly visible in CombatPile sources:
the UI mechanics were reusable, while Cleanse, Seance, Dredge and Stratagem
required different exact source and Outcome contracts.

V3 therefore accepts parameterized semantic commands, but it is not v1:

- the request is bound to an exact `state_token` and `interaction_id`;
- every entity operand is a Gateway-issued instance identity;
- the Gateway resolves the exact current native object at execution time;
- native legality and owner are revalidated immediately before Commit;
- STS2 performs the Commit;
- the command ledger returns `completed`, `not_executed`, `pending` or
  `unknown`;
- an unknown mutation is never retried automatically.

## Core Boundaries

### Observation Engine

Publishes player-visible facts independently of mutation support. Unknown
critical facts are explicit. Hidden RNG, true draw order and future outcomes
remain excluded.

The canonical information projection separates persistent HUD summary, the
complete current Surface, state-bound linked detail and state-bound read-only
Inspection. The mainline profile may expose semantically inspectable facts
without physically changing the UI owner. A strict real-page-opening profile
is optional evidence tooling, not the default decision path.

Inspection is an independent V3 wire contract bound to the exact current
`state_token`. Its implementation may share player-visible read mechanics with
the predecessor, but it does not share predecessor state identity or authority.
It never enters the Command Ledger and cannot grant mutation.

### Interaction Engine

Identifies exactly one current input owner and describes visible affordances.
A visible but unsupported owner remains observable with no command candidates.
UI similarity alone never establishes source or business semantics.

### Native Command Catalog

Maps a small public command vocabulary to exact native resolvers. Combat
`play_card`, `use_potion` and `end_turn` resolve current objects directly and
do not look up Bridge v2 action IDs. Selection mechanics may be shared only
when source, owner, operands, Commit, Outcome and condition partition remain
explicit.

### Authority Policy

Projects one decision for the exact environment and command contract:
`supported`, `trial`, `quarantined` or `unsupported`. Static similarity,
fixtures, manifests and evidence tooling do not independently grant live
authority.

### Action Runtime

Owns controller admission, idempotent request IDs, execute-time revalidation,
native Commit, action-local Outcome and receipts. `unknown` is terminal for
automatic execution.

### Consumer Projection

Re may compress and normalize observations and may expand a Gateway-provided
bounded operand domain into local opaque choices. It cannot add operands,
reconstruct legality, infer completion or execute a v2 action ID.

## Retained V2 Assets

The first V3 cutover reuses proven game-side assets where their responsibility
is unchanged:

- stable instance identity;
- one runtime controller lease;
- command ledger and completion polling;
- exact environment, Modset and Patch identity;
- session trial, quarantine and durable qualification validation;
- mature player-visible context and family-specific native adapters.

Reuse is internal implementation reuse, not V2 protocol authority.

## Explicit Migration Debt

At `3.0-preview.5`:

- combat and multiple ordinary non-combat families use direct V3 native
  resolvers; menu/run-setup, source-discriminated generated choices and
  game-over, combat-hand selection, Smith deck upgrade and merchant deck
  removal are now cut over in source, while remaining selectors use a bounded internal
  `provider_native_binding_adapter` that never submits or searches a v2 REST
  action ID;
- Re directly consumes ordinary combat, source-discriminated generated-card
  choice, main/singleplayer/character menu, event, map, game-over,
  reward/card-reward, shop, rest, treasure, lifecycle-settling and
  visible-unsupported facts and candidates. Combat-hand, Smith deck upgrade
  and merchant deck removal join this direct path. Remaining selector Surfaces use
  `/api/v2/capabilities` as a same-runtime,
  non-authorizing semantic/environment projection sidecar and temporarily
  expand V3 candidates into a V2-shaped normalization projection;
- V3 state-bound read-only Inspection is exposed for run deck, combat piles
  and shop catalog. Bounded `surface_card` linked detail is also implemented;
  exact-runtime evidence and the optional physical-UI evidence profile remain
  pending;
- v2 endpoints remain mounted for rollback and migration diagnostics, not as
  the default Re or MCP mutation path.

These are deletion targets. They must not become permanent dual authority.
In particular, V2 validators that require every visible affordance to have an
authorized action cannot be the final V3 consumer contract: visibility and
operation-scoped authority are intentionally orthogonal.

Readiness is also orthogonal to support. A known interaction in native
`settling` publishes no command and remains a supported family; Re projects a
typed `no_action` checkpoint and continues bounded supervision. Treating an
empty settling candidate set as unsupported is rejected because Preview.2
demonstrated that it terminates normal run mount, combat resolution and
treasure departure.

## Rejected Alternatives

- Restore v1 indices or accept arbitrary method, node, coordinate or reflection
  mutation.
- Keep v2 opaque action enumeration as the permanent external language.
- Wrap v2 action IDs in prettier V3 MCP tools.
- Build a universal selector, transaction engine, Effect DSL or second STS2
  rules engine.
- Hide a visible interaction merely because execution is unsupported.
- Let Re, MCP, compatibility tooling or evidence records grant authority.

## Cutover And Deletion Conditions

V2 mutation paths may be removed when V3 has exact-runtime evidence for the
ordinary vanilla capability matrix and rollback remains tested. The temporary
projection sidecar may be removed when V3 publishes the required semantic
state, visibility and detail contracts directly. Each family cutover requires
source/owner audit, exact operands, execute-time revalidation, native Commit,
Outcome, positive and negative tests, runtime evidence and an old-path deletion
condition.

## Evidence Boundary

Source, fixtures, tests, build, install, load, mutation canary, bounded journey,
Organic evidence and durable qualification are different states. This ADR
authorizes architecture work only. It does not claim that the V3 artifact is
loaded or Live-qualified.
