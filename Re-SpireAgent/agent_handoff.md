# RE-P1 Handoff

Status update 2026-07-18: Bridge `2.0-preview.46` is the current source contract
against exact identity `v0.109.0|c12f634d|-840572606` and an
`exact_bridge_only` loaded Modset. Preview.46 adds typed read-only card hover
facts and stable owner-scoped preview identity. Final MVID
`9e6124ca-0082-451a-adb3-54b692a85d33` organically exposed Cursed Pearl,
Greed, Eternal, and Unplayable; eight polls retained one state ID, strict-v2
run-deck Inspection decoded cleanly, and Neow Proceed settled. Preview.45 adds
only exact Headbutt pile selection as a canary. Its first Organic action ended
unknown before an intermediate-state observer fix; the corrected completion
has not naturally repeated, so it is not qualified. Preview.43 first made source-binding failure
uniformly fail closed; a Colorless Potion child stopped as
`unsupported + none_fail_closed` rather than inheriting Lead Paperweight
semantics or crashing the client. Preview.44 then adds exact Colorless Potion
as a second discriminated `generated_card_choice` source. Strict Re run
`run-20260718172631-zcwq84`, decision
`decision-000001-mrqn2a3i-syekxt`, selected Omnislice; Bridge confirmed only
after the source task closed and the exact entity entered combat hand/discard
with the free-this-turn modifier. The successor hand contained that same entity
at cost zero. Lead Paperweight remains separately evidenced by run
`run-20260718164741-suylea`. Both Skip branches, Organic full-hand overflow,
Hefty Tablet, Knowledge Demon, other generators, unknown Mods, and every
unlisted source remain unqualified. Preview.41 adds only a current-build
read-only `combat_piles` canary. Two current-MVID snapshots matched context
draw/discard/exhaust counts at `12/0/0` and `7/4/1`; strict Re projection was
clean and true draw order remained hidden. Every non-Headbutt
`combat_pile_card_selection` origin stays disabled because callers need
purpose-specific Source Binding and Outcome Witnesses. Preview.40 supersedes preview.39's one-sided
wire shape with source-bounded `combat_transition(setup|resolution) +
no_action`. Both phases publish zero actions and cannot fall back to v1.
Fresh discovery run `run-20260718162006-ub1nvb` then exposed a Re-only boundary
bug: `agent:run` stopped before legal game-over actions. Re now finishes the
current run's game-over intro/summary/return lifecycle and stops only at the
resulting top-level menu. Run `run-20260718162449-yvvf7o` confirmed both v2
actions; a menu-only check emitted `stopReason=run_boundary` with exit code 0.
Organic current-MVID evidence captured two setup and two resolution states
around Bridge-owned combat/reward/map journeys. Strict-v2 run
`run-20260718155144-xkdstj` then completed 40/40 Bridge-advertised actions with
no v1 action or command/settlement failure. Preview.38's source-bound Whispering Hollow
random-transform canary remains unchanged; cycling preview cards remain
uncommitted presentation and every other transform origin stays fail closed.
Preview.31's empty-scope rule and all later exact-environment guards remain
intact.

Preview.30 was installed against exact
identity `v0.109.0|c12f634d|-840572606`. Preview.29 added narrow menu-owned
character selection and current-build revealed ancient dialogue. Preview.30
replaced an invalid flat-keyword assumption with typed event-option text/card
tooltips, removed `WasChosen` as false completion evidence, and completed a
fresh Neow dialogue -> option -> exact Talisman/deck post-state -> map journey.
Character select, dialogue, and event option remain canaries, not broad
qualification. Current Canonical truth remains
`../STS2MCP/docs/bridge-v2/CURRENT_STATUS.md`; the chronology below is
historical handoff context.

