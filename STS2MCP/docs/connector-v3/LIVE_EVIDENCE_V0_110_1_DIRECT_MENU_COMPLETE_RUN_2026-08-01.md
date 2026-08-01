# Connector V3 Direct-Menu Complete Run Evidence

Date: 2026-08-01

## Exact Identity

- Run: `run-20260801120346-xy7y0d`
- Agent source: clean `connectorV3@daed1d761e3c23b1297aa52b2e37909c09217298`
- Agent source digest: `86858cab77db37a753e2286577899a662c3f315141d21ec3016994467886688d`
- Gateway protocol: `3.0-preview.1`
- Loaded SHA: `150f85a4777b259efb8c22f8dd482fedf881af9616998cc9c6d6a6fc59a2ed7d`
- Loaded MVID: `29c747be-329b-487f-ab58-1b0f3b7b98bc`
- Runtime: `45acb4ff11084865939a102e9bd256a0`
- Game: `v0.110.1`, commit `db5d3552`, assembly hash `-205573697`
- Modset: `exact_bridge_only`, fingerprint
  `12710a39912710827ea3dc13091bb9dbaf058db90a9d4f00ad803934c3f30d00`
- Authority: encounter-scoped provisional trial; no persistent qualification

## Observed Result

The run reached the normal completed-run boundary after 95 decisions. It
recorded 93 submitted V3 commands, all `completed` with confirmed receipts,
fresh successor observations, unique request IDs and retry forbidden. The one
pre-submit stale-state refusal occurred while embarking from character select;
the next fresh observation succeeded. The final non-actionable main-menu state
was classified as the expected `completed_run_boundary`.

The journey covered menu/run setup, events, map, combat, combat-hand selection,
outer rewards, card rewards and game over. Direct Re menu consumption was
actually exercised: metadata reports `v2_consumer_projection_sidecar=false`,
and character-select candidates used `native_direct_resolver`. Ninety submitted
commands used direct native resolvers. Four actions still used the bounded
Provider-native migration adapter: two combat-hand selections and two game-over
controls.

No unknown Outcome, unsettled command, unsupported interaction, observation
failure, provider failure or parse failure occurred.

## Defect Found

The Gateway log recorded two non-blocking observation errors for the
`ENDLESS_CONVEYOR` event. The fallback attempted to format model localization
containing `{Gold}` without the event variables because the rendered
`EventDescription` node was not found from the room root. Current source now
searches the exact descendant node name before using model text. This repair is
tested but was not part of the loaded artifact above.

## Recorded Replay After The Run

Current Re source decoded every saved snapshot whose exact context/surface is
handled by the expanded direct consumer: 29 direct snapshots, zero failures
across character-select/main-menu, event-option, map-navigation and game-over.
This is recorded replay evidence, not Live evidence for the replacement
artifact.

## Non-Claims

- The current event/map/game-over direct Re consumer was not loaded in this run.
- The current direct game-over Gateway resolver was not loaded in this run.
- A generated-card-choice source did not occur and remains `not exercised`.
- V3-native Inspection content transport is not implemented.
- The run created no durable claim or cross-environment qualification.
- Source, tests, replay, build and install do not transfer authority across a
  SHA/MVID change.
