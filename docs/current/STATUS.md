# Current Status

This is the canonical short current-state document for the rebuilt project.

## Program And Architecture

- Current priority: **Workflow C Clean Closure**, before additional A/D/P
  feature expansion.
- Mainline: `Re-SpireAgent/` plus the `STS2MCP/` Semantic Gateway.
- Accepted architecture: ADR-0002, refined by ADR-0004 and the mandatory
  vertical family migration in
  [ADR-0005](decisions/ADR-0005-workflow-c-clean-closure.md).
- Gateway v1 mutation and the original root runtime remain retired.

Gate 1 remains a bounded ordinary-vanilla v2 baseline, not complete game/Mod
coverage. Clean Closure now owns decision/Inspection closure, native-contract
migration, deletion of permanent migration scaffolding, exact-environment
trial/claim lifecycle, repeated journeys and final freeze.

## Source, Install And Load

```text
source contract      2.0-preview.76
Re normalized schema 31
source state         tests/build/install pass; cold-load pending

built/installed      2.0-preview.76
game release         v0.109.1|c8c577f6
actual game hash     -820620422
built/installed SHA  56b24ea36a9ad95f15414cd7882ab2b6b32b9459aa47feb204d3290569de9003
built/installed MVID 37f4ce07-1ca7-4942-aec9-868b7d7d4676
last loaded contract 2.0-preview.75
last loaded SHA      f9819b6b24ed71245cee711a2844c32fa2c1b666fce6b3f412f1bd71efc721ee
last loaded MVID     34d6deb3-f4b7-43bf-89ad-a9e596380410
last observed runtime 7f72d0879cde4ad6b37ab097a6ed5c98
rollback             STS2MCP/.local/deployments/2026-07-29T13-33-27-964Z
```

The previous Preview.75 artifact was loaded and exercised. Preview.76 has a new
whole-DLL identity; prior runtime authority/evidence does not transfer. Loaded
Preview.76 and persistent qualification remain non-claims until cold start.

## Latest Runtime Evidence

Three latest exact loaded Preview.75 runs used clean Re revision `7cd6deaa` and
the fixed Prompt/guide baseline:

```text
run ...123227    New Leaf child typed unsupported after confirmed parent option
run ...123734    77/77 attempted mutations settled; completed_run_boundary
run ...124247    92/92 attempted mutations settled; completed_run_boundary
```

The New Leaf command itself completed and opened native
`NDeckTransformSelectScreen`; the stop was a Gateway caller-binding gap, not a
Prompt/provider/stale/unknown failure. Provenance is `unrecorded`; this remains
bounded coverage, not Organic or persistent qualification. Kifuda did not
occur and remains `not exercised`.

The 23-run stale audit found no composite-only or missing-identity case. Most
combat stales followed an action-local completion while visible hand/enemy
facts continued evolving during the next model call. State binding correctly
refused all mutations. Re now waits for a repeatable actionable successor
before the next model call; post-change Live rate is not yet claimed. See the
[Preview.75 runtime closeout](audits/WORKFLOW_C_PREVIEW75_RUNTIME_AND_SUCCESSOR_STABILITY_CLOSEOUT_2026-07-29.md).

## Preview.76 Source Changes

- random deck transform now has a shared native selector mechanic with exact,
  discriminated `WhisperingHollow.Hug` and task-local `NewLeaf.AfterObtained`
  source contracts;
- wire source identity is required and Re schema 31 retains it;
- New Leaf execution revalidates its exact task/relic/player/card instances and
  confirms source settlement plus exact deck replacement;
- every unsupported draft is centrally forced to zero actions and
  `none_fail_closed`, even if a provider accidentally retained default
  authority;
- no permission level, durable claim, Prompt or Re completion semantics changed.

Preview.75 remains the loaded evidence baseline:

- Preview.74 formal `semantic_state_id` and `authority_projection_id` replace the old
  identity shadow;
- formal identities hash the actual Context, Surface, completeness, visibility,
  exact environment and BoundAction operands/source rather than trusting only
  a Provider signature;
- contract/identity shadows and full permission/qualification histories are
  removed from the state/Prompt path;
- one action publication path binds catalog contract, source evidence, exact
  operands and current state;
- seven explicit contracts use contract-digest admission; 80 manifest fallback
  families still use the temporary operation gate;
- shop relic purchase is the first new explicit pilot; Kifuda enchantment
  continues from a fresh child observation;
- persistent fallback receipts now use the same non-empty Gateway witness rule
  as session trials.
- Re now preserves a valid advertised action when only the non-authoritative
  `reasonBrief` exceeds 240 characters; the raw response and typed
  normalization remain auditable.
- Re separates Gateway action-local completion from next-decision readiness by
  requiring a repeatable actionable successor; this does not reinterpret the
  Gateway Witness or retry stale actions.
- a diagnostic exact environment may expose volatile read-only Inspection
  canaries only after a source-resolved action session scope exists in the same
  clean runtime; this grants no mutation authority or durable claim.

The [Clean Closure audit](audits/WORKFLOW_C_CLEAN_CLOSURE_AUDIT_AND_EXECUTION_CONTRACT_2026-07-29.md)
and machine deletion inventory own the detailed status. Clean Closure is not
complete while fallback authority, current-build Inspection and required Live
evidence remain.

## Boundaries And Next Step

Known typed unsupported/out-of-scope includes Crystal Sphere, standalone
manual potion discard, Tutor's unreviewed owner, unknown generated sources,
non-standard profile/menu paths and multiplayer.

Next: cold-start the installed Preview.76 SHA/MVID and run one bounded journey.
New Leaf and Kifuda are separate natural-evidence gates; neither may be
manufactured or inferred from fixture coverage. Unknown mutation remains
terminal and non-retryable. See the
[Preview.76 closeout](audits/WORKFLOW_C_PREVIEW76_NEW_LEAF_AND_UNSUPPORTED_AUTHORITY_CLOSEOUT_2026-07-29.md).
