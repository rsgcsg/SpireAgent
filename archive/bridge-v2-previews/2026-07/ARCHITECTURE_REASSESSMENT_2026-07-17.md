# Bridge v2 Architecture Reassessment

Status date: 2026-07-17

## Executive Verdict

The bounded semantic-Surface model is the correct architectural center and
should not be substantially redesigned. The evidence supports a constrained
composition model: semantic Context, exactly one semantic Active Surface,
small internal shared mechanics, opaque purpose-specific actions, independent
Inspection, and direct semantic completion witnesses.

The supplied architecture analysis correctly identified the pressure for
shared mechanics and stronger completion, but its suggested wire-level
mechanics/transition expansion is premature. Current evidence does not justify
a generic mechanism Surface, a fixed transition graph, a Flow layer, or a
universal effect model. Those designs would increase invalid combinations and
make Re-SpireAgent reconstruct business meaning already known by the Bridge.

## Evidence Reviewed

- exact installed identity `v0.109.0|c12f634d|-840572606`;
- exact decompiled `NDeckCardSelectScreen`, `MerchantCardRemovalEntry`,
  `OneOffSynchronizer`, `PlayerCmd`, `CardPileCmd`, and merchant UI bindings;
- organic preview.18 merchant-removal and run-deck post-state evidence;
- all fifteen current Surface providers, resolver, command ledger, inspection
  builder, protocol DTOs, and strict Re-SpireAgent decoder/normalizer;
- historical current-build qualification and coverage documents.

The selector source confirms that a one-card removal may advance directly to
preview from the card click. The merchant source confirms that selector closure
precedes gold loss, card removal, counter increment, and service consumption.
This invalidates any architecture that equates a visual transition with
semantic completion.

## Selected Architecture

```text
Context: durable semantic situation and shared visible facts
Surface: sole current input owner and semantic interaction protocol
Stage: current state inside that Surface
Mechanics: internal, non-authoritative structural reuse
Action: opaque, state-bound, purpose-specific executable capability
Inspection: independent read-only player-visible evidence
Completion: action-specific semantic postcondition
Transition evidence: observed command events plus coherent pre/post states
```

Implemented in this pass:

- common `_prefs` and `_selectedCards` reading moved into
  `BoundedCardSelectionFacts`, without legal-action or purpose logic;
- Re-SpireAgent shares bounded-selection consistency validation while retaining
  separate enchant/removal Surface contracts;
- merchant removal now revalidates the exact selected card, merchant inventory,
  service entry, affordability, and current transaction before clicking;
- its completion crosses intermediate states and requires all exact semantic
  post-state witnesses;
- pure tests prove that no partial witness can masquerade as completion.

## Architecture Health

| Area | Judgment |
|---|---|
| Context / Surface / authority separation | healthy and evidence-backed |
| single input owner | strong and fail-closed |
| opaque action execution | strong |
| Inspection boundary | strong for two fixed kinds; coverage narrow |
| completion model | structurally sound, provider-by-provider debt remains |
| shared mechanics | deliberately small; not a second authority layer |
| Re-SpireAgent boundary | healthy; strict decode and no v1 action merge on candidate build |
| current-build coverage | intentionally narrow, not broadly qualified |
| update/mod identity | game build exact; gameplay-mod and loaded-Bridge fingerprints remain future debt |

Overall engineering health is good because uncertainty suppresses authority and
fixtures are not called organic qualification. Semantic coverage is still much
less complete than the safety kernel.

## Alternatives Rejected

- universal selector, universal purchase, and universal Effect DSL;
- recursive executable overlays;
- raw reflection/UI-tree exposure;
- replacing semantic Surface with generic mechanics;
- adding wire transition metadata before branch behavior and client use are
  proven across more than one journey.

## Coverage And Migration Consequences

No new Surface is qualified by this pass. Re-SpireAgent's wire schema and
public normalized state remain compatible. The v1-to-v2 retirement rule is
unchanged: retire v1 ownership only per exact Surface/action shape after source
audit, strict-client tests, and organic completion evidence. The current v0.109
candidate still owns only merchant removal plus `run_deck` inspection.

The next highest-value runtime slice is a second ordinary merchant removal under
the strengthened witness. After that, the highest-value new coverage is a
purpose-specific rest Smith deck-upgrade child, not a generic deck-maintenance
Surface. Enchantment semantic completion should be audited before requalifying
that action on a future exact build.

## Verification And Evidence Integrity

- 50/50 Bridge contract/runtime tests passed.
- 115/115 Re-SpireAgent tests, strict typecheck, and production build passed.
- The Release Bridge build completed with zero warnings and zero errors.
- After a clean Steam restart, the host Bridge reported protocol
  `2.0-preview.18`, exact game identity `v0.109.0|c12f634d|-840572606`, the
  narrow candidate authority, and fail-closed main-menu state. A state-bound
  `run_deck` read returned `inspection_not_available`; Re-SpireAgent handled it
  without actions or provider execution.

The first attempted load smoke was invalid evidence: the game process predated
the newly installed DLL, and the Steam URI only focused that process. This was
detected by comparing process start time with DLL mtime, then corrected with a
clean restart. Bridge capabilities do not yet expose a loaded-module
fingerprint, so deployment freshness remains an explicit operational debt. It
does not weaken the semantic Surface decision, but it must be checked before
claiming future exact-build qualification.

## Rollback

The change is isolated to one shared fact reader, one pure completion witness,
the merchant-removal provider, strict-client structural validation, and docs.
Rollback restores the prior provider-local reads and screen-close predicate;
doing so must also return the current build to observation/cancel-only authority
because screen closure is not a sufficient commit witness.
