# Preview.17 Merchant Removal Action Canary

Status date: 2026-07-17  
Protocol: `2.0-preview.17`

## Authorization

Preview.16 obtained a natural, exact-identity observation of the merchant
removal child on `v0.109.0|c12f634d|-840572606`: it was `shop +
deck_removal_selection`, displayed `Choose a card to Remove.`, had a visible
ten-card grid, `min_select=max_select=1`, was cancelable, and published zero
actions by design.

Preview.17 permits a temporary action canary only for that exact build and
surface. The Bridge snapshot builder filters every other provider before action
registration. Inspection remains disabled, and Re-SpireAgent skips the v1
sidecar for the entire candidate build.

## Scope And Stop Conditions

- Authorized context/surface: `shop + deck_removal_selection` only.
- Authorized game identity: `v0.109.0|c12f634d|-840572606` only.
- No other surface can publish an action in this build.
- No fixed inspection may execute in this build.
- No model-driven run is permitted for the canary; use an explicit opaque
  action selected from the current state only.
- Stop and return to preview.16 observation-only behavior on command rejection,
  timeout, failed completion witness, unexpected state transition, missing
  prompt/card/selection facts, cross-surface action, or any legacy-sidecar read.

## Evidence Sequence

1. Current journey: submit only `cancel_deck_removal_selection`, then verify
   selector closure and absence of stale child-surface actions. On 2026-07-17,
   request `preview17-cancel-1784269191` completed as `confirmed` from
   `state_f4a96735c0_2`; its settled successor was unsupported shop context
   `state_f4a96735c0_3` with zero legal actions. This proves only the bounded
   cancel lifecycle. It does not claim an unobserved deck or merchant-service
   post-state.
2. Before a destructive confirmation, independently revalidate a v0.109
   player-visible deck post-state observer. The current fixed `run_deck`
   inspection is disabled for this candidate identity, and the merchant
   service cannot be assumed to reopen after a successful removal. Do not use
   a successful command outcome as a substitute for exact post-state evidence.
3. Only after that observer is exact-qualified, run a fresh merchant journey:
   select one visible card, preview, then confirm. Verify the exact selected
   instance disappears from the player-visible deck and the merchant post-state
   cannot expose stale removal actions.
4. Review the settled records independently. Passing them does not approve
   upgrade, transform, enchant, generic deck selection, inspection, or any
   other v0.109 surface.

## Rollback

Rollback is fail-closed: rebuild the same code with the v0.109 branch set to
`observation_only_candidate`, where the legal-action array is suppressed and
only the previously validated read path remains. No stable game or agent state
is written by this rollout.
