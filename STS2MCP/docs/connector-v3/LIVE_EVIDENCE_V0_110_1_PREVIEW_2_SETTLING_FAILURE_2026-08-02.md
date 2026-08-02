# Connector V3 Preview.2 Settling Failure Evidence

Evidence date: 2026-08-02

## Exact Identity

Nine local Re runs from `run-20260802073844-wyq08j` through
`run-20260802074610-ow4g7a` recorded clean Agent source
`718bbffc873144db35e2406f11b05de9a6e84054` and loaded:

- protocol `3.0-preview.2`;
- Gateway SHA `9a829a23d308aabddf43a36543cb65a46340a353bd4327d3eb229c49d516888e`;
- MVID `6a5ff4af-5d27-444c-b555-d3682cdfb7dd`;
- runtime `b25326e8f84a49c6963fd5ce4bf7423e`;
- game `v0.110.1`, commit `db5d3552`, assembly hash `-205573697`;
- Modset `exact_bridge_only`, fingerprint
  `8d2f9d37e7d6970f117768832a8f2a09ead8bf77cfbdc020aef19584f662077e`;
- permission mode `migration_exploration` and scoped provisional trial;
- no persistent qualification or durable claim.

`show-status` independently matched source/built/installed/loaded SHA, MVID
and protocol while this runtime was alive. The game log reports one loaded
`STS2_MCP` manifest and no Gateway exception.

## Results

The nine runs contain 57 decisions:

- 48 `executed_and_settled` commands;
- every receipt was `completed/confirmed` with an available successor;
- 33 submitted decisions used the direct V3 Re consumer;
- 15 submitted decisions used the temporary semantic sidecar: 11 ordinary
  combat decisions and four deck-upgrade selector decisions;
- no stale submission, pending receipt, unknown Outcome, provider failure or
  observation failure occurred.

Live commands covered menu/run entry, event, map, room reward, card reward,
combat, shop room/inventory, treasure, rest and deck upgrade. Direct V3 Re
consumption was exercised for main menu, single-player menu, character select,
event, map, reward/card reward, shop room/inventory, rest and treasure.

The game log also records developer-console travel/win assistance. Provenance
is `unrecorded`; these runs are reviewed exact-runtime coverage evidence, not
an unattended Organic journey or qualification.

## Failure

All nine runs stopped safely before mutation on a coherent
`not_executed_invalid_state`. Raw observations show the same semantic defect:

| Native lifecycle | Count | Raw V3 facts |
|---|---:|---|
| run mount | 1 | `run_transition/no_action`, `phase=settling`, no candidates |
| combat setup or native resolution | 6 | `combat/combat_turn`, `phase=settling`, no candidates |
| treasure departure | 2 | `treasure/treasure_room`, `phase=settling`, no candidates |

The Gateway derived `execution_support=unsupported` solely because the current
candidate set was empty. Re prioritized that value over `phase=settling` and
projected an unsupported Surface. This conflated two orthogonal facts: whether
the family has an exact binding and whether a command is legal at this instant.
No game error, authority denial or unknown mutation caused these stops.

## Preview.3 Repair Boundary

Source protocol `3.0-preview.3` now:

- keeps known non-ready native interactions supported while publishing zero
  candidates;
- consumes coherent settling states directly as `no_action` and lets Re's
  bounded non-actionable guard supervise them;
- consumes ordinary combat directly with typed combat facts and exact
  card/potion/target validation, removing its V2 capabilities sidecar;
- consumes source-discriminated generated-card choices directly while
  retaining exact screen, card, control and source-specific result semantics.

Gateway/Re tests and protocol-rewritten structural replay cover the repair.
That replay is fixture-level only. Preview.3 load, mutation, settling recovery,
generated choice and Inspection remain pending exact-runtime evidence until a
new cold start.

Preview.3 was subsequently built and installed while the game was stopped:

- SHA `1f82431fa5798768074628eea98a131a20f6faa20eda997d6770035045ec44b0`;
- MVID `17252734-e9e8-46a4-ba3a-37e6107a5f98`;
- rollback `STS2MCP/.local/deployments/2026-08-02T08-11-59-532Z`.

Source, built and installed identities match. Loaded identity remains a
`non-claim` until the next cold start.

## Non-Claims

- Preview.2 Live evidence does not transfer to Preview.3 SHA/MVID.
- Generated choice and V3 Inspection did not occur in these nine runs.
- The runs do not create persistent qualification or a durable claim.
- A normal settling recovery is not proven until Preview.3 is cold-loaded and
  survives the same lifecycle in the exact runtime.
