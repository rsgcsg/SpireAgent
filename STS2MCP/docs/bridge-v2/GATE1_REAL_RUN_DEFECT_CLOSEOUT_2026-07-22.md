# Gate 1 Real-Run Defect Closeout

Status: three defects from fresh Re runs were repaired and all three have
current-artifact Organic regression evidence. Combat-pile support remains
source-scoped canary support; this evidence does not widen any operation,
Surface, or permission tier.

## Evidence That Triggered The Work

Fresh user-operated runs exposed:

- `run-20260722095828-tu5q18`, tick 5: a completed map-to-shop command was
  followed by `shop_catalog` `inspection_scope_mismatch` against the same
  advertised state identity;
- the same run at tick 38 and `run-20260722100327-qzqz9k` at tick 13:
  `select_discard_card_for_draw_top` started but timed out after ten seconds
  with `outcome_not_observed`;
- repeated combat states serialized raw localization templates such as
  `{Block:diff()}` and `{Amount:plural:...}` for visible powers.

The stale action in `run-20260722100423-gij8jr` was not a defect: Re rejected it
before dispatch after the game changed during model deliberation.

## Root Causes And Repairs

### Combat-Pile Completion

The Headbutt/Graveblast witness compared discard plus destination pile counts
captured before the source card was played with counts after the entire source
task completed. The played source card then enters its own post-play pile, so
the asserted aggregate conservation was false even when the selected card
moved correctly.

The witness now proves only the relevant semantic transaction:

- exact source task completed;
- selector closed;
- selected entity existed in the baseline source pile;
- selected entity reached the exact source-specific destination and left the
  source pile where applicable.

It does not guess where the separately played source card must finish. Unknown
outcomes remain non-retryable and both operations remain canary-only.

### Shop Inspection Advertisement

`BridgeVisibilityCatalog` advertised `shop_catalog` from `context.kind=shop`
alone, while `BridgeInspectionBuilder` required the exact current
`MerchantRoom + NMerchantRoom + MerchantInventory` binding. The catalog now
requires that same exact source binding before advertising the Inspection.
Inspection remains state-bound, read-only, and non-authorizing.

### Power Text

The context builder read `PowerModel.SmartDescription` directly, but the game
documents that property as not carrying its variables. It now consumes the
same dynamic `PowerModel.HoverTips` path used by the player UI and falls back
only to the game's formatted `DumbHoverTip`, not raw localization templates.

## Runtime Evidence

The broad regression run `run-20260722101242-cdmvev` belongs to loaded SHA
`9c31670e3c4e7ce08ce5e513ca02688b87d392758f872307e9cb2e4d475a094e`,
MVID `72193eaf-84d1-4b92-9563-5c95093ae705`, runtime
`5993ff60bfcb4880a4be09c66104e365`:

- 100 decisions;
- 94 commands completed and confirmed;
- zero command timeout, unknown outcome, or Inspection scope mismatch;
- 4 coherent-read `stale_state` observations recovered on later ticks without
  action retry;
- 2 stale actions rejected before dispatch;
- shop open, inventory, purchase, removal, close, and proceed lifecycle clean;
- zero unexpanded power-description templates.

The final source artifact additionally changes the power-description fallback.
It was built, installed, and Steam-loaded as SHA
`61e659c720a06fade8618457e6be4058dff3a164cb12cf0f8c23e4b19ee3de97`,
MVID `35c2e71e-66bc-4423-9191-3f00c404c2ad`, runtime
`7d19e21d5ee84105b32988aabadacc69` on exact game
`v0.109.0|c12f634d|-840572606` and exact Bridge-only Modset.

Final-artifact evidence:

- `continue_run` settled once in 18 polls / 3446 ms into actionable combat;
- `run-20260722101943-ybfqdt`: 20 decisions, 19 confirmed commands, one
  pre-dispatch stale rejection, zero timeout/unknown/Inspection error;
- visible `PLATING_POWER` and `SLOW_POWER` descriptions were fully formatted;
- zero unexpanded description templates.

Subsequent final-artifact Organic runs close the remaining combat-pile evidence
gap under the same exact identity:

- `run-20260722112338-y0qczb` completed Headbutt's
  `select_discard_card_for_draw_top` branch three times, each with the exact
  selected card moved from discard to draw top;
- the same run completed Graveblast's `select_discard_card_for_hand` branch
  once, with the exact selected card moved from discard to hand or the
  documented full-hand discard result;
- `run-20260722113100-vrx0s3` independently repeated the Graveblast hand
  branch once.

All five commands were received, revalidated, started, and completed without
timeout or unknown outcome. The runs record the final SHA, MVID, runtime,
exact game build, and exact Bridge-only Modset in their negotiated metadata.
This qualifies the corrected witness as current-build **canary** evidence only;
unrelated combat-pile origins remain fail closed.

The same later runs contain frequent `not_executed_stale_state` records during
combat (18 of 92 decisions in the latest run). Those actions were rejected
before dispatch after state-bound validation, while all dispatched commands
completed. This is a scheduling/throughput observation, not a completion or
execution-safety defect; it must not be "fixed" by retrying stale actions.

## Verification

- Re typecheck/tests/build passed: `155/155` tests.
- Bridge tests passed: `111/111`.
- Bridge Release build passed with zero warnings/errors.
- Built, installed, and loaded SHA matched before final runtime smoke.

## Next Evidence

Continue normal Gate 1 coverage from the current journey. Crystal Sphere and
manual potion discard outside reward handling remain known fail-closed
candidates. Track combat stale-state rejection rate separately before making
any throughput change; preserve state-bound rejection and unknown-no-retry.