Previous status: Bridge `2.0-preview.25` was installed against exact identity
`v0.109.0|c12f634d|-840572606`. Capabilities scoped-qualify merchant removal,
event/rest deck upgrade, ordinary combat turn, combat hand selection, and
ordinary single-player rest plus read-only run deck. Event card acquisition,
reward, card reward, map, and treasure are action canaries; every unlisted
contract is
disabled. Current-build organic evidence includes exact removal and upgrade
post-states, Brain Leech exact-card acquisition, one clean
reward/card-reward/map journey, and treasure relic choose plus Proceed-to-map.
Room Full of Cheese two-card acquisition, treasure open/skip, and every unlisted
variant remain
unqualified. RE-P1 remains a protocol baseline, not a verified strategic player
or a claim of broad game coverage. Preview.24 adds a top-level read-only
`shared_state`; Bridge-owned states no longer read v1 for persistent run/player
HUD facts.

The 2026-07-17 architecture reassessment retained semantic Surfaces and added
only non-authoritative bounded-selection fact reuse. It also found that the old
merchant-removal confirm predicate completed on selector close before the exact
async transaction necessarily committed. Bridge source now requires the exact
selected instance to leave the deck, deck/gold deltas, removal-count increment,
and service consumption, while allowing intermediate state IDs. C#/Re tests
cover the contract. Preview.23 current-build qualification remains
purpose-specific and does not create a generic deck selector.

Canonical current Bridge status is maintained in
`../STS2MCP/docs/bridge-v2/CURRENT_STATUS.md`; the chronology below is retained
as handoff history.

## Completed

- Preview.25 requalified ordinary single-player `rest_site` after replacing a
  broad UI-progression completion predicate. Heal now requires exact HP
  post-state, Smith requires the exact upgrade child, unknown enabled options
  fail closed, and Proceed requires map/room transition. Final MVID
  `e9a9e229-82b7-4752-afb7-46b910468f58` repeated Heal 56 -> 80 and Proceed;
  regression run `run-20260717145202-b5ewm2` was 24/24 settled and entirely
  `bridge_advertised`.

- Preview.25 added purpose-specific `event_card_acquisition` for exact audited
  event add-to-run-deck sources. Brain Leech request
  `preview25-brain-leech-offering-20260718-1` completed with the exact selected
  Offering instance in a run deck that increased from 12 to 13 cards. The
  parent event remained legacy-owned and did not merge actions. Room Full of
  Cheese two-card acquisition remains unqualified, so the Surface stays an
  action canary.

- Preview.24 now also qualifies `combat_hand_card_selection` on v0.109. Organic
  run `run-20260717135207-gpeaut` exposed v1 same-name instance/hash ambiguity;
  the final loaded MVID `3966756e-1b28-4995-91d1-1950a84ea6d3` completed an
  opaque Touch of Insanity select/confirm journey and preserved the exact Bash
  entity through its visible cost change from 2 to 0. The Surface remains
  independent from pile/grid/deck selectors.

- Preview.24 introduced `SharedVisibleState + Context + one Active Surface +
  Authority`. The shared-state qualification MVID
  `d2218a22-198a-4c74-bfba-c409e24c84d3` passed menu-null, active-run,
  map/combat composition, and a confirmed Weak Potion post-state. Re consumes
  normalized schema 17, validates shared/combat identities, and reports clean
  `bridge_advertised` authority without a v1 shared-state sidecar. See the
  preview.24 closeout report.

- Preview.23 added purpose-specific `deck_upgrade_selection` for event/rest and
  a separate staged `treasure_room` contract. Event Armaments+ and rest Prep
  Time+ journeys confirmed exact upgrade post-state. Treasure request
  `treasure-choose-1784288012` confirmed exact relic ownership and selection
  closure; `treasure-proceed-1784288168` confirmed map transition. Chest open
  and skip remain canary variants. See the Canonical Bridge closeout report.

