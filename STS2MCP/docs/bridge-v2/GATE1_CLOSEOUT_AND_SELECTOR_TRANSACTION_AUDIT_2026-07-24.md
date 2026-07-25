# Gate 1 Closeout And Selector Transaction Architecture Audit

> **Superseded current-status note, 2026-07-24:** Later exact Preview.61 run
> `run-20260724045013-mgcq3a` completed the Neow's Fury play/select/confirm
> lifecycle and closed the bounded Gate 1 runtime seal. Preview.62 then moved
> reviewed exact-environment and source contracts into fail-closed embedded
> policy. Preserve the body below as the evidence-time audit; use
> [Gate 1 adaptation closeout](GATE1_ADAPTATION_AND_COMPATIBILITY_CLOSEOUT_2026-07-24.md)
> and [Current Status](CURRENT_STATUS.md) for current truth.

Status: Gate 1 engineering closeout; current source/build evidence only where
explicitly stated. This report does not grant Organic Qualification.

Repository baseline: `develop@cc19c8262d7f75787fbf68c14b0916e9ddcf2d17`.

## Executive Verdict

Gate 1 repository/source work can close under one bounded definition:

> The ordinary single-player Agent path has a v2-only mutation baseline, the
> default MCP adapter is v2-only, the Gateway v1 HTTP surface is retired, and
> unsupported variants fail closed with an operation inventory.

This is not complete-game coverage, all-visible-information closure, universal
selector support, or qualification of every canary. Crystal Sphere, manual
potion discard outside the bounded reward flow, non-standard menu/profile
flows, multiplayer, and unbound selector semantics remain unsupported or out
of scope.

The running game still loaded Preview.60 when the initial report was
finalized. The later deployment addendum below records the closed-game
Preview.61 install, exact cold-loaded identity, strict Re decode, and loaded-v1
retirement check. The bounded Neow's Fury Organic lifecycle remains the only
runtime-seal item; repository or deployment closure does not manufacture that
evidence.

The latest real stop was a valid fail-closed result, but it exposed a real
adaptability gap:

```text
run-20260723150256-d2thtq
decision-000001-mrxn4wc0-zkpy9z
combat + unsupported + authority=none
bridge.surface.combat_pile_card_selection.binding_unavailable
```

The exact visible source was `NEOWS_FURY`. Its native contract is optional
discard-to-hand selection with `min=0`, dynamic `max`, and explicit confirm.
It was not Charge, provider failure, stale state, or a generic combat failure.

Source `2.0-preview.61` closes that source contract and also changes the
consumer boundary: Re now reads a structural combat-pile transaction instead
of a compile-time union of Headbutt, Graveblast, Cleanse, Seance, Dredge, and
Charge. The Gateway still requires exact native source ownership and a
source-appropriate completion witness. This is a meaningful reduction in
content coupling, not zero-core-code adaptation.

## Evidence Levels

| Level | Meaning | Evidence used here |
|---|---|---|
| E4 | exact current-build Organic runtime | the Preview.60 stop and its complete recorded pre-state |
| E3 | exact game source/runtime binding | decompiled `NeowsFury.OnPlay`, `CardSelectCmd.FromCombatPile`, `CardSelectorPrefs`, and `NCombatPileCardSelectScreen` control flow |
| E2 | code/build/contract verification | C# contract tests, Re typecheck/tests/build, Release build, MCP tool inventory |
| E1 | architecture inference or external comparison | migration conclusions and public-project comparison |

Preview.61 has E2 evidence plus exact install/load/consumer evidence recorded
in the deployment addendum. It has no E4 Neow's Fury lifecycle and does not
inherit Preview.60's transaction qualification.

## Failure Reconstruction

The recorded state supplied unusually strong attribution:

- `surfaceKind=unsupported`, `authority=none`, and no allowed actions;
- exact diagnostic
  `combat_pile_card_selection.binding_unavailable`;
- run deck and relic preview both identified `NEOWS_FURY`;
- the card text exposed the player-visible contract: deal damage, then put up
  to two discard cards into hand;
- the selector appeared immediately at tick 1.

Exact source inspection showed:

```text
NeowsFury.OnPlay
  -> compute min(Cards, free hand slots)
  -> CardSelectCmd.FromCombatPile(Discard, min=0, max=N)
  -> await native selection
  -> CardPileCmd.Add(Hand) for each selected card
```

