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
