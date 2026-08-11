# Human Information Closure

Human Information Closure means every normal-player information path for a
supported interaction is either reachable through C or explicitly classified.
It does not mean exposing hidden game state or opening UI pages in the normal
Agent loop.

## Implemented

| Information | Access | Authority |
|---|---|---|
| run/player persistent summary | hot observation | none |
| complete current interaction content | hot observation | none |
| visible entities and controls | referents | none |
| observed enabled/selected/focused state | referent state when directly known | none |
| run deck | state-bound `run_deck` read | none |
| draw/discard/exhaust piles | state-bound `combat_piles` read | none |
| current shop inventory | state-bound `shop_catalog` read | none |
| current card detail | state-bound `surface_card` read | none |

Every read is advertised by the current snapshot, runtime/environment coherent,
read-only and rejected when stale. A consumer may read lazily or aggregate reads
downstream without changing C truth.

## Optional Human-Equivalence Evidence Profile

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

Its source contract and tests exist; the new artifact still needs cold-load and
Live evidence. The profile is evidence tooling, not the normal consumer path.

## Partial Or Unsupported

- Focus is projected only when the Host directly observes it.
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
