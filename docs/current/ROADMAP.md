# Current Functional Roadmap

## V3-0: Vertical Source Cutover

Implemented in source: observation, interaction, commands, receipts, direct
combat, bounded non-combat adapter, V3 MCP and strict Re default.

Exit: automated checks, Release build, safe install and exact identity.

## V3-1: Exact Runtime Canary

Cold-load the installed artifact. Verify protocol, SHA, MVID, runtime, game,
Modset and Patch. Execute at least one direct combat command and one non-combat
command. Unknown, stale and wrong-owner negatives remain fail-closed.

Status: repeatedly obtained. The latest v0.110.1 runtime
`45acb4ff11084865939a102e9bd256a0` completed 93 submitted commands across an
ordinary run with no unknown Outcome. Evidence remains operation- and
artifact-scoped.

## V3-2: Ordinary Journey

Run one bounded ordinary vanilla game covering combat, map, reward, shop and a
selection. Stop normally after the game returns to the main menu. Record which
families used direct V3 bindings versus the internal migration adapter.

Status: repeated on `run-20260801120346-xy7y0d` under exact v0.110.1 identity;
the run completed the game-over return and stopped at the top-level menu after
95 decisions.

## V3-3: Native Family Migration

Replace the Provider adapter in audited waves. Combat, shop-room,
shop-inventory, map, rest, event-option, treasure-room, reward-claim,
card-reward, deck-enchant, menu/run-setup, source-discriminated generated
choices and game-over now use direct V3 resolvers in source. Remaining ordinary
selectors are next. Generated choice and the new game-over resolver require a
new cold-load canary.

In parallel, replace the temporary V3-to-V2 Re semantic/action projection with
a direct V3 consumer. Main/singleplayer/character menu is exact-runtime
exercised without `/api/v2/capabilities`. Event, map and game-over now use the
same direct consumer in source and pass saved-snapshot replay; remaining
families still use the explicit sidecar.

## V3-4: Visibility And Detail

Publish V3-native hover, linked detail and read-only Inspection with explicit
availability/staleness. Keep semantic accessibility as the efficient A default;
reserve real-page-opening behavior for an optional evidence profile. Remove
Re's v2 capabilities projection sidecar.

## V3-5: Authority And V2 Retirement

Expose the simplified supported/trial/quarantined/unsupported V3 policy,
validate persistent evidence lifecycle, remove v2 production mutation routes
and archive the final v2 implementation boundary.

## Later

After V3 stabilizes, resume measurable Agent evaluation and only then consider
product distribution or optional research tracks.
