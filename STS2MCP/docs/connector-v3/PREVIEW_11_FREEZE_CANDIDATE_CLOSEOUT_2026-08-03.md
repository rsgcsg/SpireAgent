# Preview.11 Freeze-Candidate Closeout

Date: 2026-08-03

Verdict: **FREEZE CANDIDATE**

## Repository Baseline

- branch: `connectorV3`;
- start/end HEAD: `6f1825b82c760f3c9d318ca700217e9bc07618e9`;
- start worktree: clean;
- end worktree: dirty with the reviewed Preview.11 implementation and docs;
- push/release: not performed.

HEAD identifies the base commit, not the uncommitted source. The build
provenance records source digest and dirty status separately.

## Final Exact Runtime

- protocol: `3.0-preview.11`;
- source digest:
  `2c4a22891aa1ebb7d8cbc0c0a0baea833597dc0c50429d89dcfa7caef69786df`;
- Release/installed/loaded SHA:
  `73e5bd3e6474a23b4ffda2f773e94d79497b03f50b3f47e8872a99284add08b2`;
- Release/installed/loaded MVID:
  `b4551e49-20ed-42d7-96c4-189f02160d47`;
- runtime instance: `58e8a92ae6694765a84e3c5dfcddd8a9`;
- game: `v0.110.1`, commit `db5d3552`, branch `v0.110.1`;
- main/release assembly hash: `-959015736`;
- Modset: `exact_bridge_only`;
- Modset fingerprint:
  `bde79ca68b7902a07d12ea5217b11faebaab3977cec7c6073bddb720d8f3966d`;
- Patch status/digest: `clean_known_owners` /
  `7f696bad479c4b2ffd95ad2ca4d5113493de6ecdfa36a4a1d9ad2d0599fab05f`;
- permission policy digest:
  `66e1f7c8d0fd4477bb12f75c736dbf08a1e88c79cee00df2b13c447015ea3ed5`;
- qualification environment digest:
  `50433b16597b026a55ce51a8c571ca742aef6f8937730cd04696fefa741ab0e2`.

Build provenance timestamp is `2026-08-03T08:15:04.276Z`; install timestamp
is `2026-08-03T08:15:07.299Z`.

An earlier same-protocol artifact
`0b2e8658...3225e / 5064f296...36ac / 2e0810d6...d7a7e` was loaded before
the V3-native descriptor migration. Its observations and run remain historical
and are not evidence for the final MVID.

## Goal And Evidence Matrix

| Goal | Source | Test | Build/install/load | Final Live | Verdict |
|---|---|---|---|---|---|
| 94 explicit / 0 fallback | yes | clean-closure | loaded | capability scopes observed | closed |
| 0 Provider action publication | yes | closure/search | loaded | V3 candidate observed | closed |
| 0 active Re V2 sidecar | yes | import/schema tests | Re built | strict V3 inspect | closed |
| V3 control wire | yes | C#/Re tests | loaded | registration/lease/release | closed |
| exact permission/qualification wire | yes | strict decode | loaded | exact scopes/digests observed | closed |
| request/receipt lifecycle | yes | ledger tests | loaded | completed and stale receipts | bounded proof |
| rare selector/potion matrix | yes | contract tests | loaded | not reached | open |
| Inspection/linked detail | yes | current/stale tests | loaded | final reads not reached | open |
| compact Prompt v1 | yes | Prompt tests | Re built | payload reached provider boundary | source/runtime path proven |
| Human profile | yes | lifecycle tests | loaded | disabled refusal only | partial |
| rollback/revoke | yes | tooling tests | backup retained | final loaded rollback absent | open |
| ordinary Journey | yes | loop tests | loaded | provider failed before command | blocked |
| Organic qualification | machinery only | ledger fixtures | loaded | no reviewed Organic run | none |

## Architecture And Protocol Audit

### Closed

- Observation, interaction, candidate, authority, command, native Commit,
  Outcome, receipt and successor have one production owner.
- Connector V3 has a V3-native non-executing command descriptor. It no longer
  uses `BridgeActionDraft` or Provider `draft.Actions`.
- Luminous Choir event removal returns an empty predecessor action list; V3
  direct discovery is the only candidate source.
- V3 control routes emit `control-1`; Re's current control session imports no
  V2 wire type.
- Capabilities carry Patch, permission and qualification identities; Re
  records exact operation scopes in run metadata.
- Command/control/Human request readers enforce streaming body bounds instead
  of trusting `Content-Length`.
- Inspection and linked detail remain state-bound, read-only and
  non-authorizing.
- REST/MCP do not add commands, operands, legality or authority.

### Retained Internal Reuse

BridgeV2 namespaces and historically named Provider files remain for tested
entity identity, controller/ledger, permission/qualification machinery,
player-visible projection and exact game Commit/Outcome helpers. They are
internal libraries and rollback diagnostics. They are not current V2 wire,
action publication or an alternate executor.