- Preview.14 added separate `shop_room` and `shop_inventory` contracts. Organic
  smokes completed open, close/reopen, an Armaments card purchase, a Blood Vial
  relic purchase, a Fire Potion purchase, sold-out post-states, removal-child
  launch, and Proceed to map. A full belt correctly suppresses potion actions
  with `potion_slots_full`. The strict client accepts C#-omitted nullable shop
  product fields but still rejects blocked-offer, capacity, category, and
  binding contradictions.

- Preview.15 adds `deck_removal_selection`: a narrow `shop +
  NDeckCardSelectScreen` child contract with opaque select, preview, confirm,
  and cancel actions. It deliberately excludes Smith, transform, enchant, and
  generic deck selection. Static Bridge/Re tests pass. Preview.18 has now
  exercised one exact v0.109 ordinary merchant lifecycle, but does not turn
  that evidence into a generic selection contract or broader v0.109 authority.

- Preview.13 closed the organic `rest_site -> deck selection -> proceed`
  boundary. `run-20260716182900-50gm7n` selected Smith through a settled
  Bridge action and opened a separate legacy deck selector;
  `run-20260717012922-la5ibg` later settled the exact Bridge Proceed and reached
  `map + map_navigation`.
- The strict Bridge decoder now treats explicit `entity_id` and `*_entity_id`
  fields as visible binding identities. This fixed the valid rest-screen
  Proceed binding while preserving fail-closed rejection for absent IDs.
- Preview.12/13 organic evidence also qualified ancient dialogue revealed-prefix
  advancement, generated-card choice, card bundles, and repeated map travel for
  their observed shapes.

- Independent Node/TypeScript package in `Re-SpireAgent/`
- Strongly typed discriminated `NormalizedCurrentState`
- Fixture-backed normalizers for observed MCP state families
- Deterministic, unscored allowed-action builder
- Verified MCP action serializer
- Single versioned prompt path
- DeepSeek V4 Flash JSON provider with explicit thinking mode and one bounded format retry
- Strict JSON/schema/action-ID validation
- Pre-execution state re-read using a full-RawState hash, plus a separate normalized projection hash for audit
- Post-execution settlement watcher with longer end-turn timeout
- Full local prompt/response/pre/post/decision evidence
- Inspect, dry-run tick, real tick, bounded run, and replay commands
- Offline unit and integration tests, including the REST adapter boundary
- Real MCP `event` decision: valid DeepSeek JSON, allowed ID, stale-state match, accepted MCP action, and settled post-state
- Real post-combat `monster` and `elite` shells recognized as transitions rather than invalid combat states
- Provider evidence redaction preserves output caps and usage counts while still removing credential-bearing fields
- Action-capable CLI commands use a local exclusive lock; settlement requires two matching stable observations
- Normalized-state v2 separates semantic context from the active interaction surface. `hand_select` retains combat facts while exposing a card-selection surface; known contexts with unknown overlays fail closed without losing audit context.
- Bounded real-game windows covered event, combat, rewards, card reward, map, rest, shop, and a boss fight. Clean windows recorded only `valid_json` responses with `finishReason=stop`, settled executions, and no stale execution.
- `agent:run` now finishes the current run's game-over UI but stops at the
  resulting top-level `menu` before the model can continue or start another
  run. This preserves the one-game boundary without making the game-over v2
  contract unreachable.
- Negotiated STS2MCP protocol modes: default `auto`, compatibility-only `v1`, and strict `v2`.
- Strict Bridge v2 capability/context/surface/command decoders, raw evidence preservation, exact build and observation-policy checks, and domain projections for deck enchant, ordinary event options, and immediate combat turns.
- Runtime identity now reports `shared_state + context.kind + surface.kind + actionAuthority`; Bridge contexts replace legacy action-relevant combat facts.
- Bridge-owned states use v2 shared facts and one Bridge executor. Explicitly legacy-owned states may use v1, but exact-build denial cannot silently regain v1 authority.
- v2 command response identity and status/outcome consistency checks. Failed, timed-out, or transport-uncertain commands stop as unknown and are never retried.
- Read-only `agent:inspect` negotiation against the installed game passed at the main menu: Bridge v2 exact identity was visible and `auto` correctly used v1 for the unsupported menu surface without calling DeepSeek or executing an action.
- Organic Bridge v2 ordinary-event lifecycle: `SUNKEN_STATUE` exposed separate
  event context and event-option surface with only advertised opaque actions.
  DeepSeek selected a valid option; exact-state revalidation, Bridge command
  lifecycle, and two-poll settlement passed, with observed HP/gold effects
  matching the chosen visible option. See `STS2MCP/docs/bridge-v2/SMOKE_2026-07-16.md`.
