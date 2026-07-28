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
built SHA       afb0261fdf1ca8433bdcbc3de2e1270f00daf802da3aaf507492357da399a140
installed SHA   afb0261fdf1ca8433bdcbc3de2e1270f00daf802da3aaf507492357da399a140
loaded SHA      afb0261fdf1ca8433bdcbc3de2e1270f00daf802da3aaf507492357da399a140
built MVID      3e9ad83a-37c9-40dc-bca0-877187c9bdae
installed MVID  3e9ad83a-37c9-40dc-bca0-877187c9bdae
loaded MVID     3e9ad83a-37c9-40dc-bca0-877187c9bdae
runtime epoch   14238a9e9bf443c580a8dfe80bd571fd
rollback        STS2MCP/.local/deployments/2026-07-28T13-05-29-650Z
Mod manifests   one canonical STS2_MCP manifest; no duplicate
```

The separate release-declared hash is diagnostic provenance, not actual-loaded
identity. The loaded environment is exact bridge-only, uses
`migration_exploration`, and inherited no Preview.71 grant or persistent
qualification.

## Latest Live Evidence

Current-runtime run `run-20260728132337-ce2195` completed a fresh bounded
main-menu-to-game-over-to-main-menu journey:

```text
decisions                         146
executed_and_settled              144
not_executed_stale_state            1  (rejected before execution)
run_boundary                        1
unsupported / invalid               0
observation / provider failure      0
unsettled / unknown mutation        0
```

It crossed combat, event, map, reward, rest, shop, treasure, transform, menu
and game-over, including a shop card purchase and reward potion discard. The
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

The run made 145 model calls with about 1.69 MB total user Prompt payload,
averaging about 11.7 KB and peaking at 23.6 KB. This is a measured reason to
evaluate evidence-preserving, scope-specific consumer views; it is not evidence
to replace the full Prompt without paired evaluation.

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

Freeze the M1 A baseline identity/configuration, define the minimum versioned
representative/held-out D split, and generate one joined baseline report. The
first A candidate should be a low-risk scope-specific Prompt/view or Inspection
policy experiment evaluated offline/replay, paired, counterexample and held-out
before shadow admission. C continues only on naturally observed blockers; do
not manufacture Hefty states, retry unknown mutation, expand wildcard authority
or enable stable learning.
