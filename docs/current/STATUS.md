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
source contract      2.0-preview.74
Re normalized schema 30
source state         tests/build pass; installed; cold-load pending

built/installed      2.0-preview.74
game release         v0.109.1|c8c577f6
actual game hash     -820620422
built/installed SHA  42eb22b6cc0ee95679d4347bba2f319c1d02b06ae8bbfdebc9c48c6c85aaea7e
built/installed MVID 13d4dd05-61c3-470c-ba03-5af14dd9cf5b
last loaded contract 2.0-preview.73
last loaded SHA      f6b2d2687add4719e7d04f6b3beb8b5b386f43208d7af1cc0b12e2d89a151b18
last loaded MVID     f67e272a-ca3f-4eac-8d41-6e287b144c8a
last observed runtime 2123fefaf9434f34a86ae8533e3322a5
rollback             STS2MCP/.local/deployments/2026-07-29T07-08-28-094Z
```

Preview.74 is built and installed but has not been cold-loaded. Preview.73
evidence and authority do not transfer to the new source contract.

## Latest Runtime Evidence

`run-20260729061142-32o3xz` used exact loaded Preview.73 and clean Re source:

```text
decisions                         95
executed_and_settled              94
termination                       completed_run_boundary
completedGame                     true
unsupported / invalid / stale      0
observation / provider failure     0
unsettled / unknown mutation       0
```

It resumed an existing combat run. Provenance is `unrecorded`, Inspection was
disabled, and it did not exercise ordinary shop relic/Kifuda. It is bounded
coverage evidence, not Organic or persistent qualification.

`run-20260729060301-mlwq4k` recorded 143 settled mutations, three safe stale
refusals and one non-actionable checkpoint. Its terminal decision was not
executed because DeepSeek violated the bounded `reasonBrief` contract on both
primary and retry. This terminal A/provider failure is not a Gateway
unsupported/Outcome defect.
`run-20260729060132-7zsqdu` has no immutable summary and remains unclassified
incomplete evidence.

## Preview.74 Source Changes

- formal `semantic_state_id` and `authority_projection_id` replace the old
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

The [Clean Closure audit](audits/WORKFLOW_C_CLEAN_CLOSURE_AUDIT_AND_EXECUTION_CONTRACT_2026-07-29.md)
and machine deletion inventory own the detailed status. Clean Closure is not
complete while fallback authority, current-build Inspection and required Live
evidence remain.

## Boundaries And Next Step

Known typed unsupported/out-of-scope includes Crystal Sphere, standalone
manual potion discard, Tutor's unreviewed owner, unknown generated sources,
non-standard profile/menu paths and multiplayer.

Next: cold-load Preview.74 and verify the loaded SHA/MVID. Only then may loaded
identity be claimed. The next Live evidence
must include ordinary relic and Kifuda positive/negative journeys plus an
Inspection-enabled journey; unknown mutation remains terminal and non-retryable.