- CLI safety hardening: `--help` and unknown action-command options are parsed
  before runtime creation, so a help typo cannot create a provider call or
  execute a game action.
- Organic Bridge v2 combat lifecycle: a player-phase `combat + combat_turn`
  state exposed exact hand, resource, enemy, intent, and opaque actions. A
  DeepSeek-selected targeted Strike passed state revalidation and command
  confirmation; the post-state showed the card left hand, energy spent, and
  enemy HP reduced. This qualifies the observed targeted-card shape only.
- Historical source `preview.3` implemented the first composition/diagnostics audit:
  centralized overlay-vs-room active-surface ownership, typed diagnostics, and
  a disabled/non-executable inspection contract.
- Ordinary `reward_flow + card_reward_selection` is now exact-source and
  fixture qualified. Visible reward alternatives retain their labels and are
  never collapsed into `can_skip`; unreadable labels suppress all actions.
  A fresh `preview.3` Bridge/Re lifecycle is now passed: DeepSeek selected a
  legal Glam `Barrage`, Bridge completed, and Re settled to outer rewards.
- Source now also has a separate `reward_flow(room_rewards) + reward_claim`
  contract for the outer `NRewardsScreen`: visible ordinary rewards and an
  enabled Proceed/Skip button become opaque Bridge actions. Linked reward sets
  still suppress actions until their distinct choice protocol is audited.
- Fresh installed-game evidence: an opaque `Claim 12 Gold` command completed
  through the full Bridge lifecycle and the observed Gold increased from 104 to
  116. A post-fix opaque `Proceed/Skip` command then completed as confirmed;
  its follow-up Re read projected `map` and exposed no stale reward actions.
  The resolver now gives the game's explicit `NMapScreen.IsOpen` state priority
  over retained reward overlays during room exit. Later model-selected claim,
  card-selection, and Proceed decisions also passed the same boundary.
- Source `preview.4` implements fixed `run_deck` and `combat_piles` read-only
  inspections. Re validates exact state/build/policy identity, re-reads state
  around capture, projects evidence into typed player facts, and never derives
  actions from it. Main-menu unavailability is tolerated only for the explicit
  `inspection_not_available` code; all stale/identity/transport failures stop.
- Organic inspection evidence closed the persistent enchantment gap: after a
  model-selected Glam `Barrage`, the next run-deck read contained eleven cards
  and preserved `GLAM` plus its Replay description on the same card instance.
  In combat, draw=6/discard=0/exhaust=0 matched immediate counts; after playing
  Barrage, discard=1 retained Glam and all counts still matched. Draw order was
  explicitly withheld.
- Organic testing found a stale-identity bug: inspection timestamps changed on
  every read. Re now excludes only `observed_at` from stale hashing while
  retaining inspection ID, state binding, and content. The action was safely
  blocked before the fix and executed normally after it.
- Preview.9 now keeps combat pile, combat hand, generated-card, reward-card,
  and deck-enchant selection as distinct input-owner protocols. Opaque action
  bindings identify only visible entities; clients cannot submit card indices,
  node paths, or game objects.
- Full potion-belt reward handling was corrected from an impossible advertised
  claim to exact `discard_potion_for_reward` actions. A targeted organic-state
  discard then claim completed with exact slot/potion revalidation.
