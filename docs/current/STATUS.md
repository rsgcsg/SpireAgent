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
source contract      2.0-preview.75
Re normalized schema 30
source state         tests/build pass; new Gateway installed; cold-load pending

built/installed      2.0-preview.75
game release         v0.109.1|c8c577f6
actual game hash     -820620422
built/installed SHA  f9819b6b24ed71245cee711a2844c32fa2c1b666fce6b3f412f1bd71efc721ee
built/installed MVID 34d6deb3-f4b7-43bf-89ad-a9e596380410
last loaded contract 2.0-preview.75
last loaded SHA      ddce17cf4121bf009a371cbfd102b1174732eafc1cf7fafd8e226f3ec12f6334
last loaded MVID     23ac5aad-443b-47aa-9cb0-a55197d83cb4
last observed runtime fc2ea037f66846d39e7eb826d6df7220
rollback             STS2MCP/.local/deployments/2026-07-29T12-26-37-794Z
```

The previous Preview.75 artifact was loaded and exercised. A same-source
Release rebuild is now installed under a new whole-DLL identity and the game is
closed. Prior runtime authority/evidence does not transfer to MVID
`34d6deb3...`; no loaded or persistent qualification is claimed for it.

## Latest Runtime Evidence

Two exact loaded Preview.75 runs used clean Re revision `364f454`, Prompt v4
and guide v5:

```text
decisions                        175 + 282
executed_and_settled             171 + 258
termination                      two completed_run_boundary
completedGame                    true / true
safe stale refusals                2 + 23
unsupported / invalid              0
observation / provider failure     0
unsettled / unknown mutation       0
```

Provenance is `unrecorded`; this is strong bounded coverage, not Organic or
persistent qualification. Inspection is now exact-runtime exercised:
`run_deck`, `combat_piles`, and `shop_catalog` remained state-bound and
non-authorizing. Run `run-...112408` also purchased Bronze Scales with exact
gold/relic/entry evidence and Courier slot replacement. Kifuda did not occur.

The 23-run stale audit found no composite-only or missing-identity case. Most
combat stales followed an action-local completion while visible hand/enemy
facts continued evolving during the next model call. State binding correctly
refused all mutations. Re now waits for a repeatable actionable successor
before the next model call; post-change Live rate is not yet claimed. See the
[Preview.75 runtime closeout](audits/WORKFLOW_C_PREVIEW75_RUNTIME_AND_SUCCESSOR_STABILITY_CLOSEOUT_2026-07-29.md).

## Preview.75 Source Changes

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

Next: cold-start the installed SHA/MVID, then run one exact-runtime post-change
journey and compare stale rate without weakening state binding. Wait for
natural Kifuda child/negative evidence before closing the first family pilot.
Unknown mutation remains terminal and non-retryable.
