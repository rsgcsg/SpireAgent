# Preview.54 Splash Source Binding And Long-Run Closeout

Status: exact v0.109 source audited; bounded Bridge/Re contract, tests, Release
build, install, and cold load completed. Broad strict-v2 regression is clean.
Splash did not naturally recur on the final MVID and remains a canary.

## Natural Defect

In preview.53 strict-v2 run `run-20260719235923-qz8bg5`, decision 13 played
native Splash. The child was `NChooseACardSelectionScreen`; because the active
source tracker covered only Lead Paperweight and native generated-card
potions, Bridge returned `unsupported + authority=none + legal_actions=[]`.
No action escaped the missing contract.

## Exact Source And Architecture

Exact v0.109 `Splash.OnPlay`:

- generates three distinct Attacks from another character card pool;
- opens `CardSelectCmd.FromChooseACardScreen(..., canSkip: true)`;
- marks the selected exact card free this turn;
- adds it to combat hand with native full-hand discard redirect.

Decision: **C - add a source-discriminated Splash branch to the existing
generated-combat mechanics/witness**. The new source token is active only
inside exact sealed `Splash.OnPlayWrapper`. It shares no authority with other
cards that reuse the screen. Purpose, source kind, player ownership, three
Attack candidates, cost policy, destination, overflow, and semantic witness
remain explicit.

Selection completion requires source completion, child closure, exact offered
reference newly present in hand or discard, combined pile count `+1`, and a
free-this-turn local cost modifier. Skip requires unchanged piles and absence
of every offered exact reference. Unknown outcome is never retried.

## Loaded Identity

- protocol: `2.0-preview.54`
- Re normalized schema: `25`
- game: `v0.109.0|c12f634d|-840572606`
- Release/installed SHA:
  `7bf3abca5f20594077b31f8e400ef0b27643353846256cb59cb633418a59a8b3`
- loaded MVID: `67b8d32b-8c0c-4514-9df7-fac4ac5fb738`
- runtime: `db112bc183354e9eb397f6c76121f484`
- Modset: `exact_bridge_only`
- Modset fingerprint:
  `8371ef20e96178fc38ae2427a749815e13a37747aef58d2d4c48e0a10b3d036b`

## Organic Regression Evidence

Four strict-v2 windows on the loaded identity recorded 216 decisions:

- `run-20260720000758-ycmcau`: 22 settled, one run boundary;
- `run-20260720000955-3zg1o9`: 79 settled, one stale-state refusal;
- `run-20260720001351-ogghci`: 98 settled, two stale-state refusals;
- `run-20260720001906-r04a9h`: 12 settled, one run boundary.

All 216 observations were `bridge_advertised`. The run crossed combat,
combat-hand selection, rewards/card rewards, map, events, event/rest upgrades,
treasure, shop, rest, game over, and menus. No v1 action, unsupported Surface,
unknown outcome, provider-contract failure, or authority conflict occurred.
The stale decisions were blocked before dispatch and fresh ticks continued.
Two were the same exact treasure transition: the relic holder was already
clickable while the native 2.5-second Skip delay completed. The successor
state added Skip, so execution correctly rejected the old state-bound action;
the next tick selected the same relic. This is retained as a safe efficiency
cost rather than weakened state binding. See
[the dedicated lifecycle audit](TREASURE_SKIP_DELAY_STATE_DRIFT_AUDIT_2026-07-20.md).

This proves broad regression health, not Splash qualification: Splash did not
recur on the final MVID. Its first final-MVID action, Skip, and full-hand
overflow remain evidence debt.

## Verification And Rollback

- Bridge tests: `98/98` pass.
- Re tests: `149/149` pass.
- Re typecheck/build: pass.
- Bridge Release build: zero warnings/errors.
- Release and installed SHA: exact match.
- Loaded protocol/MVID/runtime/game/Modset: exact match.

Rollback is preview.53 plus Re normalized schema 24. Rollback must return
Splash to the same safe unsupported state rather than infer semantics from its
prompt or screen shape.
