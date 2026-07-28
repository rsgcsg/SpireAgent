# Current Functional Roadmap

This roadmap owns technical readiness. The
[program plan](PROGRAM_PLAN.md) owns the user-outcome sequence `M0`--`M4`.
Technical Gates remain useful checklists and evidence boundaries, but they are
not a second product roadmap and are not required to finish every imaginable
game state before Agent work can proceed.

The single architecture destination remains
[ADR-0002](decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md),
refined by ADR-0003's native-contract migration and ADR-0004's separation of
diagnostic observation, encounter-scoped trial and persistent claims.

## Milestone Mapping

| Technical readiness | Program relation | Status |
|---|---|---|
| Gate 0 source truth | M0 | closed |
| Gate 1 reliable v2 ordinary journey | M0 | bounded closed |
| Gate 2 decision/visibility/contract work | M1-C | active track |
| Gate 3 local control coordination | M1-C/P | minimum baseline present |
| Original Gate 4 official Agent | superseded | Re already exists |
| Player-controlled Agent/Companion | M3 | future |
| Distribution/ecosystem | M3/M4 | future |
| Headless research | X | independently gated |

## Gate 0: Source Truth Repair

**Status:** closed.

C# Gateway and Re share one current protocol; cross-language fixtures exist;
Release build/install/load identity is explicit. A build, fixture or historical
MVID is never presented as current Live qualification.

## Gate 1: Connector Reliability And Coverage

**Status:** bounded closed for vanilla ordinary single-player v2.

The ordinary loop uses only Gateway v2 facts and advertised opaque actions.
Gateway v1 mutation is retired. Representative menu, run start, map, combat,
reward, event, rest, shop, treasure, selector and game-over flows have exact
runtime evidence across bounded runs. Known unsupported variants are typed and
fail closed; this is not all-game, all-Mod or persistent-qualification coverage.

See the
[Gate 1 closeout](../../STS2MCP/docs/bridge-v2/GATE1_CLOSEOUT_AND_SELECTOR_TRANSACTION_AUDIT_2026-07-24.md)
and the
[adaptation closeout](../../STS2MCP/docs/bridge-v2/GATE1_ADAPTATION_AND_COMPATIBILITY_CLOSEOUT_2026-07-24.md).

## Gate 2: Decision And Visibility Readiness Track

**Status:** active inside M1, not a blocker on freezing/evaluating the current A
baseline.

Gate 2 follows this priority:

1. current decision truth and one active owner;
2. decision-relevant visible facts and honest availability/missing semantics;
3. bounded player-accessible Inspection/detail;
4. publication/execution legality and action-local outcome correctness;
5. non-authorizing native-contract and compatibility migration.

Preview.72 is built, installed and loaded at the exact identity in
[Status](STATUS.md). Current-runtime run `run-20260728132337-ce2195` completed a
146-decision one-game boundary with 144 settled actions, one safe pre-execution
stale rejection, and no unsupported, invalid, observation/provider failure,
unsettled or unknown outcome. It is `unrecorded` runtime evidence, not Organic
or persistent qualification; current Inspection remains disabled and the
Hefty/actionless-settling repair branches were not naturally exercised.

### Current Gate 2 Work

- close only naturally observed A-facing decision, owner, settling, visible-
  fact, Inspection and action-local outcome gaps;
- retain complete evidence while A/D evaluate a scope-specific model view;
- keep current operation permission authoritative until ADR-0003 dual-read
  parity and rollback gates pass;
- expand source/adapter/outcome identity only as non-authorizing shadow before
  migration;
- keep Profiles, D evidence and manifest hypotheses non-authorizing;
- use family-specific evidence rather than operation/package counts.

The current full-evidence Prompt remains the live baseline. The first generic
compact projection failed cross-surface evidence and remains rejected. A new
projection must be scope-specific, paired, counterexample-reviewed and held-out
evaluated before runtime admission.

### Explicit Remaining Scope

Known gaps include Tutor's unreviewed owner binding, Crystal Sphere,
standalone manual potion discard, unbound source variants, non-standard
profile/menu paths, multiplayer, incomplete linked detail/tooltip families and
Inspection availability for the current build. These do not invalidate the
bounded M0 baseline; they remain fail-closed or visibly unsupported.

## Gate 3: Local Control Coordination Readiness

**Status:** minimum baseline present; no longer a separate top-level stage.

The Gateway supports descriptive client registration, one mutation-controller
lease, generation fencing, runtime restart invalidation and command
attribution. A bounded two-client test verified competing writer rejection and
release. Read-only access remains separate. This is correctness and diagnostic
coordination, not authentication, RBAC or malicious-local-process isolation.

See the
[Gate 3 closeout](../../STS2MCP/docs/bridge-v2/GATE3_LOCAL_CONTROL_COORDINATION_CLOSEOUT_2026-07-25.md).

## M1-A/D: Measurable Agent Readiness

This track now advances alongside Gate 2:

1. freeze exact A baseline identity/configuration;
2. establish representative and held-out D cases;
3. produce one joined baseline report for correctness, run, provider, Prompt,
   cost and outcome metrics;
4. accept or reject one low-risk A candidate through paired evidence and
   counterexamples.

It does not enable stable memory, learning or live policy mutation.

## M2: Agent Capability Readiness

After M1, evaluate model-facing projection, bounded Inspection policy,
planning/critique, read-only retrieval, provider and budget candidates. Changes
must improve held-out outcomes with explicit cost, regression and rollback
evidence. C continues to fix only facts/actions/outcomes that block these
bounded evaluations.

## M3: Player-Controlled Agent Alpha

This replaces the misleading old name `Companion And Official Agent`; the
official Re runtime already exists. M3 adds the smallest justified Companion
for provider secrets, lifecycle, pause/takeover, recovery, diagnostics and
private distribution. It cannot bypass Gateway authority.

## M4: Distribution And Guarded Improvement

Package Gateway and Companion separately, validate install/update/rollback,
then decide whether Workshop, a public SDK, optional MCP ecosystem integration,
plugins or persistent learning are justified. A public SDK requires a second
real consumer; learning requires independent evaluation and rollback.

## X: Headless And Post-Training Research

Headless and post-training are optional independent tracks. They inherit no
Live identity, permission or semantic equivalence and are not required for a
usable live Agent. See [Headless scope](headless/README.md).
