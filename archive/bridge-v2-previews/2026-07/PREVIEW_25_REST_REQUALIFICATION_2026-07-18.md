# Preview.25 Rest-Site Requalification

Status date: 2026-07-18

## Verdict

The ordinary single-player `rest_site` Surface is qualified on exact game
identity `v0.109.0|c12f634d|-840572606`. Qualification is limited to the built-in
Heal and Smith options plus Proceed. Any other enabled option, multiplayer rest
state, missing binding, or unknown completion still fails closed.

The work corrected a real completion defect before restoring permission. The
historical provider treated any overlay, removed option, or enabled Proceed as
enough to complete any rest choice. Current code uses purpose-specific
completion and does not infer a universal rest-option effect.

## Exact Source Audit

- `RestSiteRoom.Options` is the local player's current option set.
- `NRestSiteRoom.UpdateRestSiteOptions` creates one `NRestSiteButton` for each
  exact option and `NRestSiteButton.SelectOption` dispatches its exact index to
  `RestSiteSynchronizer.ChooseLocalOption`.
- `HealRestSiteOption.OnSelect` calls `ExecuteRestSiteHeal`; the amount comes
  from `HealRestSiteOption.GetHealAmount`, then `CreatureCmd.Heal` clamps the
  result to max HP.
- `SmithRestSiteOption.OnSelect` creates a cancelable, manually confirmed
  `CardSelectCmd.FromDeckForUpgrade` child. The owning business result is later
  completed by the separate `deck_upgrade_selection` Surface.
- `NRestSiteRoom.ShowProceedButton` enables the exact Proceed control and map
  travel; `OnProceedButtonReleased` opens the map.

## Corrected Completion Contract

- Heal captures the exact local player, HP, max HP, and source-calculated heal
  amount before click. Completion requires the exact resulting HP and rest
  progression; merely enabling a control is insufficient.
- Smith completes only when the exact `NDeckUpgradeSelectScreen` child becomes
  the active overlay. An arbitrary overlay is not accepted.
- Proceed completes only after leaving the room or opening the map.
- Enabled options other than exact `HealRestSiteOption` or
  `SmithRestSiteOption` suppress the entire Surface until separately audited.

This is architecture decision **C**: retain one semantic rest Surface and share
its stable room mechanics, while dispatching completion by exact option purpose.
It is not a universal effect DSL.

## Organic Runtime Evidence

Canary artifact:

- DLL SHA-256:
  `e1ba5e7d83ec6390e93d81865ad1b75533103ad45aaf5d82ffb82555eafb4f9d`;
- MVID: `1779d324-5e0e-4e95-ad5f-f302ecfb3f35`;
- runtime instance: `207d98c3ee9c4b948cdeadc1b60eaa3e`.

Observed journeys:

- `preview25-final-rest-heal-20260718-1`: HP 56 -> 80 with
  `rest_heal_exact_hp_and_option_progress_observed`;
- `preview25-final-rest-proceed-20260718-1`: confirmed map/room transition;
- `preview25-final-rest-smith-launch-20260718-1`: completed only when
  `deck_upgrade_selection` became active;
- `preview25-final-rest-smith-cancel-20260718-1`: child cancellation completed
  and returned cleanly to the same rest Surface with HP and options unchanged.

Final qualified artifact:

- DLL SHA-256:
  `1e5cf857c239acb80fa40105360b690efe9a03b1c0fa2e6645f9c8990126acd0`;
- MVID: `e9a9e229-82b7-4752-afb7-46b910468f58`;
- runtime instance: `81135d086eeb4d5bac16154ad6afdc8b`.

`preview25-qualified-rest-heal-20260718-1` repeated exact HP 56 -> 80 and
`preview25-qualified-rest-proceed-20260718-1` confirmed map transition on this
final artifact. Re-SpireAgent decoded the rest state as
`rest + rest_site + bridge_advertised` with no diagnostics.

Final-MVID regression run `run-20260717145202-b5ewm2` recorded 24/24
`executed_and_settled` decisions, all `bridge_advertised`, across 23 combat
turns and one map choice, with no command failure.

## Boundaries And Next Evidence

- relic/mod-added rest options remain unsupported unless their exact purpose
  and completion are audited;
- multiplayer rest remains unsupported;
- current ordinary Heal/Smith qualification does not qualify arbitrary child
  maintenance Surfaces;
- shop remains a separate current-build debt: run
  `run-20260717143436-4z3d3c` had three clean but legacy
  `local_reconstruction` shop decisions because its v2 providers are still
  v0.108-only in the permission matrix.

Rollback is local to rest permission and completion dispatch. Removing
`rest_site` from the scoped-qualified list immediately restores v1 fallback;
no Re strategy or root learning behavior changed.