Historical V2/hybrid Re files remain compiled as regression/rollback material
but are not exported by the public production entrypoint and are not imported
by the V3 adapter/client/control path. Global lexical zero is therefore not a
claim; production reachability zero is.

## Prompt Information Format

Production uses deterministic compact projection v1. It retains one
`actionAuthority`, compact current state, exact allowed actions and a bounded
information boundary. It removes duplicate `surface.legalActions`,
governance diagnostics/catalogs and exact duplicate Inspection pile facts.
Full normalized evidence is still recorded.

A read-only audit over 628 stored Prompts found:

- malformed: 0;
- full user Prompt median/p95/max: 12,071 / 28,937 / 38,004 bytes;
- projected median/p95/max: 6,945 / 16,305 / 23,248 bytes;
- median/p95/max savings: 4,231 / 14,051 / 18,338 bytes;
- duplicate action menus in 507 Prompts.

The provider shadow comparison attempted no Gateway command and failed at the
same external network boundary. No strategy-equivalence claim is made.

## Human-Equivalence Profile

`native_pages.v1` includes config, capability, CLI, REST contract, fixed
native adapters, exact state/runtime binding, pre/current/post owner evidence,
mutation suppression and explicit recovery. It is default-off and outside
normal Agent flow.

Final Live proved capability `enabled=false` and HTTP 409
`human_equivalence_disabled` for `open run_deck`. Enabled
open/read/return/recovery was not exercised and remains a freeze blocker.

## Live Commands And Receipts

### Exercised canary

`main_menu/open_singleplayer`:

- exact current state/interaction/menu-screen/control candidate;
- session-only trial authority;
- native Commit;
- `executed_and_settled`;
- two settlement polls, 399 ms;
- stable successor `singleplayer_menu`.

This is one operation canary, not Surface or sibling qualification.

### Stale refusal

Request `freeze-stale-a668798b-a353-4609-8e64-c2402894a177` reused the old
main-menu state/interaction/screen/control after the successor:

- HTTP 409;
- `status=not_executed`;
- `application=not_applied`;
- `reason_code=stale_state`;
- `retry.allowed=false`;
- polling the same request returned the same receipt;
- controller snapshot afterward had no owner.

### Bounded Agent startup

Run `run-20260803081731-dsy2vv` records the final protocol, SHA, MVID,
runtime, game, Modset, Patch and permission policy. Its only decision is
`not_executed_llm_failure` at `singleplayer_menu`; no command was submitted.
This is startup/identity evidence, not a Journey.

## Authority Matrix

- canary-permitted on the encountered runtime:
  `main_menu/open_singleplayer`,
  `singleplayer_menu/back_from_singleplayer_menu`,
  `singleplayer_menu/open_standard_run_setup`;
- canary-exercised: `main_menu/open_singleplayer`;
- scoped-qualified: none;
- durable-qualified: none;
- persistent authority: disabled;
- quarantined/unsupported: any unscoped, stale, unknown, ambiguous or
  incompatible operation/environment.

No canary was widened to a Surface, origin or sibling operation.

## Tests, Build, Install And Rollback

- Gateway: 278/278;
- Re: typecheck, 287/287 tests, production build;
- Python MCP syntax: pass;
- docs/links/current truth: pass before this final doc update and rerun below;
- CLI/run identity/compatibility/permission/qualification/profile/migration:
  pass;
- inventory/adaptation/clean closure: pass;
- Release: 0 warnings, 0 errors;
- coherent install: pass;
- cold-load identity: pass;
- rollback backup:
  `STS2MCP/.local/deployments/2026-08-03T08-15-06-115Z`.

An earlier disk rollback restored a coherent prior artifact and identity drift
was detected before reinstall. The final candidate has not been replaced,
cold-loaded from backup and restored again; loaded rollback remains a
non-claim.

## Non-Claims And Remaining Blockers

Not proven on the final artifact:

- targetless potion;
- combat-pile, deck-transform and Wood Carvings;
- generated choice and combat-hand reversible stages;
- current/stale Inspection and linked detail;
- known settling and unknown-owner runtime examples;
- enabled Human native-page lifecycle;
- loaded rollback and revoke;
- one ordinary Journey;
- Organic or durable qualification;
- arbitrary Mods, multiplayer or another game build.

The highest-risk remaining boundary is exact-artifact runtime breadth: source
and fixtures cover rare selectors, but no final-MVID Journey reached them.

## Next Smallest Verifiable Work

Restore provider network access, then run one bounded ordinary Journey on this
exact artifact. Stop at the first unreached selector/read family, capture its
current/stale lifecycle, and review that operation only. In a separate
operator window, enable and cold-load `native_pages.v1` for one
`run_deck` open/read/return/recovery cycle, then disable and cold-load again.
Do not create qualification until both evidence sets are reviewed.