- Two fresh organic preview.9 runs (`run-20260716165340-0v67y4` and
  `run-20260716170107-xu494w`) produced 271 decision records, 194 settled
  actions, and 165 settled Bridge-authorized actions. Four pile selectors
  completed across both runs. No Bridge execution failure, unknown command
  outcome, or unsettled Bridge action occurred.
- The same runs preserved non-empty exhaust inspection evidence and recorded
  23 coherent-snapshot drifts as non-executed ticks. One local treasure action
  went stale during deliberation and was correctly not executed.

## Legacy Assessment

Reused as verified protocol evidence, not copied architecture:

- observed MCP endpoint and raw-state shapes
- verified MCP action names and request field names
- the known shop `proceed` compatibility behavior
- the principle that provider failures and unknown action IDs fail closed

Rewritten for RE-P1:

- normalized state ownership and discriminated state union
- allowed-action generation and opaque action IDs
- prompt contract and strict DeepSeek JSON parser
- state-drift guard, settlement loop, and tick orchestration
- append-only decision evidence and replay reader

Deliberately abandoned:

- the old controller, memory and scoring paths
- CandidateFuture / DeliberationPacket and cognitive-scaffold code
- shadow/additive rollout, command bridge, phase gates, policy proposals, and promotion machinery
- permissive JSON extraction/repair and strategic local fallback

## Deliberate Omissions

No memory, learning, scoring, strategic scaffold, shadow mode, live additive mode, proposal engine, promotion, policy overlay, or legacy fallback exists in RE-P1.

## Known Limits

- Legacy v1 `bundle_select` remains locally unsupported. Bridge v2 now has a
  separate source-qualified Scroll Boxes contract with exact deck post-state;
  that does not generalize v1 bundle payloads.
- Complete deck context is not visible on every MCP state; the normalizer does not fabricate it.
- Shop exit uses one documented, diagnostics-visible inference from verified old live behavior.
- Game updates or MCP serialization changes may introduce unknown states, which stop safely and require fixture-led support.
- A human or unrelated external process can still act in the same game session; the local lock prevents only concurrent RE-P1 processes. State drift remains recorded and blocks stale execution.
- One real combat action was rejected by MCP after a matching pre-execution snapshot reported a playable hand index. The same index also succeeded in other windows, so RE-P1 records this as a low-frequency MCP/UI synchronization risk rather than hard-coding a strategic restriction. Reproduce before changing the action protocol.
- The real Act 1 run ended in a boss defeat. Strategic quality has not been evaluated; current evidence verifies the closed-loop protocol only.
- Existing v1 local JSONL remains readable as historical JSON but must not be treated as a v2 normalized projection without an explicit migration.
- Legacy v1 `NDeckEnchantSelectScreen` evidence showed that a selected standard card can make `can_confirm=true` without exposing selected IDs or remaining capacity. The v1 path still stops conservatively in that state. The new v2 deck-enchant path supplies selected IDs, constraints, stage, semantics, opaque actions, and action-specific completion; do not generalize that evidence to other card-selection surfaces.
- Combat v2 now has repeated long-run evidence, but action counts do not
  qualify every target type, card effect, selector mode, or phase transition.
- Hidden draw order remains excluded by policy. Implemented surface variants
  beyond those organically observed still require their own evidence.
- Treasure choose/Proceed are Bridge v2 canary actions; open/skip remain
  unqualified. Preview.38 owns only the exact Whispering Hollow random
  transform; unsupported root/submenu choices, linked rewards, other transform
  origins, and unlisted maintenance variants still depend on explicit v1 ownership or
  fail closed. Game-over now has a preview.28 canary contract but still needs a
  complete fresh organic lifecycle.
- Preview.37 adds bounded root and single-player submenu canaries. Final-MVID
  Continue is organically exercised; Single Player/Standard/Back remain
  source/fixture-only because the saved-run profile hid that branch.
  First-run tutorial and non-standard modes still fail closed.
