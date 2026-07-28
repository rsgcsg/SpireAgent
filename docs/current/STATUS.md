# Current Status

This is the canonical short current-state document for the rebuilt project.

## Program And Architecture

- Current program milestone: **M1 Measurable External Agent Baseline**.
- Primary value track: `Re-SpireAgent/` external Agent A.
- Authoritative game interface: `STS2MCP/` Semantic Gateway C.
- Independent evidence track: D; minimum local-control/product track: P.
- Architecture: ADR-0002 A-first Semantic Gateway two-plane target, refined by
  ADR-0003 and ADR-0004.
- Legacy: original runtime and P8--P15 are archived; Gateway v1 is retired.

M0/Gate 1 is closed only as a bounded vanilla ordinary-single-player v2
baseline. Gate 2 remains an active C readiness track for decision truth,
visibility, Inspection and native-contract migration. It does not block
freezing and evaluating the current A baseline. This is not complete game,
Mod, persistent-qualification or product coverage.

## Source, Install And Load

Current source contract is `2.0-preview.72`; Re normalized schema is `29`.
Preview.72 is built, installed and Steam cold-loaded:

```text
game release    v0.109.1|c8c577f6
release hash    -1041364841 (release-declared diagnostic only)
actual hash     -820620422
built SHA       debc229e7affb514ba25e3f9485cfef8235c6213623ef490934d22072d2ddeed
installed SHA   debc229e7affb514ba25e3f9485cfef8235c6213623ef490934d22072d2ddeed
loaded SHA      debc229e7affb514ba25e3f9485cfef8235c6213623ef490934d22072d2ddeed
built MVID      6d9d4adf-6c34-4401-950f-69980dc5d3d8
installed MVID  6d9d4adf-6c34-4401-950f-69980dc5d3d8
loaded MVID     6d9d4adf-6c34-4401-950f-69980dc5d3d8
runtime epoch   b2332a06f756495a84936520b79cecba
rollback        STS2MCP/.local/deployments/2026-07-28T14-31-37-745Z
Mod manifests   one canonical STS2_MCP manifest; no duplicate
```

The separate release-declared hash is diagnostic provenance, not actual-loaded
identity. The loaded environment is exact bridge-only and uses
`migration_exploration`. The new runtime inherited no old session grant:
observation and provisional trial are ready, while mutation starts disabled
until the Gateway admits a current source-resolved action. No persistent
qualification was created.

## Latest Live Evidence

Immediately prior same-source Preview.72 runtime run
`run-20260728141035-uhrp19` completed another fresh bounded
main-menu-to-game-over-to-main-menu journey. Its action evidence belongs to
MVID `3e9ad83a...`, not the newly loaded MVID:

```text
decisions                         108
executed_and_settled              107
run_boundary                        1
unsupported / invalid               0
observation / provider failure      0
unsettled / unknown mutation        0
```

It crossed combat, event, map, reward, shop, selector, menu and game-over. The
summary records `completed_run_boundary` and `completedGame=true`.

Evidence limits:

- provenance is `unrecorded`, so this is exact-runtime coverage and repair
  evidence, not Organic or persistent qualification;
- Inspection is disabled for the current build;
- Hefty Tablet and actionless generated-combat settling repairs were not
  naturally exercised;
- one successful run does not establish strategic quality, run completion
  rate, cross-version/Mod compatibility or complete visible information;
- runtime authority remained encounter/session scoped.

The run made 107 model calls with 1,206,746 user-Prompt bytes, averaging 11,278
and peaking at 20,269 bytes; all 107 provider attempts produced valid JSON.
This is a measured reason to
evaluate evidence-preserving, scope-specific consumer views; it is not evidence
to replace the full Prompt without paired evaluation.

`agent:baseline-report` now joins local exact Connector/game/Modset identity,
Re/provider/Prompt/outcome/settlement metrics without action or qualification
effect. Existing runs, including this one, predate Re source-digest recording
and are correctly reported as `identityStatus=incomplete`. New public
`agent:run` records Git revision, runtime-source digest and clean/dirty status.

Earlier Preview.69--71 runs, failures and repair evidence remain indexed in the
[documentation map](DOCUMENT_MAP.md) and dated closeouts. Their evidence and
authority do not transfer across MVID/runtime identity.

## Current Boundaries

- One active Gateway Surface owns mutation actions.
- Re chooses only currently advertised action IDs.
- Stale selections are rejected before execution; unknown mutation is never
  automatically retried.
- D evidence, Profiles and manifest hypotheses are non-authorizing.
- The full normalized evidence record remains the live Prompt baseline.
- Stable memory, learning, Companion, public SDK, Headless and post-training
  are not enabled.

Explicit unsupported or incomplete scope includes Tutor's unreviewed owner
binding, Crystal Sphere, standalone manual potion discard, unbound source
variants, non-standard profile/menu paths, multiplayer, current-build
Inspection and incomplete linked detail/tooltip families.

## Immediate Next Step

Capture one fresh run with the new exact Re source identity, freeze that M1 A
baseline configuration, then define the minimum versioned representative/
held-out D split. The
first A candidate should be a low-risk scope-specific Prompt/view or Inspection
policy experiment evaluated offline/replay, paired, counterexample and held-out
before shadow admission. C continues only on naturally observed blockers; do
not manufacture Hefty states, retry unknown mutation, expand wildcard authority
or enable stable learning.
