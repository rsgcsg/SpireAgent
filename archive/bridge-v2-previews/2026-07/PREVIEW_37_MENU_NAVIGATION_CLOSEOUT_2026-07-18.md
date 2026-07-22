# Preview.37 Menu Navigation Closeout

Status date: 2026-07-18

## Scope And Verdict

Preview.37 adds two purpose-specific pre-run contracts:

- `main_menu`: exact root-menu visibility plus bounded `continue_run` and
  `open_singleplayer` operations;
- `singleplayer_menu`: exact Standard/Back navigation while Daily and Custom
  remain visible unsupported facts.

Both remain `candidate_action_canary`. Only `main_menu.continue_run` received
current-MVID Organic canary evidence. `open_singleplayer` and both submenu
operations are source-audited and fixture-tested, but not organically
exercised because the current profile had a valid saved run and the game hid
the Single Player control.

## Exact Source And UI Audit

- `NMainMenu.RefreshButtons` makes Continue/Abandon and Single Player mutually
  exclusive according to the current saved-run state.
- Continue enters the exact saved single-player run. Single Player either
  opens `NSingleplayerSubmenu` or, for a first run, goes directly to
  `NCharacterSelectScreen`.
- `NSingleplayerSubmenu` exposes Standard, Daily, Custom, and Back. This
  contract authorizes only Standard and Back.
- `NSubmenuStack.Peek()` is the exact submenu owner and completion evidence.
- `NModalContainer.OpenModal` preempts menu authority. No menu provider runs
  while a live visible modal owns input.

The runtime observation matched source behavior: the loaded profile had a
valid Defect floor-one save, so Continue was visible/actionable and Single
Player was absent. The Bridge did not fabricate the hidden action.

## Architecture Decision

Decision: **C for the typed visible-choice component, B for implementation
helpers, while preserving two independent semantic Surfaces**.

- `VisibleMenuOption` is a strong shared data component because both audited
  screens expose the same bounded fact shape.
- `MenuSurfaceSupport` shares only non-authorizing binding/fail-closed help.
- Root and submenu retain different source bindings, operations, completion
  witnesses, context flow, and unsupported boundaries.
- No universal menu, index-based click API, recursive Surface stack, or generic
  navigation action was introduced.

## Release And Loaded Identity

```text
develop baseline: 79b5b17752fd4aa1a8e31fbe4b6968e321b85100
protocol: 2.0-preview.37
game: v0.109.0|c12f634d|-840572606
Release/installed SHA-256: 1caa587153718873e23bfa63ffbce6e458b668d6eef9f9d07ba95737f413a949
loaded MVID: 555c71d9-2069-445b-9a93-c9c4570bb71b
runtime instance: 22ed103f3ef24f3c979d30940b95f9f7
Modset status: exact_bridge_only
Modset fingerprint: b6919ab12557218aa9d3bf1360e5215a6060cfc0f466391630dd83bd5b07f972
```

The only loaded Mod was the exact `STS2_MCP` assembly above. Release and
installed DLL hashes matched before the final cold Steam load.

## Continue Organic Canary

The final loaded state was `menu + main_menu + bridge_owned`; Re strict
diagnostics were `ok`, and `continue_run` was the only action.

Command `preview37-final-continue-1784384566` followed:

```text
received -> validated -> started -> completed
outcome: confirmed
completion: saved_singleplayer_run_became_active
```

The successor was the saved run's real Neow `event_option`, still
Bridge-owned. No v1 action or local reconstruction participated.

## Validation

- Bridge contract/security tests: `75/75`.
- Bridge final Release build: zero warnings and zero errors.
- Re-SpireAgent tests: `132/132`.
- Re typecheck and production build passed.
- Python MCP syntax compilation and locked-environment import passed.
- Re strict runtime inspect accepted the final loaded root state.

## Remaining Boundary

- `open_singleplayer`, `open_standard_run_setup`, and
  `back_from_singleplayer_menu` need fresh Organic action lifecycles.
- Profile and Patch Notes hover detail is non-action-required completeness
  debt. It does not authorize or block Continue.
- Abandon, Daily, Custom, Multiplayer, Timeline, Settings, Compendium, Profile,
  Patch Notes, and Quit remain visible unsupported facts.
- First-run tutorial confirmation remains unsupported.
