# Preview.45 Headbutt Combat-Pile Source Binding Canary

Status: source/test/build/install/load verified; exact source and action were
organically observed; final semantic completion is not organically qualified.

## Scope

Preview.45 adds one purpose-specific branch to
`combat_pile_card_selection`: exact `Headbutt` discard-pile selection whose
business result is moving one exact visible discard card to the top of the
draw pile. It does not authorize generic pile selectors, infer purpose from
prompt text, or expose hidden draw order.

## Evidence And Correction

Strict-v2 run `run-20260718175613-8wo2hm` naturally played Headbutt and opened
the child Surface. Decision `decision-000010-mrqo54x8-57og4f` selected the
exact visible `Fight Me!` card, but request
`re-p1-f80c7005-72d0-4ef4-a4a0-25ddfeb842ca` ended
`unexpected_state_transition`. Source-task completion legitimately advanced
the parent combat state before the bounded action observer accepted the
semantic witness.

The provider was corrected to allow intermediate state changes while still
requiring all of the following:

- exact Headbutt source binding;
- child Surface closure;
- source task completion;
- the selected exact card reference leaving discard;
- that same exact reference becoming draw-pile top.

The final corrected preview.45 build passed Bridge `89/89` and Re `142/142`,
and was installed and loaded as MVID
`8a57f8a2-c8c5-4cf8-80b9-16b26f261538`. A restored fight did not naturally
play Headbutt again before death, so no post-fix Organic Completion is claimed.

## Architecture Decision

Classification: **B, internal mechanism reuse with independent semantics**.
The pile-card DTO and state-bound action mechanism are shared, while Headbutt
keeps an exact Source Binding, operation, and Outcome Witness. A universal
pile selector remains rejected.

## Remaining Boundary

Preview.45 remains an action canary, not qualified. The next natural Headbutt
occurrence must confirm the corrected semantic completion on its own loaded
MVID. Other pile-selection callers remain fail closed.
