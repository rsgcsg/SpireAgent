# Bridge v2 Architecture Review: Authority, Visibility, And Compatibility

Date: 2026-07-19  
Repository baseline: `develop@0317fecc47cf9e7da39f438addad46202af095ff`  
Implemented review build: `2.0-preview.47`

This review treats the three external architecture notes as question sets and
proposals, not authority. Exact v0.109 source, real UI behavior, current loaded
identity, and runtime evidence override every recommendation below.

## Executive Verdict

The bounded semantic-Surface model should be retained. It has genuinely solved
v1's most dangerous failures: low-level client commands, mutable indices,
mixed input ownership, stale execution, HTTP-acceptance-as-success, and
Inspection/action confusion.

It is not the final internal architecture. Current Providers still combine too
many responsibilities, current permission is too coarse, player-visible
closure is incomplete, evidence provenance was absent, and exact-environment
Surface lists cannot safely express same-UI/different-transaction cases.

The selected direction is:

```text
Stable wire boundary:
  Shared State + Context + exactly one Active Surface + Stage + Authority

Internal proof composition:
  Mechanism + semantic binding + semantic contract + shared validator
  + game-owned commit + transaction witness + visibility contract

Independent governance:
  exact environment + contract instance + operation + evidence stage
  + explicit authority policy
```

Preview.47 deliberately implements only non-authorizing foundations. It does
not introduce automatic compatibility or provisional execution.

## Runtime Evidence Reviewed

The following local runs were produced on preview.46 MVID
`9e6124ca-0082-451a-adb3-54b692a85d33`. Their metadata has no provenance field,
so they are valid current-MVID coverage/debug evidence but cannot alone qualify
a contract as Organic:

| Run | Useful evidence | Correct interpretation |
|---|---|---|
| `run-20260718211912-nevzqn` | 53 ticks across combat/reward/map/rest/shop/treasure; Orrery purchase timed out while linked rewards opened | completion witness defect, not a failed purchase |
| `run-20260719132530-e1lop6` | 40 ticks; reward Proceed reached a valid intermediate state | intermediate-transition observer defect |
| `run-20260719132818-o1p2j0` | Pael's Tooth opened a five-card deck selector | real unsupported semantic transaction; fail-closed was correct |
| `run-20260719132848-2uxd6w` | 99 settled actions plus one run-deck stale read | eager sidecar composition defect |
| `run-20260719133514-chdrhb` | 96 settled actions plus two pre-execution stale guards | broad current-MVID coverage; stale guards were safe non-execution |

Preview.47 MVID `eb96741b-42ce-43e1-86b3-6d71a1caea4e` then confirmed
`continue_run` at the Bridge command layer. Re initially recorded it as
`executed_unsettled` only because the new non-authorizing shadow contract
omitted nullable fields in an intermediate state and the client decoder treated
them as required. That decoder defect was fixed without changing the command or
authority contract.

That MVID is intermediate preview.47 evidence. Final loaded MVID
`784bbdc5-e7b3-40e7-872f-3c8ba538f9b0` separately settled Continue and a
bounded 40-decision operator-positioned strict-v2 journey with 39 settled
actions and one safe stale non-execution. All decisions retained coherent
observation and non-authorizing shadow semantics. No command evidence or
authority qualification is transferred between MVIDs, and the new run does not
automatically promote any operation.

## Answers To The Core Architecture Questions

| Question | Current answer |
|---|---|
| What must be proved before an action? | Business operation, unique owner, exact operands, complete action-critical visibility, shared legality, known game commit, transaction boundary, and usable semantic witness. |
| Is origin always required? | No. Origin is one proof channel. Task-, command-, or transaction-bound evidence may be stronger, but a machine verifier is always required. |
| Can a known UI directly adapt? | It may gain observation if its visibility contract matches. It gains no execution merely from UI/shape/class similarity. |
| What is the qualification unit? | Eventually operation + contract instance + environment/evidence scope. Current runtime still authorizes by exact environment + Surface kind. |
| Can one confirmed action qualify a contract? | No. It proves only that action's witness in that environment. |
| Can new builds or native-UI Mods inherit permission? | No. They may reuse contracts and obtain a lower, independently evaluated tier, but old qualification never transfers. |
| Should Surface be split into low-level parts? | No on the wire. Internally, repeated proof responsibilities should be typed and reusable. |
| Can witness primitives be shared? | Yes for read-only observations; no as an executable effect language. |
| What should Re display independently? | Observation completeness, semantic binding, authority tier, evidence stage, and command outcome. Preview.47 exposes only the first and a non-authorizing shadow of the others. |
| How is non-regression proved? | Old/new shadow comparison must preserve or narrow actions, entity bindings, legality, commit, witness strength, hidden-information boundary, and failure behavior. |