`CardSelectorPrefs(prompt, 0, N)` requires manual confirmation because minimum
and maximum differ. `NCombatPileCardSelectScreen` owns the selected set and
enables `%Confirm` once the current count satisfies the minimum. Therefore a
correct command contract must support:

- repeated select/deselect without mutating piles;
- confirmation with zero through `N` selected cards;
- source task completion and screen closure;
- every selected exact reference leaving discard and entering hand;
- every unselected baseline discard card remaining;
- every baseline hand card remaining.

Closing the overlay alone is not completion.

## Architecture Decision

### Retained

```text
Context + exactly one Active Surface + Stage
  + source-bound native transaction
  + opaque state-bound actions
  + execute-time revalidation
  + game-owned native continuation
  + semantic completion witness
```

The model and Re never submit pile names, effects, card definitions, or
arbitrary selection payloads. They submit only an advertised `action_id`.

### Changed

The combat-pile wire contract now describes a closed transaction:

```text
purpose
mutation_kind
commit_mode
source provenance
source/destination pile
destination position
overflow policy
replacement definition when applicable
selection bounds and current exact selected instances
```

The two stable action operations are:

```text
toggle_combat_pile_card
confirm_combat_pile_selection
```

Re validates structural consistency instead of maintaining a source-card
literal union. Adding an audited source that fits the existing closed mutation
and commit vocabulary no longer requires a new Re interface, action switch, or
prompt branch. Normalized state schema is `26`; the combat-pile guide is `v6`.

The Gateway still records exact source provenance and binds the native source
task. Existing source-specific witnesses remain because moving to hand,
moving to draw top, exhausting, and same-index replacement do not share one
business completion condition.

### Rejected

1. **One Surface/action type per card.** Safe during bootstrap but creates
   linear C#/wire/Re/prompt growth and made the Neow gap predictable.
2. **Client-supplied universal effect API.** A payload such as
   `source=discard,destination=hand,count=2` would create authority that the
   current game never advertised.
3. **UI-shape authorization.** A card grid proves selection mechanics, not
   purpose, price, parent transaction, or outcome.
4. **Immediate global selector interception as authority.** Public headless
   implementations show that a generic native selector seam gives broad
   coverage, but the current live Gateway has not yet proven parent transaction
   identity, exact environment permission, and semantic successor for every
   caller.
5. **Cosmetic patch consolidation.** Replacing seven Harmony patch classes with
   one `TargetMethods` switch would reduce file count but not new-source audit
   cost or witness obligations.

## Comparison With Public Implementations

