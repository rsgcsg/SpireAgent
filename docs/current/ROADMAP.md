# Current Functional Roadmap

## V3-0: Vertical Source Cutover

Implemented in source: observation, interaction, commands, receipts, direct
combat, bounded non-combat adapter, V3 MCP and strict Re default.

Exit: automated checks, Release build, safe install and exact identity.

Status: Preview.4 source/build/install/load identity was exact and completed a
161-decision game with 157 completed/confirmed commands and no unknown receipt.
Preview.5 source/tests move Smith deck upgrade and merchant deck removal to
direct V3 and add bounded current-Surface card detail. Build/install/load are
tracked separately.

## V3-1: Exact Runtime Canary

Cold-load the installed artifact. Verify protocol, SHA, MVID, runtime, game,
Modset and Patch. Execute at least one direct combat command and one non-combat
command. Unknown, stale and wrong-owner negatives remain fail-closed.

Status: repeatedly obtained. The latest reviewed Preview.4 runtime
`5a57a66e318f4bdeb7167e4b719e1c3d` produced 157 completed/confirmed commands
in a complete journey with no unknown Outcome. Preview.5 does not inherit that
authority or Live evidence.

## V3-2: Ordinary Journey

Run one bounded ordinary vanilla game covering combat, map, reward, shop and a
selection. Stop normally after the game returns to the main menu. Record which
families used direct V3 bindings versus the internal migration adapter.

Status: complete ordinary journeys exist for exact v0.110.1 artifacts. The
latest Preview.4 batch contains a completed 161-decision game but has
`unrecorded` provenance, so it is reviewed coverage rather than Organic
qualification.

## V3-3: Native Family Migration

Replace the Provider adapter in audited waves. Combat, shop-room,
shop-inventory, map, rest, event-option, treasure-room, reward-claim,
card-reward, deck-enchant, menu/run-setup, source-discriminated generated
choices and game-over now use direct V3 resolvers in source. Remaining ordinary
selectors are next. Preview.4 migrated combat-hand selection; Preview.5 adds
direct Smith deck upgrade and merchant-only deck removal with separate source,
Commit and Outcome contracts.

In parallel, replace the temporary V3-to-V2 Re semantic/action projection with
a direct V3 consumer. Main/singleplayer/character menu is exact-runtime
exercised without `/api/v2/capabilities`. Event, map, game-over, reward/card
reward, shop, rest and treasure use the same direct consumer and are
exact-runtime exercised under Preview.4, including ordinary combat. Smith was
exercised only through the predecessor sidecar; its Preview.5 direct path,
merchant removal, combat-hand and known-room mount repair need exact-runtime
evidence. Unmigrated selector families retain the explicit sidecar.

## V3-4: Visibility And Detail

V3-native state-token-bound read-only Inspection is implemented for run deck,
combat piles and shop catalog. Preview.5 also implements bounded
`surface_card` linked detail across Gateway, REST, Re and MCP. Both need
exact-runtime evidence. Finish selector-side direct consumption and implement
real-page opening only as an optional human-equivalence evidence profile. Keep
semantic accessibility as the efficient A default.

## V3-5: Authority And V2 Retirement

Expose the simplified supported/trial/quarantined/unsupported V3 policy,
validate persistent evidence lifecycle, remove v2 production mutation routes
and archive the final v2 implementation boundary.

## Later

After V3 stabilizes, resume measurable Agent evaluation and only then consider
product distribution or optional research tracks.
