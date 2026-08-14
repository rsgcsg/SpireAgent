# Workflow C Preview.76 New Leaf And Unsupported Authority Closeout

**Status:** source/test/Release build/install complete; cold-load and exact-runtime evidence pending

## Baseline

```text
branch                 develop
source HEAD             7cd6deaa95b3252631ff5396ff34196564559bd0
source worktree         clean before this slice
previous loaded wire    2.0-preview.75
previous loaded SHA     f9819b6b24ed71245cee711a2844c32fa2c1b666fce6b3f412f1bd71efc721ee
previous loaded MVID    34d6deb3-f4b7-43bf-89ad-a9e596380410
previous runtime        7f72d0879cde4ad6b37ab097a6ed5c98
game                    v0.109.1|c8c577f6|-820620422
modset                  exact_bridge_only
new source wire         2.0-preview.76
new Re schema           31
new built/installed SHA 56b24ea36a9ad95f15414cd7882ab2b6b32b9459aa47feb204d3290569de9003
new built/installed MVID 37f4ce07-1ca7-4942-aec9-868b7d7d4676
rollback                STS2MCP/.local/deployments/2026-07-29T13-33-27-964Z
```

The fixed `globalPrompt.ts` and `stateGuides.ts` baseline was not changed.
The three runs below used clean Agent source revision `7cd6deaa...` and the
same loaded Preview.75 Gateway identity.

## Runtime Facts And Attribution

| Run | Result | Exact finding | Attribution |
|---|---|---|---|
| `run-20260729123227-o2htaa` | stopped at decision 5 | Neow `New Leaf` completed its parent option command, then opened native `NDeckTransformSelectScreen`; Gateway returned typed unsupported | Gateway source-binding gap |
| `run-20260729123734-wtdpib` | completed run boundary | 77 of 77 attempted mutations settled | bounded C/Re positive coverage |
| `run-20260729124247-l1hwck` | completed run boundary | 92 of 92 attempted mutations settled | bounded C/Re positive coverage |

The New Leaf command receipt was `completed/confirmed`, successor state
`state_a40935a96c_9`, with evidence
`event_option_replaced_or_required_subsurface_opened`. Re then timed out its
actionable-successor checkpoint because the child was unsupported. This was
not a provider parse error, Prompt strategy error, stale action, unknown
mutation, or environment mismatch.

The unsupported state also exposed a separate invariant defect: the provider
draft had no actions but retained default `bridge_owned` handoff. Re correctly
rejected it because an unsupported Surface must be `none_fail_closed`.

Neither ordinary shop Kifuda nor a New Leaf child mutation occurred after the
fix. Kifuda is therefore `not exercised`; New Leaf Preview.76 mutation is
`pending exact-runtime evidence`.

## Exact Game-Source Audit

The v0.109.1 assembly shows:

- `NewLeaf.AfterObtained` calls
  `CardSelectCmd.FromDeckForTransformation(..., 1, ...)`, then invokes
  `CardCmd.TransformToRandom` for each exact selected card.
- `WhisperingHollow.Hug` uses the same native selector mechanics, but owns a
  different parent event and continuation.
- `CardSelectCmd.FromDeckForTransformation` supplies exact transformable deck
  instances and opens `NDeckTransformSelectScreen`.
- the screen alone does not identify its caller; prompt text, relic ownership,
  or UI shape is insufficient source authority.

This is evidence for shared non-authorizing selector mechanics plus separate
typed source contracts. It is not evidence for a universal selector or a
generic transform transaction.

## Architecture Verdict

ADR-0005 and the Semantic Gateway two-plane target remain valid. The failure
was local family debt: `deck_transform_selection` encoded one audited caller
as if it were the whole family. Preview.76 makes the caller explicit:

```text
shared native transform mechanics
  + whispering_hollow_event source contract
  + new_leaf_relic_pickup task-local source contract
  + exact card operands
  + execute-time source revalidation
  + source-local settlement and exact deck-delta witness
```

New Leaf uses a task-local Harmony scope around `AfterObtained`. It records the
exact relic owner and baseline deck while the native task is active, then
removes the binding in `finally`. Zero or multiple source contracts fail
closed. Whispering Hollow continues to use its exact active event owner.

All unsupported provider drafts are now normalized centrally before action
publication: actions are cleared and authority is forced to
`none_fail_closed`. This removes a repeated provider-by-provider safety
assumption without adding a second authority path.

## Contract And Evidence Boundary

- wire `DeckTransformSelectionSurface` now requires typed `source`;
- Re schema 31 preserves that source in normalized state;
- publication and execution share the same source predicate;
- New Leaf confirmation waits for source-task settlement, selector closure,
  absence of every exact selected original, and preserved deck count;
- random preview remains presentation only and never exposes committed RNG;
- the manifest source identity names both exact callers, but the family remains
  a manifest fallback rather than a durable explicit contract;
- no permission tier, persistent claim, qualification, wildcard scope, Prompt,
  or Re completion authority was added.

## Verification And Non-Claims

Source verification includes 197 C# tests, 212 Re tests, Re typecheck/build,
exact-game Release compilation, protocol/schema checks, repository checks and
the non-authorizing compatibility/binding audits. Built and installed SHA/MVID
match. The game is closed, so loaded SHA/MVID/runtime are explicit non-claims.

This slice does **not** claim:

- exact-runtime Preview.76 load until the game is restarted;
- a New Leaf selection/preview/confirm lifecycle;
- Kifuda evidence or first-pilot closure;
- transform-family durable qualification;
- complete random-transform caller coverage;
- Organic provenance from the three unrecorded runs.

## Next Exact-Runtime Gate

Cold-load the installed Preview.76 identity and run the ordinary Agent entry.
If New Leaf naturally appears, require source `new_leaf_relic_pickup`, exact
selection actions, confirmed native transform, successor deck delta and no
authority diagnostic. If it does not appear, retain `not exercised`; do not
manufacture the encounter. Kifuda remains an independent natural-evidence
gate for the shop/enchantment pilot.
