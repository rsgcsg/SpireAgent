# Connector V3 Integration

Connector V3 is Re-SpireAgent's only live execution protocol. Re consumes a
current observation, projects the Gateway's bounded parameterized candidates
to local opaque choices, submits the selected command and supervises its
receipt plus successor observation.

## Ownership

The Gateway owns player-visible facts, the active input owner, command
legality, execute-time revalidation, native Commit and action-local Outcome.
Re owns strict decoding, consumer projection, model selection, request
submission, polling, successor stability and append-only local evidence.

Re never:

- looks up or executes a Bridge v2 action ID;
- adds an operand that the current V3 candidate did not advertise;
- retries an `unknown` mutation;
- derives authority from UI shape, fixtures or historical evidence;
- treats Inspection or diagnostics as mutation permission.

## Current Cutover

Direct combat commands (`play_card`, `use_potion`, `end_turn`), shop-room,
map, rest-site, event-option, treasure-room, outer reward, card-reward and
deck-enchant controls resolve
current native objects from V3 entity/control IDs and call native legality and
Commit paths. Event, treasure, outer reward and card-reward candidate discovery
is derived from typed visible control/stage facts rather than `draft.Actions`;
their execution does not call Provider action closures. Menu/run-setup and
source-discriminated generated-card choices now follow the same V3-native
boundary while retaining separate source-specific legality and Outcome.
Combat-hand selection now publishes exact current hand/card/control facts,
uses a direct native resolver and is consumed directly by Re. Smith deck
upgrade and merchant deck removal also use direct typed facts and commands;
merchant authority is not reused for relic/reward removal.
Luminous Choir event removal uses its own exact task/event/two-card contract,
whole-transaction Outcome and direct Re Surface. It shares selector mechanics
but not merchant, relic or reward authority.
Remaining selectors temporarily reuse mature Provider-native bindings inside
the Gateway. This is bounded migration debt, not a V2 REST fallback.

Ordinary combat, generated-card choice, menu/run-setup, event, map, game-over,
reward/card-reward, shop, rest, treasure, lifecycle-settling and
visible-unsupported observations use the direct V3 normalizer and do not
request Bridge v2 capabilities. Menu, event, map, game-over,
reward/card-reward, shop, rest, treasure, combat and generated choice are
exact-runtime exercised under earlier artifacts. Preview.5 exercised direct
Smith, known-room settling, visible unsupported, `run_deck` Inspection and
linked detail. Merchant removal and combat-hand remain unexercised; Preview.6
Luminous Choir removal is implemented/tested but still lacks exact-runtime
exercise. Build/install/load status is per-machine and must be read with the
root Connector CLI. Remaining
selector families temporarily read same-runtime
Bridge v2 capabilities only as a
non-executable semantic/environment projection sidecar. No v2 legal action or
v2 command route enters the V3 execution path. The remaining sidecar is removed
as direct V3 fact contracts reach equivalent decision-relevant coverage.

Known lifecycle settling is not an unsupported Surface. Re receives a typed
`no_action`, performs no model call or mutation, and continues only until the
Gateway publishes a fresh ready interaction or the bounded repeated-state
guard stops. A genuinely unknown owner remains visible unsupported and
terminal.

The operator preflight waits through only the explicit
`no_active_run_context` startup sentinel. It does not wait away a legitimate
visible unsupported owner. On-demand `run_deck`, `combat_piles` and
`shop_catalog` Inspection uses `/api/v3/inspections/...` and the exact current
state token; its strict decoder rejects token drift and it never enters command
submission.

Current-Surface card detail uses `/api/v3/linked-details/{entity_id}` with the
same exact-token discipline. Re cannot use it to add a candidate or operand.

For `event_deck_removal_selection`, Re accepts only the exact Luminous Choir
source/purpose/effect tuple and exact command set implied by current selected
membership and stage. Unknown source literals, missing selected bindings or a
candidate-set mismatch invalidate the state and produce no local action.

## Receipt Rules

- `completed`: the Gateway observed the command-specific Outcome.
- `not_executed`: validation rejected before native Commit.
- `pending`: poll the same request ID.
- `unknown`: application may have occurred; terminate and never resubmit.

After `completed`, Re obtains a fresh observation and waits for a stable next
decision checkpoint. This supervision does not reinterpret the Gateway
Outcome.

## Local Validation

```bash
npm run check
npm run agent:inspect
```

`agent:inspect` is read-only. A real run requires a cold-loaded V3 Gateway:

```bash
npm run agent:run
```

Source, fixture, build, install, load, session trial and runtime journey are
separate evidence levels.