- [Gennadiyev/STS2MCP](https://github.com/Gennadiyev/STS2MCP) demonstrates
  broad practical coverage with direct state/action endpoints. Its release
  history also records real index mismatch, soft-lock, potion discard, and
  hidden draw-order defects. These are evidence that the failures addressed by
  state-bound actions and visibility policy are real, not theoretical.
- [`wuhao21/sts2-cli`](https://github.com/wuhao21/sts2-cli) uses the native
  `CardSelectCmd.UseSelector` seam and a `TaskCompletionSource` to cover many
  choices through one mechanism. That is positive evidence for generic
  mechanics. Its headless failure notes also show pending-choice deadlocks and
  room-specific lifecycle repairs, so mechanism reuse alone is not semantic
  completion.
- [Harmony patch documentation](https://harmony.pardeike.net/articles/patching.html)
  confirms that target enumeration and patch state can reduce mechanical patch
  duplication. It does not solve game-semantic source binding or authorize a
  transaction.

The external projects support a hybrid conclusion: generalize native choice
mechanics aggressively, but keep mutation authority and outcome truth in the
Gateway's exact transaction contract.

## V1 Retirement Result

The previous repository claim was too broad. Before this closeout:

- Re had no v1 mutation transport;
- Gateway v1 POST was disabled only by default and could be re-enabled locally;
- the default Python MCP server still advertised dozens of v1 index mutation
  tools.

The first implementation pass retired mutation but intended to retain v1 GET
as diagnostics. Dependency review disproved that assumption:

- `BuildTreasureState` called `ForceClick()` while serving a state read;
- the fake-merchant state builder could also click the merchant control;
- therefore the old v1 GET surface was not a trustworthy read-only boundary.

After the corrected closeout:

- Gateway returns `410 Gone` for every `/api/v1` route;
- the `enable_legacy_v1_mutations` configuration escape hatch is removed;
- the default MCP adapter exposes only eight Bridge v2 tools: capabilities,
  state, three Inspections, coherent observation bundle, opaque submit, and
  command poll;
- Re remains v2-only;
- old v1 state/action/multiplayer/profile/wiki/compendium code and raw API
  references are archived under `archive/legacy-connector-v1/` and excluded
  from the active C# build;
- the machine-checked operation inventory validates the archived 27-action
  mapping, v2 manifest coverage, active-source absence, and default MCP route
  absence.

## Verification At Closeout

The final source tree passed:

| Check | Result |
|---|---|
| Re typecheck/tests/build | pass; 13 files and 170 tests |
| C# Release tests | pass; 122 tests |
| exact-game Release build | pass; zero warnings/errors |
| built/installed/loaded Gateway SHA | `9b6f62161f8c6c286a73cb157430b441014c5148ff702ea96894e6f702386a99` |
| Python syntax and lock | pass |
| default MCP tool inventory | exactly 8 Bridge v2 tools |
| operation-retirement inventory | pass; 27 historical actions accounted for |
| active Markdown links | pass; archive excluded as non-canonical |

A later closed-game install and Steam cold start loaded Preview.61 SHA
`9b6f62161f8c6c286a73cb157430b441014c5148ff702ea96894e6f702386a99`,
MVID `efd31a31-9c2a-4b68-ae22-1cabc1b382f1`, and runtime
`7e6ffb41d8154625bd42ea34190194ef` under the exact Bridge-only Modset. Re
strictly negotiated and decoded that identity, and live `/api/v1` root/child
checks returned `410 Gone`. This closes deployment and runtime v1-retirement
evidence; it does not provide the still-missing Organic Neow's Fury lifecycle.

## Gate 1 Exit Matrix

| Criterion | Result |
|---|---|
| exact state-bound v2 action path | pass |
| Re mutation path v2-only | pass |
| default MCP mutation path v2-only | pass |
| Gateway v1 namespace absent from active source/build | pass |
| Gateway v1 namespace absent from currently loaded runtime | pass; Preview.61 returns `410 Gone` for v1 root and child paths |
| unknown/unbound variants fail closed | pass |
| ordinary single-player operation inventory | pass, with explicit unsupported/out-of-scope rows |
| latest Neow source contract implemented | pass at E2 |
| Preview.61 installed/loaded identity | pass; exact SHA/MVID/runtime/Modset recorded |
| Neow select/deselect/zero-confirm/batch Organic lifecycle | not yet obtained |
| complete-game and full visibility closure | not a Gate 1 claim |

Gate 1 repository closure is therefore an engineering/governance closure, not
a statement that every canary is qualified. The missing Neow Organic journey
is the remaining Gate 1 runtime seal; Gate 2 may design read-only work but must
not expand runtime permission before that seal.

## Remaining Architecture Debt

1. **Gateway source catalog remains hand-written.** Re no longer changes per
   source, but a new source still needs exact binding, semantics, permission,
   and witness work in C#.
2. **No first-class transaction-correlation record.** Parent native task,
   mechanism session, selected operands, commit phase, and outstanding
   obligations are not yet one inspectable record.
3. **No non-authorizing holdout detector.** A structurally familiar unknown
   selector currently fails closed without reporting whether it could have fit
   an existing closed transaction grammar.
4. **Witness code has repeated reference-set primitives.** Extract only after
   a typed, non-executable witness vocabulary is proven across several
   families; do not create an Effect DSL.
5. **Preview.61 lacks Neow Organic evidence.** Installation, loading,
   compilation, and fixtures cannot qualify that transaction.

## Next Engineering Order

1. Reproduce a bounded Neow's Fury lifecycle under the recorded Preview.61
   identity:
   select, deselect, confirm zero if naturally available, and confirm a nonzero
   batch. Verify exact discard/hand post-state through Bridge/Re evidence.
2. Begin Gate 2 with a non-authorizing transaction-correlation shadow:
   native owner/task, mechanism, exact operands, phase, closed mutation
   fingerprint, and witness obligations. Unknown sources remain actionless.
3. Run holdout analysis against a new source. Success means no Re/wire change
   and no new action operation; it does not mean automatic permission.

## Rollback

The selector migration is protocol-breaking by design and isolated to
Preview.61. Roll back the Preview.61 C#/Re contract together; never run a
Preview.60 consumer against Preview.61. V1 retirement is independent and
should not be rolled back to diagnose selector failures. Unknown outcomes
remain terminal and must not be retried.
