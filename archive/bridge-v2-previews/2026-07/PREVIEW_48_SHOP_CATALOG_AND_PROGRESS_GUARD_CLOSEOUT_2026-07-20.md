# Preview.48 Shop Catalog And Progress Guard Closeout

Status: current-build read-only canary and client integration closeout  
Date: 2026-07-20

## Scope

Preview.48 closes one concrete player-visible information gap: the current
merchant catalog disappeared from the Agent's decision state whenever the
inventory panel was closed, even though the same merchant model remained
available through the player's ordinary open-inventory interaction. This made
the Agent alternate between opening and closing the inventory merely to recover
information it had just inspected.

The slice does not add a shop action, broaden `shop_room`, qualify a Surface,
or create a generic purchase/selector protocol. It adds one exact-state,
read-only `shop_catalog` Inspection and fixes a Re progress-guard regression
caused by regenerated coherent-observation transport IDs.

## Architecture Decision

The cross-contract review selects **B: extract/reuse only permissionless
internal mechanics and typed facts while preserving independent semantic
contracts**.

- `shop_inventory` remains the sole action owner while the inventory is open.
- `shop_room` remains the sole action owner while the inventory is closed.
- `shop_catalog` reuses exact merchant entry readers and typed offer DTOs, but
  returns no legal actions and never enters the command ledger.
- `fixed_ui_slots` preserves real merchant slot identity. It is not a universal
  ordered-selection abstraction.
- `canPurchase=false` outside the active inventory makes the information/action
  boundary explicit rather than inferred by clients.

Rejected alternatives:

- a compound “inspect then buy” action would merge read authority with command
  authority and weaken stale-state binding;
- remembering the previous catalog only in Re would make stale historical
  client memory compete with the current game model as fact authority;
- a universal purchase or UI-tree contract would erase product, removal,
  capacity, commit, and completion differences without repeated evidence.

## Exact Runtime Identity

- protocol: `2.0-preview.48`
- game: `v0.109.0|c12f634d|-840572606`
- Release/installed DLL SHA-256:
  `619a755a94cac7a9569ba20954a59879a313776b9b73408eef95a142fe3e5164`
- loaded MVID: `678bbefd-f263-4053-9ff7-d0d7c81b2958`
- loaded runtime instance: `c940acb819e949c79fb46d871b02295b`
- Modset status: `exact_bridge_only`
- Modset fingerprint:
  `7f081272156cb4816467a93618d2cfeed12a8970c9885e14f2b5b3d3684f71d7`

The preview.47 artifact remains the rollback point at
`/tmp/STS2_MCP.preview47.afb7c35e.dll`. This local path is operational context,
not committed evidence or a distributable artifact.

## Contract

`shop_catalog` is available only in the current single-player shop Context. It
returns:

- `access_state`: inventory open or inventory closed but normally inspectable;
- exact card, relic, potion, and removal-service fixed slots;
- visible identity, description, price, sale, stock, affordability, and blocked
  reason where the UI exposes them;
- potion capacity effects and removal-service used/price state;
- completeness and source declarations.

It requires the exact current `state_id`, exact environment identity, and an
explicit canary permission row. It is state-bound, read-only, independently
authorized, and non-executable. Unknown shop owner, missing inventory binding,
identity drift, malformed content, or stale state fails closed.

## Re Integration And Progress Guard

Re strictly decodes the new Inspection kind, validates fixed-slot content, and
projects it into `player.shopCatalog`. It does not turn catalog entries into
allowed actions. The coherent observation bundle keeps state, run deck, and
shop catalog under one state/environment identity.

Preview.47 introduced a new generated `bridgeObservation.observationId`. Re's
semantic cycle guard initially treated that transport ID as business progress,
allowing an unchanged `shop_room/open -> shop_inventory/close` cycle to evade
detection indefinitely. Preview.48 classifies `observationId` with other
transport identities. Surface facts, stages, entity bindings, catalog content,
and action semantics remain in the cycle hash. Stale-state execution validation
is unchanged.

Historical run `run-20260719212815-iyamln` now replays as a repeated semantic
transition on the second close. Fresh run `run-20260719213504-7fa3pc` stopped
the live open/close cycle with `repeated_semantic_transition` instead of
continuing indefinitely.

## Organic And Integration Evidence

The current game was operator-positioned at a saved-run shop. That provenance
supports coverage and canary review, not independent qualification by itself.

- A closed-inventory strict read exposed `run_deck` plus `shop_catalog`, exact
  fixed slots, no diagnostics, and only the existing `open_shop_inventory` /
  `proceed_shop` Surface actions.
- Run `run-20260719215323-ej3no7` completed relic and card purchases plus
  `open_shop_card_removal -> toggle -> preview -> confirm` with exact semantic
  completion evidence. One purchase was not attempted after execution-time
  state drift; a fresh observation later completed it normally.
- Run `run-20260719215617-longql` closed the inventory, immediately chose
  `proceed_shop`, reached map, chose an exact node, and entered combat. It did
  not reopen the inventory and used no v1 transport.
- Two combat decisions in the follow-up were also safely rejected before
  execution when animation/state progression changed the source hash. Fresh
  decisions continued. There was no unknown outcome or automatic action retry.

## Validation

- Bridge test suite: 94 passing.
- Bridge Release build: successful with zero warnings.
- Re typecheck, 147 tests, and production build: passing.
- Installed DLL SHA matched Release; cold-loaded MVID/runtime/Modset matched
  capabilities, state, Inspection, and Re run metadata.
- Strict Re inspection reported no malformed, inferred, defaulted, unknown, or
  warning fields for the new catalog.

## Permission And Qualification Result

- `shop_catalog`: `candidate_read_only_canary` on the exact source-qualified
  current environment.
- `shop_room` / `shop_inventory`: unchanged action-canary permissions.
- no new qualified Surface or Inspection;
- no v1 fallback, hidden information, low-level click API, or command authority
  introduced;
- no evidence transferred from preview.47 or another MVID.

Qualification requires additional ordinary-shop diversity and independent
review of inventory mutation cases. This closeout proves the bounded contract,
current artifact loading, read-only authority, and one coherent end-to-end
journey; it does not prove whole-game player-visible completeness.

## Next Highest-Value Work

Continue the current strict-v2 organic run and classify the first naturally
encountered `unsupported`, `legacy-owned`, degraded, or missing-information
checkpoint. Prefer a coherent journey blocker over adding another Provider by
inventory. The next slice must retain exact source/UI review, explicit
permission, semantic completion, Re integration, and current-MVID evidence.
