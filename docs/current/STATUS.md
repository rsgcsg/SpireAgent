# Current Status

Baseline date: 2026-08-01

Branch baseline: `connectorV3` at
`7b3567775f5cea7d3e27679db721a695e99d46bd`, plus the current exact-environment
scenario and cross-platform CLI fixture correction. The worktree, not the
commit alone, produced the current installed artifact.

## Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) is the
only current Connector target. Bridge v2 remains internal migration material
and rollback capability, not the default Agent contract.

Current V3 source implements:

- `3.0-preview.1` observation and command schemas;
- exact state token and entity identity;
- one visible active interaction, including visible unsupported states;
- parameterized commands and action-local receipts;
- direct native combat, shop-room, shop-inventory, map, rest-site,
  event-option, treasure-room, reward-claim, card-reward and deck-enchant
  resolvers;
- bounded non-combat native-binding migration adapters;
- one controller, exact environment authority, idempotent command ledger,
  semantic Outcome and unknown-no-retry;
- V3 REST/MCP and strict Re default consumption.

## Exact V3 Runtime Evidence

On 2026-08-01 the local Steam installation still reported game `v0.110.1`,
commit `db5d3552`, but its exact `sts2.dll` identity differed from the earlier
same-release installation: SHA
`5a8fb7eb62510a86fd03653b9210cd8f67b511b632331a1f174042de39c92bd9`,
MVID `f8b13902-74e6-4c41-9d83-7ea2bbf61567`, declared release assembly hash
`348485714`. A separate exact static scenario records this identity rather
than overwriting the earlier scenario. Compatibility grading again found 14
registered matches and only the existing Tutor diagnostic holdout; this has
no authorization or qualification effect.

Current source and Re both use protocol `3.0-preview.1`. Gateway 235 tests,
Re 223 tests/typecheck/build and all Connector checks passed against the
current game assemblies. The resulting Release is built and installed as SHA
`3faf7cf2f402cafec0db40ea90a4212aef35c590c093caf6b114b69b7dba2d2b`,
MVID `ebbea794-be0a-422d-a2ce-e2b981e664a5`, with rollback
`STS2MCP/.local/deployments/2026-08-01T10-30-16-282Z`. A Steam cold start
loaded the exact same SHA/MVID as runtime
`0d517090cd3f4a10a2d844e423f01e5f` with exact-bridge-only Modset fingerprint
`1bf26047b68166b98b967e691d4a8d2630ed09092010bd1f20939432ca1c435f`.
The normal local Re `agent:inspect` entry negotiated V3, decoded the current
menu state without diagnostics and established encounter-scoped provisional
trial authority. No mutation was submitted; Organic behavior and durable
qualification remain non-claims.

The latest previously exercised v0.110.1 artifact was cold-loaded as SHA
`548f15e45dc6609cf4a25af61af2ef2b07365af625b23dbd4f58369001a5f703`,
MVID `4700a63e-f587-49b7-a642-bfe10713cc42`, runtime
`a611dc97e2f046e4bd6e604c3501d692`, game `v0.110.1` commit `db5d3552`,
release assembly hash `-959015736`, with exact-bridge-only Modset fingerprint
`4ee35e807a347e1123a703713bdc7c97b9821f391f4c9df057a9fd08b0484072`.
The canonical `out` build, installed and loaded artifact identities agreed.
The game has since been cleanly closed, so this is last-loaded evidence rather
than a claim that a runtime is currently active.

After shutdown, the shop-inventory path was cut over from
`provider_native_binding_adapter` to typed-Surface V3-native discovery and
direct execution. The resulting artifact is built and installed as SHA
`28a6fba283bf26075ac8056e167f931f51322e5c36f85f93f85e617e10f8bf7f`,
MVID `ceee2912-fd46-4f9d-9c80-bef0d81d03fc`. It has not been loaded. The
preceding `.86` runtime evidence below is not attributed to this artifact.

Codex directly exercised two bounded journeys through V3 without using
Re-SpireAgent as the player. The saved Defect A0 run won floor 27 normal,
floor 28 elite and floor 29 Ovicopter combats, exercised exact Hologram pile
selection, potion use, rewards, card rewards and Tea Master event consequence,
then died on floor 31 and completed the game-over return. A fresh Ironclad A0
run exercised menu/run setup, Scroll Boxes bundle preview/commit, full visible
map topology, combat, current-artifact reward/card reward, shop purchase and a
generated zero-cost attack. It was intentionally stopped at floor 4 map with
80 HP and 50 gold. No unknown Outcome was observed; the final journal and
receipt were completed with retry forbidden.

