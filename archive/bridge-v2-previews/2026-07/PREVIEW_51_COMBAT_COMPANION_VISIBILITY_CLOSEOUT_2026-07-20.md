# Preview.51 Combat Companion Visibility Closeout

Status: exact-source audited, contract implemented, Bridge/Re tests and builds
passed, Release installed and cold-loaded, alive Osty projection verified in a
fresh ordinary strict-v2 journey. Dead/hidden-health Organic diversity remains
open.

## Defect

Natural Necrobinder run `run-20260719225440-hb3j7n` exposed a semantic
contradiction. `combat_turn` declared
`contract_complete_for_immediate_combat_turn`, yet omitted Osty's current HP
and Max HP. The UI visibly renders Osty, and cards such as Unleash calculate
damage from current Osty HP. Card text mentioning Osty cannot replace current
entity state.

## Exact Source And Visibility Boundary

Current v0.109 source establishes:

- `Player.Osty` resolves through `PlayerCombatState.GetPet<Osty>()`;
- `PlayerCombatState.Pets` is the authoritative local-player pet collection;
- `NCombatRoom.PositionPlayersAndPets` and `AddCreature` render those pets as
  player-side combat creatures;
- `Osty.IsHealthBarVisible` is true only while alive;
- `OstyCmd.Summon` creates, revives, heals, or raises the exact creature's Max
  HP, and cards consume that current state.

The protocol therefore exposes a bounded `player.companions` read projection.
It includes exact entity and definition identity, visible name, alive state,
block, and visible statuses. HP and Max HP exist only when the native health
bar is visible. It does not expose future Summon results, RNG, hidden values,
or any companion command.

## Architecture Decision

Decision: **C - add a strong typed shared combat component while preserving
independent semantic Surfaces**.

This is justified by the native generic `Pets` owner and player/pet UI layout,
not by a class-name guess. No universal pet action, Effect DSL, target policy,
or new input owner was introduced. `combat_turn` remains the sole active
Surface and all action validation/completion behavior is unchanged.

## Exact Identity

- protocol: `2.0-preview.51`
- normalized Re schema: `22`
- game: `v0.109.0|c12f634d|-840572606`
- Release/installed SHA-256:
  `1d3d1e7394cc7ebcfd909703aebfb229b9eae78ae85a33a3def03752c5310d82`
- loaded MVID: `e0e0a559-0f82-4f8c-896a-ca05975fe8b6`
- runtime: `f8991f08066044038c0a351dd9f52f14`
- Modset: `exact_bridge_only`
- Modset fingerprint:
  `4412a651dd2fe69cd9e6db337e1b3ae83e9724c79bd21bf258f5ea088641c16f`

## Runtime Evidence

Fresh ordinary Necrobinder A0 run `run-20260719230912-qnblao` recorded 30
decisions: 30 `executed_and_settled`, 30 `bridge_advertised`, no v1, failed
command, timeout, or unknown outcome. It covered two event options, two map
choices, 22 combat turns, three reward claims, and one card reward.

Current-MVID combat state exposed exact Osty entity state including `2/2` HP
and visible `Die for You`. Re normalized this into schema 22 and included it in
the real DeepSeek prompt. Decision 30 selected Unleash with a reason that
explicitly calculated `8 + 2 = 10`, directly proving strategic consumption.

This is Organic qualification for the alive companion projection on this
exact environment. A hidden/dead health-bar fixture proves omitted HP remains
accepted and contradictory HP visibility fails closed. A naturally dead and
revived Osty lifecycle remains evidence debt and is not claimed here.

## Verification

- Bridge tests: `96/96` pass.
- Re tests: `148/148` pass, including the hidden-health companion regression.
- Re typecheck and production build: pass.
- Bridge Release build: zero warnings and zero errors.
- Release and installed DLL SHA: exact match.
- Loaded protocol/MVID/runtime/game/Modset: exact match.
- Runtime artifacts remain local and are not part of the source diff.

## Permission And Rollback

The permission matrix is unchanged. `combat_turn` was already qualified; this
revision corrects its visible Context. Rollback is the preview.50 DLL and Re
schema 21. If an unknown native pet violates the health visibility contract,
Bridge Context construction fails closed rather than omitting a strategic
field while claiming completeness.
