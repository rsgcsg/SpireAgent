# Bridge v2 Composition, Inspection, And Diagnostics Audit

> Implementation follow-up: source `2.0-preview.3` now contains the typed
> diagnostics contract, centralized overlay-vs-room `ActiveSurfaceResolver`, a
> disabled/non-executable inspection capability boundary, and a fixture-backed
> `reward_flow + card_reward_selection` slice. Organic card-reward lifecycle
> evidence is still pending; the original three-surface evidence below remains
> historical input rather than proof of the fourth slice.

Status date: 2026-07-16

## Executive Verdict

The three organic slices support the current architectural center:

```text
exact environment identity
  -> one semantic context
  -> one active action-owning surface
  -> explicit action authority
  -> exact-state opaque legal actions
  -> action-specific lifecycle evidence
```

This abstraction is healthy and should be preserved. It is not yet a complete
player-visible semantics protocol. The safety/execution kernel is substantially
more complete than semantic coverage, overlay composition, inspection, and
diagnostic structure.

Before adding another action surface, Bridge v2 should make surface resolution
explicit and add typed diagnostics without changing existing behavior. The
next independently qualified surface should then be ordinary card reward
selection, modeled as a reward-flow context plus one active
`card_reward_selection` overlay. Read-only deck/pile inspection should be a
separate capability, not fields added to every surface and not a fake action.

## Evidence Base

This audit uses, in descending authority:

1. organic `v0.108.0|58694f64|-2044609792` Bridge/Re lifecycles for deck
   enchant, ordinary event option, and one targeted combat card;
2. current exact-build C# compilation and tests;
3. current game assembly types and resource names;
4. existing v1 bindings as compatibility evidence, not as a v2 contract;
5. the two supplied architecture task documents as hypotheses.

The current game entities verified by source, build, assembly, or runtime
include:

- semantic context: `EventRoom`, `CombatRoom`, `CombatManager`, `CombatState`,
  `PlayerCombatState`, `Player`, `Creature`, `CardModel`, `PowerModel`,
  `PotionModel`, and orb models;
- room/UI nodes: `NEventRoom`, `NCombatRoom`, `NPlayerHand`, `NEventLayout`,
  `NEventOptionButton`, and `NEndTurnButton`;
- overlay routing: `NOverlayStack`;
- selection overlays: `NDeckEnchantSelectScreen`,
  `NCardGridSelectionScreen`, `NChooseACardSelectionScreen`, and
  `NCardRewardSelectionScreen`;
- reward continuation: `NRewardsScreen`, `NRewardButton`, `NCardHolder`, and
  `NCardRewardAlternativeButton`;
- normal inspection UI: `NDeckViewScreen`, combat draw/discard/exhaust pile
  buttons, and card-grid/view components.

No class name alone is treated as player-visible evidence. Visibility still
requires a UI/model binding and the observation policy.

## Three-Surface Findings

### Deck Enchant

Deck enchant proved that an overlay has its own multi-stage protocol while the
underlying event or combat meaning remains relevant. Per-card identity,
selection constraints, preview stage, and dedicated completion cannot be
collapsed into one `can_confirm` flag.

### Event Option

The ordinary event smoke proved that narrative meaning belongs in context and
the options belong in the active surface. The event body remained meaningful
after the option set was replaced by `Proceed`. A new event ID does not require
a new protocol if it uses the same verified option interaction.

### Combat Turn

Combat proved that player, enemy, intent, hand, resource, status, relic,
potion, and orb facts are context/common semantics. `combat_turn.surface`
should remain small and protocol-focused. The targeted-card smoke also proved
that action labels are not execution payloads and that completion must observe
the card leaving hand or a required subsurface opening.

## Composition Contract

### Decision

Bridge state exposes exactly one active action-owning surface.

- Context survives an overlay change.
- The topmost verified blocking interaction owns the legal action set.
- An underlying or suspended surface never contributes executable actions.
- Returning from an overlay is represented by a new observation whose active
  surface changes; it is not a nested executable surface stack.
