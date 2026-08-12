# Player Environment Information Closure

Information Closure means every normal-player information path for a
supported interaction is either reachable through C or explicitly classified.
It does not mean exposing hidden game state or opening UI pages in the normal
Agent loop.

## Implemented

| Information | Access | Authority |
|---|---|---|
| run/player persistent summary | hot Snapshot | none |
| complete current interaction content | hot Snapshot | none |
| visible entities and controls | referents | none |
| observed enabled/selected state | referent state when directly known | none |
| run deck | state-bound `run_deck` read | none |
| draw/discard/exhaust piles | state-bound `combat_piles` read | none |
| current shop inventory | state-bound `shop_catalog` read | none |
| current card detail | state-bound `surface_card` read | none |

Every read is advertised by the current snapshot, runtime/environment coherent,
read-only and rejected when stale. A consumer may read lazily or aggregate reads
downstream without changing C truth.

## Supported Interaction Classification

| Interaction family | Stable Snapshot | Advertised Read | Explicit limit |
|---|---|---|---|
| menus, map, event, rest, treasure, game over | visible prompt, controls, options and current state | card detail when a card is a visible participant | unreviewed tooltip subtypes are partial |
| combat | player/enemy state, hand, intents, resources and current controls | `surface_card`, `combat_piles`, `run_deck` | arbitrary hover traversal is partial |
| reward and card reward | reward entries, skip/claim controls and selection state | `surface_card`, `run_deck` | arbitrary scroll traversal is unsupported |
| shop | current visible offers, prices, affordability and controls | `shop_catalog`, `surface_card`, `run_deck` | catalog page evidence is optional, not default flow |
| deck/combat-pile/generated selectors | prompt, candidates, selected state, stage and controls | `surface_card`, plus deck/pile reads when currently advertised | unknown owner is visible unsupported rather than guessed |

The table classifies current C1 stable/inspectable scope. Transient animation,
VFX/SFX, floating text and highlight history are intentionally deferred to
C1.x rather than silently counted as complete.

## Optional Native-Page Evidence Profile

`native_pages.v1` is implemented for:

- run deck;
- combat draw pile;
- combat discard pile;
- combat exhaust pile;
- shop catalog.

The profile is off by default and operator-owned. It provides config and CLI,
native open/read/return, pre/post owner checks, snapshot/runtime binding and
explicit recovery. While active it reserves input and suppresses mutation. It
never creates action authority or enters the action ledger.

Its bounded native adapters and tests exist; the new artifact still needs cold-load and
Live evidence. The profile is evidence tooling, not the normal consumer path.

## Partial Or Unsupported

- Current keyboard/controller focus is not yet projected and remains partial.
- Active hover traversal is not a general current read mechanism.
- Arbitrary scroll traversal is not implemented.
- Full coverage of every native tooltip subtype is not established.
- Native pages outside the five fixed profile kinds are unsupported.
- Unknown structured interaction fields remain visible unsupported or fail
  closed when identity, legality or action completeness depends on them.

## Hidden By Policy

Hidden RNG, true draw order, future rewards/events, unrevealed options and
other information unavailable to a normal player are excluded even if native
objects are reachable by reflection.

## Closure Gate

A supported Surface may be called information-complete only when its hot facts,
advertised reads and relevant visible detail paths are covered. Missing detail
must be listed here and in component coverage; it cannot be deferred merely
because the current LLM does not ask for it.
