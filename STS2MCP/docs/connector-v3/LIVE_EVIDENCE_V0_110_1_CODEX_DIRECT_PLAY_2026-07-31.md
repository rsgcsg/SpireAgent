# Connector V3 v0.110.1 Codex Direct-Play Evidence: 2026-07-31

This is exact-runtime Organic evidence for a bounded direct-play session. It
is not durable qualification. Codex made the game decisions; Re-SpireAgent,
another model, a rules script and a local scorer were not used as the player.
The local driver only registered a V3 client, acquired the single controller
lease, submitted one currently advertised candidate with exact operands and
polled the same `request_id`.

## Exact Boundary

- branch and committed baseline:
  `connectorV3@6fa7ee5d22c872748580babddbec03625db9f17f`;
- source state: the documented uncommitted Connector migration worktree;
  the commit alone does not reproduce this artifact;
- protocol: `3.0-preview.1`;
- built-output, installed and loaded SHA:
  `548f15e45dc6609cf4a25af61af2ef2b07365af625b23dbd4f58369001a5f703`;
- built-output, installed and loaded MVID:
  `4700a63e-f587-49b7-a642-bfe10713cc42`;
- runtime instance: `a611dc97e2f046e4bd6e604c3501d692`;
- game: `v0.110.1`, commit `db5d3552`, assembly hash `-959015736`;
- Modset: `exact_bridge_only`, fingerprint
  `4ee35e807a347e1123a703713bdc7c97b9821f391f4c9df057a9fd08b0484072`;
- authority: `migration_exploration`, exact-runtime encounter-provisional
  session trials only;
- persistent qualification: none;
- install rollback:
  `STS2MCP/.local/deployments/2026-07-31T14-03-53-749Z`.

The game was cleanly closed after the final map observation. The last local
driver journal was `completed`, receipt `completed`, and
`retry.allowed=false`; no command was pending or unknown at shutdown. Session
grants and the runtime instance ended with the process.

## Journey One: Saved Defect A0

The cold-loaded game exposed a game-owned saved run at Act 2 floor 27, Defect
A0, 33 HP and 104 gold. This differed from the final state observed before the
cold start. It is recorded as a save discontinuity, not attributed to the
Connector without additional evidence.

The direct V3 journey then exercised:

- floor 27 normal combat, including Hologram handing off to exact
  `combat_pile_card_selection` and returning the selected discard card;
- floor 28 Decimillipede elite victory, potion use, card play, multi-enemy
  targeting, Sunder energy refund, reward claim and card reward;
- floor 29 Ovicopter victory through spawned egg/larva transitions, powers,
  orb generation/evocation, repeated target-domain changes and an end-turn
  victory successor;
- Tea Master `event_option`: 150 gold was spent on Ember Tea and the next
  combat visibly contained `Strength: 2`, proving the business consequence;
- floor 31 combat, death, both `game_over` stages and return to main menu.

All observed submissions in this journey returned completed receipts on their
original request IDs. No V2 action ID, index, coordinate click, arbitrary
reflection target or silent fallback entered the direct client path.

The run ended on floor 31. The decisive errors were strategy errors: a compact
local observation view first omitted enemy block, then omitted the visible
`Hard to Kill` status limiting each loss instance to 9. The full V3 observation
contained both facts. This is evidence that strategy consumers must preserve
visible enemy block and statuses, not evidence of a Gateway projection defect.

## Journey Two: Ironclad A0

From the returned main menu, V3 completed main-menu, single-player and
character-select progression into a fresh Ironclad A0 run. The journey
exercised:

- Neow event choice for Scroll Boxes;
- `card_bundle_selection` choice, preview and exact bundle commit;
- full visible map topology in `context.nodes`, while
  `surface.next_options` remained the exact current mutation domain;
- a normal combat victory and current-artifact outer reward/card-reward
  selection;
- shop-room open, shop inventory, exact Stone Armor purchase and close/proceed;
  gold changed from 110 to 32 and the exact offer became unstocked;
- another normal combat where Infernal Blade generated a zero-cost Uppercut,
  which was immediately advertised and played through the ordinary exact card
  contract;
- a second reward selection and return to the map.

The game was intentionally closed at Act 1 floor 4 map state with Ironclad A0,
80 HP and 50 gold. This is a bounded partial journey, not a win and not A10
evidence.

## Architecture Findings

The apparent map-information defect was rejected after reading the live
payload and source. `MapBridgeContext` already publishes the complete visible
node graph, coordinates, point types, states and children. The Surface
correctly contains only currently travelable exact operands. No duplicate map
field or protocol change was made.

The session supports the V3 split between visible strategy context and bounded
mutation candidates. Remaining migration debt is still visible: character
select, card bundle and shop inventory identify their binding as
`provider_native_binding_adapter`. Their Live behavior is exercised, but they
are not thereby proven migrated to the preferred direct resolver boundary.

## Non-Claims

- no A0 completion, Ascension unlock or A10 attempt;
- no persistent or cross-build qualification;
- no claim that every V3 family is supported or exercised;
- no `.86` Organic exercise of the combat-hand replacement-label repair;
- no Re-SpireAgent provider/decision evidence from this direct-play session;
- no current loaded runtime after shutdown.

The combat-hand manual-selection evidence belongs to the preceding artifact,
SHA `db826f604f317ab237c1ffa816668d6eaab6643aedb36c38011eb56bdbaa1dbd`,
MVID `25d2bd45-f74a-4d30-87f4-18bfe68f9192`. It is historical exact-artifact
evidence and is not reassigned to the `.86` artifact above.
