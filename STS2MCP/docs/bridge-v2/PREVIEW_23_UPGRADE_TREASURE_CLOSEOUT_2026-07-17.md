# Preview.23 Upgrade And Treasure Closeout

Date: 2026-07-17

## Verdict

Preview.23 is closed as a scoped v0.109 contract, not broad Bridge ownership.
It qualifies purpose-specific merchant removal, event/rest deck upgrade,
ordinary combat turn, and read-only run deck. Reward, card reward, map, and
treasure remain current-build action canaries.

## Architecture Decisions

### Deck upgrade: C

Use a strong typed shared bounded-selection component internally, while keeping
`deck_upgrade_selection` a purpose-specific semantic Surface. Event and rest
have different parent situations but the exact upgrade child has the same
eligibility, visible upgraded preview, commit, and upgraded-instance completion.
No generic executable selector was introduced.

### Treasure: A plus small B helpers

Keep `treasure_room` independent. Chest opening, relic choice, skip, and room
departure have different business effects and completion witnesses from outer
room rewards. Only shared visible relic/keyword serialization and entity
identity helpers are reused; they grant no authority.

### Shared HUD/run facts: D deferred to the next preview

The repeated v1 sidecar merge is a top-level protocol gap, not another Surface.
It should become a read-only shared state component only after exact-source/UI
audit. Preview.23 deliberately does not mix that change into the upgrade and
treasure qualification patch.

## Exact Source And UI Basis

- Upgrade: `CardSelectCmd.FromDeckForUpgrade`, `NDeckUpgradeSelectScreen`, exact
  selected card identity, visible upgraded preview, and deck post-state.
- Treasure: `TreasureRoom`, `NRun.Instance.TreasureRoom`, `NTreasureRoom`,
  `NTreasureRoomRelicCollection`, `SingleplayerRelicHolder`, and the exact
  `_hasChestBeenOpened` / `_isRelicCollectionOpen` v0.109 bindings.
- Visible treasure relic facts include rendered title, description, rarity, and
  hover keywords. Future rewards and hidden RNG are never exposed.
- The asynchronous opening stage is explicit and publishes no actions.

## Organic Evidence

- Event upgrade: `run-20260717110552-69mc6h`, Armaments -> Armaments+.
- Rest upgrade: `run-20260717110610-o77s7z` and
  `run-20260717110639-gsidjv`, Prep Time -> Prep Time+.
- Reward/map journey: `run-20260717110843-4shpn0`.
- Treasure relic choose: request `treasure-choose-1784288012`, terminal
  `completed/confirmed`, evidence
  `treasure_relic_owned_and_selection_closed`; player relic inventory contained
  Bag of Marbles.
- Treasure Proceed: request `treasure-proceed-1784288168`, terminal
  `completed/confirmed`, evidence `treasure_room_left_or_map_opened`; next state
  was `map + map_navigation` at the visited treasure coordinate.

The direct test harness initially queried the wrong local port and one zsh poll
variable name was invalid. Neither error changed game authority: the original
request IDs were queried without resubmission, and the command ledger proved
each action executed once. Unknown outcomes were never retried.

## Deployment Identity

- protocol: `2.0-preview.23`
- game: `v0.109.0|c12f634d|-840572606`
- loaded module MVID: `aaa57733-df23-4069-9dfc-31922dd0e1a7`
- runtime instance: `2d05c1630ac84639b8cd1e2fdc6635f7`
- installed and Release DLL SHA-256:
  `41208be89a2e77e7fe2dc5d6cf1eab2644d5daa20c52a463e08cf982871e913e`

The loaded runtime identity, not the disk hash alone, is the execution proof.

## Qualification Boundary

- Treasure relic choose and Proceed are organically confirmed action canaries.
- Chest open and relic skip are implemented but unqualified.
- Reward/card reward/map evidence remains canary-level.
- Historical v0.108 surfaces are not current-build authority.
- Shared HUD, menu lifecycle, linked rewards, transform, tooltip consistency,
  special map modes, and multiplayer remain debt.

## Rollback

Preview.23 is isolated by protocol version, exact game fingerprint, explicit
qualified/canary lists, and Git history. Removing treasure from the action
canary list disables its actions without altering any other Surface. Unknown
identity, ambiguous owner, missing exact binding, contradictory evidence, and
unknown command outcomes continue to fail closed.
