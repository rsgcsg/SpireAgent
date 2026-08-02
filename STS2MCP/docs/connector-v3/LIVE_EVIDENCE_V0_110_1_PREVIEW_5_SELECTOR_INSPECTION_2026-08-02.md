# Connector V3 Preview.5 Selector And Inspection Live Evidence

Date: 2026-08-02

Evidence class: reviewed interactive Codex direct-V3 session. This record is
exact-runtime coverage, not Organic qualification, durable qualification or a
complete journey. Raw snapshots remain local and are not committed.

## Exact Loaded Identity

- repository baseline: `connectorV3@a53159b40e3a15d155fc263d6162fc29327d0d16`;
- protocol: `3.0-preview.5`;
- Gateway SHA-256:
  `b6c28dc5db538ff411c7385519998c85771f5ad3b434d0e8ef31383baf5dbce3`;
- Module MVID: `c98dd735-460a-4970-9606-fb6d2ec6a609`;
- runtime instance: `7967ab4cb09a46cfaf013f2519ad3b8d`;
- game: `v0.110.1`, commit `db5d3552`, main assembly hash
  `-959015736`;
- Modset: `exact_bridge_only`; the Gateway was the only loaded Mod and
  DamageMeter was disabled;
- authority: `provisional_trial_scoped`; persistent qualification ledger
  empty.

The earlier Preview.5 cutover record retains the identity of the artifact
built in that historical session. The artifact actually loaded here was a
later Release rebuild with the same source protocol and a different SHA/MVID.
Evidence belongs only to the loaded tuple above.

## Verified Live Behavior

- A direct ordinary combat command completed with a confirmed receipt and
  stable successor.
- Smith deck upgrade exercised select, automatic preview, preview return,
  whole-selector cancel, re-entry, reselect and confirm. The same exact deck
  entity `card_127990c8_22` changed to upgraded `POMMEL_STRIKE`; the result was
  not inferred from page closure.
- A current-token `run_deck` Inspection and current-token `surface_card`
  linked detail both returned successfully. After the state changed, both old
  tokens were rejected with HTTP 409 `stale_state`.
- Known room lifecycle was observed as settling without commands. A transient
  unknown owner was separately exposed as visible unsupported, followed by a
  stable event owner. These states were not conflated.
- Every submitted request used one request ID, was polled rather than
  resubmitted, and retained `retry.allowed=false`. No unknown Outcome occurred.

The last completed request was
`codex-8ec8f02e-43aa-44a0-b070-2577ee83ef48`. It selected the Luminous Choir
option under state `state_0c2383876e_b3` and completed with successor
`state_0c2383876e_b4`. The successor exposed
`NDeckCardSelectScreen` as `unsupported` with no candidates. Mutation stopped
there, as required.

## Defects And Non-Claims

- The Luminous Choir `ReachIntoTheFlesh` two-card removal transaction was the
  first Organic journey blocker. Preview.5 correctly failed closed but did
  not provide the normal player's selector actions.
- Explosive Ampoule was visible in combat with `can_use=true`, but no potion
  command was advertised. This is a separate missing-operation defect; no
  fallback was used.
- Merchant deck removal and combat-hand select/deselect/reselect were not
  reached in this session. Their automated coverage is not Live evidence.
- Only `run_deck` Inspection was exercised; `combat_piles` and `shop_catalog`
  were not.
- Read-only state-token stability was observed, but this session did not
  independently enumerate the internal command ledger. It therefore does not
  claim a ledger-level proof beyond source/tests.
- No action, Surface or origin became qualified. Encounter canary admission is
  volatile runtime authority only.

## Stop Boundary

The game was normally closed while the Luminous Choir selector remained
visible and non-authorizing. A read-only final snapshot recorded protocol,
loaded identity, state token `state_0c2383876e_b4`, interaction ID
`interaction_076818343c249de277b9`, unsupported owner and empty command set.

