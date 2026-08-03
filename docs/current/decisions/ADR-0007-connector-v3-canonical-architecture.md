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
without physically changing the UI owner. The implemented
`native_pages.v1` profile is optional evidence tooling, disabled by default,
runtime/state bound, read-only and not part of the decision path.

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

## Source Closure And Remaining Debt

At `3.0-preview.12`:

- every currently cataloged family, including combat pile, deck transform and
  Wood Carvings, has typed direct V3 discovery/execution and a direct Re
  consumer;
- all 94 operation entries require explicit native contracts; no manifest
  fallback can enter authority;
- Connector V3 consumes neither Provider `draft.Actions`, `LegacyBinding` nor
  `provider_native_binding_adapter`;
- Re consumes neither a V2 capabilities/state sidecar nor a V2-shaped
  normalization projection;
- Connector V3 uses its own non-executing command descriptor; direct-family
  Providers publish no action drafts. Historically named
  Provider files may still own exact game reflection, source binding, native
  Commit and Outcome helpers. That internal code is not protocol authority or
  a second executor;
- V3 state-bound Inspection and linked detail remain read-only and independent;
- V2 endpoints remain mounted only for rollback and migration diagnostics;
- V3 capabilities/control expose V3-native wire schemas plus exact Patch,
  permission and qualification scope identity;
- Re's production Prompt uses deterministic compact projection v1;
- the optional Human-equivalence profile has fixed native page adapters,
  owner validation and explicit recovery without authority.

Source migration debt is therefore closed. Rare-family exact-artifact runtime
evidence, durable qualification lifecycle, loaded rollback/revoke, full Human
profile Live exercise and final V2 endpoint archival remain. These must not be
described as source support or solved by retaining dual authority.

Readiness is also orthogonal to support. A known interaction in native
`settling` publishes no command and remains a supported family; Re projects a
typed `no_action` checkpoint and continues bounded supervision. Treating an
empty settling candidate set as unsupported is rejected because Preview.2
demonstrated that it terminates normal run mount, combat resolution and
treasure departure.

Preview.5 Live evidence also established that an exact source-specific child
transaction can be absent even when its generic UI shape is visible. Preview.6
therefore permits a V3-native source binding to supersede Provider discovery,
and forces an empty fail-closed observation if that discovery throws. It does
not introduce a universal selector or transfer Luminous Choir authority to
another event, relic, reward or Mod.

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

The wholesale V2 endpoint retirement still requires exact-runtime evidence for
the ordinary vanilla capability matrix and tested rollback. A single family
must not retain two executable authorities while waiting for that evidence:
after source/owner audit, exact operands, execute-time revalidation, native
Commit, Outcome, positive and negative tests, and a verified rollback install,
its replaced Provider closure is deleted and the new path remains Fail Closed
until cold-loaded. Exact-runtime evidence gates the support and qualification
claim; it does not justify a permanent fallback executor. The temporary
projection sidecar may be removed when V3 publishes the required semantic
state, visibility and detail contracts directly.

## Evidence Boundary

### Preview.8 implementation amendment

Direct command discovery is an Interaction/Command Catalog fact, not an
authority grant. Encounter admission may consume an exact direct descriptor,
but only an explicit native contract can produce the runtime-bound trial scope.
This removes the historical dependency on Provider `draft.Actions` without
letting manifests, static similarity or tooling authorize execution. Generated
choices share bounded screen mechanics while retaining source-specific
operation and Outcome contracts. The canonical architecture is unchanged;
remaining fallback contracts are migration debt, not a second target.

Source, fixtures, tests, build, install, load, mutation canary, bounded journey,
Organic evidence and durable qualification are different states. This ADR
authorizes architecture work only. It does not claim that the V3 artifact is
loaded or Live-qualified.

### Preview.9 implementation amendment

The final selector families use typed Surface facts and direct V3 candidate
construction. The operation catalog is explicit-only (`94/0`), Provider action
publication is absent for direct families, and Re's V2 projection sidecar is
deleted. Generated-card Surface facts now bind current selectable cards and
source-specific select/skip operations so publication and Re validation share
one explicit contract instead of accepting any selection-shaped operation.

Targetless native potion support follows STS2 `IsValidTarget(null)` rather
than inventing a target, while explicit target types retain exact operands.
Map annotation and character selection similarly require current native
control availability. These corrections preserve the hard shell; they do not
grant new durable authority.

The exact `v0.110.1` assembly was also rechecked for the compatibility audit's
`Tutor` holdout. Its multiplayer target-player selector disproves automatic
reuse of the ordinary source-owner combat-pile contract. V3 keeps it
diagnostic-only and Fail Closed; this is a deliberate negative boundary, not
unfinished fallback authority.

The supplied Preview.8 archive is historical exact-artifact journey coverage
with unrecorded provenance. Preview.9 source, tests, Release build and install
are complete on the current machine, but cold-load, runtime, canary, Organic
and qualification are non-claims until separately observed.

### Preview.11 freeze-candidate amendment

V3 now owns its command descriptor and control wire. `BridgeActionDraft`,
Provider action publication, V2 state/action sidecars and fallback authority
are absent from the active V3 path. Permission, qualification and Patch scope
identity is part of V3 capabilities and strict Re decoding. Transport body
limits no longer trust `Content-Length` alone.

The production Prompt uses deterministic compact projection v1. Complete
normalized evidence remains recorded, while the model receives one action
menu, deduplicated visible facts and the necessary information boundary. The
projection hash is audit identity, not command authority.

The default-off `native_pages.v1` evidence profile may open only fixed native
deck/pile/shop pages. A session binds the exact runtime and state, suppresses
mutation, validates pre/current/post owner, and enters `recovery_required`
instead of guessing after a partial failure. It does not enter the Command
Ledger or authorize a command.

Preview.11 has exact build/install/load identity, strict capability/control
decode, one `main_menu/open_singleplayer` canary, stable successor, stale
refusal and disabled-profile Live evidence. Qualified and durable scopes are
empty. Rare selectors, full Human-page lifecycle, loaded rollback/revoke and
a same-artifact Journey remain, so the release state is `FREEZE CANDIDATE`,
not `FROZEN`.

### Preview.12 adaptation and freeze-readiness amendment

The macro decision remains accepted, but later Preview.11 Live evidence
rejected the claim that all remaining failures were merely closed gray scope.
The sample contained source gaps, post-success witness quarantine, one
consumer-side generated-choice whitelist drift, controller lease cleanup and
one correct unknown-no-retry transition.

Generated-choice source semantics are now Gateway-local. Re validates the
current Surface's source-local operation, current card set and exact bindings;
it does not enumerate every source kind or infer authority. This is the
canonical composition rule for shared UI mechanics: visible mechanics may be
shared, while source, owner, operands, Commit and Outcome remain exact and
independently auditable.

Source-unresolved known UI is projected as visible unsupported. Runtime
witness constants for rest and combat-hand confirm are checked against the
operation catalog, and Re performs idempotent graceful controller release on
SIGINT/SIGTERM. None of these changes weaken single-writer, execute-time
revalidation, native Commit, idempotency, unknown-no-retry or exact identity.

Preview.12 is a `CONDITIONAL FREEZE CANDIDATE`. It requires cold-load and
changed-path Live evidence. The existing empty durable qualification store is
retained; Preview.11 session grants and quarantine records do not transfer.
The detailed evidence and non-claims are in the
[freeze re-audit](../audits/CONNECTOR_V3_FREEZE_READINESS_AND_ADAPTATION_REAUDIT_2026-08-03.md).
