# Upstream And Design Audit

## Executive Verdict

The attached Bridge v2 proposal is directionally strong: game semantics,
surfaces, legal actions, identity, execution revalidation, and command outcomes
must be separate. The bridge must remain an adapter rather than a strategic
brain. Those principles are adopted.

The proposal is too broad as a first implementation, however. Treating complete
player-visible coverage, all legal actions, all completion contracts, and the
SpireAgent migration as one P0 would create a big-bang rewrite that cannot be
validated against an evolving Early Access game. This fork uses audited vertical
slices instead.

## Facts That Changed The Design

### The current game is newer than the upstream test claim

Upstream README says it was tested against `v0.103.2`. The installed game and
log report `v0.108.0`, and the mod manifest did not declare a minimum game
version. The clean upstream source has 11 compile errors against the current
assembly. Bridge v2 therefore reports exact build identity and disables actions
outside an exact tested binding. The first binding requires version `v0.108.0`,
commit `58694f64`, and main assembly hash `-2044609792` together.

### Deck enchant selection is a two-stage game state

Current `NDeckEnchantSelectScreen` has distinct state and controls for:

```text
selecting cards
  -> EnchantSinglePreviewContainer or EnchantMultiPreviewContainer
  -> preview confirm or preview cancel
  -> screen completion
```

The screen stores `_prefs`, `_selectedCards`, `_enchantment`, and
`_enchantmentAmount`. It renders a localized enchantment title and dynamic
description. The game's own `DeckEnchantScreenHandler` waits for the dedicated
enchant preview and then clicks the confirm button inside that preview.

Upstream v1 instead searched upgrade/generic preview containers and finally any
enabled confirm button. This collapses two different stages and explains why it
could return `ok` without advancing the enchant flow.

### HTTP success is not game completion

Most v1 actions return immediately after `ForceClick()` or signal emission.
Bridge v2 returns `started`, then polls an action-specific completion predicate.
An unrelated state change does not count as success.

### Browser CORS was over-permissive

The upstream server bound to loopback but returned `Access-Control-Allow-Origin:
*`. A hostile website could still attempt browser requests to localhost. This
fork accepts non-browser local clients and loopback browser origins only.

## Proposal Decisions

| Proposal idea | Decision | Reason |
|---|---|---|
| Bridge is not the strategic brain | Adopt | Required for Re-SpireAgent ownership |
| Player-visible semantics, surface, action are separate | Adopt | Prevents UI flags from masquerading as facts/actions |
| Opaque state-bound legal actions | Adopt | Removes stale index/target authority from clients |
| Shared action listing and execution validator | Adopt | Prevents advertised-but-self-rejected actions |
| Idempotent command lifecycle | Adopt | Required for safe retries |
| Polling first, SSE/WebSocket optional | Adopt | Smallest honest lifecycle |
| Universal entity table | Optional | Nested surface DTOs are clearer for the first slice; identity remains explicit |
| Complete all player-visible facts as one P0 | Revise | Coverage must be per surface and per exact game version |
| Combat as the first vertical slice | Revise | The live defect and exact game evidence were deck enchant selection |
| Command tracker only after broad surfaces | Reject ordering | Lifecycle correctness is needed before the first mutation |
| Multiplayer in early v2 | Defer | Different authority/visibility/synchronization semantics |
| Inspection surfaces immediately | Defer | Must first verify their actual UI lifecycle and visibility contract |
| Simultaneous Re-SpireAgent rewrite | Defer | Bridge contract must stabilize first; dual adapter is safer |

## Reused, Rewritten, And Abandoned

Reused:

- mod initialization and localhost listener;
- Godot main-thread dispatch;
- verified scene-tree traversal helpers;
- localized card/model display helpers;
- v1 endpoints during migration;
- Python FastMCP process as a thin transport.

Rewritten for v2:

- game/version capabilities;
- semantic state identity;
- entity identity;
- legal-action registration;
- action submission contract;
- command lifecycle and completion evidence;
- deck enchant state/action handling;
- browser Origin policy.

Explicitly abandoned for v2:

- client-supplied card indices and targets;
- `can_confirm` without stage/control identity;
- "find any enabled confirm" fallbacks;
- HTTP `ok` as proof of completion;
- silent best-effort continuation after unknown reflection bindings;
- broad claims based on scene-tree availability alone.

## Architecture/Game-Fact Conflicts Still Open

- Some player-visible UI facts have only private fields or rendered text access.
  Reflection can support them only as exact-version bindings, not stable API.
- A generic `state_changed` predicate is insufficient for many actions. Every
  new surface needs a semantic completion contract.
- Current v1 reads and actions remain much broader than v2 and retain index
  hazards. Compatibility is not endorsement.
- The v1 state builder is monolithic. It should not be the base class for v2;
  migrate one provider at a time.
- HTTP worker threads currently block waiting for a main-thread queue result.
  The game main thread never waits on network, so correctness is acceptable for
  this phase, but bounded request cancellation/backpressure remains debt.

## Information The Bridge Cannot Safely Promise

The bridge must not expose:

- hidden draw-pile ordering or RNG state;
- undisclosed event outcomes;
- future rewards, rooms, or enemy moves not available through normal UI;
- another player's private multiplayer information;
- internal flags with no verified player-visible meaning.

The bridge also cannot promise complete coverage for:

- newly added Early Access screens before an adapter audit;
- arbitrary gameplay mods or custom overlays;
- UI semantics reachable only through a normal inspection interaction that has
  not yet been implemented;
- private-field bindings after a game update until revalidated.

In each case it must omit the field, mark completeness, and remove actions.
