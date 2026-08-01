# Connector V3 v0.110.1 Complete Re Journey: 2026-08-01

## Exact Identity

- run: `run-20260801111449-8oze2o`;
- Agent source: `connectorV3@a881243eb520a885acb273bf9774b0daa1087182`,
  clean source digest
  `eaaecb1aba68187968e5fd4f1e5f85632bc55b95a09d336fa1fa2e2b2b9642b3`;
- protocol: `3.0-preview.1`;
- loaded Gateway SHA:
  `752cff7c7749868822804b8da724ef8385054bba7574b019a69a6fa6150c0b07`;
- loaded MVID: `0be26638-fbdf-4a98-8950-d3179ee768db`;
- runtime: `89ac17eacac8468ea1e554d3daac6d4b`;
- game: `v0.110.1`, commit `db5d3552`, runtime main assembly hash
  `-205573697`;
- Modset: exact bridge only, fingerprint
  `101c67ca036f78a2522f653f5faae2e73d01578bb25de5dd3d29aabd18bc391d`;
- authority: encounter-scoped provisional trial; no persistent qualification;
- provenance: `unrecorded`, so this is coverage evidence unless independently
  reviewed.

## Result

The bounded ordinary run recorded 179 decisions: 176
`executed_and_settled`, two safe pre-execution stale refusals, and one normal
completed-run boundary after returning to the top-level menu. It traversed
menu, event, map, combat, rewards, shop, rest, treasure, generated-card,
deck-removal, deck-upgrade and game-over surfaces. All 176 submitted commands
returned `completed/confirmed`, a semantic completion receipt and an available
successor. No unknown Outcome, unsupported Surface, observation failure,
provider failure or unsettled command occurred.

The stale refusals were decision 90 on treasure and decision 163 in combat.
In both cases state changed after model selection but before execution; no
command was submitted. Decision 179 stopped normally because a bounded
`agent:run` does not begin a second game after the completed run returns to
main menu.

## Shop Repair Closure

Decisions 32, 80 and 101 submitted `cancel_interaction` with exact
`screen_id + control_id=close_shop_inventory`. All three completed with
`shop_inventory_closed` and an available successor. Decisions 33, 81 and 102
then submitted exact `room_id + control_id=proceed_shop`; all completed with
`shop_room_left_or_map_opened`. This is exact-runtime closure for the earlier
publication/execution parity defect in this loaded artifact.

Decision 39 selected a Skill Potion generated card and completed with
`skill_potion_choice_closed_and_exact_free_card_added_to_combat_hand_or_full_hand_discard`.
It used `provider_native_binding_adapter`; it is predecessor evidence for the
generated-choice semantics, not Live evidence for the later V3-native resolver.

## Non-claims

- The run does not create a durable qualification or cross-Mod claim.
- The later direct menu consumer, lazy V2 sidecar, V3-native menu resolvers and
  owner-bound generated-choice resolver require a new cold load.
- Kifuda, Dream Catcher handoff, potion discard, generated-choice skip and
  every unencountered source remain not exercised by this run.
- Source, tests, build and install of a replacement artifact cannot be
  reassigned to this runtime.

## Successor Deployment Boundary

The direct-menu consumer and V3-native menu/generated-choice replacement is
built and installed as SHA
`150f85a4777b259efb8c22f8dd482fedf881af9616998cc9c6d6a6fc59a2ed7d`, MVID
`29c747be-329b-487f-ab58-1b0f3b7b98bc`, with rollback
`STS2MCP/.local/deployments/2026-08-01T11-57-34-822Z`. The game was stopped
before installation. This is build/install evidence only; loaded identity and
Live behavior for the successor remain non-claims.