The apparent absence of future map paths was disproved: the complete visible
graph is in `context.nodes`, while `surface.next_options` correctly limits the
mutation domain. Two Defect-run failures to predict Sunder energy refunds were
strategy errors caused by a compact local view omitting visible enemy block
and `Hard to Kill`; the full Gateway payload contained both facts.

Exact details and non-claims are in
[v0.110.1 Codex direct-play evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_1_CODEX_DIRECT_PLAY_2026-07-31.md).
The current artifact still has no durable qualification. Its encounter-scoped
session authority ended with the runtime.

The earlier v0.110.1 startup artifact was cold-loaded as SHA
`b3897459d122e7208ad7d6fa2e56816ec594146fa92c637eecfd691a4fd2a469`,
MVID `591c6251-d2a3-4281-b723-9a048b0ac9d0`, runtime
`98b52677796c4e6aa103c404a6952789`.

`run-20260731104027-lxj3h3` exercised the complete `agent:run` startup,
DeepSeek decision and V3 submit/poll path. Decision
`decision-000001-ms8ta5sn-ueffiu` executed one advertised `main_menu` command
and settled. The process then stopped intentionally at `--max-ticks 1` before
a run boundary. This is exact-runtime session-canary evidence for startup and
that menu command only; it is not a completed journey, card-reward evidence or
durable qualification.

The previous v0.110.0 exercised runtime used SHA
`40d088745cd3e23844c06d81bbefd2b85ccb427104e7325d0719e3134607d84c`,
MVID `9add88e7-19d6-4854-95e3-060544ce5663`, runtime
`2b379e0ef1574de6a482e16b31619981`, game `v0.110.0` commit `eecc8c4d`
and exact-bridge-only Modset fingerprint
`1b5f280d2206f1c12ca04f44b995b8f99224cff247b6495aaad30422099e3fc4`.

Eleven runs from `run-20260731081935-zv6pbq` through
`run-20260731083523-r3am2e` recorded 264 decisions on source revision
`117eb6f...`: 244 settled, three checkpoint-pending, six safely stale, two
invalid model-selected IDs, one provider fetch failure, five typed
unsupported/quarantined stops, one pre-Commit potion rejection and two
unknown Outcomes. V3-native map, event and treasure commands all completed on
this exact runtime. The map owner-and-choice repair is therefore exercised,
not merely replayed.

The runs exposed three current Gateway defects now repaired in source:

- a self-target potion candidate omitted its exact player-creature target,
  causing publication/execution legality drift;
- Headbutt waited for the whole source-card task after the exact selected card
  had already reached draw-top and the selector had closed;
- `end_turn` treated native cleanup before phase handoff as an unexpected
  state transition.

The first is fixed by exact target entity binding. The latter two retain
action-specific probes but permit the native asynchronous boundary. Outer
reward claim/discard/proceed candidate discovery and execution are now
V3-native and no longer use `draft.Actions` or `LegacyBinding.Start()`.
Those changes are present in the current branch HEAD. Card-reward
select/alternative discovery and execution now also avoid `draft.Actions` and
`LegacyBinding.Start()`; exact selectable-card facts and a consistently
filtered option-set Witness were added in the current worktree.
Shop inventory purchase, card-removal handoff and close discovery/execution
now also avoid those legacy bindings. They bind the exact inventory screen,
offer and native slot and revalidate the advertised price before STS2 Commit.
This cutover is statically verified and installed, but awaits cold-load and
Organic evidence.

Steam updated the local game after the v0.110.0 journey to `v0.110.1`, commit
`db5d3552`, release main assembly hash `-959015736`, `sts2.dll` SHA
`7c446efabf80614c429b5088e87101423aa5bb4c04fc3e73393261f6e6d404fd`
and MVID `c0f649b8-8d57-4a9c-8b07-21aece97dca0`. Static compatibility grading
passes with 14 registered matches and the existing Tutor diagnostic holdout;
all reviewed operation-binding probes match. The report itself has no
authorization or qualification effect. The separately recorded cold load and
menu canary above are the current runtime evidence.

Exact attribution is recorded in
[v0.110.0 Live evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_0_2026-07-31.md).
Event-option, treasure-room, map, combat Outcome and reward-native execution
now have exact `.86` Live evidence. The later shop-inventory V3-native cutover
does not. The earlier
[v0.109.1 evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_2026-07-31.md)
remains historical exact-runtime evidence only.

