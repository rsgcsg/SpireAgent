# Preview.73 Rest Outcome And Authority Boundary

> Status: source, cross-language tests, Release build, installation, cold-load
> identity and strict Re read-only inspection complete; mutation canaries
> pending.
> This report grants no action or qualification authority.

## Evidence

Three Preview.72 runs on exact Gateway SHA `debc229e...deed`, MVID
`6d9d4adf...3d8`, runtime `b2332a06...cba` exposed one native Outcome defect
and one authority-projection defect:

| Run | Boundary |
|---|---|
| `run-20260728143604-oklaik` | Rest selected successfully but command timed out. Native post-state was HP `64/85`; the old Oracle required exact HP `59/80`. Stone Humidifier legitimately raised max HP and current HP by 5 after the native base heal. |
| `run-20260728144125-xvgvhc` | The unknown outcome quarantined `rest_site/choose_rest_option`. A fresh, coherent Rest Surface remained visible, but Gateway changed its handoff to `none_fail_closed`; strict Re correctly rejected the contradictory semantic owner. |
| `run-20260728144341-2c4ij1` | Reproduced the same coherent Rest owner contradiction before mutation. |

All three are `unrecorded` defect/coverage evidence, not Organic or persistent
qualification. No unknown mutation was retried.

## Root Causes

### Rest Outcome

`RestSiteSurfaceProvider` used the game-native base heal amount but treated the
result as an exact final HP prediction. That overclaimed ownership of relic and
other native side effects. An action-local Outcome should prove the minimum
consequence owned by this action plus Rest progression, not reconstruct every
native effect that can co-occur.

### Owner And Permission

`BridgeSnapshotBuilder.SuppressActionsOutsideCurrentOperationScope` correctly
withheld unpermitted actions, but when zero remained it also changed:

```text
semantic Rest Surface + bridge_owned
```

into:

```text
semantic Rest Surface + none_fail_closed + unsupported
```

The Surface facts still described the current input UI, so this envelope was
internally contradictory. Mutation permission and current semantic/input owner
are different facts.

## Repair

- Rest completion now requires current HP to reach at least the native base-heal
  minimum and requires the exact option to be consumed, the Rest screen to
  leave, or normal Proceed to become enabled.
- The evidence code is now
  `rest_heal_minimum_hp_and_option_progress_observed`.
- A Surface whose every operation is withheld remains the exact semantic
  Surface with `bridge_owned`, zero legal actions, readiness `blocked`, and a
  typed `bridge.authority.operation_scope_blocked` diagnostic.
- Re accepts this exact contract as `non_actionable`, keeps the visible Surface
  facts, publishes no allowed action and never calls the model for mutation.
- Unsupported source/owner states still use `unsupported + none_fail_closed`;
  this repair does not weaken that boundary.

## Architecture Decision

The accepted ADR-0002 architecture remains unchanged. This repair strengthens
its intended separation:

```text
observed semantic Surface
!= input owner
!= mutation grant
!= action-local Outcome
!= final game state prediction
```

No new Surface, action, operation permission, persistent qualification or
fallback was added. The normalized schema remains `29`; the Bridge wire source
contract advances to `2.0-preview.73` because readiness/authority semantics
changed even though the JSON shape did not.

## Checks And Artifact State

Completed:

- Gateway tests: 194 passed;
- Re tests: 208 passed;
- Re typecheck and production build;
- Connector CLI, run-identity, docs, inventory, adaptation, compatibility,
  permission, qualification, profile and migration fixture checks;
- exact game assembly audit for `v0.109.1|c8c577f6`;
- Release build with zero warnings and zero errors.

Final built and installed Preview.73 identity:

```text
SHA   f6b2d2687add4719e7d04f6b3beb8b5b386f43208d7af1cc0b12e2d89a151b18
MVID  f67e272a-ca3f-4eac-8d41-6e287b144c8a
```

The first normal macOS quit request returned `user canceled`; the process was
not killed. After the game later exited normally, the connector CLI installed
the final artifact and verified exact built/installed SHA and MVID equality.
The previous DLL was backed up at:

```text
STS2MCP/.local/deployments/2026-07-28T15-34-25-593Z
```

Steam cold-started Preview.73 with exact source/built/installed/loaded identity
and runtime `37c04bb71df3451eb23545b6925b3a37`. Strict Re read-only inspection
decoded the main-menu state and current runtime-bound
`main_menu/open_singleplayer` canary without executing it. Inspection remains
disabled and no persistent authority is applicable. Therefore Preview.73 is
loaded and read-compatible, but not mutation-canary tested, Organic-qualified
or persistently qualified. Preview.72 remains the latest action-evidence scope.

## Live Acceptance

1. run the ordinary Agent entry from the current exact loaded identity;
2. at a Rest heal with Stone Humidifier or another legitimate additive native
   effect, verify `executed_and_settled`;
3. for an explicitly quarantined operation, verify the semantic Surface remains
   visible as blocked with no LLM call or mutation;
4. do not retry any unknown command.

These canaries are required before any Live or qualification claim changes.
