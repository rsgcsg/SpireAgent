# Current Functional Roadmap

## V3-0: Vertical Source Cutover

Implemented in source: observation, interaction, commands, receipts, direct
combat, bounded non-combat adapter, V3 MCP and strict Re default.

Exit: automated checks, Release build, safe install and exact identity.

Status: Preview.3 source/test/build/install/load was exact and completed one
118-decision game. Preview.4 source/tests/build/install repair a bounded
known-room mount gap and remove the combat-hand sidecar/Provider execution
path. Preview.4 cold-load identity is pending.

## V3-1: Exact Runtime Canary

Cold-load the installed artifact. Verify protocol, SHA, MVID, runtime, game,
Modset and Patch. Execute at least one direct combat command and one non-combat
command. Unknown, stale and wrong-owner negatives remain fail-closed.

Status: repeatedly obtained. The latest reviewed Preview.3 runtime
`028362bff531495caa375aca0c62eb75` produced 172 completed/confirmed commands
across three runs with no unknown Outcome. Preview.4 evidence does not inherit
from that SHA/MVID.

## V3-2: Ordinary Journey

Run one bounded ordinary vanilla game covering combat, map, reward, shop and a
selection. Stop normally after the game returns to the main menu. Record which
families used direct V3 bindings versus the internal migration adapter.

Status: complete ordinary journeys exist for exact v0.110.1 artifacts. The
latest Preview.3 batch contains a completed 118-decision game but has
`unrecorded` provenance, so it is reviewed coverage rather than Organic
qualification.

## V3-3: Native Family Migration

Replace the Provider adapter in audited waves. Combat, shop-room,
shop-inventory, map, rest, event-option, treasure-room, reward-claim,
card-reward, deck-enchant, menu/run-setup, source-discriminated generated
choices and game-over now use direct V3 resolvers in source. Remaining ordinary
selectors are next. Preview.4 also migrates combat-hand selection to exact
typed discovery, native execution and direct Re consumption.

In parallel, replace the temporary V3-to-V2 Re semantic/action projection with
a direct V3 consumer. Main/singleplayer/character menu is exact-runtime
exercised without `/api/v2/capabilities`. Event, map, game-over, reward/card
reward, shop, rest and treasure use the same direct consumer and are
exact-runtime exercised under Preview.3, including ordinary combat and a
source-discriminated generated choice. Combat-hand direct consumption and the
known-room mount repair need Preview.4 cold-load evidence. Unmigrated selector
families retain the explicit sidecar.

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