## Predecessor Runtime Evidence

The latest exact loaded artifact before this cutover was Bridge v2
`2.0-preview.82`, SHA
`f5f4791091f0480432d2c30ce3bd8f946049380fde0ab02053692285c4ee3b4c`,
MVID `1e12b8d5-ebcc-4bf1-a4bc-a9b768cdcc0f`.

Recent predecessor runs:

- `run-20260731000937-2o8ur5` stopped on a provider response truncated at the
  configured output limit; the strict format retry now has a larger bounded
  output allowance.
- `run-20260731001404-d2xlwt` and
  `run-20260731001658-eouihd` stopped at the same exact unsupported
  `NCombatPileCardSelectScreen`. Source audit identified
  `StratagemPower.AfterShuffle`; the single-stack source is now explicitly
  bound to its native draw-to-hand Outcome.
- `run-20260731003323-4w0q4a` completed a 158-decision one-game boundary and
  stopped normally after returning to the main menu.

These runs are defect and predecessor-coverage evidence. They are not V3 Live
evidence or durable V3 qualification.

## Evidence State

| State | Current result |
|---|---|
| source | V3 `3.0-preview.1` implemented on `connectorV3` HEAD plus the current exact-environment scenario/test correction |
| automated tests | Gateway 235 and Re 223 passed; Re typecheck/build, docs, CLI, run-identity, exact current-assembly compatibility/binding audit, permission, qualification, Profile and migration checks passed |
| Release build | current Mod `0.6.0-dev`, canonical `out` SHA `3faf7cf2f402cafec0db40ea90a4212aef35c590c093caf6b114b69b7dba2d2b`, MVID `ebbea794-be0a-422d-a2ce-e2b981e664a5` |
| installed | verified equal to current canonical Release SHA/MVID |
| loaded | verified equal to source/build/install SHA/MVID; runtime `0d517090cd3f4a10a2d844e423f01e5f`, exact-bridge-only Modset |
| current authority | read-only Re inspection established exact-runtime encounter provisional trial; mutation is ready but not exercised |
| V3 mutation canary | `.86` exercised combat, pile selection, map, event, rewards, card rewards, adapter-backed shop, generated card play, bundle selection, menu and game-over; current shop-native artifact remains pending |
| V3 bounded journey | one saved Defect run continued floor 27--31 and ended in death; one fresh Ironclad run reached floor 4 and was intentionally stopped |
| V3 durable claim | none |

Current v0.110.1 install rollback:
`STS2MCP/.local/deployments/2026-08-01T10-30-16-282Z`.
Previous v0.110.1 install rollback:
`STS2MCP/.local/deployments/2026-07-31T15-03-48-449Z`.
Previous direct-play artifact rollback:
`STS2MCP/.local/deployments/2026-07-31T14-03-53-749Z`.
Previous current-artifact rollback:
`STS2MCP/.local/deployments/2026-07-31T09-52-39-492Z`.
Previous repaired-install rollback:
`STS2MCP/.local/deployments/2026-07-31T08-50-29-091Z`.
Previous current-runtime rollback:
`STS2MCP/.local/deployments/2026-07-31T06-55-35-150Z`.
Previous loaded-repair rollback:
`STS2MCP/.local/deployments/2026-07-31T04-34-03-246Z`.
Previous v0.110.0 evidence artifact rollback:
`STS2MCP/.local/deployments/2026-07-31T03-37-42-912Z`.
First-V3-install immediate predecessor:
`STS2MCP/.local/deployments/2026-07-31T01-49-06-262Z`.
Final pre-V3 rollback:
`STS2MCP/.local/deployments/2026-07-31T01-45-37-637Z`.

## Immediate Next Step

The game and Gateway are intentionally stopped. The next Live window must
cold-load the installed SHA/MVID, verify runtime and Modset identity, resume
the saved Ironclad A0 run and exercise the shop-inventory native path when it
is organically reachable. Preserve enemy block and statuses in any compact
decision view:

```bash
cd Re-SpireAgent
npm run agent:run
```

For Re-driven operation, the local entry reads the exact Windows game
directory from ignored `Re-SpireAgent/.env.local`, delegates to the real
`connectorV3` checkout and verifies loaded SHA/MVID/runtime before mutation.
The direct-play evidence above does not qualify Re's decision behavior.
