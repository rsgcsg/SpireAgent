# Current Functional Roadmap

## V3-0: Vertical Source Cutover

Implemented in source: observation, interaction, commands, receipts, direct
combat, bounded non-combat adapter, V3 MCP and strict Re default.

Exit: automated checks, Release build, safe install and exact identity.

Status: Preview.2 source/test/build/install/load was exact. Preview.3 source
and tests repair lifecycle settling and remove combat/generated consumer
sidecars; its build/install/cold-load identity is pending.

## V3-1: Exact Runtime Canary

Cold-load the installed artifact. Verify protocol, SHA, MVID, runtime, game,
Modset and Patch. Execute at least one direct combat command and one non-combat
command. Unknown, stale and wrong-owner negatives remain fail-closed.

Status: repeatedly obtained. The latest reviewed Preview.2 runtime
`b25326e8f84a49c6963fd5ce4bf7423e` produced 48 settled commands across nine
runs with no unknown Outcome. It also exposed a reproducible settling
misclassification. Preview.3 evidence does not inherit from that SHA/MVID.

## V3-2: Ordinary Journey

Run one bounded ordinary vanilla game covering combat, map, reward, shop and a
selection. Stop normally after the game returns to the main menu. Record which
families used direct V3 bindings versus the internal migration adapter.

Status: complete ordinary journeys exist for earlier exact v0.110.1 artifacts.
The latest Preview.2 batch was human-assisted and intentionally fragmented, so
it is coverage evidence rather than another unattended complete journey.

## V3-3: Native Family Migration

Replace the Provider adapter in audited waves. Combat, shop-room,
shop-inventory, map, rest, event-option, treasure-room, reward-claim,
card-reward, deck-enchant, menu/run-setup, source-discriminated generated
choices and game-over now use direct V3 resolvers in source. Remaining ordinary
selectors are next.

In parallel, replace the temporary V3-to-V2 Re semantic/action projection with
a direct V3 consumer. Main/singleplayer/character menu is exact-runtime
exercised without `/api/v2/capabilities`. Event, map, game-over, reward/card
reward, shop, rest and treasure use the same direct consumer and are
exact-runtime exercised under Preview.2. Preview.3 adds ordinary combat,
source-discriminated generated choice and lifecycle-settling; they have
automated evidence but need cold-load evidence. Unmigrated selector families
retain the explicit sidecar.

## V3-4: Visibility And Detail

V3-native state-token-bound read-only Inspection is implemented for run deck,
combat piles and shop catalog across Gateway, Re decoder/client and MCP. Its
exact-runtime evidence is pending. Next publish bounded linked detail, finish
selector-side direct consumption and implement real-page opening only as an
optional human-equivalence evidence profile. Keep semantic accessibility as
the efficient A default and remove Re's remaining V2 sidecar.

## V3-5: Authority And V2 Retirement

Expose the simplified supported/trial/quarantined/unsupported V3 policy,
validate persistent evidence lifecycle, remove v2 production mutation routes
and archive the final v2 implementation boundary.

## Later

After V3 stabilizes, resume measurable Agent evaluation and only then consider
product distribution or optional research tracks.
