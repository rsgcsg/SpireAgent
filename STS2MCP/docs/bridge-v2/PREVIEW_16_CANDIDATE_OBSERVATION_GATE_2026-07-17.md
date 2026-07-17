# Preview.16 v0.109 Candidate Observation Gate

Status date: 2026-07-17  
Protocol: `2.0-preview.16`

## Verdict

The installed Steam identity `v0.109.0|c12f634d|-840572606` passed a static
binding review for exactly one narrow surface:

```text
shop + deck_removal_selection
```

That result authorizes an observation gate, not an action gate. Bridge exposes
the player-visible merchant-removal child only with `readiness=observation_only`
and an empty legal-action array. Re-SpireAgent projects it with
`actionAuthority=none` and `stability=unknown`.

## Binding Evidence

The current build's source metadata and a read-only reflection audit confirmed:

- `CardSelectCmd.FromDeckForRemoval` remains the merchant removal command;
- `MerchantCardRemovalEntry` remains the owning service;
- `NDeckCardSelectScreen` retains `_prefs`, `_selectedCards`, preview controls,
  confirmation controls, cancellation controls, and the visible prompt field;
- `NCardHolder._isClickable` remains available for visible-card eligibility.

This verifies type and private-field continuity. It does not verify live scene
ownership, visible wording, click handling, stage transitions, command paths,
or any completion predicate.

## Hard Boundaries

- `action_execution_allowed=false` for the entire v0.109 candidate build.
- `state_observation_allowed=true` only for `deck_removal_selection`.
- Every other surface is advertised as `not_qualified_for_current_build`.
- Commands cannot be registered because the candidate state has no actions.
- Fixed read-only inspection endpoints remain rejected; observation is not
  inspection qualification.
- Re-SpireAgent must not read a v1 sidecar or inspection anywhere in this exact
  candidate build, so unsupported menu/room observations cannot silently
  contaminate later candidate evidence with historical/local data.
- This status is not a generic v0.109 approval and is not a universal deck
  selector abstraction.

## Required Organic Lifecycle Evidence

The next observation must be a normal game journey into a merchant removal
child. Without clicking, verify the exact context/surface pair, prompt, visible
deck cards, selection bounds, preview/cancel/confirm visibility, empty action
list, and candidate diagnostic.

Only after that read is recorded may a separate action-qualification review
consider two independent journeys:

1. select a visible card, reach preview, then cancel and verify the merchant
   child/shop returns without a deck mutation;
2. select a visible card, reach preview, confirm removal, and verify the exact
   removed card plus post-state deck, gold/service, and shop-action facts.

Those journeys require an explicit later build-specific action gate. They are
not enabled by this document, static binding evidence, or historical v0.108
evidence.

## Verification

- Bridge contract tests and Re-SpireAgent candidate-contract tests pass.
- Static reflection was read-only and did not invoke the game.
- After a Steam restart with the preview.16 DLL, the live capabilities endpoint
  reported the exact v0.109 fingerprint, `action_execution_allowed=false`,
  `state_observation_allowed=true`, and only
  `deck_removal_selection=candidate_observation_only`; every other declared
  surface was `not_qualified_for_current_build`.
- The live main-menu state was unsupported with zero legal actions. No command
  or inspection request was made.
- No v0.109 command, inspection request, legacy-sidecar merge, or lifecycle
  execution was used to establish this status.