## Player-Visible Information Architecture

The information note's layered model is accepted with two corrections.

First, linked detail is not automatically a separate network request. Small,
stable card/relic/keyword detail may remain embedded. A reference is useful only
when it reduces real duplication without creating identity drift.
Preview.47 therefore leaves `linked_detail_kinds` empty and explicitly reports
that its catalog is not implemented; embedded detail is not mislabeled as a
separately requestable contract.

Second, an Inspection being available does not make its result strategically
mandatory. The client may use eager mode for audits, deterministic adaptive
requests for known decision needs, and later bounded model requests. Action
operands and legality-critical facts must never be optional.

The closure is:

```text
default shared/context/surface facts
+ declared linked details
+ current typed inspection catalog
+ explicit missing fields
+ explicit hidden-by-policy fields
```

Preview.47 adds the catalog and coherent bundle. It does not claim closure is
complete: only `run_deck` and `combat_piles` are implemented Inspection kinds,
and hover/detail families, map inspection, menu/history, linked rewards, and
special UI variants remain partial.

## Authority And Compatibility Judgment

The proposed four-axis model is directionally correct:

1. observation completeness;
2. semantic binding basis;
3. execution authority tier;
4. evidence stage.

However, automatic `provisional_execute` is rejected for now. The proposal
underestimates how hard it is to prove complete transaction domains and patch
impact. Preview.47's shadow inventory exposes the migration gap but cannot
authorize. A future provisional tier requires operation-level runtime binding,
negative composition tests, mutation-domain coverage, explicit budget and
revocation, and current-environment canary evidence.

Unknown builds should eventually retain safely constructible partial/complete
observation instead of globally disappearing. That change must be per contract
and must never retain actions when any execution-critical proof is unknown.

## Concrete Evidence Against Universal Abstractions

- Merchant removal, enchantment, Smith, Whispering Hollow transform, and
  Pael's Tooth can all show deck cards. Their eligibility, cardinality, commit,
  side effects, and witnesses differ.
- Orrery purchase proves a shop purchase may own a linked reward transaction.
  A universal purchase completion of `gold delta + offer gone` is incomplete.
- Headbutt and other combat pile selectors share controls but not purpose.
- Generated choices from Lead Paperweight and Colorless Potion share one
  mechanism while destination, cost, overflow, and completion differ.

The correct reuse level is typed internal mechanics plus purpose-specific
semantic contracts, not a generic executable selector or effect graph.

## Current Completeness And v1 Retirement

Preview.47 improves architecture integrity but does not materially increase
Surface count. The prior broad maturity estimates remain honest:

| Area | Current estimate |
|---|---:|
| authority/stale-state/command-lifecycle safety kernel | 85-92% |
| major ordinary in-run interaction families | 65-78% |
| practical v1 interaction parity | 55-68% |
| normal single-player player-visible semantic closure | 35-50% |
| operation-level compatibility/authority architecture | 15-25% |

These are engineering ranges, not metrics. v2 still lacks full purpose-specific
deck maintenance, linked rewards, multiple selector origins, full menu/history,
all hover/preview families, broad special-event/reward/map/shop variants, and
operation-level authority. v1 `local_reconstruction` remains a visible
compatibility layer for explicit legacy-owned states and must be retired by
family, not deleted wholesale.

## Architecture Risks

1. **Registry displacement:** splitting one Provider into many manifests can
   merely move hardcoding. Catalog entries need runtime proof and negative tests.
2. **False completeness:** a `partial_catalog` label can become ceremonial if
   missing player-visible facts are not continuously audited.
3. **Authority shadow drift:** the shadow inventory currently trusts manifest
   declarations and only reports publication. It does not prove runtime binding.
4. **Witness under-modeling:** required positive effects without forbidden-domain
   checks can still confirm incomplete transactions.
5. **Patch-impact fantasy:** method fingerprints cannot prove semantic
   compatibility by themselves, especially under runtime patches.
6. **Provenance inflation:** operator/console evidence is useful for coverage
   and debugging but cannot silently become Organic qualification.
7. **Dual-client drift:** Re must not add Surface-specific guesses to compensate
   for missing Bridge semantics.

## Ordered Engineering Route

1. Keep preview.47 authority byte-for-byte unchanged while validating the
   contract-instance shadow over real states and negative fixtures.
