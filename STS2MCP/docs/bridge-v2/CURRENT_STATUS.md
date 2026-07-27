# Bridge v2 Current Status

This is the canonical current Gateway/Re boundary. Historical preview reports
retain only their recorded environment evidence.

## Source Truth

```text
Gateway/Re source    2.0-preview.68
Re normalized schema 27
game                 v0.109.1|c8c577f6|-820620422
game assembly SHA    2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f
game assembly MVID   208f08b8-d5f5-47f8-9e96-d3a4299ee709
last loaded protocol 2.0-preview.67
last loaded SHA      100ddf42c2114b30602a41c8908f63e154fc8f41a10ed37d4e2a1bded84fc74d
last loaded MVID     65bd744d-270b-4026-84c4-2ee397eee4e2
last runtime epoch   13f8d3d62d1644ec91a405a59dc4cd64
last Modset          exact_bridge_only
permission mode      migration_exploration
built Preview.68 SHA d33791395a33d6937a03e9853e865f35b631104f943ecf3abcf4027c32c2418f
installed SHA        d33791395a33d6937a03e9853e865f35b631104f943ecf3abcf4027c32c2418f
built/installed MVID 6c2e1933-462c-43ae-ad6f-edb60b1bf19c
```

Preview.68 passed Release build and closed-game installation. The rollback
snapshot is `STS2MCP/.local/deployments/2026-07-27T13-34-39-345Z`. A cold
restart must still establish exact loaded identity; Preview.67 packages do not
carry forward across the new MVID.

## Preview.67 Real-Run Evidence

The three inspected runtime runs contain 145 settled actions across combat,
event, map, reward, rest, selector, shop, game-over, and menu flows. They also
prove four distinct reliability facts:

1. eager state plus Inspection-bundle capture can cross a natural state
   transition and return `stale_state`;
2. execute-time stale action rejection works and recovers on a fresh tick;
3. `allow-run-entry` must not authorize a second game after terminal cleanup;
4. Kifuda commits shop purchase before its native pickup task awaits a
   source-specific deck-enchant child.

The runs are `unrecorded` provenance and therefore cannot satisfy persistent
qualification. See the repository
[Preview.68 audit](../../../docs/current/audits/PREVIEW_68_LONG_RUN_RELIABILITY_AND_NATIVE_CONTRACT_MIGRATION_2026-07-27.md).

## Preview.68 Changes

- Re retries the complete read-only coherent observation sequence only for a
  typed transient state-change race; mutation is never retried.
- A bounded run allows initial entry but stops after game-over cleanup returns
  to the top-level menu.
- CommandReceipt may report `continuation_handoff_observed` separately from a
  settled parent transaction.
- Kifuda handoff requires exact relic acquisition, exact Adroit selector
  parameters, native child ownership, and current source binding.
- Self-Help Book and Kifuda are separate deck-enchant source contracts;
  unknown sources publish no actions.
- Orb descriptions use native player-visible hover semantics rather than
  formatting SmartDescription without required variables.
- Runtime contract/source identity is emitted only as a non-authorizing
  shadow. Current operation permission remains authoritative until dual-read
  migration closes.
- `npm run agent:run` invokes the external Operator Shell for exact identity
  and trial preparation before the direct bounded Re loop.

## Architecture And Permission

The accepted target remains
[ADR-0002](../../../docs/current/decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md),
refined by
[ADR-0003](../../../docs/current/decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md).
Profiles, binding audits, fingerprints, fixtures, and migration tools remain
non-authorizing. The Gateway alone revalidates packages and publishes opaque
state-bound actions. Native STS2 owns Commit and side effects; unknown outcome
remains terminal.

## Non-Claims And Next Step

- Preview.68 has no loaded, canary, or Organic evidence yet.
- A handoff receipt is not transaction settlement.
- Kifuda source/tests are not an Organic Kifuda canary.
- The 82 fallback operation identities are inventory/test-confirm hypotheses,
  not semantic compatibility.
- Gate 1 closure is not complete-game or complete-visible-information closure.

Cold-start STS2 and run:

```bash
cd /Users/fire/Desktop/SpireAgent/Re-SpireAgent
npm run agent:run
```

The command must fail before DeepSeek if exact artifact identity, Modset,
observation, or Gateway-revalidated mutation readiness is absent.
