# RE-P1 Handoff

Status: one real Act 1 v1 run has been exercised through boss defeat. Exact-build
Bridge v2 has bounded organic evidence for five executable surfaces plus
read-only run-deck and combat-pile inspection. RE-P1 remains a protocol
baseline, not a verified strategic player or a claim of broad game coverage.

## Completed

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
- `agent:run` now stops at `game_over` or a top-level `menu` before the model can choose a restart; this was added after a real boss defeat showed that an unconstrained loop could otherwise cross the one-game boundary.
- Negotiated STS2MCP protocol modes: default `auto`, compatibility-only `v1`, and strict `v2`.
- Strict Bridge v2 capability/context/surface/command decoders, raw evidence preservation, exact build and observation-policy checks, and domain projections for deck enchant, ordinary event options, and immediate combat turns.
- Runtime identity now reports `context.kind + surface.kind + actionAuthority`; Bridge contexts replace legacy action-relevant combat facts.
- Dual-read/single-executor behavior: v1 sidecar context cannot add actions to a v2-owned surface; exact-build denial cannot silently regain v1 authority.
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

- `bundle_select` has old-project examples but no verified organic raw fixture in the inspected run evidence, so it remains unsupported.
- Complete deck context is not visible on every MCP state; the normalizer does not fabricate it.
- Shop exit uses one documented, diagnostics-visible inference from verified old live behavior.
- Game updates or MCP serialization changes may introduce unknown states, which stop safely and require fixture-led support.
- A human or unrelated external process can still act in the same game session; the local lock prevents only concurrent RE-P1 processes. State drift remains recorded and blocks stale execution.
- One real combat action was rejected by MCP after a matching pre-execution snapshot reported a playable hand index. The same index also succeeded in other windows, so RE-P1 records this as a low-frequency MCP/UI synchronization risk rather than hard-coding a strategic restriction. Reproduce before changing the action protocol.
- The real Act 1 run ended in a boss defeat. Strategic quality has not been evaluated; current evidence verifies the closed-loop protocol only.
- Existing v1 local JSONL remains readable as historical JSON but must not be treated as a v2 normalized projection without an explicit migration.
- Legacy v1 `NDeckEnchantSelectScreen` evidence showed that a selected standard card can make `can_confirm=true` without exposing selected IDs or remaining capacity. The v1 path still stops conservatively in that state. The new v2 deck-enchant path supplies selected IDs, constraints, stage, semantics, opaque actions, and action-specific completion; do not generalize that evidence to other card-selection surfaces.
- Combat v2 has one targeted-card lifecycle smoke. Do not treat it as evidence
  for potion, end-turn, self/friendly/multi-target cards, card-selection
  overlays, or all phase-transition completion behavior.
- Non-empty exhaust and unusual generated/transformed cards remain inspection
  diversity gaps. Hidden draw order remains excluded by policy.

## Validation

On 2026-07-16, the `preview.4` inspection pass completed with 78 Re tests,
29 Bridge tests, strict typecheck, production build, Python MCP syntax check,
and exact-build organic deck/pile smoke. See the latest command output rather
than treating historical counts as a permanent invariant.

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

If a natural non-empty exhaust or generated/transformed card state appears,
capture it as bounded inspection diversity evidence. Keep linked reward sets
and every unlisted executable surface unsupported until exact-build bindings,
state-bound actions, completion evidence, and contract tests exist.
