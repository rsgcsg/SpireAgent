# Gate 1 Quasar, Knowledge Demon, And Charge Closeout

Status: `2.0-preview.60` source and contract tests complete; Release installed,
cold-start loaded, and strict Re read compatibility confirmed. The three new
lifecycles are not Organic-qualified. All new operations remain exact-source
canaries.

## Real Failure Evidence

Two real Re runs stopped safely with no action authority:

| Run / decision | Diagnostic | Source conclusion |
|---|---|---|
| `run-20260723132513-103o5y` / `decision-000042-mrxjpon8-coui5z` | `bridge.surface.generated_card_choice.binding_unavailable` | Knowledge Demon `CurseOfKnowledgeMove -> ChooseCurse`; the preceding state was an enemy turn, so this was not player card Charge |
| `run-20260723133555-rma1g2` / `decision-000098-mrxk6t9b-wekhhh` | same | exact Quasar; the preceding confirmed player action was `Play Quasar` |

Both observations were `combat + unsupported + none_fail_closed` with zero
advertised actions. This was correct fail-closed behavior for Preview.59, but
it blocked the real journey because the exact sources were not modeled.

Charge did not cause either recorded stop. It was audited and implemented in
the same repair because its exact source and child lifecycle were available and
the user had independently identified it as a likely blocker. It must not be
described as real failure evidence until an actual Charge child is recorded.

## Exact Source Semantics

- `Quasar.OnPlay` presents exactly three transient colorless cards, allows
  skip, upgrades the offers only when Quasar is upgraded, and adds the selected
  card to combat hand. It does not apply the potion/Splash
  `free_this_turn` modifier. Full-hand overflow follows native generated-card
  movement to discard.
- Knowledge Demon's `ChooseCurse` presents two temporary
  `KnowledgeDemon.IChoosable` cards, does not allow skip, and immediately runs
  the selected effect. It does not add the selected card to hand.
- `Charge.OnPlay` asks for exactly two draw-pile cards and transforms each into
  a new `MinionDiveBomb` at the same pile index. Upgraded Charge upgrades the
  replacements.

## Architecture Decision

Decision: **C, shared strongly typed mechanics with independent semantic
branches**.

Quasar and Knowledge Demon reuse the bounded generated-card grid mechanics,
but keep distinct source bindings, purposes, skip policies, destinations,
operations, and outcome witnesses. Charge reuses bounded combat-pile selection
mechanics, but has exact-two cardinality and a same-index replacement witness.

Rejected:

- a universal generated-card selector, because immediate-effect and
  hand-destination choices have different commits and completion truth;
- a universal pile selector or transform DSL, because Charge's exact-two
  replacement topology does not authorize Cleanse, Seance, Dredge, or unknown
  callers;
- localized prompt text or screen class as source authority.

This keeps update adaptation local: a new caller can reuse mechanics only after
its exact source, visible semantics, legality, commit, and completion are
audited.

## Verification Completed

- C# Release build: passed.
- C# contract tests: `121/121` passed.
- Re typecheck: passed.
- Re tests: `169/169` passed.
- Strict C#/Re protocol agreement: `2.0-preview.60`.
- Installed/loaded SHA:
  `49e403b7fb953121256e13f96edbe1eb435a03ce8eac9ddfb17dff473b81d996`.
- Loaded MVID: `1219fb20-6db0-4b97-a754-57695e2585f8`.
- Runtime identity: `ec2901d029a241e08831fdece0691a2d`.
- Re read-only inspect negotiated that identity and decoded an actionable
  `menu + main_menu` state without contract diagnostics.

The C# test process required local ignored copies of game dependencies in its
build output because production references use `Private=false`. This is test
environment setup, not repository content or Organic evidence.

## Remaining Evidence

Before any qualification claim:

1. exercise bounded Quasar selection and skip where naturally available;
2. exercise Knowledge Demon forced selection and verify the exact chosen Power
   increase;
3. exercise Charge intermediate first selection and final exact-two same-index
   transformation;
4. confirm Re decodes and settles each command without v1 fallback or unknown
   retry.

Compilation, fixtures, and these historical failure runs do not qualify the
new artifact.
