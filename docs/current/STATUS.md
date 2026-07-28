# Current Status

This is the canonical short current-state document for the rebuilt project.

## Program And Architecture

- Current program milestone: **M1 Measurable External Agent Baseline**, with
  bounded C-R1 connector closure active in parallel.
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

Current source contract is `2.0-preview.73`; Re normalized schema is `29`.
Preview.73 is tested, built, installed and cold-loaded:

```text
game release    v0.109.1|c8c577f6
release hash    -1041364841 (release-declared diagnostic only)
actual hash     -820620422
built SHA       f6b2d2687add4719e7d04f6b3beb8b5b386f43208d7af1cc0b12e2d89a151b18
installed SHA   f6b2d2687add4719e7d04f6b3beb8b5b386f43208d7af1cc0b12e2d89a151b18
loaded SHA      f6b2d2687add4719e7d04f6b3beb8b5b386f43208d7af1cc0b12e2d89a151b18
built MVID      f67e272a-ca3f-4eac-8d41-6e287b144c8a
installed MVID  f67e272a-ca3f-4eac-8d41-6e287b144c8a
loaded MVID     f67e272a-ca3f-4eac-8d41-6e287b144c8a
runtime epoch   37c04bb71df3451eb23545b6925b3a37
rollback        STS2MCP/.local/deployments/2026-07-28T15-34-25-593Z
Mod manifests   one canonical STS2_MCP manifest; no duplicate
```

The separate release-declared hash is diagnostic provenance, not actual-loaded
identity. Source, build, installation and loaded identity agree exactly. A
read-only Re inspect strictly decoded the main menu. It caused the Gateway to
admit only `main_menu/open_singleplayer` as a runtime-bound `session_canary`;
no mutation executed. Inspection remains disabled, no persistent authority is
applicable, and Preview.72 runtime grants did not transfer.

## Latest Live Evidence

Earlier Preview.72 runtime run `run-20260728141035-uhrp19` completed a fresh
bounded main-menu-to-game-over-to-main-menu journey:

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

Three later final-MVID Preview.72 runs provide the current defect evidence:

- `run-20260728143604-oklaik` proved native Rest succeeded while the old
  exact-final-HP Oracle timed out after Stone Humidifier added a legitimate
  max/current-HP side effect;
- `run-20260728144125-xvgvhc` and `run-20260728144341-2c4ij1` proved that an
  operation quarantine incorrectly erased `bridge_owned` from a still-current
  semantic Rest Surface.

Preview.73 repairs both boundaries without adding authority. The runs are
`unrecorded` defect/coverage evidence, not Organic or persistent qualification.
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

Run the ordinary Agent entry and let natural play exercise the bounded
Rest/blocked-owner canaries from the
[Preview.73 report](audits/PREVIEW_73_REST_OUTCOME_AND_AUTHORITY_BOUNDARY_2026-07-29.md).
After that, proceed to C-R1.1 core Inspection/availability while A/D M1 remains
active in parallel. Do not retry unknown mutation, manufacture rare states,
expand wildcard authority or enable stable learning.
