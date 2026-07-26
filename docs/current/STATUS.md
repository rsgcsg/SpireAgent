# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/`.
- **Connector:** `STS2MCP/` Semantic Gateway, REST contract, and optional
  v2-only MCP adapter.
- **Legacy:** the original root runtime and P8--P15 route are archived.

## Current Gate

Gate 1 remains closed as a bounded ordinary-single-player v2 connector
baseline. Source contract is `2.0-preview.65`; Re normalized schema is `26`.
Gateway v1 is retired and every `/api/v1` route returns `410 Gone`.

The local game update from reviewed `v0.109.0` to `v0.109.1` has now completed
one real, operation-scoped requalification cycle. The Gateway does not inherit
old authority by version similarity. It admits only the exact operations whose
current assembly bindings and real completion evidence were reviewed:

- `main_menu/open_singleplayer`: persistent `qualified`;
- `main_menu/continue_run`: persistent `qualified`;
- `map_navigation/choose_map_node`: candidate only, not qualified and not
  exercised, because the available saved run did not expose a legal route
  action;
- `shop_room/open_shop_inventory` and
  `deck_enchant_selection/confirm_selection`: bindings match the
  reviewed contract, but still require targeted current-build runtime
  evidence;
- all other unqualified operations remain governed by their exact embedded
  policy or fail closed.

Preview.65 persistent qualification is therefore **real but narrow**. It is
not broad `v0.109.1` compatibility, all-operation qualification, cross-Mod
qualification, or proof that a future update can be handled without review.

## Exact Evidence Boundary

Current exact game and assembly:

```text
game      v0.109.1|c8c577f6|-820620422
sts2 SHA  2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f
sts2 MVID 208f08b8-d5f5-47f8-9e96-d3a4299ee709
Gateway   4c6c1309c4ac3c0e97eccb084312769595485e21f499b9a1d07040a8e744419e
MVID      60d4c2ce-44ad-46b4-99f7-0479e75b5741
```

The two qualified operations each have two confirmed ordinary-gameplay
decisions in distinct runtime epochs. Their qualified packages were installed
in the local append-only store, survived a cold restart, and were revalidated
against the exact game, Gateway, Modset, Patch, environment and operation
identity. Wrong Modset, Patch and MVID, expired packages, corrupt stores,
revoke, supersede and rollback were also exercised without widening live
authority.

The final local cold load uses `balanced_gray`. It restored the two persistent
scopes, issued no dynamic map grant, and Re strict inspection reported
diagnostics `ok`.

The run set and package identities are recorded in the
[v0.109.1 requalification closeout](../../STS2MCP/docs/bridge-v2/PREVIEW_65_V01091_REQUALIFICATION_CLOSEOUT_2026-07-26.md).

## Immediate Next Step

Do not widen authority from these menu results. The next useful work is a
fresh, semantically ordinary saved run that exposes a legal
`map_navigation/choose_map_node` action, followed by the same candidate,
completion, second-epoch and persistent-package sequence. If no legal route
action is visible, keep the operation fail closed rather than manufacturing
evidence.

Gate 1 closeout still does not mean complete-game coverage or complete
player-visible information. Crystal Sphere, standalone manual potion discard,
non-standard menu/profile flows, multiplayer, and unbound selector semantics
remain unsupported or outside the bounded gate.
