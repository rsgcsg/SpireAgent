# Human-Equivalent Post-Cutover Decoupling And Live Failure Closeout

Date: 2026-08-09

Start source: `250ebc6df2df9e4403a2bce46c2c089d094b0b34` on
`human_equivalent_connector` with a clean worktree.

## Architecture Verdict

The HE target architecture remains correct. The default wire and authority
path is genuinely C observation/affordance/delivery/successor -> Re opaque
choice. Two implementation remnants made that truth harder to read: HE was a
`ConnectorV3Runtime` partial, and Re still shipped an unused V3 client/executor.
Both are removed. Shared entity identity now belongs to authority-neutral
`NativeUiRuntime`.

Unmigrated UI families still call six bounded V3 adapter-library seams. This is
one-way implementation debt, not a second authority or executor: HE publishes
with `human_ui`, performs its own exact request validation and returns its own
delivery receipt. The boundary check freezes the seam so it can shrink but not
grow.

## Exact Live Evidence

The following `he_assisted` runs all used source revision `250ebc6d`, protocol
`1.0-preview.1`, loaded SHA
`693c168972df552130ec6223feb307cfe44bc35029af0ce0165ad9d0b3972b3f`, MVID
`894be927-315c-422f-9e51-f6ad70e5c769` and runtime
`d00531f296674912a0b2b4902fdb37b9`:

- `run-20260809074101-s34jqz`
- `run-20260809074130-kcd2n9`
- `run-20260809074203-hu8s71`
- `run-20260809074242-8p59sg`
- `run-20260809074330-9flan1`
- `run-20260809074419-3gmhvb`
- `run-20260809074546-3k48s2`
- `run-20260809074857-tejg93`
- `run-20260809074935-ck0e2y`

Across 85 decisions: 46 were `executed_and_settled`, 26
`not_executed_non_actionable_state`, seven `executed_unsettled`, and six
`not_executed_stale_state`. Surfaces included main menu, combat, reward/card
reward, map, rest, event and treasure. Provenance was `unrecorded` and the
Modset was `additional_loaded_mods`; this is Live coverage evidence, not
Organic evidence or qualification.

## Failure Attribution And Closure

Six end-turn inputs and one map-to-combat input returned HE `applied` delivery
with a successor that was still transitional. Re then waited for a business
checkpoint and stopped on timeout. The fix makes HE delivery
`adapter_confirmed`; a slow successor becomes `executed_checkpoint_pending`
and supervision continues. It does not turn unknown delivery into success.

Sixteen non-actionable decisions across two runs were the visible
`NCombatPileCardSelectScreen` being suppressed because the legacy provider
could not infer one qualified business source. The source-free adapter now
derives exact cards, native selection preferences, selected state and controls
from the current screen; it revalidates the screen/card/control and delivers
the native holder, confirm or cancel callback. It never infers the opening
source or eventual pile effect.

The six stale refusals were correct fail-closed behavior; later fresh choices
succeeded. No reviewed run contained an unknown-delivery retry or Gateway
crash.

## Ownership And Deletion

- C/HE owns HE protocol, observation, affordance admission, exact delivery,
  receipt, successor and controller transport.
- `NativeUi` owns the shared entity registry; its identity has no authority.
- A/Re owns HE decode, local opaque choice, successor readiness and recovery.
- D annotations remain optional and non-authorizing; no reviewed run was
  `he_pure`.
- P/operator tooling owns build, install, identity and rollback.
- Re V3 live client/executor, public wire export and executor-only tests are deleted.
- Re builds clear `dist/` before compiling, removing stale generated executors.
- Historical V3 schemas, normalizers and fixtures remain for read-only replay.

## Evidence Boundary And Next Gate

The fixes in this closeout have source/test evidence only until their exact
artifact is built, installed, cold-loaded and exercised. Required regressions
are combat-pile select/deselect/confirm and a slow end-turn or map transition.
An ordinary replacement-artifact journey and bounded `he_pure` journey remain
pending. Full hover/scroll/native-page flow, arbitrary Mod/version support,
Organic evidence and durable qualification are non-claims.
