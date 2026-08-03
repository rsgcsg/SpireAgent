# Connector V3 Implementation And Migration Plan

Status: source migration closed; exact-runtime closure active

Authority: [ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md)

## Goal

Provide one production Connector that completes an ordinary vanilla
single-player run through player-visible observations and native STS2 commands,
or stops at a precise typed unsupported boundary.

## Current Source

Preview.9 implements:

- V3 capabilities, observation, command and receipt contracts, plus
  `inspection-1` and `linked-detail-1`;
- exact state/interaction/entity/control binding, one controller, idempotent
  ledger, native execute-time validation, native Commit, semantic Outcome and
  unknown-no-retry;
- direct V3 discovery/execution for ordinary combat, menus, map, events,
  rooms, shops, rewards, game over and every currently cataloged selector;
- typed final selector slices for combat pile, deck transform and Wood
  Carvings, with source-distinct semantics and witnesses;
- direct generated-choice command construction from typed selectable,
  skip-control and source-bound operation facts;
- direct Re decoding/projection of every recognized V3 Surface, with no V2
  capabilities/state sidecar and no local game-legality reconstruction;
- 94 explicit native operation contracts and zero fallback authority
  contracts;
- state-token-bound run-deck, combat-piles and shop-catalog Inspection plus
  bounded current-Surface card detail;
- targetless native potion support and exact map/character control facts.

Provider classes may still contain exact game binding and native Commit helper
code inside the Gateway. They do not publish V3 authority, create a second
executor or supply `draft.Actions`. Moving those mechanics into renamed files
would be organization work, not a remaining production path.

## Evidence Boundary

The supplied Preview.8 archive proves one exact loaded tuple and a completed
unrecorded-provenance journey. It does not qualify Preview.9.

Preview.9 has passed source tests and Release build and is installed as SHA
`540acf9658b3bf04b2e094f3778453e063088aa8af560b67ea35b317c5a39d49`,
MVID `afa5d986-d82d-4a01-b2ab-5509e3926f61`. STS2 is closed, so load, runtime,
canary, journey, Organic and qualification are non-claims.

## Remaining Phases

### Phase 1: Exact Cold Load

Exit conditions:

- source, built, installed and loaded SHA/MVID agree;
- protocol, game, Modset, Patch and runtime are recorded;
- empty/absent authority remains Fail Closed;
- rollback snapshot is retained.

Rollback: restore `.local/deployments/2026-08-03T05-01-55-991Z` as a whole
artifact. Never mix its DLL and provenance record with Preview.9.

### Phase 2: Final Family Canaries

Exercise, on the same exact Preview.9 runtime:

- Explosive Ampoule or another targetless native potion;
- combat-pile select/deselect/confirm as naturally available;
- Whispering Hollow/New Leaf transform stages as naturally available;
- Wood Carvings replacement;
- generated-card selection and skip with source-operation parity.

Each canary retains one input owner, exact operands, execute-time revalidation,
native Commit, action-local Outcome and no authority transfer to sibling
sources.

### Phase 3: Information And Lifecycle

- re-exercise current and stale `combat_piles`, `shop_catalog` and
  `surface_card` reads;
- verify known-room settling resumes while unknown owner remains unsupported;
- capture quarantine, revoke and rollback behavior;
- implement physical native-page opening only as an optional evidence profile.

### Phase 4: Same-Artifact Journey And Archive

Run one bounded ordinary journey on the exact artifact, classify every stale,
unknown, unsupported and stop, then archive the V2 production boundary. V2
diagnostic endpoints may be deleted separately after rollback tooling no longer
needs them; they cannot regain Re or mutation authority meanwhile.

## Required Gates

- stale state/action and replacement entity reject before Commit;
- duplicate request ID never mutates twice;
- publication and execution use the same typed actionable facts;
- lost completion evidence returns unknown and is never retried;
- parent/child owner handoff leaves one mutation owner;
- hidden RNG and future content never enter decision truth;
- wrong game, MVID, Modset, Patch or runtime cannot inherit authority;
- REST, MCP and Re do not add commands or semantics.
