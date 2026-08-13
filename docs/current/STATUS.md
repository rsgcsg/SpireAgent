# Current Status: Player Environment C

Baseline date: 2026-08-13

Branch: `human_equivalent_connector`

Current source protocol: `1.0-rc.2`

## Verdict

Player Environment is the only current connector contract. Bridge v2,
Connector V3 and the transitional HE route are absent from dispatch; Re has no
fallback decoder or executor. The source is a C1 semantic freeze candidate
being extracted to the standalone `rsgcsg/STS2-Connector` repository. It is
not yet frozen.

## Current Ownership

- `LiveHost` extracts fair-player facts and resolves the one current UI owner.
- `NativeUi` keeps native objects private, derives exact bindings from current
  UI mechanics, revalidates them at execution and invokes STS2 callbacks.
- identity records runtime, artifact, game and Modset; it grants no action.
- mutation control owns the single-writer lease and request idempotency.
- `PlayerEnvironment` owns Snapshot, Read, finite BoundAction projection,
  stale rejection, delivery Receipt and successor capture.
- REST and optional MCP are transport only.
- Re imports opaque `bound_action_id` values and never reconstructs legality.

The permission/qualification/operation-manifest graph, SourceContract gates,
legacy route dispatch, settings acceleration patch and Harmony dependency are
absent from current production source.

## Information Closure

C1 covers stable and inspectable player information:

- persistent run/player summary and complete current structured interaction;
- visible referents plus directly observed enabled/selected state;
- player-visible card, relic, potion, event-option, power, orb and intent
  descriptions, keywords and previews. Exact `v0.110.1/db5d3552` assembly
  audit found only `HoverTip` and `CardHoverTip` implementations, and both are
  projected; the test fails if a later exact assembly adds another subtype;
- state-bound `run_deck`, `combat_piles`, `shop_catalog` and
  `surface_card` reads;
- optional, non-authorizing `native_pages.v1` open/read/return evidence.

Unsupported product controls such as Profile and Patch Notes remain visible
facts but are outside the ordinary single-player action envelope. Current
keyboard/controller focus and arbitrary generic scroll traversal remain
explicit partial/unsupported scope. Unknown future tooltip subtypes fail closed
rather than disappearing. Transient VFX/SFX, floating
text and highlight history are deferred to C1.x.

## Live Evidence Boundary

The exact loaded predecessor for this source-seal pass is:

```text
source          8b633cffc0e40d77ad5d44bb7d2ca04490cf2c44
protocol        1.0-rc.1
artifact SHA    74c1f53c45341aae01a5a2421e29ec0bfa832f5e5ced30fa615949322644390f
MVID            0a7e5b7f-a07b-441b-975e-640f526e1de5
runtime         e11215f55bc340ef9a57b3b63b39ffc0
game            v0.110.1 / db5d3552
Modset          806ab38e6334e9866ded3474787fc63ba2c4d2be25dd4b0f3ea5e3670c7feb8b
```

`run-20260812150244-h6fbo1` reached `completed_run_boundary`
after 289 decisions: 246 executed-and-settled, nine delivered transitions that
remained settling beyond Re's three-second checkpoint window, 20 safe stale
refusals and 14 non-actionable polls. Every stale refusal changed snapshot
semantics and the selected binding was no longer published. There were no
unknown deliveries, malformed provider responses or C unsupported stops.
Provenance is `unrecorded`, so this is diagnostic Live coverage rather than
durable qualification.

That run exposed six completed-event handoff frames and one treasure screen
handoff frame incorrectly labelled `visible_unsupported`. Current source now
classifies those exact no-owner transitions as `settling`, removes the
unrelated Instant Mode/Harmony patch and removes retired route dispatch. Host
tests pass `87/87`. These changes are source/test evidence only and will
receive a new source and artifact identity after extraction.

## Deployment Rule

Build and deploy while STS2 is closed, then cold-start and run
`npm run verify:loaded`. Matching source, Release output and installed bytes
does not prove that a process loaded that DLL. Pre-split Live evidence never
qualifies the standalone artifact.
