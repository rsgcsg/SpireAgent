# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/`.
- **Connector:** `STS2MCP/` Semantic Gateway, REST contract, and optional
  v2-only MCP adapter.
- **Legacy:** the original root runtime and P8--P15 route are archived.

## Current Gate

The repository now has one accepted target architecture: the
[Semantic Gateway Two-Plane Architecture](decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
This is an architecture decision, not a runtime completion claim. Preview.67
is its first identity-boundary shadow experiment; current authority remains on
the legacy composite path.

Gate 1 remains closed as a bounded ordinary-single-player v2 connector
baseline. Source contract is `2.0-preview.67`; Re normalized schema is `26`.
Gateway v1 is retired and every `/api/v1` route returns `410 Gone`.

Preview.67 source introduces a required, non-authorizing identity shadow that
separates a game-semantic candidate from a current-authority candidate. The
legacy composite `state_id`, action binding, permission, execution, completion,
and Re model input are unchanged. Source, Gateway contract tests, strict Re
decode, Release build, and disk installation are complete. Built and installed
SHA is `7da8946c9374c7030d5162e8cb1930e1fc0186edc1c1088f3b2fc371c7a9b768`;
MVID is `12b55aef-499f-4ea8-8414-d3a360baa2ac`. The game has not been cold-
started, so Preview.67 has no loaded or Organic evidence.

Preview.66 has completed one exact automatic migration slice on the current
Gateway build. The Gateway does not inherit authority by version, build, or
Mod similarity:

- `main_menu/continue_run`: persistent `qualified`;
- 86 other current manifest operations: exact session canaries only;
- five operations use explicit high-precision completion contracts; 82 use
  conservative manifest-derived identity/test-confirm fallbacks.

The Environment Profile is a non-authorizing local index. One global
append-only ledger can hold packages for multiple exact environments because
active slots are keyed by environment + Surface + operation. The
qualification store is atomically hot-reloaded and every package is
revalidated before publication. This is **real but narrow** automatic
requalification, not broad build, all-operation, cross-version, or cross-Mod
qualification.

## Exact Evidence Boundary

Last loaded exact game and assembly evidence (Preview.66):

```text
game      v0.109.1|c8c577f6|-820620422
sts2 SHA  2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f
sts2 MVID 208f08b8-d5f5-47f8-9e96-d3a4299ee709
Gateway   b0b31f769f25d5a1e5231e92af76f7f09e07ab38f5c43f1ae753eba0b61d7a8a
MVID      a7008eea-b3cd-4cb8-b75c-6dee64e9cd5c
runtime   cebc39821b7e4d16aa1d9d2d9e680df8
profile   env-8eee4ee3f08d1181b7405305
env       2654bef1049808f852f6d946a283941a14db6893678a134543510afeb8d45aa0
Modset    2747e126fbb2f770b5cf2e6b971713a3b0b80d017b606598ca75fc758764a688
Patch     ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
catalog   8878447144e4fe4d8c01b2940335feb504367a81ac76e4b4fd22e2f4d6b85f0c
mode      migration_exploration
```

`continue_run` has two confirmed ordinary-gameplay decisions in distinct
runtime epochs:

```text
run-20260726132908-2e4rz6
run-20260726133036-d3tr3a
```

The orchestrator installed its qualified package, the Gateway hot-reloaded it,
and a later cold restart revalidated it against the exact game, Gateway,
Modset, Patch, environment and operation identity. Wrong environment,
expiry, corruption, revoke, rollback, witness mismatch, timeout, unknown
outcome, and quarantine are covered separately by fixtures. The exact runtime
and evidence boundaries are recorded in the
[Preview.66 closeout](../../STS2MCP/docs/bridge-v2/PREVIEW_66_MULTI_ENVIRONMENT_MIGRATION_CLOSEOUT_2026-07-26.md).

## Immediate Next Step

Do not widen wildcard or Surface authority. Cold-start the installed
Preview.67 artifact, verify loaded SHA/MVID and strict Re decode, then run one
bounded ordinary action from a different Commit/completion mode. Capture the
new identity shadow before and after action/permission changes. This may
validate the shadow experiment; it must not switch authority. The roughly
580 KB capabilities projection still needs a summary/on-demand dual-read
experiment before productization.

Gate 1 closeout still does not mean complete-game coverage or complete
player-visible information. Crystal Sphere, standalone manual potion discard,
non-standard menu/profile flows, multiplayer, and unbound selector semantics
remain unsupported or outside the bounded gate.
