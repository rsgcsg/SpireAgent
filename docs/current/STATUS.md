# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/` is the active Agent implementation.
- **Connector:** `STS2MCP/` is the active Live Semantic Gateway, REST
  connector, and optional MCP adapter.
- **Legacy:** the original root runtime and P8--P15 roadmap are retired and
  archived. They are not active workstreams.

## Current Gate

**Gate 0 is closed; Gate 1 connector reliability and operation-level migration
is active.** C# and Re share `2.0-preview.59`. Re is v2-only; Gateway v1
mutations are disabled by default while v1 reads remain explicit compatibility
diagnostics. Historical Gate 0 evidence remains scoped to its exact artifact.
The current preview has its own bounded mutation evidence and does not inherit
qualification from an older SHA/MVID.

The [cross-component program plan](PROGRAM_PLAN.md) preserves Gate 1 as the
only current delivery priority. Internal development/evaluation (`D`) and the
official frozen RE-P1 Agent baseline (`A`) now have explicit ownership, but
neither changes current runtime authority. Future Companion, learning,
Headless, and post-training work remains gated.

## Immediate Next Step

`2.0-preview.59` is built and was cold-start loaded as SHA
`afbcc870...17423`, MVID `49d2408c-7a43-4669-b37d-6c8f33308c48`, runtime
`844706b0442e443db974f156103d7a00`, under the exact bridge-only Modset.
Runs `run-20260723105904-z3sy3r` and
`run-20260723105825-69ohhl` exposed the missing exact Seance source contract;
`run-20260723110000-1z5jqy` exposed Forbidden Grimoire's distinct post-combat
`CardRemovalReward` child. Preview.58 now gives Seance its exact
draw-pile-to-same-index-`Soul` contract and gives `CardRemovalReward` the
independent `reward_deck_removal_selection` Surface.

A bounded current-build Re canary completed reward claim, exact-card selection,
preview, confirmation, semantic command completion, coherent successor reward
state, and a `run_deck` post-state with the exact selected card absent. This is
current-build canary evidence, not broad deck-removal qualification. The same
run set also proves Cleanse completed its exact draw-to-exhaust child under the
prior loaded preview.57 identity. Seance is compiled, tested, installed, loaded,
and explicitly canary-scoped but still lacks a current-artifact Organic
lifecycle; Precise Scissors also remains Organic-pending.

Run `run-20260723113740-hafl26` then exposed exact Dredge as another source,
not a generic selector. Preview.59 keeps the same combat-pile Surface but gives
Dredge a bounded one-to-three toggle operation, separate intermediate-selection
completion, and exact batch-to-hand completion. A current-build Re canary
selected, deselected, then selected three cards; the exact references moved
from discard to hand and the child returned to `combat_turn`. Dredge remains
source-scoped canary-only. See the
[Dredge closeout](../../STS2MCP/docs/bridge-v2/GATE1_DREDGE_CLOSEOUT_2026-07-23.md)
and the
[Seance and reward-removal closeout](../../STS2MCP/docs/bridge-v2/GATE1_SEANCE_AND_REWARD_REMOVAL_CLOSEOUT_2026-07-23.md).

Run the still-missing Seance and Precise Scissors bounded natural lifecycles
next, then continue until the next real unsupported source. Every other
unbound selector source remains fail closed.

The same run set exposed a Re bounded-run hygiene defect: an unchanged,
non-actionable `event_option` state could consume the whole tick budget while
neither invoking the model nor executing an action. Re now stops after eight
identical coherent non-actionable observations and records a
`repeated_non_actionable_state` guard. This does not classify the underlying
event as supported and does not retry or alter Gateway authority.

Then continue the resumed exact-identity Gate 1 journey from its current event/map
path until the next real unsupported or fail-closed semantic variant. The first gap,
Wood Carvings Bird/Torus deterministic starter replacement, is now a
source-bound `preview.56` canary with a complete Bird select/cancel/reselect/
confirm/run-deck Organic lifecycle. It remains canary-only. The current journey
also closed a Re settlement defect where a transient unknown successor after
Embark was misclassified as settled, plus a cold-load timeout where
`continue_run` incorrectly used the ordinary settlement budget. The final
artifact is loaded, but its prior Wood Carvings Organic evidence is not
transferred across SHA/MVID. Use the
[operation inventory](../../STS2MCP/docs/bridge-v2/GATE1_OPERATION_AND_JOURNEY_INVENTORY.md)
to distinguish v2 purpose splits from real fail-closed gaps. Do not infer
qualification from implementation or widen scoped permissions without current
exact-build evidence.

Fresh Re runs also repaired an impossible Headbutt/Graveblast completion
invariant, inconsistent shop Inspection advertisement, and raw power
localization templates. Final-artifact Organic runs completed Headbutt draw-top
three times and Graveblast hand selection twice with exact-card completion
witnesses. The contract remains canary-only. See the
[defect closeout](../../STS2MCP/docs/bridge-v2/GATE1_REAL_RUN_DEFECT_CLOSEOUT_2026-07-22.md).

A read-only cross-component visibility audit found no new action-authority
defect and changed no runtime status. It found that Re currently sends the
complete normalized evidence state to the model, eagerly reads all advertised
Inspections, and duplicates some Inspection/action representations. A read-only
Prompt audit plus deterministic `shadowStrategyProjection` v1 now measure that
structure from recorded artifacts: the latest local five-run sample reduced
median serialized Prompt bytes from `37,274` to `21,182`. This is not paired
provider evidence and has not changed the live Prompt, lazy Inspection policy,
or model detail-request behavior. Four first provider-shadow pairs were all
valid JSON but had only two action agreements, including strategic reward/card
selection disagreements. Repeat baselines then showed stable full-vs-shadow
reward divergence and added card-reward shadow variation, so the generic v1
projection is rejected as a cross-Surface candidate. The next investigation,
if justified, is a single low-risk scope with protected semantic review; it is
not more blind provider sampling. See the
[visibility audit](audits/VISIBILITY_AND_OBSERVATION_ARCHITECTURE_AUDIT_2026-07-22.md).

Re also now anchors `.env.local` loading and the default `AGENT_DATA_DIR` to
`Re-SpireAgent/`, eliminating caller-working-directory-dependent evidence roots.
Existing root-level local artifacts are not migrated or reclassified automatically.

## Explicit Non-Claims

- Bridge v2 is not yet complete-game coverage or full v1 retirement.
- Historical previews do not qualify the current checkout or another game/Mod
  environment.
- The Companion, consumer Workshop product, BYOK secret store, Agent SDK,
  plugin platform, and Headless host are designs only, not implementations.