- Multiple action-owning matches remain a fail-closed invariant violation.
- Visual-only overlays, tooltips, and inspection viewers do not automatically
  become strategic surfaces.

Examples:

```text
event context + event_option
event context + deck_enchant_selection
combat context + combat_turn
combat context + combat_card_selection (future)
reward_flow context + reward_claim (future)
reward_flow context + card_reward_selection (next)
```

### Required Refactor Before The Fourth Surface

The current provider registry asks every provider to inspect global state.
Each provider independently repeats overlay guards. This is safe for three
providers but will turn precedence into distributed convention as coverage
grows.

Introduce a small, behavior-preserving `ActiveSurfaceResolver`:

1. capture `NOverlayStack.Peek()` and recognized room/phase facts once;
2. classify whether a verified blocking overlay is present;
3. route to exactly one provider family: overlay first, then room/turn;
4. preserve ambiguous-match rejection as an assertion and diagnostic;
5. keep legal-action construction and execution revalidation inside the
   selected provider.

Do not add recursive surface DTOs, auto-discovery, reflection-based provider
registration, or a universal UI tree.

### Known No-Surface State

A recognized context with no current blocking decision should eventually use a
typed `none`/`transition` surface rather than `unsupported`. `unsupported`
means the bridge lacks a verified contract; it should not also mean a known
enemy animation, room transition, or temporarily absent interaction.

## Read-Only Inspection Contract

### Runtime Evidence

During the organic combat smoke, v2 reported draw/discard/exhaust counts
`5/1/0`. The current v1 player-visible projection reported the same counts plus
the inspectable card multisets. Its draw pile was deliberately sorted for UI
presentation, so no draw order was exposed.

This validates the distinction:

- immediate state: compact counts needed every decision;
- inspection result: player-inspectable contents requested when strategically
  relevant;
- hidden state: draw order, RNG, unrevealed outcomes, and future information.

### Proposed Boundary

Inspection is read-only evidence, not `legal_actions` and not command
lifecycle state.

A future state response may advertise state-bound inspection capabilities:

```text
inspection_id
observed_state_id
kind
subject/zone reference
visibility_class
ordering_semantics
label
```

A separate read endpoint accepts only an advertised `inspection_id` and the
exact observed state. Its result records:

```text
inspection_result_id
observed_state_id
captured_at
kind
visibility_class
ordering_semantics
entities/facts
completeness
diagnostics
```

Rules:

- inspection never mutates game state and never enters the command ledger;
- clients cannot submit arbitrary zone names, object IDs, or reflection paths;
- stale inspection requests fail without returning a mixed-state result;
- draw pile contents are an unordered/player-sorted multiset;
- draw order, RNG, hidden rewards, and undisclosed outcomes are never returned;
- if the physical viewer is already open and blocks progress, closing that UI
  may be an interaction action, but the viewed facts still belong to the
  inspection result;
- inspection evidence must be recordable separately from the immediate
  decision snapshot.

The first useful inspection capabilities are combat draw/discard/exhaust
contents and the run deck outside combat. Post-close deck-enchant verification
can then use the same run-deck inspection rather than a special enchant API.

### Identity Consequence

Inspection introduces pressure to distinguish an observation identity from an
executable action-state identity. Do not split them preemptively in
`preview.2`. When inspection is implemented, the design must prove whether one
state ID still protects both semantics and actions or whether
`observation_id + action_state_id` is necessary. Either choice must preserve
the Re-SpireAgent full-snapshot stale guard.

## Structured Diagnostics Contract

### Current Problem

Bridge currently combines:

- `readiness`;
- prose `player_visible_semantics` and `legal_actions` statuses;
- string `missing` paths;
- free-text warnings.

This is readable but not safely aggregatable. Re-SpireAgent currently marks the
v2 combat state degraded because of a non-action shared v1 sidecar and a pile
inspection warning even though Bridge action authority is complete. That is an
example of why warning presence cannot equal execution unsafety.

### Required Shape

Add typed diagnostics while retaining preview compatibility:

