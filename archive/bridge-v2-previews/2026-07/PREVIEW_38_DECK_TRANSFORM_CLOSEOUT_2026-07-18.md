# Preview.38 Purpose-Specific Deck Transform Closeout

Status date: 2026-07-18

## Verdict

Preview.38 closes one natural strict-v2 gap: the exact
`WhisperingHollow.Hug -> CardSelectCmd.FromDeckForTransformation` lifecycle.
It is a current-build `candidate_action_canary`, not a generic transform
contract and not a qualified contract for every caller, Mod, or future build.

Architecture decision: **C**. The Surface remains a distinct semantic contract
and reuses only the strongly typed, non-authorizing bounded-card-selection
facts. It does not share commit, source, random-preview, or completion semantics
with removal, upgrade, enchantment, or reward selection.

## Source Audit

The exact current game assembly was audited for:

- `NDeckTransformSelectScreen` and its selection/preview controls;
- `NTransformPreview`, whose visible cycling cards use presentation-only
  chaotic randomness;
- `WhisperingHollow.Hug`, the exact audited caller;
- `CardCmd.TransformToRandom` and `CardTransformation`;
- `NCardGrid.IsShowingUpgrades` and the visible upgrade tickbox.

The contract therefore exposes:

- the exact visible run-deck cards and selection constraints;
- the exact selected card instances;
- current versus upgraded card presentation mode;
- `preview_kind=random_uncommitted_cycle` and
  `replacement_known=false` during preview;
- only opaque, state-bound actions from current exact controls.

It deliberately does **not** expose the cycling preview card as the committed
replacement, the event RNG, a future replacement, or a universal transform
action. The exact event source is required; an unknown transform caller fails
closed.

## Organic Canary

Environment and loaded identity for the exercised lifecycle:

```text
protocol: 2.0-preview.38
game: v0.109.0|c12f634d|-840572606
bridge MVID: 8edec9ec-f0a5-4cdf-8096-2900786c5311
runtime instance: b8737fb2ff9b485293e2662af5229592
loaded Modset: exact_bridge_only
Modset fingerprint: 6e444b114910f8f4bc0016944005289d77a5d9878f59a22c81626285a784d254
Release/installed SHA-256: 71f61ed1da9769174ec973e27f50cd2f7d9a0f278790a5c70b0bc7f7cbf53b16
```

The journey started from the naturally reached unsupported
`NDeckTransformSelectScreen` in `WHISPERING_HOLLOW`, then repeated after the
preview.38 DLL cold load:

1. root `Continue` and the exact event option returned to the selector;
2. `run_deck` Inspection bound 14 cards and target
   `card_1da3e90e_12` (`STRIKE_DEFECT`);
3. upgrade-view request `preview38-upgrade-1784386274` completed with
   `transform_upgrade_preview_mode_changed`; the same entity displayed
   `Strike+`, 9 damage, and `is_upgraded=true`;
4. reset request `preview38-upgrade-reset-1784386295` restored the original
   representation with the same entity identity;
5. selection request `preview38-select-transform-1784386314` completed with
   `transform_selection_changed_or_preview_opened`;
6. preview state was `stage=preview`, selected count 1,
   `random_uncommitted_cycle`, `replacement_known=false`, with only cancel and
   confirm authority;
7. confirmation request `preview38-confirm-transform-1784386346` completed
   `confirmed` with witness
   `transform_screen_closed_original_instances_absent_and_deck_count_preserved`;
8. post-state `run_deck` remained 14 cards, the exact original instance was
   absent, and a new `CREATIVE_AI` instance was present;
9. the successor was the same event's Bridge-owned Proceed option.

Re-SpireAgent strict `v2` inspection accepted both the transform preview and
the successor state with zero missing, invalid, inferred, defaulted, unknown,
or warning normalization fields. It imported only Bridge-advertised actions.

## Operation Evidence

| Operation | Evidence |
|---|---|
| `toggle_deck_transform_card` | Organic canary exercised |
| `confirm_deck_transform` | Organic canary exercised with semantic post-state witness |
| `toggle_deck_transform_upgrade_view` | Organic canary exercised in both directions |
| `preview_deck_transform` | Source audited; max-one selection auto-opened preview, so no separate button lifecycle was exercised |
| `cancel_deck_transform_preview` | Source audited only |
| `cancel_deck_transform_selection` | Source audited only; this caller was non-cancelable |

## Safety And Remaining Boundary

- exactly one Active Surface owned input;
- publication and execution used the same exact controls and card identities;
- all actions were state-bound and revalidated;
- Inspection remained separate and read-only;
- completion proved the business post-state, not only screen closure;
- no hidden random outcome was exposed;
- unknown source, owner, control, selected-instance, or outcome fails closed.

The Surface remains canary because one event source and one exact lifecycle do
not qualify other transform callers, multi-select variants, cancel variants,
Mods, future builds, or transform-like mechanics. Those require independent
Source Binding and Organic evidence.

## Validation

Before the final evidence-status rebuild:

- Bridge tests: `76/76`;
- Re-SpireAgent tests: `133/133`;
- Bridge Release: zero warnings/errors;
- Re typecheck and production build: passed;
- loaded DLL and installed Release SHA matched for the exercised MVID.

The final rebuilt identity is recorded in
[CURRENT_STATUS.md](CURRENT_STATUS.md); the Organic lifecycle above remains
attributed to its exercised MVID rather than being reassigned to a later build.
