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
- direct native commands for combat, shop-room, map, rest, event-option,
  shop-inventory, treasure-room, reward-claim, card-reward and source-bound
  deck-enchant interactions, plus current source cutovers for menu/run-setup
  and source-discriminated generated-card choices;
- bounded parameterized commands for remaining ordinary choices, purchases,
  selections and controls through an internal native-binding adapter;
- one controller, idempotent ledger, stale rejection, exact environment
  authority, semantic Outcome and unknown-no-retry;
- V3 REST, MCP tools and strict Re decoder/adapter;
- Re defaults to V3 and never executes a v2 action ID;
- Re consumes menu, event, map, game-over, room-reward and card-reward
  Surfaces directly and does not request the v2 capabilities sidecar for them;
- exact Stratagem Power source binding for the single-stack combat-pile
  selection exposed by current Live evidence.

Not yet claimed:

- loaded identity or mutation evidence for the latest installed v0.110.1
  artifact;
- V3-native read-only detail/Inspection;
- complete removal of the non-combat Provider adapter;
- complete removal of the Re v2 projection sidecar;
- multi-stack Stratagem Outcome;
- full vanilla or Mod coverage.

Current exact-runtime Re evidence includes
`run-20260801124814-414z9f`: 513 settled decisions, one safe pre-submit stale
refusal, no unknown mutation and one normal completed-run boundary after 516
decisions. Direct event/map/game-over consumption and both direct game-over
controls were exercised. The later direct reward consumer requires a new cold
load.

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

Replace `provider_native_binding_adapter` family by family. Menu, map, reward,
shop, generated choices, rest and treasure are cut over in current source;
prioritize the remaining bounded selectors.
Delete each Provider action-publication dependency after its V3 resolver has
tests and exact-runtime evidence.

### Wave 2A: Direct Re V3 Consumer

Replace the V2-shaped `legal_actions[]` and semantic normalizer projection with
direct typed V3 facts and candidates. Re may validate shape, identity and
state binding, but must not recompute Gateway affordability, legality or
completion. Migrate vertically and retain the old projection only until each
selected family has parity tests and replay evidence.

### Wave 3: V3 Evidence And Detail

Publish V3-native persistent summary, hover/detail and Inspection with explicit availability:
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