2. Add runtime semantic-binding and commit/witness identifiers for one repeated
   mechanism family; compare old/new results in shadow.
3. Introduce operation/contract-instance authority as a narrowing layer first;
   no operation may gain permission during migration.
4. Add deterministic adaptive Inspection selection and provenance-aware run
   reporting; model-requested Inspection comes later with a loop/budget guard.
5. Implement Pael's Tooth only as its own transaction if exact visibility,
   five-card selection, delayed return/upgrade, cancellation, and completion can
   all be proven.
6. Continue family-by-family v1 retirement and player-visible closure audits.
7. Consider bounded provisional execution only after a separate safety review.

## Architecture Decision

Adopt **D at the diagnostic/visibility protocol level** and **C internally**:

- D: preview.47 adds visibility/catalog/bundle and non-authorizing contract
  instance reporting because the old wire could not honestly express them.
- C: keep purpose-specific external Surfaces while extracting repeated typed
  mechanics, validators, commits, and witnesses.
- Reject a universal Surface, universal purchase/selector, executable effect
  DSL, and automatic authority from manifests or structural similarity.

## 2026-07-20 Independent Reassessment Addendum

This addendum does not rewrite the preview.47 evidence above. It records the
independent review at `develop@ec8c84a976ab25ada65133a56ad39ed95eb08c3d` and
supersedes only conclusions that were stated too broadly.

### Conclusions Retained

- The v2 hard shell remains fundamental: one input owner, player-visible
  boundaries, opaque state-bound actions, exact operands, execute-time
  revalidation, game-owned Commit paths, idempotent command lifecycle, unknown
  outcomes without retry, semantic post-state evidence, exact environment
  scope, and Fail Closed behavior.
- A UI mechanism never grants effect semantics or authority.
- Current Surface-level permission and non-authorizing manifest shadow are
  transitional governance, not the target authority model.
- Strategy projection and Inspection remain read-only and cannot enter the
  command ledger.

### Conclusions Narrowed

The statement that a typed effect graph is categorically the wrong reuse level
was too conservative. A **closed, typed Transaction IR** is acceptable when it
is a non-executable declaration of a game-owned transaction, exact operands,
Mutation Domain, phases, and witness obligations. It becomes unsafe if Bridge
interprets it as permission to invoke arbitrary effects, methods, reflection,
scripts, or low-level UI operations.

Likewise, purpose-specific contracts need not imply one handwritten Surface or
source literal per card, potion, relic, event, or enchantment. A qualified
runtime task/transaction binding plus a complete DecisionFrame can be stronger
than provenance. However, removing a source literal does not remove the need
for trustworthy attestation: content/Mod registry data cannot attest itself.

### Newly Verified Risks

1. Re still contains handwritten Surface/source discriminators and action-kind
   sets even though Bridge-owned action execution is already a generic opaque
   pass-through. This is real dual-schema growth pressure.
2. Providers commonly co-locate mechanics, source inference, projection,
   legality, execution, and Completion. Publication and execution often repeat
   predicates rather than consuming one typed validation result.
3. `deck_enchant_selection` is authorized by exact environment plus Surface
   kind, while `DeckEnchantSurfaceProvider` does not establish a runtime source
   binding. Its manifest and Canonical prose name Self-Help Book, but that name
   is evidence metadata rather than an enforced origin restriction.
4. Parent actions may complete when a required child Surface opens, while the
   child witness proves only its local mutation. Without transaction-level
   obligation ownership, later source effects can fall between command
   boundaries.

The fourth point is supported by current Bridge code plus a targeted
decompilation of the locally installed `v0.109.0|c12f634d|1833084275` assembly:
`WhisperingHollow.Hug` transforms the selected card and then applies HP loss.
This is an architecture counterexample, not source qualification for the
different `-840572606` build.

### Revised Decision

- **A:** retain the v2 hard shell and independent semantic ownership.
- **B:** continue extracting permissionless visible mechanics and typed facts.
- **C:** shadow-pilot `DecisionFrame + closed Transaction IR + shared validator
  + WitnessPlan` on generated-card and combat-pile choices. The IR describes
  proof obligations; the game-owned adapter remains the only Commit path.
- **D:** consider a structural wire revision only after the shadow passes
  zero-core-code holdouts and negative composition tests without widening
  authority.

The complete evidence classification, examples, migration gates, and rollback
requirements are in
[the 2026-07-20 audit closeout](DECISION_FRAME_TRANSACTION_IR_ARCHITECTURE_AUDIT_CLOSEOUT_2026-07-20.md).
