# Current Functional Roadmap

## V3-0: Vertical Source Cutover

Implemented in source: observation, interaction, commands, receipts, direct
combat, bounded non-combat adapter, V3 MCP and strict Re default.

Exit: automated checks, Release build, safe install and exact identity.

Status: source/test/build/install complete for the current artifact; cold-load
identity remains pending.

## V3-1: Exact Runtime Canary

Cold-load the installed artifact. Verify protocol, SHA, MVID, runtime, game,
Modset and Patch. Execute at least one direct combat command and one non-combat
command. Unknown, stale and wrong-owner negatives remain fail-closed.

Status: repeatedly obtained. The latest v0.110.1 runtime
`239d883654b6414e9ab1089c0a45decb` completed a 175-decision ordinary run with
172 settled actions, two safe pre-submit stale refusals and no unknown Outcome.
The installed replacement artifact is not loaded, so evidence remains scoped
to its predecessor SHA/MVID.

## V3-2: Ordinary Journey

Run one bounded ordinary vanilla game covering combat, map, reward, shop and a
selection. Stop normally after the game returns to the main menu. Record which
families used direct V3 bindings versus the internal migration adapter.

Status: repeated, most recently on `run-20260801205605-0fqlrj` under exact
v0.110.1 identity; the run completed the game-over return and stopped at the
top-level menu after 175 decisions.

## V3-3: Native Family Migration

Replace the Provider adapter in audited waves. Combat, shop-room,
shop-inventory, map, rest, event-option, treasure-room, reward-claim,
card-reward, deck-enchant, menu/run-setup, source-discriminated generated
choices and game-over now use direct V3 resolvers in source. Remaining ordinary
selectors are next. Generated choice remains unexercised.

In parallel, replace the temporary V3-to-V2 Re semantic/action projection with
a direct V3 consumer. Main/singleplayer/character menu is exact-runtime
exercised without `/api/v2/capabilities`. Event, map and game-over now use the
same direct consumer and are exact-runtime exercised. Reward/card reward are
also exact-runtime exercised. Shop, rest, treasure and visible unsupported now
use the direct consumer in source; 17 exact recorded snapshots replay without
the sidecar, but this replacement artifact still needs cold-load evidence.
Unmigrated selector families retain the explicit sidecar.

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