- Composite state-plus-inspection drift is fail-closed but noisy during fast
  transitions. Future work may add bounded observable read retry or a coherent
  server observation token; it must never accept mixed adjacent states.
- Selecting a character through v1 changed UI-internal selection without a
  normalized witness and recorded `executed_unsettled`. Treat this as legacy
  menu lifecycle debt, not Bridge v2 failure.

## Preview.40 Validation

- Bridge `84/84`, Re `139/139`, strict typecheck, both production builds, and
  zero-warning Bridge Release passed.
- Release and installed DLL SHA are
  `10d06ac79b63ce2bbbbcdd4c3e391f9c2a6a9fe59a1bf3d0b696d899dfd3b524`.
  Loaded MVID is `ea77dcfb-2ad7-47a9-9e39-d7b3fc1fe015`; runtime is
  `6c95a03082874ac1aa8f590d95c20abc`; Modset fingerprint is
  `a6b92b0dc1c9b156f6ac7896c7c7deae7a73b8a4c87bf4da6be5695818cd9938`.
- Organic semantic-cycle evidence `run-20260718154042-ftcmwf` stopped a
  repeated shop open/close cycle at occurrence two even though transport IDs
  changed. It did not alter Bridge legality, provider decisions, or game state.
- Re settlement now separates a Bridge-confirmed command from readiness of the
  next stable decision checkpoint. A changed transitional state at timeout is
  recorded as `executed_checkpoint_pending` and the next tick re-reads; legacy
  acknowledgement, unchanged state, read errors, and unknown command outcomes
  remain terminal. No action is retried.
- Organic regression run `run-20260718160447-f8yi48` completed 8/8 strict-v2
  combat actions, including end-turn, as ordinary settled decisions. A natural
  long-turn checkpoint-pending sample remains evidence debt.

## Historical Validation

On 2026-07-18, preview.30 passed 126/126 Re tests, 59/59 Bridge tests, strict
typecheck, Re production build, and the exact-source Bridge Release build with
zero warnings/errors. Installed and Release DLL hashes matched; the loaded
runtime reported the expected protocol, module identity, and exact game build.
MVID `f2604133-ed1a-41f3-a638-ab38829d3cb5` completed strict Re inspection and
the fresh Neow event option/Proceed lifecycle with exact relic/deck post-state.
The final installed MVID `bdc97168-3bc7-40c4-8a2e-bb0698169118` only narrows
proceed/new-overlay completion and is source/test/build/install/load verified;
the Neow journey was not falsely reassigned to that final artifact. See the
latest command output rather than treating test counts as permanent.

## Next Step

With Slay the Spire 2 and STS2 MCP running:

```bash
cd Re-SpireAgent
npm run agent:inspect
npm run agent:tick -- --dry-run
npm run agent:tick
npm run agent:replay
```

Start a fresh game manually, then run bounded windows and inspect each run with `npm run agent:replay`. Confirm that each record contains pre/post raw snapshots, the prompt, DeepSeek response, selected allowed action, MCP result, and settled post-state. Fix a repeatable protocol mismatch with a reduced raw fixture and contract test before running longer loops.

Preview.40 is closed as a bounded combat lifecycle correction, not a Surface
or permission expansion. The semantic two-state no-progress cycle is guarded,
and Bridge command completion is now distinct from next-checkpoint readiness.
Do not infer a universal `no overlay => no_action` rule. The still-unexercised Single Player/Standard/Back
branch and a fresh natural game-over lifecycle remain high-value evidence
targets, but neither justifies forcing a synthetic path. Do not infer a
universal menu or card-selection protocol.
Event option/dialogue/character select need diversity before promotion beyond
canary.

Canonical Bridge status and the latest evidence are in
`../STS2MCP/docs/bridge-v2/CURRENT_STATUS.md` and
`../STS2MCP/docs/bridge-v2/PREVIEW_40_COMBAT_TRANSITION_AND_RUNTIME_PROGRESS_GUARD_CLOSEOUT_2026-07-18.md`.
