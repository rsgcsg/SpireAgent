# Connector V3 Implementation And Migration Plan

Status: Active

Authority: [ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md)

## Goal

Provide one clean Connector that lets Re-SpireAgent complete an ordinary
vanilla single-player run through player-visible observations and native STS2
commands, or stop at a precise visible unsupported boundary.

## Current Slice

Implemented in source:

- `3.0-preview.1` capabilities, observation, command and receipt contracts;
- state token, stable instance identity and one active interaction;
- visible unsupported interactions;
- direct combat resolvers for `play_card`, `use_potion` and `end_turn`;
- bounded parameterized commands for ordinary choices, navigation, purchases,
  selections and controls through an internal native-binding adapter;
- one controller, idempotent ledger, stale rejection, exact environment
  authority, semantic Outcome and unknown-no-retry;
- V3 REST, MCP tools and strict Re decoder/adapter;
- Re defaults to V3 and never executes a v2 action ID;
- exact Stratagem Power source binding for the single-stack combat-pile
  selection exposed by current Live evidence.

Not yet claimed:

- loaded V3 identity;
- V3 mutation canary or complete V3 journey;
- V3-native read-only detail/Inspection;
- complete removal of the non-combat Provider adapter;
- complete removal of the Re v2 projection sidecar;
- multi-stack Stratagem Outcome;
- full vanilla or Mod coverage.

## Migration Waves

### Wave 1: Vertical Cutover

Exit conditions:

- Gateway, MCP and Re default to V3;
- direct combat mutation does not query V2 actions;
- stale, entity replacement, idempotency, unknown and controller negatives pass;
- source, built and installed identities agree;
- one cold-loaded exact-runtime combat and one non-combat command complete.

Rollback: restore the timestamped installed DLL snapshot and set the branch
back to the last known v2 commit. No durable V3 claim is inherited.

### Wave 2: Native Non-Combat Catalog

Replace `provider_native_binding_adapter` family by family. Prioritize menu,
map, reward, shop, generated choices, rest, treasure and bounded selectors.
Delete each Provider action-publication dependency after its V3 resolver has
tests and exact-runtime evidence.

### Wave 3: V3 Evidence And Detail

Publish V3-native hover/detail/Inspection with explicit availability:
observed, inspectable, unavailable, failed or stale. Remove the v2 capability
projection sidecar only after Re can obtain equivalent decision-relevant facts
from V3.

### Wave 4: Authority Simplification

Project the existing exact-environment safety kernel into the V3 four-state
model: supported, trial, quarantined and unsupported. Retain durable evidence,
revoke and rollback, but remove v2-only operation/manifest identity where it no
longer protects a concrete failure.

### Wave 5: V2 Production Retirement

Remove V2 mutation routes and adapters after representative ordinary journeys
cover combat, navigation, rewards, shops and selections on the same exact V3
runtime. Archive the final protocol and evidence. Keep no silent fallback.

## Required Experiments

- stale state and changed interaction reject before Commit;
- a replacement object at the same UI position cannot reuse an entity ID;
- duplicate request ID does not apply a second mutation;
- lost completion evidence returns unknown and cannot retry;
- parent/child owner handoff publishes only the child owner;
- visible unsupported state contains facts but no commands;
- wrong game, MVID, Modset or Patch cannot inherit authority;
- exact rollback restores the prior installed artifact;
- ordinary one-game journey stops after returning to the main menu.

## Runtime Evidence Queue

After installing a new artifact:

1. cold-start STS2;
2. verify loaded SHA, MVID, protocol, game and Modset;
3. run `npm run agent:run`;
4. retain local run artifacts but commit only reviewed summaries;
5. classify every stop as A, Re, Gateway, environment, expected boundary or
   not exercised;
6. never transfer evidence between contracts that merely share a UI.
