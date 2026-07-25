# D3 Permission And Gray Rollout Closeout

Date: 2026-07-25

> Gate 3 follow-up: the one-controller requirement is now implemented by
> Preview.64 as minimal local coordination. Authentication was explicitly
> removed from Gate 3 and remains only a conditional product concern. See
> [the Gate 3 closeout](GATE3_LOCAL_CONTROL_COORDINATION_CLOSEOUT_2026-07-25.md).
> This note supersedes only the old next-step wording; the Preview.63 D3
> evidence below is unchanged.

## Verdict

Bridge `2.0-preview.63` closes the first **disabled-by-policy-ceiling,
session-scoped permission loop**:

```text
reviewed exact-environment canary ceiling
  -> non-authorizing gray candidate
  -> Gateway session_canary grant
  -> opaque state-bound action publication
  -> execute-time exact-grant revalidation
  -> native game commit
  -> semantic completion
  -> Gateway session_auto_approved grant
```

This is a real operation-scoped gray rollout canary. It is not persistent
qualification, broad automatic permission, a D-owned authority path, Gate 2
coverage expansion, or a consumer security boundary. Restarting the game
discards all dynamic grants.

## Architecture Decision

The permission path has three owners:

| Layer | Owns | Cannot do |
|---|---|---|
| D/evidence inputs | scenarios, fingerprints, graders, evidence IDs and non-authorizing candidate recommendations | publish actions, grant live authority, declare native completion |
| Gateway Permission Manager | combine reviewed ceiling, mode, runtime epoch, exact environment, Patch inventory, operation fingerprint and command outcome into a session grant | exceed the embedded exact-environment ceiling or create persistent qualification |
| Gateway enforcement | publish opaque actions, revalidate exact grant and current game legality, call native commit, observe semantic witness, quarantine | accept client operands, retry unknown outcomes, trust D/provider assertions |

The embedded exact-environment policy remains the absolute reviewed ceiling.
`gray-permission-candidates.json` explicitly declares
`authorization_effect=none` and
`recommendation_effect=gateway_session_candidate_only`. A candidate not
already present as an embedded canary operation can never be dynamically
authorized.

## Modes

| Mode | Current behavior |
|---|---|
| `strict` | publishes only embedded `qualified` operations; no embedded canary or dynamic grant is active |
| `balanced_gray` | preserves reviewed non-candidate canaries and permits explicitly listed low-risk candidates to enter the session grant loop |
| `developer_gray` | uses the same hard ceiling and safety checks; no broader candidate set exists in this revision |

`balanced_gray` is the local developer default. This is not a recommendation
for a future consumer product: the current loopback REST server still lacks
client authentication and a single-controller lease.

## Grant Identity And State

Every grant is bound to:

- Gateway runtime epoch;
- exact game version, commit and loaded assembly hash;
- Gateway assembly SHA-256 and MVID;
- exact Modset fingerprint;
- conservative loaded Harmony Patch digest;
- exact Surface/operation semantic fingerprint;
- candidate policy/evidence digest;
- version, issue time, expiry, supersession and revocation metadata.

The Gateway publishes dynamic actions only when the exact current grant is
active. The action captures that grant binding, and execution re-reads the
environment and requires an exact match before entering the native commit.
An explained semantic completion promotes only that operation to
`session_auto_approved`. A validated rejection, failure, timeout or unknown
outcome quarantines it for the rest of the runtime epoch. A stale request
rejected before Gateway validation does not punish the operation.

The grant list is an issuance/revocation ledger. A superseded issuance may
remain `status=active` with `current=false`; only the unique current active
grant can authorize a scope. Historical grants may retain the identity under
which they were issued, while Re still requires every current/active grant and
every dynamic scope to match the present exact environment.

## Patch Evidence Boundary

The runtime Patch inventory uses Harmony's loaded patch metadata. Promotion is
eligible only when every observed owner is the known Gateway owner
`com.sts2mcp` and that owner is actually present. An empty inventory, missing
Gateway owner, unknown owner, unavailable metadata, identity change or
candidate-policy failure suppresses dynamic grants.

This inventory is conservative evidence, not proof of semantic compatibility:
it cannot prove the absence of native hooks, non-Harmony mutation, changed game
data semantics or hidden source ownership. Exact native legality and semantic
completion remain mandatory.

## Implemented Candidates

The current policy contains only reversible main-menu navigation:

- `main_menu/open_singleplayer`;
- `main_menu/continue_run`.

Both remain below the embedded canary ceiling. No combat, reward, shop, map,
selection or Inspection permission changed.

## Current Loaded Evidence

The exact loaded environment was:

```text
protocol  2.0-preview.63
SHA       d05b0580917c5b60acc908ec2575d2d0f8e59778da8c2379cebc0d5e72c90aa0
MVID      4836b3df-fffc-498a-b9c9-ac666adb5a5b
runtime   8aec74c19fed4a09984dc56a7e0c36ac
game      v0.109.0|c12f634d|-1639417500
Modset    2fd2cd789eb082ebfb91a3cd41c6a13869f359bc1d326fb752953c0bf9789d6f
exact policy
          bridge_v2_exact_environment_policy_2026_07_24
exact policy digest
          1a3f5107e833bb5d561a36bbc2756340392225380088430229d7ef2dcf659f8f
gray policy
          bridge_v2_gray_permission_candidates_2026_07_25
gray policy digest
          618cca62e60d69ad0dc6ab10bab93cb2dc004b54a602e3d2142b21ca34d161fd
Patch     clean_known_owners
Patch digest
          ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
Patch owners
          com.sts2mcp
```

An operator-directed Re production-path canary selected advertised action
`action_e005b9856dead3e0d1d4` for `main_menu/continue_run`. The command was
submitted once, completed with the saved-run activation witness, and settled
after eight polls / 1569 ms at a coherent `reward_flow/reward_claim`
successor. Gateway permission telemetry then showed:

```text
continue_run grant v1 session_canary      current=false
continue_run grant v2 session_auto_approved current=true
open_singleplayer grant v1 session_canary current=true
```

This proves the final installed artifact can execute and promote one bounded
operation. A preceding artifact completed the same loop under a different
runtime epoch, and the final cold start reset the grant to version 1 before the
repeat. It does not qualify `open_singleplayer` or prove quarantine through an
intentional live failure.

The final runtime's pre-canary capabilities and post-canary state were then
checked with the read-only repository assertion:

```text
assertion             session_canary_to_session_auto_approved
evidence role         recorded_operator_canary
surface/operation     main_menu/continue_run
identity comparison   exact match
before                grant v1 session_canary
after                 grant v2 session_auto_approved
supersession          exact
authorization effect  none
qualification effect  none
```

This closes the evidence-recording gap for the first permission loop. The
assertion neither submits an action nor writes permission state.

## Verification

The closeout validation set is:

```text
dotnet test STS2_MCP.sln
dotnet build STS2_MCP.csproj -c Release
npm --prefix Re-SpireAgent run typecheck
npm --prefix Re-SpireAgent test
npm --prefix Re-SpireAgent run build
python3 -m py_compile STS2MCP/mcp/server.py
npm run check:connector-adaptation
npm run check:connector-compatibility-fixtures
npm run check:connector-permission-fixtures
npm run audit:connector-permission-transition -- \
  --before <pre-canary-capabilities.json> \
  --after <post-canary-state.json> \
  --surface main_menu \
  --operation continue_run
npm run audit:connector-compatibility
npm run check:docs
```

Fixtures cover strict mode, ceiling enforcement, clean-Patch gating,
missing/unknown Patch-owner rejection, exact grant revalidation, promotion,
semantic-witness mismatch quarantine, other validated failure quarantine,
stale pre-validation rejection, expiration and candidate-policy validation.
Fixture success is not Organic evidence.

Final results were 135 passing Gateway tests, 175 passing Re tests, clean Re
typecheck/build, a Release build with zero warnings/errors, passing Python
syntax, documentation/inventory/adaptation checks, six passing compatibility
grader fixtures, and four passing permission-transition assertion fixtures.
The exact-assembly compatibility audit remained
`review_required_unregistered_callers` because Tutor is intentionally
unregistered; it produced no authorization or qualification effect.

## Rollback And Remaining Risk

Immediate rollback is either:

1. set `permission_mode` to `strict` and restart; or
2. restart the game, which destroys all session grants.

The embedded candidate can also be removed in a rebuilt artifact. There is no
persistent dynamic grant file to migrate or repair.

Remaining work before a broader permission claim:

- run a bounded failure/quarantine canary only when a naturally safe,
  interpretable failure is available; do not manufacture an unknown outcome;
- preserve the completed two-epoch repeat as bounded evidence rather than
  converting it into persistent qualification;
- decide product authentication and one-controller lease in Gate 3;
- require independent evidence and policy review before adding any
  non-navigation candidate.

The minimal D3 permission pilot is closed. General D3 evaluation/regression,
persistent qualification and product-safe permission management remain
incomplete.

No current repository rule makes automatic permission impossible in principle.
What remains prohibited is automatic authority without the reviewed ceiling,
exact runtime evidence, Gateway enforcement and semantic completion.
