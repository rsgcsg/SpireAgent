# Current Functional Roadmap

## V3-0: Vertical Source Cutover

Implemented in source: observation, interaction, commands, receipts, direct
combat, bounded non-combat adapter, V3 MCP and strict Re default.

Exit: automated checks, Release build, safe install and exact identity.

## V3-1: Exact Runtime Canary

Cold-load the installed artifact. Verify protocol, SHA, MVID, runtime, game,
Modset and Patch. Execute at least one direct combat command and one non-combat
command. Unknown, stale and wrong-owner negatives remain fail-closed.

Status: obtained for the first V3 artifact, repeated on exact STS2 `v0.110.0`,
and cold-loaded on v0.110.1 as runtime
`98b52677796c4e6aa103c404a6952789`. The current runtime has one settled
main-menu command. Direct combat Outcome repairs, reward-native paths and the
card-reward-native path still require operation-specific canaries; static
compatibility alone remains non-authorizing.

## V3-2: Ordinary Journey

Run one bounded ordinary vanilla game covering combat, map, reward, shop and a
selection. Stop normally after the game returns to the main menu. Record which
families used direct V3 bindings versus the internal migration adapter.

Status: completed on `run-20260731040632-00yz1g` under exact v0.110.0 runtime
identity. The run proves one-game V3 composition for exercised families, not
the repaired artifact or unexercised families.

## V3-3: Native Family Migration

Replace the Provider adapter in audited waves. Combat, shop-room,
shop-inventory, map, rest, event-option, treasure-room, reward-claim,
card-reward and deck-enchant execution now use direct V3 resolvers. Menu,
generated choices and remaining selectors are next. Delete each replaced
execution path; do not retain dual authority.

In parallel, replace the temporary V3-to-V2 Re semantic/action projection with
a direct V3 consumer. The shop partial-authority failure proves that extending
V2's fact-to-action parity rules is the wrong permanent adaptation mechanism.

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