```text
code: stable namespaced string
severity: info | warning | error
category: identity | compatibility | context | surface | visibility |
          completeness | action | completion | runtime
path: optional schema path
visibility_class: optional on_screen | normal_inspection | count_only | hidden
effect: none | field_omitted | actions_suppressed | surface_unsupported |
        outcome_unknown
recoverability: settle | change_surface | restart | update_bridge | unknown
safe_detail: optional bounded text
```

Diagnostic codes are extensible strings, not one closed global enum. Severity
alone does not grant or remove action authority. `effect` and explicit
readiness/completeness rules control fail-closed behavior.

Missing fields should become typed records with `required_for_action` and a
reason code. A missing action-critical fact suppresses all actions. A deferred
normal-inspection fact may produce a warning without suppressing otherwise
complete immediate actions.

Re-SpireAgent should preserve unknown diagnostic codes for audit, reject
malformed effects, and never infer action permission from a warning-free
response.

## Next Surface Decision

The next surface should be ordinary `card_reward_selection`, not a generic card
selector and not a broad rewards implementation.

Reasons:

- it is frequent and strategically important;
- its exact game UI entities are already known on the current build;
- it tests overlay composition and return-to-underlying-flow behavior;
- it reuses `VisibleCard` without creating a universal entity store;
- it has a bounded, independently smokeable lifecycle;
- it exposes an important v1 modeling error: an
  `NCardRewardAlternativeButton` is not semantically guaranteed to mean
  "skip".

Required model:

```text
context.kind = reward_flow
surface.kind = card_reward_selection
surface.cards = visible per-instance cards
surface.alternatives = each visible enabled alternative with its own text
legal_actions = opaque select-card or choose-alternative IDs
```

The provider must not expose one `can_skip` boolean or assume the first
alternative button is skip. It must preserve the visible alternative meaning.
Completion must prove that the exact card-reward overlay closed or transitioned
and, where the game model exposes it safely, that the selected effect was
applied. HTTP success or a signal emission is not completion.

## Reference-Audit Disposition

| Reference concern | Disposition after three surfaces |
|---|---|
| typed context and surface | resolved and organically exercised |
| `context.kind` as whole state | rejected; context + surface + authority required |
| generic entity table | deferred; typed nested entities remain clearer |
| provider registry | useful, but routing precedence must now be centralized |
| nested executable surface stack | rejected for now; one active owner only |
| read-only inspection | accepted as a separate capability, not yet implemented |
| pile contents in every combat state | rejected; counts immediate, contents inspectable |
| structured diagnostics | required before broad coverage |
| observation/action identity split | deferred until inspection implementation evidence |
| automatic provider discovery | rejected |
| complete player-visible coverage as one milestone | rejected; qualify vertical slices |

## Architecture Health And Completeness

Qualitative assessment:

| Area | Health | Approximate completeness |
|---|---|---|
| exact identity and fail-closed execution | strong | 85-90% for singleplayer preview core |
| state-bound actions and lifecycle | strong | 80-90% for implemented actions |
| context/surface/authority abstraction | healthy | 75-85% |
| overlay composition | directionally correct, implicit routing debt | 50-60% |
| structured diagnostics | weak but contained | 20-30% |
| read-only inspection | evidence and design only | 10-20% |
| major singleplayer player-visible surface coverage | intentionally narrow | 20-30% |
| multiplayer/mod-generic coverage | intentionally absent | 0-10% |

The project is engineering-healthy because unknowns fail closed, tests are
layered, organic evidence is not confused with fixtures, and the client keeps
independent validation. It is incomplete because coverage is narrow and two
cross-cutting contracts are still prose/implicit. The next risk is not code
size; it is allowing provider-local overlay rules and warning strings to become
de facto protocol.

## Ordered Next Work

1. Add typed diagnostics alongside legacy warnings; no behavior change.
2. Extract the behavior-preserving active-surface resolver; no new surface.
3. Specify and contract-test read-only inspection capabilities; keep them
   disabled until current-build bindings are audited.
4. Implement `reward_flow + card_reward_selection` with opaque alternatives.
5. Run fixture, strict Re projection, and one bounded organic lifecycle smoke.
6. Reassess whether combat card selection or run-deck inspection is the next
   higher-value slice.
