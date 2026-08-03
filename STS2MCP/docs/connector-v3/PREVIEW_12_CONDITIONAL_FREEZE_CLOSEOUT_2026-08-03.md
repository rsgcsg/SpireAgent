# Preview.12 Conditional-Freeze Closeout

Date: 2026-08-03  
Branch: `connectorV3`  
Starting HEAD: `ea18a3b89853689228d7e7f620d7c28a32c32d54`  
Protocol: `3.0-preview.12`  
Verdict: **conditional freeze; loaded and Live are pending**

## Scope

Preview.12 is a bounded correction after 44 exact Preview.11 runs and 309
decisions. It:

- aligns rest runtime completion evidence with its explicit authority
  contract;
- recognizes combat-hand confirm when the exact native control is consumed or
  its owner hands off, without accepting an unrelated state transition;
- makes source-unresolved known UI visible unsupported;
- removes Re's duplicate generated-choice source whitelist while preserving
  exact source-local operation and entity validation;
- releases Re controller/local locks idempotently on normal exit, SIGINT and
  SIGTERM;
- revises the operation catalog to
  `bridge_v2_native_action_contracts_v16`.

The evidence and architectural critique are in the
[freeze re-audit](../../../docs/current/audits/CONNECTOR_V3_FREEZE_READINESS_AND_ADAPTATION_REAUDIT_2026-08-03.md).

## Automated Evidence

- Gateway: 284/284 tests pass against the local v0.110.1 assemblies.
- Re: typecheck, 291/291 tests and production build pass.
- Generated-choice Quasar and source-local holdout tests pass.
- Runtime witness/catalog parity, visible-unsupported and combat-hand
  completion tests pass.
- Compatibility, permission, qualification, profile, migration, inventory,
  adaptation, CLI, Python MCP, docs and clean-closure checks pass.
- Release build completed with zero warnings and zero errors.

## Deployment Identity

The prior loaded Preview.11 identity is:

- SHA `5b2d5f6ff7eb3582af4d627ad88aac54d373d29b575f8e4752d9cfa273d831e4`;
- MVID `e47565ad-e792-49ea-a836-b834a6218ab8`;
- runtime `e64c64af13d44553b18148f26a2c8519`.

Preview.12 was built and installed after the game process exited:

- source revision `ea18a3b89853689228d7e7f620d7c28a32c32d54`;
- Gateway source digest
  `fc2eda72a828c46c47c74c24d0f93587d45e5ef2f583b137e8cce9ea8a16b734`;
- built SHA and installed SHA
  `18f07ca327bb8e6f58f227674ca82fbe7ba1a91fe41875e5dea6de406edd3eaa`;
- built MVID and installed MVID
  `50309e88-c6a0-4faf-b2ae-7092f91eda7d`;
- rollback snapshot
  `STS2MCP/.local/deployments/2026-08-03T12-07-43-930Z`.

The evidence boundary is:

```text
Preview.12 source = verified
Preview.12 tests = verified
Preview.12 built = verified
Preview.12 installed = verified
Preview.12 loaded = non-claim
Preview.12 Live = non-claim
Preview.12 qualification = empty/non-claim
```

## Required Cold-Load Evidence

1. source/built/installed/loaded Preview.12 SHA and MVID agree;
2. Quasar publishes and Re accepts exact `choose` commands;
3. rest heal/Smith no longer quarantines on witness mismatch;
4. combat-hand confirm yields a truthful completed or unknown receipt and is
   never retried;
5. an unknown deck-enchant source is typed unsupported, not malformed;
6. SIGINT followed by immediate restart does not wait for controller TTL;
7. no Preview.11 session grant is inherited.

Human native-page Live, loaded revoke/rollback, cross-version/Mod
requalification and durable qualification remain non-claims.

## Post-install Cold-load And Live Addendum

The installed identity above was later cold-loaded exactly:

```text
loaded SHA   18f07ca327bb8e6f58f227674ca82fbe7ba1a91fe41875e5dea6de406edd3eaa
loaded MVID  50309e88-c6a0-4faf-b2ae-7092f91eda7d
runtime      990ef9d80c3e46c988a184d94e05a0d3
game         v0.110.1 / db5d3552 / -205573697
```

Five retained exact-runtime runs include three completed-game boundaries and
two repeatable Royal Stamp deck-enchant failures. The completed runs total 242
decisions: 238 settled, one safe stale refusal and three completed boundaries.
Royal Stamp was visible under `migration_exploration` but had no candidates,
which proves a missing source contract rather than default-gray denial.

This addendum supersedes only this document's earlier `loaded = non-claim` and
`Live = non-claim` lines. It does not qualify Royal Stamp, Kifuda, Quasar,
combat-hand confirm, Human pages, rollback/revoke, cross-version/Mod behavior
or the later source-registry artifact. See the
[adaptation amendment](../../../docs/current/audits/CONNECTOR_V3_ADAPTABILITY_AMENDMENT_AND_LAYERED_FREEZE_VERDICT_2026-08-03.md).

## Authority Repair Addendum

The first runs after the source-registry commit used Re source
`5e57e47028b780619a9cd37b0cd13aeaebddaa2a` while the loaded Gateway was still
the earlier SHA `c9f61d76...e72b24` / MVID
`2b388d99-5a1b-46a7-9626-029a679deba0`. They stopped before native Commit with
`permission_or_contract_changed`; this is mixed-identity evidence for the
previous artifact, not Live evidence for the repair.

The corrected artifact is now built and installed at SHA
`1c0e2d82108a44105c45d63caee79a4000c271525b6cff481de748b6d0c20c97`, MVID
`fd3177e5-bc0c-4acd-8097-ea237957a152`, with rollback at
`STS2MCP/.local/deployments/2026-08-03T14-39-21-413Z`. It remains
`loaded = non-claim` until cold start.

## Authority Repair Live Addendum

The exact artifact above was cold-loaded and verified with
`npm run verify:loaded`: SHA, MVID and protocol matched, runtime was
`867402a815084c54b6d9eb0d9973aa80`, and the game was
`v0.110.1 / db5d3552 / -205573697` under `exact_bridge_only`. The bounded
Re run `run-20260803144301-4vnzxu` used `connector_v3` directly and completed
106 decisions. Of these, 103 commands reached `completed` receipts with
available successors and `retry.allowed=false`; two event observations were
non-actionable while settling, and the final menu observation stopped with
`completed_run_boundary` after game-over. No stale, unknown, unsupported or
provider failure occurred in this run.

This is exact-runtime Live session evidence for the authority repair and
normal journey boundary. It does not qualify Royal Stamp, Kifuda, Quasar,
combat-hand confirm, optional Human pages, loaded revoke/rollback, or any
cross-version/Mod behavior. The qualification store remains empty and
persistent authority remains disabled. The earlier `loaded = non-claim` text
above records the pre-cold-load state and is superseded only by this addendum.
